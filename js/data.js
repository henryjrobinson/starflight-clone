// Static game data: minerals, ship parts, planet types, alien races,
// star names, crew races, starport notices.
SF.data = {};

// ---------------------------------------------------------------- minerals
SF.data.MINERALS = [
  { id: 'iron',      name: 'Iron',      price: 3,   weight: 30, color: '#b07050' },
  { id: 'lead',      name: 'Lead',      price: 2,   weight: 25, color: '#8888a0' },
  { id: 'nickel',    name: 'Nickel',    price: 4,   weight: 22, color: '#a8a890' },
  { id: 'magnesium', name: 'Magnesium', price: 5,   weight: 20, color: '#d0d0d0' },
  { id: 'copper',    name: 'Copper',    price: 6,   weight: 20, color: '#d08030' },
  { id: 'zinc',      name: 'Zinc',      price: 7,   weight: 18, color: '#c0c0d8' },
  { id: 'tin',       name: 'Tin',       price: 8,   weight: 16, color: '#b8b8b8' },
  { id: 'aluminum',  name: 'Aluminum',  price: 9,   weight: 16, color: '#e0e0e8' },
  { id: 'chromium',  name: 'Chromium',  price: 10,  weight: 14, color: '#90e0e0' },
  { id: 'cobalt',    name: 'Cobalt',    price: 12,  weight: 12, color: '#5070e0' },
  { id: 'titanium',  name: 'Titanium',  price: 15,  weight: 10, color: '#c8d8e8' },
  { id: 'mercury',   name: 'Mercury',   price: 18,  weight: 8,  color: '#d8d8f0' },
  { id: 'silver',    name: 'Silver',    price: 20,  weight: 8,  color: '#f0f0f8' },
  { id: 'tungsten',  name: 'Tungsten',  price: 25,  weight: 6,  color: '#787888' },
  { id: 'gold',      name: 'Gold',      price: 40,  weight: 4,  color: '#f0d040' },
  { id: 'platinum',  name: 'Platinum',  price: 55,  weight: 3,  color: '#e8f0f0' },
  { id: 'uranium',   name: 'Uranium',   price: 75,  weight: 2,  color: '#80f060' },
  { id: 'rodnium',   name: 'Rodnium',   price: 110, weight: 1,  color: '#f060d0' },
  { id: 'endurium',  name: 'Endurium',  price: 400, weight: 0.4, color: '#60ff90' },
];
SF.data.MINERAL_BY_ID = {};
SF.data.MINERALS.forEach(m => { SF.data.MINERAL_BY_ID[m.id] = m; });

// -------------------------------------------------------------- ship parts
// prices[c] = full price of class c. Class 0 = not installed.
SF.data.PARTS = {
  engine:  { name: 'Engines',        prices: [0, 4000, 10000, 20000, 36000, 60000] },
  shield:  { name: 'Shields',        prices: [0, 4000, 10000, 20000, 38000, 60000] },
  armor:   { name: 'Armor Plating',  prices: [0, 2500, 6000, 14000, 26000, 42000] },
  laser:   { name: 'Laser Cannon',   prices: [0, 3000, 8000, 16000, 30000, 50000] },
  missile: { name: 'Missile System', prices: [0, 5000, 12000, 24000, 45000, 70000] },
};
SF.data.POD_PRICE = 2000;
SF.data.MAX_PODS = 5;
SF.data.FUEL_PRICE = 20;          // credits per fuel unit
SF.data.REPAIR_PRICE = 10;        // credits per hull point
SF.data.LIFEFORM_PRICE = 180;     // Science Institute pays per specimen
SF.data.HIRE_FEE = 500;
SF.data.TRAIN_FEE = 150;          // per +5 session
SF.data.HEAL_FEE = 100;           // full vitality restore at starport

// ----------------------------------------------------------- artifacts
// Usable relics recovered from non-story ruins (distinct from the story
// tablet/egg). Each grants a passive ship bonus; effects applied where
// relevant in combat and hyperspace fuel math. Owned once each.
SF.data.ARTIFACTS = [
  { id: 'shield_booster', name: 'Resonance Shield', desc: 'Ancient harmonics blunt incoming fire — combat damage taken reduced 15%.', effect: { damageMul: 0.85 } },
  { id: 'targeting_array', name: 'Seeker Lens', desc: 'A self-aligning optic steadies your aim — weapon hit chance +12%.', effect: { hitBonus: 0.12 } },
  { id: 'fuel_coil', name: 'Flux Coil', desc: 'A coil that folds space a little tighter — hyperspace fuel burn reduced 15%.', effect: { fuelMul: 0.85 } },
];

// ------------------------------------------------------------ planet types
SF.data.PLANET_TYPES = {
  molten: { name: 'Molten',     colors: ['#601000', '#a02800', '#e06010', '#ffd040'], richMul: 1.6, bioMax: 0, landable: true,  temp: 'searing' },
  rock:   { name: 'Rocky',      colors: ['#302828', '#5a4a3a', '#7a6a55', '#a89878'], richMul: 1.2, bioMax: 1, landable: true,  temp: 'cold' },
  desert: { name: 'Desert',     colors: ['#503810', '#906020', '#c09040', '#e8c878'], richMul: 1.0, bioMax: 2, landable: true,  temp: 'hot' },
  ocean:  { name: 'Oceanic',    colors: ['#002060', '#0048a0', '#3080d0', '#70c8e8'], richMul: 0.6, bioMax: 3, landable: true,  temp: 'temperate' },
  jungle: { name: 'Verdant',    colors: ['#103808', '#206818', '#40a030', '#80d060'], richMul: 0.8, bioMax: 3, landable: true,  temp: 'temperate' },
  ice:    { name: 'Frozen',     colors: ['#283048', '#5868a0', '#90a0d0', '#e0e8f8'], richMul: 1.0, bioMax: 1, landable: true,  temp: 'frigid' },
  gas:    { name: 'Gas Giant',  colors: ['#402060', '#7040a0', '#a070c8', '#d0a0e8'], richMul: 0,   bioMax: 0, landable: false, temp: 'crushing' },
  crystal:{ name: 'CRYSTALLINE',colors: ['#104040', '#20a0a0', '#60e0e0', '#e0ffff'], richMul: 0,   bioMax: 0, landable: false, temp: 'unknown' },
};

SF.data.STAR_CLASSES = [
  { id: 'M', color: '#ff6040', name: 'red dwarf' },
  { id: 'K', color: '#ffa040', name: 'orange star' },
  { id: 'G', color: '#ffe060', name: 'yellow star' },
  { id: 'F', color: '#f0f0f0', name: 'white star' },
  { id: 'B', color: '#80a0ff', name: 'blue giant' },
];

// ------------------------------------------------------------------- races
// territory: circle in hyperspace coords. Encounter odds rise inside it.
SF.data.RACES = {
  mechan: {
    name: 'Mechan', color: '#80c0ff', territory: { x: 135, y: 95, r: 28 },
    hostile: false, brave: true, freq: 0.10,
    ship: { hull: 40, shield: 1, armor: 1, laser: 1, missile: 0, agility: 1 },
    hail: {
      friendly: '"GREETINGS ORGANIC VESSEL. WE ARE MECHAN, CUSTODIANS OF THE OLD PROTOCOLS."',
      hostile: '"AGGRESSION SUBROUTINES ARMING. RECONSIDER, ORGANIC."',
      obsequious: '"YOUR SUBMISSION IS NOTED AND IRRELEVANT. STATE QUERY."',
    },
    topics: {
      themselves: '"WE WERE BUILT TO WAIT. OUR MAKERS DEPARTED LONG AGO. WE MAINTAIN. WE PATROL. WE WAIT."',
      others: '"THE SPEMIN LIE AS OTHERS BREATHE. THE ELOWAN REMEMBER MUCH. THE UHLEK CANNOT BE REASONED WITH — AVOID GRID SECTOR SOUTHWEST."',
      ancients: '"RECORDS REFERENCE A CRYSTAL WORLD OF THE ANCIENTS. COORDINATES NOT IN OUR ARCHIVE. THE SPEMIN TRADE IN RUMORS — FLATTER THEM."',
      flares: '"STELLAR INSTABILITY INCREASES 4.2% PER CYCLE. CAUSE: ARTIFICIAL. THE ANCIENTS\' DEVICE STIRS. SEEK RUINS, ORGANIC."',
    },
  },
  spemin: {
    name: 'Spemin', color: '#60ff60', territory: { x: 180, y: 140, r: 40 },
    hostile: false, brave: false, freq: 0.14,
    ship: { hull: 25, shield: 0, armor: 0, laser: 1, missile: 0, agility: 2 },
    hail: {
      friendly: '"What do you want, fleshy lump? The mighty Spemin are busy. Very busy. Doing... mighty things."',
      hostile: '"EEEEE! Hostile! Hostile! We surrender! Wait — do we? We might! State your terms!"',
      obsequious: '"Ohhh, it grovels! How delicious! Yes, yes, abase yourself further and the glorious Spemin may speak."',
    },
    topics: {
      themselves: '"The Spemin are the greatest race in the galaxy! Our blobs are the blobbiest, our lies the... er, our TRUTHS the truthiest."',
      others: '"The Thrynn are scaly bullies. The Elowan are walking salads. The Uhlek... we do not speak of the Uhlek."',
      ancients: '"Ancients? Never heard of them. Definitely never found their shiny crystal world. Nope."',
      ancients_grovel: '"Since you grovel so beautifully... the crystal world of the Ancients spins at 42,178. EVERYONE knows that. Now go away before the Uhlek eat you."',
      flares: '"The suns burn angry! A Spemin prophet said the galaxy is allergic to us. He was recycled."',
    },
  },
  elowan: {
    name: 'Elowan', color: '#40e080', territory: { x: 70, y: 60, r: 40 },
    hostile: false, brave: true, freq: 0.12,
    ship: { hull: 35, shield: 1, armor: 0, laser: 2, missile: 0, agility: 2 },
    hail: {
      friendly: '"Sunlight upon you, traveler. We are the Elowan, children of root and leaf. Speak, and be welcome."',
      hostile: '"Even a flower has thorns, stranger. Withdraw your aggression or feel them."',
      obsequious: '"Rise, friend. The Elowan do not require your bowing. Speak plainly."',
    },
    topics: {
      themselves: '"We grew toward the stars when our forests learned to dream. The Thrynn betrayed us long ago; we do not forget."',
      others: '"Trust not the Thrynn — their honeyed words hide fangs. The Mechan are honorable machines. Pity the Spemin; do not believe them."',
      ancients: '"The Ancients seeded the worlds and vanished. Their ruins whisper still. Bring us a relic of theirs, and we will read it for you."',
      ancients_tablet: '"The tablet you carry speaks truly. The heart of the Ancients — the crystal world — turns at 42,178. Beware: the Uhlek swarm guards it."',
      flares: '"Our forests burn beneath angry suns. The stars themselves are being poisoned. This is not nature\'s work."',
    },
  },
  thrynn: {
    name: 'Thrynn', color: '#e0d040', territory: { x: 160, y: 40, r: 45 },
    hostile: false, brave: true, freq: 0.12,
    ship: { hull: 55, shield: 2, armor: 1, laser: 2, missile: 1, agility: 2 },
    hail: {
      friendly: '"Sssoft-skin. You fly in Thrynn space. Speak quickly and perhaps profitably."',
      hostile: '"You bare your fangs at the Thrynn? Amusing. Brief, but amusing."',
      obsequious: '"Yesss. Grovel. The mammal knows its place. Speak."',
    },
    topics: {
      themselves: '"The Thrynn Empire endures. We trade, we expand, we remember our enemies. The Elowan slander us — weeds always rustle."',
      others: '"The Elowan are invasive vegetation. The Spemin are useful idiots. The Uhlek — even we avoid the southwest reaches."',
      ancients: '"The egg of night, mammal. The old texts say it alone can unmake the Ancients\' device. The ruins know where it sleeps. Why? What have you found?"',
      flares: '"Three Thrynn colony suns have flared this cycle. Our scientists scent design behind it. Find the cause and the Empire will not forget."',
    },
  },
  uhlek: {
    name: 'Uhlek', color: '#ff4060', territory: { x: 60, y: 170, r: 42 },
    hostile: true, brave: true, freq: 0.16,
    ship: { hull: 90, shield: 3, armor: 2, laser: 3, missile: 2, agility: 1 },
    hail: {
      friendly: 'The channel fills with a deafening psychic shriek. The Uhlek mind-horde does not negotiate.',
      hostile: 'The channel fills with a deafening psychic shriek. The Uhlek mind-horde does not negotiate.',
      obsequious: 'The channel fills with a deafening psychic shriek. The Uhlek mind-horde does not negotiate.',
    },
    topics: {},
  },
  renegade: {
    name: 'Renegade', color: '#c0c0c0', territory: { x: -999, y: -999, r: 0 },
    hostile: true, brave: false, freq: 0.04,
    ship: { hull: 35, shield: 1, armor: 1, laser: 2, missile: 1, agility: 3 },
    hail: {
      friendly: '"Well well. A fat little trader. Cargo and credits, captain, and we let you limp home."',
      hostile: '"Big talk. Let\'s see your hull back it up."',
      obsequious: '"Begging won\'t save your cargo. Nothing personal."',
    },
    topics: {
      themselves: '"We fly for no flag. The flares are cooking whole colonies — somebody\'s got to pick the bones."',
      others: '"Everybody\'s scared. Even the Thrynn pulled their patrols back. Whatever\'s waking up out there, it\'s big."',
      ancients: '"Heard a salvager found a tablet in some ruins and sold it for a fortune. Ruins are money, friend."',
      flares: '"Suns don\'t just flare on schedule. Somebody lit a fuse."',
    },
  },
  velox: {
    name: 'Velox', color: '#e0a040', territory: { x: 220, y: 100, r: 30 },
    hostile: false, brave: true, freq: 0.11,
    ship: { hull: 40, shield: 1, armor: 1, laser: 1, missile: 0, agility: 2 },
    hail: {
      friendly: '*click-whirr* "A new chassis approaches! The Velox greet you. Do you carry components? Tools? Anything that hums or sparks?"',
      hostile: '*angry buzzing* "You would scrap the Velox?! Our mandibles are SHARP, soft-thing!"',
      obsequious: '"Flattery is inefficient, but pleasant. Speak, polished one."',
    },
    topics: {
      themselves: '"We Velox build, unbuild, rebuild. A machine left alone is a machine improved. Your hull has seven inefficiencies — shall we list them?"',
      others: '"The Thrynn pay well for our work. The Spemin pay in lies. The Uhlek do not pay; they simply unmake. Avoid the southwest."',
      ancients: '"The Ancients were the finest engineers to ever live. We study their ruins like scripture. Bring us nothing — just admire, as we do."',
      flares: '"A sun is a reactor, and a reactor flaring on schedule means a hand on the control rod. This is engineering, not nature."',
    },
  },
  gazurtoid: {
    name: 'Gazurtoid', color: '#30c0a0', territory: { x: 110, y: 175, r: 28 },
    hostile: true, brave: true, freq: 0.13,
    ship: { hull: 70, shield: 2, armor: 1, laser: 3, missile: 1, agility: 1 },
    hail: {
      friendly: '"You breathe AIR. You are an abomination to the Deep. The Gazurtoid will cleanse you, dry-thing."',
      hostile: '"The tide rises. You drown now."',
      obsequious: '"Grovel all you wish, air-breather. The Deep does not forgive lungs."',
    },
    topics: {
      themselves: '"We are the faithful of the Ocean Eternal. All dry life is heresy to be washed away."',
      others: '"Every land-crawler is the same blasphemy. We do not distinguish our heresies."',
      ancients: '"The Ancients drained worlds to build their toys. For this alone they earned the Deep\'s hatred."',
      flares: '"The suns boil the oceans of the faithful. For this, every dry-world will answer."',
    },
  },
  humna: {
    name: 'Humna Humna', color: '#f070b0', territory: { x: 30, y: 110, r: 28 },
    hostile: false, brave: false, freq: 0.12,
    ship: { hull: 28, shield: 0, armor: 0, laser: 1, missile: 0, agility: 2 },
    hail: {
      friendly: '"BuyBuyBuy! Sell! Trade! The Humna Humna offer prices so good they are ALMOST honest! What do you carry, friend-with-credits?"',
      hostile: '"No no no, violence is bad for margins! We have a discount! Please! A DISCOUNT!"',
      obsequious: '"Ohhh a customer with MANNERS, very rare, very valuable, we like you already!"',
    },
    topics: {
      themselves: '"We Humna Humna buy low and sell highhh. Two mouths, one for talking, one for the deals. It is a metaphor. Mostly."',
      others: '"Thrynn drive a hard bargain. Elowan barely haggle, bless them. Spemin will swindle you, then themselves."',
      ancients: '"Ancient relics? Best margins in the galaxy! If you find one, you find ME first, yes? Yes."',
      flares: '"Bad for business, the flares! Whole markets, gone! Somebody is burning my customers!"',
    },
  },
};

// -------------------------------------------------------------- star names
SF.data.STAR_NAMES = [
  'Akteron', 'Beserk', 'Caldera', 'Dianthus', 'Eleusis', 'Fenrir', 'Gorgon',
  'Harkon', 'Ilmarinen', 'Jotun', 'Kestrel', 'Lumen', 'Midra', 'Nyx',
  'Oberon', 'Pellucid', 'Quorlal', 'Rigel Minor', 'Sarpedon', 'Tarsus',
  'Umbriel', 'Virelai', 'Wyrd', 'Xanthe', 'Ylem', 'Zosma', 'Akkad',
  'Brennen', 'Cetus', 'Drogheda', 'Erebus', 'Falx', 'Gilead', 'Hyperia',
  'Ixion', 'Jendara', 'Koryphon', 'Lazarus', 'Mossglen', 'Noctua',
  'Ophir', 'Pyxis', 'Quintain', 'Rendar', 'Selket', 'Tycho', 'Ursa Void',
  'Vantage', 'Wraith', 'Xeres', 'Yarrow', 'Zenith Reach',
];

// -------------------------------------------------------------- crew races
// caps: max trainable skill per discipline.
SF.data.CREW_RACES = {
  human:   { name: 'Human',   caps: { science: 80, navigation: 80, engineering: 80, communications: 80, medicine: 80 } },
  velox:   { name: 'Velox',   caps: { science: 70, navigation: 60, engineering: 100, communications: 50, medicine: 60 } },
  thrynn:  { name: 'Thrynn',  caps: { science: 60, navigation: 100, engineering: 70, communications: 60, medicine: 40 } },
  elowan:  { name: 'Elowan',  caps: { science: 100, navigation: 60, engineering: 50, communications: 95, medicine: 80 } },
  android: { name: 'Android', caps: { science: 85, navigation: 85, engineering: 95, communications: 30, medicine: 20 } },
};

SF.data.CREW_NAMES = {
  human: ['Reyes', 'Okafor', 'Tanaka', 'Volkov', 'Mbeki', 'Castile', 'Aldrin', 'Sorensen', 'Iqbal', 'Marsh'],
  velox: ['K\'tik', 'Zzrip', 'Chitik', 'Vrrex', 'Tk\'tk', 'Skrit'],
  thrynn: ['Sslass', 'Vyrith', 'Kassk', 'Drazzt', 'Ssarn'],
  elowan: ['Willowisp', 'Fernshade', 'Rootmind', 'Petalsong', 'Mossheart'],
  android: ['Unit-7', 'Cobalt-3', 'Vesper-9', 'Axiom-2', 'Lattice-5'],
};

SF.data.ROLES = ['captain', 'science', 'navigation', 'engineering', 'communications', 'doctor'];
SF.data.ROLE_SKILL = {
  captain: null, science: 'science', navigation: 'navigation',
  engineering: 'engineering', communications: 'communications', doctor: 'medicine',
};

// ------------------------------------------------------- starport notices
SF.data.notice = function (flags) {
  if (flags.won) {
    return 'INTERSTEL BULLETIN: The flares have ceased across the sector. ' +
      'Colony worlds report stable suns for the first time in years. ' +
      'The crew of your vessel is credited with saving the sector. Well flown, Captain.';
  }
  if (flags.egg && flags.crystalCoords) {
    return 'INTERSTEL PRIORITY: Analysis confirms the Black Egg is a weapon of the Ancients. ' +
      'Take it to the crystal world at 42,178 and launch it from orbit. ' +
      'Warning: Uhlek fleet activity is heavy in that region. Good luck, Captain.';
  }
  if (flags.egg) {
    return 'INTERSTEL PRIORITY: The Black Egg is aboard your ship. We still lack the crystal ' +
      'world\'s coordinates — the spacefaring races may know. The Elowan are scholars of the ' +
      'Ancients; the Spemin respond to flattery.';
  }
  if (flags.tablet) {
    return 'INTERSTEL ANALYSIS: Your recovered tablet translates as: "The makers sleep at the heart. ' +
      'The egg of night alone undoes them. The egg waits on the fourth world of the yellow star at 199,33." ' +
      'Recover the egg, and seek the crystal world\'s coordinates from the spacefaring races.';
  }
  return 'INTERSTEL PRIORITY: Stellar observatories report abnormal flare activity across the sector. ' +
    'Colony suns are destabilizing. All licensed vessels: investigate. Rumors persist of ' +
    'ANCIENT RUINS on outlying worlds — any recovered artifact will be analyzed at this station. ' +
    'Outfit your ship, train your crew, and good hunting, Captain.';
};
