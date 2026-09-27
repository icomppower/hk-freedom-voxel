// Title screen (#title, ui lane). DW-style key art over the live battlefield: Zhao Yun in front (spear planted, free fist
// thrown up) and Huang Zhong a step behind and to the right at full draw, looking into the lens, on their real voxel
// models (kit.model on their own rigs, cloth/hair chains), backlit by the low sun up the pass with the burning Wei camp,
// their 趙 / 黃 standards and rising embers behind them in deep bokeh; a slow push-in on enter, then a breathing drift
// (+ a little mouse parallax). The lens is fitted every frame to the pair's posed bounds, so both stay whole in the
// column right of the logo/menu band at any window shape (16:9, ultrawide, 4:3).
// Render-only: view(scene, camera, focus, dt) runs after the gameplay camera rig while this screen is up (main.js header).
// 2D: ink scrim band on the left carrying the logo (三國 seal + gold-leaf 無雙 + VOXEL MUSOU) and the menu, brush name
// tags projected beside each officer's head (hidden at ≤ 4:3), key/pad prompts along the bottom. First boot shows a
// "press any key" card (also unlocks audio); returns go straight to the menu.
// Menu: 第一章「定軍山」 → select {mode:'story'} · 自由演武 → select {mode:'free'} · 操作說明 → controls panel (Esc back).
// Mouse: hover highlights an item, click activates it.
// Screen contract: createTitle(el, flow) → { enter(ctx), exit(), view } (src/main.js header).
import * as THREE from 'three';
import { CHARS } from '../chars/index.js';
import { createRig, sampleClip, POSE_SIZE, HERO_SCALE, CH } from '../hero/rig.js';
import { heroLook } from '../hero/model.js';
import { createNav, sfx, inkWipe, wiping, afterWipe, stamp, clearStamp } from './menu.js';
import { ground, zone } from '../world/map.js';

// brush swash drawn under the focused item (revealed left → right) — one tapered stroke, dry tail
export const SWASH = `<svg class="swash" viewBox="0 0 400 26" preserveAspectRatio="none" aria-hidden="true"><path d="M3 15C40 7 118 4 214 8
  S352 11 397 5L395 9C368 15 330 17 280 18C226 19 170 17 128 19C84 21 38 22 3 15ZM300 20C330 19 360 17 384 14L382 16C356 20 326 22 300 20Z"/></svg>`;

const ITEMS = [
  { go: 'story', zh: '第一章「定軍山」', en: 'Story · Chapter I, Mount Dingjun' },
  { go: 'free', zh: '自由演武', en: 'Free battle · endless waves' },
  { go: 'controls', zh: '操作說明', en: 'Controls' },
];
export const CONTROLS = [   // also the pause menu's table (main.js)
  ['移動', 'Move', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows', 'left stick'],
  ['攻擊', 'Attack', '<kbd>J</kbd> / left click — tap for the full combo', '<kbd>X</kbd> □'],
  ['蓄力', 'Charge', '<kbd>K</kbd> / right click — mid-combo for charge attacks', '<kbd>Y</kbd> △'],
  ['跳躍', 'Jump', '<kbd>Space</kbd>', '<kbd>A</kbd> ×'],
  ['閃避', 'Dodge', '<kbd>L</kbd> / <kbd>Shift</kbd>', '<kbd>R1</kbd> <kbd>R2</kbd>'],
  ['無雙', 'Musou', '<kbd>I</kbd> — when the gold gauge is full', '<kbd>B</kbd> ○'],
  ['視角', 'Camera', 'mouse (click the field to lock it) / <kbd>Q</kbd><kbd>E</kbd>', 'right stick'],
  ['鎖定', 'Recenter', '<kbd>R</kbd> — behind you, or onto the nearest officer', '<kbd>L1</kbd> <kbd>L2</kbd>'],
  ['瞄準', 'Aim (黃忠)', 'hold <kbd>K</kbd> / right click (standing or running) — mouse or stick aims, release to loose', 'hold <kbd>Y</kbd> △'],
  ['暫停', 'Pause', '<kbd>Esc</kbd> (also frees the mouse)', ''],
];

// ---- key-art stage. Frame: origin on the pass road, camera looks +Z (up the valley, into the low sun → rim light).
// Cast offsets in metres (x + = world +X = screen-left), face = yaw (0 = facing +Z, π = facing the camera), pose = a held
// frame of one of the kit's own clips. banner = the officer's surname standard planted behind him.
export const STAGE = {
  at: 0.56,                    // stage point: this far up the pass zone (0 = south edge, 1 = north); the lens stays north
                               // of the origin, where the idle gameplay hero stands before any battle
  eye: 1.05, fov: 32,          // low heroic eye (m above the road), tilted up to the pair
  fitR: 0.93, fitT: 0.05, fitK: 0.98,   // framing (title.js view): right edge, top of the highest point, Zhao Yun's knees
  push: -0.3, pushT: 3.2,      // enter: start this much closer (on Zhao Yun), pull back to the pair over pushT s (the path
                               // stays between the lens and the officers: nothing on the road can cross it)
  embers: 240,
  // Zhao Yun in front (arm: armL FK override, degrees — the fist goes up, never toward Huang Zhong); Huang Zhong behind
  // and right at full draw (the aim clip), turned toward the lens (head: root-space look override) with the whole bow in
  // frame. x/z in metres; Huang Zhong's x closes in on narrow windows. tag = [x, y] rem from the head to the tag's top
  // centre. banner = the surname standard, behind its officer in the DoF (趙 over Zhao Yun's fist, 黃 behind Huang Zhong).
  cast: [
    { id: 'zhaoyun', clip: 'mu_act', u: 1, x: 0.2, z: 0, face: Math.PI + 0.1, arm: [-10, 0, 150, 15], look: [0.7, 1.8], tag: [-16, -2], banner: [-0.2, 7.5] },
    { id: 'huangzhong', clip: 'aim', u: 14 / 30, x: -1.7, z: 2, face: Math.PI + 0.6, head: [-4, -30, 0], look: [1.0, 2.0], tag: [-9, -1], banner: [-3.6, 9] },
  ],
};

// warm glows [x, y, z, width, height, r, g, b] in the stage frame
const GLOWS = [[1, 2.5, 30, 46, 16, 0.55, 0.24, 0.07], [-7, 1.2, 12, 9, 6, 0.9, 0.38, 0.08], [6, 0.8, 16, 7, 4, 0.7, 0.3, 0.06],
  [11, 3.5, 22, 26, 13, 0.42, 0.17, 0.05]];   // last: backlit smoke-glow behind the logo side (screen-left), no dead black

export function createTitle(el, flow) {
  el.innerHTML = `
    <div class="t-veil"></div>
    ${STAGE.cast.map(({ id }) => { const c = CHARS[id]; return `<div class="t-tag" data-id="${id}"><i>${c.seal}</i><b>${c.name.zh}</b><small>${c.name.en}</small></div>`; }).join('')}
    <div class="t-band">
      <div class="t-logo"><i class="t-seal">三國</i><h1 data-t="無雙"><span>無雙</span></h1>
        <p class="t-en"><span>VOXEL MUSOU</span></p></div>
      <div class="t-press"><b>按任意鍵開始</b><small><kbd>Enter</kbd> Press any key</small></div>
      <nav class="t-menu">${ITEMS.map((it, i) => `<button data-i="${i}"><b>${it.zh}</b><small>${it.en}</small>${SWASH}</button>`).join('')}</nav>
    </div>
    <section class="t-ctl"><h2>操作說明<small>Controls</small></h2>
      <table>${CONTROLS.map(([zh, en, kb, pad]) => `<tr><th>${zh}<small>${en}</small></th><td>${kb}</td><td class="pad">${pad}</td></tr>`).join('')}</table>
      <p>Tap attack for the combo, press charge mid-combo for a finisher. Fill the gold gauge and unleash 無雙.</p></section>
    <footer class="ui-foot"></footer>`;
  const $ = (s) => el.querySelector(s), btns = [...el.querySelectorAll('.t-menu button')];
  const tags = [...el.querySelectorAll('.t-tag')];
  let cur = 0, pre = true, ctl = false, busy = false;

  const focus = (i, quiet) => {
    i = (i + btns.length) % btns.length;
    if (i === cur && btns[i].classList.contains('on')) return;
    btns[cur].classList.remove('on'); cur = i; btns[cur].classList.add('on');
    if (!quiet) sfx('move');
  };
  const setCtl = (v) => {
    ctl = v; el.classList.toggle('ctl', v);
    $('.ui-foot').innerHTML = v ? `<span><kbd>Esc</kbd><kbd class="pad">B</kbd>返回<small>Back</small></span>`
      : `<span><kbd>↑</kbd><kbd>↓</kbd>選擇<small>Select</small></span><span><kbd>Enter</kbd><kbd class="pad">A</kbd>決定<small>Confirm</small></span>`;
  };
  const wake = () => { pre = false; el.classList.remove('pre'); sfx('ok'); };
  const ok = () => {
    if (busy) return;
    if (wiping()) return afterWipe(ok);
    if (pre) return wake();
    if (ctl) return back();
    const it = ITEMS[cur];
    if (it.go === 'controls') { sfx('ok'); return setCtl(true); }
    busy = true;
    stamp(btns[cur], '決');
    setTimeout(() => inkWipe(() => flow.go('select', { mode: it.go })), 380);
  };
  const back = () => {
    if (busy) return;
    if (wiping()) return afterWipe(back);
    if (pre) return wake();
    if (ctl) { sfx('back'); setCtl(false); }
  };
  // "press any key": any key wakes the menu and is swallowed (capture, before the menu driver would act on it too)
  let active = false;
  addEventListener('keydown', (e) => { if (active && pre && !e.metaKey && !e.ctrlKey) { e.stopImmediatePropagation(); e.preventDefault(); wake(); } }, true);
  const nav = createNav({ move: (d) => { if (pre) wake(); else if (!ctl && !busy) focus(cur + d); }, ok, back });

  el.addEventListener('pointerover', (e) => { const b = e.target.closest('.t-menu button'); if (b && !pre && !ctl && !busy) focus(+b.dataset.i); });
  el.addEventListener('click', (e) => {
    if (pre) return wake();
    const b = e.target.closest('.t-menu button');
    if (b) { if (!ctl) { focus(+b.dataset.i, true); ok(); } else back(); }
    else if (ctl && !e.target.closest('.t-ctl')) back();
  });
  // mouse parallax target (-1..1), eased in view()
  const ptr = { x: 0, y: 0, ex: 0, ey: 0 };
  el.addEventListener('pointermove', (e) => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; });

  // ---- 3D stage (render-only; built on the first view, hidden on exit, kept for the session)
  let group = null, embers = null, t = 0, enterT = 0;
  const cast = [], banners = [], glows = [];
  const pose = new Float32Array(POSE_SIZE), S0 = new THREE.Vector3(), P = new THREE.Vector3(), V = new THREE.Vector3();
  const BOX = [new THREE.Box3(), new THREE.Box3()];
  // left edge of the key art = right edge of the logo/menu band + a gutter (measured on resize, not per frame)
  let fitL = 0.45, fitLe = 0.45;   // measured, eased (a late webfont widens the band: the frame glides, never jumps)
  const measure = () => { const r = $('.t-band').getBoundingClientRect(); if (r.width) fitL = Math.min(0.6, (r.right + innerHeight / 72 * 3) / innerWidth); };
  addEventListener('resize', measure); document.fonts?.ready.then(measure);
  const stagePoint = () => {
    const q = zone('pass'), x = q ? q.x : 0, z = q ? q.z - q.d / 2 + q.d * STAGE.at : 20;
    return S0.set(x, ground(x, z), z);
  };

  function bannerTex(glyph) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 320;
    const g = cv.getContext('2d');
    const paint = () => {
      // weathered dye: smoke-dulled cream that darkens toward the hem, soot stains, a faded vermilion border
      const bg = g.createLinearGradient(0, 0, 0, 320);
      bg.addColorStop(0, '#bfa67a'); bg.addColorStop(0.55, '#9c835c'); bg.addColorStop(1, '#5a4530');
      g.fillStyle = bg; g.fillRect(0, 0, 128, 320);
      for (let i = 0; i < 26; i++) {                                                       // soot / water stains (fixed scatter)
        const r = (k) => Math.abs((Math.sin(i * 91.7 + k * 12.3) * 43758.5) % 1);
        g.fillStyle = `rgba(30,18,10,${(0.05 + r(3) * 0.1).toFixed(3)})`;
        g.beginPath(); g.ellipse(r(1) * 128, 60 + r(2) * 260, 6 + r(4) * 22, 4 + r(5) * 16, 0, 0, 7); g.fill();
      }
      // thin faded-vermilion hems (a wide dark border read as a black doorway frame round the cloth when backlit)
      g.fillStyle = '#a8442a'; g.fillRect(0, 0, 128, 10); g.fillRect(0, 0, 5, 320); g.fillRect(123, 0, 5, 320);
      for (let y = 300; y < 320; y += 4) g.clearRect(5 + ((y * 7) % 20), y, 110 - ((y * 13) % 30), 4);    // frayed hem
      g.fillStyle = '#140905'; g.font = '700 96px "Xingkai SC", "STXingkai", "HudBrush", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(glyph, 64, 150);
      tex.needsUpdate = true;
    };
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    paint();
    document.fonts?.load('700 96px HudBrush', glyph).then(paint, () => {});
    return tex;
  }
  function build(scene) {
    group = new THREE.Group(); scene.add(group);
    for (const c of STAGE.cast) {
      const K = CHARS[c.id].kit, root = new THREE.Group(), rig = createRig();
      root.add(rig.root); group.add(root);
      const m = K.model(rig);
      heroLook(m.material, ...c.look);          // key-art grade: brighter camera-side fill, hot sun rim (title copies only)
      const sec = K.secondary(root, rig, m.material), parts = [];
      // the body, weapon and cloth for the framing box (not the unculled world-space overlays: bow string etc.)
      root.traverse((o) => { if (o.isMesh && o.frustumCulled) parts.push(o); });
      cast.push({ c, K, rig, parts, sec, fresh: true });
      // surname standard: pole + a nobori cloth (CPU wave on a 5 × 12 grid)
      const tex = bannerTex(CHARS[c.id].name.zh[0]);
      const cloth = new THREE.PlaneGeometry(1.15, 3.1, 4, 12);
      // low warm emissive = the low sun glowing through the cloth from behind (the camera sees its shaded face)
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffa060, emissiveIntensity: 0.3, side: THREE.DoubleSide,
        roughness: 0.95, flatShading: true, alphaTest: 0.5 });
      const mesh = new THREE.Mesh(cloth, mat), pole = new THREE.Mesh(new THREE.BoxGeometry(0.09, 6.2, 0.09), new THREE.MeshStandardMaterial({ color: 0x2e1d15, roughness: 0.8 }));
      group.add(mesh, pole);
      banners.push({ c, mesh, pole, base: Float32Array.from(cloth.attributes.position.array), ph: banners.length * 1.7 });
    }
    // embers: soft round sprites, HDR orange so they bloom; flicker via vertex colours
    const cv = document.createElement('canvas'); cv.width = cv.height = 32;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    const n = STAGE.embers, geo = new THREE.BufferGeometry(), seed = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) seed[i] = Math.abs((Math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1);   // fixed scatter (render-only)
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    embers = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(cv), size: 0.085, vertexColors: true,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    embers.userData.seed = seed; embers.frustumCulled = false;
    group.add(embers);
    // warm glow: the burning camp behind the pair and fires off to the sides (additive, soft, blurred further by the DoF)
    for (const [x, y, z, sx, sy, r, g2, b] of GLOWS) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: embers.material.map, color: new THREE.Color(r, g2, b), blending: THREE.AdditiveBlending,
        transparent: true, depthWrite: false, fog: false }));
      sp.scale.set(sx, sy, 1); sp.userData.at = [x, y, z]; glows.push(sp); group.add(sp);
    }
  }

  function view(scene, camera, focus, dt) {
    if (!group) build(scene);
    group.visible = true;
    dt = Math.min(dt || 1 / 60, 0.1); t += dt;
    const S = STAGE, O = stagePoint();
    // narrower than 16:9 the art column shrinks: Huang Zhong closes in behind Zhao Yun so the pair stays large
    const sq = Math.min(1, Math.max(0.5, (camera.aspect - 1) / 0.78));
    // officers: a held frame of their own clip + breath (hips bob, chest swell) and the cloth/hair chains in the wind
    for (let i = 0; i < cast.length; i++) {
      const { c, K, rig, sec } = cast[i], br = Math.sin(t * 1.5 + i * 2.1);
      sampleClip(K.clips[c.clip], c.u, pose);
      if (c.arm) for (let k = 0; k < 4; k++) pose[CH.armL + k] = c.arm[k] * Math.PI / 180;   // key-art arm (free left arm FK)
      if (c.head) for (let k = 0; k < 3; k++) pose[CH.head + k] = c.head[k] * Math.PI / 180; // key-art look (root-space aim)
      pose[1] += br * 0.008; pose[9] += br * 0.02; pose[12] -= br * 0.015;
      P.set(O.x + c.x * (i ? sq : 1), 0, O.z + c.z); P.y = ground(P.x, P.z);
      rig.root.scale.set(1, 1, 1);
      rig.apply(pose, P, c.face + Math.sin(t * 0.4 + i) * 0.03);
      rig.root.scale.setScalar(HERO_SCALE); rig.root.updateMatrixWorld(true);
      if (cast[i].fresh) { sec.reset(); cast[i].fresh = false; }
      sec.update(dt);
    }
    for (let i = 0; i < glows.length; i++) {
      const [x, y, z] = glows[i].userData.at;
      glows[i].position.set(O.x + x, O.y + y, O.z + z);
      glows[i].material.opacity = 0.85 + 0.15 * Math.sin(t * (3 + i * 2.3)) * Math.sin(t * 7.1 + i);
    }
    for (const b of banners) {
      const [bx, bz] = b.c.banner, x = O.x + bx, z = O.z + bz, gy = ground(x, z);
      b.pole.position.set(x, gy + 3.1, z);
      // front face toward the lens (rotation π: texture reads left-to-right), cloth hanging from the pole to screen-right
      b.mesh.position.set(x - 0.6, gy + 3.3, z + 0.11); b.mesh.rotation.y = Math.PI + 0.2;
      const a = b.mesh.geometry.attributes.position, B = b.base;
      for (let k = 0; k < a.count; k++) {
        const u = (B[k * 3] + 0.575) / 1.15, v = (1.55 - B[k * 3 + 1]) / 3.1;            // u 0 at the pole, v 0 at the top
        const w = u * 0.8 + v * 0.25;
        a.setXYZ(k, B[k * 3] + Math.sin(t * 2.2 + v * 4 + b.ph) * 0.03 * u, B[k * 3 + 1] - u * u * 0.08,
          Math.sin(t * 2.6 - u * 3.5 - v * 2 + b.ph) * 0.2 * w + Math.sin(t * 5.1 - u * 7 + b.ph) * 0.04 * w);
      }
      a.needsUpdate = true;                                                  // flatShading: normals from derivatives
    }
    // embers: a 9 × 5 × 12 m box around the pair, rising with a lazy curl, flickering, wrapping at the top
    const ep = embers.geometry.attributes.position, ec = embers.geometry.attributes.color, sd = embers.userData.seed;
    for (let i = 0; i < S.embers; i++) {
      const a = sd[i * 4], b = sd[i * 4 + 1], c = sd[i * 4 + 2], d = sd[i * 4 + 3];
      const y = (b * 5 + t * (0.35 + c * 0.6)) % 5, life = y / 5;
      ep.setXYZ(i, O.x + (a - 0.5) * 9 + Math.sin(t * (0.6 + d) + i) * 0.4 + y * 0.25, O.y + y, O.z - 2.5 + c * 12 + Math.cos(t * 0.5 + i * 1.7) * 0.3);
      const f = (0.55 + 0.45 * Math.sin(t * (9 + d * 14) + i * 3.3)) * Math.sin(Math.PI * Math.min(1, life * 1.15)) * (0.6 + d);
      ec.setXYZ(i, 4.5 * f, 1.6 * f, 0.35 * f);
    }
    ep.needsUpdate = true; ec.needsUpdate = true;

    // camera: fitted every frame to the pair's posed bounds (any aspect): their union spans [fitL, S.fitR] of the width
    // (fitL = right of the logo/menu band), the highest point sits at S.fitT from the top and Zhao Yun's knees at S.fitK
    // (below them the ink strip: a deliberate crop). The lens looks straight up the valley (no yaw), tilted up from a low
    // eye; then the enter push-in (easeOutCubic, toward Zhao Yun), a slow breathing drift and eased mouse parallax.
    ptr.ex += (ptr.x - ptr.ex) * Math.min(1, dt * 2); ptr.ey += (ptr.y - ptr.ey) * Math.min(1, dt * 2);
    const aspect = camera.aspect, tH = Math.tan(S.fov * Math.PI / 360), tW = tH * aspect;
    for (let i = 0; i < 2; i++) { BOX[i].makeEmpty(); for (const m of cast[i].parts) if (m.visible) BOX[i].expandByObject(m); }
    const A = BOX[0], B = BOX[1], zA = (A.min.z + A.max.z) / 2, zB = (B.min.z + B.max.z) / 2;
    const lA = A.max.x >= B.max.x, rB = B.min.x <= A.min.x, tA = A.max.y >= B.max.y;
    const pLx = lA ? A.max.x : B.max.x, pLz = lA ? zA : zB, pRx = rB ? B.min.x : A.min.x, pRz = rB ? zB : zA;
    fitLe += (fitL - fitLe) * Math.min(1, dt * 3);
    const L = fitLe, R = S.fitR, kL = (0.5 - L) * 2 * tW, kR = (0.5 - R) * 2 * tW;
    const top = tA ? A.max.y : B.max.y, topZ = tA ? zA : zB, knee = O.y + 0.5;
    const czW = (kL * pLz - kR * pRz - pLx + pRx) / (kL - kR);                           // width fit
    const czH = zA - (top - knee) / ((S.fitK - S.fitT) * 2 * tH);                        // height fit (at Zhao Yun's depth)
    let cz = Math.min(czW, czH);
    const gL = 1 / (2 * (pLz - cz) * tW), gR = 1 / (2 * (pRz - cz) * tW);
    let cx = (pLx * gL + pRx * gR - (1 - L - R)) / (gL + gR);                           // span centred in [L, R]
    const k = Math.min(1, (t - enterT) / S.pushT), push = S.push * (1 - k) ** 3;
    cz -= push * (zA - cz); cx += (O.x + S.cast[0].x - cx) * -push * 0.5;
    cx += Math.sin(t * 0.13) * 0.08 - ptr.ex * 0.06;
    const cy = O.y + S.eye + Math.sin(t * 0.11) * 0.04 + ptr.ey * 0.04;
    // height-bound: the top at fitT; width-bound (narrow windows): the knees stay at fitK (they stand on the ink strip)
    const tilt = czH <= czW ? Math.atan((top - cy) / (topZ - cz)) - Math.atan((0.5 - S.fitT) * 2 * tH)
      : Math.atan((knee - cy) / (zA - cz)) - Math.atan((0.5 - S.fitK) * 2 * tH);
    camera.fov = S.fov; camera.updateProjectionMatrix();
    camera.position.set(cx, cy, cz);
    camera.lookAt(V.set(cx, cy + Math.tan(tilt) * 10, cz + 10));
    camera.updateMatrixWorld();
    focus.set(O.x + S.cast[0].x, O.y + 1.2, O.z + S.cast[0].z);
    // name tags: tag = [x, y] rem from the projected head to the tag's top centre, clear of the band (transform only)
    const w = innerWidth, h = innerHeight, rem = h / 72;
    for (let i = 0; i < tags.length; i++) {
      const c = S.cast[i];
      cast[i].rig.joints.head.getWorldPosition(V).project(camera);
      const px = Math.max(fitL * w + 3 * rem, Math.min(w - 4 * rem, (V.x * 0.5 + 0.5) * w + c.tag[0] * rem));
      const py = Math.max(2 * rem, (0.5 - V.y * 0.5) * h + c.tag[1] * rem);
      tags[i].style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translateX(-50%)`;
    }
  }

  return {
    view,
    enter() {
      busy = false; clearStamp(el); setCtl(false);
      el.classList.toggle('pre', pre);
      focus(cur, true); btns[cur].classList.add('on');
      el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');   // logo ink-in
      enterT = t; measure();
      for (const m of cast) m.fresh = true;
      nav.start(); active = true;
    },
    exit() { nav.stop(); busy = false; active = false; if (group) group.visible = false; },
  };
}
