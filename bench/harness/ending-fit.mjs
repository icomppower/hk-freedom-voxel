// ENDING scroll fit: every card of hk4's ENDING at 1280×720 and 844×390 — the three columns, the English line and the
// stamp lie inside the viewport (and inside the paper). Shots → bench/shots/cutscenes/ending-scroll/.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serve } from './browser.mjs';
const out = new URL('../shots/cutscenes/ending-scroll/', import.meta.url).pathname; mkdirSync(out, { recursive: true });
const srv = await serve(), browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] });
let bad = 0;
for (const [w, h] of [[1280, 720], [844, 390]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(srv.url + '?x'); await page.waitForFunction(() => window.__vm?.state === 'title', null, { timeout: 60000 }); await page.waitForTimeout(1200);
  await page.evaluate(() => __vm.flow.go('ending', { mode: 'story', char: 'lungjai', chapter: 'hk4', win: true, sceneDone: true })); await page.waitForTimeout(2600);
  for (let k = 0; k < 7; k++) {
    const r = await page.evaluate(() => { const inV = (e) => { if (!e || !e.offsetParent && getComputedStyle(e).position !== 'fixed') return true; const r = e.getBoundingClientRect(); return !r.width || (r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1); };
      return { cols: [...document.querySelectorAll('#ending .pl-cols span')].every(inV), en: inV(document.querySelector('#ending .pl-en')), stamped: document.getElementById('ending').classList.contains('stamped') }; });
    await page.screenshot({ path: `${out}${w}x${h}-${k}.png` });
    const ok = r.cols && r.en; if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${w}×${h} card ${k}${r.stamped ? ' (stamp)' : ''}: columns in view ${r.cols}, English in view ${r.en}`);
    if (r.stamped) break;
    await page.keyboard.down('Enter'); await page.waitForTimeout(80); await page.keyboard.up('Enter'); await page.waitForTimeout(1500);
  }
  await page.close();
}
await browser.close(); srv.close();
console.log(bad ? `ENDING FIT FAIL ${bad}` : 'ENDING FIT PASS');
process.exit(bad ? 1 : 0);
