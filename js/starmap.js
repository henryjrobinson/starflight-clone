// Full-screen galaxy starmap, reachable from hyperspace, any system, or
// the starport. Shows charted systems, race territories, flare activity,
// story markers, and your position.
(function () {
  const map = {};
  SF.modes.starmap = map;

  const SC = 1.9, OX = 80, OY = 8; // 250x200 world -> 475x380 px

  function mx(x) { return OX + x * SC; }
  function my(y) { return OY + y * SC; }

  map.enter = function (opts) {
    map.back = opts.back || { mode: 'hyper' };
    SF.ui.setMenu('GALAXY STARMAP', [
      { key: 'M', label: 'Close starmap', fn: close },
    ], { nav: false });
  };

  function close() {
    const b = map.back;
    if (b.mode === 'system') SF.setMode('system', { sysId: b.sysId, resume: true });
    else if (b.mode === 'starport') SF.setMode('starport', { resume: true });
    else SF.setMode('hyper', {});
  }

  map.update = function () {};

  map.draw = function (ctx) {
    const s = SF.s;
    ctx.fillStyle = '#02020a';
    ctx.fillRect(0, 0, 640, 400);

    // coordinate grid every 50 units
    ctx.strokeStyle = '#101a2c';
    ctx.fillStyle = '#2a3a52';
    ctx.font = '9px monospace';
    for (let gx = 0; gx <= SF.HYPER_W; gx += 50) {
      ctx.beginPath(); ctx.moveTo(mx(gx), my(0)); ctx.lineTo(mx(gx), my(SF.HYPER_H)); ctx.stroke();
      ctx.fillText(String(gx), mx(gx) + 2, my(0) + 9);
    }
    for (let gy = 0; gy <= SF.HYPER_H; gy += 50) {
      ctx.beginPath(); ctx.moveTo(mx(0), my(gy)); ctx.lineTo(mx(SF.HYPER_W), my(gy)); ctx.stroke();
      ctx.fillText(String(gy), mx(0) - 22, my(gy) + 3);
    }
    ctx.strokeStyle = '#23344e';
    ctx.strokeRect(mx(0), my(0), SF.HYPER_W * SC, SF.HYPER_H * SC);

    // race territories
    for (const id of Object.keys(SF.data.RACES)) {
      const race = SF.data.RACES[id];
      const t = race.territory;
      if (!t.r) continue;
      ctx.strokeStyle = race.color;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(mx(t.x), my(t.y), t.r * SC, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = race.color;
      ctx.font = '10px monospace';
      ctx.fillText(race.name.toUpperCase() + ' SPACE', mx(t.x) - 28, my(t.y) - t.r * SC - 3);
      ctx.globalAlpha = 1;
    }

    // systems: charted ones get names and flare rings, uncharted stay dim
    for (const sys of SF.galaxy.systems) {
      const px = mx(sys.x), py = my(sys.y);
      const charted = !!s.visited[sys.id];
      ctx.fillStyle = charted ? sys.color : '#3a4252';
      ctx.beginPath();
      ctx.arc(px, py, charted ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
      if (charted) {
        if (sys.flare) {
          ctx.strokeStyle = '#ff4040';
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = '#7a8aa8';
        ctx.font = '9px monospace';
        ctx.fillText(sys.name, px + 6, py + 3);
      }
    }

    // story markers
    marker(ctx, 125, 100, '#40e0d0', 'ARTH (HOME)');
    if (s.flags.eggCoords && !s.flags.egg) marker(ctx, 199, 33, '#f0d040', 'EGG 199,33');
    if (s.flags.crystalCoords && !s.flags.won) marker(ctx, 42, 178, '#60e0e0', 'CRYSTAL 42,178');

    // your ship
    const px = mx(s.hx), py = my(s.hy);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(px - 6, py); ctx.lineTo(px + 6, py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, py - 6); ctx.lineTo(px, py + 6); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.fillText('YOU ' + Math.round(s.hx) + ',' + Math.round(s.hy), px + 7, py - 6);

    // legend
    const charted = SF.galaxy.systems.filter(sys => s.visited[sys.id]).length;
    ctx.fillStyle = '#607090';
    ctx.font = '12px monospace';
    ctx.fillText('GALAXY STARMAP — ' + charted + '/' + SF.galaxy.systems.length +
      ' systems charted.  Red ring = flaring sun.  [M] to close.', 10, 394);
  };

  function marker(ctx, x, y, color, label) {
    ctx.strokeStyle = color;
    ctx.strokeRect(mx(x) - 5, my(y) - 5, 10, 10);
    ctx.fillStyle = color;
    ctx.font = '9px monospace';
    ctx.fillText(label, mx(x) + 8, my(y) - 4);
  }
})();
