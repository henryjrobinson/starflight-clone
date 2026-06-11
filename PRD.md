# PRD: Starflight Clone — Backlog Feature Set (Ralph)

## Context

Existing zero-dependency browser game at this repo. Architecture:

- `js/rng.js` — seeded RNG helpers (`SF.mulberry32`, `SF.randInt`, `SF.pick`, `SF.chance`, `SF.shuffle`)
- `js/gfx.js` — procedural draw helpers (`SF.gfx.*`), `SF.VW=960`, `SF.VH=600`
- `js/data.js` — static data: `SF.data.MINERALS`, `SF.data.PARTS`, `SF.data.PLANET_TYPES`, `SF.data.RACES`, `SF.data.CREW_RACES`, starport prices, `SF.data.notice()`
- `js/galaxy.js` — `SF.generateGalaxy()` (seed 1986), `SF.galaxy.systems/byId/fluxes`
- `js/state.js` — `SF.newState()`, derived stats, cargo math, save/load
- `js/ui.js` — `SF.ui.setMenu/log/setStatus`, menu items are `{key,label,fn,disabled}`
- `js/starport.js` — Operations/Personnel/Trade/Ship Config menus
- `js/space.js` — `hyper` and `system` flight modes, `SF.territoryRace(hx,hy)`
- `js/starmap.js` — full-screen galaxy map
- `js/planet.js` — `orbit` and `surface` (terrain vehicle) modes
- `js/encounter.js` — alien comms (postures, topics) + turn-based combat
- `js/main.js` — mode dispatch, keyboard + mouse, title/win/gameover, `SF.setMode`, `SF.tick`
- `test/smoke.js` — headless DOM-stub harness; boots the game and plays the full
  story to victory. Run with `node test/smoke.js`. Currently passes ~50 checks.

## Global rules (apply to every task)

1. **Verification is the gate.** For every feature, extend `test/smoke.js` with
   explicit `check(...)` assertions for the new behavior. A task is DONE only when
   `node test/smoke.js` prints `ALL SMOKE CHECKS PASSED` with the new checks
   included AND no previously-passing check regressed. Run it 5x to catch
   flakiness (encounters are random).
2. **Surgical changes.** Follow the existing module patterns exactly. Match code
   style, naming, comment density. Do not refactor unrelated code. New data goes
   in `data.js`; new draw code uses `SF.gfx` helpers and `SF.VW/SF.VH`.
3. **Syntax check** every changed JS file with `node --check` before running the
   smoke test.
4. **Save compatibility.** New `state` fields must default safely so old saves
   don't crash (guard with `|| {}` / `|| 0` on read).
5. **No new dependencies.** Vanilla JS only, must run by opening `index.html`.
6. Keep each feature self-contained; do not start the next task until the current
   one is green.

## Task 1 — Functional artifacts

Relics recovered from non-story ruins that grant passive ship bonuses (distinct
from the story-key tablet/egg).

- Add `SF.data.ARTIFACTS` (3–4 entries), e.g. Shield Booster (incoming combat
  damage -15%), Targeting Array (laser/missile hit chance +12%), Fuel Coil
  (hyperspace fuel cost -15%). Each: `{id, name, desc, effect}`.
- In `planet.js` `visitRuins()`, after the tablet/egg story branch, non-story
  ruins have a chance to yield an as-yet-unowned artifact instead of (or in
  addition to) the credit salvage. Track owned artifacts in `state` (e.g.
  `s.artifacts = {}`), once each.
- Apply effects where relevant: combat damage math in `encounter.js`, hit-chance
  rolls, and `SF.fuelPerDist` (or hyper fuel burn) in `state.js`/`space.js`.
- Surface owned artifacts in Starport Operations briefing text.
- Acceptance: smoke test grants an artifact, asserts it is owned once, and asserts
  its numeric effect changes the relevant computation (e.g. lower damage taken or
  lower fuel burn) vs. the un-owned baseline.

## Task 2 — Planet colonization recommendations

A second economy: recommend habitable worlds to Interstel for a payout.

- Add an orbit-menu action "Recommend to Interstel" available on landable,
  non-special worlds after a sensor scan.
- Payout scales with habitability: gravity near 1.0g, temperate/temperate-ish
  climate, and bio activity raise the score; molten/gas/zero-bio score low.
  Define a `colonyValue(planet)` helper (cap the payout, e.g. 200–3000 cr).
- Each planet recommendable once; track in `state` (e.g. `s.flags.colonized`).
- Log the assessment and pay via `SF.earn`.
- Acceptance: smoke scans + recommends a suitable world, asserts credits rose by
  the expected value, asserts a second recommendation on the same world is
  refused.

## Task 3 — Additional alien races

Add Velox, Gazurtoid, and Humna Humna following the exact `SF.data.RACES` shape
(name, color, territory circle, hostile, brave, freq, ship stats, hail postures
friendly/hostile/obsequious, topics themselves/others/ancients/flares).

- Place territories so they don't fully overlap existing ones and stay within the
  250x200 hyperspace bounds. Velox: tinkerer/trader, not hostile. Gazurtoid:
  aquatic zealots, hostile. Humna Humna: frantic merchants, not hostile.
- Give each distinct dialogue voice consistent with the existing races. Keep any
  story-clue logic confined to the existing Spemin/Elowan paths — new races give
  flavor and (for Humna Humna) trade, not crystal-world coordinates.
- They participate in `SF.territoryRace` and encounter rolls automatically once in
  `RACES`; verify nothing assumes a fixed race count.
- Acceptance: smoke asserts the three new races exist with valid
  territory/ship/hail/topics, and that an encounter with each resolves (hail +
  break contact, or combat for Gazurtoid) without error.

## Task 4 — Interstel law (bounties & fines)

Attacking a non-hostile race has consequences.

- When the player fires first on a non-hostile race (the existing
  `markAggression()` path in `encounter.js`), accrue a bounty on `state`
  (e.g. `s.bounty += amount`).
- A standing bounty raises renegade/bounty-hunter encounter frequency in hyper.
- Add a Starport action (Operations or a new "Pay Interstel fine") to clear the
  bounty for credits.
- Acceptance: smoke fires on a friendly race, asserts bounty > 0, asserts the
  starport fine action clears it and deducts credits.

## Task 5 — Commodity trading with alien cultures

Buy trade goods cheap from one culture, sell dear to another (Starflight 2 flavor).

- Add `SF.data.TRADE_GOODS` (e.g. Velox Tools, Elowan Seedstock, Thrynn Spice,
  Spemin Slime, Mechan Cogitator) each with a base price.
- Each race has buy/sell modifiers so goods have a profitable origin and
  destination. Add this to the race data or a parallel table.
- In friendly encounters (`encounter.js` topic/console), add a "Trade goods"
  option: a small menu to buy goods the race sells and sell goods they want.
  Respect cargo capacity and credits; goods occupy cargo like minerals or a
  parallel hold — pick the simpler correct option and keep accounting exact.
- Acceptance: smoke buys a good from one race at its low price and sells it to a
  different race at a higher price for net profit, with cargo/credit accounting
  verified and capacity limits enforced.

## Task 6 — Docs refresh

After tasks 1–5 are green, update `README.md` (features list + controls if
changed) and `ROADMAP.md` (move shipped items to Shipped, leave Endurium twist,
real-time combat, and sound in the backlog as not-started). Keep the
"built with Claude" framing intact.

- Acceptance: README and ROADMAP reflect the new features; smoke test still green.
