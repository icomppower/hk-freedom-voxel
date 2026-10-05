// 2P rules gate (Node, both heroes on bot autoplay, hk1): numeric asserts on the brief's co-op rules.
//   revive     hero 2 knocked down at frame 600 → the partner (co-op bot: walks over, holds interact) revives him after
//              exactly 180 held frames (3 s) within 2 m, at 40 % HP
//   timer      hero 2 down, the partner never holds interact → respawn exactly 1800 frames (30 s) later, full HP, at
//              the last gate cleared (or the start)
//   both down  both knocked down → both back after 120 frames (2 s), full HP
//   musou      the two gauges are separate (they differ while both fight)
//   node --import ./bench/harness/register.mjs bench/net/rules.mjs
import { createCoopGame, coop } from './simkit.mjs';
const { createBot } = await import('../bot/bot.mjs');
const { on } = await import('../../src/core/events.js');
const { decodeIn, encodeIn } = await import('../../src/net/codec.js');
const { COOP } = coop;
const g = createCoopGame(), G = g.game, H = () => G.heroes;
const ev = []; for (const n of ['coop:down', 'coop:revive', 'coop:respawn', 'coop:reviving']) on(n, (e) => ev.push({ f: G.frame, n, ...e }));
let pass = 0, fail = 0;
const ok = (name, c, msg) => { c ? pass++ : fail++; console.log(`${c ? 'ok  ' : 'FAIL'} ${name}: ${msg}`); };
const knock = (h) => { h.iframes = 0; h.state = 'idle'; h.move = null; h.hurt(1e9, h.x + 1, h.z); };
const run = (n, ins = () => [null, null]) => { for (let k = 0; k < n && !g.end; k++) g.step(ins()); };

// ---- revive
g.start({ chars: ['lungjai', 'siumei'], chapter: 'hk1', seed: 3 });
run(600); ev.length = 0;
knock(H()[1]);
run(1);
const downF = ev.find((e) => e.n === 'coop:down' && e.i === 1)?.f;
run(1700);
const rv = ev.find((e) => e.n === 'coop:revive' && e.i === 1), first = ev.find((e) => e.n === 'coop:reviving' && e.i === 1);
const held = rv && ev.filter((e) => e.n === 'coop:reviving' && e.i === 1 && e.f > rv.f - COOP.reviveF && e.f <= rv.f).length;
ok('revive', rv && held === COOP.reviveF && Math.round(H()[1].hp) >= 1 && rv.by === 0,
  `down @${downF}, partner reached him and held from @${first?.f}, revived @${rv?.f} after ${held} held frames (want ${COOP.reviveF}); hp after = ${rv ? '≥' : ''}${Math.round(H()[1].hpMax * COOP.reviveHp)} (40 % of ${H()[1].hpMax})`);
// hp exactly 40 % on the revive frame: replay to that frame
g.start({ chars: ['lungjai', 'siumei'], chapter: 'hk1', seed: 3 });
run(600); knock(H()[1]); run(rv ? rv.f - 600 + 1 : 0);                    // events carry the frame they fired in (before frame++)
ok('revive hp', rv && H()[1].hp === Math.round(H()[1].hpMax * 0.4) && !H()[1].dead, `hp ${H()[1].hp} / ${H()[1].hpMax} on frame ${G.frame}`);

// ---- 30 s timer (the partner plays the solo bot policy: never holds interact)
g.start({ chars: ['lungjai', 'siumei'], chapter: 'hk1', seed: 4 });
const solo = createBot({ style: 'steady' });
const soloIn = () => { coop.bind(G, 0); const a = decodeIn(encodeIn(solo(G))); a.held.interact = false; return [a, null]; };
run(600, soloIn); ev.length = 0;
knock(H()[1]); run(1, soloIn);
const d2 = ev.find((e) => e.n === 'coop:down' && e.i === 1)?.f;
let rs = null;
for (let k = 0; k < 2000 && !rs && !g.end; k++) { run(1, soloIn); rs = ev.find((e) => e.n === 'coop:respawn' && e.i === 1); if (H()[0].dead) H()[0].hp = H()[0].hpMax, H()[0].dead = false; }
const K = G.coop, p = K.lastGate ? K.lastGate : 'start';
ok('30 s timer → respawn', rs && rs.f - d2 === COOP.downF && H()[1].hp === H()[1].hpMax && !rs.both,
  `down @${d2}, respawn @${rs?.f} (+${rs ? rs.f - d2 : '-'} frames, want ${COOP.downF}), hp ${H()[1].hp}/${H()[1].hpMax}, at ${p} (${H()[1].x.toFixed(1)}, ${H()[1].z.toFixed(1)})`);

// ---- both down
g.start({ chars: ['siumei', 'lungjai'], chapter: 'hk1', seed: 5 });
run(900); ev.length = 0;
knock(H()[0]); knock(H()[1]);
run(130);
const bd = ev.find((e) => e.n === 'coop:down')?.f, rb = ev.filter((e) => e.n === 'coop:respawn' && e.both);
ok('both down → back at the gate', rb.length === 2 && rb[0].f - bd === COOP.bothDownF && H().every((h) => !h.dead && h.hp === h.hpMax),
  `both down @${bd}, both respawned @${rb[0]?.f} (+${rb[0] ? rb[0].f - bd : '-'} frames, want ${COOP.bothDownF}), hp ${H().map((h) => h.hp).join(' / ')}`);

// ---- separate Musou gauges
g.start({ chars: ['lungjai', 'siumei'], chapter: 'hk1', seed: 6 });
let differ = 0; for (let k = 0; k < 3000; k++) { run(1); if (H()[0].musou !== H()[1].musou) differ++; }
ok('separate Musou gauges', differ > 2000, `gauges differ on ${differ}/3000 frames (e.g. ${H()[0].musou.toFixed(1)} vs ${H()[1].musou.toFixed(1)})`);
console.log(fail ? `RULES FAIL ${fail}/${pass + fail}` : `RULES PASS ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
