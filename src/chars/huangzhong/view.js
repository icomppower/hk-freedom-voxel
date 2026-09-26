// Huang Zhong's kit view (render-only; reads game.musou = the kit sim of musou.js, never writes sim state):
//  · the arrows (src/vfx/arrows.js)
//  · aim mode: a dotted flight path of the next arrow (same integrator as the sim: speed, gravity, ground) that turns
//    gold where it would take a standing officer in the head, plus a ring where it lands
//  · 真・無雙「百步穿楊」 presentation: warm ember-night dim through the activation and close-up (display-space multiply,
//    centred on him), cut-frame flash, calligraphy cut-in (無雙 + 老將 seal), embers gathering on the giant draw, a
//    blaze light riding the giant arrow, a warm screen wash on the release and on the explosion.
import * as THREE from 'three';
import { on } from '../../core/events.js';
import { vrng } from '../../core/rng.js';
import { ST } from '../../crowd/crowd.js';
import { createArrowView } from '../../vfx/arrows.js';
import { ARROW } from '../../combat/projectiles.js';
import { ground } from '../../world/map.js';
import { AIM } from './aim.js';
import { HZ_MUSOU as M, GIANT_FRAMES } from './musou.js';

const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _c = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ramp = (t, a, b) => clamp01((t - a) / (b - a));

export function createMusouView(parent, game, camera) {
  const mu = game.musou, hero = game.hero;
  const scene = new THREE.Group();
  parent.add(scene);
  const arrows = createArrowView(scene, game, mu.proj);
  const addMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });

  // ---- aim preview: dots along the predicted flight + landing ring
  const ND = 40;
  const dots = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), addMat(), ND);
  dots.frustumCulled = false; dots.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < ND; i++) { dots.setMatrixAt(i, ZERO); dots.setColorAt(i, _c.setRGB(1, 1, 1)); }
  scene.add(dots);
  const land = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 32).rotateX(-Math.PI / 2), addMat());
  land.visible = false; scene.add(land);
  /** Officer whose head the point (x, y, z) passes (standing, within 0.5 m and y in the head band), else -1. */
  function headAt(x, y, z) {
    const c = game.crowd;
    for (let i = c.grunts; i < c.N; i++) {
      const s = c.st[i];
      if (s === ST.OFF || s === ST.DEAD || s === ST.AIR || s === ST.DOWN) continue;
      const dx = c.x[i] - x, dz = c.z[i] - z;
      if (dx * dx + dz * dz < 0.5 * 0.5 && y - c.y[i] >= ARROW.headY && y - c.y[i] <= ARROW.standH + 0.25) return i;
    }
    return -1;
  }
  function updateAim() {
    const A = mu.aim;
    if (!A.active) { if (dots.visible) { dots.visible = false; land.visible = false; } return; }
    dots.visible = true;
    const S = AIM.base, cp = Math.cos(A.pitch);
    let x = hero.x + Math.sin(A.yaw) * ARROW.ahead, y = hero.y + ARROW.heroY, z = hero.z + Math.cos(A.yaw) * ARROW.ahead;
    let vx = Math.sin(A.yaw) * cp * S.speed, vy = Math.sin(A.pitch) * S.speed, vz = Math.cos(A.yaw) * cp * S.speed;
    const life = Math.round(S.range / S.speed * 60), pulse = 0.75 + 0.25 * Math.sin(performance.now() / 90);
    let n = 0, gold = false;
    for (let f = 1; f <= 90 && n < ND; f++) {                   // same integrator as projectiles.js (flat, then spent)
      const spent = f > life;
      vy -= (spent ? 30 : S.g) / 60 * 1; if (spent) { vx *= 0.97; vz *= 0.97; }
      x += vx / 60; y += vy / 60; z += vz / 60;
      if (y <= 0) break;
      if (!gold && headAt(x, y, z) >= 0) gold = true;
      if (f % 2 === 0 && f > 2) {
        const k = 1 - n / ND, s = 0.045 + 0.02 * A.d;
        _m.compose(_p.set(x, y + ground(x, z), z), _q.identity(), _s.setScalar(s));
        dots.setMatrixAt(n, _m);
        dots.setColorAt(n, gold ? _c.setRGB(2.6 * pulse, 1.8 * pulse, 0.3) : _c.setRGB(0.9 * k + 0.3, 1.1 * k + 0.3, 1.3 * k + 0.3));
        n++;
      }
    }
    for (let i = n; i < ND; i++) dots.setMatrixAt(i, ZERO);
    dots.instanceMatrix.needsUpdate = true; dots.instanceColor.needsUpdate = true;
    land.visible = y <= 0.05;
    if (land.visible) { land.position.set(x, 0.06 + ground(x, z), z); land.material.color.setRGB(gold ? 2.4 : 1.2, gold ? 1.7 : 1.1, gold ? 0.3 : 0.8); }
  }

  // ---- Musou grade (DOM layers above the canvas, below the HUD) + cut-in
  const layer = (blend) => { const d = document.createElement('div'); d.style.cssText = `position:fixed;inset:0;pointer-events:none;opacity:0;display:none;mix-blend-mode:${blend}`; return d; };
  const dimEl = layer('multiply'), washEl = layer('screen');
  (document.getElementById('c') || document.body.firstChild).after(dimEl, washEl);
  const css = document.createElement('style');
  css.textContent = `
    .hz-cut { position: fixed; inset: 0; pointer-events: none; z-index: 5; opacity: 0; display: none; font-family: "Xingkai SC", "STXingkai", "Libian SC", "Kaiti SC", "STKaiti", serif; }
    .hz-cut .big { position: absolute; right: 11%; top: 36%; writing-mode: vertical-rl; font-size: 18vh; line-height: 1; color: #fbf1e2; transform-origin: 50% 40%;
      text-shadow: 0 0 2px #1a0c06, 6px 8px 0 rgba(20,6,2,.55), 0 0 28px rgba(255,150,60,.6); letter-spacing: -1vh; }
    .hz-cut .seal { position: absolute; right: 21.5%; top: 64%; width: 7vh; height: 7vh; background: #a8261b; color: #f3e2c8; border-radius: 0.8vh;
      font: 3.1vh/3.4vh "Kaiti SC", "STKaiti", serif; writing-mode: vertical-rl; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 0.35vh rgba(243,226,200,.25) inset, 3px 4px 0 rgba(0,0,0,.4); transform-origin: 50% 50%; }
    .hz-cut .sub { position: absolute; right: 22.5%; top: 37%; writing-mode: vertical-rl; font: 3vh/1 "Kaiti SC", "STKaiti", serif; letter-spacing: 1.2vh;
      color: #ffe2b8; text-shadow: 0 0 10px rgba(255,140,40,.75), 2px 2px 0 rgba(0,0,0,.6); }`;
  document.head.appendChild(css);
  const cut = document.createElement('div');
  cut.className = 'hz-cut';
  cut.innerHTML = '<div class="sub">老將 黃漢升</div><div class="big">無雙</div><div class="seal">老將</div>';
  document.body.appendChild(cut);
  const [cutSub, cutBig, cutSeal] = cut.children;
  const setStyle = (el, k, v) => { if (el.style[k] !== v) el.style[k] = v; };
  const show = (el, v) => { setStyle(el, 'display', v > 0 ? 'block' : 'none'); setStyle(el, 'opacity', v.toFixed(3)); };

  // ---- embers gathering on the giant draw + the blaze riding the giant arrow
  const NE = 160;
  const em = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), addMat(), NE);
  em.frustumCulled = false; em.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < NE; i++) { em.setMatrixAt(i, ZERO); em.setColorAt(i, _c.setRGB(2.6, 1.0, 0.25)); }
  scene.add(em);
  const eP = new Float32Array(NE * 4);                                // angle, radius, height, phase
  for (let i = 0; i < NE; i++) eP.set([vrng.range(0, 6.283), vrng.range(0.6, 2.4), vrng.range(0, 2.2), vrng.range(0, 1)], i * 4);
  const blaze = new THREE.PointLight(0xff8a30, 0, 26, 1.5);
  scene.add(blaze);

  let tv = -1, relF = -99, burstF = -99;
  on('musou:start', () => { tv = 0; });
  on('musou:burst', () => { burstF = game.frame; });
  on('arrow:fire', (e) => { if (e.big > 1) relF = game.frame; });
  on('scenario', () => { tv = -1; });

  function hideAll() { show(dimEl, 0); show(washEl, 0); show(cut, 0); em.visible = false; blaze.intensity = 0; }

  function updateGrade(t) {
    // dim: warm ember night on him (≈ 0.7× centre, 0.3× edges), lifting from the plant into the volley
    const dim = (t < 1 ? 0.45 : t < 2 ? 0.8 : 1) * (1 - ramp(t, M.plant, M.volley + 6));
    const redim = 0.55 * ramp(t, M.big, M.big + 12) * (1 - ramp(t, M.release, M.release + 3));   // the giant draw darkens again
    const d = Math.max(dim, redim);
    show(dimEl, d > 0.003 ? 1 : 0);
    if (d > 0.003) {
      const mul = (v) => Math.round(255 * (1 - d * (1 - v / 255)));
      _p.set(hero.x, 1.4 + ground(hero.x, hero.z), hero.z).project(camera);
      const hx = (clamp01(_p.x * 0.5 + 0.5) * 100).toFixed(1), hy = ((1 - clamp01(_p.y * 0.5 + 0.5)) * 100).toFixed(1);
      setStyle(dimEl, 'background', `radial-gradient(ellipse 32% 58% at ${hx}% ${hy}%, rgb(${mul(236)},${mul(190)},${mul(150)}) 0%, ` +
        `rgb(${mul(150)},${mul(96)},${mul(78)}) 55%, rgb(${mul(84)},${mul(52)},${mul(52)}) 100%)`);
    }
    const flash = t < 1 ? 0.1 : 0, washR = game.frame - relF < 3 ? 0.3 : 0, washB = game.frame - burstF < 3 ? 0.4 : 0;
    const wash = Math.max(flash, washR, washB);
    show(washEl, wash);
    if (wash > 0) setStyle(washEl, 'background', flash ? '#fff' : 'radial-gradient(ellipse at 50% 55%, rgba(255,246,226,1) 0%, rgba(255,200,140,.7) 35%, rgba(230,140,80,.3) 100%)');
  }
  function updateCut(t) {
    const k = ramp(t, M.closeup, M.closeup + 5) * (1 - ramp(t, M.plant - 4, M.plant + 4));
    show(cut, k);
    if (k <= 0) return;
    const st = ramp(t, M.closeup, M.closeup + 5), se = ramp(t, M.closeup + 8, M.closeup + 12);
    setStyle(cutBig, 'transform', `scale(${(1.6 - 0.6 * st * st).toFixed(3)}) translateY(${((t - M.closeup) * -0.06).toFixed(2)}vh)`);
    setStyle(cutSeal, 'transform', `scale(${(2.2 - 1.2 * se).toFixed(3)}) rotate(-8deg)`);
    setStyle(cutSeal, 'opacity', se.toFixed(3));
    setStyle(cutSub, 'opacity', ramp(t, M.closeup + 10, M.closeup + 20).toFixed(3));
  }
  function updateEmbers(t) {
    const k = ramp(t, M.big, M.big + 10) * (1 - ramp(t, M.release, M.release + 2));
    em.visible = k > 0;
    if (em.visible) {
      const u = ramp(t, M.big, M.release);
      for (let i = 0; i < NE; i++) {
        const a = eP[i * 4] + t * 0.05 * (1 + eP[i * 4 + 3]), ph = (eP[i * 4 + 3] + t / 40) % 1;
        const r = eP[i * 4 + 1] * (1 - 0.8 * ph) * (1.2 - u * 0.6), y = 0.2 + eP[i * 4 + 2] * (0.4 + ph);
        _m.compose(_p.set(hero.x + Math.sin(a) * r, y + ground(hero.x, hero.z), hero.z + Math.cos(a) * r), _q.identity(), _s.setScalar(0.05 * k * (1 - ph * 0.5)));
        em.setMatrixAt(i, _m);
      }
      em.instanceMatrix.needsUpdate = true;
    }
    // blaze light on the giant arrow in flight
    const g = mu.giantI, P = mu.proj;
    const flying = mu.active && g >= 0 && P.st[g] === 1 && P.big[g] === 2;
    blaze.intensity = flying ? 9 : k * 3;
    if (flying) blaze.position.set(P.x[g], P.y[g] + 0.8 + ground(P.x[g], P.z[g]), P.z[g]);
    else if (k > 0) blaze.position.set(hero.x, 1.6 + ground(hero.x, hero.z), hero.z);
  }

  let warm = 2;
  return {
    update(dt) {
      arrows.update(dt);
      updateAim();
      if (warm > 0 && tv < 0) { warm--; em.visible = dots.visible = true; return; }   // compile at boot, not mid-Musou
      if (mu.active) tv = mu.t;
      else if (tv >= 0) { tv += dt * 60; if (tv > M.end + GIANT_FRAMES) tv = -1; }
      if (tv < 0) { hideAll(); return; }
      updateGrade(tv);
      updateCut(tv);
      updateEmbers(tv);
    },
    dispose() {
      arrows.dispose();
      parent.remove(scene);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      for (const el of [dimEl, washEl, css, cut]) el.remove();
    },
  };
}
