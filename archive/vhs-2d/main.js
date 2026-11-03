(() => {
  const room = document.getElementById("room");
  const screen = document.getElementById("screen");
  const play = document.getElementById("play");
  const slot = document.getElementById("slot");
  const snowCanvas = document.getElementById("snow");
  const osdMode = document.getElementById("osdMode");
  const osdCounter = document.getElementById("osdCounter");
  const vfd = document.getElementById("vfd");
  const btnSound = document.getElementById("btnSound");
  const tapes = [...document.querySelectorAll(".tape")];

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

  // glow colour thrown into the room, per tape
  const TINT = {
    about: "247, 184, 1",
    experience: "120, 170, 255",
    projects: "255, 150, 70",
    education: "140, 220, 190",
    misc: "255, 110, 140",
    contact: "200, 200, 255",
  };

  let current = null;   // id of the tape in the deck
  let busy = false;

  /* ---------------- sound (synthesised, no files) ---------------- */

  let ctx = null;
  let soundOn = true;
  try { soundOn = localStorage.getItem("sound") !== "off"; } catch {}
  btnSound.setAttribute("aria-pressed", String(soundOn));

  function audio() {
    if (!soundOn) return null;
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function noise(dur, { freq = 1200, q = 0.7, type = "lowpass", gain = 0.3, attack = 0.005 } = {}) {
    const a = audio(); if (!a) return;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = a.createGain();
    const t = a.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(a.destination);
    src.start();
  }
  function motor(dur = 0.6) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(); o.type = "sawtooth";
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 300;
    const g = a.createGain();
    const t = a.currentTime;
    o.frequency.setValueAtTime(55, t);
    o.frequency.linearRampToValueAtTime(80, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.05);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f).connect(g).connect(a.destination);
    o.start(); o.stop(t + dur);
  }
  const clunk = () => { noise(0.09, { freq: 700, gain: 0.5 }); setTimeout(() => noise(0.05, { freq: 2200, gain: 0.15 }), 70); };
  const hiss = (d) => noise(d, { freq: 4000, type: "bandpass", q: 0.4, gain: 0.05, attack: 0.03 });
  const click = () => noise(0.025, { freq: 3000, type: "highpass", gain: 0.2 });

  btnSound.addEventListener("click", () => {
    soundOn = !soundOn;
    btnSound.setAttribute("aria-pressed", String(soundOn));
    try { localStorage.setItem("sound", soundOn ? "on" : "off"); } catch {}
    click();
  });

  /* ---------------- static snow ---------------- */

  const sctx = snowCanvas.getContext("2d");
  const img = sctx.createImageData(snowCanvas.width, snowCanvas.height);
  let snowRaf = 0;
  function snowFrame() {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    // a rolling bar
    const bar = (performance.now() / 6) % snowCanvas.height;
    for (let y = bar; y < bar + 8 && y < snowCanvas.height; y++)
      for (let x = 0; x < snowCanvas.width; x++) { const k = (Math.floor(y) * snowCanvas.width + x) * 4; d[k] = d[k + 1] = d[k + 2] = d[k] * 0.5 + 100; }
    sctx.putImageData(img, 0, 0);
    snowRaf = requestAnimationFrame(snowFrame);
  }
  const startSnow = () => { cancelAnimationFrame(snowRaf); snowFrame(); };
  const stopSnow = () => cancelAnimationFrame(snowRaf);

  /* ---------------- clocks ---------------- */

  let started = 0;
  setInterval(() => {
    const now = new Date();
    if (current && started) {
      const s = Math.floor((Date.now() - started) / 1000);
      osdCounter.textContent = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
      vfd.textContent = osdCounter.textContent.slice(-5);
    } else {
      vfd.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }
  }, 500);

  let osdTimer = 0;
  function flashOsd(text, sticky = false) {
    osdMode.textContent = text;
    osdMode.classList.remove("is-faded");
    clearTimeout(osdTimer);
    if (!sticky) osdTimer = setTimeout(() => osdMode.classList.add("is-faded"), 2600);
  }

  /* ---------------- flying tape ---------------- */

  const slotOf = (id) => document.querySelector(`.tape[data-tape="${id}"]`).parentElement;
  const tapeEl = (id) => document.querySelector(`.tape[data-tape="${id}"]`);

  function makeFlyer(el, rect) {
    const f = el.cloneNode(true);
    f.classList.add("tape--flying");
    f.removeAttribute("data-tape");
    f.setAttribute("aria-hidden", "true");
    f.tabIndex = -1;
    Object.assign(f.style, {
      left: rect.left + "px", top: rect.top + "px",
      width: rect.width + "px", height: rect.height + "px",
      transform: "none", visibility: "visible",
    });
    document.body.appendChild(f);
    return f;
  }

  function slotTarget(r) {
    const s = slot.getBoundingClientRect();
    const scale = (s.width * 0.92) / r.width;
    const dx = s.left + (s.width - r.width * scale) / 2 - r.left;
    const dy = s.top + (s.height - r.height * scale) / 2 - r.top;
    return { dx, dy, scale };
  }

  async function flyIn(id) {
    const el = tapeEl(id);
    const r = el.getBoundingClientRect();
    const f = makeFlyer(el, r);
    slotOf(id).classList.add("is-out");
    const { dx, dy, scale } = slotTarget(r);
    const lift = Math.min(60, Math.max(24, Math.abs(dy) * 0.25));
    slot.classList.add("is-open");
    const anim = f.animate([
      { transform: "translate(0,0) rotate(0deg) scale(1)" },
      { transform: `translate(${dx * 0.15}px, ${-lift}px) rotate(-4deg) scale(1.04)`, offset: 0.25 },
      { transform: `translate(${dx}px, ${dy - 6}px) rotate(0deg) scale(${scale})`, offset: 0.8 },
      { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(${scale * 0.94}, ${scale * 0.3})`, opacity: 0.2 },
    ], { duration: reduced ? 1 : 820, easing: "cubic-bezier(.4,.1,.25,1)", fill: "forwards" });
    await anim.finished;
    f.remove();
    slot.classList.remove("is-open");
    slot.classList.add("has-tape");
    clunk(); motor(0.7);
  }

  async function flyOut(id) {
    const el = tapeEl(id);
    const holder = slotOf(id);
    slot.classList.add("is-open");
    noise(0.07, { freq: 900, gain: 0.35 }); motor(0.4);
    holder.classList.remove("is-out");          // make room in the stack first
    el.style.visibility = "hidden";
    await wait(360);
    const r = el.getBoundingClientRect();
    const f = makeFlyer(el, r);
    const { dx, dy, scale } = slotTarget(r);
    slot.classList.remove("has-tape");
    const anim = f.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${scale * 0.94}, ${scale * 0.3})`, opacity: 0.2 },
      { transform: `translate(${dx}px, ${dy + 14}px) scale(${scale})`, opacity: 1, offset: 0.2 },
      { transform: `translate(${dx * 0.3}px, ${-40}px) rotate(3deg) scale(1.04)`, offset: 0.65 },
      { transform: "translate(0,0) rotate(0deg) scale(1)" },
    ], { duration: reduced ? 1 : 760, easing: "cubic-bezier(.3,.1,.25,1)", fill: "forwards" });
    setTimeout(() => slot.classList.remove("is-open"), 250);
    await anim.finished;
    el.style.visibility = "";
    f.remove();
    noise(0.04, { freq: 500, gain: 0.25 });
  }

  /* ---------------- play / eject ---------------- */

  function render(id) {
    const tpl = document.getElementById(`tape-${id}`);
    play.replaceChildren(tpl.content.cloneNode(true));
    play.scrollTop = 0;
    play.setAttribute("aria-label", tpl.content.querySelector(".tape-doc").dataset.title);
  }

  function setTint(id) {
    document.documentElement.style.setProperty("--tint", TINT[id] || "120, 170, 255");
  }

  async function insert(id, { instant = false } = {}) {
    if (busy) return;
    busy = true;
    try {
      if (current === id) { await eject(); return; }
      if (current) await eject();
      room.setAttribute("data-on", "");
      if (instant) {
        slotOf(id).classList.add("is-out");
        slot.classList.add("has-tape");
      } else {
        await flyIn(id);
      }
      current = id;
      tapes.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.tape === id)));
      setTint(id);
      render(id);
      if (!instant) {
        screen.dataset.state = "snow";
        startSnow(); hiss(0.7);
        await wait(650);
        stopSnow();
      }
      screen.dataset.state = "playing";
      room.setAttribute("data-playing", "");
      screen.classList.remove("is-tracking"); void screen.offsetWidth; screen.classList.add("is-tracking");
      started = Date.now();
      flashOsd("▶ PLAY");
      history.replaceState(null, "", `#${id}`);
      if (!instant) {
        play.focus({ preventScroll: true });
        // phones: the TV is too small to read, so go straight to the big screen
        if (innerWidth <= 820) zoomIn();
      }
    } finally {
      busy = false;
    }
  }

  async function eject() {
    if (!current) { click(); return; }
    const id = current;
    current = null;
    started = 0;
    unzoom();
    flashOsd("⏏ EJECT", true);
    room.removeAttribute("data-playing");
    tapes.forEach((t) => t.setAttribute("aria-pressed", "false"));
    screen.dataset.state = "snow";
    startSnow(); hiss(0.3);
    await wait(260);
    stopSnow();
    screen.dataset.state = "idle";
    play.replaceChildren();
    osdCounter.textContent = "0:00:00";
    history.replaceState(null, "", location.pathname + location.search);
    await flyOut(id);
    tapeEl(id).focus({ preventScroll: true });
  }

  /* ---------------- wiring ---------------- */

  tapes.forEach((t) => {
    t.setAttribute("aria-pressed", "false");
    t.setAttribute("aria-label", `Play tape: ${t.querySelector(".label").textContent}`);
    t.addEventListener("click", () => insert(t.dataset.tape));
  });

  document.getElementById("btnEject").addEventListener("click", () => { if (!busy) { busy = true; eject().finally(() => (busy = false)); } });

  function seek(dir) {
    click();
    if (!current) return;
    flashOsd(dir > 0 ? "▶▶ FF" : "◀◀ REW");
    play.scrollBy({ top: dir * play.clientHeight * 0.7, behavior: reduced ? "auto" : "smooth" });
    setTimeout(() => flashOsd("▶ PLAY"), 700);
  }
  document.getElementById("btnRew").addEventListener("click", () => seek(-1));
  document.getElementById("btnFf").addEventListener("click", () => seek(1));

  // links inside a tape that point at another tape
  play.addEventListener("click", (e) => {
    const j = e.target.closest(".jump");
    if (j) insert(j.dataset.goto);
  });

  // zoom: fill the window with the screen
  const zoomBtn = document.getElementById("zoom");
  function unzoom() { room.removeAttribute("data-zoom"); zoomBtn.textContent = "⤢"; zoomBtn.setAttribute("aria-label", "Fill the window with the screen"); }
  function zoomIn() { room.setAttribute("data-zoom", ""); zoomBtn.textContent = "✕"; zoomBtn.setAttribute("aria-label", "Back to the room"); }
  zoomBtn.addEventListener("click", () => {
    click();
    if (room.hasAttribute("data-zoom")) unzoom(); else zoomIn();
    play.focus({ preventScroll: true });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (room.hasAttribute("data-zoom")) unzoom();
      else if (current && !busy) document.getElementById("btnEject").click();
    }
  });

  /* ---------------- plain-text version ---------------- */

  const plainInner = document.getElementById("plainInner");
  ["about", "experience", "projects", "education", "misc", "contact"].forEach((id) => {
    const node = document.getElementById(`tape-${id}`).content.cloneNode(true);
    node.querySelector(".tape-doc").id = `plain-${id}`;
    node.querySelectorAll(".jump").forEach((b) => {
      const a = document.createElement("a");
      a.href = `#plain-${b.dataset.goto}`;
      a.textContent = b.textContent;
      b.replaceWith(a);
    });
    plainInner.appendChild(node);
  });

  /* ---------------- deep links: /#projects ---------------- */

  const start = location.hash.slice(1);
  if (TINT[start]) insert(start, { instant: true });
  else screen.dataset.state = "idle", room.setAttribute("data-on", "");
})();
