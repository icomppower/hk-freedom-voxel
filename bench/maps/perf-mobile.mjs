// Mobile perf gate (stage 1): Pixel 7 landscape emulation (915×412, touch, DPR 2.625 → pointer: coarse = the mobile
// tier: 150 enemies, no MSAA / DoF, half-res bloom) + 4× CPU throttle (CDP), vsync off, the bot fighting ch1 (or the
// chapters given). 20 s of rAF deltas after the first 5 s → p50 / p95 / max. Budget: p95 ≤ 33 ms (30 fps held).
//   node bench/maps/perf-mobile.mjs [chapter…] [--char id]
import { chromium, devices } from 'playwright-core';
import { serve } from '../harness/browser.mjs';
const args = process.argv.slice(2), ci = args.indexOf('--char'), char = ci >= 0 ? args.splice(ci, 2)[1] : 'zhaoyun';
const chs = args.length ? args : ['ch1'];
const srv = await serve();
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] });
let bad = 0;
for (const ch of chs) {
  const ctx = await browser.newContext({ ...devices['Pixel 7 landscape'] });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    window.__ft = []; let last = 0;
    const loop = (t) => { if (last) window.__ft.push(t - last); last = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    import('/bench/bot/bot.mjs').then((m) => { const bot = m.createBot(); window.__onStep = (inp) => Object.assign(inp, bot(window.__vm.game)); });
  });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(srv.url + `?go=story&char=${char}&ch=${ch}`);
  await page.waitForFunction(() => window.__vm?.state === 'battle', null, { timeout: 120000 });
  await page.evaluate(() => { window.__ft.length = 0; });
  await page.waitForTimeout(25000);
  const r = await page.evaluate(() => { const f = window.__ft.slice(300).sort((a, b) => a - b), q = (p) => f[Math.floor(p * (f.length - 1))];
    return { n: f.length, p50: q(0.5), p95: q(0.95), max: f[f.length - 1], coarse: matchMedia('(pointer: coarse)').matches, frame: __vm.game.frame, w: innerWidth, h: innerHeight }; });
  const ok = r.p95 <= 33 && r.coarse; if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${ch} ${char} Pixel 7 ${r.w}×${r.h} 4× CPU, mobile tier ${r.coarse}: ${r.n} frames p50 ${r.p50.toFixed(1)} p95 ${r.p95.toFixed(1)} max ${r.max.toFixed(1)} ms (sim frame ${r.frame})`, errors.slice(0, 2));
  await ctx.close();
}
await browser.close(); srv.close();
process.exit(bad ? 1 : 0);
