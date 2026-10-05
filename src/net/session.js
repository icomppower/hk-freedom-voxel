// Co-op session: matchmaking, the room connection, and the lockstep scheduler. Shared by the page (src/ui/coop-lobby.js
// + main.js) and the headless test clients (bench/net/client.mjs), which differ only in the adapter.
//   const S = createSession({ server, name, pid, netsim, adapter })
//   S.quick() · S.create() → code · S.join(code) · S.leave()       matchmaking (Quick Match queue / private room)
//   S.pick(char) · S.swap() · S.chapter(id) · S.ready(v) · S.bot(v) · S.ui(a, n)   lobby
//   S.begin()                        battle set up locally (after adapter.start): first D inputs go out
//   S.pump(sample, max) → n          step up to `max` merged frames that have arrived (lockstep: never past the clock)
//   S.end(win)                       story over (both peers reach it on the same tick)
// adapter: { lobby(m), start(m), status(text), desync(m), ended(m), full(), closed(reason), ui(m), queued(m), live() } —
// all optional. Sim: adapter.game (2-hero, src/net/coopsim.js) is stepped here, frame by frame from the room's clock.
// Lockstep: the input sampled after stepping tick t is sent for tick t + D (D = input delay, 2-8 ticks from the measured
// rtt). A frame = both peers' inputs for one tick (null = that hero on bot autoplay); a frame whose inputs carry the
// pause bit is consumed without stepping (pause from either side pauses both). Every 120 ticks the state hash goes to
// the room, which compares the two.
import { createSocket, httpOf, wsOf } from './socket.js';
import { encodeIn, decodeIn, isPause, EMPTY } from './codec.js';
import { coopStep } from './coopsim.js';
import { coopHash } from './hash.js';

export const HASH_EVERY = 120;
const TICK_MS = 1000 / 60;
const BATCH = 3, IDLE = 15;                        // send at most every 3 ticks; idle heartbeat ≈ 250 ms (see the sender)
const MIN_MS = 33;                                 // and never more than ≈ 30 messages / s (the room drops above 40 / s)

export function createSession({ server, name = 'Player', pid, netsim = null, dMax = 8, adapter = {} }) {
  const S = {
    server: httpOf(server).replace(/\/$/, ''), name, pid: pid || rid(), phase: 'idle', code: null, you: -1, lobbyMsg: null,
    start: null, frames: [], simT: 0, D: 4, fixedD: null, live: false, halted: false, over: false,
    stats: { stalls: 0, steps: 0, paused: 0, sent: 0, msgs: 0, recv: 0, hashes: 0, lastHash: null, maxDepth: 0, rttMax: 0 },
    hashes: {}, sock: null, mm: null, retry: 0, synced: -1, partnerGone: false,
  };
  const A = adapter;
  const status = (t) => A.status?.(t);

  // ---------------------------------------------------------------- matchmaking
  S.quick = () => {
    S.phase = 'queue';
    status('queue');
    const mmSock = S.mm = createSocket(`${wsOf(S.server)}/api/quick?name=${encodeURIComponent(name)}`, {
      netsim,
      onMessage: (m) => {
        if (m.type === 'queued') A.queued?.(m);
        else if (m.type === 'matched') { const mm = S.mm; S.mm = null; S.phase = 'matched'; mm.close(); S.join(m.code); }
        else if (m.type === 'expired') { S.phase = 'idle'; status('expired'); }
      },
      onClose: () => {
        if (S.phase !== 'queue') return;
        S.phase = 'idle';
        if (!mmSock.opened) A.closed?.('busy'); else status('queue-closed');   // refused outright: over quota / down
      },
    });
  };
  S.cancel = () => { S.phase = 'idle'; if (S.mm) { const mm = S.mm; S.mm = null; mm.send({ type: 'cancel' }); mm.close(); } };
  S.create = async () => {
    const r = await fetch(`${S.server}/api/create`, { method: 'POST' });
    if (!r.ok) throw new Error('create failed ' + r.status);
    const { code } = await r.json();
    S.join(code);
    return code;
  };
  S.join = (code) => {
    S.code = String(code).toUpperCase(); S.phase = 'joining'; status('joining');
    connect();
  };
  function connect() {
    const old = S.sock; S.sock = null; old?.close();   // (its onClose sees it is no longer S.sock and stays quiet)
    const url = `${wsOf(S.server)}/api/room/${S.code}/ws?name=${encodeURIComponent(name)}&pid=${encodeURIComponent(S.pid)}`;
    let gotHello = false, me = null;
    me = S.sock = createSocket(url, {
      netsim,
      onMessage: (m) => { if (m.type === 'hello') gotHello = true; onMsg(m); },
      onClose: (code, reason) => {
        if (S.sock !== me) return;
        if (S.phase === 'left' || S.phase === 'full' || S.phase === 'closed') return;
        if (!gotHello && !S.retry && S.phase === 'joining') { S.phase = 'closed'; A.closed?.('not_found'); return; }
        // dropped: retry with the same pid (the room keeps the slot; a running game resumes from its frame log)
        // a socket that never got its hello on the first try: no such room, or the server refused (daily quota) — ask
    // the room's status endpoint which; five failed reconnects in a row: give up ("server busy, try later")
        setTimeout(() => { if (S.phase !== 'left' && S.phase !== 'closed') connect(); }, Math.min(3000, 500 * S.retry));
      },
    });
  }
  async function probe() {
    try {
      const r = await fetch(`${S.server}/api/room/${S.code}/status`);
      if (!r.ok) return 'busy';
      const j = await r.json();
      return j.phase === 'none' ? 'not_found' : 'busy';
    } catch { return 'busy'; }
  }
  S.leave = () => { S.phase = 'left'; S.sock?.send({ type: 'game_over' }); S.sock?.close(); S.mm?.close(); };
  /** Test hook: drop the socket as if the network went (the session reconnects by itself). */
  S.drop = () => { S.sock?.close(); };

  // ---------------------------------------------------------------- lobby
  const send = (m) => S.sock?.send(m);
  S.pick = (c) => send({ type: 'pick', char: c });
  S.swap = () => send({ type: 'swap' });
  S.chapter = (id) => send({ type: 'chapter', id });
  S.ready = (v = true) => send({ type: 'ready', v });
  S.bot = (v = true) => send({ type: 'bot', v });
  S.ui = (a, n = 0) => send({ type: 'ui', a, n });

  function onMsg(m) {
    switch (m.type) {
      case 'hello': S.you = m.you; S.retry = 0; if (S.phase === 'joining' || S.phase === 'reconnecting') S.phase = 'lobby'; status('joined'); return;
      case 'full': S.phase = 'full'; A.full?.(m); return;
      case 'lobby': S.lobbyMsg = m; if (S.phase !== 'game') S.phase = 'lobby'; A.lobby?.(m); return;
      case 'start': return onStart(m);
      case 'frame': return onFrames(m);
      case 'synced':
        S.synced = m.next;
        if (S.resumeKeep) { S.resumeKeep = false; S.liveAsked = true; send({ type: 'live' }); }   // same page: no re-sim needed
        return;
      case 'live': txReset(m.from); S.live = true; S.sock && (S.sock.quiet = true); sendInputs(null, true); A.live?.(); return;
      case 'desync': S.halted = true; A.desync?.({ ...m, dump: S.dump() }); return;
      case 'left': if (m.slot !== S.you) { S.partnerGone = true; status('partner-left'); } return;
      case 'back': if (m.slot !== S.you) { S.partnerGone = false; status('partner-back'); } return;
      case 'bot': status(m.slot === S.you ? 'you-bot' : 'partner-bot'); return;
      case 'ended': S.phase = 'lobby'; S.over = true; A.ended?.(m); return;
      case 'ui': A.ui?.(m); return;
      case 'slow': resend(m.from); return;            // the room dropped a run over its rate: send again from there
      case 'room_closed': S.phase = 'closed'; A.closed?.(m.reason); return;
    }
  }

  function onStart(m) {
    const same = S.start && S.start.seed === m.seed && S.start.chapter === m.chapter && S.phase === 'game' && !S.over;
    S.you = m.you; S.phase = 'game';
    if (m.resume && same) {                          // same page, socket came back: keep the sim, re-take the log
      S.frames = []; S.resumeKeep = true; S.live = false; S.synced = -1;
      status('resumed');
      return;
    }
    S.start = m; S.frames = []; S.simT = 0; S.live = false; S.halted = false; S.over = false;
    S.hashes = {}; S.synced = m.resume ? -1 : 0; S.resumeKeep = false; S.partnerGone = false; S.liveAsked = false;
    Object.assign(S.stats, { stalls: 0, steps: 0, paused: 0, sent: 0, msgs: 0, recv: 0, hashes: 0, lastHash: null, maxDepth: 0 });
    S.liveAt = 0; S.msgs0 = S.sock?.msgs || 0;
    A.start?.(m);                                   // adapter: coopStart + views; then S.begin() (fresh) or resim (resume)
  }
  function onFrames(m) {
    S.stats.lastFrames = [m.t, m.f.length];
    if (m.t !== S.frames.length) {                  // out of order should never happen on one socket; resync by index
      if (m.t > S.frames.length) { S.stats.gaps = (S.stats.gaps || 0) + 1; return; }
      S.frames.length = m.t;
    }
    for (const f of m.f) S.frames.push(f);
    S.stats.recv += m.f.length;
  }

  /** Fresh battle set up: send the first D inputs (ticks 0 … D-1, empty). Resume: catch up first (pump), then 'live'. */
  S.begin = () => {
    if (S.start?.resume) return;                    // resume: live is requested once the log is re-simulated
    txReset(0); S.live = true; if (S.sock) S.sock.quiet = true; sendInputs(null, true);
  };

  // ---------------------------------------------------------------- lockstep
  function targetD() {
    if (S.fixedD) return S.fixedD;
    const r = S.sock ? S.sock.rtt + 2 * S.sock.jit : 0;
    return Math.max(2, Math.min(dMax, Math.ceil(r / TICK_MS) + 1 + BATCH - 1));   // + batching slack; cap 8 (brief), ?coopdmax=
  }
  // Sender (message budget: on the Cloudflare Free plan every incoming WebSocket message counts toward 100k DO
  // requests / day). Each tick's input is committed once (tick simT + D); only ticks whose value differs from the
  // previous tick's rest value (presses and look deltas cleared) go on the wire, as [offset, value] in a run message
  // { type: 'input', t, n, c } covering ticks t … t+n-1. A message leaves at most every BATCH ticks when something
  // changed, else when the partner's lead on us would drop below D − BATCH + 1; an idle message promises "no change"
  // for as many ticks ahead as the input has been quiet (≤ IDLE = 15 ticks = 250 ms): a heartbeat every ≈ 250 ms when
  // idle, at the cost of up to that much extra delay on the first change after a quiet spell (the change is held in
  // `carry`: presses OR'd, look deltas summed, never lost). The state hash and the ping ride on these messages.
  const REST = (v) => [v[0], v[1], 0, 0, 0, v[5]];
  const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
  const clampQ = (v) => Math.max(-32000, Math.min(32000, v));
  function txReset(from) {
    S.tx = { committed: from, t0: from, c: [], rest: EMPTY, carry: null, lastMsgT: -1e9, lastMsgAt: -1e9, lastChange: from, resendAt: 0, hist: new Map(), hash: null };
  }
  txReset(0);
  function feed(s) {
    const tx = S.tx, c = tx.carry;
    tx.carry = c ? [s[0], s[1], clampQ(c[2] + s[2]), clampQ(c[3] + s[3]), c[4] | s[4], s[5]] : s;
  }
  function commit(upto) {
    const tx = S.tx;
    while (tx.committed < upto) {
      const t = tx.committed++, v = tx.carry || tx.rest;
      tx.carry = null;
      if (!same(v, tx.rest)) { tx.c.push([t - tx.t0, v]); tx.lastChange = t; }
      tx.hist.set(t, v); tx.rest = REST(v);
    }
  }
  function flush() {
    const tx = S.tx, m = { type: 'input', t: tx.t0, n: tx.committed - tx.t0, c: tx.c };
    if (tx.hash) { m.h = tx.hash; tx.hash = null; }
    if (S.sock?.pingDue()) m.p = S.sock.stamp();
    S.sock?.send(m);
    S.stats.sent += m.n; S.stats.msgs++;
    tx.t0 = tx.committed; tx.c = []; tx.lastMsgT = S.simT; tx.lastMsgAt = performance.now();
    for (const k of tx.hist.keys()) { if (k < S.simT - 600) tx.hist.delete(k); else break; }
  }
  /** After each stepped tick (and once at begin / live): commit up to simT + D, send when the policy says so. */
  function sendInputs(sample, force = false) {
    if (!S.live || S.halted) return;
    const tx = S.tx;
    S.D = targetD();
    if (sample) feed(sample());
    commit(S.simT + S.D);
    const gap = S.simT - tx.lastMsgT;
    if (force) return flush();
    if (performance.now() - tx.lastMsgAt < MIN_MS) return;      // (a stalled pump calls back here: nothing is left behind)
    if (tx.c.length && gap >= BATCH) return flush();
    if (tx.t0 - S.simT <= Math.max(0, S.D - BATCH)) {            // partner about to run out of my ticks (idle: promise ahead)
      const quiet = tx.committed - 1 - tx.lastChange;
      if (!tx.carry && !tx.c.length) { const ext = Math.max(0, Math.min(IDLE, quiet)); tx.committed += ext; for (let k = tx.committed - ext; k < tx.committed; k++) tx.hist.set(k, tx.rest); }
      flush();
    }
  }
  /** The room dropped a run (its rate limit): send every committed tick again from `from`. */
  function resend(from) {
    const tx = S.tx, now = performance.now();
    if (now < tx.resendAt) return;                                // one resend per 300 ms (no slow ↔ resend ping-pong)
    tx.resendAt = now + 300;
    setTimeout(() => resendNow(from), 300);
  }
  function resendNow(from) {
    const tx = S.tx;
    if (!S.live || S.halted || !tx.hist.has(from) || from >= tx.committed) return;
    let rest = from > 0 && tx.hist.has(from - 1) ? REST(tx.hist.get(from - 1)) : EMPTY;
    const c = [];
    for (let t = from; t < tx.committed; t++) { const v = tx.hist.get(t) || rest; if (!same(v, rest)) c.push([t - from, v]); rest = REST(v); }
    tx.c = c; tx.t0 = from;
    flush();
  }
  /** Re-simulating a resumed log (no inputs go out until it is done and the room said 'live'). */
  S.catchingUp = () => S.start?.resume && !S.live;
  S.depth = () => S.frames.length - S.simT;

  /** Step up to `max` arrived frames. sample() → encoded local input (codec.encodeIn), called once per sent tick.
   *  Returns the number of ticks consumed (0 = waiting for the clock: a stall when the caller wanted one). */
  S.pump = (sample, max = 1) => {
    if (S.halted || S.over || S.phase !== 'game') return 0;
    let n = 0;
    S.stats.maxDepth = Math.max(S.stats.maxDepth, S.depth());
    while (n < max && S.simT < S.frames.length && !S.halted && !S.over) {
      const f = S.frames[S.simT], G = A.game;
      const paused = isPause(f[0]) || isPause(f[1]);
      if (!paused) coopStep(G, [f[0] && decodeIn(f[0]), f[1] && decodeIn(f[1])]);
      else S.stats.paused++;
      S.simT++; n++; S.stats.steps++;
      A.stepped?.(paused);
      if (S.simT % HASH_EVERY === 0) {
        const h = coopHash(G);
        S.hashes[S.simT] = h; S.stats.lastHash = [S.simT, h]; S.stats.hashes++;
        if (S.live) S.tx.hash = [S.simT, h];          // rides on the next input message
      }
      if (S.live) sendInputs(sample);
    }
    if (n === 0 && S.live) sendInputs(null);        // stalled: the sender may owe the partner ticks (time-gated above)
    if (S.catchingUp() && S.synced >= 0 && S.simT >= S.synced && !S.liveAsked) { S.liveAsked = true; send({ type: 'live' }); }
    if (S.sock) S.stats.rttMax = Math.max(S.stats.rttMax, S.sock.rtt);
    return n;
  };
  S.stall = () => { S.stats.stalls++; };
  S.end = (win) => { if (!S.over) { S.over = true; send({ type: 'end', win }); } };
  /** Everything needed to reproduce a desync in the headless runner (bench/net/replay.mjs). */
  S.dump = () => ({ seed: S.start?.seed, chapter: S.start?.chapter, chars: S.start?.chars, you: S.you, frames: S.frames, hashes: S.hashes, simT: S.simT });
  S.rtt = () => (S.sock ? S.sock.rtt : 0);
  return S;
}

function rid() {
  const b = new Uint8Array(8);
  (globalThis.crypto || {}).getRandomValues?.(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('') || String(Date.now());
}
