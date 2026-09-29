// 小美's cutscene clips (render-only). Built on her shipped stance (./anims.js SIU, dual-wield: the umbrellas are the
// spear / spearL channels, her hands IK onto their grips). New motion only for the umbrella raise (ending shot c: both
// umbrellas thrust overhead, the scene then swaps them OPEN) and a few held poses: wrapping 龍仔's forearm (umbrellas hidden,
// the grips circle where the bandage goes), sticking a note on the wall, at the train window, the cheer.
import { P, clip } from '../../hero/rig.js';
import { SIU } from './anims.js';

const B = { ...SIU, hipsR: [0, 0, 0], chest: [2, 0, 0], head: [0, 0, 0], footL: [0.13, 0.08, 0.06, 0, 6], footR: [-0.13, 0.08, -0.06, 0, -6] };
const S = (spec) => P({ ...B, ...spec }, SIU);
// overhead, tipped forward and out (58°, ±24°) so the open canopies face the lens instead of edge-on
const UP = { spear: [-0.28, 1.8, 0.24, -24, 58, 90], spearL: [0.28, 1.8, 0.24, 24, 58, -90], head: [-16, 0, 0], chest: [-6, 0, 0] };
const wrap = (a) => ({ spear: [-0.06 + Math.sin(a) * 0.05, 1.08 + Math.cos(a) * 0.05, 0.42, 0, 0, 90], spearL: [0.12, 1.06, 0.4, 0, -10, -90], head: [18, 0, 0], chest: [12, 0, 0] });

export const CUT = {
  rest: clip([[0, S({})], [0.5, S({ chest: [3, 0, 0], hips: [0, 0.895, 0] })], [1, S({})]], true),
  /** umbrella raise (0.6 s): both thrust overhead (the scene swaps them open at the end) */
  raise: clip([[0, S({})], [0.55, S({ ...UP, hips: [0, 0.94, 0] }), 'snap'], [1, S({ ...UP })]]),
  /** held overhead, open, bouncing with the cheer (1 s loop) */
  cheer: clip([[0, S({ ...UP, hips: [0, 0.94, 0] })], [0.5, S({ ...UP, spear: [-0.3, 1.74, 0.22, -30, 52, 90], spearL: [0.3, 1.74, 0.22, 30, 52, -90], hips: [0, 0.88, 0] })], [1, S({ ...UP, hips: [0, 0.94, 0] })]], true),
  /** wrapping a forearm (1.2 s loop), umbrellas hidden */
  wrap: clip([0, 0.25, 0.5, 0.75, 1].map((u) => [u, S(wrap(u * Math.PI * 2))]), true),
  /** reaching up to stick a note on the wall in front of her (2 s) */
  note: clip([[0, S({})], [0.5, S({ spear: [-0.12, 1.55, 0.5, 0, 20, 90], head: [-10, 0, 0] }), 'out'], [0.75, S({ spear: [-0.12, 1.52, 0.56, 0, 10, 90], head: [-8, 0, 0] })], [1, S({ spear: [-0.2, 1.3, 0.3, 0, -20, 90], head: [-4, 0, 0] })]]),
  /** at the window, looking out (loop) */
  window: clip([[0, S({ head: [2, 70, 0], chest: [2, 20, 0] })], [0.5, S({ head: [0, 66, 0], chest: [3, 20, 0] })], [1, S({ head: [2, 70, 0], chest: [2, 20, 0] })]], true),
};
