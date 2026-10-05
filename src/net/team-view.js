// Team Musou 齊上齊落 presentation (render-only: reads game.coop.team / the heroes, never writes sim state). Co-op pages
// only (src/net/page.js). Yellow / black palette, procedural shapes, no flags or emblems.
//  · ready (both gauges, both standing, ≤ 6 m): a thin gold light line links the heroes, both gauge bars pulse gold
//    (#hud .mu.team), a small 「齊上齊落」 prompt above the HUD
//  · calling: a shrinking 90-tick ring on the ground round both heroes; the partner's screen shows 「齊上齊落！」 and the
//    Musou button flashes (#touch .b-mu.team); the caller's shows "waiting for partner"
//  · firing: the title card (龍仔 × 小美) over the ~1 s cinematic (+ a procedural sound sting), then the umbrella wall
//    popping open round 小美, a gold trail behind 龍仔's two laps, the two ring sweeps, and the finisher: a light pillar
//    and a double shockwave (RADIUS from the sim)
// #debug: root.userData.debug = { line, ring, umbrellas, trail, arc, blast, pillar, card, prompt } (bench/net/team-look.mjs).
import * as THREE from 'three';
import { on } from '../core/events.js';
import { BUS } from '../audio/audio.js';
import { TEAM, eligible } from '../combat/team-musou.js';

const GOLD = 0xf2c14e, INK = 0x14100c;
const CSS = `
#team { position: fixed; inset: 0; pointer-events: none; z-index: 6; font-family: var(--kai, serif); }
#team .pr { position: absolute; left: 50%; bottom: 7.2rem; translate: -50% 0; padding: 2px 12px; border-radius: 6px; font: 700 16px/1.3 var(--brush, serif);
  color: #ffe3a0; background: rgba(20,16,12,.7); border: 2px solid #f2c14e; text-shadow: 0 0 8px #ffb030; letter-spacing: .2em; }
#team .call { position: absolute; left: 50%; top: 22%; translate: -50% 0; padding: 6px 18px; border-radius: 8px; text-align: center;
  background: rgba(20,16,12,.78); border: 3px solid #f2c14e; color: #f4ead8; font: 700 30px/1.2 var(--brush, serif); }
#team .call small { display: block; font: 600 12px/1.3 var(--sans, sans-serif); letter-spacing: .08em; color: #e8d7b0; }
#team .card { position: absolute; left: 0; right: 0; top: 38%; text-align: center; padding: 10px 0; background: linear-gradient(90deg, transparent, rgba(20,16,12,.9) 20%, rgba(20,16,12,.9) 80%, transparent);
  border-top: 3px solid #f2c14e; border-bottom: 3px solid #f2c14e; color: #f2c14e; font: 700 64px/1 var(--brush, serif); letter-spacing: .3em; text-shadow: .2rem .3rem 0 #000; }
#team .card small { display: block; margin-top: 6px; font: 700 13px/1 var(--sans, sans-serif); letter-spacing: .5em; color: #f4ead8; }
#team [hidden] { display: none; }
@keyframes teamPulse { 0%, 100% { filter: none; } 50% { filter: brightness(1.6) drop-shadow(0 0 10px #ffc040); } }
#hud .mu.team div { animation: teamPulse .7s ease-in-out infinite; box-shadow: 0 0 0 .15rem #f2c14e, 0 0 1.4rem rgba(255,200,80,.95); }
#touch .b-mu.team { animation: teamPulse .35s ease-in-out infinite; background: #b3261e !important; border-color: #f2c14e !important; }
`;

export function createTeamView(scene, game, C) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  const el = document.createElement('div'); el.id = 'team';
  el.innerHTML = `<div class="pr" hidden>齊上齊落 · 無雙 I</div><div class="call" hidden></div><div class="card" hidden>齊上齊落<small>龍仔 × 小美 · TEAM MUSOU</small></div>`;
  document.body.append(el);
  const prompt = el.querySelector('.pr'), call = el.querySelector('.call'), card = el.querySelector('.card');

  const root = new THREE.Group(); root.name = 'team-musou'; scene.add(root);
  const add = (o) => { o.visible = false; o.frustumCulled = false; root.add(o); return o; };
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffe8a0, transparent: true, opacity: 0.8, depthWrite: false });
  const lineGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const line = add(new THREE.Line(lineGeo, lineMat));
  const flat = (geo, color, op) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; return m; };
  const RING_SEG = 48;
  const rings = [0, 1].map(() => add(flat(new THREE.RingGeometry(1.1, 1.35, RING_SEG, 1), GOLD, 0.85)));
  const arc = add(flat(new THREE.RingGeometry(TEAM.radius - 0.7, TEAM.radius, 96, 1), 0xffe8a0, 0.7));
  const blast = add(flat(new THREE.RingGeometry(0.85, 1, 96, 1), 0xfff2c0, 0.8));
  const blast2 = add(flat(new THREE.RingGeometry(0.9, 1, 96, 1), GOLD, 0.7));
  // a thin light beam on impact (normal blending: an additive column blew out the HDR bloom into banded black stripes)
  const pillar = add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 14, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe8a0, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })));
  // 龍仔's lap trail: glowing gold slabs along the last stretch of his circle
  const TRAIL = 28, trailGeo = new THREE.BoxGeometry(0.5, 0.08, 0.5), trail = add(new THREE.Group());
  const trailMats = Array.from({ length: TRAIL }, (_, k) => new THREE.MeshBasicMaterial({ color: k < 6 ? 0xfff2c0 : GOLD, transparent: true, opacity: 0.9 * (1 - k / TRAIL), depthWrite: false, blending: THREE.AdditiveBlending }));
  for (let k = 0; k < TRAIL; k++) trail.add(new THREE.Mesh(trailGeo, trailMats[k]));
  // the umbrella wall: open umbrellas (black canopy, gold rim, gold handle) round the pair
  const wall = add(new THREE.Group());
  const canopy = new THREE.ConeGeometry(0.75, 0.42, 10, 1, true), rim = new THREE.TorusGeometry(0.75, 0.04, 4, 10), stick = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 5);
  const mCan = new THREE.MeshBasicMaterial({ color: INK, side: THREE.DoubleSide }), mGold = new THREE.MeshBasicMaterial({ color: GOLD });
  const UMB = 10;
  for (let k = 0; k < UMB; k++) {
    const u = new THREE.Group();
    const c = new THREE.Mesh(canopy, mCan); c.position.y = 0.21;
    const r = new THREE.Mesh(rim, mGold); r.rotation.x = Math.PI / 2;
    const s = new THREE.Mesh(stick, mGold); s.position.y = -0.45;
    u.add(c, r, s); u.rotation.z = -Math.PI / 2;           // canopy facing outward
    const piv = new THREE.Group(); piv.add(u); u.position.x = TEAM.wallR * 0.85; u.position.y = 1.1;
    piv.rotation.y = (k / UMB) * Math.PI * 2;
    wall.add(piv);
  }
  const dbg = { line: false, ring: 0, umbrellas: 0, trail: 0, arc: 0, blast: 0, pillar: 0, card: false, prompt: false, call: '' };
  dbg.frames = {};                                          // per key: rendered frames it was on (the look gate reads these)
  root.userData.debug = dbg;

  // procedural sting: two gong strikes and a rising fifth (into the game's mix bus once the audio graph exists)
  on('team:start', () => {
    const ctx = BUS.ctx, out = BUS.mix;
    if (!ctx || !out) return;
    const t0 = ctx.currentTime;
    const tone = (f, t, d, g, type = 'sine') => {
      const o = ctx.createOscillator(), a = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0 + t); o.frequency.exponentialRampToValueAtTime(f * 0.985, t0 + t + d);
      a.gain.setValueAtTime(0.0001, t0 + t); a.gain.exponentialRampToValueAtTime(g, t0 + t + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t0 + t + d);
      o.connect(a).connect(out); o.start(t0 + t); o.stop(t0 + t + d + 0.05);
    };
    tone(110, 0, 1.4, 0.35); tone(164.8, 0, 1.2, 0.18); tone(110, 0.32, 1.6, 0.4); tone(220, 0.32, 1.2, 0.15, 'triangle');
    tone(329.6, 0.6, 0.9, 0.12, 'sawtooth'); tone(440, 0.75, 0.8, 0.1, 'triangle');
  });

  const muEl = () => document.querySelector('#hud .mu'), btnEl = () => document.querySelector('#touch .b-mu');
  return {
    update() {
      const H = game.heroes, T = game.coop?.team;
      const live = !!(H && T && C.inBattle);
      root.visible = live; el.hidden = !live;
      if (!live) { muEl()?.classList.remove('team'); btnEl()?.classList.remove('team'); return; }
      const [a, b] = H, ready = T.phase === 'idle' && eligible(game), calling = T.phase === 'calling', firing = T.phase === 'firing';
      // ready: link line + gauge pulse + prompt
      line.visible = ready || calling;
      if (line.visible) {
        const p = lineGeo.attributes.position.array;
        p[0] = a.x; p[1] = a.y + 1.1; p[2] = a.z; p[3] = b.x; p[4] = b.y + 1.1; p[5] = b.z;
        lineGeo.attributes.position.needsUpdate = true;
        lineMat.opacity = 0.55 + 0.35 * Math.sin(performance.now() / 120);
      }
      muEl()?.classList.toggle('team', ready || calling);
      prompt.hidden = !ready;
      // calling: the ring timer round both, the partner's call card + flashing Musou button
      const left = calling ? Math.max(0, TEAM.window - T.t) : 0, segs = Math.ceil(RING_SEG * left / TEAM.window);
      rings.forEach((r, i) => {
        r.visible = calling;
        if (!calling) return;
        r.position.set(H[i].x, H[i].y + 0.05, H[i].z);
        r.geometry.setDrawRange(0, segs * 6);
      });
      const asked = calling && T.caller !== C.you;
      btnEl()?.classList.toggle('team', asked);
      const callH = !calling ? '' : asked ? `齊上齊落！<small>按 無雙 PRESS MUSOU · ${(left / 60).toFixed(1)} s</small>` : `齊上齊落<small>等隊友回應 WAITING FOR PARTNER · ${(left / 60).toFixed(1)} s</small>`;
      if (call.dataset.h !== callH) { call.dataset.h = callH; call.innerHTML = callH; }
      call.hidden = !callH;
      // firing
      const t = firing ? T.t : -1;
      card.hidden = !(firing && t < TEAM.cine);
      wall.visible = firing && t >= TEAM.cine;
      if (wall.visible) {                                         // pops open with an overshoot, spins, folds away at the end
        const o = Math.min(1, (t - TEAM.cine) / 8), pop = o < 1 ? o * (1.25 - 0.25 * o) : 1 + 0.08 * Math.sin((t - TEAM.cine - 8) * 0.5) * Math.max(0, 1 - (t - TEAM.cine - 8) / 20);
        wall.position.set(T.cx, 0, T.cz); wall.rotation.y = t * 0.16; wall.scale.setScalar(pop * Math.min(1, (TEAM.fin + 10 - t) / 14));
      }
      trail.visible = firing && t > TEAM.lap[0] - 4 && t <= TEAM.lap[1] + 10;
      if (trail.visible) {
        const span = Math.PI * 2 * TEAM.laps / (TEAM.lap[1] - TEAM.lap[0]), a = T.lapAng ?? 0, fade = Math.min(1, (TEAM.lap[1] + 10 - t) / 10);
        trail.children.forEach((m, k) => { const b = a - k * span * 0.6; m.position.set(T.cx + Math.sin(b) * TEAM.lapR, 0.1 + 0.9 * (1 - k / TRAIL), T.cz + Math.cos(b) * TEAM.lapR); m.rotation.y = b; m.material.opacity = 0.9 * (1 - k / TRAIL) * fade; });
      }
      const sw = firing ? TEAM.arcs.find((x) => t > x - 15 && t <= x + 20) : undefined;
      arc.visible = sw !== undefined;
      if (arc.visible) {
        const u = Math.min(1, (t - sw + 15) / 30);
        arc.position.set(T.cx, 0.08, T.cz); arc.rotation.z = T.yaw + t * 0.2;
        arc.geometry.setDrawRange(0, Math.ceil(96 * u) * 6); arc.material.opacity = 0.75 * Math.min(1, (sw + 20 - t) / 10);
      }
      blast.visible = firing && t >= TEAM.blast && t < TEAM.blast + 20;
      if (blast.visible) { const u = (t - TEAM.blast) / 20; blast.position.set(T.cx, 0.1, T.cz); blast.scale.setScalar(0.5 + TEAM.radius * (1 - (1 - u) ** 3)); blast.material.opacity = 0.85 * (1 - u); }
      blast2.visible = firing && t >= TEAM.blast + 5 && t < TEAM.blast + 20;
      if (blast2.visible) { const u = (t - TEAM.blast - 5) / 15; blast2.position.set(T.cx, 0.12, T.cz); blast2.scale.setScalar(0.5 + TEAM.radius * 0.8 * (1 - (1 - u) ** 2)); blast2.material.opacity = 0.75 * (1 - u); }
      pillar.visible = firing && t >= TEAM.blast && t < TEAM.blast + 14;
      if (pillar.visible) { const u = (t - TEAM.blast) / 14; pillar.position.set(T.cx, 7, T.cz); pillar.scale.set(1 + u, 1, 1 + u); pillar.material.opacity = 0.35 * (1 - u); }
      Object.assign(dbg, { line: line.visible, ring: calling ? segs : 0, umbrellas: wall.visible ? UMB : 0, trail: trail.visible ? TRAIL : 0, arc: arc.visible ? 1 : 0, blast: blast.visible ? 1 : 0, pillar: pillar.visible ? 1 : 0, card: !card.hidden, prompt: !prompt.hidden, call: asked ? 'asked' : calling ? 'waiting' : '' });
      for (const k of ['line', 'ring', 'umbrellas', 'trail', 'arc', 'blast', 'pillar', 'card', 'prompt', 'call']) if (dbg[k]) dbg.frames[k] = (dbg.frames[k] || 0) + 1;
    },
    /** ?coopdebug line. */
    status() {
      const T = game.coop?.team;
      if (!T) return '-';
      return T.phase === 'firing' ? `firing ${T.t}/${TEAM.end}` : T.phase === 'calling' ? `calling (${TEAM.window - T.t} ticks left, caller ${T.caller})` : eligible(game) ? 'ready' : 'idle';
    },
  };
}
