// Offline 2P run (no network): both heroes on bot autoplay in one Node sim, a chapter to the end. Reports the result,
// the 2P rule events and the officer / boss HP scaling (asserted: boss = base × 1.6, officer = base × 1.3).
//   node --import ./bench/harness/register.mjs bench/net/duo.mjs [chapter] [seed]
import { createCoopGame } from './simkit.mjs';
const { CROWD } = await import('../../src/crowd/crowd.js');
const { CHAPTERS } = await import('../../src/story/chapters.js');
const chapter = process.argv[2] || 'hk1', seed = +(process.argv[3] || 1);
const g = createCoopGame(), G = g.game;
g.start({ chars: ['lungjai', 'siumei'], chapter, seed });
const OFF = CHAPTERS[chapter].OFF, scale = [];
const seen = new Set();
const t0 = performance.now();
while (!g.end && G.frame < 30 * 3600) {
  g.step([null, null]);
  const c = G.crowd;
  for (let i = c.grunts; i < c.N; i++) if (c.st[i] && !seen.has(i + ':' + c.hpMax[i]) && c.offName[i - c.grunts]) {
    seen.add(i + ':' + c.hpMax[i]);
    const d = Object.values(OFF).find((o) => o.name === c.offName[i - c.grunts]);
    if (!d) continue;
    const want = (d.hp ?? CROWD.officerHp) * (d.boss ? 1.6 : 1.3) * G.diff.officerHp;
    scale.push({ name: d.name.en, boss: !!d.boss, hpMax: c.hpMax[i], want, ok: Math.abs(c.hpMax[i] - want) < 1e-9 });
  }
}
const mmss = (f) => `${Math.floor(f / 3600)}:${String(Math.floor(f / 60) % 60).padStart(2, '0')}`;
const ev = {}; for (const [, n] of g.events) ev[n] = (ev[n] || 0) + 1;
const bad = scale.filter((s) => !s.ok);
console.log(`${g.end ? (g.end.win ? 'WIN' : 'LOSS') : 'TIMEOUT'} ${chapter} 2P bots seed ${seed}: ${mmss(G.frame)} sim (${((performance.now() - t0) / 1000).toFixed(1)} s wall) · KOs ${G.heroes.map((h) => h.kos).join(' + ')} · hp ${G.heroes.map((h) => Math.round(h.hp)).join(' / ')} · events ${JSON.stringify(ev)} · final ${g.hash()}`);
console.log(`team musou: ${JSON.stringify(G.coop.team.log)}`);
console.log(`scaling ${scale.length - bad.length}/${scale.length} ok: ${scale.map((s) => `${s.name}${s.boss ? '(boss)' : ''} ${s.hpMax}`).join(', ')}`);
process.exit(g.end?.win && !bad.length && scale.some((s) => s.boss) ? 0 : 1);
