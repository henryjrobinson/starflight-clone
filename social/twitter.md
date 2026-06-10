# Twitter / X — launch post

Status: DRAFT — review and post manually

## Long post (primary)

Starflight (1986) is still my favorite game, so last night I tried an
experiment. I typed one sloppy, typo-filled paragraph into Claude Code: build
me a Starflight clone, you have one shot, I'm going to bed.

I woke up to a playable game. Fable had built a 46-system procedural galaxy,
planet landings with a terrain vehicle for mining, crew hiring and training
across 5 races, a trade depot, ship outfitting, alien dialogue with posture
mechanics, combat, and a winnable storyline. The whole thing is about 2,600
lines of zero-dependency vanilla JS.

The part that impressed me most is that nobody asked it to write tests. It
built its own headless harness that plays the entire game to victory, and it
would not call the job finished until all 41 checks passed. That same harness
later caught a real bug I would have shipped: a rounding error that made the
laser refuse to fire at exactly range 60. It found it by simulating 300
battles.

We spent this morning adding the starmap, the hidden wormholes, mouse support,
and a graphics pass, and then it deployed itself to Vercel.

Play it: https://starflight-clone.vercel.app
Code (MIT): https://github.com/henryjrobinson/starflight-clone

## Compact alt (under 280 characters)

I gave Claude one typo-filled prompt at bedtime: clone Starflight (1986), one
shot. I woke up to a playable game with mining, crew training, alien
diplomacy, and a winnable story. It even wrote a test bot that plays itself to
victory. https://starflight-clone.vercel.app
