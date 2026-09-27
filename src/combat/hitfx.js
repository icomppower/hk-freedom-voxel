// Hit readability on the soldiers (render-only): the victim flash, a per-instance "aHit" term patched into the crowd
// material. The contact frame pops white-hot silhouette edges over a lifted body for 1 sim frame (local: a band of 10
// struck soldiers must not merge into one white blob). Then a warm wash is blended into the lit albedo (≤ 0.22, so the
// soldiers stay dark), with a bright emissive rim on the faces that turn away from the camera (the silhouette edges).
// It decays quadratically over ≈ 10 sf: gold on a hit, deep amber on a heavy hit, red on the killing blow (the DW8
// yellow wash; the killing blow keeps the armour dark under a hotter red ember rim — fx r3). Weapons stay untinted
// (crowd/view.js zeroes the glow for them). KO'd bodies keep a red ember rim while airborne, so the blow-away fans read
// over a dark crowd. The hero stays the lightest
// large mass (hero luma ≈ 1.3-1.6× the tinted soldiers in combo-normal). The recoil pose lives in crowd/view.js.
// Driven by crowd.flash[i] (set by combat on the hit frame), crowd.hitHeavy[i], crowd.kod[i], crowd.st[i].
import { COMBAT } from './combat.js';
import { ST } from '../crowd/crowd.js';

/** Adds `aHit` (vec3 tint colour × strength; > 1 = white pop) to a MeshStandardMaterial via onBeforeCompile. */
export function patchHitMaterial(mat) {
  const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey() + '|hitfx3';   // chain other parts' patches
  mat.customProgramCacheKey = () => key;
  mat.onBeforeCompile = function (sh, renderer) {
    prev.call(this, sh, renderer);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aHit;\nvarying vec3 vHit;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHit = aHit;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHit;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float hitA = max(vHit.r, max(vHit.g, vHit.b));
        float hitRim = 1.0 - abs(dot(normal, normalize(vViewPosition)));
        if (hitA > 1.01) {                                            // contact frame: white-hot edges, lifted body
          // (fx r3: thinner edge, less lift — a sweep of 8+ contacts turned the struck rank into white mannequins)
          // (fx r3 acc: on voxel boxes every side face is edge-on (rim 1), so the rim term lit whole bodies — a softer rim over
          // a small lift; the pop is capped to one rendered frame in hitGlow, however long the hitstop)
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), 0.05);
          totalEmissiveRadiance += (vHit - 1.0) * (0.05 + 0.5 * hitRim * hitRim * hitRim * hitRim);
        } else if (hitA > 0.0) {
          vec3 hitC = vHit / hitA;
          float hitL = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
          // lit wash: albedo toward the tint, brighter where the albedo is brighter (skin, plates), so shading stays
          // fx r3: red tints (killing blow, KO ember) keep the armour dark — the cue is a hot ember rim on the silhouette,
          // not an albedo wash / flat glow (mass launches read as salmon-pink mannequins)
          float hitRed = clamp((0.45 - hitC.g) * 4.0, 0.0, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, hitC * (0.33 + 1.3 * hitL), 0.13 * hitA * (1.0 - 0.85 * hitRed));   // (fx r3 acc: 0.22 → 0.13, struck ranks went tan / salmon)
          float hitFlat = 0.04 + 0.04 * hitRed;
          totalEmissiveRadiance += hitC * hitA * (hitFlat + (0.55 + 0.7 * hitRed) * hitRim * hitRim * hitRim * hitRim);   // (fx r3 acc: rim⁴, voxel sides are all edge-on)
        }`);
  };
}

const HOT = [1.55, 1.53, 1.5], GOLD = [1.0, 0.6, 0.12], AMBER = [1.0, 0.4, 0.07], KILL = [1.0, 0.25, 0.12];   // HOT: 1 + white emissive
const EMBER = 0.3;                                                 // KO'd bodies keep a dim red rim until they land
// rendered frames soldier i has shown the hot pop for (crowd/view.js writes each visible flashing soldier once a render):
// the flash counter holds through hitstop (6-8 sf on heavy hits), so the pop is cut to 1 frame here (fx r3 acc)
let popN = new Uint8Array(0);
/** Tint of soldier i this frame (colour × strength, or HOT on the contact frame), written into out[0..2]. */
export function hitGlow(crowd, i, out) {
  const fl = crowd.flash[i], ember = crowd.kod[i] && crowd.st[i] === ST.AIR ? EMBER : 0;
  if (popN.length !== crowd.N) popN = new Uint8Array(crowd.N);
  if (fl <= 0 && !ember) { popN[i] = 0; out[0] = out[1] = out[2] = 0; return; }
  const heavy = crowd.hitHeavy[i];
  const D = COMBAT.tintFrames - 1 + (heavy ? 3 : 0);               // flash value on the frame a fresh hit shows
  if (fl >= D) { if (!popN[i]) { popN[i] = 1; out[0] = HOT[0]; out[1] = HOT[1]; out[2] = HOT[2]; return; } }
  else popN[i] = 0;
  const u = Math.min(1, Math.min(fl, D - 1) / (D - 1)), k = Math.max(ember, u * u);   // decays from the first frame: brief, not a held wash
  const C = crowd.kod[i] ? KILL : heavy ? AMBER : GOLD;
  out[0] = C[0] * k; out[1] = C[1] * k; out[2] = C[2] * k;
}
