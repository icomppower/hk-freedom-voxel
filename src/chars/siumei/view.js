// 小美's Musou view (render-only; reads game.musou = ./musou.js): 旋風腿 in pink and gold.
//  · activation: a pink vignette and the calligraphy cut-in (無雙 + 旋風腿 + the 美 seal)
//  · the zig-zag: a pink streak along every dash leg, fading
//  · the tornado: a gold swirl ring round her
//  · the finisher: the umbrellas close — a pink ring and a gold ring expanding to 6 m, two gold light beams, a flash
import * as THREE from 'three';
import { createOverlay, ramp } from '../../musou/overlay.js';
import { ground } from '../../world/map.js';
import { SIUMEI_MUSOU as M } from './musou.js';

const RED = new THREE.Color(3.0, 0.9, 1.4), STEEL = new THREE.Color(2.6, 2.0, 0.4);   // pink, gold
export function createMusouView(scene, game) {
  const mu = game.musou, hero = game.hero, root = new THREE.Group();
  scene.add(root);
  const ov = createOverlay({ sub: '旋風腿', seal: '美',
    css: { big: 'color:#fff0ee; text-shadow: 0 0 2vh rgba(255,140,190,.9), 0 0 5vh rgba(255,200,0,.5);', sub: 'color:#ffe0ee; text-shadow: 0 0 1vh rgba(0,0,0,.6);' } });
  ov.dim.style.background = 'radial-gradient(ellipse at 50% 55%, rgba(255,235,230,1) 30%, rgba(110,30,70,1) 100%)';
  ov.wash.style.background = 'radial-gradient(circle at 50% 60%, rgba(255,230,225,0.9), rgba(255,200,0,0.25) 70%)';
  const mat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const streaks = [0, 1, 2, 3, 4, 5].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.14), mat(RED)); m.visible = false; root.add(m); return m; });
  const ring = (c) => { const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64, 1), mat(c)); m.rotation.x = -Math.PI / 2; m.visible = false; root.add(m); return m; };
  const swirl = ring(STEEL), xRing = ring(RED);
  const xBlades = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.08), mat(STEEL)); m.visible = false; root.add(m); return m; });
  let flash = 0;
  return {
    update(dt) {
      const t = mu.active ? mu.t : 0, gy = ground(hero.x, hero.z);
      ov.show(ov.dim, mu.active ? 0.55 * ramp(t, 0, 8) * (1 - ramp(t, M.activation, M.activation + 10)) : 0);
      ov.cut(t, 4, mu.active ? ramp(t, 4, 8) * (1 - ramp(t, M.activation + 2, M.activation + 12)) : 0, ramp(t, 4, 10));
      if (mu.active && t === M.finisher) flash = 1;
      flash = Math.max(0, flash - dt * 2.4); ov.show(ov.wash, flash * 0.5);
      // dash streaks: one per finished leg, a flat red band along it at chest height, fading over 40 f
      streaks.forEach((m, k) => {
        const L = mu.active && mu.legs[k];
        m.visible = !!L && t - L[4] < 40;
        if (!m.visible) return;
        const [x0, z0, x1, z1] = L, len = Math.hypot(x1 - x0, z1 - z0) || 0.1;
        m.position.set((x0 + x1) / 2, ground((x0 + x1) / 2, (z0 + z1) / 2) + 1.0, (z0 + z1) / 2);
        m.rotation.set(0, Math.atan2(x1 - x0, z1 - z0) - Math.PI / 2, 0.12 * (k % 2 ? 1 : -1));
        m.scale.set(len, 1, 1);
        m.material.opacity = 1.1 * (1 - (t - L[4]) / 40);
      });
      // tornado swirl
      const tw = mu.active && t >= M.tornado[0] - 8 && t < M.tornado[3] + 14;
      swirl.visible = tw;
      if (tw) { swirl.position.set(hero.x, gy + 0.3, hero.z); swirl.scale.setScalar(2.6 * (0.7 + 0.3 * Math.sin(t * 0.5))); swirl.rotation.z = t * 0.4; swirl.material.opacity = 0.8 * (1 - ramp(t, M.tornado[3], M.tornado[3] + 14)); }
      // the X ring
      const xw = mu.active && t >= M.finisher && t < M.finisher + 24;
      xRing.visible = xw; xBlades.forEach((b) => { b.visible = xw; });
      if (xw) {
        const u = (t - M.finisher) / 24, r = 0.8 + 5.2 * (1 - (1 - u) ** 3), a = 1.2 * (1 - u);
        xRing.position.set(hero.x, gy + 0.12, hero.z); xRing.scale.setScalar(r); xRing.material.opacity = a;
        xBlades.forEach((b, j) => {
          b.position.set(hero.x, gy + 1.1, hero.z); b.scale.set(r * 2, 1.4, 1);
          b.rotation.set(0, mu.yaw0 + (j ? 0.785 : -0.785), 0); b.material.opacity = a;
        });
      }
    },
    dispose() { scene.remove(root); ov.dispose(); root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
}
