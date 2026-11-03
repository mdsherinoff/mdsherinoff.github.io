// Small synthesised VCR noises. No audio files.
let ctx = null;
let on = true;
try { on = localStorage.getItem("sound") !== "off"; } catch {}

export const sound = {
  get on() { return on; },
  toggle() {
    on = !on;
    try { localStorage.setItem("sound", on ? "on" : "off"); } catch {}
    return on;
  },
  clunk() { noise(.09, { freq: 700, gain: .5 }); setTimeout(() => noise(.05, { freq: 2200, gain: .15 }), 70); },
  click() { noise(.025, { freq: 3000, type: "highpass", gain: .2 }); },
  hiss(d) { noise(d, { freq: 4000, type: "bandpass", q: .4, gain: .05, attack: .03 }); },
  slide() { noise(.25, { freq: 1400, type: "bandpass", q: .8, gain: .06, attack: .08 }); },
  tap() { noise(.04, { freq: 500, gain: .25 }); },
  motor,
  spin() {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(); o.type = "triangle";
    const g = a.createGain(); const t = a.currentTime;
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(780, t + 1.1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.025, t + .2); g.gain.linearRampToValueAtTime(0, t + 1.2);
    o.connect(g).connect(a.destination); o.start(); o.stop(t + 1.25);
  },
};

function audio() {
  if (!on) return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function noise(dur, { freq = 1200, q = .7, type = "lowpass", gain = .3, attack = .005 } = {}) {
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
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

function motor(dur = .6) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(); o.type = "sawtooth";
  const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 300;
  const g = a.createGain();
  const t = a.currentTime;
  o.frequency.setValueAtTime(55, t);
  o.frequency.linearRampToValueAtTime(80, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(.05, t + .05);
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(f).connect(g).connect(a.destination);
  o.start(); o.stop(t + dur);
}
