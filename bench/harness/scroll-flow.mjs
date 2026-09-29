// Scroll player flow gate: result → ending → tribute → title only after a WIN of a chapter with an ENDING; tap advances a
// card, hold 0.8 s skips to the stamp, Esc skips; every card column ≤ 7 characters (new chapters; upstream's ch1 has 8). With no chapter argument it injects a
// throwaway test chapter (ch1's map + three cards) into the registry in the page.
//   node bench/harness/scroll-flow.mjs [chapter-with-ENDING]
import { openGame } from './browser.mjs';
const real = process.argv[2];
const g = await openGame({}), P = g.page, wait = (ms) => P.waitForTimeout(ms);
const st = () => P.evaluate(() => __vm.state), cls = (sel) => P.evaluate((s) => document.querySelector(s)?.className, sel);
const res = [], ok = (name, v, extra = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${name}${extra ? '  ' + extra : ''}`); };
await wait(2500);
const id = await P.evaluate(async (real) => {
  const { CHAPTERS } = await import('/src/story/chapters.js');
  if (real) return real;
  const card = (t) => ({ cols: [t + '一二三', '四五六', '七'], en: 'Test card ' + t, show: ['river'], focus: [800, 450, 1.1] });
  CHAPTERS.zz = { ...CHAPTERS.ch1, id: 'zz', ENDING: [card('甲'), card('乙'), card('丙')],
    ENDING_STAMP: { small: '尾聲', big: '測試', seal: '測', en: 'EPILOGUE · TEST' },
    TRIBUTE: { title: { zh: '致敬', en: 'TRIBUTE' }, zh: ['測試一行。'], en: ['A test line.'], link: { href: 'https://example.org', zh: '連結', en: 'Link' } } };
  return 'zz';
}, real);
// column length rule over every chapter's scrolls
const long = await P.evaluate(async () => {
  const { CHAPTERS } = await import('/src/story/chapters.js'); const bad = [];
  for (const C of Object.values(CHAPTERS)) if (C.id !== 'ch1' && C.id !== 'zz') for (const part of ['PROLOGUE', 'ENDING']) for (const c of C[part] || [])
    for (const v of [c, ...Object.values(c).filter((x) => x && x.cols)]) for (const col of v.cols || []) if ([...col.replace(/\s/g, '')].length > 7) bad.push(`${C.id} ${part}: ${col}`);
  return bad;
});
ok('every scroll column ≤ 7 characters', long.length === 0, long.join(' | '));
const stats = { kos: 1000, time: 600, hpMax: 400, maxChain: 50, dmg: 100, rank: 'A' };
const btn = async (c) => { await P.evaluate((c) => __vm.flow.go('result', c), c); await wait(400); return P.evaluate(() => [...document.querySelectorAll('#result button')].map((b) => b.dataset.act).join(',')); };
ok('ch1 win → continue goes to title (no ending)', (await btn({ mode: 'story', char: 'zhaoyun', chapter: 'ch1', win: true, stats })) === 'title');
ok(`${id} loss → no ending`, !(await btn({ mode: 'story', char: 'zhaoyun', chapter: id, win: false, stats })).includes('ending'));
ok(`${id} win → continue goes to the ending`, (await btn({ mode: 'story', char: 'zhaoyun', chapter: id, win: true, stats })) === 'ending');
await wait(900); await P.keyboard.press('Enter'); await wait(2500);   // (720p: the footer covers the button — critic P1)
ok('ending scroll opens', (await st()) === 'ending');
await wait(1200);
const pip = () => P.evaluate(() => [...document.querySelectorAll('#ending .pl-pips b')].findIndex((b) => b.classList.contains('on')));
const p0 = await pip();
await P.keyboard.down('Enter'); await wait(80); await P.keyboard.up('Enter'); await wait(600);
ok('tap advances one card', (await pip()) === p0 + 1, `${p0} → ${await pip()}`);
await P.keyboard.down('Enter'); await wait(1100); await P.keyboard.up('Enter'); await wait(500);
ok('hold 0.8 s skips to the stamp', (await cls('#ending')).includes('stamped'));
await wait(1200);
await P.keyboard.press('Escape'); await wait(1200);
const T = await P.evaluate(() => !!document.querySelector('#ending .pl-tribute'));
ok('stamp → tribute card', T ? (await cls('#ending')).includes('tribute') : true, T ? '' : '(chapter has no TRIBUTE)');
await wait(1200);
await P.keyboard.press('Escape'); await wait(3000);
ok('tribute → title', (await st()) === 'title');
// prologue Esc path (skip → stamp → battle)
await P.evaluate((id) => __vm.flow.go('prologue', { mode: 'story', char: 'zhaoyun', chapter: id }), 'ch1'); await wait(2000);
await P.keyboard.press('Escape'); await wait(700);
ok('prologue Esc skips to the stamp', (await cls('#prologue')).includes('stamped'));
await wait(1000); await P.keyboard.press('Escape'); await wait(1500);
ok('stamp Esc → battle', (await st()) === 'battle');
console.log(g.errors.length ? 'page errors: ' + g.errors.join(' | ') : 'no page errors');
await g.close();
const pass = res.every(Boolean) && !g.errors.length;
console.log(pass ? `SCROLL FLOW PASS ${res.length}/${res.length}` : `SCROLL FLOW FAIL ${res.filter(Boolean).length}/${res.length}`);
process.exit(pass ? 0 : 1);
