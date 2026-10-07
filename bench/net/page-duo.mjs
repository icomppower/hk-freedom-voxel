// Online co-op through the real page: two browsers (Chrome + Chrome, or Chrome + WebKit for a V8 / JavaScriptCore pair)
// against a server (wrangler dev on :8787 by default). Both play their own hero with the bot policy (?coophands=bot) so
// the lockstep, the lobby UI and the render path run for real. Checks:
//   lobby UI   844×390 and 390×844: every button ≥ 44 px, hit-testable (elementFromPoint), inside the viewport
//   flow       title → 網上合作 → 建立房間 (code) · the 2nd page opens the Copy-Link URL → both 準備 → loading → battle
//   lockstep   N ticks (or the chapter's end): 0 desyncs, every hash both pages computed equal, msgs / min, rtt, stalls
//   pause      page A opens the pause menu: page B shows "Paused by your partner", both sims hold; resume
//   node --import ./bench/harness/register.mjs bench/net/page-duo.mjs [--server URL] [--b webkit] [--ticks 3600] [--a-size 844x390] [--b-size 390x844] [--hands bot|chaos]
import { chromium, webkit } from 'playwright-core';
import { serve } from '../harness/browser.mjs';
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const server = opt('server', 'http://localhost:8787'), ticks = +opt('ticks', 3600), bEngine = opt('b', 'chrome');
const size = (s) => { const [w, h] = s.split('x').map(Number); return { width: w, height: h }; };
const srv = await serve();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const report = (name, ok, msg) => { results.push(ok); console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${msg}`); };
async function launch(engine, viewport) {
  const b = engine === 'webkit' ? await webkit.launch({ headless: true })
    : await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await b.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/desync/.test(m.text())) errors.push(m.text()); });
  return { b, page, errors, engine };
}
const q = `coop&coopdebug&coophands=${opt('hands', 'bot')}&coopserver=${encodeURIComponent(server)}`;

/** Every visible button of the co-op lobby: size, hit-test, inside the viewport. */
async function lobbyFit(page, tag) {
  const r = await page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight, out = [];
    for (const b of document.querySelectorAll('#coop button')) {
      const k = b.getBoundingClientRect();
      if (!k.width) continue;
      const hit = document.elementFromPoint(k.left + k.width / 2, k.top + k.height / 2);
      out.push({ t: b.textContent.trim().slice(0, 12), w: Math.round(k.width), h: Math.round(k.height), hit: !!hit && (hit === b || b.contains(hit)), inside: k.left >= 0 && k.right <= vw + 0.5 && k.top >= 0 && k.bottom <= vh + 0.5 });
    }
    return { out, overflowX: document.documentElement.scrollWidth > vw + 1 };
  });
  const bad = r.out.filter((b) => b.w < 44 || b.h < 44 || !b.hit || !b.inside);
  report(`lobby fit ${tag}`, !bad.length && !r.overflowX && r.out.length > 0, `${r.out.length - bad.length}/${r.out.length} buttons ≥ 44 px + hit-testable + inside${bad.length ? ' · bad ' + JSON.stringify(bad) : ''}${r.overflowX ? ' · horizontal overflow' : ''}`);
}
async function clickText(page, sel, text) {
  const box = await page.evaluate(([sel, text]) => {
    const b = [...document.querySelectorAll(sel)].find((x) => x.textContent.includes(text) && !x.disabled);
    if (!b) return null;
    const k = b.getBoundingClientRect(), x = k.left + k.width / 2, y = k.top + k.height / 2, hit = document.elementFromPoint(x, y);
    return { x, y, hit: !!hit && (hit === b || b.contains(hit)) };
  }, [sel, text]);
  if (!box || !box.hit) throw new Error(`not clickable: ${sel} "${text}" ${JSON.stringify(box)}`);
  await page.mouse.click(box.x, box.y);
}
const state = (page) => page.evaluate(() => window.__vm?.state);
async function until(page, fn, arg, ms = 60000) { await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); }

const A = await launch('chrome', size(opt('a-size', '844x390'))), B = await launch(bEngine, size(opt('b-size', '390x844')));
try {
  // A: title → 網上合作 → create
  await A.page.goto(srv.url + '?' + q);
  await until(A.page, () => window.__vm?.state === 'title');
  await sleep(1500); await A.page.keyboard.press('Enter'); await sleep(900);
  await clickText(A.page, '#title button', '網上合作');
  await until(A.page, () => window.__vm?.state === 'coop');
  await sleep(700);
  await lobbyFit(A.page, 'menu 844×390');
  await clickText(A.page, '#coop button', '建立房間');
  await until(A.page, () => /^[A-Z]{4}$/.test(document.querySelector('#coop .code')?.textContent || ''));
  const code = await A.page.evaluate(() => document.querySelector('#coop .code').textContent);
  const link = await A.page.evaluate(() => window.__coop.link());
  await lobbyFit(A.page, 'room 844×390');
  // B: the Copy-Link URL (+ the test params)
  await B.page.goto(link.replace('?coop', '?' + q));
  await until(B.page, () => window.__coop?.C.S?.lobbyMsg?.players.every(Boolean), null, 60000);
  await until(A.page, () => window.__coop?.C.S?.lobbyMsg?.players.every(Boolean), null, 60000);
  await sleep(600);
  await lobbyFit(B.page, `room ${opt('b-size', '390x844')} (${bEngine})`);
  const picks = await A.page.evaluate(() => window.__coop.C.S.lobbyMsg.players.map((p) => p.pick));
  report('lobby: one each', picks[0] !== picks[1] && picks.every(Boolean), `${picks.join(' / ')} · code ${code} · link ${link}`);
  await clickText(A.page, '#coop button', '準備'); await clickText(B.page, '#coop button', '準備');
  // into the battle (skip the scroll on both)
  for (const P of [A, B]) {
    for (let i = 0; i < 200 && (await state(P.page)) !== 'battle'; i++) { if ((await state(P.page)) === 'prologue') await P.page.keyboard.press('Escape'); await sleep(300); }
  }
  report('flow lobby → battle', (await state(A.page)) === 'battle' && (await state(B.page)) === 'battle', `A ${await state(A.page)} · B ${await state(B.page)}`);
  // pause from A after 1200 ticks
  await until(A.page, () => window.__coop.C.S.simT >= 1200, null, +opt('t1200', 180000));
  await A.page.keyboard.press('Escape');
  await sleep(2500);
  const pz = await B.page.evaluate(() => ({ text: document.querySelector('#coop-hud .bn')?.textContent || '', paused: window.__coop.C.S.stats.paused, simT: window.__coop.C.S.simT, frame: window.__vm.game.frame }));
  await sleep(1000);
  const pz2 = await B.page.evaluate(() => ({ paused: window.__coop.C.S.stats.paused, frame: window.__vm.game.frame }));
  await A.page.keyboard.press('Escape');
  report('pause from A', /Paused by your partner/.test(pz.text) && pz2.paused > pz.paused && pz2.frame === pz.frame, `B banner "${pz.text.slice(0, 40)}" · B paused frames ${pz.paused} → ${pz2.paused} · B sim frame held at ${pz.frame} → ${pz2.frame}`);
  // run to N ticks (or the end)
  const t0 = Date.now(), m0 = await A.page.evaluate(() => [window.__coop.C.S.sock.msgs, window.__coop.C.S.simT]);
  await until(A.page, (n) => window.__coop.C.S.simT >= n || window.__coop.C.ended || window.__coop.C.S.halted, ticks, 900000);
  await until(B.page, (n) => window.__coop.C.S.simT >= n || window.__coop.C.ended || window.__coop.C.S.halted, ticks, 120000);
  const wall = (Date.now() - t0) / 60000;
  const get = (P) => P.page.evaluate(() => { const S = window.__coop.C.S; return { simT: S.simT, hashes: S.hashes, halted: S.halted, desync: !!window.__coop.C.desyncDump, stats: S.stats, rtt: S.rtt(), D: S.D, msgs: S.sock.msgs, mpm: window.__coop.msgsPerMin() }; });
  const ra = await get(A), rb = await get(B);
  if (ra.desync || rb.desync) {                    // keep both dumps for bench/net replay
    const { writeFileSync, mkdirSync } = await import('node:fs'); mkdirSync('bench/out', { recursive: true });
    for (const [P, tag] of [[A, 'A'], [B, 'B']]) writeFileSync(`bench/out/desync-${tag}.json`, await P.page.evaluate(() => JSON.stringify({ dump: window.__coop.C.desyncDump || window.__coop.C.S.dump(), ua: navigator.userAgent })));
    console.log('desync dumps → bench/out/desync-A.json, desync-B.json');
  }
  const keys = Object.keys(ra.hashes).filter((k) => k in rb.hashes), same = keys.filter((k) => ra.hashes[k] === rb.hashes[k]);
  const mpm = Math.round((ra.msgs - m0[0]) / wall);
  report(`lockstep chrome vs ${bEngine}`, !ra.desync && !rb.desync && !ra.halted && same.length === keys.length && keys.length > 10,
    `${same.length}/${keys.length} hash checks equal (to tick ${Math.min(ra.simT, rb.simT)}) · desyncs ${+ra.desync}/${+rb.desync} · rtt ${Math.round(ra.rtt)}/${Math.round(rb.rtt)} ms · D ${ra.D}/${rb.D} · ` +
    `stall ${(100 * ra.stats.stalls / (ra.stats.stalls + ra.stats.steps)).toFixed(1)}/${(100 * rb.stats.stalls / (rb.stats.stalls + rb.stats.steps)).toFixed(1)} % · A msgs/min ${mpm} (live readout ${ra.mpm})`);
  report('page errors', !A.errors.length && !B.errors.length, `A ${A.errors.length} · B ${B.errors.length} ${[...A.errors, ...B.errors].slice(0, 3).join(' | ')}`);
} catch (e) {
  report('page duo', false, String(e).slice(0, 400));
  console.log('A errors', A.errors.slice(0, 5), 'B errors', B.errors.slice(0, 5));
  for (const P of [A, B]) console.log(P.engine, JSON.stringify(await P.page.evaluate(() => { const C = window.__coop?.C, S = C?.S; return { state: window.__vm?.state, inBattle: C?.inBattle, began: C?.began, phase: S?.phase, live: S?.live, simT: S?.simT, frames: S?.frames.length, tx: S?.tx && { c: S.tx.committed, t0: S.tx.t0 }, msgs: S?.sock?.msgs, open: S?.sock?.open, status: C?.status, frame: window.__vm?.game.frame }; }).catch((e) => String(e))));
} finally {
  await A.b.close(); await B.b.close(); srv.close();
}
console.log(results.every(Boolean) ? `PAGE DUO PASS ${results.length}/${results.length}` : `PAGE DUO FAIL ${results.filter((x) => !x).length}/${results.length}`);
process.exit(results.every(Boolean) ? 0 : 1);
