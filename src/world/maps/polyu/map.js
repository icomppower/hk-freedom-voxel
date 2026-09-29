// 理工大學 PolyU Siege (Ch. IV, November 2019) — map definition for the map registry (src/world/map.js: format and API).
// Linear along +Z (open field → chokepoint → gate → high ground), ≈ 250 m from the podium to the rooftop:
//   podium    the campus podium                       z -152 … -86  h 1     story start: every exit sealed
//   bridge    the footbridge (chokepoint), over a road  z  -88 … -34  h 1.5  12 m deck; the burning barricade (gate
//                                                                          'barricade') across its far end, z ≈ -40
//   maingate  inside the main gate                    z  -36 …  24  h 0.5   gate 'mainGate' at z ≈ -2; the rope point on
//                                                                          the east railing (ROPES), the road below
//   rooftop   up the ramp to the rooftop               z   22 … 100  h 0.5 → 7  the Bear's arena
// Real place; generic campus architecture (red-brick blocks), no signage, emblem or text.
const ROPES = [20, 12];

export default {
  id: 'polyu',
  name: { zh: '理工大學', en: 'PolyU' },
  ROPES,
  zones: [
    { id: 'podium', name: { zh: '平台', en: 'Podium' }, x: 0, z: -119, w: 50, d: 66 },
    { id: 'bridge', name: { zh: '天橋', en: 'Footbridge' }, x: 0, z: -61, w: 14, d: 54 },
    { id: 'maingate', name: { zh: '正門', en: 'Main Gate' }, x: 0, z: -6, w: 44, d: 60 },
    { id: 'rooftop', name: { zh: '天台', en: 'Rooftop' }, x: 0, z: 70, r: 28 },
  ],
  grid: [-90, -176, 90, 124],
  pieces: [
    { id: 'podium', rect: [-25, -154, 25, -86], h: 1 },
    { id: 'bridge', rect: [-6, -88, 6, -34], h: 1.5 },
    { id: 'gateyard', rect: [-22, -36, 22, 24], h: 0.5 },
    { id: 'ramp', path: [[0, 22, 10, 0.5], [0, 34, 10, 4], [0, 44, 12, 7]], edge: 1 },
    { id: 'roof', rect: [-24, 42, 24, 100], h: 7 },
  ],
  carve: [[-22, -4, -6, 0], [6, -4, 22, 0]],
  propCarve: [[-22, -4, -6, 0], [6, -4, 22, 0]],
  route: [[0, -150], [0, -119], [0, -86], [0, -60], [0, -36], [0, -2], [0, 12], [0, 30], [0, 44], [0, 70]],
  gates: {
    barricade: { rect: [-6, -42, 6, -38], open: true, name: { zh: '路障', en: 'Barricade' } },
    mainGate: { rect: [-6, -4, 6, 0], open: true, name: { zh: '正門', en: 'Main Gate' } },
  },
  spawn: { story: { x: 0, z: -144, yaw: 0, tilt: -0.06 }, free: { x: 0, z: -119, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -130, n: 24, cols: 6 },
  stage: 'podium',
  hq: [0, 70], hqName: '台',
  night: true,
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(170,90,70,0.7)'; g.fillRect(X(-8), Y(-86), 24 * PPM, 4 * PPM);
    g.fillStyle = 'rgba(240,160,60,0.8)'; g.fillRect(X(6), Y(-38), 12 * PPM, 4 * PPM);
    g.fillStyle = 'rgba(255,215,0,0.9)'; g.fillRect(X(ROPES[0] + 1), Y(ROPES[1] + 1), 2 * PPM, 2 * PPM);
  },
};
