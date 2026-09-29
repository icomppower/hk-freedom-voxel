# 香港自由戰士 HK Freedom Fighter · Voxel

3D voxel rebuild of the Phaser game 香港自由戰士 (`icomppower/hkfreedomfighter`, live on Vercel — never touch it, its
Vercel project, or `icomppower/sheep-village`). Copied from `icomppower/sheep-village` (remote `engine`), which is a
reskin of `mike007jd/voxel-musou` (MIT; remote `upstream`). Spec lives in Notion (project page "香港自由戰士 · Voxel"
and its child pages: Story Bible, Contracts, Character Sheets, Box Moveset, Scroll Cutscenes, One-Shot Build Prompt);
state of the build is in `PROGRESS.md` — read it first and resume from the first unfinished stage.
`git pull` / `git fetch` are denied on purpose: work in a fresh `gh repo clone`.

## Ground rules

- **Frozen engine** — do not edit: `src/core/`, `src/hero/rig.js`, `src/hero/model.js` (vox mesher, `bodyParts`,
  `buildBody`), `src/hero/secondary.js`, `src/crowd/`, `src/combat/`, `src/post/`, `vendor/`. Exceptions: the
  sheep-village stage-2 hooks (scroll player, dual-wield rig, crowd skin + officer hook, bot driver) and this game's
  stage-1 touch hook (`src/ui/touch.js`, one input-injection hook in `src/core/input.js`, one quality-tier hook in
  `src/post/post.js` / `main.js`, `#touch` CSS) — each its own commit gated on unchanged ch1 hashes.
- **Content lives in new folders only**: `src/chars/<id>/`, `src/chars/officers/hk/`, `src/story/hk*.js`,
  `src/world/maps/<map>/`, `src/world/maps/hkkit/`, `bench/`. Registries / README / menus: one-line imports only.
- Sim stays deterministic: `rng` for sim, `vrng` for visuals, fixed 60 Hz.
- Every commit message states measured before → after numbers (hashes, tris, ms, frames).
- **People rule:** no real person's likeness; bosses are original archetypes under the Phaser game's nicknames. No
  Pikachu / Winnie-the-Pooh features, colours or silhouettes. No real flags, badges, force insignia, party emblems or
  slogan text on any model (riot kit: plain dark blue, blank patch). Epilogue history text verbatim from the Phaser
  game's `src/data/story.js`. Tribute-card link stays TBD. Keep upstream MIT + sheep-village credit in README.
- Contract ids exactly as the Contracts page: chars `lungjai` `siumei`; officers `raptor` `plain`; bosses `stamp`
  `shocker` `fixer` `bear` `clone`; crowd skins `riot` `white` (foe), `blackbloc` `civil` (ally); chapters `hk1`–`hk4`;
  maps `admiralty` `legco` `yuenlong` `polyu`; SPK keys `lungjai` `siumei` `raptor` `plain` `stamp` `shocker` `fixer`
  `bear` `sauzuk` `medic` `reporter` `passenger` (zones / gates in PROGRESS.md).
- 定軍山 `ch1` and 趙雲 / 黃忠 stay registered as the hash gate but show on menus only with `?dev`.
- Ambiguous spec → simplest reading, note it in PROGRESS.md, carry on. Stop and ask only if a gate cannot pass without
  breaking the frozen-engine rule.

## Harness (`bench/harness/`, Node ≥ 22, `npm install` once for playwright-core)

- `sh bench/verify.sh [--quick]` — every gate in order.
- `npm run gate` — replays every `logs/*.json` in a cold Node process each and compares state hashes (the ch1 gate).
- `node bench/harness/xcheck.mjs <log> 3600` — same log driven through the real page in headless Chrome vs the log's
  Chrome checkpoints. Node and Chrome hashes differ by design (V8 trig rounds differently in the last ulp).
- `npm run record -- --char zhaoyun` — record a scripted log; `record-browser.mjs` records a human session.
- `browser.mjs` serves the repo and patches `main.js` at serve time only: `window.__vm`, `window.__onStep(inp)`.
- Some state carries from one battle to the next inside one page load (upstream behaviour), so a log is only
  reproducible from a cold start — one log per process / page.
- Screenshots / GIFs per stage go in `bench/shots/<stage>/`.
