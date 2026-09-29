// 霧港 The Fog Harbor (Ch. III) — map definition for the map registry (src/world/map.js: format and API).
// Linear along +Z over the water, ≈ 240 m from the beach to the lighthouse:
//   beach     fishing beach        z -135 … -70   h 0.4    net racks; story start
//   causeway  stone causeway       z  -72 … -12   h 0.8→1.2 6 m wide over the water; 鐵吻 holds its middle; gate 'boom'
//                                                           across its end onto the quay (open when he falls)
//   boom      the boom quay        z  -14 … 40    h 1.2    the chain winch (drop the boom: hold it 20 s); gate 'lighthouse'
//                                                           across the jetty at the quay's far end (open when the chain drops)
//   rock      lighthouse rock      z   38 … 108   h 1.2→10 the jetty climbs to the rock top; the lighthouse on its north side
// Outside the walk field the ground falls under the sea (the world builder's rise is negative).
const WINCH = [15, 22], LIGHT = [6, 101];

export default {
  id: 'harbor',
  name: { zh: '霧港', en: 'The Fog Harbor' },
  WINCH, LIGHT,
  zones: [
    { id: 'beach', name: { zh: '沙灘', en: 'Fishing Beach' }, x: 0, z: -102, w: 96, d: 66 },
    { id: 'causeway', name: { zh: '石堤', en: 'Stone Causeway' }, x: 0, z: -41, w: 30, d: 60 },
    { id: 'boom', name: { zh: '鐵鎖碼頭', en: 'Boom Quay' }, x: 0, z: 13, w: 50, d: 48 },
    { id: 'rock', name: { zh: '燈塔石', en: 'Lighthouse Rock' }, x: 6, z: 84, r: 26 },
  ],
  grid: [-104, -150, 104, 124],
  pieces: [
    { id: 'beach', rect: [-45, -135, 45, -70], h: 0.4, edge: 3 },
    { id: 'causeway', path: [[0, -72, 3.2, 0.5], [1, -40, 3.0, 0.9], [0, -12, 3.2, 1.2]] },
    { id: 'quay', rect: [-22, -13, 22, 40], h: 1.2 },
    { id: 'jetty', path: [[6, 39, 3.6, 1.2], [8, 52, 3.6, 3.5], [8, 62, 4, 7.5], [6, 70, 5, 10]] },
    { id: 'rock', ell: [6, 86, 20, 17], h: 10, edge: 1.5 },
  ],
  // the winch house on the quay, the lighthouse tower on the rock
  propCarve: [[WINCH[0] + 1, WINCH[1] - 2, WINCH[0] + 5, WINCH[1] + 2], [LIGHT[0] - 4, LIGHT[1] - 4, LIGHT[0] + 4, LIGHT[1] + 4]],
  carve: [[WINCH[0] + 1, WINCH[1] - 2, WINCH[0] + 5, WINCH[1] + 2], [LIGHT[0] - 4, LIGHT[1] - 4, LIGHT[0] + 4, LIGHT[1] + 4]],
  openWater: () => true,                                             // arrows fly over the harbor
  route: [[0, -128], [0, -72], [1, -40], [0, -12], [0, 10], [4, 30], [6, 40], [8, 52], [8, 62], [6, 72], [6, 86]],
  gates: {
    boom: { rect: [-5, -15, 5, -11.5], open: true, name: { zh: '石堤閘', en: 'Causeway Gate' } },
    lighthouse: { rect: [1, 42, 15, 45], open: true, name: { zh: '燈塔閘', en: 'Lighthouse Gate' } },
  },
  spawn: { story: { x: 0, z: -124, yaw: 0, tilt: -0.05 }, free: { x: 0, z: -100, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -114, n: 20, cols: 5 },
  stage: 'beach',
  hq: LIGHT, hqName: '塔',
  wet: (x, z) => true,                                               // minimap: everything off the walk field is sea
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(236,214,172,0.85)'; g.fillRect(X(WINCH[0] + 5), Y(WINCH[1] + 2), 4 * PPM, 4 * PPM);
    g.fillStyle = 'rgba(250,240,200,0.95)'; g.fillRect(X(LIGHT[0] + 4), Y(LIGHT[1] + 4), 8 * PPM, 8 * PPM);
  },
};
