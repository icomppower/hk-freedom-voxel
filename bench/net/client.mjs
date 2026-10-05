// Headless co-op client (one per process: the sim's event bus / map are module singletons). Runs the real session +
// lockstep code (src/net/session.js) against a server, plays its own hero with the bot policy as its "hands" (the input
// goes over the wire like a human's), and prints JSON lines: {ev:'code'} once a room exists, {ev:'tick'} progress,
// {ev:'result'} at the end.
//   node --import ./bench/harness/register.mjs bench/net/client.mjs --server http://localhost:8787 --mode quick|create|join
//        [--code ABCD] [--name A] [--pid X] [--chapter hk1] [--bot] [--netsim 150,30] [--pace] [--die-at T] [--drop-at T]
//        [--pause-at T --pause-for N] [--max-frames N] [--style steady] [--no-ready] [--d D]
//        [--hide-at T --hide-ms MS --hide-mode new|old]  (a background tab from tick T: one wake per second, as Chrome
//        throttles a hidden page's timers; new = page.js's S.away + catch-up, old = the pre-fix 6 + ≤ 30 ticks a wake)
import { createCoopGame, coop } from './simkit.mjs';
const { createSession } = await import('../../src/net/session.js');
const { encodeIn } = await import('../../src/net/codec.js');
const { createCoopBot } = await import('../../src/net/coopbot.js');
const { on } = await import('../../src/core/events.js');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes('--' + k);
const server = arg('server', 'http://localhost:8787'), mode = arg('mode', 'quick'), name = arg('name', 'Node');
const dieAt = +arg('die-at', -1), dropAt = +arg('drop-at', -1), pauseAt = +arg('pause-at', -1), pauseFor = +arg('pause-for', 120);
const maxFrames = +arg('max-frames', 60 * 3600), pace = flag('pace');
const hideAt = +arg('hide-at', -1), hideMs = +arg('hide-ms', 30000), hideMode = arg('hide-mode', 'new');
let hideT0 = 0;
const netsim = arg('netsim', null)?.split(',').map(Number) ?? null;
const out = (o) => process.stdout.write(JSON.stringify(o) + '\n');

const g = createCoopGame(), G = g.game;
let hands = null, ended = null, desync = null, lobbyDone = false, t0 = 0, closed = null, full = false;
const events = [];
for (const n of ['coop:down', 'coop:revive', 'coop:respawn']) on(n, (e) => events.push([G.frame, n, e.i]));
on('story:end', (e) => { ended = e; S.end(e.win); });

const S = createSession({
  server, name, pid: arg('pid', undefined), netsim,
  adapter: {
    game: G,
    status: (t) => out({ ev: 'status', t, simT: S.simT }),
    full: () => { full = true; },
    closed: (r) => { closed = r; },
    lobby: (m) => {
      const me = m.players[S.you];
      if (!me) return;
      if (S.you === m.host && arg('chapter') && m.chapter !== arg('chapter')) { S.chapter(arg('chapter')); return; }
      if (S.you === m.host && flag('bot') && !m.players[1 - S.you]) { S.bot(true); return; }
      if (!me.ready && m.players.every(Boolean) && !flag('no-ready')) S.ready(true);
    },
    start: (m) => {
      lobbyDone = true; t0 = performance.now();
      g.start({ chars: m.chars, chapter: m.chapter, seed: m.seed });
      hands = createCoopBot(m.you, arg('style', 'steady'));
      out({ ev: 'start', you: m.you, chars: m.chars, chapter: m.chapter, seed: m.seed, resume: m.resume, total: m.total });
      S.begin();
    },
    desync: (m) => { desync = m; },
    ended: (m) => { out({ ev: 'ended', ...m, dump: undefined }); },
  },
});
S.fixedD = arg('d') ? +arg('d') : null;

// local "hands": the bot policy on this client's own hero, read from the local sim (as a human reads the screen)
const sample = () => {
  const b = G.bound; coop.bind(G, S.you);
  const inp = hands(G);
  coop.bind(G, b);
  const paused = pauseAt >= 0 && S.simT >= pauseAt && S.simT < pauseAt + pauseFor;
  return encodeIn(inp, { pause: paused });
};

if (mode === 'quick') S.quick();
else if (mode === 'create') { const code = await S.create(); out({ ev: 'code', code }); }
else S.join(arg('code'));

let lastLog = 0, dropped = false;
if (flag('debug')) setInterval(() => process.stderr.write(JSON.stringify({ simT: S.simT, have: S.frames.length, tx: S.tx && { c: S.tx.committed, t0: S.tx.t0, carry: !!S.tx.carry, last: S.tx.lastMsgT }, D: S.D, msgs: S.stats.msgs, lf: S.stats.lastFrames, gaps: S.stats.gaps, open: S.sock?.open, live: S.live, phase: S.phase }) + '\n'), 1000).unref();
const boot = performance.now();
const loop = async () => {
  let acc = 0, last = performance.now();
  for (;;) {
    if (full || closed || desync || (ended && S.over)) break;
    if (flag('no-ready') && performance.now() - boot > +arg('hold-ms', 8000)) break;
    if (S.phase !== 'game' || !hands) { await sleep(5); continue; }
    if (dieAt >= 0 && S.simT >= dieAt) { out({ ev: 'die', simT: S.simT }); process.exit(3); }
    if (dropAt >= 0 && !dropped && S.simT >= dropAt) { dropped = true; out({ ev: 'drop', simT: S.simT }); S.drop(); }
    if (hideAt >= 0 && S.simT >= hideAt && (!hideT0 || performance.now() - hideT0 < hideMs)) {   // hidden: wake once a second
      if (!hideT0) { hideT0 = performance.now(); out({ ev: 'hide', simT: S.simT }); }
      if (hideMode === 'new') { S.away(90); const w = performance.now(); while (S.depth() > 0 && performance.now() - w < 50 && S.pump(sample, 60) > 0); }
      else { const depth = S.depth(); S.pump(sample, 6 + (depth > S.D + 4 ? Math.min(depth - S.D, 30) : 0)); }
      await sleep(1000); acc = 0; last = performance.now();
      continue;
    }
    let max = 4000;
    if (pace && !S.catchingUp()) { const now = performance.now(); acc = Math.min(acc + (now - last) / (1000 / 60), 8); last = now; max = Math.floor(acc); }
    const n = S.pump(sample, Math.max(0, max));
    if (pace) acc -= n;
    if (n === 0) { if (max > 0 && S.live) S.stall(); await sleep(pace ? 4 : 1); }
    else if (n >= 50 || pace) await sleep(0);
    if (S.simT - lastLog >= 3000) { lastLog = S.simT; out({ ev: 'tick', simT: S.simT, frame: G.frame, rtt: Math.round(S.rtt()), D: S.D }); }
    if (S.simT >= maxFrames) break;
  }
  const wall = (performance.now() - t0) / 1000;
  out({
    ev: 'result', you: S.you, full, closed, desync: desync && { t: desync.t, h: desync.h }, win: ended?.win ?? null,
    simT: S.simT, frame: G.frame, hash: g.hash(), hashes: S.stats.hashes, lastHash: S.stats.lastHash, events,
    hp: G.heroes.map((h) => Math.round(h.hp)), kos: G.heroes.map((h) => h.kos), wall: +wall.toFixed(1),
    sockMsgs: S.sock?.msgs ?? 0,
    stats: { ...S.stats, rtt: Math.round(S.rtt()), D: S.D, stallPct: pace ? +Math.max(0, 100 * (1 - S.stats.steps / Math.max(1, wall * 60))).toFixed(1) : null },   // stallPct (paced): share of wall time the clock held the sim
    officers: officerHp(),
  });
  S.leave();
  setTimeout(() => process.exit(0), 300);
};
function officerHp() {   // boss / officer hpMax seen at the end (scaling asserts happen in the orchestrator)
  const c = G.crowd, r = [];
  for (let i = c.grunts; i < c.N; i++) if (c.offName[i - c.grunts]) r.push([c.offName[i - c.grunts].en, c.boss[i], c.hpMax[i]]);
  return r;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
loop();
