# PROGRESS

One-shot build of 羊村 · 霧港渡 (Notion: "One-Shot Build Prompt — 羊村 · 霧港渡"). Resume from the first stage not `done`.

| Stage | Status | Gate numbers |
|---|---|---|
| 0 Harness | done | 4 Node logs replay identical (ch1 × zhaoyun / huangzhong, 7 200 + 36 000 f); Chrome 6/6 checkpoints stable run to run |
| 1 Seam | done | Node 4/4 logs identical (finals 90a1a382 64989ea8 6c41979e 2c32ffdc), Chrome 2/2 × 6/6 checkpoints; menus → chapter pick → prologue → battle, 0 errors |
| 2a Scroll player | done | 定軍山 prologue 12/12 frames pixel-identical (both officers); scroll-flow 11/11 (ending only after a win of a chapter with ENDING, tap / hold / Esc, tribute → title); Node 4/4 |
| 2b Dual-wield rig | todo | |
| 2c Crowd skin + officer hook | todo | |
| 2d Bot autoplay | todo | |
| 3 阿角 gok | todo | |
| 4 狼督 + grey / shadow / iron | todo | |
| 5 小咩 siume | todo | |
| 6 Chapter I pasture / sheep1 | todo | |
| 7 Chapter II lantern / sheep2 | todo | |
| 8 Chapter III harbor / sheep3 + ENDING + TRIBUTE | todo | |
| 9 Critic rounds | todo | |
| 10 Ship | todo | |

**Next action:** stage 2b dual-wield rig (weaponL joint + IK), gated on unchanged ch1 hashes.

## Contract ids (Divide & Conquer page)

- chars `gok` `siume` · officers `grey` `shadow` `iron` `warden` · grunt skin `wolf`
- chapters `sheep1` `sheep2` `sheep3` · maps `pasture` `lantern` `harbor`
- zones — pasture: `field` `barns` `gate` `shrine` (gates `barnLane` `villageGate`) · lantern: `market` `stairs`
  `checkpoint` `lookout` (gate `checkpoint`) · harbor: `beach` `causeway` `boom` `rock` (gates `boom` `lighthouse`)
- SPK keys `gok` `siume` `grey` `shadow` `iron` `warden` `lamb` `twelve`

## Decisions / notes

- Inputs missing at start (2026-09-29): `concept/sheep_village_concept_sheet.png` and `sheep-bench.zip` were not in the
  repo, Downloads or Notion. The bench sample is published as a claude.ai artifact (Box Moveset page link) and can be
  extracted from its bundled page; the concept sheet has no copy anywhere reachable.
- Node and Chrome hashes differ (V8 trig last-ulp); Node is the primary gate, Chrome checkpoints are a second gate.
- Some state leaks between battles within one page (upstream): logs replay only from a cold start (one per process).
- The scripted driver does not finish ch1 (stalls after 張郃 appears); the stage-2d bot is what clears chapters.
- Seam registries: `src/world/map.js` MAPS (+ `maps/<id>/map.js`), `src/world/world.js` WORLDS (+ `maps/<id>/world.js`),
  `src/story/chapters.js` CHAPTERS (map, cast, title, sides, allies), `src/chars/index.js` LIST. Map exports are live
  bindings onto the active map. Chapter pick opens after 出陣 on an officer and lists the chapters whose cast has him.
- Reading of the rules: the frozen list is hard; other upstream files (ui/, story/index.js, world/, hud, main.js) change
  only in the seam / stage-2 hook commits, or later in a small separately committed hook gated on unchanged ch1 hashes.
- Title menu item renamed 故事模式 (the chapter is chosen on select); loading card names the picked chapter.
- `src/ui/brush.woff2` is a glyph subset: new HUD / menu glyphs fall back to system fonts until it is re-subset (ship).
- Critic backlog (stage 9): at 1280×720 the result screen's `.ui-foot` covers the 繼續 / 再戰 buttons (elementFromPoint
  hits the footer) — upstream layout; Enter works, the mouse doesn't.
