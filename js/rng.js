// Seeded RNG (mulberry32) and helpers. All world generation flows through
// these so the galaxy is identical every run — dialogue can safely quote
// coordinates that were generated procedurally.
window.SF = {};

SF.mulberry32 = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

SF.randInt = function (rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
};

SF.pick = function (rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
};

SF.chance = function (rng, p) {
  return rng() < p;
};

SF.shuffle = function (rng, arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
