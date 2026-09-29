// 羊村 map render kit — props as box lists (render-only). A prop builder returns boxes in its own frame (metres, origin on
// the ground at its centre, +Z = its front); place() moves them into the world (yaw about Y, then offset); merge() bakes a
// list into one geometry (src/core/voxel.js boxesGeometry: { s: [w, h, d], p: [cx, cy, cz], c, r? }). Village of 羊村: white
// plaster, dark tile roofs, weathered timber, paper lanterns; the wool barns; the shrine on the hill. Plain, no insignia.
import * as THREE from 'three';
import { boxesGeometry, shade } from '../../../core/voxel.js';
import { hash01 } from '../../../core/rng.js';

export const bx = (s, p, c, r) => ({ s, p, c, r });
const _qy = new THREE.Quaternion(), _ql = new THREE.Quaternion(), _e = new THREE.Euler(), _Y = new THREE.Vector3(0, 1, 0);
/** Boxes of a prop frame → world: rotate by yaw about Y (composed with each box's own rotation: boxesGeometry reads r as an
 *  XYZ euler, so the pair is re-expressed as one), scale by k, lift by y, move to (x, z). */
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
export const propMaterial = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85, metalness: 0.02, ...o });

const WOOD = 0x7a5234, WOOD_D = 0x4e3420, PLASTER = 0xe6ded0, TILE = 0x4a4c52, TILE_D = 0x34363a, STONE = 0x8a857c, RED = 0xa8342a;
const planks = (w, h, d, x, y, z, base, n = Math.max(1, Math.round(w / 0.5))) => {
  const out = [];
  for (let k = 0; k < n; k++) out.push(bx([w / n, h, d], [x - w / 2 + (k + 0.5) * w / n, y, z], shade(base, k % 2 ? 0.9 : 1.04)));
  return out;
};
/** Pitched roof: two slabs meeting at the ridge (along X), eaves overhang, a ridge beam. */
function roof(w, d, y, pitch, col, dark, over = 0.6) {
  const half = d / 2 + over, len = half / Math.cos(pitch), rise = half * Math.tan(pitch);
  return [
    bx([w + over * 2, 0.22, len], [0, y + rise / 2, -half / 2], col, [-pitch, 0, 0]),
    bx([w + over * 2, 0.22, len], [0, y + rise / 2, half / 2], shade(col, 0.88), [pitch, 0, 0]),
    bx([w + over * 2 + 0.2, 0.3, 0.34], [0, y + rise + 0.05, 0], dark),
  ];
}

/** Wool barn: plank walls, the big front door, a reddish tile roof, wool bales stacked by the door. */
export function barn(w = 14, d = 16, h = 5.5, seed = 0) {
  const b = [
    ...planks(w, h, 0.3, 0, h / 2, d / 2, WOOD), ...planks(w, h, 0.3, 0, h / 2, -d / 2, WOOD),
    bx([0.3, h, d], [-w / 2, h / 2, 0], shade(WOOD, 0.92)), bx([0.3, h, d], [w / 2, h / 2, 0], shade(WOOD, 0.92)),
    bx([w + 0.4, 0.35, d + 0.4], [0, h, 0], WOOD_D), bx([w + 0.4, 0.4, d + 0.4], [0, 0.2, 0], STONE),
    bx([4.2, 4.2, 0.36], [0, 2.1, d / 2 + 0.02], WOOD_D), bx([0.2, 4.2, 0.4], [0, 2.1, d / 2 + 0.05], 0x2e2014),
    ...roof(w, d, h, 0.55, 0x8a4a34, 0x3a2418),
  ];
  for (let k = 0; k < 5; k++) {                                          // wool bales
    const x = w / 2 - 1.4 - (k % 3) * 1.25, y = 0.45 + Math.floor(k / 3) * 0.9, z = d / 2 + 1.2 + hash01(seed, k, 3) * 0.4;
    b.push(bx([1.1, 0.9, 1.0], [x, y, z], shade(0xeee8da, 0.92 + hash01(seed, k) * 0.1)));
  }
  return b;
}
/** Village house: white plaster, dark tile roof, dark door and a window, a red lantern by the door. */
export function house(w = 7, d = 6, h = 3.6, seed = 0) {
  return [
    bx([w, h, d], [0, h / 2, 0], shade(PLASTER, 0.95 + hash01(seed, 1) * 0.08)),
    bx([w + 0.2, 0.5, d + 0.2], [0, 0.25, 0], STONE),
    bx([1.2, 2.2, 0.12], [-w / 4, 1.1, d / 2 + 0.03], 0x3a2a20), bx([1.2, 0.9, 0.12], [w / 4, 2.1, d / 2 + 0.03], 0x2a3440),
    ...roof(w, d, h, 0.5, TILE, TILE_D, 0.5),
    bx([0.4, 0.55, 0.4], [-w / 4 + 1.0, 2.3, d / 2 + 0.4], RED),
  ];
}
/** Paper lantern on a short bracket / post (lit look via its colour; the world adds the light). */
export const lantern = (col = RED) => [bx([0.06, 2.6, 0.06], [0, 1.3, 0], WOOD_D), bx([0.5, 0.06, 0.06], [0.22, 2.55, 0], WOOD_D),
  bx([0.46, 0.62, 0.46], [0.44, 2.2, 0], col), bx([0.3, 0.08, 0.3], [0.44, 2.55, 0], 0x2a2018), bx([0.3, 0.08, 0.3], [0.44, 1.86, 0], 0x2a2018)];
/** Round voxel tree: trunk, stacked leaf blocks. */
export function tree(h = 5, seed = 0) {
  const g = [0x4e6e2c, 0x5c7a34, 0x42602a], b = [bx([0.5, h * 0.5, 0.5], [0, h * 0.25, 0], 0x5a4030)];
  for (let k = 0; k < 4; k++) {
    const s = (2.4 - k * 0.45) * (0.85 + hash01(seed, k) * 0.3);
    b.push(bx([s, 1.2, s], [(hash01(seed, k, 1) - 0.5) * 0.6, h * 0.5 + k * 0.9, (hash01(seed, k, 2) - 0.5) * 0.6], g[(seed + k) % 3]));
  }
  return b;
}
/** Split-rail fence from a to b ([x, z]), post every ≈ 2.4 m. */
export function fence([ax, az], [bxz, bz], y = 0) {
  const len = Math.hypot(bxz - ax, bz - az), n = Math.max(1, Math.round(len / 2.4)), yaw = Math.atan2(bxz - ax, bz - az), out = [];
  for (let k = 0; k <= n; k++) { const u = k / n; out.push(bx([0.16, 1.2, 0.16], [ax + (bxz - ax) * u, y + 0.6, az + (bz - az) * u], WOOD_D)); }
  for (const hy of [0.45, 0.95]) out.push(bx([0.08, 0.1, len], [(ax + bxz) / 2, y + hy, (az + bz) / 2], WOOD, [0, yaw, 0]));
  return out;
}
/** Hand cart with a load of bundles (+Z = forward). */
export const cart = () => [bx([1.4, 0.35, 2.2], [0, 0.75, 0], WOOD), bx([1.5, 0.5, 0.1], [0, 1.05, 1.1], WOOD_D), bx([1.5, 0.5, 0.1], [0, 1.05, -1.1], WOOD_D),
  bx([0.12, 0.9, 0.9], [-0.78, 0.45, 0.2], 0x3a2a1c), bx([0.12, 0.9, 0.9], [0.78, 0.45, 0.2], 0x3a2a1c),
  bx([1.0, 0.6, 0.9], [0, 1.2, -0.3], 0xe8e2d4), bx([0.8, 0.5, 0.7], [0.1, 1.2, 0.6], 0x9a7a54), bx([0.08, 0.08, 1.6], [0, 0.72, 1.8], WOOD_D)];
/** Festival bunting: a string of small cloth pennants from a to b at height y (plain colours, no marks). */
export function bunting([ax, az], [bxz, bz], y) {
  const len = Math.hypot(bxz - ax, bz - az), n = Math.round(len / 0.9), cols = [0xd8453a, 0xe8c050, 0x3f8ab0, 0xf2eee4, 0x4a9a5a], out = [];
  for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, sag = Math.sin(u * Math.PI) * 0.6; out.push(bx([0.3, 0.36, 0.04], [ax + (bxz - ax) * u, y - sag, az + (bz - az) * u], cols[k % cols.length], [0, Math.atan2(bxz - ax, bz - az) + Math.PI / 2, 0])); }
  return out;
}
/** Timber palisade wall along X from x0 to x1 at z, height h (posts with alternating shade, a walkway rail). */
export function palisade(x0, x1, z, y, h = 3.4) {
  const out = [], n = Math.round((x1 - x0) / 0.5);
  for (let k = 0; k < n; k++) out.push(bx([0.48, h + (k % 3 === 1 ? 0.3 : 0), 0.5], [x0 + (k + 0.5) * 0.5, y + h / 2, z], shade(WOOD, k % 2 ? 0.88 : 1.02)));
  out.push(bx([x1 - x0, 0.25, 0.7], [(x0 + x1) / 2, y + h * 0.72, z - 0.3], WOOD_D));
  return out;
}
/** Gate tower beside a gateway: timber frame on a stone base, a small tile roof. */
export const tower = (h = 6) => [bx([3.2, 1.2, 3.2], [0, 0.6, 0], STONE), bx([2.8, h - 1.2, 2.8], [0, 0.6 + (h - 1.2) / 2, 0], shade(WOOD, 0.95)),
  bx([3.3, 0.3, 3.3], [0, h - 0.4, 0], WOOD_D), ...roof(2.6, 2.6, h - 0.2, 0.6, TILE, TILE_D, 0.5)];
/** Shrine hall: stone platform, red pillars, white walls, a heavy tile roof with a raised ridge. */
export function shrineHall(w = 14, d = 7) {
  const b = [bx([w + 1, 1, d + 1], [0, 0.5, 0], STONE), bx([w - 1, 3, d - 1.2], [0, 2.5, -0.3], PLASTER)];
  for (let k = 0; k < 6; k++) b.push(bx([0.4, 3.4, 0.4], [-w / 2 + 0.8 + k * (w - 1.6) / 5, 2.7, d / 2 - 0.4], RED));
  b.push(bx([w, 0.4, 0.5], [0, 4.4, d / 2 - 0.4], RED), ...roof(w, d, 4.6, 0.45, TILE, TILE_D, 1.1), bx([2.6, 1.6, 0.14], [0, 2.6, d / 2 - 0.9], 0x3a2418));
  return b;
}
/** The signal lantern: stone base, a tall pole, a crossbar; the lantern body itself is separate (lit / unlit). */
export const signalPole = () => [bx([2.2, 0.8, 2.2], [0, 0.4, 0], STONE), bx([0.35, 7, 0.35], [0, 4.3, 0], WOOD_D), bx([2.6, 0.25, 0.25], [0.9, 7.6, 0], WOOD_D)];
export const signalLantern = () => [bx([1.3, 1.8, 1.3], [0, 0, 0], 0xe05030), bx([1.0, 0.18, 1.0], [0, 0.98, 0], 0x2a2018), bx([1.0, 0.18, 1.0], [0, -0.98, 0], 0x2a2018)];
