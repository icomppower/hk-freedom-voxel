// (Re)compute a log's Node reference checkpoints from a cold replay: for logs recorded in the browser, or to re-baseline
// a log after an INTENDED sim change (never to make a failing gate pass).
//   node --import ./bench/harness/register.mjs bench/harness/rehash.mjs <name>
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSim, replay } from './sim.mjs';
const file = resolve(import.meta.dirname, 'logs', process.argv[2] + '.json'), log = JSON.parse(readFileSync(file, 'utf8'));
const sim = await createSim({ enemies: log.enemies }), r = replay(sim, log);
log.checks = r.checks; log.frames = r.frames; log.stats = sim.game.story.stats(); log.end = r.end && r.end.win;
writeFileSync(file, JSON.stringify(log));
console.log(process.argv[2], 'frames', r.frames, 'kos', log.stats.kos, 'checks', Object.keys(r.checks).length, 'final', r.checks[r.frames]);
