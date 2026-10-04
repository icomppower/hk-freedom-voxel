// Co-op boot (runs before src/main.js: its own <script type="module"> in index.html). With ?coop (or the test-only
// ?dmath) the deterministic math (src/core/dmath.js) replaces Math.sin / cos / atan2 / exp / pow / hypot … before any
// game module evaluates, so lockstep peers on different engines (V8 / JavaScriptCore) step bit-identical sims. Without
// either parameter this module does nothing: solo play keeps the native Math.
import { install } from '../core/dmath.js';

const q = new URLSearchParams(location.search);
if (q.has('coop') || q.has('dmath')) install();
