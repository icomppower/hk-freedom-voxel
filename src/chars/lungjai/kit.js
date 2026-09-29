// 龍仔's kit (contract: src/chars/index.js): the 竹棍 bamboo-pole moveset (moves.js, anims.js), the voxel protester on the
// shared rig (model.js), 龍拳 Dragon Fist (musou.js) and its view (view.js). Locomotion physics, dodge ghosts and roll
// are shared (hero.js); the locomotion clips are Zhao Yun's (a pole carries like a spear).
import { MOVES, AIR_CHAIN_MAX } from './moves.js';
import { LUNGJAI_CLIPS, runPose, rollPose } from './anims.js';
import { createLungjaiModel, createLungjaiSecondary, POLE } from './model.js';
import { createMusou } from './musou.js';
import { createMusouView } from './view.js';

export const LUNGJAI_KIT = {
  moves: MOVES, airChainMax: AIR_CHAIN_MAX,
  clips: LUNGJAI_CLIPS, feet: {},
  runPose, rollPose,
  dashPlant: MOVES.dash.lunge[1][0] + 4,
  model: createLungjaiModel, secondary: createLungjaiSecondary,
  trail: { base: 0.9, baseHeavy: 0.6, tip: POLE.tip },              // pole ribbon: distances along the shaft (vfx.js spearWorld)
  // vfx.js heavy / charge palette: hard-hat gold on black (linear HDR)
  fx: {
    needle: [[2.8, 2.3, 0.6], [2.6, 1.9, 0.3], [3.0, 2.7, 1.2]],
    hot: [[0.55, 0.42, 0.06], [0.6, 0.48, 0.1], [0.66, 0.54, 0.16], [2.4, 2.0, 0.6]],
    burst: [0.55, 0.42, 0.08], flash: [2.6, 2.2, 0.9], slash: [2.9, 2.4, 0.8], pulse: [1.8, 1.4, 0.3],
    light: [1, 0.86, 0.4], crack: [2.6, 1.9, 0.5], wall: [1.3, 1.0, 0.25], ring: [2.2, 1.8, 0.6], shard: [2.5, 2.1, 0.8],
    glint: [2.7, 2.3, 0.9], glitter: [2.7, 2.4, 1.2],
    glow: [0x8a7000, 0xffd700, 0.3],
    trail: { white: [1.15, 1.05, 0.7], fringe: [1.0, 0.72, 0.05], hot: [1.7, 1.5, 0.8], glow: [1.4, 1.1, 0.2] },
  },
  createMusou, createMusouView,
};
