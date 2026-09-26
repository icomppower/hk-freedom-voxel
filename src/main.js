// Boot, flow and the fixed 60 Hz loop. Sim modules (hero, combat, crowd, musou, story, camera control yaw) advance only
// in step(); render-side modules read sim state in render() and never write it.
// Flow: title → select → (story: prologue →) battle → result → title. Each non-battle state is a DOM screen (index.html
// #title #select #prologue #result, modules below: createX(el, flow) → { enter(ctx), exit(), view? }; view(scene, camera,
// focus, dt) = optional render-only camera/stage hook run after the gameplay rig while that screen is up); the sim only steps in
// 'battle' and not paused (Esc: pause menu #menu). startBattle() resets the sim for a character / mode / chapter.
// Dev shortcut: ?go=free|story[&char=id] skips the screens straight into a battle.
import * as THREE from 'three';
import { vrng, rng } from './core/rng.js';
import { emit, on, collect } from './core/events.js';
import { createInput } from './core/input.js';
import { createPost } from './post/post.js';
import { createWorld } from './world/world.js';
import { createHero, createHeroView } from './hero/hero.js';
import { createCrowd } from './crowd/crowd.js';
import { createCrowdView } from './crowd/view.js';
import { createCombat } from './combat/combat.js';
import { createCamSim, createCameraRig } from './camera/camera.js';
import { createVfx } from './vfx/vfx.js';
import { createHud } from './ui/hud.js';
import { createAudio } from './audio/audio.js';
import { CHARS } from './chars/index.js';
import { spawnPoint } from './world/map.js';
import { createStory } from './story/index.js';
import { createTitle } from './ui/title.js';
import { createSelect } from './ui/select.js';
import { createPrologue } from './story/prologue.js';
import { createResult } from './story/result.js';

const params = new URLSearchParams(location.search);
const ENEMIES = Math.max(0, Math.min(2000, params.get('enemies') ? Number(params.get('enemies')) | 0 : 300));

const canvas = document.getElementById('c');
let vw = innerWidth, vh = innerHeight;

const post = createPost({ canvas, width: vw, height: vh });
const scene = new THREE.Scene();
const world = createWorld(scene);

// ---- sim
// mode: 'free' | 'story' (set by startBattle); the hero's character / kit: game.hero.char / game.hero.kit
const game = { frame: 0, hitstop: 0, freeze: 0, mode: 'free' };
game.cam = createCamSim();
game.hero = createHero(game);
game.crowd = createCrowd(game, ENEMIES);
game.combat = createCombat(game);
game.musou = game.hero.kit.createMusou(game);     // the character's Musou (rebuilt with the kit in startBattle)
game.story = createStory(game);
const input = createInput();

// ---- render side
const crowdView = createCrowdView(scene, game);
const camRig = createCameraRig(game, vw, vh);
const vfx = createVfx(scene, game, world);
// kit views (hero model + chains + ghosts, Musou grade/dragon/cut-in): rebuilt when the character's kit changes
let heroView, musouView, dropViews = null;
function buildViews() {
  if (dropViews) { dropViews(); heroView.dispose(); musouView.dispose(); }
  [[heroView, musouView], dropViews] = collect(() => [createHeroView(scene, game.hero), game.hero.kit.createMusouView(scene, game, camRig.camera)]);
}
buildViews();
// hud part: camera passed so officer name/HP tags can be projected over their heads (read-only)
const hud = createHud(document.getElementById('hud'), game, camRig.camera);
createAudio(game);

function step() {
  const inp = input.sample();
  game.cam.step(game, inp);
  game.hero.step(inp);
  game.combat.step();
  game.crowd.step();
  game.musou.step();
  game.story.step();
  game.frame++;
  vfx.afterStep();
}

let lastRenderFrame = 0;
/** real: wall-clock dt while a screen is up (the field idles behind it: fires, flags, cloth keep moving); battle: sim time. */
function render(real) {
  const dt = real ?? Math.min(10, Math.max(0, (game.frame - lastRenderFrame) / 60));
  lastRenderFrame = game.frame;
  heroView.update(Math.min(dt, 0.1));
  crowdView.update(dt);
  vfx.update(dt);
  camRig.update(dt);
  screens[state]?.view?.(scene, camRig.camera, camRig.focus, dt);   // ui lane: a screen may frame the idle field itself
  world.update(dt, camRig.focus);
  musouView.update(dt);
  post.render(scene, camRig.camera, game.frame / 60, camRig.focus, vfx.flash);   // post-fx: DoF focus + screen flash
  hud.update();
}

/** New battle: { char: CHARS id, mode: 'story' | 'free', chapter: 'ch1' }. Resets every sim module (deterministic from
 *  here: both RNGs reseeded, frame 0), rebuilds the kit views on a character change, lets the story spawn the field. */
function startBattle({ char = 'zhaoyun', mode = 'free', chapter = 'ch1' } = {}) {
  const ch = CHARS[char] || CHARS.zhaoyun, p = spawnPoint(ch.id, mode), newKit = ch.kit !== game.hero.kit;
  Object.assign(game, { mode, frame: 0, hitstop: 0, freeze: 0 });
  lastRenderFrame = 0;
  vrng.seed(7936); rng.seed(1);
  game.hero.reset({ ...p, char: ch });
  if (newKit) game.musou = ch.kit.createMusou(game);
  game.crowd.reset(); game.combat.reset(); game.musou.reset(); game.cam.reset(p.yaw);
  if (newKit) buildViews();
  heroView.reset();
  game.story.reset({ mode, chapter, char: ch.id });
  menu.querySelector('.t').innerHTML = `${ch.name.zh}<i>${ch.seal}</i>`;
  document.title = `${ch.name.zh} — Voxel Musou`;
  emit('scenario', { name: mode === 'story' ? chapter : 'arena', mode, char: ch.id, chapter });
}

addEventListener('resize', () => {
  vw = innerWidth; vh = innerHeight;
  post.setSize(vw, vh);
  camRig.resize(vw, vh);
  render();
});

// ---- flow + pause menu (index.html #menu, battle only): the sim waits while it is open or while a screen is up
const $ = (id) => document.getElementById(id);
const menu = $('menu'), hudEl = $('hud');
let paused = false, state = null, ctx = {};
const setPaused = (v) => { paused = v; menu.hidden = !v; hudEl.hidden = v; input.sample(); };   // sample(): drop keys pressed on the menu
const flow = {
  get state() { return state; },
  /** Enter a flow state: 'title' | 'select' | 'prologue' | 'battle' | 'result' (ctx: see each screen module). */
  go(s, c = {}) {
    if (screens[state]) { screens[state].exit(); $(state).hidden = true; }
    state = s; ctx = c;
    if (s === 'battle') { startBattle(c); setPaused(false); }
    else { setPaused(false); hudEl.hidden = true; $(s).hidden = false; screens[s].enter(c); }
    emit('flow', { state: s, ctx: c });
  },
};
const screens = {
  title: createTitle($('title'), flow), select: createSelect($('select'), flow),
  prologue: createPrologue($('prologue'), flow), result: createResult($('result'), flow),
};
on('story:end', (e) => flow.go('result', { ...ctx, win: e.win, stats: e.stats }));
$('go').addEventListener('click', () => setPaused(false));
$('quit').addEventListener('click', () => flow.go('title'));
addEventListener('keydown', (e) => {
  if (state !== 'battle') return;
  if (e.code === 'Escape') setPaused(!paused);
  else if (paused && (e.code === 'Enter' || e.code === 'NumpadEnter')) setPaused(false);
});
addEventListener('blur', () => { if (state === 'battle') setPaused(true); });

// ---- loop
let acc = 0, last = performance.now();
const frame = (now) => {
  requestAnimationFrame(frame);
  // clamp at 0 too: the first rAF timestamp can precede the performance.now() taken at module init
  const d = Math.min(0.1, Math.max(0, (now - last) / 1000));
  acc += d * (game.timeScale ?? 1); last = now;                                  // story: victory slow-mo
  if (paused) { acc = 0; input.sample(); return; }
  if (state !== 'battle') { acc = 0; input.sample(); render(d); return; }     // screens: the field idles behind them
  let n = 0;
  while (acc >= 1 / 60 && n < 4 && state === 'battle') { step(); acc -= 1 / 60; n++; }
  if (n === 4) acc = 0;
  render();
};

const dev = params.get('go');
if (dev) flow.go('battle', { mode: dev === 'story' ? 'story' : 'free', char: params.get('char') || 'zhaoyun', chapter: 'ch1' });
else flow.go('title');
render();
requestAnimationFrame(frame);
