// Gera os efeitos sonoros (WAV) do app. Rode: node scripts/generate-sounds.js
const fs = require('fs');
const path = require('path');
const SR = 22050;
const out = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(out, { recursive: true });

function wav(name, samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767 * 0.8, i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(out, name + '.wav'), Buffer.concat([h, data]));
}
const osc = { sine: (p) => Math.sin(2 * Math.PI * p), square: (p) => (p % 1 < 0.5 ? 1 : -1) * 0.6, tri: (p) => 4 * Math.abs((p % 1) - 0.5) - 1, saw: (p) => 2 * (p % 1) - 1 };
// notes: [freq, dur, wave?, vol?]  freq 0 = silêncio
function seq(notes, gap = 0) {
  const res = [];
  for (const [f, d, w = 'sine', v = 1] of notes) {
    const n = Math.floor(SR * d);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const env = Math.min(1, i / 120) * Math.pow(1 - i / n, 1.4);
      res.push(f ? osc[w](f * t) * env * v : 0);
    }
    for (let i = 0; i < Math.floor(SR * gap); i++) res.push(0);
  }
  return res;
}
const N = { C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, C6: 1047, E6: 1319, G4: 392, C4: 262, E4: 330 };

wav('coin', seq([[988, 0.07, 'square', 0.6], [1319, 0.28, 'square', 0.6]]));
wav('xp', seq([[N.C5, 0.06, 'tri'], [N.E5, 0.06, 'tri'], [N.G5, 0.06, 'tri'], [N.C6, 0.16, 'tri']]));
wav('levelup', seq([[N.C5, 0.12, 'square', 0.5], [N.E5, 0.12, 'square', 0.5], [N.G5, 0.12, 'square', 0.5], [N.C6, 0.12, 'square', 0.5], [0, 0.05], [N.G5, 0.1, 'square', 0.5], [N.C6, 0.1, 'square', 0.5], [N.E6, 0.5, 'square', 0.55]]));
wav('chest', seq([[200, 0.1, 'saw', 0.5], [260, 0.1, 'saw', 0.5], [330, 0.1, 'saw', 0.5], [0, 0.08], [N.C6, 0.08, 'tri'], [N.E6, 0.08, 'tri'], [N.G5 * 2, 0.35, 'tri']]));
wav('beep', seq([[880, 0.18, 'sine']]));
wav('tick', seq([[1200, 0.04, 'square', 0.4]]));
wav('block', seq([[N.G5, 0.15, 'tri'], [0, 0.05], [N.G5, 0.15, 'tri'], [0, 0.05], [N.C6, 0.4, 'tri']]));
wav('success', seq([[N.C5, 0.1, 'tri'], [N.G5, 0.1, 'tri'], [N.C6, 0.3, 'tri']]));
wav('alarm_classic', seq([[880, 0.2, 'square', 0.5], [0, 0.1], [880, 0.2, 'square', 0.5], [0, 0.1], [880, 0.2, 'square', 0.5], [0, 0.4], [880, 0.2, 'square', 0.5], [0, 0.1], [880, 0.2, 'square', 0.5], [0, 0.1], [880, 0.4, 'square', 0.5]]));
wav('alarm_arcade', seq([[N.C5, 0.1, 'square', 0.5], [N.E5, 0.1, 'square', 0.5], [N.G5, 0.1, 'square', 0.5], [N.C6, 0.1, 'square', 0.5], [N.G5, 0.1, 'square', 0.5], [N.E5, 0.1, 'square', 0.5], [N.C5, 0.3, 'square', 0.5]]));
wav('alarm_horn', seq([[220, 0.8, 'saw', 0.55], [0, 0.15], [220, 0.8, 'saw', 0.55]]));
wav('alarm_zen', seq([[N.C5, 0.9, 'sine', 0.7], [N.G5, 1.2, 'sine', 0.7]]));

// música de fundo (loop ~16s): batida simples + baixo + arpejo
const bpm = 110, beat = 60 / bpm, bars = 8, total = Math.floor(SR * beat * 4 * bars * 0.5);
const music = new Array(total).fill(0);
const bass = [65.4, 65.4, 87.3, 98];
const arp = [262, 330, 392, 330, 262, 330, 392, 523];
for (let i = 0; i < total; i++) {
  const t = i / SR, b = t / (beat / 2), step = Math.floor(b), ph = b - step;
  const bar = Math.floor(step / 8) % 4;
  let s = 0;
  s += osc.tri(bass[bar] * t) * 0.25 * (1 - ph * 0.5);
  s += osc.square(arp[step % 8] * t) * 0.07 * Math.pow(1 - ph, 2);
  if (step % 4 === 0) s += Math.sin(2 * Math.PI * (120 - 80 * ph) * t) * 0.5 * Math.pow(1 - ph, 2);
  if (step % 4 === 2) s += (Math.random() * 2 - 1) * 0.12 * Math.pow(1 - ph, 3);
  music[i] = s * 0.6;
}
wav('music', music);
console.log('Sons gerados em', out);
