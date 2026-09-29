// Voxel 龍仔 Dragon on the shared rig, same build / scale as Zhao Yun (src/hero/model.js bodyParts, recoloured as black
// protest gear: flat black jacket rows, darker seams, black trousers, black trainers and gloves), no pauldrons, cling-film
// forearm guards, a small backpack. Head (HV voxels, chin y 0, crown y 13): short black hair under a yellow construction
// hard hat (dome y 10-15, brim 1 HV out all round, ridge on top), goggle strap round the hat, clear goggles over the eyes,
// black mask from the nose to under the chin. Weapon: 竹棍 bamboo pole on the spear joint (2.1 m, 2 × 2 voxels, a darker
// node ring every 0.35 m, frayed tip). Secondary (render-only): jacket hem back + front, backpack straps, mask ear straps.
// Palette: Character Sheets 角色設定 (Notion). No badge, flag or slogan anywhere on the model.
import * as THREE from 'three';
import { vox, V, HV, C, bodyParts, buildBody, heroLook } from '../../hero/model.js';
import { bodyChains } from '../../hero/secondary.js';
import { outfit } from '../shared/outfit.js';
import { hash01 } from '../../core/rng.js';
import { shade } from '../../core/voxel.js';

const hex = (s) => parseInt(s.slice(1), 16);
export const LC = {
  jacket: hex('#181818'), jacketD: hex('#0C0C0C'), sleeve: hex('#262626'), wrap: hex('#DDE6EA'), trou: hex('#1C1C1C'),
  hat: hex('#FFD700'), hatD: hex('#C9A800'), skin: hex('#F1C27D'), mask: hex('#111111'), lens: hex('#9ED8F0'),
  bamboo: hex('#C9B36A'), node: hex('#8D7A3E'), hair: 0x141414, strap: 0x2a2a2a, pack: 0x222226, sole: 0x3a3a3a,
};
// body palette (keys of src/hero/model.js C): jacket as the lamellar with flat rows, seams as trim, all dark metal parts black
const PAL = {
  ...C,
  W: LC.jacket, W2: shade(LC.jacket, 1.1), Wh: shade(LC.jacket, 1.2), S: LC.sleeve, Sd: LC.jacketD,
  G: LC.trou, Gd: shade(LC.trou, 0.8), Gm: shade(LC.trou, 1.25), Gl: shade(LC.trou, 1.6),
  T: LC.jacketD, Td: shade(LC.jacketD, 0.8), Tl: LC.sleeve,
  gold: LC.strap, leather: LC.strap, glove: 0x151515, sole: LC.sole, skin: LC.skin, skinD: shade(LC.skin, 0.85),
};
const B = (a, b, c, paint) => ({ a, b, c, paint });
const Pt = (a, b, c) => ({ a, b, c, paint: true });
const mirror = (q) => ({ ...q, a: [1 - q.b[0], q.a[1], q.a[2]], b: [1 - q.a[0], q.b[1], q.b[2]] });
const both = (...qs) => qs.flatMap((q) => [q, mirror(q)]);
/** Cling film: pale blue-white with brighter wrinkle lines (stable hash). */
const wrapP = (x, y, z) => (hash01(x, y * 7, z) < 0.3 ? shade(LC.wrap, 1.06) : (y & 1) ? shade(LC.wrap, 0.78) : shade(LC.wrap, 0.88));

export function head() {
  return [
    B([-3, 1, -4], [4, 11, 3], LC.skin),                              // skull
    B([-3, 0, 2], [4, 8, 4], LC.skin),                                // face
    B([-4, 5, -5], [5, 11, 0], LC.hair),                              // short hair at the back and sides
    ...both(B([-4, 5, 0], [-3, 9, 2], LC.hair)),                      // sideburns
    // mask: from the nose (y 6) to under the chin, wrapping the jaw
    B([-4, -1, 1], [5, 6, 5], LC.mask),
    Pt([-2, 3, 4], [3, 4, 5], shade(LC.mask, 1.8)),                   // pleat line (front layer z 4)
    ...both(Pt([-4, 4, 0], [-3, 5, 1], LC.strap)),                    // ear loops
    // goggles: clear lenses in a dark frame over the eyes, strap round the hat
    B([-4, 6, 3], [5, 9, 5], LC.strap),
    ...both(B([-3, 7, 4], [0, 9, 6], LC.lens)),
    Pt([0, 7, 5], [1, 8, 6], LC.strap),                               // bridge
    // hard hat: dome, brim 1 HV out all round, ridge front to back, strap band
    B([-5, 10, -6], [6, 11, 6], LC.hatD),                             // brim
    B([-4, 11, -5], [5, 14, 5], LC.hat),                              // dome
    B([-3, 14, -4], [4, 15, 4], LC.hat),
    B([0, 13, -5], [1, 16, 5], LC.hatD),                              // ridge
    Pt([-4, 11, -5], [5, 12, 5], LC.strap),                           // goggle strap round the hat
  ];
}

/** 竹棍: 2.1 m shaft, darker node rings every 18 voxels (0.36 m), a frayed split tip. */
function poleGeo() {
  const nodeP = (x, y, z) => ((z + 30) % 18 < 1 ? LC.node : hash01(x, y, z) < 0.1 ? shade(LC.bamboo, 0.92) : (z & 4) ? shade(LC.bamboo, 1.05) : LC.bamboo);
  return vox([
    B([-1, -1, -30], [1, 1, 73], nodeP),
    B([-1, -1, 73], [0, 0, 76], shade(LC.bamboo, 0.9)),                // frayed tip: split slivers
    B([0, 0, 73], [1, 1, 75], shade(LC.bamboo, 1.1)),
    B([0, -1, 73], [1, 0, 74], LC.node),
  ], 0.02, { jitter: 0.05, ao: 0.3 });
}
/** Tip in weapon space (m): trail + VFX anchor. */
export const POLE = { tip: 1.5, butt: -0.6 };

export function createLungjaiModel(rig) {
  const mat = heroLook(new THREE.MeshStandardMaterial({ color: new THREE.Color(0.95, 0.95, 0.95), vertexColors: true, roughness: 0.7, metalness: 0.05, flatShading: true }));
  const body = bodyParts(PAL);                                        // (pauldron boxes only: they stay hidden)
  body.parts = outfit({ jacket: LC.jacket, jacketD: LC.jacketD, sleeve: LC.sleeve, trou: LC.trou, trouD: shade(LC.trou, 0.75),
    shoe: 0x1e1e1e, sole: LC.sole, skin: LC.skin, glove: 0x151515, hem: 3 });
  for (const s of ['R', 'L']) {                                      // cling-film forearm guards over black sleeves
    body.parts['foreArm' + s] = [
      B([-2, -11, -2], [3, 0, 3], LC.sleeve),
      B([-2, -8, -3], [3, -3, 4], wrapP), B([-3, -7, -2], [4, -4, 3], wrapP),
      B([-2, -1, -3], [3, 1, 3], LC.sleeve),
    ];
  }
  // small backpack on the chest joint (rigid box on the back) with a top flap
  body.parts.chest.push(B([-5, -1, -10], [5, 8, -5], LC.pack), B([-5, 6, -11], [5, 9, -5], shade(LC.pack, 1.3)),
    ...both(B([-5, -1, -5], [-3, 9, -4], LC.strap)));
  const { meshes, add } = buildBody(rig, mat, body, head());
  meshes.pauldronR.visible = meshes.pauldronL.visible = false;       // a jacket: no pauldrons
  add(rig.joints.weapon, poleGeo(), 'pole');
  return { meshes, material: mat };
}

// ---------------------------------------------------------------- secondary: jacket hem, backpack straps, mask ear straps
/** Jacket hem, back panel: short, a darker seam at the edges and the hem line. */
const hemSeg = (i, n) => {
  const w = 6, last = i === n - 1;
  return vox([B([-w, -5, 0], [w, 0, 1], (x, y) => (last && y === -5 ? LC.jacketD : x === -w || x === w - 1 ? LC.jacketD : LC.jacket))],
    0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
};
/** Front hem: two jacket panels open at the zip. */
const frontSeg = () => vox([B([-5, -4, 0], [5, 0, 1], (x) => (Math.abs(x + 0.5) < 1 ? null : x === -5 || x === 4 ? LC.jacketD : LC.jacket))],
  0.025, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.2 });
const strapSeg = () => vox([B([-1, -6, 0], [1, 0, 1], LC.strap)], 0.02, { off: [0, 0, -0.5], jitter: 0.03, ao: 0.1 });

export function createLungjaiSecondary(scene, rig, mat) {
  const j = rig.joints, body = bodyChains(scene, rig, mat, hemSeg, frontSeg), { add } = body;
  // backpack strap ends hanging under the pack
  for (const sx of [-1, 1]) add(j.chest, { anchor: [sx * 0.08, -0.03, -0.2], rest: [0, -1, -0.15], n: 2, len: 0.07, stiff: 0.2, drag: 0.15,
    wind: 0.6, face: [0, 0, -1], cone: 50, sway: 0.1, seg: strapSeg, hit: [['hips', 0.02]] });
  return body;
}
