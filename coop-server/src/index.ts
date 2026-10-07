// hk-freedom-coop — online co-op server for 香港自由戰士 · Voxel (Cloudflare Worker + Durable Objects).
// Started from Viking Row's party-server (icomppower/viking-row party-server/): one Durable Object per room code, an
// explicit alarmPurpose, the url.search forwarding fix, server-side name sanitising, .env token deploy, the account's
// icomppower workers.dev subdomain. The QR encoder / phone controller page are gone (no QR codes here).
//   POST /api/create                     → { code }                  private room (4 letters, no I / O)
//   GET  /api/room/:code/ws?name=&pid=   → WebSocket                 lobby + lockstep (room.ts)
//   GET  /api/room/:code/status          → { phase, players, … }
//   GET  /api/quick?name=                → WebSocket                 Quick Match queue (matchmaker.ts) → { matched, code }
//   POST /api/report/:code  · GET /api/report[/:code]                 desync reports (gzip+base64 dumps, newest 20)
import { Room } from "./room";
import { Matchmaker } from "./matchmaker";
import { allocRoom } from "./util";

export { Room, Matchmaker };

export interface Env {
  ROOM: DurableObjectNamespace;
  MATCH: DurableObjectNamespace;
}

function cors(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
  };
}
function json(data: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...cors(origin) } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });

    if (url.pathname === "/api/create" && request.method === "POST") {
      const code = await allocRoom(env, "private");
      return code ? json({ code }, 200, origin) : json({ error: "could_not_allocate_room" }, 503, origin);
    }

    const m = url.pathname.match(/^\/api\/room\/([A-Za-z]{4})\/(ws|status)$/);
    if (m) {
      const code = m[1].toUpperCase(), action = m[2];
      const stub = env.ROOM.get(env.ROOM.idFromName(code));
      // forward the query string (name, pid): Viking Row's url.search fix
      const res = await stub.fetch(`https://room/${action}${url.search}${url.search ? "&" : "?"}code=${code}`, {
        method: request.method,
        headers: request.headers,
      });
      if (action === "status") return new Response(await res.text(), { status: res.status, headers: { "content-type": "application/json", ...cors(origin) } });
      return res;
    }

    const rep = url.pathname.match(/^\/api\/report(?:\/([A-Za-z]{4}))?$/);
    if (rep && (request.method === "GET" || request.method === "POST")) {   // desync reports (matchmaker.ts report())
      const stub = env.MATCH.get(env.MATCH.idFromName("quick"));
      const res = await stub.fetch(`https://match/report?code=${rep[1] ?? ""}`, { method: request.method, body: request.method === "POST" ? await request.text() : undefined });
      return new Response(await res.text(), { status: res.status, headers: { "content-type": "application/json", ...cors(origin) } });
    }

    if (url.pathname === "/api/quick") {
      const stub = env.MATCH.get(env.MATCH.idFromName("quick"));
      return stub.fetch(`https://match/quick${url.search}`, { method: request.method, headers: request.headers });
    }

    if (url.pathname === "/" || url.pathname === "") {
      return new Response("香港自由戰士 · Voxel co-op server. Rooms: POST /api/create, WS /api/room/CODE/ws. Quick Match: WS /api/quick.", {
        headers: { "content-type": "text/plain; charset=utf-8", ...cors(origin) },
      });
    }
    return new Response("not found", { status: 404 });
  },
};
