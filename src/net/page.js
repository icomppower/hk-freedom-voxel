// Online co-op on the page (only with ?coop; createCoopPage returns null otherwise and main.js runs the solo game).
// Owns the session (./session.js) and the 2-hero sim on main.js's game object; main.js calls in at five points:
//   coop.boot(flow)            ?coop&room=ABCD → straight into that room's lobby (else the title)
//   coop.start(ctx)            from startBattle (ctx.coop): both heroes from the room's seed, game.hero = this player's
//   coop.active() / frame(dt)  the battle loop: steps the merged frames off the room's clock (never the wall clock alone)
//   coop.beforeRender(dt)      this player's hero bound for the camera / HUD / views; the partner's model + Musou drawn
//   coop.ended(e)              story over (both peers on the same tick) → the room goes back to its lobby
// Screens: the lobby (src/ui/coop-lobby.js, flow state 'coop') and the battle overlay (partner bar, banners, 救 revive,
// ?coopdebug readout). Local input = keyboard / mouse / pad / touch pad through input.sample(), plus F / 救 (hold:
// revive) and the pause menu (a pause bit in the input: either side pauses both).
// URL: ?coopserver=URL (default the deployed worker) · ?coopbot (lobby: fill slot 2 with bot autoplay) · ?netsim=150,30 ·
// ?coopdmax=12 (input-delay cap, default 8 = 133 ms) · ?coopdebug · ?coophands=bot (test only: this player's hero plays itself with the bot policy, over the wire) · ?coophands=chaos
// (local test only: human-like inputs, bench/net/chaos.mjs).
import { createSession } from './session.js';
import { encodeIn } from './codec.js';
import { attachCoop, detachCoop, coopStart, bind, COOP } from './coopsim.js';
import { createCoopBot } from './coopbot.js';
import { createHeroView } from '../hero/hero.js';
import { emit, on, collect } from '../core/events.js';
import { createCoopLobby, createCoopOverlay } from '../ui/coop-lobby.js';
import { createTeamView } from './team-view.js';     // 齊上齊落 Team Musou presentation
import { SIM_VERSION } from './version.js';

const Q = new URLSearchParams(location.search);
export const COOP_ON = Q.has('coop');
export const DEFAULT_SERVER = 'https://hk-freedom-coop.icomppower.workers.dev';
export const COOP_ENEMIES = 300;                     // both peers must build the same crowd (phones solo get 150)

export function createCoopPage(api) {
  if (!COOP_ON) return null;
  const { game, input, scene } = api;
  const server = Q.get('coopserver') || DEFAULT_SERVER;
  const netsim = Q.get('netsim') ? Q.get('netsim').split(',').map(Number) : null;
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private */ } } };
  let name = store.get('hkf.coop.name') || `玩家${(Math.random() * 900 + 100) | 0}`;
  let pid = store.get('hkf.coop.pid');
  if (!pid) { pid = Math.random().toString(16).slice(2) + Date.now().toString(16); store.set('hkf.coop.pid', pid); }

  const C = {
    server, S: null, error: null, battle: false, inBattle: false, startMsg: null, you: 0, began: false, acc: 0,
    stallT: 0, waitingSince: 0, interact: false, partner: null, ended: false, msgLog: [], status: '',
  };
  let flow = null, lobby = null;
  const overlay = createCoopOverlay(C, { revive: (v) => { C.interact = v; } });
  C.mpm = () => coop.msgsPerMin();
  const team = createTeamView(scene, game, C);
  C.teamStatus = () => team.status();
  const handsMode = Q.get('coophands'), hands = handsMode === 'bot' || handsMode === 'chaos';
  let chaos = null;                                  // ?coophands=chaos (local test only): human-like inputs, bench/net/chaos.mjs
  if (handsMode === 'chaos') import('../../bench/net/chaos.mjs').then((m) => { chaos = m.createChaos(); });
  let bot = null;

  // ---------------------------------------------------------------- session
  function session() {
    C.S?.leave();
    const S = createSession({
      server, name, pid, netsim, dMax: Math.max(2, Math.min(20, +(Q.get('coopdmax') || 8))),
      adapter: {
        game,
        status: (t) => {
          C.status = t;
          if (t === 'expired') C.error = 'expired';
          if (C.inBattle && (t === 'partner-bot' || t === 'partner-back')) overlay.flashKey(t === 'partner-bot' ? 'bot' : 'back');
          lobby?.refresh();
        },
        queued: (m) => { C.queueN = m.n; lobby?.refresh(); },
        lobby: () => { C.error = null; lobby?.refresh(); },
        full: () => { C.error = 'full'; lobby?.refresh(); },
        closed: (r) => { C.error = r === 'not_found' ? 'not_found' : r === 'busy' ? 'busy' : 'closed'; if (C.inBattle) overlay.banner('room-closed'); lobby?.refresh(); },
        start: (m) => onStart(m),
        stepped: () => { bind(game, C.you); api.afterStep(); },
        desync: (m) => onDesync(m),
        ended: () => { lobby?.refresh(); },
        ui: () => { lobby?.refresh(); },                // the partner's version (session.js handshake)
        live: () => { lobby?.refresh(); },
      },
    });
    C.S = S;
    return S;
  }

  function onStart(m) {
    C.startMsg = m; C.you = m.you; C.began = false; C.ended = false; C.acc = 0; C.waitingSince = 0;
    if (m.resume && C.inBattle) return;              // same page, the socket came back: the session keeps the sim
    // a new battle (or a reload mid-game: resume re-simulates the room's log from tick 0 once the field is built)
    flow.go('loading', { mode: 'story', char: m.chars[m.you], chapter: m.chapter, coop: true, retry: !!m.resume });
  }
  function onDesync(m) {
    const code = C.S?.code || '';
    overlay.banner('desync', m.t, code);
    const dump = { ...m.dump, t: m.t, h: m.h, at: new Date().toISOString(), ua: navigator.userAgent, ver: SIM_VERSION, code, touch: matchMedia('(pointer: coarse)').matches };
    console.error('[coop] desync at tick', m.t, m.h, dump);
    C.desyncDump = dump;
    sendReport(code, dump);
  }
  /** Upload the dump (gzip + base64) to the worker's report store, so the room code is all a player has to pass on. */
  async function sendReport(code, dump) {
    if (!/^[A-Z]{4}$/.test(code)) return;
    try {
      const raw = new Blob([JSON.stringify(dump)]).stream().pipeThrough(new CompressionStream('gzip'));
      const buf = new Uint8Array(await new Response(raw).arrayBuffer());
      let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      const r = await fetch(`${server}/api/report/${code}`, { method: 'POST', body: JSON.stringify({ gz: btoa(bin), you: dump.you, ver: SIM_VERSION, ua: dump.ua }) });
      C.reportSent = r.ok;
    } catch { C.reportSent = false; }
  }

  // ---------------------------------------------------------------- views of the partner
  let partnerViews = null, dropPartner = null;
  function buildPartner() {
    if (dropPartner) { dropPartner(); partnerViews.hero.dispose(); partnerViews.mu.dispose(); partnerViews = null; dropPartner = null; }
    const p = 1 - C.you, H = game.heroes;
    bind(game, p);
    [partnerViews, dropPartner] = collect(() => ({ hero: createHeroView(scene, H[p]), mu: H[p].kit.createMusouView(scene, game, api.camera) }));
    bind(game, C.you);
    partnerViews.hero.reset();
  }

  const coop = {
    C,
    /** ?coop&room=ABCD: into that room's lobby; ?coop&lobby: the co-op menu. Returns true when it took over the boot. */
    boot(f) {
      flow = f;
      const room = Q.get('room');
      if (room && /^[A-Za-z]{4}$/.test(room)) { flow.go('coop', { join: room.toUpperCase() }); return true; }
      if (Q.has('lobby')) { flow.go('coop'); return true; }   // the title's 網上合作 from a solo page reloads here
      return false;
    },
    setFlow(f) { flow = f; },
    lobbyScreen(el, f) { flow = f; lobby = createCoopLobby(el, f, coop); return lobby; },
    // lobby actions
    get name() { return name; },
    setName(v) { name = String(v || '').replace(/[\x00-\x1F\x7F<>]/g, '').trim().slice(0, 16) || name; store.set('hkf.coop.name', name); if (C.S) C.S.name = name; },
    quick() { C.error = null; session().quick(); },
    cancel() { C.S?.cancel(); C.S = null; lobby?.refresh(); },
    async create() {
      C.error = null;
      const S = session();
      try { await S.create(); } catch (e) { C.error = 'busy'; C.S = null; lobby?.refresh(); }
    },
    join(code) { C.error = null; session().join(code); },
    leave() { C.S?.leave(); C.S = null; C.startMsg = null; lobby?.refresh(); },
    link() { const u = new URL(location.href); u.search = `?coop&room=${C.S?.code || ''}`; if (Q.get('coopserver')) u.search += `&coopserver=${encodeURIComponent(server)}`; return u.href; },

    /** startBattle (main.js) for a co-op ctx: after the solo reset (map, world), both heroes from the room's seed. */
    start() {
      const m = C.startMsg;
      attachCoop(game);
      coopStart(game, { chars: m.chars, chapter: m.chapter, seed: m.seed });
      bind(game, C.you);
      bot = !hands ? null : chaos ? (g) => chaos(g, C.you, bind) : createCoopBot(C.you);
      C.partner = m.names[1 - C.you];
      buildPartner();
      emit('scenario', { mode: 'story', char: m.chars[m.you], chapter: m.chapter, coop: true });
    },
    /** The battle is on screen: this player's inputs start (a resume first re-simulates the log, then goes live). */
    enterBattle() {
      C.inBattle = true;
      if (!C.began && C.S) { C.began = true; C.S.begin(); }
    },
    active: () => C.inBattle && !!C.S && C.S.phase === 'game',
    /** Battle loop: step the frames the room's clock has released, at most the wall clock's due ticks (more to catch up). */
    frame(dt) {
      const S = C.S;
      if (!S) return;
      if (S.catchingUp()) {                                          // reload mid-game: re-simulate the log, 12 ms a frame
        const t0 = performance.now();
        while (performance.now() - t0 < 12 && S.catchingUp() && S.pump(sample, 300) > 0);
        S.pump(sample, 0);
        bind(game, C.you);
        overlay.banner('resim', S.simT, S.frames.length);
        return;
      }
      C.acc = Math.min(C.acc + dt * 60 * (game.timeScale ?? 1), 6);
      const due = Math.floor(C.acc), depth = S.depth();
      const extra = depth > S.D + 4 ? Math.min(depth - S.D, 30) : 0;   // fell behind the clock: catch up quickly
      const n = S.pump(sample, due + extra);
      C.acc = Math.max(0, C.acc - n);
      const now = performance.now();
      if (n < due && S.live && !S.halted && !S.over) {
        S.stats.stalls += due - n;
        if (!C.waitingSince) C.waitingSince = now;
      } else if (n > 0) C.waitingSince = 0;
      bind(game, C.you);
      // messages / minute (the server's request budget), sampled every second
      if (!C.msgLog.length || now - C.msgLog.at(-1)[0] >= 1000) { C.msgLog.push([now, S.sock?.msgs ?? 0]); if (C.msgLog.length > 61) C.msgLog.shift(); }
    },
    beforeRender(dt) {
      if (!game.heroes) return;
      bind(game, C.you);
      if (partnerViews) {
        partnerViews.hero.root.visible = C.inBattle;
        partnerViews.hero.update(Math.min(dt, 0.1));
        bind(game, 1 - C.you); partnerViews.mu.update(dt); bind(game, C.you);
      }
      overlay.update(game, C);
      team.update();
    },
    ended(e) { C.ended = true; C.S?.end(e.win); },
    msgsPerMin() {
      const L = C.msgLog;
      if (L.length < 2) return 0;
      const a = L[0], b = L.at(-1);
      return Math.round((b[1] - a[1]) / Math.max(1e-3, (b[0] - a[0]) / 60000));
    },
    paused: () => api.isPaused(),
  };

  function sample() {
    if (bot) {
      const b = game.bound; bind(game, C.you);
      const inp = bot(game); bind(game, b);
      input.sample();
      return encodeIn(inp, { pause: api.isPaused() });
    }
    return encodeIn(input.sample(), { interact: C.interact, pause: api.isPaused() });
  }

  // F = revive (hold next to a downed partner), only in a co-op battle
  addEventListener('keydown', (e) => { if (e.code === 'KeyF' && C.inBattle) C.interact = true; });
  addEventListener('keyup', (e) => { if (e.code === 'KeyF') C.interact = false; });
  addEventListener('blur', (e) => { if (e.isTrusted) C.interact = false; });

  // a tab left open across a deploy keeps the old simulation: compare with the deployed version file on the co-op menu
  async function checkStale() {
    try {
      const t = await (await fetch(`${new URL('./version.js', import.meta.url).href}?t=${Date.now()}`, { cache: 'no-store' })).text();
      const v = +(/SIM_VERSION = (\d+)/.exec(t)?.[1] || 0);
      C.stale = v > SIM_VERSION; lobby?.refresh();
    } catch { /* offline: the lobby handshake still guards */ }
  }
  on('flow', (e) => {
    if (e.state === 'coop') checkStale();
    if (e.state === 'battle' && e.ctx?.coop) coop.enterBattle();
    else if (e.state !== 'battle') C.inBattle = false;
    if (e.state === 'title' && C.S) { coop.leave(); detachCoop(game); dropPartner?.(); partnerViews?.hero.dispose(); partnerViews?.mu.dispose(); partnerViews = null; dropPartner = null; }
  });
  // a hidden tab gets no animation frames and its timers run at ≈ 1 Hz: promise neutral input 1.5 s ahead (the partner
  // would wait otherwise) and step every frame that has arrived (≤ 50 ms of work per call)
  let hidT = performance.now();
  setInterval(() => {
    const now = performance.now(), d = Math.min(1, (now - hidT) / 1000); hidT = now;
    if (!document.hidden || !coop.active()) return;
    coop.frame(d);
    const S = C.S;
    if (!S || S.catchingUp()) return;
    S.away(90);
    while (S.depth() > 0 && performance.now() - now < 50 && S.pump(sample, 60) > 0);
    bind(game, C.you);
  }, 200);
  // 2P rule events → overlay banners
  on('coop:down', (e) => overlay.event('down', e.i));
  on('coop:revive', (e) => overlay.event('revive', e.i));
  on('coop:respawn', (e) => overlay.event('respawn', e.i, e.both));
  window.__coop = coop;                              // testing build: bench/net/page-duo.mjs reads the session
  return coop;
}
export { COOP };
