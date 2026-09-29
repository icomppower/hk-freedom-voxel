// 燈籠街's world builder (render-only; registered in the world registry, src/world/world.js). The village climbing the
// harbor hill on curfew night: moonlight and dark blue fog, the market's awnings, stacked houses along three stair-alleys
// with lantern strings over them (the chain set piece: story fx.lanternsDown of them fall and burn on the steps, lighting the
// stairway), the garrison checkpoint (stone walls, a barred gate lifted with 'checkpoint', the winch wheel, the alarm drum),
// and the lookout over the fog harbor with the little boat below. Shadow Claw's flares: story fx.flares ({ x, z, t }).
import * as THREE from 'three';
import { GATES, ground, routeDist, smooth, TERRAIN as G, PIECE_IDS, node, MAP } from '../../map.js';
import { buildGround } from '../sheepkit/terrain.js';
import { place, merge, propMaterial, house, lantern, tree, bx, lamb } from '../sheepkit/props.js';
import { hash01 } from '../../../core/rng.js';
import { shade } from '../../../core/voxel.js';

const SHADOW_BOX = 30, MOON = new THREE.Vector3(-0.35, 0.8, 0.5).normalize();
const NIGHT = new THREE.Color(0x1c2a44), FOG = new THREE.Color(0x2c3e60);

function nightSky() {
  const geo = new THREE.SphereGeometry(900, 32, 16), col = [], p = geo.attributes.position, c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const h = Math.max(0, p.getY(i) / 900); c.setRGB(0.07 + 0.08 * (1 - h), 0.1 + 0.1 * (1 - h), 0.2 + 0.14 * (1 - h)); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const sky = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -1;
  const n = 900, sp = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = hash01(i, 1) * Math.PI * 2, e = 0.12 + hash01(i, 2) * 1.3; sp[i * 3] = Math.cos(e) * Math.sin(a) * 850; sp[i * 3 + 1] = Math.sin(e) * 850; sp[i * 3 + 2] = Math.cos(e) * Math.cos(a) * 850; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcdd8f0, size: 1.6, sizeAttenuation: false, fog: false, depthWrite: false }));
  const moon = new THREE.Mesh(new THREE.CircleGeometry(26, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.6, 1.45), fog: false }));
  moon.position.copy(MOON).multiplyScalar(800); moon.lookAt(0, 0, 0);
  const g = new THREE.Group(); g.add(sky, stars, moon); g.frustumCulled = false;
  return g;
}

export function buildLantern(scene, root) {
  scene.background = NIGHT.clone();
  scene.fog = new THREE.Fog(FOG.clone(), 22, 150);
  root.add(nightSky());
  root.add(new THREE.HemisphereLight(0x7a8cc8, 0x3a3024, 2.4));
  const moon = new THREE.DirectionalLight(0xb8ccf4, 3.2);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 160 });
  moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.03;
  root.add(moon, moon.target);

  const STONE = 0x4e4c50, COB = 0x57544f, STEP = 0x625e58, WOODP = 0x4a3a2e, HILL = 0x2c3a26, ROCK = 0x3e3c3e;
  buildGround(root, {
    sea: { y: -4, color: 0x14253a },
    colorAt(x, z, y, inside, out) {
      if (inside < -0.6) return out > 6 ? ROCK : HILL;
      const id = PIECE_IDS[G.own[node(x, z)]];
      if (id === 'market') return (Math.round(x) + Math.round(z)) % 2 ? COB : shade(COB, 0.9);
      if (id === 'west' || id === 'middle' || id === 'east' || id === 'cross') return STEP;
      if (id === 'lookout' || id === 'path') return STONE;
      return COB;
    },
    rise: (x, z, out) => Math.min(14, out * 0.9) + (out > 3 ? 2 : 0),
  });

  const boxes = [];
  // market: awning stalls round the square (canvas in dim plain colours), crates
  const AW = [0x7a3a30, 0x3a5a6a, 0x6a5a30, 0x4a3a5a];
  for (let k = 0; k < 12; k++) {
    const side = k < 6 ? -1 : 1, z = -112 + (k % 6) * 9, x = side * 28;
    boxes.push(...place([bx([4, 1.0, 2.4], [0, 0.5, 0], WOODP), bx([4.6, 0.12, 3.2], [0, 2.6, 0.3], AW[k % 4], [0.18, 0, 0]),
      bx([0.12, 2.6, 0.12], [-2.1, 1.3, 1.6], WOODP), bx([0.12, 2.6, 0.12], [2.1, 1.3, 1.6], WOODP), bx([0.8, 0.6, 0.8], [1, 1.3, -0.3], 0x8a6a44)], x, ground(x, z), z, side < 0 ? Math.PI / 2 : -Math.PI / 2));
  }
  // houses: stacked blocks between and beside the alleys (two to three storeys), stepping up the hill
  for (const cx of [-30, -10, 10, 30]) for (let z = -62; z < 6; z += 8) {
    const x = cx + (hash01(cx, z) - 0.5) * 2, y = ground(x + (cx < 0 ? 4 : -4), z) - 0.2, storeys = 2 + (hash01(cx, z, 3) < 0.45 ? 1 : 0);
    for (let s = 0; s < storeys; s++) boxes.push(...place(s < storeys - 1 ? [bx([8.6, 3.2, 7], [0, 1.6, 0], shade(0xcfc6b4, 0.55 + hash01(cx, z, s) * 0.12)), bx([9, 0.25, 7.6], [0, 3.2, 0], 0x3a3634)] : house(8.4, 7, 3, cx * 7 + z).map((q) => ({ ...q, c: shade(q.c, 0.62) })), x, y + s * 3.3, z, cx < 0 ? Math.PI / 2 : -Math.PI / 2));
  }
  // step blocks along every flight (the risers the heightfield slopes over)
  for (const id of ['west', 'middle', 'east']) {
    const P = MAP.pieces.find((q) => q.id === id).path;
    for (let s = 0; s < P.length - 1; s++) {
      const [ax, az, aw, ah] = P[s], [bx_, bz, , bh] = P[s + 1], len = Math.hypot(bx_ - ax, bz - az), n = Math.round(len / 0.7), yaw = Math.atan2(bx_ - ax, bz - az);
      for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, x = ax + (bx_ - ax) * u, z = az + (bz - az) * u; boxes.push(bx([aw * 2 + 0.6, 0.18, 0.5], [x, ground(x, z) - 0.05, z], shade(STEP, k % 2 ? 0.92 : 1.05), [0, yaw, 0])); }
    }
  }
  // checkpoint: stone walls either side of the street, the gatehouse beam, the winch housing, the alarm drum on its stand
  const cy = ground(0, 30);
  for (const sx of [-1, 1]) boxes.push(bx([2, 5, 44], [sx * 13.5, cy + 2.5, 32], STONE), bx([2.4, 0.4, 44.4], [sx * 13.5, cy + 5.1, 32], 0x3a383c));
  boxes.push(bx([28, 1.4, 1.6], [0, cy + 6.2, 40], 0x3a2e24), bx([30, 0.5, 2.6], [0, cy + 7.1, 40], 0x2e2c30));
  boxes.push(bx([2, 2.2, 2.4], [MAP.WINCH[0] + 1.6, cy + 1.1, MAP.WINCH[1]], WOODP), bx([0.3, 2.4, 2.4], [MAP.WINCH[0] + 0.5, cy + 1.6, MAP.WINCH[1]], 0x5a4432));
  boxes.push(bx([2.6, 1.0, 2.6], [MAP.DRUM[0], cy + 0.5, MAP.DRUM[1]], WOODP), bx([2.2, 1.8, 2.2], [MAP.DRUM[0], cy + 2.0, MAP.DRUM[1]], 0x7a2a22), bx([2.3, 0.2, 2.3], [MAP.DRUM[0], cy + 2.9, MAP.DRUM[1]], 0xd8c8a0), bx([2.3, 0.2, 2.3], [MAP.DRUM[0], cy + 1.1, MAP.DRUM[1]], 0xd8c8a0));
  // lookout: railing round the platform's seaward half, a bench, the path's handrail
  const ly = ground(6, 86);
  for (let k = 0; k < 24; k++) { const a = -Math.PI * 0.55 + k / 23 * Math.PI * 1.1, x = 6 + Math.sin(a) * 16.5, z = 86 + Math.cos(a) * 13.5; boxes.push(bx([0.2, 1.1, 0.2], [x, ly + 0.55, z], WOODP)); }
  // trees on the dark hillside
  for (let k = 0; k < 160; k++) {
    const x = G.x0 + hash01(k, 7) * (G.x1 - G.x0), z = G.z0 + hash01(k, 8) * (G.z1 - G.z0), n = node(x, z);
    if (G.in[n] > -4 || G.in[n] < -22) continue;
    boxes.push(...place(tree(4 + hash01(k, 9) * 2, k).map((q) => ({ ...q, c: shade(q.c, 0.55) })), x, ground(x, z) + Math.min(14, (-G.in[n] - 0.6) * 0.9) + 2, z, hash01(k, 4) * 6));
  }
  const propMat = propMaterial();
  const props = new THREE.Mesh(merge(boxes), propMat); props.castShadow = props.receiveShadow = true; root.add(props);

  // ---- lanterns: glowing bodies (emissive), strings over the alleys; `down` ones fall and burn on the steps
  const lampMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, emissive: 0xff6a2a, emissiveIntensity: 1.4 });
  const LAMPS = [];
  for (const id of ['west', 'middle', 'east']) {
    const P = MAP.pieces.find((q) => q.id === id).path;
    for (let s = 0; s < P.length - 1; s++) for (let k = 0; k < 3; k++) {
      const u = (k + 0.5) / 3, x = P[s][0] + (P[s + 1][0] - P[s][0]) * u, z = P[s][1] + (P[s + 1][1] - P[s][1]) * u;
      LAMPS.push([x, ground(x, z) + 4.2, z, id]);
    }
  }
  for (const [x, z] of [[-22, -100], [22, -100], [-22, -80], [22, -80], [0, -70], [-10, 14], [10, 14], [-9, 48], [9, 48], [4, 62], [12, 80], [0, 80]]) LAMPS.push([x, ground(x, z) + 3, z, 'street']);
  const lampGeo = merge([bx([0.5, 0.66, 0.5], [0, 0, 0], 0xd8452a), bx([0.34, 0.08, 0.34], [0, 0.37, 0], 0x2a2018), bx([0.34, 0.08, 0.34], [0, -0.37, 0], 0x2a2018)]);
  const lamps = LAMPS.map(([x, y, z]) => { const m = new THREE.Mesh(lampGeo, lampMat); m.position.set(x, y, z); root.add(m); return m; });
  const stairLamps = LAMPS.map((l, k) => [l, k]).filter(([l]) => l[3] !== 'street').map(([, k]) => k);   // the chain's order: up the flights
  const lights = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xff8a3a, 0, 18, 1.6); root.add(l); return l; });
  const fireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 1.2, 0.35), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const fireGeo = new THREE.BoxGeometry(0.4, 0.9, 0.4).translate(0, 0.45, 0);
  const burns = stairLamps.map((k) => { const m = new THREE.Mesh(fireGeo, fireMat); const [x, , z] = LAMPS[k]; m.position.set(x, ground(x, z), z); m.visible = false; root.add(m); return m; });
  const stairFill = new THREE.PointLight(0xff9a50, 0, 40, 1.4); root.add(stairFill);
  const stageKey = new THREE.PointLight(0xff8a3a, 20, 11, 2); stageKey.position.set(-6, ground(-6, -90) + 2.2, -90); stageKey.name = 'stage-key'; root.add(stageKey);

  // ---- the checkpoint gate bars (lifted when open), the winch wheel, flares, the boat in the fog below the lookout
  const bars = new THREE.Mesh(merge(Array.from({ length: 13 }, (_, k) => bx([0.3, 5, 0.3], [-12 + k * 2, 2.5, 0], 0x3a3634))), propMat);
  bars.position.set(0, cy, 40); bars.castShadow = true; root.add(bars);
  const wheel = new THREE.Mesh(merge([bx([0.2, 2, 0.3], [0, 0, 0], 0x6a4a30), bx([0.2, 0.3, 2], [0, 0, 0], 0x6a4a30), bx([0.3, 0.6, 0.6], [0, 0, 0], 0x3a2a1c)]), propMat);
  wheel.position.set(MAP.WINCH[0] + 0.3, cy + 1.6, MAP.WINCH[1]); root.add(wheel);
  const flareMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 1.6, 1.2), fog: false });
  const flares = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), flareMat); m.visible = false; root.add(m);
    const l = new THREE.PointLight(0xff5a3a, 0, 22, 1.6); root.add(l); return [m, l]; });
  const boat = new THREE.Mesh(merge([bx([2.2, 0.8, 6], [0, 0.4, 0], 0x5a4432), bx([1.8, 0.2, 5.4], [0, 0.85, 0], 0x7a5a40), bx([0.16, 4, 0.16], [0, 2.6, 0.4], 0x4a3a2a), bx([0.1, 2.6, 1.8], [0, 3, 0.2], 0xb8b0a0)]), propMat);
  boat.position.set(-4, -3.6, 128); root.add(boat);

  const lambGeo = merge(lamb());
  const lambs = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(lambGeo, propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });
  const tmp = new THREE.Vector3();
  let t = 0, lift = 0;
  const fires = [];
  return {
    fires,
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      moon.target.position.copy(tmp); moon.position.copy(MOON).multiplyScalar(70).add(tmp);
      const fx = game && game.story && game.story.fx, down = fx ? fx.lanternsDown || 0 : 0;
      // the chain: the first `down` stair lanterns are shot down — gone from the wire, burning on the steps
      stairLamps.forEach((k, j) => { const d = j < down; lamps[k].visible = !d; burns[j].visible = d; if (d) burns[j].scale.set(1, 0.8 + 0.3 * Math.sin(t * 11 + j), 1); });
      stairFill.intensity = Math.min(1, down / 12) * 90; stairFill.position.set(focus.x, ground(focus.x, focus.z) + 6, focus.z);
      // lights on the four lit lanterns nearest the focus
      const near = lamps.map((m, k) => [m, k]).filter(([m]) => m.visible).sort((a, b) => a[0].position.distanceToSquared(focus) - b[0].position.distanceToSquared(focus));
      lights.forEach((l, n) => { const e = near[n]; if (!e) { l.intensity = 0; return; } l.position.copy(e[0].position); l.intensity = 45 * (0.92 + 0.1 * Math.sin(t * 9 + n)) * (1 - smooth(24, 40, e[0].position.distanceTo(focus))); });
      for (const m of lamps) m.rotation.y = Math.sin(t * 0.8 + m.position.x) * 0.1;
      // the checkpoint gate
      const open = GATES.checkpoint && GATES.checkpoint.open ? 1 : 0;
      lift += (open - lift) * Math.min(1, dt * 1.5);
      bars.position.y = cy + lift * 4.6; wheel.rotation.x = lift * 9;
      // flares
      flares.forEach(([m, l], k) => { const f = fx && fx.flares && fx.flares[k];
        const on = !!f && f.age < 480; m.visible = on; l.intensity = on ? 60 * (1 - f.age / 480) * (0.8 + 0.2 * Math.sin(t * 30 + k)) : 0;
        if (on) { m.position.set(f.x, ground(f.x, f.z) + 0.4 + Math.max(0, 4 - f.age * 0.2), f.z); l.position.copy(m.position); l.position.y += 1.5; m.rotation.y = t * 4; } });
      // the four of the twelve on the hero's trail (story fx.escorts), trotting
      lambs.forEach((m, k) => { const e = fx && fx.escorts && fx.escorts[k]; m.visible = !!(e && e.on); if (!m.visible) return;
        const dx = e.x - m.position.x, dz = e.z - m.position.z; if (dx * dx + dz * dz > 0.001) m.rotation.y = Math.atan2(dx, dz);
        m.position.set(e.x, ground(e.x, e.z) + Math.abs(Math.sin(t * 9 + k)) * 0.06, e.z); });
      boat.position.y = -3.6 + Math.sin(t * 0.9) * 0.15; boat.rotation.z = Math.sin(t * 0.7) * 0.05;
      stageKey.intensity = 18 + Math.sin(t * 22.3 + 3) * 4;
    },
  };
}
