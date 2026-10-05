// Public co-op entry gate: on a plain page (no ?coop) the title lists 網上合作 with the other four items, every one
// hit-testable (elementFromPoint, not element.click) at 1280×720, 844×390 and 667×375 (phones are landscape-only:
// portrait shows #touch-rot); solo keeps the native Math.
// A real tap on 網上合作 reloads into ?coop&lobby: the co-op menu is on screen and dmath replaced Math.sin before boot.
import { chromium } from 'playwright-core';
import { serve } from '../harness/browser.mjs';
const srv = await serve(), browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] });
let bad = 0, n = 0;
const ok = (name, pass, info = '') => { n++; if (!pass) bad++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${info ? ` — ${info}` : ''}`); };
const NATIVE = () => /\[native code\]/.test(Math.sin.toString());
const hits = () => [...document.querySelectorAll('#title .t-main button')].map((b) => {
  const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  return { t: b.querySelector('b')?.textContent, hit: x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight && b.contains(document.elementFromPoint(x, y)), h: r.height };
});
for (const [w, h, touch] of [[1280, 720, false], [844, 390, true], [667, 375, true]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(srv.url + '?x'); await page.waitForFunction(() => window.__vm?.state === 'title', null, { timeout: 60000 }); await page.waitForTimeout(2500);
  if (touch) await page.touchscreen.tap(w / 2, h / 2); else await page.mouse.click(w / 2, h / 2);   // "press any key" card
  await page.waitForTimeout(1500);
  const b = await page.evaluate(hits);
  ok(`${w}×${h} title lists 網上合作 among 5 items`, b.length === 5 && b.some((x) => x.t === '網上合作'), b.map((x) => x.t).join(' / '));
  ok(`${w}×${h} all 5 hit-testable, ≥ 44 px`, b.every((x) => x.hit && x.h >= 43.5), b.filter((x) => !x.hit || x.h < 43.5).map((x) => `${x.t} ${x.h.toFixed(0)}px`).join(', '));
  ok(`${w}×${h} solo page keeps native Math`, await page.evaluate(NATIVE));
  if (w === 844) {
    const r = await page.evaluate(() => { const e = [...document.querySelectorAll('#title .t-main button')].find((b) => b.querySelector('b')?.textContent === '網上合作').getBoundingClientRect(); return [e.left + e.width / 2, e.top + e.height / 2]; });
    await page.touchscreen.tap(r[0], r[1]);
    await page.waitForURL(/[?&]coop(&|$).*lobby|[?&]lobby.*coop/, { timeout: 20000 }).catch(() => {});
    const url = new URL(page.url());
    ok('tap 網上合作 → reload with ?coop&lobby', url.searchParams.has('coop') && url.searchParams.has('lobby'), url.search);
    const inLobby = await page.waitForFunction(() => window.__vm?.state === 'coop' && !document.getElementById('coop')?.hidden, null, { timeout: 60000 }).then(() => true, () => false);
    ok('co-op menu on screen after the reload', inLobby, await page.evaluate(() => window.__vm?.state));
    ok('dmath installed on the co-op page', !(await page.evaluate(NATIVE)));
  }
  ok(`${w}×${h} no page errors`, !errs.length, errs.join(' | '));
  await page.close();
}
await browser.close(); srv.close();
console.log(bad ? `COOP ENTRY FAIL ${bad}/${n}` : `COOP ENTRY PASS ${n}/${n}`);
process.exit(bad ? 1 : 0);
