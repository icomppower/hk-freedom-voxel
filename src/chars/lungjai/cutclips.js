// 龍仔's cutscene clips (render-only; the cutscene player samples them with rig.sampleClip). Built on his shipped stance
// (./anims.js LJ); new motion only where the scenes need it: the hat lift, the mask pull (ending shot c), and a few held
// poses (the bandaged forearm, asleep on the train, weighing a bamboo pole, the cheer). The pole is hidden by the scene
// whenever both hands are free (lfree / rfree FK arms: shoulder rx, ry, rz, elbow bend, degrees).
import { P, clip, spearAbout } from '../../hero/rig.js';
import { LJ } from './anims.js';

const FREE = { ...LJ, lfree: 1, rfree: 1, armL: [6, 0, 10, 14], armR: [6, 0, 10, 14], hips: [0, 0.92, 0], hipsR: [0, 0, 0],
  spine: [2, 0, 0], chest: [0, 0, 0], head: [0, 0, 0], footL: [0.13, 0.08, 0.06, 0, 6], footR: [-0.13, 0.08, -0.06, 0, -6] };
const F = (spec) => P({ ...FREE, ...spec }, LJ);
const pole = (c, yaw, elev) => spearAbout(c, yaw, elev, 0, 1.05);

export const CUT = {
  /** standing easy, hands free */
  rest: clip([[0, F({})], [0.5, F({ chest: [1, 0, 0], hips: [0, 0.915, 0] })], [1, F({})]], true),
  /** hat lift (2 s): hand up to the brim (0.35), lift (0.5 — the scene swaps the head + puts the hat in the hand), down to
   *  his side holding it (1.0) */
  hatLift: clip([
    [0, F({})],
    [0.35, F({ armR: [-162, 0, 28, 118], head: [-4, 0, 0] }), 'out'],
    [0.5, F({ armR: [-172, 0, 24, 96], head: [-8, 0, 0] })],
    [1, F({ armR: [-8, 0, 14, 28], head: [-6, 0, 0] }), 'io'],
  ]),
  /** mask pull (1.6 s), the hat still in the right hand: left hand to the chin (0.4), pull down (0.6: head swap), lower */
  maskPull: clip([
    [0, F({ armR: [-8, 0, 14, 28] })],
    [0.4, F({ armR: [-8, 0, 14, 28], armL: [-118, 0, -24, 128], head: [4, 0, 0] }), 'out'],
    [0.6, F({ armR: [-8, 0, 14, 28], armL: [-64, 0, -14, 70], head: [-6, 0, 0] }), 'snap'],
    [1, F({ armR: [-8, 0, 14, 28], armL: [-6, 0, 12, 22], head: [-10, 0, 0] })],
  ]),
  /** cheer / wave (1 s loop): both arms up, alternating waves */
  cheer: clip([
    [0, F({ armR: [-168, 0, 22, 18], armL: [-150, 0, 30, 40], head: [-14, 0, 0], hips: [0, 0.93, 0] })],
    [0.5, F({ armR: [-150, 0, 34, 42], armL: [-168, 0, 20, 16], head: [-12, 0, 0], hips: [0, 0.9, 0] })],
    [1, F({ armR: [-168, 0, 22, 18], armL: [-150, 0, 30, 40], head: [-14, 0, 0], hips: [0, 0.93, 0] })],
  ], true),
  /** holding the bandaged left forearm out (between 1 b) */
  forearm: clip([[0, F({ armL: [-78, 0, -8, 24], head: [14, 20, 0] })], [1, F({ armL: [-80, 0, -6, 20], head: [16, 22, 0] })]], true),
  /** asleep sitting up on a train seat (between 2 b): hips low, knees bent, head dropped */
  asleep: clip([
    [0, F({ hips: [0, 0.5, -0.06], footL: [0.15, 0.08, 0.44, 0, 6], footR: [-0.15, 0.08, 0.44, 0, -6], spine: [-4, 0, 0], chest: [8, 0, 0],
      head: [32, 0, 12], armL: [-48, 0, -6, 64], armR: [-48, 0, -6, 64] })],
    [0.5, F({ hips: [0, 0.5, -0.06], footL: [0.15, 0.08, 0.44, 0, 6], footR: [-0.15, 0.08, 0.44, 0, -6], spine: [-4, 0, 0], chest: [9, 0, 0],
      head: [36, 0, 14], armL: [-48, 0, -6, 64], armR: [-48, 0, -6, 64] })],
    [1, F({ hips: [0, 0.5, -0.06], footL: [0.15, 0.08, 0.44, 0, 6], footR: [-0.15, 0.08, 0.44, 0, -6], spine: [-4, 0, 0], chest: [8, 0, 0],
      head: [32, 0, 12], armL: [-48, 0, -6, 64], armR: [-48, 0, -6, 64] })],
  ], true),
  /** weighing a bamboo pole (between 3 b): held level across the chest in both hands, bobbed twice */
  weigh: clip([
    [0, P({ ...LJ, spear: pole([0, 1.02, 0.34], 90, 0), gripL: 1.4, hipsR: [0, 0, 0], chest: [4, 0, 0], head: [14, 0, 0] }, LJ)],
    [0.3, P({ ...LJ, spear: pole([0, 1.14, 0.36], 90, 2), gripL: 1.4, hipsR: [0, 0, 0], chest: [2, 0, 0], head: [10, 0, 0] }, LJ), 'out'],
    [0.55, P({ ...LJ, spear: pole([0, 0.98, 0.34], 90, -2), gripL: 1.4, hipsR: [0, 0, 0], chest: [5, 0, 0], head: [12, 0, 0] }, LJ)],
    [0.8, P({ ...LJ, spear: pole([0, 1.12, 0.36], 90, 1), gripL: 1.4, hipsR: [0, 0, 0], chest: [2, 0, 0], head: [8, 0, 0] }, LJ), 'out'],
    [1, P({ ...LJ, spear: pole([0.1, 1.05, 0.3], 70, 10), gripL: 1.4, hipsR: [0, 0, 0], chest: [3, 0, 0], head: [4, 0, 0] }, LJ)],
  ]),
};
