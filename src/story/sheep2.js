// 第二章「燈籠街夜行」 Lantern Street by Night — chapter data (format: ./ch1.js header; registry: ./chapters.js).
// Story (Storyline page): curfew bells; the twelve gather in the market, unlit lanterns in their bundles. 影爪's flare
// arrows sweep the alleys — wherever one lands, wolves close in — so 小咩 splits them three ways; 阿角 takes four up the
// steepest stair while the street lanterns are shot down one after another. At the checkpoint 小咩 cuts the gate winch and
// 阿角 holds off the wolf running for the alarm drum; 影爪 drops to the ground for a duel and falls into the channel; the
// drum never sounds. One by one the twelve reach the lookout over the fog harbor. Lines: Scroll Cutscenes page (Ch. II).
// Script (story hook): four of the twelve follow the hero (fx.escorts: render-only trail, they can't be hurt: happy
// ending); 影爪's flares (every 10 s near the hero: a squad converges on each, fx.flares); the lantern chain (fx.lanternsDown);
// the winch (2.5 s in all within 4 m of it: gate 'checkpoint' lifts); the alarm drum (75 s from the checkpoint: KO the drummer first or
// the chapter is lost); the rest of the twelve reaching the lookout (fx.arrived → 12 = win).
import { SHEEP_MAP } from './sheepmap.js';
import { SPK as SPK1 } from './sheep1.js';

export const SPK = SPK1;
export const freeNames = [{ zh: '巡夜狼', en: 'NIGHT PATROL' }, { zh: '擂鼓狼', en: 'DRUMMER' }, { zh: '關卡狼', en: 'CHECKPOINT GUARD' }, { zh: '影爪', en: 'SHADOW CLAW' }];
export const OFF = {
  shadow: { name: { zh: '影爪', en: 'SHADOW CLAW' }, hp: 700, model: 'shadow' },
  drummer: { name: { zh: '擂鼓狼', en: 'THE DRUMMER' }, hp: 300 },
};
const NAG = { who: 'siume', zh: '慢啲！羊仔跟唔上！', en: 'Slow down! The little ones can\'t keep up!' };
const NAG_GATE = { who: 'gok', zh: '閘未開，過唔到。先剪門絞。', en: 'The gate\'s down. Cut the winch first.' };

export const BEATS = [
  {
    when: { wait: 30 },
    cue: 'escort', morale: 0,
    obj: { zh: '帶四隻羊仔上樓梯巷', en: 'Lead four of the twelve to the stair-alleys', go: ['stairs', 0, -0.95] },
    squads: [{ at: ['market', -0.5, 0.2], n: 16 }, { at: ['market', 0.5, 0.35], n: 16 }, { at: ['market', 0, 0.8], n: 18 }],
    limit: { z: ['stairs', 0, -0.9], nag: NAG },
    say: [
      { who: 'siume', zh: '⋯⋯十、十一、十二。齊人。', en: '...Ten, eleven, twelve. Everyone\'s here.' },
      { who: 'gok', zh: '記住，唔好點燈。今晚我哋係影。', en: 'Remember: no lanterns. Tonight we\'re shadows.' },
    ],
  },
  {
    when: [{ at: ['market', 0, 0.4] }, { wait: 25 * 60 }],
    cue: 'flares', waves: true,
    say: [
      { who: 'shadow', zh: '黑夜入面，每一隻羊都白到發光。', en: 'In the dark, every sheep glows white.' },
      { who: 'siume', zh: '咁就仲好，等佢哋睇住我哋行。分三路！', en: 'Good. Let them watch us go. Split three ways!' },
    ],
  },
  {
    when: [{ kos: 80, wait: 20 * 60 }, { wait: 60 * 60 }],
    obj: { zh: '上樓梯巷', en: 'Climb the stair-alleys', go: ['stairs', 0, 0.9] },
    limit: { z: ['checkpoint', 0, -0.9], nag: NAG },
  },
  {
    when: { zone: 'stairs' },
    cue: 'lanterns',
    banner: { html: '<em>燈籠</em>連環落', en: 'The street lanterns come down one after another', dur: 170 },
    squads: [{ at: ['stairs', 0, -0.3], n: 14, charge: true }, { at: ['stairs', -0.6, 0.2], n: 12, charge: true }, { at: ['stairs', 0.6, 0.3], n: 12, charge: true }],
    say: [{ who: 'lamb', zh: '角叔，好光呀⋯⋯', en: 'Uncle Gok, it\'s so bright...' }, { who: 'gok', zh: '光，就行快啲。', en: 'Then walk faster.' }],
  },
  {
    when: { zone: 'checkpoint' },
    cue: 'drum', waves: true, retire: true, hush: true,
    obj: { zh: '剪斷門絞，截住擂鼓狼', en: 'Cut the gate winch — stop the drummer', go: [MAP_WINCH()[0], MAP_WINCH()[1]] },
    officers: { drummer: { at: ['checkpoint', -0.4, -0.2], engaged: true } },
    squads: [{ at: ['checkpoint', 0, 0.3], n: 18, charge: true }, { at: ['checkpoint', 0.5, -0.3], n: 12 }],
    limit: { z: ['checkpoint', 0, 0.3], nag: NAG_GATE },
    say: [{ who: 'siume', zh: '我剪門絞，你睇住個鼓！', en: 'I\'ll cut the winch, you watch the drum!' }],
  },
  {
    when: { flag: 'winch' },
    gate: 'checkpoint', heal: 0.2,
    banner: { html: '<em>門絞</em>剪斷', en: 'The winch is cut — the gate rises', dur: 150 },
    officers: { shadow: { at: ['checkpoint', 0, 0.75], engaged: true } },
    obj: { zh: '擊破 影爪', en: 'Defeat Shadow Claw', go: 'shadow' },
    limit: { z: ['checkpoint', 0, 0.95], nag: NAG },
    say: [
      { who: 'shadow', zh: '細路，你跑得快，快得過箭咩？', en: 'You\'re quick, kid. Quicker than an arrow?' },
      { who: 'siume', zh: '試吓囉。', en: 'Try me.' },
    ],
  },
  {
    when: { down: 'shadow' },
    banner: { html: '影爪 <em>落水</em>', en: 'Shadow Claw falls into the channel', dur: 180, big: true },
    heal: 0.3, morale: 0.15, waves: false, retire: true, hush: true, limit: { z: null },
    obj: { zh: '上觀景台', en: 'Go up to the lookout', go: ['lookout', 0, 0] },
    say: [{ who: 'gok', zh: '鼓⋯⋯冇響。', en: 'The drum... didn\'t sound.' }, { who: 'siume', zh: '今晚，運氣喺我哋度。', en: 'Luck\'s on our side tonight.' }],
  },
  {
    when: { zone: 'lookout' },
    cue: 'regroup', waves: true,
    obj: { zh: '守住觀景台，等十二勇士齊人', en: 'Hold the lookout until all twelve arrive', go: ['lookout', 0, 0] },
    squads: [{ at: ['lookout', -0.6, -0.5], n: 16, charge: true }, { at: ['lookout', 0.6, -0.4], n: 16, charge: true }],
  },
  {
    when: { flag: 'twelve' },
    win: true, waves: false, morale: 1,
    banner: { html: '<em>十二勇士</em> 齊集觀景台', en: 'All twelve reach the lookout', dur: 260, big: true },
    say: [{ who: 'gok', zh: '十二隻，一隻都唔可以少。', en: 'Twelve. Not one fewer.' }, { who: 'siume', zh: '十二。齊。', en: 'Twelve. All here.' }],
  },
];
function MAP_WINCH() { return [9.5, 34]; }                          // a step in front of the winch (map: WINCH [9.5, 36])

export const MAP = SHEEP_MAP;
export const PROLOGUE = [
  { cols: ['訊號燈亮咗', '十二隻羊知道', '今晚要行'], en: 'The signal lantern was lit. The twelve knew: tonight they leave.', show: ['shrine'], focus: [900, 560, 1.35] },
  { cols: ['宵禁鐘響', '街市集合', '燈籠唔好點'], en: 'Curfew bells. They gather in the market square, lanterns unlit.', show: ['market', 'twelve'], focus: [760, 500, 1.35] },
  { cols: ['影爪守住屋頂', '照明箭一落', '狼就圍埋嚟'], en: 'Shadow Claw holds the rooftops. Wherever his flare arrows land, wolves close in.',
    show: ['shadow', 'checkpoint'], focus: [860, 400, 1.4] },
  { cols: ['分三路上樓梯', '過咗關卡', '就見到海'], en: 'Three ways up the stair-alleys. Past the checkpoint lies the sea.',
    show: ['sheep2a', 'sheep2b', 'sheep2c', 'stairs', 'lookout'], focus: [860, 420, 1.2] },
];
export const STAMP = { small: '第二章', big: '燈籠街夜行', seal: '宵禁', en: 'CHAPTER II · LANTERN STREET BY NIGHT' };
export const EPILOGUE = {
  zh: ['十二隻羊企喺觀景台。', '落面係霧港，一隻細船喺霧入面搖緊。'],
  en: ['The twelve stood at the lookout.', 'Below lay the fog harbor, and a small boat rocking in the mist.'],
};
export const DEFEAT = { zh: '{name}力戰不支，警報鼓聲響遍燈籠街⋯⋯', en: '{name} is overwhelmed, and the alarm drum rolls through Lantern Street...' };

// ---- script
export function script(game, api) {
  const trail = [], fx = { escorts: [0, 1, 2, 3].map(() => ({ x: 0, z: 0, on: false })), flares: [0, 1, 2].map(() => null), lanternsDown: 0,
    drum: -1, arrived: 0, winchT: 0 };
  let escort = false, flareT = -1, flareK = 0, lanternT = -1, drumT = -1, regroupT = -1;
  const W = [9.5, 36];
  return {
    fx,
    cue(name) {
      const t = api.t();
      if (name === 'escort') escort = true;
      if (name === 'flares' && flareT < 0) flareT = t;
      if (name === 'lanterns' && lanternT < 0) lanternT = t;
      if (name === 'drum' && drumT < 0) drumT = t;
      if (name === 'regroup' && regroupT < 0) { regroupT = t; fx.arrived = 4; }   // the hero's four arrive with him
    },
    step() {
      const h = game.hero, t = api.t();
      // escorts: four lambs on the hero's trail, 1.6 m apart
      if (escort) {
        if (!trail.length || Math.hypot(h.x - trail[0][0], h.z - trail[0][1]) > 0.8) trail.unshift([h.x, h.z]);
        if (trail.length > 20) trail.length = 20;
        fx.escorts.forEach((e, k) => { const p = trail[Math.min(trail.length - 1, 2 + k * 2)]; e.on = true; e.x = p[0]; e.z = p[1]; });
      }
      // flares until the checkpoint: every 10 s one lands 4-8 m off the hero and a squad converges on it
      fx.flares.forEach((f) => { if (f) f.age++; });
      if (flareT >= 0 && drumT < 0 && (t - flareT) % 600 === 0) {
        const a = (flareK * 2.4) % (Math.PI * 2), r = 4 + (flareK % 3) * 2, x = h.x + Math.sin(a) * r, z = h.z + Math.cos(a) * r;
        fx.flares[flareK++ % 3] = { x, z, age: 0 };
        api.squad({ at: [x + Math.sin(a) * 10, z + Math.cos(a) * 10], n: 8 });
      }
      // the lantern chain: one more comes down every 0.6 s
      if (lanternT >= 0 && (t - lanternT) % 36 === 0 && fx.lanternsDown < 27) fx.lanternsDown++;
      // the winch: 3 s at it
      if (drumT >= 0 && !api.flag('winch')) {
        if (Math.hypot(h.x - W[0], h.z - W[1]) < 4) fx.winchT++;         // time at the winch adds up (a knockback only pauses it)
        if (fx.winchT >= 150) api.flag('winch', true);
      }
      // the alarm drum: 75 s from the checkpoint unless the drummer is down
      if (drumT >= 0 && !api.dead('drummer')) {
        fx.drum = (t - drumT) / 4500;
        if (t - drumT >= 4500) api.lose();
      } else if (drumT >= 0) fx.drum = -1;
      // the lookout: the other eight arrive in two groups
      if (regroupT >= 0) {
        const k = t - regroupT;
        if (k === 15 * 60) fx.arrived = 8;
        if (k === 38 * 60) { fx.arrived = 12; api.flag('twelve', true); }
      }
    },
  };
}
