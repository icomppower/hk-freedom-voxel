// 機場 The Airport's world builder (render-only; registered in the world registry, src/world/world.js). 12 August 2019,
// afternoon: the arrival hall (the arrival exit doors, the sit-in — seated figures in black with white leaflets), the
// baggage hall (two carousels with cases riding round), the security line (gate 'securityLine': belt stanchions that sink
// into the floor), the departure gates (seat blocks, a 12 m glass wall on +X with the apron beyond: generic white airliners
// taxi past, one parks at a jet bridge, one climbs out over the deck), the escalator (gate 'deckEscalator': a shutter that
// lifts) and the observation deck behind a glass parapet. High roof ribs (camera clearance). Three departure boards (one
// canvas) show the live objective on their top row and the flights below; the rows flip one by one when either changes,
// and every flight reads 取消 CANCELLED once story fx.cancelled. The travellers (fx.travellers, rolling cases) and the
// stranded travellers (fx.stranded) the story escorts; the boss's attack rings (fx.rings). Generic terminal and aircraft:
// no airline, airport or operator logo, livery, flag or code anywhere (the board lists cities only).
// #debug: root.userData.debug (bench/maps/airport-look.mjs reads it): board rows as drawn, planes, figures shown.
// Never writes sim state.
import * as THREE from 'three';
import { GATES, ground, TERRAIN as G, PIECE_IDS, node, MAPS } from '../../map.js';
import { buildGround } from '../hkkit/terrain.js';
import { place, merge, propMaterial, bx, crowdBarrier } from '../hkkit/props.js';
import { hash01 } from '../../../core/rng.js';
import { shade } from '../../../core/voxel.js';
import { on, collect } from '../../../core/events.js';

const SHADOW_BOX = 30, SUN = new THREE.Vector3(0.5, 0.75, -0.35).normalize();
const SKY = new THREE.Color(0xa8c4dc), FOG = new THREE.Color(0xc4d2de);
const APRON_X = MAPS.airport.APRON_X;
/** A seated sit-in figure (+Z forward): black clothes, cross-legged, a white leaflet in hand (k varies the head). */
const sitter = (k) => [bx([0.6, 0.22, 0.5], [0, 0.11, 0.1], 0x1a1a1c), bx([0.46, 0.6, 0.28], [0, 0.52, 0], 0x161618),
  bx([0.26, 0.26, 0.26], [0, 0.97, 0], [0xe0b28a, 0xd6a67e, 0xc8966e][k % 3]), bx([0.28, 0.1, 0.28], [0, 1.12, -0.02], 0x141210),
  bx([0.24, 0.1, 0.06], [0, 0.92, 0.12], 0x1c1c1c), bx([0.22, 0.01, 0.3], [0.12, 0.62, 0.3], 0xf4f2ea, [0.5, 0, 0])];
/** A traveller (+Z forward) with a rolling case at the right hand. */
const traveller = (k) => { const c = [0x5a6a80, 0x8a6a4a, 0x6a7a5a, 0x9a8a7a, 0x4a4a5a][k % 5], cs = [0x2a5a8a, 0xb03a2a, 0x3a3a3a, 0xc8a040, 0x6a6a72][k % 5];
  return [bx([0.42, 0.8, 0.26], [0, 0.4, 0], 0x34363c), bx([0.48, 0.66, 0.3], [0, 1.15, 0], c), bx([0.26, 0.26, 0.26], [0, 1.62, 0], [0xe0b28a, 0xd6a67e, 0xf0c8a0][k % 3]),
    bx([0.28, 0.12, 0.28], [0, 1.8, -0.02], [0x1c1814, 0x6a4a2a, 0x8a8a8a][k % 3]), bx([0.4, 0.55, 0.24], [0.45, 0.32, -0.3], cs), bx([0.04, 0.5, 0.04], [0.45, 0.8, -0.2], 0x2a2a2a)]; };
/** Generic airliner along +Z (nose at +Z): white fuselage, grey wings + tail, dark windows, engines. No livery. */
function airliner() {
  const W = 0xeef0f2, GR = 0xb8bec6, out = [bx([4, 4.2, 40], [0, 4, 0], W), bx([3.4, 3.4, 4], [0, 4, 21.5], W), bx([2.2, 1.4, 2], [0, 4.6, 23.6], 0x2a3440),
    bx([2.6, 3, 5], [0, 4.6, -22], W), bx([0.5, 7, 6], [0, 9.5, -21], GR), bx([14, 0.4, 4], [0, 5.4, -21], GR),
    bx([34, 0.6, 7], [0, 3, -1], GR), ...[-1, 1].map((s) => bx([2.2, 2.2, 4.4], [s * 7, 1.9, 1.5], 0xd8dce0)),
    ...[-1, 1].map((s) => bx([0.5, 1.6, 0.5], [s * 2, 1.2, -2], 0x3a3a3a)), bx([0.4, 1.8, 0.4], [0, 1.2, 15], 0x3a3a3a)];
  for (let z = -16; z < 18; z += 1.8) for (const s of [-1, 1]) out.push(bx([0.06, 0.6, 0.8], [s * 2.02, 5, z], 0x2a3440));
  return out;
}
const CITIES = [['東京', 'TOKYO', '14:35'], ['台北', 'TAIPEI', '14:50'], ['新加坡', 'SINGAPORE', '15:10'], ['倫敦', 'LONDON', '15:25'], ['溫哥華', 'VANCOUVER', '15:40'], ['首爾', 'SEOUL', '16:05']];
const STAT = [['準時', 'ON TIME'], ['登機', 'BOARDING'], ['延誤', 'DELAYED'], ['準時', 'ON TIME'], ['延誤', 'DELAYED'], ['準時', 'ON TIME']];

export function buildAirport(scene, root) {
  scene.background = SKY.clone();
  scene.fog = new THREE.Fog(FOG.clone(), 50, 320);
  const skyGeo = new THREE.SphereGeometry(900, 24, 12), sc = [], sp = skyGeo.attributes.position, c3 = new THREE.Color();
  for (let i = 0; i < sp.count; i++) { const h = Math.max(0, sp.getY(i) / 900); c3.setRGB(0.66 - 0.28 * h, 0.76 - 0.2 * h, 0.86 - 0.08 * h); sc.push(c3.r, c3.g, c3.b); }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  root.add(Object.assign(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })), { renderOrder: -1, frustumCulled: false }));
  root.add(new THREE.HemisphereLight(0xc8d8ec, 0x6a645a, 1.5));
  const sun = new THREE.DirectionalLight(0xfff0dc, 1.9);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 180 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  root.add(sun, sun.target);

  const TERR = 0x8e8a82, TERR2 = 0x7e7a72, BAG = 0x6a6a68, CARPET = 0x3e4a5a, STEELF = 0x7a8088, DECK = 0x7a6a56, APRON = 0x5a5c5e;   // mid-tones: the hall read blown out
  buildGround(root, {
    sea: { y: -6, color: 0x4a6a80, rough: 0.3, metal: 0.3 },
    colorAt(x, z, y, inside) {
      if (inside < -0.6) return x > 22 && z > -40 ? (Math.abs(x - APRON_X) < 0.4 ? 0xd8b830 : APRON) : 0x8a8680;
      const id = PIECE_IDS[G.own[node(x, z)]];
      if (id === 'arrivals') return (Math.round(x / 2) + Math.round(z / 2)) & 1 ? TERR : TERR2;
      if (id === 'carousels' || id === 'security') return (Math.round(x) + Math.round(z)) & 1 ? BAG : shade(BAG, 0.92);
      if (id === 'departures') return hash01(Math.round(x), Math.round(z), 4) < 0.15 ? shade(CARPET, 1.1) : CARPET;
      if (id === 'escalator') return (Math.round(z * 2) & 1) ? STEELF : shade(STEELF, 0.8);
      return (Math.round(z) & 1) ? DECK : shade(DECK, 0.9);
    },
    // outside the walls: flat apron on the glass side (+X, departures / deck), low ground elsewhere
    rise: (x, z, out) => (x > 22 && z > -40 ? -0.4 : Math.min(2, out * 0.3)),
  });

  const boxes = [], glass = [], glows = [];
  const WALL = 0xb4b2ac, WALL2 = 0xa2a09a, FRAME = 0x8a9098, GLASS = 0x9ec4dc;
  // ---- arrival hall: back wall with two arrival exits (frames, glass doors), side walls, rails, pillars, the sit-in
  boxes.push(bx([60, 10, 1], [0, 5, -155], WALL2));
  for (const sx of [-1, 1]) {
    boxes.push(bx([1, 10, 70], [sx * 29, 5, -120], WALL), bx([6.4, 4.4, 0.4], [sx * 12, 2.2, -154.4], FRAME));
    glass.push(bx([5.6, 3.8, 0.1], [sx * 12, 2, -154.2], GLASS));
    for (let k = 0; k < 6; k++) boxes.push(...place(crowdBarrier(0xb8bec6), sx * (8.6 + (k % 2) * 6.8), 0, -150 + Math.floor(k / 2) * 2.4, Math.PI / 2));
    for (const z of [-136, -112]) boxes.push(bx([1.4, 18, 1.4], [sx * 18, 9, z], 0xc4c2bc));
  }
  for (let k = 0; k < 72; k++) {                                         // the sit-in: clusters left and right of the centre
    const sx = k & 1 ? 1 : -1, x = sx * (6 + hash01(k, 1) * 20), z = -150 + hash01(k, 2) * 58;
    if (Math.abs(x) < 5) continue;
    boxes.push(...place(sitter(k), x, 0, z, Math.PI + (hash01(k, 3) - 0.5) * 2.2));
  }
  for (let k = 0; k < 40; k++) { const x = (hash01(k, 7) - 0.5) * 50, z = -150 + hash01(k, 8) * 60; boxes.push(bx([0.22, 0.01, 0.3], [x, 0.01, z], 0xf4f2ea, [0, hash01(k, 9) * 3, 0])); }   // leaflets on the floor
  // ---- baggage hall: walls, carousels (base, slanted plate, belt), cases riding the belt (animated), trolleys
  for (const sx of [-1, 1]) boxes.push(bx([1, 9, 54], [sx * 21, 4.5, -62], WALL), bx([7, 9, 1], [sx * 24.5, 4.5, -87], WALL));
  for (const sx of [-1, 1]) {
    boxes.push(bx([8, 0.5, 24], [sx * 10, 0.35, -66], 0x5a5e66), bx([7.2, 0.25, 23.2], [sx * 10, 0.72, -66], 0x2a2c30), bx([2, 0.9, 20], [sx * 10, 0.85, -66], 0x8a9098));
    for (let k = 0; k < 4; k++) boxes.push(bx([0.7, 1.1, 1.6], [sx * 18.6, 0.6, -80 + k * 6], 0x9aa0a8));
  }
  const caseGeo = [0x2a5a8a, 0xb03a2a, 0x3a3a3a, 0xc8a040, 0x6a6a72, 0x2a6a4a].map((col) => merge([bx([0.8, 0.45, 0.55], [0, 0.22, 0], col), bx([0.3, 0.06, 0.06], [0, 0.48, 0], 0x1a1a1a)]));
  // ---- security line: walk-through frames along it (the belt stanchions are the gate: they sink), screening belts
  for (const sx of [-1, 1]) boxes.push(bx([1, 9, 14], [sx * 15, 4.5, -32], WALL), bx([6, 9, 1], [sx * 18, 4.5, -38.5], WALL));
  for (const x of [-9, 0, 9]) boxes.push(bx([0.3, 2.4, 0.6], [x - 0.6, 1.2, -36.5], 0xc8ccd2), bx([0.3, 2.4, 0.6], [x + 0.6, 1.2, -36.5], 0xc8ccd2), bx([1.5, 0.3, 0.6], [x, 2.4, -36.5], 0xc8ccd2));
  const stanGeo = merge([...[...Array(12)].flatMap((_, k) => [bx([0.08, 1, 0.08], [-13.2 + k * 2.4, 0.5, 0], 0x9aa0a8), bx([2.4, 0.06, 0.03], [-12 + k * 2.4, 0.92, 0], 0x2a4a8a)])]);
  const propMat = propMaterial();
  const stanchions = new THREE.Mesh(stanGeo, propMat); stanchions.position.set(0, 0, -32); root.add(stanchions);
  // ---- departure gates: left wall + gate counters, the glass wall on +X (mullions), seat blocks, the jet bridge
  boxes.push(bx([1, 12, 64], [-23, 6, 3], WALL));
  for (const z of [-20, 0, 20]) boxes.push(bx([1.2, 1.1, 4], [-21.6, 0.75, z], 0x5a6474), bx([1.3, 0.1, 4.1], [-21.6, 1.34, z], 0xd8d6d0));
  for (let z = -28; z <= 34; z += 4) boxes.push(bx([0.3, 12, 0.3], [22.6, 6, z], FRAME));
  boxes.push(bx([0.4, 0.4, 64], [22.6, 12, 3], FRAME), bx([0.4, 0.4, 64], [22.6, 4, 3], FRAME));
  glass.push(bx([0.1, 12, 64], [22.7, 6, 3], GLASS));
  for (const [x0, z0, x1, z1] of [[-18, -8, -10, -6], [10, -8, 18, -6], [-18, 10, -10, 12], [10, 10, 18, 12]]) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    boxes.push(bx([x1 - x0, 0.45, z1 - z0], [cx, 0.42, cz], 0x3a4a6a), bx([x1 - x0, 0.6, 0.25], [cx, 0.9, cz], 0x2a3a5a));
    for (let k = 0; k < 8; k++) boxes.push(bx([0.08, 0.6, z1 - z0], [x0 + k * (x1 - x0) / 7, 0.9, cz], 0x8a9098));
  }
  boxes.push(bx([12, 3, 3], [29, 4, 10], 0xc8ccd2), bx([2, 5, 2], [34, 2.5, 10], 0x8a9098));    // jet bridge from the glass
  // ---- escalator: side walls, handrails; deck: glass parapet, benches, the far end
  for (const sx of [-1, 1]) boxes.push(bx([0.5, 1.4, 18], [sx * 4.4, ground(0, 39) + 0.6, 39], 0x9aa0a8, [Math.atan2(-4.8, 16) * -1, 0, 0]), bx([0.2, 0.2, 18], [sx * 4.4, ground(0, 39) + 1.4, 39], 0x2a2a2a, [Math.atan2(4.8, 16) * -1, 0, 0]));
  boxes.push(bx([46, 5, 1], [0, 2.5, 46], WALL2));                                  // the deck's front face under its edge
  for (const sx of [-1, 1]) boxes.push(bx([20, 5.2, 1], [sx * 14, 2.6, 33.5], WALL2));   // the departures' far wall either side of the escalator
  for (let x = -24; x <= 24; x += 3) boxes.push(bx([0.15, 1.2, 0.15], [x, 5.6, 96.5], FRAME));
  for (let z = 46; z <= 96; z += 3) for (const sx of [-1, 1]) boxes.push(bx([0.15, 1.2, 0.15], [sx * 24.5, 5.6, z], FRAME));
  glass.push(bx([48, 1.1, 0.06], [0, 5.6, 96.5], GLASS), bx([0.06, 1.1, 50], [-24.5, 5.6, 71], GLASS), bx([0.06, 1.1, 50], [24.5, 5.6, 71], GLASS));
  for (const [x, z] of [[-14, 60], [14, 60], [-14, 86], [14, 86]]) boxes.push(bx([5, 0.45, 0.8], [x, 5.4, z], 0x6a5440));
  // ---- the roof: high ribs across the whole terminal (camera clearance: ≥ 19 m), lights under them
  for (let z = -150; z <= 34; z += 12) { boxes.push(bx([58, 0.6, 0.8], [0, 20, z], 0xc8c6c0)); glows.push(bx([1.2, 0.12, 1.2], [-10, 19.6, z], 0xffffff), bx([1.2, 0.12, 1.2], [10, 19.6, z], 0xffffff)); }
  // ---- the departure boards (one canvas, three boards): over the arrival hall, the baggage hall's end, the gates
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const boardMat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.3, 1.3, 1.3), toneMapped: false });
  const boardAt = [[0, 8.5, -100], [0, 6.5, -42], [-8, 7, 30]];
  for (const [x, y, z] of boardAt) {
    boxes.push(bx([12.6, 6.6, 0.4], [x, y, z + 0.3], 0x1a1c20), bx([0.3, 20 - y, 0.3], [x - 5, (20 + y) / 2 + 1.6, z + 0.3], FRAME), bx([0.3, 20 - y, 0.3], [x + 5, (20 + y) / 2 + 1.6, z + 0.3], FRAME));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), boardMat); m.position.set(x, y, z); m.rotation.y = Math.PI; m.name = 'board'; root.add(m);
  }

  const props = new THREE.Mesh(merge(boxes), propMat); props.castShadow = props.receiveShadow = true; root.add(props);
  const glassMesh = new THREE.Mesh(merge(glass), new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3, depthWrite: false }));
  glassMesh.name = 'glass'; root.add(glassMesh);
  root.add(new THREE.Mesh(merge(glows), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(2.4, 2.4, 2.3) })));

  // ---- moving parts: the escalator shutter, the carousel cases, the planes, travellers, rings
  const shutter = new THREE.Mesh(merge([...Array(14)].map((_, k) => bx([9, 0.3, 0.1], [0, 0.15 + k * 0.32, 0], k & 1 ? 0x8a8e94 : 0x7a7e84))), propMat);
  shutter.position.set(0, 0.2, 36); root.add(shutter);
  const cases = [...Array(24)].map((_, k) => { const m = new THREE.Mesh(caseGeo[k % 6], propMat); root.add(m); return m; });
  const planeGeo = merge(airliner());
  const planes = [0, 1, 2].map((k) => { const m = new THREE.Mesh(planeGeo, propMat); m.castShadow = false; m.name = 'plane' + k; root.add(m); return m; });
  planes[1].position.set(38, -0.4, 10); planes[1].rotation.y = -Math.PI / 2;           // parked nose-in at the jet bridge
  const paxGeo = [0, 1, 2, 3, 4].map((k) => merge(traveller(k)));
  const pax = [...Array(8)].map((_, k) => { const m = new THREE.Mesh(paxGeo[k % 5], propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });
  const strand = [...Array(4)].map((_, k) => { const m = new THREE.Mesh(paxGeo[(k + 2) % 5], propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, 0.6), transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide });
  const rings = [...Array(8)].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 32), ringMat); m.rotation.x = -Math.PI / 2; m.visible = false; root.add(m); return m; });
  const stageKey = new THREE.PointLight(0xffe0b0, 20, 14, 2); stageKey.position.set(-6, 3, -136); stageKey.name = 'stage-key'; root.add(stageKey);

  // ---- the board: objective (the story's live objective event) + six flights; rows flip one by one on a change
  let obj = { zh: '', en: '' }, cancelled = false;
  const [, off] = collect(() => on('story:objective', (e) => { obj = { zh: e.zh || '', en: e.en || '' }; }));
  const want = () => [`目標  ${obj.zh}`, obj.en.toUpperCase(), ...CITIES.map(([zh, en, tm], k) => { const s = cancelled ? ['取消', 'CANCELLED'] : STAT[k]; return `${tm}  ${zh} ${en}|${s[0]} ${s[1]}`; })];
  let shown = want().map(() => ''), flip = 0, flipT = 0;
  const draw = () => {
    const g = cv.getContext('2d');
    g.fillStyle = '#121418'; g.fillRect(0, 0, 1024, 512);
    g.fillStyle = '#f2c84a'; g.font = 'bold 34px "PingFang HK","Noto Sans TC",system-ui,sans-serif'; g.textBaseline = 'middle';
    g.fillText('離境 DEPARTURES', 28, 34);
    shown.forEach((row, k) => {
      const y = k < 2 ? 92 + k * 44 : 128 + k * 52, flipping = k === flip && flipT > 0;
      g.fillStyle = k < 2 ? '#2a2410' : '#1c1f26'; g.fillRect(16, y - 22, 992, 44);
      if (flipping) { g.fillStyle = '#05060a'; g.fillRect(16, y - 2, 992, 4); return; }   // the flap mid-turn
      const [l, r] = row.split('|');
      g.font = `${k < 2 ? 'bold ' : ''}${k === 1 ? 26 : 30}px "PingFang HK","Noto Sans TC",system-ui,sans-serif`;
      g.fillStyle = k < 2 ? '#ffd860' : '#e8ecf0'; g.fillText(l, 30, y);
      if (r) { g.fillStyle = r.startsWith('取消') ? '#ff5a4a' : r.startsWith('延誤') ? '#ffb040' : '#7ae08a'; g.textAlign = 'right'; g.fillText(r, 994, y); g.textAlign = 'left'; }
    });
    tex.needsUpdate = true;
  };
  draw();
  const dbg = root.userData.debug = { board: shown, cancelled: false, planes: [], pax: 0, stranded: 0, shutter: 0, stanchions: 0, rings: 0 };

  const tmp = new THREE.Vector3();
  let t = 0, sh = 0, st = 0;
  return {
    fires: [],
    dispose: () => off(),
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      sun.target.position.copy(tmp); sun.position.copy(SUN).multiplyScalar(80).add(tmp);
      const fx = game && game.story && game.story.fx;
      // board: flip the first row that differs from what it should read, 0.09 s a row
      cancelled = !!(fx && fx.cancelled);
      const w = want();
      if (flipT > 0) { flipT -= dt; if (flipT <= 0) { shown[flip] = w[flip]; draw(); } }
      else { const k = w.findIndex((r, i) => r !== shown[i]); if (k >= 0) { flip = k; flipT = 0.09; draw(); } }
      // gates: the stanchions sink, the escalator shutter lifts
      st += ((GATES.securityLine && GATES.securityLine.open ? 1 : 0) - st) * Math.min(1, dt * 2);
      stanchions.position.y = -st * 1.1; stanchions.visible = st < 0.98;
      sh += ((GATES.deckEscalator && GATES.deckEscalator.open ? 1 : 0) - sh) * Math.min(1, dt * 1.2);
      shutter.position.y = 0.2 + sh * 4.6; shutter.visible = sh < 0.98;
      // cases round the two carousels (a stadium loop, 0.6 m/s)
      cases.forEach((m, k) => {
        const sx = k < 12 ? -1 : 1, L = 2 * 20 + Math.PI * 2 * 3, s = ((k % 12) / 12 * L + t * 0.6) % L;
        let x, z, a;
        if (s < 20) { x = 3; z = -76 + s; a = 0; } else if (s < 20 + Math.PI * 3) { a = (s - 20) / 3; x = 3 * Math.cos(a); z = -56 + 3 * Math.sin(a); }
        else if (s < 40 + Math.PI * 3) { x = -3; z = -56 - (s - 20 - Math.PI * 3); a = 0; } else { a = Math.PI + (s - 40 - Math.PI * 3) / 3; x = 3 * Math.cos(a); z = -76 + 3 * Math.sin(a); }
        m.position.set(sx * 10 + x * 0.9, 0.86, z); m.rotation.y = a;
      });
      // planes: one taxiing past the glass (both ways in turn), one parked, one climbing out beyond the deck
      const u = (t / 70) % 1, dir = Math.floor(t / 70) & 1 ? -1 : 1;
      planes[0].position.set(APRON_X, -0.4, dir * (-200 + 400 * u)); planes[0].rotation.y = dir > 0 ? 0 : Math.PI;
      const v = (t / 46) % 1;
      planes[2].position.set(-260 + 520 * v, 30 + 90 * v, 260); planes[2].rotation.set(0, Math.PI / 2, 0); planes[2].rotateX(-0.18);
      dbg.planes = planes.map((p) => [Math.round(p.position.x), Math.round(p.position.y), Math.round(p.position.z)]);
      // the people the story escorts
      const P = (fx && fx.travellers) || [], S = (fx && fx.stranded) || [];
      let np = 0, ns = 0;
      pax.forEach((m, k) => { const e = P[k]; m.visible = !!(e && e.on) && !cancelled; if (m.visible) { np++; m.position.set(e.x, ground(e.x, e.z) + (e.moving ? Math.abs(Math.sin(t * 8 + k)) * 0.05 : 0), e.z); m.rotation.y = e.yaw; } });
      strand.forEach((m, k) => { const e = S[k]; m.visible = !!(e && e.on); if (m.visible) { ns++; m.position.set(e.x, ground(e.x, e.z), e.z); m.rotation.y = e.yaw; } });
      // the boss's attack rings (pepper impacts, charges): a short expanding ring each
      const R = (fx && fx.rings) || [];
      let nr = 0;
      rings.forEach((m, k) => { const r = R[k]; m.visible = !!r; if (!r) return; nr++; m.position.set(r.x, ground(r.x, r.z) + 0.06, r.z); m.scale.setScalar(r.r); });
      Object.assign(dbg, { cancelled, pax: np, stranded: ns, shutter: +sh.toFixed(2), stanchions: +st.toFixed(2), rings: nr, flipping: flipT > 0 });
      stageKey.intensity = 18 + Math.sin(t * 2.3) * 1.5;
    },
  };
}
