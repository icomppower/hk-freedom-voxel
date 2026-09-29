// 立法會 LegCo (Ch. II, 1 July 2019) — map definition for the map registry (src/world/map.js: format and API).
// Linear along +Z (open field → chokepoint → gate → high ground), ≈ 220 m from the plaza to the dais:
//   plaza     protest plaza under searchlights      z -152 … -82  h 0     story start; the searchlights sweep it
//   glass     the glass curtain wall (chokepoint)   z  -86 … -66  h 0     gate 'glassWall' across it at z ≈ -78 (the wall
//                                                                         itself: breaks when the story opens it)
//   lobby     the lobby, mezzanine along both sides z  -76 … -20  h 0.2   gate 'chamberDoor' at its far end, z ≈ -20
//   chamber   the chamber; the dais is high ground   z  -18 …  64  h 0.2 → 2.4 (dais)
// Generic civic building: no emblem, crest, flag or text on any wall.
export default {
  id: 'legco',
  name: { zh: '立法會', en: 'Legislative Council' },
  zones: [
    { id: 'plaza', name: { zh: '示威區', en: 'Protest Plaza' }, x: 0, z: -117, w: 60, d: 70 },
    { id: 'glass', name: { zh: '玻璃幕牆', en: 'Glass Curtain Wall' }, x: 0, z: -76, w: 50, d: 20 },
    { id: 'lobby', name: { zh: '大堂', en: 'Lobby' }, x: 0, z: -46, w: 40, d: 52 },
    { id: 'chamber', name: { zh: '議事廳', en: 'Chamber' }, x: 0, z: 26, r: 34 },
  ],
  grid: [-90, -176, 90, 90],
  pieces: [
    { id: 'plaza', rect: [-30, -154, 30, -80], h: 0 },
    { id: 'breach', rect: [-24, -82, 24, -74], h: 0 },
    { id: 'lobby', rect: [-19, -76, 19, -20], h: 0.2 },
    { id: 'door', rect: [-4, -22, 4, -16], h: 0.2 },
    { id: 'floor', ell: [0, 20, 30, 34], h: 0.2, edge: 1 },
    { id: 'dais', path: [[0, 30, 14, 0.2], [0, 42, 16, 1.6], [0, 50, 18, 2.4]], edge: 1 },
  ],
  // lobby columns and the chamber's front desk block: solid set pieces
  carve: [[-12, -62, -10, -60], [10, -62, 12, -60], [-12, -40, -10, -38], [10, -40, 12, -38]],
  propCarve: [[-12, -62, -10, -60], [10, -62, 12, -60], [-12, -40, -10, -38], [10, -40, 12, -38]],
  route: [[0, -150], [0, -117], [0, -80], [0, -50], [0, -20], [0, 0], [0, 26], [0, 46]],
  gates: {
    glassWall: { rect: [-24, -80, 24, -76], open: true, name: { zh: '玻璃幕牆', en: 'Glass Wall' } },
    chamberDoor: { rect: [-4, -21, 4, -17], open: true, name: { zh: '議事廳門', en: 'Chamber Door' } },
  },
  spawn: { story: { x: 0, z: -144, yaw: 0, tilt: -0.06 }, free: { x: 0, z: -117, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -130, n: 24, cols: 6 },
  stage: 'plaza',
  hq: [0, 46], hqName: '廳',
  night: true,
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(160,200,220,0.7)'; g.fillRect(X(24), Y(-76), 48 * PPM, 2 * PPM);
    g.fillStyle = 'rgba(180,180,170,0.5)'; g.fillRect(X(20), Y(-20), 1.5 * PPM, 56 * PPM); g.fillRect(X(-18.5), Y(-20), 1.5 * PPM, 56 * PPM);
  },
};
