# STARFLIGHT — a one-shot tribute

A browser clone of the 1986 EA/Binary Systems classic **Starflight**, built in a
single autonomous Claude Code session ("how far can you get in one shot").
Zero dependencies, plain HTML/CSS/JS — no build step, no server required.

## How to play

Open `index.html` in any browser (double-click it), or:

```sh
cd starflight-clone
python3 -m http.server 8080   # then visit http://localhost:8080
```

**Controls — keyboard or mouse throughout**

- Arrow keys / WASD — fly the ship (hyperspace, star systems) and drive the terrain vehicle
- **Mouse**: click anywhere in space to fly there; click a planet to make for it;
  click the starmap to lay in a course the autopilot flies; click terrain to
  drive the TV; click menu buttons. Arrow keys disengage the autopilot.
- Bracketed letters (e.g. `[L]`) — menu hotkeys; arrow keys + Enter also work in list menus
- `M` — galaxy starmap (anywhere)

**Graphics**: 960×600 canvas, everything drawn procedurally — gradient-shaded
planets with atmospheres and gas-giant rings, glowing stars, parallax
starfields, nebulae, ship sprites with engine glow. No image assets.

## The game

The year is 4620. Suns across the sector are flaring and colony worlds are
burning. Interstel licenses you a ship, a green crew, and 12,000 credits.
Figure out why the stars are dying — and turn a profit on the way.

**At Starport Arth** (your home base, planet 2 of the Arth system at 125,100):

- **Operations** — your current mission briefing; updates as you find clues
- **Personnel** — hire crew from 5 races (Human, Velox, Thrynn, Elowan, Android)
  and train Science / Navigation / Engineering / Communications / Medicine.
  Races have different aptitude caps; skills genuinely matter (fuel efficiency,
  scan detail, weapon damage, dialogue hints, healing).
- **Trade Depot** — sell mined minerals and captured lifeforms, buy fuel
- **Ship Configuration** — engines, shields, armor, lasers, missiles (classes
  1–5), cargo pods, hull repairs

**Out there:**

- A seeded galaxy of 46 star systems with ~170 procedurally generated planets
- Land on rocky worlds, drive the terrain vehicle, mine 19 minerals (sell
  them back home), capture lifeforms for the Science Institute, survive lava,
  heat, and blizzards
- Recover **Ancient artifacts** from ruins — the Resonance Shield, Seeker Lens,
  and Flux Coil grant passive bonuses to damage taken, hit chance, and fuel burn
- **Recommend habitable worlds to Interstel** for a survey fee scaled by
  gravity, climate, and biology — a second economy alongside mining
- Nine alien races with territory, dispositions, and dialogue: the Mechan,
  Spemin, Elowan, Thrynn, Uhlek, Velox, Gazurtoid, Humna Humna, and renegades.
  Hail them Friendly / Hostile / Obsequious and interrogate them about the
  Ancients and the flares. Some respond to flattery. Some only to force.
- **Commodity trading** — buy a culture's home good cheap, haul it across the
  sector, and sell it dear to someone who wants it (the Humna Humna live for this)
- Turn-based ship combat with range envelopes (lasers ≤60, missiles ≤150),
  fleeing, surrenders, salvage, and races that *remember* unprovoked attacks
- **Interstel law** — fire first on a peaceful race and you earn a bounty that
  draws more hunters; pay it off at the Starport to clear your record
- **Continuum fluxes** — 7 hidden wormhole pairs in hyperspace. Fly into one
  and space folds: instant, fuel-free transit to its partner. Invisible until
  discovered (a science officer at 40+ skill can spot the shimmer);
  discovered fluxes are charted on the starmap as numbered F# pairs
- A full-screen **galaxy starmap** (`M` anywhere) with coordinate grid, race
  territories, charted systems, flare warnings, and story markers
- Run out of fuel and engineering will crack raw Endurium from your cargo —
  or an Interstel tug hauls you home for 25% of your credits

**The story** (light spoilers): find ANCIENT RUINS on outlying worlds. A
recovered tablet starts a chain — an artifact on a specific world, coordinates
held by alien races who must be persuaded (or beaten) into sharing them, a
guarded endgame system, and a final action that stops the flares. It's
winnable in roughly 30–60 minutes; the win screen scores you on days elapsed,
earnings, and kills.

The game auto-saves to browser localStorage every time you dock.

## Development

- `node test/smoke.js` — headless smoke test with a stub DOM; boots the game
  and plays the entire story through to victory (41 checks)
- World generation is seeded (mulberry32, seed 1986), so the galaxy — and the
  coordinates aliens quote at you — is identical every run

## What's faithful vs. simplified

Faithful in spirit: starport loop (ops/crew/trade/outfit), crew skills and
training, hyperspace vs. system navigation with fuel economics, planet
scan → land → mine in a terrain vehicle, alien comms with postures, Endurium
as fuel, the dying-suns mystery.

Simplified: combat is menu-turn-based rather than real-time; one ship per
encounter; the story is a 3-artifact chain rather than the full plot; no
planet recommendation/colonization mechanic.
