// Scroll player (#prologue before a chapter, #ending after the final one): a handscroll unrolls over the chapter's sepia
// ink map; each card writes 3 vertical brush columns (right to left, revealed stroke-first by a ragged brush-tip mask), an
// English subline, and draws its troop arrows onto the map (our side teal ink, theirs vermilion) while the view drifts to
// the card's focus. Then the chapter title stamps in (small line, big title, red seal, English line) and the battle
// starts — or, for the ending scroll, the tribute card (if the chapter has one) and then the title screen.
// Controls: tap Enter / Space / click = next card · hold (0.8 s, ring fills) = skip to the title · Esc = skip.
// Data (scroll-player commit): the active chapter (story/chapters.js) supplies MAP (SVG string, viewBox 1600×900, marks
// [data-id] + .pl-arw arrows: story/scrollkit.js), PROLOGUE / STAMP, and optionally ENDING / ENDING_STAMP and TRIBUTE
// { title {zh, en}, zh: [lines], en: [lines], link {href, zh, en} }. Card = { cols: [≤ 7 chars × 3], en, show: [mark ids],
// focus: [x, y, zoom] } or branched on the hero { <char id>: { cols, en }, show, focus }.
// ctx in: { mode: 'story', char, chapter }. Prologue done → flow.go('battle', ctx); ending done → ink wipe → title.
// Render-side DOM only (wall-clock timers); nothing here touches the sim.
import { resolveChapter } from './chapters.js';
import { inkWipe, wiping, afterWipe } from '../ui/menu.js';
import { createCutSound } from './cutscenes/sound.js';

const NUM = ['壹', '貳', '參', '肆', '伍', '陸'];
const HOLD = 0.8;                                  // s held to skip (index.html: the ring's .on transition)

/** part: 'PROLOGUE' (before the battle) | 'ENDING' (after the final chapter's result). */
export function createPrologue(el, flow, part = 'PROLOGUE') {
  const ending = part === 'ENDING';
  let built = null, map, card, cols, en, pips, ring, CARDS = [];
  /** (Re)build the scroll for chapter CH (only when its map / stamp / tribute differ from what is on the paper). */
  function build(CH) {
    const st = (ending ? CH.ENDING_STAMP : CH.STAMP) || {}, T = ending && CH.TRIBUTE;
    const key = CH.id + part;
    if (built === key) return;
    built = key;
    el.innerHTML = `<div class="pl-paper">${CH.MAP}
      <div class="pl-card"><div class="pl-cols"></div></div><p class="pl-en"></p>
      <div class="pl-stamp"><small>${st.small}</small><b>${st.big}</b><i>${st.seal}</i><em>${st.en}</em></div>
      <div class="pl-pips"></div>${T ? `
      <div class="pl-tribute"><h2>${T.title.zh}<small>${T.title.en}</small></h2>
        ${T.zh.map((z, i) => `<p>${z}<small>${T.en[i]}</small></p>`).join('')}
        ${T.link ? `<a href="${T.link.href}" target="_blank" rel="noopener">${T.link.zh}<small>${T.link.en}</small></a>` : ''}</div>` : ''}
    </div>
    <i class="pl-rod l"></i><i class="pl-rod r"></i>
    <div class="pl-skip"><span><kbd>Enter</kbd><kbd>Click</kbd>下一頁<small>Next</small></span>
      <span><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15"/><circle class="p" cx="18" cy="18" r="15" pathLength="1"/></svg>長按跳過<small>Hold to skip</small></span>
      <span><kbd>Esc</kbd>跳過<small>Skip</small></span></div>`;
    const $ = (s) => el.querySelector(s);
    map = $('.pl-map'); card = $('.pl-card'); cols = $('.pl-cols'); en = $('.pl-en'); pips = $('.pl-pips'); ring = $('.pl-skip .p');
  }
  let ctx = {}, k = -1, timer = 0, swapT = 0, holdTimer = 0, holdT0 = 0, phase = 'off', stampAt = 0, CH = null, snd = null;   // snd: the ending scroll's sound

  const later = (fn, s) => { clearTimeout(timer); timer = setTimeout(fn, s * 1000); };
  function show(i) {
    k = i;
    if (k >= CARDS.length) return stamp();
    const c = CARDS[k], v = c[ctx.char] || c;
    card.classList.remove('on');                             // the old card fades, then the new one is written in
    clearTimeout(swapT);
    swapT = setTimeout(() => {
      cols.innerHTML = v.cols.map((t, j) => `<span style="--i:${j}">${t}</span>`).join('');
      if (snd) for (let j = 0; j < v.cols.length; j++) setTimeout(() => snd?.cue('brush'), 120 + j * 420);
      en.textContent = v.en;
      void card.offsetWidth;                                 // commit the masked start so the reveal transitions
      card.classList.add('on');
    }, k ? 380 : 0);
    for (const m of el.querySelectorAll('[data-id]')) {     // this card's marks draw in; earlier ones stay, dimmed
      const id = m.dataset.id, now = c.show.includes(id), before = CARDS.slice(0, k).some((p) => p.show.includes(id));
      m.classList.toggle('on', now || before); m.classList.toggle('hot', now);
    }
    // drift: bring the focus toward 38 % x (clear of the calligraphy card on the right, which covered 南鄭 when the focus
    // was centred), never past the paper edge; every lit place label stays readable on the paper left of that card (the
    // card-4 zoom cropped 陽平關 at the left edge): the zoom backs off until their span fits, then the drift is clamped
    let x0 = 1600, x1 = 0, y0 = 900, y1 = 0;
    for (const m of el.querySelectorAll('.pl-labels .pl-mark.on')) {
      const b = m.getBBox(); x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.width); y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.height);
    }
    const [fx, fy, s0] = c.focus, fit = x1 > x0, s = fit ? Math.max(1.02, Math.min(s0, 1060 / (x1 - x0), 840 / (y1 - y0))) : s0;
    let tx = (0.38 - fx / 1600) * s * 100, ty = (0.5 - fy / 900) * s * 100;
    if (fit) {                                                // screen x = 800 + (x - 800)·s + tx·16 (viewBox units)
      tx = Math.max(Math.min(tx, (1100 - 800 - (x1 - 800) * s) / 16), (40 - 800 - (x0 - 800) * s) / 16);
      ty = Math.max(Math.min(ty, (870 - 450 - (y1 - 450) * s) / 9), (30 - 450 - (y0 - 450) * s) / 9);
    }
    const lim = (s - 1) / 2 * 100;
    tx = Math.max(-lim, Math.min(lim, tx)); ty = Math.max(-lim, Math.min(lim, ty));
    map.style.transform = `translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%) scale(${s})`;
    pips.innerHTML = CARDS.map((_, j) => `<b class="${j === k ? 'on' : j < k ? 'past' : ''}">${NUM[j]}</b>`).join('');
    later(() => show(k + 1), 1.4 + v.cols.length * 0.55 + Math.min(3.2, 1.6 + v.en.length * 0.018));
  }
  function stamp() {
    if (phase === 'stamp' || phase === 'tribute' || phase === 'out') return;
    phase = 'stamp'; k = CARDS.length; stampAt = performance.now(); clearTimeout(swapT);
    snd?.cue('stamp');
    el.classList.add('stamped'); card.classList.remove('on');
    for (const m of el.querySelectorAll('[data-id]')) { m.classList.add('on'); m.classList.remove('hot'); }
    map.style.transform = 'translate(0, 0) scale(1.06)';
    later(go, 3.4);
  }
  function go() {
    if (phase === 'out') return;
    if (wiping()) { afterWipe(go); return; }             // a tap while the ink is still coming off (the end scene's hand-over)
    if (ending && CH.endScene && !ctx.sceneDone && phase !== 'tribute') {   // 香港自由戰士: the end scene, then the tribute
      phase = 'out'; clearTimeout(timer); snd?.stop(0.5); snd = null;
      const c = { ...ctx, tribute: true, sceneDone: true };
      inkWipe(() => flow.go('cutscene', { id: CH.endScene, char: ctx.char, then: () => inkWipe(() => flow.go('ending', c)) }));
      return;
    }
    if (ending && CH.TRIBUTE && phase !== 'tribute') {   // the tribute card on the paper, until a tap (or 30 s)
      phase = 'tribute'; stampAt = performance.now(); clearTimeout(timer);
      el.classList.add('tribute');
      later(go, 30);
      return;
    }
    phase = 'out';
    if (ending) { clearTimeout(timer); inkWipe(() => flow.go('title')); return; }
    el.classList.add('out');
    later(() => flow.go('battle', ctx), 0.55);          // index.html #prologue.out: the fade off the field
  }

  // tap = next card (on the title: start now); hold = skip to the title. Keys and pointer share one hold clock.
  // (the skip itself is a timer, the ring only paints: a CSS transition while .on)
  const down = () => {
    if (holdT0 || phase !== 'cards') return;
    holdT0 = performance.now(); ring.classList.add('on');
    holdTimer = setTimeout(() => { holdT0 = 0; ring.classList.remove('on'); stamp(); }, HOLD * 1000);
  };
  const up = () => {
    if (phase === 'stamp' || phase === 'tribute') { if (performance.now() - stampAt > 900) go(); return; }
    if (!holdT0) return;
    const held = (performance.now() - holdT0) / 1000;
    holdT0 = 0; clearTimeout(holdTimer); ring.classList.remove('on');
    if (held < HOLD && phase === 'cards') show(k + 1);
  };
  const key = (e) => {
    if (e.code === 'Escape') { if (phase === 'cards') stamp(); else if (phase === 'stamp' || phase === 'tribute') go(); return; }
    if (e.code !== 'Enter' && e.code !== 'NumpadEnter' && e.code !== 'Space') return;
    e.preventDefault();
    if (e.type === 'keydown') { if (!e.repeat) down(); } else up();
  };
  el.addEventListener('pointerdown', (e) => { if (e.button === 0 && !e.target.closest('a')) down(); });
  el.addEventListener('pointerup', (e) => { if (e.button === 0 && !e.target.closest('a')) up(); });

  return {
    enter(c) {
      CH = resolveChapter(c.chapter, c.char); build(CH); CARDS = CH[part] || [];
      ctx = c; phase = 'cards'; holdT0 = 0; stampAt = 0;
      el.classList.remove('stamped', 'out', 'open', 'tribute'); card.classList.remove('on');
      for (const m of el.querySelectorAll('[data-id]')) m.classList.remove('on', 'hot');
      map.style.transform = 'translate(0, 0) scale(1.1)';
      ring.classList.remove('on');
      void el.offsetWidth;
      el.classList.add('open');                             // the scroll unrolls (CSS), the first card follows
      addEventListener('keydown', key); addEventListener('keyup', key);
      if (ending && c.tribute && CH.TRIBUTE) {             // the title menu's 致敬: straight to the tribute card
        phase = 'tribute'; stampAt = performance.now(); el.classList.add('stamped', 'tribute'); later(go, 60); return;
      }
      if (ending && CH.endScene && !c.tribute) snd = createCutSound('endscroll');   // wind, a brush swish per column, the stamp drum
      later(() => show(0), 1.1);
    },
    exit() {
      snd?.stop(0.5); snd = null;
      phase = 'off'; clearTimeout(timer); clearTimeout(swapT); clearTimeout(holdTimer);
      removeEventListener('keydown', key); removeEventListener('keyup', key);
    },
  };
}
