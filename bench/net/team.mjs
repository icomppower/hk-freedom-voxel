// Team Musou 齊上齊落 gate (offline, numeric): the rules of src/combat/team-musou.js on hk1, scripted inputs on top of a
// warmed-up field (both bots fight 900 ticks first so the crowd is around them). Scenarios: call + answer, call + no
// answer (the caller's solo Musou at tick 90, partner keeps his gauge), out of range (a solo Musou, no call), same-tick
// presses (no caller), a downed partner (no call), plus the numbers: radius ≥ 1.5 × solo, damage budget = 1.5 × (solo +
// solo), gauges spent, both invincible and in 'musou' for 300 ticks, boss capped at 25 % of max HP, officers uncapped.
//   node --import ./bench/harness/register.mjs bench/net/team.mjs
import { createCoopGame, coop } from './simkit.mjs';
const { TEAM, eligible } = await import('../../src/combat/team-musou.js');
const { LUNGJAI_MUSOU: LJ } = await import('../../src/chars/lungjai/musou.js');
const { SIUMEI_MUSOU: SM } = await import('../../src/chars/siumei/musou.js');
const { decodeIn, EMPTY } = await import('../../src/net/codec.js');
const { ST } = await import('../../src/crowd/crowd.js');
const { on } = await import('../../src/core/events.js');

let bad = 0, n = 0;
const ok = (name, pass, info = '') => { n++; if (!pass) bad++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${info !== '' ? ` — ${info}` : ''}`); };
const g = createCoopGame(), G = g.game;
const dmg = new Map();                               // team hits: victim → damage taken
const hitOne = G.combat.hitOne;
G.combat.hitOne = (i, hit, ox, oz, yaw, key, rehit, move) => {
  const r = hitOne(i, hit, ox, oz, yaw, key, rehit, move);
  if (r && key <= -6000000) dmg.set(i, (dmg.get(i) || 0) + hit.dmg);
  return r;
};
const ev = []; for (const k of ['team:call', 'team:timeout', 'team:start', 'team:end']) on(k, (e) => ev.push([G.frame, k, e]));

const idle = () => decodeIn(EMPTY);
/** Fresh hk1, bots for 900 ticks, then both heroes full, 3 m apart, standing. */
function setup(sep = 3) {
  g.start({ chars: ['lungjai', 'siumei'], chapter: 'hk1', seed: 5 });
  for (let k = 0; k < 900; k++) g.step([null, null]);
  const [a, b] = G.heroes;
  for (const h of G.heroes) { h.musou = h.musouMax; h.hp = h.hpMax; h.dead = false; }
  b.x = a.x + sep; b.z = a.z;
  for (let k = 0; k < 3; k++) g.step([idle(), idle()]);   // settle (no presses)
  dmg.clear(); ev.length = 0;
}
const press = (who) => { const x = [idle(), idle()]; for (const i of who) x[i].pressed.musou = true; return x; };
const T = () => G.coop.team;

ok(`radius ${TEAM.radius.toFixed(2)} m ≥ 9 and ≥ 1.5 × solo (${Math.max(LJ.waveR + 0.8, SM.xHit.range)} m)`, TEAM.radius >= 9 && TEAM.radius >= 1.5 * Math.max(LJ.waveR + 0.8, SM.xHit.range) - 1e-9);
{
  const solo = (LJ.spinHit.dmg * 3 + LJ.dashHit.dmg + LJ.waveHit.dmg) + (SM.cutHit.dmg * 6 + SM.tornadoHit.dmg * 4 + SM.xHit.dmg);
  ok('damage budget = 1.5 × (龍仔 solo + 小美 solo)', Math.abs(TEAM.total - 1.5 * solo) < 1e-9, `${TEAM.total} = 1.5 × ${solo}`);
}

// ---- call + answer (A calls, B answers 20 ticks later)
setup();
g.step(press([0]));
ok('a press within 6 m, both ready → calling, caller 0', T().phase === 'calling' && T().caller === 0 && G.heroes[0].state !== 'musou');
for (let k = 0; k < 19; k++) g.step([idle(), idle()]);
ok('still calling, nobody in a solo Musou', T().phase === 'calling' && G.heroes.every((h) => h.state !== 'musou'));
// a boss and an officer next to the pair (hp raised so neither dies): the cap and the no-cap
const c = G.crowd, near = [];
for (let i = 0; i < c.N && near.length < 2; i++) if (c.st[i] !== ST.OFF && c.st[i] !== ST.DEAD && c.type[i] === 0) near.push(i);
const [bi, oi] = near, cx = (G.heroes[0].x + G.heroes[1].x) / 2, cz = G.heroes[0].z;
c.boss[bi] = 1; c.hpMax[bi] = c.hp[bi] = 1000; c.x[bi] = cx + 1.2; c.z[bi] = cz + 1.2;
c.hpMax[oi] = c.hp[oi] = 1000; c.x[oi] = cx - 1.2; c.z[oi] = cz + 1.5;
g.step(press([1]));
ok('partner answers inside 90 ticks → firing (answer, caller 0)', T().phase === 'firing' && T().log.at(-1).kind === 'answer' && T().log.at(-1).caller === 0);
ok('both gauges spent fully', G.heroes.every((h) => h.musou === 0), G.heroes.map((h) => h.musou).join(' / '));
let inv = true, state = true, hp0 = G.heroes.map((h) => h.hp), maxR = 0;
for (let k = 0; k < TEAM.end - 1; k++) {
  const t = T().t;
  c.x[bi] = T().cx + 1.2; c.z[bi] = T().cz + 1.2;            // the boss pinned next to them: every hit lands, the cap must bind
  if (t % 30 === 5) for (const h of G.heroes) inv = !h.hurt(50, h.x + 1, h.z, true) && inv;
  state = state && G.heroes.every((h) => h.state === 'musou');
  if (TEAM.arcs.includes(t + 1)) { const before = new Map(dmg); g.step([idle(), idle()]); for (const [i] of dmg) if (!before.has(i) || dmg.get(i) !== before.get(i)) maxR = Math.max(maxR, Math.hypot(c.x[i] - T().cx, c.z[i] - T().cz)); continue; }
  g.step([idle(), idle()]);
}
ok('both invincible for the whole 300 ticks (hurt() refused, hp unchanged)', inv && G.heroes.every((h, i) => h.hp === hp0[i]));
ok('both in the Musou state (out of reach) throughout', state);
ok('a pole sweep reaches past the solo radius', maxR > Math.max(LJ.waveR + 0.8, SM.xHit.range), `farthest victim ${maxR.toFixed(1)} m`);
g.step([idle(), idle()]);
ok('ends after 300 ticks: idle, team phase idle', T().phase === 'idle' && G.heroes.every((h) => h.state !== 'musou'), `${T().phase} ${G.heroes.map((h) => h.state)}`);
ok('gauges still empty at the end (no gain while firing)', G.heroes.every((h) => h.musou < 1e-9), G.heroes.map((h) => h.musou.toFixed(2)).join(' / '));
ok(`boss capped at 25 % of max HP (${1000 * TEAM.bossCap} of 1000; uncapped it would take ${TEAM.total})`, Math.abs((dmg.get(bi) || 0) - 1000 * TEAM.bossCap) < 1e-6, `${(dmg.get(bi) || 0).toFixed(2)} dealt`);
ok('officer uncapped (> 25 % of max HP)', (dmg.get(oi) || 0) > 1000 * TEAM.bossCap + 1e-6, `${(dmg.get(oi) || 0).toFixed(1)} of 1000`);
ok('some foes hit', dmg.size > 3, `${dmg.size} victims`);
ok('events: call → start → end', ev.map((e) => e[1]).join(',') === 'team:call,team:start,team:end', ev.map((e) => e[1]).join(','));

// ---- call + no answer → the caller's own Musou at tick 90
setup();
g.step(press([0]));
let k = 1;
while (T().phase === 'calling' && k < 200) { g.step([idle(), idle()]); k++; }
g.step([idle(), idle()]);
ok('no answer: the window closes 90 ticks after the call', k - 1 === TEAM.window, `${k - 1} ticks`);
ok('→ the caller\'s solo Musou fires, the partner keeps his gauge', G.heroes[0].state === 'musou' && G.heroes[0].mu.active && G.heroes[1].musou === G.heroes[1].musouMax && T().log.at(-1).kind === 'timeout');

// ---- out of range: a solo Musou, no call
setup(9);
ok('9 m apart → not eligible', !eligible(G));
g.step(press([0])); g.step([idle(), idle()]);
ok('a press out of range → solo Musou at once, no call', T().phase === 'idle' && G.heroes[0].state === 'musou' && !ev.some((e) => e[1] === 'team:call'));

// ---- both press on the same tick
setup();
g.step(press([0, 1]));
ok('same-tick presses → firing with no caller', T().phase === 'firing' && T().caller === -1 && T().log.at(-1).kind === 'same');

// ---- downed partner can't join
setup();
G.heroes[1].dead = true;
g.step(press([0])); g.step([idle(), idle()]);
ok('partner down → no call (solo Musou), the downed hero untouched', T().phase === 'idle' && G.heroes[0].state === 'musou' && G.heroes[1].dead);

console.log(bad ? `TEAM MUSOU FAIL ${bad}/${n}` : `TEAM MUSOU PASS ${n}/${n}`);
process.exit(bad ? 1 : 0);
