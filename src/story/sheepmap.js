// 羊村 ink map (Scroll Cutscenes page): one SVG for all four 羊村 scrolls (CH1 / CH2 / CH3 prologues + the ENDING), in the
// scroll player's format (story/prologue.js: viewBox 1600×900, [data-id] marks light per card, .pl-arw arrows draw in).
// Sepia paper, the sea washed in pale ink, fog as soft grey bands; the island runs bottom-left → top-right like the +Z
// stages (pasture → shrine → stairs → beach → boom → the fog sea). 羊 = teal ink (class sheep), 狼 = vermilion (wolf).
import { peaks, arrows } from './scrollkit.js';

const ARROWS = [
  ['wolf1', 'wolf', 'M1400 80 C1260 140 1110 215 992 272'],                              // the garrison's ships arrive
  ['wolf2', 'wolf', 'M500 610 C548 668 586 718 612 752'],                                // the raid down the ridge
  ['route', 'sheep dot', 'M620 760 C760 700 870 620 900 560 C900 520 850 470 822 440 C880 380 980 320 1040 300 C1110 270 1170 240 1192 228 C1250 188 1300 140 1348 112'],
  ['sheep2a', 'sheep', 'M742 508 C756 486 772 462 790 436'],
  ['sheep2b', 'sheep', 'M762 506 C786 486 806 466 824 442'],
  ['sheep2c', 'sheep', 'M784 508 C818 492 846 470 866 444'],
  ['sheep3', 'sheep', 'M1040 300 C1066 284 1090 270 1108 262'],
  ['fleet', 'wolf', 'M1440 60 C1360 118 1270 176 1204 222'],
  ['fleetback', 'wolf', 'M1204 222 C1280 170 1360 116 1452 56'],
  ['wolfout', 'wolf', 'M800 520 C876 420 946 330 984 286 C1096 204 1244 124 1400 72'],
  ['homeroute', 'sheep', 'M1348 112 C1248 150 1106 218 994 274'],
];
const ISLAND = 'M552 790 C512 704 552 604 636 540 C698 470 704 400 780 356 C860 300 940 258 1020 238 C1100 208 1180 168 1268 158 C1322 166 1334 218 1292 250 C1232 298 1150 318 1080 340 C1000 380 982 462 962 542 C942 644 880 724 800 782 C718 836 612 848 552 790Z';
const mark = (id, x, y, name, { sq = 0, sm = false, side = '' } = {}) =>
  `<g class="pl-mark${side ? ' ' + side : ''}" data-id="${id}">${sq ? `<rect x="${x - sq / 2}" y="${y - sq / 2}" width="${sq}" height="${sq}" rx="3"/>` : ''}<text${sm ? ' class="sm"' : ''} x="${x + (sq ? sq / 2 + 10 : 0)}" y="${y + (sq ? 10 : 0)}">${name}</text></g>`;

export const SHEEP_MAP = `
<svg class="pl-map" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <filter id="pl-grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="4"/>
      <feColorMatrix values="0 0 0 0 .32  0 0 0 0 .22  0 0 0 0 .12  0 0 0 .55 -.18"/></filter>
    <filter id="pl-ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="9"/>
      <feDisplacementMap in="SourceGraphic" scale="7"/></filter>
    <filter id="pl-blot"><feGaussianBlur stdDeviation="30"/></filter>
    <filter id="pl-fog"><feGaussianBlur stdDeviation="22"/></filter>
    <radialGradient id="pl-vig" cx="50%" cy="50%" r="72%"><stop offset="55%" stop-color="#3a2410" stop-opacity="0"/>
      <stop offset="100%" stop-color="#2a170a" stop-opacity=".62"/></radialGradient>
    <linearGradient id="pl-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1d12" stop-opacity=".78"/>
      <stop offset=".7" stop-color="#4a3522" stop-opacity=".25"/><stop offset="1" stop-color="#4a3522" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="1600" height="900" fill="#d6c49e"/>
  <g filter="url(#pl-blot)" fill="#5e6a64" opacity=".2"><rect x="0" y="0" width="1600" height="900"/></g>
  <g stroke="#56615c" stroke-width="3" fill="none" opacity=".28" filter="url(#pl-ink)">
    ${[120, 200, 290, 380, 470, 560, 650, 740, 830].map((y, k) => `<path d="M${60 + (k % 3) * 40} ${y} q40 -14 80 0 t80 0 t80 0 M${1080 + (k % 2) * 60} ${y + 30} q40 -14 80 0 t80 0 t80 0"/>`).join('')}
  </g>
  <g filter="url(#pl-ink)">
    <path d="${ISLAND}" fill="#c9ad7c" stroke="#3a2a1a" stroke-width="5" opacity=".95"/>
    <path d="${ISLAND}" fill="none" stroke="#6b5a40" stroke-width="16" opacity=".18"/>
  </g>
  <g fill="url(#pl-mtn)" filter="url(#pl-ink)">${peaks([[640, 660, 0.7], [700, 612, 0.6], [900, 520, 1.0], [960, 470, 0.8], [1180, 290, 0.6]], 120, 70)}</g>
  <g class="pl-mark" data-id="fogsea" filter="url(#pl-fog)" fill="#9aa3a6" opacity=".9"><ellipse cx="1360" cy="110" rx="300" ry="60"/><ellipse cx="1480" cy="190" rx="220" ry="46"/>
    <ellipse cx="1240" cy="60" rx="260" ry="40"/></g>
  <rect width="1600" height="900" filter="url(#pl-grain)"/>
  <g class="pl-arrows" filter="url(#pl-ink)">${arrows(ARROWS)}</g>
  <g class="pl-labels">
    ${mark('island', 800, 470, '羊村')}
    ${mark('pasture', 620, 760, '牧場', { sq: 22 })}${mark('barns', 700, 690, '穀倉巷', { sq: 18, sm: true })}${mark('gate', 780, 630, '村門', { sq: 20, sm: true })}
    ${mark('shrine', 900, 560, '山頂廟', { sq: 22, sm: true })}${mark('posts', 720, 566, '告示', { sm: true, side: 'wolf' })}
    ${mark('market', 760, 500, '街市', { sq: 18, sm: true })}${mark('stairs', 820, 440, '樓梯巷', { sm: true })}${mark('checkpoint', 870, 390, '關卡', { sq: 18, sm: true })}
    ${mark('lookout', 940, 340, '觀景台', { sq: 18, sm: true })}${mark('beach', 1040, 300, '沙灘', { sm: true })}${mark('causeway', 1110, 262, '石堤', { sm: true })}
    ${mark('boom', 1190, 230, '鐵鎖', { sq: 16, sm: true })}${mark('lighthouse', 1262, 188, '燈塔', { sq: 20, sm: true })}${mark('pier', 980, 280, '碼頭', { sq: 18, sm: true })}
    ${mark('lanterns', 960, 246, '十二盞燈', { sm: true, side: 'sheep' })}
    <g class="pl-mark" data-id="fogsea"><text class="sm river" x="1330" y="104">霧 海</text></g>
    ${mark('grey', 690, 716, '灰牙', { sm: true, side: 'wolf' })}${mark('shadow', 866, 372, '影爪', { sm: true, side: 'wolf' })}
    ${mark('iron', 1112, 244, '鐵吻', { sm: true, side: 'wolf' })}${mark('warden', 1296, 146, '狼督', { sm: true, side: 'wolf' })}
    ${mark('gok', 596, 732, '阿角', { sm: true, side: 'sheep' })}${mark('siume', 812, 614, '小咩', { sm: true, side: 'sheep' })}
    ${mark('twelve', 700, 520, '十二勇士', { sm: true, side: 'sheep' })}
  </g>
  <rect width="1600" height="900" fill="url(#pl-vig)"/>
</svg>`;
