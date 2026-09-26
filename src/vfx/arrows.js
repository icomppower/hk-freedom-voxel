// Arrow VFX (render-only; reads the projectile pool src/combat/projectiles.js and its events, never writes sim state):
//  · instanced voxel arrows along their velocity (heavy ×1.6, the Musou giant ×5); stuck arrows stand in the ground at
//    their flight angle and sink away over their last 40 sf
//  · a bright streak behind every flying arrow (≈ 3 sf of travel: reads at 60-80 m/s where the arrow itself is a blur),
//    white-gold, orange for fire arrows, a long blazing wake for the giant
//  · embers shed by fire arrows, a pop of dust + splinters where an arrow bites the ground, a bow flash on every shot
//  · bursts: expanding fire / dust ring, a light flash and an ember fountain (sized by the burst radius)
//  · headshot: a gold star + needle burst over the officer's head
// Positions stay in sim space (y = height above ground); ground(x, z) is added when composing the matrices.
import * as THREE from 'three';
import { on } from '../core/events.js';
import { vrng } from '../core/rng.js';
import { vox } from '../hero/model.js';
import { AS, ARROW } from '../combat/projectiles.js';
import { ground } from '../world/map.js';
import { lensClear } from '../camera/occlusion.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _d = new THREE.Vector3();
const _c = new THREE.Color(), FWD = new THREE.Vector3(0, 0, 1), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const B = (a, b, c) => ({ a, b, c });

function instanced(parent, geo, mat, n, color) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.frustumCulled = false;
  for (let i = 0; i < n; i++) { m.setMatrixAt(i, ZERO); if (color) m.setColorAt(i, _c.setRGB(1, 1, 1)); }
  parent.add(m);
  return m;
}
// lensClear: an additive spark within 3 m of the lens filled the frame as a flat pale square (critic: burst screenshots)
const addMat = (o = {}) => lensClear(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, ...o }), 3);

export function createArrowView(scene, game, proj) {
  const root = new THREE.Group();
  scene.add(root);
  const N = proj.N;
  // arrow: tip at the origin, shaft back along −Z (0.95 m): steel head, dark shaft, white-red fletching
  const geo = vox([B([0, 0, -43], [1, 1, 0], (x, y, z) => (z > -4 ? 0xd8dee6 : z < -38 ? 0xf2efe8 : 0x4a2c22)),
    B([-1, 0, -3], [2, 1, -1], 0xc0c8d2), B([-1, 0, -42], [2, 1, -37], 0xf2efe8), B([0, -1, -42], [1, 2, -37], 0xb3261e)], 0.022,
  { off: [-0.5, -0.5, 0], jitter: 0, ao: 0.1 });
  const arrows = instanced(root, geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, flatShading: true }), N);
  arrows.castShadow = true;
  const streak = instanced(root, new THREE.BoxGeometry(1, 1, 1).translate(0, 0, -0.5), addMat(), N, true);
  // ember / spark particles: small additive cubes with velocity and life (visual RNG)
  const NP = 900, pe = { m: instanced(root, new THREE.BoxGeometry(1, 1, 1), addMat(), NP, true), next: 0,
    x: new Float32Array(NP * 3), v: new Float32Array(NP * 3), life: new Float32Array(NP), max: new Float32Array(NP), size: new Float32Array(NP), g: new Float32Array(NP) };
  const spark = (x, y, z, vx, vy, vz, life, size, r, g, b, grav = -3) => {
    const i = pe.next; pe.next = (pe.next + 1) % NP;
    pe.x.set([x, y, z], i * 3); pe.v.set([vx, vy, vz], i * 3); pe.life[i] = pe.max[i] = life; pe.size[i] = size; pe.g[i] = grav;
    pe.m.setColorAt(i, _c.setRGB(r, g, b)); pe.m.instanceColor.needsUpdate = true;
  };
  const embers = (x, y, z, n, spd, up, k = 1) => {
    for (let i = 0; i < n; i++) {
      const a = vrng.range(0, 6.283), s = spd * vrng.range(0.2, 1), w = vrng.range(0.6, 1.2) * k;
      spark(x, y, z, Math.cos(a) * s, vrng.range(0.3, 1) * up, Math.sin(a) * s, vrng.range(0.35, 0.9), vrng.range(0.04, 0.09), 2.6 * w, 1.0 * w, 0.25 * w, 2.5);
    }
  };
  const dust = (x, z, n, spd) => {
    for (let i = 0; i < n; i++) {
      const a = vrng.range(0, 6.283), s = spd * vrng.range(0.3, 1);
      spark(x, 0.05, z, Math.cos(a) * s, vrng.range(0.6, 2), Math.sin(a) * s, vrng.range(0.25, 0.5), vrng.range(0.05, 0.1), 0.34, 0.26, 0.18, -6);
    }
  };
  // burst rings (flat additive discs that expand and fade) + a light
  const NR = 8, ringGeo = new THREE.RingGeometry(0.82, 1, 48).rotateX(-Math.PI / 2);
  const rings = Array.from({ length: NR }, () => { const m = new THREE.Mesh(ringGeo, addMat({ side: THREE.DoubleSide })); m.visible = false; m.frustumCulled = false; root.add(m); return { m, age: 1, dur: 1, r: 1 }; });
  let ringNext = 0;
  const ring = (x, z, r, dur, rgb) => {
    const R = rings[ringNext]; ringNext = (ringNext + 1) % NR;
    R.m.position.set(x, 0.12 + ground(x, z), z); R.age = 0; R.dur = dur; R.r = r; R.m.material.color.setRGB(...rgb); R.m.visible = true;
  };
  const light = new THREE.PointLight(0xff9a40, 0, 22, 1.6);
  root.add(light);
  let lightK = 0;
  const prev = new Int32Array(N);                                     // pool state last render: fly → stuck = a ground bite

  on('arrow:fire', (e) => {
    const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw), big = e.big > 1 ? 3 : e.heavy ? 1.6 : 1;
    for (let i = 0; i < 6 * big; i++) {
      const s = vrng.range(3, 9) * big;
      spark(e.x + fx * 0.3, e.y, e.z + fz * 0.3, fx * s + vrng.range(-1.5, 1.5), vrng.range(-0.8, 1.6), fz * s + vrng.range(-1.5, 1.5), vrng.range(0.08, 0.18), 0.05 * big,
        e.fire ? 2.8 : 2.2, e.fire ? 1.2 : 1.9, e.fire ? 0.3 : 1.2, 0);
    }
    if (e.heavy || e.big) { lightK = Math.max(lightK, e.big > 1 ? 3 : 1.2); light.position.set(e.x, e.y + 0.3 + ground(e.x, e.z), e.z); light.color.setHex(e.fire ? 0xff8a30 : 0xfff0d0); }
  });
  on('arrow:burst', (e) => {
    const k = Math.min(2.5, e.r / 2.5);
    ring(e.x, e.z, e.r * 1.15, 0.35 + 0.1 * k, e.fire ? [2.2, 0.9, 0.25] : [1.2, 1.0, 0.7]);
    if (e.r > 3) ring(e.x, e.z, e.r * 0.7, 0.5, e.fire ? [1.6, 0.5, 0.1] : [0.7, 0.6, 0.45]);
    embers(e.x, 0.3, e.z, Math.round((e.fire ? 18 : 6) * (0.6 + k)), 3 + 2 * k, 4 + 3 * k, e.fire ? 1 : 0.6);
    dust(e.x, e.z, Math.round(8 * (0.6 + k)), 3 + 2 * k);
    lightK = Math.max(lightK, e.big > 1 ? 8 : 1 + k); light.position.set(e.x, 1.2 + k + ground(e.x, e.z), e.z); light.color.setHex(e.fire ? 0xff7a28 : 0xffe0b0);
  });
  on('arrow:headshot', (e) => {
    for (let i = 0; i < 26; i++) {
      const a = vrng.range(0, 6.283), b = vrng.range(-1, 1), s = vrng.range(4, 10);
      spark(e.x, e.y, e.z, Math.cos(a) * s * Math.sqrt(1 - b * b), b * s, Math.sin(a) * s * Math.sqrt(1 - b * b), vrng.range(0.15, 0.35), 0.07, 3, 2.2, 0.6, 0);
    }
    ring(e.x, e.z, 1.6, 0.3, [2.4, 1.8, 0.5]);
  });
  on('scenario', () => { pe.life.fill(0); for (const r of rings) r.m.visible = false; lightK = 0; prev.fill(0); });

  const COL = { plain: [1.6, 1.45, 1.1], heavy: [2.2, 1.9, 1.3], fire: [3.0, 1.2, 0.3], giant: [3.2, 1.6, 0.5] };
  let emberAcc = 0;
  return {
    update(dt) {
      const P = proj;
      emberAcc += dt;
      const shed = emberAcc > 1 / 60; if (shed) emberAcc = 0;
      for (let i = 0; i < N; i++) {
        const st = P.st[i];
        if (!st) { if (prev[i]) { arrows.setMatrixAt(i, ZERO); streak.setMatrixAt(i, ZERO); } prev[i] = 0; continue; }
        const big = P.big[i] === 2 ? 5 : P.big[i] ? 1.6 : 1, sky = P.kind[i] === 3;
        _d.set(P.vx[i], P.vy[i], P.vz[i]);
        const v = _d.length();
        if (v > 1e-4) _d.divideScalar(v); else _d.set(0, -1, 0);
        _q.setFromUnitVectors(FWD, _d);
        let y = P.y[i];
        if (st === AS.STUCK) {
          if (prev[i] === AS.FLY) { dust(P.x[i], P.z[i], 3, 1.5); if (P.fire[i]) embers(P.x[i], 0.1, P.z[i], 4, 1, 2); }
          y -= 0.14 * big + Math.max(0, P.t[i] - (ARROW.stuck - 40)) / 40 * 0.9 * big;
          streak.setMatrixAt(i, ZERO);
        } else {
          const col = P.big[i] === 2 ? COL.giant : P.fire[i] ? COL.fire : P.big[i] ? COL.heavy : COL.plain;
          const len = big > 2 ? Math.min(10, 2 + P.t[i] * 0.4) : Math.min(3.2, v * 0.05) * (sky ? 1.4 : 1), w = big > 2 ? 0.7 : 0.035 * big * (P.fire[i] ? 1.6 : 1);
          _m.compose(_p.set(P.x[i], y + ground(P.x[i], P.z[i]), P.z[i]).addScaledVector(_d, -0.4 * big), _q, _s.set(w, w, len));
          streak.setMatrixAt(i, _m); streak.setColorAt(i, _c.setRGB(...col));
          if (shed && (P.fire[i] || big > 2)) {                         // embers peel off the flame
            const n = big > 2 ? 6 : 1;
            for (let k = 0; k < n; k++) spark(P.x[i] - _d.x * vrng.range(0, 1.5 * big), y + vrng.range(-0.2, 0.2) * big, P.z[i] - _d.z * vrng.range(0, 1.5 * big),
              vrng.range(-1, 1), vrng.range(0.5, 2), vrng.range(-1, 1), vrng.range(0.25, 0.6), vrng.range(0.04, 0.08) * (big > 2 ? 2 : 1), 2.8, 1.1, 0.25, 1.5);
          }
        }
        _m.compose(_p.set(P.x[i], y + ground(P.x[i], P.z[i]), P.z[i]), _q, _s.setScalar(big));
        arrows.setMatrixAt(i, _m);
        prev[i] = st;
      }
      arrows.instanceMatrix.needsUpdate = true; streak.instanceMatrix.needsUpdate = true;
      if (streak.instanceColor) streak.instanceColor.needsUpdate = true;
      // particles
      let any = false;
      for (let i = 0; i < NP; i++) {
        if (pe.life[i] <= 0) continue;
        pe.life[i] -= dt;
        if (pe.life[i] <= 0) { pe.m.setMatrixAt(i, ZERO); any = true; continue; }
        const j = i * 3;
        pe.v[j + 1] += pe.g[i] * dt;
        pe.x[j] += pe.v[j] * dt; pe.x[j + 1] = Math.max(0.02, pe.x[j + 1] + pe.v[j + 1] * dt); pe.x[j + 2] += pe.v[j + 2] * dt;
        const s = pe.size[i] * Math.min(1, pe.life[i] / pe.max[i] * 2);
        _m.compose(_p.set(pe.x[j], pe.x[j + 1] + ground(pe.x[j], pe.x[j + 2]), pe.x[j + 2]), _q.identity(), _s.setScalar(s));
        pe.m.setMatrixAt(i, _m); any = true;
      }
      if (any) pe.m.instanceMatrix.needsUpdate = true;
      for (const R of rings) {
        if (!R.m.visible) continue;
        R.age += dt;
        const u = R.age / R.dur;
        if (u >= 1) { R.m.visible = false; continue; }
        R.m.scale.setScalar(R.r * (0.25 + 0.75 * (1 - (1 - u) * (1 - u))));
        R.m.material.opacity = 1 - u;
      }
      lightK *= Math.exp(-dt * 7);
      light.intensity = lightK > 0.02 ? lightK * 6 : 0;
    },
    dispose() {
      scene.remove(root);
      ringGeo.dispose();
      root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    },
  };
}
