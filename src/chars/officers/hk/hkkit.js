// 香港自由戰士 officer builder (content for the crowd view's officer-model hook, src/crowd/view.js header): part box lists in
// the crowd's soldier space (metres, feet at 0, facing +Z; pelvis 0.86 · neck +0.5 over the waist · shoulders ±0.235 @
// +0.43 · hand −0.5 below the shoulder · knee −0.42) and weapon / off-hand box lists (weapon space: grip at the origin, +Z
// along the weapon; off-hand: the left hand frame). Modern clothes: riot kit, suits, shirts, robes.
// Content rule: no badge, flag, force crest, party emblem, number or slogan on anything; riot kit is plain dark blue with a
// blank patch. No real person's likeness: faces are generic voxel faces.
import { shade } from '../../../core/voxel.js';
import { hash01 } from '../../../core/rng.js';

export const b = (a, bb, c, paint) => ({ a, b: bb, c, paint });
export const box = (s, p, c, r) => ({ s, p, c, r });

/** Human head (neck at y 0, crown ≈ 0.3, face toward +Z). opts: hair (colour | null = bald / covered), helmet {c, visor,
 *  snout} (riot helmet: raised clear visor, gas-mask snout), cap (colour: a peaked cap), brows (heavy), mask (colour: a
 *  lacquered full-face mask with narrow eye slits), silver (hair colour override). */
export function humanHead(C, o = {}) {
  const h = [
    b([-0.095, 0.02, -0.09], [0.095, 0.25, 0.1], C.skin),                               // skull
    b([-0.095, 0.02, 0.06], [0.095, 0.06, 0.1], C.skinD, true),                          // jaw shadow
    b([-0.065, 0.125, 0.095], [-0.03, 0.15, 0.106], C.eye ?? 0x151515, true), b([0.03, 0.125, 0.095], [0.065, 0.15, 0.106], C.eye ?? 0x151515, true),
    b([-0.075, 0.16, 0.095], [-0.02, 0.18 + (o.brows ? 0.015 : 0), 0.11], C.brow ?? 0x241c18, true),
    b([0.02, 0.16, 0.095], [0.075, 0.18 + (o.brows ? 0.015 : 0), 0.11], C.brow ?? 0x241c18, true),
    b([-0.015, 0.08, 0.1], [0.02, 0.13, 0.125], C.skinD),                                // nose
    b([-0.03, 0.05, 0.1], [0.03, 0.06, 0.105], shade(C.skinD, 0.8), true),              // mouth
  ];
  const hair = o.silver ?? o.hair;
  if (hair != null) h.push(b([-0.105, 0.18, -0.105], [0.105, 0.29, 0.085], hair), b([-0.105, 0.06, -0.105], [0.105, 0.2, -0.05], hair),
    b([-0.108, 0.12, -0.05], [-0.09, 0.22, 0.05], hair), b([0.09, 0.12, -0.05], [0.108, 0.22, 0.05], hair));
  if (o.cap != null) h.push(b([-0.11, 0.2, -0.11], [0.11, 0.3, 0.1], o.cap), b([-0.1, 0.2, 0.08], [0.1, 0.225, 0.2], shade(o.cap, 0.8)));
  if (o.helmet) {
    const H = o.helmet;
    h.push(b([-0.125, 0.12, -0.13], [0.125, 0.32, 0.11], H.c), b([-0.1, 0.32, -0.1], [0.1, 0.345, 0.08], shade(H.c, 1.25)),
      b([-0.125, 0.03, -0.13], [0.125, 0.14, -0.06], H.c));                             // neck guard
    if (H.visor !== false) h.push(b([-0.12, 0.25, 0.1], [0.12, 0.32, 0.14], H.visor ?? 0x9fc4d8));   // visor raised up on the brow
    if (H.shade) h.push(b([-0.115, 0.1, 0.1], [0.115, 0.24, 0.13], H.shade));          // dark visor down over the face
    if (H.snout) h.push(b([-0.06, 0.02, 0.1], [0.06, 0.1, 0.17], 0x1e2226), b([-0.045, 0.03, 0.17], [0.045, 0.085, 0.2], 0x3a4046),   // gas mask
      b([-0.1, 0.03, 0.08], [-0.06, 0.08, 0.13], 0x2a2e33), b([0.06, 0.03, 0.08], [0.1, 0.08, 0.13], 0x2a2e33));       // filters
  }
  if (o.mask != null) h.push(b([-0.1, 0.02, 0.09], [0.1, 0.26, 0.125], o.mask),
    b([-0.075, 0.13, 0.124], [-0.02, 0.155, 0.15], 0x0a0a0c), b([0.02, 0.13, 0.124], [0.075, 0.155, 0.15], 0x0a0a0c),   // narrow eye slits
    b([-0.1, 0.24, 0.085], [0.1, 0.262, 0.13], o.maskTrim ?? 0xc8a040));
  return h;
}

/** Body parts. C keys: shirt, shirtD, pants, boot, skin, belt, buckle; opts: bulk (width ×), jacket (colour: open jacket
 *  over the shirt), vest (colour, riot / body-armour vest), bands (colour: reflective bands on the torso + arms), robe
 *  (colour: ankle-length court robe), mantle (colour: a pelt over the shoulders), trim (robe edge colour), chain (gold
 *  chain round the neck), tie (colour), patch (true: a blank shoulder patch), sleeves (colour, else shirt), bare (arms:
 *  short sleeves, skin forearms). */
export function humanBody(C, o = {}) {
  const w = (v) => v * (o.bulk ?? 1), vest = o.vest, S = o.sleeves ?? C.shirt;
  const p = {};
  p.hips = [
    b([-w(0.16), -0.1, -0.1], [w(0.16), 0.06, 0.1], C.pants),
    b([-w(0.17), -0.01, -0.11], [w(0.17), 0.05, 0.11], C.belt ?? 0x1c1c1c),
    b([-0.03, 0.0, 0.105], [0.03, 0.05, 0.125], C.buckle ?? 0x6a6c70),
  ];
  p.torso = [
    b([-w(0.15), -0.04, -0.1], [w(0.15), 0.22, 0.1], C.shirt),
    b([-w(0.18), 0.18, -0.115], [w(0.18), 0.46, 0.115], C.shirt),
    b([-0.07, 0.44, -0.07], [0.07, 0.5, 0.07], C.skin),                                  // neck
  ];
  if (vest != null) p.torso.push(b([-w(0.165), 0.02, -0.12], [w(0.165), 0.44, 0.125], (x, y, z, i, j) => (j % 4 === 0 ? shade(vest, 0.8) : vest)));
  if (o.jacket != null) p.torso.push(b([-w(0.19), -0.06, -0.125], [w(0.19), 0.46, 0.12], (x, y, z, i, j, k) => (z > 0.1 && Math.abs(x) < 0.07 ? null : o.jacket)),
    b([-0.06, 0.34, 0.11], [-0.02, 0.46, 0.13], shade(o.jacket, 1.2)), b([0.02, 0.34, 0.11], [0.06, 0.46, 0.13], shade(o.jacket, 1.2)));   // lapels
  if (o.tie != null) p.torso.push(b([-0.02, 0.12, 0.1], [0.02, 0.44, 0.125], o.tie));
  if (o.chain) p.torso.push(b([-0.085, 0.38, 0.1], [-0.03, 0.4, 0.132], 0xd8b040), b([-0.035, 0.34, 0.1], [0.035, 0.37, 0.132], 0xd8b040),   // a V of gold
    b([0.03, 0.38, 0.1], [0.085, 0.4, 0.132], 0xd8b040));                              // chain (no vertical bar: never a cross)
  if (o.bands != null) p.torso.push(b([-w(0.17), 0.12, -0.13], [w(0.17), 0.16, 0.135], o.bands), b([-w(0.17), 0.3, -0.13], [w(0.17), 0.34, 0.135], o.bands));
  if (o.robe != null) {
    p.torso.push(b([-w(0.2), -0.06, -0.13], [w(0.2), 0.47, 0.13], o.robe), b([-0.1, 0.4, -0.14], [0.1, 0.52, 0.14], o.trim ?? 0xc8a040),   // high collar
      b([-w(0.2), -0.06, 0.13], [-w(0.14), 0.4, 0.145], o.trim ?? 0xc8a040));           // gold edge down one side (asymmetric)
    p.hips.push(b([-w(0.22), -0.84, -0.16], [w(0.22), 0.04, 0.16], (x, y, z, i, j) => (y < -0.8 ? o.trim ?? 0xc8a040 : o.robe)));   // skirt to the ankle
  }
  if (o.mantle != null) p.torso.push(b([-w(0.3), 0.3, -0.17], [w(0.3), 0.52, 0.12], (x, y, z, i, j, k) => (hash01(i * 3, j, k) < 0.2 ? shade(o.mantle, 0.75) : o.mantle)),
    b([-w(0.24), -0.4, -0.2], [w(0.24), 0.45, -0.14], (x, y, z, i, j, k) => (y < -0.34 && hash01(i, 5, 2) < 0.4 ? null : hash01(i, j, 9) < 0.15 ? shade(o.mantle, 1.3) : o.mantle)));
  p.arm = [
    b([-0.055, -0.24, -0.06], [0.055, 0.03, 0.06], o.jacket ?? S),
    b([-0.055, -0.46, -0.058], [0.055, -0.22, 0.058], o.bare ? C.skin : o.jacket ?? S),
    b([-0.045, -0.56, -0.05], [0.045, -0.46, 0.05], C.glove ?? C.skin),
  ];
  if (o.patch) p.arm.push(b([0.054, -0.14, -0.04], [0.064, -0.05, 0.04], shade(o.patch === true ? C.shirt : o.patch, 1.2)));   // blank patch
  if (o.bands != null) p.arm.push(b([-0.06, -0.34, -0.063], [0.06, -0.3, 0.063], o.bands));
  if (o.robe != null) p.arm = [b([-0.07, -0.44, -0.07], [0.07, 0.03, 0.07], o.robe), b([-0.075, -0.46, -0.075], [0.075, -0.42, 0.075], o.trim ?? 0xc8a040),
    b([-0.045, -0.56, -0.05], [0.045, -0.46, 0.05], C.glove ?? C.skin)];
  p.thigh = [b([-0.068, -0.43, -0.072], [0.068, 0.02, 0.072], C.pants)];
  p.shin = [b([-0.062, -0.3, -0.066], [0.062, 0.02, 0.066], C.pants), b([-0.07, -0.42, -0.078], [0.07, -0.29, 0.13], C.boot)];
  if (o.pads) p.shin.push(b([-0.07, -0.26, 0.05], [0.07, 0.04, 0.1], o.pads));           // riot shin guards
  return p;
}

/** Round riot shield in the left hand frame (a plain disc of boxes, dark rim, no marking). */
export function roundShield(c, rim, r = 0.34, zo = 0.12) {
  const out = [];
  for (let k = -3; k <= 3; k++) { const h = Math.sqrt(Math.max(0, 1 - (k / 3.5) ** 2)) * r * 2; out.push(box([r * 2 / 7 + 0.005, h, 0.035], [k * r * 2 / 7, 0.05, zo], k % 2 ? c : shade(c, 0.92))); }
  out.push(box([r * 2 + 0.02, 0.03, 0.04], [0, 0.05 + r, zo], rim), box([r * 2 + 0.02, 0.03, 0.04], [0, 0.05 - r, zo], rim), box([0.1, 0.1, 0.03], [0, 0.05, zo + 0.03], rim));
  return out;
}
/** A straight pole / baton along +Z (grip at 0): from `butt` to `tip`, width w, colour c, darker bands every `node` m. */
export function stick(c, { butt = -0.2, tip = 0.6, w = 0.04, node = 0, nodeC = shade(c, 0.7) } = {}) {
  const out = [box([w, w, tip - butt], [0, 0, (tip + butt) / 2], c)];
  if (node) for (let z = butt + node; z < tip - 0.05; z += node) out.push(box([w + 0.012, w + 0.012, 0.03], [0, 0, z], nodeC));
  return out;
}
