// Every surface in the store is painted onto a <canvas> here, so the site
// ships no image files. Cover art is original: homages to genres, not copies.
import * as THREE from "three";

export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvasTexture(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

export const FONT = {
  marker: '"Permanent Marker", "Comic Sans MS", cursive',
  hand: '"Gochi Hand", "Comic Sans MS", cursive',
  mono: '"IBM Plex Mono", Menlo, monospace',
  sans: '"IBM Plex Sans", system-ui, sans-serif',
  futura: '"Jost", "Futura", sans-serif',
  wide: '"Syncopate", "Eurostile", sans-serif',
  serif: '"Instrument Serif", Georgia, serif',
  anton: '"Anton", Impact, sans-serif',
};
const MONO = FONT.mono, SANS = FONT.sans;

function speckle(g, w, h, r, n, rgb, maxA, size = 2) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(${rgb},${r() * maxA})`;
    g.fillRect(r() * w, r() * h, 1 + r() * size, 1 + r() * size);
  }
}

function fitText(g, text, maxW, size, family, weight = "") {
  let s = size;
  do { g.font = `${weight} ${s}px ${family}`; s -= 1; } while (g.measureText(text).width > maxW && s > 6);
  return s + 1;
}

function spaced(g, text, x, y, spacing, align = "center") {
  g.letterSpacing = spacing + "px";
  g.textAlign = align;
  g.fillText(text, x + (align === "center" ? spacing / 2 : 0), y);
  g.letterSpacing = "0px";
  g.textAlign = "left";
}

/* ---------------- store surfaces ---------------- */

export function woodTexture() {
  return canvasTexture(2048, 512, (g, w, h) => {
    const r = rng(7);
    const base = g.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, "#74492a"); base.addColorStop(.5, "#6a4126"); base.addColorStop(1, "#5e3920");
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) {
      g.fillStyle = r() < .5 ? `rgba(40,18,6,${.05 + r() * .1})` : `rgba(160,104,60,${.04 + r() * .08})`;
      g.fillRect(0, r() * h, w, 6 + r() * 50);
    }
    for (let i = 0; i < 520; i++) {
      const y = r() * h, amp = 1 + r() * 9, f = .0015 + r() * .005, ph = r() * 6;
      g.beginPath();
      for (let x = 0; x <= w; x += 12) {
        const yy = y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.7 + ph * 2) * amp * .25;
        x ? g.lineTo(x, yy) : g.moveTo(x, yy);
      }
      g.strokeStyle = `rgba(28,12,4,${.06 + r() * .22})`;
      g.lineWidth = .5 + r() * 1.6;
      g.stroke();
    }
    // a couple of knots
    for (let k = 0; k < 3; k++) {
      const cx = r() * w, cy = r() * h;
      for (let i = 0; i < 14; i++) {
        g.beginPath(); g.ellipse(cx, cy, 6 + i * 7, 2 + i * 2.2, 0, 0, Math.PI * 2);
        g.strokeStyle = `rgba(30,12,4,${.25 - i * .015})`; g.lineWidth = 1.2; g.stroke();
      }
    }
    for (let i = 0; i < 14000; i++) { g.fillStyle = `rgba(20,8,2,${r() * .22})`; g.fillRect(r() * w, r() * h, 2 + r() * 7, 1); }
  });
}


// 90s cinema carpet: confetti and squiggles on navy
export function carpetTexture() {
  return canvasTexture(1024, 1024, (g, w, h) => {
    const r = rng(42);
    g.fillStyle = "#1a1530"; g.fillRect(0, 0, w, h);
    const cols = ["#d94f7a", "#2bb3a8", "#f2b33d", "#6b5bd6", "#e8e2d0"];
    for (let i = 0; i < 520; i++) {
      g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 6.28);
      g.strokeStyle = g.fillStyle = cols[Math.floor(r() * cols.length)];
      g.globalAlpha = .55 + r() * .3;
      const k = r();
      if (k < .35) { g.lineWidth = 5; g.beginPath(); g.moveTo(-18, 0); g.bezierCurveTo(-6, -14, 6, 14, 18, 0); g.stroke(); }
      else if (k < .6) { g.beginPath(); g.moveTo(0, -9); g.lineTo(9, 7); g.lineTo(-9, 7); g.fill(); }
      else if (k < .8) { g.beginPath(); g.arc(0, 0, 4 + r() * 4, 0, 6.28); g.fill(); }
      else { g.fillRect(-10, -2.5, 20, 5); }
      g.restore();
    }
    g.globalAlpha = 1;
    speckle(g, w, h, r, 60000, "0,0,0", .35, 2);
    speckle(g, w, h, r, 12000, "255,255,255", .05, 2);
  }, { repeat: [6, 6] });
}

export function ceilingTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = rng(8);
    g.fillStyle = "#cfcabd"; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 30000, "90,80,60", .25, 2);
    g.fillStyle = "#8d887c"; g.fillRect(0, 0, w, 6); g.fillRect(0, 0, 6, h);
  }, { repeat: [10, 6] });
}

export function wallTexture() {
  return canvasTexture(1024, 1024, (g, w, h) => {
    const r = rng(3);
    g.fillStyle = "#2b3d4f"; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 50000, "0,0,0", .12, 2);
    speckle(g, w, h, r, 20000, "255,255,255", .035, 2);
    for (let i = 0; i < 14; i++) {
      const x = r() * w, y = r() * h;
      const gr = g.createRadialGradient(x, y, 0, x, y, 100 + r() * 240);
      gr.addColorStop(0, `rgba(0,0,0,${r() * .1})`); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  }, { repeat: [4, 2] });
}

export function laminateTexture(base = "#7b1e2b", stripe = "#f2b33d") {
  return canvasTexture(512, 256, (g, w, h) => {
    const r = rng(5);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = stripe; g.fillRect(0, h * .18, w, 10);
    g.fillStyle = "#e8e2d0"; g.fillRect(0, h * .18 + 16, w, 4);
    speckle(g, w, h, r, 8000, "0,0,0", .15, 2);
  });
}

export function pegboardTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = rng(12);
    g.fillStyle = "#3a2a20"; g.fillRect(0, 0, w, h);
    speckle(g, w, h, r, 9000, "0,0,0", .2, 3);
    g.fillStyle = "#120c08";
    for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) { g.beginPath(); g.arc(x, y, 3.5, 0, 6.28); g.fill(); }
  }, { repeat: [3, 6] });
}

/* ---------------- neon + signs ---------------- */

// glowing tube text on a transparent canvas; the bloom pass does the rest
export function neonTexture(text, color, { font = FONT.marker, size = 150, w = 1400, h = 300, flicker = false } = {}) {
  return canvasTexture(w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.font = `${size}px ${font}`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.lineJoin = "round";
    g.shadowColor = color;
    for (const [blur, a] of [[40, .55], [18, .8]]) { g.shadowBlur = blur; g.globalAlpha = a; g.fillStyle = color; g.fillText(text, w / 2, h / 2); }
    g.globalAlpha = 1; g.shadowBlur = 6;
    g.fillStyle = "#fff8f0"; g.fillText(text, w / 2, h / 2);
    if (flicker) { g.globalCompositeOperation = "destination-out"; g.fillRect(w * .62, 0, w * .06, h); }
  });
}

export function genreSignTexture(text, bg, fg = "#f4efe2") {
  return canvasTexture(768, 192, (g, w, h) => {
    const r = rng(text.length * 7);
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = fg; g.textBaseline = "middle";
    g.font = `700 92px ${FONT.futura}`;
    spaced(g, text, w / 2, h / 2 + 4, 14);
    speckle(g, w, h, r, 5000, "0,0,0", .15, 2);
  });
}

// handwritten index card under each staff pick
export function shelfTalkerTexture(lines, { star = true, tilt = 0 } = {}) {
  return canvasTexture(512, 300, (g, w, h) => {
    const r = rng(lines[0].length * 13);
    g.fillStyle = "#f6f1e3"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(210,70,70,.55)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 58); g.lineTo(w, 58); g.stroke();
    g.strokeStyle = "rgba(90,130,200,.3)"; g.lineWidth = 2;
    for (let y = 100; y < h; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = "#c33"; g.font = `600 30px ${FONT.futura}`; g.letterSpacing = "6px";
    g.fillText("STAFF PICK", 24, 42); g.letterSpacing = "0px";
    if (star) { g.fillStyle = "#e8a317"; g.font = `34px ${SANS}`; g.fillText("★★★★★", w - 200, 44); }
    g.save(); g.translate(28, 0); g.rotate(tilt);
    g.fillStyle = "#1c2a6b";
    lines.forEach((l, i) => { fitText(g, l, w - 60, 46, FONT.hand); g.fillText(l, 0, 136 + i * 46); });
    g.restore();
    speckle(g, w, h, r, 3000, "120,100,60", .1, 2);
  });
}

export function headerCardTexture() {
  return canvasTexture(1200, 520, (g, w, h) => {
    const r = rng(77);
    g.fillStyle = "#f2b33d"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#c2272d"; g.fillRect(0, 0, w, 150);
    g.fillStyle = "#fff6e0"; g.font = `700 112px ${FONT.futura}`; g.textBaseline = "middle";
    spaced(g, "STAFF PICKS", w / 2, 80, 22);
    g.fillStyle = "#1b1b1b"; g.font = `500 40px ${FONT.futura}`;
    spaced(g, "THIS WEEK'S SHELF, CHOSEN BY", w / 2, 210, 6);
    g.fillStyle = "#1c2a6b";
    fitText(g, "Mohammed Sherin Valiyakath", w - 120, 104, FONT.hand);
    g.textAlign = "center"; g.fillText("Mohammed Sherin Valiyakath", w / 2, 315); g.textAlign = "left";
    g.fillStyle = "#3a2a10"; g.font = `500 34px ${FONT.mono}`;
    g.textAlign = "center"; g.fillText("CS @ Qatar University · Doha", w / 2, 405);
    g.fillStyle = "#c2272d"; g.font = `42px ${FONT.hand}`;
    g.fillText("take one to the counter, it plays on the TV →", w / 2, 470); g.textAlign = "left";
    speckle(g, w, h, r, 9000, "0,0,0", .1, 2);
  });
}

export function employeeTexture() {
  return canvasTexture(600, 760, (g, w, h) => {
    const r = rng(31);
    g.fillStyle = "#efe6cf"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#b08a3a"; g.lineWidth = 10; g.strokeRect(24, 24, w - 48, h - 48);
    g.lineWidth = 2; g.strokeRect(40, 40, w - 80, h - 80);
    g.fillStyle = "#7a1f2b"; g.font = `600 34px ${FONT.futura}`; g.textBaseline = "middle";
    spaced(g, "EMPLOYEE", w / 2, 100, 10); spaced(g, "OF THE MONTH", w / 2, 144, 10);
    // portrait placeholder: a bust silhouette on a studio backdrop
    const gr = g.createRadialGradient(w / 2, 330, 20, w / 2, 330, 190);
    gr.addColorStop(0, "#7d93b8"); gr.addColorStop(1, "#33405e");
    g.fillStyle = gr; g.fillRect(140, 190, 320, 300);
    g.fillStyle = "#1d2236";
    g.beginPath(); g.arc(w / 2, 300, 62, 0, 6.28); g.fill();
    g.beginPath(); g.ellipse(w / 2, 490, 130, 110, 0, Math.PI, 0); g.fill();
    g.fillStyle = "#1d1b18"; g.font = `52px ${FONT.hand}`; g.textAlign = "center";
    g.fillText("Mohammed Sherin", w / 2, 560); g.fillText("Valiyakath", w / 2, 612);
    g.font = `500 22px ${FONT.mono}`; g.fillStyle = "#5c5547";
    g.fillText("NOVEMBER 2026 · AISLE 3", w / 2, 672);
    g.textAlign = "left";
    speckle(g, w, h, r, 8000, "120,100,60", .1, 2);
  });
}

export function posterTexture() {
  return canvasTexture(700, 1000, (g, w, h) => {
    const r = rng(14);
    // Villeneuve-ish one-sheet: haze, a giant ring, a very small person
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#d6c7ad"); bg.addColorStop(.6, "#b89a74"); bg.addColorStop(1, "#5d4630");
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(40,28,18,.85)"; g.lineWidth = 34;
    g.beginPath(); g.arc(w / 2, 470, 210, 0, 6.28); g.stroke();
    g.fillStyle = "rgba(60,42,26,.9)";
    g.beginPath(); g.moveTo(0, 760); g.bezierCurveTo(200, 700, 420, 790, w, 720); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = "#1c140c"; g.fillRect(w / 2 - 3, 728, 6, 20); g.beginPath(); g.arc(w / 2, 724, 4, 0, 6.28); g.fill();
    g.fillStyle = "#231910"; g.font = `700 54px ${FONT.wide}`; g.textBaseline = "middle";
    spaced(g, "MDSHERINOFF", w / 2, 140, 16);
    g.font = `400 22px ${FONT.wide}`; spaced(g, "A FINAL-YEAR PRODUCTION", w / 2, 190, 8);
    g.fillStyle = "#efe4cf"; g.font = `400 24px ${FONT.wide}`; spaced(g, "IN THEATERS MAY 2027", w / 2, 900, 8);
    speckle(g, w, h, r, 24000, "0,0,0", .12, 2);
  });
}

export function pennantTexture() {
  return canvasTexture(1024, 400, (g, w, h) => {
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h / 2); g.lineTo(0, h); g.closePath(); g.clip();
    for (let x = 0; x < w; x += 72) { g.fillStyle = (x / 72) % 2 ? "#1f3f86" : "#8c1d3f"; g.fillRect(x, 0, 72, h); }
    g.fillStyle = "#5e1726"; g.fillRect(0, 0, 110, h);
    g.save(); g.translate(170, h / 2 + 22); g.rotate(.05);
    g.fillStyle = "#f3d34a"; g.font = `64px ${FONT.marker}`; g.fillText("visca barça", 0, 0); g.restore();
    const r = rng(2); speckle(g, w, h, r, 8000, "0,0,0", .2, 3);
  });
}

export function popcornTexture() {
  return canvasTexture(512, 256, (g, w, h) => {
    for (let x = 0; x < w; x += 64) { g.fillStyle = (x / 64) % 2 ? "#f4efe2" : "#c2272d"; g.fillRect(x, 0, 64, h); }
    g.fillStyle = "#f2b33d"; g.beginPath(); g.ellipse(w / 2, h / 2, 110, 60, 0, 0, 6.28); g.fill();
    g.fillStyle = "#c2272d"; g.font = `700 64px ${FONT.futura}`; g.textBaseline = "middle"; spaced(g, "POP", w / 2, h / 2 + 4, 8);
  });
}

/* ---------------- staff-pick covers ---------------- */

function laurel(g, cx, cy, s, color) {
  g.save(); g.translate(cx, cy); g.fillStyle = g.strokeStyle = color; g.lineWidth = 2.2 * s;
  for (const side of [-1, 1]) {
    g.beginPath(); g.arc(0, 0, 46 * s, Math.PI / 2 + side * .2, Math.PI / 2 + side * 1.9, side < 0); g.stroke();
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + side * (.45 + i * .22);
      g.save(); g.translate(Math.cos(a) * 46 * s, Math.sin(a) * 46 * s); g.rotate(a + side * 1.1);
      g.beginPath(); g.ellipse(0, 0, 9 * s, 3.6 * s, 0, 0, 6.28); g.fill(); g.restore();
    }
  }
  g.restore();
}

function figure(g, x, y, s, color) {
  g.fillStyle = color;
  g.beginPath(); g.arc(x, y - 15 * s, 3.2 * s, 0, 6.28); g.fill();
  g.fillRect(x - 2.4 * s, y - 12 * s, 4.8 * s, 12 * s);
}

// the art for one staff pick; also reused, cropped, on the disc label
export function coverArt(g, d, x, y, w, h) {
  const r = rng(d.no * 97);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y);
  const cx = w / 2;
  switch (d.style) {
    case "hotel": { // pastel, dead-centre symmetry
      g.fillStyle = "#f4d9c6"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#e9a3a6"; g.fillRect(cx - w * .36, h * .36, w * .72, h * .44);
      g.fillStyle = "#d77f86"; g.beginPath(); g.moveTo(cx - w * .4, h * .36); g.lineTo(cx, h * .24); g.lineTo(cx + w * .4, h * .36); g.fill();
      g.fillStyle = "#7a2e3b"; g.fillRect(cx - w * .12, h * .265, w * .24, h * .035);
      g.fillStyle = "#f4d9c6"; g.font = `600 ${h * .02}px ${FONT.futura}`; g.textBaseline = "middle";
      spaced(g, "THE ABOUT", cx, h * .283, 3);
      g.fillStyle = "#fbe8d2";
      for (let rr = 0; rr < 4; rr++) for (let c = 0; c < 7; c++) g.fillRect(cx - w * .32 + c * w * .093, h * .4 + rr * h * .085, w * .05, h * .055);
      g.fillStyle = "#7a2e3b"; g.fillRect(cx - w * .05, h * .7, w * .1, h * .1);
      g.fillStyle = "#b9d3c2"; g.fillRect(0, h * .8, w, h * .2);
      g.fillStyle = "#7a2e3b"; g.font = `700 ${h * .095}px ${FONT.futura}`;
      spaced(g, "ABOUT ME", cx, h * .135, h * .012);
      g.font = `500 ${h * .024}px ${FONT.futura}`; spaced(g, "A FILM IN SEVERAL CHAPTERS", cx, h * .19, 5);
      break;
    }
    case "fold": { // a city folding over itself
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#0d1118"); bg.addColorStop(1, "#273242");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const sky = (yy, flip) => {
        for (let i = 0; i < 26; i++) {
          const bw = w * (.02 + r() * .05), bh = h * (.06 + r() * .2), bx = r() * w;
          g.fillStyle = `rgba(${150 + r() * 40},${165 + r() * 40},${185 + r() * 30},${.25 + r() * .35})`;
          flip ? g.fillRect(bx, yy, bw, bh) : g.fillRect(bx, yy - bh, bw, bh);
        }
      };
      sky(h * .88, false); sky(h * .02, true);
      g.fillStyle = "rgba(220,230,240,.07)"; g.fillRect(0, h * .5, w, 2);
      figure(g, cx, h * .88, h / 360, "#e9eef4");
      g.fillStyle = "#eef2f6"; g.font = `700 ${h * .07}px ${FONT.wide}`; g.textBaseline = "middle";
      spaced(g, "WORK", cx, h * .48, h * .03);
      g.font = `400 ${h * .02}px ${FONT.wide}`; spaced(g, "THREE JOBS. ONE CITY.", cx, h * .54, 6);
      break;
    }
    case "dune": { // haze, monolith, tiny figure
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#f0b26a"); bg.addColorStop(.55, "#d66f2e"); bg.addColorStop(1, "#5a2410");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(255,236,200,.55)"; g.beginPath(); g.arc(cx, h * .42, w * .26, 0, 6.28); g.fill();
      g.fillStyle = "#2c1209"; g.fillRect(cx - w * .045, h * .36, w * .09, h * .38);
      g.fillStyle = "#6e2c12"; g.beginPath(); g.moveTo(0, h * .74); g.bezierCurveTo(w * .3, h * .66, w * .6, h * .8, w, h * .7); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = "#3e170a"; g.beginPath(); g.moveTo(0, h * .84); g.bezierCurveTo(w * .4, h * .78, w * .7, h * .9, w, h * .82); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      figure(g, cx + w * .16, h * .755, h / 400, "#1b0a04");
      g.fillStyle = "#2c1209"; g.font = `700 ${h * .062}px ${FONT.wide}`; g.textBaseline = "middle";
      spaced(g, "PROJECTS", cx, h * .12, h * .022);
      g.font = `400 ${h * .02}px ${FONT.wide}`; spaced(g, "BUILT. SHIPPED. MOSTLY WORKING.", cx, h * .175, 4);
      break;
    }
    case "laurels": { // quiet indie: soft window light, serif, festival laurels
      const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, "#5f7464"); bg.addColorStop(1, "#2c3a33");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(255,240,210,.14)";
      g.beginPath(); g.moveTo(w * .55, 0); g.lineTo(w * .95, 0); g.lineTo(w * .7, h); g.lineTo(w * .2, h); g.fill();
      speckle(g, w, h, r, 4000, "255,255,255", .05, 3);
      g.fillStyle = "#f3eadb"; g.font = `italic 400 ${h * .12}px ${FONT.serif}`; g.textBaseline = "middle"; g.textAlign = "center";
      g.fillText("Education", cx, h * .5);
      g.font = `400 ${h * .026}px ${FONT.serif}`; g.fillText("a film by Mohammed Sherin Valiyakath", cx, h * .58);
      laurel(g, cx, h * .2, h / 520, "#efe2c0");
      g.font = `600 ${h * .016}px ${FONT.futura}`; g.fillStyle = "#efe2c0";
      g.fillText("OFFICIAL SELECTION", cx, h * .19); g.fillText("QATAR UNIVERSITY", cx, h * .215); g.fillText("2023 — 2027", cx, h * .24);
      g.textAlign = "left";
      break;
    }
    case "quote": { // black one-sheet carried by a pull quote
      g.fillStyle = "#0e0e0f"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#f0c419"; g.font = `${h * .045}px ${SANS}`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("★★★★★", cx, h * .3);
      g.fillStyle = "#f4f1ea"; g.font = `italic 400 ${h * .07}px ${FONT.serif}`;
      g.fillText("“I watched it", cx, h * .42); g.fillText("four times.”", cx, h * .5);
      g.font = `400 ${h * .026}px ${FONT.serif}`; g.fillStyle = "#a9a59b"; g.fillText("— my mum", cx, h * .57);
      g.fillStyle = "#f4f1ea"; g.font = `600 ${h * .045}px ${FONT.futura}`;
      spaced(g, "BONUS FEATURES", cx, h * .78, 6);
      g.font = `400 ${h * .02}px ${FONT.futura}`; g.fillStyle = "#a9a59b"; spaced(g, "DELETED SCENES · EXTRAS · BLOOPERS", cx, h * .825, 3);
      break;
    }
    case "ink": { // fog, a ring of ink
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#d9dcdc"); bg.addColorStop(1, "#9aa1a3");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.save(); g.translate(cx, h * .46);
      g.strokeStyle = "rgba(15,15,16,.9)";
      for (let i = 0; i < 90; i++) {
        const a = (i / 90) * 6.28, rad = w * .27 + Math.sin(a * 5) * 4;
        g.lineWidth = 6 + r() * 10; g.beginPath(); g.arc(0, 0, rad, a, a + .09); g.stroke();
        if (r() < .12) { g.lineWidth = 3; g.beginPath(); g.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); g.lineTo(Math.cos(a) * (rad + 18 + r() * 26), Math.sin(a) * (rad + 18 + r() * 26)); g.stroke(); }
      }
      g.restore();
      g.fillStyle = "#151617"; g.font = `700 ${h * .06}px ${FONT.wide}`; g.textBaseline = "middle";
      spaced(g, "CONTACT", cx, h * .82, h * .02);
      g.font = `400 ${h * .018}px ${FONT.wide}`; spaced(g, "SAY HELLO. I'LL ANSWER.", cx, h * .87, 4);
      break;
    }
  }
  g.restore();
}

export function coverTexture(d) {
  return canvasTexture(645, 740, (g, w, h) => {
    const r = rng(d.no * 13);
    const band = g.createLinearGradient(0, 0, 0, 50);
    band.addColorStop(0, "#2b74e0"); band.addColorStop(1, "#1d5fc4");
    g.fillStyle = band; g.fillRect(0, 0, w, 50);
    g.fillStyle = "#fff"; g.font = `600 22px ${SANS}`; g.textBaseline = "middle";
    g.letterSpacing = "6px"; g.fillText("BLU-RAY DISC", 22, 27); g.letterSpacing = "0px";
    coverArt(g, d, 0, 50, w, h - 50);
    // billing block, squashed like the real thing
    g.save(); g.translate(w / 2, h - 46); g.scale(.6, 1);
    g.textAlign = "center"; g.font = `500 19px ${FONT.futura}`;
    g.fillStyle = d.ink || "rgba(255,255,255,.7)";
    g.fillText(`SHERINVISION PICTURES PRESENTS · MOHAMMED SHERIN VALIYAKATH · "${d.title}"`, 0, 0);
    g.fillText("WRITTEN, DIRECTED & DEBUGGED BY M. S. VALIYAKATH · FILMED ON LOCATION IN DOHA", 0, 22);
    g.restore();
    // rental store sticker
    g.save(); g.translate(w - 92, h - 132); g.rotate(-.12);
    g.fillStyle = "#f2b33d"; g.beginPath(); g.arc(0, 0, 52, 0, 6.28); g.fill();
    g.fillStyle = "#7a1f2b"; g.font = `700 20px ${FONT.futura}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("RENTAL", 0, -12); g.font = `600 15px ${FONT.futura}`; g.fillText("3 NIGHTS", 0, 10); g.fillText(`№ ${String(d.no).padStart(3, "0")}`, 0, 28);
    g.restore();
    speckle(g, w, h, r, 6000, "0,0,0", .06, 2);
  });
}

export function discLabelTexture(d) {
  return canvasTexture(512, 512, (g, w, h) => {
    const c = w / 2;
    g.save();
    g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.clip();
    coverArt(g, d, -60, -40, w + 120, h + 200);
    g.restore();
    g.globalCompositeOperation = "destination-out";
    g.beginPath(); g.arc(c, c, c * .3, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = "source-over";
    g.beginPath(); g.arc(c, c, c * .3, 0, Math.PI * 2); g.arc(c, c, c * .14, 0, Math.PI * 2, true);
    g.fillStyle = "rgba(220,225,235,.55)"; g.fill("evenodd");
  });
}

export function spineTexture(d) {
  return canvasTexture(64, 740, (g, w, h) => {
    g.fillStyle = "#1d5fc4"; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2 + 8, 70); g.rotate(Math.PI / 2);
    g.fillStyle = "#fff"; g.font = `600 26px ${FONT.futura}`; g.fillText(d.title, 0, 0); g.restore();
  });
}

/* ---------------- the rest of the stock (background shelves) ---------------- */

const FAKE_TITLES = [
  "THE QUIET ORBIT", "PALE HARBOUR", "SALT & SIGNAL", "HOTEL MIRADOR", "SEVEN SUMMERS", "LOW TIDE",
  "THE CARTOGRAPHER", "DRIFT", "MOTH SEASON", "NIGHT FERRY", "PARALLAX", "GLASS DESERT", "SOFT REBOOT",
  "MONSOON LETTERS", "KAYAL", "MAZHA", "BLUE HOUR", "ZERO-G CLUB", "FATHOMS", "THE LONG HALLWAY",
  "PINK MOTEL", "OCEAN DUST", "WEEKEND IN LISBON", "INERTIA", "THE GREENHOUSE", "CORRIDOR 9", "ANTENNA",
  "THE TIDE CLOCK", "PAPER MOONS", "HALF-LIFE OF JUNE", "SUBURBAN SAINTS", "ECHO VALLEY", "MERIDIAN",
  "THE LIGHTHOUSE KEEPER'S SON", "STATIC", "COLD OPEN", "AFTERIMAGE", "KITE SEASON", "THE LAST REEL",
];
const PALETTES = [
  ["#0f1620", "#d9e2ec"], ["#e8b04a", "#2a1a0e"], ["#c4472d", "#f7efe2"], ["#2c6a5c", "#f1ecdf"],
  ["#f2d0c8", "#6b2333"], ["#151515", "#f0c419"], ["#d9dcdc", "#151617"], ["#283a6b", "#f4d9c6"],
  ["#5a2410", "#f0b26a"], ["#a7c4bc", "#21332d"], ["#3b2f4a", "#f6c6d6"], ["#ece4d4", "#23324a"],
];
const SMALL_FONTS = [FONT.wide, FONT.futura, FONT.serif, FONT.anton];

function fillerCover(g, x, y, w, h, r) {
  const [bg, fg] = PALETTES[Math.floor(r() * PALETTES.length)];
  const title = FAKE_TITLES[Math.floor(r() * FAKE_TITLES.length)];
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.translate(x, y);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = "#1d5fc4"; g.fillRect(0, 0, w, h * .07);
  g.globalAlpha = .55; g.fillStyle = fg;
  const k = r();
  if (k < .3) { g.beginPath(); g.arc(w / 2, h * (.4 + r() * .2), w * (.15 + r() * .2), 0, 6.28); g.fill(); }
  else if (k < .5) { g.fillRect(w * .44, h * .3, w * .12, h * .45); }
  else if (k < .7) { g.beginPath(); g.moveTo(0, h * .75); g.bezierCurveTo(w * .3, h * .62, w * .6, h * .82, w, h * .7); g.lineTo(w, h); g.lineTo(0, h); g.fill(); }
  else if (k < .85) { for (let i = 0; i < 5; i++) g.fillRect(0, h * (.3 + i * .1), w * (.3 + r() * .7), h * .035); }
  g.globalAlpha = 1;
  if (r() < .5) figure(g, w * (.3 + r() * .4), h * .76, h / 260, fg);
  g.fillStyle = fg; g.textBaseline = "middle";
  const fam = SMALL_FONTS[Math.floor(r() * SMALL_FONTS.length)];
  fitText(g, title, w * .86, h * .1, fam, fam === FONT.futura ? 700 : "");
  g.textAlign = "center"; g.fillText(title, w / 2, h * (r() < .5 ? .2 : .86)); g.textAlign = "left";
  if (r() < .35) { g.fillStyle = "#f2b33d"; g.beginPath(); g.arc(w * .8, h * .88, w * .1, 0, 6.28); g.fill(); }
  g.restore();
}

// one shelf row of face-out cases, drawn as a single texture
export function shelfRowTexture(seed, count = 7, { gap = 10 } = {}) {
  return canvasTexture(1024, 168, (g, w, h) => {
    const r = rng(seed);
    g.clearRect(0, 0, w, h);
    const cw = (w - gap * (count + 1)) / count;
    for (let i = 0; i < count; i++) {
      if (r() < .05) continue; // the odd gap where something's been rented
      const x = gap + i * (cw + gap) + (r() - .5) * 4;
      g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(x + 3, 6, cw, h - 6);
      fillerCover(g, x, 2, cw, h - 8, r);
      g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(x, 2, cw, 3);
    }
  });
}

/* ---------------- what the TV shows ---------------- */

// coming attractions, cycled while no disc is in
export const TRAILERS = [
  { kind: "green" },
  { pre: "THIS SUMMER", title: "COMPLYQATAR", post: "every licence. every permit. every deadline.", font: FONT.wide, bg: ["#0b0f16", "#1d2a3c"] },
  { pre: "FROM THE MIND THAT BROUGHT YOU OPENMINISTRY", title: "TELEFIN", post: "forward it. watch it.", font: FONT.wide, bg: ["#1a0d08", "#5a2410"] },
  { pre: "ONE MAN. ONE RAYCAST EXTENSION.", title: "Manglish Keyboard", post: "നമസ്കാരം", font: FONT.serif, italic: true, bg: ["#20302a", "#5f7464"] },
  { pre: "NOW SHOWING ON THE STAFF PICKS SHELF", title: "PICK A DISC", post: "and bring it to the counter", font: FONT.futura, weight: 700, bg: ["#3b1d26", "#7a2e3b"] },
];

export function trailerCard(g, w, h, t) {
  g.clearRect(0, 0, w, h);
  if (t.kind === "green") {
    g.fillStyle = "#1f6b3a"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#e9f2e6"; g.lineWidth = 4; g.strokeRect(w * .12, h * .14, w * .76, h * .72);
    g.fillStyle = "#e9f2e6"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `500 ${h * .045}px ${FONT.futura}`;
    g.fillText("THE FOLLOWING PREVIEW HAS BEEN APPROVED FOR", w / 2, h * .32);
    g.fillText("ALL PORTFOLIO VISITORS", w / 2, h * .39);
    g.font = `400 ${h * .032}px ${FONT.futura}`;
    g.fillText("BY THE SHERINVISION VIDEO STAFF", w / 2, h * .5);
    g.font = `500 ${h * .03}px ${FONT.mono}`;
    g.fillText("RECRUITERS WELCOME · NO LATE FEES", w / 2, h * .68);
    g.textAlign = "left";
    return;
  }
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, t.bg[0]); bg.addColorStop(1, t.bg[1]);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h * .12); g.fillRect(0, h * .88, w, h * .12);
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#f3efe6";
  g.font = `500 ${h * .03}px ${FONT.futura}`; spaced(g, t.pre, w / 2, h * .3, 6);
  fitText(g, t.title, w * .8, h * .13, t.font, `${t.italic ? "italic" : ""} ${t.weight || 400}`);
  g.letterSpacing = t.font === FONT.wide ? "12px" : "0px";
  g.textAlign = "center"; g.fillText(t.title, w / 2, h * .5); g.letterSpacing = "0px";
  g.font = `italic 400 ${h * .045}px ${FONT.serif}`; g.fillStyle = "rgba(243,239,230,.75)";
  g.textAlign = "center"; g.fillText(t.post, w / 2, h * .66);
  g.font = `500 ${h * .022}px ${FONT.mono}`; g.fillStyle = "rgba(243,239,230,.5)";
  g.fillText("COMING SOON TO A TV NEAR YOU", w / 2, h * .82);
  g.textAlign = "left";
}

export function identCard(g, w, h) {
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#e9e2d0"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `700 ${h * .09}px ${FONT.futura}`; spaced(g, "SHERINVISION", w / 2, h * .48, h * .03);
  g.font = `400 ${h * .032}px ${FONT.futura}`; spaced(g, "P I C T U R E S", w / 2, h * .58, 10);
  g.textAlign = "left";
}

/* ---------------- devices ---------------- */

export function brushedTexture() {
  return canvasTexture(1024, 512, (g, w, h) => {
    const r = rng(33);
    g.fillStyle = "#1b1b1d"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(255,255,255,${r() * .035})`;
      g.fillRect(0, r() * h, w, 1);
    }
  });
}

export function playerDisplay(g, w, h, text) {
  g.fillStyle = "#020304"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#cfe6ff"; g.font = `${h * .62}px ${MONO}`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = "#7fb8ff"; g.shadowBlur = 10;
  g.fillText(text, w / 2, h / 2 + 2);
  g.shadowBlur = 0;
}

export function brandTexture(text = "SHERINVISION", color = "#9a9aa0") {
  return canvasTexture(1024, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = color; g.font = `600 56px ${SANS}`;
    g.letterSpacing = "20px"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, w / 2 + 10, h / 2 + 2);
  });
}


