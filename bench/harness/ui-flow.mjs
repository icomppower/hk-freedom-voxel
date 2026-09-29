// UI smoke (title → select → chapter pick): screenshots the title (awake), the select screen for each officer and the
// chapter list; checks the title menu lists only 香港自由戰士 entries (no 羊村 / 三國 text) and 0 console errors.
//   node bench/harness/ui-flow.mjs [outdir] [WxH]
import { openGame } from './browser.mjs';
const [dir = 'bench/shots/ui', size = '1280x720'] = process.argv.slice(2), [width, height] = size.split('x').map(Number);
import { mkdirSync } from 'node:fs'; mkdirSync(dir, { recursive: true });
const g = await openGame({ width, height }), P = g.page, wait = (ms) => P.waitForTimeout(ms);
await wait(2500); await P.keyboard.press('Enter'); await wait(1200);
const menu = await P.evaluate(() => [...document.querySelectorAll('#title .t-main button b')].map((b) => b.textContent));
const text = await P.evaluate(() => document.getElementById('title').innerText);
await P.screenshot({ path: `${dir}/title-${size}.png` });
await P.evaluate(() => __vm.flow.go('select', { mode: 'story' })); await wait(2500);
await P.screenshot({ path: `${dir}/select-${size}.png` });
const roster = await P.evaluate(() => [...document.querySelectorAll('#select [data-i]')].map((b) => b.innerText.split('\n')[0]));
await P.keyboard.press('ArrowRight'); await wait(1500); await P.screenshot({ path: `${dir}/select2-${size}.png` });
const bad = /羊村|霧港|三國|定軍山|趙雲|黃忠|無雙 VOXEL|SHEEP/.test(text);
console.log(`menu: ${menu.join(' / ')} · roster: ${roster.join(' / ')} · foreign text: ${bad} · errors: ${g.errors.length}`, g.errors.slice(0, 2));
await g.close();
process.exit(bad || g.errors.length ? 1 : 0);
