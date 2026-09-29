// Cutscene look gate (Node): every cutscene actor against the shipped in-game model — same palette, same head, same
// weapon. 龍仔 / 小美 are built by the same kit.model(rig) the battle uses (compared mesh by mesh: vertex count + colour set);
// 龍仔's 'hat' head = the shipped head exactly; 'nohat' / 'bare' and the loose hat / mask use only colours of the shipped
// head (+ the smile's two skin shades); the box figures' heads = their crowd skin's head boxes and palette colours.
//   node --import ./bench/harness/register.mjs bench/chars/cut-look.mjs
import * as THREE from 'three';
import { createRig } from '../../src/hero/rig.js';
import { vox, HV } from '../../src/hero/model.js';
import { CHARS } from '../../src/chars/index.js';
import { head, LC } from '../../src/chars/lungjai/model.js';
import { headVariant, looseHat, looseMask } from '../../src/chars/lungjai/heads.js';
import { SKINS } from '../../src/chars/officers/index.js';
import { shade } from '../../src/core/voxel.js';
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
const cols = (g) => { const a = g.attributes.color.array, s = new Set(); for (let i = 0; i < a.length; i += 3) s.add(`${a[i].toFixed(3)},${a[i + 1].toFixed(3)},${a[i + 2].toFixed(3)}`); return s; };
const sig = (m) => `${m.geometry.attributes.position.count}:${[...cols(m.geometry)].sort().join('|').length}`;
for (const id of ['lungjai', 'siumei']) {
  const K = CHARS[id].kit, a = K.model(createRig()), b = K.model(createRig());   // battle build vs cutscene build (same call path)
  const names = Object.keys(a.meshes), diff = names.filter((n) => sig(a.meshes[n]) !== sig(b.meshes[n]));
  ok(`${id}: cutscene model = in-game model (${names.length} meshes incl. weapons)`, !diff.length, diff.join(' '));
}
const shipped = vox(head(), HV, { off: [-0.5, 0, 0], jitter: 0.04 }), hatHead = vox(headVariant('hat'), HV, { off: [-0.5, 0, 0], jitter: 0.04 });
ok('龍仔 head variant "hat" = the shipped head', shipped.attributes.position.count === hatHead.attributes.position.count && [...cols(shipped)].sort().join() === [...cols(hatHead)].sort().join());
const base = new Set(head().map((q) => (typeof q.c === 'number' ? q.c : null)).filter((c) => c != null));
const extra = new Set([shade(LC.skin, 0.45), shade(LC.skin, 0.55)]);
for (const v of ['nohat', 'bare']) {
  const bad = headVariant(v).filter((q) => typeof q.c === 'number' && !base.has(q.c) && !extra.has(q.c));
  ok(`龍仔 head "${v}": only shipped head colours (+ smile)`, !bad.length, `${headVariant(v).length} boxes, ${bad.length} foreign`);
}
ok('loose hat / mask are meshed from the removed head boxes', looseHat().attributes.position.count > 0 && looseMask().attributes.position.count > 0);
for (const k of ['blackbloc', 'white', 'civil']) {
  const S = SKINS[k], hb = S.head(S.palette, false, (a2, b2, c) => ({ a: a2, b: b2, c })), pal = new Set(Object.values(S.palette));
  const off = hb.filter((q) => typeof q.c === 'number' && !pal.has(q.c) && !(q.c <= 0x3a3a3a || q.c === 0x9ed8f0));
  ok(`box figure (${k}): head = the skin's head boxes (${hb.length}), palette colours`, hb.length > 3 && off.length <= 2, `${off.length} non-palette accents`);
}
const pass = res.every(Boolean);
console.log(pass ? `CUT LOOK PASS ${res.length}/${res.length} (P1 0)` : 'CUT LOOK FAIL');
process.exit(pass ? 0 : 1);
