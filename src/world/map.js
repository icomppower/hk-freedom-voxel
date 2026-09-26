// Battlefield contract (sim-safe: pure data + pure functions, no THREE). The map lane owns this file and the set in
// src/world/*; hero, crowd, story, HUD and camera only go through these exports.
//
// 定軍山 (Mount Dingjun, 219 AD) laid out along +Z, ≈ 370 m from the Shu camp to the summit — the DW8 stage shape:
// a wide opening field, a narrowing valley with one chokepoint, a gate you break through, then the climb to the
// enemy commander on the high ground, who stands where the whole map can see him.
//   蜀軍本陣  Shu main camp       z -156 … -119   h 0    palisade, tents, 蜀 banners; story start
//   漢水渡口  Han River ford      z -120 …  -44   h 0    open plain cut by the river: three shallow crossings
//   山道      mountain pass       z  -52 …   80   h 1→12 valley mouth → basin (free-mode arena, origin) → climb →
//                                                        chokepoint (z ≈ 62, 14 m wide, barricade gate 'pass')
//   魏軍營寨  Wei fortified camp  z   76 …  140   h 12   plaza at the castle wall (face z = WALL_Z), gate passage at
//                                                        GATE_X (gate 'weiCamp'), courtyard behind it
//   (ramp)    switchback          z  134 …  180   h 12→28 up the west flank (barricade gate 'summit' at x ≈ -20)
//   定軍山頂  summit plateau      z  168 …  220   h 28   夏侯淵's command tent, drums, the great 夏侯 banner
//
// Units: metres, +Z = "up the mountain" (camera yaw 0 looks along +Z). Sim y everywhere is HEIGHT ABOVE GROUND:
// ground(x, z) is only added by the render side (hero view, crowd view, camera focus, HUD tags, vfx), so every sim
// height test (airborne, hitbox yMax, enemy reach) keeps working on a slope.
// Walkable ground is a union of authored pieces (rects, ellipses, width-varying paths) rasterised once at load into a
// 1 m distance field (≈ metres inside the edge, negative outside); clampWalk() pushes points up its gradient, so the
// edge is the visible palisade / cliff foot / river bank, never an invisible circle. Heights come from the piece that
// owns the cell (flat plateaus, sloped paths), on a 2 m grid shared with the terrain mesh (src/world/terrain.js).
import { hash01 } from '../core/rng.js';

export const WALL_Z = 100, GATE_X = -10;      // castle wall face / gate centre (castle.js, dressing.js, HUD)
export const CAMP_H = 12, SUMMIT_H = 28;      // plateau heights (m): the camp (castle set sits on it), the summit
export const WATER_Y = -0.2;                  // Han River surface (river bed: -0.45 at the fords, -1.4 in the pools)

export const MAP = {
  id: 'dingjun',
  name: { zh: '定軍山', en: 'Mount Dingjun' },
  // zone: { id, name {zh, en}, x, z, and r (circle) or w, d (axis-aligned rect: width along X, depth along Z) }
  zones: [
    { id: 'honjin', name: { zh: '蜀軍本陣', en: 'Shu Main Camp' }, x: 0, z: -138, w: 52, d: 40 },
    { id: 'ford', name: { zh: '漢水渡口', en: 'Han River Ford' }, x: 0, z: -81, w: 96, d: 74 },
    { id: 'pass', name: { zh: '山道', en: 'Mountain Pass' }, x: 0, z: 16, w: 84, d: 124 },
    { id: 'camp', name: { zh: '魏軍營寨', en: 'Wei Fortified Camp' }, x: -16, z: 123, w: 76, d: 90 },
    { id: 'summit', name: { zh: '定軍山頂', en: 'Dingjun Summit' }, x: 2, z: 194, r: 34 },
  ],
};

/** Zone record by id (undefined if unknown). */
export const zone = (id) => MAP.zones.find((q) => q.id === id);

/** Zone containing (x, z), or null (the ramp's upper bend belongs to none). */
export function zoneAt(x, z) {
  for (const q of MAP.zones) {
    if (q.r ? (x - q.x) ** 2 + (z - q.z) ** 2 <= q.r * q.r : Math.abs(x - q.x) <= q.w / 2 && Math.abs(z - q.z) <= q.d / 2) return q;
  }
  return null;
}

// ---------------------------------------------------------------- layout
// smooth 2D value noise from the stable hash (no RNG state) — also used by the terrain/dressing builders
function vnoise(x, z, seed) {
  const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash01(xi, zi, seed), b = hash01(xi + 1, zi, seed), c = hash01(xi, zi + 1, seed), d = hash01(xi + 1, zi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const noise2 = (x, z, seed = 1) => vnoise(x, z, seed) * 0.62 + vnoise(x * 2.3 + 7, z * 2.3 + 3, seed + 1) * 0.38;
export const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// Walkable pieces. rect [x0, z0, x1, z1] | ell [cx, cz, rx, rz] | path [[x, z, half width, height], …] (heights and
// widths interpolate along it). h: plateau height (number) or (x, z) → m; edge: boundary wobble (m) for natural edges.
// The piece whose inside value is largest owns a cell (its height wins there), so pieces at different heights must
// only touch where their heights agree (path ends).
const PIECES = [
  { id: 'honjin', rect: [-24, -156, 24, -119], h: 0 },
  { id: 'ford', rect: [-44, -120, 44, -44], h: 0, edge: 3 },
  { id: 'mouth', path: [[0, -52, 15, 0], [0, -30, 15, 1.2]], edge: 2 },
  { id: 'basin', ell: [0, 0, 38, 36], h: (x, z) => 3 + z / 18, edge: 3 },
  { id: 'climb', path: [[0, 28, 13, 4.6], [7, 44, 11, 7], [4, 55, 7.5, 9], [2, 64, 7, 10.2], [-5, 72, 11, 11.4], [-10, 80, 14, 12]], edge: 1.5 },
  { id: 'plaza', rect: [-29, 76, 4, 96.5], h: CAMP_H },
  { id: 'gateway', rect: [GATE_X - 3.4, 95, GATE_X + 3.4, 111], h: CAMP_H },
  { id: 'court', rect: [-42, 110, 5, 140], h: CAMP_H },
  { id: 'ramp', path: [[-30, 133, 6, CAMP_H], [-41, 145, 6, 13.5], [-45, 159, 6, 18], [-33, 171, 6, 23], [-17, 176.5, 6, 26.5], [-6, 180, 7, SUMMIT_H]] },
  { id: 'summit', ell: [2, 194, 26, 26], h: SUMMIT_H, edge: 1.5 },
];
export const PIECE_IDS = PIECES.map((p) => p.id);
// non-walkable cut-outs [x0, z0, x1, z1]: the 本陣 front palisade either side of its gate
const CARVE = [[-25, -121.5, -9, -117.5], [9, -121.5, 25, -117.5]];
// Han River: centreline z(x), deep pools between the shallow crossings (x ranges)
export const riverZ = (x) => -86 + 5 * Math.sin(x * 0.055 + 0.6);
export const FORDS = [[-30, -18], [-6, 6], [18, 30]];
const fordIn = (x) => { let v = -1e9; for (const [a, b] of FORDS) v = Math.max(v, Math.min(x - a, b - x)); return v; };   // > 0 inside a crossing
/** Main road through every zone (render: paving, road dust, minimap trail). [x, z] */
export const ROUTE = [[0, -150], [0, -118], [0, -86], [0, -46], [0, 0], [0, 28], [7, 44], [4, 55], [2, 64], [-5, 72], [-10, 84], [GATE_X, 104],
  [GATE_X, 118], [-22, 128], [-30, 133], [-41, 145], [-45, 159], [-33, 171], [-17, 176.5], [-6, 180], [2, 192]];
/** Distance (m) from (x, z) to the main road. */
export function routeDist(x, z) {
  let d = 1e9;
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const [ax, az] = ROUTE[i], [bx, bz] = ROUTE[i + 1], ex = bx - ax, ez = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez)));
    d = Math.min(d, Math.hypot(x - ax - ex * t, z - az - ez * t));
  }
  return d;
}

let _s = 0, _h = 0, _o = 0;                   // evalPieces out: inside value, height, owner index
function rectIn(r, x, z) {
  const dx = Math.max(r[0] - x, x - r[2]), dz = Math.max(r[1] - z, z - r[3]);
  return dx > 0 || dz > 0 ? -Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) : -Math.max(dx, dz);
}
function evalPieces(x, z) {
  _s = -1e9;
  for (let k = 0; k < PIECES.length; k++) {
    const p = PIECES[k];
    let s, h = 0;
    if (p.rect) s = rectIn(p.rect, x, z);
    else if (p.ell) { const [cx, cz, rx, rz] = p.ell; s = (1 - Math.hypot((x - cx) / rx, (z - cz) / rz)) * Math.min(rx, rz); }
    else {
      s = -1e9;
      const P = p.path;
      for (let i = 0; i < P.length - 1; i++) {
        const [ax, az, aw, ah] = P[i], [bx, bz, bw, bh] = P[i + 1];
        const ex = bx - ax, ez = bz - az, t = Math.min(1, Math.max(0, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez)));
        const v = aw + (bw - aw) * t - Math.hypot(x - ax - ex * t, z - az - ez * t);
        if (v > s) { s = v; h = ah + (bh - ah) * t; }
      }
    }
    if (p.edge) s += p.edge * (noise2(x * 0.09 + k * 31, z * 0.09, 40 + k) - 0.5) * 2;
    if (s > _s) { _s = s; _o = k; _h = p.rect || p.ell ? (typeof p.h === 'function' ? p.h(x, z) : p.h) : h; }
  }
  for (const r of CARVE) _s = Math.min(_s, -rectIn(r, x, z));
  const dz = Math.abs(z - riverZ(x)), fi = fordIn(x);
  _s = Math.min(_s, Math.max(dz - 4.5, fi));                                    // deep pools are not walkable
  _h -= (1 - smooth(3.5, 7.5, dz)) * (1.4 + (0.45 - 1.4) * smooth(-2, 2, fi));   // river bed (also cuts the banks)
}

// ---------------------------------------------------------------- grids (built once at load, deterministic)
// One 2 m grid: walk inside value FIELD (bilinear: the edge lands within ≈ 0.1 m), height HGT, owner piece OWN.
const GX0 = -112, GZ0 = -178, GX1 = 112, GZ1 = 238;
const HS = 2, HNX = (GX1 - GX0) / HS + 1, HNZ = (GZ1 - GZ0) / HS + 1;
const HGT = new Float32Array(HNX * HNZ), OWN = new Uint8Array(HNX * HNZ), FIELD = new Float32Array(HNX * HNZ);
for (let j = 0; j < HNZ; j++) for (let i = 0; i < HNX; i++) { evalPieces(GX0 + i * HS, GZ0 + j * HS); HGT[i + j * HNX] = _h; OWN[i + j * HNX] = _o; FIELD[i + j * HNX] = _s; }
// seams where two pieces meet at slightly different heights: two passes of a masked blur (only neighbours within
// 1.5 m of the cell join in), so path feet fan into their plateaus while retaining walls between levels stay sharp
{
  const tmp = new Float32Array(HGT.length);
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < HNZ; j++) for (let i = 0; i < HNX; i++) {
      const c = HGT[i + j * HNX];
      let s = 0, n = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= HNX || jj >= HNZ) continue;
        const v = HGT[ii + jj * HNX];
        if (Math.abs(v - c) < 1.5) { s += v; n++; }
      }
      tmp[i + j * HNX] = s / n;
    }
    HGT.set(tmp);
  }
}
/** Render-side read-only view of the terrain grid (terrain mesh, cliffs, minimap). in: walk inside value (m). */
export const TERRAIN = { x0: GX0, z0: GZ0, x1: GX1, z1: GZ1, step: HS, nx: HNX, nz: HNZ, h: HGT, own: OWN, in: FIELD };

function bilerp(g, nx, nz, s, x, z) {
  let fx = (x - GX0) / s, fz = (z - GZ0) / s;
  fx = Math.min(nx - 1.001, Math.max(0, fx)); fz = Math.min(nz - 1.001, Math.max(0, fz));
  const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = i + j * nx;
  return (g[k] * (1 - u) + g[k + 1] * u) * (1 - v) + (g[k + nx] * (1 - u) + g[k + nx + 1] * u) * v;
}

/** Walk inside value (m, < 0 outside) ignoring gates — render side (minimap, dressing placement). */
export const walkIn = (x, z) => bilerp(FIELD, HNX, HNZ, HS, x, z);

/** Terrain height (m) at (x, z): render-side offset only (see header). Bilinear on the 2 m grid. */
export const ground = (x, z) => bilerp(HGT, HNX, HNZ, HS, x, z);

// ---------------------------------------------------------------- gates (sim state: set from story.reset / step)
// A closed gate is a thin rect cut out of the walkable area, wider than the corridor it spans, so anyone caught in
// it is pushed out through its nearest long face (never sideways into the corridor wall). Render: world.js swings the
// castle doors / collapses and burns the barricades when a gate opens. All open by default; spawnPoint() (battle
// start) resets them, so the story closes what it needs in its reset().
export const GATES = {
  pass: { rect: [-14, 59.5, 20, 62.5], open: true, name: { zh: '山道柵', en: 'Pass Barricade' } },
  weiCamp: { rect: [GATE_X - 7, 99.5, GATE_X + 7, 102.5], open: true, name: { zh: '營寨門', en: 'Camp Gate' } },
  summit: { rect: [-21.5, 166, -18.5, 186], open: true, name: { zh: '山頂柵', en: 'Summit Barricade' } },
};
const GATE_LIST = Object.values(GATES);
/** Open / close a gate by id ('pass' | 'weiCamp' | 'summit'). Sim: call from story.reset / story.step only. */
export function setGate(id, open) { if (GATES[id]) GATES[id].open = !!open; }

function walkD(x, z) {
  let d = bilerp(FIELD, HNX, HNZ, HS, x, z);
  for (const g of GATE_LIST) if (!g.open) { const o = -rectIn(g.rect, x, z); if (o < d) d = o; }
  return d;
}

/** Keep a sim position on walkable ground, `pad` metres clear of the edge / closed gates (negative pad: allowed that
 *  far outside). Returns a shared [x, z] (copy it if you keep it). Newton steps up the distance field's gradient. */
const _out = [0, 0], E = 0.5;
export function clampWalk(x, z, pad = 0) {
  for (let k = 0; k < 8; k++) {
    const d = walkD(x, z);
    if (d >= pad) break;
    const gx = walkD(x + E, z) - walkD(x - E, z), gz = walkD(x, z + E) - walkD(x, z - E), g2 = gx * gx + gz * gz;
    if (g2 < 1e-6) { x += 0.37; continue; }                                  // flat spot (medial axis of a cut): nudge
    // step along the unit gradient by the deficit, ≤ 3 m per iteration: a Newton step (deficit / |∇d|) blew up to tens
    // of metres where the field is nearly flat (thin closed gates, river banks) and teleported soldiers across the map
    const s = Math.min(pad - d + 0.01, 3) / Math.sqrt(g2);
    x += gx * s; z += gz * s;
  }
  _out[0] = x; _out[1] = z;
  return _out;
}

/** Arrows (sim): true where a closed gate (≤ 4 m), the castle wall, a palisade or a cliff (≤ 6 m) stands at (x, z) at
 *  height y above ground. The Han River's pools are off the walk field but open water, so they never block. */
export function blocksArrow(x, z, y) {
  if (y > 6) return false;
  if (y < 4) for (const g of GATE_LIST) if (!g.open && rectIn(g.rect, x, z) > -0.3) return true;
  return walkIn(x, z) < -0.6 && Math.abs(z - riverZ(x)) > 6.5;
}

/** Where the hero starts: { x, z, yaw }. Story: inside the 蜀軍本陣 gate facing the valley; free: the pass basin
 *  (the origin, where the free-mode army forms up around him). Battle start: also resets every gate to open. */
export function spawnPoint(charId, mode) {
  for (const g of GATE_LIST) g.open = true;
  return mode === 'story' ? { x: 0, z: -142, yaw: 0 } : { x: 0, z: 0, yaw: 0 };
}
