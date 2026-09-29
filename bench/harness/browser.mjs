// Browser side of the harness (Playwright + system Chrome). Serves the repo over a local static server and, at serve time
// only (the repo is untouched), patches src/main.js so a test can read the live game:
//   window.__vm = { game, flow, input, screens, camRig, get state(), get paused() }
//   window.__onStep(inp)   optional hook called with each fixed step's raw input (before the camera rotates the stick)
// Used by record-browser.mjs (human input logs) and the screenshot / critic scripts.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright-core';

export const ROOT = resolve(import.meta.dirname, '../..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };

const PATCH = `
;window.__vm = { game, flow, input, screens, camRig, render, get state() { return state; }, get paused() { return paused; } };`;

export function serve(root = ROOT) {
  return new Promise((ok) => {
    const srv = createServer(async (req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      try {
        let body = await readFile(resolve(root, '.' + p));
        if (p === '/src/main.js') body = String(body).replace('const inp = input.sample();', 'const inp = input.sample(); window.__onStep?.(inp);') + PATCH;
        res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(body);
      } catch { res.writeHead(404); res.end(); }
    });
    srv.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() }));
  });
}

/** Launch Chrome on the game. opts: { query: '?go=story&char=zhaoyun', headless, width, height, init (fn run before the page's
 *  scripts, e.g. to install window.__onStep), initArg }. */
export async function openGame({ query = '', headless = true, width = 1280, height = 720, args = [], init = null, initArg } = {}) {
  const srv = await serve();
  const browser = await chromium.launch({ channel: 'chrome', headless, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', ...args] });
  const page = await browser.newPage({ viewport: { width, height } });
  if (init) await page.addInitScript(init, initArg);         // runs before the game's modules: hooks live from frame 0
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(srv.url + query);
  await page.waitForFunction(() => window.__vm && window.__vm.state, null, { timeout: 60000 });
  return { page, browser, errors, url: srv.url, close: async () => { await browser.close(); srv.close(); } };
}
