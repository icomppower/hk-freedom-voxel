// 烽火戰 Bonfire battle (sim). A free-arena battle on any map with a goal and a clock, shaped by 1–2 烽火事件牌 drawn
// from the battle seed (cards.js). Deterministic: the draw has its own RNG, everything else runs in step() off sim state.
//   game.fh = createFenghuo(game)
//   fh.begin({ seed, cards? } | null)   battle start, BEFORE hero / crowd resets: null = off (game.mods neutral, game.diff as picked);
//                               else draws the cards, sets game.mods and a derived game.diff
//   fh.afterHero()              after hero.reset: card HP cap / run speed on the hero
//   fh.step()                   once per sim step (after the story director): clock, regen, goal, end → story:end
//   fh.on / cards / mods / goal / left (sim frames) / won / seed    HUD + result read these
// Win: K.O. `goal` before the clock runs out (FH.time + card timer). Lose: the clock, or the hero falls (2 s down).
// Ends through the same story:end event the chapters use (main.js → result screen).
import { emit, on } from '../core/events.js';
import { draw, compose, NEUTRAL, CARD } from './cards.js';

export const FH = {
  time: 300,          // s on the clock before cards
  goal: 1000,         // K.O.s to win in 5:00 (human pace ≈ 200/min; the bot runs ≈ 430-640/min: bench/fenghuo/balance.mjs)
  regenDelay: 180,    // sf after the last blow taken before card regen ticks
  downFrames: 120, winFrames: 240,
};

export function createFenghuo(game) {
  const fh = { on: false, cards: [], mods: NEUTRAL, seed: 0, goal: FH.goal, left: 0, t: 0, won: -1, downT: -1, done: false, lastHurt: -999, maxChain: 0, dmg: 0 };
  on('hero:hurt', (e) => { if (fh.on) { fh.lastHurt = fh.t; fh.dmg += e.dmg; } });
  on('ko', (e) => {
    if (!fh.on || !e.officer || !fh.mods.koHeal) return;
    const h = game.hero;
    if (!h.dead) h.hp = Math.min(h.hpMax, h.hp + fh.mods.koHeal * h.hpMax);
  });

  fh.begin = (opt) => {
    fh.on = !!opt;
    fh.cards = fh.on ? (opt.cards ? opt.cards.map((k) => CARD[k]) : draw(opt.seed)) : [];   // cards: forced hand (bench)
    fh.seed = fh.on ? opt.seed >>> 0 : 0;
    fh.mods = fh.on ? compose(fh.cards) : NEUTRAL;
    game.mods = fh.mods;
    if (fh.on) {
      const d = game.diff, m = fh.mods;
      game.diff = { ...d, dmg: d.dmg * m.enemyAtk / m.heroDef, gruntHp: d.gruntHp * m.enemyHp, officerHp: d.officerHp * m.enemyHp * m.officerHp,
        windup: Math.round(d.windup * m.windup), strikers: Math.max(1, d.strikers + m.strikers) };
    }
    Object.assign(fh, { t: 0, won: -1, downT: -1, done: false, lastHurt: -999, maxChain: 0, dmg: 0, goal: FH.goal,
      left: (FH.time + fh.mods.timer) * 60 });
  };

  fh.afterHero = () => {
    if (!fh.on) return;
    const h = game.hero;
    h.hpMax = Math.round(h.hpMax * fh.mods.heroHp); h.hp = h.hpMax;
    h.speedMul = fh.mods.heroSpeed;
  };

  fh.stats = () => {
    const h = game.hero, time = Math.round(fh.t / 60);
    const s = { kos: h.kos, time, hpMax: h.hpMax, maxChain: fh.maxChain, dmg: fh.dmg, fenghuo: { cards: fh.cards.map((c) => c.id), goal: fh.goal, left: Math.ceil(fh.left / 60), seed: fh.seed } };
    if (fh.won >= 0) s.rank = rank(s);
    return s;
  };
  const end = (win) => { if (!fh.done) { fh.done = true; game.timeScale = 1; emit('story:end', { win, stats: fh.stats() }); } };

  fh.step = () => {
    if (!fh.on || fh.done) return;
    const h = game.hero;
    fh.t++;
    if (h.combo > fh.maxChain) fh.maxChain = h.combo;
    if (fh.won >= 0) {                                               // victory slow-mo, the hero untouchable
      const k = fh.t - fh.won;
      game.timeScale = k < 90 ? 0.3 : Math.min(1, 0.3 + (k - 90) / 60 * 0.7);
      h.iframes = Math.max(h.iframes, 2);
      if (k >= FH.winFrames) end(true);
      return;
    }
    if (h.dead) { if (fh.downT < 0) fh.downT = fh.t; if (fh.t - fh.downT >= FH.downFrames) end(false); return; }
    if (fh.t === 2) emit('story:objective', { zh: `擊倒 ${fh.goal} 人`, en: `K.O. ${fh.goal}` });   // after the HUD's scenario reset
    if (fh.left > 0) fh.left--;
    if (h.kos >= fh.goal) {
      fh.won = fh.t;
      emit('story:banner', { html: '<em>烽火燎原</em>', en: 'The fire spreads — victory', dur: 200, big: true });
      return;
    }
    if (!fh.left) { emit('story:banner', { html: '時限已到', en: 'Time is up', dur: 150 }); end(false); return; }
    if (fh.mods.regen && fh.t - fh.lastHurt > FH.regenDelay && h.hp < h.hpMax) h.hp = Math.min(h.hpMax, h.hp + fh.mods.regen * h.hpMax / 60);
  };

  /** Rank: K.O. pace (time left), damage taken, best chain: 3 points each, + difficulty and card bonus. */
  function rank({ dmg, hpMax, maxChain, fenghuo }) {
    const left = fenghuo.left;
    const p = (left >= 90 ? 3 : left >= 45 ? 2 : left >= 15 ? 1 : 0) + (dmg <= hpMax * 0.35 ? 3 : dmg <= hpMax * 0.7 ? 2 : dmg <= hpMax * 1.1 ? 1 : 0) +
      (maxChain >= 200 ? 3 : maxChain >= 100 ? 2 : maxChain >= 50 ? 1 : 0);
    const d = game.diff, q = p + d.rankBonus + fh.mods.rank, r = q >= 8 ? 'S' : q >= 6 ? 'A' : q >= 4 ? 'B' : 'C';
    return r === 'S' && d.rankMax === 'A' ? 'A' : r;
  }
  return fh;
}
