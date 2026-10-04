// Determinism probe for src/core/dmath.js: the same ch1 input log replayed in Node and in headless Chrome, both with the
// deterministic Math installed (?dmath in the page), compared checkpoint by checkpoint. Natively the two V8 builds part at
// frame 17 (bench/harness/xcheck.mjs header); with dmath every checkpoint must match.
//   node bench/net/xmath.mjs [log] [frames]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { install } from '../../src/core/dmath.js';
install();
const { createSim, replay } = await import('../harness/sim.mjs');
const { openGame } = await import('../harness/browser.mjs');
const name = process.argv[2] || 'ch1-zhaoyun', upto = +(process.argv[3] || 3600);
const log = JSON.parse(readFileSync(resolve(import.meta.dirname, '../harness/logs', name + '.json'), 'utf8'));
const recs = []; for (const [n, ...r] of log.rle) for (let k = 0; k < n && recs.length < upto; k++) recs.push(r);
const cut = { ...log, rle: recs.map((r) => [1, ...r]) };
const sim = await createSim({ enemies: log.enemies });
const node = replay(sim, cut, { checkEvery: 300 }).checks;
const keys = Object.keys(node).map(Number);
const g = await openGame({
  query: `?dmath&go=${log.mode}&char=${log.char}`,
  initArg: { recs, keys },
  init: ({ recs, keys }) => {
    const ACTIONS = ['attack', 'charge', 'jump', 'dodge', 'musou', 'target'];
    window.__xc = { out: {}, done: false };
    import('/bench/harness/sim.mjs').then((m) => { window.__hash = m.stateHash; });
    window.__onStep = (inp) => {
      const G = window.__vm.game, f = G.frame;
      if (keys.includes(f) && !(f in __xc.out)) __xc.out[f] = window.__hash ? __hash(G) : 'nohash';
      const r = recs[f];
      if (!r) { __xc.out[f] = __hash(G); __xc.done = true; return; }
      Object.assign(inp, { mx: r[0], my: r[1], orbit: r[2], tilt: r[3] });
      ACTIONS.forEach((a, k) => { inp.pressed[a] = !!(r[4] & (1 << k)); inp.held[a] = !!(r[5] & (1 << k)); });
    };
  },
});
await g.page.waitForFunction(() => window.__xc.done, null, { timeout: 600000, polling: 500 });
const res = await g.page.evaluate(() => ({ out: window.__xc.out, dm: !!window.__dmath }));
await g.close();
const same = keys.filter((k) => res.out[k] === node[k]);
const first = keys.find((k) => res.out[k] !== node[k]);
console.log(`${same.length === keys.length ? 'ok  ' : 'FAIL'} ${name} dmath ${res.dm}: ${same.length}/${keys.length} Node = Chrome checkpoints (to frame ${upto}; final node ${node[keys.at(-1)]} chrome ${res.out[keys.at(-1)]})${first ? ' first diff @' + first : ''}`, g.errors.slice(0, 3));
process.exit(same.length === keys.length ? 0 : 1);
