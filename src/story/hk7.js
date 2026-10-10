// 銅鑼灣 Causeway Bay, 16 June 2019 — chapter data (format: ./ch1.js header; registry: ./chapters.js). Chapter id hk7,
// map `causeway`. Campaign: 金鐘 hk1 → 雨後 between1 → this → (chain) 立法會 hk2.
// Story: the march from Victoria Park along Hennessy Road to Admiralty. 龍仔 and 小美 walk with it: riot squads try to cut
// the column at the side streets (game fiction — the day itself was peaceful), a police line closes the Wan Chai
// junction, and on Harcourt Road a siren: the crowd has to part for an ambulance — the stage's non-combat centrepiece,
// from the real moment. A last 速龍 squad at the footbridge, then the march fills Harcourt Road at dusk.
// Script (story hook): the column (fx.column { head z, stalled, stallT, moving }): its head walks 1.5 m/s from the park
// toward the junction. It stalls (it never takes damage) only while a riot officer is pressed against its front (|x| < 7,
// head − 1 … head + 3 m) AND no hero is within 8 m of the head: a hero at the front clears the way, so walking with the march
// keeps it moving even with the waves ringed round him (they used to stall it for good). Squads cut in from the side streets
// as it passes them and every 15 s ahead of it (charging the heroes); the objective shows how far along the road it is. The ambulance lane
// (fx.lane [{ x, z, side, k, parted }], fx.amb { z, on }): a marcher block steps aside once a hero has stood within 2.5 m of
// it for 40 steps (the open-a-lane signal; "stand by it", as hk6); the ambulance drives in from the Admiralty end at 5 m/s
// toward the casualty at the junction and stops 7 m short of the next block still in its path (so the lane opens from the
// far end, the ambulance always ahead of the player), then drives back out with the casualty. No enemies during that beat.
// Win: the 速龍 at the footbridge down, after the ambulance is through.
// Sources (prologue, epilogue): GovHK press release "Crowd safety management measures and special traffic arrangements on
// Hong Kong Island" (15 Jun 2019: the procession route from Victoria Park along Hennessy Road); Asia News Network "Nearly
// two million rally peacefully in Hong Kong" and Malaysiakini (16-17 Jun 2019: organisers said about 2 million, police said
// about 338,000 on the main routes at the peak); SoraNews24 and Taiwan News (18 Jun 2019: the crowd parted for an
// ambulance on Harcourt Road near the government headquarters). Both crowd figures are given, attributed. No real person
// depicted or named; 龍仔 / 小美 are composites; no shop, bank or brand names, no flags.
import { HK_MAP } from './hkmap.js';
import { arrows } from './scrollkit.js';
import { SPK as HK_SPK, freeNames } from './hk1.js';
import { ST } from '../crowd/crowd.js';
import { MAPS } from '../world/map.js';

export { freeNames };
export const SPK = {
  ...HK_SPK,
  marshal: { name: { zh: '糾察', en: 'Marshal' }, seal: '糾', side: 'shu' },
};
export const OFF = {
  captain: { name: { zh: '防暴隊長', en: 'RIOT CAPTAIN' }, hp: 420 },
  raptor: { name: { zh: '速龍', en: 'RAPTOR' }, hp: 700, model: 'raptor' },
};
const NAG = { who: 'marshal', zh: '唔好衝咁前，隊伍喺後面！', en: 'Don\'t run ahead — the march is behind you!' };
const NAG_AMB = { who: 'medic', zh: '救護車未過，先讓路！', en: 'The ambulance isn\'t through yet. Make way first!' };

export const BEATS = [
  // ---- 維園: set off
  {
    when: { wait: 30 },
    banner: { html: '6·16 <em>銅鑼灣</em>', en: '16 June · Causeway Bay', dur: 170 },
    obj: { zh: '跟遊行隊伍出發', en: 'Set off with the march', go: ['park', 0, 0.6] },
    limit: { z: ['hennessy', 0, -0.7], nag: NAG },
    morale: 0,
    say: [
      { who: 'marshal', zh: '前面舉手打開，即係要讓路。傳落去！', en: 'Hands up and opening ahead means make way. Pass it back!' },
      { who: 'lungjai', zh: '咁多人⋯⋯成條路都係。', en: 'So many people... the whole road.' },
    ],
  },
  {
    when: { wait: 5 * 60 },
    cue: 'march',
    obj: { zh: '護送遊行隊伍', en: 'Keep the march moving', go: ['park', 0, 0.9] },
    limit: { z: ['junction', 0, -1], nag: NAG },
  },
  // ---- 灣仔: the police line
  {
    when: { flag: 'columnAtJunction' },
    banner: { html: '<em>警方防線</em>', en: 'A police line', dur: 150 },
    obj: { zh: '打開灣仔防線', en: 'Open the line at Wan Chai', go: 'captain' },
    limit: { z: ['junction', 0, 0], nag: NAG },                       // up to the line (gate junctionLine at z ≈ -22)
    squads: [{ at: ['junction', -0.5, -0.5], n: 14, charge: true }, { at: ['junction', 0.5, -0.5], n: 14, charge: true }],
    officers: { captain: { at: ['junction', 0, -0.35], engaged: true } },   // this side of the line
    say: [{ who: 'sauzuk', zh: '佢哋封咗路！', en: 'They\'ve closed the road!' }],
  },
  {
    when: { down: 'captain' },
    gate: 'junctionLine', heal: 0.3, morale: 0.15, retire: true, hush: true,
    banner: { html: '防線 <em>打開</em>', en: 'The line is open', dur: 160 },
    obj: { zh: '去夏慤道', en: 'On to Harcourt Road', go: ['harcourt', 0, -0.6] },
    limit: { z: ['harcourt', 0, -0.5], nag: NAG },
  },
  // ---- 夏慤道: the ambulance
  {
    when: { zone: 'harcourt' },
    cue: 'ambulance', waves: false, retire: true, hush: true,
    banner: { html: '<em>救護車</em>', en: 'An ambulance', dur: 170, big: true },
    obj: { zh: '讓路：企喺人群前面打手號', en: 'Make way: stand in front of each group and signal', go: ['harcourt', 0, -0.4] },
    limit: { z: ['harcourt', 0, 0.95], nag: NAG_AMB },
    say: [{ who: 'medic', zh: '前面有人暈低，救護車要過！', en: 'Someone collapsed up ahead — the ambulance has to get through!' }],
  },
  {
    when: { flag: 'ambulanceThrough' },
    gate: 'bridgeStairs', morale: 0.2, limit: { z: null },
    banner: { html: '救護車 <em>過咗</em>', en: 'The ambulance is through', dur: 170 },
    obj: { zh: '上天橋', en: 'Up onto the footbridge', go: ['deck', 0, -0.4] },
    say: [{ who: 'siumei', zh: '幾百萬人，讓得出一條路。', en: 'That many people, and they still made way.' }],
  },
  // ---- 天橋: the last push
  {
    when: { zone: 'deck' },
    officers: { raptor: { at: ['deck', 0, 0.3], engaged: true } },
    squads: [{ at: ['deck', -0.5, 0.2], n: 12, charge: true }, { at: ['deck', 0.5, 0.2], n: 12, charge: true }],
    obj: { zh: '擊破 速龍', en: 'Defeat the Raptor', go: 'raptor' },
  },
  {
    when: { down: 'raptor' },
    win: true, waves: false, morale: 1,
    banner: { html: '<em>遊行</em> 到咗金鐘', en: 'The march reaches Admiralty', dur: 260, big: true },
    say: [{ who: 'lungjai', zh: '成條夏慤道都係人。', en: 'Harcourt Road, full of people.' }],
  },
];

// ---- scroll: the ink map plus Causeway Bay / Victoria Park east of Admiralty, the march arrow west along Hennessy Road
function mark(id, x, y, name, sq, sm = false) {
  return `<g class="pl-mark" data-id="${id}"><rect x="${x - sq / 2}" y="${y - sq / 2}" width="${sq}" height="${sq}" rx="3"/><text${sm ? ' class="sm"' : ''} x="${x + sq / 2 + 10}" y="${y + 10}">${name}</text></g>`;
}
const CWB_MARKS = `${mark('causeway', 1110, 636, '銅鑼灣', 18)}${mark('vicpark', 1150, 606, '維園', 12, true)}${mark('hennessy', 1000, 690, '軒尼詩道', 12, true)}`;
export const MAP = HK_MAP
  .replace('<g class="pl-arrows" filter="url(#pl-ink)">', '<g class="pl-arrows" filter="url(#pl-ink)">' + arrows([['march', 'hk', 'M1140 620 C1060 650 960 668 830 660']]))
  .replace('<g class="pl-labels">', `<g class="pl-labels">\n    ${CWB_MARKS}`);
export const PROLOGUE = [
  { cols: ['六月十六日', '銅鑼灣', '維多利亞公園'], en: '16 June 2019. Victoria Park, Causeway Bay.', show: ['causeway', 'vicpark'], focus: [1120, 620, 1.6] },
  { cols: ['遊行隊伍', '沿軒尼詩道', '行去金鐘'], en: 'The march set off along Hennessy Road towards Admiralty.', show: ['march', 'hennessy'], focus: [980, 650, 1.1] },
  { cols: ['主辦：約二百萬', '警方：高峰期', '三十三萬八千人'], en: 'Organisers said about two million marched; police counted 338,000 on the main routes at the peak.', show: ['march'], focus: [960, 650, 1.0] },
  { cols: ['夏慤道上', '人群讓開', '救護車駛過'], en: 'On Harcourt Road, the crowd parted for an ambulance.', show: ['harcourt'], focus: [700, 670, 1.4] },
  { cols: ['龍仔同小美', '跟住隊伍', '一齊行'], en: 'Dragon and Amy walk with the march.', show: ['lungjai', 'siumei', 'causeway'], focus: [900, 680, 0.9] },
];
export const STAMP = { small: '第二章', big: '銅鑼灣', seal: '同行', en: 'CHAPTER II · CAUSEWAY BAY · 16 JUNE 2019' };
// Result-screen epilogue: the Phaser game has no 6·16 chapter, so this text is new — plainly worded, dated, sourced (header).
export const EPILOGUE = {
  zh: ['2019年6月16日，遊行人士由銅鑼灣維多利亞公園出發，沿軒尼詩道步行到金鐘。主辦單位稱約二百萬人參與；警方則指高峰期主要路線上約有三十三萬八千人。在夏慤道近政府總部，人群讓開一條路，讓救護車通過。那天的遊行是和平的。',
    '<i>人再多，都讓得出一條路。</i>'],
  en: ['On 16 June 2019, marchers set out from Victoria Park in Causeway Bay and walked along Hennessy Road to Admiralty. Organisers said about two million people took part; police said about 338,000 were on the main routes at the peak. On Harcourt Road, near the government headquarters, the crowd parted to let an ambulance through. The march was peaceful.',
    '<i>However many they were, they made way.</i>'],
};
export const DEFEAT = { zh: '{name}倒下了⋯⋯隊伍仲喺後面。', en: '{name} goes down... the march is still behind.' };

// ---- script: the column, the side-street squads, the ambulance lane
const SPEED = 1.5 / 60, LEAD_R = 8, BLOCK_AHEAD = 3, PART_R = 2.5, PART_N = 40, AMB_V = 5 / 60, AMB_GAP = 7;
export function script(game, api) {
  const M = MAPS.causeway, c = game.crowd;
  const fx = { column: { head: M.COLUMN_START, stalled: false, stallT: 0, moving: false }, lane: [], amb: { z: M.AMB.z0, on: false, siren: false }, parted: 0 };
  let march = false, cut = [false, false], lastSquad = 0, amb = false;
  const heroes = () => game.heroes || [game.hero];
  /** A riot officer standing in front of the column's head. */
  const blocked = (z) => {
    for (let i = 0; i < c.N; i++) { const s = c.st[i]; if (s >= ST.IDLE && s <= ST.ATTACK && Math.abs(c.x[i]) < 7 && c.z[i] > z - 1 && c.z[i] < z + BLOCK_AHEAD) return true; }
    return false;
  };
  return {
    fx,
    cue(name) {
      if (name === 'march') { march = true; fx.column.moving = true; lastSquad = api.t(); }
      if (name === 'ambulance' && !amb) {
        amb = true; fx.amb.on = true; fx.amb.siren = true;
        fx.lane = M.AMB.blocks.map((z, k) => ({ x: 0, z, side: k & 1 ? 1 : -1, k: 0, parted: false }));
      }
    },
    step() {
      const t = api.t(), col = fx.column, H = heroes();
      // ---- the column
      if (march && !api.flag('columnAtJunction')) {
        col.stalled = blocked(col.head) && !H.some((h) => !h.dead && Math.hypot(h.x, h.z - col.head) < LEAD_R);
        if (col.stalled) col.stallT++; else col.head = Math.min(M.COLUMN_END, col.head + SPEED);
        M.SIDE_STREETS.forEach(([x, z], k) => {                     // the side streets: a squad cuts in as the head comes level
          if (!cut[k] && col.head > z - 14) { cut[k] = true; api.squad({ at: [x, z], n: 14, charge: true }); api.say({ who: 'marshal', zh: '橫街有人衝出嚟！', en: 'They\'re coming out of the side street!' }); }
        });
        if (t - lastSquad >= 15 * 60 && col.head < M.COLUMN_END - 10) {   // and every 15 s, a squad charging in across the road ahead of it
          lastSquad = t; api.squad({ at: [((t / 900) & 1 ? 5 : -5), Math.min(M.COLUMN_END, col.head + 14)], n: 10, charge: true });
        }
        if (col.head >= M.COLUMN_END) api.flag('columnAtJunction', true);
        else if (t % 30 === 0) {
          const pc = Math.round(100 * (col.head - M.COLUMN_START) / (M.COLUMN_END - M.COLUMN_START));
          api.objective(col.stalled ? { zh: `隊伍停咗：返去隊頭清走防暴警 ${pc}%`, en: `The march has stopped: get back to its front ${pc}%`, go: [0, col.head + 2] }
            : { zh: `護送遊行隊伍 ${pc}%`, en: `Keep the march moving ${pc}%`, go: [0, col.head + 5] });   // walk at its front
        }
      }
      // ---- the ambulance lane: blocks step aside after the signal; the ambulance drives to the next block still in the lane
      if (amb && !api.flag('ambulanceThrough')) {
        for (const b of fx.lane) {
          if (!b.parted) {
            if (H.some((h) => !h.dead && Math.hypot(h.x - b.x, h.z - b.z) < PART_R)) b.k++;
            if (b.k >= PART_N) { b.parted = true; fx.parted++; }
          } else if (Math.abs(b.x) < 9) b.x += b.side * 0.15;       // they shuffle to the kerb
        }
        const ahead = fx.lane.filter((b) => !b.parted && b.z < fx.amb.z), next = ahead.length ? ahead.reduce((a, b) => (b.z > a.z ? b : a)) : null;
        const stop = next ? next.z + AMB_GAP : M.AMB.z1;
        if (fx.amb.z > stop) fx.amb.z = Math.max(stop, fx.amb.z - AMB_V);
        if (fx.amb.z <= M.AMB.z1) api.flag('ambulanceThrough', true);
        else if (t % 30 === 0) {
          const w = next;
          api.objective(w ? { zh: `讓路：企喺人群前面 ${Math.round(100 * w.k / PART_N)}%`, en: `Make way: stand in front of the group ${Math.round(100 * w.k / PART_N)}%`, go: [w.x, w.z - 1.5] }
            : { zh: '救護車過緊', en: 'The ambulance is getting through', go: [0, fx.amb.z - 6] });
        }
      }
      if (api.flag('ambulanceThrough') && fx.amb.on) { fx.amb.z += AMB_V; if (fx.amb.z > 100) { fx.amb.on = false; fx.amb.siren = false; } }   // back out with the casualty
    },
  };
}
