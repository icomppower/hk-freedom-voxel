// Gate: replay every stored log and compare each checkpoint hash with the recorded one. Exit 1 on any mismatch.
// Each log replays in a fresh process (= a fresh page load): some engine state (squad tables, per-slot leftovers) carries
// from one battle into the next within a page, exactly as in the browser, so a log is only reproducible from a cold start.
//   node --import ./bench/harness/register.mjs bench/harness/check.mjs [name-filter]
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createSim, replay } from './sim.mjs';

const dir = resolve(import.meta.dirname, 'logs');
if (process.argv[2] === '--one') {
  const f = process.argv[3], log = JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
  const sim = await createSim({ enemies: log.enemies });
  const t0 = performance.now(), r = replay(sim, log);
  const keys = Object.keys(log.checks), miss = keys.filter((k) => r.checks[k] !== log.checks[k]);
  const us = (performance.now() - t0) / r.frames * 1000;
  console.log(`${miss.length ? 'FAIL' : 'ok  '} ${f.padEnd(30)} ${String(r.frames).padStart(6)} f  ${String(keys.length).padStart(3)} checks  final ${r.checks[r.frames]}  kos ${sim.game.hero.kos}  ${us.toFixed(0)} µs/step${miss.length ? '  first diff @' + miss[0] : ''}`);
  process.exit(miss.length ? 1 : 0);
}
const filt = process.argv[2] || '';
const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f.includes(filt)).sort();
let bad = 0;
for (const f of files) {
  try { process.stdout.write(execFileSync(process.execPath, [...process.execArgv, import.meta.filename, '--one', f], { encoding: 'utf8' })); }
  catch (e) { process.stdout.write(e.stdout || String(e)); bad++; }
}
console.log(bad ? `GATE FAIL: ${bad}/${files.length} logs diverged` : `GATE PASS: ${files.length}/${files.length} logs identical`);
process.exit(bad ? 1 : 0);
