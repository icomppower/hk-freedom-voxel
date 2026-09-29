// Touch UI gate (stage 1): on a touch-emulated phone in landscape (844×390) during a ch1 battle — the pad shows, every
// button is inside the viewport, hit-testable at its centre (elementFromPoint lands on it) and clear of the others;
// a drag on the right half turns the camera; the 無雙 button lights when the gauge is full; a real key press hides the
// pad; the pad is absent on a fine pointer; portrait shows the 請打橫手機 card. Shots → bench/shots/1/.
import { chromium } from 'playwright-core';
import { serve } from './browser.mjs';
const shots = new URL('../shots/1/', import.meta.url).pathname;
const srv = await serve();
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
async function open(w, h, touch, q = '?go=story&char=zhaoyun&ch=ch1') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2.625 : 1 });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => { window.__look = []; window.__onStep = (inp) => { if (inp.orbit || inp.tilt) window.__look.push([inp.orbit, inp.tilt]); }; });
  await page.goto(srv.url + q);
  await page.waitForFunction(() => window.__vm?.state === 'battle' && __vm.game.frame > 60, null, { timeout: 60000 });
  return { ctx, page, errors };
}
{
  const { ctx, page, errors } = await open(844, 390, true);
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const root = document.getElementById('touch'), bs = [...root.querySelectorAll('.t-btn')];
    const rects = bs.map((b) => b.getBoundingClientRect());
    const hit = bs.map((b, i) => { const r = rects[i]; return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.t-btn') === b; });
    const inside = rects.map((r) => r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight);
    let overlap = 0; for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i], b = rects[j]; if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlap++; }
    const hud = ['.h-ko', '.h-player .name', '.h-map'].map((q) => document.querySelector('#hud ' + q)?.getBoundingClientRect()).filter(Boolean);
    let hudHit = 0; for (const a of hud) for (const b of rects) if (a.width && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) hudHit++;
    return { hudHit, shown: !root.hidden && getComputedStyle(root).display !== 'none', ids: bs.map((b) => b.dataset.a), hit, inside, overlap, minSize: Math.min(...rects.map((r) => Math.min(r.width, r.height))) };
  });
  ok('pad shown in a battle on a coarse pointer', r.shown);
  ok('every button hit-testable at its centre (844×390)', r.hit.every(Boolean), r.ids.map((a, i) => `${a}:${r.hit[i] ? 'y' : 'N'}`).join(' '));
  ok('every button inside the viewport', r.inside.every(Boolean));
  ok('no two buttons overlap', r.overlap === 0, `${r.overlap}`);
  ok('buttons ≥ 44 px', r.minSize >= 44, `${r.minSize.toFixed(0)} px`);
  ok('no button over the HUD (K.O. count, name, minimap)', r.hudHit === 0, `${r.hudHit}`);
  await page.screenshot({ path: shots + 'touch-844x390.png' });
  // camera drag (right half, above the buttons) with real touch input through CDP
  const cdp = await ctx.newCDPSession(page);
  const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 7 }] });
  await tp('touchStart', 620, 120); for (let k = 1; k <= 8; k++) { await tp('touchMove', 620 - k * 15, 120 + k * 3); await page.waitForTimeout(16); } await tp('touchEnd');
  const look = await page.evaluate(() => window.__look.length);
  ok('right-half drag turns the camera', look > 0, `${look} steps with orbit/tilt`);
  // real-touch stick: a held drag on the left half moves the hero
  const z0 = await page.evaluate(() => __vm.game.hero.z);
  await tp('touchStart', 160, 260); await tp('touchMove', 160, 170); await page.waitForTimeout(700); await tp('touchEnd');
  const moved = await page.evaluate((z0) => Math.hypot(__vm.game.hero.z - z0), z0);
  ok('left-half stick (real touch events) moves the hero', moved > 1, `${moved.toFixed(2)} m`);
  await page.evaluate(() => { const h = __vm.game.hero; h.musou = h.musouMax; });
  await page.waitForTimeout(200);
  ok('無雙 lights when the gauge is full', await page.evaluate(() => document.querySelector('#touch .b-mu').classList.contains('lit')));
  await page.screenshot({ path: shots + 'touch-musou-lit.png' });
  await page.keyboard.press('KeyW'); await page.waitForTimeout(100);
  ok('a real key press hides the pad', await page.evaluate(() => document.getElementById('touch').hidden));
  ok('no console errors (touch)', !errors.length, errors.slice(0, 2).join(' | '));
  await ctx.close();
}
{
  const { ctx, page } = await open(1280, 720, false);
  ok('no pad on a fine pointer (desktop)', await page.evaluate(() => document.getElementById('touch').hidden));
  await ctx.close();
}
{
  const { ctx, page } = await open(390, 844, true);
  const rot = await page.evaluate(() => { const r = document.getElementById('touch-rot'); return !r.hidden && r.innerText.includes('請打橫手機'); });
  ok('portrait shows 請打橫手機', rot);
  await page.screenshot({ path: shots + 'portrait-390x844.png' });
  await ctx.close();
}
await browser.close(); srv.close();
const pass = res.every(Boolean);
console.log(pass ? `TOUCH UI PASS ${res.length}/${res.length}` : `TOUCH UI FAIL ${res.filter(Boolean).length}/${res.length}`);
process.exit(pass ? 0 : 1);
