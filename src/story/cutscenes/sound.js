// Cutscene sound (procedural WebAudio, no files; the game's one AudioContext and master chain via src/audio/audio.js BUS,
// so the master compressor + clip ceiling keep every peak ≤ −2 dBFS). createCutSound(sceneId) starts the scene's beds and
// returns { cue(name, o), update(dt), stop(fade) }; the scene's shot events call cue(). stop() fades everything out in
// `fade` s (skip: 0.5 s) and gives the battle bed back. Everything here is original: no existing song is used or quoted —
// the ending theme is a new melody in D major pentatonic.
import { BUS } from '../../audio/audio.js';

const NOTE = (m) => 440 * 2 ** ((m - 69) / 12);
// the ending theme (original): D major pentatonic (D E F# A B), 84 bpm, 4/4, one bar = 4 beats; [midi, beats] per note
const THEME = [
  [62, 1], [66, 1], [69, 1.5], [71, 0.5], [69, 2], [66, 1], [64, 1],
  [62, 1], [64, 1], [66, 1], [69, 1], [71, 3], [69, 1],
  [74, 1.5], [71, 0.5], [69, 1], [66, 1], [69, 2], [64, 2],
  [66, 1], [64, 1], [62, 1], [59, 1], [62, 4],
];
const CHORDS = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 64]];   // D · Bm · G · A (one per bar)

export function createCutSound(id) {
  const ctx = BUS.ctx;
  if (!ctx || !BUS.mix) return { cue() {}, update() {}, stop() {} };
  const out = ctx.createGain(); out.gain.value = 0; out.connect(BUS.mix);
  const now = () => ctx.currentTime;
  out.gain.setTargetAtTime(1, now(), 0.3);
  const bedWas = BUS.bed ? BUS.bed.gain.value : 1;
  if (BUS.bed) BUS.bed.gain.setTargetAtTime(0.12, now(), 0.4);        // the battle bed steps back under the scene
  const live = [];
  const keep = (n) => { live.push(n); return n; };

  let noiseBuf = null;
  const noise = () => {
    if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); let s = 17; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = s / 1073741823.5 - 1; } }
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; return n;
  };
  const gain = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filt = (type, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const osc = (type, f) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; };
  /** a looping bed: noise through a filter at level v, faded in over `fade` s */
  const bed = (type, f, q, v, fade = 1.5) => { const n = noise(), b = filt(type, f, q), g = gain(0); n.connect(b).connect(g).connect(out); g.gain.setTargetAtTime(v, now(), fade / 3); n.start(); keep(n); return g; };
  /** one envelope-shaped burst of filtered noise */
  const burst = (type, f, q, v, dur, at = 0, sweep = null) => {
    const t = now() + at, n = noise(), b = filt(type, f, q), g = gain(0); n.connect(b).connect(g).connect(out);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(0.02, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    if (sweep) b.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    n.start(t, Math.random() * 1.5); n.stop(t + dur + 0.05);
  };
  const tone = (type, f, v, dur, at = 0, to = null, attack = 0.005) => {
    const t = now() + at, o = osc(type, f), g = gain(0); o.connect(g).connect(out);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + attack); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  };
  /** soft pad: detuned saws under a low-pass, slow attack; returns its gain (for ducking) */
  const pad = (notes, v = 0.05, cut = 900) => {
    const g = gain(0), lp = filt('lowpass', cut, 0.5); lp.connect(g).connect(out);
    for (const m of notes) for (const d of [-6, 6]) { const o = osc('sawtooth', NOTE(m)); o.detune.value = d; o.connect(lp); o.start(); keep(o); }
    g.gain.setTargetAtTime(v, now(), 1.2); return g;
  };
  const beds = {};

  // ---- scene beds
  if (id === 'between1') { beds.rain = bed('bandpass', 5200, 0.4, 0.09); beds.rainLo = bed('lowpass', 500, 0.5, 0.05); beds.hum = bed('lowpass', 140, 1, 0.04); const h = osc('sine', 60), hg = gain(0.012); h.connect(hg).connect(out); h.start(); keep(h); beds.pad = pad([50, 57, 62], 0.03); }
  if (id === 'between2') { beds.rumble = bed('lowpass', 110, 0.8, 0.12); beds.pad = pad([45, 52, 57], 0.028, 700); }
  if (id === 'between3') { beds.wind = bed('lowpass', 700, 0.4, 0.06); beds.pad = pad([43, 50, 55], 0.03); }
  if (id === 'ending') { beds.wind = bed('lowpass', 800, 0.4, 0.045); }
  if (id === 'endscroll') { beds.wind = bed('lowpass', 600, 0.4, 0.06); }

  let clickT = 0, clapT = 0, clap = 0, crackT = 0, crackle = 0, theme = null, rumbleOn = id === 'between2';
  const cues = {
    tape: () => burst('bandpass', 700, 1.2, 0.35, 0.4, 0, 3200),            // a strip of tape torn off the roll
    paper: () => { for (let k = 0; k < 4; k++) burst('highpass', 2600, 0.7, 0.18, 0.07, k * 0.06); },
    chime: () => { tone('sine', 740, 0.14, 1.1); tone('sine', 587, 0.14, 1.4, 0.42); tone('sine', 1480, 0.03, 0.7); },   // original two-tone
    doors: () => burst('bandpass', 900, 0.8, 0.2, 0.6, 0, 400),
    drone: () => { const o = osc('sawtooth', 55), lp = filt('lowpass', 160, 1.5), g = gain(0); o.connect(lp).connect(g).connect(out); g.gain.setTargetAtTime(0.07, now(), 0.6); o.start(); keep(o); },
    buzz: () => { tone('square', 100, 0.05, 0.35); burst('bandpass', 2400, 3, 0.08, 0.3); },
    rumbleOff: () => { rumbleOn = false; beds.rumble?.gain.setTargetAtTime(0.03, now(), 0.4); },
    clack: () => { for (let k = 0; k < 3; k++) burst('bandpass', 1500 + k * 300, 3, 0.22, 0.09, k * 0.18); },
    knock: () => { tone('sine', 190, 0.22, 0.25, 0, 120); burst('bandpass', 700, 5, 0.18, 0.2); },
    engine: () => { const o = osc('sawtooth', 38), lp = filt('lowpass', 120, 1.2), g = gain(0); o.connect(lp).connect(g).connect(out); g.gain.setTargetAtTime(0.08, now(), 1); o.frequency.linearRampToValueAtTime(62, now() + 8); lp.frequency.linearRampToValueAtTime(420, now() + 8); o.start(); keep(o); },
    brush: () => burst('highpass', 1800, 0.6, 0.12, 0.35, 0, 5000),
    stamp: () => { tone('sine', 70, 0.5, 0.7, 0, 38); burst('lowpass', 300, 0.7, 0.3, 0.4); },
    dawn: () => { beds.dawn = pad([50, 54, 57, 64], 0.045, 1200); beds.water = bed('lowpass', 380, 0.6, 0.05); beds.crowd = bed('bandpass', 900, 0.5, 0.025); },   // D add9
    roar: () => { beds.crowd?.gain.setTargetAtTime(0.11, now(), 0.8); clap = 1; },
    hush: () => { for (const k of ['crowd', 'dawn', 'water', 'wind']) beds[k]?.gain.setTargetAtTime(0.004, now(), 0.25); clap = 0; },
    tock: () => { tone('sine', 880, 0.2, 0.12, 0, 480); burst('bandpass', 1800, 4, 0.08, 0.06); },
    softTock: () => { tone('sine', 700, 0.1, 0.1, 0, 420); },
    whoosh: () => burst('bandpass', 400, 0.9, 0.22, 0.45, 0, 2600),
    cheer: () => { beds.crowd?.gain.setTargetAtTime(0.14, now(), 0.3); beds.dawn?.gain.setTargetAtTime(0.04, now(), 1); burst('bandpass', 1200, 0.5, 0.2, 1.6); },
    boom: () => { tone('sine', 80, 0.45, 1.2, 0, 28); burst('lowpass', 400, 0.7, 0.3, 0.9); crackle = Math.max(crackle, 1.6); },
    theme: () => { theme = { t0: now() + 0.2, i: 0, next: now() + 0.2, bar: 0, nextBar: now() + 0.2 }; beds.themePad = gain(0.9); beds.themePad.connect(out); },
    titleChord: () => { const g = pad([50, 57, 62, 66, 69, 74], 0.06, 1600); beds.title = g; },
  };
  const BEAT = 60 / 84;

  return {
    cue(name, o) { cues[name]?.(o); },
    update(dt) {
      const t = now();
      if (rumbleOn && (clickT -= dt) <= 0) { clickT = 0.62; burst('bandpass', 2600, 4, 0.12, 0.05); burst('bandpass', 2400, 4, 0.1, 0.05, 0.11); }   // rail clicks
      if (clap && (clapT -= dt) <= 0) { clapT = 60 / 120; for (let k = 0; k < 3; k++) burst('bandpass', 1400 + k * 250, 2, 0.05, 0.07, k * 0.012); }   // in-time clapping
      if (crackle > 0) { crackle -= dt; if ((crackT -= dt) <= 0) { crackT = 0.03 + Math.random() * 0.05; burst('highpass', 4000, 0.7, 0.05, 0.03); } }
      if (theme) {                                                     // the theme: lead + a chord and a low drum per bar
        while (theme.nextBar < t + 0.25) {
          const at = theme.nextBar - t, ch = CHORDS[theme.bar % 4];
          for (const m of ch) tone('triangle', NOTE(m), 0.03, BEAT * 4 * 0.95, Math.max(0, at), null, 0.12);
          tone('sine', 55, 0.4, 0.6, Math.max(0, at), 36); burst('lowpass', 200, 0.7, 0.2, 0.3, Math.max(0, at));
          theme.bar++; theme.nextBar += BEAT * 4;
        }
        while (theme.next < t + 0.25) {
          const [m, b] = THEME[theme.i % THEME.length], at = Math.max(0, theme.next - t);
          tone('triangle', NOTE(m + 12), 0.085, BEAT * b * 0.92, at, null, 0.02); tone('sine', NOTE(m), 0.05, BEAT * b * 0.92, at, null, 0.02);
          theme.i++; theme.next += BEAT * b;
        }
      }
    },
    stop(fade = 1) {
      const t = now();
      out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + fade);
      if (BUS.bed) BUS.bed.gain.setTargetAtTime(bedWas, t + fade, 0.4);
      theme = null; clap = 0; crackle = 0; rumbleOn = false;
      setTimeout(() => { for (const n of live) { try { n.stop(); } catch { /* already stopped */ } } out.disconnect(); }, (fade + 0.1) * 1000);
    },
  };
}
