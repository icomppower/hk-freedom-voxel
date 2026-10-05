// Story director (sim): scripts a battle through the crowd's story API and the story:* events. Runs inside step()
// (after the musou), deterministic: timed off its own frame counter, no randomness of its own (the crowd draws from rng).
//   game.story = createStory(game)
//   story.reset({ mode, char })            battle start (after hero / crowd / combat / musou resets)
//   story.step()                           once per sim step while the battle runs
//   story.stats()                          → { kos, time (s), hpMax, maxChain, dmg, rank? } (story:end / result)
//   story.morale                           蜀 share of the HUD morale bar 0-1 (undefined in free mode: HUD falls back)
//   story.target                           {x, z} the HUD objective arrow points at, or null
//   story.chapter                          the active chapter (story/chapters.js), set by reset
//   story.modelOf(i)                       officer model key of crowd slot i (its OFF entry's `model`), or null (crowd view)
//   story.fx                               the chapter script's render state (searchlights, lanterns…), or null
// Chapter scripts (hook): a chapter may give `script(game, api)` → { step(), cue?(name), fx? } — created at reset, stepped
// once per story step after the beats (sim, deterministic), for set pieces the beat list can't express (boss phases,
// searchlights, escorts). api: t(), frac(key) officer HP fraction, officer(key) crowd slot, dead(key), pos(P) → [x, z],
// squad({ at: P | [x, z], n, charge, cols }), say(line), banner(b), objective(o), flag(name[, v]) (beats wait on
// `when: { flag }`); a beat's `set: name` raises a flag, `cue: name` calls script.cue(name).
// (hook, 香港自由戰士 stage 4) fire(beat): run a partial beat now (officers / squads / banner / say — a boss calling his
// 分身 or a 速龍 squad mid-fight); model(key, modelKey): the officer's model key from here on (render-only: the Bear's
// mask comes off).
// Map gates (world/map.js GATES: 'pass' barricade, 'weiCamp' castle gate, 'summit' barricade) are sim state: story mode
// closes all three at reset, a beat's `gate: id` opens one (clampWalk lets everyone through, world.js burns / swings it).
// Emits story:say / story:banner / story:objective / story:end (payloads: core/events.js). The flow
// (main.js) leaves the battle for the result screen on story:end; the HUD shows the rest.
// Also owns game.timeScale (wall-clock pace of the fixed-step loop, main.js): 1, except the victory slow-mo.
// Free mode = the endless field: the army, reinforcement waves, the hero's intro line, and no end.
// Both modes field live Shu allies (crowd.spawnAllies; columns via crowd.setAllies): story — the van drawn up either side
// of the road inside the 本陣 gate, holding rank until the hero marches past; free — a block behind him.
// Morale also moves with the duels (Wei grunts the allies KO'd minus allies lost).
// Story mode: the active chapter's BEATS (chapters.js registry; format: header of ./ch1.js), run strictly in order — beat k fires once
// its trigger holds and beat k-1 has fired; a `limit` keeps the hero from running past the stage he is on (DW8's
// barred gates), so the script can't be skipped or soft-locked by running ahead, and going back is always free.
import { emit, on } from '../core/events.js';
import { zone, setGate, GATES, WALL_Z, GATE_X, MAP } from '../world/map.js';
import { CHARS } from '../chars/index.js';
import { resolveChapter } from './chapters.js';
import { CROWD } from '../crowd/crowd.js';

let BEATS, OFF, SPK;                            // the active chapter's script (story.reset)

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Script position P = [zone id, fx, fz] (fractions of the zone's half extents) or ['gate', dx, dz] (metres). */
function pos([id, a, b]) {
  if (typeof id === 'number') return [id, a];                     // a plain [x, z] (chapter scripts)
  if (id === 'gate' && !zone('gate')) return [GATE_X + a, WALL_Z + b];
  const q = zone(id), hw = q.r ?? q.w / 2, hd = q.r ?? q.d / 2;
  return [q.x + a * hw, q.z + b * hd];
}
const nearZ = (id) => { const q = zone(id); return q.z - (q.r ?? q.d / 2); };

export function createStory(game) {
  const S = { mode: 'free', char: 'zhaoyun', t: 0, done: false, maxChain: 0, downT: -1 };
  // co-op (src/net/coopsim.js: game.heroes, 2 heroes): triggers take the furthest hero / the pair's KOs, the stage bound
  // and the victory i-frames / heals hold for both, a single hero down is not a defeat (2P revive rules), officers and
  // bosses get more HP. Solo (no list) is the single-hero code below, unchanged.
  const duo = () => (game.heroes && game.heroes.length > 1 ? game.heroes : null);
  const kosOf = (h) => { const D = duo(); if (!D) return h.kos; let k = 0; for (const x of D) k += x.kos; return k; };
  const zOf = (h) => { const D = duo(); if (!D) return h.z; let z = -Infinity; for (const x of D) if (x.z > z) z = x.z; return z; };
  const st = { morale: undefined, target: null };
  const DLG_GAP = 12;                            // sim frames between two queued lines

  st.modelOf = (i) => S.slotModel[i] || null;

  st.stats = () => {
    const h = game.hero, time = Math.round(S.t / 60);
    const s = { kos: kosOf(h), time, hpMax: h.hpMax, maxChain: S.maxChain, dmg: S.dmg };
    if (S.won >= 0) s.rank = rank(s);
    return s;
  };
  S.end = (win) => { if (!S.done) { S.done = true; game.timeScale = 1; emit('story:end', { win, stats: st.stats() }); } };

  // sim-side listeners (these events fire inside step(), so the bookkeeping stays deterministic)
  on('hero:down', () => { if (S.mode === 'story' && S.won < 0 && !duo()) S.downT = S.t; });
  on('hero:hurt', (e) => { S.dmg += e.dmg; });
  on('ko', (e) => { if (e.officer && S.off) for (const k in S.off) if (S.off[k] === e.i) { S.dead[k] = true; S.off[k] = -1; } });

  // ---- dialogue: one line at a time; lines resolve the speaker (hero / ally / SPK seal) and branch on the hero
  const say = (line) => {
    // a hero the line has no branch for (an officer playing outside his chapter's cast): the first branch
    const pick = line[S.char] || (line.zh == null ? Object.values(line).find(Array.isArray) : null);
    const zh = pick ? pick[0] : line.zh, en = pick ? pick[1] : line.en;
    const dur = Math.max(160, Math.min(270, 100 + zh.length * 8));   // ≈ 2.7-4.5 s: DW8 pace, taunts don't queue behind a briefing
    const e = { zh, en, dur };
    let who = line.who;                                              // a playable id speaks as the hero or the ally
    if (CHARS[who] && !SPK[who]?.force) who = who === S.char ? 'hero' : who === S.ally ? 'ally' : who;
    if (who === 'ally') { const a = CHARS[S.ally]; Object.assign(e, { speaker: a.name, portrait: a.id, side: 'shu' }); }
    else if (who !== 'hero') { const p = SPK[who]; Object.assign(e, { speaker: p.name, portrait: { seal: p.seal }, side: p.side }); }
    S.q.push(e);
  };

  // ---- triggers (every key of an object must hold; an array = any one of its objects)
  const officerFrac = (k) => { const i = S.off[k]; return S.dead[k] ? 0 : i >= 0 ? game.crowd.hp[i] / game.crowd.hpMax[i] : 1; };
  const holds = (w) => {
    if (!w) return true;
    if (Array.isArray(w)) return w.some(holds);
    const h = game.hero;
    if (w.wait != null && S.t - S.beatT < w.wait) return false;
    if (w.kos != null && kosOf(h) - S.koBase < w.kos) return false;
    if (w.zone && zOf(h) < nearZ(w.zone)) return false;
    if (w.at && zOf(h) < pos(w.at)[1]) return false;
    if (w.down && !S.dead[w.down]) return false;
    if (w.below && officerFrac(w.below[0]) >= w.below[1]) return false;
    if (w.flag && !S.flags[w.flag]) return false;
    return true;
  };

  function fire(b) {
    const c = game.crowd, h = game.hero;
    if (b.win) { S.won = S.t; S.q.length = 0; S.sayUntil = 0; }       // victory: drop pending chatter, its line goes out first
    if (b.retire) c.retire(h.z - 45);                                  // stage change: idle blocks far behind give their slots back
    for (const q of b.squads || []) { const [x, z] = pos(q.at); c.spawnSquad({ x, z, n: q.n, cols: q.cols, charge: !!q.charge }); }
    for (const k in b.officers || {}) {                                // spawned on the next steps (retried while slots are full)
      const o = b.officers[k], d = OFF[o.like || k];
      const [x, z] = pos(o.at);
      const hp = duo() ? (d.hp ?? CROWD.officerHp) * (d.boss ? 1.6 : 1.3) : d.hp;   // co-op: boss × 1.6, officer × 1.3
      S.want[k] = { x, z, name: d.name, hp, boss: !!d.boss, engaged: !!o.engaged };
      S.wantModel[k] = d.model || null;
      S.off[k] = -1; S.dead[k] = false;
    }
    if (b.waves != null) c.setWaves(b.waves);
    if (b.limit) { S.limit = c.zMax = b.limit.z ? pos(b.limit.z)[1] : Infinity; S.nag = b.limit.nag || null; }   // crowd: waves spawn inside it
    for (const x of duo() || [h]) if (b.heal && !x.dead) x.hp = Math.min(x.hpMax, x.hp + b.heal * game.diff.heal * x.hpMax);
    if (b.morale != null) S.mBase = b.morale === 1 ? 1 : S.mBase + b.morale;
    if (b.gate) setGate(b.gate, true);
    if (b.banner) emit('story:banner', { dur: 150, ...b.banner });
    if (b.hush) S.q.length = 0;                                        // stage cleared: queued taunts are stale now
    if (b.obj) { emit('story:objective', { zh: b.obj.zh, en: b.obj.en }); S.go = b.obj.go; }
    for (const l of b.say || []) say(l);
    if (b.set) S.flags[b.set] = true;
    if (b.cue && S.script && S.script.cue) S.script.cue(b.cue);
  }
  const api = {
    t: () => S.t, frac: (k) => officerFrac(k), officer: (k) => (S.off[k] >= 0 ? S.off[k] : -1), dead: (k) => !!S.dead[k],
    pos: (P) => (typeof P[0] === 'string' ? pos(P) : P),
    squad: ({ at, n = 10, charge = true, cols }) => { const [x, z] = api.pos(at); game.crowd.spawnSquad({ x, z, n, cols, charge }); },
    say: (l) => say(l), banner: (b) => emit('story:banner', { dur: 150, ...b }),
    objective: (o) => { emit('story:objective', { zh: o.zh, en: o.en }); S.go = o.go; },
    flag: (name, v) => { if (v !== undefined) S.flags[name] = v; return !!S.flags[name]; },
    gate: (id, open) => setGate(id, open), lose: () => S.end(false),
    fire: (b) => fire(b), model: (k, m) => { S.wantModel[k] = m; if (S.off[k] >= 0) S.slotModel[S.off[k]] = m; },
  };

  st.reset = ({ mode = 'free', char = 'zhaoyun', chapter } = {}) => {
    const CH = resolveChapter(chapter, char);
    ({ BEATS, OFF, SPK } = CH);
    st.chapter = CH;
    S.flags = {};
    Object.assign(S, { mode, char, ally: CH.cast.find((id) => id !== char) || CH.cast[0], t: 0, done: false, maxChain: 0,
      downT: -1, dmg: 0, beat: 0, beatT: 0, koBase: 0, off: {}, want: {}, dead: {}, q: [], sayUntil: 0, limit: Infinity, nag: null,
      nagT: -999, mBase: 0.4, won: -1, go: null, wantModel: {}, slotModel: {} });
    game.timeScale = 1;
    st.target = null;
    S.script = mode === 'story' && CH.script ? CH.script(game, api) : null;
    st.fx = S.script ? S.script.fx || null : null;
    if (mode === 'story') for (const id in GATES) setGate(id, false);   // spawnPoint() opened them all; the script opens each
    st.morale = mode === 'story' ? 0.4 : undefined;
    const c = game.crowd;
    if (mode === 'free') { c.spawnArmy(); c.spawnAllies({ ...MAP.freeAllies }); }
    else for (const a of CH.allies || []) c.spawnAllies({ ...a });
    c.setAllies(true);
    // story: the first beat spawns the field on step 1 — after main.js's 'scenario' reset of the HUD, so its objective sticks
  };

  st.step = () => {
    const h = game.hero, c = game.crowd;
    if (S.done) return;
    S.t++;
    if (h.combo > S.maxChain) S.maxChain = h.combo;
    if (S.mode === 'free') {
      if (game.frame === 185) emit('story:say', { ...h.char.lines.intro, dur: 300 });   // the hero's opening line
      const FN = st.chapter && st.chapter.freeNames;                  // the chapter's own names for the arena's officers
      if (FN) for (let k = 0; k < c.offName.length; k++) if (c.offName[k] && !FN.includes(c.offName[k])) c.offName[k] = FN[k % FN.length];
      return;
    }

    // victory: slow-mo on the killing blow (0.3× for ~5 s of wall time, eased back), the hero untouchable, then results
    if (S.won >= 0) {
      const k = S.t - S.won;
      game.timeScale = k < 90 ? 0.3 : Math.min(1, 0.3 + (k - 90) / 60 * 0.7);
      for (const x of duo() || [h]) x.iframes = Math.max(x.iframes, 2);
      if (k >= 300) S.end(true);
    } else if (S.downT >= 0) { if (S.t - S.downT >= 120) S.end(false); return; }     // 2 s on the ground, then defeat

    while (S.beat < BEATS.length) {
      const b = BEATS[S.beat];
      if (b.skip && holds(b.skip)) { S.beat++; continue; }
      if (!holds(b.when)) break;
      S.beat++; S.beatT = S.t; S.koBase = kosOf(h);
      fire(b);
      if (b.win) break;
    }

    // officers the script asked for: spawn as soon as a slot is free (a KO'd officer frees his slot after crowd deadTime)
    for (const k in S.want) {
      const i = c.spawnOfficer(S.want[k]);
      if (i >= 0) { S.off[k] = i; S.slotModel[i] = S.wantModel[k]; delete S.want[k]; }
    }

    if (S.script && S.won < 0) S.script.step();                     // the chapter's set pieces (hook)

    // stage gate: the hero can't run past the stage he is on (a nag line explains, at most every 10 s)
    for (const x of duo() || [h]) if (x.z > S.limit) {
      x.z = S.limit; if (x.vz > 0) x.vz = 0;
      if (S.nag && S.t - S.nagT > 600 && !S.q.length && S.t >= S.sayUntil) { S.nagT = S.t; say(S.nag); }
    }

    // dialogue queue
    if (S.q.length && S.t >= S.sayUntil) { const e = S.q.shift(); emit('story:say', e); S.sayUntil = S.t + e.dur + DLG_GAP; }

    // HUD reads: objective arrow target, morale (stage morale + a little per KO, eased)
    const g = S.go;
    if (typeof g === 'string') { const i = S.off[g]; st.target = i >= 0 ? { x: c.x[i], z: c.z[i] } : S.want[g] ? { x: S.want[g].x, z: S.want[g].z } : null; }
    else if (g) { const [x, z] = pos(g); st.target = { x, z }; }
    else st.target = null;
    const m = S.mBase >= 1 ? 1 : clamp01(S.mBase + kosOf(h) * 0.0004 + (c.allyKos - c.allyLost) * 0.0006);
    st.morale += (Math.min(0.95, Math.max(0.08, m)) - st.morale) * 0.03;
  };

  /** DW-style rank from KOs, clear time and damage taken: 3 points each (+ game.diff.rankBonus), S ≥ 8, A ≥ 6, B ≥ 4,
   *  else C; never above game.diff.rankMax (初級 tops out at A). */
  function rank({ kos, time, dmg, hpMax }) {
    const p = (kos >= 2000 ? 3 : kos >= 1200 ? 2 : kos >= 600 ? 1 : 0) + (time <= 540 ? 3 : time <= 720 ? 2 : time <= 900 ? 1 : 0) +
      (dmg <= hpMax * 0.35 ? 3 : dmg <= hpMax * 0.7 ? 2 : dmg <= hpMax * 1.1 ? 1 : 0);
    const d = game.diff, q = p + d.rankBonus, r = q >= 8 ? 'S' : q >= 6 ? 'A' : q >= 4 ? 'B' : 'C';
    return r === 'S' && d.rankMax === 'A' ? 'A' : r;
  }
  return st;
}
