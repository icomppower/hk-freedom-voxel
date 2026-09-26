// Loading card (#loading, ui lane). 出陣 on the select screen ink-wipes into this card, then main.js (flow.go('loading'))
// sets the battle up for the chosen officer under it — kit views built, every material compiled, a few frames rendered —
// and ink-wipes on into the prologue (story) or the battle (free). So the field is never seen with the wrong officer and
// the first battle frames don't stall on shader compiles.
// Layout (DW loading card): the officer's pixel portrait large on an accent ink disc at left, chapter band, brush name +
// red seal, the intro line; a tip (心得) and a gold brush-stroke progress bar along the bottom.
// ctx in: { mode, char, chapter }. main.js drives progress(0..1) and ready(); nothing here touches the sim.
import { CHARS, paintPortrait } from '../chars/index.js';

export const MODE = { story: ['第一章「定軍山」', 'Story · Chapter I · Mount Dingjun'], free: ['自由演武', 'Free battle · endless waves'] };
// [zh, en, char id | undefined = any officer] — keep in step with the controls table (title.js CONTROLS)
const TIPS = [
  ['連按 J 打出完整連擊，連擊中按 K 接蓄力技。', 'Tap J for the full combo; press K mid-combo for a charge attack.'],
  ['無雙槽滿時按 I，發動無雙亂舞。', 'When the gold gauge is full, press I to unleash your Musou.'],
  ['按 L 或 Shift 閃避，翻滾瞬間刀槍不入。', 'L or Shift dodges; the roll slips through a blow.'],
  ['按 R 視角回正，或鎖定最近的敵將。', 'R recenters the camera behind you, or onto the nearest officer.'],
  ['點擊戰場以滑鼠轉動視角，Q / E 亦可轉動鏡頭。', 'Click the field to steer the camera with the mouse; Q / E turn it too.'],
  ['站定長按 K 拉弓瞄準，放開即射；滿弓一箭可貫穿數人。', 'Standing still, hold K to draw and aim, release to loose; a full draw pierces a line.', 'huangzhong'],
  ['爆頭：瞄準敵將頭部，傷害倍增。', 'Aim for an officer\'s head: a headshot hits far harder.', 'huangzhong'],
];

export function createLoading(el) {
  el.innerHTML = `
    <div class="l-port"><canvas width="20" height="20"></canvas></div>
    <section class="l-main">
      <p class="l-ch"><b></b><small></small></p>
      <div class="l-name"><h1></h1><i class="l-seal"></i></div>
      <p class="l-en"></p>
      <p class="l-line"><b></b><small></small></p>
    </section>
    <footer class="l-foot">
      <p class="l-tip"><span>心得</span><b></b><small></small></p>
      <div class="l-prog"><div class="l-bar"><i></i></div><p class="l-state"><b>整軍備戰</b><small>Preparing the field</small></p></div>
    </footer>`;
  const $ = (s) => el.querySelector(s), bar = $('.l-bar i');
  return {
    enter(c) {
      const ch = CHARS[c.char] || CHARS.zhaoyun, [zh, en] = MODE[c.mode] || MODE.free;
      el.style.setProperty('--acc', ch.accent);
      el.classList.remove('ready', 'in'); void el.offsetWidth; el.classList.add('in');
      paintPortrait($('.l-port canvas'), ch);
      $('.l-ch b').textContent = zh; $('.l-ch small').textContent = en;
      $('.l-name h1').textContent = ch.name.zh; $('.l-seal').textContent = ch.seal;
      $('.l-en').textContent = `${ch.name.en} · ${ch.title.en}`;
      $('.l-line b').textContent = ch.lines.intro.zh; $('.l-line small').textContent = ch.lines.intro.en;
      const tips = TIPS.filter((t) => !t[2] || t[2] === ch.id), t = tips[Math.floor(Math.random() * tips.length)];   // UI only, not the sim
      $('.l-tip b').textContent = t[0]; $('.l-tip small').textContent = t[1];
      $('.l-state b').textContent = '整軍備戰'; $('.l-state small').textContent = 'Preparing the field';
      this.progress(0.08);
    },
    exit() {},
    /** p 0..1: real set-up stages (main.js deploy). */
    progress(p) { bar.style.transform = `scaleX(${p})`; },
    ready() {
      el.classList.add('ready');
      $('.l-state b').textContent = '出陣'; $('.l-state small').textContent = 'To battle';
    },
  };
}
