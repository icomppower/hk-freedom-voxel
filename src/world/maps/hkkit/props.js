// 香港自由戰士 map render kit — props as box lists (render-only). A prop builder returns boxes in its own frame (metres,
// origin on the ground at its centre, +Z = its front); place() moves them into the world, merge() bakes a list into one
// geometry (src/core/voxel.js boxesGeometry: { s: [w, h, d], p: [cx, cy, cz], c, r? }). Hong Kong 2019 streets: towers
// with lit window grids, the concrete footbridge, jersey barriers, crowd barriers, bamboo scaffold barricades, street
// lamps, umbrellas, a tram-style double-deck bus, MTR fare gates and a train. Generic designs: no signage, logos,
// flags, emblems or text anywhere.
import * as THREE from 'three';
import { boxesGeometry, shade } from '../../../core/voxel.js';
import { hash01 } from '../../../core/rng.js';

export const bx = (s, p, c, r) => ({ s, p, c, r });
const _qy = new THREE.Quaternion(), _ql = new THREE.Quaternion(), _e = new THREE.Euler(), _Y = new THREE.Vector3(0, 1, 0);
/** Boxes of a prop frame → world: rotate by yaw about Y (composed with each box's own rotation), scale k, lift y, move. */
export function place(boxes, x, y, z, yaw = 0, k = 1) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  _qy.setFromAxisAngle(_Y, yaw);
  return boxes.map((q) => {
    const [px, py, pz] = q.p;
    let r = [0, yaw, 0];
    if (q.r) { _ql.setFromEuler(_e.set(q.r[0], q.r[1], q.r[2], 'XYZ')); _ql.premultiply(_qy); _e.setFromQuaternion(_ql, 'XYZ'); r = [_e.x, _e.y, _e.z]; }
    return { s: q.s.map((v) => v * k), p: [x + (px * c + pz * s) * k, y + py * k, z + (-px * s + pz * c) * k], c: q.c, r };
  });
}
export const merge = (boxes) => boxesGeometry(boxes);
export const propMaterial = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8, metalness: 0.05, ...o });

export const CONCRETE = 0x8a8a86, CONCRETE_D = 0x5e5e5a, ASPHALT = 0x2e2f33, STEEL = 0x6a6e74, YELLOW = 0xffd700, BAMBOO = 0xc9b36a;

/** Office / residential tower: a slab with a window grid (lit windows as separate emissive boxes → `lit`), a roof box.
 *  Returns { body, lit } box lists. w × d footprint, h tall, seed for which windows are on. */
export function tower(w, d, h, seed = 0, { col = 0x4a4e56, glass = 0x2a3440, litCol = 0xf0e0c0, litP = 0.35 } = {}) {
  const body = [bx([w, h, d], [0, h / 2, 0], shade(col, 0.9 + hash01(seed, 1) * 0.15)), bx([w * 0.6, 2.2, d * 0.6], [0, h + 1.1, 0], shade(col, 0.8))];
  const lit = [];
  const fl = 3.4, nF = Math.floor((h - 4) / fl), nW = Math.max(2, Math.floor(w / 2.2)), nD = Math.max(2, Math.floor(d / 2.2));
  for (let f = 0; f < nF; f++) {
    const y = 4 + f * fl + 1.3;
    for (const [side, n, len] of [[0, nW, w], [1, nD, d]]) for (let k = 0; k < n; k++) {
      const u = -len / 2 + (k + 0.5) * len / n;
      for (const sgn of [-1, 1]) {
        const on = hash01(seed * 7 + f, k * 3 + side, sgn + 5) < litP;
        const q = side === 0 ? bx([len / n * 0.62, 1.5, 0.08], [u, y, sgn * (d / 2 + 0.03)], on ? litCol : glass) : bx([0.08, 1.5, len / n * 0.62], [sgn * (w / 2 + 0.03), y, u], on ? litCol : glass);
        (on ? lit : body).push(q);
      }
    }
  }
  return { body, lit };
}
/** Concrete jersey barrier segment along +Z (length L). */
export const jersey = (L = 3) => [bx([0.6, 0.45, L], [0, 0.22, 0], CONCRETE), bx([0.3, 0.45, L], [0, 0.66, 0], shade(CONCRETE, 1.05))];
/** Crowd-control barrier (steel rail on two feet), along X, 2.4 m. */
export const crowdBarrier = (c = 0x9aa0a8) => {
  const out = [bx([0.08, 1.1, 0.08], [-1.15, 0.55, 0], c), bx([0.08, 1.1, 0.08], [1.15, 0.55, 0], c), bx([2.3, 0.06, 0.06], [0, 1.05, 0], c),
    bx([2.3, 0.06, 0.06], [0, 0.2, 0], c), bx([0.6, 0.05, 0.5], [-1.15, 0.03, 0], shade(c, 0.7)), bx([0.6, 0.05, 0.5], [1.15, 0.03, 0], shade(c, 0.7))];
  for (let k = 0; k < 10; k++) out.push(bx([0.03, 0.85, 0.03], [-1.05 + k * 0.233, 0.62, 0], c));
  return out;
};
/** Bamboo-scaffold barricade: crossed poles lashed together, along X, width w. */
export function bambooBarricade(w = 6, seed = 0) {
  const out = [];
  for (let k = 0; k <= Math.round(w / 1.2); k++) out.push(bx([0.08, 2.2 + hash01(seed, k) * 0.6, 0.08], [-w / 2 + k * 1.2, 1.1, hash01(seed, k, 2) * 0.3], BAMBOO, [0.1 * (hash01(seed, k, 3) - 0.5), 0, 0.2 * (hash01(seed, k, 4) - 0.5)]));
  for (const y of [0.6, 1.4]) out.push(bx([w + 0.4, 0.08, 0.08], [0, y, 0.15], shade(BAMBOO, 0.9), [0, 0, 0.06 * (y - 1)]));
  out.push(bx([w * 0.9, 0.08, 0.08], [0, 1.0, 0.1], shade(BAMBOO, 0.85), [0, 0, 0.35]), bx([w * 0.9, 0.08, 0.08], [0, 1.0, 0.2], shade(BAMBOO, 0.85), [0, 0, -0.35]));
  return out;
}
/** Street lamp (the head's glow box is returned separately so the world can light it): pole + arm. */
export const streetLamp = (h = 8) => ({ body: [bx([0.2, h, 0.2], [0, h / 2, 0], 0x3a3e44), bx([0.14, 0.14, 1.8], [0, h - 0.1, 0.9], 0x3a3e44)],
  glow: [bx([0.5, 0.18, 0.7], [0, h - 0.25, 1.7], 0xffc070)] });
/** Umbrella (open), canopy height y, colour c, tilt rx (dropped umbrellas lie on the road: y small, tilted). */
export function umbrella(c, y = 1.9, rx = 0) {
  const out = [bx([0.04, y, 0.04], [0, y / 2, 0], 0x2a2a2a, [rx, 0, 0])];
  for (let k = 0; k < 4; k++) out.push(bx([1.0 - k * 0.22, 0.06, 1.0 - k * 0.22], [0, y + k * 0.06, 0], k % 2 ? shade(c, 0.9) : c, [rx, 0, 0]));
  return out;
}
/** Concrete footbridge across the road (along X), deck height y, span w, with glass-panel parapets and two pairs of
 *  pillars at x = ±px (the pillars are the map's carved set pieces). */
export function footbridge(w, y = 6, px = 6, depth = 4) {
  const out = [bx([w, 0.9, depth], [0, y, 0], CONCRETE), bx([w, 0.3, depth + 0.4], [0, y - 0.55, 0], CONCRETE_D),
    bx([w, 1.1, 0.12], [0, y + 1.0, depth / 2], 0x7a9aa8), bx([w, 1.1, 0.12], [0, y + 1.0, -depth / 2], 0x7a9aa8),
    bx([w, 0.1, 0.14], [0, y + 1.6, depth / 2], STEEL), bx([w, 0.1, 0.14], [0, y + 1.6, -depth / 2], STEEL),
    bx([w, 0.25, depth + 0.6], [0, y + 3.2, 0], 0x5a5e64)];                       // roof
  for (const sx of [-1, 1]) out.push(bx([2.4, y - 0.4, 1.6], [sx * px, (y - 0.4) / 2, 0], shade(CONCRETE, 0.95)));
  return out;
}
/** Double-deck bus, abandoned, along +Z (plain livery). */
export const bus = (c = 0xc8c8c0) => [bx([2.5, 3.9, 11], [0, 2.3, 0], c), bx([2.52, 0.9, 10.6], [0, 1.5, 0], 0x2a3440), bx([2.52, 0.9, 10.6], [0, 3.4, 0], 0x2a3440),
  bx([2.6, 0.4, 11.2], [0, 0.55, 0], shade(c, 0.7)), ...[-4, 3.5].flatMap((z) => [bx([0.4, 1, 1], [-1.2, 0.5, z], 0x151515), bx([0.4, 1, 1], [1.2, 0.5, z], 0x151515)])];
/** Tree in a planter (roadside, lawn). */
export function tree(h = 5, seed = 0) {
  const g = [0x2e4a2a, 0x36542e, 0x284226], b = [bx([0.4, h * 0.5, 0.4], [0, h * 0.25, 0], 0x4a3a2c)];
  for (let k = 0; k < 4; k++) {
    const s = (2.6 - k * 0.5) * (0.85 + hash01(seed, k) * 0.3);
    b.push(bx([s, 1.2, s], [(hash01(seed, k, 1) - 0.5) * 0.6, h * 0.5 + k * 0.9, (hash01(seed, k, 2) - 0.5) * 0.6], g[(seed + k) % 3]));
  }
  return b;
}
/** Tear-gas canister lying on the road. */
export const canister = () => [bx([0.08, 0.08, 0.22], [0, 0.05, 0], 0x5a6040), bx([0.09, 0.09, 0.04], [0, 0.05, 0.11], 0x3a3a3a)];
/** Stretcher carried by two medics (+Z forward): the stretcher and two white-helmeted medics in hi-vis. */
export const stretcherGroup = () => [bx([0.6, 0.1, 2.0], [0, 0.95, 0], 0xd8d8d0), bx([0.5, 0.25, 1.4], [0, 1.1, -0.1], 0x222222),
  ...[1.4, -1.4].flatMap((z) => [bx([0.45, 0.8, 0.3], [0, 0.4, z], 0x1c1c1c), bx([0.5, 0.65, 0.34], [0, 1.15, z], 0xc8f040), bx([0.26, 0.26, 0.26], [0, 1.62, z], 0xf1c27d),
    bx([0.3, 0.14, 0.3], [0, 1.8, z], 0xf2f2f2), bx([0.3, 0.14, 0.14], [0, 1.4, z + 0.2], 0xe53935)])];
