// Cross-battle carry-over (CLAUDE.md: "some state carries from one battle to the next inside one page load"): a co-op
// battle must not depend on what this page ran before, or a peer with another history (a solo battle first, a second
// chapter in the same room, a reload) desyncs. Runs `before` battles first, then the probe battle, and prints its hashes;
// compares against a cold process running the probe alone (with no `before`: prints the cold hashes only).
//   node --import ./bench/harness/register.mjs bench/net/carry.mjs [probe chapter] [frames] [before chapter …]
import { createCoopGame } from './simkit.mjs';
const [probe = 'hk1', frames = '3000', ...before] = process.argv.slice(2);
const g = createCoopGame(), G = g.game;
for (const ch of before) { g.start({ chars: ['siumei', 'lungjai'], chapter: ch, seed: 77 }); while (!g.end && G.frame < +frames) g.step([null, null]); }
g.start({ chars: ['lungjai', 'siumei'], chapter: probe, seed: 5 });
const out = [];
while (G.frame < +frames && !g.end) { g.step([null, null]); if (G.frame % 600 === 0) out.push(g.hash()); }
const line = out.join(' ');
if (!before.length) { console.log(line); process.exit(0); }
// the same probe in a cold process
const { execFileSync } = await import('node:child_process');
const cold = execFileSync(process.execPath, ['--import', './bench/harness/register.mjs', '--no-warnings', 'bench/net/carry.mjs', probe, frames], { cwd: new URL('../..', import.meta.url).pathname }).toString().trim().split('\n').at(-1);
const ok = cold === line;
console.log(`${ok ? 'ok  ' : 'FAIL'} ${probe} after [${before.join(' ')}] = cold: ${line}${ok ? '' : ' vs cold ' + cold}`);
process.exit(ok ? 0 : 1);
