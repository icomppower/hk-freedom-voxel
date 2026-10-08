// Result-card gate (Scroll Cutscenes page): each hk chapter's win card at 1280×720 and 844×390 (touch) — the whole
// epilogue is reachable (inside the viewport, or its scroll container scrolls to it), the continue button is inside the
// viewport and hit-testable at its centre (elementFromPoint), 0 console errors. Shots → bench/shots/5/.
import { chromium } from 'playwright-core';
import { serve } from './browser.mjs';
const out = new URL('../shots/5/', import.meta.url).pathname;
const srv = await serve(), browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
let bad = 0;
for (const [w, h, touch] of [[1280, 720, false], [844, 390, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2.625 : 1 });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(srv.url + '?x'); await page.waitForFunction(() => window.__vm?.state === 'title', null, { timeout: 60000 }); await page.waitForTimeout(1500);
  for (const ch of ['hk1', 'hk2', 'hk3', 'hk4', 'hk6', 'hk7']) {
    await page.evaluate((ch) => __vm.flow.go('result', { mode: 'story', char: 'lungjai', chapter: ch, win: true, stats: { kos: 1500, time: 300, hpMax: 400, maxChain: 120, dmg: 60, rank: 'A' } }), ch);
    await page.waitForTimeout(4200);
    const r = await page.evaluate(() => {
      const epi = document.querySelector('#result .rs-epi'), last = epi.lastElementChild, btn = document.querySelector('#result .rs-btns button');
      const sc = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2) return e; } return null; };
      const box = sc(last); if (box) box.scrollTop = box.scrollHeight;
      const lr = last.getBoundingClientRect(), br = btn.getBoundingClientRect();
      const lastIn = lr.top >= 0 && lr.bottom <= innerHeight + 1;
      if (box) box.scrollTop = 0;
      const b2 = sc(btn); if (b2) b2.scrollTop = b2.scrollHeight;
      const br2 = btn.getBoundingClientRect(), hit = document.elementFromPoint(br2.left + br2.width / 2, br2.top + br2.height / 2)?.closest('button') === btn;
      return { lastIn, scrolls: !!box, btnIn: br2.top >= 0 && br2.bottom <= innerHeight, hit, italic: getComputedStyle(epi.querySelector('i')).fontStyle };
    });
    await page.screenshot({ path: `${out}result-${ch}-${w}x${h}.png` });
    const ok = r.lastIn && r.btnIn && r.hit && r.italic === 'italic';
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${ch} ${w}×${h}: epilogue end reachable ${r.lastIn}${r.scrolls ? ' (scrolls)' : ''}, button in view ${r.btnIn}, hit-testable ${r.hit}, quote ${r.italic}`);
  }
  if (errors.length) { bad++; console.log('errors', errors.slice(0, 2)); }
  await ctx.close();
}
await browser.close(); srv.close();
console.log(bad ? `RESULT FIT FAIL ${bad}` : 'RESULT FIT PASS 12/12');
process.exit(bad ? 1 : 0);
