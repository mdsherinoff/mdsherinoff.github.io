import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  buildShell, buildFluorescent, buildShelfUnit, buildDisplayTable, buildShelfTalker, buildPopcorn,
  buildCounter, buildFrame, buildNeon, buildPennant, buildScreenMaterial, buildTV, buildPlayer, buildCase,
  TV, CASE, PLAYER, RISER, ROOM,
} from "./build.js";
import { playerDisplay, trailerCard, identCard, TRAILERS, employeeTexture, posterTexture } from "./textures.js";
import { sound } from "./sound.js";

// staff picks: first three on the top step
const DISCS = [
  { id: "about", no: 1, title: "ABOUT ME", style: "hotel", ink: "rgba(122,46,59,.75)", tint: 0xf2a7a0, talker: ["Start here.", "Funny, a bit nerdy."] },
  { id: "projects", no: 3, title: "PROJECTS", style: "dune", ink: "rgba(44,18,9,.75)", tint: 0xff9646, talker: ["Big builds,", "small crew. Epic."] },
  { id: "experience", no: 2, title: "WORK", style: "fold", tint: 0x78aaff, talker: ["Based on true", "events (Doha)."] },
  { id: "education", no: 4, title: "EDUCATION", style: "laurels", tint: 0x9fd6b8, talker: ["4-year coming-", "of-age story."] },
  { id: "misc", no: 5, title: "BONUS FEATURES", style: "quote", tint: 0xf0c419, talker: ["Deleted scenes", "+ Barça. Cult."] },
  { id: "contact", no: 6, title: "CONTACT", style: "ink", ink: "rgba(20,20,20,.7)", tint: 0xcfd6e6, talker: ["Ends with a", "phone call. Go."] },
];
const byId = Object.fromEntries(DISCS.map((d) => [d.id, d]));

const $ = (id) => document.getElementById(id);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const V3 = THREE.Vector3;
const sleep = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
const ease = {
  inOut: (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
};

main().catch((err) => {
  console.error(err);
  location.replace("../vhs-2d/");
});

async function main() {
  /* ---------------- renderer ---------------- */

  const canvas = $("gl");
  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) throw new Error("no webgl");

  await Promise.race([
    Promise.all([
      '64px "Permanent Marker"', '64px "Gochi Hand"', '64px "Anton"',
      '700 64px "Jost"', '600 64px "Jost"', '500 64px "Jost"', '400 64px "Jost"',
      '700 64px "Syncopate"', '400 64px "Syncopate"',
      '400 64px "Instrument Serif"', 'italic 400 64px "Instrument Serif"',
      '500 40px "IBM Plex Mono"', '600 40px "IBM Plex Mono"', '500 40px "IBM Plex Sans"', '600 40px "IBM Plex Sans"',
    ].map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 4000)),
  ]);

  const small = Math.min(innerWidth, innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.6 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  RectAreaLightUniformsLib.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080b);
  scene.fog = new THREE.FogExp2(0x0d0f16, .09);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .18;

  const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, .02, 30);

  /* ---------------- the store ---------------- */

  buildShell(scene);
  scene.add(new THREE.HemisphereLight(0xb8c4d8, 0x2a1d30, .35));

  const tubes = [[-1.4, -.6], [.6, -.6], [-1.4, -1.9], [.6, -1.9], [1.75, -.9]].map(([x, z]) => {
    const f = buildFluorescent();
    f.position.set(x, ROOM.ceiling - .03, z);
    scene.add(f);
    return f;
  });
  const flickery = tubes[3];

  // warm spot over the staff picks, the one light that casts shadows
  const spot = new THREE.SpotLight(0xffd9a8, 6, 0, .5, .9, 2);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.bias = -.0002; spot.shadow.normalBias = .02; spot.shadow.radius = 4;
  scene.add(spot, spot.target);

  const genres = [
    { name: "NEW RELEASES", color: "#c2272d" },
    { name: "SCI-FI", color: "#1f3a5f" },
    { name: "INDIE", color: "#2c5f4f" },
    { name: "DRAMA", color: "#5a2a4a" },
  ];
  genres.forEach((gn, i) => {
    const u = buildShelfUnit(i + 1, gn);
    u.position.set(-2.15 + i * 1.04, 0, ROOM.backZ + .18);
    scene.add(u);
  });
  // a side run of shelves on the left wall
  [0, 1].forEach((i) => {
    const u = buildShelfUnit(7 + i, { name: i ? "COMEDY" : "CLASSICS", color: i ? "#a8641c" : "#3b3b3b" });
    u.rotation.y = Math.PI / 2;
    u.position.set(-3.02, 0, -1.4 + i * 1.04);
    scene.add(u);
  });

  const neon = buildNeon("SherinVision Video", "#ff4f8b", { width: 2.0, size: 150, w: 1900, h: 300 });
  neon.position.set(-.9, 2.46, ROOM.backZ + .02);
  scene.add(neon);
  const neonOpen = buildNeon("OPEN LATE", "#4fd1ff", { width: .62, size: 150, w: 900, h: 260 });
  neonOpen.position.set(2.25, 2.2, ROOM.backZ + .02);
  scene.add(neonOpen);

  const table = buildDisplayTable();
  scene.add(table);
  const popcorn = buildPopcorn();
  table.add(popcorn);

  const counter = buildCounter();
  scene.add(counter);

  const employee = buildFrame(employeeTexture(), .3, .38, 0x6b4e1f);
  scene.add(employee);
  const poster = buildFrame(posterTexture(), .42, .6);
  scene.add(poster);
  const pennant = buildPennant();
  scene.add(pennant);

  const screenMat = buildScreenMaterial();
  const cardCanvas = document.createElement("canvas"); cardCanvas.width = 1280; cardCanvas.height = 720;
  const cardCtx = cardCanvas.getContext("2d");
  const cardTex = new THREE.CanvasTexture(cardCanvas); cardTex.colorSpace = THREE.SRGBColorSpace;
  const identCanvas = document.createElement("canvas"); identCanvas.width = 1280; identCanvas.height = 720;
  identCard(identCanvas.getContext("2d"), 1280, 720);
  const identTex = new THREE.CanvasTexture(identCanvas); identTex.colorSpace = THREE.SRGBColorSpace;
  screenMat.uniforms.uCard.value = cardTex;
  screenMat.uniforms.uIdent.value = identTex;
  let trailerIdx = 0;
  const drawTrailer = () => { trailerCard(cardCtx, 1280, 720, TRAILERS[trailerIdx]); cardTex.needsUpdate = true; };
  drawTrailer();

  const tv = buildTV(screenMat);
  scene.add(tv.group);
  const player = buildPlayer();
  scene.add(player.group);

  const screenLight = new THREE.RectAreaLight(0x88aaff, 2, TV.screenW, TV.screenH);
  scene.add(screenLight);

  const cases = {};
  DISCS.forEach((d, i) => {
    const c = buildCase(d);
    const j = Math.sin(i * 12.9898) * 43758.5453;
    const talker = buildShelfTalker(d.talker, (j - Math.floor(j) - .5) * .08);
    table.add(talker);
    cases[d.id] = { ...c, d, i, talker, state: "stand", hover: 0, jr: (j - Math.floor(j) - .5) * .05 };
  });

  /* ---------------- layout (landscape / portrait) ---------------- */

  let portrait = false;
  const caseScale = 1.12;

  // where each case rests, in the display table's local space
  function restPose(c) {
    const row = c.i < 3 ? 1 : 0;
    const col = c.i % 3;
    return {
      pos: new V3((col - 1) * .172, .88 + .03 + row * RISER.stepH, -row * RISER.stepD - .015),
      lean: -.1, yaw: c.jr,
    };
  }
  function seatCase(c) {
    table.attach(c.group);
    const p = restPose(c);
    c.group.position.copy(p.pos);
    c.group.rotation.set(p.lean, p.yaw, 0, "YXZ");
    c.group.scale.setScalar(caseScale);
  }
  function placeTalkers() {
    for (const id in cases) {
      const c = cases[id], p = restPose(c), row = c.i < 3 ? 1 : 0;
      if (row) { c.talker.position.set(p.pos.x, p.pos.y - .045, -RISER.stepD / 2 + .0015); c.talker.rotation.set(0, 0, c.talker.rotation.z); }
      else { c.talker.position.set(p.pos.x, .9, .1); c.talker.rotation.set(-1.0, 0, 0); }
    }
  }

  function applyLayout() {
    portrait = innerWidth / innerHeight < .9;
    document.body.classList.toggle("is-portrait", portrait);
    table.position.set(portrait ? 0 : -.42, 0, portrait ? .55 : .5);
    table.rotation.y = portrait ? 0 : .18;
    popcorn.position.set(-.43, .88, .08);
    counter.position.set(1.85, 0, -.95); counter.rotation.y = -.35;
    player.group.position.copy(counter.localToWorld(new V3(-.3, 1.045, .02)));
    player.group.rotation.y = -.35;
    tv.group.position.set(1.62, 1.84, -1.05);
    tv.group.rotation.set(-.08, -.5, 0, "YXZ");
    tv.pole.scale.y = (ROOM.ceiling - 1.84) / 1;
    tv.pole.position.y = (ROOM.ceiling - 1.84) / 2;
    employee.position.set(2.42, 1.42, ROOM.backZ + .02);
    poster.position.set(1.85, 1.5, ROOM.backZ + .02);
    pennant.position.set(2.2, 1.95, ROOM.backZ + .02);
    spot.position.copy(table.localToWorld(new V3(-.4, 2.6, .9)));
    spot.target.position.copy(table.localToWorld(new V3(0, .95, 0)));
    scene.updateMatrixWorld(true);
    for (const id in cases) if (cases[id].state === "stand") seatCase(cases[id]);
    placeTalkers();
    placeScreenLight();
    computeCameras();
  }

  function placeScreenLight() {
    screenLight.position.copy(tv.group.localToWorld(new V3(0, 0, TV.D / 2 + .03)));
    screenLight.lookAt(tv.group.localToWorld(new V3(0, 0, 2)));
  }

  /* ---------------- camera ---------------- */

  const home = { pos: new V3(), look: new V3() };
  const zoom = { pos: new V3(), look: new V3() };
  const cam = { pos: new V3(), look: new V3(), tween: null, mode: "home" };
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };

  function fitDistance(w, h) {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return Math.max(h / 2 / t, w / 2 / (t * camera.aspect));
  }

  function computeCameras() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    if (!portrait) {
      home.look.set(.15, 1.3, -.8);
      home.pos.set(.1, 1.66, 2.85);
    } else {
      home.look.copy(table.localToWorld(new V3(0, 1.32, -.05)));
      home.pos.copy(home.look).addScaledVector(new V3(.05, .18, 1).normalize(), fitDistance(.7, 1.25));
    }
    const fwd = new V3(0, 0, 1).applyQuaternion(tv.group.quaternion);
    const center = tv.group.localToWorld(new V3(0, TV.screenDY, TV.D / 2));
    zoom.look.copy(center);
    zoom.pos.copy(center).addScaledVector(fwd, fitDistance(TV.screenW * 1.07, TV.screenH * 1.2));
    if (!cam.tween) {
      const target = cam.mode === "zoom" ? zoom : home;
      cam.pos.copy(target.pos); cam.look.copy(target.look);
    }
  }

  function moveCamera(mode, dur = 1.1) {
    cam.mode = mode;
    const to = mode === "zoom" ? zoom : home;
    return new Promise((resolve) => {
      cam.tween = { fromPos: camera.position.clone(), fromLook: cam.look.clone(), to, t: 0, dur: reduced ? .01 : dur, resolve };
    });
  }

  /* ---------------- tweens ---------------- */

  const tweens = new Set();
  function tween(dur, fn, easing = ease.inOut) {
    return new Promise((resolve) => tweens.add({ dur: reduced ? .01 : dur, el: 0, fn, easing, resolve }));
  }
  function fly(obj, points, dur, { quat = null, scale = null, easing = ease.inOut } = {}) {
    const curve = points.length > 2 ? new THREE.CatmullRomCurve3(points, false, "centripetal") : new THREE.LineCurve3(points[0], points[1]);
    const q0 = obj.quaternion.clone(), q1 = quat || q0.clone();
    const s0 = obj.scale.x, s1 = scale ?? s0;
    return tween(dur, (e) => {
      obj.position.copy(curve.getPoint(e));
      obj.quaternion.slerpQuaternions(q0, q1, e);
      obj.scale.setScalar(THREE.MathUtils.lerp(s0, s1, e));
    }, easing);
  }
  function stepTweens(dt) {
    for (const tw of tweens) {
      tw.el += dt;
      const k = Math.min(1, tw.el / tw.dur);
      tw.fn(tw.easing(k));
      if (k >= 1) { tweens.delete(tw); tw.resolve(); }
    }
  }

  const facing = (from, yawOffset = 0) => {
    const dir = cam.pos.clone().sub(from); dir.y = 0;
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(dir.x, dir.z) + yawOffset, 0));
  };

  /* ---------------- player tray ---------------- */

  const TRAY_OUT = .15;
  const trayOpenAt = (local = new V3(0, .0035, -.085)) => {
    const p = local.clone();
    p.z += TRAY_OUT;
    return player.group.localToWorld(p.add(new V3(PLAYER.trayX, player.tray.position.y, player.tray.userData.closedZ)));
  };
  function moveTray(open, dur = .7) {
    sound.motor(dur);
    const z0 = player.tray.position.z, z1 = player.tray.userData.closedZ + (open ? TRAY_OUT : 0);
    return tween(dur, (e) => (player.tray.position.z = THREE.MathUtils.lerp(z0, z1, e)));
  }
  const setLid = (c, open, dur = .38) => {
    const a0 = c.hinge.rotation.y, a1 = open ? -1.95 : 0;
    sound.click();
    return tween(dur, (e) => (c.hinge.rotation.y = THREE.MathUtils.lerp(a0, a1, e)), ease.out);
  };

  async function presentCase(c) {
    c.state = "out";
    scene.attach(c.group);
    const start = c.group.position.clone();
    const stage = table.localToWorld(new V3(restPose(c).pos.x * .6, 1.28, .38));
    await fly(c.group, [start, start.clone().add(new V3(0, .05, .08)), stage], .6, { quat: facing(stage, .3), scale: 1.25 });
  }
  async function returnCase(c) {
    const p = restPose(c);
    const dest = table.localToWorld(p.pos.clone());
    const q = table.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(p.lean, p.yaw, 0, "YXZ")));
    const now = c.group.position.clone();
    await fly(c.group, [now, dest.clone().add(new V3(0, .07, .1)), dest], .6, { quat: q, scale: caseScale });
    seatCase(c);
    c.state = "stand";
  }

  /* ---------------- screen / overlay ---------------- */

  const scr = $("scr");
  const play = $("play");
  const hudTitle = $("hudTitle");
  const hudTime = $("hudTime");
  const hudChapter = $("hudChapter");
  const progressFill = $("progressFill");
  const ticks = $("ticks");
  const deckbar = $("deckbar");
  let lightTarget = { color: new THREE.Color(0x88aaff), intensity: 2 };

  function setScreen(mode, tint) {
    screenMat.uniforms.uMode.value = { off: 0, trailers: 1, ident: 2, play: 3 }[mode];
    if (tint != null) screenMat.uniforms.uTint.value.set(tint);
    lightTarget = {
      off: { color: new THREE.Color(0), intensity: 0 },
      trailers: { color: new THREE.Color(0xc8d4ff), intensity: 2.2 },
      ident: { color: new THREE.Color(0xfff0d8), intensity: 1.2 },
      play: { color: new THREE.Color(tint ?? 0x78aaff), intensity: 2.2 },
    }[mode];
  }

  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => new V3(x * TV.screenW / 2, TV.screenDY + y * TV.screenH / 2, TV.D / 2 + .001));
  function placeOverlay() {
    if (scr.classList.contains("is-full")) { scr.style.cssText = ""; return; }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const v = new V3();
    for (const c of corners) {
      v.copy(c); tv.group.localToWorld(v); v.project(camera);
      const sx = (v.x * .5 + .5) * innerWidth, sy = (-v.y * .5 + .5) * innerHeight;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    scr.style.cssText = `left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px;--scr-w:${x1 - x0}px`;
  }

  function showOverlay(on) {
    scr.classList.toggle("is-on", on);
    deckbar.hidden = !on;
    document.body.classList.toggle("is-playing", on);
  }

  let chapters = [];
  function render(id) {
    const tpl = $(`tape-${id}`);
    play.replaceChildren(tpl.content.cloneNode(true));
    play.scrollTop = 0;
    play.setAttribute("aria-label", tpl.content.querySelector(".tape-doc").dataset.title);
    scr.dataset.disc = id;
    hudTitle.textContent = `DISC ${byId[id].no} · ${byId[id].title}`;
    chapters = [...play.querySelectorAll(".card, .entry, .ch")];
    requestAnimationFrame(() => {
      const H = play.scrollHeight;
      ticks.replaceChildren(...chapters.slice(1).map((el) => {
        const t = document.createElement("i");
        t.style.left = `${(el.offsetTop / H) * 100}%`;
        return t;
      }));
      updateProgress();
    });
  }
  function currentChapter() {
    const y = play.scrollTop + play.clientHeight * .35;
    let n = 0;
    chapters.forEach((el, i) => { if (el.offsetTop <= y) n = i; });
    return n;
  }
  function updateProgress() {
    const max = play.scrollHeight - play.clientHeight;
    progressFill.style.width = `${(max > 0 ? play.scrollTop / max : 0) * 100}%`;
    hudChapter.textContent = `CH ${currentChapter() + 1}/${chapters.length}`;
  }
  play.addEventListener("scroll", updateProgress, { passive: true });

  function skip(dir) {
    sound.click();
    if (!current) return;
    const n = Math.max(0, Math.min(chapters.length - 1, currentChapter() + dir));
    play.scrollTo({ top: Math.max(0, chapters[n].offsetTop - 20), behavior: reduced ? "auto" : "smooth" });
  }

  /* ---------------- toast ---------------- */

  const toast = $("toast");
  let toastTimer = 0;
  const RENTED = [
    "Sorry, that one's rented out. Try the staff picks.",
    "Due back Thursday. The staff picks are in.",
    "That's the display copy. Staff picks are on the red table.",
  ];
  function say(text) {
    toast.textContent = text;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2600);
  }

  /* ---------------- insert / eject ---------------- */

  let current = null;
  let busy = false;
  let started = 0;
  let interacted = false;
  let displayText = "HELLO";

  async function insert(id, { instant = false } = {}) {
    if (busy) return;
    interacted = true;
    busy = true;
    try {
      if (current === id) { await eject(); return; }
      if (current) await eject();
      const c = cases[id];
      const disc = c.disc;

      if (instant) {
        player.tray.attach(disc);
        disc.position.set(0, .0035, -.085); disc.rotation.set(0, 0, 0); disc.scale.setScalar(1);
        disc.visible = false;
      } else {
        await presentCase(c);
        await setLid(c, true);
        scene.attach(disc);
        displayText = "OPEN";
        const trayOpening = moveTray(true);
        const p0 = disc.position.clone();
        const above = trayOpenAt(new V3(0, .12, -.085));
        const high = p0.clone().lerp(above, .5).add(new V3(0, .35, 0));
        const seat = trayOpenAt();
        const flat = player.group.getWorldQuaternion(new THREE.Quaternion());
        sound.slide();
        await fly(disc, [p0, p0.clone().add(new V3(0, .04, .08)), high, above], 1.25, { quat: flat, scale: 1 });
        await trayOpening;
        await fly(disc, [above, seat], .3, { easing: ease.in });
        sound.tap();
        player.tray.attach(disc);
        displayText = "CLOSE";
        const closing = moveTray(false);
        const back = setLid(c, false).then(() => returnCase(c));
        await closing;
        disc.visible = false;
        await back;
      }

      current = id;
      syncKeys();
      render(id);
      history.replaceState(null, "", `#${id}`);
      displayText = "LOAD";
      if (instant) {
        setScreen("play", byId[id].tint);
        cam.mode = "zoom"; cam.pos.copy(zoom.pos); cam.look.copy(zoom.look);
      } else {
        setScreen("ident");
        sound.spin();
        const camDone = moveCamera("zoom", 1.4);
        await tween(2.1, (e) => (screenMat.uniforms.uIdentT.value = e), (t) => t);
        setScreen("play", byId[id].tint);
        await camDone;
      }
      if (portrait) scr.classList.add("is-full");
      showOverlay(true);
      started = Date.now();
      if (!instant) play.focus({ preventScroll: true });
    } finally {
      busy = false;
    }
  }

  async function eject() {
    if (!current) { sound.click(); return; }
    const id = current;
    const c = cases[id];
    const disc = c.disc;
    current = null;
    started = 0;
    syncKeys();
    showOverlay(false);
    scr.classList.remove("is-full");
    history.replaceState(null, "", location.pathname + location.search);
    setScreen("trailers");
    displayText = "OPEN";
    await moveCamera("home", 1.1);

    disc.visible = true;
    const opening = moveTray(true);
    const caseReady = presentCase(c).then(() => setLid(c, true));
    await Promise.all([opening, caseReady]);

    scene.attach(disc);
    const slotLocal = new V3(0, CASE.h / 2, CASE.d / 2 + .0012);
    const dest = c.group.localToWorld(slotLocal.clone());
    const upright = c.group.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)));
    const p0 = disc.position.clone();
    const high = p0.clone().lerp(dest, .5).add(new V3(0, .35, 0));
    sound.slide();
    await fly(disc, [p0, p0.clone().add(new V3(0, .1, 0)), high, dest.clone().add(new V3(0, .02, .08)), dest], 1.25, { quat: upright, scale: 1.25 });
    c.group.attach(disc);
    disc.position.copy(slotLocal); disc.rotation.set(Math.PI / 2, 0, 0); disc.scale.setScalar(1);
    sound.tap();
    displayText = "CLOSE";
    await Promise.all([moveTray(false), setLid(c, false).then(() => returnCase(c))]);
    displayText = "HELLO";
  }

  /* ---------------- interaction ---------------- */

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
  let hovered = null;
  const stock = [];
  scene.traverse((o) => { if (o.isMesh && o.material?.alphaTest > .3 && o.geometry.type === "PlaneGeometry" && o.parent?.children.length > 6) stock.push(o); });

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    const targets = [];
    for (const id in cases) if (cases[id].state === "stand") targets.push(...cases[id].pickables);
    for (const id in player.buttons) targets.push(player.buttons[id]);
    const hit = raycaster.intersectObjects([...targets, ...stock], false)[0];
    if (!hit) return null;
    const u = hit.object.userData;
    if (u.case) return { disc: u.case };
    if (u.button) return { button: u.button };
    if (stock.includes(hit.object)) return { stock: true };
    return null;
  }

  canvas.addEventListener("pointermove", (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    parallax.tx = pointer.x; parallax.ty = pointer.y;
    hovered = busy ? null : pick();
    canvas.style.cursor = hovered && !hovered.stock ? "pointer" : "";
  });
  canvas.addEventListener("pointerleave", () => { hovered = null; pointer.set(2, 2); parallax.tx = parallax.ty = 0; });

  let downAt = null;
  canvas.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener("pointerup", (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 8) return;
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const hit = pick();
    if (!hit) return;
    if (hit.disc) insert(hit.disc);
    else if (hit.button) press(hit.button);
    else if (hit.stock && cam.mode === "home") say(RENTED[Math.floor(Math.random() * RENTED.length)]);
  });

  const presses = {};
  function press(id) {
    presses[id] = .12;
    if (id === "eject") doEject();
    if (id === "play") { if (!current) insert("about"); else sound.click(); }
    if (id === "prev") skip(-1);
    if (id === "next") skip(1);
    if (id === "sound") toggleSound();
  }
  function doEject() {
    if (busy) return;
    busy = true;
    eject().finally(() => (busy = false));
  }
  function toggleSound() {
    const on = sound.toggle();
    sound.click();
    document.querySelectorAll("[data-act=sound]").forEach((b) => b.setAttribute("aria-pressed", String(on)));
  }

  document.querySelectorAll("[data-disc]").forEach((b) => {
    b.addEventListener("click", () => insert(b.dataset.disc));
    b.addEventListener("focus", () => { hovered = { disc: b.dataset.disc }; });
    b.addEventListener("blur", () => { hovered = null; });
  });
  document.querySelectorAll("[data-act]").forEach((b) => {
    const act = b.dataset.act;
    if (act === "sound") b.setAttribute("aria-pressed", String(sound.on));
    b.addEventListener("click", () => {
      if (act === "fill") { scr.classList.toggle("is-full"); placeOverlay(); play.focus({ preventScroll: true }); }
      else press(act);
    });
  });
  function syncKeys() {
    document.querySelectorAll("[data-disc]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.disc === current)));
  }
  play.addEventListener("click", (e) => {
    const j = e.target.closest(".jump");
    if (j) insert(j.dataset.goto);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (scr.classList.contains("is-full") && !portrait) { scr.classList.remove("is-full"); return; }
      if (current) doEject();
    }
    if (current && (e.key === "[" || e.key === "]")) skip(e.key === "]" ? 1 : -1);
  });

  /* ---------------- clocks ---------------- */

  const dispCtx = player.display.canvas.getContext("2d");
  const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  setInterval(() => {
    let text = displayText;
    if (current && started) {
      const s = Math.floor((Date.now() - started) / 1000);
      hudTime.textContent = fmt(s);
      text = fmt(s).slice(3);
    }
    playerDisplay(dispCtx, 320, 64, text);
    player.display.tex.needsUpdate = true;
  }, 500);

  // coming attractions: a new card every few seconds, with a dip to black
  setInterval(async () => {
    if (screenMat.uniforms.uMode.value !== 1) return;
    await tween(.35, (e) => (screenMat.uniforms.uFade.value = 1 - e));
    trailerIdx = (trailerIdx + 1) % TRAILERS.length;
    drawTrailer();
    await tween(.35, (e) => (screenMat.uniforms.uFade.value = e));
  }, 3800);

  /* ---------------- post ---------------- */

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 2.2, aperture: .0012, maxblur: .005 });
  if (!small) composer.addPass(bokeh);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .45, .55, .92));
  composer.addPass(new OutputPass());

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setSize(innerWidth, innerHeight);
    if (busy) { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); return; }
    applyLayout();
    if (current && portrait) scr.classList.add("is-full");
  }
  addEventListener("resize", resize);
  resize();
  cam.pos.copy(home.pos); cam.look.copy(home.look);

  /* ---------------- loop ---------------- */

  const clock = new THREE.Clock();
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  const focusPoint = new V3();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 12);

    stepTweens(dt);

    for (const id in cases) {
      const c = cases[id];
      if (c.state !== "stand") continue;
      const poke = !interacted && id === "about" ? Math.pow(Math.max(0, Math.sin(t * 1.6)), 12) : 0;
      const target = hovered?.disc === id && !busy ? 1 : poke;
      c.hover += (target - c.hover) * k;
      const p = restPose(c);
      c.group.position.set(p.pos.x, p.pos.y + c.hover * .035, p.pos.z + c.hover * .03);
      c.group.rotation.set(p.lean + c.hover * .14, p.yaw, 0, "YXZ");
    }

    for (const id in player.buttons) {
      const b = player.buttons[id];
      presses[id] = Math.max(0, (presses[id] || 0) - dt);
      b.position.z = b.userData.rest - (presses[id] > 0 ? .002 : hovered?.button === id ? .0006 : 0);
    }

    if (cam.tween) {
      const tw = cam.tween;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = ease.inOut(tw.t);
      cam.pos.lerpVectors(tw.fromPos, tw.to.pos, e);
      cam.look.lerpVectors(tw.fromLook, tw.to.look, e);
      if (tw.t >= 1) { cam.tween = null; tw.resolve(); }
    } else {
      const target = cam.mode === "zoom" ? zoom : home;
      cam.pos.lerp(target.pos, k); cam.look.lerp(target.look, k);
    }
    const pk = 1 - Math.exp(-dt * 3);
    parallax.x += (parallax.tx - parallax.x) * pk;
    parallax.y += (parallax.ty - parallax.y) * pk;
    const amt = reduced ? 0 : cam.mode === "zoom" ? .004 : portrait ? .03 : .09;
    camera.position.copy(cam.pos).add(new V3(parallax.x * amt, parallax.y * amt * .5, 0));
    camera.lookAt(cam.look);
    camera.updateMatrixWorld();

    // focus follows what matters: the staff picks at home, the TV when zoomed
    focusPoint.copy(cam.mode === "zoom" ? zoom.look : table.localToWorld(new V3(0, 1.1, 0)));
    const fd = -focusPoint.clone().applyMatrix4(camera.matrixWorldInverse).z;
    bokeh.uniforms.focus.value += (fd - bokeh.uniforms.focus.value) * k;
    bokeh.uniforms.aperture.value = cam.mode === "zoom" ? .0002 : .0018;

    screenMat.uniforms.uTime.value = t;
    screenLight.color.lerp(lightTarget.color, k * .5);
    screenLight.intensity += (lightTarget.intensity - screenLight.intensity) * k;
    pennant.userData.wave(t);

    // one tube that never quite works
    const bad = Math.sin(t * 7.3) + Math.sin(t * 13.1) > 1.7 && Math.random() < .5;
    flickery.userData.light.intensity = bad ? 1.2 : 5.5;
    flickery.userData.tubes[0].material.color.setScalar(bad ? .35 : 1);
    neon.userData.mesh.material.opacity = .92 + Math.sin(t * 50) * .03 + (Math.random() < .004 ? -.5 : 0);

    composer.render();
    if (scr.classList.contains("is-on")) placeOverlay();
  }

  setScreen("trailers");
  frame();
  $("loader").classList.add("is-done");

  /* ---------------- plain-text version ---------------- */

  const plainInner = $("plainInner");
  ["about", "experience", "projects", "education", "misc", "contact"].forEach((id) => {
    const node = $(`tape-${id}`).content.cloneNode(true);
    node.querySelector(".tape-doc").id = `plain-${id}`;
    node.querySelectorAll(".jump").forEach((b) => {
      const a = document.createElement("a");
      a.href = `#plain-${b.dataset.goto}`;
      a.textContent = b.textContent;
      b.replaceWith(a);
    });
    plainInner.appendChild(node);
  });

  const start = location.hash.slice(1);
  if (byId[start]) insert(start, { instant: true });
}
