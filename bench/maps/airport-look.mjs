// 機場 look gate (numeric #debug asserts, no screenshot impressions): hk5 in the real page with the bot fighting, sampled
// every 0.5 s from the world's root.userData.debug (src/world/maps/airport/world.js) and the story's objective events.
// Gates: the boards' top row reads the live objective (after each flip settles); every flight row flips to 取消 once the
// flights are cancelled and none before; a plane taxis past outside the glass (x = APRON_X > 22.7, z moving) and one
// climbs out beyond the deck; the travellers (≥ 6 at once) and the 4 stranded travellers are drawn; the security
// stanchions sink and the escalator shutter lifts; the boss's attack rings show; the chapter is won; 0 console errors.
// Shots at each stage → bench/shots/airport/.
//   node bench/maps/airport-look.mjs [char] [--mobile]
import { mkdirSync } from 'node:fs';
import { chromium, devices } from 'playwright-core';
import { serve } from '../harness/browser.mjs';
const char = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'lungjai', mobile = process.argv.includes('--mobile');
const out = new URL('../shots/airport/', import.meta.url).pathname; mkdirSync(out, { recursive: true });
const srv = await serve();
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext(mobile ? { ...devices['Pixel 7 landscape'] } : { viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage(), errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(() => {
  window.__objs = [];
  import('/src/core/events.js').then((ev) => ev.on('story:objective', (e) => { window.__objs.push(e.zh); }));
  import('/bench/bot/bot.mjs').then((m) => { const bot = m.createBot(); window.__onStep = (inp) => Object.assign(inp, bot(window.__vm.game)); });
});
await page.goto(srv.url + `?go=story&char=${char}&ch=hk5`);
await page.waitForFunction(() => window.__vm?.state === 'battle', null, { timeout: 120000 });
const S = { boardOk: 0, boardN: 0, cancelRows: 0, cancelEarly: 0, apron: 0, taxiZ: new Set(), climb: 0, pax: 0, stranded: 0, stan: 0, shut: 0, rings: 0 };
const shots = new Set(), t0 = Date.now();
let r = null;
while (Date.now() - t0 < 14 * 60000) {
  await page.waitForTimeout(500);
  r = await page.evaluate(() => {
    const root = __vm.scene.getObjectByName('world-airport'), d = root && root.userData.debug, G = __vm.game;
    return { state: __vm.state, d: d && JSON.parse(JSON.stringify(d)), obj: window.__objs[window.__objs.length - 1], z: G.hero.z, fx: G.story.fx && { phase: G.story.fx.phase }, win: document.querySelector('#result')?.classList.contains('win') };
  });
  if (r.state === 'result') break;
  if (r.state !== 'battle' || !r.d) continue;
  const d = r.d;
  if (!d.flipping && r.obj) { S.boardN++; if (d.board[0] === `目標  ${r.obj}`) S.boardOk++; }
  const rows = d.board.slice(2);
  if (d.cancelled && !d.flipping) S.cancelRows = Math.max(S.cancelRows, rows.filter((x) => x.includes('取消')).length);
  if (!d.cancelled && rows.some((x) => x.includes('取消'))) S.cancelEarly++;
  if (d.planes[0][0] > 22.7) { S.apron++; S.taxiZ.add(d.planes[0][2]); }
  if (d.planes[2][1] > 30 && d.planes[2][2] > 96) S.climb++;
  S.pax = Math.max(S.pax, d.pax); S.stranded = Math.max(S.stranded, d.stranded);
  S.stan = Math.max(S.stan, d.stanchions); S.shut = Math.max(S.shut, d.shutter); S.rings = Math.max(S.rings, d.rings);
  const stage = d.rings ? 'boss' : d.stranded ? 'gates' : d.pax ? 'carousels' : r.z < -110 ? 'arrivals' : null;
  if (stage && !shots.has(stage) && (stage !== 'arrivals' || Date.now() - t0 > 8000)) { shots.add(stage); await page.screenshot({ path: `${out}${mobile ? 'mobile-' : ''}${stage}-${char}.png` }).catch(() => {}); }
}
await page.screenshot({ path: `${out}${mobile ? 'mobile-' : ''}result-${char}.png` }).catch(() => {});
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
ok('board top row = the live objective (settled samples)', S.boardN > 20 && S.boardOk / S.boardN > 0.97, `${S.boardOk}/${S.boardN}`);
ok('every flight row flips to 取消 after the cancellation, none before', S.cancelRows === 6 && S.cancelEarly === 0, `${S.cancelRows} rows, ${S.cancelEarly} early`);
ok('a plane taxis outside the glass (x > 22.7, z moving)', S.apron > 20 && S.taxiZ.size > 10, `${S.apron} samples, ${S.taxiZ.size} z values`);
ok('a plane climbs out beyond the deck', S.climb > 5, `${S.climb}`);
ok('travellers drawn (≥ 6 at once)', S.pax >= 6, `${S.pax}`);
ok('4 stranded travellers drawn', S.stranded === 4, `${S.stranded}`);
ok('security stanchions sink, escalator shutter lifts', S.stan >= 0.98 && S.shut >= 0.98, `${S.stan} / ${S.shut}`);
ok('boss attack rings drawn', S.rings >= 1, `${S.rings}`);
ok('chapter won', r && r.state === 'result' && r.win, r && r.state);
ok('no console errors', !errors.length, errors.slice(0, 2).join(' | '));
const pass = res.every(Boolean);
console.log(pass ? `AIRPORT LOOK PASS ${res.length}/${res.length} (${char}${mobile ? ', Pixel 7 mobile tier' : ''}, ${((Date.now() - t0) / 1000).toFixed(0)} s)` : 'AIRPORT LOOK FAIL');
await browser.close(); srv.close();
process.exit(pass ? 0 : 1);
