// Boot, mode dispatch, keyboard handling, game loop, title/win/gameover.
SF.time = 0;
SF.keys = {};
SF.mode = null;
SF.modeName = '';

SF.setMode = function (name, opts) {
  SF.modeName = name;
  SF.mode = SF.modes[name];
  SF.mode.enter(opts || {});
  SF.ui.setStatus();
};

// ------------------------------------------------------------------- title
(function () {
  const title = {};
  SF.modes.title = title;

  title.enter = function () {
    const items = [{ key: 'N', label: 'New Game', fn: newGame }];
    if (SF.hasSave()) items.push({ key: 'C', label: 'Continue saved game', fn: continueGame });
    SF.ui.setMenu('STARFLIGHT', items);
    SF.ui.log('Welcome aboard, Captain. Arrow keys / WASD fly the ship; bracketed letters work the menus.');
  };

  function newGame() {
    SF.s = SF.newState();
    SF.setMode('starport', {});
  }

  function continueGame() {
    if (!SF.loadGame()) { SF.ui.log('Save data unreadable.', 'warn'); return; }
    SF.ui.log('Save loaded. Resuming at Starport Arth.', 'good');
    SF.setMode('starport', {});
  }

  title.update = function () {};

  title.draw = function (ctx) {
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, SF.VW, SF.VH);
    SF.gfx.nebula(ctx, 31, ['#3a1a5a', '#15355f', '#5a1a30']);
    SF.gfx.starfield(ctx, 11, 0, 0, 220, 0, '#aabbdd', 2);
    // a flaring sun and a doomed world set the scene
    SF.gfx.star(ctx, 720, 150, 38, '#ffe060', true);
    SF.gfx.planetSphere(ctx, 250, 420, 120, SF.data.PLANET_TYPES.jungle.colors, 77, { atmo: 'rgba(120,200,255,0.5)' });
    ctx.fillStyle = '#40e0d0';
    ctx.font = 'bold 76px monospace';
    ctx.shadowColor = '#40e0d0';
    ctx.shadowBlur = 22;
    ctx.fillText('STARFLIGHT', 245, 200);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f0d040';
    ctx.font = '19px monospace';
    ctx.fillText('a one-shot tribute to the 1986 classic', 285, 240);
    ctx.fillStyle = '#8aa0c0';
    ctx.font = '15px monospace';
    ctx.fillText('The suns are flaring. The colonies are burning.', 300, 310);
    ctx.fillText('Find out why. Make some money along the way.', 305, 334);
    ctx.fillStyle = '#56708e';
    ctx.font = '13px monospace';
    ctx.fillText('keyboard or mouse — click menu buttons, click space to fly', 290, 560);
  };
})();

// ---------------------------------------------------------------- endings
(function () {
  const over = {};
  SF.modes.gameover = over;

  over.enter = function (opts) {
    over.reason = opts.reason || 'Your ship was lost.';
    SF.ui.log('*** ' + over.reason + ' ***', 'bad');
    SF.ui.setMenu('GAME OVER', [
      { key: 'C', label: 'Reload last save', fn: function () {
        if (SF.loadGame()) SF.setMode('starport', {});
        else SF.setMode('title', {});
      } },
      { key: 'N', label: 'New game', fn: function () { SF.s = SF.newState(); SF.setMode('starport', {}); } },
    ]);
  };
  over.update = function () {};
  over.draw = function (ctx) {
    ctx.fillStyle = '#100004';
    ctx.fillRect(0, 0, SF.VW, SF.VH);
    SF.gfx.nebula(ctx, 66, ['#5a1010', '#3a1a20', '#401030']);
    SF.gfx.starfield(ctx, 12, 0, 0, 140, 0, '#886677', 2);
    ctx.fillStyle = '#ff4040';
    ctx.font = 'bold 56px monospace';
    ctx.shadowColor = '#ff2020';
    ctx.shadowBlur = 18;
    ctx.fillText('SHIP DESTROYED', 215, 250);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#a08080';
    ctx.font = '15px monospace';
    ctx.fillText(over.reason, 215, 320);
  };

  const win = {};
  SF.modes.win = win;

  win.enter = function () {
    const s = SF.s;
    SF.saveGame();
    SF.ui.log('THE FLARES HAVE STOPPED. You did it, Captain.', 'hdr');
    SF.ui.setMenu('VICTORY', [
      { key: 'C', label: 'Keep flying (free play)', fn: function () {
        SF.setMode('system', { sysId: 'heart', fromPlanetSlot: 0 });
      } },
    ]);
  };
  win.update = function () {};
  win.draw = function (ctx) {
    const s = SF.s;
    ctx.fillStyle = '#000018';
    ctx.fillRect(0, 0, SF.VW, SF.VH);
    SF.gfx.nebula(ctx, 99, ['#105a5a', '#1a3a6a', '#3a5a20']);
    const rng = SF.mulberry32(99);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = ['#60e0e0', '#f0d040', '#ffffff', '#80ffc0'][SF.randInt(rng, 0, 3)];
      ctx.globalAlpha = 0.4 + rng() * 0.6;
      ctx.fillRect(SF.randInt(rng, 0, SF.VW - 1), SF.randInt(rng, 0, SF.VH - 1), 2, 2);
    }
    ctx.globalAlpha = 1;
    // the shattered crystal world
    SF.gfx.star(ctx, 480, 170, 30 + Math.sin(SF.time * 2) * 4, '#80f0f0', false);
    ctx.fillStyle = '#60e0e0';
    ctx.font = 'bold 50px monospace';
    ctx.shadowColor = '#40e0d0';
    ctx.shadowBlur = 20;
    ctx.fillText('THE SECTOR IS SAVED', 185, 300);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d0e0f0';
    ctx.font = '17px monospace';
    ctx.fillText('The crystal world is shattered. The suns grow calm.', 230, 350);
    ctx.fillText('Days elapsed: ' + Math.floor(s.day), 230, 400);
    ctx.fillText('Lifetime earnings: ' + SF.ui.fmt(s.earnings) + ' cr', 230, 426);
    ctx.fillText('Hostiles destroyed: ' + s.kills, 230, 452);
    ctx.fillStyle = '#f0d040';
    ctx.font = 'bold 19px monospace';
    ctx.fillText('FINAL SCORE: ' + SF.ui.fmt(Math.max(0, 100000 - Math.floor(s.day) * 100) + s.earnings + s.kills * 500), 230, 500);
  };
})();

// -------------------------------------------------------------------- boot
SF.boot = function () {
  SF.generateGalaxy();
  const canvas = document.getElementById('canvas');
  SF.ctx = canvas.getContext('2d');

  window.addEventListener('keydown', function (e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    SF.keys[e.key] = true;
    if (SF.ui.menuKey(e)) return;
    if (SF.mode && SF.mode.key) SF.mode.key(e);
  });
  window.addEventListener('keyup', function (e) {
    SF.keys[e.key] = false;
  });

  // mouse: clicks route to the active mode in canvas coordinates
  function canvasXY(e) {
    const rect = canvas.getBoundingClientRect();
    if (!rect || !rect.width) return null;
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }
  canvas.addEventListener('click', function (e) {
    const p = canvasXY(e);
    if (p && SF.mode && SF.mode.click) SF.mode.click(p.x, p.y);
  });
  canvas.addEventListener('mousemove', function (e) {
    SF.mouse = canvasXY(e);
  });

  SF.setMode('title', {});
  SF._statusClock = 0;
  SF._last = 0;
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(SF.frame);
};

SF.frame = function (ts) {
  const dt = Math.min(0.1, (ts - SF._last) / 1000 || 0.016);
  SF._last = ts;
  SF.tick(dt);
  requestAnimationFrame(SF.frame);
};

// One simulation step — also called directly by the headless smoke test.
SF.tick = function (dt) {
  SF.time += dt;
  if (SF.mode) {
    SF.mode.update(dt);
    if (SF.mode && SF.mode.draw && SF.ctx) SF.mode.draw(SF.ctx);
  }
  SF._statusClock += dt;
  if (SF._statusClock > 0.5) {
    SF._statusClock = 0;
    SF.ui.setStatus();
  }
};

if (typeof document !== 'undefined' && document.readyState !== undefined) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SF.boot);
  } else {
    SF.boot();
  }
}
