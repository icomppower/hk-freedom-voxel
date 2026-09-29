// 阿角 Ah Gok — character entry (contract: src/chars/index.js): the oldest, most stubborn sheep of 羊村, who escorts the
// twelve (he is not one of them). Text from the Story Bible / Storyline pages (written Cantonese + English).
import { GOK_KIT } from './kit.js';

// 20×20 portrait: dark long face, light eyes, wool cap and ruff, curled gold horns, blue raincoat, red scarf
const FACE = [
  '....................',
  '......WWWWWWW.......',
  '....hHWWwWWWwWHh....',
  '...hHHWWWWWWWWHHh...',
  '..hHHhWWWWwWWWhHHh..',
  '..HHh.WKKKKKKW.hHH..',
  '..HHh.KKKKKKKK.hHH..',
  '..hHHhKEKKKKEKhHHh..',
  '...hHKKKKKKKKKKHh...',
  '.....KKKKKKKKKK.....',
  '......KKkKKkKK......',
  '......KKKKKKKK......',
  '.......KKkkKK.......',
  '.....WWKKKKKKWW.....',
  '....WWWWwWWwWWWW....',
  '...RRRWWWWWWWWRRR...',
  '..BBRRRRRRRRRRRRBB..',
  '.BBBBBRRBBBBBBBBBBB.',
  'BBbBBBBRRBBBBBBbBBBB',
  'BBbBBBBBRBBBBBBbBBBB',
];
const PAL = { K: '#3b3a36', k: '#232220', W: '#f2efe6', w: '#d8d2c2', H: '#c8a15a', h: '#8e6e34', E: '#e8d9a8',
  B: '#2f5d7c', b: '#1f4058', R: '#b8452f' };

export const GOK = {
  id: 'gok',
  name: { zh: '阿角', en: 'Ah Gok' }, courtesy: { zh: '角叔', en: 'Uncle Gok', label: '人稱' }, seal: '羊村',
  title: { zh: '硬頸老羊', en: 'The Stubborn Ram' }, motto: '硬頸老羊 · 一杖守門 · 送十二勇士',
  weapon: { zh: '牧杖', en: 'Shepherd\'s Crook' },
  bio: {
    zh: ['羊村最年長、最硬頸嘅一隻羊，話少，企喺門口等人過。', '十二隻後生羊要行，佢揸起牧杖：「你哋行，我送。」'],
    en: ['The oldest, most stubborn sheep in the village: says little, and plants himself in the gate so others can pass.',
      'When the twelve decided to leave, he picked up his crook: "You go. I\'ll see you off."'],
  },
  stats: { atk: 5, def: 4, speed: 2, range: 4 }, musou: { zh: '牧羊歸欄', en: 'Shepherd\'s Round-Up' }, accent: '#d0a84e',
  faction: { zh: '羊', en: 'Sheep Village' },
  lines: {
    intro: { zh: '我企喺度幾十年，今日都唔會郁。', en: 'I\'ve stood here for decades. I\'m not moving today.' },
    musouEnd: { zh: '一隻都唔可以少！', en: 'Not one fewer!' },
    copy: ['牧杖所向', '羊群歸欄'],
  },
  portrait: { face: FACE, pal: PAL },
  kit: GOK_KIT,
};
