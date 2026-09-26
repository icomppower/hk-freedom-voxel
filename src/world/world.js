// Battlefield of 定軍山 (layout, heights, walkable ground and gates: map.js). Golden hour as in the concept: a low sun
// straight up the valley between the castle's corner tower and the camp-shelf watchtowers, sun-aware aerial haze
// (warm toward the sun, mauve away), voxel terrain with canyon cliffs, the Han River, the castle wall as the Wei
// camp's front, 魏/蜀 banners with cloth motion, fires with smoke columns and embers, reserve armies, and layered
// mountains with Dingjun's peak behind the summit. Render-only: never touches sim state (it reads the gate states);
// all animation is a pure function of render time.
import * as THREE from 'three';
import { SUN_DIR, HAZE, installHaze, createSky } from './sky.js';
import { buildTerrain } from './terrain.js';
import { buildCastle } from './castle.js';
import { buildDressing } from './dressing.js';
import { WALL_Z, GATE_X, CAMP_H, GATES, ground } from './map.js';

// burning wrecks on the field, near the walkable edges so the fight stays clear: [x, z, scale]
const FIELD_FIRES = [[-33, -64, 1.2], [32, -58, 1.1], [-30, 8, 1.3], [30, -8, 1.2], [-22, -28, 1.0], [24, 24, 1.1], [15, 40, 1.0],
  [-36, 126, 1.2], [-12, 202, 1.1]];
// key light: from behind-left of the up-valley view, higher than the visible sun so the ground reads (hard shadows
// fall toward the camera, soldiers get a warm rim)
const LIGHT_DIR = new THREE.Vector3(0.5, 0.58, 0.64).normalize();

installHaze();

export function createWorld(scene) {
  scene.background = HAZE.clone();
  // clear fight disc; haze reaches 63 % 28 + 290 m out (sky.js): the far zones of the 370 m valley stay silhouettes,
  // the summit a dark shoulder under its beacon smoke from the Shu camp
  scene.fog = new THREE.Fog(HAZE.clone(), 28, 290);
  const sky = createSky();
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xaeaac6, 0x8e7a6e, 2.0);  // cool mauve sky fill (neutral enough that shaded brown stone stays brown, not rose), dust bounce
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffdcc0, 3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -28; sc.right = 28; sc.top = 28; sc.bottom = -28; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0xffb07a, 1.2);            // warm back/rim light from the visible sun
  rim.position.copy(SUN_DIR).multiplyScalar(100);
  scene.add(rim);

  buildTerrain(scene, FIELD_FIRES);
  const camp = new THREE.Group();                                   // the castle set stands on the camp plateau
  camp.position.y = CAMP_H;
  scene.add(camp);
  const castle = buildCastle(camp, { wallZ: WALL_Z, gateX: GATE_X });
  const dressing = buildDressing(scene, { castle, fieldFires: FIELD_FIRES });

  // fire glow on the gate and on two field wrecks
  const fireLights = [[GATE_X - 6.5, WALL_Z - 3.5], [GATE_X + 7, WALL_Z - 3.5], [-30, 8], [-33, -64]].map(([x, z]) => {
    const l = new THREE.PointLight(0xff8a3a, 30, 11, 2); l.position.set(x, ground(x, z) + 2.2, z); scene.add(l); return l;
  });

  // gates: render-side eased 0 (shut) … 1 (open) toward the sim state; doors swing in ≈ 1 s, barricades collapse and char
  const open = { weiCamp: 1, pass: 1, summit: 1 }, CHAR = new THREE.Color(0x3a2a24), WHITE = new THREE.Color(1, 1, 1);
  const lit = (id) => GATES[id].open;
  const tmp = new THREE.Vector3();
  let t = 0;
  return {
    fires: dressing.fires,
    update(dt, focus) {
      t += dt;
      // shadow frustum follows the focus (snapped to texels to avoid shimmer), at the ground under it
      const step = 56 / 2048;
      tmp.set(Math.round(focus.x / step) * step, ground(focus.x, focus.z), Math.round(focus.z / step) * step);
      sun.target.position.copy(tmp);
      sun.position.copy(LIGHT_DIR).multiplyScalar(70).add(tmp);
      sky.material.uniforms.uTime.value = t;
      dressing.update(t, lit);
      castle.update(t);
      for (const id in open) open[id] += ((GATES[id].open ? 1 : 0) - open[id]) * Math.min(1, dt * 3);
      castle.setDoors(open.weiCamp * (2 - open.weiCamp));
      for (const id of ['pass', 'summit']) {
        const g = dressing.gates[id], k = open[id];
        g.m.rotation.x = -0.25 * k; g.m.scale.y = 1 - 0.72 * k; g.m.position.y = g.y - 0.1 * k;   // broken down to a low burning wreck
        g.mat.color.copy(WHITE).lerp(CHAR, k);
      }
      fireLights.forEach((l, i) => { l.intensity = 28 + Math.sin(t * (13 + i * 3.1) + i) * 5 + Math.sin(t * 7.3 + i * 2) * 4; });
    },
  };
}
