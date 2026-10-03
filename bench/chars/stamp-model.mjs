// 777 model gate (backlog C2: 777 is a woman): numeric checks on the STAMP officer model's box lists, no screenshots.
// A knee skirt on the hips, a chin-length bob, a U of pearls (every bead wider than tall — no vertical bar, never a
// cross), no tie, no gold chain; the stamp hammer, its crack / break states and the 1.1× scale exactly as before.
//   node --import ./bench/harness/register.mjs bench/chars/stamp-model.mjs
import { STAMP } from '../../src/chars/officers/hk/models.js';

const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
const P = STAMP.parts, col = (q) => (typeof q.c === 'function' ? q.c(0, -0.2, 0, 0, 0, 0) : q.c);
const skirt = P.hips.filter((q) => q.a[1] <= -0.45 && q.b[1] >= 0);
ok('knee skirt on the hips (reaches ≤ −0.45 m below the waist)', skirt.length === 1, skirt.map((q) => q.a[1]).join());
ok('thighs in the suit colour (read as the skirt)', P.thigh.every((q) => q.c === col(skirt[0] || {})));
ok('lower legs not trouser-coloured (stockings)', P.shin[0].c !== P.thigh[0].c, P.shin[0].c.toString(16));
const hair = P.head.filter((q) => q.c === 0xc8ccd0);
ok('silver bob reaches the chin (sides down to y ≤ 0.05)', hair.some((q) => q.a[1] <= 0.05 && Math.abs(q.a[0]) > 0.09), `${hair.length} hair boxes`);
const pearls = P.torso.filter((q) => q.c === 0xf2eee4);
ok('pearls: a U of 6 beads', pearls.length === 6 && pearls[0].a[1] > pearls[2].a[1], `${pearls.length}`);
ok('pearls: every bead wider than tall (no vertical bar: never a cross)', pearls.every((q) => q.b[0] - q.a[0] >= q.b[1] - q.a[1]));
ok('no tie (no narrow vertical strip on the chest)', !P.torso.some((q) => q.b[0] - q.a[0] <= 0.05 && q.b[1] - q.a[1] > 0.2 && q.b[2] > 0.1));
ok('no gold chain', !P.torso.some((q) => q.c === 0xd8b040));
ok('scale 1.26 (1.1× hero), tip 1.45, kneels', STAMP.scale === 1.26 && STAMP.tip === 1.45 && STAMP.kneel === true);
ok('stamp hammer + cracked + broken states kept', STAMP.weapon.length === 6 && STAMP.cracked.length === 9 && STAMP.crackAt === 0.25 && STAMP.broken.head.length === 3);
const pass = res.every(Boolean);
console.log(pass ? `STAMP MODEL PASS ${res.length}/${res.length}` : 'STAMP MODEL FAIL');
process.exit(pass ? 0 : 1);
