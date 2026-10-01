// Touch controls (stage-1 hook, ui lane). Shown on coarse pointers (phones, tablets) during a battle while the pause menu
// is closed; a real key press hides them (a keyboard is in use) until the next touch.
//   bottom-left fixed D-pad (上下左右, always shown): a thumb on or near it steers from its centre
//   left half   floating stick elsewhere: the base lands where the thumb goes down, the knob follows (radius R px); the vector goes
//               to input.virt.stick (full deflection = unit length, like the keys)
//   right side  攻 J attack · 蓄 K charge · 跳 Space jump · 閃 L dodge · 無雙 I musou (lit while the gauge can pay for one),
//               pause (Esc); each button writes input.virt.key(action, down) — the same held / latch state a key does
//   right half  a drag above the buttons turns the camera (virt.look, rad)
// While the pad shows, body.pad moves the HUD pieces it would cover (K.O. count to the top centre, the Musou copy to the
// left). Portrait on a coarse pointer: a 請打橫手機 card asks for landscape. Render / DOM only — the sim sees input frames.
// createTouch(virt, game) → { root }
import { on } from '../core/events.js';

const R = 56;                                                       // stick radius, px
const DEAD = 0.12;                                                  // stick deadzone (fraction of R)
const LOOK = { yaw: 0.0065, pitch: 0.0045 };                        // camera drag, rad per px
const BTNS = [                                                      // [action, glyph, key, class]
  ['attack', '攻', 'J', 'b-atk'], ['charge', '蓄', 'K', 'b-chg'], ['jump', '跳', 'Space', 'b-jmp'],
  ['dodge', '閃', 'L', 'b-ddg'], ['musou', '無雙', 'I', 'b-mu'],
];

export function createTouch(virt, game) {
  const coarse = matchMedia('(pointer: coarse)'), portrait = matchMedia('(orientation: portrait)');
  const root = document.createElement('div'); root.id = 'touch'; root.hidden = true;
  root.innerHTML = `<div class="t-home" aria-hidden="true"><i class="a-up"></i><i class="a-dn"></i><i class="a-lt"></i><i class="a-rt"></i></div>
    <div class="t-stick"><i class="t-base"></i><i class="t-knob"></i></div>
    ${BTNS.map(([a, g, k, c]) => `<button class="t-btn ${c}" data-a="${a}" aria-label="${a}"><b>${g}</b><small>${k}</small></button>`).join('')}
    <button class="t-btn b-pause" data-a="pause" aria-label="pause"><b>Ⅱ</b></button>`;
  const rot = document.createElement('div'); rot.id = 'touch-rot'; rot.hidden = true;
  rot.innerHTML = '<b>請打橫手機</b><small>Rotate your phone to landscape</small>';
  document.body.append(root, rot);
  const menu = document.getElementById('menu'), stick = root.querySelector('.t-stick');
  const base = root.querySelector('.t-base'), knob = root.querySelector('.t-knob'), muBtn = root.querySelector('.b-mu');
  // fixed D-pad (上下左右) in the bottom-left corner, always visible: a thumb on or near it steers from its centre;
  // a thumb anywhere else on the left still gets the floating stick
  const home = root.querySelector('.t-home');
  const homeAt = () => { const r = home.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; };
  let battle = false, kb = false;
  on('flow', (e) => { battle = e.state === 'battle'; if (!battle) release(); });
  addEventListener('keydown', (e) => { if (e.isTrusted) kb = true; }, true);
  addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') kb = false; }, true);

  // ?touchdebug: a small live readout (event counts, stick, hero state) for checking a real phone from a screenshot
  const dbg = { ts: 0, tm: 0, te: 0, pd: 0, pm: 0 };
  const dbgEl = new URLSearchParams(location.search).has('touchdebug') ? document.createElement('pre') : null;
  if (dbgEl) { dbgEl.id = 'touch-dbg'; dbgEl.style.cssText = 'position:fixed;left:50%;top:4px;translate:-50% 0;z-index:60;margin:0;padding:4px 8px;font:11px/1.3 monospace;color:#0f0;background:rgba(0,0,0,.7);pointer-events:none;white-space:pre'; document.body.append(dbgEl); }

  // pointers: id → { kind: 'stick' | 'look' | action, x, y }
  const ptrs = new Map();
  const setStick = (dx, dy) => {
    const len = Math.hypot(dx, dy) / R;
    let x = 0, y = 0;
    if (len >= DEAD) { const k = len > 1 ? 1 / (len * R) : 1 / R; x = dx * k; y = -dy * k; }
    virt.stick[0] = x; virt.stick[1] = y;
    const c = Math.min(1, len) / Math.max(len, 1e-6);
    knob.style.transform = `translate(${(dx * c).toFixed(1)}px, ${(dy * c).toFixed(1)}px)`;
  };
  function release() {
    for (const [, p] of ptrs) if (p.kind !== 'stick' && p.kind !== 'look' && p.kind !== 'pause') virt.key(p.kind, false);
    ptrs.clear(); virt.stick[0] = virt.stick[1] = 0; stick.classList.remove('on'); home.classList.remove('on');
  }
  // One set of handlers, fed by touch events where the browser has them (phones, tablets, in-app web views — some of
  // which deliver no pointer events for touches at all) and by pointer events otherwise (pen, mouse-emulated touch).
  // While touch events drive the pad, pointer events with pointerType 'touch' are ignored so nothing fires twice.
  const press = (id, x, y, target) => {
    const b = target && target.closest ? target.closest('.t-btn') : null;
    if (b) {
      const a = b.dataset.a;
      b.classList.add('down');
      if (a === 'pause') { dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' })); ptrs.set(id, { kind: 'pause', b }); return; }
      ptrs.set(id, { kind: a, b }); virt.key(a, true);
    } else if (x < innerWidth * 0.45) {
      const h = homeAt(), onHome = Math.hypot(x - h.x, y - h.y) < h.r * 1.5;
      const cx = onHome ? h.x : x, cy = onHome ? h.y : y;
      ptrs.set(id, { kind: 'stick', x: cx, y: cy });
      base.style.left = knob.style.left = `${cx}px`; base.style.top = knob.style.top = `${cy}px`;
      stick.classList.add('on'); home.classList.add('on'); setStick(x - cx, y - cy);
    } else ptrs.set(id, { kind: 'look', x, y });
  };
  const drag = (id, x, y) => {
    const p = ptrs.get(id); if (!p) return;
    if (p.kind === 'stick') setStick(x - p.x, y - p.y);
    else if (p.kind === 'look') { virt.look(-(x - p.x) * LOOK.yaw, (y - p.y) * LOOK.pitch); p.x = x; p.y = y; }
  };
  const lift = (id) => {
    const p = ptrs.get(id); if (!p) return;
    ptrs.delete(id);
    if (p.b) p.b.classList.remove('down');
    if (p.kind === 'stick') { setStick(0, 0); stick.classList.remove('on'); home.classList.remove('on'); }
    else if (p.kind !== 'look' && p.kind !== 'pause') virt.key(p.kind, false);
  };
  let touchDriven = false;
  const T = 't';                                                      // touch ids live apart from pointer ids
  root.addEventListener('touchstart', (e) => {
    touchDriven = true; kb = false; dbg.ts++;
    if (e.cancelable) e.preventDefault();                             // no scroll / zoom / double-tap / synthetic mouse
    e.stopPropagation();
    for (const t of e.changedTouches) press(T + t.identifier, t.clientX, t.clientY, document.elementFromPoint(t.clientX, t.clientY) || t.target);
  }, { passive: false });
  root.addEventListener('touchmove', (e) => {
    dbg.tm++;
    if (e.cancelable) e.preventDefault();
    for (const t of e.changedTouches) drag(T + t.identifier, t.clientX, t.clientY);
  }, { passive: false });
  const touchEnd = (e) => { dbg.te++; if (e.cancelable) e.preventDefault(); for (const t of e.changedTouches) lift(T + t.identifier); };
  root.addEventListener('touchend', touchEnd, { passive: false });
  root.addEventListener('touchcancel', touchEnd, { passive: false });

  root.addEventListener('pointerdown', (e) => {
    dbg.pd++;
    e.preventDefault(); e.stopPropagation();                        // the pad owns the touch (input.js would attack)
    if (touchDriven && e.pointerType === 'touch') return;
    try { root.setPointerCapture(e.pointerId); } catch { /* synthetic / already gone */ }
    press(e.pointerId, e.clientX, e.clientY, e.target);
  });
  root.addEventListener('pointermove', (e) => {
    if (touchDriven && e.pointerType === 'touch') return;
    if (!ptrs.has(e.pointerId)) return;
    e.preventDefault(); e.stopPropagation(); dbg.pm++;
    drag(e.pointerId, e.clientX, e.clientY);
  });
  const up = (e) => { if (touchDriven && e.pointerType === 'touch') return; if (ptrs.has(e.pointerId)) { e.stopPropagation(); lift(e.pointerId); } };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  root.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => { if (!root.hidden) e.preventDefault(); });

  // visibility + the lit Musou button, once per animation frame (DOM writes only when something changed)
  let shown = null, lit = null, rotOn = null;
  const tick = () => {
    requestAnimationFrame(tick);
    const show = coarse.matches && battle && menu.hidden && !kb;
    if (show !== shown) { shown = show; root.hidden = !show; document.body.classList.toggle('pad', show); if (!show) release(); }
    const r = coarse.matches && portrait.matches;
    if (r !== rotOn) { rotOn = r; rot.hidden = !r; }
    if (dbgEl) { const h = game.hero || {}; dbgEl.textContent = `touch s/m/e ${dbg.ts}/${dbg.tm}/${dbg.te} · ptr d/m ${dbg.pd}/${dbg.pm} · PE ${'PointerEvent' in window ? 1 : 0} TE ${'ontouchstart' in window ? 1 : 0}\nstick ${virt.stick[0].toFixed(2)},${virt.stick[1].toFixed(2)} · show ${show} battle ${battle} kb ${kb} menu ${menu.hidden ? 'closed' : 'open'} · hero ${h.state} ${(+h.x || 0).toFixed(1)},${(+h.z || 0).toFixed(1)}`; }
    if (!show) return;
    const l = !!(game.musou?.ready?.() && game.hero.state !== 'musou');
    if (l !== lit) { lit = l; muBtn.classList.toggle('lit', l); }
  };
  tick();
  return { root };
}
