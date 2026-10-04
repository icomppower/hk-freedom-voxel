// 烽火戰 UI (render / DOM only — never writes sim state). The card faces (loading card reveal, result), the battle HUD
// (clock, K.O. goal, card chips, minimap off under 斷網) and the card fog (視野: scene.fog pulled in while a battle
// with that card is on screen). Styles are injected once from here so the content stays in this folder.
import { draw, effectText, helps } from './cards.js';
import { FH } from './fenghuo.js';

export const MODE_FH = ['烽火戰', 'Bonfire battle · event cards, beat the clock'];
const SEAL = { buff: ['吉', 'Boon'], debuff: ['凶', 'Bane'], mixed: ['變', 'Twist'] };

/** A fresh battle seed (UI-side randomness; the sim only ever sees the seed). */
export const newSeed = () => ((Date.now() * 2654435761) ^ (Math.random() * 4294967296)) >>> 0;

export function cardFace(c, i = 0) {
  const [sz, se] = SEAL[c.type];
  return `<article class="fh-card fh-${c.type}" style="--i:${i}">
    <header><i class="fh-seal" title="${se}">${sz}</i><b>${c.name}</b><small>${c.en}</small></header>
    <p class="fh-flavor">${c.flavor[0]}<small>${c.flavor[1]}</small></p>
    <ul>${c.effects.map((e) => `<li class="${helps(e) ? 'pos' : 'neg'}">${effectText(e)}</li>`).join('')}</ul>
  </article>`;
}
export const cardsHtml = (cards) => `<div class="fh-cards">${cards.map(cardFace).join('')}</div>`;

/** Loading card: the draw for ctx.seed, revealed under the officer's intro line. */
export function loadingCards(el, c) {
  let box = el.querySelector('.fh-load');
  if (!box) { box = document.createElement('div'); box.className = 'fh-load'; el.querySelector('.l-main').append(box); }
  box.hidden = c.mode !== 'fenghuo'; el.classList.toggle('fh', !box.hidden);
  if (box.hidden) return;
  box.innerHTML = `<p class="fh-head">今日烽火<small>Today's bonfire · K.O. ${FH.goal} before the clock runs out</small></p>${cardsHtml(draw(c.seed))}`;
}

/** Result screen parts for a 烽火戰 (result.js): header band, the cards played as the epilogue, the defeat line. */
export function resultParts(c) {
  const f = c.stats.fenghuo, cards = draw(f.seed);
  return {
    T: { small: '烽火戰', zh: cards.map((k) => k.name).join('・'), en: `BONFIRE · K.O. ${f.goal}` },
    epiHtml: cardsHtml(cards),
    lose: { zh: f.left ? '{name}力竭倒下，烽火暫熄……' : '時限已到，烽火未能燎原……', en: f.left ? '{name} falls; the fire dims, for now...' : 'Time ran out before the fire could spread...' },
  };
}

export function createFenghuoView(hudEl, game, scene) {
  injectStyle();
  const box = document.createElement('div');
  box.className = 'h-fh'; box.hidden = true;
  box.innerHTML = '<p class="fh-clock"><b>5:00</b><small>K.O. <em>0</em> / <span></span></small></p><ul class="fh-chips"></ul>';
  hudEl.append(box);
  const clock = box.querySelector('.fh-clock b'), ko = box.querySelector('.fh-clock em'), goal = box.querySelector('.fh-clock span'), chips = box.querySelector('.fh-chips');
  let shown = null, fogBase = null, fogObj = null;
  return {
    /** battle: the flow is in 'battle' (HUD visible). Cheap: text only changes once a second / per K.O. */
    update(battle) {
      const fh = game.fh, on = fh.on && battle;
      if (on !== !box.hidden) box.hidden = !on;
      hudEl.classList.toggle('fh-nomap', on && !fh.mods.minimap);
      // card fog: render-only, scene.fog pulled in by the 視野 factor while the battle is on screen
      const fog = scene.fog;
      if (fog && fog !== fogObj) { fogObj = fog; fogBase = [fog.near, fog.far]; }
      if (fog) { const v = on ? fh.mods.visibility : 1; fog.near = fogBase[0] * v; fog.far = fogBase[1] * v; }
      if (!on) return;
      if (shown !== fh.cards) {
        shown = fh.cards; goal.textContent = fh.goal;
        chips.innerHTML = fh.cards.map((c) => `<li class="fh-${c.type}"><i>${SEAL[c.type][0]}</i>${c.name}<small>${c.effects.map(effectText).join(' · ')}</small></li>`).join('');
      }
      const s = Math.ceil(fh.left / 60), t = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      if (clock.textContent !== t) { clock.textContent = t; box.classList.toggle('low', s <= 30); }
      const k = String(Math.min(game.hero.kos, fh.goal));
      if (ko.textContent !== k) ko.textContent = k;
    },
  };
}

function injectStyle() {
  if (document.getElementById('fh-style')) return;
  const st = document.createElement('style');
  st.id = 'fh-style';
  st.textContent = `
  .fh-cards { display: flex; gap: 1.6rem; flex-wrap: wrap; }
  .fh-card { position: relative; width: 26rem; padding: 1.2rem 1.4rem 1.1rem; color: #2a1c12; text-shadow: none;
    background: linear-gradient(160deg, #f4ead6, #e3d2b0); border-radius: .3rem; box-shadow: 0 .2rem 0 rgba(0,0,0,.25), 0 .8rem 1.6rem rgba(0,0,0,.45);
    border-top: .5rem solid var(--fh-c); animation: fhIn .6s cubic-bezier(.2,.8,.2,1) calc(.5s + var(--i) * .25s) both; }
  .fh-buff { --fh-c: #c8962c; } .fh-debuff { --fh-c: #8f1d17; } .fh-mixed { --fh-c: #3a6d78; }
  @keyframes fhIn { from { opacity: 0; transform: translateY(1.5rem) rotate(-3deg) scale(.92); } }
  .fh-card header { display: flex; align-items: baseline; gap: .7rem; flex-wrap: wrap; }
  .fh-card .fh-seal { font: 700 1.6rem/1 var(--kai); font-style: normal; color: #f8eedc; background: var(--fh-c); padding: .3rem .35rem; border-radius: .25rem; align-self: center; }
  .fh-card b { font: 700 2.8rem/1.1 var(--brush); letter-spacing: .15rem; }
  .fh-card header small { font: 600 max(12px, 1.2rem)/1 var(--sans); letter-spacing: .12em; text-transform: uppercase; color: #6b5640; }
  .fh-flavor { margin: .8rem 0 .7rem; font: 500 1.6rem/1.35 var(--kai); }
  .fh-flavor small { display: block; margin-top: .3rem; font: 500 max(12px, 1.2rem)/1.3 var(--sans); color: #6b5640; }
  .fh-card ul { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: .4rem; }
  .fh-card li { font: 700 max(12px, 1.3rem)/1 var(--sans); padding: .35rem .6rem; border-radius: 1rem; background: rgba(42,28,18,.1); }
  .fh-card li.pos { color: #2f6b2a; } .fh-card li.neg { color: #8f1d17; }
  .fh-load { margin-top: 2.6rem; }
  .fh-load .fh-head { margin: 0 0 1.2rem; font: 700 2.4rem/1 var(--brush); color: #f9f3e8; letter-spacing: .3rem; text-shadow: .15rem .2rem 0 rgba(0,0,0,.5); }
  .fh-load .fh-head small { margin-left: 1.2rem; font: 600 max(12px, 1.3rem)/1 var(--sans); letter-spacing: .08em; color: #e9dcc2; }
  #result .fh-cards { margin-top: .4rem; } #result .fh-card { width: 22rem; } #result .fh-card b { font-size: 2.3rem; }
  #result .rs-epi .fh-card p.fh-flavor { color: #2a1c12; text-shadow: none; margin: .8rem 0 .7rem; padding: 0; border: 0; opacity: 1; }
  #result .rs-epi .fh-card p.fh-flavor small, #result .rs-epi .fh-card header small { color: #6b5640; }
  #hud .h-fh { left: 50%; top: 1.2rem; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: .6rem; }
  #hud .h-fh[hidden] { display: none; }
  #hud .fh-clock { margin: 0; display: flex; align-items: baseline; gap: 1.2rem; padding: .3rem 1.6rem; background: rgba(10,7,6,.62); border-radius: .3rem;
    box-shadow: 0 0 0 .1rem rgba(214,184,130,.5); }
  #hud .fh-clock b { font: 700 3.4rem/1 var(--sans); font-variant-numeric: tabular-nums; letter-spacing: .05em; }
  #hud .h-fh.low .fh-clock b { color: #ff7a5c; animation: fhPulse 1s ease-in-out infinite; }
  @keyframes fhPulse { 50% { opacity: .55; } }
  #hud .fh-clock small { font: 700 max(13px, 1.5rem)/1 var(--sans); letter-spacing: .1em; color: #e6d8bc; }
  #hud .fh-clock em { font-style: normal; color: var(--gold); }
  #hud .fh-chips { margin: 0; padding: 0; list-style: none; display: flex; gap: .6rem; }
  #hud .fh-chips li { font: 700 1.6rem/1 var(--kai); padding: .35rem .8rem .35rem .4rem; background: rgba(10,7,6,.55); border-radius: .3rem; border-left: .3rem solid var(--fh-c); white-space: nowrap; }
  #hud .fh-chips li i { font-style: normal; font-size: 1.2rem; padding: .15rem .25rem; margin-right: .5rem; background: var(--fh-c); border-radius: .2rem; }
  #hud .fh-chips li small { margin-left: .6rem; font: 600 max(11px, 1.1rem)/1 var(--sans); color: #d9cbb0; }
  #hud.fh-nomap .h-map { display: none; }
  /* title: a fifth menu entry (烽火戰) — tighter rows so 致敬 stays on screen */
  #title .t-menu { margin-top: 2.2rem; gap: 0; } #title .t-menu button { padding-bottom: .8rem; } #title .t-menu .swash { bottom: 2.4rem; }
  /* loading card: the cards take the tip's place, the column moves up */
  #loading.fh .l-main { top: 5rem; } #loading.fh .l-tip { visibility: hidden; } #loading.fh .l-line { margin-top: 2rem; }
  @media (max-aspect-ratio: 16/10) { #hud .fh-chips li small { display: none; } }
  `;
  document.head.append(st);
}
