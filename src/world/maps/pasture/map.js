// 羊村牧場 The Sheep Village Pasture (Ch. I) — map definition for the map registry (src/world/map.js: format and API).
// Linear along +Z (open field → chokepoint → gate → high ground), ≈ 250 m from the pasture to the shrine:
//   field   hill pasture            z -150 … -70   h ≈ 1     the shearing festival; story start
//   barns   lane between wool barns z  -72 … -8    h 0.5    14 m lane between two barn rows; gate 'barnLane' across its
//                                                            middle (the burning barn's beam when it falls: closed) — the
//                                                            detour runs west round the barns
//   gate    timber village gate     z  -14 … 34    h 0.5    the wall at z ≈ 0 with its gateway (gate 'villageGate'),
//                                                            the village square behind it
//   shrine  shrine hill             z   30 … 104   h 0.6→12 the climb, then the shrine plateau and the signal lantern
// Units / conventions as 定軍山 (map.js header). Heights are gentle: only the climb and the plateau rise.
const LANTERN = [10, 90];                                   // the signal lantern on the shrine plateau

export default {
  id: 'pasture',
  name: { zh: '羊村牧場', en: 'Sheep Village Pasture' },
  LANTERN,
  zones: [
    { id: 'field', name: { zh: '牧場', en: 'Pasture' }, x: 0, z: -110, w: 100, d: 80 },
    { id: 'barns', name: { zh: '穀倉巷', en: 'Barn Lane' }, x: -8, z: -41, w: 90, d: 62 },
    { id: 'gate', name: { zh: '村門', en: 'Village Gate' }, x: 0, z: 10, w: 60, d: 48 },
    { id: 'shrine', name: { zh: '山頂廟', en: 'Shrine Hill' }, x: 10, z: 82, r: 26 },
  ],
  grid: [-110, -172, 110, 132],
  pieces: [
    { id: 'field', rect: [-48, -152, 48, -70], h: (x, z) => 0.9 + 0.5 * Math.sin(x * 0.06) * Math.cos(z * 0.045), edge: 3 },
    { id: 'lane', rect: [-7, -72, 7, -8], h: 0.5 },
    { id: 'detour', path: [[-6, -70, 5, 0.6], [-30, -64, 5.5, 0.8], [-38, -42, 5.5, 1.0], [-32, -20, 5.5, 0.8], [-8, -11, 5, 0.5]], edge: 1 },
    { id: 'apron', rect: [-26, -14, 26, -2], h: 0.5 },
    { id: 'gateway', rect: [-4, -3, 4, 4], h: 0.5 },
    { id: 'square', rect: [-28, 2, 28, 34], h: 0.6 },
    { id: 'climb', path: [[0, 32, 7, 0.6], [8, 48, 6, 4], [14, 62, 6, 8], [10, 72, 7, 11.2], [10, 76, 8, 12]], edge: 1 },
    { id: 'shrine', ell: [10, 88, 21, 17], h: 12, edge: 1.5 },
  ],
  // the signal lantern's stone base and the shrine hall on the plateau: solid set pieces
  propCarve: [[LANTERN[0] - 1.2, LANTERN[1] - 1.2, LANTERN[0] + 1.2, LANTERN[1] + 1.2], [2, 96, 18, 104.5]],
  carve: [[LANTERN[0] - 1.2, LANTERN[1] - 1.2, LANTERN[0] + 1.2, LANTERN[1] + 1.2], [2, 96, 18, 104.5]],
  route: [[0, -148], [0, -110], [0, -72], [0, -40], [0, -8], [0, 2], [0, 30], [8, 48], [14, 62], [10, 72], [10, 86]],
  gates: {
    barnLane: { rect: [-9, -42, 9, -38], open: true, name: { zh: '穀倉巷', en: 'Barn Lane' } },
    villageGate: { rect: [-6, -1.5, 6, 2.5], open: true, name: { zh: '村門', en: 'Village Gate' } },
  },
  spawn: { story: { x: 0, z: -140, yaw: 0, tilt: -0.06 }, free: { x: 0, z: -110, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -122, n: 24, cols: 6 },
  stage: 'field',
  hq: LANTERN, hqName: '燈',
  /** Minimap: the barn rows, the village wall with its gateway, the shrine hall. */
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(160,110,70,0.75)';
    for (const x0 of [-26, 10]) for (const z0 of [-68, -48, -28]) g.fillRect(X(x0 + 16), Y(z0 + 16), 16 * PPM, 14 * PPM);
    g.fillStyle = 'rgba(236,214,172,0.8)';
    g.fillRect(X(30), Y(2.5), 25 * PPM, 4 * PPM); g.fillRect(X(-5), Y(2.5), 25 * PPM, 4 * PPM);
    g.fillStyle = 'rgba(200,70,50,0.8)'; g.fillRect(X(18), Y(104.5), 16 * PPM, 8.5 * PPM);
  },
};
