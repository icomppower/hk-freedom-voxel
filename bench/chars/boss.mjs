// Boss gate (stage 4): a test chapter on the 定軍山 map — 狼督 (hp 2340, model 'warden') spawned on the Shu camp square,
// fought by the bot as 阿角 — must pass phase 2 at < 50 % and phase 3 at < 20 % (fx.phase flips on the frame his HP crosses,
// banners on the same frame), drop searchlight squads in phase 2, and end on his KO (win, glaive broken: slot's model key).
//   node --import ./bench/harness/register.mjs bench/chars/boss.mjs [char]
import { createSim } from '../harness/sim.mjs';
import { CHAPTERS } from '../../src/story/chapters.js';
import { wardenBoss } from '../../src/chars/officers/warden/boss.js';
import { createBot } from '../bot/bot.mjs';
import { on } from '../../src/core/events.js';

const char = process.argv[2] || 'gok';
const C1 = CHAPTERS.ch1;
CHAPTERS.bosstest = { ...C1, id: 'bosstest', cast: ['gok', 'siume'], skin: { foe: 'wolf', ally: 'sheep' },
  OFF: { warden: { name: { zh: '狼督', en: 'WARDEN-WOLF' }, hp: 2340, boss: true, model: 'warden' } },
  BEATS: [
    { when: { wait: 30 }, officers: { warden: { at: ['honjin', 0, 0.85], engaged: true } }, obj: { zh: '擊破狼督', en: 'Defeat the Warden-Wolf', go: 'warden' } },
    { when: { below: ['warden', 0.5] }, skip: { down: 'warden' }, banner: { html: '<em>燈塔</em>熄滅', en: 'The lighthouse goes dark' } },
    { when: { below: ['warden', 0.2] }, skip: { down: 'warden' }, banner: { html: '狼督 <em>暴怒</em>', en: 'The Warden-Wolf rages' } },
    { when: { down: 'warden' }, win: true, banner: { html: '狼督 <em>刀斷</em>', en: 'The Warden-Wolf\'s glaive breaks', big: true } },
  ],
  script: (g, api) => wardenBoss(g, api, { arena: [0, -132], r: 12, calls: [[-0.8, 0.6], [0.8, 0.6]] }),
};
const sim = await createSim({ enemies: 300 }), G = sim.game;
const log = [], banners = [];
on('story:banner', (e) => banners.push([G.frame, e.en]));
sim.start({ char, mode: 'story', chapter: 'bosstest' });
const bot = createBot(), fx = () => G.story.fx;
let phase = 0, squads = 0, slot = -1, frac = 1;
const cs = G.crowd;
let sqN = 0;
while (!sim.end && G.frame < 20 * 3600) {
  sim.step(bot(G));
  const s = G.story;
  for (let i = cs.grunts; i < cs.N; i++) if (s.modelOf(i) === 'warden') slot = i;
  if (slot >= 0 && cs.st[slot] && cs.hpMax[slot]) frac = Math.max(0, cs.hp[slot] / cs.hpMax[slot]);
  if (fx() && fx().phase !== phase) { phase = fx().phase; log.push([G.frame, phase, frac]); }
  if (fx()) squads = fx().drops;
}
const res = [], ok = (n, v, x = '') => { res.push(v); console.log(`${v ? 'ok  ' : 'FAIL'} ${n}${x ? '  ' + x : ''}`); };
const p2 = log.find(([, p]) => p === 2), p3 = log.find(([, p]) => p === 3);
ok('phase 2 at < 50 % HP', !!p2 && p2[2] < 0.5 && p2[2] > 0.35, p2 && `frame ${p2[0]}, HP ${(p2[2] * 100).toFixed(1)} %`);
ok('phase 3 at < 20 % HP', !!p3 && p3[2] < 0.2 && p3[2] > 0.05, p3 && `frame ${p3[0]}, HP ${(p3[2] * 100).toFixed(1)} %`);
const b2 = banners.find(([, e]) => e.includes('lighthouse')), b3 = banners.find(([, e]) => e.includes('rages'));
ok('banners on the phase frames', !!(b2 && b3 && Math.abs(b2[0] - p2[0]) <= 1 && Math.abs(b3[0] - p3[0]) <= 1), `${b2?.[0]} / ${b3?.[0]}`);
ok('searchlight squads drop in phases 2–3', squads >= 1, `${squads} squads`);
ok('KO ends the fight (win)', !!(sim.end && sim.end.win), `${(G.frame / 60).toFixed(0)} s, KOs ${G.hero.kos}`);
ok('the KO\'d slot keeps the warden model (glaive broken, kneels)', slot >= 0 && G.story.modelOf(slot) === 'warden');
console.log(res.every(Boolean) ? `BOSS PASS ${res.length}/${res.length}` : 'BOSS FAIL');
process.exit(res.every(Boolean) ? 0 : 1);
