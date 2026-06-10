# Roadmap

Status legend: ✅ done · ⏳ in progress · ❌ not started

## Shipped

- ✅ One-shot base game (overnight autonomous build): galaxy, mining, crew
  training, trade depot, ship outfitting, alien diplomacy, combat, winnable
  story, self-written test harness (41 checks)
- ✅ Galaxy starmap (coordinate grid, territories, story markers)
- ✅ Continuum fluxes (hidden wormhole pairs, science-skill detection)
- ✅ Graphics generation upgrade: 960×600, procedural gradient rendering, no
  image assets
- ✅ Full mouse support: click-to-fly, starmap course autopilot,
  click-to-drive TV
- ✅ Open-sourced (MIT) at github.com/henryjrobinson/starflight-clone
- ✅ Live at starflight-clone.vercel.app
- ✅ Social launch drafts in `social/` (Twitter, Facebook, LinkedIn)

## Promotion track

### Now

- ❌ Post launch drafts (Henry, manually — drafts in `social/`)
- ✅ GitHub repo topics added (game, retro-gaming, space, javascript, canvas,
  starflight, claude-code, ai-assisted)
- ❌ Pin repo to GitHub profile (manual — GitHub has no API for profile pins:
  github.com/henryjrobinson → "Customize your pins")
- ❌ Social preview image (repo Settings → Social preview; needs a screenshot
  or generated banner)
- ❌ README hero screenshot: capture title screen + a planet surface + the
  starmap; embed at the top of README.md

### Resume

- ❌ Add a project entry to `cv.md` in claudia-career-ops (pallas). Suggested
  framing: "Directed an autonomous AI agent to build and ship a complete
  browser game (2,600 LOC, zero dependencies) from a single prompt, then
  iterated features, tests, and deployment — github.com/henryjrobinson/
  starflight-clone". Verify the career-ops pipeline regenerates the PDF.

### Website

- ❌ Identify the website repo / projects-section data source (not yet linked
  in this session)
- ❌ Add a projects-section card: name, one-line description, screenshot,
  live link, GitHub link, "built in one shot with Claude" hook
- ❌ Optional: short write-up page or blog post (the `/blog-post` pipeline can
  produce it; the Twitter draft is the seed)

## Game backlog (post-launch, roughly in value order)

- ❌ Functional artifacts: usable relics (shield amplifier, cloaking device)
  found in ruins, not just story keys
- ❌ Planet colonization recommendations: survey worlds, recommend to
  Interstel for a fee — the original's second economy
- ❌ More alien races (Velox, Gazurtoid, Humna Humna) with their own
  territories, dialogue, and grudges
- ❌ Story depth: the Endurium twist, built up through dialogue clues and a
  late-game reveal (Henry's favorite twist — handle with care)
- ❌ Interstel law: fines/bounties for attacking friendly races
- ❌ Commodity trading with alien cultures (Starflight 2 feature — explicitly
  later)
- ❌ Multi-ship encounters and real-time combat maneuvering (biggest rewrite)
- ❌ Sound and music (WebAudio, procedural to keep the zero-asset rule)
- ❌ Consider retitle ("Starflight Tribute") if the project gets traction
