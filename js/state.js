// Game state: creation, derived stats, cargo math, time, save/load.
SF.s = null;
SF.SAVE_KEY = 'sf_clone_save';

SF.newCrewMember = function (raceId, baseSkill) {
  const names = SF.data.CREW_NAMES[raceId];
  const name = names[Math.floor(Math.random() * names.length)];
  const skills = {};
  for (const sk of Object.keys(SF.data.CREW_RACES[raceId].caps)) {
    const cap = SF.data.CREW_RACES[raceId].caps[sk];
    skills[sk] = Math.min(cap, baseSkill + Math.floor(Math.random() * 15));
  }
  return { name: name, race: raceId, skills: skills, vitality: 100 };
};

SF.newState = function () {
  const crew = {};
  for (const role of SF.data.ROLES) crew[role] = SF.newCrewMember('human', 15);
  crew.captain.name = 'You';
  return {
    version: 1,
    day: 0,
    credits: 12000,
    ship: {
      name: 'ISS Fearless',
      engine: 1, shield: 0, armor: 0, laser: 1, missile: 0, pods: 0,
      hull: 50, hullMax: 50,
      fuel: 60,
      cargo: {},
      lifeforms: 0,
    },
    crew: crew,
    hx: 125, hy: 100,            // hyperspace position
    flags: { rel: {} },          // story flags + race relations
    visited: { arth: true },     // systems seen on the map
    fluxes: {},                  // discovered continuum fluxes (by index)
    kills: 0,
    earnings: 0,
  };
};

// ------------------------------------------------------------ derived stats
SF.fuelMax = function (s) { return 50 + s.ship.engine * 10; };
SF.cargoMax = function (s) { return 250 + s.ship.pods * 250; };

SF.cargoUsed = function (s) {
  let total = 0;
  for (const k of Object.keys(s.ship.cargo)) total += s.ship.cargo[k];
  return total;
};

SF.skill = function (s, role) {
  const member = s.crew[role];
  const skillName = SF.data.ROLE_SKILL[role];
  if (!member || !skillName) return 0;
  return member.vitality > 0 ? member.skills[skillName] : 0;
};

// fuel cost per unit of hyperspace distance, reduced by navigation skill
SF.fuelPerDist = function (s) {
  return 0.06 * (1 - SF.skill(s, 'navigation') * 0.003);
};

// ----------------------------------------------------------------- mutators
SF.addCargo = function (s, mineralId, qty) {
  const space = SF.cargoMax(s) - SF.cargoUsed(s);
  const added = Math.max(0, Math.min(qty, space));
  if (added > 0) s.ship.cargo[mineralId] = (s.ship.cargo[mineralId] || 0) + added;
  return added;
};

SF.earn = function (s, amount) {
  s.credits += amount;
  s.earnings += amount;
};

SF.spend = function (s, amount) {
  if (s.credits < amount) return false;
  s.credits -= amount;
  return true;
};

// Time passing also lets the engineer patch the hull and the doctor treat
// the crew — slow, free background repair.
SF.advanceDays = function (s, days) {
  s.day += days;
  const engRepair = days * SF.skill(s, 'engineering') * 0.05;
  s.ship.hull = Math.min(s.ship.hullMax, s.ship.hull + engRepair);
  const medHeal = days * SF.skill(s, 'doctor') * 0.1;
  for (const role of SF.data.ROLES) {
    const m = s.crew[role];
    if (m && m.vitality > 0) m.vitality = Math.min(100, m.vitality + medHeal);
  }
};

SF.dateString = function (s) {
  return '4620 + ' + Math.floor(s.day) + ' days';
};

// ---------------------------------------------------------------- save/load
SF.saveGame = function () {
  try {
    localStorage.setItem(SF.SAVE_KEY, JSON.stringify(SF.s));
    return true;
  } catch (e) {
    return false;
  }
};

SF.loadGame = function () {
  try {
    const raw = localStorage.getItem(SF.SAVE_KEY);
    if (!raw) return false;
    SF.s = JSON.parse(raw);
    return true;
  } catch (e) {
    return false;
  }
};

SF.hasSave = function () {
  try {
    return !!localStorage.getItem(SF.SAVE_KEY);
  } catch (e) {
    return false;
  }
};
