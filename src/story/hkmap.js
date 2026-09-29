// 香港 ink map (Scroll Cutscenes page): one SVG for every 香港自由戰士 scroll (hk1–hk4 prologues + the ENDING), in the
// scroll player's format (story/prologue.js: viewBox 1600×900, [data-id] marks light per card, .pl-arw arrows draw in).
// Sepia paper; the New Territories at the top, Kowloon in the middle, the harbour as a pale ink band, Hong Kong Island at
// the bottom. Sides: hk = gold ink, riot = indigo, white = grey wash (index.html .pl-arw.hk / .riot / .white).
// Place marks and arrows as listed on the Scroll Cutscenes page. No flags or emblems: places, people and arrows only.
import { peaks, arrows } from './scrollkit.js';

const ARROWS = [
  ['march', 'hk', 'M1080 690 C1010 684 940 676 880 664 C840 658 800 654 772 652'],
  ['gas', 'riot', 'M830 700 C810 660 790 646 770 648 M700 700 C716 664 738 648 760 646 M760 600 C764 620 766 634 762 644'],
  ['storm', 'hk', 'M800 690 C826 668 846 646 860 626'],
  ['raid', 'white', 'M300 150 C340 170 370 190 392 208 M520 130 C480 160 440 190 410 208 M300 280 C340 260 372 240 394 222'],
  ['siege', 'riot', 'M900 410 C960 410 978 450 972 478 C964 520 920 534 882 526 C840 516 822 480 832 450 C842 424 870 410 900 410'],
  ['ropes', 'hk dot', 'M946 500 C950 520 954 540 960 560'],
  ['bikes', 'hk', 'M960 560 C920 540 860 510 800 470 M960 560 C1010 530 1060 490 1100 440'],
  ['sewer', 'hk dot', 'M900 480 C880 520 850 546 800 552 C760 556 720 548 690 536'],
];
const ISLAND = 'M420 900 C440 800 520 700 620 660 C700 630 760 628 840 632 C940 636 1040 650 1140 640 C1240 630 1340 650 1420 700 C1500 750 1560 830 1600 900Z';
const KOWLOON = 'M500 530 C560 470 640 430 720 410 C800 390 880 380 960 390 C1040 400 1100 430 1160 470 C1190 500 1170 520 1120 524 C1040 530 960 536 880 536 C780 536 660 540 560 546 C520 548 490 546 500 530Z';
const NT = 'M0 0 L1600 0 L1600 380 C1500 360 1400 340 1300 350 C1180 362 1100 390 1000 380 C880 368 760 380 660 400 C560 420 480 470 420 520 C360 560 260 560 160 540 C80 520 30 480 0 440Z';
const mark = (id, x, y, name, { sq = 0, sm = false, side = '' } = {}) =>
  `<g class="pl-mark${side ? ' ' + side : ''}" data-id="${id}">${sq ? `<rect x="${x - sq / 2}" y="${y - sq / 2}" width="${sq}" height="${sq}" rx="3"/>` : ''}<text${sm ? ' class="sm"' : ''} x="${x + (sq ? sq / 2 + 10 : 0)}" y="${y + (sq ? 10 : 0)}">${name}</text></g>`;

export const HK_MAP = `
<svg class="pl-map" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <filter id="pl-grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="4"/>
      <feColorMatrix values="0 0 0 0 .32  0 0 0 0 .22  0 0 0 0 .12  0 0 0 .55 -.18"/></filter>
    <filter id="pl-ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="9"/>
      <feDisplacementMap in="SourceGraphic" scale="7"/></filter>
    <filter id="pl-blot"><feGaussianBlur stdDeviation="30"/></filter>
    <filter id="pl-glow"><feGaussianBlur stdDeviation="18"/></filter>
    <radialGradient id="pl-vig" cx="50%" cy="50%" r="72%"><stop offset="55%" stop-color="#3a2410" stop-opacity="0"/>
      <stop offset="100%" stop-color="#2a170a" stop-opacity=".62"/></radialGradient>
    <linearGradient id="pl-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1d12" stop-opacity=".78"/>
      <stop offset=".7" stop-color="#4a3522" stop-opacity=".25"/><stop offset="1" stop-color="#4a3522" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="1600" height="900" fill="#d6c49e"/>
  <g filter="url(#pl-blot)" fill="#5e6a64" opacity=".22"><rect x="0" y="540" width="1600" height="110"/></g>
  <g stroke="#56615c" stroke-width="3" fill="none" opacity=".3" filter="url(#pl-ink)">
    ${[560, 585, 610].map((y, k) => `<path d="M${120 + k * 60} ${y} q40 -12 80 0 t80 0 t80 0 M${760 + k * 50} ${y + 6} q40 -12 80 0 t80 0 t80 0 t80 0"/>`).join('')}
  </g>
  <g filter="url(#pl-ink)">
    <path d="${NT}" fill="#c9ad7c" stroke="#3a2a1a" stroke-width="4" opacity=".9"/>
    <path d="${KOWLOON}" fill="#cdb183" stroke="#3a2a1a" stroke-width="5" opacity=".95"/>
    <path d="${ISLAND}" fill="#c9ad7c" stroke="#3a2a1a" stroke-width="5" opacity=".95"/>
  </g>
  <g fill="url(#pl-mtn)" filter="url(#pl-ink)">${peaks([[200, 120, 0.8], [640, 150, 1.0], [980, 120, 0.9], [1320, 170, 0.8], [700, 800, 0.9], [1000, 790, 1.1], [1260, 800, 0.8]], 120, 70)}</g>
  <g class="pl-mark" data-id="city" filter="url(#pl-glow)" fill="#e8b84a" opacity=".55"><ellipse cx="700" cy="470" rx="160" ry="44"/><ellipse cx="840" cy="640" rx="120" ry="30"/></g>
  <g class="pl-mark" data-id="harbour"><text class="river" x="560" y="598">維 港</text></g>
  <rect width="1600" height="900" filter="url(#pl-grain)"/>
  <g class="pl-arrows" filter="url(#pl-ink)">${arrows(ARROWS)}</g>
  <g class="pl-labels">
    ${mark('yuenlong', 380, 190, '元朗', { sq: 20 })}${mark('ylstation', 400, 215, '元朗站', { sq: 14, sm: true })}
    ${mark('kowloon', 800, 420, '九龍')}${mark('polyu', 900, 470, '理工大學', { sq: 20, sm: true })}${mark('hhbridge', 945, 500, '天橋', { sq: 12, sm: true })}
    ${mark('harcourt', 672, 676, '夏慤道', { sm: true })}${mark('admiralty', 812, 648, '金鐘', { sq: 18 })}${mark('legco', 872, 604, '立法會', { sq: 14, sm: true })}
    ${mark('tamar', 960, 628, '添馬', { sq: 12, sm: true })}
    <g class="pl-mark" data-id="city"><text class="sm" x="660" y="460">霓 虹</text></g>
    ${mark('lungjai', 776, 716, '龍仔', { sm: true, side: 'hk' })}${mark('siumei', 908, 706, '小美', { sm: true, side: 'hk' })}
    ${mark('sauzuk', 620, 720, '手足', { sm: true, side: 'hk' })}
    ${mark('stamp', 1040, 664, '777', { sm: true, side: 'riot' })}${mark('shocker', 990, 588, '比卡超', { sm: true, side: 'riot' })}
    ${mark('fixer', 500, 262, '強哥', { sm: true, side: 'white' })}${mark('bear', 990, 440, '維尼熊', { sm: true, side: 'riot' })}
  </g>
  <rect width="1600" height="900" fill="url(#pl-vig)"/>
</svg>`;
