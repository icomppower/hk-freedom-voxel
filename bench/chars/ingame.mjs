// In-game shots of a character: the bot fights ch1 (or ?ch) in the real page; the Musou is filled and fired at frame 420,
// shots at given musou frames (+ one before). node bench/chars/ingame.mjs gok [chapter] [musou frames…]
import { openGame } from '../harness/browser.mjs';
const [id = 'gok', ch = 'ch1', ...fr] = process.argv.slice(2), frames = fr.length ? fr.map(Number) : [50, 120, 182];
const g = await openGame({ query: `?go=story&char=${id}&ch=${ch}`, init: () => {
  import('/bench/bot/bot.mjs').then((m) => { const bot = m.createBot(); window.__onStep = (inp) => {
    const G = window.__vm.game; Object.assign(inp, bot(G));
    if (G.frame === 420) G.hero.musou = G.hero.musouMax;
    if (G.frame > 420 && G.frame < 440 && G.hero.state !== 'musou') inp.pressed = { musou: true };
  }; });
} });
const P = g.page;
await P.waitForFunction(() => window.__vm.game.frame > 400, null, { timeout: 60000, polling: 100 });
await P.screenshot({ path: `bench/out/${id}-${ch}-fight.png` });
for (const f of frames) {
  await P.waitForFunction((f) => window.__vm.game.musou.active && window.__vm.game.musou.t >= f, f, { timeout: 60000, polling: 16 });
  await P.screenshot({ path: `bench/out/${id}-${ch}-musou-${f}.png` });
}
console.log('shots done', g.errors.slice(0, 3));
await g.close();
