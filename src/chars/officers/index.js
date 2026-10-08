// Crowd skins + officer models registry (content for the crowd view's stage-2c hook, src/crowd/view.js header). Chapters
// pick skins with `skin: { foe, ally }` (story/chapters.js); officers with `model: key` in their OFF entry. New skins /
// models register here with one import + one entry. 香港自由戰士 content: ./hk/ (Contracts ids).
import { RIOT, WHITE, BLACKBLOC, CIVIL } from './hk/skins.js';
import { RAPTOR, PLAIN, STAMP, SHOCKER, FIXER, BEAR, BEAR_UNMASKED, CLONE, GASCAP } from './hk/models.js';

export const SKINS = { riot: RIOT, white: WHITE, blackbloc: BLACKBLOC, civil: CIVIL };
export const OFFICER_MODELS = { raptor: RAPTOR, plain: PLAIN, stamp: STAMP, shocker: SHOCKER, fixer: FIXER, bear: BEAR, bear_unmasked: BEAR_UNMASKED, clone: CLONE, gascap: GASCAP };
