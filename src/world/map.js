// Battlefield contract (sim-safe: pure data + pure functions, no THREE). The map lane owns this file and the set in
// src/world/*; hero, crowd, story, HUD and camera only go through these exports.
//
// 定軍山 (Mount Dingjun, 219 AD) laid out along +Z, ≈ 360 m from the Shu camp to the summit. The Wei castle set
// (castle.js, wall face at WALL_Z = 100, gate at GATE_X) is reused as the fortified camp's gate.
//   蜀軍本陣  Shu main camp        z ≈ -150 … -120   start
//   漢水渡口  Han River ford       z ≈ -110 …  -50   ford + open plain
//   山道      mountain pass        z ≈  -40 …   85   narrowing switchback road up to the camp
//   魏軍營寨  Wei fortified camp   z ≈   85 …  150   castle wall + gate at z = 100
//   定軍山頂  summit plateau       z ≈  160 …  210   夏侯淵's HQ (boss)
//
// Units: metres, +Z = "up the mountain" (camera yaw 0 looks along +Z). Sim y everywhere is HEIGHT ABOVE GROUND:
// ground(x, z) is only added by the render side (hero view, crowd view, camera focus, HUD tags, vfx), so every sim
// height test (airborne, hitbox yMax, enemy reach) keeps working on a slope.
import { ARENA_RADIUS, WALL_Z } from './world.js';

export const MAP = {
  id: 'dingjun',
  name: { zh: '定軍山', en: 'Mount Dingjun' },
  // zone: { id, name {zh, en}, x, z, and r (circle) or w, d (axis-aligned rect: width along X, depth along Z) }
  zones: [
    { id: 'honjin', name: { zh: '蜀軍本陣', en: 'Shu Main Camp' }, x: 0, z: -135, w: 50, d: 30 },
    { id: 'ford', name: { zh: '漢水渡口', en: 'Han River Ford' }, x: 0, z: -80, w: 90, d: 60 },
    { id: 'pass', name: { zh: '山道', en: 'Mountain Pass' }, x: 0, z: 22, w: 40, d: 125 },
    { id: 'camp', name: { zh: '魏軍營寨', en: 'Wei Fortified Camp' }, x: 0, z: 118, w: 80, d: 65 },
    { id: 'summit', name: { zh: '定軍山頂', en: 'Dingjun Summit' }, x: 0, z: 185, r: 28 },
  ],
};

/** Zone record by id (undefined if unknown). */
export const zone = (id) => MAP.zones.find((q) => q.id === id);

/** Zone containing (x, z), or null. */
export function zoneAt(x, z) {
  for (const q of MAP.zones) {
    if (q.r ? (x - q.x) ** 2 + (z - q.z) ** 2 <= q.r * q.r : Math.abs(x - q.x) <= q.w / 2 && Math.abs(z - q.z) <= q.d / 2) return q;
  }
  return null;
}

/** Terrain height (m) at (x, z). Render-side offset only (see header). Flat for now: the map lane shapes it. */
export function ground(x, z) { return 0; }

/** Keep a sim position on walkable ground, `pad` metres clear of the edge / walls. Returns a shared [x, z] (copy it
 *  if you keep it). Stand-in: the old arena disc (ARENA_RADIUS) with the castle wall at WALL_Z. */
const _out = [0, 0];
export function clampWalk(x, z, pad = 0) {
  const R = ARENA_RADIUS - pad, r = Math.hypot(x, z);
  if (r > R) { x *= R / r; z *= R / r; }
  if (z > WALL_Z - 3 - pad) z = WALL_Z - 3 - pad;
  _out[0] = x; _out[1] = z;
  return _out;
}

/** Where the hero starts: { x, z, yaw }. Free mode keeps the arena centre; story mode will start at 蜀軍本陣
 *  (map lane: move it there once clampWalk covers the long field). */
export function spawnPoint(charId, mode) {
  return { x: 0, z: 0, yaw: 0 };
}
