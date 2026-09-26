// Chapter prologue (#prologue). Placeholder — story lane owns this file and the #prologue markup/CSS in index.html.
// ctx in: { mode: 'story', char, chapter }. Done → flow.go('battle', ctx).
export function createPrologue(el, flow) {
  let ctx = {};
  el.innerHTML = `<div class="scr-box"><h2>第一章 定軍山 <small>CHAPTER I · MOUNT DINGJUN</small></h2>
    <p>建安二十四年，劉備與曹操爭奪漢中。<br><small>219 AD. Liu Bei and Cao Cao contest Hanzhong.</small></p>
    <button>出陣 <small>TO BATTLE</small></button></div>`;
  el.querySelector('button').addEventListener('click', () => flow.go('battle', ctx));
  return { enter(c) { ctx = c; }, exit() {} };
}
