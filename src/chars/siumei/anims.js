// 小美's clips: attack clips per move id (./moves.js) through the shared clip kit (baked planted feet), the Musou clip, and
// Zhao Yun's locomotion clips (the umbrellas ride the dual-wield channels through them: held low). Dual wield (rig stage-2b
// hook): the right umbrella is the spear channel, the left the spearL channel with dual = 1 (the left fist on its grip).
// A channel = [x, y, z (grip, root space), yaw (0 fwd, + left), elev (+ up), roll]. Keys adapted from sheep-village 小咩
// (same frame data: N1 / N2 / N3 / C1 of the Box Moveset); C4 is the open-umbrella shield bash.
import { P, clip, STANCE } from '../../hero/rig.js';
import { LOCO_CLIPS, runPose, rollPose } from '../../hero/anims/locomotion.js';
import { createClipKit } from '../shared/clipkit.js';
import { lungeAt } from '../../hero/moveset.js';
import { MOVES } from './moves.js';

// ready stance: both umbrellas held low, tips down, either side of the hips
export const SIU = { ...STANCE, spear: [-0.3, 0.95, 0.22, 0, -60, 90], spearL: [0.3, 0.95, 0.22, 0, -60, -90], dual: 1,
  gripR: 0, lfree: 1, armL: [-20, 0, 25, 60], hipsR: [0, -15, 0], chest: [6, 4, 0] };
const ENTRY = { n2: 'n1', n3: 'n2', n4: 'n3', n5: 'n4', n6: 'n5', c2: 'n1', c3: 'n2', c4: 'n3', c5: 'n4', c6: 'n5' };
const { clipF } = createClipKit(MOVES, ENTRY, SIU);
const L = (id, f) => lungeAt(MOVES[id], f);
const lead = (id, f, z = 0.2, x = 0.2, yaw = 12) => [x, 0.08, 0.3 + z + L(id, f), 0, yaw];

// ---- the sample's poses, both blades explicit
const lWind = (e) => ({ spearL: [0.38, 1.3, 0.0, 110, 20, -90], chest: [0, 30, 0], hipsR: [0, 10, 0], ...e });          // ad
const lCut = (e) => ({ spearL: [-0.05, 1.1, 0.45, -50, -8, -90], chest: [8, -25, 0], hipsR: [0, -20, 0], ...e });       // wc
const rWind = (e) => ({ spear: [-0.5, 1.3, 0.0, -110, 25, 90], chest: [0, -35, 0], ...e });                             // od
const rCut = (e) => ({ spear: [0.05, 1.1, 0.45, 70, -5, 90], chest: [8, 30, 0], ...e });                                // Ac
const cross = (e) => ({ spear: [-0.15, 1.55, 0.25, 30, 70, 90], spearL: [0.15, 1.55, 0.25, -30, 70, -90], chest: [-6, 0, 0],
  hips: [0, 0.92, 0], hipsR: [0, 0, 0], ...e });                                                                         // ld
const open = (e) => ({ spear: [-0.45, 0.95, 0.35, -80, -25, 90], spearL: [0.45, 0.95, 0.35, 80, -25, -90], chest: [16, 0, 0],
  hips: [0, 0.8, 0.08], hipsR: [0, 0, 0], ...e });                                                                       // Oo
const wings = (e) => ({ spear: [-0.55, 1.3, 0, -90, 0, 0], spearL: [0.55, 1.3, 0, 90, 0, 0], chest: [0, 0, 0], hipsR: [0, 0, 0], ...e });   // Bo
const B = {};

function attacks() {
  const C = {};
  C.n1 = clipF('n1', [[0, B], [6, lWind()], [10, lCut({ fL: lead('n1', 10, 0.2) }), 'snap'], [15, lCut()], [24, B]]);
  C.n2 = clipF('n2', [[0, B], [5, rWind()], [10, rCut({ fR: [-0.18, 0.08, 0.05 + L('n2', 10), 0, -20] }), 'snap'], [15, rCut()], [24, B]]);
  C.n3 = clipF('n3', [[0, B], [8, cross()], [14, open({ fL: lead('n3', 14, 0.3) }), 'snap'], [20, open()], [30, B]]);
  C.n4 = clipF('n4', [[0, B], [5, { spearL: [-0.2, 1.15, 0.2, -100, 5, -90], chest: [4, -30, 0], hipsR: [0, -25, 0] }],
    [10, { spearL: [0.45, 1.1, 0.25, 110, -5, -90], chest: [6, 35, 0], hipsR: [0, 25, 0], fL: lead('n4', 10, 0.2) }, 'snap'], [16, { spearL: [0.48, 1.1, 0.2, 115, -5, -90], chest: [6, 38, 0], hipsR: [0, 26, 0] }], [26, B]]);
  C.n5 = clipF('n5', [[0, B], [5, { spear: [-0.25, 1.15, -0.2, 0, 5, 90], chest: [0, -20, 0], hipsR: [0, -30, 0] }],
    [10, { spear: [-0.1, 1.15, 0.62, 0, 0, 90], chest: [12, 5, 0], hips: [0, 0.84, 0.1], hipsR: [0, -5, 0], fL: lead('n5', 10, 0.3) }, 'snap'],
    [16, { spear: [-0.1, 1.15, 0.58, 0, 0, 90], chest: [10, 5, 0], hips: [0, 0.85, 0.08] }], [28, B]]);
  C.n6 = clipF('n6', [[0, B], [6, wings({ hips: [0, 0.86, 0] })], [16, wings({ spin: -360, hips: [0, 0.84, 0.04] }), 'lin'],
    [22, open({ spin: -360 }), 'snap'], [34, open({ spin: -360, hips: [0, 0.8, 0.08] })], [44, { spin: -360 }]]);
  // C1 旋風剪 (Box Moveset): three and a half turns forward, blades out
  C.c1 = clipF('c1', [[0, B], [8, wings()], [44, wings({ spin: -1080 }), 'lin'], [50, { spin: -1080 }]]);
  // C2 cross-cut X
  C.c2 = clipF('c2', [[0, B], [10, cross({ hips: [0, 0.94, 0] })], [16, open({ fL: lead('c2', 16, 0.3) }), 'snap'], [28, open()], [40, B]]);
  // C3 twin upward snip launcher
  const low = { spear: [-0.15, 0.7, 0.45, -10, -30, 90], spearL: [0.15, 0.7, 0.45, 10, -30, -90], hips: [0, 0.72, 0.06], chest: [20, 0, 0], hipsR: [0, 0, 0] };
  const up = { spear: [-0.15, 1.6, 0.3, -5, 70, 90], spearL: [0.15, 1.6, 0.3, 5, 70, -90], hips: [0, 0.96, 0.04], chest: [-12, 0, 0], head: [-10, 0, 0], hipsR: [0, 0, 0] };
  C.c3 = clipF('c3', [[0, B], [8, low], [14, { ...up, fL: lead('c3', 14, 0.25) }, 'snap'], [26, up], [44, B]]);
  // C4 open-umbrella shield bash: both shafts forward (the open canopies face the enemy), drive in, then the shove
  const shield = (z, e) => ({ spear: [-0.18, 1.12, z, 4, 4, 90], spearL: [0.18, 1.12, z, -4, 4, -90], chest: [14, 0, 0], hips: [0, 0.82, 0.08], hipsR: [0, 0, 0], ...e });
  C.c4 = clipF('c4', [[0, B], [8, shield(0.2, { chest: [8, 0, 0] })], [14, shield(0.35, { fL: lead('c4', 14, 0.3) }), 'snap'], [24, shield(0.38)],
    [30, shield(0.2, { chest: [4, 0, 0] })], [33, shield(0.6, { chest: [20, 0, 0], hips: [0, 0.8, 0.14], fL: lead('c4', 33, 0.35) }), 'snap'], [44, shield(0.55)], [56, B]]);
  // C5 dash-through: three dashing cuts, alternating
  C.c5 = clipF('c5', [[0, B], [6, lWind()], [11, lCut(), 'snap'], [18, rWind()], [23, rCut(), 'snap'], [30, cross()], [35, open(), 'snap'], [46, open()], [56, B]]);
  // C6 tornado finisher: four turns, then the blades snap open
  C.c6 = clipF('c6', [[0, B], [8, wings()], [54, wings({ spin: -1440 }), 'lin'], [58, cross({ spin: -1440 })],
    [62, open({ spin: -1440 }), 'snap'], [72, open({ spin: -1440 })], [84, { spin: -1440 }]]);
  C.dash = clipF('dash', [[0, { spear: [-0.35, 1.0, -0.2, -150, -20, 90], spearL: [0.35, 1.0, -0.2, 150, -20, -90], chest: [14, 0, 0], hips: [0, 0.84, 0.06] }],
    [10, rCut(), 'snap'], [16, lCut(), 'snap'], [26, lCut()], [40, B]]);
  const AIR = { footL: [0.16, 0.36, 0.2, -20, 10], footR: [-0.18, 0.3, -0.12, 20, -20], hips: [0, 0.95, 0] };
  C.jatk = clip([[0, P({ ...AIR }, SIU)], [4 / 18, P({ ...AIR, ...lCut() }, SIU), 'snap'], [9 / 18, P({ ...AIR, ...rCut() }, SIU), 'snap'], [1, P({ ...AIR, ...rCut() }, SIU)]]);
  const Lj = MOVES.jc.landFrame, Fj = MOVES.jc.frames, Dj = MOVES.jc.plunge[0];
  const hang = { ...cross(), hips: [0, 1.0, 0.04], footL: [0.16, 0.5, 0.14, -30, 10], footR: [-0.18, 0.42, -0.12, 20, -20] };
  const land = { ...wings({ hips: [0, 0.66, 0.1], chest: [16, 0, 0] }), footL: [0.3, 0.08, 0.4, 0, 25], footR: [-0.3, 0.08, -0.3, 0, -50] };
  C.jc = clip([[0, P(AIR, SIU)], [5 / Fj, P(hang, SIU), 'out'], [(Dj - 1) / Fj, P(hang, SIU)], [(Lj - 1) / Fj, P({ ...hang, spin: -360 }, SIU), 'in'],
    [Lj / Fj, P({ ...land, spin: -360 }, SIU), 'snap'], [(Lj + 8) / Fj, P({ ...land, spin: -360 }, SIU)], [1, P({ spin: -360 }, SIU)]], false, true);
  return C;
}

// ---------------------------------------------------------------- Musou 旋風腿 Hurricane Kick (200 musou frames)
// 1 zig-zag dash: six kick-and-jab cuts, one per dash leg (musou.js PATH) · 2 stops dead in the centre, both umbrellas snap
// open: spinning tornado · 3 umbrellas thrust up and close: the pink-gold burst ring
const MF = 200, mk = (f, spec, e) => [f / MF, P(spec, SIU), e];
export const MUSOU_FRAMES = MF;
function musouClip() {
  const k = [mk(0, {}), mk(16, { hips: [0, 0.8, 0], chest: [16, 0, 0], spear: [-0.45, 1, 0.1, -100, 10, 90], spearL: [0.45, 1, 0.1, 100, 10, -90] })];
  for (let t = 0; t < 6; t++) {
    const e = 20 + t * 15;
    k.push(mk(e + 2, t % 2 ? rWind({ hips: [0, 0.84, 0] }) : lWind({ hips: [0, 0.84, 0] })));
    k.push(mk(e + 10, t % 2 ? rCut({ hips: [0, 0.82, 0.05] }) : lCut({ hips: [0, 0.82, 0.05] }), 'snap'));
  }
  k.push(mk(112, wings()), mk(158, wings({ spin: -1440 }), 'lin'), mk(170, open({ spin: -1440 })), mk(180, cross({ spin: -1440, hips: [0, 0.98, 0] }), 'snap'),
    mk(192, cross({ spin: -1440 })), mk(200, { spin: -1440 }));
  return clip(k, false, true);
}
export const MUSOU_CLIPS = { mu_siumei: musouClip() };

// locomotion: Zhao Yun's clips carry the spear channels only; with dual 0 the left umbrella would hang at STANCE.spearL off
// her hand — the locomotion clips get the stance umbrellas (spear / spearL / dual) patched in per key
function lowBlades(c) {
  const k = { ...c, keys: c.keys.map((key) => {
    const p = key.p.slice();
    const s = P({ spearL: SIU.spearL, dual: 1 }, STANCE);
    for (let i = 45; i < 52; i++) p[i] = s[i];
    return { ...key, p };
  }) };
  return k;
}
const LOCO = Object.fromEntries(Object.entries(LOCO_CLIPS).map(([id, c]) => [id, lowBlades(c)]));

export const SIUMEI_CLIPS = { ...LOCO, ...attacks(), ...MUSOU_CLIPS };
export { runPose, rollPose };
