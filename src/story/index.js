// Story director (sim): scripts a battle through the crowd's story API and the story:* events. Runs inside step()
// (after the musou), deterministic: timed off its own frame counter, no randomness of its own (the crowd draws from rng).
//   game.story = createStory(game)
//   story.reset({ mode, chapter, char })   battle start (after hero / crowd / combat / musou resets)
//   story.step()                           once per sim step while the battle runs
//   story.stats()                          → { kos, time (s), hp, hpMax, maxChain, dmg, rank?, char } (story:end / result)
//   story.morale                           蜀 share of the HUD morale bar 0-1 (undefined in free mode: HUD falls back)
//   story.target                           {x, z} the HUD objective arrow points at, or null
// Map gates (world/map.js GATES: 'pass' barricade, 'weiCamp' castle gate, 'summit' barricade) are sim state: story mode
// closes all three at reset, a beat's `gate: id` opens one (clampWalk lets everyone through, world.js burns / swings it).
// Emits story:say / story:banner / story:objective / story:gate / story:end (payloads: core/events.js). The flow
// (main.js) leaves the battle for the result screen on story:end; the HUD shows the rest.
// Also owns game.timeScale (wall-clock pace of the fixed-step loop, main.js): 1, except the victory slow-mo.
// Free mode = the endless field: the army, reinforcement waves, the hero's intro line, and no end.
// Story mode: CHAPTERS[chapter] = a beat list (format: header of ./ch1.js), run strictly in order — beat k fires once
// its trigger holds and beat k-1 has fired; a `limit` keeps the hero from running past the stage he is on (DW8's
// barred gates), so the script can't be skipped or soft-locked by running ahead, and going back is always free.
import { emit, on } from '../core/events.js';
import { zone, setGate, GATES, WALL_Z, GATE_X } from '../world/map.js';
import { CHARS } from '../chars/index.js';
import { BEATS as CH1, OFFICERS as CH1_OFF, SPK } from './ch1.js';

const CHAPTERS = { ch1: { beats: CH1, officers: CH1_OFF } };
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Script position P = [zone id, fx, fz] (fractions of the zone's half extents) or ['gate', dx, dz] (metres). */
function pos([id, a, b]) {
  if (id === 'gate') return [GATE_X + a, WALL_Z + b];
  const q = zone(id), hw = q.r ?? q.w / 2, hd = q.r ?? q.d / 2;
  return [q.x + a * hw, q.z + b * hd];
}
const nearZ = (id) => { const q = zone(id); return q.z - (q.r ?? q.d / 2); };

export function createStory(game) {
  const S = { mode: 'free', chapter: null, char: 'zhaoyun', t: 0, done: false, maxChain: 0, downT: -1 };
  const st = { morale: undefined, target: null };
  const DLG_GAP = 24;                            // sim frames between two queued lines

  st.stats = () => {
    const h = game.hero, time = Math.round(S.t / 60);
    const s = { kos: h.kos, time, hp: h.hp, hpMax: h.hpMax, maxChain: S.maxChain, dmg: S.dmg, char: S.char };
    if (S.won >= 0) s.rank = rank(s);
    return s;
  };
  S.end = (win) => { if (!S.done) { S.done = true; game.timeScale = 1; emit('story:end', { win, stats: st.stats() }); } };

  // sim-side listeners (these events fire inside step(), so the bookkeeping stays deterministic)
  on('hero:down', () => { if (S.mode === 'story' && S.won < 0) S.downT = S.t; });
  on('hero:hurt', (e) => { S.dmg += e.dmg; });
  on('ko', (e) => { if (e.officer && S.off) for (const k in S.off) if (S.off[k] === e.i) { S.dead[k] = true; S.off[k] = -1; } });

  // ---- dialogue: one line at a time; lines resolve the speaker (hero / ally / SPK seal) and branch on the hero
  const say = (line) => {
    const pick = line[S.char], zh = pick ? pick[0] : line.zh, en = pick ? pick[1] : line.en;
    const dur = Math.max(210, Math.min(340, 140 + zh.length * 9));
    const e = { zh, en, dur };
    if (line.who === 'ally') { const a = CHARS[S.ally]; Object.assign(e, { speaker: a.name, portrait: a.id, side: 'shu' }); }
    else if (line.who !== 'hero') { const p = SPK[line.who]; Object.assign(e, { speaker: p.name, portrait: { seal: p.seal, side: p.side }, side: p.side }); }
    S.q.push(e);
  };

  // ---- triggers (every key of an object must hold; an array = any one of its objects)
  const officerFrac = (k) => { const i = S.off[k]; return S.dead[k] ? 0 : i >= 0 ? game.crowd.hp[i] / game.crowd.hpMax[i] : 1; };
  const holds = (w) => {
    if (!w) return true;
    if (Array.isArray(w)) return w.some(holds);
    const h = game.hero;
    if (w.wait != null && S.t - S.beatT < w.wait) return false;
    if (w.kos != null && h.kos - S.koBase < w.kos) return false;
    if (w.zone && h.z < nearZ(w.zone)) return false;
    if (w.at && h.z < pos(w.at)[1]) return false;
    if (w.down && !S.dead[w.down]) return false;
    if (w.below && officerFrac(w.below[0]) >= w.below[1]) return false;
    return true;
  };

  function fire(b) {
    const c = game.crowd, h = game.hero, ch = CHAPTERS[S.chapter];
    if (b.win) { S.won = S.t; S.q.length = 0; S.sayUntil = 0; }       // victory: drop pending chatter, its line goes out first
    if (b.retire) c.retire(h.z - 45);                                  // stage change: idle blocks far behind give their slots back
    for (const q of b.squads || []) { const [x, z] = pos(q.at); c.spawnSquad({ x, z, n: q.n, cols: q.cols, charge: !!q.charge }); }
    for (const k in b.officers || {}) {                                // spawned on the next steps (retried while slots are full)
      const o = b.officers[k], d = ch.officers[o.like || k];
      const [x, z] = pos(o.at);
      S.want[k] = { x, z, name: d.name, hp: d.hp, boss: !!d.boss, engaged: !!o.engaged };
      S.off[k] = -1; S.dead[k] = false;
    }
    if (b.waves != null) c.setWaves(b.waves);
    if (b.limit) { S.limit = b.limit.z ? pos(b.limit.z)[1] : Infinity; S.nag = b.limit.nag || null; }
    if (b.heal && !h.dead) h.hp = Math.min(h.hpMax, h.hp + b.heal * h.hpMax);
    if (b.morale != null) S.mBase = b.morale === 1 ? 1 : S.mBase + b.morale;
    if (b.gate) { setGate(b.gate, true); emit('story:gate', { id: b.gate, open: true }); }
    if (b.banner) emit('story:banner', { dur: 150, ...b.banner });
    if (b.hush) S.q.length = 0;                                        // stage cleared: queued taunts are stale now
    if (b.obj) { emit('story:objective', { zh: b.obj.zh, en: b.obj.en }); S.go = b.obj.go; }
    for (const l of b.say || []) say(l);
  }

  st.reset = ({ mode = 'free', chapter = 'ch1', char = 'zhaoyun' } = {}) => {
    Object.assign(S, { mode, chapter, char, ally: char === 'huangzhong' ? 'zhaoyun' : 'huangzhong', t: 0, done: false, maxChain: 0,
      downT: -1, dmg: 0, beat: 0, beatT: 0, koBase: 0, off: {}, want: {}, dead: {}, q: [], sayUntil: 0, limit: Infinity, nag: null,
      nagT: -999, mBase: 0.4, won: -1, go: null });
    game.timeScale = 1;
    st.target = null;
    if (mode === 'story') for (const id in GATES) setGate(id, false);   // spawnPoint() opened them all; the script opens each
    st.morale = mode === 'story' ? 0.4 : undefined;
    if (mode === 'free') game.crowd.spawnArmy();
    // story: the first beat spawns the field on step 1 — after main.js's 'scenario' reset of the HUD, so its objective sticks
  };

  st.step = () => {
    const h = game.hero, c = game.crowd;
    if (S.done) return;
    S.t++;
    if (h.combo > S.maxChain) S.maxChain = h.combo;
    if (S.mode === 'free') { if (game.frame === 185) emit('story:say', { ...h.char.lines.intro, dur: 300 }); return; }   // the hero's opening line

    // victory: slow-mo on the killing blow (0.3× for ~5 s of wall time, eased back), the hero untouchable, then results
    if (S.won >= 0) {
      const k = S.t - S.won;
      game.timeScale = k < 90 ? 0.3 : Math.min(1, 0.3 + (k - 90) / 60 * 0.7);
      h.iframes = Math.max(h.iframes, 2);
      if (k >= 300) S.end(true);
    } else if (S.downT >= 0) { if (S.t - S.downT >= 120) S.end(false); return; }     // 2 s on the ground, then defeat

    const beats = CHAPTERS[S.chapter].beats;
    while (S.beat < beats.length) {
      const b = beats[S.beat];
      if (b.skip && holds(b.skip)) { S.beat++; continue; }
      if (!holds(b.when)) break;
      S.beat++; S.beatT = S.t; S.koBase = h.kos;
      fire(b);
      if (b.win) break;
    }

    // officers the script asked for: spawn as soon as a slot is free (a KO'd officer frees his slot after crowd deadTime)
    for (const k in S.want) {
      const i = c.spawnOfficer(S.want[k]);
      if (i >= 0) { S.off[k] = i; delete S.want[k]; }
    }

    // stage gate: the hero can't run past the stage he is on (a nag line explains, at most every 10 s)
    if (h.z > S.limit) {
      h.z = S.limit; if (h.vz > 0) h.vz = 0;
      if (S.nag && S.t - S.nagT > 600 && !S.q.length && S.t >= S.sayUntil) { S.nagT = S.t; say(S.nag); }
    }

    // dialogue queue
    if (S.q.length && S.t >= S.sayUntil) { const e = S.q.shift(); emit('story:say', e); S.sayUntil = S.t + e.dur + DLG_GAP; }

    // HUD reads: objective arrow target, morale (stage morale + a little per KO, eased)
    const g = S.go;
    if (typeof g === 'string') { const i = S.off[g]; st.target = i >= 0 ? { x: c.x[i], z: c.z[i] } : S.want[g] ? { x: S.want[g].x, z: S.want[g].z } : null; }
    else if (g) { const [x, z] = pos(g); st.target = { x, z }; }
    else st.target = null;
    const m = S.mBase >= 1 ? 1 : clamp01(S.mBase + h.kos * 0.0004);
    st.morale += (Math.min(0.95, Math.max(0.08, m)) - st.morale) * 0.03;
  };

  /** DW-style rank from KOs, clear time and damage taken: 3 points each, S ≥ 8, A ≥ 6, B ≥ 4, else C. */
  function rank({ kos, time, dmg, hpMax }) {
    const p = (kos >= 2000 ? 3 : kos >= 1200 ? 2 : kos >= 600 ? 1 : 0) + (time <= 540 ? 3 : time <= 720 ? 2 : time <= 900 ? 1 : 0) +
      (dmg <= hpMax * 0.35 ? 3 : dmg <= hpMax * 0.7 ? 2 : dmg <= hpMax * 1.1 ? 1 : 0);
    return p >= 8 ? 'S' : p >= 6 ? 'A' : p >= 4 ? 'B' : 'C';
  }
  return st;
}
