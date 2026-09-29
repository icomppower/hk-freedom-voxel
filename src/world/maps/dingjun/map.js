// 定軍山 (Mount Dingjun, 219 AD) — map definition for the map registry (src/world/map.js: format and API there).
// Moved verbatim out of map.js by the seam commit; the numbers are upstream's.
// Laid out along +Z, ≈ 370 m from the Shu camp to the summit — the DW8 stage shape:
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
import { smooth } from '../../mapkit.js';

const WALL_Z = 100, GATE_X = -10;      // castle wall face / gate centre (castle.js, dressing.js, HUD)
const CAMP_H = 12, SUMMIT_H = 28;      // plateau heights (m): the camp (castle set sits on it), the summit
const WATER_Y = -0.2;                  // Han River surface (river bed: -0.45 at the fords, -1.4 in the pools)

// Han River: centreline z(x), deep pools between the shallow crossings (x ranges)
const riverZ = (x) => -86 + 5 * Math.sin(x * 0.055 + 0.6);
const FORDS = [[-30, -18], [-6, 6], [18, 30]];
const fordIn = (x) => { let v = -1e9; for (const [a, b] of FORDS) v = Math.max(v, Math.min(x - a, b - x)); return v; };   // > 0 inside a crossing

const PROP_CARVE = [[-4.8, 201.8, 12.8, 214.8], [-6.5, 127.6, -1.5, 132.4]];

export default {
  id: 'dingjun',
  name: { zh: '定軍山', en: 'Mount Dingjun' },
  WALL_Z, GATE_X, CAMP_H, SUMMIT_H, WATER_Y, riverZ, FORDS,
  // zone: { id, name {zh, en}, x, z, and r (circle) or w, d (axis-aligned rect: width along X, depth along Z) }
  zones: [
    { id: 'honjin', name: { zh: '蜀軍本陣', en: 'Shu Main Camp' }, x: 0, z: -138, w: 52, d: 40 },
    { id: 'ford', name: { zh: '漢水渡口', en: 'Han River Ford' }, x: 0, z: -81, w: 96, d: 74 },
    { id: 'pass', name: { zh: '山道', en: 'Mountain Pass' }, x: 0, z: 16, w: 84, d: 124 },
    { id: 'camp', name: { zh: '魏軍營寨', en: 'Wei Fortified Camp' }, x: -16, z: 123, w: 76, d: 90 },
    { id: 'summit', name: { zh: '定軍山頂', en: 'Dingjun Summit' }, x: 2, z: 194, r: 34 },
  ],
  grid: [-112, -178, 112, 238],
  // Walkable pieces. rect [x0, z0, x1, z1] | ell [cx, cz, rx, rz] | path [[x, z, half width, height], …] (heights and
  // widths interpolate along it). h: plateau height (number) or (x, z) → m; edge: boundary wobble (m) for natural edges.
  // The piece whose inside value is largest owns a cell (its height wins there), so pieces at different heights must
  // only touch where their heights agree (path ends).
  pieces: [
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
  ],
  // non-walkable cut-outs [x0, z0, x1, z1]: the 本陣 front palisade either side of its gate; 夏侯淵's pavilion platform
  // on the summit (stair, balustrade and step braziers included: 1.2 m of stone nobody may walk through); the Wei camp
  // courtyard's command table with its stools and brazier (dressing.js: solid set pieces, not walk-through decals)
  propCarve: PROP_CARVE,
  carve: [[-25, -121.5, -9, -117.5], [9, -121.5, 25, -117.5], ...PROP_CARVE],
  /** Terrain cut after the pieces: the Han River (deep pools are not walkable; the bed cuts the banks). o = { s, h }. */
  cut(x, z, o) {
    const dz = Math.abs(z - riverZ(x)), fi = fordIn(x);
    o.s = Math.min(o.s, Math.max(dz - 4.5, fi));                                    // deep pools are not walkable
    o.h -= (1 - smooth(3.5, 7.5, dz)) * (1.4 + (0.45 - 1.4) * smooth(-2, 2, fi));   // river bed (also cuts the banks)
  },
  /** Open water off the walk field: arrows fly over it (blocksArrow). */
  openWater: (x, z) => Math.abs(z - riverZ(x)) <= 6.5,
  /** Minimap: wet ground (the fords / pools tint). */
  wet: (x, z) => Math.abs(z - riverZ(x)) < 6.5,
  /** Main road through every zone (render: paving, road dust, minimap trail). [x, z] */
  route: [[0, -150], [0, -118], [0, -86], [0, -46], [0, 0], [0, 28], [7, 44], [4, 55], [2, 64], [-5, 72], [-10, 84], [GATE_X, 104],
    [GATE_X, 118], [-22, 128], [-30, 133], [-41, 145], [-45, 159], [-33, 171], [-17, 176.5], [-6, 180], [2, 192]],
  gates: {
    pass: { rect: [-14, 59.5, 20, 62.5], open: true, name: { zh: '山道柵', en: 'Pass Barricade' } },
    weiCamp: { rect: [GATE_X - 7, 99.5, GATE_X + 7, 102.5], open: true, name: { zh: '營寨門', en: 'Camp Gate' } },
    summit: { rect: [-21.5, 166, -18.5, 186], open: true, name: { zh: '山頂柵', en: 'Summit Barricade' } },
  },
  // story: at the head of the Shu ranks just inside the 蜀軍本陣 gate, facing the ford through it (tilt: camera pitch
  // offset, rad — levelled a little so the gate towers, standards and the valley fill the top of the first frame, not the
  // paving); free: the pass basin (the origin, where the free-mode army forms up around him)
  spawn: { story: { x: 0, z: -127, yaw: 0, tilt: -0.09 }, free: { x: 0, z: 0, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -9, n: 24, cols: 6 },     // free mode: a Shu block behind the hero
  hq: [4, 208], hqName: '本陣',                   // enemy HQ marker on the minimap (夏侯淵's pavilion)
  stage: 'pass',                                   // title / select officer stage: up this zone (ui/stage.js passPoint)
  /** Minimap overlay drawn once over the walk field (hud.js): castle wall, gate passage, the ford crossings. */
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(236,214,172,0.8)';
    g.fillRect(X(16.5), Y(WALL_Z + 9), (16.5 + 64) * PPM, 9 * PPM);
    g.fillRect(X(16.5), Y(150), 9 * PPM, 40 * PPM);
    g.clearRect(X(GATE_X + 3.6), Y(WALL_Z + 9), 7.2 * PPM, 9 * PPM);
    g.fillStyle = 'rgba(214,184,130,0.2)'; g.fillRect(X(GATE_X + 3.6), Y(WALL_Z + 9), 7.2 * PPM, 9 * PPM);
  },
  minimapAfter(g, X, Y) {
    g.fillStyle = 'rgba(236,214,172,0.5)';
    for (const [a, b] of FORDS) for (let x = a + 1; x < b; x += 2.5) g.fillRect(X(x) - 1, Y(riverZ(x)) - 1, 2, 2);
  },
};
