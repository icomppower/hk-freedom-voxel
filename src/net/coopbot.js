// Co-op bot (sim-side input source, run inside the step on both peers: ?coopbot's slot 2, a partner gone > 60 s, the
// headless test clients). The solo autoplay policy (bench/bot/bot.mjs, a deterministic function of sim state) plus one
// co-op habits: a partner down within 30 m → go to him and hold interact until he is back up; a partner's Team Musou
// call (齊上齊落, src/combat/team-musou.js) → answer it after a seeded 10–40 tick delay (a hash of the call's frame);
// a ready gauge is saved for the Team Musou while the partner stands (unless hurt): walk to a ready partner, call
// within 6 m (slot 0 on frame % 7 = 0, slot 1 on 3: never the same tick by habit).
import { createBot, stickFor } from '../../bench/bot/bot.mjs';
import { TEAM } from '../combat/team-musou.js';

export function createCoopBot(i, style = 'steady') {
  const bot = createBot({ style });
  return (game) => {
    const h = game.hero, p = game.heroes[1 - i];
    if (!h.dead && p && p.dead) {
      const dx = p.x - h.x, dz = p.z - h.z, d = Math.hypot(dx, dz);
      if (d < 30) {
        const inp = { mx: 0, my: 0, orbit: 0, tilt: 0, pressed: {}, held: {} };
        if (d > 1.6) [inp.mx, inp.my] = stickFor(dx, dz, game.cam.yaw);
        else inp.held.interact = true;
        return inp;
      }
    }
    const inp = bot(game), T = game.coop?.team;
    if (T?.phase === 'idle' && p && !p.dead && !h.dead && h.state !== 'musou') {
      const mine = h.musou >= h.musouMax / 3 - 1e-6, theirs = p.musou >= p.musouMax / 3 - 1e-6 && p.state !== 'musou';
      const dx = p.x - h.x, dz = p.z - h.z, d = Math.hypot(dx, dz);
      if (mine && h.hp > h.hpMax * 0.35) {
        inp.pressed = { ...inp.pressed, musou: theirs && d <= TEAM.range - 0.5 && game.frame % 7 === (i ? 3 : 0) };
        if (theirs && d > TEAM.range - 1.5 && d < 30) [inp.mx, inp.my] = stickFor(dx, dz, game.cam.yaw);
      }
    }
    if (T?.phase === 'calling' && T.caller === 1 - i) {
      const at = game.frame - T.t, delay = 10 + (Math.imul(at + 1, 2654435761) >>> 0) % 31;
      inp.pressed = { ...inp.pressed, musou: T.t + 1 >= delay };
    }
    return inp;
  };
}
