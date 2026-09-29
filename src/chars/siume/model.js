// Voxel 小咩 Siu Me on the shared rig: the shared body cut recoloured (short open teal vest over the wool undershirt, wool
// sleeves with tan bands, dark sash, loose trousers with wool leg wraps), torso and arm boxes slimmed to ≈ 0.92 on X, no
// pauldrons. Head (HV voxels, ≈ 90 % of 阿角's): dark face with a shorter muzzle, light eyes, cropped wool cap, short
// straight horns angled up and back, the red headband across the brow. Weapons — 雙剪 twin shearing blades (dual-wield
// rig): the right blade on the weapon joint, the left on weaponL; each 0.45 m single-edged, a wooden handle loop.
// Secondary (render-only): the two long headband tails, the vest hem.
// Palette + head / shear boxes ported from the 羊村 box-moveset sample (bench/sheep/sample-recovered.js p_, $u, Qu).
import * as THREE from 'three';
import { vox, V, HV, C, bodyParts, buildBody, heroLook } from '../../hero/model.js';
import { bodyChains } from '../../hero/secondary.js';
import { hash01 } from '../../core/rng.js';
import { shade } from '../../core/voxel.js';

const hex = (s) => parseInt(s.slice(1), 16);
export const SC = {
  wool: hex('#EDE6DA'), face: hex('#2B2A28'), horn: hex('#9C8F7A'), vest: hex('#1F7A6B'), vestD: hex('#135247'),
  red: hex('#D93A3A'), blade: hex('#B9C2C9'), bladeL: hex('#E6ECF0'), grip: hex('#6B4A2B'), trou: hex('#3D4A4F'),
  band: hex('#B9A98F'), eye: hex('#F0E6C8'), sash: 0x3a2f28, boot: 0x2a2622,
};
const PAL = {
  ...C,
  W: SC.vest, W2: shade(SC.vest, 0.92), Wh: shade(SC.vest, 1.04), S: SC.wool, Sd: shade(SC.wool, 0.72),
  G: SC.trou, Gd: shade(SC.trou, 0.75), Gm: shade(SC.trou, 1.2), Gl: shade(SC.trou, 1.6),
  T: SC.vestD, Td: shade(SC.vestD, 0.7), Tl: shade(SC.vestD, 1.3),
  gold: SC.band, leather: SC.sash, glove: SC.face, sole: SC.boot,
};
const B = (a, b, c, paint) => ({ a, b, c, paint });
const Pt = (a, b, c) => ({ a, b, c, paint: true });
const mirror = (q) => ({ ...q, a: [1 - q.b[0], q.a[1], q.a[2]], b: [1 - q.a[0], q.b[1], q.b[2]] });
const both = (...qs) => qs.flatMap((q) => [q, mirror(q)]);
const woolP = (x, y, z) => (hash01(x * 3, y, z) < 0.18 ? shade(SC.wool, 0.9) : hash01(z, x, y * 5) < 0.12 ? shade(SC.wool, 1.04) : SC.wool);

export function head() {
  return [
    B([-3, 2, -3], [4, 10, 3], SC.face),                              // skull
    B([-2, 0, 2], [3, 7, 7], SC.face),                                // shorter muzzle
    Pt([-1, 3, 6], [2, 5, 7], shade(SC.face, 0.55)),                  // nostrils
    ...both(B([-4, 6, 2], [-2, 7, 4], SC.eye)),                       // light eyes either side of the muzzle
    B([-4, 10, -4], [5, 13, 3], woolP),                               // cropped wool cap
    B([-5, 9, -5], [6, 11, 4], SC.red),                               // red headband across the brow
    ...both(B([-7, 6, -1], [-4, 7, 1], SC.face)),                     // ears out to the sides
    ...both(B([-3, 12, -4], [-1, 16, -2], SC.horn), B([-3, 15, -6], [-1, 17, -4], shade(SC.horn, 0.85))),   // short straight horns, up and back
    B([-3, -2, -2], [4, 1, 3], woolP),                                // wool at the throat
  ];
}

/** One shear blade along +Z from the grip: the wooden handle loop behind, the blade tapering to the tip, edge light. */
function shearGeo() {
  const e = [B([-2, -2, -8], [2, 2, 2], SC.grip), B([-1, -1, -7], [1, 1, 1], -1)];
  for (let n = 2; n < 38; n++) {
    const s = (n - 2) / 36, r = Math.max(1, Math.round(5 * (1 - s * 0.85)));
    e.push(B([-1, -1, n], [1, 1 + r, n + 1], (a, o) => (o === r ? SC.bladeL : o === 0 ? shade(SC.blade, 0.8) : SC.blade)));
  }
  return vox(e, 0.012, { jitter: 0.03, ao: 0.2 });
}
export const SHEAR = { tip: 0.45 };

/** Slim the shared cut: torso / arm box X extents × k (voxel units, rounded; odd-width parts stay centred). */
function slim(parts, k) {
  for (const j of ['chest', 'spine', 'upperArmL', 'upperArmR', 'foreArmL', 'foreArmR']) {
    if (!parts[j]) continue;
    parts[j] = parts[j].map((q) => ({ ...q, a: [Math.round(q.a[0] * k), q.a[1], q.a[2]], b: [Math.round(q.b[0] * k), q.b[1], q.b[2]] }));
  }
  return parts;
}

export function createSiumeModel(rig) {
  const mat = heroLook(new THREE.MeshStandardMaterial({ color: new THREE.Color(0.86, 0.86, 0.86), vertexColors: true, roughness: 0.6, metalness: 0.08, flatShading: true }));
  const body = bodyParts(PAL);
  slim(body.parts, 0.92);
  const { meshes, add } = buildBody(rig, mat, body, head());
  meshes.pauldronR.visible = meshes.pauldronL.visible = false;
  const steel = heroLook(new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.25, metalness: 0.6, emissive: 0xffe0e0, emissiveIntensity: 0.12 }), 0.25, 0.6);
  add(rig.joints.weapon, shearGeo(), 'shearR', steel);
  add(rig.joints.weaponL, shearGeo(), 'shearL', steel);
  return { meshes, material: mat };
}

// ---------------------------------------------------------------- secondary: headband tails, vest hem
const hemSeg = (i, n) => vox([B([-5, -4, 0], [5, 0, 1], (x) => (x === -5 || x === 4 ? SC.vestD : SC.vest))], 0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
const frontSeg = (i, n) => vox([B([-4, -3, 0], [4, 0, 1], (x) => (Math.abs(x + 0.5) < 1.5 ? null : SC.vest))], 0.025, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.2 });
const tailSeg = (i, n) => vox([B([-1, -6, 0], [1, 0, 1], (x, y) => (i === n - 1 && y === -6 ? shade(SC.red, 0.8) : SC.red))], 0.014, { off: [0, 0, -0.5], jitter: 0.03, ao: 0.15 });

export function createSiumeSecondary(scene, rig, mat) {
  const j = rig.joints, body = bodyChains(scene, rig, mat, hemSeg, frontSeg), { add } = body;
  for (const sx of [-1, 1]) add(j.head, { anchor: [sx * 1.5 * HV, 10 * HV, -5 * HV], rest: [sx * 0.25, -0.85, -0.55], n: 6, len: 0.075, stiff: 0.02, drag: 0.05,
    wind: 2.0, cone: 140, sway: 0.7, seg: tailSeg, hit: ['head', ['chest', 0.02]] });
  return body;
}
