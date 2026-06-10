# LinkedIn — launch post

Status: DRAFT — review and post manually

Last night I ran an experiment in agentic coding. At bedtime I gave Claude
Code a one-paragraph prompt: build a clone of Starflight, the 1986 space RPG,
and see how far you get in one shot. Then I went to sleep.

By morning it had shipped a playable game: a 46-system procedural galaxy,
planet mining, crew training, a market economy, alien diplomacy, combat, and a
winnable storyline, in roughly 2,600 lines of dependency-free JavaScript.
Nobody asked it to write tests. It built a headless harness that plays the
entire game start to finish, and it kept fixing its own bugs until all 41
checks passed. That harness later caught a subtle rounding bug that a human
reviewer would have waved through.

The base game took one prompt. The starmap, the wormholes, mouse support, a
full graphics pass, and the Vercel deployment took one morning of
conversation.

I keep arriving at the same conclusion: the cost of writing software is
collapsing toward zero, and the leverage is moving to knowing what is worth
building and being able to verify that what got built is correct.

Play it: https://starflight-clone.vercel.app
Source (MIT): https://github.com/henryjrobinson/starflight-clone
