// 元朗 Yuen Long (Ch. III, 21 July 2019) — map definition for the map registry (src/world/map.js: format and API).
// Linear along +Z (open field → chokepoint → gate → high ground), ≈ 220 m from the street to the platform's far end:
//   street     night street outside the station     z -152 … -86  h 0     story start
//   concourse  the station concourse                 z  -88 … -36  h 0.2   pillars
//   faregates  the fare-gate line (chokepoint)       z  -38 … -10  h 0.2   gate 'fareGates' across it at z ≈ -26
//   platform   up the stairs to the platform         z  -12 …  72  h 0.2 → 3.2   gate 'platformStairs' at the stair foot
//                                                                         (z ≈ -8); the train pulls in along x ≈ +10
// Generic station: no operator logo, signage or text anywhere.
export default {
  id: 'yuenlong',
  name: { zh: '元朗站', en: 'Yuen Long Station' },
  zones: [
    { id: 'street', name: { zh: '街口', en: 'Street' }, x: 0, z: -119, w: 36, d: 66 },
    { id: 'concourse', name: { zh: '大堂', en: 'Concourse' }, x: 0, z: -62, w: 44, d: 52 },
    { id: 'faregates', name: { zh: '入閘機', en: 'Fare Gates' }, x: 0, z: -24, w: 30, d: 28 },
    { id: 'platform', name: { zh: '月台', en: 'Platform' }, x: 0, z: 30, w: 16, d: 84 },
  ],
  grid: [-80, -176, 80, 96],
  pieces: [
    { id: 'street', rect: [-18, -154, 18, -86], h: 0 },
    { id: 'concourse', rect: [-22, -88, 22, -36], h: 0.2 },
    { id: 'gatehall', rect: [-15, -38, 15, -10], h: 0.2 },
    { id: 'stairs', path: [[0, -12, 8, 0.2], [0, -4, 8, 1.6], [0, 4, 8, 3.2]], edge: 1 },
    { id: 'platform', rect: [-7, 2, 7, 74], h: 3.2 },
  ],
  carve: [[-12, -76, -10, -74], [10, -76, 12, -74], [-12, -52, -10, -50], [10, -52, 12, -50]],
  propCarve: [[-12, -76, -10, -74], [10, -76, 12, -74], [-12, -52, -10, -50], [10, -52, 12, -50]],
  route: [[0, -150], [0, -119], [0, -86], [0, -62], [0, -36], [0, -24], [0, -10], [0, 4], [0, 30], [0, 60]],
  gates: {
    fareGates: { rect: [-15, -28, 15, -24], open: true, name: { zh: '入閘機', en: 'Fare Gates' } },
    platformStairs: { rect: [-5, -10, 5, -6], open: true, name: { zh: '樓梯', en: 'Platform Stairs' } },
  },
  spawn: { story: { x: 0, z: -144, yaw: 0, tilt: -0.06 }, free: { x: 0, z: -119, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -130, n: 24, cols: 6 },
  stage: 'street',
  hq: [0, 40], hqName: '台',
  night: true,
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(200,200,190,0.6)'; for (let x = -13; x <= 13; x += 2.6) g.fillRect(X(x + 0.3), Y(-25), 0.6 * PPM, 2 * PPM);
    g.fillStyle = 'rgba(120,160,120,0.7)'; g.fillRect(X(12), Y(74), 3 * PPM, 70 * PPM);
  },
};
