// 小咩's kit (contract: src/chars/index.js): the twin-shears moveset (moves.js, anims.js) on the dual-wield rig, the voxel
// lamb (model.js), 千剪飛花 (musou.js) and its view (view.js). The trail follows the striking blade (moves `hand`).
import { MOVES, AIR_CHAIN_MAX } from './moves.js';
import { SIUME_CLIPS, runPose, rollPose } from './anims.js';
import { createSiumeModel, createSiumeSecondary, SHEAR } from './model.js';
import { createMusou } from './musou.js';
import { createMusouView } from './view.js';

export const SIUME_KIT = {
  moves: MOVES, airChainMax: AIR_CHAIN_MAX,
  clips: SIUME_CLIPS, feet: {},
  runPose, rollPose,
  dashPlant: MOVES.dash.lunge[1][0] + 3,
  model: createSiumeModel, secondary: createSiumeSecondary,
  trail: { base: 0.05, baseHeavy: 0.0, tip: SHEAR.tip },
  // vfx.js heavy / charge palette: red and steel (linear HDR)
  fx: {
    needle: [[2.8, 0.7, 0.6], [2.4, 2.4, 2.6], [3.0, 1.2, 1.0]],
    hot: [[0.6, 0.12, 0.1], [0.62, 0.2, 0.16], [0.66, 0.3, 0.26], [2.4, 1.6, 1.5]],
    burst: [0.6, 0.12, 0.1], flash: [2.8, 1.4, 1.3], slash: [3.0, 1.6, 1.5], pulse: [1.9, 0.4, 0.3],
    light: [1, 0.5, 0.45], crack: [2.8, 0.8, 0.6], wall: [1.4, 0.35, 0.3], ring: [2.2, 0.8, 0.7], shard: [2.6, 2.4, 2.6],
    glint: [2.6, 2.6, 2.9], glitter: [2.8, 1.6, 1.5],
    glow: [0x8a1c18, 0xe05048, 0.3],
    trail: { white: [1.1, 0.95, 0.95], fringe: [1.0, 0.18, 0.14], hot: [1.7, 1.3, 1.25], glow: [1.5, 0.28, 0.22] },
  },
  createMusou, createMusouView,
};
