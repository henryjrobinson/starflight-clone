// Space flight: 'hyper' (galaxy grid, burns fuel) and 'system' (local
// star system, leads to orbit). Steer with arrows/WASD, or click a
// destination — the ship flies itself. Arrow keys disengage autopilot.
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
    s.course = null;
    SF.ui.log('STRANDED. An Interstel tug hauls you back to Arth. Salvage fee: ' + SF.ui.fmt(fee) + ' cr.', 'bad');
    SF.setMode('system', { sysId: 'arth', fromHyper: true });
    return true;
  }

  // ---------------------------------------------------------------- hyper
  const hyper = {};
  SF.modes.hyper = hyper;
  const HSC = 12; // px per hyper unit; view window is 80x50 units

  hyper.enter = function () {
    hyper.dir = 0;
    hyper.moving = false;
    hyper.cooldown = 1.5;  // don't instantly re-enter the system we just left
    SF.ui.setMenu('HYPERSPACE', [
      { key: 'M', label: 'Galaxy starmap', fn: function () {
        SF.setMode('starmap', { back: { mode: 'hyper' } });
      } },
    ], { nav: false });
    SF.ui.log('Entering hyperspace. Fly with arrows, or click a destination. [M] starmap.');
  };

  hyper.click = function (px, py) {
    const s = SF.s;
    const ox = s.hx - SF.VW / HSC / 2, oy = s.hy - SF.VH / HSC / 2;
    let wx = ox + px / HSC, wy = oy + py / HSC;
    // snap to a nearby system
    const near = SF.galaxy.systems.find(sys =>
      Math.hypot((sys.x - ox) * HSC - px, (sys.y - oy) * HSC - py) < 22);
    if (near) { wx = near.x; wy = near.y; }
    s.course = {
      x: Math.max(0, Math.min(SF.HYPER_W, wx)),
      y: Math.max(0, Math.min(SF.HYPER_H, wy)),
    };
    SF.ui.log('Course laid in: ' + Math.round(s.course.x) + ',' + Math.round(s.course.y) +
      (near ? ' (' + near.name + ')' : '') + '. Autopilot engaged.', 'good');
  };

  hyper.update = function (dt) {
    const s = SF.s;
    hyper.cooldown = Math.max(0, hyper.cooldown - dt);
    let v = moveVector();
    if (v.dx || v.dy) {
      if (s.course) { s.course = null; SF.ui.log('Autopilot disengaged.'); }
    } else if (s.course) {
      const dx = s.course.x - s.hx, dy = s.course.y - s.hy;
      const d = Math.hypot(dx, dy);
      if (d < 0.6) {
        s.course = null;
        SF.ui.log('Autopilot: arrived at destination.', 'good');
      } else {
        v = { dx: dx / d, dy: dy / d };
      }
    }
    hyper.moving = !!(v.dx || v.dy);
    if (!hyper.moving) return;

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
      if (enterFlux(s)) return;
    }
    const race = SF.territoryRace(s.hx, s.hy);
    if (rollEncounter(SF.data.RACES[race].freq / 6, dt)) {
      SF.setMode('encounter', { raceId: race, from: 'hyper' });
    }
  };

  // Fly into a flux endpoint -> instant free transit to its partner.
  function enterFlux(s) {
    for (let i = 0; i < SF.galaxy.fluxes.length; i++) {
      const f = SF.galaxy.fluxes[i];
      let exit = null;
      if (Math.hypot(f.ax - s.hx, f.ay - s.hy) < 2.2) exit = { x: f.bx, y: f.by };
      else if (Math.hypot(f.bx - s.hx, f.by - s.hy) < 2.2) exit = { x: f.ax, y: f.ay };
      if (!exit) continue;
      s.fluxes = s.fluxes || {};
      if (!s.fluxes[i]) {
        s.fluxes[i] = true;
        SF.ui.log('CONTINUUM FLUX DISCOVERED — charted on the starmap.', 'good');
      }
      s.hx = exit.x;
      s.hy = exit.y;
      hyper.cooldown = 2.5;
      SF.ui.log('Space folds around the ship... you emerge at ' +
        Math.round(s.hx) + ',' + Math.round(s.hy) + '. No fuel spent.', 'hdr');
      SF.ui.setStatus();
      return true;
    }
    return false;
  }

  function drawFluxSwirl(ctx, px, py, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#c060ff';
    ctx.lineWidth = 1.5;
    for (let r = 3; r <= 12; r += 4) {
      ctx.beginPath();
      ctx.arc(px, py, r + Math.sin(SF.time * 4 + r) * 2, SF.time * 2 + r, SF.time * 2 + r + 4.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  hyper.draw = function (ctx) {
    const s = SF.s;
    ctx.fillStyle = '#05000f';
    ctx.fillRect(0, 0, SF.VW, SF.VH);
    SF.gfx.nebula(ctx, 50, ['#2a1050', '#102a50', '#401040']);
    SF.gfx.starfield(ctx, 21, s.hx * HSC, s.hy * HSC, 150, 0.18, '#33415a', 2);
    SF.gfx.starfield(ctx, 22, s.hx * HSC, s.hy * HSC, 90, 0.45, '#6a7a9a', 2);

    const ox = s.hx - SF.VW / HSC / 2, oy = s.hy - SF.VH / HSC / 2;
    for (const sys of SF.galaxy.systems) {
      const px = (sys.x - ox) * HSC, py = (sys.y - oy) * HSC;
      if (px < -40 || px > SF.VW + 40 || py < -40 || py > SF.VH + 40) continue;
      SF.gfx.star(ctx, px, py, 8, sys.color, sys.flare);
      ctx.fillStyle = '#8aa0c4';
      ctx.font = '12px monospace';
      ctx.fillText(sys.name + ' (' + sys.x + ',' + sys.y + ')', px + 14, py + 4);
    }
    // continuum fluxes: discovered ones show plainly; undiscovered ones
    // only shimmer if the science officer is sharp enough
    const sciSkill = SF.skill(s, 'science');
    for (let i = 0; i < SF.galaxy.fluxes.length; i++) {
      const f = SF.galaxy.fluxes[i];
      for (const end of [{ x: f.ax, y: f.ay }, { x: f.bx, y: f.by }]) {
        const px = (end.x - ox) * HSC, py = (end.y - oy) * HSC;
        if (px < -30 || px > SF.VW + 30 || py < -30 || py > SF.VH + 30) continue;
        const known = (s.fluxes || {})[i];
        if (known) {
          drawFluxSwirl(ctx, px, py, 0.9);
          ctx.fillStyle = '#c060ff';
          ctx.font = '11px monospace';
          ctx.fillText('flux ' + (i + 1), px + 16, py + 4);
        } else if (sciSkill >= 40) {
          drawFluxSwirl(ctx, px, py, 0.22);
        }
      }
    }
    // autopilot course
    if (s.course) {
      const px = (s.course.x - ox) * HSC, py = (s.course.y - oy) * HSC;
      ctx.save();
      ctx.strokeStyle = 'rgba(80,208,128,0.5)';
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.moveTo(SF.VW / 2, SF.VH / 2);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.restore();
      SF.gfx.crosshair(ctx, px, py, '#50d080', 'course');
    }
    SF.gfx.ship(ctx, SF.VW / 2, SF.VH / 2, hyper.dir, 1.7, '#c8d4ff', hyper.moving);
    SF.gfx.hudBar(ctx, 'HYPERSPACE  ' + Math.round(s.hx) + ',' + Math.round(s.hy) +
      '   region: ' + SF.data.RACES[SF.territoryRace(s.hx, s.hy)].name + ' space' +
      (s.course ? '   autopilot -> ' + Math.round(s.course.x) + ',' + Math.round(s.course.y) : '   click to set course'));
  };

  // --------------------------------------------------------------- system
  const sysMode = {};
  SF.modes.system = sysMode;
  const SSC = 2.8, SCX = SF.VW / 2, SCY = SF.VH / 2;

  function planetPos(p) {
    return { x: Math.cos(p.angle) * p.orbit, y: Math.sin(p.angle) * p.orbit };
  }

  sysMode.enter = function (opts) {
    const sys = SF.galaxy.byId[opts.sysId];
    sysMode.sys = sys;
    sysMode.grace = 2.0;
    sysMode.dir = Math.PI / 2;
    sysMode.target = null;
    sysMode.moving = false;
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

  sysMode.click = function (px, py) {
    let lx = (px - SCX) / SSC, ly = (py - SCY) / SSC;
    // snap to a planet
    for (const p of sysMode.sys.planets) {
      const pos = planetPos(p);
      const ppx = SCX + pos.x * SSC, ppy = SCY + pos.y * SSC;
      if (Math.hypot(ppx - px, ppy - py) < 8 + p.size * 1.6) {
        sysMode.target = { x: pos.x, y: pos.y, label: p.name };
        SF.ui.log('Helm: making for ' + p.name + '.', 'good');
        return;
      }
    }
    sysMode.target = { x: lx, y: ly };
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
    let v = moveVector();
    if (v.dx || v.dy) {
      sysMode.target = null;
    } else if (sysMode.target) {
      const dx = sysMode.target.x - sysMode.sx, dy = sysMode.target.y - sysMode.sy;
      const d = Math.hypot(dx, dy);
      if (d < 0.6) sysMode.target = null;
      else v = { dx: dx / d, dy: dy / d };
    }
    sysMode.moving = !!(v.dx || v.dy);
    if (!sysMode.moving) return;

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
      sysMode.target = null;
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
    ctx.fillStyle = '#020210';
    ctx.fillRect(0, 0, SF.VW, SF.VH);
    SF.gfx.nebula(ctx, sys.x * 31 + sys.y, ['#1a1040', '#0a2040', '#301030']);
    SF.gfx.starfield(ctx, sys.x * 7 + sys.y, sysMode.sx * SSC, sysMode.sy * SSC, 120, 0.1, '#404c64', 2);

    // orbit rings
    ctx.strokeStyle = 'rgba(80,120,180,0.16)';
    for (const p of sys.planets) {
      ctx.beginPath();
      ctx.arc(SCX, SCY, p.orbit * SSC, 0, Math.PI * 2);
      ctx.stroke();
    }
    SF.gfx.star(ctx, SCX, SCY, 26, sys.color, sys.flare);
    for (const p of sys.planets) {
      const pos = planetPos(p);
      const px = SCX + pos.x * SSC, py = SCY + pos.y * SSC;
      const type = SF.data.PLANET_TYPES[p.type];
      const r = 5 + p.size * 1.4;
      SF.gfx.planetSphere(ctx, px, py, r, type.colors, p.seed, {
        bands: p.type === 'gas',
        ring: p.type === 'gas' && p.size >= 7,
        atmo: (p.type === 'ocean' || p.type === 'jungle') ? 'rgba(120,200,255,0.45)' : null,
      });
      ctx.fillStyle = p.special === 'starport' ? '#40e0d0' : '#7e93b4';
      ctx.font = '11px monospace';
      ctx.fillText(p.name + (p.special === 'starport' ? ' [STARPORT]' : ''), px + r + 5, py + 4);
    }
    if (sysMode.target) {
      const px = SCX + sysMode.target.x * SSC, py = SCY + sysMode.target.y * SSC;
      SF.gfx.crosshair(ctx, px, py, '#50d080', sysMode.target.label || null);
    }
    SF.gfx.ship(ctx, SCX + sysMode.sx * SSC, SCY + sysMode.sy * SSC, sysMode.dir, 1.5, '#c8d4ff', sysMode.moving);
    SF.gfx.hudBar(ctx, sys.name.toUpperCase() + ' SYSTEM — click a planet to fly there; fly past the edge to leave');
  };
})();
