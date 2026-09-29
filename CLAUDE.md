# 羊村 · 霧港渡 Sheep Village: Fog Harbor Crossing

Reskin of `mike007jd/voxel-musou` (MIT; remote `upstream`) with an original storyline and cast. Spec lives in Notion
("Voxel Musou Reskin — Prompt Workflow" and its child pages); state of the build is in `PROGRESS.md` — read it first
and resume from the first unfinished stage.

## Ground rules

- **Frozen engine** — do not edit: `src/core/`, `src/hero/rig.js`, `src/hero/model.js` (vox mesher, `bodyParts`,
  `buildBody`), `src/hero/secondary.js`, `src/crowd/`, `src/combat/`, `src/post/`, `vendor/`. The only exceptions are the
  stage-2 engine hooks (scroll player, dual-wield rig, crowd skin + officer hook, bot driver), each its own commit gated
  on unchanged ch1 hashes.
- **Content lives in new folders only**: `src/chars/<id>/`, `src/story/<chapter>.js`, `src/world/maps/<map>/`, `bench/`.
- Edits to upstream files only in the **seam commit** (stage 1) and the stage-2 hooks. Everything after touches new
  files (plus one-line registry imports), so upstream stays pullable.
- Sim stays deterministic: `rng` for sim, `vrng` for visuals, fixed 60 Hz.
- Every commit message states measured before → after numbers (hashes, tris, ms, frames).
- Original designs only. No copying any game's character art, logos or product names; wolves wear plain grey kit with no
  flags, insignia or symbols. Keep upstream MIT credit in README. Happy ending: everyone comes home.
- Contract ids exactly as the Contracts page: chars `gok` `siume`; officers `grey` `shadow` `iron` `warden`; grunt skin
  `wolf`; chapters `sheep1` `sheep2` `sheep3`; maps `pasture` `lantern` `harbor` (zone / gate ids in PROGRESS.md).
- Ambiguous spec → simplest reading, note it in PROGRESS.md, carry on. Stop and ask only if a gate cannot pass without
  breaking the frozen-engine rule.

## Harness (`bench/harness/`, Node ≥ 22, `npm install` once for playwright-core)

- `npm run gate` — replays every `logs/*.json` in a cold Node process each and compares state hashes (the ch1 gate).
- `node bench/harness/xcheck.mjs <log> 3600` — same log driven through the real page in headless Chrome vs the log's
  Chrome checkpoints. Node and Chrome hashes differ by design (V8 trig rounds differently in the last ulp).
- `npm run record -- --char zhaoyun` — record a scripted log; `record-browser.mjs` records a human session.
- `browser.mjs` serves the repo and patches `main.js` at serve time only: `window.__vm`, `window.__onStep(inp)`.
- Some state carries from one battle to the next inside one page load (upstream behaviour), so a log is only
  reproducible from a cold start — one log per process / page.
