// Cutscene flow gate: in the real page, from each hk result screen — hk1 / hk2 / hk6 WIN → 繼續 → betweenN (Esc skips) →
// the next chapter's loading card → its prologue scroll; hk3 WIN → 繼續 → straight to hk6's scroll (chain, no cutscene); hk4 WIN → 繼續 → the ENDING scroll (Esc → stamp, Esc) → the end
// scene (Esc) → the TRIBUTE card → a tap → the title; a LOSS (and a free-battle win) offers no cutscene. Exit 1 on any miss.
import { openGame } from './browser.mjs';
const g = await openGame({ args: ['--autoplay-policy=no-user-gesture-required'] }), P = g.page, wait = (ms) => P.waitForTimeout(ms);
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
const until = (fn, arg, ms = 30000) => P.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
const state = () => P.evaluate(() => ({ s: __vm.state, cut: window.__cut?.id, ch: __vm.game.chapter }));
const result = (chapter, win, mode = 'story') => P.evaluate(([chapter, win, mode]) => __vm.flow.go('result', { mode, char: 'siumei', chapter, win,
  stats: { kos: 900, time: 300, hpMax: 400, maxChain: 80, dmg: 50, rank: 'A' } }), [chapter, win, mode]);
const cont = async () => { await wait(1500); await P.evaluate(() => document.querySelector('#result .rs-btns button').click()); };
await until(() => __vm.state === 'title', null, 60000); await wait(1500);
// hk3 chains straight into 中大二號橋 hk6 (no cutscene)
await result('hk3', true); await cont();
ok('hk3 win → hk6 scroll (no cutscene)', await until(() => __vm.state === 'prologue' && __vm.game.chapter === 'hk6', null, 40000) && !(await P.evaluate(() => window.__cut?.id)), JSON.stringify(await state()));
await P.evaluate(() => __vm.flow.go('title')); await until(() => __vm.state === 'title');
for (const [ch, next, cut] of [['hk1', 'hk2', 'between1'], ['hk2', 'hk3', 'between2'], ['hk6', 'hk4', 'between3']]) {
  await result(ch, true); await cont();
  const inCut = await until((id) => __vm.state === 'cutscene' && window.__cut?.id === id, cut);
  ok(`${ch} win → ${cut}`, inCut, JSON.stringify(await state()));
  await wait(1200); await P.keyboard.press('Escape');
  const toNext = await until((n) => __vm.state === 'prologue' && __vm.game.chapter === n, next, 40000);
  ok(`${cut} (Esc) → ${next} scroll`, toNext, JSON.stringify(await state()));
  await P.evaluate(() => __vm.flow.go('title')); await until(() => __vm.state === 'title');
}
// hk4: result → ENDING scroll → end scene → TRIBUTE → title
await result('hk4', true); await cont();
ok('hk4 win → ENDING scroll', await until(() => __vm.state === 'ending'), JSON.stringify(await state()));
await wait(2500); await P.keyboard.press('Escape'); await wait(1400); await P.keyboard.press('Escape');
ok('ENDING (Esc, Esc) → end scene', await until(() => __vm.state === 'cutscene' && window.__cut?.id === 'ending'), JSON.stringify(await state()));
await wait(1500); await P.keyboard.press('Escape');
const trib = await until(() => __vm.state === 'ending' && document.getElementById('ending').classList.contains('tribute'), null, 20000);
ok('end scene (Esc) → TRIBUTE card', trib);
const txt = await P.evaluate(() => document.querySelector('#ending .pl-tribute')?.innerText || '');
ok('TRIBUTE: the fiction line', txt.includes('角色與結局是虛構的') && txt.includes('The characters and this ending are fiction'));
await wait(1500); await P.mouse.click(640, 360);
ok('TRIBUTE (tap) → title', await until(() => __vm.state === 'title', null, 15000));
// losses and free battles: no cutscene
for (const [ch, win, mode] of [['hk1', false, 'story'], ['hk3', false, 'story'], ['hk2', true, 'free']]) {
  await result(ch, win, mode); await wait(1600);
  const acts = await P.evaluate(() => [...document.querySelectorAll('#result .rs-btns button')].map((b) => b.dataset.act));
  ok(`${mode} ${ch} ${win ? 'win' : 'loss'}: no cutscene`, !acts.includes('cut'), acts.join(','));
}
ok('no console errors', !g.errors.length, g.errors.slice(0, 2).join(' | '));
await g.close();
const pass = res.every(Boolean);
console.log(pass ? `CUT FLOW PASS ${res.length}/${res.length}` : `CUT FLOW FAIL ${res.filter(Boolean).length}/${res.length}`);
process.exit(pass ? 0 : 1);
