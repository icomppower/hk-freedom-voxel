// 第三章「霧港」 The Fog Harbor — chapter data (format: ./ch1.js header; registry: ./chapters.js). The final chapter: after
// its win the result screen leads into the ENDING scroll (尾聲 霧散嗰朝) and the TRIBUTE card (story/prologue.js).
// Story (Storyline page): the twelve cross the beach to the pier by the one stone causeway, where 鐵吻 stands; 小咩 drops
// the iron boom chain from its winch so the boat can reach open water; the Warden-Wolf's fleet arrives with its
// searchlights — wherever the light lands, wolves land; on the lighthouse rock 阿角 holds the Warden-Wolf alone while 小咩
// puts the lighthouse out, the fleet collides in the dark, the glaive breaks, the fleet retreats. Happy ending: nobody is
// lost; the Warden-Wolf is beaten, not killed (he kneels and blows the retreat). Lines: Scroll Cutscenes page (Ch. III).
// Script (story hook): the boom (20 s in all at the winch: fx.boomDown, gate 'lighthouse' opens), the fleet (fx.fleet:
// searchlights sweep the quay and the jetty, a squad lands where one rests every 10 s), then 狼督's fight
// (src/chars/officers/warden/boss.js: phases at 50 % / 20 %, the lighthouse dark in phase 2, his searchlights).
import { SHEEP_MAP } from './sheepmap.js';
import { SPK as SPK1 } from './sheep1.js';
import { wardenBoss } from '../chars/officers/warden/boss.js';

export const SPK = SPK1;
export const freeNames = [{ zh: '港口狼', en: 'HARBOR GUARD' }, { zh: '艦隊狼', en: 'FLEET MARINE' }, { zh: '鐵吻', en: 'IRON MUZZLE' }, { zh: '巡夜狼', en: 'NIGHT PATROL' }];
export const OFF = {
  iron: { name: { zh: '鐵吻', en: 'IRON MUZZLE' }, hp: 900, model: 'iron' },
  warden: { name: { zh: '狼督', en: 'THE WARDEN-WOLF' }, hp: 2340, boss: true, model: 'warden' },
};
const NAG = { who: 'siume', zh: '角叔，等埋羊仔！', en: 'Uncle Gok, wait for the little ones!' };

export const BEATS = [
  {
    when: { wait: 30 },
    obj: { zh: '穿過沙灘漁網架', en: 'Push through the net racks on the beach', go: ['beach', 0, 0.6] },
    squads: [{ at: ['beach', -0.4, 0.2], n: 18 }, { at: ['beach', 0.4, 0.35], n: 18 }, { at: ['beach', 0, 0.75], n: 20 }],
    limit: { z: ['causeway', 0, -0.9], nag: NAG }, morale: 0, waves: true,
    say: [
      { who: 'siume', zh: '由沙灘去碼頭，只得一條石堤。', en: 'From the beach to the pier, there\'s only one causeway.' },
      { who: 'gok', zh: '一條路，就夠。', en: 'One road is enough.' },
    ],
  },
  { when: [{ kos: 70, wait: 25 * 60 }, { wait: 60 * 60 }], waves: false, retire: true,
    obj: { zh: '上石堤', en: 'Take the stone causeway', go: ['causeway', 0, -0.7] }, limit: { z: ['causeway', 0, 0.2], nag: NAG } },
  {
    when: { zone: 'causeway' },
    officers: { iron: { at: ['causeway', 0.03, 0.05], engaged: true } },
    squads: [{ at: ['causeway', 0.03, -0.25], n: 12, cols: 3 }, { at: ['causeway', 0.03, 0.4], n: 12, cols: 3 }],
    obj: { zh: '擊破 鐵吻', en: 'Defeat Iron Muzzle', go: 'iron' },
    say: [
      { who: 'iron', zh: '石堤只係夠一隻羊行。', en: 'This causeway fits one sheep at a time.' },
      { who: 'gok', zh: '夠咗。我一隻就夠。', en: 'That\'s enough. One is all it takes.' },
    ],
  },
  {
    when: { down: 'iron' },
    gate: 'boom', heal: 0.3, morale: 0.12, retire: true, hush: true, waves: true, limit: { z: ['boom', 0, 0.55], nag: NAG },
    banner: { html: '鐵吻 <em>敗走</em>', en: 'Iron Muzzle gives way', dur: 170, big: true },
    obj: { zh: '到碼頭放低鐵鎖', en: 'Reach the quay and drop the boom chain', go: [13, 22] },
    cue: 'boom',
    squads: [{ at: ['boom', -0.3, 0.1], n: 16 }, { at: ['boom', 0.35, 0.4], n: 16, charge: true }],
    say: [{ who: 'iron', zh: '⋯⋯老嘢，好硬。', en: '...Tough old ram.' }],
  },
  {
    when: { flag: 'boomDown' },
    gate: 'lighthouse', cue: 'fleet', waves: true,
    banner: { html: '<em>鐵鎖</em>落海', en: 'The boom chain drops into the sea', dur: 160 },
    say: [{ who: 'lamb', zh: '海路通咗！', en: 'The way to sea is open!' }],
    obj: { zh: '上燈塔石', en: 'Climb the lighthouse rock', go: ['rock', 0, -0.6] }, limit: { z: null },
  },
  {
    when: [{ wait: 6 * 60 }],
    banner: { html: '狼督<em>艦隊</em>', en: 'The Warden-Wolf\'s fleet arrives — wherever the light lands, wolves land', dur: 190, big: true },
    say: [
      { who: 'siume', zh: '燈塔幫佢哋指路！', en: 'The lighthouse is guiding them in!' },
      { who: 'gok', zh: '咁就熄咗佢。上燈塔石！', en: 'Then we put it out. Up the lighthouse rock!' },
    ],
  },
  {
    when: { zone: 'rock' },
    skip: { down: 'warden' }, waves: true, retire: true, hush: true,
    officers: { warden: { at: ['rock', 0, 0.2] } },
    squads: [{ at: ['rock', -0.6, -0.3], n: 14, charge: true }, { at: ['rock', 0.6, -0.2], n: 14, charge: true }],
    banner: { html: '敵總大將 <em>狼督</em>', en: 'Enemy commander: the Warden-Wolf', dur: 150, big: true },
    obj: { zh: '擊破 狼督', en: 'Defeat the Warden-Wolf', go: 'warden' },
    say: [
      { who: 'warden', zh: '你哋行得出海，行唔出霧。', en: 'You can reach the sea. You\'ll never get out of the fog.' },
      { who: 'gok', zh: '霧，總有散嘅時候。', en: 'Fog always lifts.' },
    ],
  },
  {
    when: { below: ['warden', 0.5] }, skip: { down: 'warden' }, morale: -0.1,
    banner: { html: '<em>燈塔</em>熄滅', en: 'The lighthouse goes dark — the fleet is blind', dur: 170, big: true },
    say: [{ who: 'warden', zh: '點燈！點返燈！', en: 'Light it! Get that light back on!' },
      { who: 'siume', zh: '角叔，燈熄咗！佢哋撞埋一齊喇！', en: 'Uncle Gok, the light\'s out! They\'re crashing into each other!' }],
  },
  {
    when: { below: ['warden', 0.2] }, skip: { down: 'warden' },
    banner: { html: '狼督 <em>暴怒</em>', en: 'The Warden-Wolf rages — his glaive is cracking', dur: 160 },
  },
  {
    when: { down: 'warden' },
    win: true, waves: false, morale: 1,
    banner: { html: '狼督 <em>刀斷</em>', en: 'The Warden-Wolf\'s glaive breaks in two', dur: 260, big: true },
    say: [{ who: 'gok', zh: '走啦。帶埋你啲船走。', en: 'Go. And take your ships with you.' }],
  },
];

export const MAP = SHEEP_MAP;
export const PROLOGUE = [
  { cols: ['十二隻羊', '一隻不少', '天未光到沙灘'], en: 'All twelve, not one missing, reached the beach before dawn.', show: ['beach', 'twelve'], focus: [1040, 300, 1.35] },
  { cols: ['去碼頭', '得一條石堤', '鐵吻守住'], en: 'One stone causeway leads to the pier, and Iron Muzzle guards it.', show: ['causeway', 'iron', 'sheep3'], focus: [1100, 270, 1.45] },
  { cols: ['港口橫住鐵鎖', '燈塔照住海面', '艦隊喺霧後'], en: 'An iron chain across the harbor, the lighthouse sweeping the water, and the Warden-Wolf\'s fleet behind the fog.',
    show: ['boom', 'lighthouse', 'fleet', 'warden'], focus: [1220, 210, 1.25] },
  { cols: ['熄咗燈塔', '條船就可以', '消失喺霧入面'], en: 'Put out the lighthouse, and the boat can vanish into the fog.', show: ['pier', 'fogsea'], focus: [1150, 200, 1.1] },
];
export const STAMP = { small: '第三章', big: '霧港', seal: '霧', en: 'CHAPTER III · THE FOG HARBOR' };
export const EPILOGUE = {
  zh: ['狼督吹起撤退號角，艦隊轉頭入霧。', '天，就快光。'],
  en: ['The Warden-Wolf blew the retreat and the fleet turned into the fog.', 'Dawn was close.'],
};
export const DEFEAT = { zh: '{name}倒喺霧港，燈塔仍然照住海面⋯⋯', en: '{name} falls in the fog harbor, and the lighthouse still sweeps the water...' };

// ---- ENDING scroll (after the Ch. III result) + the tribute card
export const ENDING = [
  { cols: ['燈塔一黑', '艦隊撞埋一齊', '狼督把刀斷咗'], en: 'The lighthouse went dark, the fleet crashed into itself, and the Warden-Wolf\'s glaive broke in two.',
    show: ['lighthouse', 'fleetback'], focus: [1250, 190, 1.3] },
  { cols: ['狼群連夜', '收拾走人', '艦隊退入霧'], en: 'The wolves packed up overnight, and the fleet withdrew into the fog.', show: ['wolfout'], focus: [1000, 350, 1.05] },
  { cols: ['天光 霧散', '條船轉頭', '返去羊村'], en: 'At dawn the fog lifted. The boat turned around and headed back to Sheep Village.', show: ['homeroute'], focus: [1100, 220, 1.1] },
  { cols: ['全村企喺碼頭', '手揸燈籠', '等佢哋返屋企'], en: 'The whole village waited on the pier, lanterns in hand, to bring them home.', show: ['pier', 'island'], focus: [980, 280, 1.35] },
  { cols: ['小咩跳上岸', '角叔', '我哋返到屋企喇'], en: 'Siu Me jumped ashore first. "Uncle Gok, we\'re home!"', show: ['siume', 'gok'], focus: [980, 280, 1.5] },
  { cols: ['每年霧散嗰朝', '碼頭十二盞燈', '迎勇士返屋企'], en: 'Every year on the morning the fog lifts, twelve lanterns are lit on the pier to welcome the twelve warriors home.',
    show: ['lanterns'], focus: [800, 450, 1.0] },
];
export const ENDING_STAMP = { small: '尾聲', big: '霧散嗰朝', seal: '返屋企', en: 'EPILOGUE · THE MORNING THE FOG LIFTS' };
// original wording (Story Bible: no text from the books, no names of the twelve or the five)
export const TRIBUTE = {
  title: { zh: '致敬', en: 'TRIBUTE' },
  zh: ['二〇二〇年，十二個香港年輕人嘗試坐船離開，喺海上被截停。',
    '《羊村》系列繪本（2020–21 年，香港言語治療師總工會出版）將佢哋嘅故事講俾細路聽。',
    '二〇二二年，出版繪本嘅五位工會成員，各被判監十九個月。',
    '呢個遊戲嘅角色同畫面全部原創，只係向呢啲故事致敬。'],
  en: ['In 2020, twelve young Hongkongers tried to leave by boat and were intercepted at sea.',
    'The Sheep Village picture books (2020–21, General Union of Hong Kong Speech Therapists) retold their story for children.',
    'In 2022, five members of the union were each sentenced to 19 months in prison for publishing them.',
    'Every character and image in this game is original; it is made as a tribute to those stories.'],
  link: { href: 'https://minjian-danganguan.org/archive/3429', zh: '民間歷史檔案庫 #3429', en: 'China Unofficial Archives #3429' },
};

// ---- script: the boom, the fleet's searchlights, the Warden-Wolf's fight
export function script(game, api) {
  const boss = wardenBoss(game, api, { arena: [6, 86], r: 16, calls: [[-0.8, -0.5], [0.8, -0.4]], beamR: 0.7 });
  const fx = { boomDown: false, boomT: 0, fleet: false, dark: false, beams: [0, 1, 2].map(() => ({ x: 0, z: 0, on: false })) };
  let boomOn = false, fleetT = -1, land = 0;
  const W = [15, 22];
  return {
    fx,
    cue(name) { if (name === 'boom') boomOn = true; if (name === 'fleet' && fleetT < 0) { fleetT = api.t(); fx.fleet = true; } },
    step() {
      const h = game.hero, t = api.t();
      if (boomOn && !fx.boomDown) {                                  // 20 s in all within 5 m of the winch
        if (Math.hypot(h.x - W[0], h.z - W[1]) < 5) fx.boomT++;
        if (fx.boomT >= 1200) { fx.boomDown = true; api.flag('boomDown', true); }
      }
      boss.step();
      if (boss.fx.phase > 0) { fx.dark = boss.fx.dark; fx.beams = boss.fx.beams; return; }
      if (fleetT >= 0) {                                             // before the boss: the searchlights sweep the quay and the jetty
        fx.beams.forEach((b, k) => { const u = 0.5 + 0.5 * Math.sin(t * 0.01 + k * 2.1); b.on = true; b.x = -12 + 24 * (0.5 + 0.5 * Math.sin(t * 0.013 * (k + 1) + k)); b.z = 5 + u * 60; });
        if ((t - fleetT) % 600 === 300) { const b = fx.beams[land++ % 3]; api.squad({ at: [b.x, b.z], n: 8 }); }
      }
    },
  };
}
