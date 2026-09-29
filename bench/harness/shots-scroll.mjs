// Scroll player gate: screenshot every card of a chapter's scroll (prologue, or ending with --ending) with CSS animations
// and transitions frozen at their end state, then the stamp. --save writes the reference set to bench/harness/ref/<name>/
// (local, gitignored) and its SHA-256s to bench/harness/scroll-refs.json (committed); without --save, each frame must hash
// the same as its reference, and where it doesn't and the local PNG exists, the differing pixels are counted.
//   node bench/harness/shots-scroll.mjs ch1 [--char zhaoyun] [--ending] [--save] [--out dir]
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { openGame } from './browser.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const chapter = process.argv[2] || 'ch1', char = arg('char', 'zhaoyun'), ending = process.argv.includes('--ending'), save = process.argv.includes('--save');
const name = `${chapter}-${char}${ending ? '-ending' : ''}`;
const ref = resolve(import.meta.dirname, 'ref', name), out = resolve(arg('out', resolve(import.meta.dirname, '../out/scroll')), name);
mkdirSync(save ? ref : out, { recursive: true });

const g = await openGame({});
const P = g.page, wait = (ms) => P.waitForTimeout(ms);
await wait(2500);
// hide the live 3D field behind the scroll (its fires animate on wall-clock time): only the DOM scroll is compared
await P.addStyleTag({ content: 'canvas#c { visibility: hidden !important; } #hud { display: none !important; }' });
await P.evaluate(({ chapter, char, ending }) => __vm.flow.go(ending ? 'ending' : 'prologue', { mode: 'story', char, chapter, win: true }), { chapter, char, ending });
const sel = ending ? '#ending' : '#prologue';
await wait(1600);
const shots = [];
for (let k = 0; k < 12; k++) {
  const n = await P.evaluate((sel) => document.querySelectorAll(`${sel} .pl-pips b`).length, sel);
  const stamped = await P.evaluate((sel) => document.querySelector(sel)?.classList.contains('stamped'), sel);
  await wait(900);                                                  // card swap (380 ms) + first reveal frames
  const buf = await P.screenshot({ animations: 'disabled' });
  shots.push(buf);
  if (stamped || (n && k >= n)) break;
  await P.keyboard.down('Enter'); await wait(60); await P.keyboard.up('Enter');   // tap: next card (last tap: the stamp)
  await wait(500);
}
const RJ = resolve(import.meta.dirname, 'scroll-refs.json'), refs = existsSync(RJ) ? JSON.parse(readFileSync(RJ, 'utf8')) : {};
// hash of the decoded RGBA pixels (PNG bytes are not stable run to run even when every pixel is)
const pixelHash = (b) => P.evaluate(async (s) => {
  const im = new Image(); im.src = 'data:image/png;base64,' + s; await im.decode();
  const c = new OffscreenCanvas(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const d = await crypto.subtle.digest('SHA-256', x.getImageData(0, 0, im.width, im.height).data);
  return [...new Uint8Array(d)].slice(0, 8).map((v) => v.toString(16).padStart(2, '0')).join('');
}, b.toString('base64'));
const hashes = [];
for (const b of shots) hashes.push(await pixelHash(b));
const sha = (b) => hashes[shots.indexOf(b)];
let bad = 0;
if (save) refs[name] = shots.map(sha);
else if (!refs[name] || refs[name].length !== shots.length) { console.log(`  frame count ${shots.length} vs reference ${refs[name]?.length}`); bad++; }
for (let k = 0; k < shots.length; k++) {
  const f = `${String(k).padStart(2, '0')}.png`;
  if (save) { writeFileSync(resolve(ref, f), shots[k]); continue; }
  writeFileSync(resolve(out, f), shots[k]);
  if (refs[name] && sha(shots[k]) === refs[name][k]) { console.log(`  ${f}: identical`); continue; }
  const rf = resolve(ref, f);
  if (!existsSync(rf)) { console.log(`  ${f}: hash differs (no local reference PNG to diff)`); bad++; continue; }
  const a = readFileSync(rf), b = shots[k];
  let diff = 1;
  if (!a.equals(b)) diff = await P.evaluate(async ({ a, b }) => {
    const load = async (s) => { const im = new Image(); im.src = 'data:image/png;base64,' + s; await im.decode(); const c = new OffscreenCanvas(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, im.width, im.height).data; };
    const A = await load(a), B = await load(b); let n = 0;
    for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 6) n++;
    return n;
  }, { a: a.toString('base64'), b: b.toString('base64') });
  console.log(`  ${f}: ${diff ? diff + ' px differ' : 'identical'}`);
  if (diff) bad++;
}
if (save) writeFileSync(RJ, JSON.stringify(refs, null, 1));
console.log(save ? `${name}: saved ${shots.length} reference frames` : `${bad ? 'FAIL' : 'ok  '} ${name}: ${shots.length - bad}/${shots.length} frames identical`, g.errors.slice(0, 3));
await g.close();
process.exit(bad && !save ? 1 : 0);
