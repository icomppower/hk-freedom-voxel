// 霧港's world builder (render-only; registered in the world registry, src/world/world.js). Pre-dawn in thick fog: the
// fishing beach (net racks, hauled-up boats), the stone causeway over black water, the boom quay (bollards, the winch
// house; the iron boom chain across the harbor mouth drops under the water with story fx.boomDown), the jetty up to the
// lighthouse rock and the lighthouse (lamp lit and its beam turning until fx.dark), the Warden-Wolf's fleet in the fog
// (fx.fleet) with searchlight cones reaching to fx.beams. Never writes sim state.
import * as THREE from 'three';
import { GATES, ground, TERRAIN as G, PIECE_IDS, node, MAP, smooth } from '../../map.js';
import { buildGround } from '../sheepkit/terrain.js';
import { place, merge, propMaterial, bx, lantern } from '../sheepkit/props.js';
import { hash01 } from '../../../core/rng.js';
import { shade } from '../../../core/voxel.js';

const SHADOW_BOX = 30, KEY = new THREE.Vector3(-0.4, 0.55, 0.7).normalize();
const FOG = new THREE.Color(0x6a7a8c), SKY = new THREE.Color(0x76869a);
const SHIPS = [[-70, 170], [-32, 188], [8, 200], [46, 186], [84, 168], [-100, 150]];

function fogSky() {
  const geo = new THREE.SphereGeometry(900, 32, 16), col = [], p = geo.attributes.position, c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const h = Math.max(0, p.getY(i) / 900); c.copy(SKY).lerp(new THREE.Color(0x3a4a66), smooth(0.05, 0.7, h)); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -1; m.frustumCulled = false;
  return m;
}
const ship = () => [bx([6, 2.4, 20], [0, 1.2, 0], 0x2a2c30), bx([5, 1.4, 5], [0, 3.1, -5], 0x34363a), bx([0.5, 12, 0.5], [0, 7, 1], 0x2a2420),
  bx([4.5, 5, 0.2], [0, 8, 1.2], 0x4a4c50), bx([1.4, 1.2, 1.4], [0, 4.4, 8], 0x3a3c40)];   // plain dark hull, cabin, mast and sail: no marks

export function buildHarbor(scene, root) {
  scene.background = FOG.clone();
  scene.fog = new THREE.Fog(FOG.clone(), 10, 95);
  root.add(fogSky());
  root.add(new THREE.HemisphereLight(0x9aaac4, 0x40485a, 2.2));
  const key = new THREE.DirectionalLight(0xd0dcf0, 2.0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 160 });
  key.shadow.bias = -0.0006; key.shadow.normalBias = 0.03;
  root.add(key, key.target);

  const SAND = 0x9a8e74, WET = 0x6e6656, STONE = 0x6a6a6c, QUAY = 0x5e5c5a, ROCK = 0x4e4e52, GRASS = 0x4a5a44;
  buildGround(root, {
    sea: { y: -0.15, color: 0x2e3e50 },
    rise: (x, z, out) => -Math.min(4, out * 0.6),
    colorAt(x, z, y, inside, out) {
      if (inside < -0.6) return y < -0.2 ? WET : ROCK;
      const id = PIECE_IDS[G.own[node(x, z)]];
      if (id === 'beach') return inside < 2.5 ? WET : SAND;
      if (id === 'causeway' || id === 'jetty') return (Math.round(x * 1.4) + Math.round(z)) % 2 ? STONE : shade(STONE, 0.9);
      if (id === 'quay') return (Math.round(x) + Math.round(z)) % 2 ? QUAY : shade(QUAY, 0.92);
      return hash01(Math.round(x), Math.round(z), 3) < 0.35 ? GRASS : ROCK;
    },
  });

  const boxes = [];
  // beach: net racks (poles + hanging nets), boats hauled up, crates of floats
  for (let k = 0; k < 10; k++) {
    const x = (k % 2 ? 1 : -1) * (10 + (k >> 1) * 6.5), z = -118 + (k % 3) * 15, y = ground(x, z);
    boxes.push(bx([0.2, 3, 0.2], [x - 2, y + 1.5, z], 0x5a4632), bx([0.2, 3, 0.2], [x + 2, y + 1.5, z], 0x5a4632), bx([4.2, 0.15, 0.15], [x, y + 2.9, z], 0x5a4632),
      bx([3.8, 2.2, 0.06], [x, y + 1.7, z], 0x6a6a58), bx([0.3, 0.3, 0.3], [x - 1, y + 1.0, z + 0.1], 0xd8a040));
  }
  for (const [x, z, yaw] of [[-38, -86, 0.4], [36, -92, -0.5], [-28, -128, 1.2], [30, -124, 2.2]]) boxes.push(...place([bx([2, 0.9, 5.6], [0, 0.45, 0], 0x6a5038), bx([1.6, 0.2, 5], [0, 0.95, 0], 0x8a6a48)], x, ground(x, z), z, yaw));
  // causeway kerbs, quay bollards and edge stones
  for (let z = -70; z < -13; z += 1.4) { const x = Math.sin(z * 0) * 0 + (z > -40 ? 0.5 : 0); for (const sx of [-1, 1]) boxes.push(bx([0.5, 0.5, 1.3], [x + sx * 3.3, ground(x, z) + 0.1, z], shade(STONE, 0.8 + hash01(Math.round(z), sx) * 0.12))); }
  for (let k = 0; k < 10; k++) { const x = -21 + (k % 2) * 42, z = -8 + (k >> 1) * 11; boxes.push(bx([0.6, 0.8, 0.6], [x, ground(x, z) + 0.4, z], 0x3a3a3c)); }
  const [wx, wz] = MAP.WINCH, wy = ground(wx, wz);
  boxes.push(bx([4, 3, 4], [wx + 3, wy + 1.5, wz], 0x4a3a2e), ...place([bx([4.6, 0.3, 4.6], [0, 0, 0], 0x2e2c2c, [0.3, 0, 0])], wx + 3, wy + 3.3, wz, 0));
  boxes.push(bx([3, 7, 3], [70, 2.5, 30], 0x3e3e42));                          // the far boom pillar in the water
  for (const [x, z] of [[-18, -10], [18, 36], [8, 60], [10, 76]]) boxes.push(...place(lantern(0xe8b060), x, ground(x, z), z, 0));
  // the lighthouse: tapered stone tower, gallery, lamp room frame (the glass is its own mesh)
  const [lx, lz] = MAP.LIGHT, ly = ground(lx, lz);
  for (let k = 0; k < 7; k++) boxes.push(bx([6.4 - k * 0.45, 2.4, 6.4 - k * 0.45], [lx, ly + 1.2 + k * 2.4, lz], k % 2 ? 0xd8d4c8 : 0xe8e4d8));
  boxes.push(bx([5.2, 0.4, 5.2], [lx, ly + 17, lz], 0x3a3a3c), bx([3.6, 0.5, 3.6], [lx, ly + 20.4, lz], 0x3a3a3c), bx([1.6, 1.2, 1.6], [lx, ly + 21.2, lz], 0x3a3a3c));
  // rocks along the waterline
  for (let k = 0; k < 120; k++) {
    const x = G.x0 + hash01(k, 7) * (G.x1 - G.x0), z = G.z0 + hash01(k, 8) * (G.z1 - G.z0), n = node(x, z);
    if (G.in[n] > -1 || G.in[n] < -6) continue;
    const s = 0.6 + hash01(k, 9) * 1.6; boxes.push(bx([s * 1.3, s, s], [x, -0.2 + s * 0.3, z], shade(ROCK, 0.8 + hash01(k, 10) * 0.3), [0, hash01(k, 11) * 3, 0]));
  }
  const propMat = propMaterial();
  const props = new THREE.Mesh(merge(boxes), propMat); props.castShadow = props.receiveShadow = true; root.add(props);

  // ---- the boom chain (links from the quay to the pillar), the winch wheel
  const links = [];
  for (let k = 0; k < 36; k++) links.push(bx([0.5, 0.3, 1.1], [0, 0, 0], k % 2 ? 0x5a5a5e : 0x4a4a4e, [0, 0, k % 2 ? Math.PI / 2 : 0]));
  const linkGeo = merge([bx([1.3, 0.3, 0.45], [0, 0, 0], 0x55555a)]);
  const chain = new THREE.InstancedMesh(linkGeo, propMat, 36); chain.castShadow = true; root.add(chain);
  const wheel = new THREE.Mesh(merge([bx([0.3, 2.4, 0.4], [0, 0, 0], 0x6a4a30), bx([0.3, 0.4, 2.4], [0, 0, 0], 0x6a4a30)]), propMat);
  wheel.position.set(wx + 0.8, wy + 1.6, wz); root.add(wheel);
  // ---- the lighthouse lamp + its beam
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd080, emissiveIntensity: 3 });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.6), lampMat); lamp.position.set(lx, ly + 18.6, lz); root.add(lamp);
  const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.4, 1.0), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(9, 90, 16, 1, true).translate(0, -45, 0).rotateX(-Math.PI / 2), beamMat);
  beam.position.copy(lamp.position); root.add(beam);
  const lampLight = new THREE.PointLight(0xffe0a0, 120, 60, 1.4); lampLight.position.copy(lamp.position); root.add(lampLight);
  // ---- the fleet and its searchlights
  const shipGeo = merge(ship()), ships = SHIPS.map(([x, z], k) => { const m = new THREE.Mesh(shipGeo, propMat); m.position.set(x, -0.4, z); m.rotation.y = Math.PI + (k - 2.5) * 0.12; m.visible = false; root.add(m); return m; });
  const coneMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.8, 1.6), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const cones = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 3.2, 1, 12, 1, true).translate(0, -0.5, 0), coneMat); m.visible = false; root.add(m);
    const l = new THREE.PointLight(0xe8f0ff, 0, 16, 1.4); root.add(l); return [m, l]; });
  const stageKey = new THREE.PointLight(0xff8a3a, 20, 11, 2); stageKey.position.set(-6, ground(-6, -100) + 2.2, -100); stageKey.name = 'stage-key'; root.add(stageKey);

  const tmp = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), sc = new THREE.Vector3();
  let t = 0, drop = 0, dark = 0;
  return {
    fires: [],
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      key.target.position.copy(tmp); key.position.copy(KEY).multiplyScalar(70).add(tmp);
      const fx = (game && game.story && game.story.fx) || {};
      // the boom chain: a sagging line quay → pillar, dropping under the water once lowered
      drop += ((fx.boomDown ? 1 : 0) - drop) * Math.min(1, dt * 0.8);
      for (let k = 0; k < 36; k++) {
        const u = (k + 0.5) / 36, x = 22 + u * 46, z = wz + (30 - wz) * u, y = 1.6 - Math.sin(u * Math.PI) * 1.2 - drop * 3.2;
        m4.makeRotationFromEuler(new THREE.Euler(k % 2 ? 0.8 : 0, Math.atan2(46, 30 - wz) - Math.PI / 2, 0)).setPosition(x, y, z); chain.setMatrixAt(k, m4);
      }
      chain.instanceMatrix.needsUpdate = true;
      wheel.rotation.x = (fx.boomT || 0) * 0.08 + drop * 6;
      // the lighthouse: lit and turning until the story puts it out
      dark += ((fx.dark ? 1 : 0) - dark) * Math.min(1, dt * 1.5);
      lampMat.emissiveIntensity = 3 * (1 - dark); lampLight.intensity = 120 * (1 - dark);
      beam.visible = dark < 0.95; beamMat.opacity = 0.18 * (1 - dark); beam.rotation.y = t * 0.5;
      // the fleet + searchlights
      const fleet = !!fx.fleet;
      ships.forEach((s, k) => { s.visible = fleet; if (fleet) s.position.y = -0.4 + Math.sin(t * 0.6 + k) * 0.15; });
      cones.forEach(([m, l], k) => {
        const b = fx.beams && fx.beams[k], on = fleet && b && b.on;
        m.visible = !!on; l.intensity = on ? 70 : 0;
        if (!on) return;
        const s = ships[k * 2 % ships.length].position, gy = ground(b.x, b.z);
        dir.set(b.x - s.x, gy - (s.y + 5), b.z - s.z); const len = dir.length();
        q.setFromUnitVectors(up, dir.clone().normalize().negate());
        m.position.set(s.x, s.y + 5, s.z); m.quaternion.copy(q); m.scale.set(1, len, 1);
        l.position.set(b.x, gy + 3, b.z);
      });
      stageKey.intensity = 18 + Math.sin(t * 22.3 + 3) * 4;
    },
  };
}
