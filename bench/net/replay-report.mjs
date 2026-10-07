// Replay a desync report: fetch a room's uploaded dumps (POST /api/report/CODE from src/net/page.js onDesync), re-run the
// merged frames in Node with the deterministic Math, and say which client left the true path and at which checkpoint.
//   node --import ./bench/harness/register.mjs bench/net/replay-report.mjs CODE [--server URL] [--file dump.json]
//   (no CODE: list the stored reports)
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createCoopGame } from './simkit.mjs';
const { decodeIn } = await import('../../src/net/codec.js');
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const server = opt('server', 'https://hk-freedom-coop.icomppower.workers.dev'), code = argv.find((a) => /^[A-Za-z]{4}$/.test(a));
let dumps = [];
if (opt('file')) dumps = [JSON.parse(readFileSync(opt('file'), 'utf8')).dump ?? JSON.parse(readFileSync(opt('file'), 'utf8'))];
else if (!code) { console.log(await (await fetch(`${server}/api/report`)).text()); process.exit(0); }
else {
  const reps = await (await fetch(`${server}/api/report/${code.toUpperCase()}`)).json();
  for (const r of reps) { const b = JSON.parse(r.body); dumps.push({ ...JSON.parse(gunzipSync(Buffer.from(b.gz, 'base64')).toString()), at: r.at }); }
}
if (!dumps.length) { console.log('no reports'); process.exit(1); }
for (const d of dumps) console.log(`client you=${d.you} ver ${d.ver} touch ${d.touch} simT ${d.simT} frames ${d.frames.length} desync @${d.t} server h ${JSON.stringify(d.h)}\n  ${d.ua}`);
const d0 = dumps.reduce((a, b) => (b.frames.length > a.frames.length ? b : a));
const g = createCoopGame(), G = g.game;
g.start({ chars: d0.chars, chapter: d0.chapter, seed: d0.seed });
const node = {};
for (let t = 0; t < d0.frames.length; t++) {
  const f = d0.frames[t];
  g.step([f[0] && decodeIn(f[0]), f[1] && decodeIn(f[1])]);
  if (G.frame % 120 === 0) node[G.frame] = g.hash();
}
// frames agree between the dumps?
for (const d of dumps) if (d !== d0) { const n = Math.min(d.frames.length, d0.frames.length); const bad = d.frames.slice(0, n).findIndex((f, i) => JSON.stringify(f) !== JSON.stringify(d0.frames[i])); console.log(`frames you=${d.you} vs you=${d0.you}: ${bad < 0 ? `identical (first ${n})` : `DIFFER from tick ${bad}`}`); }
for (const d of dumps) {
  const ks = Object.keys(d.hashes).map(Number).sort((a, b) => a - b).filter((k) => k in node);
  const first = ks.find((k) => d.hashes[k] !== node[k]);
  console.log(`you=${d.you}: ${ks.length} hashes vs Node replay · ${first === undefined ? 'all equal (this client stayed on the true path)' : `first differs at tick ${first} (client ${d.hashes[first]} vs node ${node[first]})`}`);
}
