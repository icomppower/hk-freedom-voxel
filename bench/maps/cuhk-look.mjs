// 中大二號橋 look gate (numeric #debug asserts, no screenshot impressions): hk6 in the real page with the bot fighting,
// sampled every 0.25 s from the world's root.userData.debug (src/world/maps/cuhk/world.js) and the story fx.
// Gates: the lesson canister flies in and smokes, a cone is drawn over a coned one, putOut counts it; the drawn smoke
// follows the story (a smoking canister drawn ⇔ story haze > 0, ≥ 95 % of samples); the barricade stack only ever rises
// once the story starts it and the hill gate opens only after it is full; traffic and a train under the bridge; the boss's
// attack rings show; the chapter is won; 0 console errors. --video DIR: records the run (webm) and prints the stage marks
// (seconds from the recording's start) for the test-video page.
//   node bench/maps/cuhk-look.mjs [char] [--mobile] [--video DIR]
import { mkdirSync } from 'node:fs';
import { chromium, devices } from 'playwright-core';
import { serve } from '../harness/browser.mjs';
const argv = process.argv.slice(2), opt = (k) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : null; };
const char = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'lungjai', mobile = argv.includes('--mobile'), vdir = opt('video');
const out = new URL('../shots/cuhk/', import.meta.url).pathname; mkdirSync(out, { recursive: true });
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
await page.goto(srv.url + `?go=story&char=${char}&ch=hk6`);
await page.waitForFunction(() => window.__vm?.state === 'battle', null, { timeout: 120000 });
const S = { smoke: 0, cone: 0, putOut: 0, agree: 0, n: 0, barSeen: 0, barDrop: 0, barMax: 0, gateEarly: 0, gateOpen: 0, train: 0, cars: 0, rings: 0 };
const marks = {}, mark = (k) => { if (!(k in marks)) marks[k] = +((Date.now() - T0) / 1000).toFixed(1); };
let r = null, lastBar = 0;
while (Date.now() - T0 < 15 * 60000) {
  await page.waitForTimeout(250);
  r = await page.evaluate(() => {
    const root = __vm.scene.getObjectByName('world-cuhk'), d = root && root.userData.debug, fx = __vm.game.story.fx;
    return { state: __vm.state, d: d && { ...d }, haze: fx ? fx.haze : 0, phase: fx ? fx.phase : 0, putOut: fx ? fx.putOut : 0, z: __vm.game.hero.z, win: document.querySelector('#result')?.classList.contains('win') };
  });
  if (r.state === 'result') { mark('win'); break; }
  if (r.state !== 'battle' || !r.d) continue;
  const d = r.d;
  S.n++;
  if (d.smoking) { S.smoke = Math.max(S.smoke, d.smoking); mark('lesson'); }
  if (d.cones) { S.cone = Math.max(S.cone, d.cones); mark('cone'); }
  S.putOut = Math.max(S.putOut, r.putOut);
  if ((d.smoking > 0) === (r.haze > 0.004) || (d.smoking === 0 && r.haze < 0.05)) S.agree++;
  if (r.z > -100) mark('bridge');
  if (d.barricade > 0 && d.barricade < 1) { S.barSeen++; mark('barricade'); if (d.barricade < lastBar - 1e-6) S.barDrop++; }
  if (d.barricade > 0) lastBar = d.barricade;
  S.barMax = Math.max(S.barMax, d.barricade);
  if (d.gate && d.barricade < 1) S.gateEarly++;
  if (d.gate) { S.gateOpen++; mark('hill'); }
  if (d.train) S.train++;
  S.cars = Math.max(S.cars, d.cars); S.rings = Math.max(S.rings, d.rings);
  if (r.phase >= 1) mark('boss');
  if (r.phase >= 2) mark('bossP2');
}
await page.screenshot({ path: `${out}${mobile ? 'mobile-' : ''}result-${char}.png` }).catch(() => {});
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x !== '' ? '  ' + x : ''}`); };
ok('a canister smokes (lesson / volleys)', S.smoke >= 1, `max ${S.smoke} at once`);
ok('a cone drawn over a coned canister', S.cone >= 1, `max ${S.cone}`);
ok('putOut counts the canisters put out', S.putOut >= 1, `${S.putOut}`);
ok('drawn smoke follows the story haze (≥ 95 %)', S.n > 100 && S.agree / S.n >= 0.95, `${S.agree}/${S.n}`);
ok('barricade: only rises once started, reaches full', S.barSeen > 10 && S.barDrop === 0 && S.barMax === 1, `${S.barSeen} partial samples, ${S.barDrop} drops, max ${S.barMax}`);
ok('hill gate opens only after the barricade is full', S.gateOpen > 0 && S.gateEarly === 0, `${S.gateOpen} open samples, ${S.gateEarly} early`);
ok('traffic and a train under the bridge', S.cars === 10 && S.train > 5, `${S.cars} cars, train in ${S.train} samples`);
ok('boss attack rings drawn', S.rings >= 1, `${S.rings}`);
ok('chapter won', r && r.state === 'result' && r.win, r && r.state);
ok('no console errors', !errors.length, errors.slice(0, 2).join(' | '));
const video = vdir ? await page.video()?.path() : null;
await ctx.close();
if (vdir) console.log('VIDEO', JSON.stringify({ video, marks }));
const pass = res.every(Boolean);
console.log(pass ? `CUHK LOOK PASS ${res.length}/${res.length} (${char}${mobile ? ', Pixel 7 mobile tier' : ''}, ${((Date.now() - T0) / 1000).toFixed(0)} s)` : 'CUHK LOOK FAIL');
await browser.close(); srv.close();
process.exit(pass ? 0 : 1);
