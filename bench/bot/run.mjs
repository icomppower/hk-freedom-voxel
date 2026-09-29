// Headless bot run: plays a chapter in the Node sim with the autoplay bot and reports the story timeline and the result.
//   node --import ./bench/harness/register.mjs bench/bot/run.mjs --char zhaoyun [--chapter ch1] [--style steady|rush|back]
//        [--minutes 30] [--diff normal] [--record name] (store the run as an input log in bench/harness/logs)
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSim, encodeInput, decodeInput, rlePush } from '../harness/sim.mjs';
import { DIFFS, setDifficulty } from '../../src/core/difficulty.js';
import { createBot } from './bot.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const char = arg('char', 'zhaoyun'), chapter = arg('chapter', 'ch1'), style = arg('style', 'steady'), minutes = +arg('minutes', 30);
const diff = DIFFS.find((d) => d.id === arg('diff', 'normal')), rec = arg('record', null), quiet = process.argv.includes('--quiet');
setDifficulty(diff);
const sim = await createSim({ enemies: 300 });
sim.trace = true;
sim.start({ char, mode: 'story', chapter });
const bot = createBot({ style }), rle = [], checks = {};
const t0 = performance.now();
let maxZ = -1e9, minHp = 1e9;
while (!sim.end && sim.game.frame < minutes * 3600) {
  const r = encodeInput(bot(sim.game));
  if (rec) rlePush(rle, r);
  sim.step(decodeInput(r));
  const h = sim.game.hero; maxZ = Math.max(maxZ, h.z); minHp = Math.min(minHp, h.hp);
  if (rec && sim.game.frame % 600 === 0) checks[sim.game.frame] = sim.hash();
}
const G = sim.game, ms = performance.now() - t0, mmss = (f) => `${Math.floor(f / 3600)}:${String(Math.floor(f / 60) % 60).padStart(2, '0')}`;
if (!quiet) for (const [fr, n, v] of sim.events) if (n === 'story:objective' || n === 'story:banner' || n === 'hero:down') console.log(`  ${mmss(fr).padStart(6)}  ${n.slice(6).padEnd(9)} ${v ?? ''}`);
const st = G.story.stats();
const res = sim.end ? (sim.end.win ? 'WIN' : 'LOSS') : 'TIMEOUT';
console.log(`${res} ${chapter} ${char} ${diff.id} ${style}: ${mmss(G.frame)} sim (${(ms / 1000).toFixed(1)} s wall) · KOs ${st.kos} · dmg ${Math.round(st.dmg)} · min hp ${Math.round(minHp)} · rank ${st.rank ?? '-'} · max z ${maxZ.toFixed(0)}`);
if (rec) {
  checks[G.frame] = sim.hash();
  writeFileSync(resolve(import.meta.dirname, '../harness/logs', rec + '.json'), JSON.stringify({ char, mode: 'story', chapter, enemies: 300, diff: diff.id, frames: G.frame, checks, stats: st, end: sim.end && sim.end.win, rle }));
  console.log(`recorded ${rec} (${rle.length} runs)`);
}
process.exit(res === 'WIN' ? 0 : 1);
