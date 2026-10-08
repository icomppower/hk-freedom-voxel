// 中大二號橋 Bridge No. 2's world builder (render-only; registered in the world registry, src/world/world.js). 12 November
// 2019, dusk into night: the campus road (generic low teaching blocks with lit windows, the sports ground, trees, supply
// tables with umbrellas), Bridge No. 2 (railings, lamp posts) over the highway and the railway 8 m below (cars both ways,
// a passing train — render-only), the barricade at the far end (bins and bricks rising with story fx.barricade; gate
// 'hillSteps' is the gap that closes / opens with it), the steps and the hill (trees, a low wall, the harbour lights far
// off). Story fx (hk6.js script): canisters arc in and smoke (fx.gas: live → a cone drops over it → water → out), the
// haze banks sized by each canister's haze, the boss's attack rings. Generic campus: no crest, name, logo or signage text.
// #debug: root.userData.debug = { cans, cones, smoking, puffs, barricade, cars, train, rings } (bench/maps/cuhk-look.mjs).
// Never writes sim state.
import * as THREE from 'three';
import { GATES, ground, TERRAIN as G, PIECE_IDS, node, MAPS } from '../../map.js';
import { buildGround } from '../hkkit/terrain.js';
import { place, merge, propMaterial, bx, tower, tree, streetLamp, umbrella, CONCRETE, ASPHALT } from '../hkkit/props.js';
import { hash01 } from '../../../core/rng.js';
import { shade } from '../../../core/voxel.js';

const SHADOW_BOX = 30, SUN = new THREE.Vector3(-0.6, 0.35, 0.5).normalize();
const SKY = new THREE.Color(0x3a3f5a), FOG = new THREE.Color(0x4a4a5e);
const HY = MAPS.cuhk.HIGHWAY_Y, BAR = MAPS.cuhk.BARRICADE;
const car = (c) => [bx([1.9, 0.9, 4.2], [0, 0.65, 0], c), bx([1.7, 0.7, 2.2], [0, 1.4, -0.2], shade(c, 0.85)), bx([1.72, 0.5, 1.9], [0, 1.45, -0.2], 0x1e2430),
  bx([0.3, 0.2, 0.05], [-0.65, 0.75, 2.1], 0xfff2c8), bx([0.3, 0.2, 0.05], [0.65, 0.75, 2.1], 0xfff2c8), bx([0.3, 0.2, 0.05], [-0.65, 0.75, -2.1], 0xc02020), bx([0.3, 0.2, 0.05], [0.65, 0.75, -2.1], 0xc02020)];
const trainCar = () => [bx([3, 3.4, 22], [0, 2, 0], 0xc8ccd2), bx([3.02, 1, 20], [0, 2.4, 0], 0x2a3440), bx([3.04, 0.3, 22], [0, 1.1, 0], 0x3a6aa8)];
const bin = (k) => [bx([0.7, 1, 0.7], [0, 0.5, 0], [0x2e6a3a, 0x3a3a3a, 0x8a6a2a][k % 3]), bx([0.76, 0.1, 0.76], [0, 1.02, 0], 0x1a1a1a)];
const bricks = (k) => [bx([0.5, 0.18, 0.25], [0, 0.09, 0], 0x9a5a3a), bx([0.5, 0.18, 0.25], [0.12, 0.27, 0.05], 0x8a4e32), bx([0.5, 0.18, 0.25], [-0.1, 0.45, -0.03], shade(0x9a5a3a, 0.9 + (k % 3) * 0.05))];
const cone = () => [bx([0.5, 0.06, 0.5], [0, 0.03, 0], 0xe05a1a), bx([0.34, 0.25, 0.34], [0, 0.18, 0], 0xf06a24), bx([0.22, 0.2, 0.22], [0, 0.4, 0], 0xf2f0ea), bx([0.12, 0.18, 0.12], [0, 0.58, 0], 0xf06a24)];

export function buildCuhk(scene, root) {
  scene.background = SKY.clone();
  scene.fog = new THREE.Fog(FOG.clone(), 40, 260);
  const skyGeo = new THREE.SphereGeometry(900, 24, 12), sc = [], sp = skyGeo.attributes.position, c3 = new THREE.Color();
  for (let i = 0; i < sp.count; i++) { const h = Math.max(0, sp.getY(i) / 900); c3.setRGB(0.42 - 0.3 * h + 0.25 * Math.max(0, 0.2 - h), 0.34 - 0.2 * h, 0.4 - 0.16 * h); sc.push(c3.r, c3.g, c3.b); }   // dusk: warm at the horizon
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  root.add(Object.assign(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })), { renderOrder: -1, frustumCulled: false }));
  root.add(new THREE.HemisphereLight(0x8a90b8, 0x3a3430, 1.1));
  const sun = new THREE.DirectionalLight(0xffc89a, 1.3);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 180 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  root.add(sun, sun.target);

  const ROAD = 0x55575c, ROAD2 = 0x4c4e53, GRASS = 0x3e5a34, TRACK = 0x8a4a3a, DECK = 0x7a7a76, HILL = 0x4a5a3a, STEP = 0x8a8680;
  buildGround(root, {
    colorAt(x, z, y, inside) {
      if (inside < -0.6) {
        if (z > -92 && z < -40 && y < HY + 1.5) return Math.abs(z + 66) < 0.3 || Math.abs(z + 58) < 0.3 ? 0xd8c860 : z > -82 ? ASPHALT : 0x5a5248;   // highway / ballast
        return y > 2 ? HILL : 0x3a4a30;
      }
      const id = PIECE_IDS[G.own[node(x, z)]];
      if (id === 'campus') return Math.abs(x) > 14 && z > -150 && z < -112 ? (Math.abs(x) > 20 ? TRACK : GRASS) : (Math.round(x / 2) + Math.round(z / 2)) & 1 ? ROAD : ROAD2;
      if (id === 'bridge' || id === 'bridgehead') return (Math.round(z) & 1) ? DECK : shade(DECK, 0.92);
      if (id === 'steps') return (Math.round(z * 1.5) & 1) ? STEP : shade(STEP, 0.85);
      return hash01(Math.round(x), Math.round(z), 3) < 0.2 ? shade(HILL, 1.15) : HILL;
    },
    // outside the walkable ground: the highway cutting 8 m below the bridge, gentle green banks elsewhere
    rise: (x, z, out) => (z > -100 && z < -32 ? HY - 0.6 : Math.min(5, out * 0.35)),
  });

  const boxes = [], glows = [];
  // ---- campus: generic low teaching blocks either side (lit windows), the sports ground's fence, trees, supply tables
  for (const sx of [-1, 1]) for (const [z, w, h, k] of [[-160, 14, 16, 1], [-130, 12, 22, 2], [-112, 16, 14, 3]]) {
    const t = tower(w, 12, h, k * 7 + (sx > 0 ? 3 : 0), { col: 0x8a8476, glass: 0x2a3038, litCol: 0xf2dcae, litP: 0.4 });
    boxes.push(...place(t.body, sx * (34 + w / 2), 0, z)); glows.push(...place(t.lit, sx * (34 + w / 2), 0, z));
  }
  for (const sx of [-1, 1]) for (let z = -150; z <= -112; z += 2.5) boxes.push(bx([0.08, 1.4, 0.08], [sx * 24, 0.7, z], 0x6a6e74));
  for (let k = 0; k < 14; k++) { const sx = k & 1 ? 1 : -1, z = -168 + (k >> 1) * 9; boxes.push(...place(tree(5 + hash01(k, 4) * 2, k), sx * 25.5, 0, z)); }
  for (const [x, z] of [[-10, -156], [10, -140], [-11, -124]]) {               // supply tables: helmets, bottles, umbrellas
    boxes.push(bx([3, 0.1, 1], [x, 0.85, z], 0xc8c0a8), bx([0.1, 0.8, 0.9], [x - 1.4, 0.4, z], 0x5a5a5a), bx([0.1, 0.8, 0.9], [x + 1.4, 0.4, z], 0x5a5a5a));
    for (let k = 0; k < 5; k++) boxes.push(bx([0.3, 0.25, 0.3], [x - 1.1 + k * 0.55, 1.03, z], [0xffd700, 0x2a2a2a, 0x5a8ab0][k % 3]));
    boxes.push(...umbrella([0x1a1a1a, 0xffd700, 0x3a6aa8][Math.abs(x + z) % 3], 2.1).map((q) => ({ ...q, p: [q.p[0] + x + 1.8, q.p[1], q.p[2] + z] })));
  }
  // ---- Bridge No. 2: railings both sides, lamp posts, the piers down to the highway
  for (const sx of [-1, 1]) {
    for (let z = -104; z <= -30; z += 1.5) boxes.push(bx([0.08, 1.1, 0.08], [sx * 5.1, 1.15, z], 0x7a7e84));
    boxes.push(bx([0.12, 0.1, 76], [sx * 5.1, 1.7, -67], 0x8a8e94), bx([0.12, 0.08, 76], [sx * 5.1, 1.0, -67], 0x8a8e94), bx([0.6, 0.8, 76], [sx * 5.4, 0.1, -67], CONCRETE));
    for (const z of [-96, -76, -56, -36]) { const L = streetLamp(5); boxes.push(...place(L.body, sx * 5.4, 0.6, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); glows.push(bx([0.5, 0.15, 0.5], [sx * 4.6, 5.6, z], 0xfff0c8)); }
  }
  boxes.push(bx([11, 1.2, 76], [0, -0.3, -67], shade(CONCRETE, 0.8)));             // the deck's slab
  for (const z of [-92, -66, -40]) for (const sx of [-1, 1]) boxes.push(bx([1.4, -HY + 0.6, 1.4], [sx * 3.5, (HY - 0.6) / 2, z], CONCRETE));   // piers
  // ---- the highway and railway below: barriers, lane lights; the far banks
  for (const z of [-82, -50]) boxes.push(bx([200, 0.8, 0.5], [0, HY + 0.4, z], CONCRETE));
  for (const z of [-92, -88]) boxes.push(bx([200, 0.15, 0.2], [0, HY + 0.2, z], 0x6a6e74));
  for (let x = -90; x <= 90; x += 15) glows.push(bx([0.4, 0.15, 0.4], [x, HY + 6, -66], 0xffd8a0)), boxes.push(bx([0.2, 6, 0.2], [x, HY + 3, -66], 0x5a5e64));
  // ---- the barricade line (always there: the low base; the stack itself rises with fx.barricade, below)
  for (let k = 0; k < 10; k++) boxes.push(...place(bricks(k), BAR[0] + 1 + k * 2, 0.6, BAR[3] - 0.5, hash01(k, 2) * 0.6));
  // ---- the steps and the hill: side walls, trees, a low wall at the edge over the highway, the harbour lights far off
  for (const sx of [-1, 1]) boxes.push(bx([0.5, 1.2, 36], [sx * 7.2, ground(sx * 7, 2) + 0.4, 2], 0x8a8680));
  for (let k = 0; k < 16; k++) { const a = hash01(k, 1), x = (k & 1 ? 1 : -1) * (12 + a * 9), z = 24 + hash01(k, 2) * 44; boxes.push(...place(tree(5 + a * 2, k + 30), x, 6, z)); }
  boxes.push(bx([44, 0.8, 0.5], [0, 6.4, 70.4], 0x8a8680));
  for (let k = 0; k < 60; k++) glows.push(bx([0.5, 0.5, 0.5], [-200 + hash01(k, 7) * 400, 1 + hash01(k, 8) * 6, 200 + hash01(k, 9) * 60], [0xffe0a0, 0xffffff, 0xffc070][k % 3]));

  const propMat = propMaterial();
  const props = new THREE.Mesh(merge(boxes), propMat); props.castShadow = props.receiveShadow = true; root.add(props);
  root.add(new THREE.Mesh(merge(glows), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(2.2, 2.1, 1.9) })));

  // ---- moving parts: the barricade stack, traffic, a train, canisters, cones, haze, rings
  const stackGeo = merge([...Array(9)].flatMap((_, k) => place(bin(k), BAR[0] + 1.2 + k * 2.2, 0, 0, hash01(k, 5) * 0.8)).concat([...Array(12)].flatMap((_, k) => place(bricks(k + 3), BAR[0] + 0.8 + k * 1.6, 1.0, 0.3, hash01(k, 6)))));
  const stack = new THREE.Mesh(stackGeo, propMat); stack.castShadow = true; stack.position.set(0, 0.6, BAR[3] + 0.6); root.add(stack);
  const carGeo = [0xb03a2a, 0xd8d8d0, 0x2a4a7a, 0x3a3a3a, 0xc8a040].map((c) => merge(car(c)));
  const cars = [...Array(10)].map((_, k) => { const m = new THREE.Mesh(carGeo[k % 5], propMat); root.add(m); return m; });
  const train = new THREE.Mesh(merge([0, 1, 2].flatMap((k) => place(trainCar(), 0, 0, (k - 1) * 23))), propMat);
  train.rotation.y = Math.PI / 2; root.add(train);
  const canGeo = new THREE.BoxGeometry(0.16, 0.16, 0.3), canMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.4, 1.6) });
  const cans = [...Array(14)].map(() => { const m = new THREE.Mesh(canGeo, canMat); m.visible = false; root.add(m); return m; });
  const coneGeo = merge(cone());
  const cones = [...Array(14)].map(() => { const m = new THREE.Mesh(coneGeo, propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });
  const haze = new THREE.CanvasTexture((() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return cv; })());
  const puffs = [...Array(42)].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haze, color: 0xb8c2b8, transparent: true, opacity: 0, depthWrite: false })); s.visible = false; root.add(s); return s; });
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, 0.6), transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide });
  const rings = [...Array(8)].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 32), ringMat); m.rotation.x = -Math.PI / 2; m.visible = false; root.add(m); return m; });
  const dbg = root.userData.debug = { cans: 0, cones: 0, smoking: 0, puffs: 0, barricade: 0, cars: 0, train: 0, rings: 0, gate: 0 };

  const tmp = new THREE.Vector3();
  let t = 0;
  return {
    fires: [],
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      sun.target.position.copy(tmp); sun.position.copy(SUN).multiplyScalar(80).add(tmp);
      const fx = game && game.story && game.story.fx;
      // traffic under the bridge (two carriageways), a train every 40 s on the railway
      cars.forEach((m, k) => { const dir = k & 1 ? 1 : -1, s = ((t * (14 + (k % 3) * 3) + k * 37) % 220) - 110; m.position.set(dir * s, HY, dir > 0 ? -72 + (k % 2) * 3 : -62 - (k % 2) * 3); m.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; });
      const tu = (t % 40) / 40; train.visible = tu < 0.5; train.position.set(-160 + tu * 640, HY, -90);
      // the barricade stack rises with the story; with no story it stands (free battle)
      const bar = fx ? fx.barricade ?? 1 : 1;
      stack.scale.y = Math.max(0.02, bar); stack.visible = bar > 0.01;
      // canisters: arc in over 30 f, then lie smoking; a cone over it once coned / out
      const gas = (fx && fx.gas) || [];
      let nc = 0, nk = 0, ns = 0, np = 0;
      cans.forEach((m, k) => {
        const g = gas[k]; m.visible = !!g && g.age > -30 && g.state !== 'spent' && g.haze > 0.02 || !!g && g.age > -30 && g.age < 0;
        if (!m.visible) return;
        const f = Math.max(0, -g.age / 30);
        m.position.set(g.x, ground(g.x, g.z) + 0.1 + f * 7 * Math.sin(Math.PI * (1 - f)), g.z - f * 12); m.rotation.y = k;
        nc++;
      });
      cones.forEach((m, k) => { const g = gas[k]; m.visible = !!g && (g.state === 'coned' || g.state === 'out') && g.haze > 0.01; if (m.visible) { nk++; m.position.set(g.x, ground(g.x, g.z), g.z); } });
      puffs.forEach((s, k) => {
        const g = gas[Math.floor(k / 3)], j = k % 3;
        if (!g || g.age < 0 || g.haze < 0.02) { s.visible = false; return; }
        if (j === 0 && (g.state === 'live' || g.state === 'coned')) ns++;
        const r = (1.0 + j * 0.9) * (0.4 + g.haze * 1.0);
        s.visible = true; np++;
        s.position.set(g.x + Math.sin(k * 2.1 + t * 0.3) * (0.6 + j * 0.8), ground(g.x, g.z) + 0.9 + j * 0.7 + Math.sin(t * 0.5 + k) * 0.2, g.z + Math.cos(k * 1.7 + t * 0.2) * (0.6 + j * 0.6));
        s.scale.set(r * 2.2, r * 1.4, 1); s.material.opacity = 0.3 * g.haze * (g.state === 'coned' ? 0.6 : 1);   // thin: a dozen clouds must not white out the bridge
      });
      const R = (fx && fx.rings) || [];
      let nr = 0;
      rings.forEach((m, k) => { const r = R[k]; m.visible = !!r; if (!r) return; nr++; m.position.set(r.x, ground(r.x, r.z) + 0.06, r.z); m.scale.setScalar(r.r); });
      Object.assign(dbg, { cans: nc, cones: nk, smoking: ns, puffs: np, barricade: +bar.toFixed(3), cars: cars.length, train: train.visible ? 1 : 0, rings: nr,
        gate: GATES.hillSteps && GATES.hillSteps.open ? 1 : 0, haze: fx ? +(fx.haze || 0).toFixed(3) : 0, putOut: fx ? fx.putOut || 0 : 0 });
    },
  };
}
