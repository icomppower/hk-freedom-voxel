# PROGRESS

One-shot build of 香港自由戰士 · Voxel (Notion: "One-Shot Build Prompt — 香港自由戰士 · Voxel"). Resume from the first
stage not `done`.

| Stage | Status | Gate numbers |
|---|---|---|
| 0 Fork + strip | done (local) | Node 6/6 logs identical (finals 90a1a382 64989ea8 6c41979e 2c32ffdc 6a95e25b b7fe682c); bot WIN ch1 zhaoyun 普通 (4:41, S); rig 54/54, dual PASS; Chrome: title 香港自由戰士 only, 0 errors; ch1 scroll 6/6, crowd 94/94, checkpoints 6/6 × 2 |
| 0 Vercel deploy | pending | |
| 1 Touch hook | | |
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
- Scroll-frame gate flaked twice on the first cold run in this clone (a different frame each time), then 4/4 clean.
