// 小咩 Siu Me — character entry (contract: src/chars/index.js): the youngest of the twelve, quick-tongued, plans the route
// and refuses to leave anyone on the pier. Text from the Story Bible / Storyline pages (written Cantonese + English).
import { SIUME_KIT } from './kit.js';

// 20×20 portrait: dark face, light eyes, cropped wool cap, short horns, red headband with tails, teal vest
const FACE = [
  '....................',
  '.......hh..hh.......',
  '.......Hh..Hh.......',
  '......WWWWWWWW......',
  '.....WWwWWWwWWW.....',
  '....RRRRRRRRRRRRRR..',
  '....KKKKKKKKKKKRRrR.',
  '..KKKKKKKKKKKKKK.Rr.',
  '....KEKKKKKKEKK...R.',
  '....KKKKKKKKKKK.....',
  '.....KKKkkKKKK......',
  '.....KKKKKKKKK......',
  '......KKKkkKK.......',
  '......WWKKKKWW......',
  '.....WWWWWWWWWW.....',
  '...TTTWWWWWWWWTTT...',
  '..TTTTTWWWWWWTTTTT..',
  '.TTtTTTTWWWWTTTTtTT.',
  'TTTtTTTTTWWTTTTTtTTT',
  'TTTtTTTTTTTTTTTTtTTT',
];
const PAL = { K: '#2b2a28', k: '#141312', W: '#ede6da', w: '#d2c9b8', H: '#9c8f7a', h: '#7a6e5c', E: '#f0e6c8',
  R: '#d93a3a', r: '#a02828', T: '#1f7a6b', t: '#135247' };

export const SIUME = {
  id: 'siume',
  name: { zh: '小咩', en: 'Siu Me' }, courtesy: { zh: '十二勇士', en: 'one of the twelve', label: '' }, seal: '十二',
  title: { zh: '雙剪飛花', en: 'The Twin Shears' }, motto: '雙剪飛花 · 一個都唔留低 · 霧散返屋企',
  weapon: { zh: '雙剪', en: 'Twin Shears' },
  bio: {
    zh: ['十二勇士之中最細嘅一隻，口快，腦筋更快。', '逃走路線係佢畫嘅——佢唔肯留低任何一隻羊喺碼頭。'],
    en: ['The youngest of the twelve: quick with her tongue, quicker with a plan.',
      'She drew the escape route, and she won\'t leave a single sheep behind on the pier.'],
  },
  stats: { atk: 3, def: 2, speed: 5, range: 2 }, musou: { zh: '千剪飛花', en: 'Thousand Snips' }, accent: '#e0524a',
  faction: { zh: '羊', en: 'Sheep Village' },
  lines: {
    intro: { zh: '燈一點，就冇得回頭。', en: 'Once the lantern\'s lit, there\'s no turning back.' },
    musouEnd: { zh: '剪咗成世羊毛，總有啲用！', en: 'A lifetime of shearing had to be good for something!' },
    copy: ['雙剪一合', '千花齊落'],
  },
  portrait: { face: FACE, pal: PAL },
  kit: SIUME_KIT,
};
