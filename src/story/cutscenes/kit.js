// Cutscene kit (render-only): what the scene modules build their shots from. Everything a scene adds lives under K.root
// (removed on dispose) except the stand-in crowd, which is built once (the real crowd view on a stand-in crowd, like the
// officer bench) and emptied between scenes.
//   K.hero(id, at)        a playable on its own rig — the shipped model (kit.model + chains), posed from its own clips /
//                         cutclips; .pose(fn(t) → pose | clip id), .place(x, z, yaw, y), .weapons('closed' | 'open' |
//                         'hidden'), .head('hat' | 'nohat' | 'bare') (龍仔 only), .hold(item | null) (龍仔: 'hat' / 'mask')
//   K.crowdSkin(foe, ally), K.person(i, x, z, yaw, o), K.people(list)   stand-in crowd soldiers in the shipped skins
//   K.fig(skin, kind, x, z, yaw)   a box figure in a shipped skin's palette and head boxes (seated / carrying poses the crowd
//                         rig can't do): kind 'sit' | 'stand' | 'carry' | 'shadow'
//   K.box(list, o), K.glow(list)   box-list props (src/core/voxel.js boxesGeometry), lit or self-lit
//   K.sky(o)              time-of-day override for the scene (background, fog, extra lights), restored on dispose
//   K.haze / K.rain / K.fireworks / K.confetti   render-only effects (vrng / fixed hash scatter)
// Mobile tier (coarse pointer, no ?hq): the stand-in crowd is capped at 150.
import * as THREE from 'three';
import { standOfficer, poseOfficer, dotTex } from '../../ui/stage.js';
import { sampleClip, POSE_SIZE } from '../../hero/rig.js';
import { vox, HV } from '../../hero/model.js';
import { ground } from '../../world/map.js';
import { createCrowd, ST, KIND } from '../../crowd/crowd.js';
import { createCrowdView } from '../../crowd/view.js';
import { createCamSim } from '../../camera/camera.js';
import { DIFFS } from '../../core/difficulty.js';
import { emit } from '../../core/events.js';
import { boxesGeometry, shade } from '../../core/voxel.js';
import { hash01 } from '../../core/rng.js';
import { SKINS } from '../../chars/officers/index.js';
import { headVariant, looseHat, looseMask } from '../../chars/lungjai/heads.js';

const MOBILE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches && !new URLSearchParams(location.search).has('hq');
export const CROWD_CAP = MOBILE ? 150 : 600;
const bx = (s, p, c, r) => ({ s, p, c, r });
const _v = new THREE.Vector3();

// ---- the stand-in crowd (one per page): the real crowd view over a crowd the scene places by hand
let SC = null;
function standIn(scene) {
  if (SC) return SC;
  const G = { frame: 0, diff: DIFFS[1], hero: { x: 0, z: -9999, y: 0, hp: 400 }, cam: createCamSim(), mode: 'free' };
  G.story = { chapter: { skin: { foe: 'civil', ally: 'blackbloc' }, OFF: {} }, modelOf: () => null };
  G.crowd = createCrowd(G, Math.min(560, CROWD_CAP));
  G.crowd.reset();
  const view = createCrowdView(scene, G);
  SC = { G, c: G.crowd, view, skin: '' };
  return SC;
}

export function createKit(stage) {
  const { scene } = stage;
  return {
    /** A new scene's kit. lead: the playable the player picked (leads the shots); the other stands beside. */
    begin({ lead }) {
      const root = new THREE.Group(); scene.add(root);
      const heroes = [], tick = [], saved = { bg: scene.background, fog: scene.fog }, disposers = [];
      const sc = standIn(scene), c = sc.c;
      for (let i = 0; i < c.T; i++) c.st[i] = ST.OFF;
      let crowdOn = false, bobs = null;
      const K = {
        root, lead, other: lead === 'lungjai' ? 'siumei' : 'lungjai', mobile: MOBILE,
        v: (a) => _v.set(a[0], a[1], a[2]),
        g: (x, z) => ground(x, z),
        on: (fn) => { tick.push(fn); },

        hero(id, { x = 0, z = 0, yaw = 0, y = null } = {}) {
          const o = standOfficer(id, root), pose = new Float32Array(POSE_SIZE), p = new THREE.Vector3();
          const a = { id, o, x, z, yaw, y, t: 0, fn: null, clip: 'idle', loop: 2.4, items: {} };
          a.place = (x2, z2, yaw2 = a.yaw, y2 = null) => { a.x = x2; a.z = z2; a.yaw = yaw2; a.y = y2; return a; };
          /** pose source: a clip id of the kit (looped over `loop` s), or fn(t) → a pose array */
          a.pose = (src, loop = 2.4) => {                             // a function of t, a clip object, or a clip id of the kit
            a.fn = typeof src === 'function' ? src : null; a.cobj = src && src.keys ? src : null; a.clip = typeof src === 'string' ? src : a.clip;
            a.loop = loop; a.t = 0; return a;
          };
          a.weapons = (mode) => {
            const M = o.m.meshes, u = o.rig.umbrellas;
            if (M.pole) M.pole.visible = mode !== 'hidden';
            if (u) { o.rig.umbrellaMode = mode === 'shown' ? 'closed' : mode; const op = mode === 'open'; u.open.forEach((m) => { m.visible = op; }); u.closed.forEach((m) => { m.visible = mode === 'closed' || mode === 'shown'; }); }
            return a;
          };
          a.head = (variant) => {                                   // 龍仔's render-only head swap (same box list, minus parts)
            if (id !== 'lungjai') return a;
            const m = o.m.meshes.head; m.geometry.dispose();
            m.geometry = vox(headVariant(variant), HV, { off: [-0.5, 0, 0], jitter: 0.04 });
            return a;
          };
          a.hold = (item, hand = 'R') => {                          // a loose hard hat / mask in a hand (null: drop both)
            if (!item) { for (const k in a.items) a.items[k].parent?.remove(a.items[k]); a.items = {}; return a; }
            if (a.items[item]) a.items[item].parent?.remove(a.items[item]);
            const geo = item === 'hat' ? looseHat() : looseMask(), m = new THREE.Mesh(geo, o.m.material);
            m.castShadow = true; m.position.set(0, -0.06, 0.05);
            o.rig.joints['hand' + hand].add(m); a.items[item] = m;
            return a;
          };
          a.step = (dt) => {
            a.t += dt;
            if (a.fn) pose.set(a.fn(a.t));
            else { const cl = a.cobj || o.K.clips[a.clip] || o.K.clips.idle, u = a.t / a.loop; sampleClip(cl, cl.loop === false && a.cobj ? Math.min(1, u) : u % 1, pose); }
            p.set(a.x, a.y ?? ground(a.x, a.z), a.z);
            poseOfficer(o, pose, p, a.yaw, dt);
          };
          heroes.push(a);
          return a;
        },

        crowdSkin(foe, ally) {
          const k = foe + '|' + ally;
          if (sc.skin !== k) { sc.G.story.chapter.skin = { foe, ally }; sc.skin = k; emit('scenario', {}); }
        },
        /** Stand-in soldier i (foe slots 0…grunts-1 wear the foe skin; ally slots N…T-1 the ally skin). o: { state, kind, y }. */
        person(i, x, z, yaw, o = {}) {
          if (i >= c.T) return;
          c.st[i] = o.state ?? ST.GUARD; c.stT[i] = (i * 7) % 60; c.x[i] = x; c.z[i] = z; c.y[i] = o.y || 0; c.yaw[i] = yaw;
          c.type[i] = 0; c.kind[i] = o.kind ?? (i % 5 === 0 ? KIND.SWORD : KIND.SPEAR); c.hpMax[i] = c.hp[i] = 100;
          c.foe[i] = -1; c.rx[i] = 0; if (c.vx) { c.vx[i] = 0; c.vz[i] = 0; }
          crowdOn = true;
        },
        /** n people over rect [x0, z0, x1, z1] (foe slots first, then ally slots), facing yaw, hashed jitter. */
        people(n, [x0, z0, x1, z1], yaw, o = {}) {
          n = Math.min(n, CROWD_CAP, c.grunts + (c.T - c.N));
          const cols = Math.max(1, Math.round(Math.sqrt(n * (x1 - x0) / Math.max(1, z1 - z0))));
          for (let k = 0; k < n; k++) {
            const i = k < c.grunts ? k : c.N + (k - c.grunts);
            const cx = k % cols, cz = Math.floor(k / cols), rows = Math.ceil(n / cols);
            const x = x0 + (cx + 0.5 + (hash01(k, 1) - 0.5) * 0.6) * (x1 - x0) / cols, z = z0 + (cz + 0.5 + (hash01(k, 2) - 0.5) * 0.6) * (z1 - z0) / rows;
            K.person(i, x, z, yaw + (hash01(k, 3) - 0.5) * (o.spread ?? 0.8), o);
          }
          return n;
        },
        /** Cheering: hops (render-only height), raised weapons now and then. */
        cheer(on = true, hop = 0.18) { bobs = on ? hop : null; },

        fig(skin, kind, x, z, yaw = 0, y = null) {
          const S = SKINS[skin], C = S.palette, head = S.head(C, false, (a, b2, cc) => ({ a, b: b2, c: cc }));
          const hb = head.map((q) => bx(q.b.map((v, k) => Math.max(0.012, v - q.a[k])), q.a.map((v, k) => (v + q.b[k]) / 2), q.c));
          const B = [];
          const H = (dy, dz = 0) => hb.forEach((q) => B.push(bx(q.s, [q.p[0], q.p[1] + dy, q.p[2] + dz], q.c)));
          if (kind === 'sit') {                                      // seated: thighs forward, shins down, a hard hat on the lap
            B.push(bx([0.34, 0.14, 0.44], [0, 0.52, 0.12], C.pants), bx([0.3, 0.46, 0.14], [0, 0.26, 0.34], C.pants), bx([0.34, 0.1, 0.24], [0, 0.03, 0.4], C.boot),
              bx([0.36, 0.5, 0.24], [0, 0.86, -0.04], C.cloth), bx([0.1, 0.4, 0.12], [-0.23, 0.82, 0.04], C.cloth), bx([0.1, 0.4, 0.12], [0.23, 0.82, 0.04], C.cloth),
              bx([0.44, 0.08, 0.3], [0, 0.66, 0.26], skin === 'blackbloc' ? C.helm : C.pants), bx([0.08, 0.1, 0.02], [0.08, 0.72, 0.36], 0xa8d0f0));
            H(1.12, -0.02);
          } else {
            B.push(bx([0.32, 0.8, 0.22], [0, 0.4, 0], C.pants), bx([0.4, 0.62, 0.26], [0, 1.12, 0], C.cloth), bx([0.12, 0.6, 0.14], [-0.26, 1.08, 0], C.cloth),
              bx([0.12, 0.6, 0.14], [0.26, 1.08, 0], C.cloth), bx([0.34, 0.1, 0.3], [0, 0.05, 0.04], C.boot));
            if (kind === 'carry') B.push(bx([0.32, 0.18, 0.2], [0, 1.28, 0.3], 0x8a5a44), bx([0.12, 0.3, 0.14], [-0.2, 1.2, 0.2], C.cloth), bx([0.12, 0.3, 0.14], [0.2, 1.2, 0.2], C.cloth));
            H(1.45);
          }
          const g = boxesGeometry(kind === 'shadow' ? B.map((q) => ({ ...q, c: 0x0e0e12 })) : B);
          const m = new THREE.Mesh(g, kind === 'shadow' ? new THREE.MeshBasicMaterial({ color: 0x0a0a0e }) : new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 }));
          m.position.set(x, y ?? ground(x, z), z); m.rotation.y = yaw; m.castShadow = true; root.add(m);
          disposers.push(() => { g.dispose(); m.material.dispose(); });
          return m;
        },

        box(list, { x = 0, y = 0, z = 0, yaw = 0, rough = 0.8, basic = false, color = null } = {}) {
          const g = boxesGeometry(list), mat = basic ? new THREE.MeshBasicMaterial({ vertexColors: true, color: Array.isArray(color) ? new THREE.Color(...color) : color || 0xffffff, toneMapped: false })
            : new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: rough, metalness: 0.05 });
          const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.y = yaw; m.castShadow = m.receiveShadow = !basic; root.add(m);
          disposers.push(() => { g.dispose(); mat.dispose(); });
          return m;
        },
        glow: (list, o = {}) => K.box(list, { ...o, basic: true, color: o.color || new THREE.Color(2.2, 2, 1.7) }),
        light(type, color, intensity, pos, o = {}) {
          const l = type === 'point' ? new THREE.PointLight(color, intensity, o.dist || 30, 1.6) : type === 'spot' ? new THREE.SpotLight(color, intensity, o.dist || 60, o.angle || 0.4, 0.5, 1.4)
            : type === 'hemi' ? new THREE.HemisphereLight(color, o.ground || 0x302820, intensity) : new THREE.DirectionalLight(color, intensity);
          if (pos) l.position.set(...pos);
          if (o.target) { l.target.position.set(...o.target); root.add(l.target); }
          root.add(l); return l;
        },
        /** Time-of-day override: background colour, fog, an ambient + key light (restored on dispose). */
        sky({ bg, fog, near = 40, far = 260, hemi, key }) {
          if (bg != null) scene.background = new THREE.Color(bg);
          if (fog != null) scene.fog = new THREE.Fog(fog, near, far);
          if (hemi) K.light('hemi', hemi[0], hemi[2], null, { ground: hemi[1] });
          if (key) K.light('dir', key[0], key[1], key[2]);
          const dome = new THREE.Mesh(new THREE.SphereGeometry(850, 24, 12), new THREE.MeshBasicMaterial({ color: bg ?? 0x000000, side: THREE.BackSide, fog: false, depthWrite: false }));
          dome.renderOrder = -1; dome.frustumCulled = false; root.add(dome); K.dome = dome;
          disposers.push(() => { dome.geometry.dispose(); dome.material.dispose(); });
        },
        /** Soft drifting haze banks: [[x, y, z, size], …], colour, opacity. */
        haze(list, color = 0xc8d0c0, op = 0.3) {
          const tex = dotTex(0.3, 0.5), sp = list.map(([x, y, z, s], k) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity: op, depthWrite: false })); m.position.set(x, y, z); m.scale.set(s * 1.6, s, 1); m.userData.k = k; root.add(m); return m; });
          K.on((dt, t) => sp.forEach((m) => { m.position.x += Math.sin(t * 0.2 + m.userData.k) * dt * 0.3; }));
          disposers.push(() => { tex.dispose(); sp.forEach((m) => m.material.dispose()); });
        },
        /** Rain streaks round a moving centre (fn → [x, y, z]). */
        rain(center, n = 1200, color = 0x9aaac0) {
          const pos = new Float32Array(n * 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35, depthWrite: false })); m.frustumCulled = false; root.add(m);
          K.on((dt, t) => { const [cx, cy, cz] = center(); for (let i = 0; i < n; i++) { const y = ((hash01(i, 2) * 16 - t * 14) % 16 + 16) % 16, x = cx + hash01(i, 1) * 40 - 20, z = cz + hash01(i, 3) * 40 - 20;
            pos.set([x, cy + y, z, x + 0.05, cy + y + 0.6, z + 0.02], i * 6); } g.attributes.position.needsUpdate = true; });
          disposers.push(() => { g.dispose(); m.material.dispose(); });
        },
        /** Fireworks: bursts at scheduled [t, x, y, z, colour] (s since the scene's fireworks began), additive points. */
        fireworks(list) {
          const N = 140, all = list.map(([t0, x, y, z, col]) => {
            const g = new THREE.BufferGeometry(), p = new Float32Array(N * 3); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
            const m = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(col).multiplyScalar(4), size: 3.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
            m.frustumCulled = false; m.visible = false; root.add(m);
            return { t0, x, y, z, g, p, m };
          });
          let T = 0;
          K.fwT = () => T;
          K.on((dt) => { T += dt; for (const f of all) { const a = T - f.t0; f.m.visible = a > 0 && a < 2.4; if (!f.m.visible) continue;
            for (let i = 0; i < N; i++) { const th = hash01(i, 1) * Math.PI * 2, ph = Math.acos(2 * hash01(i, 2) - 1), v = 14 + hash01(i, 3) * 6, r = v * (1 - Math.exp(-a * 1.6)) / 1.6;
              f.p.set([f.x + Math.sin(ph) * Math.cos(th) * r, f.y + Math.cos(ph) * r - 4 * a * a, f.z + Math.sin(ph) * Math.sin(th) * r], i * 3); }
            f.g.attributes.position.needsUpdate = true; f.m.material.opacity = Math.max(0, 1 - a / 2.4); } });
          disposers.push(() => all.forEach((f) => { f.g.dispose(); f.m.material.dispose(); }));
        },
        /** Confetti falling over a box [x0, z0, x1, z1] from height h. */
        confetti([x0, z0, x1, z1], h = 14, n = 600) {
          const cols = [0xffd700, 0xf48fb1, 0xffffff, 0x4fc3f7, 0xff7043, 0x9ccc65], mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.14, 0.09), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), n);
          const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3(), col = new THREE.Color();
          for (let i = 0; i < n; i++) mesh.setColorAt(i, col.set(cols[i % cols.length]).multiplyScalar(1.4));
          mesh.frustumCulled = false; root.add(mesh);
          K.on((dt, t) => { for (let i = 0; i < n; i++) { const y = h - ((hash01(i, 5) * h + t * (1 + hash01(i, 6))) % h); e.set(t * 3 + i, t * 2 + i * 0.3, 0); q.setFromEuler(e);
            M.compose(P.set(x0 + hash01(i, 7) * (x1 - x0) + Math.sin(t + i) * 0.4, ground(0, z0) + y, z0 + hash01(i, 8) * (z1 - z0)), q, s); mesh.setMatrixAt(i, M); } mesh.instanceMatrix.needsUpdate = true; });
          disposers.push(() => { mesh.geometry.dispose(); mesh.material.dispose(); });
        },

        update(dt, camera) {
          K.t = (K.t || 0) + dt;
          for (const fn of tick) fn(dt, K.t);
          for (const a of heroes) a.step(dt);
          if (crowdOn) {
            sc.G.frame++;
            if (bobs) for (let i = 0; i < c.T; i++) if (c.st[i] !== ST.OFF) {
              c.y[i] = Math.max(0, Math.sin(K.t * 7 + i * 1.7)) * bobs * (0.5 + hash01(i, 9));
              if ((sc.G.frame + i * 13) % 150 === 0) c.raiseF[i] = sc.G.frame + 60;
            }
            sc.view.update(dt, camera);
          }
        },
        dispose() {
          scene.remove(root);
          for (const a of heroes) { a.o.root.traverse((m) => { if (m.isMesh) m.geometry?.dispose?.(); }); }
          for (const d of disposers) d();
          scene.background = saved.bg; scene.fog = saved.fog;
          for (let i = 0; i < c.T; i++) c.st[i] = ST.OFF;
          sc.view.update(0, new THREE.PerspectiveCamera());
        },
      };
      return K;
    },
  };
}
export { bx, shade };
