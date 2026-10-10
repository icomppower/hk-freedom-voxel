// 銅鑼灣 Causeway Bay's world builder (render-only; registered in the world registry, src/world/world.js). 16 June 2019,
// a hot afternoon turning to dusk: Victoria Park's fenced, floodlit hard-court pitches full of marchers in black with white
// flowers, Hennessy Road (narrow tile-faced blocks, neon signboards jutting over the road, a stranded tram, Canal Road
// flyover, the two side streets), the Wan Chai junction (traffic
// islands; gate 'junctionLine': a row of police barriers that slides away), Harcourt Road under two footbridges with
// generic glass office blocks either side, the stairs (gate 'bridgeStairs': a barrier that lifts) and the footbridge deck.
// Story fx (hk7.js script): the march column (blocks of marchers trailing the head along Hennessy Road), the marcher
// blocks in the ambulance lane (they shuffle to the kerb once parted), the ambulance (white, a red stripe, flashing roof
// lights). Generic city: no shop, bank or brand names, logos, signage text or flags.
// #debug: root.userData.debug = { head, columnBlocks, laneBlocks, parted, ambZ, ambOn, lights, barrier } (causeway-look).
// Never writes sim state.
import * as THREE from 'three';
import { GATES, ground, TERRAIN as G, PIECE_IDS, node, MAPS } from '../../map.js';
import { buildGround } from '../hkkit/terrain.js';
import { place, merge, propMaterial, bx, tower, tree, footbridge, crowdBarrier, streetLamp, CONCRETE, CONCRETE_D } from '../hkkit/props.js';
import { hash01 } from '../../../core/rng.js';
import { shade } from '../../../core/voxel.js';

const SHADOW_BOX = 30, SUN = new THREE.Vector3(-0.5, 0.55, 0.45).normalize();
const SKY = new THREE.Color(0x8aa0c0), FOG = new THREE.Color(0xb8b0a8);
const M = MAPS.causeway;
const SKINS = [0xe0b28a, 0xd6a67e, 0xc8966e, 0xf0c8a0];
/** A marcher standing (+Z forward): black (k % 7 = 0: white shirt), some with a white flower or an umbrella. */
const marcher = (k) => {
  const shirt = k % 7 === 0 ? 0xeeeeea : k % 5 === 0 ? 0x2a2a30 : 0x141416, out = [bx([0.42, 0.8, 0.26], [0, 0.4, 0], 0x18181a), bx([0.48, 0.66, 0.3], [0, 1.15, 0], shirt),
    bx([0.26, 0.26, 0.26], [0, 1.62, 0], SKINS[k % 4]), bx([0.28, 0.12, 0.28], [0, 1.8, -0.02], k % 3 ? 0x141210 : 0x3a2a1a)];
  if (k % 4 === 1) out.push(bx([0.1, 0.1, 0.1], [0.3, 1.2, 0.18], 0xf8f8f4), bx([0.03, 0.3, 0.03], [0.3, 1.0, 0.18], 0x3a6a2a));   // a white flower
  if (k % 9 === 2) out.push(bx([1.1, 0.08, 1.1], [0, 2.2, 0], k % 2 ? 0x1a1a1a : 0xffd700), bx([0.03, 0.5, 0.03], [0, 1.95, 0], 0x2a2a2a));   // an umbrella
  return out;
};
/** A block of marchers: cols × rows, 0.9 m apart, centred on the origin. */
const block = (cols, rows, seed) => merge([...Array(cols * rows)].flatMap((_, k) => {
  const c = k % cols, r = Math.floor(k / cols);
  return place(marcher(k + seed), (c - (cols - 1) / 2) * 0.9 + (hash01(k, seed) - 0.5) * 0.3, 0, (r - (rows - 1) / 2) * 0.9 + (hash01(k, seed + 1) - 0.5) * 0.3, (hash01(k, seed + 2) - 0.5) * 0.4);
}));
const ambulance = () => [bx([2.3, 2.6, 6.2], [0, 1.6, 0], 0xf4f4f0), bx([2.32, 0.4, 6.22], [0, 1.4, 0], 0xc8201a), bx([2.1, 1.0, 1.4], [0, 1.0, 3.6], 0xf4f4f0),
  bx([2.0, 0.8, 0.1], [0, 1.6, 4.3], 0x1e2430), ...[-1, 1].flatMap((s) => [bx([0.4, 0.9, 0.9], [s * 1.0, 0.45, 2.6], 0x151515), bx([0.4, 0.9, 0.9], [s * 1.0, 0.45, -2.2], 0x151515)])];

export function buildCauseway(scene, root) {
  scene.background = SKY.clone();
  scene.fog = new THREE.Fog(FOG.clone(), 60, 320);
  const skyGeo = new THREE.SphereGeometry(900, 24, 12), sc = [], sp = skyGeo.attributes.position, c3 = new THREE.Color();
  for (let i = 0; i < sp.count; i++) { const h = Math.max(0, sp.getY(i) / 900); c3.setRGB(0.86 - 0.36 * h, 0.72 - 0.16 * h, 0.62 + 0.1 * h); sc.push(c3.r, c3.g, c3.b); }   // late afternoon haze
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  root.add(Object.assign(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })), { renderOrder: -1, frustumCulled: false }));
  root.add(new THREE.HemisphereLight(0xe8e4d8, 0x6a625a, 2.0));
  const fill = new THREE.DirectionalLight(0xc8d4e8, 0.9); fill.position.set(0.6, 0.5, -0.4); root.add(fill);   // sky bounce on the facades the sun misses
  const sun = new THREE.DirectionalLight(0xffe0b8, 2.0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 180 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  root.add(sun, sun.target);

  const GRASS = 0x4a7a3a, GRASS2 = 0x426e34, COURT = 0x5a8a6a, COURT2 = 0x7a6a5a, ROAD = 0x45474c, PAVE = 0x9a948a, DECK = 0x8a8680, STEP = 0x8a8680;
  buildGround(root, {
    colorAt(x, z, y, inside) {
      if (inside < -0.6) return y > 1 ? 0x6a665e : PAVE;
      const id = PIECE_IDS[G.own[node(x, z)]];
      if (id === 'park') { if (Math.abs(x) > 26) return (Math.round(z / 3) & 1) ? GRASS : GRASS2; if (Math.abs(Math.abs(x) - 13) < 0.2 || Math.abs(Math.abs(x) - 25.5) < 0.2 || Math.abs(z + 140) < 0.2 || Math.abs(z + 168) < 0.2 || Math.abs(z + 112) < 0.2 || Math.abs(Math.hypot(x, z + 140) - 6) < 0.2) return 0xf0f0e8; return x < -13 || x > 13 ? COURT2 : COURT; }   // hard-court pitches, white lines
      if (id === 'hennessy' || id === 'sideE' || id === 'sideW') { if (id === 'hennessy' && (Math.abs(Math.abs(x) - 1.4) < 0.12 || Math.abs(Math.abs(x) - 2.4) < 0.12)) return 0x8a8a8a; if (Math.abs(x) > 7.5 && id === 'hennessy') return PAVE; return ROAD; }   // tram rails, pavements
      if (id === 'junction' || id === 'harcourt') return Math.abs(x % 4.5) < 0.12 && (Math.round(z / 3) & 1) ? 0xe8e4d8 : ROAD;   // lane dashes
      if (id === 'stairs') return (Math.round(z * 1.5) & 1) ? STEP : shade(STEP, 0.85);
      return (Math.round(z) & 1) ? DECK : shade(DECK, 0.92);
    },
    rise: (x, z, out) => Math.min(1.2, out * 0.2),
  });

  const boxes = [], glows = [];
  // Causeway Bay as it reads on the street (generic: no names, logos, text or flags): narrow 6-9 m lots of tile-faced
  // commercial blocks in pale cream / mint / salmon, a lit shop band and a canopy over the pavement, steel railings at the
  // kerb, and the district's signature — neon signboards on steel frames jutting out over the road, stacked up the
  // facades. A double-deck tram stands stranded on the tracks (trams stopped for the march), Canal Road flyover crosses
  // overhead where Causeway Bay meets Wan Chai, a covered footbridge spans the road at the park end, and the high-rise
  // skyline stands behind the street wall.
  const FACADE = [0xd8cfb8, 0xc8d4c4, 0xd8b8a4, 0xc4c4bc, 0xe0d8c0, 0xb8c4cc, 0xd0c0a0];
  const NEON = [0xff3a5a, 0xffd23a, 0x3ad8ff, 0x7aff5a, 0xff8a2a, 0xf0f0ff, 0xc85aff, 0xff5ac8];
  const sideGap = (sx, z0, z1) => (sx > 0 && z1 > -96 && z0 < -84) || (sx < 0 && z1 > -66 && z0 < -54);
  for (const sx of [-1, 1]) {
    let z = -112;
    for (let lot = 0; z < -36; lot++) {
      const w = 6 + Math.floor(hash01(lot, sx + 3) * 4), z0 = z, z1 = Math.min(-36, z + w); z = z1;
      if (sideGap(sx, z0, z1)) continue;
      const L = z1 - z0, zc = (z0 + z1) / 2, h = 24 + Math.floor(hash01(lot, sx + 5) * 9) * 4, col = FACADE[(lot * 3 + (sx > 0 ? 1 : 0)) % FACADE.length];
      const t = tower(10, L - 0.3, h, lot * 11 + sx * 5, { col, glass: 0x3a4450, litCol: 0xf6e2b4, litP: 0.3 });
      boxes.push(...place(t.body, sx * 14.2, 0, zc)); glows.push(...place(t.lit, sx * 14.2, 0, zc));
      // ground floor: lit shop glass, a canopy over the pavement, air-conditioners up the face
      glows.push(bx([0.1, 2.6, L - 1.2], [sx * 9.15, 1.6, zc], shade(0xf8e8c8, 0.8 + hash01(lot, sx, 9) * 0.3)));
      boxes.push(bx([1.6, 0.18, L - 0.2], [sx * 8.4, 3.4, zc], 0x5a5e64));
      for (let f = 0; f < 6; f++) if (hash01(lot, f, sx + 7) < 0.6) boxes.push(bx([0.5, 0.45, 0.7], [sx * 9.0, 5.4 + f * 3.4, zc + (hash01(lot, f) - 0.5) * (L - 2)], 0xd8d8d0));
      // neon signboards jutting over the road (perpendicular to the facade), one to three stacked per lot
      const nS = 1 + Math.floor(hash01(lot, sx, 2) * 3);
      for (let k = 0; k < nS; k++) {
        const sw = 2.4 + hash01(lot, k, 3) * 2.2, sh = 2.2 + hash01(lot, k, 4) * 3.4, y = 5.2 + k * 4.8 + hash01(lot, k, 5) * 1.2, zz = zc + (hash01(lot, k, 6) - 0.5) * (L - 1.5);
        const xx = sx * (9.2 - sw / 2), c = NEON[(lot * 5 + k * 3 + (sx > 0 ? 2 : 0)) % NEON.length];
        boxes.push(bx([sw + 0.2, sh + 0.2, 0.22], [xx, y, zz], 0x1a1a1e), bx([0.12, 0.12, 0.12], [sx * 9.15, y + sh / 2 + 0.4, zz], 0x4a4e54), bx([sw, 0.08, 0.08], [xx, y + sh / 2 + 0.4, zz], 0x4a4e54));
        glows.push(bx([sw - 0.3, sh - 0.3, 0.26], [xx, y, zz], c));
        for (let r = 0; r < Math.floor(sh / 1.1); r++) boxes.push(bx([sw - 0.9, 0.12, 0.28], [xx, y - sh / 2 + 0.75 + r * 1.1, zz], shade(c, 0.45)));   // blank bands, no lettering
      }
    }
    // the skyline behind the street wall: taller towers
    for (let k = 0; k < 7; k++) {
      const zz = -108 + k * 11, h = 60 + hash01(k, sx, 21) * 50, t = tower(14, 10, h, k * 13 + sx * 3 + 90, { col: [0x9aa4ac, 0x8a94a0, 0xb0aca0][k % 3], glass: 0x34404c, litCol: 0xe8eef4, litP: 0.22 });
      boxes.push(...place(t.body, sx * 30, 0, zz)); glows.push(...place(t.lit, sx * 30, 0, zz));
    }
    // kerbside steel railings (gaps at the side streets and the crossings), street lamps
    for (let z2 = -110; z2 < -36; z2 += 2) { if (sideGap(sx, z2 - 1, z2 + 1) || Math.abs(z2 + 75) < 3) continue; boxes.push(bx([0.06, 1.0, 0.06], [sx * 7.6, 0.5, z2], 0x6a7a74), bx([0.05, 0.06, 2.0], [sx * 7.6, 0.95, z2 + 1], 0x6a7a74)); }
    for (let z2 = -106; z2 < -40; z2 += 18) { const L = streetLamp(9); boxes.push(...place(L.body, sx * 7.9, 0, z2, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); glows.push(...place(L.glow, sx * 7.9, 0, z2, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); }
  }
  // the stranded double-deck tram (east track; the march flows round its west side) — map.js carves its footprint
  const [tx0, tz0, tx1, tz1] = M.TRAM, txc = (tx0 + tx1) / 2, tzc = (tz0 + tz1) / 2, TL = tz1 - tz0 - 0.4, tramB = [];
  tramB.push(bx([2.3, 1.9, TL], [txc, 1.35, tzc], 0x1e5a3a), bx([2.3, 1.9, TL], [txc, 3.3, tzc], 0xe8e0c8), bx([2.34, 0.7, TL - 0.6], [txc, 1.75, tzc], 0x2a3440),
    bx([2.34, 0.8, TL - 0.6], [txc, 3.45, tzc], 0x2a3440), bx([2.1, 0.2, TL - 0.2], [txc, 4.35, tzc], 0x1e5a3a), bx([2.4, 0.35, TL + 0.1], [txc, 0.3, tzc], 0x1a1a1a),
    bx([0.06, 1.6, 0.06], [txc, 5.2, tzc], 0x2a2a2a), bx([0.8, 0.05, 0.05], [txc, 6.0, tzc], 0x2a2a2a));
  tramB.push(bx([1.2, 0.35, 0.1], [txc, 4.0, tz1 - 0.15], 0xf8f8e8), bx([1.2, 0.35, 0.1], [txc, 4.0, tz0 + 0.15], 0xf8f8e8));   // its own mesh: hidden when the lens comes near
  for (let z2 = -112; z2 < -30; z2 += 8) boxes.push(bx([0.08, 7, 0.08], [9.0, 3.5, z2], 0x3a3e44), bx([18, 0.03, 0.03], [0, 6.8, z2], 0x2a2a2a));   // tram wire spans
  boxes.push(bx([0.03, 0.03, 82], [1.9, 6.8, -71], 0x2a2a2a), bx([0.03, 0.03, 82], [-1.9, 6.8, -71], 0x2a2a2a));
  // Canal Road flyover, crossing over the road where Causeway Bay meets Wan Chai
  boxes.push(bx([70, 1.4, 11], [0, 9.2, M.FLYOVER_Z], CONCRETE), bx([70, 0.9, 0.3], [0, 10.35, M.FLYOVER_Z - 5.4], shade(CONCRETE, 0.9)), bx([70, 0.9, 0.3], [0, 10.35, M.FLYOVER_Z + 5.4], shade(CONCRETE, 0.9)),
    bx([70, 0.5, 11.4], [0, 8.3, M.FLYOVER_Z], CONCRETE_D));
  for (const sx of [-1, 1]) for (const ox of [11, 24]) boxes.push(bx([2.2, 8.4, 3.2], [sx * ox, 4.2, M.FLYOVER_Z], shade(CONCRETE, 0.92)));
  // the covered footbridge at the park end
  { const fb = footbridge(30, 6.5, 11, 3.6); boxes.push(...place(fb, 0, 0, -108)); }
  // ---- Victoria Park: hard-court football pitches (fenced, floodlit), trees, two pavilions, marchers on the pitches
  for (let k = 0; k < 18; k++) { const sx = k & 1 ? 1 : -1, z = -168 + (k >> 1) * 6.6; boxes.push(...place(tree(6 + hash01(k, 5) * 2, k), sx * 28.5, 0, z)); }
  for (const sx of [-1, 1]) boxes.push(bx([6, 0.3, 6], [sx * 23, 3.2, -157], 0xb03a2a), ...[-1, 1].flatMap((a) => [-1, 1].map((b) => bx([0.3, 3.2, 0.3], [sx * 23 + a * 2.6, 1.6, -157 + b * 2.6], 0xd8d0c0))));
  for (const sx of [-1, 1]) for (const z of [-166, -114]) { boxes.push(bx([0.35, 18, 0.35], [sx * 27, 9, z], 0x6a6e74), bx([3, 1.4, 0.4], [sx * 27, 18.4, z], 0x3a3e44)); glows.push(bx([2.6, 1.0, 0.1], [sx * 27, 18.4, z + (z < -140 ? 0.25 : -0.25)], 0xfff4d8)); }   // floodlight masts
  for (let z = -168; z <= -112; z += 3) for (const sx of [-1, 1]) boxes.push(bx([0.05, 3.2, 0.05], [sx * 26, 1.6, z], 0x5a6a60));                  // pitch fences
  boxes.push(bx([52, 0.05, 0.05], [0, 3.1, -168], 0x5a6a60));
  for (let k = 0; k < 140; k++) { const x = (hash01(k, 11) - 0.5) * 50, z = -166 + hash01(k, 12) * 50; if (Math.abs(x) < 4) continue; boxes.push(...place(marcher(k), x, 0, z, Math.PI * 0.95 + (hash01(k, 13) - 0.5))); }
  // the park-side skyline across the road (the high-rises round the park)
  for (let k = 0; k < 8; k++) { const x = -56 + k * 16, h = 70 + hash01(k, 31) * 60, t = tower(12, 12, h, k * 17 + 200, { col: [0xc8c0b0, 0xa8b0b8, 0xb8b0a0][k % 3], glass: 0x34404c, litCol: 0xf0e8d8, litP: 0.2 }); boxes.push(...place(t.body, x, 0, -196)); glows.push(...place(t.lit, x, 0, -196)); }
  // ---- the junction: traffic islands with railings
  for (const sx of [-1, 1]) boxes.push(bx([3, 0.3, 6], [sx * 12.5, 0.15, -23], CONCRETE), ...[...Array(4)].map((_, k) => bx([0.08, 1, 0.08], [sx * 12.5 + (k - 1.5) * 0.9, 0.6, -26], 0xb8b0a0)));
  // ---- Harcourt Road: two footbridges overhead, glass office blocks either side, kerbside crowds filling the road edges
  for (const z of [10, 38]) { const fb = footbridge(40, 6.5, 8, 4); boxes.push(...place(fb.body ?? fb, 0, 0, z)); }
  for (const sx of [-1, 1]) for (const z of [-4, 26, 50]) { const t = tower(14, 16, 40 + hash01(z, sx) * 20, z + sx * 9, { col: 0x6a7a8a, glass: 0x3a5a7a, litCol: 0xd8e4f0, litP: 0.3 }); boxes.push(...place(t.body, sx * 26, 0, z)); glows.push(...place(t.lit, sx * 26, 0, z)); }
  for (let k = 0; k < 120; k++) { const sx = k & 1 ? 1 : -1, x = sx * (10.5 + hash01(k, 21) * 3), z = -12 + hash01(k, 22) * 66; boxes.push(...place(marcher(k + 300), x, 0, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); }
  // ---- the deck: railings
  for (const sx of [-1, 1]) for (let z = 70; z <= 90; z += 1.5) boxes.push(bx([0.08, 1.1, 0.08], [sx * 12.1, 5.6, z], 0x9aa0a8));
  for (let x = -12; x <= 12; x += 1.5) boxes.push(bx([0.08, 1.1, 0.08], [x, 5.6, 90.1], 0x9aa0a8));

  const propMat = propMaterial();
  const tram = new THREE.Mesh(merge(tramB), propMat); tram.castShadow = tram.receiveShadow = true; root.add(tram);
  const props = new THREE.Mesh(merge(boxes), propMat); props.castShadow = props.receiveShadow = true; root.add(props);
  root.add(new THREE.Mesh(merge(glows), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1.6, 1.6, 1.5) })));

  // ---- moving parts: the police line (slides away), the stairs barrier (lifts), the column, the lane blocks, the ambulance
  const lineGeo = merge([...Array(8)].flatMap((_, k) => place(crowdBarrier(0xd8d8d0), -14 + k * 4, 0, 0)));
  const line = new THREE.Mesh(lineGeo, propMat); line.position.set(0, 0, -22); line.castShadow = true; root.add(line);
  const stairBar = new THREE.Mesh(merge(place(crowdBarrier(0xd8d8d0), 0, 0, 0)), propMat); stairBar.position.set(0, 0, 57); root.add(stairBar);
  const colGeo = [0, 1, 2].map((s) => block(8, 5, s * 50 + 7));
  const column = [...Array(10)].map((_, k) => { const m = new THREE.Mesh(colGeo[k % 3], propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });
  const laneGeo = [0, 1].map((s) => block(6, 4, s * 70 + 3));
  const lane = [...Array(5)].map((_, k) => { const m = new THREE.Mesh(laneGeo[k % 2], propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });
  const amb = new THREE.Mesh(merge(ambulance()), propMat); amb.castShadow = true; amb.visible = false; root.add(amb);
  const lightMat = [new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.3, 0.3) }), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 0.6, 3) })];
  const roofL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.4), lightMat[0]), roofR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.4), lightMat[1]);
  roofL.position.set(-0.6, 3.05, 0.8); roofR.position.set(0.6, 3.05, 0.8); amb.add(roofL, roofR);
  const siren = new THREE.PointLight(0xff4040, 0, 18, 2); siren.position.set(0, 3.4, 0.8); amb.add(siren);
  const dbg = root.userData.debug = { head: 0, columnBlocks: 0, laneBlocks: 0, parted: 0, ambZ: 0, ambOn: 0, lights: 0, barrier: 1 };

  const tmp = new THREE.Vector3();
  let t = 0, lineOpen = 0, barUp = 0;
  return {
    fires: [],
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      sun.target.position.copy(tmp); sun.position.copy(SUN).multiplyScalar(80).add(tmp);
      const fx = game && game.story && game.story.fx;
      // gates
      lineOpen += ((GATES.junctionLine && GATES.junctionLine.open ? 1 : 0) - lineOpen) * Math.min(1, dt * 1.5);
      line.position.x = lineOpen * 18 * (lineOpen > 0.5 ? 1 : 1); line.visible = lineOpen < 0.98;
      barUp += ((GATES.bridgeStairs && GATES.bridgeStairs.open ? 1 : 0) - barUp) * Math.min(1, dt * 1.5);
      stairBar.position.y = barUp * 3; stairBar.visible = barUp < 0.98;
      // the march column: ten blocks trailing the head, 6 m apart, inside the park / road (with no story: none)
      const cy = game && game.cam ? game.cam.yaw : 0, camX = focus.x - Math.sin(cy) * 9, camZ = focus.z - Math.cos(cy) * 9;   // ≈ the lens
      tram.visible = !(camX > M.TRAM[0] - 2.5 && camX < M.TRAM[2] + 2.5 && camZ > M.TRAM[1] - 2.5 && camZ < M.TRAM[3] + 2.5);
      const col = fx && fx.column, head = col ? col.head : null;
      let nb = 0;
      column.forEach((m, k) => {
        const z = head == null ? null : head - 1 - k * 6.2;
        m.visible = z != null && z > -168 && !(fx.amb && fx.amb.on);
        if (!m.visible) return;
        const bxX = z > M.TRAM[1] - 4 && z < M.TRAM[3] + 4 ? -4.6 : Math.sin(k * 1.7) * 0.6;
        if (Math.abs(camX - bxX) < 6 && Math.abs(camZ - z) < 4.5) { m.visible = false; return; }   // never fill the lens with heads
        nb++;
        const sway = col.moving && !col.stalled ? Math.sin(t * 4 + k) * 0.04 : 0;
        m.position.set(bxX, Math.abs(sway), z);                   // round the tram's west side as they pass it
      });
      // the lane blocks and the ambulance
      const L = (fx && fx.lane) || [];
      let nl = 0;
      lane.forEach((m, k) => { const b = L[k]; m.visible = !!b; if (!b) return; nl++; m.position.set(b.x, 0, b.z); m.rotation.y = b.parted ? b.side * 0.3 : 0; });
      const A = fx && fx.amb, on = !!(A && A.on);
      amb.visible = on;
      const flash = on && A.siren && (Math.floor(t * 6) & 1);
      if (on) {                                                    // never let the lens end up inside it: hidden within 4.5 m of the camera
        amb.visible = Math.hypot(camX, camZ - A.z) > 4.5 && Math.hypot(camX - 0, camZ - (A.z + (A.z > 0 ? 0 : 0))) > 4.5;
      }
      if (on) { amb.position.set(0, 0, A.z); amb.rotation.y = Math.PI; roofL.material = lightMat[flash ? 0 : 1]; roofR.material = lightMat[flash ? 1 : 0]; siren.intensity = A.siren ? 14 + Math.sin(t * 20) * 6 : 0; siren.color.setHex(flash ? 0xff4040 : 0x4060ff); }
      Object.assign(dbg, { head: head == null ? 0 : +head.toFixed(2), columnBlocks: nb, laneBlocks: nl, parted: fx ? fx.parted || 0 : 0, ambZ: on ? +A.z.toFixed(2) : 0, ambOn: on ? 1 : 0, lights: on && A.siren ? 1 : 0,
        barrier: +(1 - lineOpen).toFixed(2), stalled: col && col.stalled ? 1 : 0 });
    },
  };
}
