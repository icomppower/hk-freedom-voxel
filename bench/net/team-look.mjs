// Team Musou 齊上齊落 look gate (numeric #debug asserts, no screenshot impressions): two real pages against a server
// (wrangler dev on :8787 by default), both heroes on the bot policy (?coophands=bot: they save gauges, walk together,
// call and answer). Page A's team view (src/net/team-view.js root.userData.debug) is sampled every 100 ms until two
// Team Musous have fired: the link line + gauge pulse + prompt when ready, the ring timer and a call card while calling,
// the title card in the cinematic, the umbrella wall, a pole sweep and the shockwave while firing, the ?coopdebug team
// line; the DOM cards inside the 844×390 viewport; 0 desyncs, both pages' team logs equal, no page errors.
//   node --import ./bench/harness/register.mjs bench/net/team-look.mjs [--server URL]
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';
import { serve } from '../harness/browser.mjs';
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
let server = opt('server', null), dev = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (!server) {                                       // wrangler dev from coop-server/ (as online.mjs does)
  server = 'http://localhost:8787';
  dev = spawn('npx', ['wrangler', 'dev', '--port', '8787'], { cwd: new URL('../../coop-server/', import.meta.url).pathname, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(server)).ok) break; } catch {} await sleep(500); }
}
const srv = await serve();
let bad = 0, n = 0;
const ok = (name, pass, info = '') => { n++; if (!pass) bad++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${info !== '' ? ` — ${info}` : ''}`); };
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const open = async () => { const page = await browser.newPage({ viewport: { width: 844, height: 390 } }), errors = []; page.on('pageerror', (e) => errors.push(String(e))); return { page, errors }; };
const q = `coop&coopdebug&coophands=bot&coopserver=${encodeURIComponent(server)}`;
const until = (page, fn, arg, ms = 60000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 100 });
async function click(page, sel, text) {
  const b = await page.evaluate(([sel, text]) => { const e = [...document.querySelectorAll(sel)].find((x) => x.textContent.includes(text) && !x.disabled); if (!e) return null; const k = e.getBoundingClientRect(); return [k.left + k.width / 2, k.top + k.height / 2]; }, [sel, text]);
  if (!b) throw new Error(`no ${sel} "${text}"`);
  await page.mouse.click(b[0], b[1]);
}
const A = await open(), B = await open();
try {
  await A.page.goto(srv.url + '?' + q); await until(A.page, () => window.__vm?.state === 'title');
  await sleep(1500); await A.page.keyboard.press('Enter'); await sleep(900);
  await click(A.page, '#title button', '網上合作'); await until(A.page, () => window.__vm?.state === 'coop'); await sleep(600);
  await click(A.page, '#coop button', '建立房間');
  await until(A.page, () => /^[A-Z]{4}$/.test(document.querySelector('#coop .code')?.textContent || ''));
  const link = await A.page.evaluate(() => window.__coop.link());
  await B.page.goto(link.replace('?coop', '?' + q));
  for (const P of [A, B]) await until(P.page, () => window.__coop?.C.S?.lobbyMsg?.players.every(Boolean));
  await sleep(500);
  await click(A.page, '#coop button', '準備'); await click(B.page, '#coop button', '準備');
  for (const P of [A, B]) for (let i = 0; i < 200 && (await P.page.evaluate(() => window.__vm.state)) !== 'battle'; i++) { if ((await P.page.evaluate(() => window.__vm.state)) === 'prologue') await P.page.keyboard.press('Escape'); await sleep(300); }
  const seen = { line: 0, prompt: 0, ring: 0, waiting: 0, asked: 0, card: 0, umbrellas: 0, trail: 0, arc: 0, blast: 0, pillar: 0, dbgLine: 0, cardIn: 0, callIn: 0 };
  const t0 = Date.now();
  for (;;) {
    const s = await A.page.evaluate(() => {
      const d = window.__vm.scene.getObjectByName('team-musou')?.userData.debug || {}, T = window.__vm.game.coop?.team, inV = (e) => { if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; };
      return { d, fires: T ? T.log.filter((e) => e.kind !== 'timeout').length : 0, ended: window.__coop.C.ended || window.__coop.C.S.halted, dbg: document.querySelector('#coop-hud .dbg')?.textContent || '', cardIn: inV(document.querySelector('#team .card')), callIn: inV(document.querySelector('#team .call')) };
    });
    const d = s.d;
    if (d.line) seen.line++; if (d.prompt) seen.prompt++; if (d.ring > 0) seen.ring++; if (d.call === 'waiting') seen.waiting++; if (d.call === 'asked') seen.asked++;
    if (d.card) seen.card++; if (d.umbrellas === 10) seen.umbrellas++; if (d.trail) seen.trail++; if (d.pillar) seen.pillar++; if (d.arc) seen.arc++; if (d.blast) seen.blast++;
    if (/team: (ready|calling|firing|idle)/.test(s.dbg)) seen.dbgLine++; if (s.cardIn) seen.cardIn++; if (s.callIn) seen.callIn++;
    if (s.fires >= 2 && seen.blast || s.ended || Date.now() - t0 > 600000) break;
    await sleep(100);
  }
  const fr = await A.page.evaluate(() => window.__vm.scene.getObjectByName('team-musou').userData.debug.frames);
  for (const k of ['line', 'prompt', 'ring', 'card', 'umbrellas', 'trail', 'arc', 'blast', 'pillar']) ok(`drawn: ${k}`, fr[k] > 0, `${fr[k] || 0} frames`);
  for (const k of ['dbgLine', 'cardIn', 'callIn']) ok(`seen: ${k}`, seen[k] > 0, `${seen[k]} samples`);
  ok('a call card shown (waiting or asked)', (fr.call || 0) > 0, `${fr.call || 0} frames`);
  const logs = await Promise.all([A, B].map((P) => P.page.evaluate(() => JSON.stringify(window.__vm.game.coop.team.log))));
  const st = await Promise.all([A, B].map((P) => P.page.evaluate(() => ({ halted: window.__coop.C.S.halted, simT: window.__coop.C.S.simT }))));
  ok('0 desyncs on both pages', !st[0].halted && !st[1].halted, JSON.stringify(st));
  ok('team logs agree (prefix)', logs[0].slice(0, Math.min(logs[0].length, logs[1].length) - 1) === logs[1].slice(0, Math.min(logs[0].length, logs[1].length) - 1), logs[0]);
  ok('no page errors', !A.errors.length && !B.errors.length, [...A.errors, ...B.errors].join(' | ').slice(0, 300));
} catch (e) { ok('flow', false, String(e).slice(0, 300)); }
await browser.close(); srv.close(); dev?.kill();
console.log(bad ? `TEAM LOOK FAIL ${bad}/${n}` : `TEAM LOOK PASS ${n}/${n}`);
process.exit(bad ? 1 : 0);
