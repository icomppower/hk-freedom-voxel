// Co-op version guard gate (two real pages, wrangler dev on :8787 started here): the lobby's SIM_VERSION handshake.
//   same      both pages on this build: the partner's version arrives, no error, Ready enabled, the battle starts
//   differ    page B served SIM_VERSION - 1: both lobbies show 版本不同 with a reload button, Ready disabled on both
//   silent    page B's session never sends its version (a pre-handshake build): page A flags it after 4 s
//   stale     a page whose loaded version.js is older than the deployed file: the co-op menu shows 有新版本 + reload
//   node --import ./bench/harness/register.mjs bench/net/coop-version.mjs
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serve } from '../harness/browser.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = 'http://localhost:8787';
const dev = spawn('npx', ['wrangler', 'dev', '--port', '8787'], { cwd: new URL('../../coop-server/', import.meta.url).pathname, stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(server)).ok) break; } catch {} await sleep(500); }
const srv = await serve();
const VER = +/SIM_VERSION = (\d+)/.exec(readFileSync(new URL('../../src/net/version.js', import.meta.url), 'utf8'))[1];
let bad = 0, n = 0;
const ok = (name, pass, info = '') => { n++; if (!pass) bad++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${info !== '' ? ` — ${info}` : ''}`); };
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu'] });
const q = `coop&coopserver=${encodeURIComponent(server)}`;
/** A page; `patch` rewrites served files (path → fn(text, url)). */
async function open(patch = {}) {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } }), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  for (const [path, fn] of Object.entries(patch)) {
    await page.route(`**/${path}*`, async (route) => {
      const r = await route.fetch(), body = fn(await r.text(), route.request().url());
      route.fulfill({ response: r, body });
    });
  }
  return { page, errors };
}
const until = (p, fn, a, ms = 60000) => p.waitForFunction(fn, a, { timeout: ms, polling: 100 });
async function click(page, sel, text) {
  const b = await page.evaluate(([s, t]) => { const e = [...document.querySelectorAll(s)].find((x) => x.textContent.includes(t) && !x.disabled); if (!e) return null; const k = e.getBoundingClientRect(); return [k.left + k.width / 2, k.top + k.height / 2]; }, [sel, text]);
  if (!b) throw new Error(`no ${sel} "${text}"`);
  await page.mouse.click(b[0], b[1]);
}
async function room(A, B) {
  await A.page.goto(srv.url + '?' + q); await until(A.page, () => window.__vm?.state === 'title');
  await sleep(1200); await A.page.keyboard.press('Enter'); await sleep(800);
  await click(A.page, '#title button', '網上合作'); await until(A.page, () => window.__vm?.state === 'coop'); await sleep(500);
  await click(A.page, '#coop button', '建立房間');
  await until(A.page, () => /^[A-Z]{4}$/.test(document.querySelector('#coop .code')?.textContent || ''));
  const link = await A.page.evaluate(() => window.__coop.link());
  await B.page.goto(link.replace('?coop', '?' + q));
  for (const P of [A, B]) await until(P.page, () => window.__coop?.C.S?.lobbyMsg?.players.every(Boolean));
}
const lobbyState = (P) => P.page.evaluate(() => ({
  err: document.querySelector('#coop .err')?.innerText.replace(/\s+/g, ' ') || '',
  ready: (() => { const b = document.querySelector('#coop button[data-a="ready"]'); return b ? !b.disabled : null; })(),
  reload: !!document.querySelector('#coop button[data-a="reload"]'),
  pv: window.__coop.C.S.partnerVer,
}));
const close = async (...Ps) => { for (const P of Ps) await P.page.close(); };
const older = (t) => t.replace(/SIM_VERSION = \d+/, `SIM_VERSION = ${VER - 1}`);

try {
  // same build
  { const A = await open(), B = await open(); await room(A, B); await sleep(1500);
    const a = await lobbyState(A), b = await lobbyState(B);
    ok('same build: versions exchanged, no error, Ready enabled on both', a.pv === VER && b.pv === VER && !a.err && !b.err && a.ready && b.ready, JSON.stringify([a, b]));
    await click(A.page, '#coop button', '準備'); await click(B.page, '#coop button', '準備');
    const started = await until(A.page, () => window.__vm.state !== 'coop', null, 30000).then(() => true, () => false);
    ok('same build: the room starts', started);
    ok('same build: no page errors', !A.errors.length && !B.errors.length, [...A.errors, ...B.errors].join(' | '));
    await close(A, B); }
  // partner on another version (B's version.js served as VER - 1, its fresh-fetch check too)
  { const A = await open(), B = await open({ 'src/net/version.js': older }); await room(A, B); await sleep(1500);
    const a = await lobbyState(A), b = await lobbyState(B);
    ok('different version: both show 版本不同 with reload, Ready disabled on both', /版本不同/.test(a.err) && /版本不同/.test(b.err) && a.reload && b.reload && a.ready === false && b.ready === false, JSON.stringify([a, b]));
    await close(A, B); }
  // a pre-handshake build: B's session never sends its version
  { const A = await open(), B = await open({ 'src/net/session.js': (t) => t.replace("send({ type: 'ui', a: 'ver', n: SIM_VERSION });", '') });
    await room(A, B); await sleep(1500);
    const early = await lobbyState(A); await sleep(4000); const late = await lobbyState(A);
    ok('silent partner: Ready still enabled for the first moments', early.ready === true && !early.err, JSON.stringify(early));
    ok('silent partner: flagged as another version after 4 s, Ready disabled', /版本不同/.test(late.err) && late.ready === false, JSON.stringify(late));
    await close(A, B); }
  // stale tab: loaded version.js older than the deployed one (the ?t= fetch gets the real file)
  { const S = await open({ 'src/net/version.js': (t, url) => (/[?&]t=\d/.test(url) ? t : older(t)) });
    await S.page.goto(srv.url + '?' + q); await until(S.page, () => window.__vm?.state === 'title');
    await sleep(1200); await S.page.keyboard.press('Enter'); await sleep(800);
    await click(S.page, '#title button', '網上合作'); await sleep(2500);
    const s = await S.page.evaluate(() => ({ err: document.querySelector('#coop .err')?.innerText.replace(/\s+/g, ' ') || '', reload: !!document.querySelector('#coop button[data-a="reload"]') }));
    ok('stale tab: the co-op menu shows 有新版本 with a reload button', /有新版本/.test(s.err) && s.reload, JSON.stringify(s));
    await close(S); }
} catch (e) { ok('flow', false, String(e).slice(0, 300)); }
await browser.close(); srv.close(); dev.kill();
console.log(bad ? `COOP VERSION FAIL ${bad}/${n}` : `COOP VERSION PASS ${n}/${n}`);
process.exit(bad ? 1 : 0);
