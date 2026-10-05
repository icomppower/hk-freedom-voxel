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
| 5 Ch I hk1 admiralty | done | bot WIN 6/6 (lungjai + siumei × steady / rush / back, 4:12-7:34 sim); map gate 6/6 per playable (policeLine + hqGate crossed, no NaN / teleport); scroll columns 24/24 cards; touch-emulated run WIN in the real page (Pixel 7 landscape, mobile tier, 943 pad taps, 0 errors); result card fits 8/8 (hk1-4 × 1280×720 / 844×390, epilogue scrolls on the phone); flyover + prologue shots in bench/shots/5 |
| 6 Ch II hk2 legco | done | bot WIN 6/6 (both × 3 styles; clearance escort 200 s, the four come to the hero within 20 m, join at 8 m); map gate 6/6 each (glassWall + chamberDoor crossed); touch-only real-page run WIN as 小美 (2 988 taps, 0 errors); prologue refs saved; flyover critic: searchlight cone blew out the frame (cones off, spots dimmed), lobby wall had no door opening (12 m opening + high lintel) |
| 7 Ch III hk3 yuenlong | done | bot WIN 6/6 (steady / rush / back × both; 2-3 of 10 passengers lost per run, 7-8 board); map gate 6/6 each (fareGates + platformStairs); touch-only real-page run WIN as 龍仔 (768 taps, 0 errors); critic: empty opening (bot outran idle squads) → the passengers are a real escort (walk only while covered, lost after 3 s under attack), all squads charge, waves from the start; the camera sat inside the platform canopy / entrance slab (moved clear) |
| 8 Ch IV hk4 polyu + ENDING + TRIBUTE | done | bot WIN 6/6 (both × 3 styles; 龍仔 ends the Bear fight near 48 HP on steady / rush); map gate 6/6 each (barricade + mainGate); touch-only real-page run WIN as 小美 (1 456 taps, 0 errors); scroll-flow 11/11 (ENDING only after the hk4 win: result → ending → tribute → title; title 致敬 → tribute card); ENDING refs saved (7 frames); tribute link TBD per spec |
| 9 Critic rounds | done | 2 rounds (bench/shots/9/r1, r2; 1280×720 + 844×390, all four chapters, battle + Musou, title / select / scroll / result / ending). r1 P1s: mobile 3 (pad over the K.O. count and Musou copy, pause over the objective, keyboard footer over the select stats) → 0; scene 2 (hk3 empty opening, camera inside canopy slabs) → 0; fx 2 (龍拳 dragon rendered dark, LegCo searchlight blow-out) → 0; ui 1 (三國 aim row / 選擇武將) → 0; chars 0; perf 0 (desktop p95 ≤ 16.8 ms at 600 enemies on hk1-4; Pixel 7 + 4× CPU p95 6.7-8.0 ms). r2: P1 0. New gates: phone tap-through 17/17, touch UI 13/13 (no button over the HUD) |
| Cutscenes + Ending 天光 | done (branch cutscenes-ending) | 3 between-stage cutscenes (雨後 · 尾班車 · 竹枝, 20 s each) + new ENDING scroll + end scene (40 s) + tribute line, one shared player; flow 15/15 (hk1→between1→hk2 scroll, hk2→between2→hk3, hk3→between3→hk4, hk4 win → ENDING → end scene → TRIBUTE → title, losses / free wins: no cutscene, Esc at every step); look 9/9 (actors = the shipped models, P1 0 after 2 visual rounds); desktop p95 4.5-5.9 ms, Pixel 7 + 4× CPU p95 3.3-4.0 ms; audio peaks −12.1 … −2.0 dBFS, skip hands over in 0.53-0.72 s; ENDING cols ≤ 7, fits 14/14 cards at both sizes; subtitles fit at both sizes |
| 10 Ship | done | verify.sh ALL GATES GREEN; README credits (upstream MIT, sheep-village, three.js, Yuji Boku, the Phaser original); production deploy READY at https://hk-freedom-voxel.vercel.app (200, 0 console errors desktop + 844×390, hk4 deep link); Notion: Live Projects Bookmark row + project Status ticked. Repo pushed to github.com/icomppower/hk-freedom-voxel and git-connected to Vercel |
| C2 777 is a woman | done (branch stage/airport) | stamp-model gate 3/10 → 10/10 (knee skirt, silver bob to the chin, 6 pearls each wider than tall = never a cross, no tie / chain, scale 1.26 + hammer / crack / split states unchanged); boss gate 4/4 as lungjai + 4/4 as siumei unchanged (stamp phases 59.77 / 24.80 %, 59.80 / 24.80 %); ch1 Node 6/6 identical; shots bench/shots/airport/777-*.png |
| 11 Ch 8·12 hk5 airport | REMOVED 2026-10-05 (owner: doesn't play well; stage commit 3eff533 reverted, C2 777 kept) — numbers below are history | bot WIN 6/6 (lungjai 5:55 / 5:39 / 5:04, siumei 5:18 / 5:18 / 5:23 sim; steady / rush / back); map gate 6/6 each (securityLine + deckEscalator crossed, 0 NaN / off-field / teleport); touch-only real-page run WIN as 小美 (Pixel 7 landscape, mobile tier, 1 194 taps, 17 653 frames, 0 errors); airport look 10/10 desktop (#debug: board top row = live objective 626/626 settled samples, 6/6 rows → 取消 only after the cancellation, plane outside the glass 631 samples, climb-out, 8 travellers + 4 stranded drawn, stanchions / shutter 1.0, boss rings); boss gate 5/5 (commander: P2 49.74 %, P3 24.80 %, 48 pepper impacts, 2 速龍 called); result card fits 10/10 (hk1-5 × 1280×720 / 844×390); scroll cols 24 → 29/29 cards; cut flow 15 → 16/16; preview 22 → 24/24; airport look 10/10 on Pixel 7 mobile tier too (siumei); desktop p95 16.7-16.8 ms at 300 / 600 enemies; Pixel 7 + 4× CPU p95 7.0-7.4 ms; ch1 Node 6/6 identical, ch1 Chrome checkpoints 6/6 × 2; touch-twin 7/7, touch UI 13/13, phone flow 17/17, scroll flow 12/12, cut shots 4/4 × 3, ending fit pass |
| Online co-op 2P (?coop) | done, PUBLIC 2026-10-05 (owner tested on devices; title lists 網上合作 for everyone, solo pages reload into ?coop&lobby so solo keeps native Math + phone 150 enemies; gate bench/net/coop-entry.mjs 15/15) | engine exception 0e3105c: ch1 Node 6/6 identical before → after (finals 90a1a382 64989ea8 6c41979e 2c32ffdc 6a95e25b b7fe682c), re-measured on this machine vs main 271276a; online gate vs wrangler dev: Quick Match + private room hk1 WIN 0 desyncs (48a82857 = 48a82857, c95b6178 = c95b6178), room full ok, pause 301/301 paused frames, ?coopbot WIN, reconnect (kill @3000 → re-sim + drop @6000) 3fe5f539 = 3fe5f539, 60 s bot takeover + rejoin 1fb767fa = 1fb767fa, netsim 150,30 paced 0 desyncs (D 8: stall 34.5 %; fixed D 12: 0 %); deployed worker quick + room WIN 0 desyncs rtt 16-17 ms; cross-engine full hk1 dmath Node = Chrome = WebKit 26/26 (native Math splits ≤ frame 600); real pages Chrome × Chrome 30/30 hashes, Chrome × WebKit 15/15 local + 20/20 deployed; lobby 844×390 + 390×844 all buttons ≥ 44 px hit-testable; 2P rules 5/5; boss 1300 → 2080, officer 360 → 468; messages ≈ 4.3 k / client / hk1 (≈ 650-1 060 / min); verify.sh green except shots-scroll ch1 / hk1 (fail on main too: main 4-5/6 + 5-6/7, branch 3-6/6 + 4-6/7 over 3 runs) |
| Team Musou 齊上齊落 (co-op) | done (branch coop-team-musou) | team gate 21/21 (call → answer, no answer → caller's solo Musou 90 ticks after the call with the partner's gauge kept, out of range → solo, same tick → no caller, downed partner → solo; radius 11.7 m ≥ 1.5 × 7.8; budget 417 = 1.5 × (126 + 152); gauges 0 → 0; both refused hurt() and in 'musou' for 300 ticks; boss 250.00 of 1000 = 25 % cap, officer 351.8 of 1000 uncapped); online team vs wrangler dev 7/7 runs after the harness fix: hk1 WIN, 0 desyncs, finals equal, 5-7 Team Musous each, event 2 timeout, same-tick by event 3 (one earlier run failed the base check, cause not captured); team look (two real pages) 14/14 #debug; 2P rules 5/5 (gauge check now skips both-empty frames); ch1 Node 6/6 identical |

**Next action:** none — all stages done; 8·12 機場 hk5 removed 2026-10-05 (campaign back to hk1 → hk4); open P2s below.

**MILESTONE — Ch I playable** (2026-09-29): hk1 金鐘 plays start to finish (bot + touch). Preview: https://hk-freedom-voxel-dtpn479sy-sharkgundams-projects.vercel.app (READY; Vercel Authentication — log in to view).

## Contract ids (Contracts page)

- chars `lungjai` `siumei` · officers `raptor` `plain` · bosses `stamp` `shocker` `fixer` `bear` `clone`
- crowd skins: foe `riot` `white` · ally `blackbloc` `civil`
- chapters `hk1` `hk2` `hk3` `hk4` · maps `admiralty` `legco` `yuenlong` `polyu`
- **removed 2026-10-05 (was stage 11, 8·12 airport):** chapter `hk5` · map `airport` · boss / officer model `commander`
  (速龍指揮官 Raptor Commander, phases 50 / 25 %) · SPK keys `traveller` `commander`
- zones — admiralty: `harcourt` `footbridge` `hqgate` `lawn` (gates `policeLine` `hqGate`) · legco: `plaza` `glass`
  `lobby` `chamber` (gates `glassWall` `chamberDoor`) · yuenlong: `street` `concourse` `faregates` `platform` (gates
  `fareGates` `platformStairs`) · polyu: `podium` `bridge` `maingate` `rooftop` (gates `barricade` `mainGate`) ·
  airport: `arrivals` `carousels` `departures` `deck` (gates `securityLine` `deckEscalator`)
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
- Open P2s (stage 9): KO'd officers kneel with a raised fist (frozen crowd kneelPose); interiors (LegCo lobby, Yuen Long
  concourse) still bright on the mobile tier; the Musou copy column sits near the chain counter on phones; the title's name
  tags crowd the banners at 844×390; hk3 is the shortest chapter (≈ 3.5 min for the bot); dead soldiers dissolve as dark
  dither (upstream) which reads heavy against the dark riot palette; 41 Cantonese-only glyphs (㗎 嘅 喺 …) are not in Yuji
  Boku and fall back to the system serif on non-Mac devices.
- brush.woff2 re-subset from Yuji Boku (Google Fonts, OFL) to 830 glyphs (was 560 of the 871 used): ch1 scroll frames stay
  pixel-identical on macOS (Xingkai first); all scroll refs re-saved once after the ink-map label moves (asset change).
- Cutscenes (branch cutscenes-ending): src/story/cutscenes/ (player.js screen, kit.js, sound.js, between1-3.js,
  ending.js). Hooks: main.js registers the `cutscene` screen with a small stage api (setMap, clearField) and hides the
  battle hero during it; result.js 繼續 after a story win with `after` → cutscene → next chapter; prologue.js ENDING →
  end scene (chapter `endScene`) → tribute, ending-scroll sound, and a tap during the ink wipe is deferred (it was
  swallowed); audio.js exports BUS (the one AudioContext + buses); 小美's model honours rig.umbrellaMode (render-only,
  cutscenes). The stand-in crowd is the real crowd view over a hand-placed crowd (built once, emptied between scenes).
- The ending is the game's fiction (Hong Kong wins its freedom); the chapter epilogues keep the Phaser game's 2019 history.
  The brief's '夥慨道' is written 夏慤道 (same fix as the Scroll Cutscenes page).
- 龍仔's hat-off head is the shipped head minus the hat boxes, so the crown shows skin where the hat sat (no new hair).
- Scroll-frame gate flaked twice on the first cold run in this clone (a different frame each time), then 4/4 clean.

- 2026-10-03 C2: 777 (`stamp`) is a woman — a female senior official, original archetype: grey-blue skirt suit, ivory
  blouse, silver bob, pearls (no tie). New hkkit options skirt / legs / pearls / bob / lips (default off). Lines were
  already gender-neutral.
- 2026-10-03 8·12 機場 (stage 11): chapter id `hk5`, map `airport` (ids hk1–hk4 keep their meaning; no saves depend on
  chapter order — only the 修羅 unlock and the difficulty are stored). Campaign order 金鐘 hk1 → 立法會 hk2 → 元朗 hk3 →
  機場 hk5 → 理工 hk4 (LIST order in chapters.js = menus + the 繼續 chain). Flow: hk3's win now chains straight into hk5
  (new chapter field `chain`, result.js: 繼續 → next chapter's loading card, no cutscene); 竹枝 between3 (a PolyU scene)
  moved to after hk5, so it still leads into hk4; ENDING / end scene / tribute untouched. Chapter numbers on screen: 機場
  第四章 · CHAPTER IV, 理工 renumbered 第五章 · CHAPTER V (title + stamp); 銅鑼灣 / 中大 will renumber again when they land.
- hk5 stage: 接機大堂 hold the sit-in 60 s → 行李帶 walk eight travellers through the centre lane and the security line
  (hk3's passenger escort; > 3 lost = defeat) → 離境閘口 the flights are cancelled (boards flip to 取消), bring four
  stranded travellers to the escalator (hk2 / hk4 followers) and down the 速龍 → 觀景台 速龍指揮官 (new boss `commander`
  on the 速龍 kit: charges, pepper-ball volleys < 50 %, calls 速龍 < 25 %). The departure boards (canvas, three in the
  world) show the live objective on their top row and cities only below (no airline names or codes). The fights are the
  game's fiction. Bot 5:04-5:55 sim (hk1-4: 3.5-7.5); a human run is longer. In-play dialogue ≈ 33 s (11 lines), banners
  1-4 words; prologue 5 cards, skippable.
- hk5 epilogue: the Phaser game has no airport chapter, so the CLAUDE.md "epilogue verbatim from story.js" rule can't
  apply; the text is new, plainly worded and sourced (Al Jazeera "Hong Kong airport cancels Monday flights amid sit-in
  protest", 12 Aug 2019; Hong Kong Free Press, 12 Aug 2019, quoting the Airport Authority: "other than the departure
  flights that have completed the check-in process and the arrival flights that are already heading to Hong Kong, all
  other flights have been cancelled for the rest of today"; the sit-in began Friday 9 Aug). Sources also in hk5.js.
- Ink map: hk5 uses HK_MAP plus Lantau / the airport island, two marks and a sit-in arrow added by string replace in
  hk5.js — every other chapter's scroll SVG is byte-identical.
- bench/bot/play-touch.mjs: since PR #2 a stick press near the fixed D-pad re-centres on the pad, so the harness's drag
  (relative to its own press point) carried a constant bias and could walk the hero backwards (first hk5 touch run:
  TIMEOUT at the arrival-hall wall). The harness now steers from where the stick base actually landed.
  bench/harness/touch-twin.mjs had the same bias and failed 4/7 on main (dbd6603) as well; same fix → 7/7 (input logs
  identical, in-page hashes 5/5, Node final b08625f0 = b08625f0).
- verify.sh on stage/airport (2026-10-03): every gate green except the two scroll-frame reference gates (shots-scroll ch1
  / hk1), which flake on this machine on main too (main dbd6603, eight runs: 6/6 twice, else 4/6 or 5/6, a different
  frame failing from run to run; branch: 3/6-5/6 in ten runs while the machine sat at load ≈ 5). Nothing on the branch touches ch1.js, hkmap.js,
  prologue.js or index.html; hk5's map is a string copy of HK_MAP.

- 2026-10-04 Online co-op 2P (Notion "CLI Brief — Online Co-op 2P", branch coop-online, PR #5): everything behind `?coop`.
  Worker `hk-freedom-coop` deployed at https://hk-freedom-coop.icomppower.workers.dev (`cd coop-server && npm run
  coop:deploy`, token in the gitignored .env) — the brief said Johnny deploys by hand; the resume run was told to deploy.
  The server uses plain `DurableObject` classes (Viking Row's structure), not the PartyServer lib.
  Simplest readings: scrolls — each player reads / skips their own prologue, the lockstep clock only runs once both are
  in the battle (= the battle starts when both are done); between-chapter cutscenes are skipped in co-op (result →
  返回房間 → the room's lobby). Co-op is pinned to 普通 Normal and a 300-strong crowd on every device (the sims must
  match). Boss projectiles (frozen code) still aim at the lead hero. The input-delay cap stays at the brief's 8 ticks
  (`?coopdmax=` overrides for testing). Message budget: input runs (only changed ticks, ≤ 1 msg / 3 ticks, idle
  heartbeat ≈ 250 ms promising "no change" ahead — up to 250 ms extra delay on the first input after a quiet spell).
  Gotchas found: workerd at this compatibility date doesn't answer a client's close frame (the server must `close()`,
  else the client's onclose never fires and it never reconnects); per-message setTimeout netsim reordered messages
  (truncated ms) → FIFO queue; .vercelignore must ship bench/bot (src/net/coopbot.js imports the bot policy).
- 2026-10-05 Team Musou 齊上齊落 (brief "CLI Brief — Team Musou"): "both gauges full" read as both Musou-ready (≥ 1 segment, what lights the
  button) and it spends each gauge fully; the team radius is max(9 m, 1.5 × the larger solo radius 7.8 m) = 11.7 m (the brief's
  9 m would break its own ≥ 1.5 × rule); the boss cap never binds on 777 (2080 HP: 25 % = 520 > the 417 team total) but does on
  smaller bosses; the caller's "call pose" is the ring timer + link line + call card (no new clip); the co-op bot now saves a ready
  gauge for the partner and calls within 6 m (slot 0 on frame % 7 = 0, slot 1 on 3) so ?coopbot / bot takeover play it too.
