// 阿角 Ah Gok — 牧杖 shepherd's crook moveset (data only; format: src/hero/moves.js header). Heavy: wide sweeps, the hook
// pulls, strong charges. All timings in 60 Hz sim frames.
//
// Frame data (Notion "Box Moveset 動作樣本"): N1 34 f hit 13–17 · N2 40 f 16–22 · N3 36 f 14–18 · C1 56 f 18–21 · 44–48.
// N-string hit onsets 28 sf apart (target 26–30, Character Sheets): onset spacing = cancel_k + tell_k+1 − tell_k
// (n1 13 → n2 41 → n3 69 → n4 97 → n5 125 → n6 153).
// `pull` (C1's hook, the Musou's round-up): combat has no pull reaction, so the hook hit is a flinch and the kit's sim
// (./musou.js hookStep) reels every soldier it caught in to the crook over the next frames — deterministic, kit-owned.
import { prepMoves } from '../../hero/moveset.js';

const ONCE = 99;
export const MOVES = {
  // N1 勾腳掃 hook sweep: low hook across the front, right → left, catches the legs
  n1: { frames: 34, next: 'n2', charge: 'c2', cancel: 25, branch: 18, dodgeCancel: 18, steer: 5, lunge: [[8, 16, 0.35]],
    hits: [{ f: [13, 17], sweep: 1, shape: 'arc', range: 2.3, ang: 170, dmg: 16, kb: 'push', force: 5, hitstop: 3 }] },
  // N2 牧杖橫掃 wide crook sweep: big two-handed sweep left → right, the body turns 60° into it
  n2: { frames: 40, next: 'n3', charge: 'c3', cancel: 30, branch: 23, dodgeCancel: 23, steer: 4, lunge: [[10, 20, 0.25]],
    hits: [{ f: [16, 22], sweep: -1, shape: 'arc', range: 2.6, ang: 260, dir: -20, dmg: 18, kb: 'blow', force: 7, lift: 3, hitstop: 3 }] },
  // N3 頂杖 crook thrust: step-in thrust with the heel of the crook
  n3: { frames: 36, next: 'n4', charge: 'c4', cancel: 26, branch: 19, dodgeCancel: 19, steer: 5, lunge: [[10, 16, 0.6]],
    hits: [{ f: [14, 18], every: ONCE, shape: 'line', len: 2.7, width: 1.2, dmg: 20, kb: 'push', force: 7, hitstop: 3 }] },
  // N4 overhead crook chop: raised overhead, brought down two-handed in front
  n4: { frames: 42, next: 'n5', charge: 'c5', cancel: 28, branch: 22, dodgeCancel: 22, steer: 6, lunge: [[6, 16, 0.5]],
    hits: [{ f: [16, 19], every: ONCE, shape: 'arc', range: 2.6, ang: 100, dmg: 20, kb: 'push', force: 6, hitstop: 4 }] },
  // N5 backhand hook sweep: chambered at the right hip, the hook rips right → left through the ring
  n5: { frames: 44, next: 'n6', charge: 'c6', cancel: 30, branch: 22, dodgeCancel: 22, steer: 4, lunge: [[6, 14, 0.4]],
    hits: [{ f: [16, 21], sweep: 1, shape: 'arc', range: 2.6, ang: 220, dir: 20, dmg: 18, kb: 'blow', force: 8, lift: 3, hitstop: 3 }] },
  // N6 full spin: one planted 360° turn with the crook held out at arm's length, low finish held
  n6: { frames: 56, next: 'n1', charge: 'c1', cancel: 44, dodgeCancel: 26, steer: 6, lunge: [[2, 12, 0.8]], armor: true,
    hits: [{ f: [14, 20], sweep: -1, dir: -180, shape: 'circle', range: 2.8, dmg: 28, kb: 'blow', force: 12, lift: 6, hitstop: 7, heavy: true }] },

  // C1 勾拉・頓杖 hook, drag and slam: the hook shoots out and catches one line of soldiers (pull), drags them in to the
  // crook, then the crook comes down on the pile
  c1: { frames: 56, cancel: 50, dodgeCancel: 49, steer: 12, lunge: [[6, 12, 0.4], [24, 32, -0.4]], armor: true,
    hits: [{ f: [18, 21], every: ONCE, shape: 'line', len: 3, width: 1.6, dmg: 10, kb: 'flinch', force: 0, hitstop: 3, pull: 1 },
      { f: [44, 48], every: ONCE, shape: 'arc', range: 2.4, ang: 110, dmg: 26, kb: 'blow', force: 8, lift: 5, hitstop: 6, heavy: true }] },
  // C2 (N1 → C) hook launcher: crouch, crook low in front, rip it straight up under the ring
  c2: { frames: 64, cancel: 56, dodgeCancel: 46, steer: 10, lunge: [[4, 12, 0.5]], armor: true,
    hits: [{ f: [16, 19], every: ONCE, shape: 'arc', range: 2.8, ang: 120, dmg: 18, kb: 'launch', force: 2, lift: 10, hitstop: 6, heavy: true }] },
  // C3 (N2 → C) wide 270° sweep: chambered far right, the crook sweeps round the front and the left flank
  c3: { frames: 70, cancel: 62, dodgeCancel: 50, steer: 12, lunge: [[10, 20, 0.6]], armor: true,
    hits: [{ f: [20, 30], sweep: 1, sweepN: 8, shape: 'arc', range: 3.4, ang: 270, dmg: 22, kb: 'blow', force: 10, lift: 4, hitstop: 5, heavy: true }] },
  // C4 (N3 → C) planted-crook shockwave: crook raised, driven into the ground, a ring bursts out from it
  c4: { frames: 76, cancel: 68, dodgeCancel: 56, steer: 14, lunge: [[4, 12, 0.4]], armor: true,
    hits: [{ f: [26, 29], every: ONCE, shape: 'circle', range: 2.4, dmg: 14, kb: 'launch', force: 2, lift: 6, hitstop: 4 },
      { f: [40, 43], every: ONCE, shape: 'circle', range: 4.6, dmg: 26, kb: 'blow', force: 13, lift: 6, hitstop: 7, heavy: true }] },
  // C5 (N4 → C) vaulting kick: plants the crook ahead, vaults over the shaft kicking through the front rank, lands
  c5: { frames: 80, cancel: 72, dodgeCancel: 60, steer: 12, lunge: [[14, 44, 2.2]], armor: true, leap: [18, 8], landFrame: 46,
    hits: [{ f: [28, 34], every: 3, shape: 'arc', range: 2.4, ang: 140, dmg: 10, kb: 'blow', force: 6, lift: 3, hitstop: 3, yMax: 3 },
      { f: [46, 49], every: ONCE, shape: 'circle', range: 3, dmg: 20, kb: 'push', force: 8, hitstop: 5, heavy: true }] },
  // C6 (N5 → C) full spin: three turns with the crook out that stagger the ring in place, then the knock-back that
  // throws the whole ring out
  c6: { frames: 96, cancel: 88, dodgeCancel: 76, steer: 8, lunge: [[8, 60, 1.2]], armor: true,
    hits: [{ f: [12, 56], shape: 'circle', range: 3.2, dmg: 6, kb: 'flinch', force: 1, hitstop: 1, every: 11 },
      { f: [64, 68], every: ONCE, shape: 'circle', range: 4.2, dmg: 30, kb: 'blow', force: 15, lift: 6, hitstop: 8, heavy: true }] },

  // Dash attack (run + attack): running low sweep with the hook, a step of drift after it
  dash: { frames: 60, cancel: 52, dodgeCancel: 30, steer: 3, lunge: [[0, 24, 4.8, 'lin'], [24, 34, 1.2]],
    hits: [{ f: [20, 26], sweep: 1, shape: 'arc', range: 3.0, ang: 200, dmg: 18, kb: 'blow', force: 10, lift: 3, hitstop: 4, heavy: true }] },
  // Jump attack: a crook swipe every 13 sf while hovering
  jatk: { frames: 24, air: true, hover: 2.4, next: 'jatk', charge: 'jc', cancel: 13, dodgeCancel: 99, steer: 3,
    hits: [{ f: [6, 10], every: ONCE, shape: 'arc', range: 3.2, ang: 200, dmg: 12, kb: 'flinch', force: 3, hitstop: 2, yMax: 4.5 }] },
  // Jump charge: crook raised at the apex, plunge, the hook bites the ground, shockwave
  jc: { frames: 56, air: true, hover: 3, landFrame: 36, hang: [6, 30], plunge: [30, -60], cancel: 50, dodgeCancel: 40, steer: 12, armor: true,
    hits: [{ f: [36, 39], every: ONCE, shape: 'circle', range: 4.2, dmg: 22, kb: 'launch', force: 5, lift: 8, hitstop: 7, heavy: true }] },
};

export const AIR_CHAIN_MAX = 8;
prepMoves(MOVES);
