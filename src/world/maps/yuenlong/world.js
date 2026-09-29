// 元朗 Yuen Long's world builder (render-only; registered in the world registry, src/world/world.js). 21 July 2019,
// 22:45: the night street with shuttered shops and street lamps, the station entrance, the concourse (pillars, ticket
// machines, flickering ceiling lights: story fx.flicker), the fare-gate line (gate 'fareGates': the paddles swing open),
// the stairs (gate 'platformStairs': a roller shutter lifts) and the platform with the train that pulls in (fx.train:
// 0 away → 1 berthed, doors open while fx.doors). Phone torches glow among the passengers once the lights flicker. The
// passengers the story escorts ride fx.passengers. Generic station: no logo, signage or text. Never writes sim state.
import * as THREE from 'three';
import { GATES, ground, smooth, TERRAIN as G, PIECE_IDS, node } from '../../map.js';
import { buildGround } from '../hkkit/terrain.js';
import { place, merge, propMaterial, bx, tower, streetLamp } from '../hkkit/props.js';
import { hash01 } from '../../../core/rng.js';
import { shade } from '../../../core/voxel.js';

const SHADOW_BOX = 30, MOON = new THREE.Vector3(-0.3, 0.8, 0.5).normalize();
const NIGHT = new THREE.Color(0x10161f), FOG = new THREE.Color(0x222a36);
/** A passenger (+Z forward): office clothes in muted colours, a bag. */
const passenger = (k) => { const c = [0x5a6470, 0x7a7266, 0x4a5a4a, 0x6a5a6a, 0x8a8478][k % 5];
  return [bx([0.42, 0.8, 0.26], [0, 0.4, 0], 0x2e3238), bx([0.48, 0.66, 0.3], [0, 1.15, 0], c), bx([0.26, 0.26, 0.26], [0, 1.62, 0], 0xe0b28a),
    bx([0.28, 0.12, 0.28], [0, 1.8, -0.02], 0x1c1814), bx([0.22, 0.3, 0.1], [0.3, 1.0, 0], 0x3a2a1c)]; };

export function buildYuenlong(scene, root) {
  scene.background = NIGHT.clone();
  scene.fog = new THREE.Fog(FOG.clone(), 28, 170);
  root.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), new THREE.MeshBasicMaterial({ color: 0x121822, side: THREE.BackSide, fog: false, depthWrite: false })), { renderOrder: -1, frustumCulled: false }));
  const hemi = new THREE.HemisphereLight(0x8a9cc8, 0x4a4036, 2.5); root.add(hemi);
  const moon = new THREE.DirectionalLight(0xc0d0f0, 2.2);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 160 });
  moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.03;
  root.add(moon, moon.target);

  const ASP = 0x2e3036, TILE = 0x7a7870, TILE2 = 0x6e6c66, PLAT = 0x74746e, EDGE = 0xb8962a;   // critic r1: interiors read washed out
  buildGround(root, {
    colorAt(x, z, y, inside) {
      if (inside < -0.6) return 0x2a2c30;
      const id = PIECE_IDS[G.own[node(x, z)]];
      if (id === 'street') return Math.abs(Math.abs(x) - 9) < 0.3 && (Math.floor(z / 3) & 1) ? 0xd8d8cc : ASP;
      if (id === 'platform') return Math.abs(x - 6.4) < 0.5 ? EDGE : PLAT;
      if (id === 'stairs') return (Math.round(z) & 1) ? TILE : shade(TILE, 0.85);
      return (Math.round(x) + Math.round(z)) & 1 ? TILE : TILE2;
    },
    rise: (x, z, out) => (x > 6.5 && z > 3 ? -1.4 : Math.min(4, out * 0.5)),   // the track pit beside the platform
  });

  const boxes = [], lit = [], glows = [];
  // street: shop fronts with roller shutters either side, low-rise blocks above, towers behind
  for (let z = -152; z < -86; z += 8) for (const sx of [-1, 1]) {
    const k = (z + 200) * 3 + sx;
    boxes.push(bx([4, 4, 7.6], [sx * 20.5, 2, z + 4], 0x6a6a70), bx([0.2, 3.2, 7], [sx * 18.4, 1.7, z + 4], (k & 1) ? 0x8a8e94 : 0x7a7e84));
    const t = tower(8, 8, 18 + hash01(k, 1) * 20, k); boxes.push(...place(t.body, sx * 24, 4, z + 4)); lit.push(...place(t.lit, sx * 24, 4, z + 4));
  }
  const lampAt = [];
  for (let z = -150; z < -86; z += 16) for (const sx of [-1, 1]) { const x = sx * 17.5, L = streetLamp(7); boxes.push(...place(L.body, x, 0, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); glows.push(...place(L.glow, x, 0, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); lampAt.push([x - sx * 1.7, 6.6, z]); }
  // station shell: the entrance canopy, concourse walls (cutaway), pillars, ticket machines
  boxes.push(bx([40, 1, 4], [0, 11, -89], 0x5a5e66), bx([2, 11, 1], [-20, 5.5, -88], 0x5a5e66), bx([2, 11, 1], [20, 5.5, -88], 0x5a5e66));   // entrance frame, high (camera clearance)
  for (const sx of [-1, 1]) {
    boxes.push(bx([1, 6, 52], [sx * 23, 3, -62], 0xb8b4ac), bx([1, 6, 28], [sx * 16, 3, -24], 0xb8b4ac));
    for (const z of [-75, -51]) boxes.push(bx([2, 6, 2], [sx * 11, 3, z], 0xc8c4bc));
    for (let k = 0; k < 4; k++) boxes.push(bx([1.2, 1.8, 0.8], [sx * 21.8, 1.1, -80 + k * 3], 0x3a5a7a), bx([0.8, 0.5, 0.1], [sx * 21.35, 1.4, -80 + k * 3], 0x9ad0f0));
  }
  // fare-gate cabinets (the paddles are separate: they swing), the stair walls, platform canopy, the far track wall
  for (let k = 0; k < 11; k++) boxes.push(bx([0.5, 1.1, 2.2], [-13 + k * 2.6, 0.75, -26], 0x8a8e96), bx([0.52, 0.08, 2.2], [-13 + k * 2.6, 1.34, -26], 0x3a3e46));
  for (const sx of [-1, 1]) boxes.push(bx([1, 4, 14], [sx * 8.5, 2, -3], 0xb8b4ac));
  for (let z = 4; z < 74; z += 6) boxes.push(bx([0.3, 5, 0.3], [6.8, ground(0, z) + 2.5, z], 0x6a6e74));
  boxes.push(bx([6, 0.3, 72], [9, ground(0, 30) + 5.2, 38], 0x5a5e66), bx([1, 5, 72], [-8, ground(0, 30) + 1, 38], 0xb8b4ac));   // canopy over the track side only (the camera rides over the platform)
  { const ty = ground(0, 30) - 1.4; boxes.push(bx([5, 0.3, 80], [10.5, ty + 0.05, 36], 0x2a2a2c), bx([0.2, 0.2, 80], [9.7, ty + 0.3, 36], 0x6a6a6a), bx([0.2, 0.2, 80], [11.3, ty + 0.3, 36], 0x6a6a6a)); }   // trackbed + rails
  for (let z = -86; z < -36; z += 10) for (const sx of [-1, 1]) { glows.push(bx([1.4, 0.15, 1.4], [sx * 8, 5.9, z], 0xf0f4ff)); lampAt.push([sx * 8, 5.6, z]); }
  for (let z = 8; z < 74; z += 12) { glows.push(bx([1.4, 0.15, 1.4], [8, ground(0, z) + 5, z], 0xf0f4ff)); lampAt.push([6, ground(0, z) + 4.8, z]); }
  const propMat = propMaterial();
  const props = new THREE.Mesh(merge(boxes), propMat); props.castShadow = props.receiveShadow = true; root.add(props);
  root.add(new THREE.Mesh(merge(lit), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(0.95, 0.9, 0.8) })));
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(3, 2.8, 2.4) });
  root.add(new THREE.Mesh(merge(glows), glowMat));

  // ---- fare-gate paddles (swing open), the stair shutter (lifts), the train (slides in, doors open)
  const paddleGeo = merge([bx([0.9, 0.7, 0.06], [0.45, 1.0, 0], 0xb8d4e0)]);
  const paddles = [...Array(10)].map((_, k) => { const g = new THREE.Group(); g.position.set(-12.75 + k * 2.6, 0, -26); g.add(new THREE.Mesh(paddleGeo, propMat)); root.add(g); return g; });
  const shutter = new THREE.Mesh(merge([...[...Array(12)].map((_, k) => bx([10, 0.3, 0.1], [0, 0.15 + k * 0.32, 0], k & 1 ? 0x8a8e94 : 0x7a7e84))]), propMat);
  shutter.position.set(0, 0.2, -8); root.add(shutter);
  const train = new THREE.Group(); root.add(train);
  const carGeo = merge([bx([3.2, 3.4, 22], [0, 1.7, 0], 0xd8dad8), bx([3.22, 1.1, 20], [0, 2.3, 0], 0x2a3440), bx([3.24, 0.3, 22], [0, 0.7, 0], 0x5a8a6a)]);
  const doorGeo = merge([bx([0.1, 2.3, 1.4], [0, 1.4, 0], 0xc8cac8), bx([0.12, 1.1, 0.5], [0, 2.1, 0], 0x2a3440)]);
  const doorsL = [];
  for (let c = 0; c < 4; c++) { const car = new THREE.Mesh(carGeo, propMat); car.position.set(0, 0, c * 22.4); train.add(car);
    for (const dz of [-6, 0, 6]) { const d = new THREE.Mesh(doorGeo, propMat); d.position.set(-1.62, 0, c * 22.4 + dz); train.add(d); doorsL.push(d); } }
  const trainLight = new THREE.PointLight(0xe8f0ff, 0, 30, 1.4); root.add(trainLight);
  // phone torches: small cold points bobbing over the platform / concourse once the lights flicker
  const TN = 40, tpos = new Float32Array(TN * 3), tgeo = new THREE.BufferGeometry(); tgeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3));
  const torches = new THREE.Points(tgeo, new THREE.PointsMaterial({ color: new THREE.Color(3, 3, 3.2), size: 0.22, depthWrite: false })); torches.frustumCulled = false; torches.visible = false; root.add(torches);
  const lights = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xfff0e0, 0, 24, 1.6); root.add(l); return l; });
  const stageKey = new THREE.PointLight(0xffc080, 24, 14, 2); stageKey.position.set(-6, 3, -136); stageKey.name = 'stage-key'; root.add(stageKey);
  const paxGeo = [0, 1, 2, 3, 4].map((k) => merge(passenger(k)));
  const pax = [...Array(10)].map((_, k) => { const m = new THREE.Mesh(paxGeo[k % 5], propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });

  const tmp = new THREE.Vector3();
  let t = 0, fg = 0, sh = 0;
  return {
    fires: [],
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      moon.target.position.copy(tmp); moon.position.copy(MOON).multiplyScalar(70).add(tmp);
      const fx = game && game.story && game.story.fx, flick = !!(fx && fx.flicker);
      // flicker: the concourse lights stutter (a fixed stutter pattern on the clock), the phone torches come on
      const on = !flick || (Math.sin(t * 23) + Math.sin(t * 7.3) > -0.6);
      glowMat.color.setScalar(on ? 2.8 : 0.4);
      const near = lampAt.slice().sort((a, b) => (a[0] - focus.x) ** 2 + (a[2] - focus.z) ** 2 - (b[0] - focus.x) ** 2 - (b[2] - focus.z) ** 2);
      lights.forEach((l, n) => { const p = near[n]; l.position.set(p[0], p[1], p[2]); l.intensity = (on ? 40 : 6) * (1 - smooth(26, 44, Math.hypot(p[0] - focus.x, p[2] - focus.z))); });
      hemi.intensity = on ? 2.5 : 1.6;
      torches.visible = flick;
      if (flick) { for (let k = 0; k < TN; k++) { const x = focus.x + (hash01(k, 1) - 0.5) * 30, z = focus.z + (hash01(k, 2) - 0.5) * 30; tpos[k * 3] = x; tpos[k * 3 + 1] = ground(x, z) + 1.4 + Math.sin(t * 2 + k) * 0.2; tpos[k * 3 + 2] = z; } tgeo.attributes.position.needsUpdate = true; }
      // gates
      fg += ((GATES.fareGates && GATES.fareGates.open ? 1 : 0) - fg) * Math.min(1, dt * 3);
      paddles.forEach((g) => { g.rotation.y = fg * 1.4; });
      sh += ((GATES.platformStairs && GATES.platformStairs.open ? 1 : 0) - sh) * Math.min(1, dt * 1.2);
      shutter.position.y = 0.2 + sh * 4; shutter.visible = sh < 0.98;
      // the train: slides in along x ≈ 10.5, doors slide open
      const tr = fx && fx.train != null ? fx.train : 0, doors = !!(fx && fx.doors);
      train.visible = tr > 0.01;
      train.position.set(10.5, ground(0, 30) - 1.1, 2 - (1 - tr) * 120);
      doorsL.forEach((d, k) => { d.position.x = -1.62 - (doors ? 0.3 : 0); d.visible = !doors || k % 3 !== 1; });
      trainLight.intensity = tr * 40; trainLight.position.set(9, ground(0, 30) + 2, 30);
      stageKey.intensity = 22 + Math.sin(t * 17.3) * 2;
      pax.forEach((m, k) => { const e = fx && fx.passengers && fx.passengers[k]; m.visible = !!(e && e.on);
        if (m.visible) { m.position.set(e.x, ground(e.x, e.z) + (e.moving ? Math.abs(Math.sin(t * 8 + k)) * 0.05 : 0), e.z); m.rotation.y = e.yaw; } });
    },
  };
}
