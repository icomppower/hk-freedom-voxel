// Headless co-op game for Node (the test clients and the offline 2P bot runs): the deterministic Math installed first
// (as src/net/boot.js does for ?coop pages), then the same sim modules main.js builds, turned 2-hero by coopsim.attachCoop.
// Run under `node --import ./bench/harness/register.mjs` (the three importmap).
import { install } from '../../src/core/dmath.js';
install();
const { createHero } = await import('../../src/hero/hero.js');
const { createCrowd } = await import('../../src/crowd/crowd.js');
const { createCombat } = await import('../../src/combat/combat.js');
const { createCamSim } = await import('../../src/camera/camera.js');
const { createStory } = await import('../../src/story/index.js');
const { difficulty } = await import('../../src/core/difficulty.js');
const { on } = await import('../../src/core/events.js');
const coop = await import('../../src/net/coopsim.js');
const { coopHash } = await import('../../src/net/hash.js');

/** One per process (the event bus and map state are module singletons). */
export function createCoopGame({ enemies = 300 } = {}) {
  const game = { frame: 0, hitstop: 0, freeze: 0, mode: 'story', diff: difficulty() };
  game.cam = createCamSim();
  game.hero = createHero(game);
  game.crowd = createCrowd(game, enemies);
  game.combat = createCombat(game);
  game.musou = game.hero.kit.createMusou(game);
  game.story = createStory(game);
  coop.attachCoop(game);
  const g = { game, end: null, events: [] };
  on('story:end', (e) => { g.end = e; });
  for (const n of ['coop:down', 'coop:revive', 'coop:respawn', 'hero:down', 'story:objective']) on(n, (e) => g.events.push([game.frame, n, e && (e.i ?? e.en)]));
  g.start = (o) => { g.end = null; g.events.length = 0; return coop.coopStart(game, o); };
  g.step = (ins) => coop.coopStep(game, ins);
  g.hash = () => coopHash(game);
  return g;
}
export { coop };
