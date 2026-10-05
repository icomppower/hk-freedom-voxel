// Online co-op gate: headless Node clients (bench/net/client.mjs, the real session / lockstep code) against a server —
// `wrangler dev` (default: started here on :8787) or the deployed worker (--server URL). Scenarios:
//   quick      two clients Quick Match, clear hk1 on bot hands: both WIN, 0 desyncs, identical final hashes
//   room       private room: one creates (code), the other joins by code — same asserts
//   full       a 3rd joiner gets "room full" (lobby) and so does a 4th during the game
//   reconnect  one client's process dies at tick 3000 and comes back (same pid): it re-simulates the log from tick 0,
//              rejoins, both clear hk1 with 0 desyncs; plus a same-page socket drop at tick 6000
//   takeover   a client dies and stays gone > 60 s: its hero switches to bot autoplay; it comes back later and takes
//              the hero back; 0 desyncs, identical final hashes
//   pause      one client holds pause for 300 ticks: both consume the same paused frames, hashes identical
//   netsim     both clients ?netsim=150,30 and paced at 60 Hz: 0 desyncs; RTT and stall % reported
//   hidden     B in a background tab (1 Hz wakes) for 30 s: 0 desyncs, on-screen A stalls < 5 % (--hide-mode old: pre-fix)
//   coopbot    one client + the room's bot slot (?coopbot) clears hk1
//   scaling    (every run) boss hpMax = base × 1.6, officers × 1.3 (× difficulty)
//   node --import ./bench/harness/register.mjs bench/net/online.mjs [scenario …] [--server URL] [--chapter hk1]
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const ROOT = resolve(import.meta.dirname, '../..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const chapter = opt('chapter', 'hk1');
const { CHAPTERS } = await import('../../src/story/chapters.js');
const { CROWD } = await import('../../src/crowd/crowd.js');
const OFFS = Object.values(CHAPTERS[chapter].OFF);
const want = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
const ALL = ['quick', 'room', 'full', 'reconnect', 'pause', 'coopbot', 'takeover', 'netsim', 'hidden'];
const list = want.length ? want : ALL;
let server = opt('server', null), dev = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!server) {
  server = 'http://localhost:8787';
  const up = await fetch(server).then((r) => r.ok).catch(() => false);
  if (!up) {
    dev = spawn('npx', ['wrangler', 'dev', '--port', '8787', '--env-file', '/dev/null'], { cwd: resolve(ROOT, 'coop-server'), stdio: 'ignore' });
    for (let i = 0; i < 60 && !(await fetch(server).then((r) => r.ok).catch(() => false)); i++) await sleep(500);
  }
}

function client(args, tag) {
  const p = spawn(process.execPath, ['--import', './bench/harness/register.mjs', '--no-warnings', 'bench/net/client.mjs', '--server', server, '--chapter', chapter, ...args], { cwd: ROOT });
  const lines = [], waiters = [];
  let buf = '';
  p.stdout.on('data', (d) => {
    buf += d; let k;
    while ((k = buf.indexOf('\n')) >= 0) {
      const l = buf.slice(0, k); buf = buf.slice(k + 1);
      try { const o = JSON.parse(l); lines.push(o); for (const w of [...waiters]) if (w.f(o)) { waiters.splice(waiters.indexOf(w), 1); w.r(o); } } catch { /* not json */ }
    }
  });
  p.stderr.on('data', (d) => process.stderr.write(`[${tag}] ${d}`));
  const done = new Promise((r) => p.on('exit', (code) => r(code)));
  return {
    p, lines, done, tag,
    wait: (f, ms = 600000) => Promise.race([new Promise((r) => waiters.push({ f, r })), sleep(ms).then(() => null)]),
    result: () => lines.find((o) => o.ev === 'result'),
  };
}
const pid = () => Math.random().toString(16).slice(2);
const results = [];
const report = (name, ok, msg) => { results.push([name, ok]); console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${msg}`); };

function judge(name, a, b, extra = '') {
  const ra = a.result(), rb = b.result();
  if (!ra || !rb) return report(name, false, `missing result (${!!ra} / ${!!rb})`);
  const scale = scalingOk([ra, rb]);
  const ok = ra.win === true && rb.win === true && !ra.desync && !rb.desync && ra.hash === rb.hash && ra.lastHash?.[1] === rb.lastHash?.[1] && scale.ok;
  report(name, ok, `win ${ra.win}/${rb.win} · desyncs ${ra.desync ? 1 : 0}/${rb.desync ? 1 : 0} · final ${ra.hash} / ${rb.hash} · ${ra.simT} ticks (${ra.frame} sim frames) · ` +
    `hash checks ${ra.hashes}/${rb.hashes} · rtt ${ra.stats.rtt}/${rb.stats.rtt} ms (max ${Math.round(ra.stats.rttMax)}/${Math.round(rb.stats.rttMax)}) · D ${ra.stats.D}/${rb.stats.D} · ` +
    `stall ${ra.stats.stallPct}/${rb.stats.stallPct} % · wall ${ra.wall}/${rb.wall} s · ${rate(ra)} | ${rate(rb)} · ${scale.msg}${extra}`);
  return ok;
}
// messages the server receives from one client (input runs + lobby / pings): per minute of wall time and of sim time
const rate = (r) => `msgs ${r.sockMsgs} (${Math.round(r.sockMsgs / (r.wall / 60))}/min wall, ${Math.round(r.sockMsgs / (r.simT / 3600))}/min sim)`;
function scalingOk(rs) {
  // every officer seen: hpMax = base × 1.3, bosses base × 1.6 (co-op difficulty is 普通: officerHp × 1)
  const seen = rs.flatMap((r) => r.officers || []), bad = [];
  for (const [en, boss, hpMax] of seen) {
    const d = OFFS.find((o) => o.name.en === en);
    const want = d && (d.hp ?? CROWD.officerHp) * (d.boss ? 1.6 : 1.3);
    if (!d || Math.abs(want - hpMax) > 1e-9) bad.push(`${en} ${hpMax} ≠ ${want}`);
  }
  const ok = !bad.length && seen.some((o) => o[1]);
  return { ok, msg: `scaling ${seen.length - bad.length}/${seen.length} (${[...new Set(seen.map((o) => `${o[0]}${o[1] ? '*' : ''} ${o[2]}`))].join(', ') || '-'})${bad.length ? ' BAD ' + bad.join('; ') : ''}${seen.some((o) => o[1]) ? '' : ' (no boss seen)'}` };
}

async function pair(name, aArgs, bArgs, { join = 'room' } = {}) {
  let a, b;
  if (join === 'quick') {
    a = client(['--mode', 'quick', '--name', 'A', ...aArgs], name + ':A');
    await sleep(400);
    b = client(['--mode', 'quick', '--name', 'B', ...bArgs], name + ':B');
  } else {
    a = client(['--mode', 'create', '--name', 'A', ...aArgs], name + ':A');
    const c = await a.wait((o) => o.ev === 'code', 30000);
    b = client(['--mode', 'join', '--code', c.code, '--name', 'B', ...bArgs], name + ':B');
    a.code = c.code;
  }
  return [a, b];
}

for (const sc of list) {
  const t0 = Date.now();
  if (sc === 'quick') { const [a, b] = await pair('quick', [], [], { join: 'quick' }); await a.done; await b.done; judge('quick match hk1', a, b); }
  if (sc === 'room') { const [a, b] = await pair('room', [], []); await a.done; await b.done; judge(`private room ${a.code} hk1`, a, b); }
  if (sc === 'full') {
    const [a, b] = await pair('full', ['--no-ready', '--hold-ms', '6000'], ['--no-ready', '--hold-ms', '6000']);
    await b.wait((o) => o.ev === 'status' && o.t === 'joined', 20000);
    const c = client(['--mode', 'join', '--code', a.code, '--name', 'C'], 'full:C');
    await c.done; await a.done; await b.done;
    const lobbyFull = c.result()?.full === true;
    const [d, e] = await pair('full2', ['--max-frames', '2400'], ['--max-frames', '2400']);
    await d.wait((o) => o.ev === 'start', 30000);
    const f = client(['--mode', 'join', '--code', d.code, '--name', 'F'], 'full:F');
    await f.done; await d.done; await e.done;
    report('room full', lobbyFull && f.result()?.full === true, `3rd joiner in the lobby: full=${c.result()?.full}; joiner during the game: full=${f.result()?.full}`);
  }
  if (sc === 'reconnect') {
    const bp = pid();
    const [a, b] = await pair('reconnect', [], ['--pid', bp, '--die-at', '3000']);
    await b.done;
    await sleep(2000);
    const b2 = client(['--mode', 'join', '--code', a.code, '--name', 'B', '--pid', bp, '--drop-at', '6000'], 'reconnect:B2');
    const st = await b2.wait((o) => o.ev === 'start', 30000);
    await a.done; await b2.done;
    judge('reconnect (process killed at tick 3000, re-sim from 0, + socket drop at 6000)', a, b2, ` · resumed with ${st?.total} logged frames`);
  }
  if (sc === 'pause') {
    const [a, b] = await pair('pause', ['--pause-at', '2000', '--pause-for', '300'], []);
    await a.done; await b.done;
    const pa = a.result()?.stats.paused, pb = b.result()?.stats.paused;
    judge('pause from one side', a, b, ` · paused frames ${pa}/${pb}`);
    if (!(pa >= 300 && pa === pb)) report('pause frames equal', false, `${pa} / ${pb}`);
  }
  if (sc === 'coopbot') {
    const a = client(['--mode', 'create', '--name', 'A', '--bot'], 'coopbot:A');
    await a.done;
    const r = a.result();
    report('?coopbot (slot 2 bot through the server)', r?.win === true && !r.desync, `win ${r?.win} · ${r?.simT} ticks · final ${r?.hash} · kos ${r?.kos}`);
  }
  if (sc === 'takeover') {
    const bp = pid();
    const [a, b] = await pair('takeover', [], ['--pid', bp, '--die-at', '2400']);
    await b.done;
    const bot = await a.wait((o) => o.ev === 'status' && o.t === 'partner-bot', 90000);
    const tBot = (Date.now() - t0) / 1000;
    await sleep(5000);
    const b2 = client(['--mode', 'join', '--code', a.code, '--name', 'B', '--pid', bp], 'takeover:B2');
    await a.done; await b2.done;
    judge('60 s bot takeover + rejoin', a, b2, ` · partner-bot status ${bot ? 'seen' : 'MISSING'} at ${tBot.toFixed(0)} s`);
    if (!bot) report('bot takeover event', false, 'no partner-bot status');
  }
  if (sc === 'netsim') {
    const fd = opt('netsim-d', null), dA = fd ? ['--d', fd] : [];      // --netsim-d N: fixed input delay instead of 2-8 adaptive
    const [a, b] = await pair('netsim', ['--netsim', '150,30', '--pace', ...dA], ['--netsim', '150,30', '--pace', ...dA]);
    await a.done; await b.done;
    judge(`netsim 150,30 paced 60 Hz${fd ? ' (fixed D ' + fd + ')' : ''}`, a, b);
  }
  if (sc === 'hidden') {   // B goes to a background tab for 30 s at tick 1800; A (on screen) must not wait on it
    const mode = opt('hide-mode', 'new');
    const [a, b] = await pair('hidden', ['--pace'], ['--pace', '--hide-at', '1800', '--hide-ms', '30000', '--hide-mode', mode]);
    await a.done; await b.done;
    const st = a.result()?.stats.stallPct;
    const ok = judge(`partner in a background tab 30 s (${mode})`, a, b, ` · on-screen player stall ${st} %`);
    if (ok && !(st < 5)) report('on-screen player keeps playing', false, `stall ${st} % ≥ 5 %`);
  }
  console.log(`   (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
dev?.kill();
const bad = results.filter((r) => !r[1]);
console.log(bad.length ? `ONLINE FAIL: ${bad.length}/${results.length}` : `ONLINE PASS: ${results.length}/${results.length}`);
process.exit(bad.length ? 1 : 0);
