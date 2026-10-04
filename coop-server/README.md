# hk-freedom-coop — online co-op server

Cloudflare Worker + two SQLite-backed Durable Objects for 香港自由戰士 · Voxel online co-op (`?coop`). Started from
Viking Row's `party-server/` (one DO per room code, explicit `alarmPurpose`, the `url.search` forwarding fix, server-side
name sanitising, `.env` token deploy). No QR codes.

- `Room` (one per 4-letter code, no I / O / 0 / 1): 2 slots (a 3rd joiner gets `full`), lobby (names, one character
  each, chapter picked by the room creator, Ready × 2), then the lockstep frame clock: merges both players' input runs
  into frames, keeps the whole frame log (reconnect = replay from tick 0), compares state hashes every 120 ticks,
  a slot gone 60 s turns to bot autoplay. Lobby idles out after 10 min, 2 h hard cap, cleanup 5 s after `game_over`.
- `Matchmaker` (single instance): Quick Match queue, pairs the first two, entries expire after 2 min.

Endpoints: `POST /api/create` → `{code}` · `WS /api/room/CODE/ws?name=&pid=` · `GET /api/room/CODE/status` ·
`WS /api/quick?name=`.

## Local

```sh
npm install
npx wrangler dev                 # http://localhost:8787 — the game: ?coop&coopserver=http://localhost:8787
```

Tests (repo root): `node --import ./bench/harness/register.mjs bench/net/online.mjs` (headless clients, starts
`wrangler dev` itself) and `bench/net/page-duo.mjs` (two real browsers).

## Deploy (manual)

1. Token: `coop-server/.env` with `CLOUDFLARE_API_TOKEN=...` (and `CLOUDFLARE_ACCOUNT_ID=...`). Reuse Viking Row's
   (`find ~ -path "*viking-row/party-server/.env"`), check it with `set -a && . ./.env && set +a && npx wrangler whoami`;
   if it is invalid: dash.cloudflare.com → Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template →
   your account → Create, and copy the Account ID from Workers & Pages.
2. `git status` must not list `.env` (it is ignored here and at the repo root).
3. `npm run coop:deploy` — the first deploy creates the Worker and both Durable Objects (migration `v1`,
   `new_sqlite_classes`: the Free plan rejects key-value DOs).
4. Live at https://hk-freedom-coop.icomppower.workers.dev (the client's default server; `?coopserver=` overrides).
5. Usage: Workers & Pages → `hk-freedom-coop` → Metrics. Free plan: 100,000 requests / day, reset 00:00 UTC. Incoming
   WebSocket messages count toward it, so the client sends input runs (≤ 1 message / 3 ticks while the input changes, a
   heartbeat ≈ every 250 ms when idle). Over quota the client shows "server busy, try later".
