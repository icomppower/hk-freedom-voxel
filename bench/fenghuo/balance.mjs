// 烽火事件牌 oracle (Node, cold process per battle). Pre-registered gates — exit 1 on any failure:
//   G1 deck      cards.validate() is empty: bounds per stat, buff = only upsides, debuff = only downsides, mixed = both,
//                buff:debuff within 1:1 ± 2
//   G2 draw      10 000 seeds: 1 or 2 distinct cards, every card drawn, each card's share within ±25 % of uniform;
//                same seed → same cards (pure)
//   G3 determinism  the same battle (seed, playable, map, style) in two cold processes → identical final state hash
//   G4 render-only  cards with no sim effect (D01 斷網 minimap, B12 黃色經濟圈 rank) → final hash identical to no card
//   G5 direction    paired runs (6 configs, card vs none, goal out of reach, 2:00 clock): the K.O. pace of every buff
//                   ≥ 0.90 × none, every debuff ≤ 1.10 × none (bot noise band ±10 %), and no card moves it beyond ±40 %
//                   (no card decides the battle by itself); falls (hero down) reported per card
//   G6 winnable     every draw is winnable: 40 seeds × 2 playables at the real goal → the bot wins ≥ 90 %
//   node --import ./bench/harness/register.mjs bench/fenghuo/balance.mjs [--quick]  (quick: G1-G4 only)
import { execFile } from 'node:child_process';
import { cpus } from 'node:os';
import { CARDS, validate, draw } from '../../src/fenghuo/cards.js';

const quick = process.argv.includes('--quick');
const run = (args) => new Promise((ok, no) => execFile(process.execPath, [...process.execArgv, new URL('./run.mjs', import.meta.url).pathname, ...args],
  { encoding: 'utf8', maxBuffer: 1 << 20 }, (e, out) => (e ? no(e) : ok(JSON.parse(out.trim().split('\n').pop())))));
async function pool(jobs, n = Math.max(2, cpus().length)) {
  const out = new Array(jobs.length); let k = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (k < jobs.length) { const i = k++; out[i] = await run(jobs[i]); } }));
  return out;
}
const res = [];
const gate = (id, ok, msg) => { res.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${id}  ${msg}`); };

// G1
const bad = validate();
gate('G1 deck', !bad.length, bad.length ? bad.join('; ') : `${CARDS.length} cards, ${CARDS.filter((c) => c.type === 'buff').length} buff / ${CARDS.filter((c) => c.type === 'debuff').length} debuff / ${CARDS.filter((c) => c.type === 'mixed').length} mixed, all in bounds`);

// G2
const cnt = Object.fromEntries(CARDS.map((c) => [c.id, 0]));
let sizes = [0, 0, 0], pure = true, distinct = true, total = 0;
for (let s = 0; s < 10000; s++) {
  const d = draw(s * 2654435761 >>> 0); sizes[d.length]++; total += d.length;
  if (new Set(d.map((c) => c.id)).size !== d.length) distinct = false;
  for (const c of d) cnt[c.id]++;
  if (s < 200 && draw(s * 2654435761 >>> 0).map((c) => c.id).join() !== d.map((c) => c.id).join()) pure = false;
}
const exp = total / CARDS.length, dev = Math.max(...Object.values(cnt).map((v) => Math.abs(v / exp - 1)));
gate('G2 draw', pure && distinct && !sizes[0] && sizes[1] && sizes[2] && dev <= 0.25, `1 card ${sizes[1]} · 2 cards ${sizes[2]} · max share deviation ${(dev * 100).toFixed(1)} % · pure ${pure} · distinct ${distinct}`);

// G3 + G4
const base = ['--char', 'lungjai', '--chapter', 'hk1', '--style', 'steady', '--seed', '7', '--goal', '99999', '--hash'];
const [a, b, none, d01, b12] = await pool([[...base], [...base], [...base, '--cards', 'none'], [...base, '--cards', 'D01'], [...base, '--cards', 'B12']]);
gate('G3 determinism', a.hash === b.hash, `seed 7 (${a.cards.join('+')}): ${a.hash} = ${b.hash}`);
gate('G4 render-only', d01.hash === none.hash && b12.hash === none.hash, `none ${none.hash} · D01 ${d01.hash} · B12 ${b12.hash}`);

if (!quick) {
  // G5: K.O. pace (K.O. per minute alive) over a 2:00 clock, 6 configs (2 playables × 3 maps / styles), ratio of the
  // summed pace with the card to the summed pace without it. (r1 used one 5:00 run per config and halved the score on a
  // death: a single baseline death skewed every ratio by a third — survival is reported separately now.)
  const CFG = [['lungjai', 'hk1', 'steady'], ['siumei', 'hk4', 'steady'], ['lungjai', 'hk5', 'rush'], ['siumei', 'hk2', 'rush'], ['lungjai', 'hk3', 'steady'], ['siumei', 'hk5', 'steady']];
  const jobs = [];
  for (const [c, ch, st] of CFG) for (const card of ['none', ...CARDS.map((k) => k.id)])
    jobs.push(['--char', c, '--chapter', ch, '--style', st, '--seed', '11', '--goal', '99999', '--time', '120', '--cards', card]);
  const r = await pool(jobs), pace = (x) => x.kos / Math.max(1, x.time) * 60;
  const per = CARDS.length + 1, rows = [];
  let ok5 = true, base = 0, baseDied = 0;
  for (let j = 0; j < CFG.length; j++) { base += pace(r[j * per]); baseDied += r[j * per].died ? 1 : 0; }
  for (let k = 0; k < CARDS.length; k++) {
    let s = 0, died = 0;
    for (let j = 0; j < CFG.length; j++) { const x = r[j * per + 1 + k]; s += pace(x); died += x.died ? 1 : 0; }
    const q = s / base, c = CARDS[k];
    const pass = Math.abs(q - 1) <= 0.4 && (c.type !== 'buff' || q >= 0.9) && (c.type !== 'debuff' || q <= 1.1);
    if (!pass) ok5 = false;
    rows.push(`${c.id} ${c.name.padEnd(6, '　')} ${c.type.padEnd(6)} pace ${q.toFixed(3)}  falls ${died}/${CFG.length}${pass ? '' : '  <-- out of band'}`);
  }
  console.log(`  none: ${(base / CFG.length).toFixed(0)} K.O./min mean, falls ${baseDied}/${CFG.length}`);
  console.log(rows.map((l) => '  ' + l).join('\n'));
  gate('G5 direction', ok5, 'K.O. pace vs no card (6 configs, 2:00): buffs ≥ 0.90, debuffs ≤ 1.10, every card within ±40 %');

  // G6
  const w = [];
  for (let s = 1; s <= 40; s++) for (const c of ['lungjai', 'siumei']) w.push(['--char', c, '--chapter', ['hk1', 'hk2', 'hk3', 'hk4', 'hk5'][s % 5], '--style', s % 2 ? 'steady' : 'rush', '--seed', String(s * 7919)]);
  const rw = await pool(w), wins = rw.filter((x) => x.win), t = wins.map((x) => x.time).sort((p, q) => p - q);
  const lost = rw.filter((x) => !x.win).map((x) => `${x.char}/${x.chapter}/${x.cards.join('+')} ${x.kos} K.O.`);
  gate('G6 winnable', wins.length / rw.length >= 0.9, `bot wins ${wins.length}/${rw.length} at goal 1000 · median clear ${t[t.length >> 1]} s · slowest ${t[t.length - 1]} s${lost.length ? ' · lost: ' + lost.join(', ') : ''}`);
}
const fails = res.filter((x) => !x).length;
console.log(fails ? `FENGHUO GATES: ${fails} FAILED` : `FENGHUO GATES GREEN (${res.length}/${res.length})`);
process.exit(fails ? 1 : 0);
