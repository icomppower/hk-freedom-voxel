// Huang Zhong's kit (contract: src/chars/index.js): the bow moveset (moves.js, anims.js), the voxel veteran on the shared
// rig in bow mode (model.js), the per-battle sim with 百步穿楊, the arrow pool and aim mode (musou.js, aim.js), and its
// view (view.js: arrows, aim preview, Musou presentation). Locomotion physics, dodge ghosts and roll are shared.
import { MOVES, NEUTRAL, AIR_CHAIN_MAX } from './moves.js';
import { HZ_CLIPS, ATTACK_CLIPS, runPose, rollPose } from './anims.js';
import { createHzModel, createHzSecondary } from './model.js';
import { applyRoll, createDodgeGhosts } from '../../hero/anims/locomotion.js';
import { createMusou } from './musou.js';
import { createMusouView } from './view.js';

export const HUANGZHONG_KIT = {
  moves: MOVES, neutral: NEUTRAL, airChainMax: AIR_CHAIN_MAX,
  clips: HZ_CLIPS, attackClips: ATTACK_CLIPS, feet: {},
  runPose, rollPose,
  dashPlant: -1,                  // the dash is a slide: no lunge landing
  hpMax: 400, musouMax: 100,
  model: createHzModel, secondary: createHzSecondary, ghosts: createDodgeGhosts, applyRoll,
  trail: null,                    // the bow-blade ribbon is drawn by model.js (the limb is off the weapon line)
  createMusou, createMusouView,
};
