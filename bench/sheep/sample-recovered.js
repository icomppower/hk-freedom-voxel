// Recovered 羊村 box-moveset sample (bench/sheep/chars.js + moves.js + main.js of the Notion "Box Moveset" page), de-minified
// from its published bundle (claude.ai artifact CtvCkah24W4kbxLJwiVXTS, 2026-09-29) because sheep-bench.zip was not
// available. Identifiers are esbuild-minified (Ct = box {a, b, c, paint}, Uo = painted box, Ei = box + its X mirror,
// Xt = hex, zn = palettes, P/spearAbout are the rig's), the data (palettes, head box lists, weapon geometry, move
// tables, pose keys) is intact. Reference only: never imported by the game.

    d_ = (i) => ({
      ...i,
      a: [1 - i.b[0], i.a[1], i.a[2]],
      b: [1 - i.a[0], i.b[1], i.b[2]],
    }),
    Ei = (...i) => i.flatMap((t) => [t, d_(t)]),
    Xt = (i) => parseInt(i.slice(1), 16),
    me = (i, t) => {
      let e = new Rt(i);
      return (e.multiplyScalar(t), e.getHex());
    },
    zn = {
      gok: {
        wool: Xt("#F2EFE6"),
        face: Xt("#3B3A36"),
        horn: Xt("#C8A15A"),
        hornD: Xt("#8E6E34"),
        coat: Xt("#2F5D7C"),
        coatD: Xt("#1F4058"),
        scarf: Xt("#B8452F"),
        wood: Xt("#6B4A2B"),
        rope: Xt("#C9A66B"),
        trou: Xt("#4A4640"),
        eye: Xt("#E8D9A8"),
      },
      siume: {
        wool: Xt("#EDE6DA"),
        face: Xt("#2B2A28"),
        horn: Xt("#9C8F7A"),
        vest: Xt("#1F7A6B"),
        vestD: Xt("#135247"),
        red: Xt("#D93A3A"),
        blade: Xt("#B9C2C9"),
        bladeL: Xt("#E6ECF0"),
        grip: Xt("#6B4A2B"),
        trou: Xt("#3D4A4F"),
        band: Xt("#B9A98F"),
        eye: Xt("#F0E6C8"),
      },
      warden: {
        fur: Xt("#5A5C63"),
        furD: Xt("#2E3035"),
        furL: Xt("#8A8C92"),
        amber: Xt("#E0A030"),
        steel: Xt("#4A5058"),
        steelD: Xt("#30353C"),
        mantle: Xt("#6C6E74"),
        cloak: Xt("#1E1F24"),
        blade: Xt("#C8CED6"),
        edge: Xt("#EEF3F8"),
        pole: Xt("#2A1F1A"),
        metal: Xt("#8A8F96"),
        teeth: Xt("#E8E4DA"),
      },
    };
  function Sc(i, t) {
    return {
      ...Mc,
      W: t.main,
      W2: me(t.main, t.flat ? 0.88 : 0.72),
      Wh: me(t.main, t.flat ? 1.06 : 1.18),
      S: t.mantle,
      Sd: me(t.mantle, 0.7),
      G: t.under,
      Gd: me(t.under, 0.75),
      Gm: me(t.under, 1.2),
      Gl: me(t.under, 1.6),
      T: t.trim,
      Td: me(t.trim, 0.7),
      Tl: me(t.trim, 1.3),
      gold: t.metal,
      leather: t.belt,
      glove: t.hand,
      sole: t.boot,
    };
  }
  var Ku = (i) => (t, e, n) =>
    bi(t * 3, e, n) < 0.18
      ? me(i, 0.9)
      : bi(n, t, e * 5) < 0.12
        ? me(i, 1.04)
        : i;
  function f_() {
    let i = zn.gok,
      t = Ku(i.wool);
    return [
      Ct([-3, 2, -4], [4, 11, 3], i.face),
      Ct([-2, 0, 2], [3, 8, 9], i.face),
      Ct([-2, 7, 2], [3, 9, 6], me(i.face, 1.15)),
      Uo([-1, 3, 8], [2, 5, 9], me(i.face, 0.6)),
      Uo([-1, 0, 7], [2, 1, 9], me(i.face, 0.75)),
      ...Ei(Ct([-4, 7, 1], [-3, 8, 3], i.eye)),
      Ct([-4, 9, -5], [5, 14, 3], t),
      Ct([-3, 14, -4], [4, 15, 2], t),
      Ct([-4, -3, -3], [5, 2, 4], t),
      Ct([-3, -5, -1], [4, -3, 4], t),
      ...Ei(Ct([-8, 7, -1], [-4, 8, 1], i.face)),
      ...Ei(
        Ct([-7, 11, -3], [-3, 14, 1], i.horn),
        Ct([-9, 7, -6], [-6, 13, -2], i.horn),
        Ct([-9, 3, -4], [-6, 7, 0], i.horn),
        Ct([-10, 3, 0], [-7, 7, 3], i.horn),
        Ct([-10, 6, 3], [-8, 9, 5], i.horn),
        Ct([-8, 8, -5], [-7, 11, -3], i.hornD),
      ),
    ];
  }
  function p_() {
    let i = zn.siume,
      t = Ku(i.wool);
    return [
      Ct([-3, 2, -3], [4, 10, 3], i.face),
      Ct([-2, 0, 2], [3, 7, 7], i.face),
      Uo([-1, 3, 6], [2, 5, 7], me(i.face, 0.55)),
      ...Ei(Ct([-4, 6, 1], [-3, 7, 3], i.eye)),
      Ct([-4, 10, -4], [5, 13, 3], t),
      Ct([-5, 9, -5], [6, 11, 4], i.red),
      ...Ei(Ct([-7, 6, -1], [-4, 7, 1], i.face)),
      ...Ei(
        Ct([-3, 12, -4], [-1, 16, -2], i.horn),
        Ct([-3, 15, -6], [-1, 17, -4], me(i.horn, 0.85)),
      ),
      Ct([-3, -2, -2], [4, 1, 3], t),
    ];
  }
  function m_() {
    let i = zn.warden;
    return [
      Ct([-4, 2, -4], [5, 11, 4], i.fur),
      Ct([-2, 2, 3], [3, 6, 11], i.furL),
      Ct([-2, 4, 3], [3, 6, 10], i.fur),
      Ct([-1, 4, 11], [2, 6, 12], 1118481),
      Ct([-2, -1, 3], [3, 1, 10], i.fur),
      Ct([-2, 1, 5], [3, 2, 10], (t, e, n) => ((t + n) % 2 ? i.teeth : null)),
      Ct([-4, 8, 3], [5, 9, 5], i.furD),
      ...Ei(Uo([-3, 7, 3], [-1, 8, 4], i.amber)),
      ...Ei(
        Ct([-4, 11, -2], [-1, 15, 1], i.furD),
        Ct([-3, 15, -1], [-2, 18, 0], i.furD),
      ),
      Ct([-6, -3, -6], [7, 4, 2], (t, e, n) =>
        bi(t, e, n) < 0.2 ? me(i.mantle, 0.85) : i.mantle,
      ),
    ];
  }
  function g_() {
    let i = zn.gok;
    return Cn(
      [
        Ct([-1, -1, -30], [1, 1, 72], (e, n, s) =>
          (s + 30) % 18 < 2 ? i.rope : s & 2 ? me(i.wood, 1.12) : i.wood,
        ),
        Ct([-1, 0, 70], [1, 9, 73], i.wood),
        Ct([-1, 8, 62], [1, 11, 73], i.wood),
        Ct([-1, 3, 61], [1, 9, 63], i.wood),
        Ct([-1, 3, 63], [1, 4, 65], me(i.wood, 0.8)),
      ],
      0.02,
      { jitter: 0.05, ao: 0.3 },
    );
  }
  function $u() {
    let i = zn.siume,
      t = 0.012,
      e = [];
    e.push(
      Ct([-2, -2, -8], [2, 2, 2], i.grip),
      Ct([-1, -1, -7], [1, 1, 1], -1),
    );
    for (let n = 2; n < 38; n++) {
      let s = (n - 2) / 36,
        r = Math.max(1, Math.round(5 * (1 - s * 0.85)));
      e.push(
        Ct([-1, -1, n], [1, 1 + r, n + 1], (a, o) =>
          o === r ? i.bladeL : o === 0 ? me(i.blade, 0.8) : i.blade,
        ),
      );
    }
    return Cn(e, t, { jitter: 0.03, ao: 0.2 });
  }
  function __() {
    let i = zn.warden,
      e = Cn(
        [
          Ct([-1, -1, -40], [1, 1, 90], (o, l, c) =>
            (c + 40) % 22 === 0 ? i.metal : i.pole,
          ),
          Ct([-2, -2, 88], [2, 2, 93], i.metal),
          Ct([-2, -2, -43], [2, 2, -40], i.metal),
        ],
        0.02,
        { jitter: 0.04, ao: 0.3 },
      ),
      n = 0.012,
      s = Math.round(1.86 / n),
      r = 46,
      a = [];
    for (let o = s; o < s + r; o++) {
      let l = (o - s) / r,
        c = Math.round(14 * l * l),
        d = Math.max(
          2,
          Math.round(16 * Math.sin(Math.PI * Math.min(1, l * 0.9 + 0.12))),
        );
      a.push(
        Ct([-1, c - 3, o], [1, c - 3 + d, o + 1], (h, u) =>
          u >= c - 4 + d ? i.edge : u <= c - 2 ? me(i.blade, 0.75) : i.blade,
        ),
      );
    }
    return (
      a.push(Ct([-2, -4, s - 2], [2, 3, s + 1], i.metal)),
      [e, Cn(a, n, { jitter: 0.03, ao: 0.2 })]
    );
  }
  var bc = (i) =>
    Ju(
      new En({
        vertexColors: !0,
        flatShading: !0,
        roughness: 0.6,
        metalness: 0.08,
        ...i,
      }),
    );
  function ju(i) {
    let t = zn.gok,
      e = bc({ color: new Rt(0.86, 0.86, 0.86) }),
      n = Do(
        Sc(t, {
          main: t.coat,
          flat: !0,
          mantle: me(t.coat, 0.85),
          under: t.trou,
          trim: t.coatD,
          metal: t.rope,
          belt: t.rope,
          hand: t.wool,
          boot: 2762274,
        }),
      ),
      { add: s, meshes: r } = No(i, e, n, f_());
    ((r.pauldronR.visible = r.pauldronL.visible = !1),
      s(i.joints.weapon, g_(), "crook"));
    let a = new ce();
    return (
      a.position.set(0.06, 0.02, 0.1),
      a.rotation.set(0.15, 0, 0.1),
      i.joints.chest.add(a),
      s(
        a,
        Cn([Ct([-2, -14, 0], [2, 0, 1], t.scarf)], Rs, { jitter: 0.05 }),
        "scarfTail",
      ),
      { material: e, trail: [new D(0, 0.18, 1.44), new D(0, 0.02, 1.08)] }
    );
  }
  function Qu(i) {
    let t = zn.siume,
      e = bc({ color: new Rt(0.86, 0.86, 0.86) }),
      n = Do(
        Sc(t, {
          main: t.vest,
          flat: !0,
          mantle: t.wool,
          under: t.trou,
          trim: t.vestD,
          metal: t.band,
          belt: 3813160,
          hand: t.face,
          boot: 2762274,
        }),
      ),
      { add: s, meshes: r } = No(i, e, n, p_());
    r.pauldronR.visible = r.pauldronL.visible = !1;
    let a = new En({
      vertexColors: !0,
      flatShading: !0,
      roughness: 0.25,
      metalness: 0.6,
      emissive: 16769248,
      emissiveIntensity: 0.18,
    });
    s(i.joints.weapon, $u(), "shearR", a);
    let o = new ce();
    (o.position.set(0, -0.05, 0.01),
      o.rotation.set(Math.PI / 2, 0, 0),
      i.joints.handL.add(o),
      s(o, $u(), "shearL", a));
    let l = new ce();
    return (
      l.position.set(0, 10 * Lo, -5 * Lo),
      l.rotation.set(-0.5, 0.35, 0),
      i.joints.head.add(l),
      s(
        l,
        Cn(
          [
            Ct([-1, -16, 0], [1, 0, 1], t.red),
            Ct([2, -12, 0], [4, 0, 1], me(t.red, 0.85)),
          ],
          0.014,
          { jitter: 0.04 },
        ),
        "tails",
      ),
      { material: e, trail: [new D(0, 0.04, 0.46), new D(0, 0.01, 0.1)] }
    );
  }
  function td(i) {
    let t = zn.warden,
      e = bc({ color: new Rt(0.9, 0.9, 0.9), metalness: 0.2 }),
      n = Do(
        Sc(t, {
          main: t.steel,
          mantle: t.mantle,
          under: t.cloak,
          trim: t.steelD,
          metal: t.metal,
          belt: 2763824,
          hand: t.furD,
          boot: t.cloak,
        }),
      ),
      { add: s } = No(i, e, n, m_()),
      [r, a] = __();
    (s(i.joints.weapon, r, "glaive"),
      s(
        i.joints.weapon,
        a,
        "glaiveBlade",
        new En({
          vertexColors: !0,
          flatShading: !0,
          roughness: 0.25,
          metalness: 0.65,
          emissive: 14543103,
          emissiveIntensity: 0.15,
        }),
      ));
    let o = new ce();
    return (
      o.position.set(0, 0.12, -0.14),
      o.rotation.set(0.12, 0, 0),
      i.joints.chest.add(o),
      s(
        o,
        Cn(
          [
            Ct([-9, -46, 0], [9, 0, 1], (l, c) =>
              c < -42 && bi(l, c, 3) < 0.4
                ? null
                : l === -9 || l === 8
                  ? me(t.cloak, 1.3)
                  : t.cloak,
            ),
          ],
          Rs,
          { off: [0, 0, -0.5], jitter: 0.05 },
        ),
        "cloak",
      ),
      { material: e, trail: [new D(0, 0.2, 2.35), new D(0, 0.02, 1.9)] }
    );
  }
  var Le = (i, t, e, n, s, r, a) => {
    let o = new _e(
      new fi(i, t, e),
      new En({ color: n, roughness: 0.85, flatShading: !0 }),
    );
    return (o.position.set(s, r, a), (o.castShadow = !0), o);
  };
  function Ec() {
    let i = new hn(),
      t = zn.warden;
    return (
      i.add(
        Le(0.16, 0.5, 0.18, 3026997, -0.1, 0.25, 0),
        Le(0.16, 0.5, 0.18, 3026997, 0.1, 0.25, 0),
      ),
      i.add(
        Le(0.5, 0.58, 0.3, t.steel, 0, 0.78, 0),
        Le(0.54, 0.1, 0.32, 2763824, 0, 0.56, 0),
      ),
      i.add(
        Le(0.13, 0.5, 0.14, t.steel, -0.32, 0.8, 0.02),
        Le(0.13, 0.5, 0.14, t.steel, 0.32, 0.8, 0.02),
      ),
      i.add(
        Le(0.3, 0.28, 0.3, t.fur, 0, 1.24, 0),
        Le(0.16, 0.14, 0.2, t.furL, 0, 1.2, 0.22),
        Le(0.06, 0.05, 0.04, 1118481, 0, 1.25, 0.33),
      ),
      i.add(
        Le(0.07, 0.14, 0.06, t.furD, -0.1, 1.44, -0.03),
        Le(0.07, 0.14, 0.06, t.furD, 0.1, 1.44, -0.03),
      ),
      i.add(
        Le(0.04, 0.04, 1.8, 3811872, 0.32, 0.72, 0.35),
        Le(0.07, 0.05, 0.2, 12174025, 0.32, 0.72, 1.3),
      ),
      i
    );
  }
  function ed() {
    let i = new hn();
    return (
      i.add(
        Le(0.1, 1.5, 0.1, 7031339, 0, 0.75, 0),
        Le(0.9, 0.08, 0.08, 7031339, 0, 1.1, 0),
      ),
      i.add(
        Le(0.42, 0.6, 0.3, 13215339, 0, 0.95, 0),
        Le(0.26, 0.26, 0.26, 14203776, 0, 1.4, 0),
        Le(0.44, 0.06, 0.32, 9316894, 0, 0.72, 0),
      ),
      i
    );
  }
  function Rc(i, t) {
    let e = {};
    for (let [n, s] of Object.entries(t))
      e[n] = {
        ...s,
        clip: xc(
          s.keys.map(([r, a, o]) => [r / s.frames, br({ ...i, ...a }), o]),
          !1,
        ),
      };
    return (
      (e.idle = {
        frames: 144,
        clip: xc(
          [
            [0, br(i)],
            [
              0.5,
              br({
                ...i,
                hips: [0, (i.hips || [0, 0.9, 0])[1] - 0.012, 0],
                chest: [
                  (i.chest || [4, 8, 0])[0] + 2,
                  (i.chest || [4, 8, 0])[1],
                  0,
                ],
              }),
            ],
            [1, br(i)],
          ],
          !0,
        ),
      }),
      e
    );
  }
  var x_ = {
      spear: Ut([-0.02, 1.02, 0.28], 18, 32, 0, 0.35),
      gripL: 0.55,
      hipsR: [0, -20, 0],
      chest: [4, 6, 0],
    },
    Qn = {},
    rd = Rc(x_, {
      n1: {
        zh: "\u52FE\u8173\u6383",
        en: "Hook sweep",
        key: "N1",
        frames: 34,
        keys: [
          [0, Qn],
          [
            10,
            {
              spear: Ut([-0.25, 0.95, 0.05], -115, -8, 0, 0.35),
              chest: [6, -35, 0],
              hipsR: [0, -45, 0],
              spine: [8, -10, 0],
            },
          ],
          [
            16,
            {
              spear: Ut([0.15, 0.9, 0.4], 55, -14, 0, 0.35),
              chest: [12, 35, 0],
              hipsR: [0, 15, 0],
              spine: [10, 10, 0],
              hips: [0, 0.84, 0.05],
              footL: [0.2, 0.08, 0.5, 0, 15],
            },
            "snap",
          ],
          [
            24,
            {
              spear: Ut([0.25, 0.95, 0.3], 85, -5, 0, 0.35),
              chest: [8, 40, 0],
              hipsR: [0, 18, 0],
              footL: [0.2, 0.08, 0.5, 0, 15],
            },
          ],
          [34, Qn],
        ],
        hits: [
          {
            f: [13, 17],
            shape: "arc",
            ang: 170,
            range: 2.3,
            kb: "push",
            dmg: 16,
          },
        ],
        lunge: [[8, 16, 0.35, 1]],
      },
      n2: {
        zh: "\u7267\u6756\u6A6B\u6383",
        en: "Wide crook sweep",
        key: "N2",
        frames: 40,
        keys: [
          [0, Qn],
          [
            12,
            {
              spear: Ut([0.3, 1.2, 0.05], 110, 12, 0, 0.35),
              chest: [0, 45, 0],
              hipsR: [0, 30, 0],
              spine: [4, 15, 0],
            },
          ],
          [
            20,
            {
              spear: Ut([-0.2, 1.1, 0.25], -120, 5, 0, 0.35),
              chest: [6, -40, 0],
              hipsR: [0, -40, 0],
              spin: -40,
            },
            "snap",
          ],
          [
            28,
            {
              spear: Ut([-0.25, 1.05, 0], -160, 0, 0, 0.35),
              chest: [4, -50, 0],
              hipsR: [0, -45, 0],
              spin: -60,
            },
          ],
          [40, Qn],
        ],
        hits: [
          {
            f: [16, 22],
            shape: "arc",
            ang: 260,
            dir: -20,
            range: 2.6,
            kb: "blow",
            dmg: 18,
          },
        ],
        lunge: [[10, 20, 0.25, 1]],
      },
      n3: {
        zh: "\u9802\u6756",
        en: "Crook thrust",
        key: "N3",
        frames: 36,
        keys: [
          [0, Qn],
          [
            10,
            {
              spear: Ut([-0.05, 1.15, -0.15], 0, 4, 90, 0.5),
              chest: [0, -15, 0],
              hipsR: [0, -35, 0],
              hips: [0, 0.86, -0.05],
            },
          ],
          [
            16,
            {
              spear: Ut([0, 1.15, 0.75], 0, 0, 90, 0.5),
              chest: [12, 5, 0],
              hipsR: [0, -5, 0],
              hips: [0, 0.84, 0.12],
              footL: [0.18, 0.08, 0.62, 0, 10],
              footR: [-0.2, 0.08, -0.35, 0, -30],
            },
            "snap",
          ],
          [
            24,
            {
              spear: Ut([0, 1.15, 0.7], 0, 0, 90, 0.5),
              chest: [10, 5, 0],
              hips: [0, 0.84, 0.1],
              footL: [0.18, 0.08, 0.62, 0, 10],
              footR: [-0.2, 0.08, -0.35, 0, -30],
            },
          ],
          [36, Qn],
        ],
        hits: [
          {
            f: [14, 18],
            shape: "line",
            len: 2.7,
            width: 1.2,
            kb: "push",
            force: 7,
            dmg: 20,
          },
        ],
        lunge: [[10, 16, 0.6, 1]],
      },
      c1: {
        zh: "\u52FE\u62C9\u30FB\u9813\u6756",
        en: "Hook, drag and slam",
        key: "C1",
        frames: 56,
        keys: [
          [0, Qn],
          [
            12,
            {
              spear: Ut([0, 1.1, 0.8], 0, -12, 0, 0.4),
              chest: [16, 0, 0],
              hips: [0, 0.82, 0.15],
              hipsR: [0, 0, 0],
              footL: [0.2, 0.08, 0.65, 0, 10],
            },
            "snap",
          ],
          [
            20,
            {
              spear: Ut([0, 1.12, 0.78], 0, -6, 0, 0.4),
              chest: [14, 0, 0],
              hips: [0, 0.82, 0.12],
              hipsR: [0, 0, 0],
              footL: [0.2, 0.08, 0.65, 0, 10],
            },
          ],
          [
            30,
            {
              spear: Ut([-0.05, 1.05, 0], 0, 10, 0, 0.4),
              chest: [-8, 0, 0],
              hips: [0, 0.88, -0.1],
              hipsR: [0, 0, 0],
            },
          ],
          [
            40,
            {
              spear: Ut([0, 1.5, 0.05], 0, 95, 0, 0.35),
              chest: [-10, 0, 0],
              hipsR: [0, 0, 0],
            },
          ],
          [
            46,
            {
              spear: Ut([0, 0.9, 0.55], 0, -35, 0, 0.35),
              chest: [22, 0, 0],
              hips: [0, 0.78, 0.1],
              hipsR: [0, 0, 0],
              footL: [0.2, 0.08, 0.5, 0, 10],
            },
            "snap",
          ],
          [
            50,
            {
              spear: Ut([0, 0.9, 0.55], 0, -35, 0, 0.35),
              chest: [22, 0, 0],
              hips: [0, 0.78, 0.1],
              hipsR: [0, 0, 0],
              footL: [0.2, 0.08, 0.5, 0, 10],
            },
          ],
          [56, Qn],
        ],
        hits: [
          {
            f: [18, 21],
            shape: "line",
            len: 3,
            width: 1.6,
            kb: "pull",
            dmg: 10,
          },
          {
            f: [44, 48],
            shape: "arc",
            ang: 110,
            range: 2.4,
            kb: "slam",
            dmg: 26,
            heavy: !0,
          },
        ],
        lunge: [
          [6, 12, 0.4, 1],
          [24, 32, -0.4, 0],
        ],
      },
      musou: {
        zh: "\u7267\u7F8A\u6B78\u6B04",
        en: "Shepherd's round-up",
        key: "\u7121\u96D9",
        frames: 210,
        musou: !0,
        keys: [
          [0, Qn],
          [
            24,
            {
              spear: Ut([0, 1.55, 0.1], 0, 75, 0, 0.35),
              chest: [-10, 0, 0],
              head: [-10, 0, 0],
              hipsR: [0, 0, 0],
            },
          ],
          [
            34,
            {
              spear: Ut([0.3, 1.1, 0.4], 90, -5, 0, 0.35),
              chest: [6, 40, 0],
              hipsR: [0, 20, 0],
            },
          ],
          [
            46,
            {
              spear: Ut([-0.3, 1.1, 0.4], -90, -5, 0, 0.35),
              chest: [6, -40, 0],
              hipsR: [0, -30, 0],
            },
            "snap",
          ],
          [
            56,
            {
              spear: Ut([0.45, 1.15, 0.1], 90, 0, 0, 0.3),
              chest: [4, 0, 0],
              hipsR: [0, 0, 0],
            },
          ],
          [
            140,
            {
              spear: Ut([0.45, 1.15, 0.1], 90, 0, 0, 0.3),
              chest: [4, 0, 0],
              hipsR: [0, 0, 0],
              spin: -1080,
            },
            "lin",
          ],
          [
            155,
            {
              spear: Ut([0, 1.6, 0.1], 0, 100, 0, 0.35),
              chest: [-12, 0, 0],
              head: [-8, 0, 0],
              hipsR: [0, 0, 0],
              spin: -1080,
            },
          ],
          [
            178,
            {
              spear: Ut([0, 0.7, 0.5], 0, -75, 0, 0.35),
              chest: [24, 0, 0],
              hips: [0, 0.76, 0.1],
              hipsR: [0, 0, 0],
              spin: -1080,
              footL: [0.2, 0.08, 0.5, 0, 10],
            },
            "snap",
          ],
          [
            196,
            {
              spear: Ut([0, 0.7, 0.5], 0, -75, 0, 0.35),
              chest: [20, 0, 0],
              hips: [0, 0.78, 0.1],
              hipsR: [0, 0, 0],
              spin: -1080,
              footL: [0.2, 0.08, 0.5, 0, 10],
            },
          ],
          [210, { spin: -1080 }],
        ],
        hits: [
          { f: [44, 46], shape: "circle", range: 6.5, kb: "pull", dmg: 6 },
          { f: [76, 78], shape: "circle", range: 3, kb: "spin", dmg: 10 },
          { f: [104, 106], shape: "circle", range: 3, kb: "spin", dmg: 10 },
          { f: [132, 134], shape: "circle", range: 3, kb: "spin", dmg: 10 },
          {
            f: [178, 180],
            shape: "circle",
            range: 7,
            kb: "launch",
            dmg: 40,
            heavy: !0,
          },
        ],
      },
    }),
    v_ = {
      spear: [-0.3, 0.95, 0.22, 0, -60, 90],
      gripR: 0,
      gripL: 0.5,
      lfree: 1,
      armL: [-20, 0, 25, 60],
      hipsR: [0, -15, 0],
      chest: [6, 4, 0],
    },
    Ti = {},
    ad = (i) => ({
      armL: [-70, 0, 75, 100],
      chest: [0, 30, 0],
      hipsR: [0, 10, 0],
      ...i,
    }),
    wc = (i) => ({
      armL: [-85, 0, -25, 10],
      chest: [8, -25, 0],
      hipsR: [0, -20, 0],
      footL: [0.17, 0.08, 0.45, 0, 10],
      ...i,
    }),
    od = (i) => ({
      spear: [-0.5, 1.3, 0, -110, 25, 0],
      chest: [0, -35, 0],
      armL: [-40, 0, 40, 70],
      ...i,
    }),
    Ac = (i) => ({
      spear: [0.05, 1.1, 0.45, 70, -5, 0],
      chest: [8, 30, 0],
      armL: [-30, 0, 50, 80],
      footR: [-0.2, 0.08, 0.2, 0, -20],
      ...i,
    }),
    ld = (i) => ({
      spear: [-0.15, 1.55, 0.25, 30, 70, 0],
      armL: [-160, 0, -15, 20],
      chest: [-6, 0, 0],
      hips: [0, 0.92, 0],
      hipsR: [0, 0, 0],
      ...i,
    }),
    Oo = (i) => ({
      spear: [-0.45, 0.95, 0.35, -80, -25, 0],
      armL: [-45, 0, 75, 5],
      chest: [16, 0, 0],
      hips: [0, 0.8, 0.08],
      hipsR: [0, 0, 0],
      ...i,
    }),
    Bo = (i) => ({
      spear: [-0.55, 1.3, 0, -90, 0, 0],
      armL: [-90, 0, 85, 0],
      chest: [0, 0, 0],
      hipsR: [0, 0, 0],
      ...i,
    }),
    ki = [
      [0, 0],
      [1.9, 2.9],
      [-1.9, 2.3],
      [1.9, 0.7],
      [-1.9, 0.1],
      [1.2, 3.4],
      [0, 1.4],
    ];
  function y_() {
    let i = [
      [0, Ti],
      [
        16,
        {
          hips: [0, 0.8, 0],
          chest: [16, 0, 0],
          armL: [-40, 0, 60, 40],
          spear: [-0.45, 1, 0.1, -100, 10, 0],
        },
      ],
    ];
    for (let t = 0; t < 6; t++) {
      let e = 20 + t * 15;
      (i.push([
        e + 2,
        t % 2 ? od({ hips: [0, 0.84, 0] }) : ad({ hips: [0, 0.84, 0] }),
      ]),
        i.push([
          e + 10,
          t % 2 ? Ac({ hips: [0, 0.82, 0.05] }) : wc({ hips: [0, 0.82, 0.05] }),
          "snap",
        ]));
    }
    return (
      i.push(
        [112, Bo()],
        [158, Bo({ spin: -1440 }), "lin"],
        [170, ld({ spin: -1440 })],
        [180, Oo({ spin: -1440 }), "snap"],
        [192, Oo({ spin: -1440 })],
        [200, { spin: -1440 }],
      ),
      i
    );
  }
  var cd = Rc(v_, {
      n1: {
        zh: "\u5DE6\u526A",
        en: "Left snip",
        key: "N1",
        frames: 24,
        keys: [
          [0, Ti],
          [6, ad()],
          [10, wc(), "snap"],
          [15, wc()],
          [24, Ti],
        ],
        hits: [
          {
            f: [8, 11],
            shape: "arc",
            ang: 130,
            range: 1.8,
            kb: "push",
            dmg: 8,
          },
        ],
        lunge: [[4, 10, 0.3, 1]],
      },
      n2: {
        zh: "\u53F3\u526A",
        en: "Right snip",
        key: "N2",
        frames: 24,
        keys: [
          [0, Ti],
          [5, od()],
          [10, Ac(), "snap"],
          [15, Ac()],
          [24, Ti],
        ],
        hits: [
          {
            f: [8, 11],
            shape: "arc",
            ang: 130,
            range: 1.8,
            kb: "push",
            dmg: 8,
          },
        ],
        lunge: [[3, 10, 0.3, 1]],
      },
      n3: {
        zh: "\u4EA4\u53C9\u526A",
        en: "Cross cut",
        key: "N3",
        frames: 30,
        keys: [
          [0, Ti],
          [8, ld()],
          [14, Oo(), "snap"],
          [20, Oo()],
          [30, Ti],
        ],
        hits: [
          {
            f: [12, 15],
            shape: "arc",
            ang: 150,
            range: 2,
            kb: "blow",
            dmg: 14,
          },
        ],
        lunge: [[5, 14, 0.4, 1]],
      },
      c1: {
        zh: "\u65CB\u98A8\u526A",
        en: "Shear tornado",
        key: "C1",
        frames: 50,
        keys: [
          [0, Ti],
          [8, Bo()],
          [44, Bo({ spin: -1080 }), "lin"],
          [50, { spin: -1080 }],
        ],
        hits: [14, 24, 34, 43].map((i) => ({
          f: [i, i + 1],
          shape: "circle",
          range: 1.9,
          kb: "spin",
          dmg: 6,
        })),
        lunge: [[8, 44, 1.6, 1]],
      },
      musou: {
        zh: "\u5343\u526A\u98DB\u82B1",
        en: "Thousand snips",
        key: "\u7121\u96D9",
        frames: 200,
        musou: !0,
        keys: y_(),
        hits: [
          ...ki
            .slice(1)
            .map((i, t) => ({
              f: [30 + t * 15, 31 + t * 15],
              shape: "circle",
              range: 1.5,
              kb: "spin",
              dmg: 10,
            })),
          ...[120, 130, 140, 150].map((i) => ({
            f: [i, i + 1],
            shape: "circle",
            range: 2.4,
            kb: "spin",
            dmg: 8,
          })),
          {
            f: [180, 182],
            shape: "circle",
            range: 6,
            kb: "launch",
            dmg: 40,
            heavy: !0,
          },
        ],
        path(i) {
          if (i < 20)
            return { x: 0, z: 0, yaw: Math.atan2(ki[1][0], ki[1][1]) };
          let t = Math.min(5, Math.floor((i - 20) / 15));
          if (i >= 110) return { x: ki[6][0], z: ki[6][1], yaw: 0 };
          let e = Math.min(1, (i - 20 - t * 15) / 11),
            n = ki[t],
            s = ki[t + 1],
            r = 1 - (1 - e) * (1 - e);
          return {
            x: n[0] + (s[0] - n[0]) * r,
            z: n[1] + (s[1] - n[1]) * r,
            yaw: Math.atan2(s[0] - n[0], s[1] - n[1]),
          };
        },
      },
    }),
    M_ = {
      spear: Ut([-0.05, 1.05, 0.3], 20, 40, 90, 0.4),
      gripL: 0.6,
      hipsR: [0, -22, 0],
      chest: [2, 6, 0],
    },
    Vn = {},
    nd = (i) => ({
      spear: Ut([0.35, 1.2, 0], 125, 8, 0, 0.4),
      chest: [0, 50, 0],
      hipsR: [0, 35, 0],
      ...i,
    }),
    Tc = (i) => ({
      spear: Ut([-0.3, 1.1, 0.25], -125, 2, 0, 0.4),
      chest: [8, -45, 0],
      hipsR: [0, -35, 0],
      ...i,
    }),
    id = (i) => ({
      hips: [0, 0.75, 0],
      chest: [20, 0, 0],
      spear: Ut([0, 1, 0.3], 0, 20, 90, 0.4),
      hipsR: [0, 0, 0],
      ...i,
    }),
    sd = (i) => ({
      spear: Ut([0, 1.7, -0.1], 0, 120, 90, 0.35),
      chest: [-15, 0, 0],
      hipsR: [0, 0, 0],
      footL: [0.17, 0.2, 0.25, -20, 10],
      footR: [-0.2, 0.25, -0.1, -20, -20],
      ...i,
    }),
    Fo = (i) => ({
      spear: Ut([0, 0.75, 0.6], 0, -35, 90, 0.4),
      chest: [28, 0, 0],
      hips: [0, 0.74, 0.1],
      hipsR: [0, 0, 0],
      footL: [0.2, 0.08, 0.5, 0, 10],
      ...i,
    }),
    hd = Rc(M_, {
      n1: {
        zh: "\u5043\u6708\u65AC",
        en: "Crescent chop",
        key: "N1",
        frames: 44,
        keys: [
          [0, Vn],
          [
            14,
            {
              spear: Ut([-0.1, 1.55, -0.05], 15, 115, 90, 0.35),
              chest: [-12, 20, 0],
              hipsR: [0, -10, 0],
            },
          ],
          [
            22,
            {
              spear: Ut([0.05, 0.95, 0.55], -5, -20, 90, 0.4),
              chest: [24, -10, 0],
              hips: [0, 0.8, 0.1],
              hipsR: [0, -10, 0],
              footL: [0.18, 0.08, 0.55, 0, 10],
            },
            "snap",
          ],
          [
            32,
            {
              spear: Ut([0.05, 0.95, 0.55], -5, -22, 90, 0.4),
              chest: [22, -10, 0],
              hips: [0, 0.8, 0.1],
              hipsR: [0, -10, 0],
              footL: [0.18, 0.08, 0.55, 0, 10],
            },
          ],
          [44, Vn],
        ],
        hits: [
          {
            f: [20, 24],
            shape: "arc",
            ang: 70,
            range: 3.1,
            kb: "slam",
            dmg: 30,
            heavy: !0,
          },
        ],
        lunge: [[12, 22, 0.5, 1]],
      },
      n2: {
        zh: "\u72FC\u7259\u6A6B\u6383",
        en: "Wolf-fang sweep",
        key: "N2",
        frames: 48,
        keys: [
          [0, Vn],
          [16, nd()],
          [24, Tc({ spin: -70 }), "snap"],
          [
            34,
            {
              spear: Ut([-0.3, 1.05, -0.05], -165, 0, 0, 0.4),
              chest: [4, -50, 0],
              hipsR: [0, -40, 0],
              spin: -90,
            },
          ],
          [48, Vn],
        ],
        hits: [
          {
            f: [20, 27],
            shape: "arc",
            ang: 280,
            dir: -20,
            range: 3.2,
            kb: "blow",
            dmg: 24,
          },
        ],
        lunge: [[14, 24, 0.3, 1]],
      },
      n3: {
        zh: "\u7A81\u523A",
        en: "Lunging thrust",
        key: "N3",
        frames: 40,
        keys: [
          [0, Vn],
          [
            12,
            {
              spear: Ut([-0.05, 1.2, -0.25], 0, 5, 90, 0.6),
              chest: [0, -20, 0],
              hipsR: [0, -40, 0],
            },
          ],
          [
            18,
            {
              spear: Ut([0, 1.15, 0.85], 0, 0, 90, 0.6),
              chest: [14, 5, 0],
              hips: [0, 0.82, 0.15],
              hipsR: [0, -5, 0],
              footL: [0.2, 0.08, 0.7, 0, 10],
            },
            "snap",
          ],
          [
            28,
            {
              spear: Ut([0, 1.15, 0.8], 0, 0, 90, 0.6),
              chest: [12, 5, 0],
              hips: [0, 0.82, 0.12],
              hipsR: [0, -5, 0],
              footL: [0.2, 0.08, 0.7, 0, 10],
            },
          ],
          [40, Vn],
        ],
        hits: [
          {
            f: [16, 20],
            shape: "line",
            len: 3.6,
            width: 1.3,
            kb: "push",
            force: 8,
            dmg: 22,
          },
        ],
        lunge: [[10, 18, 1.3, 1]],
      },
      c1: {
        zh: "\u8E8D\u65AC",
        en: "Leaping slam",
        key: "C1",
        frames: 64,
        keys: [
          [0, Vn],
          [14, id()],
          [26, sd()],
          [36, Fo(), "snap"],
          [50, Fo()],
          [64, Vn],
        ],
        hits: [
          {
            f: [35, 38],
            shape: "circle",
            range: 3.4,
            kb: "slam",
            dmg: 34,
            heavy: !0,
          },
        ],
        rise: [
          [14, 26, 1.3],
          [26, 36, -1.3],
        ],
        lunge: [[14, 36, 1.2, 1]],
      },
      musou: {
        zh: "\u66B4\u6012\u30FB\u65B7\u6708",
        en: "Rage: moonbreaker",
        key: "\u66B4\u6012",
        frames: 180,
        musou: !0,
        rage: !0,
        keys: [
          [0, Vn],
          [14, nd()],
          [24, Tc({ spin: -70 }), "snap"],
          [44, Tc({ spin: -360 }), "lin"],
          [
            56,
            {
              spear: Ut([-0.35, 1.2, 0], -125, 8, 0, 0.4),
              chest: [0, -50, 0],
              hipsR: [0, -35, 0],
              spin: -360,
            },
          ],
          [
            66,
            {
              spear: Ut([0.3, 1.1, 0.25], 125, 2, 0, 0.4),
              chest: [8, 45, 0],
              hipsR: [0, 35, 0],
              spin: -290,
            },
            "snap",
          ],
          [
            84,
            {
              spear: Ut([0.3, 1.1, 0.25], 125, 2, 0, 0.4),
              chest: [8, 45, 0],
              hipsR: [0, 35, 0],
              spin: 0,
            },
            "lin",
          ],
          [96, id()],
          [110, sd()],
          [122, Fo(), "snap"],
          [150, Fo()],
          [180, Vn],
        ],
        hits: [
          { f: [22, 44], shape: "circle", range: 3.2, kb: "blow", dmg: 18 },
          { f: [64, 84], shape: "circle", range: 3.2, kb: "blow", dmg: 18 },
          {
            f: [121, 124],
            shape: "circle",
            range: 6,
            kb: "launch",
            dmg: 40,
            heavy: !0,
          },
        ],
        rise: [
          [96, 110, 1.8],
          [110, 122, -1.8],
        ],
        lunge: [[96, 122, 1.4, 1]],
      },
    }),
    Cs = ["n1", "n2", "n3", "c1", "musou"];
  var Hn = {
      gok: {
        name: "\u963F\u89D2",
        seal: "\u7267\u6756",
        sub: "Ah Gok \xB7 \u7267\u6756 shepherd's crook",
        note: "Heavy \xB7 spear joint",
        kit: rd,
        build: ju,
        scale: 1,
        accent: "#d0a84e",
        aura: [1, 0.86, 0.55],
        crowd: Ec,
        trail: [0.95, 0.85, 0.6],
      },
      siume: {
        name: "\u5C0F\u54A9",
        seal: "\u96D9\u526A",
        sub: "Siu Me \xB7 \u96D9\u526A twin shears",
        note: "Fast \xB7 new dual-wield rig",
        kit: cd,
        build: Qu,
        scale: 0.94,
        accent: "#e0524a",
        aura: [1, 0.35, 0.3],
        crowd: Ec,
        trail: [1, 0.55, 0.5],
      },
      warden: {
        name: "\u72FC\u7763",
        seal: "\u9996\u9818",
        sub: "Warden-Wolf \xB7 \u5043\u6708\u5927\u5200 glaive",
        note: "Boss \xB7 1.15\xD7 scale",
        kit: hd,
        build: td,
        scale: 1.15,
        accent: "#e0a030",
        aura: [1, 0.6, 0.15],
        crowd: ed,
        trail: [0.8, 0.88, 1],
      },
    },
    S_ = {
      flinch: "\u602F",
      push: "\u63A8",
      blow: "\u5439\u98DB",
      spin: "\u65CB\u98DB",
      slam: "\u53E9\u4ED8",
      launch: "\u6253\u4E0A",
      pull: "\u52FE\u62C9",
    },
    ko = document.getElementById("stage"),
    on = new wo({
      antialias: !0,
      powerPreference: "high-performance",
      preserveDrawingBuffer: !0,
    });
  on.setPixelRatio(Math.min(2, devicePixelRatio));
  on.shadowMap.enabled = !0;
  on.outputColorSpace = ke;
  on.toneMapping = lr;
  on.toneMappingExposure = 1.05;
  ko.prepend(on.domElement);
  var Ye = new Ys(),
    gd = 2304563;
  Ye.background = new Rt(gd);
  Ye.fog = new qs(gd, 14, 34);
  Ye.add(new ir(12110048, 4864556, 1));
  var Is = new xs(16767144, 2.6);
  Is.position.set(-5, 8, 6);
  Is.castShadow = !0;
  Is.shadow.mapSize.set(2048, 2048);
  Object.assign(Is.shadow.camera, {
    left: -9,
    right: 9,
    top: 9,
    bottom: -9,
    near: 0.5,
    far: 40,
  });
  Ye.add(Is, Is.target);
  var _d = new xs(10467544, 0.9);
  _d.position.set(4, 3, -6);
  Ye.add(_d);
  {
    let i = document.createElement("canvas");
    i.width = i.height = 64;
    let t = i.getContext("2d");
    for (let s = 0; s < 64; s++)
      for (let r = 0; r < 64; r++) {
        let a = Math.abs((Math.sin(r * 12.9898 + s * 78.233) * 43758.5453) % 1),
          o = 70 + a * 18;
        ((t.fillStyle = `rgb(${o + 4},${o + 2},${o - 8})`),
          t.fillRect(r, s, 1, 1));
      }
    let e = new Qs(i);
    ((e.magFilter = be),
      (e.wrapS = e.wrapT = cs),
      e.repeat.set(24, 24),
      (e.colorSpace = ke));
    let n = new _e(new pi(60, 60), new En({ map: e, roughness: 1 }));
    ((n.rotation.x = -Math.PI / 2), (n.receiveShadow = !0), Ye.add(n));
  }
  for (let i = 0; i < 3; i++) {
    let t = new _e(
      new pi(80, 3),
      new $n({
        color: 9082532,
        transparent: !0,
        opacity: 0.08,
        depthWrite: !1,
      }),
    );
    (t.position.set(0, 1 + i * 1.4, -16 - i * 3), Ye.add(t));
  }
  for (let i of Object.keys(Hn)) {
    let t = Hn[i];
    t.rig = Hu();
    let e = new hn();
    (e.add(t.rig.root),
      Ye.add(e),
      (t.group = e),
      (t.model = t.build(t.rig)),
      (e.visible = !1));
  }
  var ud = new D(0, 0, 1.4),
    ti = [];
  function b_(i) {
    for (let t of ti) Ye.remove(t.g);
    ((ti = Array.from({ length: 18 }, () => {
      let t = i();
      return (
        t.traverse((e) => {
          e.material && (e.userData.base = e.material.color.getHex());
        }),
        Ye.add(t),
        {
          g: t,
          v: new D(),
          w: new D(),
          air: !1,
          down: !1,
          hit: new Set(),
          flash: 0,
        }
      );
    })),
      Ns());
  }
  function Ns() {
    ti.forEach((i, t) => {
      let e = (t / ti.length) * Math.PI * 2 + 0.17,
        n = (Ai === "warden" ? 2.9 : 2.4) + (t % 3) * 0.55;
      (i.g.position.set(ud.x + Math.sin(e) * n, 0, ud.z + Math.cos(e) * n),
        i.g.rotation.set(0, Math.atan2(-Math.sin(e), -Math.cos(e)), 0),
        i.v.set(0, 0, 0),
        i.w.set(0, 0, 0),
        (i.air = i.down = !1),
        i.hit.clear(),
        (i.flash = 0));
    });
  }
  var Ps = 10,
    Lc = new Float32Array(Ps * 6),
    zo = new Float32Array(Ps * 6),
    Wi = [],
    Ls = new Fe();
  Ls.setAttribute("position", new He(Lc, 3));
  Ls.setAttribute("color", new He(zo, 3));
  var xd = [];
  for (let i = 0; i < Ps - 1; i++) {
    let t = i * 2;
    xd.push(t, t + 1, t + 2, t + 1, t + 3, t + 2);
  }
  Ls.setIndex(xd);
  var vd = new _e(
    Ls,
    new $n({
      vertexColors: !0,
      transparent: !0,
      blending: Ui,
      depthWrite: !1,
      side: sn,
    }),
  );
  vd.frustumCulled = !1;
  Ye.add(vd);
  var Uc = 160,
    Vo = new Float32Array(Uc * 3),
    yd = [],
    Fc = new Fe();
  Fc.setAttribute("position", new He(Vo, 3));
  var wr = new Ks(
    Fc,
    new ms({
      color: 16767370,
      size: 0.07,
      transparent: !0,
      opacity: 0,
      blending: Ui,
      depthWrite: !1,
    }),
  );
  wr.frustumCulled = !1;
  Ye.add(wr);
  for (let i = 0; i < Uc; i++)
    yd.push({
      a: Math.random() * 6.28,
      r: 0.5 + Math.random() * 1.1,
      y: Math.random() * 2.6,
      s: 0.5 + Math.random(),
    });
  var Hi = new _e(
    new er(0.8, 1, 48),
    new $n({
      color: 16769712,
      transparent: !0,
      opacity: 0,
      blending: Ui,
      depthWrite: !1,
      side: sn,
    }),
  );
  Hi.rotation.x = -Math.PI / 2;
  Ye.add(Hi);
  var Tr = new ar(16760944, 0, 9, 1.6);
  Ye.add(Tr);
  var Cc = document.getElementById("flash"),
    Ar = new De(40, 1, 0.1, 100),
    ne = {
      yaw: 0.72,
      pitch: 0.3,
      dist: 8.2,
      target: new D(0, 1.1, 1.4),
      shake: 0,
    },
    Gi = null;
  on.domElement.addEventListener("pointerdown", (i) => {
    ((Gi = { x: i.clientX, y: i.clientY }),
      on.domElement.setPointerCapture(i.pointerId));
  });
  on.domElement.addEventListener("pointermove", (i) => {
    Gi &&
      ((ne.yaw -= (i.clientX - Gi.x) * 0.008),
      (ne.pitch = Math.min(
        1.2,
        Math.max(0.05, ne.pitch + (i.clientY - Gi.y) * 0.006),
      )),
      (Gi = { x: i.clientX, y: i.clientY }));
  });
  on.domElement.addEventListener("pointerup", () => {
    Gi = null;
  });
  on.domElement.addEventListener(
    "wheel",
    (i) => {
      (i.preventDefault(),
        (ne.dist = Math.min(16, Math.max(4, ne.dist + i.deltaY * 0.01))));
    },
    { passive: !1 },
  );
  function Md() {
    let i = ko.clientWidth,
      t = ko.clientHeight;
    (on.setSize(i, t, !1),
      (Ar.aspect = i / t),
      Ar.updateProjectionMatrix(),
      (ne.base = i < 520 ? 10.5 : 8.2),
      (ne.dist = ne.base));
  }
  new ResizeObserver(Md).observe(ko);
  Md();
  var Ai = "gok",
    je = null,
    an = 0,
    Ir = 0,
    dd = 0,
    Ho = [],
    Xi = !0,
    Rr = !1,
    Dc = 0,
    kn = null,
    Ic = new Float32Array(Sr),
    Re = new D(),
    wi = 0,
    E_ = (i, t) =>
      (i.lunge || []).reduce((e, [n, s, r, a]) => {
        let o = Math.min(1, Math.max(0, (t - n) / (s - n)));
        return e + r * (a ? 1 - (1 - o) * (1 - o) : o * o);
      }, 0),
    fd = (i, t) =>
      (i.rise || []).reduce((e, [n, s, r]) => {
        let a = Math.min(1, Math.max(0, (t - n) / (s - n)));
        return e + r * (r > 0 ? Math.sin((a * Math.PI) / 2) : a * a);
      }, 0);
  function Ds(i) {
    ((je = i),
      (an = 0),
      (Ir = 0),
      (Wi.length = 0),
      (ti.every((t) => t.down || t.air) ||
        ti.filter((t) => t.down).length > 10) &&
        Ns(),
      ti.forEach((t) => t.hit.clear()),
      ei.show(i));
  }
  function Go(i, t) {
    (t && ((Xi = !1), ei.demo(!1)), (Ho = []), Ns(), Ds(i));
  }
  function T_(i, t, e) {
    let n = !1,
      s = Math.sin(wi),
      r = Math.cos(wi);
    for (let a of ti) {
      if (a.down || a.hit.has(t)) continue;
      let o = a.g.position.x - Re.x,
        l = a.g.position.z - Re.z,
        c = Math.hypot(o, l),
        d = o * Math.cos(wi) - l * Math.sin(wi),
        h = o * s + l * r,
        u = !1;
      if (e.shape === "circle") u = c < e.range + 0.4;
      else if (e.shape === "arc") {
        let M = (Math.atan2(d, h) * 180) / Math.PI - (e.dir || 0);
        u = c < e.range + 0.4 && Math.abs(((M + 540) % 360) - 180) <= e.ang / 2;
      } else
        e.shape === "line" &&
          (u = h > -0.3 && h < e.len + 0.4 && Math.abs(d) < e.width / 2 + 0.4);
      if (!u) continue;
      ((n = !0), a.hit.add(t), (a.flash = 1), Dc++);
      let m = c > 0.01 ? 1 / c : 0,
        _ = (e.force || 4) * (e.kb === "push" ? 0.5 : 0.8);
      (e.kb === "pull"
        ? a.v.set(
            -o * m * Math.min(5, c * 1.6),
            2.2,
            -l * m * Math.min(5, c * 1.6),
          )
        : a.v.set(
            o * m * _,
            2 +
              (e.kb === "slam" ? 2 : e.kb === "launch" ? 5 : 0) +
              Math.random(),
            l * m * _,
          ),
        e.kb === "spin" && a.v.add(new D(l * m * 4, 0, -o * m * 4)),
        a.w.set(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 14,
        ),
        (a.air = !0));
    }
    (n &&
      ((Ir = Math.max(Ir, e.hitstop || (e.heavy ? 6 : 3))),
      (ne.shake = Math.max(ne.shake, e.heavy ? 0.35 : 0.12)),
      ei.kos(Dc)),
      e.heavy &&
        ((kn = {
          t: 0,
          big: !!i.musou,
          x: Re.x,
          z: Re.z + (i.musou ? 0 : 1.6),
        }),
        i.musou &&
          (Cc.classList.remove("go"), Cc.offsetWidth, Cc.classList.add("go"))));
  }
  function Cr() {
    let i = 0.016666666666666666,
      t = Hn[Ai];
    for (let o of ti)
      (o.flash > 0 && (o.flash = Math.max(0, o.flash - i * 3)),
        o.g.traverse((l) => {
          l.material &&
            l.userData.base !== void 0 &&
            l.material.color.setHex(l.userData.base).lerp(w_, o.flash * 0.8);
        }),
        o.air &&
          ((o.v.y -= 18 * i),
          o.g.position.addScaledVector(o.v, i),
          (o.g.rotation.x += o.w.x * i),
          (o.g.rotation.z += o.w.z * i),
          (o.g.rotation.y += o.w.y * i),
          o.g.position.y <= 0 &&
            o.v.y < 0 &&
            ((o.air = !1),
            (o.down = !0),
            o.g.rotation.set(-Math.PI / 2, o.g.rotation.y, 0),
            (o.g.position.y = 0.15))));
    if (Ir > 0) {
      Ir--;
      return;
    }
    let e = t.kit;
    if (!je)
      ((dd += i),
        vc(e.idle.clip, (dd / 2.4) % 1, Ic),
        Re.set(0, 0, 0),
        (wi = 0));
    else {
      let o = e[je];
      if ((vc(o.clip, Math.min(1, an / o.frames), Ic), o.path)) {
        let l = o.path(an);
        (Re.set(l.x, fd(o, an), l.z), (wi = l.yaw));
      } else (Re.set(0, fd(o, an), E_(o, an)), (wi = 0));
      if (
        (o.hits.forEach((l, c) => {
          an >= l.f[0] && an <= l.f[1] && T_(o, c, l);
        }),
        an++,
        an > o.frames)
      )
        if (Ho.length) Ds(Ho.shift());
        else if (Xi) {
          let l = Cs.indexOf(je);
          (l === Cs.length - 1 && Ns(), Ds(Cs[(l + 1) % Cs.length]));
        } else ((je = null), ei.show(null));
      ei.progress(je ? an / e[je].frames : 0);
    }
    let n = t.rig;
    (n.root.scale.set(1, 1, 1),
      n.apply(Ic, Re, wi),
      n.root.scale.setScalar(_c * t.scale),
      n.root.updateMatrixWorld(!0));
    let s = n.joints.weapon,
      [r, a] = t.model.trail;
    (Wi.unshift([
      A_.copy(r).applyMatrix4(s.matrixWorld).toArray(),
      R_.copy(a).applyMatrix4(s.matrixWorld).toArray(),
    ]),
      Wi.length > Ps && Wi.pop(),
      kn && (kn.t += i));
  }
  var w_ = new Rt(1, 0.92, 0.82),
    A_ = new D(),
    R_ = new D(),
    C_ = new D();
  function Sd(i) {
    let t = Hn[Ai],
      e = je ? 1 : 0,
      n = je && t.kit[je].musou,
      s = n ? t.aura : t.trail;
    for (let l = 0; l < Ps; l++) {
      let c = Wi[Math.min(l, Wi.length - 1)] || [
        [0, 0, 0],
        [0, 0, 0],
      ];
      (Lc.set(c[0], l * 6), Lc.set(c[1], l * 6 + 3));
      let d = e * Math.pow(1 - l / Ps, 2) * (n ? 0.8 : 0.55);
      for (let h = 0; h < 2; h++)
        ((zo[l * 6 + h * 3] = s[0] * d),
          (zo[l * 6 + h * 3 + 1] = s[1] * d),
          (zo[l * 6 + h * 3 + 2] = s[2] * d * (h ? 0.5 : 1)));
    }
    Ls.attributes.position.needsUpdate = Ls.attributes.color.needsUpdate = !0;
    let r = n ? an : 0,
      a = n ? t.kit[je].frames : 1,
      o = n ? Math.min(1, r / 14) * Math.max(0, Math.min(1, (a - r) / 20)) : 0;
    ((wr.material.opacity += (o * 0.9 - wr.material.opacity) * 0.15),
      wr.material.color.setRGB(t.aura[0], t.aura[1], t.aura[2]));
    for (let l = 0; l < Uc; l++) {
      let c = yd[l];
      ((c.y += 0.018 * c.s), c.y > 2.6 && (c.y = 0));
      let d = c.a + i * 1.6 * c.s;
      ((Vo[l * 3] = Re.x + Math.sin(d) * c.r),
        (Vo[l * 3 + 1] = Re.y + c.y),
        (Vo[l * 3 + 2] = Re.z + Math.cos(d) * c.r));
    }
    if (
      ((Fc.attributes.position.needsUpdate = !0),
      Tr.position.set(Re.x, Re.y + 1.4, Re.z),
      Tr.color.setRGB(t.aura[0], t.aura[1], t.aura[2]),
      (Tr.intensity +=
        ((o ? 6 + Math.sin(i * 18) * 1.5 : 0) - Tr.intensity) * 0.2),
      kn)
    ) {
      let l = kn.t,
        c = kn.big ? 9 : 4.5,
        d = Math.min(1, l / 0.6);
      (Hi.position.set(kn.x, 0.03, kn.z),
        Hi.scale.setScalar(0.5 + d * d * (3 - 2 * d) * c),
        (Hi.material.opacity = Math.max(0, 0.95 - l * 1.4)),
        Hi.material.color.setRGB(t.aura[0], t.aura[1], t.aura[2]),
        l > 1.2 && (kn = null));
    } else Hi.material.opacity = 0;
  }
  var Pc = 0,
    Nc = performance.now(),
    pd = 0,
    md = !!new URLSearchParams(location.search).get("still");
  function bd(i) {
    let t = Math.min(0.1, (i - Nc) / 1e3);
    ((Nc = i), (pd += t), (Pc += t * (Rr ? 0.25 : 1)));
    let e = 0;
    for (; !md && Pc >= 1 / 60 && e < 5;) (Cr(), (Pc -= 1 / 60), e++);
    Sd(pd);
    let n = je && Hn[Ai].kit[je].musou;
    _n.get("head")
      ? ne.target.set(Re.x, 1.72 * Hn[Ai].scale, Re.z)
      : ne.target.lerp(C_.set(Re.x, 1.1 + Re.y * 0.6, Re.z + 1), 0.06);
    let s = ne.dist + (n ? 2.4 : 0) + (Ai === "warden" ? 0.8 : 0);
    ne.shake *= 0.88;
    let r = ne.shake;
    (Ar.position.set(
      ne.target.x +
        Math.sin(ne.yaw) * Math.cos(ne.pitch) * s +
        (Math.random() - 0.5) * r,
      ne.target.y + Math.sin(ne.pitch) * s + (Math.random() - 0.5) * r,
      ne.target.z + Math.cos(ne.yaw) * Math.cos(ne.pitch) * s,
    ),
      Ar.lookAt(ne.target),
      !Gi && Xi && !md && (ne.yaw += t * 0.08),
      _n.get("yaw") && (ne.yaw = +_n.get("yaw")),
      _n.get("dist") && ((ne.dist = +_n.get("dist")), (ne.pitch = 0.12)),
      on.render(Ye, Ar),
      requestAnimationFrame(bd));
  }
  var ve = (i) => document.querySelector(i),
    ei = {
      show(i) {
        if (
          (document
            .querySelectorAll("[data-move]")
            .forEach((n) =>
              n.setAttribute(
                "aria-pressed",
                n.dataset.move === i ? "true" : "false",
              ),
            ),
          !i)
        )
          return;
        let t = Hn[Ai].kit[i];
        ((ve("#mv-key").textContent = t.key),
          (ve("#mv-zh").textContent = t.zh),
          (ve("#mv-en").textContent = t.en),
          (ve("#d-frames").textContent = t.frames),
          (ve("#d-hits").textContent =
            t.hits.length > 3
              ? `${t.hits.length} windows`
              : t.hits.map((n) => `${n.f[0]}\u2013${n.f[1]}`).join(" \xB7 ")),
          (ve("#d-dmg").textContent =
            t.hits.length > 3
              ? t.hits.reduce((n, s) => n + s.dmg, 0)
              : t.hits.map((n) => n.dmg).join(" + ")),
          (ve("#d-kb").textContent = [
            ...new Set(t.hits.map((n) => S_[n.kb] || n.kb)),
          ].join(" / ")),
          (ve("#d-shape").textContent = [
            ...new Set(
              t.hits.map((n) =>
                n.shape === "arc"
                  ? `\u5F27 ${n.ang}\xB0`
                  : n.shape === "circle"
                    ? `\u5713 ${n.range}m`
                    : `\u7DDA ${n.len}m`,
              ),
            ),
          ].join(" / ")));
        let e = ve("#timeline");
        e.querySelectorAll(".win").forEach((n) => n.remove());
        for (let n of t.hits) {
          let s = document.createElement("i");
          ((s.className = "win"),
            (s.style.left = `${(n.f[0] / t.frames) * 100}%`),
            (s.style.width = `${Math.max(0.8, ((n.f[1] - n.f[0] + 1) / t.frames) * 100)}%`),
            e.appendChild(s));
        }
      },
      progress(i) {
        ve("#playhead").style.left = `${i * 100}%`;
      },
      kos(i) {
        ve("#kos").textContent = i;
      },
      demo(i) {
        ve("#demo-state").textContent = i
          ? "\u81EA\u52D5\u6F14\u793A\u4E2D"
          : "\u624B\u52D5";
      },
    };
  function Wo(i) {
    Ai = i;
    let t = Hn[i];
    for (let [n, s] of Object.entries(Hn)) s.group.visible = n === i;
    (document.documentElement.style.setProperty("--accent", t.accent),
      (ve("#c-name").textContent = t.name),
      (ve("#c-seal").textContent = t.seal),
      (ve("#c-sub").textContent = t.sub),
      (ve("#c-note").textContent = t.note),
      document
        .querySelectorAll("[data-char]")
        .forEach((n) =>
          n.setAttribute(
            "aria-pressed",
            n.dataset.char === i ? "true" : "false",
          ),
        ));
    let e = ve("#moves");
    ((e.innerHTML = ""),
      Cs.forEach((n, s) => {
        let r = t.kit[n],
          a = document.createElement("button");
        ((a.className = "mv" + (r.musou ? " musou" : "")),
          (a.dataset.move = n),
          a.setAttribute("aria-pressed", "false"),
          (a.innerHTML = `<span class="k">${r.key} \xB7 ${r.musou ? "M" : s + 1}</span><span class="zh">${r.zh}</span>`),
          a.addEventListener("click", () => Go(n, !0)),
          e.appendChild(a));
      }),
      (Dc = 0),
      ei.kos(0),
      b_(t.crowd),
      (Wi.length = 0),
      (kn = null),
      (ve("#btn-combo").textContent = "\u9023\u62DB N1\u2192N3\u2192C1"),
      Ds("n1"));
  }
  document
    .querySelectorAll("[data-char]")
    .forEach((i) => i.addEventListener("click", () => Wo(i.dataset.char)));
  ve("#btn-combo").addEventListener("click", () => {
    ((Xi = !1), ei.demo(!1), Ns(), (Ho = ["n2", "n3", "c1"]), Ds("n1"));
  });
  ve("#btn-slow").addEventListener("click", (i) => {
    ((Rr = !Rr), i.currentTarget.setAttribute("aria-pressed", String(Rr)));
  });
  ve("#btn-demo").addEventListener("click", () => {
    ((Xi = !0), ei.demo(!0), Ns(), Ds("n1"));
  });
  addEventListener("keydown", (i) => {
    let t = { 1: "n1", 2: "n2", 3: "n3", 4: "c1", m: "musou", M: "musou" }[
      i.key
    ];
    t && Go(t, !0);
    let e = { z: "gok", x: "siume", c: "warden" }[i.key.toLowerCase()];
    e && Wo(e);
  });
  var _n = new URLSearchParams(location.search);
  Wo(_n.get("char") in Hn ? _n.get("char") : "gok");
  if (_n.get("move")) {
    Go(_n.get("move"), !0);
    for (let i = 0, t = +(_n.get("f") || 0); i < t; i++) Cr();
  } else if (_n.get("still")) {
    je = null;
    for (let i = 0; i < 3; i++) Cr();
  } else for (let i = 0; i < 60; i++) Cr();
  _n.get("still") && ((Rr = !1), (Nc = performance.now()), Sd(0));
  ei.demo(Xi);
  requestAnimationFrame(bd);
  window.__bench = {
    step: Cr,
    setChar: Wo,
    pick: Go,
    get f() {
      return an;
    },
  };
})();
/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
