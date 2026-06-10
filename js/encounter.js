// Alien encounters: hailing with postures, topic dialogue carrying the
// story clues, and turn-based combat (each player action gives the enemy
// a turn).
(function () {
  const enc = {};
  SF.modes.encounter = enc;

  enc.enter = function (opts) {
    const s = SF.s;
    enc.raceId = opts.raceId;
    enc.race = SF.data.RACES[opts.raceId];
    enc.from = opts.from;
    enc.fromSysId = SF.modes.system.sys ? SF.modes.system.sys.id : null;
    enc.enemy = Object.assign({}, enc.race.ship);
    enc.enemy.hullMax = enc.enemy.hull;
    enc.range = 130;
    enc.posture = 'friendly';
    enc.shotsFired = false;
    enc.surrendered = false;
    const hostile = enc.race.hostile || s.flags.rel[enc.raceId] === 'hostile';
    SF.ui.log('--- ENCOUNTER: ' + enc.race.name + ' vessel ---', 'hdr');
    if (hostile) SF.ui.log('They are powering weapons!', 'bad');
    actionMenu();
  };

  function isHostile() {
    return enc.race.hostile || SF.s.flags.rel[enc.raceId] === 'hostile' || enc.shotsFired;
  }

  function actionMenu() {
    const s = SF.s;
    const items = [
      { key: 'H', label: 'Hail (communications)', fn: hailMenu },
      { key: 'L', label: 'Fire laser' + (s.ship.laser ? ' (class ' + s.ship.laser + ', range 60)' : ' — NOT FITTED'),
        fn: fireLaser, disabled: !s.ship.laser },
      { key: 'M', label: 'Fire missile' + (s.ship.missile ? ' (class ' + s.ship.missile + ', range 150)' : ' — NOT FITTED'),
        fn: fireMissile, disabled: !s.ship.missile },
      { key: 'C', label: 'Close distance', fn: function () { maneuver(-30); } },
      { key: 'W', label: 'Open distance', fn: function () { maneuver(30); } },
      { key: 'F', label: 'Attempt escape', fn: flee },
    ];
    if (!isHostile()) items.push({ key: 'B', label: 'Break contact peacefully', fn: leave });
    SF.ui.setMenu('ENCOUNTER — ' + enc.race.name.toUpperCase() + ' (range ' + Math.round(enc.range) + ')', items);
  }

  function leave() {
    SF.ui.log('You disengage and resume course.');
    returnToSpace();
  }

  function returnToSpace() {
    if (enc.from === 'system' && enc.fromSysId) {
      SF.setMode('system', { sysId: enc.fromSysId, resume: true });
    } else {
      SF.setMode('hyper', {});
    }
  }

  // ------------------------------------------------------------------ comms
  function hailMenu() {
    if (enc.raceId === 'uhlek') {
      SF.ui.log(enc.race.hail.friendly, 'alien');
      enemyTurn();
      return;
    }
    SF.ui.setMenu('SELECT POSTURE', [
      { key: 'F', label: 'Friendly', fn: function () { setPosture('friendly'); } },
      { key: 'H', label: 'Hostile', fn: function () { setPosture('hostile'); } },
      { key: 'O', label: 'Obsequious', fn: function () { setPosture('obsequious'); } },
      { key: 'B', label: 'Back', fn: actionMenu },
    ]);
  }

  function setPosture(p) {
    enc.posture = p;
    SF.ui.log('Comm channel open. Posture: ' + p + '.');
    SF.ui.log(enc.race.name + ': ' + enc.race.hail[p], 'alien');
    if (enc.raceId === 'renegade' && !enc.paidOff) {
      SF.ui.log('They demand 25% of your credits as "toll".', 'warn');
    }
    topicMenu();
  }

  function topicMenu() {
    const items = [
      { key: '1', label: 'Ask about themselves', fn: function () { ask('themselves'); } },
      { key: '2', label: 'Ask about other races', fn: function () { ask('others'); } },
      { key: '3', label: 'Ask about the Ancients', fn: function () { ask('ancients'); } },
      { key: '4', label: 'Ask about the flares', fn: function () { ask('flares'); } },
    ];
    if (enc.raceId === 'renegade' && !enc.paidOff) {
      items.push({ key: 'P', label: 'Pay the toll (25% of credits)', fn: payToll });
    }
    items.push({ key: 'B', label: 'Close channel', fn: actionMenu });
    SF.ui.setMenu('COMMS — ' + enc.race.name.toUpperCase(), items);
  }

  function ask(topic) {
    const s = SF.s;
    const race = enc.race;
    let line = race.topics[topic];
    // story clue logic
    if (enc.raceId === 'spemin' && topic === 'ancients' && enc.posture === 'obsequious') {
      line = race.topics.ancients_grovel;
      if (!s.flags.crystalCoords) {
        s.flags.crystalCoords = true;
        SF.ui.log('>>> NAVIGATION LOGGED: crystal world at 42,178 <<<', 'good');
      }
    }
    if (enc.raceId === 'elowan' && topic === 'ancients' && s.flags.tablet) {
      line = race.topics.ancients_tablet;
      if (!s.flags.crystalCoords) {
        s.flags.crystalCoords = true;
        SF.ui.log('>>> NAVIGATION LOGGED: crystal world at 42,178 <<<', 'good');
      }
    }
    if (!line) { SF.ui.log(race.name + ': (no response)', 'alien'); topicMenu(); return; }
    SF.ui.log(race.name + ': ' + line, 'alien');
    // a good comm officer reads the room
    if (enc.raceId === 'spemin' && topic === 'ancients' && enc.posture !== 'obsequious' &&
        SF.skill(s, 'communications') >= 35) {
      SF.ui.log('Comm officer: "They\'re hiding something, Captain. Try groveling — Spemin love that."', 'good');
    }
    if (enc.raceId === 'elowan' && topic === 'ancients' && !s.flags.tablet &&
        SF.skill(s, 'communications') >= 35) {
      SF.ui.log('Comm officer: "If we brought them an Ancient relic, they\'d read it for us."', 'good');
    }
    topicMenu();
  }

  function payToll() {
    const s = SF.s;
    const toll = Math.floor(s.credits * 0.25);
    s.credits -= toll;
    enc.paidOff = true;
    SF.ui.log('You transfer ' + SF.ui.fmt(toll) + ' cr. "Pleasure doing business." They peel away.', 'warn');
    SF.ui.setStatus();
    returnToSpace();
  }

  // ----------------------------------------------------------------- combat
  function markAggression() {
    if (!enc.shotsFired && !enc.race.hostile) {
      SF.s.flags.rel[enc.raceId] = 'hostile';
      SF.ui.log('The ' + enc.race.name + ' will remember this aggression.', 'warn');
    }
    enc.shotsFired = true;
  }

  function playerDamage(base) {
    const reduced = base * (1 - 0.12 * enc.enemy.shield) - enc.enemy.armor;
    return Math.max(1, Math.round(reduced));
  }

  function fireLaser() {
    const s = SF.s;
    if (Math.round(enc.range) > 60) { SF.ui.log('Out of laser range (60). Close the distance.', 'warn'); return; }
    markAggression();
    if (Math.random() < 0.8) {
      const dmg = playerDamage(3 + s.ship.laser * 3 + SF.skill(s, 'engineering') / 20);
      enc.enemy.hull -= dmg;
      SF.ui.log('Laser hit! Enemy takes ' + dmg + ' damage.', 'good');
    } else {
      SF.ui.log('Laser misses.');
    }
    afterPlayerShot();
  }

  function fireMissile() {
    const s = SF.s;
    if (Math.round(enc.range) > 150) { SF.ui.log('Out of missile range (150).', 'warn'); return; }
    markAggression();
    if (Math.random() < 0.6) {
      const dmg = playerDamage(14 * s.ship.missile);
      enc.enemy.hull -= dmg;
      SF.ui.log('Missile impact! Enemy takes ' + dmg + ' damage.', 'good');
    } else {
      SF.ui.log('Missile evaded.');
    }
    afterPlayerShot();
  }

  function afterPlayerShot() {
    if (enc.enemy.hull <= 0) { destroyEnemy(); return; }
    // cowards bail or beg once mauled
    if (!enc.race.brave && enc.enemy.hull < enc.enemy.hullMax * 0.45 && !enc.surrendered) {
      enc.surrendered = true;
      surrender();
      return;
    }
    enemyTurn();
    actionMenu();
  }

  function surrender() {
    const s = SF.s;
    if (enc.raceId === 'spemin') {
      SF.ui.log('Spemin: "MERCY! Take our cargo! Take our coordinates! Take ANYTHING!"', 'alien');
      if (!s.flags.crystalCoords) {
        s.flags.crystalCoords = true;
        SF.ui.log('Spemin: "The crystal world! 42,178! Now LEAVE USSS!"', 'alien');
        SF.ui.log('>>> NAVIGATION LOGGED: crystal world at 42,178 <<<', 'good');
      }
    } else {
      SF.ui.log(enc.race.name + ' vessel jettisons cargo and flees!', 'good');
    }
    const credits = 300 + Math.floor(Math.random() * 500);
    SF.earn(s, credits);
    SF.ui.log('Salvaged jettisoned goods: +' + SF.ui.fmt(credits) + ' cr.', 'good');
    SF.ui.setStatus();
    returnToSpace();
  }

  function destroyEnemy() {
    const s = SF.s;
    s.kills += 1;
    const credits = enc.enemy.hullMax * 6 + Math.floor(Math.random() * 200);
    SF.earn(s, credits);
    SF.ui.log('Enemy vessel DESTROYED. Debris salvage: +' + SF.ui.fmt(credits) + ' cr.', 'good');
    if (Math.random() < 0.5) {
      const pool = ['titanium', 'tungsten', 'gold', 'cobalt', 'silver'];
      const id = pool[Math.floor(Math.random() * pool.length)];
      const qty = 10 + Math.floor(Math.random() * 30);
      const added = SF.addCargo(s, id, qty);
      if (added) SF.ui.log('Recovered ' + added + 'cu ' + SF.data.MINERAL_BY_ID[id].name + ' from the wreck.', 'good');
    }
    SF.advanceDays(s, 0.2);
    SF.ui.setStatus();
    returnToSpace();
  }

  function maneuver(delta) {
    enc.range = Math.max(10, Math.min(200, enc.range + delta + (Math.random() * 10 - 5)));
    enemyTurn();
    actionMenu();
  }

  function flee() {
    const s = SF.s;
    const odds = 0.35 + (enc.range - 60) / 250 + s.ship.engine * 0.06 - enc.enemy.agility * 0.05;
    if (Math.random() < odds) {
      SF.ui.log('You punch the engines and break contact!', 'good');
      returnToSpace();
      return;
    }
    SF.ui.log('Escape failed — they match your vector!', 'warn');
    enemyTurn();
    actionMenu();
  }

  function enemyTurn() {
    const s = SF.s;
    if (!isHostile()) return;
    // enemy closes to its preferred envelope
    if (enc.range > 50) enc.range = Math.max(40, enc.range - 20 - enc.enemy.agility * 5);
    const canLaser = enc.enemy.laser > 0 && enc.range <= 60;
    const canMissile = enc.enemy.missile > 0 && enc.range <= 150;
    if (!canLaser && !canMissile) {
      SF.ui.log('The ' + enc.race.name + ' vessel maneuvers closer...', 'warn');
      return;
    }
    const useMissile = canMissile && (!canLaser || Math.random() < 0.35);
    const base = useMissile ? 12 * enc.enemy.missile : 3 + enc.enemy.laser * 3;
    if (Math.random() < 0.75) {
      const dmg = Math.max(1, Math.round(base * (1 - 0.12 * s.ship.shield) - s.ship.armor));
      s.ship.hull -= dmg;
      SF.ui.log('HIT! ' + (useMissile ? 'Missile' : 'Laser') + ' strikes for ' + dmg + '. Hull ' +
        Math.max(0, Math.ceil(s.ship.hull)) + '/' + s.ship.hullMax + '.', 'bad');
      // shaken crew
      const role = SF.data.ROLES[Math.floor(Math.random() * SF.data.ROLES.length)];
      const m = s.crew[role];
      if (m && Math.random() < 0.4) {
        m.vitality = Math.max(0, m.vitality - (5 + Math.random() * 10));
        if (m.vitality <= 0) SF.ui.log(m.name + ' (' + role + ') is gravely injured and out of action!', 'bad');
      }
    } else {
      SF.ui.log('Enemy fire misses.');
    }
    SF.ui.setStatus();
    if (s.ship.hull <= 0) {
      SF.setMode('gameover', { reason: 'Your ship was destroyed by a ' + enc.race.name + ' vessel.' });
    }
  }

  enc.update = function () {};

  enc.draw = function (ctx) {
    ctx.fillStyle = '#000008';
    ctx.fillRect(0, 0, SF.VW, SF.VH);
    SF.gfx.nebula(ctx, 4242, ['#401030', '#102a50', '#3a1a10']);
    SF.gfx.starfield(ctx, 4243, 0, 0, 170, 0, '#3c4862', 2);

    const px = 230, py = SF.VH - 170;
    const ex = Math.min(SF.VW - 90, SF.VW / 2 + enc.range * 1.9);
    const ey = Math.max(90, SF.VH / 2 - 80 - enc.range * 0.9);

    // dashed engagement line with range readout at its midpoint
    ctx.save();
    ctx.strokeStyle = 'rgba(150,170,210,0.25)';
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#cfe0f4';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(Math.round(enc.range) + '', (px + ex) / 2 - 8, (py + ey) / 2 - 8);

    const angToEnemy = Math.atan2(ey - py, ex - px);
    SF.gfx.ship(ctx, px, py, angToEnemy, 3.2, '#c8d4ff', true);
    SF.gfx.ship(ctx, ex, ey, angToEnemy + Math.PI, 2.6, enc.race.color, isHostile());

    // readouts
    const s = SF.s;
    ctx.fillStyle = '#9ab0c8';
    ctx.font = '13px monospace';
    ctx.fillText('RANGE ' + Math.round(enc.range) + '   laser envelope <=60 · missile envelope <=150', 14, 26);
    drawBar(ctx, 14, 40, 'YOUR HULL', s.ship.hull / s.ship.hullMax, '#40c0ff');
    drawBar(ctx, 14, 62, enc.race.name.toUpperCase(), Math.max(0, enc.enemy.hull / enc.enemy.hullMax), enc.race.color);
    SF.gfx.hudBar(ctx, isHostile() ? 'WEAPONS FREE — pick an action from the console' :
      'Contact is not hostile. Hail them, or break contact.');
  };

  function drawBar(ctx, x, y, label, frac, color) {
    ctx.fillStyle = '#0a1420';
    ctx.fillRect(x, y, 230, 13);
    ctx.strokeStyle = '#1a3050';
    ctx.strokeRect(x, y, 230, 13);
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, Math.max(0, 228 * frac), 11);
    ctx.fillStyle = '#9ab0c8';
    ctx.font = '11px monospace';
    ctx.fillText(label, x + 238, y + 11);
  }
})();
