// 小美's kit (contract: src/chars/index.js): the twin-umbrella moveset (moves.js, anims.js) on the dual-wield rig, the voxel
// first-aider (model.js, with the open / closed canopy swap), 旋風腿 (musou.js) and its view (view.js). The trail follows
// the striking umbrella (moves `hand`).
import { MOVES, AIR_CHAIN_MAX } from './moves.js';
import { SIUMEI_CLIPS, runPose, rollPose } from './anims.js';
import { createSiumeiModel, createSiumeiSecondary, UMB } from './model.js';
import { createMusou } from './musou.js';
import { createMusouView } from './view.js';

export const SIUMEI_KIT = {
  moves: MOVES, airChainMax: AIR_CHAIN_MAX,
  clips: SIUMEI_CLIPS, feet: {},
  runPose, rollPose,
  dashPlant: MOVES.dash.lunge[1][0] + 3,
  model: createSiumeiModel, secondary: createSiumeiSecondary,
  trail: { base: 0.2, baseHeavy: 0.1, tip: UMB.tip },
  // vfx.js heavy / charge palette: pink and gold (linear HDR)
  fx: {
    needle: [[2.9, 1.0, 1.6], [2.7, 2.2, 0.6], [3.0, 1.6, 2.0]],
    hot: [[0.6, 0.2, 0.36], [0.62, 0.3, 0.42], [0.66, 0.4, 0.48], [2.5, 1.7, 1.9]],
    burst: [0.6, 0.2, 0.36], flash: [2.8, 1.8, 2.0], slash: [3.0, 1.8, 2.2], pulse: [1.9, 0.6, 1.0],
    light: [1, 0.6, 0.75], crack: [2.8, 1.0, 1.4], wall: [1.4, 0.5, 0.8], ring: [2.4, 1.3, 1.5], shard: [2.8, 2.2, 0.8],
    glint: [2.8, 2.4, 1.0], glitter: [2.8, 1.8, 2.0],
    glow: [0x8a2050, 0xf48fb1, 0.3],
    trail: { white: [1.15, 1.0, 1.05], fringe: [1.0, 0.3, 0.55], hot: [1.7, 1.35, 1.45], glow: [1.5, 0.45, 0.8] },
  },
  createMusou, createMusouView,
};
