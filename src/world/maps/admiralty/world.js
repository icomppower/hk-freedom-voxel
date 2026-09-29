// 金鐘 Admiralty's world builder (render-only; registered in the world registry, src/world/world.js). June 2019, night,
// rain: the six-lane highway between lit office towers with its lane markings and roadside jersey barriers, dropped
// umbrellas and an abandoned bus; two concrete footbridges over the road (their pillars are carved set pieces); the police
// line of crowd barriers under them (moved aside when gate 'policeLine' opens); the government HQ forecourt and its
// sliding gate (gate 'hqGate'); the lawn slope with trees, the harbour beyond. Rain streaks round the camera; sodium street
// lamps (the nearest four lit). Story fx (hk1.js script): gas canisters and their drifting haze banks (fx.gas), the
// stretcher groups (fx.stretchers). Never writes sim state.
import * as THREE from 'three';
import { GATES, ground, routeDist, smooth, TERRAIN as G, PIECE_IDS, node } from '../../map.js';
import { buildGround } from '../hkkit/terrain.js';
import { place, merge, propMaterial, bx, tower, jersey, crowdBarrier, streetLamp, umbrella, footbridge, bus, tree, canister, stretcherGroup, bambooBarricade } from '../hkkit/props.js';
import { hash01 } from '../../../core/rng.js';
import { shade } from '../../../core/voxel.js';

const SHADOW_BOX = 30, MOON = new THREE.Vector3(-0.3, 0.8, 0.52).normalize();
const NIGHT = new THREE.Color(0x141c2c), FOG = new THREE.Color(0x2a3444);
const UMB = [0xffd700, 0x2a2a2a, 0x3a6ab0, 0xe8e8e8, 0xd0402a, 0x6a3a8a, 0x2a8a5a];

function nightSky() {
  const geo = new THREE.SphereGeometry(900, 32, 16), col = [], p = geo.attributes.position, c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const h = Math.max(0, p.getY(i) / 900); c.setRGB(0.1 + 0.12 * (1 - h) ** 3, 0.09 + 0.08 * (1 - h) ** 3, 0.14 + 0.06 * (1 - h)); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -1; sky.frustumCulled = false;
  return sky;                                                         // overcast city night: orange-lit cloud base low down
}

export function buildAdmiralty(scene, root) {
  scene.background = NIGHT.clone();
  scene.fog = new THREE.Fog(FOG.clone(), 30, 190);
  root.add(nightSky());
  root.add(new THREE.HemisphereLight(0x8a9cc8, 0x4a4036, 2.5));
  const moon = new THREE.DirectionalLight(0xc0d0f0, 2.6);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 160 });
  moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.03;
  root.add(moon, moon.target);

  // ---- ground: wet asphalt with lane markings on the highway, paving in the forecourt, grass on the lawn
  const ASP = 0x2e3036, ASP_W = 0x3a3e46, LINE = 0xd8d8cc, YEL = 0x5a5236, PAVE = 0x6a6660, GRASS = 0x3a5a30, KERB = 0x7a7a74, HILL = 0x3a3c40;
  buildGround(root, {
    sea: { y: -3, color: 0x10202e },
    colorAt(x, z, y, inside, out) {
      if (inside < -0.6) return out > 8 ? 0x2a2c30 : HILL;
      const id = PIECE_IDS[G.own[node(x, z)]];
      if (id === 'road' || id === 'underpass') {
        const ax = Math.abs(x);
        if (ax > 18.5) return KERB;
        if (Math.abs(ax - 6) < 0.3 || Math.abs(ax - 12) < 0.3) return ((Math.floor(z / 3) & 1) ? LINE : ASP);   // dashed lane lines
        if (ax < 1 && (Math.floor(z / 2) & 1)) return YEL;                                                     // dashed centre line (dim: it blooms)
        return hash01(Math.round(x), Math.round(z), 3) < 0.25 ? ASP_W : ASP;                                    // wet sheen
      }
      if (id === 'forecourt') return (Math.round(x) + Math.round(z)) & 1 ? PAVE : shade(PAVE, 0.92);
      if (id === 'slope' || id === 'lawn') return routeDist(x, z) < 1.6 ? PAVE : hash01(Math.round(x), Math.round(z), 5) < 0.2 ? 0x44663a : GRASS;
      return ASP;
    },
    rise: (x, z, out) => Math.min(3, out * 0.4),
  });

  const boxes = [], lit = [], glows = [];
  // towers either side of the highway and round the forecourt (outside the walk field)
  const TOWERS = [];
  for (let z = -170; z < 40; z += 17) for (const sx of [-1, 1]) {
    const k = TOWERS.length, w = 12 + hash01(k, 1) * 8, d = 12 + hash01(k, 2) * 6, h = 30 + hash01(k, 3) * 70;
    TOWERS.push([sx * (34 + hash01(k, 4) * 10), z + hash01(k, 5) * 6, w, d, h, k]);
  }
  for (const [x, z, w, d, h, k] of TOWERS) {
    const t = tower(w, d, h, k, { col: [0x4a4e56, 0x55565c, 0x3e444e, 0x5e5a54][k % 4] });
    boxes.push(...place(t.body, x, ground(x, z), z)); lit.push(...place(t.lit, x, ground(x, z), z));
  }
  // the government HQ: two big blocks either side of the gate, joined high up (an open-door silhouette), no emblem
  for (const sx of [-1, 1]) boxes.push(bx([22, 44, 16], [sx * 36, 22, 32], 0x5a6068), bx([2, 44, 16.2], [sx * 25.5, 22, 32], 0x3a4048));
  boxes.push(bx([50, 6, 16], [0, 47, 32], 0x5a6068));
  lit.push(...[...Array(40)].map((_, k) => bx([1.4, 1.2, 0.1], [(k % 2 ? -1 : 1) * (28 + (k % 8) * 2.2), 8 + Math.floor(k / 8) * 7, 23.9], 0xfff0c8)));
  // jersey barriers along both road edges, dropped umbrellas, bamboo barricades, the bus
  for (let z = -150; z < -72; z += 3.2) for (const sx of [-1, 1]) boxes.push(...place(jersey(3), sx * 19.4, 0, z));
  for (let k = 0; k < 70; k++) {
    const x = (hash01(k, 11) - 0.5) * 34, z = -150 + hash01(k, 12) * 120;
    if (Math.abs(x) < 2.5) continue;
    boxes.push(...place(umbrella(UMB[k % UMB.length], 0.3, 1.2 + hash01(k, 13)), x, ground(x, z), z, hash01(k, 14) * 6));
  }
  for (let k = 0; k < 24; k++) { const x = (hash01(k, 31) - 0.5) * 34, z = -140 + hash01(k, 32) * 100; boxes.push(...place(canister(), x, ground(x, z), z, hash01(k, 33) * 6)); }
  for (const [x, z, yaw] of [[-14, -128, 0.2], [13, -104, -0.3], [-12, -84, 0.1]]) boxes.push(...place(bambooBarricade(7, x | 0), x, 0, z, yaw));
  boxes.push(...place(bus(), -26, 0, -96, 0.1));
  // the footbridges (pillars carved at x ±6, z −58 / −36)
  for (const z of [-58, -36]) boxes.push(...place(footbridge(64, 6.2, 6), 0, 0, z));
  // street lamps (glow boxes separate, lights on the nearest four)
  const lampAt = [];
  for (let z = -150; z < 20; z += 20) for (const sx of [-1, 1]) { const x = sx * 21, L = streetLamp(8); boxes.push(...place(L.body, x, ground(x, z), z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); glows.push(...place(L.glow, x, ground(x, z), z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); lampAt.push([x - sx * 1.7, ground(x, z) + 7.6, z]); }
  // forecourt planters, lawn trees, the harbour railing at the far edge
  for (const sx of [-1, 1]) for (const z of [-14, 16]) boxes.push(bx([3, 0.8, 3], [sx * 16, 0.7, z], 0x6a6660), ...place(tree(4, z), sx * 16, 1.1, z));
  for (let k = 0; k < 22; k++) { const a = hash01(k, 41) * Math.PI * 2, r = 12 + hash01(k, 42) * 18, x = Math.sin(a) * r, z = 72 + Math.cos(a) * r * 0.9;
    if (Math.abs(x) < 4 && z < 80) continue; boxes.push(...place(tree(5 + hash01(k, 43) * 2, k), x, ground(x, z), z)); }
  for (let x = -30; x <= 30; x += 2) boxes.push(bx([0.08, 1.1, 0.08], [x, ground(x, 102) + 0.55, 102.5], 0x9aa0a8));
  boxes.push(bx([62, 0.08, 0.08], [0, ground(0, 102) + 1.05, 102.5], 0x9aa0a8));
  const propMat = propMaterial();
  const props = new THREE.Mesh(merge(boxes), propMat); props.castShadow = props.receiveShadow = true; root.add(props);
  const litMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(0.95, 0.9, 0.8) });
  root.add(new THREE.Mesh(merge(lit), litMat));
  const glowMesh = new THREE.Mesh(merge(glows), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(3, 2.2, 1.2) })); root.add(glowMesh);

  // ---- the police line: crowd barriers across the underpass (+ a wall of riot shields), slid aside when it opens
  const lineGeo = merge([...[...Array(8)].flatMap((_, k) => place(crowdBarrier(), -8.4 + k * 2.4, 0, 0)),
    ...[...Array(10)].map((_, k) => bx([0.9, 1.3, 0.08], [-8.1 + k * 1.8, 0.95, -0.9], 0x7e96a8))]);
  const policeLine = new THREE.Mesh(lineGeo, propMat); policeLine.position.set(0, 0, -48); policeLine.castShadow = true; root.add(policeLine);
  // the HQ gate: two sliding steel leaves in the gatehouse opening
  const leafGeo = merge([bx([5, 3.2, 0.2], [0, 1.6, 0], 0x5a5e66), ...[...Array(8)].map((_, k) => bx([0.1, 3, 0.26], [-2.2 + k * 0.63, 1.6, 0], 0x3a3e46))]);
  const leaves = [-1, 1].map((sx) => { const m = new THREE.Mesh(leafGeo, propMat); m.position.set(sx * 2.5, 0.3, 6); m.castShadow = true; root.add(m); return m; });

  // ---- lights: the four nearest street lamps; a cool key on the stage; HQ floodlight
  const lights = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xffb060, 0, 26, 1.6); root.add(l); return l; });
  const stageKey = new THREE.PointLight(0xffc080, 26, 14, 2); stageKey.position.set(-6, 3, -132); stageKey.name = 'stage-key'; root.add(stageKey);
  const flood = new THREE.PointLight(0xe8f0ff, 40, 40, 1.4); flood.position.set(0, 12, 14); root.add(flood);

  // ---- rain: streaks in a box round the focus, falling and wrapping (render-only, vrng-free: a fixed hash scatter)
  const RN = 1400, rp = new Float32Array(RN * 6), rs = new Float32Array(RN * 3);
  for (let i = 0; i < RN; i++) { rs[i * 3] = hash01(i, 1) * 40 - 20; rs[i * 3 + 1] = hash01(i, 2) * 16; rs[i * 3 + 2] = hash01(i, 3) * 40 - 20; }
  const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rgeo, new THREE.LineBasicMaterial({ color: 0x9aaac0, transparent: true, opacity: 0.35, depthWrite: false }));
  rain.frustumCulled = false; root.add(rain);

  // ---- tear gas: drifting haze banks (soft sprites) where the script's canisters land; a green-white glow on each canister
  const haze = new THREE.CanvasTexture((() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return cv; })());
  const puffs = [...Array(36)].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haze, color: 0xc8d0c0, transparent: true, opacity: 0, depthWrite: false })); s.visible = false; root.add(s); return s; });
  const cans = [...Array(12)].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.4, 1.6) })); m.visible = false; root.add(m); return m; });
  // ---- stretcher groups (story fx.stretchers)
  const strGeo = merge(stretcherGroup());
  const stretchers = [...Array(5)].map(() => { const m = new THREE.Mesh(strGeo, propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });

  const tmp = new THREE.Vector3();
  let t = 0, lineOpen = 0, gateOpen = 0;
  return {
    fires: [],
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      moon.target.position.copy(tmp); moon.position.copy(MOON).multiplyScalar(70).add(tmp);
      // lamps nearest the focus
      const near = lampAt.slice().sort((a, b) => (a[0] - focus.x) ** 2 + (a[2] - focus.z) ** 2 - (b[0] - focus.x) ** 2 - (b[2] - focus.z) ** 2);
      lights.forEach((l, n) => { const p = near[n]; l.position.set(p[0], p[1], p[2]); l.intensity = 70 * (1 - smooth(30, 50, Math.hypot(p[0] - focus.x, p[2] - focus.z))); });
      stageKey.intensity = 24 + Math.sin(t * 17.3) * 2;
      // gates
      lineOpen += ((GATES.policeLine && GATES.policeLine.open ? 1 : 0) - lineOpen) * Math.min(1, dt * 1.5);
      policeLine.position.x = lineOpen * 16; policeLine.rotation.y = lineOpen * 0.4; policeLine.visible = lineOpen < 0.98;
      gateOpen += ((GATES.hqGate && GATES.hqGate.open ? 1 : 0) - gateOpen) * Math.min(1, dt * 1.2);
      leaves.forEach((m, k) => { m.position.x = (k ? 1 : -1) * (2.5 + gateOpen * 5); });
      // rain round the focus
      const a = rgeo.attributes.position;
      for (let i = 0; i < RN; i++) {
        const y = (rs[i * 3 + 1] - t * 14) % 16, yy = y < 0 ? y + 16 : y, x = focus.x + rs[i * 3], z = focus.z + rs[i * 3 + 2], gy = ground(focus.x, focus.z);
        a.setXYZ(i * 2, x, gy + yy, z); a.setXYZ(i * 2 + 1, x + 0.05, gy + yy + 0.6, z + 0.02);
      }
      a.needsUpdate = true;
      // story fx: gas, stretchers
      const fx = game && game.story && game.story.fx, gas = (fx && fx.gas) || [];
      puffs.forEach((s, k) => {
        const g = gas[Math.floor(k / 3)], j = k % 3;
        if (!g || g.age < 0 || g.age > 900) { s.visible = false; return; }
        const u = g.age / 900, r = 3 + j * 1.5 + u * 6;
        s.visible = true; s.position.set(g.x + Math.sin(k * 2.1 + t * 0.2) * (1 + u * 3) + u * 4, ground(g.x, g.z) + 1.2 + j * 0.6 + u * 1.5, g.z + Math.cos(k * 1.7) * (1 + u * 2));
        s.scale.set(r * 2, r * 1.2, 1); s.material.opacity = 0.42 * Math.min(1, g.age / 30) * (1 - u);
      });
      cans.forEach((m, k) => { const g = gas[k]; m.visible = !!g && g.age >= 0 && g.age < 600;
        if (m.visible) { const f = Math.max(0, 1 - g.age / 40); m.position.set(g.x - f * (g.dx || 0), ground(g.x, g.z) + 0.15 + f * 6 * Math.sin(Math.PI * (1 - f)), g.z - f * 14); } });
      stretchers.forEach((m, k) => { const s = fx && fx.stretchers && fx.stretchers[k]; m.visible = !!(s && s.on);
        if (m.visible) { m.position.set(s.x, ground(s.x, s.z) + Math.abs(Math.sin(t * 7 + k)) * 0.04, s.z); m.rotation.y = s.yaw; } });
    },
  };
}
