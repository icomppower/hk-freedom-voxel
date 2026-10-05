// Deterministic transcendental math (co-op determinism fix). Native Math.sin / cos / atan2 / exp / pow / hypot are not
// required to be correctly rounded, and V8 builds (Node vs Chrome, seen at frame 17 of ch1-zhaoyun) and JavaScriptCore
// (Safari / iOS) differ in the last ulp — enough to split a lockstep sim within seconds. These are ports of fdlibm 5.3
// (sin / cos via __kernel_sin / __kernel_cos / __ieee754_rem_pio2, atan / atan2, exp, log) built only from + − × ÷ and
// sqrt, which IEEE 754 makes bit-exact on every engine. pow / hypot / tan / asin / acos are composed from them.
//   install()   replaces the Math functions globally (co-op only: src/net/boot.js runs it before any game module loads,
//               ?coop pages and the headless co-op clients). Solo play never calls it.
//   D           the functions themselves.
const F = new Float64Array(1), W = new Int32Array(F.buffer);       // little-endian: W[1] = high word, W[0] = low word
const hi = (x) => { F[0] = x; return W[1]; };
const lo = (x) => { F[0] = x; return W[0]; };
const withHi = (x, h) => { F[0] = x; W[1] = h; return F[0]; };
const fromWords = (h, l) => { W[1] = h; W[0] = l; return F[0]; };
const sqrt = Math.sqrt, fabs = Math.abs;

// ---- sin / cos
const S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04,
  S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
function kSin(x, y, iy) {
  const ix = hi(x) & 0x7fffffff;
  if (ix < 0x3e400000 && (x | 0) === 0) return x;
  const z = x * x, v = z * x, r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
  return iy === 0 ? x + v * (S1 + z * r) : x - ((z * (0.5 * y - v * r) - y) - v * S1);
}
const C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05,
  C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;
function kCos(x, y) {
  const ix = hi(x) & 0x7fffffff;
  if (ix < 0x3e400000 && (x | 0) === 0) return 1;
  const z = x * x, r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
  if (ix < 0x3fd33333) return 1 - (0.5 * z - (z * r - x * y));
  const qx = ix > 0x3fe90000 ? 0.28125 : fromWords(ix - 0x00200000, 0);
  const hz = 0.5 * z - qx, a = 1 - qx;
  return a - (hz - (z * r - x * y));
}
const invpio2 = 6.36619772367581382433e-01, pio2_1 = 1.57079632673412561417e+00, pio2_1t = 6.07710050650619224932e-11,
  pio2_2 = 6.07710050630396597660e-11, pio2_2t = 2.02226624879595063154e-21, pio2_3 = 2.02226624871116645580e-21,
  pio2_3t = 8.47842766036889956997e-32;
const Y = [0, 0];
/** x = n·π/2 + (Y[0] + Y[1]); returns n. Cody-Waite in three steps (fdlibm's medium path, used for every |x| > π/4:
 *  exact to |x| < 2^20·π/2, still deterministic beyond). */
function remPio2(x) {
  const hx = hi(x), ix = hx & 0x7fffffff;
  if (ix <= 0x3fe921fb) { Y[0] = x; Y[1] = 0; return 0; }
  if (ix < 0x4002d97c) {
    if (hx > 0) {
      let z = x - pio2_1;
      if (ix !== 0x3ff921fb) { Y[0] = z - pio2_1t; Y[1] = (z - Y[0]) - pio2_1t; }
      else { z -= pio2_2; Y[0] = z - pio2_2t; Y[1] = (z - Y[0]) - pio2_2t; }
      return 1;
    }
    let z = x + pio2_1;
    if (ix !== 0x3ff921fb) { Y[0] = z + pio2_1t; Y[1] = (z - Y[0]) + pio2_1t; }
    else { z += pio2_2; Y[0] = z + pio2_2t; Y[1] = (z - Y[0]) + pio2_2t; }
    return -1;
  }
  let t = fabs(x);
  const n = (t * invpio2 + 0.5) | 0, fn = n;
  let r = t - fn * pio2_1, w = fn * pio2_1t;
  const j = ix >> 20;
  Y[0] = r - w;
  let i = j - ((hi(Y[0]) >> 20) & 0x7ff);
  if (i > 16) {
    t = r; w = fn * pio2_2; r = t - w; w = fn * pio2_2t - ((t - r) - w); Y[0] = r - w;
    i = j - ((hi(Y[0]) >> 20) & 0x7ff);
    if (i > 49) { t = r; w = fn * pio2_3; r = t - w; w = fn * pio2_3t - ((t - r) - w); Y[0] = r - w; }
  }
  Y[1] = (r - Y[0]) - w;
  if (hx < 0) { Y[0] = -Y[0]; Y[1] = -Y[1]; return -n; }
  return n;
}
function sin(x) {
  x = +x;
  const ix = hi(x) & 0x7fffffff;
  if (ix <= 0x3fe921fb) return kSin(x, 0, 0);
  if (ix >= 0x7ff00000) return x - x;
  const n = remPio2(x) & 3;
  return n === 0 ? kSin(Y[0], Y[1], 1) : n === 1 ? kCos(Y[0], Y[1]) : n === 2 ? -kSin(Y[0], Y[1], 1) : -kCos(Y[0], Y[1]);
}
function cos(x) {
  x = +x;
  const ix = hi(x) & 0x7fffffff;
  if (ix <= 0x3fe921fb) return kCos(x, 0);
  if (ix >= 0x7ff00000) return x - x;
  const n = remPio2(x) & 3;
  return n === 0 ? kCos(Y[0], Y[1]) : n === 1 ? -kSin(Y[0], Y[1], 1) : n === 2 ? -kCos(Y[0], Y[1]) : kSin(Y[0], Y[1], 1);
}
const tan = (x) => sin(x) / cos(x);

// ---- atan / atan2
const atanhi = [4.63647609000806093515e-01, 7.85398163397448278999e-01, 9.82793723247329054082e-01, 1.57079632679489655800e+00];
const atanlo = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
const aT = [3.33333333333329318027e-01, -1.99999999998764832476e-01, 1.42857142725034663711e-01, -1.11111104054623557880e-01,
  9.09088713343650656196e-02, -7.69187620504482999495e-02, 6.66107313738753120669e-02, -5.83357013379057348645e-02,
  4.97687799461593236017e-02, -3.65315727442169155270e-02, 1.62858201153657823623e-02];
function atan(x) {
  x = +x;
  const hx = hi(x), ix = hx & 0x7fffffff;
  let id;
  if (ix >= 0x44100000) {
    if (x !== x) return x + x;
    return hx > 0 ? atanhi[3] + atanlo[3] : -atanhi[3] - atanlo[3];
  }
  if (ix < 0x3fdc0000) {
    if (ix < 0x3e200000) return x;
    id = -1;
  } else {
    x = fabs(x);
    if (ix < 0x3ff30000) {
      if (ix < 0x3fe60000) { id = 0; x = (2 * x - 1) / (2 + x); } else { id = 1; x = (x - 1) / (x + 1); }
    } else if (ix < 0x40038000) { id = 2; x = (x - 1.5) / (1 + 1.5 * x); } else { id = 3; x = -1 / x; }
  }
  const z = x * x, w = z * z;
  const s1 = z * (aT[0] + w * (aT[2] + w * (aT[4] + w * (aT[6] + w * (aT[8] + w * aT[10])))));
  const s2 = w * (aT[1] + w * (aT[3] + w * (aT[5] + w * (aT[7] + w * aT[9]))));
  if (id < 0) return x - x * (s1 + s2);
  const r = atanhi[id] - ((x * (s1 + s2) - atanlo[id]) - x);
  return hx < 0 ? -r : r;
}
const pi = 3.1415926535897931160e+00, pi_o_2 = 1.5707963267948965580e+00, pi_o_4 = 7.8539816339744827900e-01,
  pi_lo = 1.2246467991473531772e-16;
function atan2(y, x) {
  y = +y; x = +x;
  if (x !== x || y !== y) return x + y;
  const hx = hi(x), lx = lo(x), ix = hx & 0x7fffffff, hy = hi(y), ly = lo(y), iy = hy & 0x7fffffff;
  if (hx === 0x3ff00000 && lx === 0) return atan(y);
  const m = ((hy >>> 31) & 1) | ((hx >>> 30) & 2);
  if ((iy | ly) === 0) return m < 2 ? y : m === 2 ? pi : -pi;
  if ((ix | lx) === 0) return hy < 0 ? -pi_o_2 : pi_o_2;
  if (ix === 0x7ff00000) {
    if (iy === 0x7ff00000) return [pi_o_4, -pi_o_4, 3 * pi_o_4, -3 * pi_o_4][m];
    return [0, -0, pi, -pi][m];
  }
  if (iy === 0x7ff00000) return hy < 0 ? -pi_o_2 : pi_o_2;
  const k = (iy - ix) >> 20;
  let z;
  if (k > 60) z = pi_o_2 + 0.5 * pi_lo;
  else if (hx < 0 && k < -60) z = 0;
  else z = atan(fabs(y / x));
  return m === 0 ? z : m === 1 ? -z : m === 2 ? pi - (z - pi_lo) : (z - pi_lo) - pi;
}
const asin = (x) => (fabs(x) > 1 ? NaN : atan2(x, sqrt((1 - x) * (1 + x))));
const acos = (x) => (fabs(x) > 1 ? NaN : atan2(sqrt((1 - x) * (1 + x)), x));

// ---- exp / log
const o_threshold = 7.09782712893383973096e+02, u_threshold = -7.45133219101941108420e+02,
  ln2HI = [6.93147180369123816490e-01, -6.93147180369123816490e-01], ln2LO = [1.90821492927058770002e-10, -1.90821492927058770002e-10],
  invln2 = 1.44269504088896338700e+00, P1 = 1.66666666666666019037e-01, P2 = -2.77777777770155933842e-03,
  P3 = 6.61375632143793436117e-05, P4 = -1.65339022054652515390e-06, P5 = 4.13813679705723846039e-08, twom1000 = 9.33263618503218878990e-302;
function exp(x) {
  x = +x;
  let hx = hi(x);
  const xsb = (hx >>> 31) & 1;
  hx &= 0x7fffffff;
  let hiv = 0, lov = 0, k = 0;
  if (hx >= 0x40862e42) {
    if (hx >= 0x7ff00000) { if (x !== x) return x + x; return xsb === 0 ? x : 0; }
    if (x > o_threshold) return Infinity;
    if (x < u_threshold) return 0;
  }
  if (hx > 0x3fd62e42) {
    if (hx < 0x3ff0a2b2) { hiv = x - ln2HI[xsb]; lov = ln2LO[xsb]; k = 1 - xsb - xsb; }
    else { k = (invln2 * x + (xsb ? -0.5 : 0.5)) | 0; hiv = x - k * ln2HI[0]; lov = k * ln2LO[0]; }
    x = hiv - lov;
  } else if (hx < 0x3e300000) return 1 + x;
  const t = x * x, c = x - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
  if (k === 0) return 1 - ((x * c) / (c - 2) - x);
  const y = 1 - ((lov - (x * c) / (2 - c)) - hiv);
  if (k >= -1021) return withHi(y, hi(y) + (k << 20));
  return withHi(y, hi(y) + ((k + 1000) << 20)) * twom1000;
}
const ln2_hi = 6.93147180369123816490e-01, ln2_lo = 1.90821492927058770002e-10, two54 = 1.80143985094819840000e+16,
  Lg1 = 6.666666666666735130e-01, Lg2 = 3.999999999940941908e-01, Lg3 = 2.857142874366239149e-01, Lg4 = 2.222219843214978396e-01,
  Lg5 = 1.818357216161805012e-01, Lg6 = 1.531383769920937332e-01, Lg7 = 1.479819860511658591e-01;
function log(x) {
  x = +x;
  let hx = hi(x), k = 0;
  const lx = lo(x);
  if (hx < 0x00100000) {
    if (((hx & 0x7fffffff) | lx) === 0) return -Infinity;
    if (hx < 0) return NaN;
    k -= 54; x *= two54; hx = hi(x);
  }
  if (hx >= 0x7ff00000) return x + x;
  k += (hx >> 20) - 1023;
  hx &= 0x000fffff;
  let i = (hx + 0x95f64) & 0x100000;
  x = withHi(x, hx | (i ^ 0x3ff00000));
  k += i >> 20;
  const f = x - 1;
  if ((0x000fffff & (2 + hx)) < 3) {
    if (f === 0) return k === 0 ? 0 : k * ln2_hi + k * ln2_lo;
    const R = f * f * (0.5 - 0.33333333333333333 * f);
    return k === 0 ? f - R : k * ln2_hi - ((R - k * ln2_lo) - f);
  }
  const s = f / (2 + f), dk = k, z = s * s, w = z * z;
  i = hx - 0x6147a;
  const j = 0x6b851 - hx;
  const t1 = w * (Lg2 + w * (Lg4 + w * Lg6)), t2 = z * (Lg1 + w * (Lg3 + w * (Lg5 + w * Lg7))), R = t2 + t1;
  i |= j;
  if (i > 0) {
    const hfsq = 0.5 * f * f;
    return k === 0 ? f - (hfsq - s * (hfsq + R)) : dk * ln2_hi - ((hfsq - (s * (hfsq + R) + dk * ln2_lo)) - f);
  }
  return k === 0 ? f - s * (f - R) : dk * ln2_hi - ((s * (f - R) - dk * ln2_lo) - f);
}

// ---- pow / hypot (composed: deterministic, accurate to a few ulp)
function pow(x, y) {
  x = +x; y = +y;
  if (y === 0) return 1;
  if (x !== x || y !== y) return NaN;
  if (y === 1) return x;
  if (y === 0.5 && x >= 0) return sqrt(x);
  const yi = Number.isInteger(y);
  if (yi && fabs(y) <= 64) {                                   // repeated squaring: x² = x·x exactly
    let n = fabs(y), b = x, r = 1;
    while (n) { if (n & 1) r *= b; b *= b; n = Math.floor(n / 2); }
    return y < 0 ? 1 / r : r;
  }
  if (x === 0) return y > 0 ? (yi && y % 2 && 1 / x < 0 ? -0 : 0) : (yi && y % 2 && 1 / x < 0 ? -Infinity : Infinity);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return Math.__native.pow(x, y);   // inf edge cases are exact anyway
  if (x < 0) {
    if (!yi) return NaN;
    const r = exp(y * log(-x));
    return y % 2 ? -r : r;
  }
  return exp(y * log(x));
}
function hypot(...a) {
  let s = 0, nan = false;
  for (let i = 0; i < a.length; i++) {
    const v = +a[i];
    if (v === Infinity || v === -Infinity) return Infinity;
    if (v !== v) nan = true;
    s += v * v;
  }
  return nan ? NaN : sqrt(s);
}

export const D = { sin, cos, tan, atan, atan2, asin, acos, exp, log, pow, hypot };

let installed = false;
/** Replace the Math functions with the deterministic ones (idempotent). Math.__native keeps the originals. */
export function install() {
  if (installed) return;
  installed = true;
  Math.__native = {};
  for (const k in D) { Math.__native[k] = Math[k]; Math[k] = D[k]; }
  globalThis.__dmath = true;
}
