// Orbit (sensors, landing, story actions) and Surface (terrain vehicle,
// mining, lifeform capture, ruins) modes.
(function () {
  // ---------------------------------------------------------------- orbit
  const orbit = {};
  SF.modes.orbit = orbit;

  orbit.enter = function (opts) {
    orbit.sys = SF.galaxy.byId[opts.sysId];
    orbit.p = orbit.sys.planets[opts.slot];
    orbit.scanned = false;
    SF.advanceDays(SF.s, 0.2);
    SF.ui.log('Orbit established around ' + orbit.p.name + '.');
    buildMenu();
  };

  function landingFuel(p) {
    return Math.ceil(1 + p.gravity);
  }

  function buildMenu() {
    const s = SF.s;
    const p = orbit.p;
    const type = SF.data.PLANET_TYPES[p.type];
    const items = [{ key: 'S', label: 'Sensor scan', fn: scan }];
    if (p.special === 'starport') {
      items.push({ key: 'D', label: 'Dock at Starport Arth', fn: function () { SF.setMode('starport', {}); } });
    }
    if (type.landable) {
      items.push({
        key: 'L',
        label: 'Land (' + landingFuel(p) + ' fuel down, ' + landingFuel(p) + ' up)',
        fn: land,
      });
    }
    if (p.special === 'crystal' && s.flags.egg && !s.flags.won) {
      items.push({ key: 'E', label: '*** LAUNCH THE BLACK EGG ***', fn: launchEgg });
    }
    items.push({ key: 'B', label: 'Break orbit', fn: function () {
      SF.setMode('system', { sysId: orbit.sys.id, fromPlanetSlot: p.slot });
    } });
    SF.ui.setMenu('ORBIT — ' + p.name.toUpperCase(), items);
  }

  function scan() {
    const s = SF.s;
    const p = orbit.p;
    const sci = SF.skill(s, 'science');
    const type = SF.data.PLANET_TYPES[p.type];
    orbit.scanned = true;
    const density = ['negligible', 'low', 'moderate', 'HIGH'][p.rich];
    const bio = ['none detected', 'sparse', 'moderate', 'ABUNDANT'][p.bio];
    SF.ui.log('SCAN ' + p.name + ': class ' + type.name + ', gravity ' + p.gravity + 'g, climate ' + type.temp + '.');
    SF.ui.log('  Mineral density: ' + density + '. Biological activity: ' + bio + '.');
    if (orbit.sys.flare) SF.ui.log('  Stellar readings: ABNORMAL — this sun is destabilizing.', 'warn');
    if (p.ruins && sci >= 30) SF.ui.log('  ANOMALY: artificial structures on the surface. ANCIENT RUINS.', 'good');
    else if (p.ruins) SF.ui.log('  Faint surface anomaly — science skill too low to resolve it.', 'warn');
    if (p.special === 'crystal') {
      SF.ui.log('  The entire world is a lattice of resonating crystal. It is BROADCASTING into the sun.', 'bad');
      if (!s.flags.egg) SF.ui.log('  Nothing in your arsenal can scratch it. Something else is needed.', 'warn');
    }
  }

  function land() {
    const s = SF.s;
    const p = orbit.p;
    const cost = landingFuel(p);
    if (s.ship.fuel < cost * 2) {
      SF.ui.log('Not enough fuel to land AND lift off again. Aborting descent.', 'warn');
      return;
    }
    s.ship.fuel -= cost;
    SF.advanceDays(s, 0.5);
    SF.setMode('surface', { sysId: orbit.sys.id, slot: p.slot });
  }

  function launchEgg() {
    const s = SF.s;
    s.flags.won = true;
    SF.ui.log('The Black Egg falls toward the crystal world...', 'hdr');
    SF.ui.log('Light floods the system. The lattice shrieks across every channel — then silence.', 'hdr');
    SF.setMode('win', {});
  }

  orbit.update = function () {};

  orbit.draw = function (ctx) {
    const p = orbit.p;
    const type = SF.data.PLANET_TYPES[p.type];
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, 640, 400);
    const rng = SF.mulberry32(p.seed);
    ctx.fillStyle = '#283040';
    for (let i = 0; i < 60; i++) ctx.fillRect(SF.randInt(rng, 0, 639), SF.randInt(rng, 0, 399), 1, 1);
    // planet disc with banded shading
    const cx = 320, cy = 190, r = 110;
    for (let band = 3; band >= 0; band--) {
      ctx.fillStyle = type.colors[band];
      ctx.beginPath();
      ctx.arc(cx - band * 8, cy - band * 8, r - band * 14, 0, Math.PI * 2);
      ctx.fill();
    }
    // surface mottling
    for (let i = 0; i < 90; i++) {
      const ang = rng() * Math.PI * 2;
      const rr = rng() * (r - 12);
      ctx.fillStyle = type.colors[SF.randInt(rng, 0, 3)];
      ctx.fillRect(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, SF.randInt(rng, 3, 10), SF.randInt(rng, 2, 5));
    }
    ctx.fillStyle = '#a0b0c8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(p.name.toUpperCase() + ' — ' + type.name, 12, 22);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#607090';
    ctx.fillText('In orbit. ' + (orbit.scanned ? '' : 'Sensors ready.'), 12, 388);
  };

  // -------------------------------------------------------------- surface
  const surf = {};
  SF.modes.surface = surf;
  const TW = 64, TH = 38, TILE = 10;
  const T_LIQUID = 0, T_PLAIN = 1, T_HILL = 2, T_MOUNT = 3;

  // bilinear value noise from the planet's seed
  function genTerrain(p) {
    const rng = SF.mulberry32(p.seed);
    const GW = 9, GH = 7;
    const grid = [];
    for (let gy = 0; gy < GH; gy++) {
      grid.push([]);
      for (let gx = 0; gx < GW; gx++) grid[gy].push(rng());
    }
    const liquidFrac = { ocean: 0.5, jungle: 0.35, ice: 0.3, rock: 0.18, desert: 0.08, molten: 0.25 }[p.type] || 0.2;
    const tiles = [];
    for (let y = 0; y < TH; y++) {
      tiles.push([]);
      for (let x = 0; x < TW; x++) {
        const fx = x / TW * (GW - 1), fy = y / TH * (GH - 1);
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = fx - x0, ty = fy - y0;
        const v =
          grid[y0][x0] * (1 - tx) * (1 - ty) +
          grid[y0][Math.min(GW - 1, x0 + 1)] * tx * (1 - ty) +
          grid[Math.min(GH - 1, y0 + 1)][x0] * (1 - tx) * ty +
          grid[Math.min(GH - 1, y0 + 1)][Math.min(GW - 1, x0 + 1)] * tx * ty;
        let t;
        if (v < liquidFrac) t = T_LIQUID;
        else if (v < liquidFrac + 0.4) t = T_PLAIN;
        else if (v < liquidFrac + 0.62) t = T_HILL;
        else t = T_MOUNT;
        tiles[y].push(t);
      }
    }
    return tiles;
  }

  function findLandTile(rng, tiles) {
    for (let tries = 0; tries < 500; tries++) {
      const x = SF.randInt(rng, 2, TW - 3), y = SF.randInt(rng, 2, TH - 3);
      if (tiles[y][x] === T_PLAIN || tiles[y][x] === T_HILL) return { x: x, y: y };
    }
    return { x: 2, y: 2 };
  }

  function pickMineral(rng, rich) {
    const pool = SF.data.MINERALS.filter(m => m.id !== 'endurium');
    let total = 0;
    const weights = pool.map(function (m) {
      // rich worlds skew toward valuable ores
      const w = m.weight * (rich >= 2 ? (1 + m.price / 40) : 1);
      total += w;
      return w;
    });
    let roll = rng() * total;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return pool[i].id;
    }
    return 'iron';
  }

  surf.enter = function (opts) {
    const s = SF.s;
    surf.sys = SF.galaxy.byId[opts.sysId];
    surf.p = surf.sys.planets[opts.slot];
    surf.key = opts.sysId + ':' + opts.slot;
    surf.tiles = genTerrain(surf.p);
    const rng = SF.mulberry32(surf.p.seed + 99);

    surf.deposits = [];
    const count = 6 + surf.p.rich * 9;
    for (let i = 0; i < count; i++) {
      const pos = findLandTile(rng, surf.tiles);
      const id = (surf.p.rich >= 3 && SF.chance(rng, 0.08)) ? 'endurium' : pickMineral(rng, surf.p.rich);
      surf.deposits.push({ x: pos.x, y: pos.y, mineral: id, qty: SF.randInt(rng, 5, 30) });
    }
    surf.lifeforms = [];
    for (let i = 0; i < surf.p.bio * 3; i++) {
      const pos = findLandTile(rng, surf.tiles);
      surf.lifeforms.push({ x: pos.x + 0.5, y: pos.y + 0.5, t: rng() * 10 });
    }
    surf.ruin = surf.p.ruins ? findLandTile(rng, surf.tiles) : null;

    const start = findLandTile(SF.mulberry32(surf.p.seed + 7), surf.tiles);
    surf.tv = { x: start.x + 0.5, y: start.y + 0.5, integrity: 100 };
    surf.fullWarned = false;
    surf.hazardTimer = 0;

    SF.ui.setMenu('SURFACE — ' + surf.p.name.toUpperCase(), [
      { key: 'T', label: 'Take off (return to orbit)', fn: takeOff },
    ], { nav: false });
    SF.ui.log('Terrain vehicle deployed on ' + surf.p.name + '. Drive over deposits to mine them.');
    if (surf.ruin) SF.ui.log('Long-range optics pick out RUINS on this world. Find them.', 'good');
  };

  function takeOff() {
    const s = SF.s;
    const cost = Math.ceil(1 + surf.p.gravity);
    s.ship.fuel = Math.max(0, s.ship.fuel - cost);
    SF.advanceDays(s, 0.3);
    SF.ui.log('Lifting off from ' + surf.p.name + '.');
    SF.setMode('orbit', { sysId: surf.sys.id, slot: surf.p.slot });
  }

  function passable(x, y) {
    if (x < 0 || y < 0 || x >= TW || y >= TH) return false;
    const t = surf.tiles[Math.floor(y)][Math.floor(x)];
    if (t === T_MOUNT) return false;
    if (t === T_LIQUID && surf.p.type !== 'molten') return false;
    return true; // lava is passable but hurts
  }

  function damageTv(amount, why) {
    surf.tv.integrity -= amount;
    SF.ui.log(why + ' TV integrity ' + Math.max(0, Math.floor(surf.tv.integrity)) + '%.', 'bad');
    if (surf.tv.integrity <= 0) {
      SF.ui.log('TV DESTROYED. Emergency beam-up — the crew is battered.', 'bad');
      for (const role of SF.data.ROLES) {
        const m = SF.s.crew[role];
        if (m) m.vitality = Math.max(5, m.vitality - 30);
      }
      takeOff();
    }
  }

  surf.update = function (dt) {
    const s = SF.s;
    const k = SF.keys;
    let dx = 0, dy = 0;
    if (k.ArrowLeft || k.a) dx -= 1;
    if (k.ArrowRight || k.d) dx += 1;
    if (k.ArrowUp || k.w) dy -= 1;
    if (k.ArrowDown || k.s) dy += 1;
    const speed = 8 * dt;
    if (dx && passable(surf.tv.x + dx * speed, surf.tv.y)) surf.tv.x += dx * speed;
    if (dy && passable(surf.tv.x, surf.tv.y + dy * speed)) surf.tv.y += dy * speed;
    s.day += dt * 0.01;

    const tx = Math.floor(surf.tv.x), ty = Math.floor(surf.tv.y);

    // environmental hazards
    surf.hazardTimer += dt;
    if (surf.hazardTimer > 1) {
      surf.hazardTimer = 0;
      if (surf.tiles[ty][tx] === T_LIQUID && surf.p.type === 'molten') damageTv(15, 'LAVA FLOW!');
      else if (surf.p.type === 'molten' && Math.random() < 0.12) damageTv(4, 'Searing heat.');
      else if (surf.p.type === 'ice' && Math.random() < 0.08) damageTv(3, 'Flash blizzard.');
    }

    // mine deposits on contact
    for (let i = surf.deposits.length - 1; i >= 0; i--) {
      const d = surf.deposits[i];
      if (Math.abs(d.x + 0.5 - surf.tv.x) < 0.7 && Math.abs(d.y + 0.5 - surf.tv.y) < 0.7) {
        const added = SF.addCargo(s, d.mineral, d.qty);
        if (added > 0) {
          SF.ui.log('Mined ' + added + 'cu ' + SF.data.MINERAL_BY_ID[d.mineral].name + '.', 'good');
          surf.deposits.splice(i, 1);
          SF.ui.setStatus();
        } else if (!surf.fullWarned) {
          surf.fullWarned = true;
          SF.ui.log('Cargo hold FULL. Sell at Starport or fit more pods.', 'warn');
        }
      }
    }
    // lifeforms wander; drive into one to capture it
    for (let i = surf.lifeforms.length - 1; i >= 0; i--) {
      const lf = surf.lifeforms[i];
      lf.t += dt;
      const nx = lf.x + Math.cos(lf.t * 1.3) * dt * 2;
      const ny = lf.y + Math.sin(lf.t * 0.9) * dt * 2;
      if (passable(nx, ny)) { lf.x = nx; lf.y = ny; }
      if (Math.abs(lf.x - surf.tv.x) < 0.6 && Math.abs(lf.y - surf.tv.y) < 0.6) {
        surf.lifeforms.splice(i, 1);
        s.ship.lifeforms += 1;
        SF.ui.log('Lifeform stunned and crated. (' + s.ship.lifeforms + ' aboard)', 'good');
      }
    }
    // ruins
    if (surf.ruin && Math.abs(surf.ruin.x + 0.5 - surf.tv.x) < 0.8 && Math.abs(surf.ruin.y + 0.5 - surf.tv.y) < 0.8) {
      visitRuins();
    }
  };

  function visitRuins() {
    const s = SF.s;
    surf.ruin = null; // one visit per landing
    s.flags.looted = s.flags.looted || {};
    if (surf.p.special === 'egg' && !s.flags.egg) {
      s.flags.egg = true;
      SF.ui.log('Deep in the ruins a vault opens. Inside: a sphere of utter darkness — THE BLACK EGG.', 'hdr');
      SF.ui.log('It hums in your hold like a held breath. Take it to the crystal world.', 'hdr');
    } else if (!s.flags.tablet) {
      s.flags.tablet = true;
      s.flags.eggCoords = true;
      SF.ui.log('Among the ruins you pry loose an ANCIENT TABLET etched with star-script.', 'hdr');
      SF.ui.log('Tablet: "The makers sleep at the heart. The egg of night alone undoes them."', 'hdr');
      SF.ui.log('Tablet: "The egg waits on the fourth world of the yellow star at 199,33."', 'hdr');
      SF.ui.log('(Return to Starport Operations for full analysis.)');
    } else if (!s.flags.looted[surf.key]) {
      s.flags.looted[surf.key] = true;
      const loot = 200 + Math.floor(Math.random() * 600);
      SF.earn(s, loot);
      SF.ui.log('You salvage Ancient alloys from the ruins: +' + SF.ui.fmt(loot) + ' cr.', 'good');
    } else {
      SF.ui.log('These ruins have already given up their secrets.');
    }
    SF.ui.setStatus();
  }

  surf.draw = function (ctx) {
    const type = SF.data.PLANET_TYPES[surf.p.type];
    for (let y = 0; y < TH; y++) {
      for (let x = 0; x < TW; x++) {
        ctx.fillStyle = type.colors[surf.tiles[y][x]];
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    for (const d of surf.deposits) {
      ctx.fillStyle = SF.data.MINERAL_BY_ID[d.mineral].color;
      ctx.beginPath();
      ctx.moveTo(d.x * TILE + 5, d.y * TILE);
      ctx.lineTo(d.x * TILE + 10, d.y * TILE + 5);
      ctx.lineTo(d.x * TILE + 5, d.y * TILE + 10);
      ctx.lineTo(d.x * TILE, d.y * TILE + 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.stroke();
    }
    for (const lf of surf.lifeforms) {
      ctx.fillStyle = '#40ff80';
      ctx.beginPath();
      ctx.arc(lf.x * TILE, lf.y * TILE, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (surf.ruin) {
      const rx = surf.ruin.x * TILE, ry = surf.ruin.y * TILE;
      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(rx - 4, ry - 2, 18, 12);
      ctx.fillStyle = '#202030';
      ctx.fillRect(rx + 2, ry + 2, 5, 8);
      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(rx + 1, ry - 8, 3, 7);
      ctx.fillRect(rx + 8, ry - 8, 3, 7);
    }
    // terrain vehicle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(surf.tv.x * TILE - 4, surf.tv.y * TILE - 3, 8, 6);
    ctx.fillStyle = '#3060c0';
    ctx.fillRect(surf.tv.x * TILE - 2, surf.tv.y * TILE - 2, 4, 2);

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 382, 640, 18);
    ctx.fillStyle = '#9ab0c8';
    ctx.font = '12px monospace';
    ctx.fillText('TV ' + Math.max(0, Math.floor(surf.tv.integrity)) + '%   deposits left: ' +
      surf.deposits.length + '   [T] take off', 8, 395);
  };
})();
