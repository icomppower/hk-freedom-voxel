// Chrome gate: drive the real page (Chrome, rendering on) with a stored input log through the step hook, installed before
// the page's own scripts so it runs from frame 0 of a fresh page, and compare the in-browser state hashes with the log's
// Chrome checkpoints (checksChrome; --save records them). Node and Chrome do NOT agree bit for bit: their V8 builds round
// trig (atan2 / sin / cos) differently in the last ulp (seen at frame 17 of ch1-zhaoyun: an ally's yaw), so each runtime
// has its own reference hashes. Node is the primary gate (check.mjs); this one proves the rendered game matches too.
//   node bench/harness/xcheck.mjs ch1-zhaoyun [frames] [--save]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openGame } from './browser.mjs';

import { writeFileSync } from 'node:fs';
const name = process.argv[2] || 'ch1-zhaoyun', upto = +(process.argv[3] || 3600), save = process.argv.includes('--save');
const file = resolve(import.meta.dirname, 'logs', name + '.json'), log = JSON.parse(readFileSync(file, 'utf8'));
const recs = []; for (const [n, ...r] of log.rle) for (let k = 0; k < n && recs.length < upto; k++) recs.push(r);
const keys = Object.keys(log.checks).filter((k) => +k <= recs.length);
const g = await openGame({
  query: `?go=${log.mode}&char=${log.char}`,
  initArg: { recs, keys },
  init: ({ recs, keys }) => {
    const ACTIONS = ['attack', 'charge', 'jump', 'dodge', 'musou', 'target'];
    window.__xc = { out: {}, done: false };
    import('/bench/harness/sim.mjs').then((m) => { window.__hash = m.stateHash; });
    window.__onStep = (inp) => {
      const G = window.__vm.game, f = G.frame;
      if (keys.includes(String(f)) && !(f in __xc.out)) __xc.out[f] = window.__hash ? __hash(G) : 'nohash';
      const r = recs[f];
      if (!r) { __xc.done = true; return; }
      Object.assign(inp, { mx: r[0], my: r[1], orbit: r[2], tilt: r[3] });
      ACTIONS.forEach((a, k) => { inp.pressed[a] = !!(r[4] & (1 << k)); inp.held[a] = !!(r[5] & (1 << k)); });
    };
  },
});
await g.page.waitForFunction(() => window.__xc.done, null, { timeout: 600000, polling: 500 });
const res = await g.page.evaluate(() => __xc.out);
await g.close();
if (save) { log.checksChrome = res; writeFileSync(file, JSON.stringify(log)); console.log(`${name}: saved ${keys.length} Chrome checkpoints`, g.errors.slice(0, 3)); process.exit(0); }
const ref = log.checksChrome || {}, same = keys.filter((k) => res[k] === ref[k]).length;
console.log(`${same === keys.length ? 'ok  ' : 'FAIL'} ${name}: ${same}/${keys.length} Chrome checkpoints match`, g.errors.slice(0, 3));
process.exit(same === keys.length ? 0 : 1);
