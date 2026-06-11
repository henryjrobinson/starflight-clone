// Headless smoke test. Stubs out just enough DOM/canvas to boot the game,
// then plays through the entire story: outfit, fly, land, mine, find the
// tablet, get the egg, learn the coordinates, fight the Uhlek, win.
// Run: node test/smoke.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ------------------------------------------------------------- DOM stubs
// "magic" object: any method call returns another magic object, so chains
// like createRadialGradient(...).addColorStop(...) are safe no-ops.
const magic = new Proxy(function () {}, {
  get(t, k) {
    if (k === 'width') return 0;
    return function () { return magic; };
  },
  set() { return true; },
  apply() { return magic; },
});
const ctx2d = new Proxy({}, {
  get(t, k) {
    if (k in t) return t[k];
    return function () { return magic; };
  },
  set(t, k, v) { t[k] = v; return true; },
});

function makeEl() {
  const el = {
    style: {}, children: [], className: '', textContent: '', value: '',
    scrollTop: 0, scrollHeight: 0, onclick: null,
    appendChild(c) { el.children.push(c); return c; },
    removeChild(c) { el.children.splice(el.children.indexOf(c), 1); },
    addEventListener() {},
    getContext() { return ctx2d; },
  };
  return el;
}

const elements = {};
const storage = {};
const listeners = {};

const sandbox = {
  console: console,
  Math: Math,
  JSON: JSON,
  document: {
    getElementById(id) { return elements[id] || (elements[id] = makeEl()); },
    createElement() { return makeEl(); },
    addEventListener() {},
  },
  localStorage: {
    getItem(k) { return k in storage ? storage[k] : null; },
    setItem(k, v) { storage[k] = String(v); },
    removeItem(k) { delete storage[k]; },
  },
  requestAnimationFrame() {},
  addEventListener(type, fn) { listeners[type] = fn; },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const files = ['rng.js', 'gfx.js', 'data.js', 'galaxy.js', 'state.js', 'ui.js',
  'starport.js', 'space.js', 'starmap.js', 'planet.js', 'encounter.js', 'main.js'];
for (const f of files) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  vm.runInContext(src, sandbox, { filename: f });
}
const SF = sandbox.SF;

// --------------------------------------------------------------- helpers
let failures = 0;
function check(name, cond) {
  if (cond) { console.log('  ok  ' + name); }
  else { failures++; console.error('FAIL  ' + name); }
}
function menuLabels() { return SF.ui.menu.items.map(i => i.label); }
function clickMenu(substr) {
  const item = SF.ui.menu.items.find(i => i.label.toLowerCase().includes(substr.toLowerCase()) && !i.disabled);
  if (!item) throw new Error('menu item not found: "' + substr + '" in [' + menuLabels().join(' | ') + ']');
  item.fn();
}
function holdKey(key, seconds) {
  SF.keys[key] = true;
  const steps = Math.ceil(seconds / 0.05);
  for (let i = 0; i < steps; i++) {
    SF.tick(0.05);
    if (SF.modeName === 'encounter') break; // caller decides what to do
  }
  SF.keys[key] = false;
}
function resolveEncounterPeacefully() {
  // flee or break contact until we're back in space
  let guard = 0;
  while (SF.modeName === 'encounter' && guard++ < 60) {
    const breakItem = SF.ui.menu.items.find(i => i.label.includes('Break contact'));
    if (breakItem) { breakItem.fn(); break; }
    clickMenu('Attempt escape');
  }
  if (SF.modeName === 'encounter') throw new Error('could not leave encounter');
}
function flyHyperTo(tx, ty, label, targetSysId) {
  let guard = 0;
  while (guard++ < 3000) {
    if (SF.modeName === 'encounter') { resolveEncounterPeacefully(); continue; }
    if (SF.modeName === 'system') {
      if (!targetSysId || SF.modes.system.sys.id === targetSysId) break;
      // strayed into a system on the flight path — fly radially outward
      // (never through the star at the origin)
      flySystemTo(function () {
        const sm = SF.modes.system;
        const mag = Math.hypot(sm.sx, sm.sy) || 1;
        return { x: (sm.sx / mag) * 300 || 300, y: (sm.sy / mag) * 300 };
      }, () => SF.modeName !== 'system', 'exit stray system');
      continue;
    }
    const s = SF.s;
    if (Math.hypot(s.hx - tx, s.hy - ty) < 1.5) {
      if (!targetSysId) break;
      // on top of the system but the entry cooldown is still running —
      // keep wiggling (entry only checks while moving) until it fires
      SF.keys.ArrowRight = guard % 2 === 0;
      SF.keys.ArrowLeft = guard % 2 === 1;
      SF.keys.ArrowUp = SF.keys.ArrowDown = false;
      SF.tick(0.05);
      continue;
    }
    SF.s.ship.fuel = Math.max(SF.s.ship.fuel, 30); // smoke test refuels magically
    const dx = tx - s.hx, dy = ty - s.hy;
    SF.keys.ArrowRight = dx > 1; SF.keys.ArrowLeft = dx < -1;
    SF.keys.ArrowDown = dy > 1; SF.keys.ArrowUp = dy < -1;
    SF.tick(0.05);
  }
  SF.keys.ArrowRight = SF.keys.ArrowLeft = SF.keys.ArrowDown = SF.keys.ArrowUp = false;
  if (guard >= 3000) throw new Error('hyper flight to ' + label + ' did not converge (mode=' + SF.modeName + ')');
}
function segDistToOrigin(ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = -(ax * dx + ay * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(ax + t * dx, ay + t * dy);
}
function flySystemTo(getTarget, doneWhen, label) {
  let guard = 0;
  while (!doneWhen() && guard++ < 3000) {
    if (SF.modeName === 'encounter') { resolveEncounterPeacefully(); continue; }
    if (SF.modeName !== 'system') break;
    SF.s.ship.hull = SF.s.ship.hullMax; // autopilot isn't a balance test
    const sm = SF.modes.system;
    let t = getTarget();
    // steer wide of the star: if the direct line grazes the scorch zone,
    // route via a perpendicular waypoint instead
    const distToTarget = Math.hypot(t.x - sm.sx, t.y - sm.sy);
    if (distToTarget > 25 && segDistToOrigin(sm.sx, sm.sy, t.x, t.y) < 14) {
      const side = (sm.sx * t.y - sm.sy * t.x) >= 0 ? 1 : -1;
      const ang = Math.atan2(sm.sy, sm.sx) + side * 1.2;
      t = { x: Math.cos(ang) * 35, y: Math.sin(ang) * 35 };
    }
    const dx = t.x - sm.sx, dy = t.y - sm.sy;
    SF.keys.ArrowRight = dx > 0.5; SF.keys.ArrowLeft = dx < -0.5;
    SF.keys.ArrowDown = dy > 0.5; SF.keys.ArrowUp = dy < -0.5;
    // never park: orbit entry only triggers while the ship is moving
    if (!SF.keys.ArrowRight && !SF.keys.ArrowLeft && !SF.keys.ArrowUp && !SF.keys.ArrowDown) {
      SF.keys[guard % 2 ? 'ArrowRight' : 'ArrowLeft'] = true;
    }
    SF.tick(0.05);
  }
  SF.keys.ArrowRight = SF.keys.ArrowLeft = SF.keys.ArrowDown = SF.keys.ArrowUp = false;
  if (!doneWhen()) throw new Error('system flight failed: ' + label + ' (mode=' + SF.modeName + ')');
}
function planetPos(p) { return { x: Math.cos(p.angle) * p.orbit, y: Math.sin(p.angle) * p.orbit }; }
function orbitPlanet(slot, label) {
  const sys = SF.modes.system.sys;
  flySystemTo(
    () => planetPos(sys.planets[slot]),
    () => SF.modeName === 'orbit' && SF.modes.orbit.p.slot === slot,
    label
  );
}
function driveTo(getTarget, doneWhen, label) {
  let guard = 0;
  while (!doneWhen() && guard++ < 2000) {
    if (SF.modeName !== 'surface') break;
    const tv = SF.modes.surface.tv;
    SF.modes.surface.tv.integrity = 100; // smoke test ignores hazards
    const t = getTarget();
    if (!t) break;
    // teleport-ish drive: nudge directly (pathfinding isn't under test)
    tv.x += Math.sign(t.x - tv.x) * 0.3;
    tv.y += Math.sign(t.y - tv.y) * 0.3;
    SF.tick(0.05);
  }
  if (!doneWhen()) throw new Error('surface drive failed: ' + label);
}

// ------------------------------------------------------------------ tests
console.log('== boot & galaxy ==');
SF.boot();
check('booted to title', SF.modeName === 'title');
check('46 systems generated', SF.galaxy.systems.length === 46);
check('Arth at 125,100', SF.galaxy.byId.arth && SF.galaxy.byId.arth.x === 125 && SF.galaxy.byId.arth.y === 100);
check('Heart (crystal) at 42,178', SF.galaxy.byId.heart && SF.galaxy.byId.heart.planets[0].special === 'crystal');
check('Ossix IV holds the egg', SF.galaxy.byId.ossix && SF.galaxy.byId.ossix.planets[3].special === 'egg');
check('ruins exist beyond scripted ones', SF.galaxy.systems.some(s => s.planets.some(p => p.ruins && !p.special)));
check('all systems in bounds', SF.galaxy.systems.every(s => s.x >= 0 && s.x <= 250 && s.y >= 0 && s.y <= 200));

console.log('== starport: economy, training, outfitting ==');
clickMenu('New Game');
check('docked at starport', SF.modeName === 'starport');
const s = SF.s;
s.credits = 200000; // fund the full sweep
clickMenu('Personnel');
clickMenu('SCIENCE');
const sciBefore = s.crew.science.skills.science;
clickMenu('Train science');
check('training raises science +5', s.crew.science.skills.science === sciBefore + 5);
for (let i = 0; i < 20; i++) clickMenu('Train science'); // hit the cap
check('training respects racial cap', s.crew.science.skills.science <= 80);
clickMenu('Back'); // to personnel
clickMenu('COMMUNICATIONS');
for (let i = 0; i < 10; i++) clickMenu('Train communications');
check('comms trained to 40+', s.crew.communications.skills.communications >= 40);
clickMenu('Back');
clickMenu('Back'); // root
clickMenu('Ship Configuration');
clickMenu('Laser Cannon class 1');
check('laser upgraded to 2', s.ship.laser === 2);
clickMenu('Engines class 1');
check('engine upgraded to 2', s.ship.engine === 2);
clickMenu('Add cargo pod');
check('pod raises capacity to 500', SF.cargoMax(s) === 500);
clickMenu('Back');
clickMenu('Trade Depot');
clickMenu('Buy fuel');
check('tank filled', s.ship.fuel >= SF.fuelMax(s) - 1);
// market: sell a mineral
SF.addCargo(s, 'gold', 50);
clickMenu('Back'); clickMenu('Trade Depot');
const creditsBefore = s.credits;
clickMenu('Sell 50cu Gold');
check('gold sale pays 2000 cr', s.credits === creditsBefore + 2000);
clickMenu('Back');

console.log('== launch, system flight, hyperspace ==');
clickMenu('Launch Ship');
check('in arth system after launch', SF.modeName === 'system' && SF.modes.system.sys.id === 'arth');
// fly out to hyperspace
flySystemTo(() => ({ x: 0, y: -300 }), () => SF.modeName === 'hyper', 'leave arth system');
check('reached hyperspace', SF.modeName === 'hyper');
const fuelBefore = s.ship.fuel;
holdKey('ArrowRight', 1);
if (SF.modeName === 'encounter') resolveEncounterPeacefully();
check('hyper travel burns fuel', s.ship.fuel < fuelBefore);

console.log('== continuum fluxes ==');
check('7 flux pairs generated', SF.galaxy.fluxes.length === 7);
check('flux endpoints in bounds and worth taking (>=70 apart)', SF.galaxy.fluxes.every(f =>
  f.ax >= 0 && f.ax <= 250 && f.ay >= 0 && f.ay <= 200 &&
  f.bx >= 0 && f.bx <= 250 && f.by >= 0 && f.by <= 200 &&
  Math.hypot(f.ax - f.bx, f.ay - f.by) >= 70));
{
  const f0 = SF.galaxy.fluxes[0];
  const fuelAtFlux = (function () {
    SF.modes.hyper.cooldown = 0;
    s.hx = f0.ax - 1.0; s.hy = f0.ay;
    const fuel = s.ship.fuel;
    SF.keys.ArrowRight = true;
    for (let i = 0; i < 10 && Math.hypot(s.hx - f0.bx, s.hy - f0.by) > 5; i++) SF.tick(0.05);
    SF.keys.ArrowRight = false;
    return fuel;
  })();
  check('flux transit teleports to partner end', Math.hypot(s.hx - f0.bx, s.hy - f0.by) < 5);
  check('flux discovered and charted', s.fluxes && s.fluxes[0] === true);
  check('flux transit is nearly free', fuelAtFlux - s.ship.fuel < 0.2);
}

console.log('== starmap ==');
clickMenu('Galaxy starmap');
check('starmap opens from hyperspace', SF.modeName === 'starmap');
SF.tick(0.05); // exercise the draw path
clickMenu('Close starmap');
check('starmap returns to hyperspace', SF.modeName === 'hyper');

console.log('== mouse autopilot ==');
SF.modes.hyper.click(SF.VW / 2 + 130, SF.VH / 2);
check('viewport click lays in a course', !!s.course);
{
  const startX = s.hx;
  for (let i = 0; i < 50 && s.course; i++) {
    if (SF.modeName === 'encounter') { resolveEncounterPeacefully(); continue; }
    if (SF.modeName !== 'hyper') break;
    SF.tick(0.05);
  }
  check('autopilot flies the course', s.hx !== startX || !s.course);
}
s.course = null;
SF.setMode('starmap', { back: { mode: 'hyper' } });
SF.modes.starmap.click(150 + 100 * 2.7, 16 + 100 * 2.7); // world ~100,100
check('starmap click lays in a course', !!s.course && Math.abs(s.course.x - 100) < 6);
clickMenu('Clear course');
check('clear course works', !s.course);
clickMenu('Close starmap');

console.log('== find ruins, get the tablet ==');
let ruinTarget = null;
for (const sys of SF.galaxy.systems) {
  for (const p of sys.planets) {
    if (p.ruins && !p.special) { ruinTarget = { sys, p }; break; }
  }
  if (ruinTarget) break;
}
check('found a ruins world to visit: ' + ruinTarget.p.name, !!ruinTarget);
flyHyperTo(ruinTarget.sys.x, ruinTarget.sys.y, ruinTarget.sys.name, ruinTarget.sys.id);
check('entered ' + ruinTarget.sys.name, SF.modeName === 'system' && SF.modes.system.sys.id === ruinTarget.sys.id);
orbitPlanet(ruinTarget.p.slot, 'orbit ruins world');
clickMenu('Sensor scan');
clickMenu('Land');
check('landed on ruins world', SF.modeName === 'surface');
driveTo(() => SF.modes.surface.ruin && { x: SF.modes.surface.ruin.x + 0.5, y: SF.modes.surface.ruin.y + 0.5 },
  () => s.flags.tablet, 'reach ruins');
check('tablet recovered, egg coords known', s.flags.tablet && s.flags.eggCoords);

console.log('== artifacts ==');
{
  // ownership (US-001): grantArtifact is exactly what a non-story ruin calls.
  // Use a throwaway state so the live playthrough's combat isn't buffed.
  const as = SF.newState();
  const a1 = SF.grantArtifact(as);
  check('ruin grant returns an artifact and marks it owned', !!a1 && SF.hasArtifact(as, a1.id));
  const seen = new Set([a1.id]);
  let dup = false;
  for (let i = 0; i < SF.data.ARTIFACTS.length + 2; i++) {
    const a = SF.grantArtifact(as);
    if (a) { if (seen.has(a.id)) dup = true; seen.add(a.id); }
  }
  check('each artifact granted at most once', !dup);
  check('grants return null once all are owned', SF.grantArtifact(as) === null);

  // effects (US-002): each artifact measurably changes its computation
  const clean = SF.newState();
  const coil = SF.newState(); coil.artifacts = { fuel_coil: true };
  check('fuel_coil lowers hyperspace fuel burn', SF.fuelPerDist(coil) < SF.fuelPerDist(clean));
  check('shield_booster cuts damage taken (mul<1)', SF.artifactMul({ artifacts: { shield_booster: true } }, 'damageMul') < 1);
  check('targeting_array raises hit chance (bonus>0)', SF.artifactBonus({ artifacts: { targeting_array: true } }, 'hitBonus') > 0);
  check('no artifacts is neutral', SF.artifactMul({ artifacts: {} }, 'damageMul') === 1 &&
    SF.artifactBonus({ artifacts: {} }, 'hitBonus') === 0);
}

console.log('== mining ==');
const surfMode = SF.modes.surface;
const cargoBefore = SF.cargoUsed(s);
if (surfMode.deposits.length) {
  driveTo(() => surfMode.deposits[0] && { x: surfMode.deposits[0].x + 0.5, y: surfMode.deposits[0].y + 0.5 },
    () => SF.cargoUsed(s) > cargoBefore, 'mine a deposit');
}
check('mining adds cargo', SF.cargoUsed(s) > cargoBefore);
clickMenu('Take off');
check('back in orbit', SF.modeName === 'orbit');
clickMenu('Break orbit');
check('back in system', SF.modeName === 'system');

console.log('== get the black egg at Ossix IV (199,33) ==');
flySystemTo(() => ({ x: 0, y: -300 }), () => SF.modeName === 'hyper', 'leave ruins system');
flyHyperTo(199, 33, 'Ossix', 'ossix');
check('entered Ossix', SF.modeName === 'system' && SF.modes.system.sys.id === 'ossix');
orbitPlanet(3, 'orbit Ossix IV');
clickMenu('Land');
driveTo(() => SF.modes.surface.ruin && { x: SF.modes.surface.ruin.x + 0.5, y: SF.modes.surface.ruin.y + 0.5 },
  () => s.flags.egg, 'reach egg vault');
check('BLACK EGG aboard', s.flags.egg);
clickMenu('Take off');
clickMenu('Break orbit');

console.log('== dialogue: spemin grovel gives crystal coords ==');
check('crystal coords not yet known', !s.flags.crystalCoords);
SF.setMode('encounter', { raceId: 'spemin', from: 'hyper' });
clickMenu('Hail');
clickMenu('Obsequious');
clickMenu('Ask about the Ancients');
check('spemin grovel reveals 42,178', s.flags.crystalCoords === true);
clickMenu('Close channel');
clickMenu('Break contact');
check('back in hyper after comms', SF.modeName === 'hyper');

console.log('== combat: pick a fight with a renegade ==');
s.ship.hull = s.ship.hullMax;
SF.setMode('encounter', { raceId: 'renegade', from: 'hyper' });
let rounds = 0;
while (SF.modeName === 'encounter' && rounds++ < 80) {
  if (SF.s.ship.hull < 15) SF.s.ship.hull = SF.s.ship.hullMax; // test rig, not balance
  const enc = SF.ui.menu.items;
  const laser = enc.find(i => i.label.startsWith('Fire laser') && !i.disabled);
  const close = enc.find(i => i.label === 'Close distance');
  const inRange = SF.ui.menu.title.includes('range') ?
    parseInt(SF.ui.menu.title.match(/range (\d+)/)[1], 10) <= 60 : false;
  if (SF.ui.menu.title.startsWith('ENCOUNTER') && inRange && laser) laser.fn();
  else if (SF.ui.menu.title.startsWith('ENCOUNTER') && close) close.fn();
  else break;
}
check('combat resolved (enemy died, fled, or surrendered)', SF.modeName !== 'encounter');
check('kills or surrender salvage recorded', s.kills > 0 || s.earnings > 2000);

console.log('== endgame: heart system, uhlek ambush, launch the egg ==');
flyHyperTo(42, 178, 'Heart', 'heart');
check('entered Heart', SF.modeName === 'system' && SF.modes.system.sys.id === 'heart');
// the ambush fires on the first update tick
SF.tick(2.1);
check('uhlek ambush triggered', SF.modeName === 'encounter');
// cheese the fight for the test: obliterate them
SF.modes.encounter.enemy.hull = 1;
s.ship.hull = s.ship.hullMax; s.ship.laser = 5;
let guard = 0;
while (SF.modeName === 'encounter' && guard++ < 40) {
  s.ship.hull = s.ship.hullMax;
  const laser = SF.ui.menu.items.find(i => i.label.startsWith('Fire laser') && !i.disabled);
  const close = SF.ui.menu.items.find(i => i.label === 'Close distance');
  const range = parseInt((SF.ui.menu.title.match(/range (\d+)/) || [0, 999])[1], 10);
  if (range <= 60 && laser) laser.fn(); else if (close) close.fn(); else break;
}
check('uhlek destroyed', SF.modeName === 'system');
orbitPlanet(0, 'orbit crystal world');
clickMenu('Sensor scan');
check('egg launch option present', SF.ui.menu.items.some(i => i.label.includes('BLACK EGG')));
clickMenu('LAUNCH THE BLACK EGG');
check('victory!', SF.modeName === 'win' && s.flags.won);

console.log('== save / load round trip ==');
const savedDay = s.day;
check('save written', SF.saveGame());
SF.s = null;
check('load restores state', SF.loadGame() && SF.s.day === savedDay && SF.s.flags.won);

console.log('');
if (failures) {
  console.error(failures + ' CHECK(S) FAILED');
  process.exit(1);
}
console.log('ALL SMOKE CHECKS PASSED');
