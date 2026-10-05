// Room Durable Object: 2 slots, the lobby, and the lockstep frame clock.
// Lobby: names, a character each (auto-assigned the free one, swap on request, never a duplicate), the chapter (room
// creator = slot 0 picks), Ready × 2 → start { seed, chapter, chars, names, bots, you }. A 3rd joiner gets "full".
// Game: each client commits its input for tick N + D and sends runs { type: "input", t, n, c: [[offset, in], …] }
// covering ticks t … t+n-1 — only the ticks whose input differs from the previous tick's rest value (presses and look
// deltas cleared) are listed (src/net/session.js sender: ≤ 1 message per 3 ticks while the input changes, a heartbeat
// ≈ every 250 ms when idle — the Free plan counts every incoming WebSocket message). The state hash ({ h: [t, hash] })
// and the ping ({ p }) ride on those messages. Once both inputs (or a bot slot) for tick `next` are in, the room merges
// them into frame `next` and broadcasts { type: "frame", t, f: [[in0, in1], …] } (null = that hero on bot autoplay,
// run by both clients). The full merged log is kept: a reconnecting client (same pid) gets it back (start
// { resume } + frames chunks), re-simulates from tick 0 and sends "live"; the room answers with the tick its inputs
// count from. A slot gone > 60 s turns bot ({ type: "bot", slot, from }). Every 120 ticks both clients send their state
// hash; a mismatch stops the clock and broadcasts { type: "desync", t, h }.
// Lifetime (explicit alarmPurpose, Viking Row lesson): lobby idles out after 10 min, 2 h hard cap, cleanup 5 s after
// game_over. Sockets use the standard accept() (not hibernation): the room stays in memory while anyone is connected.
import { DurableObject } from "cloudflare:workers";
import type { Env } from "./index";

const CHARS = ["lungjai", "siumei"];
const CHAPTERS = ["hk1", "hk2", "hk3", "hk4"];
const LOBBY_IDLE_MS = 10 * 60_000, CAP_MS = 2 * 60 * 60_000, CLEANUP_MS = 5_000, BOT_AFTER_MS = 60_000;
const IN_RATE = 40, IN_BURST = 120;               // input messages per second per connection (token bucket; a client
                                                  // sends ≤ 20 / s), ≤ 120 ticks per message
const MSG_RATE = 400, MSG_BURST = 800;            // any message
const CHUNK = 4000;                               // frames per resume chunk
const HASH_EVERY = 120;

type In = number[] | null;
interface Slot {
  pid: string; name: string; ws: WebSocket | null; pick: string | null; ready: boolean; bot: boolean;
  leftAt: number; lastIn: number; rest: number[]; pend: Map<number, number[]>; humanAt: number;
  inTok: number; msgTok: number; tokT: number;
}

function sanitizeName(raw: string | null): string {
  // eslint-disable-next-line no-control-regex
  const cleaned = (raw ?? "").replace(/[\x00-\x1F\x7F<>]/g, "").trim().slice(0, 16);
  return cleaned || "Player";
}
const EMPTY = [0, 0, 0, 0, 0, 0];
const REST = (v: number[]) => [v[0], v[1], 0, 0, 0, v[5]];
const validIn = (a: unknown): a is number[] =>
  Array.isArray(a) && a.length === 6 && a.every((v) => Number.isInteger(v) && v >= -32000 && v <= 32000);

export class Room extends DurableObject<Env> {
  code = "";
  kind = "private";
  phase: "none" | "lobby" | "game" | "desync" | "over" = "none";
  slots: (Slot | null)[] = [null, null];
  chapter = "hk1";
  created = 0;
  idleAt = 0;
  // game
  seed = 0; chars: string[] = []; names: string[] = [];
  next = 0; log: In[][] = []; hashes = new Map<number, (string | null)[]>();
  hashOk = 0; desyncs = 0; startedAt = 0; ends = 0;
  deadlines: Record<string, number> = {};

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.searchParams.get("code")) this.code = url.searchParams.get("code")!;
    if (url.pathname === "/init") return this.init(url);
    if (url.pathname === "/status") return this.status();
    if (url.pathname === "/ws") return this.join(request, url);
    return new Response("not found", { status: 404 });
  }

  // ---------------------------------------------------------------- lifetime
  async init(url: URL): Promise<Response> {
    const stored = await this.ctx.storage.get<string>("phase");
    const fresh = this.phase === "none" && !stored;
    if (fresh) {
      this.phase = "lobby"; this.kind = url.searchParams.get("kind") === "quick" ? "quick" : "private";
      this.created = Date.now(); this.idleAt = this.created + LOBBY_IDLE_MS;
      await this.ctx.storage.put("phase", "lobby");
      this.deadlines.cap = this.created + CAP_MS;
      await this.arm();
    }
    return Response.json({ ok: true, fresh });
  }

  async arm() {
    const d = { ...this.deadlines };
    if (this.phase === "lobby") d.idle = this.idleAt;
    const due = Object.entries(d).filter(([, t]) => t > 0).sort((a, b) => a[1] - b[1]);
    if (!due.length) return;
    await this.ctx.storage.put("alarmPurpose", due[0][0]);
    await this.ctx.storage.setAlarm(due[0][1]);
  }

  async alarm(): Promise<void> {
    if (this.phase === "none") {                    // evicted while empty: whatever was scheduled, the room is gone
      await this.ctx.storage.deleteAll(); return;
    }
    const now = Date.now();
    if (this.deadlines.cleanup && now >= this.deadlines.cleanup) return this.cleanup("over");
    if (this.deadlines.cap && now >= this.deadlines.cap) return this.cleanup("time_cap");
    if (this.phase === "lobby" && now >= this.idleAt) return this.cleanup("idle");
    for (const k of [0, 1]) {
      const key = "bot" + k, t = this.deadlines[key];
      if (t && now >= t) {
        delete this.deadlines[key];
        const s = this.slots[k];
        if (s && !s.ws && !s.bot && (this.phase === "game")) {
          s.bot = true; s.humanAt = Infinity; s.pend.clear();
          this.broadcast({ type: "bot", slot: k, from: this.next });
          this.pump();
        }
      }
    }
    await this.arm();
  }

  async cleanup(reason: string) {
    this.broadcast({ type: "room_closed", reason });
    for (const s of this.slots) if (s?.ws) { try { s.ws.close(1000, reason); } catch { /* closed */ } }
    this.slots = [null, null]; this.phase = "none"; this.log = []; this.deadlines = {};
    await this.ctx.storage.deleteAll();
  }

  async status(): Promise<Response> {
    const stored = await this.ctx.storage.get<string>("phase");
    return Response.json({
      phase: this.phase === "none" && stored ? "lobby" : this.phase, code: this.code, kind: this.kind, chapter: this.chapter,
      players: this.slots.map((s) => s && { name: s.name, pick: s.pick, ready: s.ready, bot: s.bot, on: !!s.ws }),
      next: this.next, frames: this.log.length, hashOk: this.hashOk, desyncs: this.desyncs,
      lastIn: this.slots.map((s) => s && s.lastIn), pend: this.slots.map((s) => s && s.pend.size), tok: this.slots.map((s) => s && Math.floor(s.inTok)),
    });
  }

  // ---------------------------------------------------------------- connections
  async join(request: Request, url: URL): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 400 });
    if (this.phase === "none") {
      const stored = await this.ctx.storage.get<string>("phase");
      if (!stored) return Response.json({ error: "room_not_found" }, { status: 404 });
      this.phase = "lobby"; this.created = Date.now(); this.idleAt = this.created + LOBBY_IDLE_MS; // came back from eviction
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    const pid = (url.searchParams.get("pid") || "").slice(0, 64) || crypto.randomUUID();
    const name = sanitizeName(url.searchParams.get("name"));
    let k = this.slots.findIndex((s) => s && s.pid === pid);
    if (k < 0) {
      if (this.phase !== "lobby") k = -1;
      else k = this.slots.findIndex((s) => !s);
      if (k < 0) {
        this.send(server, { type: "full", code: this.code });
        server.close(4001, "room full");
        return new Response(null, { status: 101, webSocket: client });
      }
      const taken = this.slots.find((s) => s)?.pick;
      this.slots[k] = {
        pid, name, ws: null, pick: CHARS.find((c) => c !== taken) ?? null, ready: false, bot: false, leftAt: 0,
        lastIn: -1, rest: EMPTY, pend: new Map(), humanAt: 0, inTok: IN_BURST, msgTok: MSG_BURST, tokT: Date.now(),
      };
    }
    const s = this.slots[k]!;
    if (s.ws) { try { s.ws.close(4002, "replaced"); } catch { /* closed */ } }
    s.ws = server; s.leftAt = 0; s.name = name;
    delete this.deadlines["bot" + k]; delete this.deadlines.cleanup;
    server.addEventListener("message", (ev) => this.onMessage(server, k, ev.data));
    // answer the close handshake (no auto-reply at this compatibility date: the client's onclose would never fire)
    server.addEventListener("close", () => { try { server.close(1000, "bye"); } catch { /* closed */ } this.onClose(server, k); });
    server.addEventListener("error", () => this.onClose(server, k));
    this.send(server, { type: "hello", you: k, code: this.code, host: k === this.host(), kind: this.kind, pid });
    if (this.phase === "game" || this.phase === "desync") this.resume(k);
    else { this.touch(); this.lobby(); }
    await this.arm();
    return new Response(null, { status: 101, webSocket: client });
  }

  onClose(ws: WebSocket, k: number) {
    const s = this.slots[k];
    if (!s || s.ws !== ws) return;
    s.ws = null;
    if (this.phase === "lobby") {
      this.slots[k] = null;
      if (!this.slots.some((x) => x && !x.bot)) { this.slots = [null, null]; this.deadlines.cleanup = Date.now() + CLEANUP_MS; }
      else this.lobby();
    } else if (this.phase === "game" || this.phase === "desync") {
      s.leftAt = Date.now();
      this.broadcast({ type: "left", slot: k, wait: BOT_AFTER_MS });
      if (!s.bot) this.deadlines["bot" + k] = s.leftAt + BOT_AFTER_MS;
      if (!this.slots.some((x) => x && x.ws)) this.deadlines.cleanup = Date.now() + 10 * 60_000;   // both gone: keep 10 min for a rejoin
    }
    this.ctx.waitUntil(this.arm());
  }

  /** The host (picks the chapter, may add the ?coopbot bot): the lowest occupied human slot. */
  host() { return this.slots.findIndex((s) => s && !s.bot); }

  send(ws: WebSocket | null | undefined, msg: unknown) { if (ws) { try { ws.send(JSON.stringify(msg)); } catch { /* closed */ } } }
  broadcast(msg: unknown) { const d = JSON.stringify(msg); for (const s of this.slots) if (s?.ws) { try { s.ws.send(d); } catch { /* closed */ } } }
  touch() { this.idleAt = Date.now() + LOBBY_IDLE_MS; }

  lobby() {
    this.broadcast({
      type: "lobby", code: this.code, kind: this.kind, chapter: this.chapter, chapters: CHAPTERS, host: this.host(),
      players: this.slots.map((s) => s && { name: s.name, pick: s.pick, ready: s.ready, bot: s.bot, on: !!s.ws || s.bot }),
    });
  }

  // ---------------------------------------------------------------- messages
  onMessage(ws: WebSocket, k: number, raw: unknown) {
    const s = this.slots[k];
    if (!s || s.ws !== ws || typeof raw !== "string" || raw.length > 64_000) return;
    const now = Date.now(), dt = (now - s.tokT) / 1000;
    s.tokT = now;
    s.inTok = Math.min(IN_BURST, s.inTok + dt * IN_RATE);
    s.msgTok = Math.min(MSG_BURST, s.msgTok + dt * MSG_RATE);
    if (s.msgTok < 1) return;                       // rate-limited: dropped
    s.msgTok -= 1;
    let d: any;
    try { d = JSON.parse(raw); } catch { return; }
    switch (d?.type) {
      case "ping": this.send(ws, { type: "pong", t: d.t, next: this.next }); return;
      case "pick": return this.onPick(k, d.char);
      case "swap": return this.onSwap();
      case "chapter": if (k === this.host() && this.phase === "lobby" && CHAPTERS.includes(d.id)) { this.chapter = d.id; this.unready(); this.touch(); this.lobby(); } return;
      case "ready": if (this.phase === "lobby") { s.ready = !!d.v; this.touch(); this.lobby(); this.maybeStart(); } return;
      case "bot": return this.onBot(k, !!d.v);
      case "input": return this.onInput(k, s, d);
      case "live": return this.onLive(k);
      case "ui": this.broadcast({ type: "ui", slot: k, a: String(d.a ?? "").slice(0, 16), n: d.n | 0 }); return;
      case "end": return this.onEnd(d);
      case "game_over": this.deadlines.cleanup = Date.now() + CLEANUP_MS; this.ctx.waitUntil(this.arm()); return;
    }
  }

  unready() { for (const s of this.slots) if (s && !s.bot) s.ready = false; }

  onPick(k: number, c: string) {
    if (this.phase !== "lobby" || !CHARS.includes(c)) return;
    const o = this.slots[1 - k];
    if (o && o.pick === c) return;                  // no duplicates (use swap)
    this.slots[k]!.pick = c; this.unready(); this.touch(); this.lobby();
  }
  onSwap() {
    if (this.phase !== "lobby") return;
    const [a, b] = this.slots;
    if (a && b) [a.pick, b.pick] = [b.pick, a.pick];
    else if (a) a.pick = a.pick === CHARS[0] ? CHARS[1] : CHARS[0];
    this.unready(); this.touch(); this.lobby();
  }
  /** ?coopbot: the host fills slot 2 with bot autoplay (the bot runs in both… in the one client, through this clock). */
  onBot(k: number, v: boolean) {
    if (this.phase !== "lobby" || k !== this.host()) return;
    const b = 1 - k;
    if (v && !this.slots[b]) {
      const taken = this.slots[k]?.pick;
      this.slots[b] = { pid: "bot", name: "Bot", ws: null, pick: CHARS.find((c) => c !== taken)!, ready: true, bot: true, leftAt: 0,
        lastIn: -1, rest: EMPTY, pend: new Map(), humanAt: Infinity, inTok: 0, msgTok: 0, tokT: Date.now() };
    } else if (!v && this.slots[b]?.bot) this.slots[b] = null;
    this.touch(); this.lobby(); this.maybeStart();
  }

  maybeStart() {
    const [a, b] = this.slots;
    if (!a || !b || !a.ready || !b.ready || !a.pick || !b.pick || a.pick === b.pick) return;
    this.phase = "game";
    this.seed = crypto.getRandomValues(new Uint32Array(1))[0] >>> 0 || 1;
    this.chars = [a.pick, b.pick]; this.names = [a.name, b.name];
    this.next = 0; this.log = []; this.hashes.clear(); this.hashOk = 0; this.desyncs = 0; this.ends = 0;
    this.startedAt = Date.now();
    for (const s of this.slots) { s!.lastIn = -1; s!.rest = EMPTY; s!.pend.clear(); if (!s!.bot) s!.humanAt = 0; }
    this.slots.forEach((s, k) => s?.ws && this.send(s.ws, this.startMsg(k, false)));
    delete this.deadlines.cleanup;
    this.ctx.waitUntil(this.arm());
  }

  startMsg(k: number, resume: boolean) {
    return {
      type: "start", seed: this.seed, chapter: this.chapter, chars: this.chars, names: this.names, you: k,
      bots: this.slots.map((s) => !!s?.bot), resume, total: resume ? this.log.length : 0, next: this.next,
    };
  }

  /** A client (re)joined a running game: the whole merged log, then live frames follow on the socket in order. */
  resume(k: number) {
    const s = this.slots[k]!;
    this.send(s.ws, this.startMsg(k, true));
    for (let i = 0; i < this.log.length; i += CHUNK) this.send(s.ws, { type: "frame", t: i, f: this.log.slice(i, i + CHUNK) });
    this.send(s.ws, { type: "synced", next: this.next });
    this.broadcast({ type: "back", slot: k });
    if (this.phase === "desync") this.send(s.ws, { type: "desync", t: -1, h: [] });
  }
  onLive(k: number) {
    const s = this.slots[k];
    if (!s || this.phase !== "game") return;
    let from: number;
    if (s.bot) { from = this.next + 8; s.humanAt = from; s.pend.clear(); }
    else { from = Math.max(this.next, s.lastIn + 1); for (const t of [...s.pend.keys()]) if (t >= from) s.pend.delete(t); }
    s.lastIn = from - 1; s.rest = EMPTY;            // the client's sender restarts from `from` with an empty rest value
    this.send(s.ws, { type: "live", from });
  }

  onInput(k: number, s: Slot, d: any) {
    if (d.p !== undefined) this.send(s.ws, { type: "pong", t: d.p, next: this.next });
    if (Array.isArray(d.h)) this.onHash(k, { t: d.h[0], h: d.h[1] });
    if (this.phase !== "game" || !Number.isInteger(d.t) || !Number.isInteger(d.n) || d.n < 0 || d.n > 120 || !Array.isArray(d.c)) return;
    if (s.inTok < 1) { this.send(s.ws, { type: "slow", from: s.lastIn + 1 }); return; }   // rate-limited: client resends
    s.inTok -= 1;
    if (d.t !== s.lastIn + 1 || d.t + d.n > this.next + 600 || d.c.length > d.n) return;
    const ch = new Map<number, number[]>();
    for (const e of d.c as unknown[]) {
      if (!Array.isArray(e) || !Number.isInteger(e[0]) || e[0] < 0 || e[0] >= d.n || !validIn(e[1])) return;
      ch.set(e[0], e[1]);
    }
    for (let o = 0; o < d.n; o++) {
      const t = d.t + o, a = ch.get(o) ?? s.rest;
      s.rest = REST(a);
      if (t >= this.next && !(s.bot && t < s.humanAt)) s.pend.set(t, a);
    }
    s.lastIn = d.t + d.n - 1;
    this.pump();
  }

  /** Merge every complete tick into the log and broadcast them (one message per batch). */
  pump() {
    if (this.phase !== "game") return;
    const out: In[][] = [], t0 = this.next;
    for (;;) {
      const t = this.next, f: In[] = [];
      let ok = true;
      for (let k = 0; k < 2; k++) {
        const s = this.slots[k]!;
        if (s.bot && t < s.humanAt) { f.push(null); s.pend.delete(t); continue; }
        if (s.bot && t >= s.humanAt) s.bot = false;   // back from bot autoplay
        const a = s.pend.get(t);
        if (!a) { ok = false; break; }
        f.push(a);
      }
      if (!ok) break;
      for (const s of this.slots) s!.pend.delete(t);
      this.log.push(f); out.push(f); this.next++;
    }
    if (out.length) this.broadcast({ type: "frame", t: t0, f: out });
  }

  onHash(k: number, d: any) {
    if (this.phase !== "game" || !Number.isInteger(d.t) || d.t % HASH_EVERY || typeof d.h !== "string") return;
    const e = this.hashes.get(d.t) ?? [null, null];
    e[k] = d.h.slice(0, 16);
    this.hashes.set(d.t, e);
    if (e[0] && e[1]) {
      this.hashes.delete(d.t);
      if (e[0] === e[1]) { this.hashOk++; return; }
      this.desyncs++; this.phase = "desync";
      this.broadcast({ type: "desync", t: d.t, h: e });
    } else if (this.slots[1 - k]?.bot) this.hashes.delete(d.t);   // nobody to compare with
    if (this.hashes.size > 64) for (const key of [...this.hashes.keys()].slice(0, 32)) this.hashes.delete(key);
  }

  /** Story end (both clients reach it on the same tick): back to the lobby for the next chapter. */
  onEnd(d: any) {
    if (this.phase !== "game" && this.phase !== "desync") return;
    this.broadcast({ type: "ended", win: !!d.win, frames: this.log.length, hashOk: this.hashOk, desyncs: this.desyncs });
    this.phase = "lobby"; this.log = []; this.next = 0; this.unready();
    for (let k = 0; k < 2; k++) {
      const s = this.slots[k];
      if (s && !s.ws && !s.bot) this.slots[k] = null;     // gone during the game: free the slot
      if (s?.pid === "bot") s.bot = true, s.humanAt = Infinity, s.ready = true;
      delete this.deadlines["bot" + k];
    }
    this.touch(); this.lobby();
    this.ctx.waitUntil(this.arm());
  }
}
