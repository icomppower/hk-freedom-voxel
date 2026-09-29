// Critic capture (stage 9): for each hk chapter, the real page with the bot fighting (?go=story), at 1280×720 (desktop)
// and 844×390 (touch, mobile tier): a battle shot after `secs` of play and a Musou shot (gauge filled, Musou fired, shot
// 100 musou frames in). Chapters alternate the playable (hk1 / hk3 龍仔, hk2 / hk4 小美; --swap flips). → bench/shots/9/<round>/.
//   node bench/harness/critic-shots.mjs [round] [--swap] [--secs 14]
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serve } from './browser.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const round = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'r1', swap = process.argv.includes('--swap'), secs = +arg('secs', 14);
const out = new URL(`../shots/9/${round}/`, import.meta.url).pathname; mkdirSync(out, { recursive: true });
const srv = await serve(), browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const errs = [];
for (const [k, ch] of ['hk1', 'hk2', 'hk3', 'hk4'].entries()) {
  const char = (k % 2 === 0) !== swap ? 'lungjai' : 'siumei';
  for (const [w, h, touch] of [[1280, 720, false], [844, 390, true]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2.625 : 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push(`${ch} ${w}: ${e}`)); page.on('console', (m) => { if (m.type() === 'error') errs.push(`${ch} ${w}: ${m.text()}`); });
    await page.addInitScript(() => { import('/bench/bot/bot.mjs').then((m) => { const bot = m.createBot(); window.__onStep = (inp) => { if (!window.__hold) Object.assign(inp, bot(window.__vm.game)); }; }); });
    await page.goto(srv.url + `?go=story&char=${char}&ch=${ch}`);
    await page.waitForFunction(() => window.__vm?.state === 'battle' && __vm.game.frame > 30, null, { timeout: 90000 });
    await page.waitForTimeout(secs * 1000);
    await page.screenshot({ path: `${out}${ch}-${char}-battle-${w}x${h}.png` });
    await page.evaluate(() => { const G = __vm.game; G.hero.musou = G.hero.musouMax; window.__hold = true; window.__onStep = (inp) => { if (G.hero.state !== 'musou') inp.pressed.musou = inp.held.musou = true; }; });
    await page.waitForFunction(() => __vm.game.hero.state === 'musou' && __vm.game.musou.t >= 100, null, { timeout: 30000 }).catch(() => {});
    await page.screenshot({ path: `${out}${ch}-${char}-musou-${w}x${h}.png` });
    await ctx.close();
  }
  console.log(`${ch} ${char}: 4 shots`);
}
await browser.close(); srv.close();
console.log(errs.length ? 'ERRORS ' + errs.slice(0, 4).join(' | ') : 'critic shots done, 0 console errors');
process.exit(errs.length ? 1 : 0);
