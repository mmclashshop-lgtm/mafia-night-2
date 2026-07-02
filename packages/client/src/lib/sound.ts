let audioCtx: AudioContext | null = null;
let soundPacksLoaded = false;
let soundPackBuffers: Record<string, AudioBuffer> = {};

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  delay = 0
) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {
    // Audio not available
  }
}

function playMultiTone(
  notes: Array<{ freq: number; dur: number; type?: OscillatorType; vol?: number }>
) {
  let cumulativeDelay = 0;
  notes.forEach((note) => {
    setTimeout(() => playTone(note.freq, note.dur, note.type || 'sine', note.vol || 0.1), cumulativeDelay);
    cumulativeDelay += note.dur * 1000;
  });
}

// Web Audio API ambient sounds
let ambientNode: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

function stopAmbient() {
  if (ambientNode) {
    try {
      ambientNode.stop();
    } catch {}
    ambientNode = null;
    ambientGain = null;
  }
}

function startAmbient(frequency: number, type: OscillatorType = 'sine', volume = 0.02) {
  stopAmbient();
  try {
    const ctx = getAudioCtx();
    ambientNode = ctx.createOscillator();
    ambientGain = ctx.createGain();
    ambientNode.type = type;
    ambientNode.frequency.setValueAtTime(frequency, ctx.currentTime);
    ambientGain.gain.setValueAtTime(volume, ctx.currentTime);
    ambientNode.connect(ambientGain);
    ambientGain.connect(ctx.destination);
    ambientNode.start();
  } catch {}
}

export const sound = {
  phaseChange() {
    playTone(440, 0.12, 'sine', 0.1);
    setTimeout(() => playTone(660, 0.15, 'sine', 0.08), 80);
  },

  nightStart() {
    stopAmbient();
    playTone(220, 0.4, 'sine', 0.06);
    setTimeout(() => playTone(165, 0.5, 'triangle', 0.04), 200);
    setTimeout(() => playTone(110, 0.6, 'triangle', 0.03), 400);
    setTimeout(() => startAmbient(55, 'sine', 0.015), 800);
  },

  nightEnd() {
    stopAmbient();
  },

  dayStart() {
    stopAmbient();
    playMultiTone([
      { freq: 523, dur: 0.15, vol: 0.1 },
      { freq: 659, dur: 0.15, vol: 0.09 },
      { freq: 784, dur: 0.2, vol: 0.08 },
      { freq: 1047, dur: 0.3, vol: 0.07 },
    ]);
  },

  playerDied() {
    playTone(400, 0.2, 'sawtooth', 0.06);
    setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.05), 150);
    setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.04), 300);
    setTimeout(() => playTone(150, 1.0, 'sawtooth', 0.02), 500);
  },

  voteCast() {
    playTone(600, 0.08, 'square', 0.04);
    setTimeout(() => playTone(800, 0.08, 'square', 0.03), 60);
  },

  voteResult() {
    playTone(500, 0.15, 'square', 0.07);
    setTimeout(() => playTone(700, 0.15, 'square', 0.06), 120);
    setTimeout(() => playTone(900, 0.2, 'square', 0.05), 240);
  },

  lynch() {
    playTone(300, 0.3, 'sawtooth', 0.07);
    setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.06), 200);
    setTimeout(() => playTone(100, 0.8, 'sawtooth', 0.04), 400);
  },

  gameEnd() {
    playMultiTone([
      { freq: 523, dur: 0.3, vol: 0.12 },
      { freq: 659, dur: 0.3, vol: 0.11 },
      { freq: 784, dur: 0.3, vol: 0.1 },
      { freq: 1047, dur: 0.5, vol: 0.08 },
    ]);
  },

  mafiaWin() {
    playTone(300, 0.5, 'sawtooth', 0.08);
    setTimeout(() => playTone(250, 0.5, 'sawtooth', 0.06), 300);
    setTimeout(() => playTone(200, 0.8, 'sawtooth', 0.05), 600);
    setTimeout(() => playTone(150, 1.2, 'sawtooth', 0.04), 1000);
  },

  townWin() {
    playMultiTone([
      { freq: 523, dur: 0.2, vol: 0.1 },
      { freq: 659, dur: 0.2, vol: 0.09 },
      { freq: 784, dur: 0.2, vol: 0.08 },
      { freq: 1047, dur: 0.3, vol: 0.1 },
      { freq: 1319, dur: 0.5, vol: 0.08 },
    ]);
  },

  jesterWin() {
    playMultiTone([
      { freq: 400, dur: 0.15, vol: 0.08 },
      { freq: 500, dur: 0.15, vol: 0.08 },
      { freq: 600, dur: 0.15, vol: 0.08 },
      { freq: 800, dur: 0.3, vol: 0.1 },
    ]);
  },

  click() {
    playTone(800, 0.04, 'square', 0.03);
  },

  roleReveal() {
    playTone(350, 0.1, 'sine', 0.05);
    setTimeout(() => playTone(700, 0.15, 'sine', 0.08), 100);
  },

  loversDeath() {
    playTone(523, 0.2, 'sine', 0.06);
    setTimeout(() => playTone(440, 0.3, 'sine', 0.05), 150);
    setTimeout(() => playTone(349, 0.5, 'sine', 0.04), 300);
  },

  stopAmbient,

  // Sound pack support (for loading mp3 files)
  async loadSoundPack(baseUrl: string) {
    const ctx = getAudioCtx();
    const sounds = [
      'nightStart', 'dayStart', 'playerDied', 'voteCast',
      'voteResult', 'lynch', 'gameEnd', 'mafiaWin', 'townWin',
      'roleReveal', 'click', 'phaseChange'
    ];

    for (const soundName of sounds) {
      try {
        const response = await fetch(`${baseUrl}/${soundName}.mp3`);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          soundPackBuffers[soundName] = audioBuffer;
        }
      } catch {
        // Sound pack file not found, continue with Web Audio
      }
    }

    soundPacksLoaded = Object.keys(soundPackBuffers).length > 0;
    return soundPacksLoaded;
  },
};
