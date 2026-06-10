// Full-screen galaxy starmap, reachable from hyperspace, any system, or
// the starport. Shows charted systems, race territories, flare activity,
// discovered fluxes, story markers, and your position. Click anywhere to
// lay in an autopilot course (flown next time you're in hyperspace).
(function () {
  const map = {};
  SF.modes.starmap = map;

  const SC = 2.7, OX = 150, OY = 16; // 250x200 world -> 675x540 px

  function mx(x) { return OX + x * SC; }
  function my(y) { return OY + y * SC; }

  map.enter = function (opts) {
    map.back = opts.back || { mode: 'hyper' };
    SF.ui.setMenu('GALAXY STARMAP', [
      { key: 'M', label: 'Close starmap', fn: close },
      { key: 'C', label: 'Clear course', fn: function () {
        SF.s.course = null;
        SF.ui.log('Course cleared.');
      } },
    ], { nav: false });
  };

  function close() {
    const b = map.back;
    if (b.mode === 'system') SF.setMode('system', { sysId: b.sysId, resume: true });
    else if (b.mode === 'starport') SF.setMode('starport', { resume: true });
    else SF.setMode('hyper', {});
  }

  map.click = function (px, py) {
    const s = SF.s;
    let wx = (px - OX) / SC, wy = (py - OY) / SC;
    if (wx < -10 || wx > SF.HYPER_W + 10 || wy < -10 || wy > SF.HYPER_H + 10) return;
    const near = SF.galaxy.systems.find(sys =>
      Math.hypot(mx(sys.x) - px, my(sys.y) - py) < 12);
    if (near) { wx = near.x; wy = near.y; }
    s.course = {
      x: Math.max(0, Math.min(SF.HYPER_W, wx)),
      y: Math.max(0, Math.min(SF.HYPER_H, wy)),
    };
    SF.ui.log('Course laid in: ' + Math.round(s.course.x) + ',' + Math.round(s.course.y) +
      (near ? ' (' + (s.visited[near.id] ? near.name : 'uncharted star') + ')' : '') +
      '. Autopilot will fly it in hyperspace.', 'good');
  };

  map.update = function () {};

  map.draw = function (ctx) {
    const s = SF.s;
    ctx.fillStyle = '#02020a';
    ctx.fillRect(0, 0, SF.VW, SF.VH);
    SF.gfx.starfield(ctx, 41, 0, 0, 130, 0, '#1c2438', 2);

    // coordinate grid every 50 units
    ctx.strokeStyle = '#101a2c';
    ctx.fillStyle = '#3a4a66';
    ctx.font = '10px monospace';
    for (let gx = 0; gx <= SF.HYPER_W; gx += 50) {
      ctx.beginPath(); ctx.moveTo(mx(gx), my(0)); ctx.lineTo(mx(gx), my(SF.HYPER_H)); ctx.stroke();
      ctx.fillText(String(gx), mx(gx) + 3, my(0) + 11);
    }
    for (let gy = 0; gy <= SF.HYPER_H; gy += 50) {
      ctx.beginPath(); ctx.moveTo(mx(0), my(gy)); ctx.lineTo(mx(SF.HYPER_W), my(gy)); ctx.stroke();
      ctx.fillText(String(gy), mx(0) - 26, my(gy) + 4);
    }
    ctx.strokeStyle = '#23344e';
    ctx.strokeRect(mx(0), my(0), SF.HYPER_W * SC, SF.HYPER_H * SC);

    // race territories: tinted discs with labels
    for (const id of Object.keys(SF.data.RACES)) {
      const race = SF.data.RACES[id];
      const t = race.territory;
      if (!t.r) continue;
      const g = ctx.createRadialGradient(mx(t.x), my(t.y), 4, mx(t.x), my(t.y), t.r * SC);
      g.addColorStop(0, race.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mx(t.x), my(t.y), t.r * SC, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = race.color;
      ctx.stroke();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = race.color;
      ctx.font = '11px monospace';
      ctx.fillText(race.name.toUpperCase() + ' SPACE', mx(t.x) - 34, my(t.y) - t.r * SC - 5);
      ctx.restore();
    }

    // systems
    for (const sys of SF.galaxy.systems) {
      const px = mx(sys.x), py = my(sys.y);
      const charted = !!s.visited[sys.id];
      if (charted) {
        const g = ctx.createRadialGradient(px, py, 1, px, py, 8);
        g.addColorStop(0, sys.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = sys.color;
        ctx.beginPath(); ctx.arc(px, py, 2.6, 0, Math.PI * 2); ctx.fill();
        if (sys.flare) {
          ctx.strokeStyle = '#ff4040';
          ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = '#8a9ab8';
        ctx.font = '10px monospace';
        ctx.fillText(sys.name, px + 8, py + 4);
      } else {
        ctx.fillStyle = '#3a4252';
        ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }

    // discovered continuum fluxes: matching numbers joined by a faint thread
    for (let i = 0; i < SF.galaxy.fluxes.length; i++) {
      if (!(s.fluxes || {})[i]) continue;
      const f = SF.galaxy.fluxes[i];
      ctx.strokeStyle = '#c060ff';
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.moveTo(mx(f.ax), my(f.ay));
      ctx.lineTo(mx(f.bx), my(f.by));
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#c060ff';
      ctx.font = '11px monospace';
      for (const end of [{ x: f.ax, y: f.ay }, { x: f.bx, y: f.by }]) {
        ctx.beginPath();
        ctx.arc(mx(end.x), my(end.y), 3.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText('F' + (i + 1), mx(end.x) + 6, my(end.y) - 5);
      }
    }

    // story markers
    marker(ctx, 125, 100, '#40e0d0', 'ARTH (HOME)');
    if (s.flags.eggCoords && !s.flags.egg) marker(ctx, 199, 33, '#f0d040', 'EGG 199,33');
    if (s.flags.crystalCoords && !s.flags.won) marker(ctx, 42, 178, '#60e0e0', 'CRYSTAL 42,178');

    // course
    if (s.course) {
      ctx.save();
      ctx.strokeStyle = 'rgba(80,208,128,0.5)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(mx(s.hx), my(s.hy));
      ctx.lineTo(mx(s.course.x), my(s.course.y));
      ctx.stroke();
      ctx.restore();
      SF.gfx.crosshair(ctx, mx(s.course.x), my(s.course.y), '#50d080', 'course');
    }

    // your ship
    const px = mx(s.hx), py = my(s.hy);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(px - 7, py); ctx.lineTo(px + 7, py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px, py - 7); ctx.lineTo(px, py + 7); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText('YOU ' + Math.round(s.hx) + ',' + Math.round(s.hy), px + 9, py - 7);

    const charted = SF.galaxy.systems.filter(sys => s.visited[sys.id]).length;
    const fluxCount = Object.keys(s.fluxes || {}).length;
    SF.gfx.hudBar(ctx, 'GALAXY STARMAP — ' + charted + '/' + SF.galaxy.systems.length +
      ' systems, ' + fluxCount + '/' + SF.galaxy.fluxes.length +
      ' fluxes charted.  Click to lay in a course.  Red ring = flare. F# = flux pair.  [M] close.');
  };

  function marker(ctx, x, y, color, label) {
    ctx.strokeStyle = color;
    ctx.strokeRect(mx(x) - 6, my(y) - 6, 12, 12);
    ctx.fillStyle = color;
    ctx.font = '10px monospace';
    ctx.fillText(label, mx(x) + 9, my(y) - 5);
  }
})();
