// 立法會 LegCo's world builder (render-only; registered in the world registry, src/world/world.js). 1 July 2019, night:
// the protest plaza under three sweeping searchlights (story fx.beams), crowd barriers and dropped umbrellas; the building's
// glass curtain wall — its panes crack in stages (fx.glass 0-3) and shatter into falling voxel shards when gate
// 'glassWall' opens; the lobby (columns, a mezzanine walkway along both sides, no roof: a cutaway set) and its chamber
// door (gate 'chamberDoor'); the chamber: curved rows of desks, the dais at the far end. The four 手足 the story's
// clearance escort follows (fx.escorts). Generic civic building: no emblem, crest, flag or text. Never writes sim state.
import * as THREE from 'three';
import { GATES, ground, smooth, TERRAIN as G, PIECE_IDS, node } from '../../map.js';
import { buildGround } from '../hkkit/terrain.js';
import { place, merge, propMaterial, bx, tower, crowdBarrier, streetLamp, umbrella } from '../hkkit/props.js';
import { hash01 } from '../../../core/rng.js';
import { shade } from '../../../core/voxel.js';

const SHADOW_BOX = 30, MOON = new THREE.Vector3(-0.3, 0.8, 0.5).normalize();
const NIGHT = new THREE.Color(0x121a28), FOG = new THREE.Color(0x283242);
const UMB = [0xffd700, 0x2a2a2a, 0x3a6ab0, 0xe8e8e8, 0xd0402a];
/** A 手足 figure (+Z forward): black clothes, yellow hard hat. */
const sauzuk = () => [bx([0.44, 0.8, 0.28], [0, 0.4, 0], 0x1c1c1c), bx([0.5, 0.66, 0.32], [0, 1.15, 0], 0x181818), bx([0.26, 0.26, 0.26], [0, 1.62, 0], 0xf1c27d),
  bx([0.3, 0.1, 0.3], [0, 1.82, 0], 0xffd700), bx([0.36, 0.04, 0.36], [0, 1.76, 0], 0xc9a800), bx([0.24, 0.1, 0.06], [0, 1.56, 0.12], 0x111111)];

export function buildLegco(scene, root) {
  scene.background = NIGHT.clone();
  scene.fog = new THREE.Fog(FOG.clone(), 30, 180);
  const skyGeo = new THREE.SphereGeometry(900, 24, 12);
  root.add(Object.assign(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ color: 0x141c2a, side: THREE.BackSide, fog: false, depthWrite: false })), { renderOrder: -1, frustumCulled: false }));
  root.add(new THREE.HemisphereLight(0x8a9cc8, 0x4a4036, 2.6));
  const moon = new THREE.DirectionalLight(0xc0d0f0, 2.4);
  moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -SHADOW_BOX, right: SHADOW_BOX, top: SHADOW_BOX, bottom: -SHADOW_BOX, near: 1, far: 160 });
  moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.03;
  root.add(moon, moon.target);

  const PAVE = 0x5e5c58, MARBLE = 0x8a8680, CARPET = 0x3a4a5a, WOODF = 0x6a4e36;
  buildGround(root, {
    colorAt(x, z, y, inside) {
      if (inside < -0.6) return 0x303238;
      const id = PIECE_IDS[G.own[node(x, z)]];
      if (id === 'plaza' || id === 'breach') return (Math.round(x / 2) + Math.round(z / 2)) & 1 ? PAVE : shade(PAVE, 0.9);
      if (id === 'lobby' || id === 'door') return (Math.round(x) + Math.round(z)) & 1 ? MARBLE : shade(MARBLE, 0.93);
      if (id === 'dais') return WOODF;
      return hash01(Math.round(x), Math.round(z), 2) < 0.1 ? shade(CARPET, 1.1) : CARPET;
    },
    rise: (x, z, out) => Math.min(2, out * 0.3),
  });

  const boxes = [], lit = [], glows = [];
  // city towers behind the plaza and round the building
  for (let k = 0; k < 18; k++) {
    const sx = k % 2 ? 1 : -1, x = sx * (42 + hash01(k, 1) * 16), z = -170 + Math.floor(k / 2) * 26, h = 30 + hash01(k, 2) * 60, t = tower(14, 14, h, k + 40);
    boxes.push(...place(t.body, x, 0, z)); lit.push(...place(t.lit, x, 0, z));
  }
  // the building shell: side walls of the lobby and chamber (cutaway: no roof), the mezzanine walkways, the columns
  for (const sx of [-1, 1]) {
    boxes.push(bx([1, 9, 58], [sx * 20, 4.5, -48], 0x9a968e), bx([1, 7, 40], [sx * 30.5, 3.5, 22], 0x8a867e));
    boxes.push(bx([4, 0.5, 54], [sx * 17.5, 4.2, -48], 0x7a766e), bx([0.1, 1.1, 54], [sx * 15.5, 5, -48], 0x9aa0a8));   // mezzanine + rail
    for (const z of [-61, -39]) boxes.push(bx([2, 9, 2], [sx * 11, 4.5, z], 0xb0aca4));
  }
  boxes.push(bx([40, 9, 1], [-0, 4.5, -19.5], 0x9a968e));                 // lobby / chamber wall with the door gap (carved by the door piece)
  boxes.push(bx([8.4, 3.2, 1.2], [0, 7.3, -19.5], 0x8a867e));
  // chamber: curved rows of desks facing the dais, the dais itself, the gallery wall behind
  for (let r = 0; r < 4; r++) for (let k = -5; k <= 5; k++) {
    const a = k * 0.16, R = 22 - r * 4, x = Math.sin(a) * R, z = 46 - Math.cos(a) * R;
    if (Math.abs(x) < 3) continue;
    boxes.push(...place([bx([2.6, 0.9, 0.8], [0, 0.45, 0], 0x6a4e36), bx([2.6, 0.08, 0.9], [0, 0.94, 0], 0x4a3624)], x, ground(x, z), z, -a));
  }
  boxes.push(bx([16, 1.2, 4], [0, ground(0, 54) + 0.6, 56], 0x5a3e2a), bx([30, 8, 1], [0, 4, 60.5], 0x7a6a5a));
  // plaza: crowd barriers pushed about, umbrellas, street lamps
  for (let k = 0; k < 14; k++) { const x = (hash01(k, 3) - 0.5) * 50, z = -150 + hash01(k, 4) * 60; boxes.push(...place(crowdBarrier(), x, 0, z, hash01(k, 5) * 3)); }
  for (let k = 0; k < 40; k++) { const x = (hash01(k, 6) - 0.5) * 54, z = -150 + hash01(k, 7) * 66; if (Math.abs(x) < 2) continue; boxes.push(...place(umbrella(UMB[k % 5], 0.3, 1.3), x, 0, z, hash01(k, 8) * 6)); }
  const lampAt = [];
  for (let z = -150; z < -82; z += 18) for (const sx of [-1, 1]) { const x = sx * 31, L = streetLamp(8); boxes.push(...place(L.body, x, 0, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); glows.push(...place(L.glow, x, 0, z, sx > 0 ? -Math.PI / 2 : Math.PI / 2)); lampAt.push([x - sx * 1.7, 7.6, z]); }
  // lobby ceiling lights (glow boxes on the mezzanine edge) → lamp list
  for (let z = -70; z < -22; z += 12) for (const sx of [-1, 1]) { glows.push(bx([1.2, 0.2, 1.2], [sx * 14, 8.5, z], 0xfff0d0)); lampAt.push([sx * 14, 8, z]); }
  for (let z = 0; z < 56; z += 14) for (const sx of [-1, 1]) { glows.push(bx([1.2, 0.2, 1.2], [sx * 16, 6.8, z], 0xfff0d0)); lampAt.push([sx * 16, 6.5, z]); }
  const propMat = propMaterial();
  const props = new THREE.Mesh(merge(boxes), propMat); props.castShadow = props.receiveShadow = true; root.add(props);
  root.add(new THREE.Mesh(merge(lit), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(0.95, 0.9, 0.8) })));
  root.add(new THREE.Mesh(merge(glows), new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(3, 2.4, 1.6) })));

  // ---- the glass curtain wall: 24 panes (12 × 2) across z -78, x -24 … 24, 8 m tall; crack overlays per stage; shards
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x8ab4c8, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.3, depthWrite: false });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a3e46, roughness: 0.6 });
  const panes = new THREE.Group(); root.add(panes);
  const paneGeo = new THREE.BoxGeometry(3.9, 3.9, 0.08);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) { const m = new THREE.Mesh(paneGeo, glassMat); m.position.set(-22 + i * 4, 2.05 + j * 4, -78); panes.add(m); }
  const frame = new THREE.Mesh(merge([...[...Array(13)].map((_, i) => bx([0.16, 8.2, 0.2], [-24 + i * 4, 4.1, -78], 0x3a3e46)), bx([48.2, 0.2, 0.22], [0, 0.1, -78], 0x3a3e46),
    bx([48.2, 0.2, 0.22], [0, 4.05, -78], 0x3a3e46), bx([48.2, 0.3, 0.3], [0, 8.1, -78], 0x3a3e46), bx([50, 3, 2], [0, 9.6, -78], 0x9a968e)]), frameMat);
  root.add(frame);
  const crackMat = new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.9 });
  const cracks = [1, 2, 3].map((s) => {
    const b = [];
    for (let k = 0; k < s * 14; k++) { const x = -22 + hash01(k, s) * 44, y = 0.5 + hash01(k, s + 7) * 7.5, a = hash01(k, s + 13) * Math.PI; b.push(bx([1.2 + hash01(k, 2) * 1.8, 0.04, 0.02], [x, y, -77.9], 0xffffff, [0, 0, a])); }
    const m = new THREE.Mesh(merge(b), crackMat); m.visible = false; root.add(m); return m;
  });
  const SH = 160, shardGeo = new THREE.BoxGeometry(0.35, 0.35, 0.06);
  const shards = new THREE.InstancedMesh(shardGeo, glassMat, SH); shards.visible = false; shards.frustumCulled = false; root.add(shards);
  const sp = [...Array(SH)].map((_, k) => ({ x: -23 + hash01(k, 1) * 46, y: 0.5 + hash01(k, 2) * 7.5, vx: (hash01(k, 3) - 0.5) * 3, vy: hash01(k, 4) * 2, vz: 1 + hash01(k, 5) * 5, r: hash01(k, 6) * 6 }));
  // ---- the chamber door (two leaves), the searchlights, lamps, escorts
  const doorGeo = merge([bx([4, 5, 0.3], [2, 2.5, 0], 0x5a3e2a), bx([3.4, 0.2, 0.34], [2, 2.5, 0], 0x3a2618)]);
  const doors = [-1, 1].map((sx) => { const g = new THREE.Group(); g.position.set(sx * 4, 0.2, -19.4); const m = new THREE.Mesh(doorGeo, propMat); m.scale.x = -sx; g.add(m); root.add(g); return g; });
  const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.5, 1.6), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beams = [0, 1, 2].map(() => { const g = new THREE.Group(); const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 3.2, 40, 16, 1, true).translate(0, -20, 0), beamMat); g.add(cone);
    const spot = new THREE.Mesh(new THREE.CircleGeometry(3.4, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 1.25, 1.3), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    root.add(g, spot); return { g, spot }; });
  const lights = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xffd8a0, 0, 26, 1.6); root.add(l); return l; });
  const stageKey = new THREE.PointLight(0xffc080, 24, 14, 2); stageKey.position.set(-6, 3, -134); stageKey.name = 'stage-key'; root.add(stageKey);
  const escGeo = merge(sauzuk());
  const escorts = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(escGeo, propMat); m.castShadow = true; m.visible = false; root.add(m); return m; });

  const tmp = new THREE.Vector3(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S1 = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3();
  let t = 0, shatter = -1, doorOpen = 0;
  return {
    fires: [],
    update(dt, focus, game) {
      t += dt;
      const step = 2 * SHADOW_BOX / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      moon.target.position.copy(tmp); moon.position.copy(MOON).multiplyScalar(70).add(tmp);
      const near = lampAt.slice().sort((a, b) => (a[0] - focus.x) ** 2 + (a[2] - focus.z) ** 2 - (b[0] - focus.x) ** 2 - (b[2] - focus.z) ** 2);
      lights.forEach((l, n) => { const p = near[n]; l.position.set(p[0], p[1], p[2]); l.intensity = 60 * (1 - smooth(28, 46, Math.hypot(p[0] - focus.x, p[2] - focus.z))); });
      const fx = game && game.story && game.story.fx;
      // glass: cracks by stage, shatter once the gate opens (story mode) — in free mode the wall stands broken open
      const g = fx && fx.glass != null ? fx.glass : 0, open = GATES.glassWall ? GATES.glassWall.open : true;
      cracks.forEach((m, k) => { m.visible = !open && g > k; });
      if (open && shatter < 0 && fx && fx.glass != null) shatter = 0;
      panes.visible = !open; frame.visible = true;
      if (shatter >= 0 && shatter < 3) {
        shatter += dt; shards.visible = true;
        sp.forEach((s, k) => { const y = Math.max(0.05, s.y + s.vy * shatter - 4.9 * shatter * shatter), z = -78 + s.vz * shatter;
          E.set(s.r + shatter * 3, s.r * 2 + shatter * 4, 0); Q.setFromEuler(E); M4.compose(P.set(s.x + s.vx * shatter, y, z), Q, S1); shards.setMatrixAt(k, M4); });
        shards.instanceMatrix.needsUpdate = true;
      } else if (shatter >= 3) shards.visible = true;
      // chamber door
      doorOpen += ((GATES.chamberDoor && GATES.chamberDoor.open ? 1 : 0) - doorOpen) * Math.min(1, dt * 2);
      doors.forEach((d, k) => { d.rotation.y = (k ? -1 : 1) * doorOpen * 1.5; });
      // searchlights (fx.beams: where each one points; off-story: a slow idle sweep)
      beams.forEach((b, k) => {
        const B = fx && fx.beams && fx.beams[k], x = B ? B.x : Math.sin(t * 0.3 + k * 2) * 20, z = B ? B.z : -120 + Math.cos(t * 0.25 + k) * 25, on = !B || B.on;
        b.g.visible = b.spot.visible = on; if (!on) return;
        const ox = (k - 1) * 30, oy = 36, oz = -60;
        b.g.position.set(ox, oy, oz); b.g.lookAt(x, 0, z); b.g.rotateX(-Math.PI / 2); b.g.scale.set(1, Math.hypot(x - ox, oy, z - oz) / 40, 1);
        b.spot.position.set(x, ground(x, z) + 0.05, z);
      });
      stageKey.intensity = 22 + Math.sin(t * 17.3) * 2;
      escorts.forEach((m, k) => { const e = fx && fx.escorts && fx.escorts[k]; m.visible = !!(e && e.on);
        if (m.visible) { m.position.set(e.x, ground(e.x, e.z) + (e.joined ? Math.abs(Math.sin(t * 9 + k)) * 0.05 : 0), e.z); m.rotation.y = e.yaw; } });
    },
  };
}
