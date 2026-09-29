// 第二章「立法會」 LegCo, 1 July 2019 — chapter data (format: ./ch1.js header; registry: ./chapters.js).
// Story (Story Bible, Scroll Cutscenes page): searchlights sweep the plaza and squads drop where they land; 手足's trolley
// breaks the glass curtain wall (the wall's HP falls while the hero covers it); the lobby is held while 便衣 fire from the
// mezzanine; in the chamber, 比卡超 The Shocker; then the clearance warning — four 手足 refuse to leave, and 小美: 「一齊嚟，
// 一齊走。」 They are carried out to the plaza before the clearance timer ends. Lines: Scroll Cutscenes page (hk2).
// Script (story hook): searchlights (three beams sweep the plaza; every 8 s one lands and a riot squad drops there:
// fx.beams), the glass wall (HP 100: −1 every 12 f while the hero is within 9 m of it; cracks at 66 / 33, shatters at 0:
// fx.glass 0-3, gate 'glassWall' opens), the Shocker's phases (bosses.js), the clearance (four 手足 on the dais come to the
// hero and join his trail within 8 m; all four past the glass wall line before 200 s run out, else the chapter is lost:
// fx.escorts, fx.clearT). Win: 比卡超 down + all four out to the plaza.
import { HK_MAP } from './hkmap.js';
import { SPK, freeNames } from './hk1.js';
import { bossScript } from '../chars/officers/hk/bosses.js';
import { followers } from './hkfx.js';

export { SPK, freeNames };
export const OFF = {
  plain: { name: { zh: '便衣', en: 'PLAINCLOTHES' }, hp: 520, model: 'plain' },
  shocker: { name: { zh: '比卡超', en: 'THE SHOCKER' }, hp: 1560, boss: true, model: 'shocker' },
  raptor: { name: { zh: '速龍', en: 'RAPTOR' }, hp: 520, model: 'raptor' },
  captain: { name: { zh: '防暴隊長', en: 'RIOT CAPTAIN' }, hp: 360 },
};
const NAG = { who: 'sauzuk', zh: '幕牆未破，唔好一個人衝！', en: 'The wall\'s not down yet. Don\'t go in alone!' };
const NAG_LOBBY = { who: 'siumei', zh: '大堂未守穩，唔好入住！', en: 'The lobby isn\'t held yet. Not in there!' };

export const BEATS = [
  // ---- 示威區: searchlights, the trolley at the glass
  {
    when: { wait: 30 },
    cue: 'lights',
    banner: { html: '<em>探照燈</em>', en: 'Searchlights', dur: 150 },
    obj: { zh: '衝破玻璃幕牆', en: 'Break the glass wall', go: ['glass', 0, -0.6] },
    squads: [{ at: ['plaza', -0.4, 0.4], n: 18 }, { at: ['plaza', 0.4, 0.5], n: 18 }, { at: ['plaza', 0, 0.9], n: 20 }],
    limit: { z: ['glass', 0, -0.3], nag: NAG },
    morale: 0,
    say: [{ who: 'sauzuk', zh: '手推車推埋去！掩住我哋！', en: 'Push the trolley up! Cover us!' }],
  },
  { when: [{ kos: 40 }, { wait: 30 * 60 }], waves: true },
  {
    when: { flag: 'glassDown' },
    gate: 'glassWall', cue: 'lightsOff',
    banner: { html: '<em>玻璃幕牆</em>破裂', en: 'The glass wall breaks', dur: 180, big: true },
    heal: 0.3, morale: 0.12, waves: false, retire: true, hush: true, limit: { z: null },
    obj: { zh: '入大堂', en: 'Into the lobby', go: ['lobby', 0, -0.5] },
    say: [{ who: 'lungjai', zh: '入去——但一個都唔可以留低。', en: 'In — but nobody gets left behind.' }],
  },
  // ---- 大堂: 便衣 on the mezzanine
  {
    when: { zone: 'lobby' },
    officers: { plain: { at: ['lobby', -0.8, 0.2], engaged: true } },
    squads: [{ at: ['lobby', 0, 0.5], n: 18, charge: true }, { at: ['lobby', 0.6, -0.2], n: 14, charge: true }],
    waves: true,
    obj: { zh: '守住大堂', en: 'Hold the lobby', go: ['lobby', 0, 0.3] },
    limit: { z: ['lobby', 0, 0.9], nag: NAG_LOBBY },
    say: [{ who: 'sauzuk', zh: '上面有便衣！', en: 'Plainclothes on the mezzanine!' }],
  },
  {
    when: [{ down: 'plain', kos: 60 }, { down: 'plain', wait: 30 * 60 }],
    gate: 'chamberDoor',
    banner: { html: '<em>大堂</em> 守住！', en: 'The lobby holds', dur: 170 },
    heal: 0.25, morale: 0.1, waves: false, retire: true, hush: true, limit: { z: null },
    obj: { zh: '入議事廳', en: 'Into the chamber', go: ['chamber', 0, -0.6] },
  },
  // ---- 議事廳: 比卡超
  {
    when: { zone: 'chamber' },
    officers: { shocker: { at: ['chamber', 0, 0.35], engaged: true } }, heal: 0.2,
    squads: [{ at: ['chamber', -0.5, 0.2], n: 14, charge: true }, { at: ['chamber', 0.5, 0.2], n: 14, charge: true }],
    obj: { zh: '擊破 比卡超', en: 'Defeat The Shocker', go: 'shocker' },
    say: [{ who: 'shocker', zh: '全部拉晒佢！', en: 'Arrest every last one of them!' }],
  },
  {
    when: { down: 'shocker' },
    banner: { html: '比卡超 <em>倒下</em>', en: 'The Shocker is down', dur: 170, big: true },
    heal: 0.3, hush: true,
    say: [{ who: 'shocker', zh: '唔係我話事！', en: 'It\'s not my call!' }],
  },
  // ---- 清場: bring the four out
  {
    when: { wait: 4 * 60 },
    cue: 'clearance', waves: true,
    banner: { html: '<em>清場</em>倒數', en: 'Clearance countdown', dur: 180 },
    obj: { zh: '帶四位手足出廣場', en: 'Bring the four out to the plaza', go: ['chamber', 0, 0.62] },
    say: [
      { who: 'sauzuk', zh: '有四個唔肯走！', en: 'Four of them won\'t leave!' },
      { who: 'siumei', zh: '一齊嚟，一齊走。扒佢哋出去！', en: 'We came together, we leave together. Carry them out!' },
    ],
  },
  { when: { flag: 'allJoined' }, obj: { zh: '帶佢哋出廣場', en: 'Lead them out to the plaza', go: ['plaza', 0, 0.2] } },
  {
    when: { flag: 'allOut' },
    win: true, waves: false, morale: 1,
    banner: { html: '<em>齊人</em>', en: 'Everyone\'s out', dur: 260, big: true },
    say: [{ who: 'lungjai', zh: '齊人。', en: 'Everyone\'s here.' }],
  },
];

export const MAP = HK_MAP;
export const PROLOGUE = [
  { cols: ['七月一日', '回歸', '二十二週年'], en: '1 July 2019: the 22nd anniversary of the handover.', show: ['admiralty'], focus: [830, 630, 1.2] },
  { cols: ['街上一片黑', '遊行人潮', '行到金鐘'], en: 'Black-clad crowds marched to Admiralty.', show: ['march', 'sauzuk'], focus: [860, 640, 1.2] },
  { cols: ['立法會外', '一幅玻璃牆', '擋住所有聲音'], en: 'Outside the Legislative Council, a wall of glass that kept every voice out.', show: ['legco'], focus: [865, 620, 1.5] },
  { cols: ['比卡超守大堂', '一齊嚟', '就一齊走'], en: 'The Shocker holds the lobby. We came in together; we leave together.', show: ['storm', 'shocker', 'siumei'], focus: [865, 620, 1.6] },
];
export const STAMP = { small: '第二章', big: '立法會', seal: '一齊走', en: 'CHAPTER II · LEGCO · 1 JULY 2019' };
// Result-screen epilogue: the Phaser game's STORY[1] (src/data/story.js), verbatim
export const EPILOGUE = {
  zh: ['2019年7月1日，香港回歸22週年，示威者衝入立法會大樓。牆上噴上抗議標語，以及這句話：「是你們教我們和平遊行是沒用的。」他們在黎明前自行離去。',
    '<i>他們不是來破壞的。他們來，是因為已無話可說。</i>'],
  en: ['On 1 July 2019, the 22nd anniversary of the handover, protesters broke into the Legislative Council building. Inside, they spray-painted the walls with protest slogans and the words: "It was you who taught us peaceful marches are useless." They left voluntarily before dawn.',
    '<i>They did not come to destroy. They came because they had no other words left.</i>'],
};
export const DEFEAT = { zh: '{name}倒下了⋯⋯清場開始，仲有人未走得切。', en: '{name} goes down... the clearance begins with people still inside.' };

// ---- script: searchlights, the glass wall, the Shocker, the clearance escort
const boss = bossScript('shocker', { calls: [[-12, 30], [12, 30]], on: {
  2: { banner: { html: '<em>電擊</em>波', en: 'Shock waves', dur: 140 } },
  3: { say: [{ who: 'shocker', zh: '速龍小隊，出動！！', en: 'Raptor squads, go!!' }] },
} });
const WALL_Z = -78, CLEAR = 200 * 60;
export function script(game, api) {
  const b = boss(game, api), fx = b.fx;
  Object.assign(fx, { beams: [0, 1, 2].map(() => ({ x: 0, z: -120, on: false })), glass: 0, escorts: [], clearT: 0 });
  let lights = false, land = 0, wallHp = 100, clearT = -1, esc = null;
  return {
    fx,
    cue(name) {
      if (name === 'lights') lights = true;
      if (name === 'lightsOff') { lights = false; fx.beams.forEach((q) => { q.on = false; }); }
      if (name === 'clearance' && clearT < 0) {
        clearT = api.t();
        esc = followers([[-5, 48], [-2, 50], [2, 50], [5, 48]], { join: 8, seek: 2 });
        fx.escorts = esc.list;
      }
    },
    step() {
      const h = game.hero, t = api.t();
      b.step();
      if (lights) {                                                   // three beams sweep; every 8 s one lands a squad
        fx.beams.forEach((q, j) => { const a = t * 0.01 * (j % 2 ? -1 : 1) + j * 2.1; q.x = Math.sin(a) * 22; q.z = -118 + Math.cos(a * 1.3) * 28; q.on = true; });
        if (t % 480 === 240) { const q = fx.beams[land++ % 3]; api.squad({ at: [q.x, q.z], n: 8 }); }
      }
      if (wallHp > 0 && lights) {                                     // the trolley works while the hero covers it
        if (Math.abs(h.z - WALL_Z) < 9 && t % 12 === 0) wallHp--;
        fx.glass = wallHp <= 0 ? 3 : wallHp < 33 ? 2 : wallHp < 66 ? 1 : 0;
        if (wallHp <= 0) api.flag('glassDown', true);
      }
      if (esc) {
        esc.step(h);
        fx.clearT = Math.max(0, CLEAR - (t - clearT));
        if (esc.list.every((e) => e.joined)) api.flag('allJoined', true);
        for (const e of esc.list) if (e.joined && e.z < WALL_Z - 4) e.home = true;
        if (esc.list.every((e) => e.home)) api.flag('allOut', true);
        else if (t - clearT >= CLEAR) api.lose();                      // the clearance runs out with someone still inside
      }
    },
  };
}
