// 中大二號橋 Bridge No. 2 (Ch. 11·12, 12 November 2019) — map definition for the map registry (src/world/map.js: format
// and API). Linear along +Z (open field → chokepoint → gate → high ground), ≈ 240 m from the campus road to the hilltop:
//   campus      the campus road and sports ground        z -170 … -104  h 0     story start; 52 m wide
//   bridge      Bridge No. 2 (chokepoint)                 z -104 …  -28  h 0.6   10 m wide, over the highway and the
//                                                                               railway (render-only, 8 m below); gate
//                                                                               'campusLine' at its campus end (z ≈ -103)
//   bridgehead  the barricade line at the far end         z  -30 …  -14  h 0.6   the barricade the story rebuilds;
//                                                                               gate 'hillSteps' at its far side (z ≈ -15)
//   hill        steps up to the hill above the highway    z  -14 …   70  h 0.6 → 6  the boss and the dawn view
// Generic campus: no university crest, name, logo, signage text or flag anywhere.
export default {
  id: 'cuhk',
  name: { zh: '中大二號橋', en: 'Bridge No. 2' },
  zones: [
    { id: 'campus', name: { zh: '大學道', en: 'Campus Road' }, x: 0, z: -137, w: 52, d: 66 },
    { id: 'bridge', name: { zh: '二號橋', en: 'Bridge No. 2' }, x: 0, z: -66, w: 10, d: 76 },
    { id: 'bridgehead', name: { zh: '路障', en: 'The Barricade' }, x: 0, z: -22, w: 24, d: 16 },
    { id: 'hill', name: { zh: '山上', en: 'The Hill' }, x: 0, z: 44, w: 44, d: 52 },
  ],
  grid: [-100, -190, 100, 90],
  pieces: [
    { id: 'campus', rect: [-26, -170, 26, -104], h: 0 },
    { id: 'bridge', rect: [-5, -106, 5, -28], h: 0.6 },
    { id: 'bridgehead', rect: [-12, -30, 12, -14], h: 0.6 },
    { id: 'steps', path: [[0, -16, 6, 0.6], [0, 2, 6, 3.4], [0, 20, 7, 6]] },
    { id: 'hill', rect: [-22, 18, 22, 70], h: 6 },
  ],
  // campus planters and the two sports-ground benches (solid), the hilltop's low wall stubs
  carve: [[-22, -150, -16, -146], [16, -150, 22, -146], [-22, -124, -16, -120], [16, -124, 22, -120]],
  propCarve: [[-22, -150, -16, -146], [16, -150, 22, -146], [-22, -124, -16, -120], [16, -124, 22, -120]],
  route: [[0, -165], [0, -137], [0, -110], [0, -90], [0, -66], [0, -40], [0, -22], [0, -6], [0, 20], [0, 44], [0, 64]],
  gates: {
    campusLine: { rect: [-6, -105, 6, -101], open: true, name: { zh: '橋頭', en: 'Bridge Entrance' } },
    hillSteps: { rect: [-7, -17, 7, -13], open: true, name: { zh: '石級', en: 'Hill Steps' } },
  },
  spawn: { story: { x: 0, z: -162, yaw: 0, tilt: -0.06 }, free: { x: 0, z: -140, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -150, n: 24, cols: 6 },
  stage: 'campus',
  hq: [0, 56], hqName: '山',
  BARRICADE: [-10, -30, 10, -20],                    // story: stand inside this rect to restack the barricade
  HIGHWAY_Y: -8,                                     // render: the highway and railway under the bridge
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(90,90,96,0.7)'; g.fillRect(X(-90), Y(-56), 180 * PPM, 22 * PPM);           // the highway below
    g.fillStyle = 'rgba(200,190,160,0.8)'; g.fillRect(X(-10), Y(-20), 20 * PPM, 2 * PPM);          // the barricade line
  },
};
