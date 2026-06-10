// Starport Arth: Operations (story notices), Personnel (hire/train/heal),
// Trade Depot (sell minerals & lifeforms, buy fuel), Ship Configuration
// (upgrades, pods, repairs), Launch.
SF.modes = SF.modes || {};

(function () {
  const port = {};
  SF.modes.starport = port;

  port.enter = function (opts) {
    if (opts && opts.resume) { rootMenu(); return; } // back from the starmap
    SF.advanceDays(SF.s, 1);
    SF.saveGame();
    SF.ui.log('Docking complete. Welcome to Starport Arth, Captain. (Game saved.)', 'good');
    rootMenu();
  };

  port.update = function () {};

  port.draw = function (ctx) {
    // dusk sky over the port
    const sky = ctx.createLinearGradient(0, 0, 0, SF.VH);
    sky.addColorStop(0, '#020210');
    sky.addColorStop(0.55, '#0c1430');
    sky.addColorStop(0.8, '#262048');
    sky.addColorStop(1, '#0a0a18');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, SF.VW, SF.VH);
    const rng = SF.mulberry32(7);
    SF.gfx.starfield(ctx, 8, 0, 0, 130, 0, '#8896b8', 2);
    // Arth's moon hangs low
    SF.gfx.planetSphere(ctx, 790, 110, 56, ['#283048', '#5868a0', '#90a0d0', '#e0e8f8'], 31, {});

    // far skyline silhouette
    ctx.fillStyle = '#0c1428';
    for (let i = 0; i < 26; i++) {
      const w = SF.randInt(rng, 28, 80);
      const h = SF.randInt(rng, 60, 200);
      ctx.fillRect(SF.randInt(rng, 0, SF.VW - 40), 420 - h, w, h + 60);
    }
    // near towers with lit windows
    for (let i = 0; i < 16; i++) {
      const w = SF.randInt(rng, 40, 100);
      const h = SF.randInt(rng, 90, 260);
      const x = SF.randInt(rng, 0, SF.VW - 60);
      const tower = ctx.createLinearGradient(x, 0, x + w, 0);
      tower.addColorStop(0, '#1a2a4e');
      tower.addColorStop(0.5, '#24365e');
      tower.addColorStop(1, '#101e3a');
      ctx.fillStyle = tower;
      ctx.fillRect(x, 460 - h, w, h + 60);
      ctx.fillStyle = '#f0d040';
      for (let wy = 460 - h + 10; wy < 440; wy += 16) {
        for (let wx = x + 6; wx < x + w - 8; wx += 12) {
          if (SF.chance(rng, 0.4)) {
            ctx.globalAlpha = 0.5 + rng() * 0.5;
            ctx.fillRect(wx, wy, 5, 7);
          }
        }
      }
      ctx.globalAlpha = 1;
      // blinking beacon on the tallest towers
      if (h > 200) {
        ctx.fillStyle = (Math.sin(SF.time * 3 + i) > 0.4) ? '#ff5050' : '#401418';
        ctx.beginPath();
        ctx.arc(x + w / 2, 456 - h, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // landing apron with your ship on a lit pad
    const ground = ctx.createLinearGradient(0, 480, 0, SF.VH);
    ground.addColorStop(0, '#1a2236');
    ground.addColorStop(1, '#080a14');
    ctx.fillStyle = ground;
    ctx.fillRect(0, 480, SF.VW, SF.VH - 480);
    const padGlow = ctx.createRadialGradient(250, 540, 8, 250, 540, 110);
    padGlow.addColorStop(0, 'rgba(64,224,208,0.25)');
    padGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = padGlow;
    ctx.beginPath();
    ctx.ellipse(250, 540, 130, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a6a6a';
    ctx.beginPath();
    ctx.ellipse(250, 540, 100, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
    SF.gfx.ship(ctx, 250, 516, -Math.PI / 2, 3.4, '#c8d4ff', false);

    ctx.fillStyle = '#40e0d0';
    ctx.font = 'bold 30px monospace';
    ctx.shadowColor = '#40e0d0';
    ctx.shadowBlur = 14;
    ctx.fillText('STARPORT  ARTH', 340, 52);
    ctx.shadowBlur = 0;
    ctx.font = '14px monospace';
    ctx.fillStyle = '#8aa0bc';
    ctx.fillText('Interstel Operations — Sector Command', 350, 76);
  };

  function rootMenu() {
    SF.ui.setMenu('STARPORT ARTH', [
      { key: 'O', label: 'Operations (briefing)', fn: operations },
      { key: 'P', label: 'Personnel & Training', fn: personnel },
      { key: 'T', label: 'Trade Depot', fn: trade },
      { key: 'S', label: 'Ship Configuration', fn: shipConfig },
      { key: 'M', label: 'Galaxy Starmap', fn: function () {
        SF.setMode('starmap', { back: { mode: 'starport' } });
      } },
      { key: 'L', label: 'Launch Ship', fn: launch },
    ]);
  }

  // ---------------------------------------------------------- operations
  function operations() {
    const s = SF.s;
    SF.ui.log('--- INTERSTEL OPERATIONS ---', 'hdr');
    SF.ui.log(SF.data.notice(s.flags));
    SF.ui.log('Service record: day ' + Math.floor(s.day) + ' | ' +
      SF.ui.fmt(s.earnings) + ' cr lifetime earnings | ' + s.kills + ' hostiles destroyed.');
    if (s.flags.tablet) SF.ui.log('Artifacts logged: Ancient Tablet' + (s.flags.egg ? ', the BLACK EGG' : '') + '.');
    rootMenu();
  }

  // ----------------------------------------------------------- personnel
  function personnel() {
    const items = SF.data.ROLES.map(function (role) {
      const m = SF.s.crew[role];
      const label = role.toUpperCase().padEnd(15) + (m ? m.name + ' (' + SF.data.CREW_RACES[m.race].name + ')' : '— vacant —');
      return { label: label, fn: function () { crewMenu(role); } };
    });
    items.push({ key: 'H', label: 'Heal all crew (' + SF.data.HEAL_FEE + ' cr)', fn: healAll });
    items.push({ key: 'B', label: 'Back', fn: rootMenu });
    SF.ui.setMenu('PERSONNEL', items);
  }

  function describeCrew(m) {
    const sk = m.skills;
    return 'SCI ' + sk.science + ' NAV ' + sk.navigation + ' ENG ' + sk.engineering +
      ' COM ' + sk.communications + ' MED ' + sk.medicine + ' | vitality ' + Math.floor(m.vitality);
  }

  function crewMenu(role) {
    const m = SF.s.crew[role];
    if (m) SF.ui.log(role.toUpperCase() + ' ' + m.name + ': ' + describeCrew(m));
    const items = [];
    if (m) {
      const skillName = SF.data.ROLE_SKILL[role];
      if (skillName) {
        items.push({
          key: 'T',
          label: 'Train ' + skillName + ' +5 (' + SF.data.TRAIN_FEE + ' cr)',
          fn: function () { train(role); },
        });
      }
    }
    items.push({ key: 'R', label: 'Recruit replacement (' + SF.data.HIRE_FEE + ' cr)', fn: function () { recruit(role); } });
    items.push({ key: 'B', label: 'Back', fn: personnel });
    SF.ui.setMenu(role.toUpperCase(), items);
  }

  function train(role) {
    const s = SF.s;
    const m = s.crew[role];
    const skillName = SF.data.ROLE_SKILL[role];
    const cap = SF.data.CREW_RACES[m.race].caps[skillName];
    if (m.skills[skillName] >= cap) {
      SF.ui.log(m.name + ' has reached the ' + SF.data.CREW_RACES[m.race].name + ' aptitude cap (' + cap + ') in ' + skillName + '.', 'warn');
      return;
    }
    if (!SF.spend(s, SF.data.TRAIN_FEE)) { SF.ui.log('Insufficient credits.', 'warn'); return; }
    m.skills[skillName] = Math.min(cap, m.skills[skillName] + 5);
    SF.advanceDays(s, 1);
    SF.ui.log(m.name + ' trains ' + skillName + ' to ' + m.skills[skillName] + '.', 'good');
    SF.ui.setStatus();
  }

  function recruit(role) {
    const candidates = Object.keys(SF.data.CREW_RACES).map(function (raceId) {
      return SF.newCrewMember(raceId, 25);
    });
    const items = candidates.map(function (c) {
      return {
        label: SF.data.CREW_RACES[c.race].name.padEnd(8) + c.name + ' — ' + describeCrew(c),
        fn: function () {
          if (!SF.spend(SF.s, SF.data.HIRE_FEE)) { SF.ui.log('Insufficient credits.', 'warn'); return; }
          SF.s.crew[role] = c;
          SF.ui.log(c.name + ' signs on as ' + role + '.', 'good');
          SF.ui.setStatus();
          personnel();
        },
      };
    });
    items.push({ key: 'B', label: 'Back', fn: function () { crewMenu(role); } });
    SF.ui.setMenu('RECRUITS — ' + role.toUpperCase(), items);
  }

  function healAll() {
    const s = SF.s;
    if (!SF.spend(s, SF.data.HEAL_FEE)) { SF.ui.log('Insufficient credits.', 'warn'); return; }
    for (const role of SF.data.ROLES) {
      const m = s.crew[role];
      if (m) m.vitality = 100;
    }
    SF.ui.log('Medical bay restores the crew to full vitality.', 'good');
    SF.ui.setStatus();
  }

  // --------------------------------------------------------------- trade
  function trade() {
    const s = SF.s;
    const items = [];
    items.push({
      key: 'F',
      label: 'Buy fuel — ' + SF.data.FUEL_PRICE + ' cr/unit (tank ' + s.ship.fuel.toFixed(1) + '/' + SF.fuelMax(s) + ')',
      fn: buyFuel,
    });
    const cargoIds = Object.keys(s.ship.cargo).filter(id => s.ship.cargo[id] > 0);
    if (!cargoIds.length) {
      items.push({ label: '(cargo hold is empty)', fn: function () {}, disabled: true });
    }
    cargoIds.forEach(function (id) {
      const min = SF.data.MINERAL_BY_ID[id];
      const qty = s.ship.cargo[id];
      items.push({
        label: 'Sell ' + qty + 'cu ' + min.name + ' @ ' + min.price + ' = ' + SF.ui.fmt(qty * min.price) + ' cr',
        fn: function () { sellMineral(id); },
      });
    });
    if (s.ship.lifeforms > 0) {
      items.push({
        key: 'L',
        label: 'Sell ' + s.ship.lifeforms + ' lifeform(s) to Science Institute @ ' + SF.data.LIFEFORM_PRICE,
        fn: sellLifeforms,
      });
    }
    items.push({ key: 'B', label: 'Back', fn: rootMenu });
    SF.ui.setMenu('TRADE DEPOT', items);
  }

  function buyFuel() {
    const s = SF.s;
    const space = SF.fuelMax(s) - s.ship.fuel;
    const affordable = Math.floor(s.credits / SF.data.FUEL_PRICE);
    const units = Math.min(Math.ceil(space), affordable);
    if (units <= 0) { SF.ui.log(space < 1 ? 'Tank is full.' : 'Insufficient credits.', 'warn'); return; }
    SF.spend(s, units * SF.data.FUEL_PRICE);
    s.ship.fuel = Math.min(SF.fuelMax(s), s.ship.fuel + units);
    SF.ui.log('Bought ' + units + ' fuel for ' + SF.ui.fmt(units * SF.data.FUEL_PRICE) + ' cr.', 'good');
    SF.ui.setStatus();
    trade();
  }

  function sellMineral(id) {
    const s = SF.s;
    const min = SF.data.MINERAL_BY_ID[id];
    const qty = s.ship.cargo[id];
    delete s.ship.cargo[id];
    SF.earn(s, qty * min.price);
    SF.ui.log('Sold ' + qty + 'cu ' + min.name + ' for ' + SF.ui.fmt(qty * min.price) + ' cr.', 'good');
    SF.ui.setStatus();
    trade();
  }

  function sellLifeforms() {
    const s = SF.s;
    const pay = s.ship.lifeforms * SF.data.LIFEFORM_PRICE;
    SF.ui.log('The Science Institute takes ' + s.ship.lifeforms + ' specimen(s) for ' + SF.ui.fmt(pay) + ' cr.', 'good');
    SF.earn(s, pay);
    s.ship.lifeforms = 0;
    SF.ui.setStatus();
    trade();
  }

  // --------------------------------------------------------- ship config
  function shipConfig() {
    const s = SF.s;
    const items = Object.keys(SF.data.PARTS).map(function (partId) {
      const part = SF.data.PARTS[partId];
      const cur = s.ship[partId];
      if (cur >= 5) {
        return { label: part.name + ' — class 5 (max)', fn: function () {}, disabled: true };
      }
      const cost = upgradeCost(partId);
      return {
        label: part.name + ' class ' + cur + ' -> ' + (cur + 1) + ' (' + SF.ui.fmt(cost) + ' cr)',
        fn: function () { buyUpgrade(partId); },
      };
    });
    if (s.ship.pods < SF.data.MAX_PODS) {
      items.push({
        key: 'P',
        label: 'Add cargo pod +250cu (' + SF.ui.fmt(SF.data.POD_PRICE) + ' cr) [' + s.ship.pods + '/' + SF.data.MAX_PODS + ']',
        fn: buyPod,
      });
    }
    const dmg = Math.ceil(s.ship.hullMax - s.ship.hull);
    if (dmg > 0) {
      items.push({ key: 'R', label: 'Repair hull ' + dmg + 'pt (' + SF.ui.fmt(dmg * SF.data.REPAIR_PRICE) + ' cr)', fn: repair });
    }
    items.push({ key: 'B', label: 'Back', fn: rootMenu });
    SF.ui.setMenu('SHIP CONFIGURATION', items);
  }

  // upgrading trades in the old unit at half value
  function upgradeCost(partId) {
    const prices = SF.data.PARTS[partId].prices;
    const cur = SF.s.ship[partId];
    return prices[cur + 1] - Math.floor(prices[cur] * 0.5);
  }

  function buyUpgrade(partId) {
    const s = SF.s;
    const cost = upgradeCost(partId);
    if (!SF.spend(s, cost)) { SF.ui.log('Insufficient credits.', 'warn'); return; }
    s.ship[partId] += 1;
    SF.ui.log(SF.data.PARTS[partId].name + ' upgraded to class ' + s.ship[partId] + '.', 'good');
    SF.ui.setStatus();
    shipConfig();
  }

  function buyPod() {
    const s = SF.s;
    if (!SF.spend(s, SF.data.POD_PRICE)) { SF.ui.log('Insufficient credits.', 'warn'); return; }
    s.ship.pods += 1;
    SF.ui.log('Cargo pod fitted. Capacity now ' + SF.cargoMax(s) + 'cu.', 'good');
    SF.ui.setStatus();
    shipConfig();
  }

  function repair() {
    const s = SF.s;
    const dmg = Math.ceil(s.ship.hullMax - s.ship.hull);
    if (!SF.spend(s, dmg * SF.data.REPAIR_PRICE)) { SF.ui.log('Insufficient credits.', 'warn'); return; }
    s.ship.hull = s.ship.hullMax;
    SF.ui.log('Hull fully repaired.', 'good');
    SF.ui.setStatus();
    shipConfig();
  }

  // -------------------------------------------------------------- launch
  function launch() {
    if (SF.s.ship.fuel < 5) {
      SF.ui.log('Flight control denies launch: fuel critically low. Buy fuel at the Trade Depot.', 'warn');
      return;
    }
    SF.ui.log('Launch clamps released. Ascending from Arth...', 'good');
    SF.setMode('system', { sysId: 'arth', fromPlanetSlot: 1 });
  }
})();
