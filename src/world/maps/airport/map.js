// 機場 The Airport (Ch. 8·12, 12 August 2019) — map definition for the map registry (src/world/map.js: format and API).
// Linear along +Z (open field → chokepoint → gate → high ground), ≈ 250 m from the arrival hall to the deck's glass:
//   arrivals    the arrival hall, the sit-in          z -154 … -86  h 0     story start; 56 m wide
//   carousels   the baggage hall (chokepoint)          z  -88 … -36  h 0.1   two carousels (solid) leave three lanes
//   security    the screening line                     z  -38 … -26  h 0.1   gate 'securityLine' across it at z ≈ -32
//   departures  the departure gates                    z  -28 …  34  h 0.2   gate seating; a glass wall on +X, the apron
//                                                                           beyond it (planes taxi past, render-only)
//   deck        up the escalator to the observation    z   30 …  96  h 0.2 → 5   gate 'deckEscalator' at the escalator
//               deck (high ground)                                           foot (z ≈ 36)
// Generic terminal: no operator, airline or airport logo, livery, signage or flag anywhere.
export default {
  id: 'airport',
  name: { zh: '機場', en: 'The Airport' },
  zones: [
    { id: 'arrivals', name: { zh: '接機大堂', en: 'Arrival Hall' }, x: 0, z: -120, w: 56, d: 68 },
    { id: 'carousels', name: { zh: '行李帶', en: 'Baggage Hall' }, x: 0, z: -62, w: 40, d: 52 },
    { id: 'departures', name: { zh: '離境閘口', en: 'Departure Gates' }, x: 0, z: 3, w: 44, d: 62 },
    { id: 'deck', name: { zh: '觀景台', en: 'Observation Deck' }, x: 0, z: 72, w: 48, d: 48 },
  ],
  grid: [-96, -176, 96, 120],
  pieces: [
    { id: 'arrivals', rect: [-28, -154, 28, -86], h: 0 },
    { id: 'carousels', rect: [-20, -88, 20, -36], h: 0.1 },
    { id: 'security', rect: [-14, -38, 14, -26], h: 0.1 },
    { id: 'departures', rect: [-22, -28, 22, 34], h: 0.2 },
    { id: 'escalator', path: [[0, 32, 4, 0.2], [0, 40, 4, 2.6], [0, 48, 4, 5]] },
    { id: 'deck', rect: [-24, 46, 24, 96], h: 5 },
  ],
  // the two carousels (solid islands: lanes either side and between) and the gate-seat blocks
  carve: [[-14, -78, -6, -54], [6, -78, 14, -54], [-18, -8, -10, -6], [10, -8, 18, -6], [-18, 10, -10, 12], [10, 10, 18, 12]],
  propCarve: [[-14, -78, -6, -54], [6, -78, 14, -54], [-18, -8, -10, -6], [10, -8, 18, -6], [-18, 10, -10, 12], [10, 10, 18, 12]],
  route: [[0, -150], [0, -120], [0, -88], [0, -62], [0, -36], [0, -20], [0, 3], [0, 30], [0, 48], [0, 72], [0, 88]],
  gates: {
    securityLine: { rect: [-15, -34, 15, -30], open: true, name: { zh: '安檢', en: 'Security Line' } },
    deckEscalator: { rect: [-6, 34, 6, 38], open: true, name: { zh: '扶手電梯', en: 'Deck Escalator' } },
  },
  spawn: { story: { x: 0, z: -144, yaw: 0, tilt: -0.06 }, free: { x: 0, z: -120, yaw: 0, tilt: 0 } },
  freeAllies: { x: 0, z: -132, n: 24, cols: 6 },
  stage: 'arrivals',
  hq: [0, 76], hqName: '台',
  APRON_X: 60,                                      // render: the taxiway beyond the departure glass (x = +22)
  SAFE: [0, 26],                                    // story: where the stranded travellers are brought (the escalator foot)
  minimap(g, X, Y, PPM) {
    g.fillStyle = 'rgba(180,180,170,0.7)'; g.fillRect(X(-6), Y(-54), 8 * PPM, 24 * PPM); g.fillRect(X(14), Y(-54), 8 * PPM, 24 * PPM);
    g.fillStyle = 'rgba(160,200,220,0.7)'; g.fillRect(X(22), Y(34), 1.5 * PPM, 62 * PPM);
    g.fillStyle = 'rgba(200,200,190,0.6)'; for (let x = -12; x <= 12; x += 3) g.fillRect(X(x), Y(-31), 0.8 * PPM, 2 * PPM);
  },
};
