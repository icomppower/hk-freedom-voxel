// Voxel 小美 Amy on the shared rig: the shared body cut recoloured (pink hooded rain jacket to mid-thigh over black, black
// leggings, white sneakers), torso and arm boxes slimmed to ≈ 0.92 on X, no pauldrons, a small first-aid patch (plain
// white cross on red, no organisation) on the left sleeve, the hood down behind the neck. Head: black hair with a fringe,
// clear goggles pushed up on the forehead, a high ponytail (secondary chain, 5 segments). Weapons — 雙傘 twin folding
// umbrellas (dual-wield rig: right = weapon joint, left = weaponL): each 0.85 m closed with a J-hook handle behind the
// grip; OPEN (render-only swap on the moves in OPEN below, and the Musou tornado): a 0.9 m canopy of 8 ribs. Right canopy
// gold, left pink. Secondary (render-only): ponytail, jacket hem, and the open / closed swap.
// Palette: Character Sheets 角色設定 (Notion). Original design (keeps the Phaser 小美's pink and her name).
import * as THREE from 'three';
import { vox, HV, C, bodyParts, buildBody, heroLook } from '../../hero/model.js';
import { bodyChains } from '../../hero/secondary.js';
import { outfit } from '../shared/outfit.js';
import { shade } from '../../core/voxel.js';

const hex = (s) => parseInt(s.slice(1), 16);
export const MC = {
  jacket: hex('#F48FB1'), trim: hex('#EC407A'), hair: hex('#141414'), skin: hex('#F1C27D'), legs: hex('#1A1A1A'),
  shoe: hex('#FFFFFF'), lens: hex('#CFEFFF'), canopyA: hex('#FFD700'), canopyB: hex('#F48FB1'), shaft: hex('#2A2A2A'),
  cross: hex('#FFFFFF'), crossBg: hex('#E53935'), eye: 0x1a1214, lip: 0xc07870,
};
const PAL = {
  ...C,
  W: MC.jacket, W2: shade(MC.jacket, 0.94), Wh: shade(MC.jacket, 1.04), S: MC.trim, Sd: shade(MC.trim, 0.75),
  G: MC.legs, Gd: shade(MC.legs, 0.8), Gm: shade(MC.legs, 1.3), Gl: shade(MC.legs, 1.8),
  T: MC.trim, Td: shade(MC.trim, 0.75), Tl: shade(MC.trim, 1.15),
  gold: MC.trim, leather: MC.trim, glove: MC.skin, sole: 0xd8d8d8, skin: MC.skin, skinD: shade(MC.skin, 0.85),
};
const B = (a, b, c, paint) => ({ a, b, c, paint });
const Pt = (a, b, c) => ({ a, b, c, paint: true });
const mirror = (q) => ({ ...q, a: [1 - q.b[0], q.a[1], q.a[2]], b: [1 - q.a[0], q.b[1], q.b[2]] });
const both = (...qs) => qs.flatMap((q) => [q, mirror(q)]);

export function head() {
  return [
    B([-3, 1, -3], [4, 10, 3], MC.skin),                              // skull
    B([-3, 0, 2], [4, 8, 4], MC.skin),                                // face
    ...both(Pt([-2, 5, 3], [-1, 7, 4], MC.eye)),                      // eyes (the face's front layer is z 3)
    Pt([0, 2, 3], [1, 3, 4], MC.lip),                                 // mouth
    ...both(Pt([-3, 7, 3], [-1, 8, 4], 0x2a1a14)),                     // brows
    B([-4, 5, -4], [5, 12, 1], MC.hair),                              // hair: back, sides, crown
    B([-4, 10, -4], [5, 12, 4], MC.hair),                             // top, down to the brow
    B([-3, 8, 3], [2, 10, 5], MC.hair),                               // fringe swept to one side
    ...both(B([-4, 3, 0], [-3, 8, 3], MC.hair)),                      // side locks
    // clear goggles pushed up on the forehead: strap round the head, two lenses on the hairline
    B([-5, 11, -5], [6, 12, 5], MC.shaft),
    ...both(B([-3, 11, 3], [0, 13, 5], MC.lens)),
    B([0, 12, -6], [1, 14, -4], MC.hair),                             // ponytail root (the tail itself is a chain)
  ];
}

// ---------------------------------------------------------------- umbrellas (weapon space: +Z along the shaft from the grip)
const U = 0.015;                                                     // umbrella voxel (m)
/** Closed folding umbrella: J-hook handle behind the grip, shaft, the furled canopy bundle, a ferrule at the tip. */
function closedGeo(canopy) {
  const e = [
    B([-1, -1, -8], [1, 1, 6], MC.shaft),                             // handle + shaft through the grip
    B([-1, -6, -10], [1, 1, -8], MC.shaft), B([-1, -8, -9], [1, -5, -6], MC.shaft),   // the J-hook, curling under
    B([-1, -1, 6], [1, 1, 57], MC.shaft),
  ];
  for (let z = 12; z < 52; z += 2) {                                 // furled canopy: fat in the middle, tapered at both ends
    const s = (z - 12) / 40, r = Math.max(1, Math.round(3.2 * Math.sin(Math.PI * Math.min(1, s * 1.15))));
    e.push(B([-r, -r, z], [r, r, z + 2], (x, y) => (x === -r && y % 2 === 0 ? shade(canopy, 0.85) : canopy)));
  }
  e.push(B([-1, -1, 57], [1, 1, 60], 0xcfcfcf));                      // ferrule
  return vox(e, U, { jitter: 0.03, ao: 0.2 });
}
/** Open umbrella: the canopy disc (radius 0.45 m, 8 panels, a shallow dome) at the top of the shaft, ribs darker. */
function openGeo(canopy) {
  const e = [
    B([-1, -1, -8], [1, 1, 50], MC.shaft),
    B([-1, -6, -10], [1, 1, -8], MC.shaft), B([-1, -8, -9], [1, -5, -6], MC.shaft),
    B([-1, -1, 50], [1, 1, 56], 0xcfcfcf),
  ];
  const R = 30;                                                      // 30 × 1.5 cm = 0.45 m
  for (let x = -R; x < R; x += 2) for (let y = -R; y < R; y += 2) {
    const r = Math.hypot(x + 1, y + 1);
    if (r > R) continue;
    const a = Math.atan2(y + 1, x + 1), k = (a / (Math.PI / 4) + 8) % 1, rib = k < 0.12 || k > 0.88;
    const z = 50 - Math.round(10 * (r / R) ** 2);                    // dome: the rim hangs back toward the grip
    const col = rib ? shade(canopy, 0.6) : (Math.floor(a / (Math.PI / 4) + 8) & 1) ? canopy : shade(canopy, 0.9);
    e.push(B([x, y, z], [x + 2, y + 2, z + 2], r > R - 2 ? shade(canopy, 0.75) : col));
  }
  return vox(e, U, { jitter: 0.02, ao: 0.15 });
}
export const UMB = { tip: 0.88 };
/** Moves that show the open canopy (render-only), and the Musou's open frames. */
export const OPEN = { n3: [6, 30], c1: [6, 50], c4: [6, 50], c6: [6, 76], jc: [30, 50] };
export const MUSOU_OPEN = [112, 174];

/** Slim the shared cut: torso / arm box X extents × k (voxel units, rounded; odd-width parts stay centred). */
function slim(parts, k) {
  for (const j of ['chest', 'spine', 'upperArmL', 'upperArmR', 'foreArmL', 'foreArmR']) {
    if (!parts[j]) continue;
    parts[j] = parts[j].map((q) => ({ ...q, a: [Math.round(q.a[0] * k), q.a[1], q.a[2]], b: [Math.round(q.b[0] * k), q.b[1], q.b[2]] }));
  }
  return parts;
}

export function createSiumeiModel(rig) {
  const mat = heroLook(new THREE.MeshStandardMaterial({ color: new THREE.Color(0.86, 0.86, 0.86), vertexColors: true, roughness: 0.55, metalness: 0.05, flatShading: true }));
  const body = bodyParts(PAL);                                        // (pauldron boxes only: they stay hidden)
  const P_ = body.parts = outfit({ jacket: MC.jacket, jacketD: MC.trim, sleeve: MC.jacket, trou: MC.legs, trouD: shade(MC.legs, 1.25),
    shoe: MC.shoe, sole: 0xc8c8c8, laces: 0xe0e0e0, skin: MC.skin, glove: MC.skin, hem: 5, cuff: MC.trim, fold: shade(MC.jacket, 0.93) });
  P_.upperArmL.push(B([2, -8, -1], [3, -5, 2], MC.crossBg), Pt([2, -7, 0], [3, -6, 1], MC.cross),   // first-aid patch
    Pt([2, -8, 0], [3, -5, 1], MC.cross), Pt([2, -7, -1], [3, -6, 2], MC.cross));
  P_.chest.push(B([-5, 7, -8], [5, 11, -4], MC.jacket), B([-4, 8, -9], [4, 10, -8], MC.trim));   // hood down behind the neck
  P_.chest.push(B([-1, -2, 5], [1, 8, 6], MC.trim));                  // zip
  slim(P_, 0.92);                                                   // (outfit's own slim is 1: the model slims once)
  const { meshes, add } = buildBody(rig, mat, body, head());
  meshes.pauldronR.visible = meshes.pauldronL.visible = false;
  const um = heroLook(new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide }), 0.3, 0.8);
  const umbR = add(rig.joints.weapon, closedGeo(MC.canopyA), 'umbR', um), umbL = add(rig.joints.weaponL, closedGeo(MC.canopyB), 'umbL', um);
  const openR = add(rig.joints.weapon, openGeo(MC.canopyA), 'openR', um), openL = add(rig.joints.weaponL, openGeo(MC.canopyB), 'openL', um);
  openR.visible = openL.visible = false;
  rig.umbrellas = { closed: [umbR, umbL], open: [openR, openL] };
  return { meshes, material: mat };
}

// ---------------------------------------------------------------- secondary: ponytail, jacket hem, the umbrella swap
const hemSeg = (i, n) => vox([B([-5, -5, 0], [5, 0, 1], (x, y) => (i === n - 1 && y === -5 ? MC.trim : MC.jacket))], 0.025, { off: [0, 0, -0.5], jitter: 0.04, ao: 0.18 });
const frontSeg = () => vox([B([-4, -4, 0], [4, 0, 1], (x) => (Math.abs(x + 0.5) < 1 ? MC.trim : MC.jacket))], 0.025, { off: [0, 0, -0.5], jitter: 0.05, ao: 0.2 });
const tailSeg = (i, n) => { const w = i < 2 ? 2 : 1; return vox([B([-w, -6, -w], [w, 0, w], MC.hair)], 0.016, { off: [0, 0, 0], jitter: 0.04, ao: 0.2 }); };

/** Is the canopy open this render frame? (hero: the sim hero the battle view passes; the Musou window from hero.musouT) */
function isOpen(h) {
  if (!h) return false;
  if (h.state === 'musou') { const t = (h.musouT || 0) * 200; return t >= MUSOU_OPEN[0] && t < MUSOU_OPEN[1]; }
  const w = h.state === 'attack' && OPEN[h.move];
  return !!w && h.moveT >= w[0] && h.moveT < w[1];
}

export function createSiumeiSecondary(scene, rig, mat, hero) {
  const j = rig.joints, body = bodyChains(scene, rig, mat, hemSeg, frontSeg), { add } = body;
  add(j.head, { anchor: [0, 13 * HV, -5 * HV], rest: [0, -0.7, -0.7], n: 5, len: 0.07, stiff: 0.03, drag: 0.06,
    wind: 1.8, cone: 120, sway: 0.6, seg: tailSeg, hit: ['head', ['chest', 0.02]] });
  const upd = body.update;
  body.update = (dt) => {
    const t = upd(dt), u = rig.umbrellas; if (!u) return t;
    const o = isOpen(hero);
    if (u.open[0].visible !== o) { u.open[0].visible = u.open[1].visible = o; u.closed[0].visible = u.closed[1].visible = !o; }
    return t;
  };
  return body;
}
