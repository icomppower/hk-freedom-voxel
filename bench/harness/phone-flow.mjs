// Phone reachability gate (stage 9, mobile lane): on a touch phone in landscape (844×390, hasTouch) every step from boot to a
// battle is done with real taps (page.touchscreen at the element's centre, after checking elementFromPoint lands on it):
// wake the title → 故事模式 → 普通 → 小美's card → 出陣 → the chapter list → hk2 → 出陣 → the prologue (tap through) → the
// battle with the touch pad up. Also the title's 致敬 opens the tribute card and a tap returns to the title. Shots →
// bench/shots/9/phone/. Exit 1 on any unreachable step or console error.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serve } from './browser.mjs';
const out = new URL('../shots/9/phone/', import.meta.url).pathname; mkdirSync(out, { recursive: true });
const srv = await serve(), browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2.625 });
const page = await ctx.newPage(), errors = [];
page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
let shot = 0;
/** Tap the first element matching `sel` (optionally whose text includes `text`) if it is on screen and on top. */
async function tap(name, sel, text = '') {
  const p = await page.evaluate(([sel, text]) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.offsetParent !== null && (!text || e.textContent.includes(text)));
    if (!el) return { err: 'not found' };
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return { err: `off screen (${r.left | 0},${r.top | 0} ${r.width | 0}×${r.height | 0})` };
    const top = document.elementFromPoint(x, y);
    return el.contains(top) || top === el ? { x, y } : { err: `covered by ${top?.tagName}.${top?.className}` };
  }, [sel, text]);
  ok(`tap ${name}`, !p.err, p.err || '');
  if (!p.err) await page.touchscreen.tap(p.x, p.y);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}${String(shot++).padStart(2, '0')}-${name.replace(/\W+/g, '-')}.png` });
  return !p.err;
}
await page.goto(srv.url + '?x');
await page.waitForFunction(() => window.__vm?.state === 'title', null, { timeout: 60000 }); await page.waitForTimeout(2500);
await page.touchscreen.tap(422, 200); await page.waitForTimeout(1200);                 // "press any key" card
await tap('致敬', '#title .t-main button', '致敬');
await page.waitForTimeout(3000);
ok('tribute card shows', await page.evaluate(() => __vm.state === 'ending' && document.getElementById('ending').classList.contains('tribute')));
await page.touchscreen.tap(422, 200); await page.waitForTimeout(3000);
ok('a tap on the tribute returns to the title', await page.evaluate(() => __vm.state === 'title'));
await tap('故事模式', '#title .t-main button', '故事模式');
await tap('普通', '#title .t-dif button', '普通');
await page.waitForTimeout(1500);
ok('select screen up', await page.evaluate(() => __vm.state === 'select'));
await tap('小美 card', '#select [data-i]', '小美');
await tap('出陣 (chapter list)', '#select .s-go');
await tap('hk2 立法會', '#select .s-chs button, #select .s-chs [data-c], #select .s-chs > *', '立法會');
await tap('出陣 (deploy)', '#select .s-go');
await page.waitForFunction(() => ['prologue', 'battle'].includes(__vm.state), null, { timeout: 60000 }).catch(() => {});
ok('prologue / battle reached', await page.evaluate(() => ['prologue', 'battle'].includes(__vm.state)));
for (let k = 0; k < 8 && (await page.evaluate(() => __vm.state)) === 'prologue'; k++) { await page.touchscreen.tap(422, 200); await page.waitForTimeout(1300); }
await page.waitForFunction(() => __vm.state === 'battle', null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2500);
const b = await page.evaluate(() => ({ state: __vm.state, ch: __vm.game.chapter, who: __vm.game.hero.char.id, pad: !document.getElementById('touch').hidden }));
ok('battle: hk2 as 小美 with the touch pad', b.state === 'battle' && b.ch === 'hk2' && b.who === 'siumei' && b.pad, JSON.stringify(b));
await page.screenshot({ path: `${out}${String(shot++).padStart(2, '0')}-battle.png` });
await tap('pause', '#touch .b-pause');
ok('pause menu open', await page.evaluate(() => __vm.paused));
await tap('繼續 resume', '#menu #go');
ok('resumed', await page.evaluate(() => !__vm.paused));
ok('no console errors', !errors.length, errors.slice(0, 2).join(' | '));
await browser.close(); srv.close();
const pass = res.every(Boolean);
console.log(pass ? `PHONE FLOW PASS ${res.length}/${res.length}` : `PHONE FLOW FAIL ${res.filter(Boolean).length}/${res.length}`);
process.exit(pass ? 0 : 1);
