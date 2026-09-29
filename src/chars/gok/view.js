// 阿角's Musou view (render-only; reads game.musou = ./musou.js, never writes sim state): 牧羊歸欄 in warm cream / gold.
//  · activation: a dusk-gold vignette (display-space multiply) and the calligraphy cut-in (無雙 + 牧羊歸欄 + the 角 seal)
//  · the round-up: a gold hook arc sweeping the pull radius on the ground
//  · the spins: a cream swirl ring at each sweep's reach, fading
//  · the finisher: a cream shockwave ring on the ground riding the sim's wave radius, a warm wash, and wool fluff
//    blown out of the ring (points on vrng: visual randomness only)
import * as THREE from 'three';
import { on } from '../../core/events.js';
import { vrng } from '../../core/rng.js';
import { createOverlay, ramp } from '../../musou/overlay.js';
import { ground } from '../../world/map.js';
import { GOK_MUSOU as M } from './musou.js';

const CREAM = new THREE.Color(2.2, 1.95, 1.5), GOLD = new THREE.Color(2.4, 1.6, 0.6);

export function createMusouView(scene, game) {
  const mu = game.musou, hero = game.hero, root = new THREE.Group();
  scene.add(root);
  const ov = createOverlay({ sub: '牧羊歸欄', seal: '角',
    css: { big: 'color:#fff3d6; text-shadow: 0 0 2vh rgba(255,214,140,.85), 0 0 5vh rgba(255,180,90,.5);', sub: 'color:#f7e6c4; text-shadow: 0 0 1vh rgba(0,0,0,.6);' } });
  ov.dim.style.background = 'radial-gradient(ellipse at 50% 55%, rgba(255,240,215,1) 30%, rgba(120,84,40,1) 100%)';
  ov.wash.style.background = 'radial-gradient(circle at 50% 60%, rgba(255,236,196,0.9), rgba(255,200,120,0.2) 70%)';

  const ringMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const flat = (r0, r1, c) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 72, 1), ringMat(c)); m.rotation.x = -Math.PI / 2; m.visible = false; root.add(m); return m; };
  const wave = flat(0.9, 1, CREAM), swirl = flat(0.86, 1, CREAM), hook = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 48, 1, 0, Math.PI * 0.9), ringMat(GOLD));
  hook.rotation.x = -Math.PI / 2; hook.visible = false; root.add(hook);

  // wool fluff: soft cream points blown out of the shockwave, light drag, slow fall
  const N = 220, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const fluff = new THREE.Points(geo, new THREE.PointsMaterial({ color: new THREE.Color(1.6, 1.5, 1.3), size: 0.16, transparent: true, opacity: 0.9, depthWrite: false }));
  fluff.frustumCulled = false; root.add(fluff);
  const burst = (x, z, r) => {
    for (let i = 0; i < N; i++) {
      const a = vrng.range(0, Math.PI * 2), rr = r * vrng.range(0.2, 1), s = vrng.range(3, 8);
      pos[i * 3] = x + Math.sin(a) * rr; pos[i * 3 + 1] = ground(x, z) + vrng.range(0.2, 1.4); pos[i * 3 + 2] = z + Math.cos(a) * rr;
      vel[i * 3] = Math.sin(a) * s; vel[i * 3 + 1] = vrng.range(2, 6); vel[i * 3 + 2] = Math.cos(a) * s;
      life[i] = vrng.range(1.2, 2.4);
    }
  };
  for (let i = 0; i < N; i++) pos[i * 3 + 1] = -999;
  const subs = [on('musou:burst', (e) => { if (game.musou === mu) burst(e.x, e.z, 3); })];

  let flash = 0;
  return {
    update(dt) {
      const t = mu.active ? mu.t : 0, gy = ground(hero.x, hero.z);
      // grade + cut-in
      const dimK = mu.active ? 0.55 * ramp(t, 0, 10) * (1 - ramp(t, M.activation - 4, M.activation + 8)) : 0;
      ov.show(ov.dim, dimK);
      ov.cut(t, 10, mu.active ? ramp(t, 10, 14) * (1 - ramp(t, M.activation + 4, M.activation + 14)) : 0, ramp(t, 10, 16));
      if (mu.active && t === M.finisher) flash = 1;
      flash = Math.max(0, flash - dt * 2.2);
      ov.show(ov.wash, flash * 0.55);
      // hook arc on the ground through the round-up
      const hk = mu.active && t >= M.pull - 8 && t < M.pull + M.pullFrames;
      hook.visible = hk;
      if (hk) {
        const u = ramp(t, M.pull - 8, M.pull + 2), r = M.pullR * (1 - 0.7 * ramp(t, M.pull, M.pull + M.pullFrames));
        hook.position.set(hero.x, gy + 0.08, hero.z); hook.scale.setScalar(r); hook.rotation.z = hero.yaw + u * 5.5;
        hook.material.opacity = 0.9 * (1 - ramp(t, M.pull + 6, M.pull + M.pullFrames));
      }
      // spin swirls
      let sw = -1;
      M.spins.forEach((f, j) => { if (mu.active && t >= f - 6 && t < f + 18) sw = j; });
      swirl.visible = sw >= 0;
      if (sw >= 0) {
        const f = M.spins[sw];
        swirl.position.set(hero.x, gy + 0.1, hero.z); swirl.scale.setScalar(M.spinR[sw] * (0.6 + 0.4 * ramp(t, f - 6, f + 2)));
        swirl.material.opacity = 0.7 * (1 - ramp(t, f + 2, f + 18));
      }
      // shockwave ring
      const wv = mu.active && t >= M.finisher && t < M.finisher + M.waveFrames + 16;
      wave.visible = wv;
      if (wv) {
        wave.position.set(hero.x, gy + 0.12, hero.z); wave.scale.setScalar(Math.max(0.8, mu.waveR));
        wave.material.opacity = 1.1 * (1 - ramp(t, M.finisher + 4, M.finisher + M.waveFrames + 16));
      }
      // fluff
      let live = false;
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) continue;
        live = true; life[i] -= dt;
        vel[i * 3] *= 1 - 2.2 * dt; vel[i * 3 + 2] *= 1 - 2.2 * dt; vel[i * 3 + 1] -= 3.5 * dt;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (life[i] <= 0) pos[i * 3 + 1] = -999;
      }
      fluff.visible = live;
      if (live) geo.attributes.position.needsUpdate = true;
    },
    dispose() {
      scene.remove(root); ov.dispose();
      root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      void subs;
    },
  };
}
