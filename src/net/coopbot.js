// Co-op bot (sim-side input source, run inside the step on both peers: ?coopbot's slot 2, a partner gone > 60 s, the
// headless test clients). The solo autoplay policy (bench/bot/bot.mjs, a deterministic function of sim state) plus one
// co-op habit: a partner down within 30 m → go to him and hold interact until he is back up.
import { createBot, stickFor } from '../../bench/bot/bot.mjs';

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
    return bot(game);
  };
}
