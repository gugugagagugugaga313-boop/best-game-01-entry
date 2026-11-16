// All sound is synthesized with WebAudio: no audio files, no network, and the
// mix stays quiet enough that the game never shouts at the player.
export class SoundBank {
  constructor() {
    this.context = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.musicOn = false;
    this.musicStep = 0;
    this.musicTimer = 0;
    this.lastShotAt = 0;
    this.now = 0;
  }

  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return true;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    try {
      this.context = new AudioContextClass();
    } catch {
      return false;
    }
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.context.destination);
    this.musicGain = this.context.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.5, this.context.currentTime, 0.02);
    }
    return this.muted;
  }

  tone({ frequency, endFrequency, duration, type = 'sine', volume = 0.2, delay = 0, music = false }) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(music ? this.musicGain : this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  noise({ duration, volume = 0.15, delay = 0, lowpass = 1200 }) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + delay;
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start);
  }

  shoot() {
    if (this.now - this.lastShotAt < 0.05) return;
    this.lastShotAt = this.now;
    this.tone({ frequency: 880, endFrequency: 320, duration: 0.07, type: 'triangle', volume: 0.08 });
  }

  enemyHit() {
    this.tone({ frequency: 240, endFrequency: 140, duration: 0.06, type: 'square', volume: 0.06 });
  }

  enemyDown() {
    this.noise({ duration: 0.16, volume: 0.14, lowpass: 900 });
    this.tone({ frequency: 320, endFrequency: 60, duration: 0.18, type: 'sawtooth', volume: 0.07 });
  }

  playerHurt() {
    this.tone({ frequency: 160, endFrequency: 70, duration: 0.22, type: 'sawtooth', volume: 0.16 });
    this.noise({ duration: 0.12, volume: 0.1, lowpass: 700 });
  }

  emberHurt() {
    this.tone({ frequency: 110, endFrequency: 55, duration: 0.3, type: 'sine', volume: 0.2 });
  }

  pickup() {
    this.tone({ frequency: 660, duration: 0.08, type: 'sine', volume: 0.14 });
    this.tone({ frequency: 990, duration: 0.12, type: 'sine', volume: 0.14, delay: 0.07 });
  }

  dash() {
    this.noise({ duration: 0.14, volume: 0.09, lowpass: 2400 });
  }

  nova() {
    this.tone({ frequency: 90, endFrequency: 480, duration: 0.4, type: 'sine', volume: 0.22 });
    this.noise({ duration: 0.35, volume: 0.12, lowpass: 1600 });
  }

  boon() {
    [523, 659, 784].forEach((frequency, i) => {
      this.tone({ frequency, duration: 0.14, type: 'triangle', volume: 0.12, delay: i * 0.08 });
    });
  }

  waveStart() {
    this.tone({ frequency: 392, duration: 0.16, type: 'triangle', volume: 0.13 });
    this.tone({ frequency: 523, duration: 0.22, type: 'triangle', volume: 0.13, delay: 0.12 });
  }

  bossRoar() {
    this.tone({ frequency: 70, endFrequency: 45, duration: 0.7, type: 'sawtooth', volume: 0.18 });
    this.tone({ frequency: 140, endFrequency: 90, duration: 0.7, type: 'square', volume: 0.08 });
  }

  victory() {
    [523, 659, 784, 1047, 784, 1047].forEach((frequency, i) => {
      this.tone({ frequency, duration: 0.22, type: 'triangle', volume: 0.14, delay: i * 0.13 });
    });
  }

  gameOver() {
    [392, 330, 262, 196].forEach((frequency, i) => {
      this.tone({ frequency, duration: 0.3, type: 'triangle', volume: 0.13, delay: i * 0.18 });
    });
  }

  click() {
    this.tone({ frequency: 740, duration: 0.05, type: 'sine', volume: 0.1 });
  }

  // A quiet sequenced loop: deep bass pulse, sparse arpeggio, no melody to
  // fight the sound effects. Advanced from the fixed-step update.
  updateMusic(dt, intense) {
    if (!this.context || this.muted) return;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    this.musicTimer = intense ? 0.21 : 0.26;
    const bass = [110, 110, 130.8, 98][this.musicStep % 4];
    const arp = [440, 523.25, 659.25, 523.25, 587.33, 440, 392, 493.88];
    if (this.musicStep % 2 === 0) {
      this.tone({ frequency: bass, duration: 0.3, type: 'sine', volume: 0.5, music: true });
    }
    if (this.musicStep % 4 === 1 || this.musicStep % 4 === 3) {
      this.tone({ frequency: arp[this.musicStep % arp.length], duration: 0.18, type: 'triangle', volume: 0.22, music: true });
    }
    this.musicStep += 1;
  }

  tick(dt) {
    this.now += dt;
  }
}
