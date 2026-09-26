// Shared by the title and select screens (ui lane): menu input (keyboard, mouse, gamepad), UI sound ticks and the ink
// wipe between screens. Screens only; the battle's input lives in src/core/input.js.
//
// Feel targets (DW8 front end): a cursor move is a dry woodblock tick, a confirm is a taiko thump under a bright bell,
// a pick stamps a red seal with a low slam, and every screen change is a single dry-brush ink stroke sweeping right →
// left (≈ 0.4 s to cover, the next screen is swapped in under full ink, ≈ 0.5 s to uncover). Transform-only animation
// of one composited layer: no layout work, holds 60 fps at any size.

// ---------------------------------------------------------------- sound (own tiny WebAudio graph; audio.js is battle-only)
let ac = null, noise = null;
function actx() {
  if (!ac) {
    try { ac = new AudioContext({ latencyHint: 'interactive' }); } catch { return null; }
    noise = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;        // UI noise only, never the sim
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
// one voice: oscillator (type, f0 → f1) or filtered noise, exponential decay
function voice(c, { type = 'sine', f0, f1 = f0, gain, dur, at = 0, lp = 0, bp = 0 }) {
  const t = c.currentTime + at, g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let src;
  if (type === 'noise') { src = c.createBufferSource(); src.buffer = noise; }
  else { src = c.createOscillator(); src.type = type; src.frequency.setValueAtTime(f0, t); src.frequency.exponentialRampToValueAtTime(f1, t + dur); }
  let n = src;
  if (lp || bp) { const f = c.createBiquadFilter(); f.type = lp ? 'lowpass' : 'bandpass'; f.frequency.value = lp || bp; f.Q.value = lp ? 0.7 : 4; n.connect(f); n = f; }
  n.connect(g).connect(c.destination);
  src.start(t); src.stop(t + dur + 0.02);
}
const SFX = {
  move: [{ type: 'triangle', f0: 1250, f1: 820, gain: 0.07, dur: 0.06 }, { type: 'noise', bp: 2600, gain: 0.05, dur: 0.03 }],
  ok: [{ f0: 110, f1: 48, gain: 0.5, dur: 0.32 }, { type: 'noise', lp: 380, gain: 0.25, dur: 0.12 },
    { f0: 1318, gain: 0.07, dur: 0.9, at: 0.02 }, { f0: 1976, gain: 0.04, dur: 0.6, at: 0.02 }],
  back: [{ type: 'triangle', f0: 720, f1: 430, gain: 0.08, dur: 0.1 }, { type: 'noise', bp: 1400, gain: 0.04, dur: 0.04 }],
  stamp: [{ f0: 82, f1: 40, gain: 0.7, dur: 0.45 }, { type: 'noise', lp: 520, gain: 0.45, dur: 0.18 },
    { f0: 988, gain: 0.05, dur: 1.1, at: 0.05 }, { f0: 1480, gain: 0.035, dur: 0.8, at: 0.05 }],
  swish: [{ type: 'noise', bp: 900, gain: 0.12, dur: 0.35 }, { type: 'noise', bp: 2400, gain: 0.05, dur: 0.22, at: 0.05 }],
};
/** Play a UI cue: 'move' | 'ok' | 'back' | 'stamp' | 'swish'. Silent until the first key/click (autoplay policy). */
export function sfx(kind) { const c = actx(); if (c) for (const v of SFX[kind]) voice(c, v); }

// ---------------------------------------------------------------- menu input
const KEYS = { ArrowUp: -1, KeyW: -1, ArrowDown: 1, KeyS: 1, ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 };
const OK = new Set(['Enter', 'NumpadEnter', 'Space', 'KeyJ']), BACK = new Set(['Escape', 'Backspace', 'KeyK']);
/**
 * Keyboard + gamepad menu driver, active between start() and stop(). cb: { move(±1), ok(), back() }.
 * Gamepad: d-pad / left stick (repeat 350 ms, then 120 ms), A / Start = ok, B = back. Buttons already held at start()
 * must be released first (the press that opened this screen does not fire again here).
 */
export function createNav(cb) {
  let on = false, raf = 0, held = {}, rep = 0, repT = 0;
  const key = (e) => {
    if (!on || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code in KEYS) { e.preventDefault(); cb.move(KEYS[e.code]); }
    else if (e.repeat) return;
    else if (OK.has(e.code)) { e.preventDefault(); cb.ok(); }
    else if (BACK.has(e.code)) { e.preventDefault(); cb.back(); }
  };
  const poll = (now) => {
    if (!on) return;
    raf = requestAnimationFrame(poll);
    const p = navigator.getGamepads ? navigator.getGamepads()[0] : null;
    if (!p) return;
    const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed);
    const edge = (i) => { const d = b(i), was = held[i]; held[i] = d; return d && was === false; };
    if (edge(0) || edge(9)) cb.ok();
    else if (edge(1)) cb.back();
    const y = p.axes[1] || 0, x = p.axes[0] || 0;
    const dir = b(12) || y < -0.5 || x < -0.5 ? -1 : b(13) || y > 0.5 || x > 0.5 ? 1 : b(14) ? -1 : b(15) ? 1 : 0;
    if (!dir) rep = 0;
    else if (dir !== rep) { rep = dir; repT = now + 350; cb.move(dir); }
    else if (now >= repT) { repT = now + 120; cb.move(dir); }
  };
  addEventListener('keydown', key);
  return {
    start() {
      on = true; rep = 0; held = {};
      const p = navigator.getGamepads ? navigator.getGamepads()[0] : null;
      if (p) p.buttons.forEach((q, i) => { held[i] = q.pressed ? true : false; });   // true = wait for release
      for (const i of [0, 1, 9]) if (held[i] === undefined) held[i] = false;
      if (p && (Math.abs(p.axes[1] || 0) > 0.5 || Math.abs(p.axes[0] || 0) > 0.5)) { rep = (p.axes[1] || p.axes[0]) < 0 ? -1 : 1; repT = Infinity; }   // stick held: wait for release
      raf = requestAnimationFrame(poll);
    },
    stop() { on = false; cancelAnimationFrame(raf); },
  };
}

// ---------------------------------------------------------------- ink wipe
// One 220vw-wide ink layer whose two long edges are dry-brush ragged (SVG turbulence displacement, stretched
// horizontally so the rag reads as bristle streaks). Cover: slides in from the right until its solid middle spans the
// screen; mid() swaps screens under it; uncover: continues off to the left.
const RAG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 100' preserveAspectRatio='none'>
<filter id='f' filterUnits='userSpaceOnUse' x='0' y='-100' width='1000' height='300'>
<feTurbulence type='fractalNoise' baseFrequency='0.006 0.11' numOctaves='3' seed='11'/>
<feDisplacementMap in='SourceGraphic' scale='150' xChannelSelector='R' yChannelSelector='G'/></filter>
<g filter='url(#f)'><rect x='120' y='-100' width='760' height='300'/>
<rect x='60' y='22' width='80' height='5'/><rect x='80' y='61' width='60' height='3'/><rect x='860' y='38' width='90' height='4'/><rect x='870' y='79' width='50' height='6'/></g></svg>`;
let ink = null, busy = false;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Cover the screen with ink, run mid() (screen swap), uncover once the promise mid() returns (flow.go: the new screen
 *  compiled and presented) settles. Ignored while a wipe is running. */
export function inkWipe(mid) {
  if (busy) return;
  busy = true;
  if (!ink) {
    ink = document.createElement('div');
    ink.id = 'ink';
    const url = `url("data:image/svg+xml,${encodeURIComponent(RAG)}")`;
    ink.style.webkitMaskImage = ink.style.maskImage = url;
    document.body.append(ink);
  }
  const r = reduced(), ease = 'cubic-bezier(.7,0,.35,1)';
  ink.hidden = false;
  sfx('swish');
  ink.animate([{ transform: 'translateX(100vw)' }, { transform: 'translateX(-60vw)' }],
    { duration: r ? 1 : 420, easing: ease, fill: 'forwards' }).finished.then(mid).catch((e) => console.error(e)).then(() => {
    // two frames under full ink: the swapped screen lays out and the 3D view re-frames before the reveal
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ink.animate([{ transform: 'translateX(-60vw)' }, { transform: 'translateX(-230vw)' }],
        { duration: r ? 1 : 520, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }).finished.then(() => { ink.hidden = true; busy = false; });
    }));
  });
}
export const wiping = () => busy;

/** Slam a red seal (1-3 glyphs) into `parent` at its .stamp-at anchor (CSS positions it); removed by clearStamp. */
export function stamp(parent, text) {
  clearStamp(parent);
  const s = document.createElement('i');
  s.className = 'ui-stamp';
  s.textContent = text;
  parent.append(s);
  sfx('stamp');
  s.animate([{ transform: 'scale(2.6) rotate(-4deg)', opacity: 0 }, { transform: 'scale(.9) rotate(-9deg)', opacity: 1, offset: 0.55 },
    { transform: 'scale(1) rotate(-8deg)', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.3,0,.6,1)', fill: 'forwards' });
  parent.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(.3rem,.4rem)' }, { transform: 'translate(-.2rem,-.15rem)' },
    { transform: 'translate(0,0)' }], { duration: 220, delay: 140 });
}
export const clearStamp = (parent) => parent.querySelectorAll('.ui-stamp').forEach((s) => s.remove());

/** Restart a CSS animation on `el` (class `cls` removed, reflow, re-added). */
export function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
