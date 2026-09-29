// 第一章「金鐘」 Admiralty, June 2019 — chapter data (format: ./ch1.js header; registry: ./chapters.js).
// Story (Story Bible, Scroll Cutscenes page): rain and a sea of umbrellas on 夏慤道; 龍仔 at the front holds the umbrella
// line for 60 s through the first tear-gas volleys while 手足 fall back; under the footbridge he breaks 速龍's line; 小美
// arrives with the first-aid team and he covers the stretchers through the HQ gate; on the 添馬 lawn: 777 The Rubber
// Stamp. Lines: Scroll Cutscenes page (hk1), dialogue in written Cantonese + English. Speakers: SPK keys, or a playable id
// ('lungjai' / 'siumei': the story resolves that to the hero or the ally).
// Script (story hook): gas volleys (canisters arc in every 12 s ahead of the hero, drifting haze banks, riot squads pushing
// inside the haze: fx.gas), the stretcher groups (five leave the footbridge 8 s apart and cross the HQ gate; a group is
// lost if the hero is > 20 m from the gate as it passes: fx.stretchers), 777's phases (src/chars/officers/hk/bosses.js).
// Win: 777 down with ≥ 60 % of the stretchers (3 of 5) through the gate (else the chapter is lost when the last one passes).
// Content rule: no real person is depicted or named; the history text is the Phaser game's, verbatim.
import { HK_MAP } from './hkmap.js';
import { bossScript } from '../chars/officers/hk/bosses.js';

export const SPK = {
  lungjai: { name: { zh: '龍仔', en: 'Dragon' }, seal: '龍', side: 'shu' },
  siumei: { name: { zh: '小美', en: 'Amy' }, seal: '美', side: 'shu' },
  sauzuk: { name: { zh: '手足', en: 'Protester' }, seal: '手足', side: 'shu' },
  medic: { name: { zh: '義救', en: 'Volunteer Medic' }, seal: '救', side: 'shu' },
  reporter: { name: { zh: '記者', en: 'Reporter' }, seal: '記', side: 'shu' },
  passenger: { name: { zh: '乘客', en: 'Passenger' }, seal: '乘', side: 'shu' },
  raptor: { name: { zh: '速龍', en: 'Raptor' }, seal: '速', side: 'wei' },
  plain: { name: { zh: '便衣', en: 'Plainclothes' }, seal: '便', side: 'wei' },
  stamp: { name: { zh: '777', en: 'The Rubber Stamp' }, seal: '印', side: 'wei' },
  shocker: { name: { zh: '比卡超', en: 'The Shocker' }, seal: '電', side: 'wei' },
  fixer: { name: { zh: '強哥', en: 'The Fixer' }, seal: '強', side: 'wei' },
  bear: { name: { zh: '維尼熊', en: 'The Bear' }, seal: '熊', side: 'wei' },
};
export const freeNames = [{ zh: '防暴隊長', en: 'RIOT CAPTAIN' }, { zh: '速龍', en: 'RAPTOR' }, { zh: '便衣', en: 'PLAINCLOTHES' }, { zh: '指揮官', en: 'COMMANDER' }];
export const OFF = {
  raptor: { name: { zh: '速龍', en: 'RAPTOR' }, hp: 650, model: 'raptor' },
  stamp: { name: { zh: '777', en: 'THE RUBBER STAMP' }, hp: 1300, boss: true, model: 'stamp' },
  captain: { name: { zh: '防暴隊長', en: 'RIOT CAPTAIN' }, hp: 360 },
};

const NAG = { who: 'sauzuk', zh: '龍仔！後面仲有人未走，唔好一個衝咁前！', en: 'Dragon! People are still getting out behind us. Don\'t charge ahead alone!' };
const NAG_GATE = { who: 'siumei', zh: '擔架未過晒閘，你唔可以走！', en: 'The stretchers aren\'t all through the gate. You can\'t leave!' };

export const BEATS = [
  // ---- 夏慤道: the umbrella line
  {
    when: { wait: 30 },
    cue: 'gas',
    obj: { zh: '守住傘陣', en: 'Hold the umbrella line (60 s)', go: ['harcourt', 0, 0.1] },
    squads: [{ at: ['harcourt', -0.4, 0.5], n: 18 }, { at: ['harcourt', 0.4, 0.55], n: 18 }, { at: ['harcourt', 0, 0.85], n: 24 }],
    limit: { z: ['footbridge', 0, -1], nag: NAG },
    morale: 0,
    say: [{ who: 'lungjai', zh: '傘擎高！企埋一齊！', en: 'Umbrellas up! Stand together!' }],
  },
  {
    when: { wait: 6 * 60 },
    waves: true,
    banner: { html: '<em>催淚彈</em>', en: 'Tear gas', dur: 150 },
    say: [{ who: 'sauzuk', zh: '龍仔，前面有速龍！', en: 'Dragon, Raptors up front!' }],
  },
  {
    when: { wait: 54 * 60 },
    cue: 'gasOff', banner: { html: '<em>傘陣</em> 守住！', en: 'The umbrella line held', dur: 170 },
    heal: 0.3, morale: 0.12, waves: false, retire: true, hush: true,
    obj: { zh: '衝過天橋底', en: 'Push on under the footbridge', go: ['footbridge', 0, -0.4] },
    limit: { z: ['footbridge', 0, 0.05], nag: NAG },
  },
  // ---- 天橋底: 速龍's line
  {
    when: { zone: 'footbridge' },
    officers: { raptor: { at: ['footbridge', 0, -0.2], engaged: true } },
    squads: [{ at: ['footbridge', 0, -0.05], n: 16, cols: 8 }, { at: ['footbridge', 0, 0.3], n: 16, cols: 8, charge: true }],
    obj: { zh: '擊破 速龍', en: 'Defeat the Raptor', go: 'raptor' },
    say: [
      { who: 'raptor', zh: '退後！', en: 'Get back!' },
      { who: 'lungjai', zh: '退就冇得退喇。', en: 'There\'s nowhere left to go back to.' },
    ],
  },
  {
    when: { down: 'raptor' },
    gate: 'policeLine',
    banner: { html: '<em>防線</em>突破', en: 'The police line breaks', dur: 170, big: true },
    heal: 0.2, morale: 0.1, hush: true, retire: true, limit: { z: null },
    obj: { zh: '穿過天橋底', en: 'Get through under the footbridge', go: ['footbridge', 0, 0.9] },
  },
  // ---- 政府總部: 小美 and the stretchers
  {
    when: [{ zone: 'hqgate' }, { wait: 12 * 60 }],
    gate: 'hqGate', cue: 'stretchers', waves: true, retire: true,
    obj: { zh: '護送擔架過閘', en: 'Escort the stretchers through the gate', go: ['hqgate', 0, 0.2] },
    limit: { z: ['hqgate', 0, 0.9], nag: NAG_GATE },
    squads: [{ at: ['hqgate', -0.6, 0.8], n: 16, charge: true }, { at: ['hqgate', 0.6, 0.8], n: 16, charge: true }],
    officers: { captain: { at: ['hqgate', 0, 0.9], engaged: true } },
    say: [
      { who: 'siumei', zh: '傷者交俾我。你擋住佢哋。', en: 'I\'ll get the wounded out. You keep them off us.' },
      { who: 'medic', zh: '擔架過緊，睇住兩邊！', en: 'Stretchers coming through — watch both sides!' },
    ],
  },
  {
    when: { flag: 'stretchersDone' },
    waves: false, retire: true, hush: true, heal: 0.3, morale: 0.15, limit: { z: null },
    banner: { html: '<em>擔架</em> 全部過閘', en: 'The stretchers are through', dur: 180 },
    obj: { zh: '上添馬公園', en: 'Up to Tamar lawn', go: ['lawn', 0, -0.5] },
  },
  // ---- 添馬: 777
  {
    when: { zone: 'lawn' },
    officers: { stamp: { at: ['lawn', 0, 0.2], engaged: true } },
    squads: [{ at: ['lawn', -0.5, 0.1], n: 14, charge: true }, { at: ['lawn', 0.5, 0.1], n: 14, charge: true }],
    obj: { zh: '擊破 777', en: 'Defeat 777 The Rubber Stamp', go: 'stamp' },
    say: [{ who: 'stamp', zh: '我係好打得！', en: 'I can take a hit!' }],
  },
  {
    when: { down: 'stamp' },
    win: true, waves: false, morale: 1,
    banner: { html: '<em>印章</em>碎裂', en: 'The stamp shatters', dur: 260, big: true },
    say: [
      { who: 'stamp', zh: '我只係奉命行事！', en: 'I was only following orders!' },
      { who: 'siumei', zh: '傷者全部送走咗。', en: 'The wounded are all out.' },
    ],
  },
];

// ---- scroll (Scroll Cutscenes page, hk1: the 龍仔 prelude from the Phaser game)
export const MAP = HK_MAP;
export const PROLOGUE = [
  { cols: ['霓虹照住', '濕咗嘅街', '我唔係大人物'], en: 'Neon on wet streets. I am nobody special.', show: ['city'], focus: [720, 470, 1.2] },
  { cols: ['我同大家遊行', '相信人夠多', '佢哋會聽'], en: 'I marched like everyone else. I believed if enough of us showed up, they would listen.', show: ['march', 'harcourt'], focus: [820, 640, 1.2] },
  { cols: ['佢哋冇聽', '催淚彈', '滾過成條街'], en: 'They didn\'t listen. Tear gas rolled across the road.', show: ['gas'], focus: [770, 650, 1.4] },
  { cols: ['街坊 朋友', '細路', '一個個被帶走'], en: 'Our neighbours. Our friends. Our children. Taken one by one.', show: [], focus: [800, 600, 1.1] },
  { cols: ['有一刻', '你唔再請求', '自由'], en: 'There is a moment when you stop asking for permission to be free.', show: [], focus: [800, 560, 1.0] },
  { cols: ['黃頭盔 眼罩', '口罩', '我企出嚟'], en: 'Yellow hard hat. Goggles. Mask. I am nobody — but nobody stands up if I don\'t.', show: ['lungjai', 'admiralty'], focus: [820, 645, 1.5] },
];
export const STAMP = { small: '第一章', big: '金鐘', seal: '雨傘', en: 'CHAPTER I · ADMIRALTY · JUNE 2019' };
// Result-screen epilogue: the Phaser game's STORY[0] (src/data/story.js), verbatim; the closing lines in italics
export const EPILOGUE = {
  zh: ['2019年6月，數以百萬計的香港市民走上街頭，反對《逃犯條例》修訂草案。金鐘成為抗爭核心——夏慤道，一條六線行車道，被人民重新佔領。雨傘化為盾牌，催淚煙瀰漫空氣。',
    '<i>致那些站在這條路上的人——你們讓全世界看見了勇氣的模樣。</i>'],
  en: ['In June 2019, millions took to the streets of Hong Kong to oppose an extradition bill that would allow citizens to be tried in mainland China. Admiralty became the heart of the resistance — Harcourt Road, a six-lane highway, was reclaimed by the people. Umbrellas became shields. Tear gas filled the air.',
    '<i>To those who stood on that road — you showed the world what courage looks like.</i>'],
};
export const DEFEAT = { zh: '{name}倒下了⋯⋯金鐘嘅防線守唔住。', en: '{name} goes down... the line at Admiralty breaks.' };

// ---- script: gas volleys, the stretchers, 777's phases
const STR_PATH = [[0, -24], [-2, -10], [0, 0], [0, 12], [-3, 26], [-8, 42]];
const GATE_P = [0, 6];
const boss = bossScript('stamp', { on: { 3: { say: [{ who: 'stamp', zh: '依法辦事！！', en: 'By the book!!' }] } } });
export function script(game, api) {
  const b = boss(game, api);
  const fx = { ...b.fx, gas: [], stretchers: [0, 1, 2, 3, 4].map(() => ({ x: 0, z: 0, yaw: 0, on: false })), safe: 0, lost: 0 };
  b.fx.gas = fx.gas; b.fx.stretchers = fx.stretchers;                  // one fx object for the world view
  let gasOn = false, volley = 0, strT = -1;
  const along = (u) => {
    const n = STR_PATH.length - 1, f = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(f), k = f - i;
    const [ax, az] = STR_PATH[i], [bx, bz] = STR_PATH[i + 1];
    return [ax + (bx - ax) * k, az + (bz - az) * k, Math.atan2(bx - ax, bz - az)];
  };
  return {
    fx: b.fx,
    cue(name) {
      if (name === 'gas') gasOn = true;
      if (name === 'gasOff') gasOn = false;
      if (name === 'stretchers' && strT < 0) strT = api.t();
    },
    step() {
      const h = game.hero, t = api.t();
      b.step();
      Object.assign(b.fx, { safe: fx.safe, lost: fx.lost });
      // gas volleys: three canisters every 12 s, 12-22 m ahead of the hero; a riot squad pushes in inside every other volley
      for (const g of fx.gas) g.age = t - g.t;
      if (gasOn && t % 720 === 60) {
        volley++;
        for (let k = 0; k < 3; k++) {
          const x = Math.max(-16, Math.min(16, h.x + (k - 1) * 8 + ((volley * 7 + k * 3) % 5) - 2)), z = h.z + 12 + ((volley * 5 + k * 4) % 10);
          fx.gas.push({ x, z, t: t + 40, age: -40, dx: (k - 1) * 2 });
          if (fx.gas.length > 12) fx.gas.shift();
        }
        if (volley % 2 === 0) api.squad({ at: [h.x, Math.min(h.z + 22, -80)], n: 10 });
      }
      // stretchers: group j leaves at 3 + 8 s·j, 14 s from the footbridge to the lawn, passes the gate at u ≈ 0.4
      if (strT < 0) return;
      const k = t - strT;
      fx.stretchers.forEach((s, j) => {
        const u = (k - 180 - j * 480) / 840;
        s.on = u >= 0 && u <= 1 && !s.lost;
        if (u < 0 || s.done) return;
        [s.x, s.z, s.yaw] = along(Math.min(1, u));
        if (!s.checked && s.z >= GATE_P[1]) {
          s.checked = true;
          if (Math.hypot(h.x - GATE_P[0], h.z - GATE_P[1]) > 20) { s.lost = true; fx.lost++; } else fx.safe++;
          if (fx.safe + fx.lost === 5 && fx.safe < 3) api.lose();      // under 60 % through: the first-aid run fails
        }
        if (u >= 1) s.done = true;
      });
      if (k === 180 + 4 * 480 + 840) api.flag('stretchersDone', true);
    },
  };
}
