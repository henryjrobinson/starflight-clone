// Space flight: 'hyper' (galaxy grid, burns fuel) and 'system' (local
// star system, leads to orbit). Arrow keys / WASD steer. M toggles the
// galaxy map in hyperspace.
(function () {
  // Which race's space are we in? Used for encounter rolls and comm flavor.
  SF.territoryRace = function (hx, hy) {
    for (const id of Object.keys(SF.data.RACES)) {
      const t = SF.data.RACES[id].territory;
      if (Math.hypot(hx - t.x, hy - t.y) <= t.r) return id;
    }
    return 'renegade';
  };

  function moveVector() {
    const k = SF.keys;
    let dx = 0, dy = 0;
    if (k.ArrowLeft || k.a) dx -= 1;
    if (k.ArrowRight || k.d) dx += 1;
    if (k.ArrowUp || k.w) dy -= 1;
    if (k.ArrowDown || k.s) dy += 1;
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    return { dx: dx, dy: dy };
  }

  function drawShip(ctx, x, y, dir, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dir);
    ctx.fillStyle = color || '#e0e0ff';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, 5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, -5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function rollEncounter(perSecond, dt) {
    return Math.random() < perSecond * dt;
  }

  function outOfFuel(s) {
    if (s.ship.fuel > 0) return false;
    if ((s.ship.cargo.endurium || 0) > 0) {
      s.ship.cargo.endurium -= 1;
      if (!s.ship.cargo.endurium) delete s.ship.cargo.endurium;
      s.ship.fuel = Math.min(SF.fuelMax(s), 10);
      SF.ui.log('Tanks dry — engineering converts 1cu of raw Endurium into 10 fuel.', 'warn');
      return false;
    }
    const fee = Math.floor(s.credits * 0.25);
    s.credits -= fee;
    s.ship.fuel = 10;
    s.hx = 125; s.hy = 100;
    SF.ui.log('STRANDED. An Interstel tug hauls you back to Arth. Salvage fee: ' + SF.ui.fmt(fee) + ' cr.', 'bad');
    SF.setMode('system', { sysId: 'arth', fromHyper: true });
    return true;
  }

  // ---------------------------------------------------------------- hyper
  const hyper = {};
  SF.modes.hyper = hyper;

  hyper.enter = function () {
    hyper.dir = 0;
    hyper.cooldown = 1.5;  // don't instantly re-enter the system we just left
    SF.ui.setMenu('HYPERSPACE', [
      { key: 'M', label: 'Galaxy starmap', fn: function () {
        SF.setMode('starmap', { back: { mode: 'hyper' } });
      } },
    ], { nav: false });
    SF.ui.log('Entering hyperspace. Arrow keys to fly. [M] for the starmap.');
  };

  hyper.update = function (dt) {
    const s = SF.s;
    const v = moveVector();
    hyper.cooldown = Math.max(0, hyper.cooldown - dt);
    if (v.dx || v.dy) {
      const speed = 8 + s.ship.engine * 2;
      const dist = speed * dt;
      s.hx = Math.max(0, Math.min(SF.HYPER_W, s.hx + v.dx * dist));
      s.hy = Math.max(0, Math.min(SF.HYPER_H, s.hy + v.dy * dist));
      s.ship.fuel = Math.max(0, s.ship.fuel - dist * SF.fuelPerDist(s));
      s.day += dist * 0.05;
      hyper.dir = Math.atan2(v.dy, v.dx);
      if (outOfFuel(s)) return;

      if (hyper.cooldown <= 0) {
        const near = SF.galaxy.systems.find(sys => Math.hypot(sys.x - s.hx, sys.y - s.hy) < 2.5);
        if (near) {
          s.visited[near.id] = true;
          SF.setMode('system', { sysId: near.id, fromHyper: true });
          return;
        }
      }
      const race = SF.territoryRace(s.hx, s.hy);
      if (rollEncounter(SF.data.RACES[race].freq / 6, dt)) {
        SF.setMode('encounter', { raceId: race, from: 'hyper' });
      }
    }
  };

  hyper.draw = function (ctx) {
    const s = SF.s;
    ctx.fillStyle = '#050008';
    ctx.fillRect(0, 0, 640, 400);

    const scale = 10; // px per hyper unit, window 64x40 units
    const ox = s.hx - 32, oy = s.hy - 20;
    // background flux shimmer
    const rng = SF.mulberry32(Math.floor(s.hx) * 73 + Math.floor(s.hy));
    ctx.fillStyle = '#201030';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect(SF.randInt(rng, 0, 639), SF.randInt(rng, 0, 399), 2, 2);
    }
    for (const sys of SF.galaxy.systems) {
      const px = (sys.x - ox) * scale, py = (sys.y - oy) * scale;
      if (px < -20 || px > 660 || py < -20 || py > 420) continue;
      ctx.fillStyle = sys.color;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      if (sys.flare) {
        ctx.strokeStyle = '#ff4040';
        ctx.beginPath();
        ctx.arc(px, py, 8 + Math.sin(SF.time * 6) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#8090b0';
      ctx.font = '11px monospace';
      ctx.fillText(sys.name + ' (' + sys.x + ',' + sys.y + ')', px + 9, py + 4);
    }
    drawShip(ctx, 320, 200, hyper.dir);
    ctx.fillStyle = '#607090';
    ctx.font = '12px monospace';
    ctx.fillText('HYPERSPACE  ' + Math.round(s.hx) + ',' + Math.round(s.hy) +
      '   region: ' + SF.data.RACES[SF.territoryRace(s.hx, s.hy)].name + ' space', 10, 390);
  };

  // --------------------------------------------------------------- system
  const sysMode = {};
  SF.modes.system = sysMode;

  function planetPos(p) {
    return { x: Math.cos(p.angle) * p.orbit, y: Math.sin(p.angle) * p.orbit };
  }

  sysMode.enter = function (opts) {
    const sys = SF.galaxy.byId[opts.sysId];
    sysMode.sys = sys;
    sysMode.grace = 2.0;
    sysMode.dir = Math.PI / 2;
    SF.s.visited[sys.id] = true;
    const sysMenu = [
      { key: 'M', label: 'Galaxy starmap', fn: function () {
        SF.setMode('starmap', { back: { mode: 'system', sysId: sys.id } });
      } },
    ];
    if (opts.resume) {
      // back from an encounter/starmap — keep position, no ambush re-trigger
      SF.ui.setMenu(sys.name.toUpperCase() + ' SYSTEM', sysMenu, { nav: false });
      return;
    }
    if (opts.fromPlanetSlot !== undefined) {
      const pos = planetPos(sys.planets[opts.fromPlanetSlot]);
      sysMode.sx = pos.x + 7;
      sysMode.sy = pos.y + 7;
    } else {
      sysMode.sx = 0;
      sysMode.sy = -92;
    }
    SF.ui.setMenu(sys.name.toUpperCase() + ' SYSTEM', sysMenu, { nav: false });
    SF.ui.log('Entering the ' + sys.name + ' system (' + sys.className + ').' +
      (sys.flare ? ' WARNING: abnormal stellar flare activity detected.' : ''));
    // The Uhlek guard the crystal world — every entry is contested.
    if (sys.id === 'heart' && !SF.s.flags.won) {
      sysMode.pendingAmbush = true;
    }
  };

  sysMode.update = function (dt) {
    const s = SF.s;
    sysMode.grace = Math.max(0, sysMode.grace - dt);
    if (sysMode.pendingAmbush && sysMode.grace <= 0) {
      sysMode.pendingAmbush = false;
      SF.ui.log('Uhlek warships swarm from behind the crystal world!', 'bad');
      SF.setMode('encounter', { raceId: 'uhlek', from: 'system' });
      return;
    }
    const v = moveVector();
    if (!v.dx && !v.dy) return;
    const speed = 26 + s.ship.engine * 4;
    const dist = speed * dt;
    sysMode.sx += v.dx * dist;
    sysMode.sy += v.dy * dist;
    sysMode.dir = Math.atan2(v.dy, v.dx);
    s.ship.fuel = Math.max(0, s.ship.fuel - dist * 0.004);
    s.day += dist * 0.002;
    if (outOfFuel(s)) return;

    // scorched by the star
    if (Math.hypot(sysMode.sx, sysMode.sy) < 8) {
      s.ship.hull -= 12;
      sysMode.sx *= 2.5; sysMode.sy *= 2.5;
      SF.ui.log('Stellar corona! Hull scorched (-12). Pulling away.', 'bad');
      if (s.ship.hull <= 0) { SF.setMode('gameover', { reason: 'Your ship burned in the corona of ' + sysMode.sys.name + '.' }); return; }
    }
    // orbit a planet
    if (sysMode.grace <= 0) {
      for (const p of sysMode.sys.planets) {
        const pos = planetPos(p);
        if (Math.hypot(pos.x - sysMode.sx, pos.y - sysMode.sy) < 4.5) {
          SF.setMode('orbit', { sysId: sysMode.sys.id, slot: p.slot });
          return;
        }
      }
    }
    // leave the system
    if (Math.hypot(sysMode.sx, sysMode.sy) > 105) {
      const ang = Math.atan2(sysMode.sy, sysMode.sx);
      s.hx = Math.max(0, Math.min(SF.HYPER_W, sysMode.sys.x + Math.cos(ang) * 4));
      s.hy = Math.max(0, Math.min(SF.HYPER_H, sysMode.sys.y + Math.sin(ang) * 4));
      SF.setMode('hyper', {});
      return;
    }
    // local patrols
    const race = SF.territoryRace(s.hx, s.hy);
    if (rollEncounter(SF.data.RACES[race].freq / 10, dt)) {
      SF.setMode('encounter', { raceId: race, from: 'system' });
    }
  };

  sysMode.draw = function (ctx) {
    const sys = sysMode.sys;
    ctx.fillStyle = '#000008';
    ctx.fillRect(0, 0, 640, 400);
    const rng = SF.mulberry32(sys.seedBg || (sys.seedBg = Math.floor(sys.x * 1000 + sys.y)));
    ctx.fillStyle = '#303848';
    for (let i = 0; i < 70; i++) ctx.fillRect(SF.randInt(rng, 0, 639), SF.randInt(rng, 0, 399), 1, 1);

    const cx = 320, cy = 200, sc = 1.9;
    // star
    const flicker = sys.flare ? Math.sin(SF.time * 8) * 3 : 0;
    ctx.fillStyle = sys.color;
    ctx.beginPath();
    ctx.arc(cx, cy, 13 + flicker, 0, Math.PI * 2);
    ctx.fill();
    if (sys.flare) {
      ctx.strokeStyle = '#ff5030';
      ctx.beginPath();
      ctx.arc(cx, cy, 20 + flicker * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    // planets
    for (const p of sysMode.sys.planets) {
      ctx.strokeStyle = '#182030';
      ctx.beginPath();
      ctx.arc(cx, cy, p.orbit * sc, 0, Math.PI * 2);
      ctx.stroke();
      const pos = planetPos(p);
      const px = cx + pos.x * sc, py = cy + pos.y * sc;
      ctx.fillStyle = SF.data.PLANET_TYPES[p.type].colors[2];
      ctx.beginPath();
      ctx.arc(px, py, 2 + p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#708090';
      ctx.font = '10px monospace';
      ctx.fillText(p.name + (p.special === 'starport' ? ' [STARPORT]' : ''), px + 8, py + 3);
    }
    drawShip(ctx, cx + sysMode.sx * sc, cy + sysMode.sy * sc, sysMode.dir);
    ctx.fillStyle = '#607090';
    ctx.font = '12px monospace';
    ctx.fillText(sys.name.toUpperCase() + ' SYSTEM — fly to a planet to orbit, fly out to leave', 10, 390);
  };
})();
