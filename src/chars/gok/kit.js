// 阿角's kit (contract: src/chars/index.js): the crook moveset (moves.js, anims.js), the voxel ram on the shared rig
// (model.js), 牧羊歸欄 + the hook pull (musou.js) and its view (view.js). Locomotion physics, dodge ghosts and roll are
// shared (hero.js); the locomotion clips are Zhao Yun's (a crook carries like a spear).
import { MOVES, AIR_CHAIN_MAX } from './moves.js';
import { GOK_CLIPS, runPose, rollPose } from './anims.js';
import { createGokModel, createGokSecondary, CROOK } from './model.js';
import { createMusou } from './musou.js';
import { createMusouView } from './view.js';

export const GOK_KIT = {
  moves: MOVES, airChainMax: AIR_CHAIN_MAX,
  clips: GOK_CLIPS, feet: {},
  runPose, rollPose,
  dashPlant: MOVES.dash.lunge[1][0] + 4,
  model: createGokModel, secondary: createGokSecondary,
  trail: { base: 0.78, baseHeavy: 0.55, tip: CROOK.tip },           // crook ribbon: distances along the shaft (vfx.js spearWorld)
  // vfx.js heavy / charge palette: warm cream and gold (linear HDR)
  fx: {
    needle: [[2.6, 2.2, 1.5], [2.4, 1.7, 0.8], [2.8, 2.6, 2.0]],
    hot: [[0.5, 0.36, 0.14], [0.56, 0.42, 0.18], [0.6, 0.5, 0.26], [2.2, 1.9, 1.3]],
    burst: [0.5, 0.36, 0.16], flash: [2.5, 2.1, 1.4], slash: [2.8, 2.3, 1.4], pulse: [1.7, 1.2, 0.5],
    light: [1, 0.85, 0.6], crack: [2.6, 1.8, 0.8], wall: [1.2, 0.9, 0.45], ring: [2.0, 1.7, 1.1], shard: [2.4, 2.0, 1.3],
    glint: [2.6, 2.2, 1.4], glitter: [2.6, 2.3, 1.7],
    glow: [0x8a6a30, 0xe0c080, 0.3],
    trail: { white: [1.1, 1.02, 0.86], fringe: [0.9, 0.62, 0.22], hot: [1.6, 1.45, 1.1], glow: [1.3, 0.95, 0.4] },
  },
  createMusou, createMusouView,
};
