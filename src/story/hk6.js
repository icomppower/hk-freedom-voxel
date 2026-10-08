// 中大二號橋 Bridge No. 2, 12 November 2019 — chapter data (format: ./ch1.js header; registry: ./chapters.js). Chapter id hk6
// (hk5 stays retired: it was the airport). Campaign: 元朗 hk3 chains into it, 竹枝 between3 follows it into 理工 hk4.
// Story: students hold Bridge No. 2, the footbridge over the highway, through a long day of tear gas. 龍仔 and 小美 learn
// 滅煙 on the campus road (a traffic cone over the canister, then water), hold the bridge through three waves while
// canisters keep landing, restack the barricade at its far end, and on the hill face 煙霧隊長 The Gas Captain (an
// original archetype). The fights are the game's fiction; the dated facts are in the prologue and the epilogue.
// Script (story hook): canisters (fx.gas: { x, z, t, age, state 'live' | 'coned' | 'out' | 'spent', haze 0-1, water }): a
// live canister grows a haze cloud (radius 4.5 m × haze); a hero within 1.6 m drops a cone over it (coned: the haze stops
// growing), a hero staying within 2.2 m pours the water (45 steps → out: the haze clears); left alone it burns out after
// 18 s. Haze stings: a hero inside a live / coned cloud loses 1 HP every 20 steps (never below 1). The barricade
// (fx.barricade 0-1): the students restack it while a hero holds the ground within 12 m of it, 25 s in all. The Gas Captain's canister fans (bosses.js
// fx.cans) land as live canisters.
// Win: the Gas Captain down.
// Design note (PROGRESS.md): the brief's "hold interact" is "stand by it" here — solo has no interact key, so the same
// rule works for keyboard, touch, bots and co-op without an engine change.
// Sources (prologue, epilogue): Wikipedia, "Siege of the Chinese University of Hong Kong" (11-15 Nov 2019: police tried
// to take Bridge No. 2 to stop the highway below being blocked); Hong Kong Free Press, "Hong Kong police and protesters
// battle into the night on CUHK campus" (12 Nov 2019: tear gas on campus, clashes into the night); AFP via The Week, "Hong
// Kongers harness traffic cones, kitchenware to battle tear gas" (8 Aug 2019: cones over canisters, water poured in).
// No counts of canisters or injuries, no real person named. Content rule: 龍仔 / 小美 are composites; no university
// crest, name or logo on anything.
import { HK_MAP } from './hkmap.js';
import { arrows } from './scrollkit.js';
import { SPK as HK_SPK, freeNames } from './hk1.js';
import { bossScript } from '../chars/officers/hk/bosses.js';
import { MAPS } from '../world/map.js';

export { freeNames };
export const SPK = {
  ...HK_SPK,
  student: { name: { zh: '同學', en: 'Student' }, seal: '學', side: 'shu' },
  gascap: { name: { zh: '煙霧隊長', en: 'The Gas Captain' }, seal: '煙', side: 'wei' },
};
export const OFF = {
  gascap: { name: { zh: '煙霧隊長', en: 'THE GAS CAPTAIN' }, hp: 1500, boss: true, model: 'gascap' },
  raptor: { name: { zh: '速龍', en: 'RAPTOR' }, hp: 600, model: 'raptor' },
  captain: { name: { zh: '防暴隊長', en: 'RIOT CAPTAIN' }, hp: 360 },
};
const NAG = { who: 'student', zh: '橋頭仲未守穩，唔好衝咁前！', en: 'The bridge isn\'t held yet. Don\'t run ahead!' };
const NAG_BAR = { who: 'student', zh: '路障未疊好，頂多陣！', en: 'The barricade isn\'t up yet. Hold on!' };

export const BEATS = [
  // ---- 大學道: the rally and the 滅煙 lesson
  {
    when: { wait: 30 },
    banner: { html: '11·12 <em>中大二號橋</em>', en: '12 November · Bridge No. 2', dur: 170 },
    obj: { zh: '跟同學上大學道', en: 'Up the campus road with the students', go: ['campus', 0, 0.3] },
    limit: { z: ['campus', 0, 0.85], nag: NAG },
    morale: 0,
    say: [{ who: 'lungjai', zh: '條橋下面就係公路。守住佢！', en: 'The highway runs under that bridge. We hold it!' }],
  },
  {
    when: { wait: 4 * 60 },
    cue: 'lesson',
    obj: { zh: '滅煙：行埋去罩住個彈', en: 'Put it out: walk up to the canister', go: ['campus', 0, 0.55] },
    say: [{ who: 'student', zh: '雪糕筒冚住佢，再倒水！', en: 'Cone over it, then pour in water!' }],
  },
  {
    when: { flag: 'lessonOut' },
    gate: 'campusLine',
    banner: { html: '<em>滅煙</em>', en: 'Canister out', dur: 140 },
    obj: { zh: '上二號橋', en: 'Onto Bridge No. 2', go: ['bridge', 0, -0.8] },
    limit: { z: ['bridge', 0, -0.5], nag: NAG },
    say: [{ who: 'siumei', zh: '學識咗。上橋！', en: 'Got it. Onto the bridge!' }],
  },
  // ---- 二號橋: three waves under the gas
  {
    when: { zone: 'bridge' },
    cue: 'volleys', waves: true,
    banner: { html: '<em>第一波</em>', en: 'First wave', dur: 140 },
    obj: { zh: '守住二號橋', en: 'Hold Bridge No. 2', go: ['bridge', 0, 0.2] },
    limit: { z: ['bridge', 0, 0.55], nag: NAG },
    squads: [{ at: ['bridge', 0, 0.75], n: 16, charge: true }, { at: ['bridge', 0, 0.95], n: 16, charge: true }],
    say: [{ who: 'student', zh: '佢哋由公路嗰邊上嚟！', en: 'They\'re coming up from the highway side!' }],
  },
  {
    when: { wait: 40 * 60 },
    banner: { html: '<em>第二波</em>', en: 'Second wave', dur: 140 },
    squads: [{ at: ['bridge', 0, 0.8], n: 18, charge: true }, { at: ['bridgehead', 0, 0], n: 16, charge: true }],
    officers: { raptor: { at: ['bridge', 0, 0.85], engaged: true } },
    say: [{ who: 'raptor', zh: '清橋！', en: 'Clear the bridge!' }],
  },
  {
    when: { wait: 40 * 60, down: 'raptor' },
    banner: { html: '<em>第三波</em>', en: 'Third wave', dur: 140 },
    squads: [{ at: ['bridge', 0, 0.8], n: 20, charge: true }, { at: ['bridgehead', -0.4, 0], n: 14, charge: true }, { at: ['bridgehead', 0.4, 0], n: 14, charge: true }],
    officers: { captain: { at: ['bridgehead', 0, -0.2], engaged: true } },
    say: [{ who: 'siumei', zh: '撐住，再嚟一波！', en: 'Hang on, one more wave!' }],
  },
  {
    when: { wait: 30 * 60, down: 'captain' },
    cue: 'barricade', heal: 0.3, morale: 0.15, waves: true, retire: true, hush: true,
    banner: { html: '二號橋 <em>守住</em>', en: 'The bridge holds', dur: 170 },
    obj: { zh: '重建路障', en: 'Restack the barricade', go: ['bridgehead', 0, -0.3] },
    limit: { z: ['bridgehead', 0, 0.4], nag: NAG_BAR },
    say: [{ who: 'student', zh: '垃圾桶、磚頭，快啲疊返佢！', en: 'Bins, bricks — stack it back up, quick!' }],
  },
  // ---- 山上: the Gas Captain
  {
    when: { flag: 'barricadeUp' },
    gate: 'hillSteps', cue: 'volleysOff', waves: false, retire: true, hush: true, limit: { z: null },
    banner: { html: '<em>路障</em> 疊好！', en: 'The barricade is back up', dur: 160 },
    obj: { zh: '上山', en: 'Up the hill', go: ['hill', 0, -0.6] },
  },
  {
    when: { zone: 'hill' },
    officers: { gascap: { at: ['hill', 0, 0.3], engaged: true } }, heal: 0.15,
    squads: [{ at: ['hill', -0.5, 0.2], n: 12, charge: true }, { at: ['hill', 0.5, 0.2], n: 12, charge: true }],
    obj: { zh: '擊破 煙霧隊長', en: 'Defeat the Gas Captain', go: 'gascap' },
    say: [{ who: 'gascap', zh: '放煙！全部放煙！', en: 'Gas! All of it!' }],
  },
  {
    when: { down: 'gascap' },
    win: true, waves: false, morale: 1,
    banner: { html: '<em>二號橋</em> 守住', en: 'Bridge No. 2 holds', dur: 260, big: true },
    say: [
      { who: 'gascap', zh: '收隊⋯⋯', en: 'Fall back...' },
      { who: 'siumei', zh: '天光喇。大家都喺度。', en: 'It\'s dawn. Everyone\'s still here.' },
    ],
  },
];

// ---- scroll: the ink map plus a mark for the university by the harbour north of Sha Tin, the bridge, an arrow
function mark(id, x, y, name, sq, sm = false, side = '') {
  return `<g class="pl-mark${side ? ' ' + side : ''}" data-id="${id}"><rect x="${x - sq / 2}" y="${y - sq / 2}" width="${sq}" height="${sq}" rx="3"/><text${sm ? ' class="sm"' : ''} x="${x + sq / 2 + 10}" y="${y + 10}">${name}</text></g>`;
}
const CUHK_MARKS = `${mark('cuhk', 930, 232, '中大', 20)}${mark('bridge2', 972, 262, '二號橋', 12, true)}
    <g class="pl-mark riot" data-id="gascap"><text class="sm" x="1010" y="300">煙霧隊長</text></g>`;
export const MAP = HK_MAP
  .replace('<g class="pl-arrows" filter="url(#pl-ink)">', '<g class="pl-arrows" filter="url(#pl-ink)">' + arrows([['hold', 'hk', 'M900 300 C930 290 955 275 972 262']]))
  .replace('<g class="pl-labels">', `<g class="pl-labels">\n    ${CUHK_MARKS}`);
export const PROLOGUE = [
  { cols: ['十一月十二日', '香港中文大學', '二號橋'], en: '12 November 2019. The Chinese University of Hong Kong, Bridge No. 2.', show: ['cuhk', 'bridge2'], focus: [940, 250, 1.6] },
  { cols: ['橋下面', '係吐露港公路', '同鐵路'], en: 'Under the bridge run the Tolo Highway and the railway.', show: ['bridge2'], focus: [970, 262, 1.8] },
  { cols: ['警方', '想奪去條橋', '催淚彈落滿校園'], en: 'Police moved to take the bridge. Tear gas fell across the campus.', show: ['bridge2', 'gascap'], focus: [960, 270, 1.4] },
  { cols: ['雪糕筒冚住', '再倒水', '一個一個撲熄'], en: 'A cone over each canister, then water. One by one.', show: ['hold'], focus: [930, 280, 1.3] },
  { cols: ['龍仔同小美', '同同學一齊', '守住條橋'], en: 'Dragon and Amy hold the bridge with the students.', show: ['lungjai', 'siumei', 'cuhk'], focus: [880, 400, 0.9] },
];
export const STAMP = { small: '第五章', big: '中大二號橋', seal: '守橋', en: 'CHAPTER V · BRIDGE NO. 2 · 12 NOVEMBER 2019' };
// Result-screen epilogue: the Phaser game has no CUHK chapter, so this text is new — plainly worded, dated, sourced
// (header). Closing line in italics, as the other chapters.
export const EPILOGUE = {
  zh: ['2019年11月11日起，警方與學生在香港中文大學二號橋一帶對峙，橋下是吐露港公路。11月12日，警方在校園內發射催淚彈，衝突一直持續到深夜。那一年，手足學會用雪糕筒罩住催淚彈，再倒水把它撲熄。',
    '<i>他們守住一條橋，也守住了彼此。</i>'],
  en: ['From 11 November 2019, police and students faced each other around Bridge No. 2 of the Chinese University of Hong Kong, above the Tolo Highway. On 12 November police fired tear gas on the campus, and the clashes went on into the night. That year, protesters learned to smother tear-gas canisters with traffic cones and pour in water to put them out.',
    '<i>They held one bridge, and they held on to each other.</i>'],
};
export const DEFEAT = { zh: '{name}倒下了⋯⋯橋上仲有同學。', en: '{name} goes down... students are still on the bridge.' };

// ---- script: canisters and haze, the 滅煙 rule, the barricade, the Gas Captain
const CONE_R = 1.6, WATER_R = 2.2, WATER_N = 45, BURN = 18 * 60, HAZE_R = 4.5, STING = 20, BAR_N = 25 * 60, BAR_R = 12;
const boss = bossScript('gascap', { calls: [[-10, 62], [10, 62]], on: {
  2: { banner: { html: '<em>催淚彈</em> 齊射', en: 'Tear-gas volleys', dur: 140 } },
  3: { say: [{ who: 'gascap', zh: '速龍小隊，上！', en: 'Raptor squads, go!' }] },
} });
export function script(game, api) {
  const b = boss(game, api), fx = b.fx;
  Object.assign(fx, { gas: [], putOut: 0, haze: 0, barricade: 0, hazeOn: [0, 0] });
  const R = MAPS.cuhk.BARRICADE;
  let volleys = false, volley = 0, barOn = false, lesson = null;
  const heroes = () => game.heroes || [game.hero];
  const land = (x, z, t) => { fx.gas.push({ x, z, t, age: t - api.t(), state: 'live', haze: 0, water: 0 }); if (fx.gas.length > 14) fx.gas.splice(fx.gas.findIndex((g) => g.state !== 'live' && g.state !== 'coned') >>> 0, 1); };
  return {
    fx,
    cue(name) {
      if (name === 'lesson' && !lesson) { const h = game.hero; land(Math.max(-12, Math.min(12, h.x + 1.5)), h.z + 8, api.t() + 20); lesson = fx.gas[fx.gas.length - 1]; }
      if (name === 'volleys') volleys = true;
      if (name === 'volleysOff') volleys = false;
      if (name === 'barricade') barOn = true;
    },
    step() {
      const t = api.t(), H = heroes();
      b.step();
      // the Gas Captain's fans land as live canisters
      for (const q of fx.cans) if (q.t === t) land(q.x, q.z, t);
      fx.cans = fx.cans.filter((q) => q.t > t);
      // bridge volleys: two canisters every 12 s, 6-14 m ahead of the furthest hero, on the bridge deck
      if (volleys && t % 720 === 90) {
        volley++;
        const lead = H.reduce((a, h) => (h.z > a.z ? h : a), H[0]);
        for (let k = 0; k < 2; k++) land(Math.max(-4, Math.min(4, (k ? 2.5 : -2.5) + ((volley * 3 + k) % 3) - 1)), Math.min(-32, lead.z + 6 + ((volley * 5 + k * 4) % 9)), t + 30);
      }
      // canisters: haze grows while live, holds while coned, clears once out or burnt out
      let haze = 0;
      for (const g of fx.gas) {
        g.age = t - g.t;
        if (g.age < 0) continue;
        if (g.state === 'live' || g.state === 'coned') {
          let near = Infinity;
          for (const h of H) if (!h.dead) near = Math.min(near, Math.hypot(h.x - g.x, h.z - g.z));
          if (g.state === 'live' && near < CONE_R) g.state = 'coned';
          if (g.state === 'coned' && near < WATER_R) g.water++;
          if (g.water >= WATER_N) { g.state = 'out'; fx.putOut++; if (g === lesson) api.flag('lessonOut', true); }
          else if (g.age > BURN) g.state = 'spent';
        }
        if (g.state === 'live') g.haze = Math.min(1, g.haze + 1 / 240);
        else if (g.state === 'out' || g.state === 'spent') g.haze = Math.max(0, g.haze - 1 / 90);
        haze += g.haze;
      }
      fx.haze = Math.min(1, haze / 4);
      // haze stings: a hero inside a live / coned cloud loses 1 HP every 20 steps (never below 1; i-frames and Musou spare him)
      H.forEach((h, j) => {
        const inside = !h.dead && h.iframes <= 0 && h.state !== 'musou' && fx.gas.some((g) => g.age >= 0 && (g.state === 'live' || g.state === 'coned') && Math.hypot(h.x - g.x, h.z - g.z) < HAZE_R * g.haze);
        fx.hazeOn[j] = inside ? fx.hazeOn[j] + 1 : 0;
        if (inside && fx.hazeOn[j] % STING === 0) h.hp = Math.max(1, h.hp - 1);
      });
      // the lesson canister: the arrow points at it until it is out
      if (lesson && !api.flag('lessonOut') && t % 30 === 0) api.objective(lesson.state === 'coned'
        ? { zh: `滅煙：企喺隔離倒水 ${Math.round(100 * lesson.water / WATER_N)}%`, en: `Stay beside it, pour the water ${Math.round(100 * lesson.water / WATER_N)}%`, go: [lesson.x, lesson.z] }
        : { zh: '滅煙：行埋去罩住個彈', en: 'Put it out: walk up to the canister', go: [lesson.x, lesson.z] });
      if (lesson && lesson.state === 'spent' && !api.flag('lessonOut')) { lesson.state = 'live'; lesson.t = t; lesson.age = 0; }   // the lesson waits for you
      // the barricade: a hero inside the rect restacks it
      if (barOn && !api.flag('barricadeUp')) {
        const bx = (R[0] + R[2]) / 2, bz = (R[1] + R[3]) / 2;           // the students stack it while a hero holds the ground round it
        if (H.some((h) => !h.dead && Math.hypot(h.x - bx, h.z - bz) < BAR_R)) fx.barricade = Math.min(1, fx.barricade + 1 / BAR_N);
        if (fx.barricade >= 1) api.flag('barricadeUp', true);
        else if (t % 30 === 0) api.objective({ zh: `重建路障 ${Math.round(fx.barricade * 100)}%`, en: `Restack the barricade ${Math.round(fx.barricade * 100)}%`, go: [(R[0] + R[2]) / 2, (R[1] + R[3]) / 2] });
      }
    },
  };
}
