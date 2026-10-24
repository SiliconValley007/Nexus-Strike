(() => {
  const C = document.getElementById("c");
  const X = C.getContext("2d", { alpha: false }) || C.getContext("2d");
  const UI = document.getElementById("overlay");
  const hpT = document.getElementById("hpT"),
    hpB = document.getElementById("hpB"),
    scT = document.getElementById("scT"),
    wvT = document.getElementById("wvT"),
    cbT = document.getElementById("cbT");
  const ovSub = document.getElementById("ovSub"),
    ovHint = document.getElementById("ovHint"),
    diffRow = document.getElementById("diffRow");
  const bPlay = document.getElementById("bPlay"),
    bResume = document.getElementById("bResume"),
    bRestart = document.getElementById("bRestart"),
    bMusic = document.getElementById("bMusic"),
    bSfx = document.getElementById("bSfx"),
    bTitle = document.getElementById("bTitle"),
    bInstall = document.getElementById("bInstall"),
    pauseBtn = document.getElementById("pauseBtn"),
    dashBtn = document.getElementById("dashBtn"),
    bEasy = document.getElementById("bEasy"),
    bNorm = document.getElementById("bNorm"),
    bHard = document.getElementById("bHard");
  const HS = "nexus-strike-hs-",
    VW = 1280,
    VH = 720,
    TAU = Math.PI * 2,
    STEP = 1 / 60,
    ACC_MAX = 0.2;
  const DIFFS = {
    easy: { hp: 140, dmg: 0.65, sp: 0.82, n: 0.75, drop: 1.4, name: "easy" },
    normal: { hp: 100, dmg: 1, sp: 1, n: 1, drop: 1, name: "normal" },
    hard: { hp: 80, dmg: 1.4, sp: 1.22, n: 1.28, drop: 0.7, name: "hard" },
  };
  let W = 0,
    H = 0,
    DPR = 1,
    scale = 1,
    offX = 0,
    offY = 0,
    running = 0,
    paused = 0,
    mode = "title",
    musOn = 1,
    sfxOn = 1,
    t0 = 0,
    acc = 0,
    stop = 0,
    q = 1,
    fSum = 0,
    fN = 0,
     diff = DIFFS.normal,
     runDiff = "normal",
     savedRun = 1;
  const memHS = { easy: 0, normal: 0, hard: 0 };
  try {
    musOn = localStorage.getItem(HS + "m") === "0" ? 0 : 1;
    sfxOn = localStorage.getItem(HS + "x") === "0" ? 0 : 1;
  } catch (e) {}
  function loadHS(k) {
    try {
      const v = +localStorage.getItem(HS + k);
      if (v === v) {
        memHS[k] = v;
        return v;
      }
    } catch (e) {}
    return memHS[k] | 0;
  }
  function saveHS(k, v) {
    memHS[k] = v;
    try {
      localStorage.setItem(HS + k, String(v));
    } catch (e) {}
  }
  function persistBest() {
    if (savedRun || score <= 0) return;
    if (
      mode !== "play" &&
      mode !== "pause" &&
      mode !== "rotate" &&
      mode !== "dead"
    )
      return;
    const k = runDiff;
    const cur = loadHS(k);
    if (score > cur) {
      saveHS(k, score);
      if (k === diff.name) best = score;
    }
  }
  function lockRun() {
    persistBest();
    savedRun = 1;
  }
  let swWant = 0;
  loadHS("easy");
  loadHS("normal");
  loadHS("hard");
  bMusic.textContent = "MUSIC: " + (musOn ? "ON" : "OFF");
  bSfx.textContent = "SFX: " + (sfxOn ? "ON" : "OFF");
  const keys = Object.create(null),
    mouse = { x: VW * 0.5, y: VH * 0.5, down: 0 };
  const T = {
    L: 0,
    R: 0,
    lx: 0,
    ly: 0,
    rx: 0,
    ry: 0,
    ldx: 0,
    ldy: 0,
    lid: -1,
    rid: -1,
  };
  const GP = {
    lx: 0,
    ly: 0,
    rx: 0,
    ry: 0,
    fire: 0,
    dash: 0,
    pause: 0,
    pd: 0,
    pp: 0,
  };
  let score = 0,
    wave = 1,
    best = memHS.normal,
    shake = 0,
    flash = 0,
    combo = 0,
    cbt = 0,
    wpn = 0,
    rapid = 0,
    spread = 0,
    shield = 0,
    edgeV = 0;
  const P = {
    x: VW * 0.5,
    y: VH * 0.5,
    px: VW * 0.5,
    py: VH * 0.5,
    vx: 0,
    vy: 0,
    a: -Math.PI / 2,
    hp: 100,
    mhp: 100,
    cd: 0,
    ifr: 0,
    r: 14,
    alive: 1,
    dsh: 0,
    dcd: 0,
    dvx: 0,
    dvy: 0,
  };
  const BP = [],
    EP = [],
    FX = [],
    UP = [],
    SP = [],
    MX = 320,
    ME = 120,
    MF = 280,
    MU = 16,
    MS = 40;
  const WPOS = [0, 0];
  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v),
    len = (x, y) => Math.hypot(x, y) || 1e-6,
    rnd = (a, b) => a + Math.random() * (b - a),
    lerp = (a, b, t) => a + (b - a) * t;
  function grab(a) {
    for (let i = 0; i < a.length; i++) if (!a[i].on) return a[i];
    return null;
  }
  function pool(a, n, f) {
    for (let i = 0; i < n; i++) a.push(f());
  }
  pool(BP, MX, () => ({
    on: 0,
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    life: 0,
    r: 3,
    from: 0,
    dmg: 12,
  }));
  pool(EP, ME, () => ({
    on: 0,
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    r: 13,
    hp: 0,
    kind: 0,
    cd: 0,
    sp: 0,
    phase: 0,
    atk: 0,
    tel: 0,
    tx: 0,
    ty: 0,
    mhp: 1,
  }));
  pool(FX, MF, () => ({
    on: 0,
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    life: 0,
    max: 0,
    s: 0,
    c: "#fff",
    layer: 0,
  }));
  pool(UP, MU, () => ({
    on: 0,
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    kind: 0,
    life: 0,
  }));
  pool(SP, MS, () => ({
    on: 0,
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    n: 0,
    t: "",
    life: 0,
  }));
  const BG = document.createElement("canvas");
  const BX = BG.getContext("2d");
  BG.width = VW + 120;
  BG.height = VH + 120;
  (function cacheBG() {
    BX.fillStyle = "#0b1018";
    BX.fillRect(0, 0, BG.width, BG.height);
    const g = BX.createRadialGradient(
      BG.width * 0.5,
      BG.height * 0.5,
      40,
      BG.width * 0.5,
      BG.height * 0.5,
      520
    );
    g.addColorStop(0, "rgba(40,140,220,0.16)");
    g.addColorStop(0.45, "rgba(20,60,120,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    BX.fillStyle = g;
    BX.fillRect(0, 0, BG.width, BG.height);
    BX.strokeStyle = "#151c2a";
    BX.lineWidth = 1;
    BX.beginPath();
    for (let x = 0; x <= BG.width; x += 48) {
      BX.moveTo(x, 0);
      BX.lineTo(x, BG.height);
    }
    for (let y = 0; y <= BG.height; y += 48) {
      BX.moveTo(0, y);
      BX.lineTo(BG.width, y);
    }
    BX.stroke();
    BX.strokeStyle = "#1a2436";
    BX.lineWidth = 1;
    BX.beginPath();
    for (let x = 24; x <= BG.width; x += 96) {
      BX.moveTo(x, 0);
      BX.lineTo(x, BG.height);
    }
    for (let y = 24; y <= BG.height; y += 96) {
      BX.moveTo(0, y);
      BX.lineTo(BG.width, y);
    }
    BX.stroke();
  })();
  let AC = null,
    sfxG = null,
    musG = null,
    musNext = 0,
    musStep = 0;
  const MUS = [0, 4, 7, 4, 0, 3, 7, 12, 7, 3, 0, 4, 9, 7, 4, 0];
  function audio() {
    if (AC) return;
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      sfxG = AC.createGain();
      sfxG.gain.value = sfxOn ? 0.16 : 0;
      sfxG.connect(AC.destination);
      musG = AC.createGain();
      musG.gain.value = musOn ? 0.07 : 0;
      musG.connect(AC.destination);
      musNext = AC.currentTime + 0.05;
    } catch (e) {}
  }
  function beep(f, d, ty, v, sl, gnode) {
    if (!AC) return;
    const dest = gnode || sfxG;
    if (!dest) return;
    if (dest === sfxG && !sfxOn) return;
    if (dest === musG && !musOn) return;
    try {
      const o = AC.createOscillator(),
        g = AC.createGain(),
        t = AC.currentTime;
      o.type = ty || "square";
      o.frequency.setValueAtTime(f, t);
      if (sl) o.frequency.exponentialRampToValueAtTime(Math.max(1, sl), t + d);
      g.gain.setValueAtTime(v || 0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g);
      g.connect(dest);
      o.start(t);
      o.stop(t + d + 0.02);
    } catch (e) {}
  }
  function musTick() {
    if (!AC || !musOn || !musG) return;
    const now = AC.currentTime;
    if (musNext < now - 1) musNext = now;
    while (musNext < now + 0.55) {
      const i = musStep++ & 15;
      const f = 110 * Math.pow(2, MUS[i] / 12);
      try {
        const o = AC.createOscillator(),
          g = AC.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(f, musNext);
        g.gain.setValueAtTime(0.0001, musNext);
        g.gain.exponentialRampToValueAtTime(0.045, musNext + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, musNext + 0.2);
        o.connect(g);
        g.connect(musG);
        o.start(musNext);
        o.stop(musNext + 0.22);
        if ((i & 3) === 0) {
          const o2 = AC.createOscillator(),
            g2 = AC.createGain();
          o2.type = "square";
          o2.frequency.setValueAtTime(f * 2, musNext);
          g2.gain.setValueAtTime(0.0001, musNext);
          g2.gain.exponentialRampToValueAtTime(0.02, musNext + 0.01);
          g2.gain.exponentialRampToValueAtTime(0.001, musNext + 0.1);
          o2.connect(g2);
          g2.connect(musG);
          o2.start(musNext);
          o2.stop(musNext + 0.12);
        }
      } catch (e) {}
      musNext += 0.22;
    }
  }
  const sfx = {
    shot() {
      beep(420, 0.05, "square", 0.07, 180);
    },
    hit() {
      beep(220, 0.07, "sawtooth", 0.09, 60);
    },
    die() {
      beep(160, 0.35, "sawtooth", 0.14, 40);
    },
    wave() {
      beep(520, 0.12, "triangle", 0.09, 880);
    },
    dash() {
      beep(180, 0.1, "sine", 0.08, 90);
    },
    pwr() {
      beep(660, 0.14, "triangle", 0.1, 990);
    },
    bomb() {
      beep(90, 0.28, "sawtooth", 0.16, 30);
    },
    boss() {
      beep(80, 0.4, "square", 0.12, 40);
    },
  };
  function toWorld(sx, sy) {
    WPOS[0] = (sx - offX) / scale;
    WPOS[1] = (sy - offY) / scale;
    return WPOS;
  }
  function size() {
    W = Math.max(1, document.documentElement.clientWidth || innerWidth);
    H = Math.max(1, document.documentElement.clientHeight || innerHeight);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    scale = Math.min(W / VW, H / VH);
    offX = (W - VW * scale) * 0.5;
    offY = (H - VH * scale) * 0.5;
    C.width = (W * DPR) | 0;
    C.height = (H * DPR) | 0;
    C.style.width = W + "px";
    C.style.height = H + "px";
    checkOrient();
  }
  const coarse =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  function isPortrait() {
    return coarse && innerHeight > innerWidth;
  }
  function checkOrient() {
    if (isPortrait()) {
      if (mode === "play" && running) {
        persistBest();
        paused = 1;
        running = 0;
        clearInput();
        overlay(1, "rotate");
      }
    } else if (mode === "rotate") overlay(1, "pause");
  }
  addEventListener("resize", size, { passive: true });
  addEventListener("orientationchange", () => setTimeout(size, 160), {
    passive: true,
  });
  size();
  function hud() {
    hpT.textContent = String(Math.max(0, P.hp | 0));
    hpB.style.transform = "scaleX(" + clamp(P.hp / P.mhp, 0, 1) + ")";
    scT.textContent = String(score | 0);
    wvT.textContent = String(wave);
    const m = 1 + Math.min(7, (combo / 5) | 0);
    cbT.textContent = "x" + m;
  }
  function clearInput() {
    mouse.down = 0;
    T.L = 0;
    T.R = 0;
    T.lid = -1;
    T.rid = -1;
    T.ldx = 0;
    T.ldy = 0;
    for (const k in keys) keys[k] = 0;
  }
  function idleReload() {
    if (!swWant) return;
    if (mode !== "title" && mode !== "pause") return;
    swWant = 0;
    try {
      if (sessionStorage.getItem("ns-swr")) return;
      sessionStorage.setItem("ns-swr", "1");
    } catch (e) {}
    location.reload();
  }
  function overlay(show, kind) {
    UI.classList.toggle("hidden", !show);
    document.body.classList.toggle("play", !show && kind === "play");
    if (kind) mode = kind;
    const isPause = mode === "pause",
      isDead = mode === "dead",
      isTitle = mode === "title",
      isRotate = mode === "rotate";
    best = loadHS(diff.name);
    ovSub.textContent = isRotate
      ? "ROTATE DEVICE"
      : isDead
        ? "SCORE " + score + "  ·  BEST " + best
        : isPause
          ? "PAUSED"
          : "BEST " + best + "  ·  " + diff.name.toUpperCase();
    bPlay.classList.toggle("hidden", !(isTitle || isDead));
    bPlay.textContent = isDead ? "PLAY AGAIN" : "PLAY";
    bResume.classList.toggle("hidden", !isPause);
    bRestart.classList.toggle("hidden", isTitle || isRotate);
    bTitle.classList.toggle("hidden", isTitle);
    ovHint.style.display = isTitle ? "block" : "none";
    diffRow.classList.toggle("hidden", !(isTitle || isDead));
    pauseBtn.style.display = !show && mode === "play" ? "block" : "none";
    dashBtn.style.display = !show && mode === "play" ? "block" : "none";
    if (show) {
      const el = isPause
        ? bResume
        : isTitle || isDead
          ? bPlay
          : isRotate
            ? bTitle
            : null;
      if (el)
        requestAnimationFrame(() => {
          try {
            el.focus();
          } catch (e) {}
        });
    }
    idleReload();
  }
  function setDiff(name) {
    diff = DIFFS[name] || DIFFS.normal;
    bEasy.classList.toggle("pri", name === "easy");
    bNorm.classList.toggle("pri", name === "normal");
    bHard.classList.toggle("pri", name === "hard");
    best = loadHS(diff.name);
    if (mode === "title" || mode === "dead") overlay(1, mode);
  }
  function fx(x, y, n, c, sp, life, layer) {
    n = (n * q) | 0;
    if (reduceMotion) n = (n * 0.4) | 0;
    if (n < 1) n = 1;
    for (let i = 0; i < n; i++) {
      const p = grab(FX);
      if (!p) break;
      const a = rnd(0, TAU),
        s = rnd(sp * 0.25, sp);
      p.on = 1;
      p.x = p.px = x;
      p.y = p.py = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.life = p.max = rnd(life * 0.5, life);
      p.s = rnd(1.4, 3.2);
      p.c = c;
      p.layer = layer || 0;
    }
  }
  function pop(x, y, n) {
    const p = grab(SP);
    if (!p) return;
    p.on = 1;
    p.x = p.px = x;
    p.y = p.py = y;
    p.n = n;
    p.t = "+" + n;
    p.life = 0.75;
  }
  function drop(x, y) {
    if (Math.random() > 0.22 * diff.drop) return;
    const u = grab(UP);
    if (!u) return;
    u.on = 1;
    u.x = u.px = x;
    u.y = u.py = y;
    u.kind = (Math.random() * 6) | 0;
    u.life = 8;
  }
  function spawnOne(kind, x, y) {
    const e = grab(EP);
    if (!e) return null;
    e.on = 1;
    e.x = e.px = x;
    e.y = e.py = y;
    e.vx = e.vy = 0;
    e.kind = kind;
    e.phase = 0;
    e.atk = 0;
    e.tel = 0;
    e.cd = rnd(0.2, 0.8);
    const spm = diff.sp;
    if (kind === 1) {
      e.hp = 16 + wave * 2;
      e.r = 12;
      e.sp = (78 + wave * 2.5) * spm;
    } else if (kind === 2) {
      e.hp = 14 + wave * 1.6;
      e.r = 12;
      e.sp = (150 + wave * 6) * spm;
      e.cd = rnd(0.5, 1.2);
    } else if (kind === 3) {
      e.hp = 46 + wave * 6;
      e.r = 22;
      e.sp = (54 + wave * 1.5) * spm;
    } else if (kind === 4) {
      e.hp = 18 + wave * 2;
      e.r = 15;
      e.sp = (96 + wave * 4) * spm;
    } else if (kind === 5) {
      e.hp = 220 + wave * 28;
      e.r = 34;
      e.sp = (70 + wave * 2) * spm;
      e.cd = 1.4;
    } else if (kind === 6) {
      e.hp = 6 + wave;
      e.r = 9;
      e.sp = (130 + wave * 5) * spm;
    } else {
      e.hp = 10 + wave * 1.5;
      e.r = 13;
      e.sp = (108 + wave * 5) * spm;
    }
    e.mhp = e.hp;
    return e;
  }
  function edgePos() {
    const a = rnd(0, TAU),
      d = Math.hypot(VW, VH) * 0.42 + rnd(10, 80);
    return [VW * 0.5 + Math.cos(a) * d, VH * 0.5 + Math.sin(a) * d];
  }
  function spawnWave() {
    let n = 0;
    if (wave % 5 === 0) {
      const p = edgePos();
      if (spawnOne(5, p[0], p[1])) n++;
      const extra = Math.min(2 + (wave / 5) | 0, 6);
      for (let i = 0; i < extra; i++) {
        const p2 = edgePos();
        if (spawnOne(i & 1 ? 1 : 0, p2[0], p2[1])) n++;
      }
      if (!n) {
        const p3 = edgePos();
        spawnOne(0, p3[0], p3[1]);
      }
      sfx.boss();
      return;
    }
    const count = Math.min((4 + wave * 2) * diff.n, 28) | 0;
    for (let i = 0; i < count; i++) {
      const p = edgePos();
      let k = 0;
      const r = Math.random();
      if (wave > 2 && r < 0.14) k = 2;
      else if (wave > 3 && r < 0.28) k = 1;
      else if (wave > 4 && r < 0.4) k = 3;
      else if (wave > 3 && r < 0.52) k = 4;
      if (spawnOne(k, p[0], p[1])) n++;
    }
    if (!n) {
      const p = edgePos();
      spawnOne(0, p[0], p[1]);
    }
    sfx.wave();
  }
  function reset() {
    runDiff = diff.name;
    savedRun = 0;
    score = 0;
    wave = 1;
    shake = 0;
    flash = 0;
    combo = 0;
    cbt = 0;
    wpn = 0;
    rapid = 0;
    spread = 0;
    shield = 0;
    edgeV = 0;
    stop = 0;
    P.x = P.px = VW * 0.5;
    P.y = P.py = VH * 0.5;
    P.vx = P.vy = 0;
    P.mhp = diff.hp;
    P.hp = P.mhp;
    P.cd = 0;
    P.ifr = 0;
    P.alive = 1;
    P.a = -Math.PI / 2;
    P.dsh = 0;
    P.dcd = 0;
    mouse.x = P.x;
    mouse.y = P.y;
    for (let i = 0; i < BP.length; i++) BP[i].on = 0;
    for (let i = 0; i < EP.length; i++) EP[i].on = 0;
    for (let i = 0; i < FX.length; i++) FX[i].on = 0;
    for (let i = 0; i < UP.length; i++) UP[i].on = 0;
    for (let i = 0; i < SP.length; i++) SP[i].on = 0;
    spawnWave();
    hud();
  }
  function fire() {
    if (P.cd > 0 || !P.alive || paused || !running) return;
    P.cd = (rapid > 0 ? 0.042 : 0.085) * (1 - wpn * 0.1);
    const n = spread > 0 ? 3 + (wpn > 1 ? 1 : 0) : 1;
    const dmg = 12 + wpn * 5;
    const spd = 980 + wpn * 40;
    for (let i = 0; i < n; i++) {
      const b = grab(BP);
      if (!b) break;
      const off = n === 1 ? 0 : (i - (n - 1) * 0.5) * 0.14;
      const a = P.a + off,
        c = Math.cos(a),
        s = Math.sin(a);
      b.on = 1;
      b.from = 0;
      b.x = b.px = P.x + c * 18;
      b.y = b.py = P.y + s * 18;
      b.vx = c * spd;
      b.vy = s * spd;
      b.life = 0.7;
      b.r = 3;
      b.dmg = dmg;
    }
    flash = 0.045;
    sfx.shot();
    fx(P.x + Math.cos(P.a) * 18, P.y + Math.sin(P.a) * 18, 3, "#9fe8ff", 90, 0.1, 1);
  }
  function hitP(d) {
    if (!P.alive || paused || P.ifr > 0 || P.dsh > 0) return;
    if (shield > 0) {
      shield = Math.max(0, shield - 1.2);
      P.ifr = 0.25;
      fx(P.x, P.y, 10, "#7ee8ff", 140, 0.2, 1);
      return;
    }
    P.hp -= d * diff.dmg;
    P.ifr = 0.7;
    shake = reduceMotion ? 0 : 0.16;
    edgeV = 1;
    stop = reduceMotion ? 0 : 0.045;
    if (P.hp <= 0) {
      P.hp = 0;
      P.alive = 0;
      running = 0;
      paused = 0;
            sfx.die();
      fx(P.x, P.y, 28, "#ff6b6b", 240, 0.5, 1);
      lockRun();
      clearInput();
      overlay(1, "dead");
    }
    hud();
  }
  function anyE() {
    for (let i = 0; i < EP.length; i++) if (EP[i].on) return 1;
    return 0;
  }
  function kill(e) {
    e.on = 0;
    const base = e.kind === 5 ? 120 : e.kind === 3 ? 35 : e.kind === 4 ? 22 : e.kind === 2 ? 20 : e.kind === 1 ? 25 : 10;
    combo++;
    cbt = 2.2;
    const m = 1 + Math.min(7, (combo / 5) | 0);
    const add = (base * m) | 0;
    score += add;
    pop(e.x, e.y, add);
    fx(e.x, e.y, e.kind === 5 ? 36 : 14, e.kind === 5 ? "#ffd76a" : e.kind === 3 ? "#8ab4d8" : e.kind === 4 ? "#9dff8a" : e.kind === 2 ? "#ff7ad8" : e.kind === 1 ? "#ffb347" : "#ff5d7a", 190, 0.3, 0);
    sfx.hit();
    if (!reduceMotion) stop = Math.max(stop, 0.03);
    if (e.kind === 4) {
      spawnOne(6, e.x + 12, e.y - 8);
      spawnOne(6, e.x - 12, e.y + 8);
    }
    if (e.kind === 5) drop(e.x, e.y);
    drop(e.x, e.y);
    hud();
  }
  function flushWave() {
    if (anyE() || !P.alive || mode !== "play") return;
    wave++;
    hud();
    spawnWave();
  }
  function doDash() {
    if (mode !== "play" || !running || !P.alive || P.dcd > 0 || P.dsh > 0) return;
    let dx = P.vx,
      dy = P.vy,
      m = len(dx, dy);
    if (m < 40) {
      dx = Math.cos(P.a);
      dy = Math.sin(P.a);
      m = 1;
    }
    P.dvx = (dx / m) * 920;
    P.dvy = (dy / m) * 920;
    P.dsh = 0.13;
    P.dcd = 0.72;
    P.ifr = Math.max(P.ifr, 0.13);
    sfx.dash();
    fx(P.x, P.y, 8, "#7ee8ff", 200, 0.18, 1);
  }
  function applyUp(k) {
    sfx.pwr();
    if (k === 0) rapid = 6;
    else if (k === 1) spread = 7;
    else if (k === 2) shield = 8;
    else if (k === 3) {
      P.hp = Math.min(P.mhp, P.hp + P.mhp * 0.35);
      hud();
    } else if (k === 4) {
      sfx.bomb();
      shake = reduceMotion ? 0 : 0.22;
      stop = reduceMotion ? 0 : 0.08;
      for (let i = 0; i < EP.length; i++) {
        const e = EP[i];
        if (!e.on) continue;
        e.hp -= 48;
        fx(e.x, e.y, 10, "#ffaa55", 180, 0.25, 0);
        if (e.hp <= 0) kill(e);
      }
      fx(P.x, P.y, 24, "#ff7733", 280, 0.35, 1);
    } else {
      wpn = Math.min(3, wpn + 1);
    }
  }
  function start() {
    persistBest();
    audio();
    if (AC && AC.state === "suspended") AC.resume();
    reset();
    running = 1;
    paused = 0;
    mode = "play";
    acc = 0;
    clearInput();
    t0 = performance.now();
    if (isPortrait()) {
      running = 0;
      paused = 1;
      overlay(1, "rotate");
      return;
    }
    overlay(0, "play");
  }
  function pauseGame() {
    if (mode !== "play" || !running) return;
    persistBest();
    paused = 1;
    running = 0;
    mode = "pause";
    clearInput();
    overlay(1, "pause");
  }
  function resumeGame() {
    if (mode !== "pause") return;
    if (isPortrait()) {
      overlay(1, "rotate");
      return;
    }
    paused = 0;
    running = 1;
    mode = "play";
    acc = 0;
    clearInput();
    overlay(0, "play");
    t0 = performance.now();
  }
  function goTitle() {
    lockRun();
    running = 0;
    paused = 0;
    mode = "title";
    clearInput();
    overlay(1, "title");
  }
  function togglePause() {
    if (mode === "pause") resumeGame();
    else if (mode === "play") pauseGame();
  }
  bPlay.onclick = start;
  bResume.onclick = resumeGame;
  bRestart.onclick = start;
  bTitle.onclick = goTitle;
  bEasy.onclick = () => setDiff("easy");
  bNorm.onclick = () => setDiff("normal");
  bHard.onclick = () => setDiff("hard");
  bMusic.onclick = () => {
    musOn ^= 1;
    bMusic.textContent = "MUSIC: " + (musOn ? "ON" : "OFF");
    try {
      localStorage.setItem(HS + "m", musOn ? "1" : "0");
    } catch (e) {}
    if (musG && AC) musG.gain.setValueAtTime(musOn ? 0.07 : 0, AC.currentTime);
    audio();
    if (AC && AC.state === "suspended") AC.resume();
  };
  bSfx.onclick = () => {
    sfxOn ^= 1;
    bSfx.textContent = "SFX: " + (sfxOn ? "ON" : "OFF");
    try {
      localStorage.setItem(HS + "x", sfxOn ? "1" : "0");
    } catch (e) {}
    if (sfxG && AC) sfxG.gain.setValueAtTime(sfxOn ? 0.16 : 0, AC.currentTime);
    audio();
    if (AC && AC.state === "suspended") AC.resume();
  };
  pauseBtn.onclick = (e) => {
    e.stopPropagation();
    pauseGame();
  };
  dashBtn.onclick = (e) => {
    e.stopPropagation();
    doDash();
  };
  function unlockAudio() {
    audio();
    if (AC && AC.state === "suspended") AC.resume();
  }
  addEventListener("pointerdown", unlockAudio, { passive: true });
  addEventListener("keydown", (e) => {
    unlockAudio();
    keys[e.code] = 1;
    if (
      e.code === "Escape" ||
      e.code === "KeyP" ||
      e.code === "Space" ||
      e.code === "ArrowUp" ||
      e.code === "ArrowDown" ||
      e.code === "ArrowLeft" ||
      e.code === "ArrowRight"
    )
      e.preventDefault();
    if ((e.code === "Escape" || e.code === "KeyP") && !e.repeat) togglePause();
    if (e.code === "Space" && !e.repeat) {
      if (mode === "title" || mode === "dead") start();
      else if (mode === "pause") resumeGame();
      else if (mode === "play") doDash();
    }
    if (
      !e.repeat &&
      (e.code === "ShiftLeft" || e.code === "ShiftRight") &&
      mode === "play"
    )
      doDash();
  });
  addEventListener("keyup", (e) => {
    keys[e.code] = 0;
  });
  function isMouse(pt) {
    return pt === "mouse" || pt === "pen";
  }
  function onMove(x, y, id, pt) {
    const w = toWorld(x, y);
    if (isMouse(pt) || id == null) {
      mouse.x = w[0];
      mouse.y = w[1];
      return;
    }
    if (id === T.lid) {
      let dx = x - T.lx,
        dy = y - T.ly,
        m = len(dx, dy),
        cap = 64;
      if (m > cap) {
        dx = (dx / m) * cap;
        dy = (dy / m) * cap;
      }
      T.ldx = dx / cap;
      T.ldy = dy / cap;
    }
    if (id === T.rid) {
      T.rx = x;
      T.ry = y;
      mouse.x = w[0];
      mouse.y = w[1];
    }
  }
  function onDown(x, y, id, pt, target, button) {
    if (button != null && button !== 0) return;
    if (target && target.closest && target.closest("#overlay,#pauseBtn,#dashBtn"))
      return;
    audio();
    if (AC && AC.state === "suspended") AC.resume();
    const w = toWorld(x, y);
    if (isMouse(pt) || id == null) {
      mouse.down = 1;
      mouse.x = w[0];
      mouse.y = w[1];
      return;
    }
    if (x < W * 0.5 && T.lid < 0) {
      T.L = 1;
      T.lid = id;
      T.lx = x;
      T.ly = y;
      T.ldx = 0;
      T.ldy = 0;
    } else if (T.rid < 0) {
      T.R = 1;
      T.rid = id;
      T.rx = x;
      T.ry = y;
      mouse.x = w[0];
      mouse.y = w[1];
      mouse.down = 1;
    }
  }
  function onUp(id, pt, button) {
    if (button != null && button !== 0) return;
    if (isMouse(pt) || id == null) {
      mouse.down = 0;
      return;
    }
    if (id === T.lid) {
      T.L = 0;
      T.lid = -1;
      T.ldx = 0;
      T.ldy = 0;
    }
    if (id === T.rid) {
      T.R = 0;
      T.rid = -1;
      mouse.down = 0;
    }
  }
  if ("PointerEvent" in window) {
    addEventListener(
      "pointermove",
      (e) => onMove(e.clientX, e.clientY, e.pointerId, e.pointerType),
      { passive: true }
    );
    addEventListener(
      "pointerdown",
      (e) =>
        onDown(e.clientX, e.clientY, e.pointerId, e.pointerType, e.target, e.button),
      { passive: true }
    );
    addEventListener(
      "pointerup",
      (e) => onUp(e.pointerId, e.pointerType, e.button),
      { passive: true }
    );
    addEventListener(
      "pointercancel",
      (e) => onUp(e.pointerId, e.pointerType, e.button),
      { passive: true }
    );
  } else {
    addEventListener(
      "mousemove",
      (e) => onMove(e.clientX, e.clientY, null, "mouse"),
      { passive: true }
    );
    addEventListener(
      "mousedown",
      (e) => onDown(e.clientX, e.clientY, null, "mouse", e.target, e.button),
      { passive: true }
    );
    addEventListener("mouseup", (e) => onUp(null, "mouse", e.button), {
      passive: true,
    });
    addEventListener(
      "touchmove",
      (e) => {
        const t = e.changedTouches;
        for (let i = 0; i < t.length; i++)
          onMove(t[i].clientX, t[i].clientY, t[i].identifier, "touch");
      },
      { passive: true }
    );
    addEventListener(
      "touchstart",
      (e) => {
        const t = e.changedTouches;
        for (let i = 0; i < t.length; i++)
          onDown(t[i].clientX, t[i].clientY, t[i].identifier, "touch", e.target, 0);
      },
      { passive: true }
    );
    addEventListener(
      "touchend",
      (e) => {
        const t = e.changedTouches;
        for (let i = 0; i < t.length; i++) onUp(t[i].identifier, "touch", 0);
      },
      { passive: true }
    );
    addEventListener(
      "touchcancel",
      (e) => {
        const t = e.changedTouches;
        for (let i = 0; i < t.length; i++) onUp(t[i].identifier, "touch", 0);
      },
      { passive: true }
    );
  }
  document.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );
  document.addEventListener("visibilitychange", () => {
    persistBest();
    if (document.hidden && mode === "play") pauseGame();
  });
  addEventListener("pagehide", () => {
    persistBest();
    if (mode === "play") pauseGame();
  });
  addEventListener("blur", () => {
    persistBest();
    if (mode === "play") pauseGame();
  });
  addEventListener("contextmenu", (e) => e.preventDefault());
  addEventListener("gesturestart", (e) => e.preventDefault());
  addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    { passive: false }
  );
  let deferredPrompt = null;
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    bInstall.classList.remove("hidden");
  });
  bInstall.onclick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = deferredPrompt.userChoice;
    const done = () => {
      deferredPrompt = null;
      bInstall.classList.add("hidden");
    };
    if (choice && choice.then) choice.then(done, done);
    else done();
  };
  addEventListener("appinstalled", () => {
    deferredPrompt = null;
    bInstall.classList.add("hidden");
  });
  function pollPad() {
    GP.lx = GP.ly = GP.rx = GP.ry = 0;
    GP.fire = 0;
    GP.dash = 0;
    GP.pause = 0;
    const nav = navigator;
    const list = nav.getGamepads ? nav.getGamepads() : null;
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (!p) continue;
      const ax = p.axes,
        bt = p.buttons;
      const dz = (v) => (Math.abs(v) < 0.22 ? 0 : v);
      GP.lx += dz(ax[0] || 0);
      GP.ly += dz(ax[1] || 0);
      GP.rx += dz(ax[2] || 0);
      GP.ry += dz(ax[3] || 0);
      const b = (n) => (bt[n] && bt[n].pressed ? 1 : 0);
      if (b(7) || b(5) || b(0)) GP.fire = 1;
      if (b(4) || b(1)) GP.dash = 1;
      if (b(9) || b(8)) GP.pause = 1;
    }
    if (GP.pause && !GP.pp) {
      if (mode === "title" || mode === "dead") start();
      else togglePause();
    }
    GP.pp = GP.pause;
    if (GP.dash && !GP.pd && mode === "play") doDash();
    GP.pd = GP.dash;
  }
  function segHit(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1,
      dy = y2 - y1,
      l = dx * dx + dy * dy;
    let t = l ? ((cx - x1) * dx + (cy - y1) * dy) / l : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = x1 + dx * t,
      py = y1 + dy * t;
    return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r;
  }
  function eFire(e, nx, ny, spd, life, r) {
    const b = grab(BP);
    if (!b) return;
    b.on = 1;
    b.from = 1;
    b.x = b.px = e.x + nx * (e.r + 4);
    b.y = b.py = e.y + ny * (e.r + 4);
    b.vx = nx * spd;
    b.vy = ny * spd;
    b.life = life;
    b.r = r;
    b.dmg = 10;
  }
  function step(dt) {
    P.px = P.x;
    P.py = P.y;
    let mx = 0,
      my = 0;
    if (keys.KeyW || keys.ArrowUp) my -= 1;
    if (keys.KeyS || keys.ArrowDown) my += 1;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (T.L) {
      mx = T.ldx;
      my = T.ldy;
    }
    mx += GP.lx;
    my += GP.ly;
    const ml = len(mx, my);
    if (ml > 1) {
      mx /= ml;
      my /= ml;
    }
    const accs = 2600,
      maxs = 320,
      fric = 12;
    if (P.dsh > 0) {
      P.vx = P.dvx;
      P.vy = P.dvy;
      P.dsh -= dt;
    } else {
      P.vx += (mx * accs - P.vx * fric) * dt;
      P.vy += (my * accs - P.vy * fric) * dt;
      const sp = len(P.vx, P.vy);
      if (sp > maxs) {
        P.vx = (P.vx / sp) * maxs;
        P.vy = (P.vy / sp) * maxs;
      }
    }
    P.x = clamp(P.x + P.vx * dt, P.r, VW - P.r);
    P.y = clamp(P.y + P.vy * dt, P.r, VH - P.r);
    const rs = len(GP.rx, GP.ry);
    if (rs > 0.25) {
      mouse.x = P.x + GP.rx * 220;
      mouse.y = P.y + GP.ry * 220;
    }
    P.a = Math.atan2(mouse.y - P.y, mouse.x - P.x);
    P.cd = Math.max(0, P.cd - dt);
    P.ifr = Math.max(0, P.ifr - dt);
    P.dcd = Math.max(0, P.dcd - dt);
    rapid = Math.max(0, rapid - dt);
    spread = Math.max(0, spread - dt);
    shield = Math.max(0, shield - dt);
    if (cbt > 0) {
      cbt -= dt;
      if (cbt <= 0) {
        combo = 0;
        cbt = 0;
        hud();
      }
    }
    if (mouse.down || GP.fire) fire();
    for (let i = 0; i < BP.length; i++) {
      const b = BP[i];
      if (!b.on) continue;
      b.px = b.x;
      b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -40 || b.y < -40 || b.x > VW + 40 || b.y > VH + 40) {
        b.on = 0;
        continue;
      }
      if (
        b.from === 1 &&
        P.alive &&
        P.ifr <= 0 &&
        segHit(b.px, b.py, b.x, b.y, P.x, P.y, P.r + b.r)
      ) {
        b.on = 0;
        hitP(10);
        fx(b.x, b.y, 8, "#ff8a6a", 130, 0.16, 1);
      }
    }
    for (let i = 0; i < EP.length; i++) {
      const e = EP[i];
      if (!e.on) continue;
      e.px = e.x;
      e.py = e.y;
      const dx = P.x - e.x,
        dy = P.y - e.y,
        d = len(dx, dy),
        nx = dx / d,
        ny = dy / d;
      const k = e.kind;
      if (k === 1) {
        if (d > 240) {
          e.vx = nx * e.sp;
          e.vy = ny * e.sp;
        } else if (d < 150) {
          e.vx = -nx * e.sp * 0.85;
          e.vy = -ny * e.sp * 0.85;
        } else {
          e.vx = -ny * e.sp * 0.55;
          e.vy = nx * e.sp * 0.55;
        }
        e.cd -= dt;
        if (e.cd <= 0 && d < 420 && P.alive) {
          e.cd = 0.95;
          eFire(e, nx, ny, 460, 0.95, 4);
        }
      } else if (k === 2) {
        if (e.phase === 0) {
          e.vx = nx * e.sp * 0.55;
          e.vy = ny * e.sp * 0.55;
          e.cd -= dt;
          if (e.cd <= 0 && d < 380) {
            e.phase = 1;
            e.tel = 0.38;
            e.tx = nx;
            e.ty = ny;
          }
        } else if (e.phase === 1) {
          e.vx *= 0.85;
          e.vy *= 0.85;
          e.tel -= dt;
          if (e.tel <= 0) {
            e.phase = 2;
            e.tel = 0.18;
            e.vx = e.tx * e.sp * 4.2;
            e.vy = e.ty * e.sp * 4.2;
          }
        } else {
          e.tel -= dt;
          if (e.tel <= 0) {
            e.phase = 0;
            e.cd = 1.1;
            e.vx *= 0.2;
            e.vy *= 0.2;
          }
        }
      } else if (k === 3) {
        e.vx = nx * e.sp;
        e.vy = ny * e.sp;
      } else if (k === 5) {
        if (e.phase === 0) {
          e.vx = nx * e.sp * (d > 180 ? 1 : -0.4);
          e.vy = ny * e.sp * (d > 180 ? 1 : -0.4);
          e.cd -= dt;
          if (e.cd <= 0) {
            e.phase = 1;
            e.atk = (e.atk + 1) % 3;
            e.tel = e.atk === 1 ? 0.55 : 0.7;
            e.tx = P.x;
            e.ty = P.y;
            e.vx = e.vy = 0;
          }
        } else if (e.phase === 1) {
          e.tel -= dt;
          if (e.tel <= 0) {
            e.phase = 2;
            e.tel = 0.35;
            if (e.atk === 0) {
              for (let j = 0; j < 14; j++) {
                const a = (j / 14) * TAU;
                eFire(e, Math.cos(a), Math.sin(a), 320, 1.2, 5);
              }
            } else if (e.atk === 1) {
              const tdx = e.tx - e.x,
                tdy = e.ty - e.y,
                td = len(tdx, tdy);
              e.vx = (tdx / td) * 780;
              e.vy = (tdy / td) * 780;
            } else {
              const dd = len(P.x - e.tx, P.y - e.ty);
              if (dd < 90) hitP(22);
              fx(e.tx, e.ty, 22, "#ffcc66", 220, 0.35, 0);
            }
          }
        } else {
          e.tel -= dt;
          if (e.tel <= 0) {
            e.phase = 0;
            e.cd = 1.15;
            e.vx *= 0.15;
            e.vy *= 0.15;
          }
        }
      } else {
        e.vx = nx * e.sp;
        e.vy = ny * e.sp;
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (d < e.r + P.r && P.alive) {
        hitP(k === 5 ? 20 : k === 3 ? 22 : k === 1 ? 11 : 16);
        e.x -= nx * 28;
        e.y -= ny * 28;
      }
      for (let j = 0; j < BP.length; j++) {
        const b = BP[j];
        if (!b.on || b.from !== 0) continue;
        if (segHit(b.px, b.py, b.x, b.y, e.x, e.y, e.r + b.r)) {
          b.on = 0;
          e.hp -= b.dmg;
          fx(b.x, b.y, 6, "#fff6a8", 100, 0.14, 1);
          if (e.hp <= 0) kill(e);
          break;
        }
      }
    }
    for (let i = 0; i < UP.length; i++) {
      const u = UP[i];
      if (!u.on) continue;
      u.px = u.x;
      u.py = u.y;
      u.life -= dt;
      if (u.life <= 0) {
        u.on = 0;
        continue;
      }
      if (P.alive && len(u.x - P.x, u.y - P.y) < P.r + 14) {
        u.on = 0;
        applyUp(u.kind);
      }
    }
    for (let i = 0; i < FX.length; i++) {
      const f = FX[i];
      if (!f.on) continue;
      f.px = f.x;
      f.py = f.y;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= 0.9;
      f.vy *= 0.9;
      f.life -= dt;
      if (f.life <= 0) f.on = 0;
    }
    for (let i = 0; i < SP.length; i++) {
      const p = SP[i];
      if (!p.on) continue;
      p.px = p.x;
      p.py = p.y;
      p.y -= 42 * dt;
      p.life -= dt;
      if (p.life <= 0) p.on = 0;
    }
    shake = Math.max(0, shake - dt);
    flash = Math.max(0, flash - dt);
    edgeV = Math.max(0, edgeV - dt * 1.6);
    if (P.hp / P.mhp < 0.34) edgeV = Math.max(edgeV, 1 - P.hp / (P.mhp * 0.34));
    flushWave();
  }
  const COL = ["#b81e3a", "#c45a1a", "#e040a0", "#4a6a8a", "#7cff6b", "#d4a017", "#5aaa44"];
  const COL2 = ["#ff8aa0", "#ffd19a", "#ffb0e8", "#c8e0f4", "#d4ffc8", "#ffe08a", "#b6e89a"];
  const UC = ["#ffee55", "#ff66cc", "#55ddff", "#3dffb0", "#ff7733", "#c0a0ff"];
  function drawEnt(e, x, y) {
    X.save();
    X.translate(x, y);
    X.rotate(Math.atan2(P.y - e.y, P.x - e.x));
    const r = e.r,
      k = e.kind;
    X.fillStyle = COL[k] || COL[0];
    X.beginPath();
    if (k === 3) {
      X.rect(-r, -r * 0.75, r * 2, r * 1.5);
    } else if (k === 5) {
      X.moveTo(r + 8, 0);
      X.lineTo(-r * 0.6, r);
      X.lineTo(-r * 0.2, 0);
      X.lineTo(-r * 0.6, -r);
    } else if (k === 4) {
      X.moveTo(r, 0);
      X.lineTo(0, r);
      X.lineTo(-r, 0);
      X.lineTo(0, -r);
    } else {
      X.moveTo(r + 4, 0);
      X.lineTo(-r * 0.7, r * 0.85);
      X.lineTo(-r * 0.4, 0);
      X.lineTo(-r * 0.7, -r * 0.85);
    }
    X.closePath();
    X.fill();
    X.fillStyle = COL2[k] || COL2[0];
    X.beginPath();
    X.arc(2, 0, k === 5 ? 7 : 4, 0, TAU);
    X.fill();
    X.restore();
    if (e.mhp > 0 && e.hp < e.mhp) {
      X.fillStyle = "#1a2030";
      X.fillRect(x - r, y - r - 8, r * 2, 3);
      X.fillStyle = "#3dffb0";
      X.fillRect(x - r, y - r - 8, r * 2 * clamp(e.hp / e.mhp, 0, 1), 3);
    }
    if (k === 2 && e.phase === 1) {
      X.strokeStyle = "rgba(255,80,140,.7)";
      X.lineWidth = 2;
      X.beginPath();
      X.moveTo(x, y);
      X.lineTo(x + e.tx * 120, y + e.ty * 120);
      X.stroke();
    }
    if (k === 5 && e.phase === 1) {
      X.strokeStyle = "rgba(255,210,80,.75)";
      X.lineWidth = 2;
      X.beginPath();
      if (e.atk === 2) X.arc(e.tx, e.ty, 90, 0, TAU);
      else if (e.atk === 1) {
        X.moveTo(x, y);
        X.lineTo(e.tx, e.ty);
      } else X.arc(x, y, 46 + (1 - e.tel) * 40, 0, TAU);
      X.stroke();
    }
  }
  function draw(al) {
    X.setTransform(DPR, 0, 0, DPR, 0, 0);
    X.fillStyle = "#07090f";
    X.fillRect(0, 0, W, H);
    const sx = shake && !reduceMotion ? (Math.random() - 0.5) * 8 : 0,
      sy = shake && !reduceMotion ? (Math.random() - 0.5) * 8 : 0;
    X.setTransform(
      DPR * scale,
      0,
      0,
      DPR * scale,
      DPR * (offX + sx),
      DPR * (offY + sy)
    );
    const parX = (P.x - VW * 0.5) * 0.05,
      parY = (P.y - VH * 0.5) * 0.05;
    X.drawImage(BG, -60 - parX, -60 - parY);
    X.strokeStyle = "#223049";
    X.lineWidth = 2;
    X.strokeRect(1, 1, VW - 2, VH - 2);
    X.strokeStyle = "#1b2740";
    X.lineWidth = 1.5;
    X.beginPath();
    X.arc(VW * 0.5, VH * 0.5, Math.min(VW, VH) * 0.34, 0, TAU);
    X.stroke();
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < FX.length; i++) {
        const f = FX[i];
        if (!f.on || f.layer !== layer) continue;
        X.globalAlpha = Math.max(0, f.life / f.max);
        X.fillStyle = f.c;
        X.beginPath();
        X.arc(lerp(f.px, f.x, al), lerp(f.py, f.y, al), f.s, 0, TAU);
        X.fill();
      }
    }
    X.globalAlpha = 1;
    for (let i = 0; i < BP.length; i++) {
      const b = BP[i];
      if (!b.on) continue;
      const x = lerp(b.px, b.x, al),
        y = lerp(b.py, b.y, al);
      const en = b.from === 1;
      X.strokeStyle = en ? "#ff7a4d" : "#7ee8ff";
      X.lineWidth = 2;
      X.beginPath();
      X.moveTo(x, y);
      X.lineTo(b.px, b.py);
      X.stroke();
      X.fillStyle = en ? "#ffb08a" : "#e9fbff";
      X.beginPath();
      X.arc(x, y, b.r, 0, TAU);
      X.fill();
    }
    for (let i = 0; i < UP.length; i++) {
      const u = UP[i];
      if (!u.on) continue;
      const x = lerp(u.px, u.x, al),
        y = lerp(u.py, u.y, al);
      X.globalAlpha = u.life < 1.4 ? 0.4 + 0.6 * ((u.life * 8) & 1) : 1;
      X.fillStyle = UC[u.kind];
      X.beginPath();
      X.moveTo(x, y - 11);
      X.lineTo(x + 11, y);
      X.lineTo(x, y + 11);
      X.lineTo(x - 11, y);
      X.closePath();
      X.fill();
    }
    X.globalAlpha = 1;
    for (let i = 0; i < EP.length; i++) {
      const e = EP[i];
      if (!e.on) continue;
      drawEnt(e, lerp(e.px, e.x, al), lerp(e.py, e.y, al));
    }
    const px = lerp(P.px, P.x, al),
      py = lerp(P.py, P.y, al);
    if (P.alive) {
      if (shield > 0) {
        X.strokeStyle = "rgba(90,220,255,.55)";
        X.lineWidth = 3;
        X.beginPath();
        X.arc(px, py, 22, 0, TAU);
        X.stroke();
      }
      X.save();
      X.translate(px, py);
      X.rotate(P.a);
      X.globalAlpha = P.ifr > 0 && ((P.ifr * 20) | 0) % 2 ? 0.35 : 1;
      if (flash > 0) {
        X.fillStyle = "#fff";
        X.beginPath();
        X.arc(20, 0, 8 + flash * 40, 0, TAU);
        X.fill();
      }
      X.fillStyle = rapid > 0 ? "#ffe066" : "#1ad4ff";
      X.beginPath();
      X.moveTo(16, 0);
      X.lineTo(-12, 11);
      X.lineTo(-6, 0);
      X.lineTo(-12, -11);
      X.closePath();
      X.fill();
      X.fillStyle = "#e8fbff";
      X.beginPath();
      X.arc(-1, 0, 4.5, 0, TAU);
      X.fill();
      X.fillStyle = "#0b1a22";
      X.fillRect(8, -2.2, 12 + wpn * 3, 4.4);
      X.restore();
      X.globalAlpha = 1;
    }
    X.font = "700 14px ui-sans-serif,system-ui,sans-serif";
    X.textAlign = "center";
    for (let i = 0; i < SP.length; i++) {
      const p = SP[i];
      if (!p.on) continue;
      X.globalAlpha = Math.max(0, p.life / 0.75);
      X.fillStyle = "#f4f7ff";
      X.fillText(p.t, lerp(p.px, p.x, al), lerp(p.py, p.y, al));
    }
    X.globalAlpha = 1;
    X.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (edgeV > 0) {
      const a = clamp(edgeV, 0, 1) * 0.55;
      X.globalAlpha = a;
      X.fillStyle = "#c01828";
      const t = Math.max(28, H * 0.08);
      X.fillRect(0, 0, W, t);
      X.fillRect(0, H - t, W, t);
      X.fillRect(0, 0, t, H);
      X.fillRect(W - t, 0, t, H);
      X.globalAlpha = 1;
    }
    if (T.L) {
      X.strokeStyle = "rgba(180,210,255,.3)";
      X.lineWidth = 2;
      X.beginPath();
      X.arc(T.lx, T.ly, 64, 0, TAU);
      X.stroke();
      X.fillStyle = "rgba(180,210,255,.38)";
      X.beginPath();
      X.arc(T.lx + T.ldx * 46, T.ly + T.ldy * 46, 16, 0, TAU);
      X.fill();
    }
    if (T.R) {
      X.strokeStyle = "rgba(255,160,120,.32)";
      X.lineWidth = 2;
      X.beginPath();
      X.arc(T.rx, T.ry, 28, 0, TAU);
      X.stroke();
    }
  }
  function loop(t) {
    requestAnimationFrame(loop);
    let real = (t - t0) / 1000 || 0;
    t0 = t;
    if (real > 1) real = 0.033;
    fSum += real;
    fN++;
    if (fN >= 30) {
      const avg = (fSum / fN) * 1000;
      if (avg > 20) q = Math.max(0.28, q * 0.82);
      else if (avg < 12) q = Math.min(1, q * 1.06);
      fSum = 0;
      fN = 0;
    }
    pollPad();
    if (running && !paused && mode === "play") {
      acc += real;
      if (acc > ACC_MAX) acc = ACC_MAX;
      while (acc >= STEP) {
        if (stop > 0) stop -= STEP;
        else step(STEP);
        acc -= STEP;
      }
    } else acc = 0;
    const al = running && !paused ? acc / STEP : 1;
    draw(al);
    musTick();
  }
  overlay(1, "title");
  requestAnimationFrame((t) => {
    t0 = t;
    loop(t);
  });
  if (location.protocol !== "file:" && "serviceWorker" in navigator) {
    let hadSW = !!navigator.serviceWorker.controller;
    let didReload = 0;
    try {
      didReload = sessionStorage.getItem("ns-swr") === "1" ? 1 : 0;
      if (didReload) setTimeout(() => {
        try {
          sessionStorage.removeItem("ns-swr");
        } catch (e) {}
      }, 2500);
    } catch (e) {}
    navigator.serviceWorker.register("./sw.js").catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadSW) {
        hadSW = 1;
        return;
      }
      if (didReload) return;
      swWant = 1;
      idleReload();
    });
    navigator.serviceWorker.getRegistration("./sw.js").then((reg) => {
      if (!reg) return;
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener("statechange", () => {
          if (didReload) return;
          if (w.state === "installed" && navigator.serviceWorker.controller) {
            swWant = 1;
            idleReload();
          }
        });
      });
    }).catch(() => {});
  }
})();
