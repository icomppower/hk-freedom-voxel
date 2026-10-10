// 銅鑼灣 rules gate (Node, numeric): the hk7 script's set pieces on an emptied field, the hero placed by hand.
//   column    after the cue the head walks exactly 3.0 m/s; a riot officer pressed against its front (≤ 3 m) stalls it while no
//             hero is within 8 m of the head, and it never moves while stalled; a hero at its front gets it walking again
//             with the officer still there; once he is gone it walks on; at the junction it raises columnAtJunction
//   squads    a squad cuts in from each side street as the head comes level (once each)
//   lane      a marcher block steps aside after a hero stands within 2.5 m of it for 40 steps (not at 3 m); the ambulance
//             (driving in from the Admiralty end) stops 7 m short of the next block still in its path, drives on once it
//             parts, and raises ambulanceThrough at the casualty
//   node --import ./bench/harness/register.mjs bench/maps/causeway-rules.mjs
import { createSim } from '../harness/sim.mjs';
import { MAPS } from '../../src/world/map.js';
import { ST } from '../../src/crowd/crowd.js';

const sim = await createSim({ enemies: 300 }), G = sim.game, M = MAPS.causeway;
let bad = 0, n = 0;
const ok = (name, pass, info = '') => { n++; if (!pass) bad++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${info !== '' ? ` — ${info}` : ''}`); };
const idle = { mx: 0, my: 0, orbit: 0, tilt: 0, pressed: {}, held: {} };
let at = null;
const step = (k = 1) => { for (let j = 0; j < k; j++) { sim.step(idle); if (at) { G.hero.x = at[0]; G.hero.z = at[1]; G.hero.vx = G.hero.vz = 0; G.hero.hp = G.hero.hpMax; } } };
const clear = () => { for (let i = 0; i < G.crowd.N; i++) G.crowd.st[i] = 0; };
const fresh = () => { at = null; sim.start({ char: 'lungjai', mode: 'story', chapter: 'hk7' }); step(2); G.crowd.setWaves(false); clear(); };
const fx = () => G.story.fx;

// column
fresh(); at = [25, -150]; step(1);                                   // the hero off to the side (never in front of it)
G.story.cue('march');
const h0 = fx().column.head; step(60); clear();
ok('after the cue the head walks 3.0 m/s', Math.abs(fx().column.head - h0 - 3.0) < 1e-9, `${(fx().column.head - h0).toFixed(4)} m in 60 steps`);
const c = G.crowd, cop = 0;                                           // one riot officer pressed against its front
c.st[cop] = ST.IDLE; c.x[cop] = 0; c.z[cop] = fx().column.head + 2; c.hp[cop] = c.hpMax[cop] = 999;
const hs = fx().column.head, s0 = fx().column.stallT;
for (let k = 0; k < 120; k++) { step(1); c.st[cop] = ST.IDLE; c.x[cop] = 0; c.z[cop] = hs + 2; c.vx[cop] = c.vz[cop] = 0; }
ok('a riot officer 2 m in front: stalled, never moves', fx().column.head === hs && fx().column.stalled && fx().column.stallT - s0 === 120, `head ${hs.toFixed(2)} → ${fx().column.head.toFixed(2)}, stallT +${fx().column.stallT - s0}`);
const pin = (z) => { c.st[cop] = ST.IDLE; c.x[cop] = 0; c.z[cop] = z; c.vx[cop] = c.vz[cop] = 0; };   // the hero is placed after each step
at = [3, hs + 4]; for (let k = 0; k < 2; k++) { step(1); pin(fx().column.head + 2); }
ok('a hero at the front (5 m off the head): it walks on past the officer', fx().column.head > hs && !fx().column.stalled, `head ${fx().column.head.toFixed(3)}`);
at = [25, -150]; for (let k = 0; k < 2; k++) { step(1); pin(fx().column.head + 2); }
const hs2 = fx().column.head; step(1); pin(hs2 + 2);
ok('the hero gone again: stalled', fx().column.stalled && fx().column.head === hs2, `head ${hs2.toFixed(3)} → ${fx().column.head.toFixed(3)}`);
c.z[cop] = hs2 + 4.5; step(1); c.z[cop] = hs2 + 4.5;
const moved = fx().column.head > hs;
c.st[cop] = 0;
ok('4.5 m in front: not pressed against it, it walks', moved && !fx().column.stalled, `head ${fx().column.head.toFixed(3)}`);
// side streets: run the head up the road with the field kept clear, count the squads that appear near each side street
let spawned = [0, 0];
for (let k = 0; k < 60 * 130 && !G.story.flags?.columnAtJunction && fx().column.head < M.COLUMN_END; k++) {
  step(1);
  M.SIDE_STREETS.forEach(([x, z], j) => { for (let i = 0; i < c.N; i++) if (c.st[i] && Math.hypot(c.x[i] - x, c.z[i] - z) < 4) { spawned[j]++; break; } });
  clear();
}
ok('the head reaches the junction', fx().column.head === M.COLUMN_END, `${fx().column.head.toFixed(2)}`);
ok('a squad cut in from each side street', spawned[0] > 0 && spawned[1] > 0, `${spawned}`);

// lane
fresh(); at = [25, 0]; step(1);
G.story.cue('ambulance');
const L = fx().lane, A = fx().amb, far = L[L.length - 1], next = L[L.length - 2];
for (let k = 0; k < 400; k++) step(1);
ok('the ambulance stops 7 m short of the block nearest it', Math.abs(A.z - (far.z + 7)) < 1e-9, `amb ${A.z.toFixed(2)}, block ${far.z}`);
at = [far.x, far.z + 3]; step(80);
ok('a hero at 3 m: the block stays', !far.parted && far.k === 0, `k ${far.k}`);
at = [far.x, far.z + 2.2]; step(1);
let k2 = 1; while (!far.parted && k2 < 200) { step(1); k2++; }
ok('a hero at 2.2 m: the block steps aside after 40 steps', far.parted && far.k === 40, `k ${far.k} after ${k2} steps`);
at = [25, 0];
for (let k = 0; k < 400; k++) step(1);
ok('the ambulance drives on to the next block', Math.abs(A.z - (next.z + 7)) < 1e-9, `amb ${A.z.toFixed(2)}, next block ${next.z}`);
for (const b of L) if (!b.parted) b.k = 39;                          // the rest one step from parting
for (const b of L.slice(0, -1)) { at = [b.x, b.z + 2]; step(1); }
at = [25, 0]; let k3 = 0, low = A.z, back = false;
while (k3 < 1500) { step(1); k3++; low = Math.min(low, A.z); if (low <= M.AMB.z1 + 0.1 && A.z > low + 1) { back = true; break; } }
ok('all parted: it reaches the casualty, then drives back out with them', L.every((b) => b.parted) && low <= M.AMB.z1 + 0.1 && back, `closest ${low.toFixed(2)}, back out after ${k3} steps`);
console.log(bad ? `CAUSEWAY RULES FAIL ${bad}/${n}` : `CAUSEWAY RULES PASS ${n}/${n}`);
process.exit(bad ? 1 : 0);
