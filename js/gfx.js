// Procedural drawing helpers — gradient-shaded spheres, glowing stars,
// ship sprites, nebulae, parallax starfields. No image assets; everything
// is drawn from seeds so it's deterministic.
SF.VW = 960;
SF.VH = 600;
SF.gfx = {};

// Glowing star: halo, core, diffraction glints. flare adds an angry pulse.
SF.gfx.star = function (ctx, x, y, r, color, flare) {
  const halo = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3);
  halo.addColorStop(0, color);
  halo.addColorStop(0.35, color + '');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  const core = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.5, color);
  core.addColorStop(1, color);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(x - r * 2.4, y); ctx.lineTo(x + r * 2.4, y);
  ctx.moveTo(x, y - r * 2.4); ctx.lineTo(x, y + r * 2.4);
  ctx.stroke();
  if (flare) {
    ctx.globalAlpha = 0.5 + Math.sin(SF.time * 7) * 0.3;
    ctx.strokeStyle = '#ff5030';
    ctx.beginPath();
    ctx.arc(x, y, r * 1.7 + Math.sin(SF.time * 5) * r * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
};

// Shaded planet sphere: lit upper-left, mottled surface, dark terminator.
// opts: { bands (gas giant stripes), ring, atmo (atmosphere glow color) }
SF.gfx.planetSphere = function (ctx, x, y, r, colors, seed, opts) {
  opts = opts || {};
  const rng = SF.mulberry32(seed);
  if (opts.ring) {
    ctx.save();
    ctx.strokeStyle = colors[2];
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.7, r * 0.45, -0.35, Math.PI * 0.05, Math.PI * 0.95);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const base = ctx.createRadialGradient(x - r * 0.45, y - r * 0.45, r * 0.1, x, y, r * 1.15);
  base.addColorStop(0, colors[3]);
  base.addColorStop(0.55, colors[2]);
  base.addColorStop(1, colors[0]);
  ctx.fillStyle = base;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  if (opts.bands) {
    for (let i = 0; i < 7; i++) {
      ctx.globalAlpha = 0.16 + rng() * 0.18;
      ctx.fillStyle = colors[SF.randInt(rng, 0, 3)];
      const by = y - r + (i / 7) * 2 * r + rng() * r * 0.1;
      ctx.fillRect(x - r, by, r * 2, r * (0.12 + rng() * 0.16));
    }
  } else {
    const blobs = Math.max(10, Math.floor(r * 1.1));
    for (let i = 0; i < blobs; i++) {
      const ang = rng() * Math.PI * 2;
      const rr = Math.sqrt(rng()) * r * 0.95;
      ctx.globalAlpha = 0.10 + rng() * 0.16;
      ctx.fillStyle = colors[SF.randInt(rng, 0, 3)];
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr,
        2 + rng() * r * 0.22, 1.5 + rng() * r * 0.09, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  const shade = ctx.createRadialGradient(x + r * 0.55, y + r * 0.45, r * 0.15, x + r * 0.2, y + r * 0.15, r * 1.45);
  shade.addColorStop(0, 'rgba(0,0,8,0)');
  shade.addColorStop(0.55, 'rgba(0,0,8,0.25)');
  shade.addColorStop(1, 'rgba(0,0,8,0.88)');
  ctx.fillStyle = shade;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
  if (opts.atmo) {
    ctx.save();
    ctx.strokeStyle = opts.atmo;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.beginPath();
    ctx.arc(x, y, r * 1.04, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

// Ship sprite: swept hull with gradient, cockpit, engine glow under thrust.
SF.gfx.ship = function (ctx, x, y, ang, sc, color, thrust) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(sc, sc);
  if (thrust) {
    const glow = ctx.createRadialGradient(-11, 0, 1, -11, 0, 9);
    glow.addColorStop(0, '#ffd060');
    glow.addColorStop(0.5, 'rgba(255,120,40,0.7)');
    glow.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(-11, 0, 9 + Math.sin(SF.time * 30) * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const hull = ctx.createLinearGradient(0, -8, 0, 8);
  hull.addColorStop(0, '#ffffff');
  hull.addColorStop(0.5, color);
  hull.addColorStop(1, '#101828');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(2, -4);
  ctx.lineTo(-5, -9);
  ctx.lineTo(-9, -8);
  ctx.lineTo(-7, -3);
  ctx.lineTo(-9, 0);
  ctx.lineTo(-7, 3);
  ctx.lineTo(-9, 8);
  ctx.lineTo(-5, 9);
  ctx.lineTo(2, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.fillStyle = '#bfeaff';
  ctx.beginPath();
  ctx.arc(6, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// Soft nebula blobs for backgrounds, seeded and static.
SF.gfx.nebula = function (ctx, seed, palette) {
  const rng = SF.mulberry32(seed);
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const x = rng() * SF.VW, y = rng() * SF.VH;
    const r = 120 + rng() * 260;
    const g = ctx.createRadialGradient(x, y, 10, x, y, r);
    const col = palette[SF.randInt(rng, 0, palette.length - 1)];
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.10 + rng() * 0.08;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

// Parallax starfield: world-locked points that scroll with (ox, oy).
SF.gfx.starfield = function (ctx, seed, ox, oy, count, parallax, color, size) {
  const rng = SF.mulberry32(seed);
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const bx = rng() * SF.VW, by = rng() * SF.VH;
    const px = ((bx - ox * parallax) % SF.VW + SF.VW) % SF.VW;
    const py = ((by - oy * parallax) % SF.VH + SF.VH) % SF.VH;
    ctx.globalAlpha = 0.3 + rng() * 0.7;
    ctx.fillRect(px, py, size, size);
  }
  ctx.globalAlpha = 1;
};

// Course/destination crosshair.
SF.gfx.crosshair = function (ctx, x, y, color, label) {
  ctx.save();
  ctx.strokeStyle = color;
  const r = 9 + Math.sin(SF.time * 5) * 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - r - 5, y); ctx.lineTo(x - r + 3, y);
  ctx.moveTo(x + r - 3, y); ctx.lineTo(x + r + 5, y);
  ctx.moveTo(x, y - r - 5); ctx.lineTo(x, y - r + 3);
  ctx.moveTo(x, y + r - 3); ctx.lineTo(x, y + r + 5);
  ctx.stroke();
  if (label) {
    ctx.fillStyle = color;
    ctx.font = '11px monospace';
    ctx.fillText(label, x + r + 8, y + 4);
  }
  ctx.restore();
};

// Translucent HUD strip along the bottom of the viewport.
SF.gfx.hudBar = function (ctx, text) {
  ctx.fillStyle = 'rgba(4,8,18,0.72)';
  ctx.fillRect(0, SF.VH - 26, SF.VW, 26);
  ctx.fillStyle = '#7e96b8';
  ctx.font = '13px monospace';
  ctx.fillText(text, 12, SF.VH - 8);
};
