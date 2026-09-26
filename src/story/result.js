// Battle result (#result), DW8 style: the battlefield stays frozen behind an ink wash; the hero's portrait and a big
// brush 勝利 / 敗北, then the tallies count up one by one (KOs, max chain, time, damage taken), the rank stamps in (win:
// S/A/B/C, rules in index.js rank()), and the epilogue (ch1.js EPILOGUE) closes the chapter.
// Win → 繼續 (title). Defeat → 再戰 (the loading card, then straight back into the battle, no prologue) or 返回 (title).
// Every exit is an ink wipe (ui lane menu.js). ctx.art (the officer's key-art still, main.js snapArt) fills the right side.
// Keys: Enter / Space press the focused button (← → move between them), Esc → title.
// ctx in: { win, stats: { kos, time, hp, hpMax, maxChain, dmg, char, rank? }, mode, char, chapter }.
import { CHARS, paintPortrait } from '../chars/index.js';
import { EPILOGUE } from './ch1.js';
import { inkWipe } from '../ui/menu.js';

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function createResult(el, flow) {
  let ctx = {}, raf = 0;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'retry') inkWipe(() => flow.go('loading', { mode: ctx.mode, char: ctx.char, chapter: ctx.chapter, art: ctx.art, retry: true }));
    else inkWipe(() => flow.go('title'));
  });
  const key = (e) => {
    if (e.code === 'Escape') return inkWipe(() => flow.go('title'));
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      const bs = [...el.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
      bs[(i + (e.code === 'ArrowLeft' || e.code === 'ArrowUp' ? bs.length - 1 : 1)) % bs.length]?.focus();
      e.preventDefault();
    }
  };

  return {
    enter(c) {
      ctx = c;
      const { win, stats: s } = c, ch = CHARS[c.char] || CHARS.zhaoyun, epi = EPILOGUE[ch.id] || EPILOGUE.huangzhong;
      const rows = [
        ['擊破數', 'K.O. COUNT', s.kos, (v) => v],
        ['最大連擊', 'MAX CHAIN', s.maxChain, (v) => v],
        ['經過時間', 'TIME', s.time, mmss],
        ['受到傷害', 'DAMAGE TAKEN', Math.round(s.dmg || 0), (v) => v],
      ];
      el.className = `scr ${win ? 'win' : 'lose'}${c.art ? ' art' : ''}`;
      el.style.setProperty('--art', c.art ? `url("${c.art}")` : 'none');
      el.innerHTML = `<div class="rs">
        <div class="rs-head"><div class="rs-badge"><canvas width="20" height="20"></canvas></div>
          <div><small>第一章 定軍山 · CHAPTER I · MOUNT DINGJUN</small><h2>${win ? '勝利' : '敗北'}</h2><em>${win ? 'VICTORY' : 'DEFEAT'}</em></div></div>
        <div class="rs-body">
          <table class="rs-stats">${rows.map(([zh, en], i) => `<tr style="--i:${i}"><th>${zh}<small>${en}</small></th><td>0</td></tr>`).join('')}</table>
          ${win && s.rank ? `<div class="rs-rank r${s.rank}"><span>評價<small>RANK</small></span><b>${s.rank}</b></div>` : ''}
        </div>
        <div class="rs-epi">${win
          ? epi.zh.map((z, i) => `<p>${z}<small>${epi.en[i]}</small></p>`).join('')
          : `<p>${ch.name.zh}力戰不支，蜀軍攻勢受挫……<small>${ch.name.en} falls at last, and the Shu assault falters...</small></p>`}</div>
        <div class="rs-btns">${win
          ? '<button data-act="title">繼續<small>CONTINUE</small></button>'
          : '<button data-act="retry">再戰<small>RETRY</small></button><button data-act="title" class="sub">返回<small>TITLE</small></button>'}</div>
      </div>
      <footer class="ui-foot">${win ? '' : '<span><kbd>←</kbd><kbd>→</kbd>選擇<small>Select</small></span>'}
        <span><kbd>Enter</kbd>決定<small>Confirm</small></span><span><kbd>Esc</kbd>返回<small>Title</small></span></footer>`;
      paintPortrait(el.querySelector('canvas'), ch);
      // tallies count up in turn (0.7 s each, 0.35 s apart, after the title lands)
      const tds = [...el.querySelectorAll('.rs-stats td')], t0 = performance.now() + 700;
      const tick = (now) => {
        let busy = false;
        rows.forEach(([, , v, fmt], i) => {
          const u = Math.max(0, Math.min(1, (now - t0 - i * 350) / 700));
          if (u < 1) busy = true;
          tds[i].textContent = fmt(Math.round(v * (1 - (1 - u) ** 3)));
        });
        if (busy) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      setTimeout(() => { if (!el.hidden) el.querySelector('button')?.focus({ preventScroll: true }); }, 50);
      addEventListener('keydown', key);
    },
    exit() { cancelAnimationFrame(raf); removeEventListener('keydown', key); },
  };
}
