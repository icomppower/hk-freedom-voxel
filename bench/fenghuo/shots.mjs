// 烽火戰 in the real page (headless Chromium): title → 烽火戰 → difficulty → select → battlefield → loading card (cards
// revealed) → battle (HUD clock / chips) → forced end → result. Screenshots to bench/shots/fenghuo/, page errors fail it.
//   node bench/fenghuo/shots.mjs [--size 1280x720] [--direct]   (the draw is whatever newSeed() gives: the shots show any hand)
// CHROME=/path/to/chrome overrides the browser (default: Playwright's bundled Chromium, else the system Chrome channel).
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { serve, ROOT } from '../harness/browser.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const [W, H] = arg('size', '1280x720').split('x').map(Number);
const out = resolve(ROOT, 'bench/shots/fenghuo'); mkdirSync(out, { recursive: true });
const bundled = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const exe = process.env.CHROME || (existsSync(bundled) ? bundled : null);
const srv = await serve();
const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } : { channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(srv.url + (process.env.FH_QUERY || '?enemies=120'));
await page.waitForFunction(() => window.__vm && window.__vm.state === 'title', null, { timeout: 120000 });
const tag = `${W}x${H}`, shot = async (n) => { await page.screenshot({ path: resolve(out, `${tag}-${n}.png`), timeout: 180000 }); console.log('shot', n); };
const waitState = (s, t = 180000) => page.waitForFunction((x) => window.__vm.state === x, s, { timeout: t });
const key = async (k, wait = 400) => { await page.keyboard.press(k); await page.waitForTimeout(wait); };

const direct = process.argv.includes('--direct');            // --direct: ?go=fenghuo deep link → HUD → forced win → result
if (direct) {
  await page.goto(srv.url + '?go=fenghuo&char=siumei&ch=hk2&seed=42&enemies=60');
  await page.waitForFunction(() => window.__vm && window.__vm.state === 'battle' && window.__vm.game.frame > 200, null, { timeout: 900000 });
  await page.waitForTimeout(1500); await shot('d1-battle-hud');
  await page.evaluate(() => { window.__vm.game.hero.kos = window.__vm.game.fh.goal; });
  await page.waitForFunction(() => window.__vm.game.fh.won >= 0, null, { timeout: 300000 });
  await page.evaluate(() => { window.__vm.game.fh.won -= 240; });
  await waitState('result', 600000); await page.waitForTimeout(15000); await shot('d2-result-win');
  console.log(errors.length ? 'ERRORS ' + errors.join(' | ') : 'no page errors');
  await browser.close(); srv.close(); process.exit(errors.length ? 1 : 0);
}
await page.waitForTimeout(2500);
await key('Enter', 1200);                                   // wake the title
const items = await page.$$eval('#title button, #title [data-go]', (bs) => bs.map((b) => b.textContent.trim()));
console.log('title items:', items.join(' | '));
await shot('1-title');
// focus 烽火戰 (third entry) and confirm, then confirm 普通 on the difficulty panel
await key('ArrowDown'); await key('ArrowDown'); await shot('2-title-fenghuo');
await key('Enter', 1200); await key('Enter', 400);
await waitState('select'); await page.waitForTimeout(2500); await shot('3-select');
await key('Enter', 1200); await shot('4-battlefields');
await key('Enter', 600);
await waitState('loading'); await page.waitForTimeout(2600); await shot('5-loading-cards');
await waitState('battle'); await page.waitForFunction(() => window.__vm.game.frame > 240, null, { timeout: 600000 }); await page.waitForTimeout(1500); await shot('6-battle-hud');
const info = await page.evaluate(() => { const g = window.__vm.game; return { cards: g.fh.cards.map((c) => c.id + ' ' + c.name), mods: g.fh.mods, goal: g.fh.goal, left: g.fh.left, hp: g.hero.hpMax, frame: g.frame }; });
console.log(JSON.stringify(info));
// force the win: the goal reached on the next step
await page.evaluate(() => { window.__vm.game.hero.kos = window.__vm.game.fh.goal; });
await page.waitForFunction(() => window.__vm.game.fh.won >= 0, null, { timeout: 120000 });
await page.evaluate(() => { window.__vm.game.fh.won -= 240; });   // skip the victory slow-mo (software GL runs a few fps)
await waitState('result', 240000); await page.waitForTimeout(4500); await shot('7-result-win');
console.log(errors.length ? 'ERRORS ' + errors.join(' | ') : 'no page errors');
await browser.close(); srv.close();
process.exit(errors.length ? 1 : 0);
