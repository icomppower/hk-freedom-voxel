// 銅鑼灣 look gate (numeric #debug asserts, no screenshot impressions): hk6 in the real page with the bot fighting,
// sampled every 0.25 s from the world's root.userData.debug (src/world/maps/causeway/world.js) and the story fx.
// Gates: the march column is drawn (blocks trailing the head) and its drawn head follows the story's; the police line
// slides away; the five lane blocks are drawn, the drawn parted count follows the story, the ambulance drives the lane with
// its lights flashing, in to the casualty and back out (one turn); the chapter is won; 0 console errors. --video DIR records the run.
//   node bench/maps/causeway-look.mjs [char] [--mobile] [--video DIR]
import { mkdirSync } from 'node:fs';
import { chromium, devices } from 'playwright-core';
import { serve } from '../harness/browser.mjs';
const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : null; };
const char = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'lungjai', mobile = argv.includes('--mobile'), vdir = opt('video');
const out = new URL('../shots/causeway/', import.meta.url).pathname; mkdirSync(out, { recursive: true });
const srv = await serve();
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const base = mobile ? { ...devices['Pixel 7 landscape'] } : { viewport: { width: 1280, height: 720 } };
const ctx = await browser.newContext(vdir ? { ...base, recordVideo: { dir: vdir, size: mobile ? { width: 915, height: 412 } : { width: 1280, height: 720 } } } : base);
const T0 = Date.now();
const page = await ctx.newPage(), errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(() => {
  import('/bench/bot/bot.mjs').then((m) => { const bot = m.createBot(); window.__onStep = (inp) => Object.assign(inp, bot(window.__vm.game)); });
});
await page.goto(srv.url + `?go=story&char=${char}&ch=hk7`);
await page.waitForFunction(() => window.__vm?.state === 'battle', null, { timeout: 120000 });
const S = { col: 0, headOk: 0, n: 0, lane: 0, parted: 0, partedOk: 0, amb: 0, turns: 0, low: 1e9, lights: 0, barrierGone: 0 };
const marks = {}, mark = (k) => { if (!(k in marks)) marks[k] = +((Date.now() - T0) / 1000).toFixed(1); };
let r = null, lastAmb = null, dir = 0;
while (Date.now() - T0 < 15 * 60000) {
  await page.waitForTimeout(250);
  r = await page.evaluate(() => {
    const root = __vm.scene.getObjectByName('world-causeway'), d = root && root.userData.debug, fx = __vm.game.story.fx;
    return { state: __vm.state, d: d && { ...d }, head: fx ? +fx.column.head.toFixed(2) : 0, parted: fx ? fx.parted : 0, amb: fx ? fx.amb.on : false, flags: __vm.game.story.fx && null, win: document.querySelector('#result')?.classList.contains('win') };
  });
  if (r.state === 'result') { mark('win'); break; }
  if (r.state !== 'battle' || !r.d) continue;
  const d = r.d;
  S.n++;
  if (d.columnBlocks) { S.col = Math.max(S.col, d.columnBlocks); if (Math.abs(d.head - r.head) < 0.6) S.headOk++; mark('march'); }
  if (d.barrier < 0.05) { S.barrierGone++; mark('junction'); }
  if (d.laneBlocks) { S.lane = Math.max(S.lane, d.laneBlocks); mark('ambulance'); if (d.parted === r.parted) S.partedOk++; S.parted = Math.max(S.parted, d.parted); }
  if (d.ambOn) {                                                     // in toward the casualty, then back out: one turn
    S.amb++; S.low = Math.min(S.low, d.ambZ); if (d.lights) S.lights++;
    if (lastAmb != null && Math.abs(d.ambZ - lastAmb) > 1e-6) { const nd = Math.sign(d.ambZ - lastAmb); if (dir && nd !== dir) S.turns++; dir = nd; }
    lastAmb = d.ambZ;
  }
  if (r.state === 'battle' && d.ambOn === 0 && S.amb > 0) mark('deck');
}
await page.screenshot({ path: `${out}${mobile ? 'mobile-' : ''}result-${char}.png` }).catch(() => {});
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x !== '' ? '  ' + x : ''}`); };
const colN = S.n;
ok('the march column drawn (≥ 8 blocks at once)', S.col >= 8, `max ${S.col}`);
ok('its drawn head follows the story', S.headOk > 50, `${S.headOk} samples within 0.6 m`);
ok('the police line slides away', S.barrierGone > 10, `${S.barrierGone}`);
ok('the five lane blocks drawn, parted count follows the story', S.lane === 5 && S.parted === 5 && S.partedOk > 20, `${S.lane} blocks, ${S.parted} parted, ${S.partedOk} agreeing samples`);
ok('the ambulance drives in to the casualty and back out (one turn), lights flashing', S.amb > 20 && S.lights > 20 && S.turns === 1 && S.low < -3, `${S.amb} samples, ${S.lights} lit, ${S.turns} turns, closest z ${S.low}`);
ok('chapter won', r && r.state === 'result' && r.win, r && r.state);
ok('no console errors', !errors.length, errors.slice(0, 2).join(' | '));
const video = vdir ? await page.video()?.path() : null;
await ctx.close();
if (vdir) console.log('VIDEO', JSON.stringify({ video, marks }));
const pass = res.every(Boolean);
console.log(pass ? `CAUSEWAY LOOK PASS ${res.length}/${res.length} (${char}${mobile ? ', Pixel 7 mobile tier' : ''}, ${((Date.now() - T0) / 1000).toFixed(0)} s)` : 'CAUSEWAY LOOK FAIL');
await browser.close(); srv.close();
process.exit(pass ? 0 : 1);
