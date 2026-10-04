// One 烽火戰 battle in the Node sim with the autoplay bot (cold process: one battle per process, like a page load).
//   node --import ./bench/harness/register.mjs bench/fenghuo/run.mjs --char lungjai --chapter hk1 --style steady --seed 7 [--diff normal]
//        [--cards B01,D02 | none] (force a hand instead of the seed's draw) [--goal N] [--time s] [--hash] (print the final state hash)
// Prints one JSON line: { seed, char, chapter, style, cards, win, kos, time, left, dmg, rank, hash? }.
import { createSim, encodeInput, decodeInput } from '../harness/sim.mjs';
import { DIFFS, setDifficulty } from '../../src/core/difficulty.js';
import { createBot } from '../bot/bot.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const char = arg('char', 'lungjai'), chapter = arg('chapter', 'hk1'), style = arg('style', 'steady'), seed = +arg('seed', 1);
setDifficulty(DIFFS.find((d) => d.id === arg('diff', 'normal')));
const sim = await createSim({ enemies: 300 });
const force = arg('cards', null);
sim.start({ char, mode: 'fenghuo', chapter, seed, cards: force ? (force === 'none' ? [] : force.split(',')) : undefined });
if (arg('goal', null)) sim.game.fh.goal = +arg('goal');
if (arg('time', null)) sim.game.fh.left = Math.max(60, (+arg('time') + sim.game.fh.mods.timer) * 60);   // a shorter clock (the card timer still applies)   // calibration: a goal out of reach measures the K.O. pace
const bot = createBot({ style });
while (!sim.end && sim.game.frame < 8 * 3600) sim.step(decodeInput(encodeInput(bot(sim.game))));
const G = sim.game, s = sim.end ? sim.end.stats : G.fh.stats();
console.log(JSON.stringify({ seed, char, chapter, style, cards: G.fh.cards.map((c) => c.id), win: !!(sim.end && sim.end.win), end: !!sim.end,
  kos: s.kos, time: s.time, died: G.hero.dead, left: s.fenghuo.left, dmg: Math.round(s.dmg), rank: s.rank ?? null, ...(process.argv.includes('--hash') ? { hash: sim.hash() } : {}) }));
