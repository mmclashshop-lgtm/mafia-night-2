import { Howl, Howler } from 'howler';

type OscType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface SoundConfig {
  src: string[];
  volume?: number;
  loop?: boolean;
  rate?: number;
}

interface VolumeState {
  master: number;
  bgm: number;
  sfx: number;
  ui: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private volumeNode: GainNode | null = null;
  private bgmNode: GainNode | null = null;
  private sfxNode: GainNode | null = null;
  private uiNode: GainNode | null = null;

  private bgmHowl: Howl | null = null;
  private bgmId: number | null = null;
  private currentBgm: string | null = null;

  private _muted = false;
  private _loaded = false;
  private _loadingProgress = 0;

  private vol: VolumeState = { master: 0.7, bgm: 0.5, sfx: 0.6, ui: 0.4 };
  private sounds: Map<string, Howl> = new Map();

  private proceduralNodes: Map<string, { stop: () => void }> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.ctx = new AudioContext();
        this.analyser = this.ctx.createAnalyser();
        this.volumeNode = this.ctx.createGain();
        this.volumeNode.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.bgmNode = this.ctx.createGain();
        this.bgmNode.connect(this.volumeNode);
        this.sfxNode = this.ctx.createGain();
        this.sfxNode.connect(this.volumeNode);
        this.uiNode = this.ctx.createGain();
        this.uiNode.connect(this.volumeNode);
        this.updateVolumes();
      } catch { }
    }
  }

  private updateVolumes() {
    if (this.volumeNode) this.volumeNode.gain.value = this._muted ? 0 : this.vol.master;
    if (this.bgmNode) this.bgmNode.gain.value = this._muted ? 0 : this.vol.bgm;
    if (this.sfxNode) this.sfxNode.gain.value = this._muted ? 0 : this.vol.sfx;
    if (this.uiNode) this.uiNode.gain.value = this._muted ? 0 : this.vol.ui;
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

  private ensureCtx() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private createNoiseBuffer(duration: number, type: 'white' | 'pink' | 'brown' = 'brown'): AudioBuffer | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const sr = ctx.sampleRate;
    const length = sr * duration;
    const buffer = ctx.createBuffer(1, length, sr);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        data[i] = white;
      } else if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        data[i] = (b0 + b1 + white) / 3;
      } else {
        b0 = 0.9 * b0 + white * 0.1;
        data[i] = b0;
      }
    }
    return buffer;
  }

  private get sfxDest(): GainNode { return this.sfxNode ?? this.volumeNode ?? this.ctx!.destination as unknown as GainNode; }
  private get bgmDest(): GainNode { return this.bgmNode ?? this.volumeNode ?? this.ctx!.destination as unknown as GainNode; }
  private get uiDest(): GainNode { return this.uiNode ?? this.volumeNode ?? this.ctx!.destination as unknown as GainNode; }

  private playBuffer(buffer: AudioBuffer, volume = 1, loop = false, dest?: GainNode, rate = 1): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = loop;
    src.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(dest ?? this.sfxDest);
    src.start();
    return { stop: () => { try { src.stop(); } catch { } } };
  }

  private genAmbientDrone(freq: number, type: OscType = 'sine', volume = 0.3, filterFreq = 200): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.bgmDest;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc1.type = type;
    osc1.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    osc2.detune.value = 5;

    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1;

    lfo.type = 'sine';
    lfo.frequency.value = 0.2;
    lfoGain.gain.value = 3;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    gain.gain.value = volume;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start();
    osc2.start();

    return {
      stop: () => {
        try {
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
          setTimeout(() => { try { osc1.stop(); osc2.stop(); lfo.stop(); } catch { } }, 500);
        } catch { }
      }
    };
  }

  private genImpact(lowFreq = 60, highFreq = 200, dur = 0.6, vol = 0.5): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.sfxDest;
    const noise = this.createNoiseBuffer(dur, 'brown');
    if (!noise) return null;
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noise;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(highFreq, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(lowFreq, ctx.currentTime + dur);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(lowFreq * 2, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(lowFreq, ctx.currentTime + dur * 0.5);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(vol * 0.5, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);
    osc.connect(oscGain);
    oscGain.connect(dest);

    noiseSrc.start();
    osc.start();
    osc.stop(ctx.currentTime + dur);

    return { stop: () => { try { noiseSrc.stop(); osc.stop(); } catch { } } };
  }

  private genChord(notes: number[], dur = 0.8, type: OscType = 'sine', vol = 0.25, delay = 0): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.sfxDest;
    const oscs: OscillatorNode[] = [];
    const startTime = ctx.currentTime + delay;

    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
      gain.gain.setValueAtTime(vol, startTime + dur - 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(startTime);
      osc.stop(startTime + dur);
      oscs.push(osc);
    });

    return { stop: () => oscs.forEach(o => { try { o.stop(); } catch { } }) };
  }

  private genSweep(fromFreq: number, toFreq: number, dur: number, type: OscType = 'sine', vol = 0.2): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.sfxDest;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(fromFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(toFreq, ctx.currentTime + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + dur);
    return { stop: () => { try { osc.stop(); } catch { } } };
  }

  private genPulse(bpm = 120, vol = 0.15): { stop: () => void } | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const dest = this.sfxDest;
    const interval = 60 / bpm / 2;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 40;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    let count = 0;
    const maxBeats = 20;
    const schedule = () => {
      if (count >= maxBeats) return;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.02);
      gain.gain.setValueAtTime(vol, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + interval * 0.8);
      count++;
      setTimeout(schedule, interval * 1000);
    };
    schedule();
    return { stop: () => { try { osc.stop(); } catch { } } };
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
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.uiDest);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  /* ===== SOUND PACK LOADER ===== */

  private getSoundPath(name: string, category: string): string {
    const prefix = import.meta.env.BASE_URL || '/';
    return `${prefix}sounds/${category}/${name}.mp3`;
  }

  async loadSoundPack(): Promise<boolean> {
    const manifest: Array<{ name: string; category: string; key: string }> = [
      // Phase
      { name: 'night-falls', category: 'sfx/phase', key: 'night-falls' },
      { name: 'morning-arrives', category: 'sfx/phase', key: 'morning-arrives' },
      { name: 'vote-starts', category: 'sfx/phase', key: 'vote-starts' },
      // Events
      { name: 'player-killed', category: 'sfx/events', key: 'player-killed' },
      { name: 'player-lynched', category: 'sfx/events', key: 'player-lynched' },
      { name: 'vote-cast', category: 'sfx/events', key: 'vote-cast' },
      { name: 'vote-result', category: 'sfx/events', key: 'vote-result' },
      { name: 'role-reveal', category: 'sfx/events', key: 'role-reveal' },
      { name: 'heal', category: 'sfx/events', key: 'heal' },
      { name: 'investigate', category: 'sfx/events', key: 'investigate' },
      // UI
      { name: 'click', category: 'sfx/ui', key: 'click' },
      { name: 'hover', category: 'sfx/ui', key: 'hover' },
      { name: 'notification', category: 'sfx/ui', key: 'notification' },
      { name: 'error', category: 'sfx/ui', key: 'error' },
      { name: 'success', category: 'sfx/ui', key: 'success' },
      { name: 'page-transition', category: 'sfx/ui', key: 'page-transition' },
      { name: 'chat-message', category: 'sfx/ui', key: 'chat-message' },
      { name: 'mafia-chat', category: 'sfx/ui', key: 'mafia-chat' },
      // Social
      { name: 'friend-online', category: 'sfx/social', key: 'friend-online' },
      { name: 'friend-request', category: 'sfx/social', key: 'friend-request' },
      { name: 'party-invite', category: 'sfx/social', key: 'party-invite' },
      { name: 'match-found', category: 'sfx/social', key: 'match-found' },
      { name: 'game-start', category: 'sfx/social', key: 'game-start' },
      // Economy
      { name: 'coin-earn', category: 'sfx/economy', key: 'coin-earn' },
      { name: 'coin-spend', category: 'sfx/economy', key: 'coin-spend' },
      { name: 'achievement', category: 'sfx/economy', key: 'achievement' },
      { name: 'level-up', category: 'sfx/economy', key: 'level-up' },
      // BGM
      { name: 'main-theme', category: 'bgm', key: 'bgm-main' },
      { name: 'night-ambient', category: 'bgm', key: 'bgm-night' },
      { name: 'day-theme', category: 'bgm', key: 'bgm-day' },
      { name: 'voting-tension', category: 'bgm', key: 'bgm-voting' },
      { name: 'mafia-win', category: 'bgm', key: 'bgm-mafia-win' },
      { name: 'town-win', category: 'bgm', key: 'bgm-town-win' },
      { name: 'death-theme', category: 'bgm', key: 'bgm-death' },
      { name: 'lobby-music', category: 'bgm', key: 'bgm-lobby' },
    ];

    let loaded = 0;
    const total = manifest.length;

    for (const entry of manifest) {
      try {
        const url = this.getSoundPath(entry.name, entry.category);
        const howl = new Howl({
          src: [url],
          volume: 0.7,
          preload: true,
          onload: () => {
            loaded++;
            this._loadingProgress = loaded / total;
          },
          onloaderror: () => {
            loaded++;
            this._loadingProgress = loaded / total;
          }
        });
        this.sounds.set(entry.key, howl);
      } catch {
        loaded++;
        this._loadingProgress = loaded / total;
      }
    }

    await new Promise<void>((resolve) => {
      const check = () => {
        if (loaded >= total) resolve();
        else setTimeout(check, 100);
      };
      setTimeout(check, 2000);
    });

    this._loaded = this.sounds.size > 0;
    return this._loaded;
  }

  private playSound(key: string, vol = 1, rate = 1): number | null {
    if (this._muted) return null;
    const howl = this.sounds.get(key);
    if (howl) {
      howl.volume(vol);
      howl.rate(rate);
      return howl.play();
    }
    return null;
  }

  private playBgm(key: string, vol = 1) {
    if (this._muted) return;
    if (this.currentBgm === key && this.bgmHowl) return;
    this.stopBgm();
    const howl = this.sounds.get(key);
    if (howl) {
      this.bgmHowl = howl;
      this.bgmId = howl.play();
      howl.volume(vol);
      howl.loop(true);
      this.currentBgm = key;
    }
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

  /* ===== PUBLIC API — Matching old interface ===== */

  phaseChange() {
    if (this.sounds.has('click')) {
      this.playSound('click', 0.3, 1.5);
    } else {
      this.playTone(660, 0.08, 'sine', 0.06);
      setTimeout(() => this.playTone(880, 0.1, 'sine', 0.05), 60);
    }
  }

  nightStart() {
    this.stopBgm();
    if (this.sounds.has('bgm-night')) {
      this.playBgm('bgm-night', 0.3);
    } else {
      const node = this.genAmbientDrone(55, 'sawtooth', 0.08, 80);
      if (node) this.proceduralNodes.set('bgm', node);
      this.genImpact(40, 120, 0.8, 0.15);
    }
  }

  nightEnd() {
    this.stopBgm();
  }

  dayStart() {
    this.stopBgm();
    if (this.sounds.has('bgm-day')) {
      this.playBgm('bgm-day', 0.3);
    } else {
      this.genChord([262, 330, 392, 523], 0.6, 'sine', 0.12);
    }
  }

  voteStart() {
    if (this.sounds.has('bgm-voting')) {
      this.playBgm('bgm-voting', 0.3);
    } else {
      this.genPulse(100, 0.08);
      this.playTone(440, 0.15, 'square', 0.05);
    }
  }

  playerDied() {
    if (this.sounds.has('player-killed')) {
      this.playSound('player-killed', 0.5);
    } else {
      this.genImpact(50, 250, 0.8, 0.3);
    }
  }

  voteCast() {
    if (this.sounds.has('vote-cast')) {
      this.playSound('vote-cast', 0.4);
    } else {
      this.genChord([600, 800], 0.15, 'sine', 0.06);
    }
  }

  voteResult() {
    if (this.sounds.has('vote-result')) {
      this.playSound('vote-result', 0.5);
    } else {
      this.genChord([500, 700, 900], 0.3, 'triangle', 0.08);
      setTimeout(() => this.genImpact(40, 100, 0.3, 0.2), 250);
    }
  }

  lynch() {
    if (this.sounds.has('player-lynched')) {
      this.playSound('player-lynched', 0.5);
    } else {
      this.genImpact(30, 300, 1.0, 0.4);
    }
  }

  gameEnd() {
    this.stopBgm();
    if (this.sounds.has('bgm-death')) {
      this.playBgm('bgm-death', 0.2);
    }
  }

  mafiaWin() {
    this.stopBgm();
    if (this.sounds.has('bgm-mafia-win')) {
      this.playBgm('bgm-mafia-win', 0.4);
    } else {
      this.genChord([196, 233, 277, 330], 0.8, 'sawtooth', 0.1);
      setTimeout(() => this.genChord([165, 196, 233, 277], 1.0, 'sawtooth', 0.08), 600);
      setTimeout(() => this.genImpact(40, 80, 0.6, 0.3), 1400);
    }
  }

  townWin() {
    this.stopBgm();
    if (this.sounds.has('bgm-town-win')) {
      this.playBgm('bgm-town-win', 0.4);
    } else {
      this.genChord([523, 659, 784, 1047], 0.5, 'sine', 0.15);
      setTimeout(() => this.genChord([659, 784, 1047, 1319], 0.8, 'sine', 0.12), 400);
    }
  }

  jesterWin() {
    this.stopBgm();
    if (this.sounds.has('click')) {
      this.playSound('click', 0.5, 2.0);
      setTimeout(() => this.playSound('click', 0.4, 1.8), 200);
      setTimeout(() => this.playSound('click', 0.3, 1.6), 400);
      setTimeout(() => this.playSound('success', 0.4), 600);
    } else {
      this.genChord([400, 500, 600, 800], 0.3, 'triangle', 0.08);
    }
  }

  click() {
    if (this.sounds.has('click')) {
      this.playSound('click', 0.2);
    } else {
      this.playTone(800, 0.03, 'sine', 0.04);
    }
  }

  roleReveal() {
    if (this.sounds.has('role-reveal')) {
      this.playSound('role-reveal', 0.5);
    } else {
      this.genSweep(200, 800, 0.4, 'sine', 0.1);
    }
  }

  loversDeath() {
    if (this.sounds.has('player-killed')) {
      this.playSound('player-killed', 0.3, 0.7);
    } else {
      this.genChord([349, 440, 523], 0.6, 'sine', 0.06);
    }
  }

  heal() {
    if (this.sounds.has('heal')) {
      this.playSound('heal', 0.4);
    } else {
      this.genChord([523, 659, 784], 0.4, 'sine', 0.08);
    }
  }

  investigate() {
    if (this.sounds.has('investigate')) {
      this.playSound('investigate', 0.4);
    } else {
      this.genSweep(600, 1200, 0.3, 'sine', 0.05);
      setTimeout(() => this.genSweep(1200, 600, 0.3, 'sine', 0.04), 200);
    }
  }

  notification() {
    if (this.sounds.has('notification')) {
      this.playSound('notification', 0.3);
    } else {
      this.playTone(880, 0.1, 'sine', 0.06);
      setTimeout(() => this.playTone(1100, 0.12, 'sine', 0.05), 100);
    }
  }

  error() {
    if (this.sounds.has('error')) {
      this.playSound('error', 0.4);
    } else {
      this.playTone(220, 0.2, 'sawtooth', 0.06);
      setTimeout(() => this.playTone(180, 0.3, 'sawtooth', 0.05), 150);
    }
  }

  success() {
    if (this.sounds.has('success')) {
      this.playSound('success', 0.3);
    } else {
      this.genChord([523, 784, 1047], 0.3, 'sine', 0.08);
    }
  }

  chatMessage(isMafia = false) {
    if (isMafia && this.sounds.has('mafia-chat')) {
      this.playSound('mafia-chat', 0.2);
    } else if (this.sounds.has('chat-message')) {
      this.playSound('chat-message', 0.2);
    } else {
      this.playTone(isMafia ? 200 : 600, 0.04, 'sine', 0.03);
    }
  }

  friendOnline() {
    if (this.sounds.has('friend-online')) {
      this.playSound('friend-online', 0.3);
    } else {
      this.playTone(700, 0.08, 'sine', 0.05);
    }
  }

  friendRequest() {
    if (this.sounds.has('friend-request')) {
      this.playSound('friend-request', 0.3);
    } else {
      this.genChord([500, 700], 0.2, 'sine', 0.06);
    }
  }

  partyInvite() {
    if (this.sounds.has('party-invite')) {
      this.playSound('party-invite', 0.3);
    } else {
      this.genChord([400, 600, 800], 0.25, 'triangle', 0.07);
    }
  }

  matchFound() {
    if (this.sounds.has('match-found')) {
      this.playSound('match-found', 0.5);
    } else {
      this.genChord([523, 659, 784, 1047], 0.4, 'sine', 0.12);
    }
  }

  gameStart() {
    if (this.sounds.has('game-start')) {
      this.playSound('game-start', 0.5);
    } else {
      this.genChord([330, 440, 550], 0.3, 'square', 0.06);
      setTimeout(() => this.genChord([440, 550, 660], 0.3, 'square', 0.06), 300);
      setTimeout(() => this.genChord([550, 660, 880], 0.5, 'square', 0.08), 600);
    }
  }

  coinEarn() {
    if (this.sounds.has('coin-earn')) {
      this.playSound('coin-earn', 0.3);
    } else {
      this.playTone(1200, 0.06, 'sine', 0.05);
      setTimeout(() => this.playTone(1500, 0.08, 'sine', 0.04), 60);
    }
  }

  coinSpend() {
    if (this.sounds.has('coin-spend')) {
      this.playSound('coin-spend', 0.3);
    } else {
      this.playTone(600, 0.08, 'sine', 0.05);
      setTimeout(() => this.playTone(400, 0.1, 'sine', 0.04), 80);
    }
  }

  achievement() {
    if (this.sounds.has('achievement')) {
      this.playSound('achievement', 0.4);
    } else {
      this.genChord([659, 784, 1047, 1319], 0.5, 'sine', 0.1);
    }
  }

  levelUp() {
    if (this.sounds.has('level-up')) {
      this.playSound('level-up', 0.4);
    } else {
      this.genChord([523, 659, 784, 1047, 1319], 0.6, 'triangle', 0.1);
    }
  }

  hover() {
    if (this.sounds.has('hover')) {
      this.playSound('hover', 0.1);
    } else {
      this.playTone(1000, 0.02, 'sine', 0.02);
    }
  }

  pageTransition() {
    if (this.sounds.has('page-transition')) {
      this.playSound('page-transition', 0.2);
    } else {
      this.genSweep(400, 800, 0.2, 'sine', 0.04);
    }
  }

  lobbyMusic() {
    if (this.sounds.has('bgm-lobby')) {
      this.playBgm('bgm-lobby', 0.2);
    } else {
      this.genChord([262, 330, 392], 0.8, 'sine', 0.03);
    }
  }

  stopAmbient() {
    this.stopBgm();
  }
}

export const sound = new SoundEngine();
export function setSoundMuted(muted: boolean) { sound.setMuted(muted); }
export function isSoundMuted(): boolean { return sound.muted; }
