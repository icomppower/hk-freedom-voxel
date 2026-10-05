// Cross-engine determinism: the same 2P bot run (chapter, seed) in Node (V8), headless Chrome (V8, another build) and
// headless WebKit (JavaScriptCore — Safari / iOS), compared checkpoint by checkpoint (every 600 frames + the final one).
//   node --import ./bench/harness/register.mjs bench/net/xengine.mjs [chapter] [seed] [--native]
// --native: without src/core/dmath.js (shows where the engines part on their own Math).
import { chromium, webkit } from 'playwright-core';
import { serve } from '../harness/browser.mjs';
const native = process.argv.includes('--native');
const [chapter = 'hk1', seed = '1'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!native) (await import('../../src/core/dmath.js')).install();
const { createCoopGameRaw } = await import('./simkit-raw.mjs');
const g = await createCoopGameRaw();
g.start({ chars: ['lungjai', 'siumei'], chapter, seed: +seed });
const node = {};
while (!g.end && g.game.frame < 40 * 3600) { g.step([null, null]); if (g.game.frame % 600 === 0) node[g.game.frame] = g.hash(); }
node[g.game.frame] = g.hash();
const srv = await serve();
const res = { node: { out: node, win: g.end?.win, frame: g.game.frame } };
for (const [name, type, opt] of [['chrome', chromium, { channel: 'chrome' }], ['webkit', webkit, {}]]) {
  const b = await type.launch({ headless: true, ...opt }), p = await b.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(`${srv.url}bench/net/xengine.html?ch=${chapter}&seed=${seed}${native ? '&native' : ''}`);
  await p.waitForFunction(() => window.__res, null, { timeout: 900000, polling: 1000 }).catch(() => {});
  res[name] = await p.evaluate(() => window.__res);
  if (errs.length) console.log(name, 'errors', errs.slice(0, 3));
  await b.close();
}
srv.close();
const keys = Object.keys(node);
let ok = true;
for (const name of ['chrome', 'webkit']) {
  const r = res[name];
  if (!r) { console.log(`FAIL ${name}: no result`); ok = false; continue; }
  const first = keys.find((k) => r.out[k] !== node[k]);
  const same = keys.filter((k) => r.out[k] === node[k]).length;
  if (first) ok = false;
  console.log(`${first ? 'FAIL' : 'ok  '} ${chapter} seed ${seed} ${native ? 'native Math' : 'dmath'}: node vs ${name} ${same}/${keys.length} checkpoints equal${first ? ' (first diff at frame ≤ ' + first + ')' : ''} · frames ${res.node.frame} / ${r.frame} · win ${res.node.win} / ${r.win} · final ${node[keys.at(-1)]} / ${r.out[keys.at(-1)] ?? r.out[r.frame]}`);
}
process.exit(ok ? 0 : 1);
