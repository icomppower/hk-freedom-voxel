// 金鐘 Admiralty (Ch. I, June 2019) — map definition for the map registry (src/world/map.js: format and API).
// Linear along +Z (open field → chokepoint → gate → high ground), ≈ 250 m from the highway to the lawn:
//   harcourt    夏慤道 six-lane highway, night, rain   z -152 … -72  h 0      36 m of carriageway + the central divider;
//                                                                            story start (the umbrella line)
//   footbridge  under the footbridge                  z  -74 … -20  h 0      the carriageway narrows to 20 m between
//                                                                            concrete barriers, bridge pillars in it; the
//                                                                            police line (gate 'policeLine') at z ≈ -48
//   hqgate      government HQ forecourt               z  -22 …  22  h 0.3    the HQ gate (gate 'hqGate') across it at z ≈ 6
//   lawn        添馬 lawn slope                        z   20 … 104  h 0.4→4  the slope up to the lawn (high ground)
// Units / conventions as 定軍山 (map.js header). Real place names; the buildings are generic blocks (no signage, no
// emblems).
export default {
  id: 'admiralty',
  name: { zh: '金鐘', en: 'Admiralty' },
  zones: [
    { id: 'harcourt', name: { zh: '夏慤道', en: 'Harcourt Road' }, x: 0, z: -112, w: 44, d: 80 },
    { id: 'footbridge', name: { zh: '天橋底', en: 'Under the Footbridge' }, x: 0, z: -47, w: 26, d: 54 },
    { id: 'hqgate', name: { zh: '政府總部', en: 'Government HQ Gate' }, x: 0, z: 0, w: 44, d: 44 },
    { id: 'lawn', name: { zh: '添馬公園', en: 'Tamar Lawn' }, x: 0, z: 64, r: 34 },
  ],
  grid: [-100, -176, 100, 128],
  pieces: [
    { id: 'road', rect: [-20, -154, 20, -70], h: 0 },
    { id: 'underpass', rect: [-10, -74, 10, -20], h: 0 },
    { id: 'forecourt', rect: [-22, -22, 22, 24], h: 0.3 },
    { id: 'slope', path: [[0, 22, 16, 0.3], [0, 40, 22, 2], [0, 52, 26, 3.6]], edge: 1 },
    { id: 'lawn', ell: [0, 72, 32, 30], h: 4, edge: 1.5 },
  ],
  // bridge pillars under the footbridge + the HQ gatehouse piers: solid set pieces (walk field cut out)
  carve: [[-7.2, -58.8, -4.8, -57.2], [4.8, -58.8, 7.2, -57.2], [-7.2, -36.8, -4.8, -35.2], [4.8, -36.8, 7.2, -35.2],
    [-22, 4.5, -5, 7.5], [5, 4.5, 22, 7.5]],
  propCarve: [[-7.2, -58.8, -4.8, -57.2], [4.8, -58.8, 7.2, -57.2], [-7.2, -36.8, -4.8, -35.2], [4.8, -36.8, 7.2, -35.2],
    [-22, 4.5, -5, 7.5], [5, 4.5, 22, 7.5]],
  route: [[0, -150], [0, -112], [0, -74], [0, -48], [0, -20], [0, 0], [0, 22], [0, 40], [0, 60], [0, 76]],
  gates: {
    policeLine: { rect: [-10, -50, 10, -46], open: true, name: { zh: '警察防線', en: 'Police Line' } },
    hqGate: { rect: [-5, 4.5, 5, 7.5], open: true, name: { zh: '政總閘口', en: 'HQ Gate' } },
  },
  spawn: { story: { x: 0, z: -142, yaw: 0, tilt: -0.06 }, free: { x: 0, z: -112, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -126, n: 24, cols: 6 },
  stage: 'harcourt',
  hq: [0, 72], hqName: '添',
  night: true,
  /** Minimap: the carriageway lanes, the footbridge deck, the HQ gatehouse, the lawn. */
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(200,200,190,0.35)';
    for (const x of [-12, 0, 12]) g.fillRect(X(x + 0.3), Y(-72), 0.6 * PPM, 80 * PPM);
    g.fillStyle = 'rgba(170,170,160,0.7)'; g.fillRect(X(24), Y(-44), 48 * PPM, 8 * PPM);
    g.fillStyle = 'rgba(210,190,120,0.8)'; g.fillRect(X(22), Y(7.5), 17 * PPM, 3 * PPM); g.fillRect(X(-5), Y(7.5), 17 * PPM, 3 * PPM);
  },
};
