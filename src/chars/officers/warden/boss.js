// 狼督 boss behaviour (chapter-script module for the story director's script hook; the lighthouse-rock fight of Ch. III).
// Phases from his HP fraction (Character Sheets): 1 The Warden (100 → 50 %): calls a wolf squad every 30 s · 2 Lights Out
// (50 → 20 %): the lighthouse goes dark (fx.dark), three ship searchlights sweep the rock and every 8 s one lands and drops
// a squad where it shines · 3 The Last Swing (< 20 %): enraged — his swings come twice as often (the crowd's officer
// cooldown clipped), the glaive shows its crack (crowd view: crackAt). The KO (story `down` beat) is the chapter's.
// Beats fire the banners / lines on `below: ['warden', 0.5 | 0.2]`; this module only runs the fight. fx (render-only
// readers): { phase, dark, beams: [{ x, z, on }] }. Deterministic: timers off the story clock, no RNG of its own.
export function wardenBoss(game, api, { key = 'warden', arena = [0, 0], r = 14, calls = [[0, 0.8]], beamR = 0.75 } = {}) {
  const fx = { phase: 0, dark: false, drops: 0, beams: [0, 1, 2].map(() => ({ x: 0, z: 0, on: false })) };
  let phase = 0, t0 = 0, landK = 0;
  const at = (fx_, fz) => [arena[0] + fx_ * r, arena[1] + fz * r];
  return {
    fx,
    step() {
      const i = api.officer(key);
      if (i < 0 && !api.dead(key)) return;                        // not on the field yet
      const f = api.dead(key) ? 0 : api.frac(key), t = api.t();
      const p = f <= 0 ? 4 : f < 0.2 ? 3 : f < 0.5 ? 2 : 1;
      if (p !== phase) {
        phase = p; fx.phase = p; t0 = t;
        if (p >= 2) fx.dark = true;
        if (p === 4) for (const b of fx.beams) b.on = false;
      }
      const k = t - t0;
      if (phase === 1 && k > 0 && k % 1800 === 0) {               // a squad every 30 s from the rock's edge
        const [cx, cz] = calls[(k / 1800 - 1) % calls.length];
        api.squad({ at: at(cx, cz), n: 10 });
      }
      if (phase === 2 || phase === 3) {                           // searchlights sweep; one lands every 8 s
        fx.beams.forEach((b, j) => {
          const a = t * 0.012 * (j % 2 ? -1 : 1) + j * 2.1, rr = r * (beamR + 0.15 * Math.sin(t * 0.007 + j));
          b.x = arena[0] + Math.sin(a) * rr; b.z = arena[1] + Math.cos(a) * rr; b.on = true;
        });
        if (k > 0 && k % 480 === 0) { const b = fx.beams[landK++ % 3]; api.squad({ at: [b.x, b.z], n: 8 }); fx.drops++; }
      }
      if (phase === 3 && i >= 0) { const c = game.crowd; if (c.cd[i] > 20) c.cd[i] = 20; }   // enraged
    },
  };
}
