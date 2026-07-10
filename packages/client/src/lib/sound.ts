import { Howl, Howler } from 'howler';

type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface VolumeState {
  master: number;
  bgm: number;
  sfx: number;
  ui: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private uiGain: GainNode | null = null;

  private bgmHowl: Howl | null = null;
  private bgmId: number | null = null;
  private currentBgm: string | null = null;

  private _muted = false;
  private _loaded = false;
  private _loadingProgress = 0;

  private vol: VolumeState = { master: 1.0, bgm: 0.7, sfx: 0.9, ui: 0.8 };
  private sounds: Map<string, Howl> = new Map();
  private proceduralNodes: Map<string, { stop: () => void }> = new Map();
  private realBgmMap: Map<string, Howl> = new Map();
  private realBgmErrored: Set<string> = new Set();
  private currentRealBgmKey: string | null = null;
  private currentRealBgmId: number | null = null;

  /* ── Custom URLs from admin panel ── */
  private customSoundUrls: Record<string, string> = {};
  private customBgmUrls: Record<string, string> = {};

  /* ── BGM file manifest ── */
  private bgmFiles: Array<{ key: string; filename: string }> = [
    { key: 'bgm-main', filename: 'main-theme' },
    { key: 'bgm-lobby', filename: 'lobby-music' },
    { key: 'bgm-night', filename: 'night-ambient' },
    { key: 'bgm-day', filename: 'day-theme' },
    { key: 'bgm-voting', filename: 'voting-tension' },
    { key: 'bgm-mafia-win', filename: 'mafia-win' },
    { key: 'bgm-town-win', filename: 'town-win' },
    { key: 'bgm-death', filename: 'death-theme' },
  ];

  /* ── Reverb cache ── */
  private hallReverb: ConvolverNode | null = null;
  private roomReverb: ConvolverNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.ctx = new AudioContext();
        this.analyser = this.ctx.createAnalyser();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.connect(this.masterGain);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.masterGain);
        this.uiGain = this.ctx.createGain();
        this.uiGain.connect(this.masterGain);
        this.updateVolumes();
      } catch { /* noop */ }
    }
  }

  private updateVolumes() {
    if (this.masterGain) this.masterGain.gain.value = this._muted ? 0 : this.vol.master;
    if (this.bgmGain) this.bgmGain.gain.value = this._muted ? 0 : this.vol.bgm;
    if (this.sfxGain) this.sfxGain.gain.value = this._muted ? 0 : this.vol.sfx;
    if (this.uiGain) this.uiGain.gain.value = this._muted ? 0 : this.vol.ui;
  }

  get muted() { return this._muted; }
  setMuted(v: boolean) { this._muted = v; if (v) this.stopBgm(); this.updateVolumes(); }
  toggleMuted() { this.setMuted(!this._muted); }

  get loaded() { return this._loaded; }
  get loadingProgress() { return this._loadingProgress; }
  get analyserNode() { return this.analyser; }

  setVolume(category: 'master' | 'bgm' | 'sfx' | 'ui', value: number) {
    this.vol[category] = Math.max(0, Math.min(1, value));
    this.updateVolumes();
  }

  /* ── Context ── */

  private ensureCtx() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /* ── Noise generation ── */

  private createNoiseBuffer(duration: number, type: 'white' | 'pink' | 'brown' = 'brown'): AudioBuffer | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const sr = ctx.sampleRate;
    const length = sr * duration;
    const buffer = ctx.createBuffer(1, length, sr);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        data[i] = white;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white) / 8;
        b6 = white * 0.5362;
      } else {
        b0 = 0.9 * b0 + white * 0.1;
        data[i] = b0;
      }
    }
    return buffer;
  }

  /* ── Reverb ── */

  private generateImpulse(duration: number, decay: number, filterFreq = 8000): AudioBuffer | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const sr = ctx.sampleRate;
    const length = sr * duration;
    const buffer = ctx.createBuffer(2, length, sr);
    const chL = buffer.getChannelData(0);
    const chR = buffer.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const t = i / sr;
      const env = Math.exp(-t * decay) * (Math.random() * 2 - 1);
      chL[i] = env * 0.5;
      chR[i] = env * (0.5 + Math.random() * 0.3);
    }
    return buffer;
  }

  private getOrCreateReverb(type: 'hall' | 'room'): ConvolverNode | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const key = type === 'hall' ? 'hallReverb' : 'roomReverb';
    if (this[key]) return this[key];
    const dur = type === 'hall' ? 2.5 : 0.6;
    const decay = type === 'hall' ? 1.8 : 4.5;
    const impulse = this.generateImpulse(dur, decay);
    if (!impulse) return null;
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    this[key] = convolver;
    return convolver;
  }

  /* ── ADSR helper ── */

  private applyADSR(
    gain: GainNode,
    ctx: AudioContext,
    startTime: number,
    duration: number,
    peak: number,
    attack: number,
    decay: number,
    sustain: number,
    release: number
  ) {
    const t = startTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + attack);
    gain.gain.linearRampToValueAtTime(peak * sustain, t + attack + decay);
    gain.gain.setValueAtTime(peak * sustain, t + duration - release);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  }

  /* ── Destination helpers ── */

  private get sfxDest(): GainNode {
    return this.sfxGain ?? this.masterGain ?? this.ctx!.destination as unknown as GainNode;
  }
  private get bgmDest(): GainNode {
    return this.bgmGain ?? this.masterGain ?? this.ctx!.destination as unknown as GainNode;
  }
  private get uiDest(): GainNode {
    return this.uiGain ?? this.masterGain ?? this.ctx!.destination as unknown as GainNode;
  }

  /* ── Sound generators ── */

  private genReverbSend(dest: GainNode, wet = 0.4): { input: GainNode; output: AudioNode } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const reverb = this.getOrCreateReverb('hall');
    if (!reverb) return null;
    const input = ctx.createGain();
    input.gain.value = wet;
    const dry = ctx.createGain();
    dry.gain.value = 1 - wet;
    input.connect(reverb);
    reverb.connect(dest);
    dry.connect(dest);
    return { input, output: dry };
  }

  private genImpact(lowFreq = 60, highFreq = 200, dur = 0.6, vol = 0.5, reverbWet = 0.25): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.sfxDest;
    const now = ctx.currentTime;

    /* ── Compressor ── */
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 10;
    comp.ratio.value = 8;
    comp.attack.value = 0.003;
    comp.release.value = 0.1;

    /* ── Sub bass ── */
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(lowFreq * 0.5, now);
    sub.frequency.exponentialRampToValueAtTime(lowFreq * 0.3, now + dur * 0.6);
    const subGain = ctx.createGain();
    this.applyADSR(subGain, ctx, now, dur * 0.8, vol * 0.7, 0.005, 0.1, 0.3, 0.3);

    /* ── Noise burst ── */
    const noise = this.createNoiseBuffer(dur, 'brown');
    let noiseSrc: AudioBufferSourceNode | null = null;
    let noiseGain: GainNode | null = null;
    if (noise) {
      noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noise;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(highFreq, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(lowFreq, now + dur);
      noiseGain = ctx.createGain();
      this.applyADSR(noiseGain, ctx, now, dur, vol, 0.002, 0.08, 0.4, 0.15);
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(comp);
    }

    /* ── Click transient ── */
    const click = ctx.createOscillator();
    click.type = 'sine';
    click.frequency.setValueAtTime(highFreq * 3, now);
    click.frequency.exponentialRampToValueAtTime(highFreq, now + 0.03);
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(vol * 0.4, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    /* ── Reverb wet send ── */
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = reverbWet;
    const reverb = this.getOrCreateReverb('room');
    if (reverb) {
      reverbSend.connect(reverb);
      reverb.connect(comp);
    }

    sub.connect(subGain);
    subGain.connect(comp);
    click.connect(clickGain);
    clickGain.connect(comp);

    comp.connect(dest);
    if (noiseGain) noiseGain.connect(reverbSend);

    sub.start(now);
    sub.stop(now + dur);
    click.start(now);
    click.stop(now + dur);
    if (noiseSrc) noiseSrc.start(now);

    return {
      stop: () => {
        try { sub.stop(); click.stop(); if (noiseSrc) noiseSrc.stop(); } catch { /* noop */ }
      }
    };
  }

  private genAmbientDrone(
    freq: number, type: OscType = 'sawtooth', volume = 0.12, filterFreq = 120
  ): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.bgmDest;
    const now = ctx.currentTime;

    /* ── Compressor for smoothness ── */
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -30;
    comp.ratio.value = 6;
    comp.attack.value = 0.05;
    comp.release.value = 0.3;

    /* ── Layer 1: fundamental ── */
    const osc1 = ctx.createOscillator();
    osc1.type = type;
    osc1.frequency.value = freq;

    /* ── Layer 2: fifth ── */
    const osc2 = ctx.createOscillator();
    osc2.type = type;
    osc2.frequency.value = freq * 1.5;
    osc2.detune.value = 3;

    /* ── Layer 3: sub ── */
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = freq * 0.5;

    /* ── Layer 4: air (high harmonics) ── */
    const osc4 = ctx.createOscillator();
    osc4.type = 'sine';
    osc4.frequency.value = freq * 4;
    osc4.detune.value = 7;

    /* ── Filters ── */
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.value = 0.7;

    /* ── LFO modulation on filter ── */
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15 + Math.random() * 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = filterFreq * 0.2;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    /* ── Gain staging ── */
    const gain = ctx.createGain();
    gain.gain.value = 0;

    /* ── Fade in ── */
    gain.gain.linearRampToValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 1.5);

    /* ── Reverb ── */
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.6;
    const reverb = this.getOrCreateReverb('hall');
    if (reverb) {
      reverbSend.connect(reverb);
      reverb.connect(comp);
    }

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    osc4.connect(filter);
    filter.connect(gain);
    gain.connect(comp);
    gain.connect(reverbSend);
    comp.connect(dest);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc4.start(now);

    return {
      stop: () => {
        try {
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
          setTimeout(() => {
            try { osc1.stop(); osc2.stop(); osc3.stop(); osc4.stop(); lfo.stop(); } catch { /* noop */ }
          }, 900);
        } catch { /* noop */ }
      }
    };
  }

  private genChord(
    notes: number[], dur = 0.8, type: OscType = 'sine', vol = 0.25, delay = 0, reverbWet = 0.3
  ): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.sfxDest;
    const startTime = ctx.currentTime + delay;
    const oscs: OscillatorNode[] = [];

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.15;

    const reverbSend = ctx.createGain();
    reverbSend.gain.value = reverbWet;
    const reverb = this.getOrCreateReverb('hall');
    if (reverb) {
      reverbSend.connect(reverb);
      reverb.connect(comp);
    }

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const localStart = startTime + i * 0.04;
      this.applyADSR(gain, ctx, localStart, dur, vol, 0.02, 0.15, 0.6, 0.25);
      const panner = ctx.createStereoPanner();
      panner.pan.value = notes.length > 1 ? (i / (notes.length - 1)) * 0.6 - 0.3 : 0;
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(comp);
      panner.connect(reverbSend);
      osc.start(localStart);
      osc.stop(localStart + dur);
      oscs.push(osc);
    });

    comp.connect(dest);

    return { stop: () => oscs.forEach(o => { try { o.stop(); } catch { /* noop */ } }) };
  }

  private genSweep(
    fromFreq: number, toFreq: number, dur: number, type: OscType = 'sine', vol = 0.2
  ): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.sfxDest;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(fromFreq, now);
    osc.frequency.exponentialRampToValueAtTime(toFreq, now + dur);
    const gain = ctx.createGain();
    this.applyADSR(gain, ctx, now, dur, vol, 0.02, 0.1, 0.5, 0.2);
    const panner = ctx.createStereoPanner();
    panner.pan.value = toFreq > fromFreq ? 0.4 : -0.4;
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(dest);
    osc.start(now);
    osc.stop(now + dur);
    return { stop: () => { try { osc.stop(); } catch { /* noop */ } } };
  }

  private genPulse(bpm = 100, vol = 0.12): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.sfxDest;
    const interval = 60 / bpm / 2;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -15;
    comp.ratio.value = 3;
    comp.attack.value = 0.002;
    comp.release.value = 0.05;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 50;
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + interval * 16);

    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(comp);
    comp.connect(dest);
    osc.start();

    let count = 0;
    const maxBeats = 16;
    const schedule = () => {
      if (count >= maxBeats) return;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.015);
      gain.gain.setValueAtTime(vol, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + interval * 0.7);
      count++;
      setTimeout(schedule, interval * 1000);
    };
    schedule();

    return { stop: () => { try { osc.stop(); } catch { /* noop */ } } };
  }

  playTone(freq: number, dur: number, type: OscType = 'sine', vol = 0.15, delay = 0) {
    if (this._muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    this.applyADSR(gain, ctx, t, dur, vol, 0.003, 0.05, 0.3, 0.1);
    osc.connect(gain);
    gain.connect(this.uiDest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /* ── Sound pack loader (lazy) ── */

  private soundManifest: Array<{ name: string; category: string; key: string }> = [
    { name: 'night-falls', category: 'sfx/phase', key: 'night-falls' },
    { name: 'morning-arrives', category: 'sfx/phase', key: 'morning-arrives' },
    { name: 'vote-starts', category: 'sfx/phase', key: 'vote-starts' },
    { name: 'player-killed', category: 'sfx/events', key: 'player-killed' },
    { name: 'player-lynched', category: 'sfx/events', key: 'player-lynched' },
    { name: 'vote-cast', category: 'sfx/events', key: 'vote-cast' },
    { name: 'vote-result', category: 'sfx/events', key: 'vote-result' },
    { name: 'role-reveal', category: 'sfx/events', key: 'role-reveal' },
    { name: 'heal', category: 'sfx/events', key: 'heal' },
    { name: 'investigate', category: 'sfx/events', key: 'investigate' },
    { name: 'click', category: 'sfx/ui', key: 'click' },
    { name: 'hover', category: 'sfx/ui', key: 'hover' },
    { name: 'notification', category: 'sfx/ui', key: 'notification' },
    { name: 'error', category: 'sfx/ui', key: 'error' },
    { name: 'success', category: 'sfx/ui', key: 'success' },
    { name: 'page-transition', category: 'sfx/ui', key: 'page-transition' },
    { name: 'chat-message', category: 'sfx/ui', key: 'chat-message' },
    { name: 'mafia-chat', category: 'sfx/ui', key: 'mafia-chat' },
    { name: 'friend-online', category: 'sfx/social', key: 'friend-online' },
    { name: 'friend-request', category: 'sfx/social', key: 'friend-request' },
    { name: 'party-invite', category: 'sfx/social', key: 'party-invite' },
    { name: 'match-found', category: 'sfx/social', key: 'match-found' },
    { name: 'game-start', category: 'sfx/social', key: 'game-start' },
    { name: 'mafia-kill', category: 'sfx/events', key: 'sfx-mafia-kill' },
    { name: 'timer', category: 'sfx/ui', key: 'sfx-timer' },
    { name: 'night-fall', category: 'sfx/phase', key: 'sfx-night-fall' },
    { name: 'day-break', category: 'sfx/phase', key: 'sfx-day-break' },
    { name: 'coin-earn', category: 'sfx/economy', key: 'coin-earn' },
    { name: 'coin-spend', category: 'sfx/economy', key: 'coin-spend' },
    { name: 'achievement', category: 'sfx/economy', key: 'achievement' },
    { name: 'level-up', category: 'sfx/economy', key: 'level-up' },
    { name: 'main-theme', category: 'bgm', key: 'bgm-main' },
    { name: 'night-ambient', category: 'bgm', key: 'bgm-night' },
    { name: 'day-theme', category: 'bgm', key: 'bgm-day' },
    { name: 'voting-tension', category: 'bgm', key: 'bgm-voting' },
    { name: 'mafia-win', category: 'bgm', key: 'bgm-mafia-win' },
    { name: 'town-win', category: 'bgm', key: 'bgm-town-win' },
    { name: 'death-theme', category: 'bgm', key: 'bgm-death' },
    { name: 'lobby-music', category: 'bgm', key: 'bgm-lobby' },
  ];

  private getSoundPath(name: string, category: string): string {
    const prefix = import.meta.env.BASE_URL || '/';
    return `${prefix}sounds/${category}/${name}.wav`;
  }

  private erroredKeys = new Set<string>();

  setCustomSoundUrls(map: Record<string, string>) {
    this.customSoundUrls = { ...map };
  }

  setCustomBgmUrls(map: Record<string, string>) {
    this.customBgmUrls = { ...map };
  }

  private ensureSound(key: string): Howl | undefined {
    if (this.erroredKeys.has(key)) return undefined;
    let howl = this.sounds.get(key);
    if (howl) return howl;
    const customUrl = this.customSoundUrls[key];
    if (customUrl) {
      try {
        howl = new Howl({
          src: [customUrl], volume: 0.7, preload: true,
          onloaderror: () => {
            this.erroredKeys.add(key);
            this.sounds.delete(key);
          },
        });
        this.sounds.set(key, howl);
        return howl;
      } catch {
        this.erroredKeys.add(key);
        return undefined;
      }
    }
    const entry = this.soundManifest.find(e => e.key === key);
    if (!entry) {
      this.erroredKeys.add(key);
      return undefined;
    }
    const url = this.getSoundPath(entry.name, entry.category);
    try {
      howl = new Howl({
        src: [url], volume: 0.7, preload: true,
        onloaderror: () => {
          this.erroredKeys.add(key);
          this.sounds.delete(key);
        },
      });
      this.sounds.set(key, howl);
      return howl;
    } catch {
      this.erroredKeys.add(key);
      return undefined;
    }
  }

  async loadSoundPack(): Promise<boolean> {
    this._loaded = true;
    this.loadAllBgm().catch(() => {});
    return true;
  }

  private playSound(key: string, vol = 1, rate = 1): number | null {
    if (this._muted) return null;
    const howl = this.ensureSound(key);
    if (howl && howl.state() === 'loaded') {
      howl.volume(vol);
      howl.rate(rate);
      return howl.play();
    }
    return null;
  }

  private playBgm(key: string, vol = 1): boolean {
    if (this._muted) return false;
    if (this.currentBgm === key && this.bgmHowl) return true;
    this.stopBgm();
    const howl = this.ensureSound(key);
    if (howl && howl.state() === 'loaded') {
      this.bgmHowl = howl;
      this.bgmId = howl.play();
      howl.volume(vol);
      howl.loop(true);
      this.currentBgm = key;
      return true;
    }
    return false;
  }

  stopBgm() {
    if (this.bgmHowl && this.bgmId !== null) {
      this.bgmHowl.stop(this.bgmId);
    }
    this.bgmHowl = null;
    this.bgmId = null;
    this.currentBgm = null;
    this.stopRealBgm();
    this.stopProcedural('bgm');
  }

  private stopProcedural(key: string) {
    const node = this.proceduralNodes.get(key);
    if (node) {
      node.stop();
      this.proceduralNodes.delete(key);
    }
  }

  /* ── Real BGM (MP3) system ── */

  loadBgmFile(key: string, url: string): Promise<void> {
    if (this.realBgmMap.has(key) || this.realBgmErrored.has(key)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      try {
        const howl = new Howl({
          src: [url],
          volume: 0.7,
          preload: true,
          onload: () => {
            this.realBgmMap.set(key, howl);
            resolve();
          },
          onloaderror: () => {
            this.realBgmErrored.add(key);
            resolve();
          },
        });
      } catch {
        this.realBgmErrored.add(key);
        resolve();
      }
    });
  }

  playRealBgm(key: string): boolean {
    if (this._muted) return false;
    if (this.currentRealBgmKey === key) return true;
    this.stopRealBgm();
    this.stopBgmNodes();
    let howl = this.realBgmMap.get(key);
    const customUrl = !howl ? this.customBgmUrls[key] : undefined;
    if (!howl && customUrl) {
      howl = new Howl({
        src: [customUrl], volume: 0.7, loop: true, preload: true,
        onloaderror: () => { this.realBgmErrored.add(key); },
      });
      this.realBgmMap.set(key, howl);
    }
    if (howl && howl.state() === 'loaded') {
      const id = howl.play();
      howl.volume(0.7);
      howl.loop(true);
      this.currentRealBgmKey = key;
      this.currentRealBgmId = id;
      return true;
    }
    return false;
  }

  private stopRealBgm() {
    if (this.currentRealBgmKey && this.currentRealBgmId !== null) {
      const howl = this.realBgmMap.get(this.currentRealBgmKey);
      if (howl) {
        howl.stop(this.currentRealBgmId);
      }
    }
    this.currentRealBgmKey = null;
    this.currentRealBgmId = null;
  }

  async loadAllBgm(): Promise<void> {
    const prefix = import.meta.env.BASE_URL || '/';
    const total = this.bgmFiles.length;
    for (let i = 0; i < total; i++) {
      const entry = this.bgmFiles[i]!;
      const url = `${prefix}sounds/bgm/${entry.filename}.mp3`;
      try {
        await this.loadBgmFile(entry.key, url);
      } catch {
        // silent
      }
      this._loadingProgress = (i + 1) / total;
    }
    this._loadingProgress = 1;
  }

  getLoadedBgmFiles(): string[] {
    return Array.from(this.realBgmMap.keys()).filter(
      (k) => !this.realBgmErrored.has(k)
    );
  }

  /* ══════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════ */

  phaseChange() {
    if (this.playSound('click', 0.6, 1.5) === null) {
      this.playTone(660, 0.08, 'sine', 0.12);
      setTimeout(() => this.playTone(880, 0.1, 'sine', 0.1), 50);
    }
  }

  nightStart() {
    this.stopBgm();
    this.startNightMusic();
    setTimeout(() => this.genImpact(40, 120, 1.2, 0.2, 0.4), 100);
  }

  nightEnd() {
    this.stopBgm();
  }

  dayStart() {
    this.stopBgm();
    this.startDayMusic();
    this.genChord([262, 330, 392, 523], 0.8, 'sine', 0.18, 0, 0.5);
  }

  voteStart() {
    this.stopBgm();
    this.startVotingMusic();
    this.genPulse(90, 0.12);
    this.playTone(440, 0.15, 'square', 0.08);
  }

  playerDied() {
    if (this.playSound('player-killed', 0.7) === null) {
      this.genImpact(50, 250, 1.0, 0.35, 0.3);
    }
  }

  voteCast() {
    if (this.playSound('vote-cast', 0.6) === null) {
      this.genChord([600, 800], 0.15, 'sine', 0.1, 0, 0.15);
    }
  }

  voteResult() {
    if (this.playSound('vote-result', 0.7) === null) {
      this.genChord([500, 700, 900], 0.4, 'triangle', 0.12, 0, 0.3);
      setTimeout(() => this.genImpact(40, 100, 0.3, 0.25, 0.2), 280);
    }
  }

  lynch() {
    if (this.playSound('player-lynched', 0.7) === null) {
      this.genImpact(30, 300, 1.2, 0.45, 0.35);
    }
  }

  gameEnd() {
    this.stopBgm();
    this.playBgm('bgm-death', 0.3);
  }

  mafiaWin() {
    this.stopBgm();
    if (!this.playBgm('bgm-mafia-win', 0.5)) {
      this.genChord([196, 233, 277, 330], 1.0, 'sawtooth', 0.12, 0, 0.5);
      setTimeout(() => this.genChord([165, 196, 233, 277], 1.2, 'sawtooth', 0.1, 0, 0.5), 600);
      setTimeout(() => this.genImpact(40, 80, 0.7, 0.35, 0.3), 1500);
    }
  }

  townWin() {
    this.stopBgm();
    if (!this.playBgm('bgm-town-win', 0.5)) {
      this.genChord([523, 659, 784, 1047], 0.6, 'sine', 0.2, 0, 0.4);
      setTimeout(() => this.genChord([659, 784, 1047, 1319], 1.0, 'sine', 0.18, 0, 0.4), 450);
    }
  }

  jesterWin() {
    this.stopBgm();
    if (this.playSound('click', 0.7, 2.0) === null) {
      this.genChord([400, 500, 600, 800], 0.3, 'triangle', 0.12, 0, 0.3);
    } else {
      setTimeout(() => this.playSound('click', 0.6, 1.8), 200);
      setTimeout(() => this.playSound('click', 0.5, 1.6), 400);
      setTimeout(() => this.playSound('success', 0.6), 600);
    }
  }

  click() {
    if (this.playSound('click', 0.8) === null) {
      this.playTone(800, 0.03, 'sine', 0.15);
    }
  }

  roleReveal() {
    if (this.playSound('role-reveal', 0.7) === null) {
      this.genSweep(200, 800, 0.4, 'sine', 0.15);
      setTimeout(() => this.genChord([523, 784], 0.3, 'sine', 0.1), 300);
    }
  }

  loversDeath() {
    if (this.playSound('player-killed', 0.5, 0.7) === null) {
      this.genChord([349, 440, 523], 0.7, 'sine', 0.1, 0, 0.4);
    }
  }

  heal() {
    if (this.playSound('heal', 0.6) === null) {
      this.genChord([523, 659, 784], 0.4, 'sine', 0.12, 0, 0.2);
    }
  }

  investigate() {
    if (this.playSound('investigate', 0.6) === null) {
      this.genSweep(600, 1200, 0.3, 'sine', 0.1);
      setTimeout(() => this.genSweep(1200, 600, 0.3, 'sine', 0.08), 200);
    }
  }

  notification() {
    if (this.playSound('notification', 0.6) === null) {
      this.playTone(880, 0.1, 'sine', 0.12);
      setTimeout(() => this.playTone(1100, 0.12, 'sine', 0.1), 80);
    }
  }

  error() {
    if (this.playSound('error', 0.7) === null) {
      this.playTone(220, 0.2, 'sawtooth', 0.12);
      setTimeout(() => this.playTone(180, 0.3, 'sawtooth', 0.1), 120);
    }
  }

  success() {
    if (this.playSound('success', 0.7) === null) {
      this.genChord([523, 784, 1047], 0.4, 'sine', 0.15, 0, 0.3);
    }
  }

  chatMessage(isMafia = false) {
    if (isMafia) {
      if (this.playSound('mafia-chat', 0.5) === null) {
        this.playTone(200, 0.04, 'sine', 0.06);
      }
    } else if (this.playSound('chat-message', 0.5) === null) {
      this.playTone(600, 0.04, 'sine', 0.06);
    }
  }

  mafiaKill() {
    if (this.playSound('sfx-mafia-kill', 0.7) === null) {
      this.genImpact(40, 200, 0.8, 0.4, 0.3);
    }
  }

  timerTick() {
    if (this.playSound('sfx-timer', 0.4) === null) {
      this.playTone(1000, 0.03, 'sine', 0.08);
    }
  }

  nightFall() {
    if (this.playSound('sfx-night-fall', 0.6) === null) {
      this.genSweep(400, 100, 0.5, 'sine', 0.12);
      setTimeout(() => this.genChord([220, 330, 440], 0.6, 'sine', 0.08, 0, 0.3), 300);
    }
  }

  dayBreak() {
    if (this.playSound('sfx-day-break', 0.6) === null) {
      this.genSweep(200, 1200, 0.5, 'sine', 0.12);
      setTimeout(() => this.genChord([523, 659, 784], 0.5, 'sine', 0.1, 0, 0.3), 300);
    }
  }

  friendOnline() {
    if (this.playSound('friend-online', 0.5) === null) {
      this.playTone(700, 0.08, 'sine', 0.08);
    }
  }

  friendRequest() {
    if (this.playSound('friend-request', 0.5) === null) {
      this.genChord([500, 700], 0.2, 'sine', 0.1, 0, 0.15);
    }
  }

  partyInvite() {
    if (this.playSound('party-invite', 0.5) === null) {
      this.genChord([400, 600, 800], 0.3, 'triangle', 0.1, 0, 0.2);
    }
  }

  matchFound() {
    if (this.playSound('match-found', 0.7) === null) {
      this.genChord([523, 659, 784, 1047], 0.5, 'sine', 0.2, 0, 0.35);
    }
  }

  gameStart() {
    if (this.playSound('game-start', 0.7) === null) {
      this.genChord([330, 440, 550], 0.3, 'square', 0.1, 0, 0.15);
      setTimeout(() => this.genChord([440, 550, 660], 0.3, 'square', 0.1, 0, 0.15), 250);
      setTimeout(() => this.genChord([550, 660, 880], 0.5, 'square', 0.12, 0, 0.25), 500);
      setTimeout(() => this.genImpact(60, 120, 0.4, 0.25, 0.2), 850);
    }
  }

  coinEarn() {
    if (this.playSound('coin-earn', 0.5) === null) {
      this.playTone(1200, 0.06, 'sine', 0.1);
      setTimeout(() => this.playTone(1500, 0.07, 'sine', 0.08), 50);
    }
  }

  coinSpend() {
    if (this.playSound('coin-spend', 0.5) === null) {
      this.playTone(600, 0.07, 'sine', 0.1);
      setTimeout(() => this.playTone(400, 0.09, 'sine', 0.08), 70);
    }
  }

  achievement() {
    if (this.playSound('achievement', 0.6) === null) {
      this.genChord([659, 784, 1047, 1319], 0.5, 'sine', 0.18, 0, 0.35);
    }
  }

  levelUp() {
    if (this.playSound('level-up', 0.6) === null) {
      this.genChord([523, 659, 784, 1047, 1319], 0.7, 'triangle', 0.18, 0, 0.4);
    }
  }

  hover() {
    if (this.playSound('hover', 0.3) === null) {
      this.playTone(1000, 0.02, 'sine', 0.06);
    }
  }

  pageTransition() {
    if (this.playSound('page-transition', 0.5) === null) {
      this.genSweep(400, 800, 0.2, 'sine', 0.08);
    }
  }

  lobbyMusic() {
    this.startLobbyMusic();
  }

  stopAmbient() {
    this.stopBgm();
  }

  /* ══════════════════════════════════════════════
     PROCEDURAL BACKGROUND MUSIC SYSTEM
     ══════════════════════════════════════════════ */

  private bgmNodes: Array<{ stop: () => void }> = [];
  private currentPageMusic: string | null = null;

  private stopBgmNodes() {
    this.stopRealBgm();
    for (const n of this.bgmNodes) n.stop();
    this.bgmNodes = [];
  }

  /* ── Cinematic Pad (soft string-like ambience) ── */
  private genPad(freq: number, vol = 0.06, filterFreq = 400): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const now = ctx.currentTime;
    const dest = this.bgmDest;

    const oscs: OscillatorNode[] = [];
    const harmonics = [1, 2.01, 3.02, 4.01, 5.03];
    const pans = [-0.3, -0.15, 0, 0.15, 0.3];
    const vols = [1, 0.5, 0.35, 0.2, 0.1];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(vol, now + 2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.2;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = filterFreq * 0.15;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const reverb = this.getOrCreateReverb('hall');
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.7;

    harmonics.forEach((h, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * h;
      osc.detune.value = (Math.random() - 0.5) * 2;
      const gain = ctx.createGain();
      gain.gain.value = vols[i] * vol;
      const panner = ctx.createStereoPanner();
      panner.pan.value = pans[i];
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(filter);
      osc.start(now);
      oscs.push(osc);
    });

    filter.connect(masterGain);
    masterGain.connect(reverbSend);
    masterGain.connect(dest);
    if (reverb) { reverbSend.connect(reverb); reverb.connect(dest); }

    return {
      stop: () => {
        try {
          masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
          setTimeout(() => oscs.forEach(o => { try { o.stop(); lfo.stop(); } catch {} }), 1100);
        } catch {}
      }
    };
  }

  /* ── Rhythmic Pulse (heartbeat-like low pulse) ── */
  private genPulse2(bpm = 60, vol = 0.08, filterSweep = true): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.bgmDest;
    const interval = 60 / bpm;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    let count = 0;
    const maxBeats = 999;
    let stopped = false;

    const schedule = () => {
      if (stopped || count >= maxBeats) return;
      const now = ctx.currentTime;
      // Double pulse (like heartbeat)
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.03);
      gain.gain.setValueAtTime(vol, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      if (filterSweep) {
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.linearRampToValueAtTime(75, now + 0.08);
      }
      count++;
      setTimeout(schedule, interval * 1000);
    };
    schedule();

    return {
      stop: () => {
        stopped = true;
        try { osc.stop(); } catch {}
      }
    };
  }

  /* ── Soft Melody (simple repeating pattern) ── */
  private genMelody(notes: number[], interval = 2, vol = 0.04): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.bgmDest;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(dest);
    osc.start();

    const reverb = this.getOrCreateReverb('hall');
    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.5;
    gain.connect(reverbSend);
    if (reverb) { reverbSend.connect(reverb); reverb.connect(dest); }

    let index = 0;
    let stopped = false;

    const playNote = () => {
      if (stopped) return;
      const now = ctx.currentTime;
      const freq = notes[index % notes.length];
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.02);
      gain.gain.setValueAtTime(vol, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      index++;
      setTimeout(playNote, interval * 500);
    };
    playNote();

    return {
      stop: () => {
        stopped = true;
        try { osc.stop(); } catch {}
      }
    };
  }

  /* ── Page-specific music ── */

  startHomeMusic() {
    if (this.currentPageMusic === 'home') return;
    this.stopBgmNodes();
    if (this.playRealBgm('bgm-main')) {
      this.currentPageMusic = 'home';
      return;
    }
    this.currentPageMusic = 'home';

    const pad = this.genPad(110, 0.05, 300);
    if (pad) this.bgmNodes.push(pad);

    const pedal = this.genPad(55, 0.03, 150);
    if (pedal) this.bgmNodes.push(pedal);

    const pulse = this.genPulse2(65, 0.06, true);
    if (pulse) this.bgmNodes.push(pulse);
  }

  startLobbyMusic() {
    if (this.currentPageMusic === 'lobby') return;
    this.stopBgmNodes();
    if (this.playRealBgm('bgm-lobby')) {
      this.currentPageMusic = 'lobby';
      return;
    }
    this.currentPageMusic = 'lobby';

    const pad = this.genPad(130, 0.04, 350);
    if (pad) this.bgmNodes.push(pad);

    const pulse = this.genPulse2(80, 0.07, true);
    if (pulse) this.bgmNodes.push(pulse);

    const melody = this.genMelody([262, 330, 392, 523, 392, 330], 1.5, 0.03);
    if (melody) this.bgmNodes.push(melody);
  }

  startNightMusic() {
    if (this.currentPageMusic === 'night') return;
    this.stopBgmNodes();
    if (this.playRealBgm('bgm-night')) {
      this.currentPageMusic = 'night';
      return;
    }
    this.currentPageMusic = 'night';

    const drone = this.genAmbientDrone(45, 'sawtooth', 0.08, 80);
    if (drone) this.bgmNodes.push(drone);

    const pad = this.genPad(90, 0.03, 200);
    if (pad) this.bgmNodes.push(pad);

    const melody = this.genMelody([220, 196, 165, 146], 3, 0.02);
    if (melody) this.bgmNodes.push(melody);
  }

  startDayMusic() {
    if (this.currentPageMusic === 'day') return;
    this.stopBgmNodes();
    if (this.playRealBgm('bgm-day')) {
      this.currentPageMusic = 'day';
      return;
    }
    this.currentPageMusic = 'day';

    const pad = this.genPad(220, 0.05, 600);
    if (pad) this.bgmNodes.push(pad);

    const pulse = this.genPulse2(70, 0.04, false);
    if (pulse) this.bgmNodes.push(pulse);

    const melody = this.genMelody([523, 659, 784, 1047, 784, 659], 1.2, 0.04);
    if (melody) this.bgmNodes.push(melody);
  }

  startVotingMusic() {
    if (this.currentPageMusic === 'voting') return;
    this.stopBgmNodes();
    if (this.playRealBgm('bgm-voting')) {
      this.currentPageMusic = 'voting';
      return;
    }
    this.currentPageMusic = 'voting';

    const drone = this.genAmbientDrone(60, 'square', 0.06, 100);
    if (drone) this.bgmNodes.push(drone);

    const pulse = this.genPulse2(90, 0.1, true);
    if (pulse) this.bgmNodes.push(pulse);
  }

  stopPageMusic() {
    this.stopBgmNodes();
    this.currentPageMusic = null;
  }

  stopCurrentPageMusic() {
    this.stopPageMusic();
  }

  /* ── Phase music overrides ── */

  startPhaseMusic(phase: string) {
    if (phase === 'night') this.startNightMusic();
    else if (phase === 'day') this.startDayMusic();
    else if (phase === 'voting') this.startVotingMusic();
    else if (phase === 'ended') this.stopPageMusic();
    else if (phase === 'lobby') this.startLobbyMusic();
  }
}

export const sound = new SoundEngine();
export function setSoundMuted(muted: boolean) { sound.setMuted(muted); }
export function isSoundMuted(): boolean { return sound.muted; }
