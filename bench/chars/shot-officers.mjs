// node bench/chars/shot-officers.mjs [out.png] [ko|crack|-] [keys a,b,c,d] [foe skin] [ally skin]
import { serve } from '../harness/browser.mjs';
import { chromium } from 'playwright-core';
const [out = 'bench/out/officers.png', mode0 = '', keys = '', foe = '', ally = ''] = process.argv.slice(2), mode = mode0 === '-' ? '' : mode0;
const srv = await serve(), b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: 1500, height: 860 } }), errs = [];
p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const qs = [mode && mode + '=1', keys && 'keys=' + keys, foe && 'foe=' + foe, ally && 'ally=' + ally].filter(Boolean).join('&');
await p.goto(`${srv.url}bench/chars/officers.html${qs ? '?' + qs : ''}`);
await p.waitForFunction(() => window.__ready, null, { timeout: 30000 }).catch(() => {});
await p.screenshot({ path: out });
console.log(out, errs.length ? errs : 'ok');
await b.close(); srv.close();
