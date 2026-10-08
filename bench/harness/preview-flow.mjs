// ?preview gallery gate: each panel item enters its screen and comes back to the title (Esc skips); a previewed prologue
// never starts its battle; the panel is absent without ?preview. Exit 1 on any miss.
import { openGame } from './browser.mjs';
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
const g = await openGame({ query: '?preview', args: ['--autoplay-policy=no-user-gesture-required'] }), P = g.page, wait = (ms) => P.waitForTimeout(ms);
const until = (fn, arg, ms = 40000) => P.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
await until(() => __vm.state === 'title', null, 60000); await wait(1200);
ok('panel on the title', await P.evaluate(() => !document.getElementById('preview').hidden));
const plan = { hk1: 'prologue', between1: 'cutscene', hk7: 'prologue', hk2: 'prologue', between2: 'cutscene', hk3: 'prologue', hk6: 'prologue', between3: 'cutscene', hk4: 'prologue', ending: 'cutscene', endscroll: 'ending' };
let battles = 0; await P.exposeFunction('__b', () => battles++);
await P.evaluate(() => addEventListener('flowprobe', () => {}));
for (const [id, st] of Object.entries(plan)) {
  await P.evaluate((id) => document.querySelector(`#preview [data-go="${id}"]`).click(), id);
  const inIt = await until((st) => __vm.state === st, st);
  ok(`${id} → ${st}`, inIt, await P.evaluate(() => __vm.state));
  await wait(2500);
  for (let k = 0; k < 8 && !(await P.evaluate(() => __vm.state === 'title')); k++) {
    if (await P.evaluate(() => __vm.state === 'battle')) battles++;
    await P.keyboard.press('Escape'); await wait(1600);
    if (await P.evaluate(() => __vm.state === 'ending' && document.getElementById('ending').classList.contains('tribute'))) await P.mouse.click(900, 500);
  }
  ok(`${id} → back to title`, await until(() => __vm.state === 'title' && !document.getElementById('preview').hidden, null, 20000), await P.evaluate(() => __vm.state));
}
ok('no battle started', battles === 0, String(battles));
ok('no console errors', !g.errors.length, g.errors.slice(0, 2).join(' | '));
await g.close();
const g2 = await openGame({}); await g2.page.waitForFunction(() => __vm.state === 'title', null, { timeout: 60000 });
ok('no panel without ?preview', await g2.page.evaluate(() => !document.getElementById('preview'))); await g2.close();
const pass = res.every(Boolean);
console.log(pass ? `PREVIEW PASS ${res.length}/${res.length}` : `PREVIEW FAIL ${res.filter(Boolean).length}/${res.length}`);
process.exit(pass ? 0 : 1);
