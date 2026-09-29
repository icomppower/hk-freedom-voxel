// Map gate (workflow step 6), headless: the bot plays the chapter; every sim step every live soldier (and the hero) must
// have finite coordinates, standing soldiers stay on walkable ground (walk value ≥ −1.25 m: the crowd clamps with a −0.5 m pad, the
// field's edge wobbles ±0.5 m between grid nodes) and never move
// more than 3 m in one step (a teleport) unless it just (re)spawned; every map gate must end the run open, with the hero
// having passed its line (reachable); the chapter must be won.
//   node --import ./bench/harness/register.mjs bench/maps/mapcheck.mjs sheep1 [char]
import { createSim, encodeInput, decodeInput } from '../harness/sim.mjs';
import { createBot } from '../bot/bot.mjs';
import { GATES, walkIn, MAP } from '../../src/world/map.js';

const chapter = process.argv[2] || 'sheep1', char = process.argv[3] || 'gok';
const sim = await createSim({ enemies: 300 }), G = sim.game, c = G.crowd;
sim.start({ char, mode: 'story', chapter });
const bot = createBot(), px = new Float64Array(c.T), pz = new Float64Array(c.T), was = new Int32Array(c.T), prevSt = new Int32Array(c.T);
let nan = 0, off = 0, tele = 0, worstOff = 0, worstTele = 0, hz = -1e9;
const passed = {};
while (!sim.end && G.frame < 30 * 3600) {
  sim.step(decodeInput(encodeInput(bot(G))));
  const h = G.hero;
  if (!Number.isFinite(h.x + h.z)) nan++;
  hz = Math.max(hz, h.z);
  for (const [id, g] of Object.entries(GATES)) if (h.z > g.rect[3] && h.x > g.rect[0] - 2 && h.x < g.rect[2] + 2) passed[id] = true;
  for (let i = 0; i < c.T; i++) {
    const s = c.st[i];
    if (!s) { was[i] = 0; prevSt[i] = 0; continue; }
    if (prevSt[i] === 10 && s !== 10) was[i] = 0;                    // a KO'd slot re-spawned elsewhere (not a teleport)
    prevSt[i] = s;
    if (!Number.isFinite(c.x[i] + c.z[i])) { nan++; continue; }
    const w = walkIn(c.x[i], c.z[i]);
    if (w < -1.25 && s >= 1 && s <= 4) { off++; worstOff = Math.min(worstOff, w); if (process.env.MAPDBG) console.log('off', G.frame, i, s, c.x[i].toFixed(2), c.z[i].toFixed(2), w.toFixed(3), 'type', c.type[i], 'hero', G.hero.state, G.hero.move, G.musou.active); }   // standing soldiers (a tumbling body may cross the edge for a frame)
    if (was[i]) { const d = Math.hypot(c.x[i] - px[i], c.z[i] - pz[i]); if (d > 3) { tele++; worstTele = Math.max(worstTele, d); } }
    px[i] = c.x[i]; pz[i] = c.z[i]; was[i] = 1;
  }
}
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
ok('no NaN positions', nan === 0, `${nan}`);
ok('standing soldiers stay on walkable ground (≥ −1.25 m)', off === 0, `${off} soldier-steps off, worst ${worstOff.toFixed(2)} m`);
ok('no teleport > 3 m / step', tele === 0, `${tele}, worst ${worstTele.toFixed(2)} m`);
for (const id of Object.keys(GATES)) ok(`gate ${id} reachable (hero crossed it)`, !!passed[id]);
ok(`chapter won (${MAP.id})`, !!(sim.end && sim.end.win), `${(G.frame / 60).toFixed(0)} s`);
console.log(res.every(Boolean) ? `MAP PASS ${res.length}/${res.length}` : 'MAP FAIL');
process.exit(res.every(Boolean) ? 0 : 1);
