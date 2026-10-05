// simkit.mjs without installing dmath (the caller decides: xengine.mjs --native).
export async function createCoopGameRaw({ enemies = 300 } = {}) {
  const { createHero } = await import('../../src/hero/hero.js');
  const { createCrowd } = await import('../../src/crowd/crowd.js');
  const { createCombat } = await import('../../src/combat/combat.js');
  const { createCamSim } = await import('../../src/camera/camera.js');
  const { createStory } = await import('../../src/story/index.js');
  const { difficulty } = await import('../../src/core/difficulty.js');
  const { on } = await import('../../src/core/events.js');
  const coop = await import('../../src/net/coopsim.js');
  const { coopHash } = await import('../../src/net/hash.js');
  const game = { frame: 0, hitstop: 0, freeze: 0, mode: 'story', diff: difficulty() };
  game.cam = createCamSim(); game.hero = createHero(game); game.crowd = createCrowd(game, enemies);
  game.combat = createCombat(game); game.musou = game.hero.kit.createMusou(game); game.story = createStory(game);
  coop.attachCoop(game);
  const g = { game, end: null };
  on('story:end', (e) => { g.end = e; });
  g.start = (o) => { g.end = null; return coop.coopStart(game, o); };
  g.step = (ins) => coop.coopStep(game, ins);
  g.hash = () => coopHash(game);
  return g;
}
