// 中大二號橋 rules gate (Node, numeric): the hk6 script's set pieces on an emptied field, the hero still and placed by hand.
//   cone      a live canister: a hero at 3 m leaves it live; at 1.5 m it is coned and its haze stops growing
//   water     coned + the hero within 2.2 m: out after 45 water steps, putOut counts it, the haze clears to 0
//   burn      a canister left alone burns out ('spent') 18 s after it lands and its haze clears
//   sting     a hero inside a full cloud loses 1 HP per 20 steps; outside it, none
//   barricade after the cue: + 1 / 1500 per step while a hero is within 12 m of it (25 s), nothing at 15 m; at 1 the
//             flag 'barricadeUp'
//   node --import ./bench/harness/register.mjs bench/maps/cuhk-rules.mjs
import { createSim } from '../harness/sim.mjs';
import { MAPS } from '../../src/world/map.js';

const sim = await createSim({ enemies: 300 }), G = sim.game;
let bad = 0, n = 0;
const ok = (name, pass, info = '') => { n++; if (!pass) bad++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${info !== '' ? ` — ${info}` : ''}`); };
const idle = { mx: 0, my: 0, orbit: 0, tilt: 0, pressed: {}, held: {} };
let at = null;
const step = (k = 1) => { for (let j = 0; j < k; j++) { sim.step(idle); if (at) { G.hero.x = at[0]; G.hero.z = at[1]; G.hero.vx = G.hero.vz = 0; } } };
const fresh = () => {
  at = null;
  sim.start({ char: 'lungjai', mode: 'story', chapter: 'hk6' });
  step(2);
  G.crowd.setWaves(false);
  for (let i = 0; i < G.crowd.N; i++) G.crowd.st[i] = 0;              // an empty field: nothing reaches the still hero
};
const fx = () => G.story.fx;
const put = (x, z) => { at = [x, z]; step(1); };
/** A canister that has just landed (story clock: fx ages it from its own t). */
/** A canister that has just landed (the caller sets its t; age is recomputed from the story clock every step). */
const land = (x, z) => { fx().gas.push({ x, z, t: 0, age: 0, state: 'live', haze: 0, water: 0 }); return fx().gas.at(-1); };

// cone + water
fresh(); put(0, -160);
let g = land(3, -160); g.t = G.frame - 2;                             // story t runs 2 behind the frame (the settle steps)
step(30);
ok('hero at 3 m: the canister stays live, its haze grows', g.state === 'live' && g.haze > 0, `${g.state}, haze ${g.haze.toFixed(3)}`);
put(1.5, -160); step(1);                                             // placed after the step: the script sees him on the next one
ok('hero at 1.5 m: a cone drops over it', g.state === 'coned', g.state);
const h0 = g.haze; step(10);
ok('coned: the haze stops growing', g.haze === h0, `${h0.toFixed(3)} → ${g.haze.toFixed(3)}`);
let k = 0; while (g.state === 'coned' && k < 200) { step(1); k++; }
ok('water: out after 45 water steps beside it', g.state === 'out' && g.water === 45, `water ${g.water} (${k + 11} steps coned)`);
ok('putOut counts it', fx().putOut === 1, `${fx().putOut}`);
step(120);
ok('out: the haze clears to 0', g.haze === 0, g.haze.toFixed(3));

// burn-out
fresh(); put(0, -166);
g = land(12, -140); g.t = G.frame - 2;
let burnt = -1;
for (let s = 0; s < 20 * 60 && burnt < 0; s++) { step(1); if (g.state === 'spent') burnt = g.age; }
ok('left alone: spent 18 s after landing', burnt === 18 * 60 + 1, `at age ${burnt}`);
step(100);
ok('spent: the haze clears', g.haze === 0, g.haze.toFixed(3));

// sting
fresh(); put(0, -160);
g = land(0, -156.5); g.t = G.frame - 2;
G.hero.hp = 400;
for (let s = 0; s < 200; s++) { g.haze = 1; G.hero.iframes = 0; step(1); }
ok('inside a full cloud (3.5 m of 4.5): 1 HP per 20 steps', G.hero.hp === 390, `400 → ${G.hero.hp} in 200 steps`);
put(0, -150); G.hero.hp = 400;
for (let s = 0; s < 200; s++) { g.haze = 1; step(1); }
ok('outside it (6.5 m): no sting', G.hero.hp === 400, `${G.hero.hp}`);

// barricade
fresh();
const R = MAPS.cuhk.BARRICADE, bx = (R[0] + R[2]) / 2, bz = (R[1] + R[3]) / 2;
put(bx, bz - 11.5); step(60);
ok('before the cue: nothing', fx().barricade === 0, `${fx().barricade}`);
G.story.cue('barricade');
step(600);
ok('within 12 m: + 1 / 1500 per step', Math.abs(fx().barricade - 600 / 1500) < 1e-9, `${(fx().barricade * 1500).toFixed(1)} / 1500 after 600 steps`);
put(bx, bz - 15); const b0 = fx().barricade; step(300);
ok('at 15 m: no progress', fx().barricade === b0, `${b0.toFixed(4)} → ${fx().barricade.toFixed(4)}`);
put(bx, bz); let s2 = 0; while (fx().barricade < 1 && s2 < 2000) { step(1); s2++; }
step(1);
ok('reaches 1 → flag barricadeUp', fx().barricade === 1 && G.story.stats && true, `full after ${s2} more steps`);
console.log(bad ? `CUHK RULES FAIL ${bad}/${n}` : `CUHK RULES PASS ${n}/${n}`);
process.exit(bad ? 1 : 0);
