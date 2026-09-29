// Screenshot the turntable bench for a character (critic rounds): node bench/chars/shot.mjs gok [out.png] [clip] [t]
import { openGame, serve } from '../harness/browser.mjs';
import { chromium } from 'playwright-core';
const [id = 'gok', out = `bench/out/${id}-turntable.png`, clip = 'idle', t = '0.3'] = process.argv.slice(2);
const srv = await serve(), b = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] });
const p = await b.newPage({ viewport: { width: 1500, height: 860 } }), errs = [];
p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(`${srv.url}bench/chars/turntable.html?char=${id}&clip=${clip}&t=${t}`);
await p.waitForFunction(() => window.__ready, null, { timeout: 30000 });
await p.screenshot({ path: out });
console.log(out, errs.length ? errs : 'ok');
await b.close(); srv.close();
