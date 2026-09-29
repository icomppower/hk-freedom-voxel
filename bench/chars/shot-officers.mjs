// node bench/chars/shot-officers.mjs [out.png] [ko|crack]
import { serve } from '../harness/browser.mjs';
import { chromium } from 'playwright-core';
const [out = 'bench/out/officers.png', mode = ''] = process.argv.slice(2);
const srv = await serve(), b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: 1500, height: 860 } }), errs = [];
p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(`${srv.url}bench/chars/officers.html${mode ? '?' + mode + '=1' : ''}`);
await p.waitForFunction(() => window.__ready, null, { timeout: 30000 }).catch(() => {});
await p.screenshot({ path: out });
console.log(out, errs.length ? errs : 'ok');
await b.close(); srv.close();
