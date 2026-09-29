// 龍仔 Dragon — character entry (contract: src/chars/index.js): the front-line protester of 香港自由戰士 (Phaser game's
// player, internal key `keung` there). Text from the Story Bible and the Phaser game's prelude (written Cantonese + English).
import { LUNGJAI_KIT } from './kit.js';

// 20×20 portrait: yellow hard hat with a ridge, goggle strap, clear goggles, black mask to under the chin, black jacket
const FACE = [
  '....................',
  '........YYYY........',
  '......YYYYYYYY......',
  '.....YYYYyYYYYY.....',
  '....YYYYYyYYYYYY....',
  '....YYYYYyYYYYYY....',
  '...ddddddddddddddd..',
  '...KKKKKKKKKKKKKKK..',
  '....KSSSSSSSSSSK....',
  '....SGGGGSSGGGGS....',
  '....SGggGSSGggGS....',
  '....SGGGGSSGGGGS....',
  '....MMMMMMMMMMMM....',
  '....MMMMMMMMMMMM....',
  '....MMMMmMMmMMMM....',
  '.....MMMMMMMMMM.....',
  '......MMMMMMMM......',
  '...JJJJJMMMMJJJJJ...',
  '.JJJJJJJJjjJJJJJJJ..',
  'JJjJJJJJJjjJJJJJjJJ.',
];
const PAL = { Y: '#ffd700', y: '#c9a800', d: '#8a7400', K: '#111111', S: '#f1c27d', G: '#9ed8f0', g: '#dff4ff',
  M: '#111111', m: '#2a2a2a', J: '#181818', j: '#333333' };

export const LUNGJAI = {
  id: 'lungjai',
  name: { zh: '龍仔', en: 'Dragon' }, courtesy: { zh: '前線', en: 'the front line', label: '企喺' }, seal: '手足',
  title: { zh: '前線手足', en: 'The Front Line' }, motto: '我唔係大人物 · 企喺最前 · 等人走先',
  weapon: { zh: '竹棍', en: 'Bamboo Pole' },
  bio: {
    zh: ['我唔係咩大人物。我同大家一齊遊行，相信人夠多，佢哋會聽。', '從路障拆落一枝竹，企喺最前，等其他人走得切。'],
    en: ['"I am nobody special." He marched like everyone else, believing that if enough of them showed up, they would listen.',
      'Now he holds a bamboo pole pulled from a scaffold barricade, and stands in front so the others can get out.'],
  },
  stats: { atk: 4, def: 4, speed: 3, range: 4 }, musou: { zh: '龍拳', en: 'Dragon Fist' }, accent: '#ffd700',
  faction: { zh: '手足', en: 'Hong Kong, 2019' },
  lines: {
    intro: { zh: '傘擎高！企埋一齊！', en: 'Umbrellas up! Stand together!' },
    musouEnd: { zh: '冇人企出嚟，就由我嚟！', en: 'If nobody stands up, then I will!' },
    copy: ['一枝竹棍', '企喺最前'],
  },
  portrait: { face: FACE, pal: PAL },
  kit: LUNGJAI_KIT,
};
