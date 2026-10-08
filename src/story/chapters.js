// Chapter registry (seam). A chapter = its data module (format: ./ch1.js — SPK, OFF, BEATS, PROLOGUE, EPILOGUE, plus the
// scroll data of the Scroll Cutscenes page for later chapters) + the fields below. The story director, prologue, result,
// select and main.js read the active chapter from here instead of importing ch1.js. New chapters register with one
// import + one entry in LIST.
//   id                 CHAPTERS key (flow ctx.chapter, ?ch= dev param)
//   map                map id (src/world/map.js MAPS) the battle is fought on
//   cast               playable officers (CHARS ids); the chapter pick lists a chapter under each of them, and the one of
//                      them the player didn't pick speaks the `who: 'ally'` lines
//   title {small, zh, en}   chapter band (small: 第一章 …, zh: name, en: CHAPTER I · …)
//   sides {us, them}   one-glyph faction seals for the HUD morale bar
//   allies [{ x, z, n, cols, hold }]   story start: the friendly ranks (crowd.spawnAllies)
//   skin { foe, ally }  crowd skins (src/chars/officers/index.js SKINS; default: the Wei army / Shu allies)
//   sides.names { us: {zh, en}, them: {zh, en} }   who the HUD's reinforcement banners name
//   after              (香港自由戰士) the cutscene played after a story WIN, before the next chapter (story/cutscenes/)
//   endScene           the end scene between the ENDING scroll and the TRIBUTE card
//   chain              (香港自由戰士) a story WIN goes straight on to the next chapter (no cutscene in between)
//   preview            (香港自由戰士) built but not in the campaign yet: off the menus and the 繼續 chain, ?ch= only
import * as ch1 from './ch1.js';
import * as hk1 from './hk1.js';
import * as hk2 from './hk2.js';
import * as hk3 from './hk3.js';
import * as hk4 from './hk4.js';
import * as hk6 from './hk6.js';
import * as hk7 from './hk7.js';
import { DEV } from '../chars/index.js';

const LIST = [
  {
    ...ch1, id: 'ch1', dev: true, map: 'dingjun', cast: ['zhaoyun', 'huangzhong'],
    title: { small: '第一章', zh: '定軍山', en: 'CHAPTER I · MOUNT DINGJUN' }, sides: { us: '蜀', them: '魏' },
    // the van drawn up either side of the road inside the 本陣 gate, holding rank until the hero marches past
    allies: [-1, 1].map((sx) => ({ x: sx * 5.575, z: -121.6, n: 12, cols: 4, hold: true })),
  },
  {
    ...hk1, id: 'hk1', after: 'between1', map: 'admiralty', cast: ['lungjai', 'siumei'],
    title: { small: '第一章', zh: '金鐘', en: 'CHAPTER I · ADMIRALTY' },
    sides: { us: '港', them: '警', names: { us: { zh: '手足', en: 'Protesters' }, them: { zh: '防暴警', en: 'Riot police' } } },
    skin: { foe: 'riot', ally: 'blackbloc' },
    // the umbrella line: 手足 either side of the carriageway ahead of the start
    allies: [-1, 1].map((sx) => ({ x: sx * 6, z: -130, n: 12, cols: 4, hold: true })),
  },
  {
    // 6·16 銅鑼灣 (approved 2026-10-08): 金鐘 → 雨後 between1 → 銅鑼灣 → (chain) 立法會
    ...hk7, id: 'hk7', chain: true, map: 'causeway', cast: ['lungjai', 'siumei'],
    title: { small: '第二章', zh: '銅鑼灣', en: 'CHAPTER II · CAUSEWAY BAY' },
    sides: { us: '港', them: '警', names: { us: { zh: '遊行人士', en: 'Marchers' }, them: { zh: '防暴警', en: 'Riot police' } } },
    skin: { foe: 'riot', ally: 'blackbloc' },
    allies: [-1, 1].map((sx) => ({ x: sx * 8, z: -150, n: 12, cols: 6, hold: true })),   // marchers on the park's pitches
  },
  {
    ...hk2, id: 'hk2', after: 'between2', map: 'legco', cast: ['lungjai', 'siumei'],
    title: { small: '第三章', zh: '立法會', en: 'CHAPTER III · LEGCO' },
    sides: { us: '港', them: '警', names: { us: { zh: '手足', en: 'Protesters' }, them: { zh: '防暴警', en: 'Riot police' } } },
    skin: { foe: 'riot', ally: 'blackbloc' },
    allies: [-1, 1].map((sx) => ({ x: sx * 6, z: -132, n: 10, cols: 5, hold: true })),   // the crowd on the plaza
  },
  {
    ...hk3, id: 'hk3', chain: true, map: 'yuenlong', cast: ['lungjai', 'siumei'],
    title: { small: '第四章', zh: '元朗', en: 'CHAPTER IV · YUEN LONG' },
    sides: { us: '港', them: '白', names: { us: { zh: '乘客', en: 'Passengers' }, them: { zh: '白衫友', en: 'White shirts' } } },
    skin: { foe: 'white', ally: 'civil' },
    allies: [-1, 1].map((sx) => ({ x: sx * 5, z: -128, n: 6, cols: 3, hold: true })),   // passengers who stood up to them
  },
  {
    // 11·12 中大二號橋 (approved 2026-10-07): 元朗 → 中大 → 理工 — hk3 chains straight into it; 竹枝 between3 plays after it, before hk4
    ...hk6, id: 'hk6', after: 'between3', map: 'cuhk', cast: ['lungjai', 'siumei'],
    title: { small: '第五章', zh: '中大二號橋', en: 'CHAPTER V · BRIDGE NO. 2' },
    sides: { us: '港', them: '警', names: { us: { zh: '同學', en: 'Students' }, them: { zh: '防暴警', en: 'Riot police' } } },
    skin: { foe: 'riot', ally: 'blackbloc' },
    allies: [-1, 1].map((sx) => ({ x: sx * 7, z: -150, n: 10, cols: 5, hold: true })),   // the students on the campus road
  },
  {
    ...hk4, id: 'hk4', endScene: 'ending', map: 'polyu', cast: ['lungjai', 'siumei'],
    title: { small: '第六章', zh: '理工大學', en: 'CHAPTER VI · POLYU SIEGE' },
    sides: { us: '港', them: '警', names: { us: { zh: '手足', en: 'Protesters' }, them: { zh: '防暴警', en: 'Riot police' } } },
    skin: { foe: 'riot', ally: 'blackbloc' },
    allies: [-1, 1].map((sx) => ({ x: sx * 6, z: -130, n: 10, cols: 5, hold: true })),   // the students holding the podium
  },
];

export const CHAPTERS = Object.fromEntries(LIST.map((c) => [c.id, c]));
// 定軍山 ch1 stays registered (the hash gate, ?ch=ch1 / ?go=story) but is listed on the menus only with ?dev
export const CHAPTER_ORDER = LIST.filter((c) => (DEV || !c.dev) && !c.preview).map((c) => c.id);
export const DEFAULT_CHAPTER = 'ch1';

/** Chapters an officer can play (in order). */
export const chaptersFor = (charId) => CHAPTER_ORDER.filter((id) => CHAPTERS[id].cast.includes(charId));

/** Resolve a chapter for (chapter id?, char id): the named one, else the officer's first, else the default. */
export function resolveChapter(id, charId) {
  return CHAPTERS[id] || CHAPTERS[chaptersFor(charId)[0]] || CHAPTERS[DEFAULT_CHAPTER];
}
