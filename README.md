# 香港自由戰士 HK Freedom Fighter · Voxel

**Play:** _Vercel project `hk-freedom-voxel` — URL added once the first production deploy is live._

A 3D voxel rebuild of the Phaser beat 'em up [香港自由戰士](https://hk-freedom-fighter.vercel.app) on the Voxel Musou
engine. Hong Kong, June – November 2019: real places, fictional heroes. Two playable fighters — 龍仔 Dragon (bamboo
pole) and 小美 Amy (twin umbrellas) — across four chapters: 金鐘 Admiralty · 立法會 LegCo · 元朗 Yuen Long ·
理工大學 PolyU, then the ending and a tribute card.

Plain ES modules, Three.js r186 vendored, deterministic fixed 60 Hz simulation, no build step. Built on
[icomppower/sheep-village](https://github.com/icomppower/sheep-village)'s engine hooks (scroll player, dual-wield rig,
crowd skins, officer models, bot), itself a reskin of [mike007jd/voxel-musou](https://github.com/mike007jd/voxel-musou).
Upstream's 定軍山 chapter stays in the repo behind `?dev` as the determinism gate.

## Run

ES modules don't load from `file://`, so serve the folder with any static server:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000 . Needs a WebGL2 browser; a desktop GPU is recommended.

## Controls

Keyboard and mouse, or a gamepad.

| Action | Keys | Gamepad |
| --- | --- | --- |
| Move (camera-relative) | WASD / arrow keys | left stick |
| Attack | J / left click | X □ |
| Charge | K / right click (mid-combo) | Y △ |
| Jump | Space | A × |
| Dodge | L / Shift | R1 R2 |
| Musou (gauge full) | I | B ○ |
| Camera | mouse (click the field to lock it) / Q E | right stick |
| Recenter / face nearest officer | R | L1 L2 |
| Pause / controls | Esc | |

## Tests

`sh bench/verify.sh` runs every gate: upstream Chapter I state hashes (Node + headless Chrome), rig and dual-wield
probes, the ch1 bot, crowd and scroll pixel hashes; later stages add character, boss, map, chapter-bot and touch gates.
`--quick` skips the Chrome half. Build log: `PROGRESS.md`.

## Credits & License

- Engine and original game: [mike007jd/voxel-musou](https://github.com/mike007jd/voxel-musou) by BubuAi — MIT, see
  [LICENSE](LICENSE). Engine hooks from [icomppower/sheep-village](https://github.com/icomppower/sheep-village) (MIT).
  The HK Freedom Fighter content is added on top under the same license.
- The original 2D game: [香港自由戰士 (Phaser)](https://hk-freedom-fighter.vercel.app) — cast, boss phases and the
  chapter history text come from it.
- [three.js](https://threejs.org/) r186 — MIT.
- Fallback brush font `src/ui/brush.woff2`: a subset of Yuji Boku by Kinuta Font Factory, SIL Open Font License 1.1.
  macOS system fonts (Xingkai SC, Kaiti SC) are used when present.

All characters are fictional; no real person is depicted. Places and dates are real. Fan project, not affiliated with
or endorsed by KOEI TECMO; no assets from any commercial game are included.
