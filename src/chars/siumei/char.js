// 小美 Amy — character entry (contract: src/chars/index.js): the first-aider turned fighter of 香港自由戰士 (the Phaser
// game's second playable, internal key `amy` there). Text from the Story Bible (written Cantonese + English).
import { SIUMEI_KIT } from './kit.js';

// 20×20 portrait: black hair with a side fringe, clear goggles pushed up, high ponytail, pink hooded jacket, first-aid patch
const FACE = [
  '....................',
  '.......HHHHHH...HH..',
  '.....HHHHHHHHH.HHHH.',
  '....HHGGGHHGGGHHHHH.',
  '....HGggGHHGggGHHH..',
  '....HHHHHHHHHHHHHH..',
  '....HHHHHHSSSSSSHH..',
  '....HHHSSSSSSSSSSH..',
  '....HHSSSSSSSSSSSH..',
  '....HHSEESSSSEESSH..',
  '....HHSSSSSSSSSSSH..',
  '.....HSSSSSsSSSSH...',
  '.....HSSSSSSSSSSH...',
  '......SSSSMMSSSS....',
  '.......SSSSSSSS.....',
  '...PPPPPSSSSPPPPP...',
  '..PPPPPPPkkPPPPPPP..',
  '.PPWRWPPPkkPPPPPPPP.',
  'PPPRRRPPPkkPPPPPPPPP',
  'PPPWRWPPPkkPPPPPPPPP',
];
const PAL = { H: '#141414', G: '#cfefff', g: '#ffffff', S: '#f1c27d', s: '#d8a468', E: '#1a1214', M: '#c07870',
  P: '#f48fb1', k: '#ec407a', R: '#e53935', W: '#ffffff' };

export const SIUMEI = {
  id: 'siumei',
  name: { zh: '小美', en: 'Amy' }, courtesy: { zh: '義救', en: 'the first-aider', label: '本職' }, seal: '義救',
  title: { zh: '雙傘義救', en: 'The Umbrellas' }, motto: '一齊嚟 · 一齊走 · 一個都唔留低',
  weapon: { zh: '雙傘', en: 'Twin Umbrellas' },
  bio: {
    zh: ['本來喺前線做義救，揹住急救包穿梭催淚煙之間。', '後來佢揸起兩把遮：「一齊嚟，一齊走。」總會返轉頭搵落後嘅人。'],
    en: ['A volunteer first-aider who ran medical kits through the tear gas.',
      'Now she carries two umbrellas: "We came together, we leave together." She always goes back for anyone left behind.'],
  },
  stats: { atk: 3, def: 3, speed: 5, range: 2 }, musou: { zh: '旋風腿', en: 'Hurricane Kick' }, accent: '#f48fb1',
  faction: { zh: '手足', en: 'Hong Kong, 2019' },
  lines: {
    intro: { zh: '傷者交俾我。你擋住佢哋。', en: 'I\'ll get the wounded out. You keep them off us.' },
    musouEnd: { zh: '一個都唔可以留低！', en: 'Nobody gets left behind!' },
    copy: ['雙傘開合', '一齊嚟一齊走'],
  },
  portrait: { face: FACE, pal: PAL },
  kit: SIUMEI_KIT,
};
