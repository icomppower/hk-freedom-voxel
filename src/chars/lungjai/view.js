// 龍仔's Musou view (render-only; reads game.musou = ./musou.js, never writes sim state): 龍拳 in hard-hat gold.
//  · activation: a dark-gold vignette and the calligraphy cut-in (無雙 + 龍拳 + the 龍 seal)
//  · the spins: a gold swirl ring at each spin's reach, fading
//  · the dash: a gold streak on the ground along the 8 m path
//  · the finisher: a gold shockwave ring riding the sim's wave radius, and a golden dragon — a coil of glowing boxes
//    (head, body segments tapering to the tail) that spirals out of the fist round the ring and rises; gold sparks on vrng
import * as THREE from 'three';
import { on } from '../../core/events.js';
import { vrng } from '../../core/rng.js';
import { createOverlay, ramp } from '../../musou/overlay.js';
import { ground } from '../../world/map.js';
import { LUNGJAI_MUSOU as M } from './musou.js';

const GOLD = new THREE.Color(2.6, 1.9, 0.35), PALE = new THREE.Color(2.4, 2.1, 1.0);
const SEGS = 26;                                                    // dragon body segments

export function createMusouView(scene, game) {
  const mu = game.musou, hero = game.hero, root = new THREE.Group();
  scene.add(root);
  const ov = createOverlay({ sub: '龍拳', seal: '龍',
    css: { big: 'color:#fff6c8; text-shadow: 0 0 2vh rgba(255,215,0,.9), 0 0 5vh rgba(255,180,0,.5);', sub: 'color:#ffe680; text-shadow: 0 0 1vh rgba(0,0,0,.7);' } });
  ov.dim.style.background = 'radial-gradient(ellipse at 50% 55%, rgba(255,236,170,1) 25%, rgba(40,32,0,1) 100%)';
  ov.wash.style.background = 'radial-gradient(circle at 50% 60%, rgba(255,236,150,0.9), rgba(255,200,0,0.2) 70%)';

  const addMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const flat = (r0, r1, c) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 72, 1), addMat(c)); m.rotation.x = -Math.PI / 2; m.visible = false; root.add(m); return m; };
  const wave = flat(0.9, 1, GOLD), swirl = flat(0.86, 1, PALE);
  const streak = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1), addMat(GOLD)); streak.rotation.x = -Math.PI / 2; streak.visible = false; root.add(streak);
  // the dragon: instanced boxes, head bigger, tapering to the tail
  // opaque HDR gold (blooms); it fades by shrinking, not by opacity (a transparent instanced coil read dark under the DoF)
  const dragon = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.3, 0.5), fog: false, toneMapped: false }), SEGS);
  dragon.frustumCulled = false; dragon.visible = false; root.add(dragon);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), e3 = new THREE.Euler();

  // sparks: gold points blown out of the ring
  const N = 200, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ color: GOLD, size: 0.12, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
  sparks.frustumCulled = false; root.add(sparks);
  const burst = (x, z, r) => {
    for (let i = 0; i < N; i++) {
      const a = vrng.range(0, Math.PI * 2), rr = r * vrng.range(0.2, 1), s = vrng.range(4, 10);
      pos[i * 3] = x + Math.sin(a) * rr; pos[i * 3 + 1] = ground(x, z) + vrng.range(0.2, 1.4); pos[i * 3 + 2] = z + Math.cos(a) * rr;
      vel[i * 3] = Math.sin(a) * s; vel[i * 3 + 1] = vrng.range(2, 8); vel[i * 3 + 2] = Math.cos(a) * s;
      life[i] = vrng.range(0.8, 1.8);
    }
  };
  for (let i = 0; i < N; i++) pos[i * 3 + 1] = -999;
  const subs = [on('musou:burst', (e) => { if (game.musou === mu) burst(e.x, e.z, 3); })];

  let flash = 0;
  return {
    update(dt) {
      const t = mu.active ? mu.t : 0, gy = ground(hero.x, hero.z);
      const dimK = mu.active ? 0.55 * ramp(t, 0, 8) * (1 - ramp(t, M.activation - 4, M.activation + 8)) : 0;
      ov.show(ov.dim, dimK);
      ov.cut(t, 6, mu.active ? ramp(t, 6, 10) * (1 - ramp(t, M.activation + 4, M.activation + 14)) : 0, ramp(t, 6, 12));
      if (mu.active && t === M.finisher) flash = 1;
      flash = Math.max(0, flash - dt * 2.2);
      ov.show(ov.wash, flash * 0.5);
      // spin swirls
      let sw = -1;
      M.spins.forEach((f, j) => { if (mu.active && t >= f - 6 && t < f + 18) sw = j; });
      swirl.visible = sw >= 0;
      if (sw >= 0) {
        const f = M.spins[sw];
        swirl.position.set(hero.x, gy + 0.1, hero.z); swirl.scale.setScalar(M.spinR[sw] * (0.6 + 0.4 * ramp(t, f - 6, f + 2)));
        swirl.material.opacity = 0.75 * (1 - ramp(t, f + 2, f + 18));
      }
      // dash streak: from the dash start to the hero
      const ds = mu.active && t > M.dash[0] && t < M.dash[1] + 24;
      streak.visible = ds;
      if (ds) {
        const x0 = mu.dx0, z0 = mu.dz0, dx = hero.x - x0, dz = hero.z - z0, L = Math.max(0.3, Math.hypot(dx, dz));
        streak.position.set(x0 + dx / 2, ground(x0 + dx / 2, z0 + dz / 2) + 0.1, z0 + dz / 2);
        streak.rotation.z = Math.atan2(dx, dz); streak.scale.set(1, L, 1);
        streak.material.opacity = 0.8 * (1 - ramp(t, M.dash[1], M.dash[1] + 24));
      }
      // shockwave ring
      const wv = mu.active && t >= M.finisher && t < M.finisher + M.waveFrames + 16;
      wave.visible = wv;
      if (wv) {
        wave.position.set(hero.x, gy + 0.12, hero.z); wave.scale.setScalar(Math.max(0.8, mu.waveR));
        wave.material.opacity = 1.2 * (1 - ramp(t, M.finisher + 4, M.finisher + M.waveFrames + 16));
      }
      // the golden dragon: its head leads a spiral out of the fist round the ring radius, rising; body follows the path
      const dg = mu.active && t >= M.finisher - 2 && t < M.end;
      dragon.visible = dg;
      if (dg) {
        const k = (t - M.finisher + 2) / (M.end - M.finisher + 2);
        const path = (u) => {                                          // u 0 = fist → 1 = head's current place
          const a = hero.yaw + u * 5.2, r = 1 + u * M.waveR * 0.75, y = gy + 0.9 + u * 3.2;
          return p3.set(hero.x + Math.sin(a) * r, y, hero.z + Math.cos(a) * r);
        };
        for (let i = 0; i < SEGS; i++) {
          const u = Math.max(0, k * 1.25 - i * 0.035), w = i === 0 ? 0.75 : 0.55 * (1 - i / SEGS) + 0.12;
          path(u);
          e3.set(0, hero.yaw + u * 5.2 + Math.PI / 2, Math.sin(i * 0.8 + t * 0.3) * 0.4); q.setFromEuler(e3);
          const fade = 1 - ramp(t, M.end - 16, M.end);
          s3.set(w * fade, w * (i === 0 ? 0.8 : 0.9) * fade, w * 1.3 * fade);
          dragon.setMatrixAt(i, m4.compose(p3, q, s3));
        }
        dragon.instanceMatrix.needsUpdate = true;
      }
      let live = false;
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) continue;
        live = true; life[i] -= dt;
        vel[i * 3] *= 1 - 1.8 * dt; vel[i * 3 + 2] *= 1 - 1.8 * dt; vel[i * 3 + 1] -= 6 * dt;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (life[i] <= 0) pos[i * 3 + 1] = -999;
      }
      sparks.visible = live;
      if (live) geo.attributes.position.needsUpdate = true;
    },
    dispose() {
      scene.remove(root); ov.dispose();
      root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      void subs;
    },
  };
}
