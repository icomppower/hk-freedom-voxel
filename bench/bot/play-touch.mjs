// The bot through the touch pad (stage-5 gate): Pixel 7 landscape emulation (touch, pointer: coarse → the mobile tier),
// ?go=story into the chapter; every fixed step the bot's wanted input is turned into touch pointer events on the on-screen
// pad (src/ui/touch.js: the floating stick dragged to the stick vector, 攻 蓄 跳 閃 無雙 tapped / held) — nothing is
// written into the input frame directly, so the chapter is played by touch alone (one step of latency). 'target'
// (recentre, no pad button) is dropped. Reports the result; screenshots → bench/shots/<dir>/.
//   node bench/bot/play-touch.mjs --char lungjai --chapter hk1 [--minutes 12] [--shots 4] [--dir 5]
import { mkdirSync } from 'node:fs';
import { chromium, devices } from 'playwright-core';
import { serve } from '../harness/browser.mjs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const char = arg('char', 'lungjai'), chapter = arg('chapter', 'hk1'), minutes = +arg('minutes', 12), shots = +arg('shots', 0);
const out = new URL(`../shots/${arg('dir', '5')}/`, import.meta.url).pathname; mkdirSync(out, { recursive: true });
const srv = await serve();
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ ...devices['Pixel 7 landscape'] });
const page = await ctx.newPage(), errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(() => {
  const A = ['attack', 'charge', 'jump', 'dodge', 'musou'], PID = { attack: 11, charge: 12, jump: 13, dodge: 14, musou: 15 };
  const T = { taps: 0, drags: 0, coarse: matchMedia('(pointer: coarse)').matches };
  window.__touch = T;
  const ev = (el, type, id, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: id === 1, clientX: x, clientY: y, bubbles: true, cancelable: true }));
  let stickDown = false; const down = {};
  const BX = 140, BY = 250, R = 56, C = [BX, BY];
  import('/bench/bot/bot.mjs').then((m) => {
    const bot = m.createBot();
    window.__onStep = () => {
      const G = window.__vm.game, root = document.getElementById('touch');
      if (!root || root.hidden) return;
      const w = bot(G);                                                // wanted input → pad events for the next sample
      const mag = Math.hypot(w.mx, w.my);
      if (mag > 0.13) {
        if (!stickDown) {                                              // the pad may re-centre the stick (the fixed D-pad):
          ev(root, 'pointerdown', 1, BX, BY); stickDown = true; T.drags++;  // steer from where its base actually landed
          const bs = root.querySelector('.t-base').style; C[0] = parseFloat(bs.left) || BX; C[1] = parseFloat(bs.top) || BY;
        }
        ev(root, 'pointermove', 1, C[0] + w.mx * R, C[1] - w.my * R);
      } else if (stickDown) { ev(root, 'pointerup', 1, C[0], C[1]); stickDown = false; }
      for (const a of A) {
        const b = root.querySelector(`.t-btn[data-a="${a}"]`), r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        if (down[a]) { ev(root, 'pointerup', PID[a], x, y); down[a] = false; }
        if (w.pressed[a] || w.held[a]) { ev(b, 'pointerdown', PID[a], x, y); down[a] = true; T.taps++; }
      }
    };
  });
});
await page.goto(srv.url + `?go=story&char=${char}&ch=${chapter}`);
const t0 = Date.now(); let n = 0, res = null;
while (Date.now() - t0 < minutes * 60000) {
  await page.waitForTimeout(2000);
  res = await page.evaluate(() => ({ ch: __vm.game.chapter, who: __vm.game.hero.char.id, state: __vm.state, frame: __vm.game.frame, z: __vm.game.hero.z, kos: __vm.game.hero.kos, win: document.querySelector('#result')?.classList.contains('win'), ...window.__touch, enemies: __vm.game.crowd.grunts }));
  if (shots && Date.now() - t0 > (n + 1) * minutes * 60000 / (shots + 2) && res.state === 'battle' && n < shots) {
    await page.screenshot({ path: `${out}touch-${chapter}-${char}-${n++}.png`, timeout: 20000 }).catch(() => {});
  }
  if (res.state === 'result') break;
}
await page.screenshot({ path: `${out}touch-${chapter}-${char}-end.png` }).catch(() => {});
const ok = res.state === 'result' && res.win && res.coarse && res.taps > 50 && res.ch === chapter && res.who === char;   // the run played what was asked
console.log(`${ok ? 'WIN' : res.state === 'result' ? 'LOSS' : 'TIMEOUT'} ${chapter} ${char} by touch (Pixel 7 landscape, mobile tier ${res.coarse}): frame ${res.frame}, KOs ${res.kos}, ${res.taps} taps, ${res.drags} stick drags, wall ${((Date.now() - t0) / 1000).toFixed(0)} s`, errors.length ? 'ERRORS ' + errors.slice(0, 3).join(' | ') : 'no page errors');
await browser.close(); srv.close();
process.exit(ok && !errors.length ? 0 : 1);
