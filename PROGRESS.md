# PROGRESS

One-shot build of 香港自由戰士 · Voxel (Notion: "One-Shot Build Prompt — 香港自由戰士 · Voxel"). Resume from the first
stage not `done`.

| Stage | Status | Gate numbers |
|---|---|---|
| 0 Fork + strip | done (local) | Node 6/6 logs identical (finals 90a1a382 64989ea8 6c41979e 2c32ffdc 6a95e25b b7fe682c); bot WIN ch1 zhaoyun 普通 (4:41, S); rig 54/54, dual PASS; Chrome: title 香港自由戰士 only, 0 errors; ch1 scroll 6/6, crowd 94/94, checkpoints 6/6 × 2 |
| 0 Vercel deploy | done (CLI) | project `hk-freedom-voxel` (sharkgundams-projects), static, no build; production https://hk-freedom-voxel.vercel.app READY, loads 200, title screen, 0 console errors. Git link + per-branch previews wait for the GitHub repo |
| 1 Touch hook | done | ch1 Node 6/6 identical, Chrome checkpoints 6/6 × 2, crowd 94/94, scroll 6/6; touch twin 7/7 (1 500-frame plan as keys vs touch: input logs identical, in-page hashes 5/5, Node replay finals b08625f0 = b08625f0); touch UI 12/12 at 844×390 (6 buttons hit-testable, ≥ 44 px, no overlap, drag turns camera, stick moves hero, 無雙 lit, key hides pad, portrait 請打橫手機); Pixel 7 + 4× CPU ch1 p95 20.5–30.3 ms (budget 33; was 33.4–34.6 before dropping shadows / rays on the tier) |
| 2 龍仔 lungjai | done | gates 6/6 (moves 15/15, onsets = Box Moveset, N-string 24-25 sf apart live, pole ≥ 0.27 m above ground, feet slide ≤ 0.95 cm, Musou 34/40 of a packed ring); Musou at 600 enemies p95 16.8 ms (Zhao Yun 33.4); model critic 2 rounds → P1 0 (r1: armour cut read as lamellar → shared plain outfit); bot WIN ch1 (?dev) × steady / rush / back |
| 3 小美 siumei | done | gates 6/6 (moves 15/15, onsets = Box Moveset, N-string 18 sf apart, umbrellas ≥ 0.10 m, feet ≤ 0.70 cm, Musou 39/40); Musou at 600 enemies p95 16.8 ms; model critic 2 rounds → P1 0 (r1: no eyes — paint boxes off the face layer; jacket read as stripes); open / closed umbrella swap on n3 c1 c4 c6 jc + Musou tornado; bot WIN ch1 × 3 styles; title + select show only 龍仔 / 小美, 0 errors |
| 4 Enemy side | done | boss gate 4/4 as lungjai and 4/4 as siumei (every phase on its threshold: HP 74.80 / 49.70-49.97 / 24.67-24.80 % etc., banner on the phase frame, behaviours: 777 slams, 比卡超 shock rings + 2 速龍 called, 強哥 chilli + bottles, 維尼熊 3 分身 / lights out / mask off; KO → win, slot keeps its model); lineup critic 2 rounds → P1 0 (r1: 777's tie + chain and the Bear's collar + seam read as crosses; mask slits missing); skin-test 4/4 (riot / blackbloc); ch1 crowd 94/94 |
| 5 Ch I hk1 admiralty | done (preview: see notes) | bot WIN 6/6 (lungjai + siumei × steady / rush / back, 4:12-7:34 sim); map gate 6/6 per playable (policeLine + hqGate crossed, no NaN / teleport); scroll columns 24/24 cards; touch-emulated run WIN in the real page (Pixel 7 landscape, mobile tier, 943 pad taps, 0 errors); result card fits 8/8 (hk1-4 × 1280×720 / 844×390, epilogue scrolls on the phone); flyover + prologue shots in bench/shots/5 |
| 6 Ch II hk2 legco | | |
| 7 Ch III hk3 yuenlong | | |
| 8 Ch IV hk4 polyu + ENDING + TRIBUTE | | |
| 9 Critic rounds | | |
| 10 Ship | | |

**Next action:** see the table.

**MILESTONE — Ch I playable** (2026-09-29): hk1 金鐘 plays start to finish (bot + touch). Preview deploy: see the Vercel note below.

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
- Playables wear src/chars/shared/outfit.js (plain jacket / trousers / trainers on the shared joints) instead of the
  lamellar bodyParts cut: the Character Sheets' 'palette only' rule read as armour in the critic (P1). The pauldrons stay
  hidden. Paint boxes (Pt) only recolour voxels inside the box's own span: face details sit on the face's front layer.
- 小美's open canopy is a render-only swap in her secondary update (the sim hero's move / moveT, OPEN table in model.js).
- Title controls table hides the 黃忠 aim row unless ?dev. The select screen keeps upstream's 選擇武將 heading (P2).
- Boss phase floor: a hit that would carry a boss past a threshold holds his HP at threshold − 0.2 % that step (one
  Musou can't skip a phase), so each phase starts within 0.5 % of its threshold (the gate). Phase banners / roars fire
  from the script (bosses.js `on`) on the phase frame, not from `below` beats (those saw the raw HP before the floor).
- Director hook (own commit c88462e): script api fire(beat) and model(key, modelKey) — the Bear's 分身 and 777's …; the
  Bear's mask-off is the extra officer model `bear_unmasked` (render-only swap; not a Contracts id, internal).
- KO'd officer models kneel with the left hand raised (crowd view kneelPose, frozen): reads as a raised fist (P2).
- Vercel: CLI deploys after the first one came back BLOCKED ('team configuration / project collaboration'): the commits
  carried the machine's default author (johnny@Johnnys-Mini.localdomain), which Vercel can't match to the team. From stage 5
  on the repo has a local user.email (the account email) for new commits; earlier commits keep the default author.
- hk2-hk4 content (maps, worlds, chapters) was written and Node-gated during stage 5 while another session held the GPU;
  it lands in the stage 6-8 commits.
- The ink map's Admiralty labels are nudged off the page's exact coordinates so they don't overlap (marks stay put).
- Scroll-frame gate flaked twice on the first cold run in this clone (a different frame each time), then 4/4 clean.
