/**
 * Generates WAV audio files for the Mafia Night game sound system.
 * All sounds are synthesized programmatically — no external downloads needed.
 * Run: node generate-sounds.js
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const BITS_PER_SAMPLE = 16;
const NUM_CHANNELS = 1;

/* ── WAV writer ── */

function encodeWAV(samples) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (off, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, NUM_CHANNELS, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * NUM_CHANNELS * BITS_PER_SAMPLE / 8, true);
  view.setUint16(32, NUM_CHANNELS * BITS_PER_SAMPLE / 8, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s * 0x7FFF, true);
  }
  return Buffer.from(buffer);
}

function saveWav(filename, samples) {
  const wav = encodeWAV(samples);
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filename, wav);
  console.log(`  ✓ ${filename}  (${(wav.length / 1024).toFixed(1)} KB)`);
}

/* ── Utilities ── */

function linspace(start, end, n) {
  const step = (end - start) / (n - 1);
  return Array.from({ length: n }, (_, i) => start + i * step);
}

function clamp(v) { return Math.max(-1, Math.min(1, v)); }

/* ── Sound generators ── */

function sine(freq, duration) {
  const len = Math.floor(SAMPLE_RATE * duration);
  return linspace(0, duration, len).map(t => Math.sin(2 * Math.PI * freq * t));
}

function tone(freq, duration, type = 'sine', volume = 1) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const phase = 2 * Math.PI * freq * t;
    let v;
    switch (type) {
      case 'sine': v = Math.sin(phase); break;
      case 'square': v = Math.sin(phase) >= 0 ? 1 : -1; break;
      case 'sawtooth': v = 2 * ((freq * t) % 1) - 1; break;
      case 'triangle': v = 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1; break;
      default: v = Math.sin(phase);
    }
    samples[i] = v * volume;
  }
  return samples;
}

function noise(type = 'white', duration = 1) {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float64Array(len);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'white') {
      samples[i] = w;
    } else if (type === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      samples[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w) / 8;
      b6 = w * 0.5362;
    } else {
      b0 = 0.9 * b0 + w * 0.1;
      samples[i] = b0;
    }
  }
  return samples;
}

function adsrEnvelope(samples, attack, decay, sustainLevel, release) {
  const len = samples.length;
  const aSamps = Math.floor(attack * SAMPLE_RATE);
  const dSamps = Math.floor(decay * SAMPLE_RATE);
  const rSamps = Math.floor(release * SAMPLE_RATE);
  for (let i = 0; i < len; i++) {
    let env;
    if (i < aSamps) env = i / aSamps;
    else if (i < aSamps + dSamps) env = 1 - (1 - sustainLevel) * ((i - aSamps) / dSamps);
    else if (i < len - rSamps) env = sustainLevel;
    else env = sustainLevel * (1 - (i - (len - rSamps)) / rSamps);
    samples[i] *= Math.max(0, env);
  }
  return samples;
}

function mix(...signals) {
  const maxLen = Math.max(...signals.map(s => s.length));
  const result = new Float64Array(maxLen);
  for (const sig of signals) {
    for (let i = 0; i < sig.length; i++) result[i] += sig[i];
  }
  return result;
}

function lowpass(samples, cutoff) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SAMPLE_RATE;
  const alpha = dt / (rc + dt);
  const result = new Float64Array(samples.length);
  result[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    result[i] = result[i - 1] + alpha * (samples[i] - result[i - 1]);
  }
  return result;
}

/* ── Specific sound generators ── */

function genImpact(vol = 0.5, dur = 0.8) {
  const n = noise('brown', dur);
  const nLow = lowpass(n, 300);
  const sub = tone(50, dur, 'sine', 0.6);
  const click = tone(300, 0.03, 'sine', 0.4);
  let s = mix(nLow.map(v => v * vol), sub.map(v => v * 0.3), click);
  s = adsrEnvelope(s, 0.002, 0.1, 0.3, 0.15);
  return s.map(clamp);
}

function genChord(notes, dur = 0.8, type = 'sine', vol = 0.25) {
  const parts = notes.map(f => tone(f, dur, type, vol / notes.length));
  let s = mix(...parts);
  s = adsrEnvelope(s, 0.02, 0.15, 0.5, 0.2);
  return s.map(clamp);
}

function genSweep(from, to, dur = 0.4, vol = 0.2) {
  const len = Math.floor(SAMPLE_RATE * dur);
  const samples = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const freq = from * Math.pow(to / from, t / dur);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * vol;
  }
  return adsrEnvelope(samples, 0.02, 0.1, 0.5, 0.2);
}

function genClick(vol = 0.15) {
  const len = Math.floor(SAMPLE_RATE * 0.03);
  const samples = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    samples[i] = Math.sin(2 * Math.PI * 800 * t) * vol * Math.exp(-t * 100);
  }
  return samples;
}

function genHover(vol = 0.08) {
  const len = Math.floor(SAMPLE_RATE * 0.02);
  const samples = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    samples[i] = Math.sin(2 * Math.PI * 1000 * t) * vol * Math.exp(-t * 150);
  }
  return samples;
}

function genNotification() {
  const t1 = tone(880, 0.08, 'sine', 0.25);
  const t2 = tone(1100, 0.1, 'sine', 0.2);
  const t2padded = new Float64Array(t1.length + t2.length);
  t2padded.set(t1);
  for (let i = 0; i < t2.length; i++) t2padded[i + t1.length] += t2[i];
  return t2padded.map(clamp);
}

function genError() {
  const t1 = tone(220, 0.15, 'sawtooth', 0.2);
  const t2 = tone(180, 0.25, 'sawtooth', 0.15);
  const gap = Math.floor(SAMPLE_RATE * 0.08);
  const result = new Float64Array(t1.length + gap + t2.length);
  result.set(t1);
  result.set(t2, t1.length + gap);
  return result;
}

function genSuccess() {
  return genChord([523, 784, 1047], 0.35, 'sine', 0.25);
}

function genAmbientDrone(freq, dur = 8, vol = 0.12) {
  const o1 = tone(freq, dur, 'sawtooth', vol);
  const o2 = tone(freq * 1.5, dur, 'sawtooth', vol * 0.5);
  const o3 = tone(freq * 0.5, dur, 'sine', vol * 0.8);
  const o4 = tone(freq * 4, dur, 'sine', vol * 0.15);
  let s = mix(o1, o2, o3, o4);
  s = lowpass(s, 150);
  return s;
}

function genNightAmbient() {
  return genAmbientDrone(55, 10, 0.12);
}

function genDayChime() {
  return genChord([262, 330, 392, 523], 0.8, 'sine', 0.15);
}

function genVotePulse() {
  const len = Math.floor(SAMPLE_RATE * 4);
  const samples = new Float64Array(len);
  const bpm = 90;
  const interval = 60 / bpm;
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const beatPhase = (t % interval) / interval;
    if (beatPhase < 0.05) {
      const env = Math.exp(-beatPhase * 200);
      samples[i] = Math.sin(2 * Math.PI * 50 * t) * 0.08 * env;
    }
  }
  return adsrEnvelope(samples, 0.5, 0, 1, 0.5);
}

function genCoinEarn() {
  const t1 = tone(1200, 0.05, 'sine', 0.2);
  const t2 = tone(1500, 0.06, 'sine', 0.15);
  const result = new Float64Array(t1.length + t2.length);
  result.set(t1);
  for (let i = 0; i < t2.length; i++) result[i + t1.length] += t2[i];
  return result.map(clamp);
}

function genCoinSpend() {
  const t1 = tone(600, 0.06, 'sine', 0.15);
  const t2 = tone(400, 0.08, 'sine', 0.12);
  const result = new Float64Array(t1.length + t2.length);
  result.set(t1);
  for (let i = 0; i < t2.length; i++) result[i + t1.length] += t2[i];
  return result.map(clamp);
}

function genChatMessage() {
  return adsrEnvelope(tone(600, 0.04, 'sine', 0.1), 0.003, 0.02, 0.3, 0.05);
}

function genMafiaChat() {
  return adsrEnvelope(tone(200, 0.04, 'sine', 0.08), 0.005, 0.02, 0.3, 0.05);
}

function genGameStart() {
  const c1 = genChord([330, 440, 550], 0.25, 'square', 0.12);
  const c2 = genChord([440, 550, 660], 0.25, 'square', 0.12);
  const c3 = genChord([550, 660, 880], 0.5, 'square', 0.15);
  const imp = genImpact(0.15, 0.4);
  const gap1 = Math.floor(SAMPLE_RATE * 0.2);
  const gap2 = Math.floor(SAMPLE_RATE * 0.2);
  const result = new Float64Array(c1.length + gap1 + c2.length + gap2 + c3.length + Math.floor(SAMPLE_RATE * 0.5));
  result.set(c1);
  result.set(c2, c1.length + gap1);
  result.set(c3, c1.length + gap1 + c2.length + gap2);
  result.set(imp, c1.length + gap1 + c2.length + gap2 + c3.length);
  return result.map(clamp);
}

function genLoversDeath() {
  return genChord([349, 440, 523], 0.7, 'sine', 0.1);
}

function genHeal() {
  return genChord([523, 659, 784], 0.4, 'sine', 0.12);
}

function genInvestigate() {
  const s1 = genSweep(600, 1200, 0.3, 0.1);
  const s2 = genSweep(1200, 600, 0.3, 0.08);
  const gap = Math.floor(SAMPLE_RATE * 0.15);
  const result = new Float64Array(s1.length + gap + s2.length);
  result.set(s1);
  result.set(s2, s1.length + gap);
  return result;
}

function genPageTransition() {
  return genSweep(400, 800, 0.18, 0.1);
}

function genAchievement() {
  return genChord([659, 784, 1047, 1319], 0.5, 'sine', 0.2);
}

function genLevelUp() {
  return genChord([523, 659, 784, 1047, 1319], 0.65, 'triangle', 0.18);
}

function genMatchFound() {
  return genChord([523, 659, 784, 1047], 0.45, 'sine', 0.25);
}

function genFriendOnline() {
  return adsrEnvelope(tone(700, 0.06, 'sine', 0.15), 0.005, 0.02, 0.5, 0.1);
}

function genFriendRequest() {
  return genChord([500, 700], 0.18, 'sine', 0.15);
}

function genPartyInvite() {
  return genChord([400, 600, 800], 0.25, 'triangle', 0.15);
}

function genRoleReveal() {
  const s = genSweep(200, 800, 0.4, 0.15);
  const c = genChord([523, 784], 0.3, 'sine', 0.1);
  const result = new Float64Array(s.length + Math.floor(SAMPLE_RATE * 0.2) + c.length);
  result.set(s);
  result.set(c, s.length + Math.floor(SAMPLE_RATE * 0.2));
  return result;
}

/* ── Main ── */

const BASE = './packages/client/public/sounds';

const SOUNDS = {
  // Phase
  'sfx/phase/night-falls': () => genImpact(0.12, 1.2),
  'sfx/phase/morning-arrives': genDayChime,
  'sfx/phase/vote-starts': genVotePulse,
  // Events
  'sfx/events/player-killed': () => genImpact(0.25, 1.0),
  'sfx/events/player-lynched': () => genImpact(0.35, 1.2),
  'sfx/events/vote-cast': () => genChord([600, 800], 0.12, 'sine', 0.12),
  'sfx/events/vote-result': () => {
    const c = genChord([500, 700, 900], 0.35, 'triangle', 0.15);
    const imp = genImpact(0.18, 0.3);
    const result = new Float64Array(c.length + Math.floor(SAMPLE_RATE * 0.15) + imp.length);
    result.set(c);
    result.set(imp, c.length + Math.floor(SAMPLE_RATE * 0.15));
    return result;
  },
  'sfx/events/role-reveal': genRoleReveal,
  'sfx/events/heal': genHeal,
  'sfx/events/investigate': genInvestigate,
  // UI
  'sfx/ui/click': genClick,
  'sfx/ui/hover': genHover,
  'sfx/ui/notification': genNotification,
  'sfx/ui/error': genError,
  'sfx/ui/success': genSuccess,
  'sfx/ui/page-transition': genPageTransition,
  'sfx/ui/chat-message': genChatMessage,
  'sfx/ui/mafia-chat': genMafiaChat,
  // Social
  'sfx/social/friend-online': genFriendOnline,
  'sfx/social/friend-request': genFriendRequest,
  'sfx/social/party-invite': genPartyInvite,
  'sfx/social/match-found': genMatchFound,
  'sfx/social/game-start': genGameStart,
  // Economy
  'sfx/economy/coin-earn': genCoinEarn,
  'sfx/economy/coin-spend': genCoinSpend,
  'sfx/economy/achievement': genAchievement,
  'sfx/economy/level-up': genLevelUp,
  // BGM
  'bgm/main-theme': genNightAmbient,
  'bgm/night-ambient': genNightAmbient,
  'bgm/day-theme': genDayChime,
  'bgm/voting-tension': genVotePulse,
  'bgm/mafia-win': () => {
    const c1 = genChord([196, 233, 277, 330], 1.0, 'sawtooth', 0.15);
    const c2 = genChord([165, 196, 233, 277], 1.2, 'sawtooth', 0.12);
    const imp = genImpact(0.25, 0.7);
    const result = new Float64Array(c1.length + Math.floor(SAMPLE_RATE * 0.4) + c2.length + Math.floor(SAMPLE_RATE * 0.8));
    result.set(c1);
    result.set(c2, c1.length + Math.floor(SAMPLE_RATE * 0.4));
    result.set(imp, c1.length + Math.floor(SAMPLE_RATE * 0.4) + c2.length + Math.floor(SAMPLE_RATE * 0.1));
    return result;
  },
  'bgm/town-win': () => {
    const c1 = genChord([523, 659, 784, 1047], 0.6, 'sine', 0.2);
    const c2 = genChord([659, 784, 1047, 1319], 1.0, 'sine', 0.18);
    const result = new Float64Array(c1.length + Math.floor(SAMPLE_RATE * 0.3) + c2.length);
    result.set(c1);
    result.set(c2, c1.length + Math.floor(SAMPLE_RATE * 0.3));
    return result;
  },
  'bgm/death-theme': () => genChord([196, 233, 277], 2.0, 'sine', 0.08),
  'bgm/lobby-music': () => genChord([262, 330, 392], 0.8, 'sine', 0.08),
};

console.log('🎵 Generating Mafia Night sound effects...\n');

let total = 0;
for (const [key, genFn] of Object.entries(SOUNDS)) {
  const filename = `${BASE}/${key}.wav`;
  const samples = genFn();
  if (samples && samples.length > 0) {
    saveWav(filename, samples);
    total++;
  }
}

console.log(`\n✅ Generated ${total} sound effects successfully!`);
console.log('📁 Location: packages/client/public/sounds/');
