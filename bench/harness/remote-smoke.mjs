// Deployed-site smoke: open a URL in headless Chrome, wait, report the flow state and console errors (exit 1 on any).
//   node bench/harness/remote-smoke.mjs https://hk-freedom-voxel.vercel.app/ [seconds] [out.png] [WxH]
import { chromium } from 'playwright-core';
const [url, secs = '8', shot, size = '1280x720'] = process.argv.slice(2), [width, height] = size.split('x').map(Number);
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width, height } }), errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const res = await page.goto(url);
await page.waitForTimeout(+secs * 1000);
const title = await page.title(), ink = await page.evaluate(() => document.getElementById('title')?.hidden === false);
if (shot) await page.screenshot({ path: shot });
console.log(`${res.status()} "${title}" title-screen ${ink}`, errors.length ? 'ERRORS ' + errors.join(' | ') : '0 console errors');
await browser.close();
process.exit(errors.length || res.status() !== 200 ? 1 : 0);
