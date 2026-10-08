// 銅鑼灣 Causeway Bay's world builder (render-only; registered in the world registry, src/world/world.js). 16 June 2019,
// a hot afternoon turning to dusk: Victoria Park's pitches full of marchers in black with white flowers, Hennessy Road
// (shopfront towers with blank coloured signboards, tram tracks, the two side streets), the Wan Chai junction (traffic
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
import { place, merge, propMaterial, bx, tower, tree, footbridge, crowdBarrier, CONCRETE, ASPHALT } from '../hkkit/props.js';
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
  root.add(new THREE.HemisphereLight(0xd8d4c8, 0x5a524a, 1.4));
  const sun = new THREE.DirectionalLight(0xffe0b8, 2.0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 180 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  root.add(sun, sun.target);

  const GRASS = 0x4a7a3a, GRASS2 = 0x426e34, ROAD = 0x45474c, PAVE = 0x9a948a, DECK = 0x8a8680, STEP = 0x8a8680;
  buildGround(root, {
    colorAt(x, z, y, inside) {
      if (inside < -0.6) return y > 1 ? 0x6a665e : PAVE;
      const id = PIECE_IDS[G.own[node(x, z)]];
      if (id === 'park') { if (Math.abs(Math.abs(x) - 14) < 0.25 || Math.abs(z + 140) < 0.25) return 0xf0f0e8; return (Math.round(z / 3) & 1) ? GRASS : GRASS2; }
      if (id === 'hennessy' || id === 'sideE' || id === 'sideW') { if (id === 'hennessy' && (Math.abs(Math.abs(x) - 1.4) < 0.12 || Math.abs(Math.abs(x) - 2.4) < 0.12)) return 0x8a8a8a; if (Math.abs(x) > 7.5 && id === 'hennessy') return PAVE; return ROAD; }   // tram rails, pavements
      if (id === 'junction' || id === 'harcourt') return Math.abs(x % 4.5) < 0.12 && (Math.round(z / 3) & 1) ? 0xe8e4d8 : ROAD;   // lane dashes
      if (id === 'stairs') return (Math.round(z * 1.5) & 1) ? STEP : shade(STEP, 0.85);
      return (Math.round(z) & 1) ? DECK : shade(DECK, 0.92);
    },
    rise: (x, z, out) => Math.min(1.2, out * 0.2),
  });

  const boxes = [], glows = [];
  const SIGN = [0xc8201a, 0xffd700, 0x2a6ab0, 0x2a8a4a, 0xe07a1a, 0xd8d8d0];
  // ---- Hennessy Road: shopfront towers both sides (blank coloured signboards jutting out), leaving the two side streets open
  for (const sx of [-1, 1]) for (let z = -110; z < -34; z += 12) {
    if ((sx > 0 && z > -98 && z < -82) || (sx < 0 && z > -68 && z < -52)) continue;
    const h = 22 + hash01(z, sx + 3) * 26, t = tower(11, 10, h, Math.round(z) * 3 + sx, { col: [0x8a8478, 0x9a8a7a, 0x7a7a80][Math.abs(z) % 3], glass: 0x2a3038, litCol: 0xf2dcae, litP: 0.25 });
    boxes.push(...place(t.body, sx * 15, 0, z + 6)); glows.push(...place(t.lit, sx * 15, 0, z + 6));
    for (let k = 0; k < 3; k++) glows.push(bx([0.25, 1.8, 3], [sx * (9.6 - k * 0.0), 4 + k * 2.6, z + 2 + k * 3.5], SIGN[(Math.abs(z) + k + (sx > 0 ? 2 : 0)) % SIGN.length]));
  }
  // ---- Victoria Park: trees round the pitches, two pavilions, marchers sitting and standing on the grass
  for (let k = 0; k < 18; k++) { const sx = k & 1 ? 1 : -1, z = -168 + (k >> 1) * 6.6; boxes.push(...place(tree(6 + hash01(k, 5) * 2, k), sx * 28.5, 0, z)); }
  for (const sx of [-1, 1]) boxes.push(bx([6, 0.3, 6], [sx * 23, 3.2, -157], 0xb03a2a), ...[-1, 1].flatMap((a) => [-1, 1].map((b) => bx([0.3, 3.2, 0.3], [sx * 23 + a * 2.6, 1.6, -157 + b * 2.6], 0xd8d0c0))));
  for (let k = 0; k < 140; k++) { const x = (hash01(k, 11) - 0.5) * 54, z = -168 + hash01(k, 12) * 52; if (Math.abs(x) < 4) continue; boxes.push(...place(marcher(k), x, 0, z, Math.PI * 0.95 + (hash01(k, 13) - 0.5))); }
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
      const col = fx && fx.column, head = col ? col.head : null;
      let nb = 0;
      column.forEach((m, k) => {
        const z = head == null ? null : head - 1 - k * 6.2;
        m.visible = z != null && z > -168 && !(fx.amb && fx.amb.on);
        if (!m.visible) return;
        nb++;
        const sway = col.moving && !col.stalled ? Math.sin(t * 4 + k) * 0.04 : 0;
        m.position.set(Math.sin(k * 1.7) * 0.6, sway * 0, z); m.position.y = Math.abs(sway);
      });
      // the lane blocks and the ambulance
      const L = (fx && fx.lane) || [];
      let nl = 0;
      lane.forEach((m, k) => { const b = L[k]; m.visible = !!b; if (!b) return; nl++; m.position.set(b.x, 0, b.z); m.rotation.y = b.parted ? b.side * 0.3 : 0; });
      const A = fx && fx.amb, on = !!(A && A.on);
      amb.visible = on;
      const flash = on && A.siren && (Math.floor(t * 6) & 1);
      if (on) {                                                    // never let the lens end up inside it: hidden within 4.5 m of the camera
        const cy = game.cam ? game.cam.yaw : 0, camX = focus.x - Math.sin(cy) * 9, camZ = focus.z - Math.cos(cy) * 9;
        amb.visible = Math.hypot(camX, camZ - A.z) > 4.5 && Math.hypot(camX - 0, camZ - (A.z + (A.z > 0 ? 0 : 0))) > 4.5;
      }
      if (on) { amb.position.set(0, 0, A.z); amb.rotation.y = Math.PI; roofL.material = lightMat[flash ? 0 : 1]; roofR.material = lightMat[flash ? 1 : 0]; siren.intensity = A.siren ? 14 + Math.sin(t * 20) * 6 : 0; siren.color.setHex(flash ? 0xff4040 : 0x4060ff); }
      Object.assign(dbg, { head: head == null ? 0 : +head.toFixed(2), columnBlocks: nb, laneBlocks: nl, parted: fx ? fx.parted || 0 : 0, ambZ: on ? +A.z.toFixed(2) : 0, ambOn: on ? 1 : 0, lights: on && A.siren ? 1 : 0,
        barrier: +(1 - lineOpen).toFixed(2), stalled: col && col.stalled ? 1 : 0 });
    },
  };
}
