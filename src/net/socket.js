// Co-op socket: a WebSocket with optional artificial latency / jitter (?netsim=150,30 → +150 ms round trip, ±30 ms per
// message each way, order kept) and a ping every second (rtt / jitter, smoothed). Works in the page and in Node ≥ 22
// (global WebSocket). Never reconnects by itself: the session decides (src/net/session.js).
//   const s = createSocket(url, { netsim: [lat, jit], onOpen, onMessage(msg), onClose(code, reason) })
//   s.send(obj) · s.close() · s.rtt · s.jit · s.open · s.msgs (messages sent: the server's request budget)
//   s.quiet = true: no ping messages of its own; the session puts the ping on its input messages (s.pingDue() / s.stamp()).
// Ping every 2 s (lobby / queue), answered by { type: 'pong', t }. opened: false until the server accepted the socket
// (a socket that closes before that = the server refused or is over its daily quota: "server busy").
export function createSocket(url, { netsim = null, onOpen, onMessage, onClose } = {}) {
  const [lat = 0, jit = 0] = netsim || [];
  const oneWay = () => Math.max(0, lat / 2 + (Math.random() * 2 - 1) * jit);
  let ws, pingT = 0;
  const s = { rtt: 0, jit: 0, open: false, opened: false, pings: 0, msgs: 0, quiet: false, pingAt: -1e9 };
  const PING_MS = 2000;
  s.pingDue = () => performance.now() - s.pingAt >= PING_MS;
  s.stamp = () => (s.pingAt = performance.now());
  // ordered delayed delivery: one FIFO queue per direction, drained by a single timer (a timer per message can swap
  // two messages: setTimeout truncates fractional ms)
  const queue = () => {
    const q = [];
    let t = 0, last = 0;
    const drain = () => {
      t = 0;
      while (q.length && q[0].at <= performance.now()) q.shift().fn();
      if (q.length) t = setTimeout(drain, Math.max(0, q[0].at - performance.now()));
    };
    return (fn) => {
      if (!lat && !jit) { fn(); return; }
      last = Math.max(last, performance.now() + oneWay());
      q.push({ at: last, fn });
      if (!t) t = setTimeout(drain, Math.max(0, q[0].at - performance.now()));
    };
  };
  const inQ = queue(), outQ = queue();
  try { ws = new WebSocket(url); } catch (e) { setTimeout(() => onClose?.(4000, 'connect failed')); return Object.assign(s, { send() {}, close() {} }); }
  ws.onopen = () => {
    s.open = s.opened = true;
    onOpen?.();
    pingT = setInterval(() => { if (!s.quiet && s.pingDue()) s.send({ type: 'ping', t: s.stamp() }); }, 250);
    s.send({ type: 'ping', t: s.stamp() });
  };
  ws.onmessage = (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    inQ(() => {
      if (m.type === 'pong') {
        const r = performance.now() - m.t;
        s.rtt = s.pings ? s.rtt * 0.8 + r * 0.2 : r; s.jit = s.pings ? s.jit * 0.8 + Math.abs(r - s.rtt) * 0.2 : 0; s.pings++;
      }
      onMessage?.(m);
    });
  };
  let closed = false;                                  // onClose once: from the server, or at once on our own close()
  const fin = (code, reason) => { if (closed) return; closed = true; s.open = false; clearInterval(pingT); inQ(() => onClose?.(code, reason)); };
  ws.onclose = (ev) => fin(ev.code, ev.reason);
  ws.onerror = () => {};
  s.send = (obj) => {
    const d = JSON.stringify(obj);
    s.msgs++;
    outQ(() => { if (ws.readyState === 1) ws.send(d); });
  };
  s.close = () => { try { ws.close(1000, 'bye'); } catch { /* closed */ } fin(1000, 'bye'); };
  return s;
}

/** Server URL for HTTP calls from the WebSocket base or vice versa. */
export const httpOf = (u) => u.replace(/^ws/, 'http');
export const wsOf = (u) => u.replace(/^http/, 'ws');
