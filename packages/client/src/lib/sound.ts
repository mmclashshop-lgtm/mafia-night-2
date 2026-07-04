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

  private vol: VolumeState = { master: 0.7, bgm: 0.5, sfx: 0.6, ui: 0.4 };
  private sounds: Map<string, Howl> = new Map();
  private proceduralNodes: Map<string, { stop: () => void }> = new Map();

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
      panner.pan.value = (i / (notes.length - 1)) * 0.6 - 0.3;
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

  private ensureSound(key: string): Howl | undefined {
    if (this.erroredKeys.has(key)) return undefined;
    let howl = this.sounds.get(key);
    if (howl) return howl;
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
    this.stopProcedural('bgm');
  }

  private stopProcedural(key: string) {
    const node = this.proceduralNodes.get(key);
    if (node) {
      node.stop();
      this.proceduralNodes.delete(key);
    }
  }

  /* ══════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════ */

  phaseChange() {
    if (this.playSound('click', 0.3, 1.5) === null) {
      this.playTone(660, 0.06, 'sine', 0.05);
      setTimeout(() => this.playTone(880, 0.08, 'sine', 0.04), 50);
    }
  }

  nightStart() {
    this.stopBgm();
    if (!this.playBgm('bgm-night', 0.3)) {
      const node = this.genAmbientDrone(55, 'sawtooth', 0.08, 80);
      if (node) this.proceduralNodes.set('bgm', node);
      setTimeout(() => this.genImpact(40, 120, 1.2, 0.12, 0.4), 100);
    }
  }

  nightEnd() {
    this.stopBgm();
  }

  dayStart() {
    this.stopBgm();
    if (!this.playBgm('bgm-day', 0.3)) {
      this.genChord([262, 330, 392, 523], 0.8, 'sine', 0.1, 0, 0.5);
    }
  }

  voteStart() {
    if (!this.playBgm('bgm-voting', 0.3)) {
      this.genPulse(90, 0.06);
      this.playTone(440, 0.12, 'square', 0.03);
    }
  }

  playerDied() {
    if (this.playSound('player-killed', 0.5) === null) {
      this.genImpact(50, 250, 1.0, 0.25, 0.3);
    }
  }

  voteCast() {
    if (this.playSound('vote-cast', 0.4) === null) {
      this.genChord([600, 800], 0.12, 'sine', 0.04, 0, 0.15);
    }
  }

  voteResult() {
    if (this.playSound('vote-result', 0.5) === null) {
      this.genChord([500, 700, 900], 0.35, 'triangle', 0.06, 0, 0.3);
      setTimeout(() => this.genImpact(40, 100, 0.3, 0.18, 0.2), 280);
    }
  }

  lynch() {
    if (this.playSound('player-lynched', 0.5) === null) {
      this.genImpact(30, 300, 1.2, 0.35, 0.35);
    }
  }

  gameEnd() {
    this.stopBgm();
    this.playBgm('bgm-death', 0.2);
  }

  mafiaWin() {
    this.stopBgm();
    if (!this.playBgm('bgm-mafia-win', 0.4)) {
      this.genChord([196, 233, 277, 330], 1.0, 'sawtooth', 0.08, 0, 0.5);
      setTimeout(() => this.genChord([165, 196, 233, 277], 1.2, 'sawtooth', 0.06, 0, 0.5), 600);
      setTimeout(() => this.genImpact(40, 80, 0.7, 0.25, 0.3), 1500);
    }
  }

  townWin() {
    this.stopBgm();
    if (!this.playBgm('bgm-town-win', 0.4)) {
      this.genChord([523, 659, 784, 1047], 0.6, 'sine', 0.12, 0, 0.4);
      setTimeout(() => this.genChord([659, 784, 1047, 1319], 1.0, 'sine', 0.1, 0, 0.4), 450);
    }
  }

  jesterWin() {
    this.stopBgm();
    if (this.playSound('click', 0.5, 2.0) === null) {
      this.genChord([400, 500, 600, 800], 0.25, 'triangle', 0.06, 0, 0.3);
    } else {
      setTimeout(() => this.playSound('click', 0.4, 1.8), 200);
      setTimeout(() => this.playSound('click', 0.3, 1.6), 400);
      setTimeout(() => this.playSound('success', 0.4), 600);
    }
  }

  click() {
    if (this.playSound('click', 0.2) === null) {
      this.playTone(800, 0.025, 'sine', 0.035);
    }
  }

  roleReveal() {
    if (this.playSound('role-reveal', 0.5) === null) {
      this.genSweep(200, 800, 0.4, 'sine', 0.08);
      setTimeout(() => this.genChord([523, 784], 0.3, 'sine', 0.04), 300);
    }
  }

  loversDeath() {
    if (this.playSound('player-killed', 0.3, 0.7) === null) {
      this.genChord([349, 440, 523], 0.7, 'sine', 0.05, 0, 0.4);
    }
  }

  heal() {
    if (this.playSound('heal', 0.4) === null) {
      this.genChord([523, 659, 784], 0.4, 'sine', 0.06, 0, 0.2);
    }
  }

  investigate() {
    if (this.playSound('investigate', 0.4) === null) {
      this.genSweep(600, 1200, 0.3, 'sine', 0.04);
      setTimeout(() => this.genSweep(1200, 600, 0.3, 'sine', 0.03), 200);
    }
  }

  notification() {
    if (this.playSound('notification', 0.3) === null) {
      this.playTone(880, 0.08, 'sine', 0.05);
      setTimeout(() => this.playTone(1100, 0.1, 'sine', 0.04), 80);
    }
  }

  error() {
    if (this.playSound('error', 0.4) === null) {
      this.playTone(220, 0.15, 'sawtooth', 0.05);
      setTimeout(() => this.playTone(180, 0.25, 'sawtooth', 0.04), 120);
    }
  }

  success() {
    if (this.playSound('success', 0.3) === null) {
      this.genChord([523, 784, 1047], 0.35, 'sine', 0.06, 0, 0.3);
    }
  }

  chatMessage(isMafia = false) {
    if (isMafia) {
      if (this.playSound('mafia-chat', 0.2) === null) {
        this.playTone(200, 0.035, 'sine', 0.025);
      }
    } else if (this.playSound('chat-message', 0.2) === null) {
      this.playTone(600, 0.035, 'sine', 0.025);
    }
  }

  friendOnline() {
    if (this.playSound('friend-online', 0.3) === null) {
      this.playTone(700, 0.06, 'sine', 0.04);
    }
  }

  friendRequest() {
    if (this.playSound('friend-request', 0.3) === null) {
      this.genChord([500, 700], 0.18, 'sine', 0.05, 0, 0.15);
    }
  }

  partyInvite() {
    if (this.playSound('party-invite', 0.3) === null) {
      this.genChord([400, 600, 800], 0.25, 'triangle', 0.05, 0, 0.2);
    }
  }

  matchFound() {
    if (this.playSound('match-found', 0.5) === null) {
      this.genChord([523, 659, 784, 1047], 0.45, 'sine', 0.1, 0, 0.35);
    }
  }

  gameStart() {
    if (this.playSound('game-start', 0.5) === null) {
      this.genChord([330, 440, 550], 0.25, 'square', 0.04, 0, 0.15);
      setTimeout(() => this.genChord([440, 550, 660], 0.25, 'square', 0.04, 0, 0.15), 250);
      setTimeout(() => this.genChord([550, 660, 880], 0.5, 'square', 0.06, 0, 0.25), 500);
      setTimeout(() => this.genImpact(60, 120, 0.4, 0.15, 0.2), 850);
    }
  }

  coinEarn() {
    if (this.playSound('coin-earn', 0.3) === null) {
      this.playTone(1200, 0.05, 'sine', 0.04);
      setTimeout(() => this.playTone(1500, 0.06, 'sine', 0.035), 50);
    }
  }

  coinSpend() {
    if (this.playSound('coin-spend', 0.3) === null) {
      this.playTone(600, 0.06, 'sine', 0.04);
      setTimeout(() => this.playTone(400, 0.08, 'sine', 0.035), 70);
    }
  }

  achievement() {
    if (this.playSound('achievement', 0.4) === null) {
      this.genChord([659, 784, 1047, 1319], 0.5, 'sine', 0.08, 0, 0.35);
    }
  }

  levelUp() {
    if (this.playSound('level-up', 0.4) === null) {
      this.genChord([523, 659, 784, 1047, 1319], 0.65, 'triangle', 0.08, 0, 0.4);
    }
  }

  hover() {
    if (this.playSound('hover', 0.1) === null) {
      this.playTone(1000, 0.015, 'sine', 0.015);
    }
  }

  pageTransition() {
    if (this.playSound('page-transition', 0.2) === null) {
      this.genSweep(400, 800, 0.18, 'sine', 0.03);
    }
  }

  lobbyMusic() {
    if (!this.playBgm('bgm-lobby', 0.2)) {
      this.genChord([262, 330, 392], 0.8, 'sine', 0.025, 0, 0.5);
    }
  }

  stopAmbient() {
    this.stopBgm();
  }
}

export const sound = new SoundEngine();
export function setSoundMuted(muted: boolean) { sound.setMuted(muted); }
export function isSoundMuted(): boolean { return sound.muted; }
