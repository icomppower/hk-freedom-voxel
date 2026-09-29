// 阿角's clips: attack clips per move id (./moves.js) through the shared clip kit (planted, baked feet), the Musou clip,
// and Zhao Yun's locomotion clips / run / roll (a crook carries like a spear). Authoring: P() over GOK (his ready stance:
// crook across the body, hook up and forward); the crook is the rig's spear joint (origin = rear grip, +Z along the
// shaft, hook at ≈ 1.45 m). crook(centre, yaw, elev, roll) = the shaft through `centre` 0.35 m from the rear grip.
// N1–N3, C1 and the Musou are ported from the 羊村 box-moveset sample (bench/sheep/sample-recovered.js); the rest follow
// the Character Sheets (C2 hook launcher, C3 270° sweep, C4 planted-crook shockwave, C5 vaulting kick, C6 full spin).
import { P, clip, spearAbout, STANCE } from '../../hero/rig.js';
import { LOCO_CLIPS, runPose, rollPose } from '../../hero/anims/locomotion.js';
import { createClipKit } from '../shared/clipkit.js';
import { lungeAt } from '../../hero/moveset.js';
import { MOVES } from './moves.js';

const crook = (c, yaw, elev, roll = 0, at = 0.35) => spearAbout(c, yaw, elev, roll, at);
export const GOK = { ...STANCE, spear: crook([-0.02, 1.02, 0.28], 18, 32), gripL: 0.55, hipsR: [0, -20, 0], chest: [4, 6, 0] };
const ENTRY = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5' };
const { clipF, ft } = createClipKit(MOVES, ENTRY, GOK);
const L = (id, f) => lungeAt(MOVES[id], f);
/** Lead-foot step landing `z` m ahead of the stance spot at move frame f (move-start coords include the lunge so far). */
const lead = (id, f, z = 0.2, x = 0.2, yaw = 12) => [x, 0.08, 0.3 + z + L(id, f), 0, yaw];
/** Crook held out level at heading `yaw` (° off his facing, + = left), body twisted `tw`° with it. */
const out = (yaw, elev = -5, tw = yaw * 0.4, extra) => ({
  spear: crook([Math.sin(yaw * Math.PI / 180) * 0.3, 1.08, 0.1 + Math.cos(yaw * Math.PI / 180) * 0.3], yaw, elev),
  chest: [6, tw, 0], hipsR: [0, tw * 0.8, 0], spine: [6, tw * 0.3, 0], ...extra });
const OVER = { spear: crook([0, 1.6, 0.05], 0, 95), chest: [-10, 0, 0], head: [-8, 0, 0], hipsR: [0, 0, 0] };
const DOWN = (z = 0.55, elev = -35) => ({ spear: crook([0, 0.9, z], 0, elev), chest: [22, 0, 0], hips: [0, 0.78, 0.1], hipsR: [0, 0, 0] });
const B = {};                                     // = GOK (a key with no overrides)

function attacks() {
  const C = {};
  // ---- N1 勾腳掃 (sample keys)
  C.n1 = clipF('n1', [
    [0, B],
    [10, { spear: crook([-0.25, 0.95, 0.05], -115, -8), chest: [6, -35, 0], hipsR: [0, -45, 0], spine: [8, -10, 0] }],
    [16, { spear: crook([0.15, 0.9, 0.4], 55, -14), chest: [12, 35, 0], hipsR: [0, 15, 0], spine: [10, 10, 0], hips: [0, 0.84, 0.05],
      fL: lead('n1', 16, 0.2) }, 'snap'],
    [24, { spear: crook([0.25, 0.95, 0.3], 85, -5), chest: [8, 40, 0], hipsR: [0, 18, 0], hips: [0, 0.86, 0.04] }],
    [34, B],
  ]);
  // ---- N2 牧杖橫掃
  C.n2 = clipF('n2', [
    [0, B],
    [12, { spear: crook([0.3, 1.2, 0.05], 110, 12), chest: [0, 45, 0], hipsR: [0, 30, 0], spine: [4, 15, 0] }],
    [20, { spear: crook([-0.2, 1.1, 0.25], -120, 5), chest: [6, -40, 0], hipsR: [0, -40, 0], spin: -40, fR: [-0.22, 0.08, -0.2 + L('n2', 20), 0, -50] }, 'snap'],
    [28, { spear: crook([-0.25, 1.05, 0], -160, 0), chest: [4, -50, 0], hipsR: [0, -45, 0], spin: -60 }],
    [40, B],
  ]);
  // ---- N3 頂杖
  C.n3 = clipF('n3', [
    [0, B],
    [10, { spear: crook([-0.05, 1.15, -0.15], 0, 4, 90, 0.5), chest: [0, -15, 0], hipsR: [0, -35, 0], hips: [0, 0.86, -0.05] }],
    [16, { spear: crook([0, 1.15, 0.75], 0, 0, 90, 0.5), chest: [12, 5, 0], hipsR: [0, -5, 0], hips: [0, 0.84, 0.12], fL: lead('n3', 16, 0.32, 0.18, 10) }, 'snap'],
    [24, { spear: crook([0, 1.15, 0.7], 0, 0, 90, 0.5), chest: [10, 5, 0], hips: [0, 0.84, 0.1] }],
    [36, B],
  ]);
  // ---- N4 overhead chop
  C.n4 = clipF('n4', [
    [0, B],
    [10, { ...OVER, hips: [0, 0.92, 0] }],
    [16, { ...DOWN(0.6, -25), chest: [20, 0, 0], fL: lead('n4', 16, 0.3) }, 'snap'],
    [26, { ...DOWN(0.6, -27), chest: [18, 0, 0] }],
    [42, B],
  ]);
  // ---- N5 backhand hook sweep (right → left)
  C.n5 = clipF('n5', [
    [0, B],
    [8, { ...out(-120, 0, -45), hips: [0, 0.86, 0] }],
    [14, { ...out(-40, -6, -15), hips: [0, 0.84, 0.05], fL: lead('n5', 14, 0.25) }, 'lin'],
    [21, { ...out(100, -4, 40) }, 'snap'],
    [30, { ...out(110, -2, 42) }],
    [44, B],
  ]);
  // ---- N6 full spin, crook at arm's length, low finish
  C.n6 = clipF('n6', [
    [0, B],
    [8, { ...out(-100, 0, -40), hips: [0, 0.84, 0] }],
    [14, { ...out(90, -6, 0), spin: 0, hips: [0, 0.8, 0.04] }, 'lin'],
    [22, { ...out(90, -6, 0), spin: -360, hips: [0, 0.78, 0.06] }, 'lin'],
    [34, { ...out(80, -12, 20), spin: -360, hips: [0, 0.76, 0.06], chest: [16, 20, 0] }, 'out'],
    [56, { spin: -360 }],
  ]);
  // ---- C1 hook, drag, slam (sample keys)
  C.c1 = clipF('c1', [
    [0, B],
    [12, { spear: crook([0, 1.1, 0.8], 0, -12, 0, 0.4), chest: [16, 0, 0], hips: [0, 0.82, 0.15], hipsR: [0, 0, 0], fL: lead('c1', 12, 0.35) }, 'snap'],
    [20, { spear: crook([0, 1.12, 0.78], 0, -6, 0, 0.4), chest: [14, 0, 0], hips: [0, 0.82, 0.12], hipsR: [0, 0, 0] }],
    [30, { spear: crook([-0.05, 1.05, 0], 0, 10, 0, 0.4), chest: [-8, 0, 0], hips: [0, 0.88, -0.1], hipsR: [0, 0, 0] }],
    [40, { spear: crook([0, 1.5, 0.05], 0, 95), chest: [-10, 0, 0], hipsR: [0, 0, 0] }],
    [46, { ...DOWN(0.55, -35) }, 'snap'],
    [50, { ...DOWN(0.55, -35) }],
    [56, B],
  ]);
  // ---- C2 hook launcher: crouch, crook low → rip it up
  C.c2 = clipF('c2', [
    [0, B],
    [8, { spear: crook([0, 0.7, 0.6], 0, -40), chest: [20, 0, 0], hips: [0, 0.76, 0.06], hipsR: [0, 0, 0] }],
    [12, { spear: crook([0, 0.68, 0.62], 0, -44), chest: [22, 0, 0], hips: [0, 0.74, 0.07], hipsR: [0, 0, 0], fL: lead('c2', 12, 0.3) }],
    [18, { spear: crook([0, 1.7, 0.45], 0, 72), chest: [-12, 0, 0], head: [-10, 0, 0], hips: [0, 0.95, 0.05], hipsR: [0, 0, 0] }, 'snap'],
    [34, { spear: crook([0, 1.72, 0.42], 0, 76), chest: [-10, 0, 0], head: [-8, 0, 0], hips: [0, 0.93, 0.05], hipsR: [0, 0, 0] }],
    [64, B],
  ]);
  // ---- C3 wide 270° sweep
  C.c3 = clipF('c3', [
    [0, B],
    [12, { ...out(-150, 2, -55), hips: [0, 0.84, 0] }],
    [18, { ...out(-150, 0, -58), hips: [0, 0.82, 0.02], fL: lead('c3', 18, 0.35, 0.26, 20) }],
    [30, { ...out(40, -4, 30), spin: 60, hips: [0, 0.8, 0.06] }, 'lin'],
    [36, { ...out(60, -6, 36), spin: 80, hips: [0, 0.8, 0.06] }, 'out'],
    [52, { ...out(60, -8, 30), spin: 80, hips: [0, 0.82, 0.05] }],
    [70, B],
  ]);
  // ---- C4 planted-crook shockwave
  C.c4 = clipF('c4', [
    [0, B],
    [12, { ...OVER, spear: crook([0.02, 1.7, 0.2], 0, 88), hips: [0, 0.94, 0] }],
    [22, { ...OVER, spear: crook([0.02, 1.76, 0.22], 0, 90), hips: [0, 0.96, 0] }],
    [27, { spear: crook([0, 0.95, 0.5], 0, -78, 0, 0.5), chest: [18, 0, 0], hips: [0, 0.78, 0.08], hipsR: [0, 0, 0], fL: lead('c4', 27, 0.2, 0.26, 20) }, 'snap'],
    [40, { spear: crook([0, 0.9, 0.5], 0, -80, 0, 0.5), chest: [24, 0, 0], hips: [0, 0.72, 0.1], hipsR: [0, 0, 0] }],
    [60, { spear: crook([0, 0.95, 0.5], 0, -80, 0, 0.5), chest: [20, 0, 0], hips: [0, 0.76, 0.08], hipsR: [0, 0, 0] }],
    [76, B],
  ]);
  // ---- C5 vaulting kick over the shaft (the sim leap lifts the root; the legs swing up and through)
  C.c5 = clipF('c5', [
    [0, B],
    [12, { spear: crook([0, 0.95, 0.6], 0, -62, 0, 0.5), chest: [22, 0, 0], hips: [0, 0.78, 0.08], hipsR: [0, 0, 0], fL: lead('c5', 12, 0.2) }],
    [20, { spear: crook([0, 0.7, 0.3], 0, -80, 0, 0.9), chest: [10, 0, 0], hips: [0, 0.92, 0], hipsR: [0, 0, 0],
      fL: [0.18, 0.3, 0.4 + L('c5', 20), -20, 10], fR: [-0.18, 0.25, 0.1 + L('c5', 20), -20, -10] }],
    [30, { spear: crook([0, 0.5, -0.2], 0, -84, 0, 1.1), chest: [-18, 0, 0], head: [10, 0, 0], hips: [0, 0.96, 0], hipsR: [0, 0, 0],
      fL: [0.16, 0.9, 0.9 + L('c5', 30), -60, 10], fR: [-0.16, 0.7, 0.8 + L('c5', 30), -50, -10] }, 'snap'],
    [36, { spear: crook([0, 0.6, -0.1], 0, -80, 0, 1.0), chest: [-12, 0, 0], hips: [0, 0.96, 0], hipsR: [0, 0, 0],
      fL: [0.16, 0.7, 0.7 + L('c5', 36), -40, 10], fR: [-0.16, 0.6, 0.6 + L('c5', 36), -30, -10] }],
    [45, { spear: crook([0.1, 1.1, 0.3], 20, 20), chest: [10, 0, 0], hips: [0, 0.9, 0], hipsR: [0, 0, 0],
      fL: [0.2, 0.3, 0.4 + L('c5', 45), -10, 10], fR: [-0.2, 0.3, 0.0 + L('c5', 45), -10, -20] }],
    [47, { ...DOWN(0.5, -30), hips: [0, 0.74, 0.08], fL: [0.22, 0.08, 0.45 + L('c5', 47), 0, 15], fR: [-0.22, 0.08, -0.25 + L('c5', 47), 0, -35] }, 'snap'],
    [60, { ...DOWN(0.5, -30), hips: [0, 0.78, 0.08] }],
    [80, B],
  ]);
  // ---- C6 full spin ×3, then the knock-back
  C.c6 = clipF('c6', [
    [0, B],
    [8, { ...out(-100, 0, -40), hips: [0, 0.84, 0] }],
    [12, { ...out(90, -4, 0), spin: 0, hips: [0, 0.8, 0.04] }, 'lin'],
    [56, { ...out(90, -4, 0), spin: -1080, hips: [0, 0.8, 0.04] }, 'lin'],
    [62, { ...OVER, spin: -1080, hips: [0, 0.94, 0] }, 'out'],
    [66, { ...DOWN(0.6, -32), spin: -1080 }, 'snap'],
    [80, { ...DOWN(0.6, -32), spin: -1080 }],
    [96, { spin: -1080 }],
  ]);
  // ---- dash: running carry, low hook sweep
  C.dash = clipF('dash', [
    [0, { spear: crook([-0.15, 1.0, 0.3], -20, -20), chest: [12, -10, 0], hips: [0, 0.86, 0.06] }],
    [16, { ...out(-120, -4, -45), hips: [0, 0.84, 0.05] }],
    [24, { ...out(90, -10, 40), hips: [0, 0.8, 0.08], fL: lead('dash', 24, 0.35) }, 'snap'],
    [38, { ...out(100, -8, 40), hips: [0, 0.82, 0.08] }],
    [60, B],
  ]);
  // ---- jump attack: tucked, crook swipe
  const AIR = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };
  C.jatk = clip([
    [0, P({ hips: [0, 0.95, 0], footL: AIR.fL, footR: AIR.fR, spear: crook([-0.2, 1.3, 0], -60, 30) }, GOK)],
    [6 / 24, P({ ...out(-110, 10, -40), hips: [0, 0.98, 0], footL: AIR.fL, footR: AIR.fR }, GOK), 'out'],
    [10 / 24, P({ ...out(80, -20, 35), hips: [0, 0.95, 0.04], footL: AIR.fL, footR: AIR.fR }, GOK), 'snap'],
    [1, P({ ...out(60, -15, 25), hips: [0, 0.95, 0.04], footL: AIR.fL, footR: AIR.fR }, GOK)],
  ]);
  // ---- jump charge: crook overhead at the apex, plunge, hook into the ground
  const Lj = MOVES.jc.landFrame, Fj = MOVES.jc.frames, Dj = MOVES.jc.plunge[0];
  const hang = { ...OVER, hips: [0, 1.0, 0.04], footL: [0.16, 0.5, 0.14, -30, 10], footR: [-0.18, 0.42, -0.12, 20, -20] };
  const stab = { spear: crook([0, 1.0, 0.6], 0, -60, 0, 0.5), chest: [22, 0, 0], hips: [0, 0.62, 0.16], hipsR: [0, 0, 0],
    footL: [0.3, 0.08, 0.5, 0, 25], footR: [-0.3, 0.08, -0.3, 0, -50] };
  C.jc = clip([
    [0, P({ hips: [0, 0.95, 0], footL: AIR.fL, footR: AIR.fR }, GOK)],
    [5 / Fj, P(hang, GOK), 'out'],
    [(Dj - 1) / Fj, P(hang, GOK)],
    [(Lj - 1) / Fj, P({ ...hang, spear: crook([0, 1.3, 0.4], 0, -20), chest: [10, 0, 0] }, GOK), 'in'],
    [Lj / Fj, P(stab, GOK), 'snap'],
    [(Lj + 8) / Fj, P(stab, GOK)],
    [MOVES.jc.cancel / Fj, P({ ...stab, hips: [0, 0.72, 0.1] }, GOK), 'io'],
    [1, P({}, GOK)],
  ], false, true);
  return C;
}

// ---------------------------------------------------------------- Musou 牧羊歸欄 (210 musou frames, sample keys)
// 1 hook out wide and pull the ring in (44) · 2 three spinning sweeps, each wider (76 / 104 / 132) · 3 plant the crook,
// the cream shockwave ring (178)
const MF = 210;
const mk = (f, spec, e) => [f / MF, P(spec, GOK), e];
export const MUSOU_FRAMES = MF;
export const MUSOU_CLIPS = {
  mu_gok: clip([
    mk(0, {}),
    mk(24, { spear: crook([0, 1.55, 0.1], 0, 75), chest: [-10, 0, 0], head: [-10, 0, 0], hipsR: [0, 0, 0] }),
    mk(34, { spear: crook([0.3, 1.1, 0.4], 90, -5), chest: [6, 40, 0], hipsR: [0, 20, 0] }),
    mk(46, { spear: crook([-0.3, 1.1, 0.4], -90, -5), chest: [6, -40, 0], hipsR: [0, -30, 0] }, 'snap'),
    mk(56, { spear: crook([0.45, 1.15, 0.1], 90, 0, 0, 0.3), chest: [4, 0, 0], hipsR: [0, 0, 0] }),
    mk(140, { spear: crook([0.45, 1.15, 0.1], 90, 0, 0, 0.3), chest: [4, 0, 0], hipsR: [0, 0, 0], spin: -1080 }, 'lin'),
    mk(155, { spear: crook([0, 1.6, 0.1], 0, 100), chest: [-12, 0, 0], head: [-8, 0, 0], hipsR: [0, 0, 0], spin: -1080 }),
    mk(178, { spear: crook([0, 0.7, 0.5], 0, -75), chest: [24, 0, 0], hips: [0, 0.76, 0.1], hipsR: [0, 0, 0], spin: -1080,
      footL: [0.2, 0.08, 0.5, 0, 10] }, 'snap'),
    mk(196, { spear: crook([0, 0.7, 0.5], 0, -75), chest: [20, 0, 0], hips: [0, 0.78, 0.1], hipsR: [0, 0, 0], spin: -1080,
      footL: [0.2, 0.08, 0.5, 0, 10] }),
    mk(210, { spin: -1080 }),
  ], false, true),
};

export const GOK_CLIPS = { ...LOCO_CLIPS, ...attacks(), ...MUSOU_CLIPS };
export { runPose, rollPose };
