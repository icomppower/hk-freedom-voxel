// Title screen (#title). Placeholder — ui lane owns this file and the #title markup/CSS in index.html.
// Screen contract (all four flow screens): createX(el, flow) → { enter(ctx), exit() }. The flow shows `el` before
// enter() and hides it after exit(); a screen listens to its own keys only while entered. flow.go(state, ctx) moves on.
// title → flow.go('select', { mode: 'story' | 'free' }).
export function createTitle(el, flow) {
  el.innerHTML = `<div class="scr-box"><h1>定軍山</h1><p>VOXEL MUSOU · 真・三國無雙</p>
    <button data-mode="story">劇情模式 <small>STORY</small></button><button data-mode="free">自由模式 <small>FREE BATTLE</small></button></div>`;
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) flow.go('select', { mode: b.dataset.mode }); });
  return { enter() {}, exit() {} };
}
