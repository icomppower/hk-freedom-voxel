// Story director (sim): scripts a battle through the crowd's story API and the story:* events. Runs inside step()
// (after the musou), deterministic: time it off game.frame / its own counters, randomness from core/rng.js `rng` only.
//   game.story = createStory(game)
//   story.reset({ mode, chapter, char })   battle start (after hero / crowd / combat / musou resets): spawn the opening
//   story.step()                           once per sim step while the battle runs
//   story.stats()                          → { kos, time (s), hp, maxChain } for story:end / the result screen
// Emits story:say / story:banner / story:objective / story:end (payloads: core/events.js). The flow (main.js) leaves the
// battle for the result screen on story:end; the HUD shows the rest.
// Free mode = the old arena: the army, reinforcement waves, the hero's intro line, and no end.
// Story mode: CHAPTERS[chapter] — story lane replaces the ch1 placeholder below (win: every officer KO'd, lose: hero down).
import { emit, on } from '../core/events.js';
import { ST } from '../crowd/crowd.js';

const CHAPTERS = {
  ch1: {
    reset(game, S) {
      game.crowd.spawnArmy();
      emit('story:objective', { zh: '擊破全部敵將', en: 'Defeat every enemy officer' });
    },
    step(game, S) {
      const c = game.crowd;
      if (S.t < 60) return;
      for (let i = c.grunts; i < c.N; i++) if (c.st[i] !== ST.OFF && c.st[i] !== ST.DEAD) return;
      S.end(true);
    },
  },
};

export function createStory(game) {
  const S = { mode: 'free', chapter: null, t: 0, done: false, maxChain: 0, downT: -1 };
  const st = {};
  st.stats = () => ({ kos: game.hero.kos, time: Math.round(S.t / 60), hp: game.hero.hp, maxChain: S.maxChain });
  S.end = (win) => { if (!S.done) { S.done = true; emit('story:end', { win, stats: st.stats() }); } };
  on('hero:down', () => { if (S.mode === 'story') S.downT = S.t; });

  st.reset = ({ mode = 'free', chapter = 'ch1' } = {}) => {
    Object.assign(S, { mode, chapter, t: 0, done: false, maxChain: 0, downT: -1 });
    if (mode === 'free') game.crowd.spawnArmy();
    else CHAPTERS[chapter].reset(game, S);
  };

  st.step = () => {
    const h = game.hero;
    if (S.done) return;
    S.t++;
    if (h.combo > S.maxChain) S.maxChain = h.combo;
    if (game.frame === 185) emit('story:say', { ...h.char.lines.intro, dur: 300 });     // the hero's opening line
    if (S.mode === 'free') return;
    if (S.downT >= 0) { if (S.t - S.downT >= 120) S.end(false); return; }             // 2 s on the ground, then defeat
    CHAPTERS[S.chapter].step(game, S);
  };
  return st;
}
