// A whole chapter in the real page with the bot (fresh page, ?go=story straight into the battle), screenshots on story
// beats: every banner (+ 1.2 s), the result screen. → bench/out/play-<chapter>-<char>-NN.png; prints the result.
//   node bench/bot/playshots.mjs sheep1 gok [minutes]
import { openGame } from '../harness/browser.mjs';
const [chapter = 'sheep1', char = 'gok', min = '10'] = process.argv.slice(2);
const g = await openGame({ query: `?go=story&char=${char}&ch=${chapter}`, init: () => {
  window.__banners = [];
  import('/bench/bot/bot.mjs').then(async (m) => {
    const ev = await import('/src/core/events.js');
    ev.on('story:banner', (e) => window.__banners.push(e.en));
    const bot = m.createBot(); window.__onStep = (inp) => Object.assign(inp, bot(window.__vm.game));
  });
} });
const P = g.page, t0 = Date.now();
let seen = 0, n = 0, res = null;
const shot = async () => P.screenshot({ path: `bench/out/play-${chapter}-${char}-${String(n++).padStart(2, '0')}.png`, timeout: 20000 }).catch(() => {});
while (Date.now() - t0 < +min * 60000) {
  await P.waitForTimeout(400);
  const s = await P.evaluate(() => ({ b: window.__banners.length, st: __vm.state, win: document.querySelector('#result')?.classList.contains('win') }));
  if (s.b > seen) { seen = s.b; await P.waitForTimeout(1200); await shot(); }
  if (s.st === 'result') { await P.waitForTimeout(5000); await shot(); res = s; break; }
}
const banners = await P.evaluate(() => window.__banners);
console.log(res ? (res.win ? 'WIN' : 'LOSS') : 'TIMEOUT', chapter, char, `${((Date.now() - t0) / 1000).toFixed(0)} s wall`, 'banners:', banners.join(' | '), g.errors.slice(0, 3));
await g.close();
