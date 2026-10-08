// ?preview — a scene gallery on the title screen: every prologue scroll, the three between-stage cutscenes, the ENDING
// scroll (→ end scene → tribute) and the end scene alone, each one tap away, with a 龍仔 / 小美 lead toggle.
// Each piece returns to the title (a previewed prologue hands to the title instead of its battle). Deep link:
// ?preview=hk2 (prologue) | between1..3 | endscroll | ending plays that piece once on boot. Menus are untouched without it.
import { inkWipe, wiping, afterWipe } from '../ui/menu.js';

const ITEMS = [
  ['hk1', '序 · 金鐘', 'Prologue 1'], ['between1', '雨後', 'Cutscene 1'],
  ['hk7', '序 · 銅鑼灣', 'Prologue · Causeway Bay'], ['hk2', '序 · 立法會', 'Prologue 2'], ['between2', '尾班車', 'Cutscene 2'],
  ['hk3', '序 · 元朗', 'Prologue 3'], ['between3', '竹枝', 'Cutscene 3'],
  ['hk6', '序 · 中大', 'Prologue · Bridge No. 2'], ['hk4', '序 · 理大', 'Prologue 5'], ['endscroll', '結局卷軸', 'Ending scroll → scene → tribute'],
  ['ending', '天光', 'End scene only'],
];

export function createPreview(flow) {
  const go = flow.go.bind(flow);
  let state = '', char = 'lungjai', busy = false, pending = new URLSearchParams(location.search).get('preview');
  const el = document.createElement('div');
  el.id = 'preview';
  el.style.cssText = 'position:fixed;left:12px;top:12px;z-index:60;max-width:min(360px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;padding:10px;'
    + 'background:rgba(20,14,10,.82);border:1px solid #c9a24a;border-radius:8px;color:#f3e6c8;font:14px/1.3 system-ui,sans-serif';
  const btn = 'display:block;width:100%;margin:4px 0;padding:8px 10px;text-align:left;background:#2a2016;color:#f3e6c8;'
    + 'border:1px solid #6a5430;border-radius:6px;font:inherit;cursor:pointer';
  const draw = () => {
    el.innerHTML = `<b style="color:#e8c46a">場景預覽 Scene preview</b>
      <div style="display:flex;gap:6px;margin:6px 0">${[['lungjai', '龍仔'], ['siumei', '小美']].map(([id, n]) =>
        `<button data-char="${id}" style="${btn};text-align:center;${id === char ? 'background:#8a6a2a' : ''}">${n}</button>`).join('')}</div>
      ${ITEMS.map(([id, zh, en]) => `<button data-go="${id}" style="${btn}">${zh} <small style="opacity:.7">${en}</small></button>`).join('')}`;
  };
  const play = (id) => {
    busy = true; el.hidden = true;
    const home = () => inkWipe(() => flow.go('title'));
    const run = () => inkWipe(() => {
      if (/^hk\d$/.test(id)) go('loading', { mode: 'story', char, chapter: id, preview: true });
      else if (id === 'endscroll') go('ending', { mode: 'story', char, chapter: 'hk4' });
      else go('cutscene', { id, char, then: home });
    });
    wiping() ? afterWipe(run) : run();                // a tap during a wipe waits for it, instead of being dropped
  };
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('button'); if (!b || busy) return;
    if (b.dataset.char) { char = b.dataset.char; draw(); } else play(b.dataset.go);
  });
  // a previewed prologue ends at the title, not in its battle; the panel shows on the title only
  flow.go = (s, c = {}) => {
    if (s === 'battle' && c.preview) { if (!c.home) { c.home = true; inkWipe(() => flow.go('title')); } return Promise.resolve(); }
    state = s;
    if (s === 'title') { busy = false; el.hidden = false; draw();
      if (pending && ITEMS.some(([id]) => id === pending)) { const id = pending; pending = null; setTimeout(() => play(id), 900); } }
    else el.hidden = true;
    return go(s, c);
  };
  el.hidden = true; draw();
  document.body.appendChild(el);
}
