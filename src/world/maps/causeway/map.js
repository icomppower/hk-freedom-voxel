// 銅鑼灣 Causeway Bay (Ch. 6·16, 16 June 2019) — map definition for the map registry (src/world/map.js: format and API).
// Linear along +Z (open field → chokepoint → gate → high ground), ≈ 260 m from the park to the footbridge deck:
//   park       Victoria Park's pitches, the march's start     z -170 … -110  h 0     story start; 60 m wide
//   hennessy   Hennessy Road (chokepoint)                      z -112 …  -30  h 0     18 m kerb to kerb, two side streets
//                                                                                    (+X at z ≈ -90, −X at z ≈ -60), a stranded
//                                                                                    tram (z -84 … -71, east track), Canal Road
//                                                                                    flyover overhead at z ≈ -44
//   junction   the Wan Chai junction                           z  -32 …  -14  h 0     gate 'junctionLine' (the police
//                                                                                    line, z ≈ -22)
//   harcourt   Harcourt Road below the footbridges             z  -14 …   58  h 0     the ambulance lane
//   deck       up the stairs to the footbridge deck (high)     z   56 …   90  h 0 → 5  gate 'bridgeStairs' (z ≈ 58)
// Generic streets: no real shop, bank or brand names, logos, signage text or flags.
export default {
  id: 'causeway',
  name: { zh: '銅鑼灣', en: 'Causeway Bay' },
  zones: [
    { id: 'park', name: { zh: '維園', en: 'Victoria Park' }, x: 0, z: -140, w: 60, d: 60 },
    { id: 'hennessy', name: { zh: '軒尼詩道', en: 'Hennessy Road' }, x: 0, z: -71, w: 18, d: 82 },
    { id: 'junction', name: { zh: '灣仔', en: 'Wan Chai Junction' }, x: 0, z: -23, w: 32, d: 18 },
    { id: 'harcourt', name: { zh: '夏慤道', en: 'Harcourt Road' }, x: 0, z: 22, w: 28, d: 72 },
    { id: 'deck', name: { zh: '天橋', en: 'The Footbridge' }, x: 0, z: 80, w: 24, d: 20 },
  ],
  grid: [-100, -190, 100, 110],
  pieces: [
    { id: 'park', rect: [-30, -170, 30, -110], h: 0 },
    { id: 'hennessy', rect: [-9, -112, 9, -30], h: 0 },
    { id: 'sideE', rect: [9, -94, 22, -86], h: 0 },
    { id: 'sideW', rect: [-22, -64, -9, -56], h: 0 },
    { id: 'junction', rect: [-16, -32, 16, -14], h: 0 },
    { id: 'harcourt', rect: [-14, -16, 14, 58], h: 0 },
    { id: 'stairs', path: [[0, 56, 4, 0], [0, 66, 4, 2.5], [0, 72, 5, 5]] },
    { id: 'deck', rect: [-12, 70, 12, 90], h: 5 },
  ],
  // the park's two pavilions, the junction's traffic islands, the stranded tram on Hennessy Road's east track
  carve: [[-26, -160, -20, -154], [20, -160, 26, -154], [-14, -26, -11, -20], [11, -26, 14, -20], [0.75, -84, 3.05, -71]],
  propCarve: [[-26, -160, -20, -154], [20, -160, 26, -154], [-14, -26, -11, -20], [11, -26, 14, -20], [0.75, -84, 3.05, -71]],
  route: [[0, -165], [0, -140], [0, -112], [0, -90], [0, -60], [0, -36], [0, -22], [0, 0], [0, 30], [0, 56], [0, 72], [0, 82]],
  gates: {
    junctionLine: { rect: [-16, -24, 16, -20], open: true, name: { zh: '警方防線', en: 'Police Line' } },
    bridgeStairs: { rect: [-5, 56, 5, 60], open: true, name: { zh: '天橋樓梯', en: 'Footbridge Stairs' } },
  },
  spawn: { story: { x: 0, z: -146, yaw: 0, tilt: -0.06 }, free: { x: 0, z: -140, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -150, n: 24, cols: 6 },
  stage: 'park',
  hq: [0, 82], hqName: '橋',
  TRAM: [0.75, -84, 3.05, -71],                     // render: the stranded tram (carved above); the march column flows round it
  FLYOVER_Z: -44,                                    // render: Canal Road flyover overhead
  SIDE_STREETS: [[16, -90], [-16, -60]],            // story: where the riot squads cut in on the column
  COLUMN_START: -150, COLUMN_END: -38,             // story: the column's head sets off just behind the hero, stops at the junction line
  AMB: { z0: 62, z1: -4, blocks: [4, 14, 24, 34, 44] },   // story: the ambulance drives in from the Admiralty end (z0) to the
                                                          // casualty at the junction (z1); the marcher blocks on its lane
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(70,110,60,0.6)'; g.fillRect(X(-30), Y(-110), 60 * PPM, 60 * PPM);       // the park
    g.fillStyle = 'rgba(200,190,160,0.8)'; g.fillRect(X(-16), Y(-20), 32 * PPM, 2 * PPM);       // the police line
  },
};
