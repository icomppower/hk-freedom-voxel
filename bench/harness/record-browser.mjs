// Record a human play session as an input log: opens a visible Chrome on the game straight into the battle, stores every
// fixed step's raw input (full precision), and when the battle ends or the window closes writes bench/harness/logs/<out>.json
// with Node reference hashes (a Node replay of the same log; see xcheck.mjs for why Chrome's own hashes differ).
//   node bench/harness/record-browser.mjs --char zhaoyun [--chapter ch1] [--out mine-zhaoyun]
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { openGame } from './browser.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const char = arg('char', 'zhaoyun'), chapter = arg('chapter', 'ch1'), out = arg('out', `human-${chapter}-${char}`);
const g = await openGame({
  headless: false, query: `?go=story&char=${char}${chapter !== 'ch1' ? '&ch=' + chapter : ''}`,
  init: () => {
    const ACTIONS = ['attack', 'charge', 'jump', 'dodge', 'musou', 'target'];
    const m = (o) => ACTIONS.reduce((s, a, k) => s | (o[a] ? 1 << k : 0), 0);
    window.__rec = [];
    window.__onStep = (inp) => { if (window.__vm.game.frame === __rec.length) __rec.push([inp.mx, inp.my, inp.orbit, inp.tilt, m(inp.pressed), m(inp.held)]); };
  },
});
console.log('recording — play, then close the window (or finish the chapter)');
let recs = [];
while (true) {
  try {
    const r = await g.page.evaluate(() => ({ recs: __rec, over: __vm.state === 'result' }));
    recs = r.recs; if (r.over) break;
  } catch { break; }                               // window closed
  await new Promise((ok) => setTimeout(ok, 1000));
}
await g.close().catch(() => {});
const rle = [];
for (const rec of recs) { const l = rle[rle.length - 1]; if (l && rec.every((v, k) => v === l[k + 1])) l[0]++; else rle.push([1, ...rec]); }
const file = resolve(import.meta.dirname, 'logs', out + '.json');
writeFileSync(file, JSON.stringify({ char, mode: 'story', chapter, enemies: 300, frames: recs.length, checks: {}, rle }));
// reference hashes from a Node replay (cold process), every 600 frames
execFileSync(process.execPath, ['--import', resolve(import.meta.dirname, 'register.mjs'), '--no-warnings', resolve(import.meta.dirname, 'rehash.mjs'), out], { stdio: 'inherit' });
