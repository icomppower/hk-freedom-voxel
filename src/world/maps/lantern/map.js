// 燈籠街 Lantern Street by Night (Ch. II) — map definition for the map registry (src/world/map.js: format and API).
// Linear along +Z, ≈ 230 m from the market to the lookout, climbing the hillside above the harbor:
//   market      market square           z -120 … -64   h 0      the twelve gather; story start
//   stairs      three stair-alleys      z  -66 …  12   h 0→10   west / middle / east alleys (5-6 m wide) between house
//                                                               blocks, joined by a cross-lane halfway, meeting in the
//                                                               upper street
//   checkpoint  garrison checkpoint     z   10 …  54   h 10     a walled street; the gate (gate 'checkpoint', its winch
//                                                               on the east wall) at z ≈ 40, the alarm drum by the west wall
//   lookout     hillside lookout        z   54 … 104   h 10→14  the path out onto the platform over the fog harbor
const WINCH = [9.5, 36], DRUM = [-10, 30];

export default {
  id: 'lantern',
  name: { zh: '燈籠街', en: 'Lantern Street' },
  WINCH, DRUM,
  zones: [
    { id: 'market', name: { zh: '街市', en: 'Market Square' }, x: 0, z: -92, w: 70, d: 56 },
    { id: 'stairs', name: { zh: '樓梯巷', en: 'Stair Alleys' }, x: 0, z: -27, w: 64, d: 78 },
    { id: 'checkpoint', name: { zh: '關卡', en: 'Checkpoint' }, x: 0, z: 32, w: 40, d: 44 },
    { id: 'lookout', name: { zh: '觀景台', en: 'Lookout' }, x: 6, z: 82, r: 24 },
  ],
  grid: [-104, -142, 104, 124],
  pieces: [
    { id: 'market', rect: [-33, -120, 33, -64], h: 0, edge: 1 },
    // three stair-alleys: straight flights up the hillside (heights interpolate: the steps are the render's)
    { id: 'west', path: [[-20, -66, 3, 0], [-20, -40, 3, 4], [-17, -18, 3, 7.5], [-12, 4, 3.2, 10]] },
    { id: 'middle', path: [[0, -66, 3, 0], [2, -44, 3, 3.6], [-1, -20, 2.8, 7.2], [0, 4, 3.2, 10]] },
    { id: 'east', path: [[20, -66, 3, 0], [22, -42, 3, 3.8], [18, -16, 3, 7.8], [12, 4, 3.2, 10]] },
    { id: 'cross', path: [[-20, -38, 2.6, 4.2], [2, -40, 2.6, 4.0], [22, -40, 2.6, 4.0]] },   // the cross-lane halfway up
    { id: 'upper', rect: [-18, 2, 18, 12], h: 10 },
    { id: 'checkpoint', rect: [-12, 10, 12, 54], h: 10 },
    { id: 'path', path: [[0, 52, 6, 10], [4, 62, 5, 11.5], [6, 70, 6, 13.2], [6, 74, 7, 14]], edge: 1 },
    { id: 'lookout', ell: [6, 86, 18, 15], h: 14, edge: 1 },
  ],
  // the alarm drum's stand and the winch housing: solid set pieces
  propCarve: [[DRUM[0] - 1.4, DRUM[1] - 1.4, DRUM[0] + 1.4, DRUM[1] + 1.4], [WINCH[0] + 0.6, WINCH[1] - 1.2, WINCH[0] + 2.6, WINCH[1] + 1.2]],
  carve: [[DRUM[0] - 1.4, DRUM[1] - 1.4, DRUM[0] + 1.4, DRUM[1] + 1.4], [WINCH[0] + 0.6, WINCH[1] - 1.2, WINCH[0] + 2.6, WINCH[1] + 1.2]],
  route: [[0, -116], [0, -92], [0, -66], [2, -44], [-1, -20], [0, 4], [0, 12], [0, 32], [0, 52], [4, 62], [6, 74], [6, 86]],
  gates: {
    checkpoint: { rect: [-13, 38.5, 13, 41.5], open: true, name: { zh: '關卡閘門', en: 'Checkpoint Gate' } },
  },
  spawn: { story: { x: 0, z: -110, yaw: 0, tilt: -0.05 }, free: { x: 0, z: -92, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -104, n: 24, cols: 6 },
  stage: 'market',
  hq: [6, 92], hqName: '台',
  minimap(g, X, Y, PPM) {                                           // the house blocks between the alleys, the checkpoint wall
    g.fillStyle = 'rgba(120,100,80,0.7)';
    for (const [x0, x1] of [[-15, -5], [5, 15]]) for (const [z0, z1] of [[-64, -44], [-36, -2]]) g.fillRect(X(x1), Y(z1), (x1 - x0) * PPM, (z1 - z0) * PPM);
    g.fillStyle = 'rgba(236,214,172,0.8)'; g.fillRect(X(16), Y(54), 4 * PPM, 44 * PPM); g.fillRect(X(-12), Y(54), 4 * PPM, 44 * PPM);
  },
};
