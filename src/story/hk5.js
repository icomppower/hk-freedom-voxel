// 第四章「機場」 The Airport, 12 August 2019 — chapter data (format: ./ch1.js header; registry: ./chapters.js). Chapter id
// hk5 (ids hk1–hk4 keep their meaning); in the campaign it plays between 元朗 hk3 and 理工 hk4 (chapters.js LIST order).
// Story: the arrival-hall sit-in. Protesters sit in the hall and hand leaflets to arriving travellers; riot squads push in;
// 龍仔 and 小美 hold the sit-in, walk a group of travellers through the baggage hall and the security line, bring the
// stranded ones at the departure gates to the escalator while the boards flip to 取消 CANCELLED, and on the observation deck
// face 速龍指揮官 The Raptor Commander (an original archetype built on the 速龍 kit). The fights are the game's fiction; the
// dated facts (the sit-in, the cancelled flights) are in the prologue and the epilogue, with their sources below.
// Script (story hook): the travellers (eight walk from the baggage-hall entry through the centre lane and the security line,
// 1 s apart; they walk only while the hero is within 18 m of the group's middle; one with a riot officer on top of them and
// the hero > 8 m away for 3 s is lost; more than three lost → the chapter is lost: fx.travellers), the stranded travellers
// at the departure gates (four, join the hero's trail within 8 m, safe at the escalator foot: fx.stranded, flag 'strandedSafe'),
// the departure boards (fx.cancelled once the flights are cancelled; the boards also show the live objective), the planes
// beyond the glass (render-only), the commander's phases (bosses.js). Win: the commander down.
// Sources (epilogue, prologue): Airport Authority Hong Kong statement of 12 Aug 2019 as quoted by Al Jazeera, "Hong Kong
// airport cancels Monday flights amid sit-in protest" (12 Aug 2019) and Hong Kong Free Press, "Flights cancelled as
// thousands of protesters besiege Hong Kong airport" (12 Aug 2019): the sit-in began on Friday 9 August; on Monday 12
// August thousands filled the terminal; "other than the departure flights that have completed the check-in process and the
// arrival flights that are already heading to Hong Kong, all other flights have been cancelled for the rest of today".
// Content rule: no real person is depicted or named; 龍仔 / 小美 are composites; no airline, airport logo or livery.
import { HK_MAP } from './hkmap.js';
import { arrows } from './scrollkit.js';
import { SPK as HK_SPK, freeNames } from './hk1.js';
import { bossScript } from '../chars/officers/hk/bosses.js';
import { along, followers } from './hkfx.js';
import { ST } from '../crowd/crowd.js';
import { MAPS } from '../world/map.js';

export { freeNames };
export const SPK = {
  ...HK_SPK,
  traveller: { name: { zh: '旅客', en: 'Traveller' }, seal: '旅', side: 'shu' },
  commander: { name: { zh: '速龍指揮官', en: 'Raptor Commander' }, seal: '令', side: 'wei' },
};
export const OFF = {
  commander: { name: { zh: '速龍指揮官', en: 'RAPTOR COMMANDER' }, hp: 1560, boss: true, model: 'commander' },
  raptor: { name: { zh: '速龍', en: 'RAPTOR' }, hp: 560, model: 'raptor' },
  captain: { name: { zh: '防暴隊長', en: 'RIOT CAPTAIN' }, hp: 360 },
};
const NAG = { who: 'sauzuk', zh: '靜坐嘅人仲喺度，唔好走開！', en: 'The sit-in is still here. Don\'t leave them!' };
const NAG_PAX = { who: 'traveller', zh: '等等我哋！', en: 'Wait for us!' };
const NAG_GATE = { who: 'siumei', zh: '閘口仲有人未走，帶埋佢哋！', en: 'People are still stuck at the gates. Bring them!' };

export const BEATS = [
  // ---- 接機大堂: hold the sit-in
  {
    when: { wait: 30 },
    banner: { html: '8·12 <em>機場</em>', en: '12 August · The Airport', dur: 170 },
    obj: { zh: '守住靜坐（60 秒）', en: 'Shield the sit-in (60 s)', go: ['arrivals', 0, 0.2] },
    squads: [{ at: ['arrivals', -0.5, 0.5], n: 18 }, { at: ['arrivals', 0.5, 0.55], n: 18 }, { at: ['arrivals', 0, 0.85], n: 22 }],
    limit: { z: ['carousels', 0, -1], nag: NAG },
    morale: 0,
    say: [{ who: 'lungjai', zh: '旅客同手足都喺度，守住！', en: 'Travellers and our people, all here. Hold!' }],
  },
  {
    when: { wait: 6 * 60 },
    waves: true,
    say: [
      { who: 'traveller', zh: '你哋點解坐喺度？', en: 'Why are you all sitting here?' },
      { who: 'sauzuk', zh: '想全世界知道香港發生緊咩事。', en: 'So the world knows what\'s happening in Hong Kong.' },
    ],
  },
  {
    when: { wait: 54 * 60 },
    banner: { html: '<em>靜坐</em> 守住！', en: 'The sit-in holds', dur: 160 },
    heal: 0.3, morale: 0.12, waves: false, retire: true, hush: true,
    obj: { zh: '去行李帶', en: 'On to the baggage hall', go: ['carousels', 0, -0.6] },
    limit: { z: ['carousels', 0, -0.2], nag: NAG },
  },
  // ---- 行李帶: the travellers through security
  {
    when: { zone: 'carousels' },
    cue: 'travellers', gate: 'securityLine', waves: true,
    obj: { zh: '護送旅客過安檢', en: 'Walk the travellers through security', go: ['carousels', 0, -0.4] },
    limit: { z: ['departures', 0, -0.75], nag: NAG_PAX },
    squads: [{ at: ['carousels', -0.85, 0.2], n: 14, charge: true }, { at: ['carousels', 0.85, 0.2], n: 14, charge: true },
      { at: ['carousels', 0, 0.9], n: 16, charge: true }],
    officers: { captain: { at: ['carousels', 0, 0.8], engaged: true } },
    say: [{ who: 'siumei', zh: '跟住我，唔使驚。', en: 'Stay with me. Don\'t be scared.' }],
  },
  {
    when: { flag: 'travellersThrough' },
    banner: { html: '旅客 <em>過咗安檢</em>', en: 'The travellers are through security', dur: 170 },
    heal: 0.3, morale: 0.12, waves: false, retire: true, hush: true, limit: { z: null },
    obj: { zh: '入離境閘口', en: 'Into the departure gates', go: ['departures', 0, -0.6] },
  },
  // ---- 離境閘口: flights cancelled, the stranded travellers
  {
    when: { zone: 'departures' },
    cue: 'cancel', waves: true,
    banner: { html: '<em>航班</em>取消', en: 'Flights cancelled', dur: 180, big: true },
    obj: { zh: '帶滯留旅客去扶手電梯', en: 'Bring the stranded travellers to the escalator', go: ['departures', 0, -0.3] },
    limit: { z: ['departures', 0, 0.75], nag: NAG_GATE },
    officers: { raptor: { at: ['departures', 0, 0.5], engaged: true } },
    squads: [{ at: ['departures', -0.5, 0.3], n: 16, charge: true }, { at: ['departures', 0.5, 0.3], n: 16, charge: true }],
    say: [
      { who: 'reporter', zh: '機管局話：今日餘下航班全部取消。', en: 'The Airport Authority says the rest of today\'s flights are cancelled.' },
      { who: 'traveller', zh: '我哋走唔到⋯⋯', en: 'We can\'t get out...' },
    ],
  },
  {
    when: { flag: 'strandedSafe', down: 'raptor' },
    gate: 'deckEscalator',
    banner: { html: '<em>閘口</em> 守住！', en: 'The gates hold', dur: 170 },
    heal: 0.3, morale: 0.15, waves: false, retire: true, hush: true, limit: { z: null },
    obj: { zh: '上觀景台', en: 'Up to the observation deck', go: ['deck', 0, -0.6] },
  },
  // ---- 觀景台: the Raptor Commander
  {
    when: { zone: 'deck' },
    officers: { commander: { at: ['deck', 0, 0.35], engaged: true } }, heal: 0.15,
    squads: [{ at: ['deck', -0.5, 0.2], n: 12, charge: true }, { at: ['deck', 0.5, 0.2], n: 12, charge: true }],
    obj: { zh: '擊破 速龍指揮官', en: 'Defeat the Raptor Commander', go: 'commander' },
    say: [{ who: 'commander', zh: '清場！一個都唔准留低！', en: 'Clear the terminal! Nobody stays!' }],
  },
  {
    when: { down: 'commander' },
    win: true, waves: false, morale: 1,
    banner: { html: '<em>機場</em> 守住', en: 'The airport holds', dur: 260, big: true },
    say: [
      { who: 'commander', zh: '收隊⋯⋯收隊！', en: 'Fall back... fall back!' },
      { who: 'siumei', zh: '旅客平安，手足都平安。', en: 'The travellers are safe. Our people too.' },
    ],
  },
];

// ---- scroll: the ink map plus Lantau and the airport island off its west edge, a sit-in arrow; other chapters' scroll unchanged
const LANTAU = '<g filter="url(#pl-ink)"><path d="M0 600 C40 570 110 560 170 568 C220 574 250 600 236 640 C220 690 150 720 80 716 C40 712 10 690 0 680Z" fill="#c9ad7c" stroke="#3a2a1a" stroke-width="4" opacity=".92"/>'
  + '<rect x="110" y="560" width="90" height="34" rx="6" fill="#cdb183" stroke="#3a2a1a" stroke-width="3"/></g>\n  ';
const AIRPORT_MARKS = `${mark('airport', 143, 577, '機場', 20)}${mark('terminal', 176, 624, '客運大樓', 14, true)}
    <g class="pl-mark riot" data-id="commander"><text class="sm" x="236" y="690">速龍指揮官</text></g>`;
function mark(id, x, y, name, sq, sm = false) {
  return `<g class="pl-mark" data-id="${id}"><rect x="${x - sq / 2}" y="${y - sq / 2}" width="${sq}" height="${sq}" rx="3"/><text${sm ? ' class="sm"' : ''} x="${x + sq / 2 + 10}" y="${y + 10}">${name}</text></g>`;
}
export const MAP = HK_MAP
  .replace('<rect width="1600" height="900" filter="url(#pl-grain)"/>', LANTAU + '<rect width="1600" height="900" filter="url(#pl-grain)"/>')
  .replace('<g class="pl-arrows" filter="url(#pl-ink)">', '<g class="pl-arrows" filter="url(#pl-ink)">' + arrows([['sitin', 'hk', 'M600 560 C480 556 340 568 236 590']]))
  .replace('<g class="pl-labels">', `<g class="pl-labels">\n    ${AIRPORT_MARKS}`);
export const PROLOGUE = [
  { cols: ['八月十二日', '香港國際機場', '接機大堂'], en: '12 August 2019. Hong Kong International Airport, the arrival hall.', show: ['airport', 'terminal'], focus: [200, 600, 1.5] },
  { cols: ['八月九日起', '手足喺度靜坐', '向旅客派傳單'], en: 'Since 9 August, protesters had sat in the hall, handing leaflets to arriving travellers.', show: ['sitin', 'sauzuk'], focus: [360, 600, 1.1] },
  { cols: ['星期一', '數千人', '坐滿客運大樓'], en: 'On Monday, thousands filled the terminal.', show: ['terminal'], focus: [200, 610, 1.6] },
  { cols: ['機管局', '取消當日', '餘下航班'], en: 'The Airport Authority cancelled the rest of the day\'s flights.', show: ['airport'], focus: [180, 600, 1.4] },
  { cols: ['龍仔同小美', '守住大堂', '保護旅客'], en: 'Dragon and Amy hold the hall and shield the travellers.', show: ['lungjai', 'siumei', 'commander'], focus: [300, 640, 1.0] },
];
export const STAMP = { small: '第四章', big: '機場', seal: '靜坐', en: 'CHAPTER IV · THE AIRPORT · 12 AUGUST 2019' };
// Result-screen epilogue: the Phaser game has no airport chapter, so this text is new — plainly worded, dated, sourced
// (header). Closing line in italics, as the other chapters.
export const EPILOGUE = {
  zh: ['2019年8月9日起，示威者在香港國際機場接機大堂靜坐，向抵港旅客派發傳單。8月12日（星期一），數千人坐滿客運大樓。機場管理局宣布：除已辦理登機手續的離港航班及正飛往香港的抵港航班外，當日其餘航班全部取消。',
    '<i>他們坐在接機大堂，向剛到埗的人講述這座城市發生的事。</i>'],
  en: ['From 9 August 2019, protesters held a sit-in in the arrival hall of Hong Kong International Airport, handing leaflets to arriving travellers. On Monday 12 August, thousands filled the terminal. The Airport Authority announced that, other than departures that had completed check-in and arrivals already heading to Hong Kong, all flights for the rest of the day were cancelled.',
    '<i>They sat in the arrival hall and told the people landing what was happening to their city.</i>'],
};
export const DEFEAT = { zh: '{name}倒下了⋯⋯大堂裏仲有旅客未走得切。', en: '{name} goes down... travellers are still caught in the hall.' };

// ---- script: travellers, stranded travellers, the boards, the commander
const boss = bossScript('commander', { calls: [[-10, 62], [10, 62]], on: {
  2: { banner: { html: '<em>胡椒球</em>', en: 'Pepper balls', dur: 140 } },
  3: { say: [{ who: 'commander', zh: '速龍小隊，拘捕！！', en: 'Raptor squads, make arrests!!' }] },
} });
const PAX_PATH = [[0, -92], [0, -80], [0, -66], [0, -52], [0, -40], [0, -30], [0, -20]];
const CHECK_Z = -30, N = 8;
export function script(game, api) {
  const b = boss(game, api), fx = b.fx;
  Object.assign(fx, { travellers: [...Array(N)].map(() => ({ x: 0, z: -100, yaw: 0, on: false, moving: false })), stranded: [], cancelled: false, safe: 0, lost: 0, home: 0 });
  let paxT = -1, paxK = 0, str = null;
  const SAFE = MAPS.airport.SAFE;
  return {
    fx,
    cue(name) {
      if (name === 'travellers' && paxT < 0) paxT = api.t();
      if (name === 'cancel' && !str) {
        fx.cancelled = true;
        str = followers([[-19, -18], [-17, -21], [17, -21], [19, -18]], { join: 8, seek: 2 });
        fx.stranded = str.list;
      }
    },
    step() {
      const h = game.hero, t = api.t(), c = game.crowd;
      b.step();
      if (paxT >= 0 && !api.flag('travellersThrough')) {
        // the group walks (≈ 45 s through the hall, 1 s apart) only while the hero is within 18 m of its middle; a
        // traveller with a riot officer on top of them (≤ 1.6 m) and the hero > 8 m away for 3 s is lost
        const walking = fx.travellers.filter((p) => p.on && !p.checked);
        const mid = walking.length ? walking.map((p) => p.z).sort((a, b) => a - b)[walking.length >> 1] : h.z;
        const covered = Math.abs(h.z - mid) < 18 || !walking.length;
        if (covered) paxK++;
        fx.travellers.forEach((p, j) => {
          if (p.lost) { p.on = false; return; }
          const u = (paxK - 60 - j * 60) / 2700;
          if (u < 0) return;
          p.on = true; p.moving = u < 1 && covered && !p.checked;
          [p.x, p.z, p.yaw] = along(PAX_PATH, Math.min(1, u)); p.x += ((j % 3) - 1) * 1.1;
          if (p.checked) return;
          let near = false;
          if (Math.hypot(h.x - p.x, h.z - p.z) > 8) for (let i = 0; i < c.grunts && !near; i++) if (c.st[i] >= ST.ADVANCE && c.st[i] <= ST.ATTACK && Math.abs(c.x[i] - p.x) < 1.6 && Math.abs(c.z[i] - p.z) < 1.6) near = true;
          p.hurt = near ? (p.hurt || 0) + 1 : 0;
          if (p.hurt > 180) { p.lost = p.checked = true; fx.lost++; if (fx.lost > 3) api.lose(); return; }   // < 60 % left
          if (p.z >= CHECK_Z) { p.checked = true; fx.safe++; }
        });
        if (fx.safe + fx.lost === N) api.flag('travellersThrough', true);
        else if (t % 30 === 0 && walking.length) api.objective({ zh: '護送旅客過安檢', en: 'Walk the travellers through security', go: [0, mid] });
      }
      if (str) {
        str.step(h);
        for (const e of str.list) if (e.joined && !e.home && Math.hypot(e.x - SAFE[0], e.z - SAFE[1]) < 4) { e.home = true; e.on = false; fx.home++; }   // safe: off to the lifts
        const left = str.list.filter((e) => !e.home);
        if (!left.length) api.flag('strandedSafe', true);
        else if (t % 30 === 0) {                                        // the arrow: the nearest one still waiting, else the escalator
          const wait = left.filter((e) => !e.joined).sort((p, q) => Math.hypot(p.x - h.x, p.z - h.z) - Math.hypot(q.x - h.x, q.z - h.z))[0];
          api.objective(wait ? { zh: '帶滯留旅客去扶手電梯', en: 'Bring the stranded travellers to the escalator', go: [wait.x, wait.z] }
            : { zh: '帶佢哋去扶手電梯', en: 'Lead them to the escalator', go: SAFE });
        }
        if (api.flag('strandedSafe') && !api.flag('strandedSaid')) {
          api.flag('strandedSaid', true); api.say({ who: 'traveller', zh: '多謝你哋。', en: 'Thank you.' });
          if (!api.dead('raptor')) api.objective({ zh: '擊破 速龍', en: 'Defeat the Raptor', go: 'raptor' });
        }
      }
    },
  };
}
