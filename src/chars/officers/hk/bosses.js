// Boss behaviours of 香港自由戰士 (chapter-script modules for the story director's script hook). Phases from the boss's HP
// fraction (Character Sheets 角色設定, from the Phaser GDD). The chapter's beats fire the banners / roars on
// `below: [key, threshold]`; these modules run the fight. Deterministic: timers off the story clock, sim rng only.
// Phase floor: on the step a hit carries the boss across a threshold his HP is held at (threshold − 0.2 %) — one strong
// Musou can't skip a phase, and every phase starts at its threshold (the stage-4 gate: ±0.5 %).
// Area attacks hurt the hero directly (hero.hurt: i-frames, dodge and Musou still protect him).
// fx (render-only readers, the chapter views): { phase, dark, rings: [{x, z, r, t, kind}], clouds, drops }.
//   stamp  777 The Rubber Stamp   P1 100–60 % overhead stamps · P2 60–25 % shoulder-bash lunges · P3 25–0 % ground-pound
//                                 berserk (3 slams, 4 m ring)
//   shocker 比卡超 The Shocker     P1 hook + shield charge · P2 < 50 % shock-wave ring · P3 < 25 % calls 速龍 squads
//   fixer  強哥 The Fixer          P1 cane sweeps · P2 < 50 % chilli-powder throw (cloud, flinch) · P3 < 25 % bottle volleys
//   bear   維尼熊 The Bear         P1 100–75 % triple stab · P2 75–50 % 分身 ×3 · P3 50–25 % lights out · P4 25–0 % mask
//                                 off, enraged (faster, leap slams)
//   commander 速龍指揮官 Raptor     P1 baton + shield charges · P2 < 50 % pepper-ball volleys (four impacts round the hero,
//             Commander (8·12)     staggered) · P3 < 25 % calls two 速龍 + squads, charges twice as often
import { clampWalk } from '../../../world/map.js';
import { ST } from '../../../crowd/crowd.js';

export const BOSS_PHASES = {
  stamp: [0.6, 0.25], shocker: [0.5, 0.25], fixer: [0.5, 0.25], bear: [0.75, 0.5, 0.25], commander: [0.5, 0.25],
};

/** script(game, api) for boss `kind` spawned under officer key `key` (OFF entry). opts: calls [[x, z], …] spawn spots for
 *  the Shocker's 速龍 call, clone: OFF key the Bear's 分身 use, on: { phase: partial beat } (banner / say on entering it). */
export function bossScript(kind, { key = kind, calls = [], clone = 'clone', on = {} } = {}) {
  return (game, api) => {
    const TH = BOSS_PHASES[kind], fx = { phase: 0, dark: false, rings: [], clouds: [], drops: [], kind };
    const h = game.hero, c = game.crowd;
    let phase = 0, t0 = 0, lunge = null, timers = {}, slam = null;
    /** Attack timer: true once `first` frames into the phase, then every `every` frames — the first step it's due while
     *  the boss is standing (a staggered boss attacks as soon as he recovers, never skips a beat). */
    const due = (name, k, first, every) => { const n = timers[name] ?? first; if (k < n) return false; timers[name] = n + every; return true; };
    const dist = (i) => Math.hypot(h.x - c.x[i], h.z - c.z[i]);
    const hurtIn = (x, z, r, dmg) => { if (h.y < 0.4 && Math.hypot(h.x - x, h.z - z) < r) h.hurt(Math.round(dmg * game.diff.dmg), x, z, true); };
    const ring = (x, z, r, kind_) => fx.rings.push({ x, z, r, t: api.t(), kind: kind_ });
    const standing = (i) => c.st[i] !== ST.DEAD && c.st[i] !== ST.OFF && c.st[i] < ST.HURT;
    /** Move the boss toward (tx, tz) over n frames (a lunge / leap), then run `hit` at the end. */
    const go = (i, tx, tz, n, hit) => { lunge = { i, x0: c.x[i], z0: c.z[i], tx, tz, k: 0, n, hit }; };

    return {
      fx,
      step() {
        const i = api.officer(key);
        if (i < 0 && !api.dead(key)) return;                         // not on the field yet
        fx.rings = fx.rings.filter((r) => api.t() - r.t < 60);
        if (api.dead(key)) { if (phase < 9) { phase = 9; fx.phase = 9; lunge = null; } return; }
        // phase floor + phase changes
        let f = c.hp[i] / c.hpMax[i];
        const p = 1 + TH.filter((x) => f < x).length;
        if (p > phase + 1 && phase > 0) {                           // one hit skipped a threshold: hold at the first one
          c.hp[i] = Math.max(c.hp[i], (TH[phase - 1] - 0.002) * c.hpMax[i]); f = c.hp[i] / c.hpMax[i];
        }
        const np = 1 + TH.filter((x) => f < x).length;
        if (np !== phase) {
          if (phase > 0) { const thr = TH[np - 2]; if (f < thr - 0.004) { c.hp[i] = (thr - 0.002) * c.hpMax[i]; f = c.hp[i] / c.hpMax[i]; } }
          phase = np; fx.phase = np; t0 = api.t(); fx.at = f; timers = {}; enter(np, i);
          if (on[np]) api.fire(on[np]);
        }
        const k = api.t() - t0;
        if (lunge) {                                                  // a scripted lunge / leap in progress
          const L = lunge, u = ++L.k / L.n, e = u * (2 - u);
          [c.x[L.i], c.z[L.i]] = clampWalk(L.x0 + (L.tx - L.x0) * e, L.z0 + (L.tz - L.z0) * e, 0.3); c.vx[L.i] = c.vz[L.i] = 0;
          if (L.k >= L.n) { lunge = null; L.hit?.(); }
        }
        run(phase, k, i);
      },
    };

    function enter(p, i) {
      if (kind === 'bear') {
        if (p === 2) for (const [n, [dx, dz]] of [[1, [-2.5, 1]], [2, [2.5, 1]], [3, [0, -2.5]]].map(([n, d]) => [n, d]))
          api.fire({ officers: { ['clone' + n]: { like: clone, at: [c.x[i] + dx, c.z[i] + dz], engaged: true } } });
        if (p >= 3) fx.dark = true;
        if (p === 4) api.model(key, 'bear_unmasked');
      }
      if ((kind === 'shocker' || kind === 'commander') && p === 3) {
        calls.forEach(([x, z], n) => { api.squad({ at: [x, z], n: 8 }); api.fire({ officers: { ['raptor' + (n + 1)]: { like: 'raptor', at: [x, z], engaged: true } } }); });
      }
    }

    function run(p, k, i) {
      // timed hazards resolve even while he is staggered (the powder / bottles are already in the air)
      for (const cl of fx.clouds) if (api.t() === cl.t) { hurtIn(cl.x, cl.z, cl.r, 6); ring(cl.x, cl.z, cl.r, 'chilli'); }
      fx.clouds = fx.clouds.filter((cl) => api.t() - cl.t < 150);
      for (const q of fx.drops) if (api.t() === q.t) { hurtIn(q.x, q.z, 1.1, 8); ring(q.x, q.z, 1.1, q.kind || 'bottle'); }
      fx.drops = fx.drops.filter((q) => api.t() - q.t < 30);
      const sr = fx.rings.find((q) => q.kind === 'shock');             // the shock ring: a band sweeping out 1 → 6 m over 40 f
      if (sr) { const e = api.t() - sr.t, R = 1 + 5 * e / 40; if (e <= 40 && Math.abs(Math.hypot(h.x - sr.x, h.z - sr.z) - R) < 0.6) hurtIn(sr.x, sr.z, 99, 10); }
      if (slam) { if (api.t() >= slam.at) { hurtIn(c.x[i], c.z[i], 4, 16); ring(c.x[i], c.z[i], 4, 'slam'); slam = --slam.n > 0 ? { ...slam, at: slam.at + 22 } : null; } }
      // berserk / thrown attacks ignore stagger (super armour): 777's P3 slams, 強哥's P3 bottles
      if (kind === 'stamp' && p === 3 && !slam && due('slam', k, 20, 240)) slam = { at: api.t(), n: 3 };   // three slams 22 f apart, 4 m
      if (kind === 'fixer' && p === 3 && due('bottles', k, 30, 240)) {  // bottle volley: five round the hero, landing staggered
        for (let n = 0; n < 5; n++) { const a = n * 1.2566 + k * 0.01; fx.drops.push({ x: h.x + Math.sin(a) * (n ? 1.6 : 0), z: h.z + Math.cos(a) * (n ? 1.6 : 0), t: api.t() + 24 + n * 6, x0: c.x[i], z0: c.z[i] }); }
      }
      if (kind === 'commander' && p >= 2 && due('pepper', k, 40, 260)) {   // pepper-ball volley: four impacts round the hero
        for (let n = 0; n < 4; n++) { const a = n * 1.5708 + k * 0.013; fx.drops.push({ x: h.x + Math.sin(a) * (n ? 1.4 : 0), z: h.z + Math.cos(a) * (n ? 1.4 : 0), t: api.t() + 20 + n * 5, x0: c.x[i], z0: c.z[i], kind: 'pepper' }); }
      }
      if (!standing(i) || lunge) return;
      const d = dist(i), ang = Math.atan2(h.x - c.x[i], h.z - c.z[i]);
      const toward = (m) => [c.x[i] + Math.sin(ang) * Math.min(m, Math.max(0, d - 1.2)), c.z[i] + Math.cos(ang) * Math.min(m, Math.max(0, d - 1.2))];
      if (kind === 'stamp') {
        if (p === 2 && d < 9 && due('bash', k, 90, 180)) { const [x, z] = toward(4.5); go(i, x, z, 14, () => { hurtIn(c.x[i], c.z[i], 1.6, 20); ring(c.x[i], c.z[i], 1.6, 'bash'); }); }
        if (p === 3 && c.cd[i] > 30) c.cd[i] = 30;
      } else if (kind === 'shocker') {
        if (d < 10 && d > 2 && due('charge', k, 120, 240)) { const [x, z] = toward(5); go(i, x, z, 16, () => { hurtIn(c.x[i], c.z[i], 1.8, 14); ring(c.x[i], c.z[i], 1.8, 'bash'); }); }
        if (p >= 2 && due('shock', k, 60, 300)) ring(c.x[i], c.z[i], 6, 'shock');
      } else if (kind === 'commander') {
        if (d < 10 && d > 2 && due('charge', k, 100, p === 3 ? 120 : 240)) { const [x, z] = toward(5); go(i, x, z, 16, () => { hurtIn(c.x[i], c.z[i], 1.8, 14); ring(c.x[i], c.z[i], 1.8, 'bash'); }); }
      } else if (kind === 'fixer') {
        if (p >= 2 && d < 14 && due('chilli', k, 90, 300)) fx.clouds.push({ x: h.x, z: h.z, t: api.t() + 30, r: 2.4 });   // lands 30 f later
      } else if (kind === 'bear') {
        if (p === 1 && c.cd[i] > 40) c.cd[i] = 40;                    // quick triple-stab rhythm
        if (p === 4) {
          if (c.cd[i] > 24) c.cd[i] = 24;                             // enraged
          if (d < 12 && d > 2 && due('leap', k, 80, 200)) { const [x, z] = toward(8); go(i, x, z, 20, () => { hurtIn(c.x[i], c.z[i], 3.2, 22); ring(c.x[i], c.z[i], 3.2, 'slam'); }); }
        }
      }
    }
  };
}
