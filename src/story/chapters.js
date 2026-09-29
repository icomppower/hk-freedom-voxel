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
import * as ch1 from './ch1.js';
import * as sheep1 from './sheep1.js';
import * as sheep2 from './sheep2.js';

const LIST = [
  {
    ...ch1, id: 'ch1', map: 'dingjun', cast: ['zhaoyun', 'huangzhong'],
    title: { small: '第一章', zh: '定軍山', en: 'CHAPTER I · MOUNT DINGJUN' }, sides: { us: '蜀', them: '魏' },
    // the van drawn up either side of the road inside the 本陣 gate, holding rank until the hero marches past
    allies: [-1, 1].map((sx) => ({ x: sx * 5.575, z: -121.6, n: 12, cols: 4, hold: true })),
  },
  {
    ...sheep1, id: 'sheep1', map: 'pasture', cast: ['gok', 'siume'],
    title: { small: '第一章', zh: '羊村牧場', en: 'CHAPTER I · THE SHEEP VILLAGE PASTURE' },
    sides: { us: '羊', them: '狼', names: { us: { zh: '羊群', en: 'The flock' }, them: { zh: '狼群', en: 'Wolf' } } },
    skin: { foe: 'wolf', ally: 'sheep' },
    // the festival flock with crooks and pitchforks, either side of the pasture track
    allies: [-1, 1].map((sx) => ({ x: sx * 6, z: -132, n: 10, cols: 3, hold: true })),
  },
  {
    ...sheep2, id: 'sheep2', map: 'lantern', cast: ['gok', 'siume'],
    title: { small: '第二章', zh: '燈籠街夜行', en: 'CHAPTER II · LANTERN STREET BY NIGHT' },
    sides: { us: '羊', them: '狼', names: { us: { zh: '羊群', en: 'The flock' }, them: { zh: '狼群', en: 'Wolf' } } },
    skin: { foe: 'wolf', ally: 'sheep' },
    allies: [-1, 1].map((sx) => ({ x: sx * 5, z: -104, n: 6, cols: 3, hold: true })),   // the villagers who came out to help
  },
];

export const CHAPTERS = Object.fromEntries(LIST.map((c) => [c.id, c]));
export const CHAPTER_ORDER = LIST.map((c) => c.id);
export const DEFAULT_CHAPTER = 'ch1';

/** Chapters an officer can play (in order). */
export const chaptersFor = (charId) => CHAPTER_ORDER.filter((id) => CHAPTERS[id].cast.includes(charId));

/** Resolve a chapter for (chapter id?, char id): the named one, else the officer's first, else the default. */
export function resolveChapter(id, charId) {
  return CHAPTERS[id] || CHAPTERS[chaptersFor(charId)[0]] || CHAPTERS[DEFAULT_CHAPTER];
}
