// Voxel 阿角 Ah Gok on the shared rig, same build / scale / armour cut as Zhao Yun (src/hero/model.js bodyParts, recoloured
// as a fisherman's raincoat: flat blue coat rows, darker seams, rope belt, wool mitts, dark trousers, hoof-dark boots), no
// pauldrons. Head (HV voxels, chin y 0, crown y 13): long dark sheep face and muzzle forward, light eyes, wool cap and
// ruff, big curled ram horns 1.5 turns back and down round each ear. Weapon: 牧杖 shepherd's crook on the spear joint
// (shaft 2.04 m, rope grip bands, the hook curling back 0.35 m at the tip; no metal). Secondary (render-only): coat skirt
// back + front panels flaring at the knees, the red scarf tail, a wool tuft under the chin.
// Palette + head / crook boxes ported from the 羊村 box-moveset sample (bench/sheep/sample-recovered.js f_, g_, ju).
import * as THREE from 'three';
import { vox, V, HV, C, bodyParts, buildBody, heroLook } from '../../hero/model.js';
import { bodyChains } from '../../hero/secondary.js';
import { hash01 } from '../../core/rng.js';
import { shade } from '../../core/voxel.js';

const hex = (s) => parseInt(s.slice(1), 16);
export const GC = {
  wool: hex('#F2EFE6'), face: hex('#3B3A36'), horn: hex('#C8A15A'), hornD: hex('#8E6E34'),
  coat: hex('#2F5D7C'), coatD: hex('#1F4058'), scarf: hex('#B8452F'), wood: hex('#6B4A2B'), rope: hex('#C9A66B'),
  trou: hex('#4A4640'), eye: hex('#E8D9A8'), boot: 0x2a2622,
};
// the body palette (keys of src/hero/model.js C): coat as the lamellar with flat rows, rope as metal and belt
const PAL = {
  ...C,
  W: GC.coat, W2: shade(GC.coat, 0.94), Wh: shade(GC.coat, 1.03), S: shade(GC.coat, 0.85), Sd: shade(GC.coat, 0.6),   // flat rows: oilcloth, not plate
  G: GC.trou, Gd: shade(GC.trou, 0.75), Gm: shade(GC.trou, 1.2), Gl: shade(GC.trou, 1.6),
  T: GC.coatD, Td: shade(GC.coatD, 0.7), Tl: shade(GC.coatD, 1.3),
  gold: GC.rope, leather: GC.rope, glove: GC.wool, sole: GC.boot,
};
const B = (a, b, c, paint) => ({ a, b, c, paint });
const Pt = (a, b, c) => ({ a, b, c, paint: true });
const mirror = (q) => ({ ...q, a: [1 - q.b[0], q.a[1], q.a[2]], b: [1 - q.a[0], q.b[1], q.b[2]] });
const both = (...qs) => qs.flatMap((q) => [q, mirror(q)]);
/** Wool: cream with a few darker curls and bright tufts (stable hash, no RNG). */
const woolP = (x, y, z) => (hash01(x * 3, y, z) < 0.18 ? shade(GC.wool, 0.9) : hash01(z, x, y * 5) < 0.12 ? shade(GC.wool, 1.04) : GC.wool);

export function head() {
  return [
    B([-3, 2, -4], [4, 11, 3], GC.face),                              // skull
    B([-2, 0, 2], [3, 8, 9], GC.face),                                // long face and muzzle, forward
    B([-2, 7, 2], [3, 9, 6], shade(GC.face, 1.15)),                   // brow ridge
    Pt([-1, 3, 8], [2, 5, 9], shade(GC.face, 0.6)),                   // nostrils
    Pt([-1, 0, 7], [2, 1, 9], shade(GC.face, 0.75)),                  // mouth
    ...both(B([-4, 7, 2], [-2, 8, 4], GC.eye), B([-4, 8, 2], [-2, 9, 4], shade(GC.face, 1.25))),   // small light eyes flanking the muzzle, a brow over each
    B([-4, 9, -5], [5, 14, 3], woolP),                                // wool cap on the crown
    B([-3, 14, -4], [4, 15, 2], woolP),
    B([-4, -3, -3], [5, 2, 4], woolP),                                // wool ruff under the chin
    B([-3, -5, -1], [4, -3, 4], woolP),
    ...both(B([-8, 7, -1], [-4, 8, 1], GC.face)),                     // ears, out to the sides
    ...both(                                                          // curled ram horns: up, back, down round the ear, forward
      B([-7, 11, -3], [-3, 14, 1], GC.horn),
      B([-9, 7, -6], [-6, 13, -2], GC.horn),
      B([-9, 3, -4], [-6, 7, 0], GC.horn),
      B([-10, 3, 0], [-7, 7, 3], GC.horn),
      B([-10, 6, 3], [-8, 9, 5], GC.horn),
      B([-8, 8, -5], [-7, 11, -3], GC.hornD)),                        // spiral centre
  ];
}

/** 牧杖: shaft with rope grip bands every 18 voxels, the hook at the tip curling back toward the holder. */
function crookGeo() {
  return vox([
    B([-1, -1, -30], [1, 1, 72], (x, y, z) => ((z + 30) % 18 < 2 ? GC.rope : z & 2 ? shade(GC.wood, 1.12) : GC.wood)),
    B([-1, 0, 70], [1, 9, 73], GC.wood),                              // up at the tip
    B([-1, 8, 62], [1, 11, 73], GC.wood),                             // over and back
    B([-1, 3, 61], [1, 9, 63], GC.wood),                              // down: the hook's inside
    B([-1, 3, 63], [1, 4, 65], shade(GC.wood, 0.8)),
  ], 0.02, { jitter: 0.05, ao: 0.3 });
}
/** Hook centre / tip in weapon space (m): trail + VFX anchors. */
export const CROOK = { tip: 1.46, hook: [0, 0.18, 1.34] };

export function createGokModel(rig) {
  const mat = heroLook(new THREE.MeshStandardMaterial({ color: new THREE.Color(0.86, 0.86, 0.86), vertexColors: true, roughness: 0.6, metalness: 0.08, flatShading: true }));
  const body = bodyParts(PAL);
  body.parts.hips.push(B([-2, 0, 5], [2, 3, 7], GC.rope));            // rope belt knot at the front
  const { meshes, add } = buildBody(rig, mat, body, head());
  meshes.pauldronR.visible = meshes.pauldronL.visible = false;       // a raincoat: no pauldrons
  add(rig.joints.weapon, crookGeo(), 'crook');
  return { meshes, material: mat };
}

// ---------------------------------------------------------------- secondary: coat skirt, scarf tail, wool tuft
/** Coat skirt, back panel: widens down the legs (flaring at the knees), darker seam at the edges, hem line. */
const skirtSeg = (i, n) => {
  const w = Math.round(6 + (i * 3) / Math.max(1, n - 1)), last = i === n - 1;
  return vox([B([-w, -7, 0], [w, 0, 1], (x, y) => (last && y === -7 ? GC.coatD : x === -w || x === w - 1 ? GC.coatD : y % 4 === 0 ? PAL.W2 : GC.coat))],
    0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
};
/** Front skirt: two coat panels open at the middle over the trousers. */
const frontSeg = (i, n) => {
  const w = 4 + (i === n - 1 ? 1 : 0);
  return vox([B([-w, -5, 0], [w, 0, 1], (x, y) => (Math.abs(x + 0.5) < 1 ? null : x === -w || x === w - 1 ? GC.coatD : GC.coat))],
    0.025, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.2 });
};
const scarfSeg = () => vox([B([-2, -7, 0], [2, 0, 1], (x, y) => (y === -7 ? shade(GC.scarf, 0.8) : GC.scarf))], 0.02, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.15 });
const tuftSeg = (i, n) => vox([B([-2 + (i === n - 1 ? 1 : 0), -3, -1], [2, 0, 2], woolP)], HV, { jitter: 0.06, ao: 0.3 });

export function createGokSecondary(scene, rig, mat) {
  const j = rig.joints, body = bodyChains(scene, rig, mat, skirtSeg, frontSeg), { add } = body;
  // scarf tail: knotted at the left collar, hangs down the chest and flies back in the run
  add(j.chest, { anchor: [0.07, 0.24, 0.15], rest: [0.25, -1, 0.35], n: 4, len: 0.1, stiff: 0.05, drag: 0.1, wind: 1.6, face: [0, 0, 1], cone: 110, sway: 0.3,
    seg: scarfSeg, hit: ['chest', ['hips', 0.02]] });
  // wool tuft under the chin
  add(j.head, { anchor: [0, -4 * HV, 2 * HV], rest: [0, -1, 0.25], n: 2, len: 0.04, stiff: 0.25, drag: 0.2, wind: 0.4, face: [0, 0, 1], cone: 50, sway: 0.08,
    seg: tuftSeg, hit: [['chest', 0.03]] });
  return body;
}
