// Procedural galaxy. Hyperspace is a 250x200 grid. Three scripted systems
// anchor the story: Arth (home starport), Ossix (Black Egg), Heart (crystal
// world). Everything else is seeded-random but identical every run.
SF.galaxy = { systems: [], byId: {} };

SF.HYPER_W = 250;
SF.HYPER_H = 200;

(function () {
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  function slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  function planetType(rng, starClass, slot, count) {
    const frac = count > 1 ? slot / (count - 1) : 0.5;
    const hot = starClass === 'B' || starClass === 'F';
    if (frac < 0.3) return SF.pick(rng, hot ? ['molten', 'molten', 'rock'] : ['molten', 'rock', 'desert']);
    if (frac < 0.65) return SF.pick(rng, ['rock', 'desert', 'ocean', 'jungle', 'rock']);
    return SF.pick(rng, ['ice', 'gas', 'gas', 'rock', 'ice']);
  }

  function makePlanet(rng, sys, slot, count) {
    const typeId = planetType(rng, sys.starClass, slot, count);
    const type = SF.data.PLANET_TYPES[typeId];
    const rich = Math.min(3, Math.round(SF.randInt(rng, 0, 3) * type.richMul));
    return {
      name: sys.name + ' ' + ROMAN[slot],
      slot: slot,
      type: typeId,
      size: SF.randInt(rng, 3, 9),
      orbit: 16 + slot * 13 + SF.randInt(rng, -3, 3),
      angle: rng() * Math.PI * 2,
      gravity: typeId === 'gas' ? 4 : Math.round((0.3 + rng() * 2.2) * 10) / 10,
      rich: rich,
      bio: SF.randInt(rng, 0, type.bioMax),
      ruins: false,
      special: null,
      seed: SF.randInt(rng, 1, 2 ** 30),
    };
  }

  function makeSystem(rng, name, x, y, opts) {
    const starClass = opts.starClass || SF.pick(rng, SF.data.STAR_CLASSES).id;
    const sc = SF.data.STAR_CLASSES.find(s => s.id === starClass);
    const sys = {
      id: slug(name), name: name, x: x, y: y,
      starClass: starClass, color: sc.color, className: sc.name,
      flare: opts.flare !== undefined ? opts.flare : SF.chance(rng, 0.3),
      planets: [],
    };
    const count = opts.planetCount || SF.randInt(rng, 1, 6);
    for (let i = 0; i < count; i++) sys.planets.push(makePlanet(rng, sys, i, count));
    return sys;
  }

  SF.generateGalaxy = function () {
    const rng = SF.mulberry32(1986);
    const systems = [];

    // --- scripted systems ---
    const arth = makeSystem(rng, 'Arth', 125, 100, { starClass: 'G', flare: false, planetCount: 4 });
    arth.planets[1] = Object.assign(arth.planets[1], {
      name: 'Arth', type: 'jungle', size: 6, gravity: 1.0, rich: 1, bio: 2,
      ruins: false, special: 'starport',
    });
    systems.push(arth);

    const heart = makeSystem(rng, 'Heart', 42, 178, { starClass: 'B', flare: true, planetCount: 1 });
    heart.planets[0] = Object.assign(heart.planets[0], {
      name: 'The Crystal World', type: 'crystal', size: 9, gravity: 9.9,
      rich: 0, bio: 0, ruins: false, special: 'crystal',
    });
    systems.push(heart);

    const ossix = makeSystem(rng, 'Ossix', 199, 33, { starClass: 'G', flare: true, planetCount: 5 });
    ossix.planets[3] = Object.assign(ossix.planets[3], {
      name: 'Ossix IV', type: 'desert', size: 5, gravity: 1.2, rich: 2, bio: 1,
      ruins: true, special: 'egg',
    });
    systems.push(ossix);

    // --- random systems ---
    const names = SF.shuffle(rng, SF.data.STAR_NAMES);
    let attempts = 0;
    while (systems.length < 46 && attempts < 4000) {
      attempts++;
      const x = SF.randInt(rng, 12, SF.HYPER_W - 12);
      const y = SF.randInt(rng, 12, SF.HYPER_H - 12);
      if (systems.some(s => Math.hypot(s.x - x, s.y - y) < 15)) continue;
      systems.push(makeSystem(rng, names.pop(), x, y, {}));
    }

    // Sprinkle ruins on landable rocky-ish worlds so the tablet is findable
    // in several places, with one guaranteed close to Arth.
    let ruinCount = 0;
    for (const sys of systems) {
      for (const p of sys.planets) {
        if (p.special || !SF.data.PLANET_TYPES[p.type].landable) continue;
        if (SF.chance(rng, 0.12)) { p.ruins = true; ruinCount++; }
      }
    }
    const nearArth = systems
      .filter(s => s.id !== 'arth' && Math.hypot(s.x - 125, s.y - 100) < 45)
      .sort((a, b) => Math.hypot(a.x - 125, a.y - 100) - Math.hypot(b.x - 125, b.y - 100));
    for (const sys of nearArth) {
      const cand = sys.planets.find(p => SF.data.PLANET_TYPES[p.type].landable && !p.special);
      if (cand) { cand.ruins = true; break; }
    }

    SF.galaxy.systems = systems;
    SF.galaxy.byId = {};
    systems.forEach(s => { SF.galaxy.byId[s.id] = s; });
  };
})();
