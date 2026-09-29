// UI critic captures (fresh page, real inputs): title (press-key), title menu, select, chapter pick, loading card,
// the tribute from the title menu, the result screen (win) → bench/out/ui-NN.png, and the elementFromPoint check that
// every visible menu / result button is clickable where it is drawn.
import { openGame } from './browser.mjs';
const g = await openGame({}), P = g.page, wait = (ms) => P.waitForTimeout(ms);
let n = 0; const shot = (tag) => P.screenshot({ path: `bench/out/ui-${String(n++).padStart(2, '0')}-${tag}.png` });
const hit = async (sel) => P.evaluate((sel) => [...document.querySelectorAll(sel)].filter((b) => b.offsetParent).map((b) => {
  const r = b.getBoundingClientRect(), e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!(e && (e === b || b.contains(e))); }), sel);
await wait(3000); await shot('title-press');
await P.keyboard.press('Enter'); await wait(1200); await shot('title-menu');
const tbtn = await hit('#title .t-main button');
await P.keyboard.press('Enter'); await wait(900); await shot('title-difficulty');
await P.keyboard.press('Enter'); await wait(2500); await shot('select');
await P.keyboard.press('Enter'); await wait(1000); await shot('chapter-pick');
await P.keyboard.press('Enter'); await wait(2600); await shot('loading');
await wait(9000); await shot('prologue');
await P.evaluate(() => __vm.flow.go('result', { mode: 'story', char: 'gok', chapter: 'sheep1', win: true, stats: { kos: 1500, time: 300, hpMax: 400, maxChain: 200, dmg: 60, rank: 'S' } }));
await wait(3000); await shot('result'); const rbtn = await hit('#result button');
await P.evaluate(() => __vm.flow.go('title')); await wait(2500);
await P.keyboard.press('ArrowUp'); await wait(300); await P.keyboard.press('Enter'); await wait(3500); await shot('tribute-from-menu');
const st = await P.evaluate(() => [__vm.state, document.querySelector('#ending').className]);
console.log('title buttons clickable', tbtn, 'result buttons clickable', rbtn, 'tribute state', st, g.errors.slice(0, 3));
await g.close();
