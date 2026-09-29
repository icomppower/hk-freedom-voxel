// 第三章「元朗」 Yuen Long, 21 July 2019 — chapter data (format: ./ch1.js header; registry: ./chapters.js).
// Story (Story Bible, Scroll Cutscenes page): 22:45, passengers heading home; white shirts pour in with rattan canes; a
// reporter livestreams, passengers call 999 and nobody comes; 龍仔 and 小美 get the passengers through the fare gates; on
// the platform a train pulls in and they hold the doors for 45 s while the passengers board; then 強哥 The Fixer.
// Lines: Scroll Cutscenes page (hk3). Crowd: foe skin `white` (白衫友), ally skin `civil` (乘客).
// Script (story hook): the passengers (ten walk in from the street 3 s apart, through the fare gates, and wait at the stair
// foot; one is lost if the hero is > 20 m from the fare gates as it passes; more than four lost → the chapter is lost:
// fx.passengers), the lights (fx.flicker), the train (pulls in over 4 s, doors open 45 s while the safe passengers board,
// then it leaves: fx.train / fx.doors, flag 'trainGone'), 強哥's phases (bosses.js). Win: 強哥 down + ≥ 60 % boarded.
import { HK_MAP } from './hkmap.js';
import { SPK, freeNames } from './hk1.js';
import { bossScript } from '../chars/officers/hk/bosses.js';
import { along } from './hkfx.js';

export { SPK, freeNames };
export const OFF = {
  fixer: { name: { zh: '強哥', en: 'THE FIXER' }, hp: 1300, boss: true, model: 'fixer' },
  captain: { name: { zh: '白衫頭目', en: 'WHITE-SHIRT LEADER' }, hp: 420 },
};
const NAG = { who: 'passenger', zh: '唔好行咁快，我哋跟唔到！', en: 'Not so fast, we can\'t keep up!' };
const NAG_DOOR = { who: 'siumei', zh: '車門未關，守住月台！', en: 'The doors are still open — hold the platform!' };

export const BEATS = [
  // ---- 街口 / 大堂: the passengers, the white shirts
  {
    when: { wait: 30 },
    cue: 'passengers', gate: 'fareGates',
    banner: { html: '22:45 <em>元朗站</em>', en: '22:45 · Yuen Long Station', dur: 170 },
    obj: { zh: '護送乘客過閘', en: 'Get the passengers through the gates', go: ['faregates', 0, -0.2] },
    squads: [{ at: ['street', -0.4, 0.6], n: 18, charge: true }, { at: ['concourse', 0.3, -0.2], n: 18 }, { at: ['concourse', -0.4, 0.3], n: 16 }],
    limit: { z: ['faregates', 0, 0.2], nag: NAG },
    morale: 0,
    say: [{ who: 'passenger', zh: '救命呀！', en: 'Help!' }],
  },
  {
    when: { wait: 20 * 60 },
    waves: true,
    say: [
      { who: 'reporter', zh: '打咗九九九⋯⋯冇人嚟。', en: 'We called 999... no one\'s coming.' },
      { who: 'siumei', zh: '咪我哋囉。', en: 'Then it\'s us.' },
    ],
  },
  {
    when: { wait: 20 * 60 },
    cue: 'flicker',
    banner: { html: '<em>燈光</em>閃爍', en: 'The lights flicker', dur: 150 },
    officers: { captain: { at: ['concourse', 0, 0.4], engaged: true } },
    say: [{ who: 'lungjai', zh: '開手電！', en: 'Phone torches on!' }],
  },
  {
    when: { flag: 'paxThrough' },
    gate: 'platformStairs',
    banner: { html: '乘客 <em>過閘</em>', en: 'The passengers are through', dur: 170 },
    heal: 0.3, morale: 0.12, waves: false, retire: true, hush: true, limit: { z: null },
    obj: { zh: '上月台', en: 'Up to the platform', go: ['platform', 0, -0.6] },
  },
  // ---- 月台: the train, hold the doors
  {
    when: { zone: 'platform' },
    cue: 'train', waves: true,
    banner: { html: '<em>列車</em>埋站', en: 'The train pulls in', dur: 170 },
    obj: { zh: '守住車門 45 秒', en: 'Hold the train doors for 45 s', go: ['platform', 0, -0.3] },
    limit: { z: ['platform', 0, 0.2], nag: NAG_DOOR },
    squads: [{ at: ['platform', 0, 0.6], n: 16, charge: true }, { at: ['faregates', 0, -0.5], n: 16, charge: true }],
  },
  {
    when: { flag: 'trainGone' },
    heal: 0.25, hush: true, waves: false, retire: true, limit: { z: null },
    officers: { fixer: { at: ['platform', 0, 0.55], engaged: true } },
    obj: { zh: '擊破 強哥', en: 'Defeat The Fixer', go: 'fixer' },
    squads: [{ at: ['platform', 0, 0.8], n: 14, charge: true }],
    say: [{ who: 'fixer', zh: '呢度係元朗！', en: 'This is Yuen Long!' }],
  },
  {
    when: { down: 'fixer' },
    win: true, waves: false, morale: 1,
    banner: { html: '強哥 <em>倒下</em>', en: 'The Fixer is down', dur: 260, big: true },
    say: [
      { who: 'fixer', zh: '香港係我地㗎！', en: 'Hong Kong is ours!' },
      { who: 'siumei', zh: '香港係每一個人嘅。', en: 'Hong Kong belongs to everyone.' },
    ],
  },
];

export const MAP = HK_MAP;
export const PROLOGUE = [
  { cols: ['七月廿一晚', '元朗站', '乘客收工返屋企'], en: 'Night of 21 July. Yuen Long station. Passengers on their way home from work.', show: ['yuenlong', 'ylstation'], focus: [390, 200, 1.4] },
  { cols: ['白衫人', '揸住藤條', '衝入大堂'], en: 'Men in white shirts, rattan canes in hand, stormed the concourse.', show: ['raid', 'fixer'], focus: [400, 215, 1.6] },
  { cols: ['打九九九', '冇人嚟', '記者照直播'], en: 'Calls to 999. No one came. Reporters kept streaming.', show: [], focus: [400, 215, 1.3] },
  { cols: ['龍仔同小美', '趕到車站', '守住乘客'], en: 'Dragon and Amy reached the station to shield the passengers.', show: ['lungjai', 'siumei'], focus: [400, 215, 1.6] },
];
export const STAMP = { small: '第三章', big: '元朗', seal: '守望', en: 'CHAPTER III · YUEN LONG · 21 JULY 2019' };
// Result-screen epilogue: the Phaser game's STORY[2] (src/data/story.js), verbatim
export const EPILOGUE = {
  zh: ['2019年7月21日晚，一批白衣人在元朗港鐵站內無差別襲擊市民——乘客、記者、旁觀者無一倖免。警方回應遲緩。事後證實，襲擊者與本地黑社會有關聯。香港人在震驚中目睹一切。',
    '<i>那一夜，許多人失去了對保護的信念。但他們沒有失去站起來的意志。</i>'],
  en: ['On the night of 21 July 2019, men in white shirts attacked civilians indiscriminately inside Yuen Long MTR station — passengers, journalists, and bystanders. Police were slow to respond. The attackers were later linked to local triads. Hong Kong watched in horror.',
    '<i>That night, many lost their faith in protection. But they did not lose their will to stand.</i>'],
};
export const DEFEAT = { zh: '{name}倒下了⋯⋯月台上仲有乘客未走得切。', en: '{name} goes down... passengers are still trapped on the platform.' };

// ---- script: passengers, lights, the train, 強哥
const boss = bossScript('fixer', { on: {
  2: { banner: { html: '<em>辣椒粉</em>', en: 'Chilli powder', dur: 140 } },
  3: { say: [{ who: 'fixer', zh: '兄弟們，上呀！！', en: 'Brothers, get them!!' }] },
} });
const PAX_PATH = [[0, -128], [-2, -96], [0, -70], [0, -40], [0, -24], [0, -14]];
const GATE_Z = -26, HOLD = 45 * 60, N = 10;
export function script(game, api) {
  const b = boss(game, api), fx = b.fx;
  Object.assign(fx, { passengers: [...Array(N)].map(() => ({ x: 0, z: -140, yaw: 0, on: false, moving: false })), flicker: false, train: 0, doors: false, safe: 0, lost: 0, boarded: 0 });
  let paxT = -1, trainT = -1;
  return {
    fx,
    cue(name) {
      if (name === 'passengers' && paxT < 0) paxT = api.t();
      if (name === 'flicker') fx.flicker = true;
      if (name === 'train' && trainT < 0) trainT = api.t();
    },
    step() {
      const h = game.hero, t = api.t();
      b.step();
      if (paxT >= 0) {
        const k = t - paxT;
        fx.passengers.forEach((p, j) => {                             // passenger j leaves at 2 + 3 s·j, 30 s to the stair foot
          if (p.lost || p.boarded) { p.on = false; return; }
          const u = (k - 120 - j * 180) / 1800;
          if (u < 0) return;
          if (trainT < 0 || !p.safe) {
            p.on = true; p.moving = u < 1;
            [p.x, p.z, p.yaw] = along(PAX_PATH, Math.min(1, u)); p.x += ((j % 3) - 1) * 1.2;
            if (!p.checked && p.z >= GATE_Z) {
              p.checked = true;
              if (Math.hypot(h.x, h.z - GATE_Z) > 20) { p.lost = true; fx.lost++; } else { p.safe = true; fx.safe++; }
              if (fx.lost > N - 6) api.lose();                           // fewer than 60 % can still get through
            }
          }
        });
        if (fx.safe + fx.lost === N) api.flag('paxThrough', true);
      }
      if (trainT >= 0) {
        const k = t - trainT;
        fx.train = k < 240 ? k / 240 : k < 240 + HOLD ? 1 : Math.max(0, 1 - (k - 240 - HOLD) / 240);
        fx.doors = k >= 240 && k < 240 + HOLD;
        // boarding: one safe passenger every 3 s walks from the stair foot to a door and gets on
        let n = 0;
        for (const p of fx.passengers) {
          if (!p.safe || p.boarded) continue;
          const u = (k - 240 - n++ * 180) / 240;
          if (u < 0 || !fx.doors) { p.on = !p.boarded; continue; }
          p.on = true; p.moving = true;
          const dz = 8 + (n % 6) * 8;
          p.x = 0 + u * 9; p.z = -12 + (dz + 12) * Math.min(1, u * 1.2); p.yaw = Math.atan2(9, dz + 12);
          if (u >= 1) { p.boarded = true; p.on = false; fx.boarded++; }
        }
        if (k === 480 + HOLD) api.flag('trainGone', true);
        if (k === 480 + HOLD && fx.boarded < 6) api.lose();            // under 60 % aboard: the chapter is lost
      }
    },
  };
}
