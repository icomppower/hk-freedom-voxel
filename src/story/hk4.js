// 第四章「理工大學」 PolyU Siege, November 2019 — chapter data (format: ./ch1.js header; registry: ./chapters.js). After its
// win the result screen leads into the ENDING scroll (尾聲 天光), the end scene (story/cutscenes/ending.js) and the TRIBUTE
// card (story/prologue.js), then the title. The ENDING and the end scene are the game's fiction: Hong Kong wins its freedom.
// Story (Story Bible, Scroll Cutscenes page): every exit sealed; they hold the podium; the water-cannon truck's blue-dye
// jets sweep the footbridge with squads pushing behind them; the barricade burns and they fall back through the main gate;
// 小美 finds the rope route off the far side — motorbikes waiting on the road below — and the escape group is brought to
// the ropes; on the rooftop, 維尼熊 The Bear in four phases (分身, lights out, mask off). The ending does not pretend
// everyone got out. Lines: Scroll Cutscenes page (hk4 + ENDING + TRIBUTE).
// Script (story hook): the water cannon (fx.cannon, fx.jet: a jet from the truck beyond the barricade sweeping ±35° across
// the bridge; the hero inside it takes a hit), the escape group (five by the main gate come to the hero, join his trail
// within 8 m and go down the ropes when they reach them: fx.escape, flag 'ropesDone'), the Bear (bosses.js: 分身 at 75 %,
// lights out at 50 %: fx.dark, mask off at 25 %). Win: the Bear down (the escape group is at the ropes before the rooftop).
import { HK_MAP } from './hkmap.js';
import { SPK, freeNames } from './hk1.js';
import { bossScript } from '../chars/officers/hk/bosses.js';
import { followers } from './hkfx.js';
import { MAPS } from '../world/map.js';

export { SPK, freeNames };
export const OFF = {
  bear: { name: { zh: '維尼熊', en: 'THE BEAR' }, hp: 2340, boss: true, model: 'bear' },
  clone: { name: { zh: '分身', en: 'SHADOW CLONE' }, hp: 160, model: 'clone' },
  raptor: { name: { zh: '速龍', en: 'RAPTOR' }, hp: 520, model: 'raptor' },
};
const NAG = { who: 'sauzuk', zh: '平台未守穩，唔好衝出去！', en: 'The podium isn\'t held yet. Don\'t charge out!' };
const NAG_ROPE = { who: 'siumei', zh: '仲有人未落繩，等埋佢哋！', en: 'Some of them aren\'t down the ropes yet. Wait for them!' };

export const BEATS = [
  // ---- 平台: every exit sealed
  {
    when: { wait: 30 },
    banner: { html: '圍城<em>第一日</em>', en: 'The siege, day one', dur: 170 },
    obj: { zh: '守住平台', en: 'Hold the podium (60 s)', go: ['podium', 0, 0.2] },
    squads: [{ at: ['podium', -0.4, 0.5], n: 18 }, { at: ['podium', 0.4, 0.55], n: 18 }, { at: ['podium', 0, 0.85], n: 22 }],
    limit: { z: ['bridge', 0, -1], nag: NAG },
    morale: 0, waves: true,
  },
  {
    when: { wait: 60 * 60 },
    banner: { html: '<em>平台</em> 守住！', en: 'The podium holds', dur: 160 },
    heal: 0.3, morale: 0.1, waves: false, retire: true, hush: true,
    obj: { zh: '上天橋', en: 'Onto the footbridge', go: ['bridge', 0, -0.5] },
    limit: { z: ['bridge', 0, 0.55], nag: NAG },
  },
  // ---- 天橋: the water cannon
  {
    when: { zone: 'bridge' },
    cue: 'cannon', waves: true,
    banner: { html: '<em>水炮車</em>', en: 'Water cannon', dur: 160 },
    obj: { zh: '頂住水炮車', en: 'Hold the bridge against the water cannon', go: ['bridge', 0, 0.3] },
    squads: [{ at: ['bridge', 0, 0.45], n: 14, cols: 6, charge: true }, { at: ['bridge', 0, 0.1], n: 12, cols: 6 }],
    say: [{ who: 'sauzuk', zh: '藍色水！避開！', en: 'Blue dye! Get clear!' }],
  },
  {
    when: [{ wait: 40 * 60 }, { kos: 80, wait: 25 * 60 }],
    gate: 'barricade', cue: 'cannonOff',
    banner: { html: '<em>路障</em>失守', en: 'The barricade falls', dur: 170, big: true },
    heal: 0.2, retire: true, waves: false, limit: { z: null },
    obj: { zh: '退入正門', en: 'Fall back through the main gate', go: ['maingate', 0, 0.1] },
  },
  // ---- 正門: the rope route
  {
    when: { zone: 'maingate' },
    gate: 'mainGate', cue: 'escape', waves: true,
    obj: { zh: '護送手足到繩索', en: 'Get everyone to the ropes', go: MAPS.polyu.ROPES },
    limit: { z: ['maingate', 0, 0.9], nag: NAG_ROPE },
    squads: [{ at: ['maingate', -0.6, -0.8], n: 16, charge: true }, { at: ['maingate', 0.2, -0.9], n: 14, charge: true }],
    say: [{ who: 'siumei', zh: '天橋下面有電單車！繩索喺呢邊！', en: 'Motorbikes under the bridge! Ropes over here!' }],
  },
  {
    when: { flag: 'ropesDone' },
    banner: { html: '<em>繩索</em> 全部落晒', en: 'Everyone is down the ropes', dur: 170 },
    heal: 0.35, morale: 0.15, waves: false, retire: true, hush: true, limit: { z: null },
    obj: { zh: '上天台', en: 'Up to the rooftop', go: ['rooftop', 0, -0.6] },
  },
  // ---- 天台: the Bear
  {
    when: { zone: 'rooftop' },
    officers: { bear: { at: ['rooftop', 0, 0.3], engaged: true } },
    squads: [{ at: ['rooftop', -0.5, 0.2], n: 12, charge: true }, { at: ['rooftop', 0.5, 0.2], n: 12, charge: true }],
    obj: { zh: '擊破 維尼熊', en: 'Defeat The Bear', go: 'bear' },
    say: [{ who: 'bear', zh: '唔准提小熊維尼！', en: 'Don\'t you dare mention that bear!' }],
  },
  {
    when: { down: 'bear' },
    win: true, waves: false, morale: 1,
    banner: { html: '<em>圍城</em>解除', en: 'The siege is lifted', dur: 260, big: true },
    say: [
      { who: 'bear', zh: '歷史會還我清白！', en: 'History will clear my name!' },
      { who: 'lungjai', zh: '完咗喇。我哋贏咗。', en: 'It\'s over. We won.' },
    ],
  },
];

export const MAP = HK_MAP;
export const PROLOGUE = [
  { cols: ['十一月', '理大被圍', '出口全部封死'], en: 'November. PolyU under siege, every exit sealed.', show: ['polyu', 'siege'], focus: [900, 470, 1.4] },
  { cols: ['天橋路障', '燒到天光', '水炮車開到'], en: 'The footbridge barricade burned till dawn. The water cannon rolled up.', show: ['hhbridge'], focus: [940, 495, 1.6] },
  { cols: ['維尼熊', '親自落嚟', '收網'], en: 'The Bear came down in person to close the net.', show: ['bear'], focus: [900, 470, 1.5] },
  { cols: ['繩索 下水道', '電單車', '喺黑暗度等'], en: 'Ropes. Sewers. Motorbikes waiting in the dark.', show: ['ropes', 'sewer', 'bikes'], focus: [900, 480, 1.2] },
];
export const STAMP = { small: '第四章', big: '理工大學', seal: '圍城', en: 'CHAPTER IV · POLYU SIEGE · NOVEMBER 2019' };
// Result-screen epilogue: the Phaser game's STORY[3] (src/data/story.js), verbatim
export const EPILOGUE = {
  zh: ['2019年11月，警方圍困香港理工大學長達兩週。數百名示威者被困校內——有人經下水道逃脫，有人用繩索滑下，黑暗中有電單車等待接應。留下來的人面對被捕的命運。校園成為最後防線的象徵。',
    '<i>他們堅守，不是因為相信會勝利。而是因為，有些事情值得堅守。</i>'],
  en: ['In November 2019, police surrounded Hong Kong Polytechnic University for two weeks. Inside, hundreds of protesters were trapped — some escaped through sewers, ropes, and motorbikes waiting in the dark. Those who remained faced arrest. The campus became a symbol of a last stand.',
    '<i>They held the line not because they thought they would win. They held it because some things are worth holding.</i>'],
};
export const DEFEAT = { zh: '{name}倒下了⋯⋯包圍網收緊。', en: '{name} goes down... the net closes in.' };

// ---- ENDING scroll (after the hk4 result) + the tribute card (title menu 致敬 too)
// The game's fiction from here on (the chapter epilogues keep the real 2019 history): Hong Kong people win their freedom.
export const ENDING = [
  { cols: ['面具碎咗', '維尼熊', '再冇人怕'], en: 'The mask shattered, and no one feared the Bear any more.', show: ['bear', 'polyu'], focus: [900, 470, 1.5] },
  { cols: ['防線一條條', '放低盾牌', '收隊返屋企'], en: 'Line by line, the riot squads lowered their shields and went home.', show: ['siege'], focus: [880, 480, 1.2] },
  { cols: ['百萬人', '行返夏慤道', '雨傘全開'], en: 'A million people walked back onto Harcourt Road, every umbrella open.', show: ['march', 'harcourt'], focus: [800, 645, 1.3] },
  { cols: ['香港人', '自己話事', '自己揀路'], en: 'Hong Kong people would decide for themselves, and choose their own road.', show: ['admiralty', 'legco'], focus: [840, 630, 1.2] },
  { cols: ['自由', '獨立', '由今日開始'], en: 'Freedom. Independence. Starting today.', show: ['harbour', 'city'], focus: [800, 540, 1.0] },
  { cols: ['龍仔除低口罩', '小美', '笑住喊'], en: 'Dragon took off his mask. Amy laughed and cried at once.', show: ['lungjai', 'siumei'], focus: [820, 640, 1.6] },
];
export const ENDING_STAMP = { small: '尾聲', big: '天光', seal: '自由', en: 'EPILOGUE · DAYBREAK' };
// Scroll Cutscenes page wording; the link is an open decision (Story Bible): TBD, no names on screen
export const TRIBUTE = {
  title: { zh: '致敬', en: 'TRIBUTE' },
  zh: ['2019年，數以百萬計的香港人走上街頭。這個遊戲獻給每一位曾經企出來的人。角色與結局是虛構的，地方與日子是真實的。', '連結：待定'],
  en: ['In 2019, millions of Hong Kong people took to the streets. This game is for everyone who stood. The characters and this ending are fiction; the places and dates are real.', 'Link: TBD'],
};

// ---- script: the water cannon, the rope route, the Bear
const boss = bossScript('bear', { clone: 'clone', on: {
  2: { banner: { html: '<em>分身</em>', en: 'Shadow clones', dur: 150 } },
  3: { banner: { html: '<em>燈光</em>熄滅', en: 'Lights out', dur: 150 }, say: [{ who: 'bear', zh: '黑暗就係我嘅武器。', en: 'The dark is my weapon.' }] },
  4: { banner: { html: '<em>面具</em>落', en: 'The mask comes off', dur: 150 }, say: [{ who: 'bear', zh: '⋯⋯朕要親自出手。', en: '...We shall see to this personally.' }] },
} });
export function script(game, api) {
  const b = boss(game, api), fx = b.fx;
  Object.assign(fx, { cannon: null, jet: { x: 0, z: -30, yaw: Math.PI, len: 34 }, escape: [], roped: 0 });
  let cannonT = -1, esc = null;
  const R = MAPS.polyu.ROPES;
  return {
    fx,
    cue(name) {
      if (name === 'cannon' && cannonT < 0) { cannonT = api.t(); fx.cannon = true; }
      if (name === 'cannonOff') fx.cannon = false;
      if (name === 'escape' && !esc) { esc = followers([[-6, 4], [-3, 6], [0, 5], [3, 6], [6, 4]], { join: 8, seek: 2 }); fx.escape = esc.list; }
    },
    step() {
      const h = game.hero, t = api.t();
      b.step();
      if (fx.cannon) {                                                 // the jet sweeps ±35° across the bridge, 5 s a pass
        const J = fx.jet, k = t - cannonT; J.yaw = Math.PI + Math.sin(k * 2 * Math.PI / 300) * 0.6;
        const dx = h.x - J.x, dz = h.z - J.z, along = dx * Math.sin(J.yaw) + dz * Math.cos(J.yaw), side = dx * Math.cos(J.yaw) - dz * Math.sin(J.yaw);
        if (along > 0 && along < J.len && Math.abs(side) < 1.3 && h.y < 1) h.hurt(Math.round(8 * game.diff.dmg), J.x, J.z, false);
      }
      if (esc) {
        esc.step(h);
        for (const e of esc.list) if (e.joined && !e.home && Math.hypot(e.x - R[0], e.z - R[1]) < 4) { e.home = true; fx.roped++; }
        if (esc.list.every((e) => e.home)) api.flag('ropesDone', true);
      }
    },
  };
}
