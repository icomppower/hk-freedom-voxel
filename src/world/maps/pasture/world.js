// 羊村牧場's world builder (render-only; registered in the world registry, src/world/world.js). The island village on the
// shearing-festival afternoon, golden hour (the 定軍山 sky and haze): the hill pasture with its fences, bunting and hay,
// the lane between the wool barns (the east barn burns and its beam falls across the lane when the story closes gate
// 'barnLane'), the timber village wall with its gate towers and gate leaves (open with 'villageGate'), white houses and
// lanterns round the square, the climb, the shrine hall and the signal lantern (lit from the story's fx.lantern). Carts
// ride story.fx.carts. Never writes sim state.
import * as THREE from 'three';
import { SUN_DIR, HAZE, createSky } from '../../sky.js';
import { GATES, ground, routeDist, smooth, TERRAIN as G, PIECE_IDS, node, MAP } from '../../map.js';
import { buildGround } from '../sheepkit/terrain.js';
import { place, merge, propMaterial, barn, house, lantern, tree, fence, cart, bunting, palisade, tower, shrineHall, signalPole, signalLantern, bx } from '../sheepkit/props.js';
import { hash01 } from '../../../core/rng.js';

const SHADOW_BOX = 34, LIGHT_DIR = new THREE.Vector3(0.5, 0.58, 0.64).normalize();
const BARNS = [[-18, -62, Math.PI / 2], [-18, -42, Math.PI / 2], [-18, -22, Math.PI / 2], [18, -62, -Math.PI / 2], [18, -42, -Math.PI / 2], [18, -22, -Math.PI / 2]];
const HOUSES = [[-22, 10, 0], [-22, 22, 0], [-12, 30, Math.PI], [12, 30, Math.PI], [22, 10, 0], [22, 22, 0], [-30, 30, 0.2], [30, 30, -0.2]];

export function buildPasture(scene, root) {
  scene.background = HAZE.clone();
  scene.fog = new THREE.Fog(HAZE.clone(), 40, 300);
  const sky = createSky(); root.add(sky);
  root.add(new THREE.HemisphereLight(0xa6b8d8, 0x8a7a5a, 2.3));
  const sun = new THREE.DirectionalLight(0xffd0a0, 3.8);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 2;
  Object.assign(sun.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 160 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  root.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0xffa060, 1.4); rim.position.copy(SUN_DIR).multiplyScalar(100); root.add(rim);

  // ---- ground: pasture grass, dirt on the road, cobbles in the square and the gateway, stone up the shrine
  const GRASS = 0x5c7236, DRY = 0x7a7840, DIRT = 0x6e5640, COB = 0x77716a, STONE = 0x6c6860, HILL = 0x485e2e, ROCK = 0x5e5a52;   // golden light lifts them
  buildGround(root, {
    sea: { y: -2.2, color: 0x3a6878 },
    colorAt(x, z, y, inside, out) {
      if (inside < -0.6) return out > 7 && hash01(Math.round(x), Math.round(z), 5) < 0.5 ? ROCK : out > 12 ? ROCK : HILL;
      const id = PIECE_IDS[G.own[node(x, z)]], rd = routeDist(x, z);
      if (id === 'square' || id === 'gateway' || id === 'apron') return COB;
      if (id === 'shrine') return inside < 1.5 ? ROCK : STONE;
      if (id === 'climb') return rd < 2.5 ? STONE : HILL;
      if (rd < 2.2 || id === 'lane') return DIRT;
      return hash01(Math.round(x), Math.round(z), 3) < 0.22 ? DRY : hash01(Math.round(x), Math.round(z), 4) < 0.1 ? 0x4e6630 : GRASS;
    },
  });

  // ---- static props, merged
  const boxes = [];
  BARNS.forEach(([x, z, yaw], k) => boxes.push(...place(barn(14, 12, 5.5, k), x, ground(x, z), z, yaw)));
  HOUSES.forEach(([x, z, yaw], k) => boxes.push(...place(house(7, 6, 3.6, k), x, ground(x, z), z, yaw)));
  const wy = ground(0, 0.5);
  boxes.push(...palisade(-32, -4.2, 0.5, wy), ...palisade(4.2, 32, 0.5, wy));
  for (const sx of [-1, 1]) boxes.push(...place(tower(6.4), sx * 5.8, wy, 0.5, 0));
  boxes.push(bx([12, 0.6, 1.2], [0, wy + 5.2, 0.5], 0x4e3420), bx([12.6, 0.3, 2.2], [0, wy + 5.7, 0.5], 0x34363a));   // lintel + roof
  boxes.push(...place(shrineHall(14, 7), 10, ground(10, 100), 100.5, Math.PI));
  boxes.push(...place(signalPole(), MAP.LANTERN[0], ground(...MAP.LANTERN), MAP.LANTERN[1], 0));
  // fences round the pasture, pens, bunting over the festival field, hay and bales
  for (const [a, b] of [[[-47, -150], [-47, -74]], [[47, -150], [47, -74]], [[-47, -150], [47, -150]], [[-30, -100], [-12, -100]], [[12, -120], [30, -120]]]) boxes.push(...fence(a, b, ground(a[0], a[1])));
  for (const z of [-132, -112, -92]) boxes.push(...bunting([-34, z], [34, z], ground(0, z) + 4.2), bx([0.2, 4.4, 0.2], [-34, ground(-34, z) + 2.2, z], 0x4e3420), bx([0.2, 4.4, 0.2], [34, ground(34, z) + 2.2, z], 0x4e3420));
  for (let k = 0; k < 16; k++) {
    const x = (hash01(k, 1) - 0.5) * 80, z = -145 + hash01(k, 2) * 70;
    if (Math.abs(x) < 6) continue;
    boxes.push(...place(k % 3 ? [bx([1.1, 0.9, 1], [0, 0.45, 0], 0xeee8da)] : [bx([2.2, 1.6, 2.2], [0, 0.8, 0], 0xc8a860), bx([1.6, 0.6, 1.6], [0, 1.9, 0], 0xb89850)], x, ground(x, z), z, hash01(k, 3) * 3));
  }
  // lanterns: along the lane, round the square, up the climb
  const lamps = [[-6.5, -60], [6.5, -50], [-6.5, -30], [6.5, -18], [-9, 6], [9, 6], [-20, 18], [20, 18], [3, 40], [12, 58], [6, 74], [18, 80], [2, 84]];
  for (const [x, z] of lamps) boxes.push(...place(lantern(), x, ground(x, z), z, x > 0 ? Math.PI : 0));
  // trees on the hills round the playfield (outside the walk field, not in the sea)
  for (let k = 0; k < 260; k++) {
    const x = G.x0 + hash01(k, 7) * (G.x1 - G.x0), z = G.z0 + hash01(k, 8) * (G.z1 - G.z0), n = node(x, z);
    if (G.in[n] > -3 || G.in[n] < -24) continue;
    boxes.push(...place(tree(4 + hash01(k, 9) * 3, k), x, ground(x, z) + Math.min(9, (-G.in[n] - 0.6) * 0.55), z, hash01(k, 4) * 6));
  }
  for (let k = 0; k < 700; k++) {                                   // grass tufts and wild flowers off the paths
    const x = -60 + hash01(k, 21) * 120, z = -160 + hash01(k, 22) * 270, n = node(x, z), w = G.in[n];
    if (w < -8 || routeDist(x, z) < 3 || (w > 0 && PIECE_IDS[G.own[n]] !== 'field' && PIECE_IDS[G.own[n]] !== 'climb')) continue;
    const y = ground(x, z) + (w > -0.6 ? 0 : Math.min(9, (-w - 0.6) * 0.55)), col = hash01(k, 23) < 0.12 ? [0xe8d860, 0xf0f0e8, 0xd86050][k % 3] : 0x6a8a3a;
    boxes.push(bx([0.3, 0.35 + hash01(k, 24) * 0.3, 0.3], [x, y + 0.2, z], col));
  }
  const propMat = propMaterial();
  const props = new THREE.Mesh(merge(boxes), propMat); props.castShadow = props.receiveShadow = true; root.add(props);

  // ---- the village gate leaves (hinged at the posts, swing inward, +Z) and the barn-lane beam (falls when barnLane closes)
  const leafGeo = merge([bx([4, 4.4, 0.3], [2, 2.2, 0], 0x5a3a22), bx([4, 0.3, 0.36], [2, 1.2, 0], 0x3a2616), bx([4, 0.3, 0.36], [2, 3.4, 0], 0x3a2616)]);
  const leaves = [-1, 1].map((sx) => { const g = new THREE.Group(); g.position.set(sx * 4.1, wy, 0.4); const m = new THREE.Mesh(leafGeo, propMat); m.scale.x = -sx; m.castShadow = true; g.add(m); root.add(g); return g; });
  const beam = new THREE.Group(); beam.position.set(0, ground(0, -40), -40); root.add(beam);
  const beamM = new THREE.Mesh(merge([bx([17, 0.9, 0.9], [0, 0.45, 0], 0x2e2016), bx([6, 0.7, 0.7], [-3, 1.1, 0.8], 0x3a2618, [0, 0.3, 0.2]), bx([5, 0.6, 0.6], [4, 0.9, -0.7], 0x2a1c12, [0, -0.4, -0.15])]), propMat);
  beamM.castShadow = true; beam.add(beamM);

  // ---- fire: flames (additive flicker cards) at braziers and on the burning barn; the vfx embers read `fires`
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.4, 0.4), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const flameGeo = new THREE.BoxGeometry(0.5, 1.1, 0.5).translate(0, 0.55, 0);
  const fires = [], flames = [];
  const addFire = (x, y, z, k = 1) => { const o = new THREE.Object3D(); o.position.set(x, y, z); root.add(o); fires.push(o);
    for (let n = 0; n < 3; n++) { const m = new THREE.Mesh(flameGeo, flameMat); m.position.set(x + (n - 1) * 0.35 * k, y, z + ((n % 2) - 0.5) * 0.3 * k); m.scale.setScalar(k); root.add(m); flames.push([m, n, k, o]); } return o; };
  for (const [x, z] of [[-10, 14], [10, 14], [4, 88], [16, 88]]) addFire(x, ground(x, z) + 1.0, z, 0.6);
  const barnFire = [addFire(14, ground(14, -42) + 5.5, -42, 2.2), addFire(12, ground(12, -38) + 2, -38, 1.6), addFire(0, ground(0, -40) + 0.8, -40, 1.4)];
  const fireLights = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xff8a3a, 0, 14, 2); root.add(l); return l; });
  const stageKey = new THREE.PointLight(0xff8a3a, 30, 11, 2); stageKey.position.set(-8, ground(-8, -120) + 2.2, -120); stageKey.name = 'stage-key'; root.add(stageKey);

  // ---- the signal lantern body (lit: bright emissive + a warm light) and the carts
  const lanternMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, emissive: 0xff6a30, emissiveIntensity: 0 });
  const sig = new THREE.Mesh(merge(signalLantern()), lanternMat);
  sig.position.set(MAP.LANTERN[0] + 1.8, ground(...MAP.LANTERN) + 6.2, MAP.LANTERN[1]); root.add(sig);
  const sigLight = new THREE.PointLight(0xffa050, 0, 40, 1.6); sigLight.position.copy(sig.position); root.add(sigLight);
  const cartGeo = merge(cart());
  const carts = [0, 1, 2, 3, 4, 5].map(() => { const m = new THREE.Mesh(cartGeo, propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });

  const tmp = new THREE.Vector3();
  let t = 0, fall = 0;
  return {
    fires,
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      sun.target.position.copy(tmp); sun.position.copy(LIGHT_DIR).multiplyScalar(70).add(tmp);
      sky.material.uniforms.uTime.value = t;
      // gates: the village leaves swing open, the barn beam falls (burning) when the lane is shut
      const vg = GATES.villageGate, bl = GATES.barnLane;
      for (const [k, g] of leaves.entries()) { const want = vg && vg.open ? (k ? -1.45 : 1.45) : 0; g.rotation.y += (want - g.rotation.y) * Math.min(1, dt * 3); }
      fall += ((bl && !bl.open ? 1 : 0) - fall) * Math.min(1, dt * 2.5);
      beam.visible = fall > 0.01;
      beam.position.y = ground(0, -40) + (1 - fall) * 5; beam.rotation.z = (1 - fall) * 0.6;
      const burning = fall > 0.5;
      for (const [m, n, k, o] of flames) {
        const on = !barnFire.includes(o) || burning;
        m.visible = on;
        if (on) { const f = 0.8 + 0.3 * Math.sin(t * (9 + n * 3) + n) + 0.15 * Math.sin(t * 23 + n); m.scale.set(k * (0.9 + 0.1 * n), k * f, k); }
      }
      // fire lights: the three live fires nearest the focus
      const live = fires.filter((o) => !barnFire.includes(o) || burning).sort((a, b) => a.position.distanceToSquared(focus) - b.position.distanceToSquared(focus));
      fireLights.forEach((l, n) => { const o = live[n]; if (!o) { l.intensity = 0; return; } l.position.copy(o.position); l.position.y += 1;
        l.intensity = (barnFire.includes(o) ? 60 : 22) * (0.9 + 0.15 * Math.sin(t * 13 + n)) * (1 - smooth(28, 44, o.position.distanceTo(focus))); });
      stageKey.intensity = 28 + Math.sin(t * 22.3 + 3) * 5;
      // story render state: the lantern, the carts
      const fx = game && game.story && game.story.fx;
      const lit = fx && fx.lantern ? 1 : 0;
      lanternMat.emissiveIntensity += (lit * 2.4 - lanternMat.emissiveIntensity) * Math.min(1, dt * 2);
      sigLight.intensity = lanternMat.emissiveIntensity * 40 * (0.95 + 0.05 * Math.sin(t * 8));
      carts.forEach((m, k) => { const c = fx && fx.carts && fx.carts[k]; m.visible = !!(c && c.on); if (m.visible) { m.position.set(c.x, ground(c.x, c.z), c.z); m.rotation.y = c.yaw; } });
    },
  };
}
