// Cutscene gate + shots: plays each scene (between1-3, ending) in the real page straight from the title (flow.go
// 'cutscene'), screenshots every shot at 2 / 5 / 8 s (clamped to the shot) → bench/shots/cutscenes/<size>/, and checks:
// 0 console errors, rAF p95 ≤ budget (desktop 16.7 ms with vsync off; --mobile: Pixel 7 landscape, mobile tier, 4× CPU,
// ≤ 33 ms), audio peaks < −1 dBFS (an analyser on the master clip stage, audio.js BUS.out), the scene reaches its end and
// hands over (then()). --skip: presses Esc 1.5 s in and checks the hand-over + the 0.5 s fade.
//   node bench/harness/cut-shots.mjs [scene…] [--mobile] [--skip] [--char siumei]
import { mkdirSync } from 'node:fs';
import { chromium, devices } from 'playwright-core';
import { serve } from './browser.mjs';
const args = process.argv.slice(2), mobile = args.includes('--mobile'), skip = args.includes('--skip');
const ci = args.indexOf('--char'), char = ci >= 0 ? args[ci + 1] : 'lungjai';
const ids = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--char');
const scenes = ids.length ? ids : ['between1', 'between2', 'between3', 'ending'];
const out = new URL(`../shots/cutscenes/${mobile ? 'mobile' : 'desktop'}/`, import.meta.url).pathname; mkdirSync(out, { recursive: true });
const srv = await serve();
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--autoplay-policy=no-user-gesture-required'] });
let bad = 0;
for (const id of scenes) {
  const ctx = await browser.newContext(mobile ? { ...devices['Pixel 7 landscape'] } : { viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (mobile) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
  await page.goto(srv.url + '?x');
  await page.waitForFunction(() => window.__vm?.state === 'title', null, { timeout: 90000 });
  await page.waitForTimeout(1500);
  await page.evaluate(async ({ id, char }) => {
    const { BUS } = await import('/src/audio/audio.js');
    try { await BUS.ctx.resume(); } catch { /* no audio */ }
    const an = BUS.ctx.createAnalyser(); an.fftSize = 2048; BUS.out.connect(an);
    const buf = new Float32Array(an.fftSize);
    window.__peak = 0; window.__ft = []; window.__handed = false; let last = 0;
    const loop = (t) => { if (last && __vm.state === 'cutscene') window.__ft.push(t - last); last = t;
      an.getFloatTimeDomainData(buf); for (const v of buf) if (Math.abs(v) > window.__peak) window.__peak = Math.abs(v); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    __vm.flow.go('cutscene', { id, char, then: () => { window.__handed = true; __vm.flow.go('title'); } });
  }, { id, char });
  await page.waitForFunction(() => window.__cut && window.__vm.state === 'cutscene', null, { timeout: 60000 });
  const shots = await page.evaluate(async (id) => (await import('/src/story/cutscenes/player.js')).SCENES[id].shots.map((s) => s.dur), id);
  if (skip) {
    await page.waitForTimeout(1500); await page.keyboard.press('Escape');
    const t0 = Date.now(); await page.waitForFunction(() => window.__handed, null, { timeout: 5000 }).catch(() => {});
    const ok = await page.evaluate(() => window.__handed), ms = Date.now() - t0;
    console.log(`${ok && ms < 1500 ? 'ok  ' : 'FAIL'} ${id} skip: handed over ${ok} in ${ms} ms`); if (!(ok && ms < 1500)) bad++;
  } else {
    for (let k = 0; k < shots.length; k++) for (const at of [2, 5, 8]) {
      const a = Math.min(at, shots[k] - 0.3);
      await page.waitForFunction(([k, a]) => __cut.shot > k || (__cut.shot === k && __cut.t >= a) || __cut.done, [k, a], { timeout: 60000, polling: 16 });
      await page.screenshot({ path: `${out}${id}-${char}-${String.fromCharCode(97 + k)}-${at}s.png` });
    }
    await page.waitForFunction(() => window.__handed, null, { timeout: 60000 }).catch(() => {});
  }
  const r = await page.evaluate(() => { const f = window.__ft.slice(30).sort((a, b) => a - b); return { n: f.length, p95: f[Math.floor(f.length * 0.95)] || 0, peak: window.__peak, handed: window.__handed }; });
  const db = r.peak > 0 ? 20 * Math.log10(r.peak) : -Infinity, budget = mobile ? 33 : 16.7;
  const ok = !errors.length && r.handed && (skip || r.p95 <= budget) && db < -1;
  if (!ok) bad++;
  if (!skip) console.log(`${ok ? 'ok  ' : 'FAIL'} ${id}${mobile ? ' (mobile, 4× CPU)' : ''}: ${shots.length} shots, ${r.n} frames p95 ${r.p95.toFixed(1)} ms (≤ ${budget}), audio peak ${db.toFixed(1)} dBFS, handed over ${r.handed}`, errors.slice(0, 2));
  else if (errors.length) console.log('  errors', errors.slice(0, 2));
  await ctx.close();
}
await browser.close(); srv.close();
console.log(bad ? `CUT FAIL ${bad}` : `CUT PASS ${scenes.length}/${scenes.length}`);
process.exit(bad ? 1 : 0);
