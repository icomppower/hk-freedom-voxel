# PROGRESS

One-shot build of 羊村 · 霧港渡 (Notion: "One-Shot Build Prompt — 羊村 · 霧港渡"). Resume from the first stage not `done`.

| Stage | Status | Gate numbers |
|---|---|---|
| 0 Harness | done | 4 Node logs replay identical (ch1 × zhaoyun / huangzhong, 7 200 + 36 000 f); Chrome 6/6 checkpoints stable run to run |
| 1 Seam | todo | |
| 2a Scroll player | todo | |
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

**Next action:** stage 1 seam — chapter / map / character registries + chapter pick on select.

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
