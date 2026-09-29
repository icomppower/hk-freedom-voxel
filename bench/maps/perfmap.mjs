// Perf lane: each chapter's map in the real page (story mode, the bot fighting, default 300 enemies, then ?enemies=600),
// 20 s of rAF deltas after the first 4 s → p50 / p95 / max frame time. Budget: p95 ≤ 17 ms (60 fps held).
import { openGame } from '../harness/browser.mjs';
const chs = process.argv.slice(2).length ? process.argv.slice(2) : ['ch1', 'sheep1', 'sheep2', 'sheep3'];
let bad = 0;
for (const ch of chs) for (const en of [300, 600]) {
  const g = await openGame({ query: `?go=story&char=gok&ch=${ch}&enemies=${en}`, args: ['--disable-gpu-vsync'], init: () => {
    window.__ft = []; let last = 0;
    const loop = (t) => { if (last) window.__ft.push(t - last); last = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    import('/bench/bot/bot.mjs').then((m) => { const bot = m.createBot(); window.__onStep = (inp) => Object.assign(inp, bot(window.__vm.game)); });
  } });
  await g.page.waitForTimeout(24000);
  const r = await g.page.evaluate(() => { const f = window.__ft.slice(240).sort((a, b) => a - b), q = (p) => f[Math.floor(p * (f.length - 1))]; return { n: f.length, p50: q(0.5), p95: q(0.95), max: f[f.length - 1] }; });
  const ok = r.p95 <= 17; if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${ch.padEnd(7)} ${en} enemies: ${r.n} frames p50 ${r.p50.toFixed(1)} p95 ${r.p95.toFixed(1)} max ${r.max.toFixed(1)} ms`, g.errors.slice(0, 2));
  await g.close();
}
process.exit(bad ? 1 : 0);
