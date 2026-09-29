// Touch hook gate (stage 1): one input plan played twice through the real page on a touch-emulated phone (844×390,
// hasTouch, isMobile → pointer: coarse, the mobile tier) — once as keyboard events, once as touch pointer events on the
// on-screen pad — each dispatched from the step hook at the same sim frame. Gate: the two recorded input logs are
// identical frame for frame, their in-page state hashes match at every checkpoint, and the two logs replayed in a cold
// Node sim each land on the same final hash. Logs → bench/out/touch/{touch,keys}.json.
//   node bench/harness/touch-twin.mjs [frames]
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { serve } from './browser.mjs';

const FRAMES = +(process.argv[2] || 1500), out = resolve(import.meta.dirname, '../out/touch');
mkdirSync(out, { recursive: true });
// plan: [frame, kind, arg, down] — btn = an action button, stick = a cardinal direction [x, y] or null (release)
const PLAN = [];
const hold = (f, n, kind, arg) => { PLAN.push([f, kind, arg, true]); PLAN.push([f + n, kind, kind === 'stick' ? null : arg, false]); };
hold(20, 70, 'stick', [0, 1]);
for (let k = 0; k < 6; k++) hold(100 + k * 14, 4, 'btn', 'attack');
hold(190, 6, 'btn', 'charge');
hold(260, 50, 'stick', [1, 0]);
hold(280, 5, 'btn', 'jump'); hold(300, 5, 'btn', 'attack');
hold(340, 5, 'btn', 'dodge');
hold(380, 90, 'stick', [0, 1]);
for (let k = 0; k < 10; k++) hold(480 + k * 12, 3, 'btn', 'attack');
hold(610, 8, 'btn', 'charge');
hold(660, 60, 'stick', [-1, 0]);
hold(700, 6, 'btn', 'musou');
hold(760, 40, 'stick', [0, -1]); hold(770, 5, 'btn', 'dodge');
for (let k = 0; k < 20; k++) hold(820 + k * 13, 4, 'btn', 'attack');
hold(1100, 120, 'stick', [0, 1]); hold(1150, 5, 'btn', 'jump'); hold(1160, 5, 'btn', 'charge');
for (let k = 0; k < 12; k++) hold(1240 + k * 15, 4, 'btn', 'attack');
PLAN.sort((a, b) => a[0] - b[0]);

const srv = await serve();
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
async function run(mode) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2.625 });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(({ PLAN, FRAMES, mode }) => {
    const KEYS = { attack: 'KeyJ', charge: 'KeyK', jump: 'Space', dodge: 'KeyL', musou: 'KeyI' };
    const DIR = { '0,1': 'KeyW', '0,-1': 'KeyS', '1,0': 'KeyD', '-1,0': 'KeyA' };
    const T = { log: [], checks: {}, done: false, coarse: matchMedia('(pointer: coarse)').matches };
    window.__tw = T;
    import('/bench/harness/sim.mjs').then((m) => { T.enc = m.encodeInput; T.hash = m.stateHash; });
    let pi = 0, stickDir = null;
    const key = (code, down) => dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code }));
    const ptr = (el, type, id, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: id === 1, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    const PID = { attack: 11, charge: 12, jump: 13, dodge: 14, musou: 15 };
    function act([, kind, arg, down]) {
      const root = document.getElementById('touch');
      if (mode === 'keys') {
        if (kind === 'btn') key(KEYS[arg], down);
        else if (down) { stickDir = DIR[arg.join()]; key(stickDir, true); } else { key(stickDir, false); stickDir = null; }
        return;
      }
      if (kind === 'btn') {
        const b = root.querySelector(`.t-btn[data-a="${arg}"]`), r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
        ptr(down ? b : root, down ? 'pointerdown' : 'pointerup', PID[arg], x, y);
      } else if (down) { ptr(root, 'pointerdown', 1, 150, 250); ptr(root, 'pointermove', 1, 150 + arg[0] * 90, 250 - arg[1] * 90); }
      else ptr(root, 'pointerup', 1, 150, 250);
    }
    window.__onStep = (inp) => {
      const G = window.__vm.game, f = G.frame;
      if (T.done) return;
      if (!T.enc) { T.missed = (T.missed || 0) + 1; return; }
      T.log.push(T.enc(inp));
      if (f % 300 === 0) T.checks[f] = T.hash(G);
      if (f + 1 >= FRAMES) { T.checks[f + 1] = 'pending'; T.done = true; return; }
      while (pi < PLAN.length && PLAN[pi][0] === f + 1) act(PLAN[pi++]);   // lands in the next step's sample()
    };
  }, { PLAN, FRAMES, mode });
  await page.goto(srv.url + '?go=story&char=zhaoyun&ch=ch1');
  await page.waitForFunction(() => window.__tw?.done, null, { timeout: 600000, polling: 250 });
  const r = await page.evaluate(() => { const T = __tw; delete T.checks[Object.keys(T.checks).find((k) => T.checks[k] === 'pending')]; return { log: T.log, checks: T.checks, coarse: T.coarse, missed: T.missed || 0, frame: __vm.game.frame }; });
  await ctx.close();
  return { ...r, errors };
}
// the logs must start at frame 0 of the battle: the step hook records from the first step with the encoder loaded
const T = await run('touch'), K = await run('keys');
await browser.close(); srv.close();
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
ok('touch emulation reports pointer: coarse (mobile tier, 150 enemies)', T.coarse && K.coarse);
ok('both logs start at battle frame 0', !T.missed && !K.missed, `${T.missed} / ${K.missed} steps before the encoder loaded`);
const n = Math.min(T.log.length, K.log.length);
let firstDiff = -1; for (let i = 0; i < n && firstDiff < 0; i++) if (T.log[i].join() !== K.log[i].join()) firstDiff = i;
ok('input logs identical (touch vs keys)', firstDiff < 0 && T.log.length === K.log.length, `${T.log.length} vs ${K.log.length} frames${firstDiff >= 0 ? ', first diff @' + firstDiff + ' ' + T.log[firstDiff] + ' | ' + K.log[firstDiff] : ''}`);
const nonIdle = T.log.filter((r) => r[0] || r[1] || r[4] || r[5]).length;
ok('the plan reached the sim (non-idle input frames)', nonIdle > 300, `${nonIdle}`);
const ck = Object.keys(T.checks), same = ck.filter((k) => T.checks[k] === K.checks[k]).length;
ok('in-page state hashes match at every checkpoint', same === ck.length && ck.length > 2, `${same}/${ck.length}`);
ok('no console errors', !T.errors.length && !K.errors.length, [...T.errors, ...K.errors].slice(0, 2).join(' | '));
// Node replay of both logs (mobile tier: the page ran 150 enemies)
const toLog = (L) => { const rle = []; for (const rec of L.log) { const last = rle[rle.length - 1]; if (last && rec.every((v, k) => v === last[k + 1])) last[0]++; else rle.push([1, ...rec]); } return { char: 'zhaoyun', mode: 'story', chapter: 'ch1', enemies: L.coarse ? 150 : 300, frames: L.log.length, rle, checks: {} }; };
const fin = {};
for (const [name, L] of [['touch', T], ['keys', K]]) {
  const f = resolve(out, name + '.json'); writeFileSync(f, JSON.stringify(toLog(L)));
  fin[name] = execFileSync(process.execPath, ['--import', resolve(import.meta.dirname, 'register.mjs'), '--no-warnings', '-e',
    `import('${resolve(import.meta.dirname, 'sim.mjs')}').then(async (m) => { const log = JSON.parse(require('fs').readFileSync('${f}', 'utf8')); const s = await m.createSim({ enemies: log.enemies }); const r = m.replay(s, log); console.log(r.checks[r.frames]); })`], { encoding: 'utf8' }).trim();
}
ok('Node replay: touch log final hash = keyboard twin', fin.touch === fin.keys, `${fin.touch} vs ${fin.keys} (150 enemies)`);
const pass = res.every(Boolean);
console.log(pass ? `TOUCH TWIN PASS ${res.length}/${res.length}` : `TOUCH TWIN FAIL ${res.filter(Boolean).length}/${res.length}`);
process.exit(pass ? 0 : 1);
