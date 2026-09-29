// Record an input log with the scripted driver (or any policy module) and store its reference hashes.
//   node --import ./bench/harness/register.mjs bench/harness/record.mjs --char zhaoyun --chapter ch1 --frames 7200 --out ch1-zhaoyun
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSim, encodeInput, decodeInput, rlePush } from './sim.mjs';
import { scriptedPolicy } from './drive.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const char = arg('char', 'zhaoyun'), mode = arg('mode', 'story'), chapter = arg('chapter', 'ch1'), frames = +arg('frames', 7200);
const enemies = +arg('enemies', 300), out = arg('out', `${chapter}-${char}`), every = +arg('every', 600);

const sim = await createSim({ enemies });
sim.start({ char, mode, chapter });
const policy = scriptedPolicy(), rle = [], checks = {};
for (let f = 1; f <= frames && !sim.end; f++) {
  const rec = encodeInput(policy(sim.game));
  rlePush(rle, rec);
  sim.step(decodeInput(rec));                    // step on the rounded record, exactly what replay will feed
  if (f % every === 0) checks[f] = sim.hash();
}
checks[sim.game.frame] = sim.hash();
const log = { char, mode, chapter, enemies, frames: sim.game.frame, checks, stats: sim.game.story.stats(), end: sim.end && sim.end.win, rle };
writeFileSync(resolve(import.meta.dirname, 'logs', out + '.json'), JSON.stringify(log));
console.log(out, 'frames', log.frames, 'kos', log.stats.kos, 'hp', Math.round(sim.game.hero.hp), 'end', log.end, 'runs', rle.length, 'final', checks[log.frames]);
