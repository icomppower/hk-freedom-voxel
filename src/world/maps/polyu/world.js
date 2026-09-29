// 理工大學 PolyU's world builder (render-only; registered in the world registry, src/world/world.js). November 2019,
// night: the campus podium between red-brick blocks, bamboo and furniture barricades; the footbridge over the road (the
// road far below, lit by street lamps); the burning barricade across the bridge's far end (gate 'barricade': burns down
// when it opens); the water-cannon truck beyond it (story fx.cannon: its blue-dye jet sweeping, fx.jet); inside the main
// gate (gate 'mainGate': iron leaves swing), the rope point on the east railing with ropes over the edge and motorbikes
// waiting on the road below (fx.escape: the escape group, fx.roped); the ramp and the rooftop with barricade fires, the
// Bear's arena. Lights out (fx.dark, the Bear's phase 3): every lamp dies and only the barricade fires light the fight.
// Generic campus: no signage, emblem or text. Never writes sim state.
import * as THREE from 'three';
import { GATES, ground, smooth, TERRAIN as G, PIECE_IDS, node, MAP } from '../../map.js';
import { buildGround } from '../hkkit/terrain.js';
import { place, merge, propMaterial, bx, tower, streetLamp, bambooBarricade, crowdBarrier, umbrella } from '../hkkit/props.js';
import { hash01 } from '../../../core/rng.js';
import { shade } from '../../../core/voxel.js';

const SHADOW_BOX = 30, MOON = new THREE.Vector3(-0.3, 0.8, 0.5).normalize();
const NIGHT = new THREE.Color(0x100e14), FOG = new THREE.Color(0x2a2226);
const BRICK = 0x8a3a2a, BRICK_D = 0x6a2a1e;
const figure = (k) => [bx([0.42, 0.8, 0.26], [0, 0.4, 0], 0x1c1c1c), bx([0.48, 0.66, 0.3], [0, 1.15, 0], 0x181818), bx([0.26, 0.26, 0.26], [0, 1.62, 0], 0xf1c27d),
  bx([0.3, 0.1, 0.3], [0, 1.82, 0], k % 2 ? 0xffd700 : 0x2a2a2a), bx([0.3, 0.4, 0.14], [0, 1.2, -0.22], 0x2a2a2a)];
/** Red-brick campus block: brick body with darker courses, window strips (some lit), a flat roof. */
function brickBlock(w, d, h, seed) {
  const body = [bx([w, h, d], [0, h / 2, 0], BRICK)], lit = [];
  for (let y = 3; y < h - 1; y += 3.2) {
    body.push(bx([w + 0.06, 0.25, d + 0.06], [0, y, 0], BRICK_D));
    for (const sgn of [-1, 1]) (hash01(seed, y | 0, sgn + 3) < 0.3 ? lit : body).push(bx([w * 0.8, 1.1, 0.08], [0, y + 1.3, sgn * (d / 2 + 0.03)], hash01(seed, y | 0, sgn + 3) < 0.3 ? 0xffe0a0 : 0x2a2a30));
  }
  body.push(bx([w + 0.4, 0.5, d + 0.4], [0, h + 0.25, 0], 0x5a5a5e));
  return { body, lit };
}

export function buildPolyu(scene, root) {
  scene.background = NIGHT.clone();
  scene.fog = new THREE.Fog(FOG.clone(), 26, 170);
  root.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), new THREE.MeshBasicMaterial({ color: 0x16121a, side: THREE.BackSide, fog: false, depthWrite: false })), { renderOrder: -1, frustumCulled: false }));
  const hemi = new THREE.HemisphereLight(0x8a90c0, 0x4a3a30, 2.4); root.add(hemi);
  const moon = new THREE.DirectionalLight(0xc0c8f0, 2.2);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 160 });
  moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.03;
  root.add(moon, moon.target);

  const PAVE = 0x6a6258, DECK = 0x7a7a74, ROAD = 0x2e3036, ROOF = 0x5a5a5c;
  buildGround(root, {
    colorAt(x, z, y, inside) {
      const id = inside < -0.6 ? null : PIECE_IDS[G.own[node(x, z)]];
      if (!id) return z > -88 && z < -34 && Math.abs(x) > 8 && Math.abs(x) < 26 ? ROAD : 0x2c2a2c;
      if (id === 'bridge') return Math.abs(x) > 5.3 ? 0x9a9a94 : DECK;
      if (id === 'roof' || id === 'ramp') return (Math.round(x) + Math.round(z)) & 1 ? ROOF : shade(ROOF, 0.92);
      return (Math.round(x / 2) + Math.round(z / 2)) & 1 ? PAVE : shade(PAVE, 0.9);
    },
    // the road far below the footbridge; the gate yard's east edge drops to the road too (the rope point)
    rise: (x, z, out) => (z > -90 && z < -32 && Math.abs(x) > 7 ? -7 : x > 22 && z > -36 && z < 24 ? -6 : Math.min(5, out * 0.6)),
  });

  const boxes = [], lit = [], glows = [];
  // campus blocks round the podium and the gate yard, towers of Hung Hom behind
  for (const [x, z, w, d, h] of [[-38, -130, 20, 30, 24], [38, -130, 20, 30, 20], [-36, -100, 16, 20, 30], [38, -98, 18, 18, 26],
    [-34, -10, 20, 40, 28], [36, 40, 20, 50, 16], [-34, 50, 20, 60, 16], [0, 108, 50, 12, 18]]) {
    const k = x * 3 + z, B = brickBlock(w, d, h, k); boxes.push(...place(B.body, x, ground(x, z) - 1, z)); lit.push(...place(B.lit, x, ground(x, z) - 1, z));
  }
  for (let k = 0; k < 12; k++) { const sx = k % 2 ? 1 : -1, x = sx * (70 + hash01(k, 1) * 30), z = -160 + k * 24, t = tower(16, 16, 40 + hash01(k, 2) * 50, k + 90); boxes.push(...place(t.body, x, -6, z)); lit.push(...place(t.lit, x, -6, z)); }
  // footbridge railings + roof frame, the road below with lamps
  for (const sx of [-1, 1]) boxes.push(bx([0.2, 1.2, 54], [sx * 6.1, ground(0, -61) + 0.6, -61], 0x9aa0a8), bx([0.6, 0.6, 54], [sx * 6.1, ground(0, -61) + 3.6, -61], 0x5a5e64));
  const lampAt = [];
  for (let z = -86; z < -34; z += 13) for (const sx of [-1, 1]) { const x = sx * 14, L = streetLamp(8); boxes.push(...place(L.body, x, -5.5, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); glows.push(...place(L.glow, x, -5.5, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); lampAt.push([x - sx * 1.7, 2.1, z]); }
  for (let z = -150; z < -88; z += 20) for (const sx of [-1, 1]) { const x = sx * 24, L = streetLamp(7); boxes.push(...place(L.body, x, 1, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); glows.push(...place(L.glow, x, 1, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); lampAt.push([x - sx * 1.7, 7.6, z]); }
  // podium barricades (bamboo, crowd barriers, dropped umbrellas), rooftop barricades, the rope railing, motorbikes
  for (const [x, z, yaw] of [[-12, -128, 0.2], [14, -118, -0.3], [-6, -100, 0.1], [10, -94, 0]]) boxes.push(...place(bambooBarricade(7, x | 0), x, 1, z, yaw));
  for (let k = 0; k < 10; k++) { const x = (hash01(k, 3) - 0.5) * 44, z = -150 + hash01(k, 4) * 60; boxes.push(...place(crowdBarrier(), x, 1, z, hash01(k, 5) * 3)); }
  for (let k = 0; k < 24; k++) { const x = (hash01(k, 6) - 0.5) * 46, z = -150 + hash01(k, 7) * 62; boxes.push(...place(umbrella([0xffd700, 0x2a2a2a, 0x3a6ab0][k % 3], 0.3, 1.3), x, 1, z, hash01(k, 8) * 6)); }
  const ROOF_FIRES = [[-18, 56], [18, 58], [-16, 88], [16, 90], [0, 96]];
  for (const [x, z] of ROOF_FIRES) boxes.push(...place(bambooBarricade(5, (x + z) | 0), x, 7, z, Math.atan2(-x, 70 - z)));
  for (let z = 0; z <= 24; z += 2) boxes.push(bx([0.1, 1.1, 0.1], [22.2, 1.05, z], 0x9aa0a8));
  boxes.push(bx([0.1, 0.1, 24], [22.2, 1.6, 12], 0x9aa0a8));
  for (let k = 0; k < 4; k++) boxes.push(bx([0.05, 7, 0.05], [22.4, -2.5, MAP.ROPES[1] - 1.5 + k], 0xe8e0c8));      // ropes over the edge
  for (let k = 0; k < 5; k++) { const z = 2 + k * 4.5; boxes.push(bx([0.5, 0.7, 1.8], [30, -5.2, z], [0x2a2a2a, 0x8a1a1a, 0x1a3a6a][k % 3]), bx([0.2, 0.6, 0.2], [30, -4.6, z + 0.7], 0x3a3a3a)); }
  const propMat = propMaterial();
  const props = new THREE.Mesh(merge(boxes), propMat); props.castShadow = props.receiveShadow = true; root.add(props);
  const litMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(0.95, 0.9, 0.8) });
  root.add(new THREE.Mesh(merge(lit), litMat));
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(3, 2.2, 1.2) });
  root.add(new THREE.Mesh(merge(glows), glowMat));

  // ---- the bridge barricade (burns down when it opens), the main-gate leaves, the water-cannon truck + its jet
  const barr = new THREE.Mesh(merge([...place(bambooBarricade(12, 7), 0, 0, 0), bx([10, 1.2, 1.2], [0, 0.6, 0.6], 0x5a4a3a), bx([3, 1.6, 1.4], [-3, 0.8, -0.4], 0x6a5a48), bx([2, 1, 1], [3.5, 1.9, 0], 0x4a3a2a)]), propMat);
  barr.position.set(0, ground(0, -40), -40); root.add(barr);
  const leafGeo = merge([bx([6, 4, 0.2], [3, 2, 0], 0x3a3e46), ...[...Array(10)].map((_, k) => bx([0.12, 4, 0.3], [0.3 + k * 0.6, 2, 0], 0x2a2e34))]);
  const leaves = [-1, 1].map((sx) => { const g = new THREE.Group(); g.position.set(sx * 6, 0.5, -2); const m = new THREE.Mesh(leafGeo, propMat); m.scale.x = -sx; g.add(m); root.add(g); return g; });
  const truck = new THREE.Mesh(merge([bx([3, 3.2, 9], [0, 1.9, 0], 0xd8d8d0), bx([3.02, 1.2, 3], [0, 2.4, -3.2], 0x2a3440), bx([3.1, 0.5, 9.2], [0, 0.5, 0], 0x3a3a3a),
    bx([0.8, 0.8, 0.8], [0, 3.9, -2], 0x5a5e66), bx([0.3, 0.3, 1.6], [0, 4.1, -3], 0x3a3e46)]), propMat);
  truck.position.set(0, ground(0, -26), -26); truck.rotation.y = 0; root.add(truck);
  const JN = 90, jpos = new Float32Array(JN * 3), jgeo = new THREE.BufferGeometry(); jgeo.setAttribute('position', new THREE.BufferAttribute(jpos, 3));
  const jet = new THREE.Points(jgeo, new THREE.PointsMaterial({ color: new THREE.Color(0.4, 0.8, 2.6), size: 0.35, transparent: true, opacity: 0.85, depthWrite: false })); jet.frustumCulled = false; root.add(jet);

  // ---- fires: the barricade (while burning) and the rooftop barricades; the vfx embers read `fires`
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.4, 0.4), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const flameGeo = new THREE.BoxGeometry(0.5, 1.1, 0.5).translate(0, 0.55, 0);
  const fires = [], flames = [];
  const addFire = (x, y, z, k = 1) => { const o = new THREE.Object3D(); o.position.set(x, y, z); root.add(o); fires.push(o);
    for (let n = 0; n < 3; n++) { const m = new THREE.Mesh(flameGeo, flameMat); m.position.set(x + (n - 1) * 0.4 * k, y, z + ((n % 2) - 0.5) * 0.3 * k); m.scale.setScalar(k); root.add(m); flames.push([m, n, k, o]); } return o; };
  const barFires = [-3, 0, 3].map((x) => addFire(x, ground(x, -40) + 0.8, -40, 1.6));
  for (const [x, z] of ROOF_FIRES) addFire(x, 7.6, z, 1.3);
  const fireLights = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xff8a3a, 0, 18, 1.8); root.add(l); return l; });
  const lights = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffd8a0, 0, 26, 1.6); root.add(l); return l; });
  const stageKey = new THREE.PointLight(0xffc080, 24, 14, 2); stageKey.position.set(-6, 4, -136); stageKey.name = 'stage-key'; root.add(stageKey);
  const figGeo = [0, 1].map((k) => merge(figure(k)));
  const escape = [...Array(5)].map((_, k) => { const m = new THREE.Mesh(figGeo[k % 2], propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });

  const tmp = new THREE.Vector3();
  let t = 0, burn = 0, gate = 0, dark = 0;
  return {
    fires,
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      moon.target.position.copy(tmp); moon.position.copy(MOON).multiplyScalar(70).add(tmp);
      const fx = game && game.story && game.story.fx;
      dark += ((fx && fx.dark ? 1 : 0) - dark) * Math.min(1, dt * 1.5);
      hemi.intensity = 2.4 - dark * 1.7; moon.intensity = 2.2 * (1 - dark * 0.85);
      litMat.color.setScalar(0.9 * (1 - dark)); glowMat.color.setRGB(3 * (1 - dark), 2.2 * (1 - dark), 1.2 * (1 - dark));
      const near = lampAt.slice().sort((a, b) => (a[0] - focus.x) ** 2 + (a[2] - focus.z) ** 2 - (b[0] - focus.x) ** 2 - (b[2] - focus.z) ** 2);
      lights.forEach((l, n) => { const p = near[n]; l.position.set(p[0], p[1], p[2]); l.intensity = 55 * (1 - dark) * (1 - smooth(26, 44, Math.hypot(p[0] - focus.x, p[2] - focus.z))); });
      // the barricade: burning (the cannon phase) → burnt down once the gate opens; the main gate swings
      const bo = GATES.barricade ? GATES.barricade.open : true, burning = !!(fx && fx.cannon) || (bo && burn < 1 && fx && fx.cannon != null);
      burn += ((bo ? 1 : 0) - burn) * Math.min(1, dt * 0.8);
      barr.scale.y = Math.max(0.15, 1 - burn * 0.85); barr.visible = true;
      gate += ((GATES.mainGate && GATES.mainGate.open ? 1 : 0) - gate) * Math.min(1, dt * 1.2);
      leaves.forEach((g, k) => { g.rotation.y = (k ? -1 : 1) * gate * 1.5; });
      for (const [m, n, k, o] of flames) {
        const on = barFires.includes(o) ? burning || (bo && burn < 0.9) : true;
        m.visible = on;
        if (on) { const f = 0.8 + 0.3 * Math.sin(t * (9 + n * 3) + n) + 0.15 * Math.sin(t * 23 + n); m.scale.set(k * (0.9 + 0.1 * n), k * f * (1 + dark * 0.4), k); }
      }
      const live = fires.filter((o) => !barFires.includes(o) || burning).sort((a, b) => a.position.distanceToSquared(focus) - b.position.distanceToSquared(focus));
      fireLights.forEach((l, n) => { const o = live[n]; if (!o) { l.intensity = 0; return; } l.position.copy(o.position); l.position.y += 1;
        l.intensity = (40 + dark * 50) * (0.9 + 0.15 * Math.sin(t * 13 + n)) * (1 - smooth(26, 42, o.position.distanceTo(focus))); });
      stageKey.intensity = 22 + Math.sin(t * 17.3) * 2;
      // the water cannon: the truck backs off once the barricade opens; the jet sprays along fx.jet
      truck.visible = !bo || burn < 0.5; truck.position.z = -26 + burn * 20;
      const J = fx && fx.jet, jon = !!(fx && fx.cannon && J);
      jet.visible = jon;
      if (jon) { for (let k = 0; k < JN; k++) { const u = ((k / JN) + t * 1.7) % 1, d = u * J.len, x = J.x + Math.sin(J.yaw) * d, z = J.z + Math.cos(J.yaw) * d;
        jpos[k * 3] = x + Math.sin(k * 7.1) * 0.3 * u; jpos[k * 3 + 1] = ground(J.x, J.z) + 4 - u * 3.2 + Math.sin(k * 3.3) * 0.2; jpos[k * 3 + 2] = z; } jgeo.attributes.position.needsUpdate = true; }
      escape.forEach((m, k) => { const e = fx && fx.escape && fx.escape[k]; m.visible = !!(e && e.on && !e.home);
        if (m.visible) { m.position.set(e.x, ground(e.x, e.z) + (e.joined ? Math.abs(Math.sin(t * 9 + k)) * 0.05 : 0), e.z); m.rotation.y = e.yaw; } });
    },
  };
}
