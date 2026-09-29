// Cutscene player (#cutscene, story lane; render-only — nothing here touches the sim). Plays a scene built by one of the
// scene modules (./between1.js … ./ending.js) on the live field: the scene may switch the map (stage.setMap), clears the
// sim's leftover soldiers (stage.clearField — the next battle resets everything anyway), builds its own actors / sets
// under one group (./kit.js: the shipped hero models, a stand-in crowd on the real crowd view, box-list props), and runs
// its shots on the wall clock:
//   scene = { map?, shots: [{ dur, set?(K), cam(u, t) → { pos, look, fov? }, update?(u, t, dt), events?: [{ at, do }],
//             say?: [{ at, spk, zh, en, dur? }] }], build(K, root), sound?(S) (./sound.js cues), title?: { at, shot } }
// cam / update run every render with u = shot time / dur (0…1) and t = seconds into the shot; events fire once when t
// passes `at`; `say` lines show as subtitles in the HUD dialogue style (speaker, zh above en). Skip: tap / click / Enter /
// Space / Esc (sound fades out in 0.5 s). Done → ctx.then() (the flow step after the scene).
// ctx in: { id: 'between1' | 'between2' | 'between3' | 'ending', char (the playable the player picked leads), then() }.
import * as THREE from 'three';
import { createKit } from './kit.js';
import { createCutSound } from './sound.js';
import * as between1 from './between1.js';
import * as between2 from './between2.js';
import * as between3 from './between3.js';
import * as ending from './ending.js';

export const SCENES = { between1, between2, between3, ending };
const SPK = {
  lungjai: { zh: '龍仔', en: 'DRAGON', c: '#ffd700' }, siumei: { zh: '小美', en: 'AMY', c: '#f48fb1' },
};

export function createCutscenes(el, flow, stage) {
  el.innerHTML = `<i class="cs-bar t"></i><i class="cs-bar b"></i>
    <div class="cs-sub"><b></b><p></p><small></small></div>
    <div class="cs-title"><h1>香港自由戰士</h1><p>多謝你企出嚟<small>Thank you for standing up.</small></p></div>
    <div class="cs-skip">輕按跳過<small>Tap to skip</small></div>`;
  const $ = (s) => el.querySelector(s), sub = $('.cs-sub'), title = $('.cs-title');
  const kit = createKit(stage);
  let ctx = null, S = null, K = null, snd = null, shot = 0, t = 0, fired = null, said = null, subT = 0, done = false, total = 0;

  const setSub = (l) => {
    if (!l) { sub.classList.remove('on'); return; }
    const who = SPK[l.spk] || { zh: l.spk, en: '', c: '#e8e0d0' };
    sub.querySelector('b').innerHTML = `${who.zh}<span>${who.en}</span>`; sub.querySelector('b').style.color = who.c;
    sub.querySelector('p').textContent = l.zh; sub.querySelector('small').textContent = l.en;
    sub.classList.add('on'); subT = l.dur ?? 3.2;
  };
  function finish(skipped) {
    if (done) return;
    done = true;
    snd?.stop(skipped ? 0.5 : 1.2);
    const then = ctx.then;
    setTimeout(() => { K?.dispose(); K = null; then(); }, skipped ? 520 : 200);
  }
  const skip = (e) => { if (!done && S && t + total > 0.4) { e?.preventDefault?.(); finish(true); } };
  el.addEventListener('pointerdown', skip);
  addEventListener('keydown', (e) => { if (ctx && !done && !el.hidden && ['Enter', 'Space', 'Escape'].includes(e.code)) skip(e); });

  return {
    enter(c) {
      ctx = c; done = false; shot = 0; t = 0; total = 0; subT = 0;
      S = SCENES[c.id];
      if (S.map) stage.setMap(S.map);
      stage.clearField();
      K = kit.begin({ lead: c.char === 'siumei' ? 'siumei' : 'lungjai' });
      S.build(K, K.root);
      S.shots[0].set?.(K);
      S.onBlink?.((on) => el.classList.toggle('blink', on));
      snd = createCutSound(c.id);
      fired = new Set(); said = new Set();
      title.classList.remove('on'); sub.classList.remove('on');
      el.classList.toggle('ending', c.id === 'ending');
      window.__cut = { id: c.id, get shot() { return shot; }, get t() { return t; }, get total() { return total; }, get done() { return done; } };
    },
    exit() { if (!done) { done = true; snd?.stop(0.3); K?.dispose(); K = null; } ctx = null; },
    /** Render-side frame: advance the scene, frame the camera (and the DoF focus), pose the actors. */
    view(scene, camera, focus, dt) {
      if (!S || !K) return;
      dt = Math.min(dt || 1 / 60, 0.1);
      if (!done) { t += dt; total += dt; }
      const n = S.shots.length;
      let sh = S.shots[Math.min(shot, n - 1)];
      while (!done && t >= sh.dur) {
        t -= sh.dur; shot++; fired = new Set(); said = new Set();
        if (shot >= n) { shot = n - 1; t = sh.dur; finish(false); break; }
        sh = S.shots[shot]; sh.set?.(K);
      }
      const u = Math.min(1, t / sh.dur);
      for (const [k, e] of (sh.events || []).entries()) if (t >= e.at && !fired.has(k)) { fired.add(k); e.do(K, snd); }
      for (const [k, l] of (sh.say || []).entries()) if (t >= l.at && !said.has(k)) { said.add(k); setSub(l); }
      if (subT > 0) { subT -= dt; if (subT <= 0) setSub(null); }
      if (S.title && shot === S.title.shot) title.classList.toggle('on', t >= S.title.at);
      sh.update?.(u, t, dt, K);
      const cam = sh.cam(u, t, K);
      camera.fov = cam.fov || 40; camera.updateProjectionMatrix();
      camera.position.set(...cam.pos); camera.lookAt(K.v(cam.look)); camera.updateMatrixWorld();
      focus.set(...(cam.focus || cam.look));
      K.update(dt, camera);
      snd?.update(dt);
    },
  };
}
