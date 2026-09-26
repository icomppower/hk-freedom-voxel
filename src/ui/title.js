// Title screen (#title, ui lane). DW8 front end over the live battlefield: the 3D field keeps rendering behind the screen
// while view() glides the camera slowly over the map toward the backlit mountain (render-only; main.js calls a screen's
// optional view(scene, camera, focus, dt) after the gameplay camera rig while that screen is up).
// Layout: brush logo (三國 seal + gold-leaf 無雙 + VOXEL MUSOU) top-left, the menu in the left ink band, key/pad
// prompts along the bottom. First boot shows a "press any key" card (also unlocks audio); returns go straight to the menu.
// Menu: 第一章「定軍山」 → select {mode:'story'} · 自由演武 → select {mode:'free'} · 操作說明 → controls panel (Esc back).
// Screen contract: createTitle(el, flow) → { enter(ctx), exit(), view } (src/main.js header).
import { createNav, sfx, inkWipe, wiping, stamp, clearStamp } from './menu.js';
import { ground } from '../world/map.js';

// brush swash drawn under the focused item (revealed left → right) — one tapered stroke, dry tail
export const SWASH = `<svg class="swash" viewBox="0 0 400 26" preserveAspectRatio="none" aria-hidden="true"><path d="M3 15C40 7 118 4 214 8
  S352 11 397 5L395 9C368 15 330 17 280 18C226 19 170 17 128 19C84 21 38 22 3 15ZM300 20C330 19 360 17 384 14L382 16C356 20 326 22 300 20Z"/></svg>`;

const ITEMS = [
  { go: 'story', zh: '第一章「定軍山」', en: 'Story · Chapter I, Mount Dingjun' },
  { go: 'free', zh: '自由演武', en: 'Free battle · endless waves' },
  { go: 'controls', zh: '操作說明', en: 'Controls' },
];
const CONTROLS = [
  ['移動', 'Move', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows', 'left stick'],
  ['攻擊', 'Attack', '<kbd>J</kbd> / left click — tap for the full combo', '<kbd>X</kbd> □'],
  ['蓄力', 'Charge', '<kbd>K</kbd> / right click — mid-combo for charge attacks', '<kbd>Y</kbd> △'],
  ['跳躍', 'Jump', '<kbd>Space</kbd>', '<kbd>A</kbd> ×'],
  ['閃避', 'Dodge', '<kbd>L</kbd> / <kbd>Shift</kbd>', '<kbd>R1</kbd> <kbd>R2</kbd>'],
  ['無雙', 'Musou', '<kbd>I</kbd> — when the gold gauge is full', '<kbd>B</kbd> ○'],
  ['視角', 'Camera', 'mouse (click the field to lock it) / <kbd>Q</kbd><kbd>E</kbd>', 'right stick'],
  ['鎖定', 'Recenter', '<kbd>R</kbd> — behind you, or onto the nearest officer', '<kbd>L1</kbd> <kbd>L2</kbd>'],
  ['瞄準', 'Aim (黃忠)', 'hold <kbd>K</kbd> / right click from a standstill — mouse or stick aims, release to loose', 'hold <kbd>Y</kbd> △'],
  ['暫停', 'Pause', '<kbd>Esc</kbd> (also frees the mouse)', 'Start'],
];

export function createTitle(el, flow) {
  el.innerHTML = `
    <div class="t-veil"></div>
    <div class="t-logo"><i class="t-seal">三國</i><h1 data-t="無雙"><span>無雙</span></h1>
      <p class="t-en"><span>VOXEL MUSOU</span></p></div>
    <div class="t-press"><b>按任意鍵開始</b><small>Press any key</small></div>
    <nav class="t-menu">${ITEMS.map((it, i) => `<button data-i="${i}"><b>${it.zh}</b><small>${it.en}</small>${SWASH}</button>`).join('')}</nav>
    <section class="t-ctl"><h2>操作說明<small>Controls</small></h2>
      <table>${CONTROLS.map(([zh, en, kb, pad]) => `<tr><th>${zh}<small>${en}</small></th><td>${kb}</td><td class="pad">${pad}</td></tr>`).join('')}</table>
      <p>Tap attack for the combo, press charge mid-combo for a finisher. Fill the gold gauge and unleash 無雙.</p></section>
    <footer class="ui-foot"></footer>`;
  const $ = (s) => el.querySelector(s), btns = [...el.querySelectorAll('.t-menu button')];
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
    if (busy || wiping()) return;
    if (pre) return wake();
    if (ctl) return back();
    const it = ITEMS[cur];
    if (it.go === 'controls') { sfx('ok'); return setCtl(true); }
    busy = true;
    stamp(btns[cur], '決');
    setTimeout(() => inkWipe(() => flow.go('select', { mode: it.go })), 380);
  };
  const back = () => {
    if (busy || wiping()) return;
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
    if (b) { focus(+b.dataset.i, true); ok(); }
    else if (ctl) back();
  });

  // camera glide: a slow Lissajous over the lower field toward the mountain and the low sun (backlit, +Z), focus ≈ 36 m
  // ahead so the near ground falls into soft bokeh and the far skyline stays crisp (post.js DoF)
  const t0 = performance.now();
  const view = (scene, camera, aim) => {
    const t = (performance.now() - t0) / 1000;
    const x = Math.sin(t * 0.031) * 22, z = -44 + Math.sin(t * 0.019 + 1) * 14, y = 9 + Math.sin(t * 0.027) * 2.5;
    const ax = x * 0.4 + Math.sin(t * 0.023) * 8, az = z + 36;
    camera.position.set(x, y + ground(x, z), z);
    aim.set(ax, 3 + ground(ax, az), az);
    camera.lookAt(ax, 5.5 + ground(ax, az), az);
    camera.fov = 38; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  };

  return {
    view,
    enter() {
      busy = false; clearStamp(el); setCtl(false);
      el.classList.toggle('pre', pre);
      focus(cur, true); btns[cur].classList.add('on');
      el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');   // logo ink-in
      nav.start(); active = true;
    },
    exit() { nav.stop(); busy = false; active = false; },
  };
}
