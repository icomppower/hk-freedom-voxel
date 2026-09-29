# PROGRESS

One-shot build of 羊村 · 霧港渡 (Notion: "One-Shot Build Prompt — 羊村 · 霧港渡"). Resume from the first stage not `done`.

| Stage | Status | Gate numbers |
|---|---|---|
| 0 Harness | done | 4 Node logs replay identical (ch1 × zhaoyun / huangzhong, 7 200 + 36 000 f); Chrome 6/6 checkpoints stable run to run |
| 1 Seam | done | Node 4/4 logs identical (finals 90a1a382 64989ea8 6c41979e 2c32ffdc), Chrome 2/2 × 6/6 checkpoints; menus → chapter pick → prologue → battle, 0 errors |
| 2a Scroll player | done | 定軍山 prologue 12/12 frames pixel-identical (both officers); scroll-flow 11/11 (ending only after a win of a chapter with ENDING, tap / hold / Esc, tribute → title); Node 4/4 |
| 2b Dual-wield rig | done | rig probe 54/54 upstream clips joint-identical; dual probe 216 reachable grips: hand→grip 0.00 mm, fist→blade 0.000°, right hand moved 0; Node 4/4 |
| 2c Crowd skin + officer hook | done | Wei/Shu crowd 94/94 meshes geometry+texture identical; skin-test 4/4 (wolf + sheep skins render, keyed officer model, broken weapon on KO, ch1 back to Wei after); Node 4/4 |
| 2d Bot autoplay | done | bot clears ch1 on 普通 as zhaoyun (6:21, S) and huangzhong (8:24, A), styles steady / rush / back all WIN (no soft-lock); zhaoyun also 初級 / 上級; both full clears added to the hash gate (Node 6/6) |
| 3 阿角 gok | done | gates 6/6 (moves 15/15, onsets = Box Moveset, N-string 28 sf apart live, weapon ≥ 0.29 m, feet slide ≤ 0.66 cm, Musou 39/40 of a packed ring); 60 fps held through the Musou at 600 enemies (p95 16.8 ms = Zhao Yun); model critic 3 rounds → P1 0; bot clears ch1 as gok (rank S); ch1 Node 6/6 |
| 4 狼督 + grey / shadow / iron | todo | |
| 5 小咩 siume | todo | |
| 6 Chapter I pasture / sheep1 | todo | |
| 7 Chapter II lantern / sheep2 | todo | |
| 8 Chapter III harbor / sheep3 + ENDING + TRIBUTE | todo | |
| 9 Critic rounds | todo | |
| 10 Ship | todo | |

**Next action:** stage 4 狼督 warden + 灰牙 grey / 影爪 shadow / 鐵吻 iron officer models; boss phases 50 % / 20 %, glaive breaks on KO.

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
- Crowd skins: chapter `skin: { foe: 'wolf', ally: 'sheep' }`; officers `model: key` in OFF (chars/officers/index.js). Wolves read
  nearly black under the golden-hour light — critic item (lift the greys) once the 羊村 maps set their own light.
- Bot (bench/bot/bot.mjs): Huang Zhong loses ch1 on 上級 / 修羅 and Zhao Yun on 修羅 some runs — bot limits (no guard /
  aim mode), not gates. `bench/bot/play.mjs` runs the same bot in the real page (real time: ≈ 6-9 min per chapter).
- `bench/sheep/sample-recovered.js`: the 羊村 box-moveset sample de-minified out of its published artifact bundle (stands
  in for the missing sheep-bench.zip): palettes, head box lists, crook / shears / glaive, move tables + pose keys.
- 阿角 critic ran against the Character Sheets text + the recovered sample (no concept PNG). Open P2s: coat rows still read a
  little like plate (palette-only rule), horns not wider than the shoulder line, the C4 crook plant stops ≈ 0.3 m short of
  the ground (the frozen rig's ground clamp keeps a point 2.0 m along the weapon above the ground — Zhao Yun's spear length).
- `pull` has no combat reaction (frozen combat.js): C1's hook and the Musou round-up are flinch hits + kit-sim position drag
  (src/chars/gok/musou.js). Shared clip kit: src/chars/shared/clipkit.js (upstream's clipF / bakeFeet, per kit).
- select.js: courtesy.label (default 字) so 阿角 reads 人稱角叔. story say(): a hero without a branch in a line takes its
  first branch (an officer playing outside his chapter's cast).
