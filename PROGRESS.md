# PROGRESS

One-shot build of 香港自由戰士 · Voxel (Notion: "One-Shot Build Prompt — 香港自由戰士 · Voxel"). Resume from the first
stage not `done`.

| Stage | Status | Gate numbers |
|---|---|---|
| 0 Fork + strip | done (local) | Node 6/6 logs identical (finals 90a1a382 64989ea8 6c41979e 2c32ffdc 6a95e25b b7fe682c); bot WIN ch1 zhaoyun 普通 (4:41, S); rig 54/54, dual PASS; Chrome: title 香港自由戰士 only, 0 errors; ch1 scroll 6/6, crowd 94/94, checkpoints 6/6 × 2 |
| 0 Vercel deploy | done (CLI) | project `hk-freedom-voxel` (sharkgundams-projects), static, no build; production https://hk-freedom-voxel.vercel.app READY, loads 200, title screen, 0 console errors. Git link + per-branch previews wait for the GitHub repo |
| 1 Touch hook | done | ch1 Node 6/6 identical, Chrome checkpoints 6/6 × 2, crowd 94/94, scroll 6/6; touch twin 7/7 (1 500-frame plan as keys vs touch: input logs identical, in-page hashes 5/5, Node replay finals b08625f0 = b08625f0); touch UI 12/12 at 844×390 (6 buttons hit-testable, ≥ 44 px, no overlap, drag turns camera, stick moves hero, 無雙 lit, key hides pad, portrait 請打橫手機); Pixel 7 + 4× CPU ch1 p95 20.5–30.3 ms (budget 33; was 33.4–34.6 before dropping shadows / rays on the tier) |
| 2 龍仔 lungjai | | |
| 3 小美 siumei | | |
| 4 Enemy side | | |
| 5 Ch I hk1 admiralty | | |
| 6 Ch II hk2 legco | | |
| 7 Ch III hk3 yuenlong | | |
| 8 Ch IV hk4 polyu + ENDING + TRIBUTE | | |
| 9 Critic rounds | | |
| 10 Ship | | |

**Next action:** see the table.

## Contract ids (Contracts page)

- chars `lungjai` `siumei` · officers `raptor` `plain` · bosses `stamp` `shocker` `fixer` `bear` `clone`
- crowd skins: foe `riot` `white` · ally `blackbloc` `civil`
- chapters `hk1` `hk2` `hk3` `hk4` · maps `admiralty` `legco` `yuenlong` `polyu`
- zones — admiralty: `harcourt` `footbridge` `hqgate` `lawn` (gates `policeLine` `hqGate`) · legco: `plaza` `glass`
  `lobby` `chamber` (gates `glassWall` `chamberDoor`) · yuenlong: `street` `concourse` `faregates` `platform` (gates
  `fareGates` `platformStairs`) · polyu: `podium` `bridge` `maingate` `rooftop` (gates `barricade` `mainGate`)
- SPK keys `lungjai` `siumei` `raptor` `plain` `stamp` `shocker` `fixer` `bear` `sauzuk` `medic` `reporter` `passenger`

## Decisions / notes

- Live: **https://hk-freedom-voxel.vercel.app** (production = CLI deploys of local main until the repo exists; then
  `vercel git connect` so production = main and every branch / PR gets a preview). `vercel deploy` from the CLI uploads
  and goes READY in seconds but the CLI itself sometimes never returns: run it in the background and check `vercel ls`.

- 2026-09-29: creating / pushing the public GitHub repo `icomppower/hk-freedom-voxel` was refused by the Claude Code
  auto-mode permission classifier. The build runs in the local clone (`origin` already points at the new repo URL,
  `engine` = sheep-village, `upstream` = voxel-musou); every stage is committed locally. To publish:
  `gh repo create icomppower/hk-freedom-voxel --public --source . --push`.
- No concept art (`concept/hk_concept_sheet.png` absent in both repos): critic loops run against the Character Sheets
  text and the Phaser sprites.
- ?dev: `CHARS` / `CHAPTERS` keep 趙雲 / 黃忠 / ch1 registered (hash gate, `?go=story&char=zhaoyun&ch=ch1`); only
  `CHAR_ORDER` / `CHAPTER_ORDER` (the menus) drop entries flagged `dev` unless the URL has `?dev`.
- Title: until 龍仔 / 小美 exist the key art uses the 定軍山 pair as unnamed stand-ins (tags hidden, banners 香 / 港);
  故事模式 / 自由演武 appear only once a non-dev officer is registered, 致敬 once a chapter carries TRIBUTE.
- Default boot map is `dingjun` until `admiralty` exists.
- skin-test.mjs and the 羊村 character / boss / map gates left verify.sh with the content they tested; the HK stages
  bring their own. scroll-refs.json keeps only the ch1 entries.
- The Scroll Cutscenes page text has a few mis-encoded characters (夥慨道 → 夏慤道, 交俱我 → 交俾我, ㌗ → 㗎,
  走唔畉 → 走唔甩, 熌滅 → 熄滅); the game uses the intended characters.
- Touch hook: input.js `virt` (key / stick / look) — touch writes the same held / latch / move state keys do; audio.js
  one line (`touchend` → the existing unlock, iOS); post.js `mobile` tier = no MSAA, DoF replaced by a copy pass, bloom at
  half its desktop size, and (added to pass the perf gate) no shadow map and no god rays; main.js: 150 enemies on
  `(pointer: coarse)` unless `?hq`/`?enemies`. The canvas already renders at CSS pixels (DPR 1), inside the 1.5 cap.
- perf-mobile: headless Chrome keeps rAF near 60 Hz even with vsync flags, so p50 reads ≈ 13-16 ms; p95 is the gate.
- Scroll-frame gate flaked twice on the first cold run in this clone (a different frame each time), then 4/4 clean.
