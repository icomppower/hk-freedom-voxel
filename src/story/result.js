// Battle result (#result). Placeholder — story lane owns this file and the #result markup/CSS in index.html.
// ctx in: { win, stats: { kos, time, hp, maxChain }, mode, char, chapter }. Done → flow.go('title').
export function createResult(el, flow) {
  const box = document.createElement('div');
  box.className = 'scr-box';
  el.append(box);
  el.addEventListener('click', (e) => { if (e.target.closest('button')) flow.go('title'); });
  return {
    enter({ win, stats }) {
      box.innerHTML = `<h2>${win ? '勝利 <small>VICTORY</small>' : '敗北 <small>DEFEAT</small>'}</h2>
        <p>擊破 KO ${stats.kos} · 連擊 MAX CHAIN ${stats.maxChain} · 時間 TIME ${stats.time}s</p><button>返回 <small>TITLE</small></button>`;
    },
    exit() {},
  };
}
