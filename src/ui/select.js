// Character select (#select). Placeholder — ui lane owns this file and the #select markup/CSS in index.html.
// ctx in: { mode }. Pick → flow.go(mode === 'story' ? 'prologue' : 'battle', { mode, char: id, chapter: 'ch1' });
// back → flow.go('title'). Data: CHARS / CHAR_ORDER / paintPortrait (src/chars/index.js).
import { CHARS, CHAR_ORDER } from '../chars/index.js';

export function createSelect(el, flow) {
  let ctx = {};
  el.innerHTML = `<div class="scr-box"><h2>選擇武將 <small>SELECT OFFICER</small></h2>
    ${CHAR_ORDER.map((id) => { const c = CHARS[id]; return `<button data-id="${id}">${c.name.zh} <small>${c.name.en}${c.ready ? '' : ' · WIP'}</small></button>`; }).join('')}
    <button data-back>返回 <small>BACK</small></button></div>`;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if ('back' in b.dataset) return flow.go('title');
    flow.go(ctx.mode === 'story' ? 'prologue' : 'battle', { mode: ctx.mode, char: b.dataset.id, chapter: 'ch1' });
  });
  return { enter(c) { ctx = c; }, exit() {} };
}
