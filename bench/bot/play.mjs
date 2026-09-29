// The bot in the real page (Chrome, rendering on): ?go=story straight into the chapter, the bot drives every fixed step
// through window.__onStep. Reports the story result; --shots n saves n evenly spaced screenshots to bench/out/play/.
//   node bench/bot/play.mjs --char zhaoyun [--chapter ch1] [--minutes 12] [--shots 6] [--headed]
import { mkdirSync } from 'node:fs';
import { openGame } from '../harness/browser.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const char = arg('char', 'zhaoyun'), chapter = arg('chapter', 'ch1'), minutes = +arg('minutes', 12), shots = +arg('shots', 0);
const out = new URL('../out/play/', import.meta.url).pathname; mkdirSync(out, { recursive: true });
const g = await openGame({ query: `?go=story&char=${char}&ch=${chapter}`, headless: !process.argv.includes('--headed'), init: () => {
  import('/bench/bot/bot.mjs').then((m) => { const bot = m.createBot(); window.__onStep = (inp) => Object.assign(inp, bot(window.__vm.game)); });
} });
const t0 = Date.now(); let n = 0, res = null;
while (Date.now() - t0 < minutes * 60000) {
  await g.page.waitForTimeout(2000);
  res = await g.page.evaluate(() => ({ state: __vm.state, frame: __vm.game.frame, z: __vm.game.hero.z, kos: __vm.game.hero.kos, win: document.querySelector('#result')?.classList.contains('win') }));
  if (shots && Date.now() - t0 > (n + 1) * minutes * 60000 / (shots + 1) && res.state === 'battle') {
    await g.page.screenshot({ path: `${out}${chapter}-${char}-${n++}.png`, timeout: 20000 }).catch((e) => console.log('shot failed', String(e).slice(0, 80)));
    console.log(`  shot ${n} at frame ${res.frame}, z ${res.z.toFixed(0)}, KOs ${res.kos}`);
  }
  if (res.state === 'result') break;
}
console.log(`${res.state === 'result' ? (res.win ? 'WIN' : 'LOSS') : 'TIMEOUT'} ${chapter} ${char} in the page: frame ${res.frame}, KOs ${res.kos}, wall ${((Date.now() - t0) / 1000).toFixed(0)} s`, g.errors.length ? 'ERRORS ' + g.errors.slice(0, 3).join(' | ') : 'no page errors');
await g.close();
