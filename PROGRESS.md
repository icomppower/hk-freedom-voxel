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
| 4 狼督 + grey / shadow / iron | done | boss gate 6/6 (phase 2 at 49.8 % HP, phase 3 at 19.8 %, banners on the phase frames, searchlight squads drop, KO → win, slot keeps the warden model) as gok + zhaoyun; officer lineup critic 3 rounds → P1 0; KO = kneel + raised horn + broken glaive; ch1 crowd 94/94, Node 6/6 |
| 5 小咩 siume | done | gates 6/6 (moves 15/15, onsets = Box Moveset, N-string 18 sf apart live, blades ≥ 0.45 m, feet slide ≤ 0.70 cm, Musou 39/40); 60 fps through the Musou at 600 enemies; model critic 2 rounds → P1 0 (headband tails were a rigid plank); bot clears ch1 as siume (7:27, rank S); ch1 Node 6/6 |
| 6 Chapter I pasture / sheep1 | done | bot WIN 6/6 (gok + siume × steady / rush / back: no soft-lock); map gate 6/6 per officer (no NaN, standing soldiers ≥ −1.25 m, no teleport > 3 m/step, barnLane + villageGate reached, won); scroll columns ≤ 7; ch1 prologue 6/6, crowd 94/94, Node 6/6 |
| 7 Chapter II lantern / sheep2 | done | bot WIN 6/6 (gok + siume × steady / rush / back); map gate 5/5 per officer; WIN in the real page (gok); night lighting critic → readable |
| 8 Chapter III harbor / sheep3 + ENDING + TRIBUTE | done | bot WIN 6/6 (both officers × 3 styles, 2 300–4 200 KOs); map gate 6/6 per officer (boom + lighthouse reached); scroll-flow 11/11 on the real ending (result → ENDING → tribute → title only after the Ch. III win); tribute card: original wording, no names, link minjian-danganguan.org/archive/3429 (verified) |
| 9 Critic rounds | done | r1 P1s: ui 3 (title branding, no tribute entry, result buttons unclickable at 720p) → 0; scene 2 (Ch II night unreadable, Ch III sea read as snow) → 0; perf 0 (all maps p95 ≤ 16.8 ms at 300 + 600 enemies); fx 0; chars 0 (P2s listed below) |
| 10 Ship | done | README credits, verify.sh all green, Pages live, Notion bookmark |

**Next action:** none — all stages done. Open P2s below are polish candidates.

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
- Officers (stage 4): crowd officer models in src/chars/officers/ (wolfkit.js builder; warden/model.js + warden/boss.js).
  Boss phases run from a chapter script (story hook `script`), banners from `below` beats. Not done (frozen combat / crowd
  AI): 狼督's super armour on heavy swings and the phase-3 leap; phase 3 = officer cooldown clipped (more swings).
- The crowd material dissolves anything within ≈ 3 m of the lens (upstream DW-style): officer close-ups are long-lens.
- 小咩 C1 = 旋風剪 tornado (Box Moveset frame data, the gate) and C3 = twin upward snip launcher; the Character Sheet
  lists them the other way round.
- Ch I design calls: carts are lost if the hero is > 20 m from the gateway as they pass (a crowd-count rule lost every
  cart: the engaged ring always keeps 10+ wolves round him); win needs ≥ 4 of 6 (60 %) at the lantern, else the chapter is
  lost there. The barn collapse shuts gate 'barnLane' (story hook api.gate) and the objective walks the detour waypoints.
- 羊村 render kit: src/world/maps/sheepkit/ (terrain: 1 m voxel tiles on the map grid; props: box lists). Free battles on a
  羊村 map rename the crowd's built-in arena officers via chapter.freeNames (story index.js free-mode hook).
- Bot: A* on the walk grid when the road ahead is blocked or the goal is off the road; Huang Zhong's ch1 clears with the
  rush style (steady / back lose ≈ half the runs) — upstream content, not a 羊村 gate; his clear is in the hash logs.
- Open P2s after critic r1: wolves read nearly black in the golden light; 阿角's coat rows read as plate; the C4 crook plant
  stops short of the ground; chapter pick panel overlaps the officer on select; Ch III beach greys in the fog; the Musou
  heavy slashes keep the shared vfx's cyan in places; free-mode arena officers are renamed but keep the crowd's AI.
- Stage 10: brush.woff2 re-subset from Google Fonts' Yuji Boku to every CJK glyph in src/ (41 KB → 341 KB, 702 glyphs)
  so non-Mac browsers get brush text for the 羊村 chapters. The newer Yuji Boku build rasterizes ch1's prologue
  differently (old font 6/6 at HEAD, new font 0/6), so the ch1 scroll pixel refs were re-saved on the new font — an
  asset change, not the scroll hook. crowdprobe now compares as a multiset: the world manager re-attaches its root on
  sync(), which rotated scene order (94/94 meshes byte-identical, 0/94 in place). verify.sh checks every gate's exit code.
