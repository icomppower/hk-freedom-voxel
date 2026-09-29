// 龍仔's clips: attack clips per move id (./moves.js) through the shared clip kit (planted, baked feet), the Musou clip,
// and Zhao Yun's locomotion clips / run / roll (a pole carries like a spear). Authoring: P() over LJ (his ready stance:
// pole across the body, tip up and forward); the pole is the rig's spear joint (origin = rear grip, +Z along the shaft,
// tip at 1.5 m). pole(centre, yaw, elev, roll) = the shaft through `centre` 0.35 m from the rear grip.
// Contact poses sit on each move's first active frame (Box Moveset); key method as sheep-village 阿角 (a pole weapon).
import { P, clip, spearAbout, STANCE } from '../../hero/rig.js';
import { LOCO_CLIPS, runPose, rollPose } from '../../hero/anims/locomotion.js';
import { createClipKit } from '../shared/clipkit.js';
import { lungeAt } from '../../hero/moveset.js';
import { MOVES } from './moves.js';

const pole = (c, yaw, elev, roll = 0, at = 0.35) => spearAbout(c, yaw, elev, roll, at);
export const LJ = { ...STANCE, spear: pole([-0.02, 1.02, 0.28], 14, 26), gripL: 0.6, hipsR: [0, -18, 0], chest: [4, 6, 0] };
const ENTRY = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5' };
const { clipF } = createClipKit(MOVES, ENTRY, LJ);
const L = (id, f) => lungeAt(MOVES[id], f);
/** Lead-foot step landing `z` m ahead of the stance spot at move frame f (move-start coords include the lunge so far). */
const lead = (id, f, z = 0.2, x = 0.2, yaw = 12) => [x, 0.08, 0.3 + z + L(id, f), 0, yaw];
/** Pole held out level at heading `yaw` (° off his facing, + = left), body twisted `tw`° with it. */
const out = (yaw, elev = -5, tw = yaw * 0.4, extra) => ({
  spear: pole([Math.sin(yaw * Math.PI / 180) * 0.3, 1.08, 0.1 + Math.cos(yaw * Math.PI / 180) * 0.3], yaw, elev),
  chest: [6, tw, 0], hipsR: [0, tw * 0.8, 0], spine: [6, tw * 0.3, 0], ...extra });
const OVER = { spear: pole([0, 1.6, 0.05], 0, 95), chest: [-10, 0, 0], head: [-8, 0, 0], hipsR: [0, 0, 0] };
const DOWN = (z = 0.55, elev = -30) => ({ spear: pole([0, 0.95, z], 0, elev), chest: [22, 0, 0], hips: [0, 0.78, 0.1], hipsR: [0, 0, 0] });
const THRUST = (z, extra) => ({ spear: pole([0, 1.12, z], 0, 0, 90, 0.5), chest: [10, 5, 0], hipsR: [0, -5, 0], hips: [0, 0.84, 0.1], ...extra });
const B = {};                                     // = LJ (a key with no overrides)

function attacks() {
  const C = {};
  // ---- N1 直戳: chamber back at the hip, drive it straight out (contact 11)
  C.n1 = clipF('n1', [
    [0, B],
    [7, { spear: pole([-0.05, 1.1, -0.2], 0, 4, 90, 0.5), chest: [0, -15, 0], hipsR: [0, -35, 0], hips: [0, 0.86, -0.05] }],
    [11, THRUST(0.8, { fL: lead('n1', 11, 0.3, 0.18, 10) }), 'snap'],
    [18, THRUST(0.75)],
    [30, B],
  ]);
  // ---- N2 橫掃: chamber right, sweep right → left (contact 12)
  C.n2 = clipF('n2', [
    [0, B],
    [8, { spear: pole([0.3, 1.15, 0.05], 110, 8), chest: [0, 45, 0], hipsR: [0, 30, 0], spine: [4, 15, 0] }],
    [14, { spear: pole([-0.2, 1.08, 0.25], -110, 2), chest: [6, -40, 0], hipsR: [0, -40, 0], spin: -30, fR: [-0.22, 0.08, -0.2 + L('n2', 14), 0, -40] }, 'snap'],
    [22, { spear: pole([-0.25, 1.05, 0], -150, 0), chest: [4, -50, 0], hipsR: [0, -45, 0], spin: -45 }],
    [34, B],
  ]);
  // ---- N3 挑棍: tip dips low in front, flicks up (contact 12)
  C.n3 = clipF('n3', [
    [0, B],
    [8, { spear: pole([0, 0.8, 0.55], 0, -38), chest: [18, 0, 0], hips: [0, 0.8, 0.06], hipsR: [0, 0, 0] }],
    [12, { spear: pole([0, 1.3, 0.55], 0, 30), chest: [2, 0, 0], hips: [0, 0.88, 0.08], hipsR: [0, 0, 0], fL: lead('n3', 12, 0.25) }, 'snap'],
    [16, { spear: pole([0, 1.55, 0.45], 0, 60), chest: [-8, 0, 0], head: [-6, 0, 0], hips: [0, 0.92, 0.06], hipsR: [0, 0, 0] }],
    [32, B],
  ]);
  // ---- N4 overhead chop (contact 13)
  C.n4 = clipF('n4', [
    [0, B],
    [8, { ...OVER, hips: [0, 0.92, 0] }],
    [13, { ...DOWN(0.6, -22), chest: [20, 0, 0], fL: lead('n4', 13, 0.3) }, 'snap'],
    [22, { ...DOWN(0.6, -24), chest: [18, 0, 0] }],
    [36, B],
  ]);
  // ---- N5 backhand sweep left → right (contact 14)
  C.n5 = clipF('n5', [
    [0, B],
    [8, { ...out(120, 0, 45), hips: [0, 0.86, 0] }],
    [12, { ...out(40, -6, 15), hips: [0, 0.84, 0.05], fL: lead('n5', 12, 0.25) }, 'lin'],
    [18, { ...out(-100, -4, -40) }, 'snap'],
    [26, { ...out(-110, -2, -42) }],
    [38, B],
  ]);
  // ---- N6 full spin, pole at arm's length, low finish (contact 14)
  C.n6 = clipF('n6', [
    [0, B],
    [8, { ...out(-100, 0, -40), hips: [0, 0.84, 0] }],
    [14, { ...out(90, -6, 0), spin: 0, hips: [0, 0.8, 0.04] }, 'lin'],
    [22, { ...out(90, -6, 0), spin: -360, hips: [0, 0.78, 0.06] }, 'lin'],
    [32, { ...out(80, -12, 20), spin: -360, hips: [0, 0.76, 0.06], chest: [16, 20, 0] }, 'out'],
    [50, { spin: -360 }],
  ]);
  // ---- C1 撐竿飛踢: plant ahead (8), vault up the shaft (12 leap), kick through (22–27), land (32)
  C.c1 = clipF('c1', [
    [0, B],
    [8, { spear: pole([0, 0.95, 0.6], 0, -62, 0, 0.5), chest: [22, 0, 0], hips: [0, 0.78, 0.08], hipsR: [0, 0, 0], fL: lead('c1', 8, 0.2) }],
    [14, { spear: pole([0, 0.7, 0.3], 0, -80, 0, 0.9), chest: [10, 0, 0], hips: [0, 0.92, 0], hipsR: [0, 0, 0],
      fL: [0.18, 0.3, 0.4 + L('c1', 14), -20, 10], fR: [-0.18, 0.25, 0.1 + L('c1', 14), -20, -10] }],
    [22, { spear: pole([0, 0.5, -0.2], 0, -84, 0, 1.1), chest: [-18, 0, 0], head: [10, 0, 0], hips: [0, 0.96, 0], hipsR: [0, 0, 0],
      fL: [0.16, 0.9, 0.9 + L('c1', 22), -60, 10], fR: [-0.16, 0.7, 0.8 + L('c1', 22), -50, -10] }, 'snap'],
    [27, { spear: pole([0, 0.6, -0.1], 0, -80, 0, 1.0), chest: [-12, 0, 0], hips: [0, 0.96, 0], hipsR: [0, 0, 0],
      fL: [0.16, 0.7, 0.7 + L('c1', 27), -40, 10], fR: [-0.16, 0.6, 0.6 + L('c1', 27), -30, -10] }],
    [31, { spear: pole([0.1, 1.1, 0.3], 20, 20), chest: [10, 0, 0], hips: [0, 0.9, 0], hipsR: [0, 0, 0],
      fL: [0.2, 0.3, 0.4 + L('c1', 31), -10, 10], fR: [-0.2, 0.3, 0.0 + L('c1', 31), -10, -20] }],
    [33, { spear: pole([0.05, 1.05, 0.35], 10, 10), chest: [12, 0, 0], hips: [0, 0.8, 0.06], hipsR: [0, 0, 0],
      fL: [0.22, 0.08, 0.45 + L('c1', 33), 0, 15], fR: [-0.22, 0.08, -0.25 + L('c1', 33), 0, -35] }, 'snap'],
    [52, B],
  ]);
  // ---- C2 rising flick launcher: crouch, tip low → rip it up (contact 15)
  C.c2 = clipF('c2', [
    [0, B],
    [8, { spear: pole([0, 0.7, 0.6], 0, -40), chest: [20, 0, 0], hips: [0, 0.76, 0.06], hipsR: [0, 0, 0] }],
    [11, { spear: pole([0, 0.68, 0.62], 0, -44), chest: [22, 0, 0], hips: [0, 0.74, 0.07], hipsR: [0, 0, 0], fL: lead('c2', 11, 0.3) }],
    [16, { spear: pole([0, 1.7, 0.45], 0, 72), chest: [-12, 0, 0], head: [-10, 0, 0], hips: [0, 0.95, 0.05], hipsR: [0, 0, 0] }, 'snap'],
    [32, { spear: pole([0, 1.72, 0.42], 0, 76), chest: [-10, 0, 0], head: [-8, 0, 0], hips: [0, 0.93, 0.05], hipsR: [0, 0, 0] }],
    [60, B],
  ]);
  // ---- C3 wide 270° sweep (window 18–28)
  C.c3 = clipF('c3', [
    [0, B],
    [10, { ...out(-150, 2, -55), hips: [0, 0.84, 0] }],
    [16, { ...out(-150, 0, -58), hips: [0, 0.82, 0.02], fL: lead('c3', 16, 0.35, 0.26, 20) }],
    [28, { ...out(40, -4, 30), spin: 60, hips: [0, 0.8, 0.06] }, 'lin'],
    [34, { ...out(60, -6, 36), spin: 80, hips: [0, 0.8, 0.06] }, 'out'],
    [50, { ...out(60, -8, 30), spin: 80, hips: [0, 0.82, 0.05] }],
    [66, B],
  ]);
  // ---- C4 planted-pole spin kick: plant (12), swing round the pole feet up (22, 34), land (44)
  const kick = (f, s) => ({ spear: pole([0.2, 0.9, 0.3], 30, -70, 0, 0.7), chest: [-6, 0, 0], hips: [0, 1.0, 0], hipsR: [0, 0, 0], spin: s,
    fL: [0.3, 0.8, 0.5 + L('c4', f), -70, 20], fR: [-0.1, 0.55, 0.25 + L('c4', f), -40, -10] });
  C.c4 = clipF('c4', [
    [0, B],
    [12, { spear: pole([0.15, 0.95, 0.45], 25, -65, 0, 0.6), chest: [18, 0, 0], hips: [0, 0.78, 0.06], hipsR: [0, 0, 0], fL: lead('c4', 12, 0.2, 0.25, 20) }],
    [22, kick(22, -180), 'snap'],
    [34, kick(34, -540), 'lin'],
    [44, { ...DOWN(0.5, -30), spin: -720, hips: [0, 0.76, 0.08] }, 'snap'],
    [56, { ...DOWN(0.5, -30), spin: -720, hips: [0, 0.8, 0.08] }],
    [70, { spin: -720 }],
  ]);
  // ---- C5 overhead smash + shockwave: raise (14), smash (24), hold, wave at 36
  C.c5 = clipF('c5', [
    [0, B],
    [14, { ...OVER, spear: pole([0.02, 1.72, 0.2], 0, 92), hips: [0, 0.95, 0] }],
    [20, { ...OVER, spear: pole([0.02, 1.76, 0.22], 0, 94), hips: [0, 0.96, 0] }],
    [24, { ...DOWN(0.6, -34), chest: [24, 0, 0], hips: [0, 0.74, 0.1], fL: lead('c5', 24, 0.3, 0.24, 18) }, 'snap'],
    [40, { ...DOWN(0.6, -36), chest: [26, 0, 0], hips: [0, 0.72, 0.1] }],
    [60, { ...DOWN(0.6, -34), chest: [20, 0, 0], hips: [0, 0.76, 0.08] }],
    [76, B],
  ]);
  // ---- C6 full spin ×3, then the knock-back
  C.c6 = clipF('c6', [
    [0, B],
    [8, { ...out(-100, 0, -40), hips: [0, 0.84, 0] }],
    [12, { ...out(90, -4, 0), spin: 0, hips: [0, 0.8, 0.04] }, 'lin'],
    [52, { ...out(90, -4, 0), spin: -1080, hips: [0, 0.8, 0.04] }, 'lin'],
    [57, { ...OVER, spin: -1080, hips: [0, 0.94, 0] }, 'out'],
    [60, { ...DOWN(0.6, -30), spin: -1080 }, 'snap'],
    [76, { ...DOWN(0.6, -30), spin: -1080 }],
    [92, { spin: -1080 }],
  ]);
  // ---- dash: running carry, low sweep (contact 18)
  C.dash = clipF('dash', [
    [0, { spear: pole([-0.15, 1.0, 0.3], -20, -20), chest: [12, -10, 0], hips: [0, 0.86, 0.06] }],
    [12, { ...out(-120, -4, -45), hips: [0, 0.84, 0.05] }],
    [18, { ...out(90, -10, 40), hips: [0, 0.8, 0.08], fL: lead('dash', 18, 0.35) }, 'snap'],
    [32, { ...out(100, -8, 40), hips: [0, 0.82, 0.08] }],
    [56, B],
  ]);
  // ---- jump attack: tucked, pole swipe
  const AIR = { fL: [0.16, 0.36, 0.2, -20, 10], fR: [-0.18, 0.3, -0.12, 20, -20] };
  C.jatk = clip([
    [0, P({ hips: [0, 0.95, 0], footL: AIR.fL, footR: AIR.fR, spear: pole([-0.2, 1.3, 0], -60, 30) }, LJ)],
    [6 / 24, P({ ...out(-110, 10, -40), hips: [0, 0.98, 0], footL: AIR.fL, footR: AIR.fR }, LJ), 'out'],
    [10 / 24, P({ ...out(80, -20, 35), hips: [0, 0.95, 0.04], footL: AIR.fL, footR: AIR.fR }, LJ), 'snap'],
    [1, P({ ...out(60, -15, 25), hips: [0, 0.95, 0.04], footL: AIR.fL, footR: AIR.fR }, LJ)],
  ]);
  // ---- jump charge: pole overhead at the apex, plunge, slam the ground
  const Lj = MOVES.jc.landFrame, Fj = MOVES.jc.frames, Dj = MOVES.jc.plunge[0];
  const hang = { ...OVER, hips: [0, 1.0, 0.04], footL: [0.16, 0.5, 0.14, -30, 10], footR: [-0.18, 0.42, -0.12, 20, -20] };
  const slam = { spear: pole([0, 0.95, 0.6], 0, -40, 0, 0.5), chest: [22, 0, 0], hips: [0, 0.62, 0.16], hipsR: [0, 0, 0],
    footL: [0.3, 0.08, 0.5, 0, 25], footR: [-0.3, 0.08, -0.3, 0, -50] };
  C.jc = clip([
    [0, P({ hips: [0, 0.95, 0], footL: AIR.fL, footR: AIR.fR }, LJ)],
    [5 / Fj, P(hang, LJ), 'out'],
    [(Dj - 1) / Fj, P(hang, LJ)],
    [(Lj - 1) / Fj, P({ ...hang, spear: pole([0, 1.3, 0.4], 0, -20), chest: [10, 0, 0] }, LJ), 'in'],
    [Lj / Fj, P(slam, LJ), 'snap'],
    [(Lj + 8) / Fj, P(slam, LJ)],
    [MOVES.jc.cancel / Fj, P({ ...slam, hips: [0, 0.72, 0.1] }, LJ), 'io'],
    [1, P({}, LJ)],
  ], false, true);
  return C;
}

// ---------------------------------------------------------------- Musou 龍拳 Dragon Fist (210 musou frames)
// 0 raise the pole (cut-in) · 30 / 60 / 90 three widening pole spins · 110 the pole swung behind, fist chambered ·
// 128–140 dash punch through the crowd (8 m) · 180 FINISHER: the fist driven down-forward, the golden dragon ring
const MF = 210;
const mk = (f, spec, e) => [f / MF, P(spec, LJ), e];
const PUNCH = { spear: pole([-0.35, 0.9, -0.35], -160, -40), chest: [18, -25, 0], spine: [10, -10, 0], hips: [0, 0.8, 0.1], hipsR: [0, -20, 0] };
export const MUSOU_FRAMES = MF;
export const MUSOU_CLIPS = {
  mu_lungjai: clip([
    mk(0, {}),
    mk(24, { spear: pole([0, 1.55, 0.1], 0, 80), chest: [-10, 0, 0], head: [-10, 0, 0], hipsR: [0, 0, 0] }),
    mk(28, { spear: pole([0.45, 1.15, 0.1], 90, 0, 0, 0.3), chest: [4, 0, 0], hipsR: [0, 0, 0] }, 'snap'),
    mk(96, { spear: pole([0.45, 1.15, 0.1], 90, 0, 0, 0.3), chest: [4, 0, 0], hipsR: [0, 0, 0], spin: -1080 }, 'lin'),
    mk(112, { spear: pole([-0.3, 1.0, -0.3], -150, -35), chest: [-4, 30, 0], hips: [0, 0.84, -0.06], hipsR: [0, 25, 0], spin: -1080 }),
    mk(128, { ...PUNCH, spin: -1080 }, 'snap'),
    mk(142, { ...PUNCH, chest: [22, -30, 0], hips: [0, 0.78, 0.14], spin: -1080 }),
    mk(160, { spear: pole([-0.3, 1.0, -0.3], -150, -35), chest: [-6, 35, 0], hips: [0, 0.86, -0.06], hipsR: [0, 30, 0], spin: -1080 }),
    mk(180, { ...PUNCH, chest: [28, -35, 0], hips: [0, 0.72, 0.16], spin: -1080, footL: [0.22, 0.08, 0.55, 0, 10] }, 'snap'),
    mk(196, { ...PUNCH, chest: [24, -30, 0], hips: [0, 0.74, 0.14], spin: -1080, footL: [0.22, 0.08, 0.55, 0, 10] }),
    mk(210, { spin: -1080 }),
  ], false, true),
};

export const LUNGJAI_CLIPS = { ...LOCO_CLIPS, ...attacks(), ...MUSOU_CLIPS };
export { runPose, rollPose };
