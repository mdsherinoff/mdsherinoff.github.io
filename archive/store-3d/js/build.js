// Builds the video store: shelves of stock, the staff-picks riser, the
// counter with the player, a ceiling-mounted TV, lights and signage.
// Units are metres; floor at y = 0, back wall at z = -2.6.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as T from "./textures.js";

export const TV = { W: .745, H: .44, D: .03, panelY: 0, screenW: .712, screenH: .4, screenDY: .008 };
export const CASE = { w: .129, h: .148, d: .012 };
export const DISC_R = .06;
export const ROOM = { backZ: -2.6, ceiling: 2.7 };

const shadowy = (o, cast = true, receive = true) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = receive; } }); return o; };
const mat = (o) => new THREE.MeshStandardMaterial(o);

/* ---------------- shell ---------------- */

export function buildShell(scene) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), mat({ map: T.carpetTexture(), roughness: .95 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -.5; floor.receiveShadow = true;
  const wallMat = mat({ map: T.wallTexture(), roughness: .9 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(9, ROOM.ceiling), wallMat);
  back.position.set(0, ROOM.ceiling / 2, ROOM.backZ); back.receiveShadow = true;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(8, ROOM.ceiling), wallMat);
  left.rotation.y = Math.PI / 2; left.position.set(-3.2, ROOM.ceiling / 2, -.5); left.receiveShadow = true;
  const right = left.clone(); right.rotation.y = -Math.PI / 2; right.position.x = 3.2;
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), mat({ map: T.ceilingTexture(), roughness: 1 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, ROOM.ceiling, -.5);
  // skirting
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(9, .12, .02), mat({ color: 0x14181d, roughness: .6 }));
  skirt.position.set(0, .06, ROOM.backZ + .01);
  scene.add(floor, back, left, right, ceil, skirt);
}

// fluorescent fixtures: the glowing tubes, plus an area light pointing down
export function buildFluorescent() {
  const g = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.BoxGeometry(1.25, .05, .22), mat({ color: 0xdedbd2, roughness: .6 }));
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xf4f7ff, toneMapped: false });
  const tubes = [-.05, .05].map((z) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, 1.18, 12), tubeMat.clone());
    t.rotation.z = Math.PI / 2; t.position.set(0, -.03, z); return t;
  });
  const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .12, toneMapped: false }));
  diffuser.rotation.x = Math.PI / 2; diffuser.position.y = -.045;
  g.add(housing, ...tubes, diffuser);
  const light = new THREE.RectAreaLight(0xe9efff, 5.5, 1.2, .22);
  light.position.y = -.05; light.lookAt(0, -10, 0);
  g.add(light);
  g.userData = { tubes, light };
  return g;
}

/* ---------------- shelving ---------------- */

export function buildShelfUnit(seed, genre) {
  const W = 1.0, H = 2.05, D = .34;
  const g = new THREE.Group();
  const frameMat = mat({ color: 0x2a2523, roughness: .55 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, .02), mat({ map: T.pegboardTexture(), roughness: .8 }));
  back.position.set(0, H / 2, -D / 2);
  const sideGeo = new THREE.BoxGeometry(.035, H, D);
  const l = new THREE.Mesh(sideGeo, frameMat); l.position.set(-W / 2, H / 2, 0);
  const r = new THREE.Mesh(sideGeo, frameMat); r.position.set(W / 2, H / 2, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(W + .04, .04, D + .02), frameMat); top.position.set(0, H, 0);
  g.add(back, l, r, top);
  const lipMat = mat({ map: T.laminateTexture(genre.color, "#f2b33d"), roughness: .5 });
  for (let i = 0; i < 5; i++) {
    const y = .22 + i * .37;
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(W - .04, .02, D - .02), frameMat);
    ledge.position.set(0, y - .012, 0);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(W - .04, .035, .012), lipMat);
    lip.position.set(0, y + .006, D / 2 - .01);
    const row = new THREE.Mesh(new THREE.PlaneGeometry(W - .05, .17), new THREE.MeshStandardMaterial({ map: T.shelfRowTexture(seed * 10 + i, 8), transparent: true, alphaTest: .4, roughness: .45 }));
    row.position.set(0, y + .085, D / 2 - .055);
    row.rotation.x = -.16;
    g.add(ledge, lip, row);
  }
  const sign = new THREE.Mesh(new THREE.BoxGeometry(.86, .215, .02), [frameMat, frameMat, frameMat, frameMat, mat({ map: T.genreSignTexture(genre.name, genre.color), roughness: .6 }), frameMat]);
  sign.position.set(0, H + .2, 0);
  const wireMat = mat({ color: 0x888888, metalness: .8, roughness: .3 });
  [-.35, .35].forEach((x) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.003, .003, .2), wireMat); w.position.set(x, H + .4, 0); g.add(w); });
  g.add(sign);
  return shadowy(g);
}

/* ---------------- staff picks display ---------------- */

export const RISER = { stepH: .24, stepD: .1, w: .56 };

export function buildDisplayTable() {
  const g = new THREE.Group();
  const lam = mat({ map: T.laminateTexture("#7b1e2b", "#f2b33d"), roughness: .45 });
  const topMat = mat({ map: T.woodTexture(), roughness: .5 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(1.15, .04, .64, 2, .008), topMat);
  top.position.y = .86;
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, .84, .6), lam);
  body.position.y = .42;
  g.add(top, body);
  // stepped riser, two steps
  const riserMat = mat({ color: 0x191a1d, roughness: .5 });
  for (let i = 0; i < 2; i++) {
    const h = .03 + i * RISER.stepH;
    const step = new THREE.Mesh(new RoundedBoxGeometry(RISER.w, h, RISER.stepD, 2, .004), riserMat);
    step.position.set(0, .88 + h / 2, -i * RISER.stepD);
    g.add(step);
  }
  // header card on a little easel behind the top step
  const card = new THREE.Mesh(new THREE.PlaneGeometry(.6, .26), mat({ map: T.headerCardTexture(), roughness: .8 }));
  card.position.set(0, .88 + .03 + RISER.stepH + .2 + .13, -RISER.stepD - .04);
  card.rotation.x = -.12;
  const easel = new THREE.Mesh(new THREE.BoxGeometry(.012, .45, .012), riserMat);
  easel.position.set(0, .88 + .03 + RISER.stepH + .15, -RISER.stepD - .12); easel.rotation.x = -.3;
  g.add(card, easel);
  return shadowy(g);
}

export function buildShelfTalker(lines, tilt = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.12, .07), mat({ map: T.shelfTalkerTexture(lines, { tilt }), roughness: .85, side: THREE.DoubleSide }));
  m.castShadow = true;
  return m;
}

export function buildPopcorn() {
  const g = new THREE.Group();
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(.075, .055, .18, 24, 1, true), mat({ map: T.popcornTexture(), roughness: .7, side: THREE.DoubleSide }));
  bucket.position.y = .09;
  const kernels = new THREE.Group();
  const kMat = mat({ color: 0xf6e7b8, roughness: .9 });
  const r = T.rng(4);
  for (let i = 0; i < 60; i++) {
    const k = new THREE.Mesh(new THREE.IcosahedronGeometry(.012 + r() * .006, 0), kMat);
    const a = r() * 6.28, d = Math.sqrt(r()) * .065;
    k.position.set(Math.cos(a) * d, .17 + r() * .04 * (1 - d / .07), Math.sin(a) * d);
    k.rotation.set(r() * 3, r() * 3, 0);
    kernels.add(k);
  }
  g.add(bucket, kernels);
  return shadowy(g);
}

/* ---------------- counter ---------------- */

export function buildCounter() {
  const g = new THREE.Group();
  const front = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, .62), mat({ map: T.laminateTexture("#1f3a5f", "#f2b33d"), roughness: .45 }));
  front.position.y = .5;
  const top = new THREE.Mesh(new RoundedBoxGeometry(1.56, .045, .7, 2, .01), mat({ color: 0x15161a, roughness: .25, metalness: .1 }));
  top.position.y = 1.02;
  g.add(front, top);
  // returns box
  const box = new THREE.Mesh(new RoundedBoxGeometry(.24, .18, .2, 2, .006), mat({ color: 0xc2272d, roughness: .5 }));
  box.position.set(.52, 1.04 + .09, -.05);
  const slot = new THREE.Mesh(new THREE.PlaneGeometry(.16, .015), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  slot.position.set(.52, 1.04 + .14, .051);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.18, .05), mat({ map: T.genreSignTexture("RETURNS", "#c2272d"), roughness: .6 }));
  label.position.set(.52, 1.04 + .075, .0505);
  g.add(box, slot, label);
  // a small plant (odin's garden)
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.045, .035, .08, 20), mat({ color: 0xb8663b, roughness: .8 }));
  pot.position.set(.66, 1.08, .2);
  const leafMat = mat({ color: 0x3f7a3a, roughness: .6, side: THREE.DoubleSide });
  const r = T.rng(6);
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.04, 10, 6, 0, Math.PI), leafMat);
    leaf.scale.set(.5, 1.4, .2);
    leaf.position.set(.66 + (r() - .5) * .03, 1.17 + r() * .04, .2 + (r() - .5) * .03);
    leaf.rotation.set(r() * .8 - .4, r() * 6.28, r() * .9 - .45);
    g.add(leaf);
  }
  g.add(pot);
  return shadowy(g);
}

/* ---------------- wall bits ---------------- */

export function buildFrame(tex, w, h, color = 0x1b1410) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new RoundedBoxGeometry(w + .04, h + .04, .025, 2, .004), mat({ color, roughness: .5 }));
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat({ map: tex, roughness: .8 }));
  art.position.z = .0128;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transparent: true, opacity: .06, depthWrite: false }));
  glass.position.z = .015;
  g.add(frame, art, glass);
  return shadowy(g);
}

export function buildNeon(text, color, opts = {}) {
  const tex = T.neonTexture(text, color, opts);
  const w = opts.width || 1.4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * (opts.h || 300) / (opts.w || 1400)), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  const light = new THREE.PointLight(color, 1.2, 2.2, 2);
  light.position.z = .25;
  const g = new THREE.Group(); g.add(m, light);
  g.userData = { mesh: m, light };
  return g;
}

export function buildPennant() {
  const geo = new THREE.PlaneGeometry(.26, .1, 24, 1);
  geo.translate(.13, 0, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: T.pennantTexture(), alphaTest: .5, roughness: 1, side: THREE.DoubleSide }));
  m.castShadow = true;
  const g = new THREE.Group(); g.add(m);
  g.userData.wave = (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 22 - t * 1.4) * .006 * (x / .26)); }
    p.needsUpdate = true;
  };
  g.rotation.z = -.12;
  return g;
}

/* ---------------- TV (ceiling mount) ---------------- */

export function buildScreenMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMode: { value: 1 },         // 0 off · 1 trailers · 2 studio ident · 3 playing
      uCard: { value: null },
      uIdent: { value: null },
      uTint: { value: new THREE.Color(.47, .67, 1) },
      uFade: { value: 1 },
      uIdentT: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uMode, uFade, uIdentT; uniform sampler2D uCard, uIdent; uniform vec3 uTint;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 uv = vUv;
        vec3 col = vec3(.004,.005,.007);
        float grain = hash(uv * 900. + fract(uTime * 13.) * 50.) - .5;
        if (uMode > .5 && uMode < 1.5) {
          col = texture2D(uCard, uv).rgb * 1.15;
          col *= .94 + .06 * sin(uTime * 23.);          // projector-ish flicker
          col += grain * .06;
        } else if (uMode > 1.5 && uMode < 2.5) {
          col = texture2D(uIdent, uv).rgb;
          float sweep = smoothstep(.12, .0, abs(uv.x - (uIdentT * 1.6 - .3) - (uv.y - .5) * .4));
          col *= smoothstep(0., .25, uIdentT) * (1. - smoothstep(.85, 1., uIdentT));
          col += vec3(1.,.95,.85) * sweep * .5 * step(.4, texture2D(uIdent, uv).r);
        } else if (uMode > 2.5) {
          vec2 p = (uv - .5) * vec2(16./9., 1.);
          col = vec3(.012,.014,.02) + uTint * .07 * smoothstep(1.1, .0, length(p - vec2(0., .1)));
        }
        col *= uFade;
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

export function buildTV(screenMat) {
  const { W, H, D, screenW, screenH, screenDY } = TV;
  const tv = new THREE.Group();
  const black = new THREE.MeshPhysicalMaterial({ color: 0x0c0c0d, roughness: .35, clearcoat: .5, clearcoatRoughness: .25 });
  const metal = mat({ color: 0x3a3b3e, metalness: .8, roughness: .35 });

  const panel = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, .006), black);
  const backBox = new THREE.Mesh(new RoundedBoxGeometry(W * .7, H * .62, .05, 3, .01), black);
  backBox.position.set(0, -.02, -.035);
  tv.add(panel, backBox);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), screenMat);
  screen.position.set(0, screenDY, D / 2 + .0005);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(screenW + .006, screenH + .006),
    new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: .06, transparent: true, opacity: .2, clearcoat: 1, depthWrite: false }));
  glass.position.copy(screen.position); glass.position.z += .0008;
  const brand = new THREE.Mesh(new THREE.PlaneGeometry(.09, .0085), mat({ map: T.brandTexture(), transparent: true, metalness: .5, roughness: .4 }));
  brand.position.set(0, -H / 2 + .0085, D / 2 + .001);
  tv.add(screen, glass, brand);

  // ceiling bracket
  const plate = new THREE.Mesh(new THREE.BoxGeometry(.2, .14, .02), metal); plate.position.set(0, 0, -.07);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(.04, .04, .06), metal); arm.position.set(0, 0, -.045);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1, 12), metal);
  pole.position.set(0, .5, -.07);
  tv.add(plate, arm, pole);

  shadowy(tv);
  screen.castShadow = glass.castShadow = false;
  return { group: tv, screen, pole };
}

/* ---------------- Blu-ray player ---------------- */

export const PLAYER = { w: .43, h: .052, d: .24, trayX: -.105 };

export function buildPlayer() {
  const { w, h, d, trayX } = PLAYER;
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x151517, roughness: .3, clearcoat: .6 });
  const topMat = new THREE.MeshStandardMaterial({ map: T.brushedTexture(), color: 0x9a9a9a, metalness: .35, roughness: .6 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, .005), bodyMat);
  body.position.y = h / 2 + .006;
  g.add(body);
  const lid = new THREE.Mesh(new THREE.PlaneGeometry(w - .012, d - .012), topMat);
  lid.rotation.x = -Math.PI / 2; lid.position.y = h + .0062;
  g.add(lid);

  // glossy front strip
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w - .01, h - .01), new THREE.MeshPhysicalMaterial({ color: 0x070708, roughness: .12, clearcoat: 1 }));
  front.position.set(0, h / 2 + .006, d / 2 + .0006);
  g.add(front);

  // tray (slides out along +z)
  const tray = new THREE.Group();
  const trayFace = new THREE.Mesh(new THREE.BoxGeometry(.15, .012, .004), new THREE.MeshPhysicalMaterial({ color: 0x0a0a0b, roughness: .2, clearcoat: 1 }));
  trayFace.position.z = 0;
  const trayBody = new THREE.Mesh(new THREE.BoxGeometry(.148, .006, .17), new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: .6 }));
  trayBody.position.set(0, -.002, -.087);
  const well = new THREE.Mesh(new THREE.CylinderGeometry(.062, .062, .002, 48), new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: .8 }));
  well.position.set(0, .0012, -.085);
  tray.add(trayFace, trayBody, well);
  tray.position.set(trayX, h * .62 + .006, d / 2 + .002);
  tray.userData.closedZ = tray.position.z;
  g.add(tray);

  // little display + buttons
  const dispCanvas = document.createElement("canvas"); dispCanvas.width = 320; dispCanvas.height = 64;
  const dispTex = new THREE.CanvasTexture(dispCanvas); dispTex.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(.075, .015), new THREE.MeshBasicMaterial({ map: dispTex, toneMapped: false }));
  disp.position.set(.06, h / 2 + .006, d / 2 + .0012);
  g.add(disp);

  const brand = new THREE.Mesh(new THREE.PlaneGeometry(.07, .0066), new THREE.MeshStandardMaterial({ map: T.brandTexture("SHERINVISION", "#8d8d93"), transparent: true }));
  brand.position.set(trayX, .016, d / 2 + .0012);
  g.add(brand);

  const buttons = {};
  const btnMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2a2d, roughness: .3, clearcoat: .8 });
  [["eject", .15], ["play", .175]].forEach(([id, x]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.0055, .0055, .004, 24), btnMat);
    b.rotation.x = Math.PI / 2;
    b.position.set(x, h / 2 + .006, d / 2 + .002);
    b.userData = { button: id, rest: b.position.z };
    g.add(b);
    buttons[id] = b;
  });
  const glyphs = new THREE.Mesh(new THREE.PlaneGeometry(.06, .012), new THREE.MeshBasicMaterial({ map: glyphTexture(), transparent: true }));
  glyphs.position.set(.1625, h / 2 + .006 - .0125, d / 2 + .0012);
  g.add(glyphs);

  const led = new THREE.Mesh(new THREE.CircleGeometry(.0014, 12), new THREE.MeshBasicMaterial({ color: 0x5aa0ff, toneMapped: false }));
  led.position.set(-w / 2 + .015, h / 2 + .006, d / 2 + .0012);
  g.add(led);

  shadowy(g);
  return { group: g, tray, display: { canvas: dispCanvas, tex: dispTex }, buttons, led };
}

function glyphTexture() {
  return T.canvasTexture(256, 52, (g, w, h) => {
    g.fillStyle = "#77777d"; g.font = '500 22px "IBM Plex Mono", monospace'; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("⏏", 64, h / 2); g.fillText("▶", 170, h / 2);
  });
}

/* ---------------- cases + discs ---------------- */

export function buildDisc(d) {
  const label = new THREE.MeshStandardMaterial({ map: T.discLabelTexture(d), transparent: true, alphaTest: .05, roughness: .45 });
  const shiny = new THREE.MeshPhysicalMaterial({ color: 0xd9dde4, metalness: 1, roughness: .12, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [200, 900] });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(DISC_R, DISC_R, .0012, 64, 1, false), [shiny, label, shiny]);
  disc.castShadow = true;
  const g = new THREE.Group();
  g.add(disc);
  return g;
}

export function buildCase(d) {
  const { w, h, d: depth } = CASE;
  const g = new THREE.Group();          // origin: bottom centre of the case, back face at z = 0
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0x1b4fa8, roughness: .28, clearcoat: .8, clearcoatRoughness: .2 });
  const inner = new THREE.MeshStandardMaterial({ color: 0x163f86, roughness: .5 });

  const back = new THREE.Mesh(new RoundedBoxGeometry(w, h, depth / 2, 2, .0025), plastic);
  back.position.set(0, h / 2, depth / 4);
  g.add(back);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.012, .014, .004, 24), inner);
  hub.rotation.x = Math.PI / 2; hub.position.set(0, h / 2, depth / 2 + .001);
  g.add(hub);

  // lid hinges on the left edge and swings towards you
  const hinge = new THREE.Group();
  hinge.position.set(-w / 2, 0, depth / 2);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(w, h, depth / 2, 2, .0025), plastic);
  lid.position.set(w / 2, h / 2, depth / 4);
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(w - .006, h - .006), new THREE.MeshPhysicalMaterial({ map: T.coverTexture(d), roughness: .35, clearcoat: .9, clearcoatRoughness: .1 }));
  cover.position.set(w / 2, h / 2, depth / 2 + .0004);
  const spine = new THREE.Mesh(new THREE.PlaneGeometry(depth, h - .004), new THREE.MeshStandardMaterial({ map: T.spineTexture(d), roughness: .4 }));
  spine.rotation.y = -Math.PI / 2; spine.position.set(-w / 2 - .0004, h / 2, depth / 2);
  hinge.add(lid, cover);
  g.add(hinge, spine);

  const disc = buildDisc(d);
  disc.rotation.x = Math.PI / 2;               // stands up in the case, label facing out
  disc.position.set(0, h / 2, depth / 2 + .0012);
  g.add(disc);

  shadowy(g);
  [back, lid, cover].forEach((m) => (m.userData.case = d.id));
  return { group: g, hinge, disc, pickables: [back, lid, cover] };
}

