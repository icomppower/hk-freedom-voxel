// Crowd skins + officer models registry (content for the crowd view's stage-2c hook, src/crowd/view.js header). Chapters
// pick skins with `skin: { foe, ally }` (story/chapters.js); officers with `model: key` in their OFF entry. New skins /
// models register here with one import + one entry.
import { WOLF } from './wolf.js';
import { SHEEP } from './sheep.js';

export const SKINS = { wolf: WOLF, sheep: SHEEP };
export const OFFICER_MODELS = {};
