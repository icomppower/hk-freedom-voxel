// Quick Match (single instance, idFromName("quick")): a queue of waiting players. The first two are paired: a room is
// allocated and both get { type: "matched", code } (then they join it like a private room). Entries expire after 2 min
// ({ type: "expired" }); a "cancel" message or closing the socket leaves the queue.
import { DurableObject } from "cloudflare:workers";
import type { Env } from "./index";
import { allocRoom } from "./util";

const EXPIRE_MS = 2 * 60_000;

interface Entry { ws: WebSocket; name: string; at: number; }

function sanitizeName(raw: string | null): string {
  // eslint-disable-next-line no-control-regex
  const cleaned = (raw ?? "").replace(/[\x00-\x1F\x7F<>]/g, "").trim().slice(0, 16);
  return cleaned || "Player";
}

export class Matchmaker extends DurableObject<Env> {
  /** Desync reports (this single instance's SQLite storage outlives the rooms, which wipe theirs at cleanup): POST stores
   *  one client's gzip+base64 dump under its room code (≤ 1.5 MB, the newest 20 kept); GET ?code= returns that room's
   *  reports, GET without a code lists the stored ones. */
  async report(request: Request, url: URL): Promise<Response> {
    const code = (url.searchParams.get("code") || "").toUpperCase();
    const J = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json" } });
    if (request.method === "POST") {
      if (!/^[A-Z]{4}$/.test(code)) return J({ error: "bad_code" }, 400);
      const body = await request.text();
      if (body.length > 1_500_000) return J({ error: "too_large" }, 413);
      await this.ctx.storage.put(`report:${Date.now()}:${code}:${Math.random().toString(36).slice(2, 6)}`, body);
      const keys = [...(await this.ctx.storage.list({ prefix: "report:" })).keys()];
      if (keys.length > 20) await this.ctx.storage.delete(keys.slice(0, keys.length - 20));
      return J({ ok: true });
    }
    const all = await this.ctx.storage.list<string>({ prefix: "report:" });
    if (!code) return J([...all.keys()].map((k) => { const [, at, c] = k.split(":"); return { at: +at, code: c }; }));
    return J([...all].filter(([k]) => k.split(":")[2] === code).map(([k, v]) => ({ at: +k.split(":")[1], body: v })));
  }
  queue: Entry[] = [];
  pairing = false;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/report") return this.report(request, url);
    if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 400 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    const e: Entry = { ws: server, name: sanitizeName(url.searchParams.get("name")), at: Date.now() };
    this.queue.push(e);
    server.addEventListener("message", (ev) => {
      let d: any;
      try { d = JSON.parse(String(ev.data)); } catch { return; }
      if (d?.type === "cancel") this.drop(e, "cancelled");
      else if (d?.type === "ping") this.send(e.ws, { type: "pong", t: d.t });
    });
    server.addEventListener("close", () => { try { server.close(1000, "bye"); } catch { /* closed */ } this.drop(e); });
    server.addEventListener("error", () => this.drop(e));
    this.send(server, { type: "queued", n: this.queue.length });
    await this.ctx.storage.put("alarmPurpose", "expire");
    await this.ctx.storage.setAlarm(Date.now() + 15_000);
    this.ctx.waitUntil(this.pairUp());
    return new Response(null, { status: 101, webSocket: client });
  }

  send(ws: WebSocket, msg: unknown) { try { ws.send(JSON.stringify(msg)); } catch { /* closed */ } }

  drop(e: Entry, reason?: string) {
    const k = this.queue.indexOf(e);
    if (k >= 0) this.queue.splice(k, 1);
    if (reason) { this.send(e.ws, { type: reason }); try { e.ws.close(1000, reason); } catch { /* closed */ } }
  }

  prune() {
    const now = Date.now();
    for (const e of [...this.queue]) if (now - e.at > EXPIRE_MS) this.drop(e, "expired");
  }

  async pairUp() {
    if (this.pairing) return;
    this.pairing = true;
    try {
      this.prune();
      while (this.queue.length >= 2) {
        const a = this.queue.shift()!, b = this.queue.shift()!;
        const code = await allocRoom(this.env, "quick");
        if (!code) { this.send(a.ws, { type: "error", error: "no_room" }); this.send(b.ws, { type: "error", error: "no_room" }); continue; }
        this.send(a.ws, { type: "matched", code, first: true });
        this.send(b.ws, { type: "matched", code, first: false });
      }
    } finally { this.pairing = false; }
  }

  async alarm(): Promise<void> {
    const purpose = await this.ctx.storage.get<string>("alarmPurpose");
    if (purpose !== "expire") return;
    this.prune();
    if (this.queue.length) await this.ctx.storage.setAlarm(Date.now() + 15_000);
    else await this.ctx.storage.delete("alarmPurpose");
  }
}
