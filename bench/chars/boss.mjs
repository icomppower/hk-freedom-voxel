// Boss gate (stage 4): for each boss (777 stamp, 比卡超 shocker, 強哥 fixer, 維尼熊 bear) a test chapter on the 定軍山 map
// with the `riot` / `white` skins — the boss spawned on the Shu camp square (Character Sheets HP, officer model), run by its
// chapter-script module (src/chars/officers/hk/bosses.js), fought by the bot as the given playable. Gates per boss: every
// phase fires at its HP threshold (the HP on the phase's first frame within −0.5 % … 0 of it), its phase banner on that
// frame, the phase's behaviour happens (stamp: slams in P3 · shocker: shock rings in P2, 速龍 called in P3 · fixer: chilli
// clouds in P2, bottles in P3 · bear: 3 分身 in P2, lights out in P3, mask off in P4), the KO wins, the KO'd slot keeps
// its model (kneels, broken weapon).
//   node --import ./bench/harness/register.mjs bench/chars/boss.mjs [char] [boss…]
import { createSim } from '../harness/sim.mjs';
import { CHAPTERS } from '../../src/story/chapters.js';
import { bossScript, BOSS_PHASES } from '../../src/chars/officers/hk/bosses.js';
import { createBot } from '../bot/bot.mjs';
import { on } from '../../src/core/events.js';

const [char = 'lungjai', ...only] = process.argv.slice(2);
const C1 = CHAPTERS.ch1;
const HP = { stamp: 1300, shocker: 1560, fixer: 1300, bear: 2340, gascap: 1500 };
const NAME = { stamp: ['777', 'THE RUBBER STAMP'], shocker: ['比卡超', 'THE SHOCKER'], fixer: ['強哥', 'THE FIXER'], bear: ['維尼熊', 'THE BEAR'], gascap: ['煙霧隊長', 'THE GAS CAPTAIN'] };
const kinds = only.length ? only : ['stamp', 'shocker', 'fixer', 'bear', 'gascap'];
const sim = await createSim({ enemies: 300 }), G = sim.game;
const banners = [];
on('story:banner', (e) => banners.push([G.frame, e.en]));
let bad = 0;
for (const kind of kinds) {
  const TH = BOSS_PHASES[kind], on_ = {};
  TH.forEach((_, k) => { on_[k + 2] = { banner: { html: `phase ${k + 2}`, en: `${kind} phase ${k + 2}` } }; });
  CHAPTERS.bosstest = { ...C1, id: 'bosstest', cast: ['lungjai', 'siumei'], skin: { foe: kind === 'fixer' ? 'white' : 'riot', ally: 'blackbloc' },
    OFF: { [kind]: { name: { zh: NAME[kind][0], en: NAME[kind][1] }, hp: HP[kind], boss: true, model: kind },
      raptor: { name: { zh: '速龍', en: 'RAPTOR' }, hp: 520, model: 'raptor' }, clone: { name: { zh: '分身', en: 'SHADOW CLONE' }, hp: 160, model: 'clone' } },
    BEATS: [
      { when: { wait: 30 }, officers: { [kind]: { at: ['honjin', 0, 0.85], engaged: true } }, obj: { zh: '擊破', en: 'Defeat the boss', go: kind } },
      { when: { down: kind }, win: true, banner: { html: '擊破', en: `${kind} down`, big: true } },
    ],
    script: bossScript(kind, { calls: [[-6, -125], [6, -125]], on: on_ }),
  };
  banners.length = 0;
  sim.start({ char, mode: 'story', chapter: 'bosstest' });
  const bot = createBot(), cs = G.crowd, log = [];
  let phase = 0, slot = -1, clones = 0, raptors = 0, dark = false, unmasked = false, slams = 0, shocks = 0, chilli = 0, bottles = 0, cans = 0;
  const seen = new Set();
  while (!sim.end && G.frame < 30 * 3600) {
    sim.step(bot(G));
    const s = G.story, fx = s.fx;
    for (let i = cs.grunts; i < cs.N; i++) if (cs.st[i]) {
      const m = s.modelOf(i);
      if (m === kind || (kind === 'bear' && m === 'bear_unmasked')) slot = i;
      if ((m === 'clone' || m === 'raptor') && !seen.has(i + m)) { seen.add(i + m); if (m === 'clone') clones++; else raptors++; }
    }
    if (fx.phase !== phase && fx.phase < 9) { phase = fx.phase; log.push([G.frame, phase, cs.hp[slot] / cs.hpMax[slot]]); }
    if (fx.dark) dark = true;
    for (const q of fx.cans || []) { const id = 'can' + q.t + q.x.toFixed(2); if (!seen.has(id)) { seen.add(id); cans++; } }
    if (slot >= 0 && s.modelOf(slot) === 'bear_unmasked') unmasked = true;
    for (const r of fx.rings) { const id = r.kind + r.t + r.x.toFixed(2); if (!seen.has(id)) { seen.add(id); if (r.kind === 'slam') slams++; if (r.kind === 'shock') shocks++; if (r.kind === 'chilli') chilli++; if (r.kind === 'bottle') bottles++; } }
  }
  const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${kind.padEnd(7)} ${n}${x ? '  ' + x : ''}`); };
  TH.forEach((thr, k) => {
    const e = log.find(([, p]) => p === k + 2), bn = banners.find(([, t]) => t === `${kind} phase ${k + 2}`);
    ok(`phase ${k + 2} at ${thr * 100} % (±0.5)`, !!e && e[2] <= thr && e[2] >= thr - 0.005, e ? `frame ${e[0]}, HP ${(e[2] * 100).toFixed(2)} %` : 'never');
    ok(`phase ${k + 2} banner on its frame`, !!(e && bn && Math.abs(bn[0] - e[0]) <= 1), `${bn?.[0]} vs ${e?.[0]}`);
  });
  if (kind === 'stamp') ok('P3 ground-pound slams', slams >= 3, `${slams}`);
  if (kind === 'shocker') { ok('P2 shock rings', shocks >= 1, `${shocks}`); ok('P3 calls 速龍', raptors >= 1, `${raptors} raptor officers`); }
  if (kind === 'fixer') { ok('P2 chilli clouds', chilli >= 1, `${chilli}`); ok('P3 bottle volleys', bottles >= 5, `${bottles}`); }
  if (kind === 'gascap') { ok('P2 canister fans (3 a fan)', cans >= 3 && cans % 3 === 0, `${cans}`); ok('P3 calls 速龍', raptors >= 1, `${raptors} raptor officers`); }
  if (kind === 'bear') { ok('P2 three 分身', clones === 3, `${clones}`); ok('P3 lights out', dark); ok('P4 mask off', unmasked); }
  ok('KO ends the fight (win)', !!(sim.end && sim.end.win), `${(G.frame / 60).toFixed(0)} s, hero hp ${G.hero.hp}`);
  ok('KO\'d slot keeps its model (kneels, broken weapon)', slot >= 0 && [kind, 'bear_unmasked'].includes(G.story.modelOf(slot)));
  if (!res.every(Boolean)) bad++;
}
console.log(bad ? `BOSS FAIL (${bad} boss${bad > 1 ? 'es' : ''})` : `BOSS PASS ${kinds.length}/${kinds.length} as ${char}`);
process.exit(bad ? 1 : 0);
