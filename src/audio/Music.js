// ═══════════════════════════════════════════════════════
//  MUSIC : Procedural WebAudio synth (chiptune / synthwave)
//  Exposes window.GameMusic with play(trackName) / stop() / setVolume()
// ═══════════════════════════════════════════════════════

(function () {
  const NOTE = {
    // MIDI-ish note names → frequency (A4=440)
    freq(n) {
      // n is a semitone offset from A4
      return 440 * Math.pow(2, n / 12);
    },
  };

  // Scales expressed as semitone offsets from a root
  const SCALES = {
    minor:  [0, 2, 3, 5, 7, 8, 10, 12],
    major:  [0, 2, 4, 5, 7, 9, 11, 12],
    phryg:  [0, 1, 3, 5, 7, 8, 10, 12],
  };

  // Tracks: each returns notes per step (16-step bars)
  const TRACKS = {
    menu: {
      // Atmospheric synthwave menu theme : i / VI / III / VII (minor)
      bpm: 84,
      root: -9,           // C minor
      scale: 'minor',
      bars: 4,
      voices: ['pad', 'bass', 'lead', 'arp', 'drum'],
      pad: (step, bar, scale) => {
        if (step % 8 !== 0) return null;
        // i, VI, III, VII chord progression
        const prog = [
          [scale[0], scale[2], scale[4]],
          [scale[5], scale[0] + 7, scale[2] + 7],
          [scale[2], scale[4], scale[6]],
          [scale[6] - 12, scale[1], scale[4]],
        ];
        return { notes: prog[bar % 4], dur: 2.0, vel: 0.24, type: 'sine' };
      },
      bass: (step, bar, scale) => {
        if (step % 4 !== 0) return null;
        const roots = [scale[0], scale[5], scale[2], scale[6] - 12];
        return { notes: [roots[bar % 4] - 24], dur: 0.4, vel: 0.34, type: 'triangle' };
      },
      lead: (step, bar, scale) => {
        // Slow lead melody, only on bars 0 and 2
        if (bar % 2 !== 0) return null;
        const pat = [
          0, null, null, 2, null, null, 4, null,
          2, null, 0, null, null, null, null, null
        ];
        const p = pat[step];
        if (p === null || p === undefined) return null;
        return { notes: [scale[p] + 12], dur: 0.45, vel: 0.18, type: 'sawtooth' };
      },
      arp: (step, bar, scale) => {
        if (step % 2 !== 0) return null;
        const seq = [0, 2, 4, 7, 4, 2, 4, 7];
        const idx = seq[(step / 2) % seq.length];
        return { notes: [scale[idx] + 12], dur: 0.18, vel: 0.11, type: 'triangle' };
      },
      drum: (step) => {
        if (step % 8 === 0) return { drum: 'kick', vel: 0.32 };
        if (step % 8 === 4) return { drum: 'snare', vel: 0.18 };
        if (step % 4 === 2) return { drum: 'hat', vel: 0.08 };
        return null;
      },
    },
    intro: {
      // Chill / hopeful opener for World 1 Level 1
      bpm: 96,
      root: -7,           // D4
      scale: 'major',
      bars: 4,
      voices: ['pad', 'bass', 'arp', 'lead', 'drum'],
      pad: (step, bar, scale) => {
        if (step % 8 !== 0) return null;
        // Ii - vi - IV - V progression across bars
        const prog = [
          [scale[0], scale[2], scale[4]],
          [scale[5], scale[0] + 7, scale[2] + 7],
          [scale[3], scale[5], scale[0] + 7],
          [scale[4], scale[6], scale[1] + 7],
        ];
        return { notes: prog[bar % 4], dur: 1.8, vel: 0.22, type: 'sine' };
      },
      bass: (step, bar, scale) => {
        if (step % 4 !== 0) return null;
        const roots = [scale[0], scale[5], scale[3], scale[4]];
        return { notes: [roots[bar % 4] - 24], dur: 0.3, vel: 0.32, type: 'triangle' };
      },
      arp: (step, bar, scale) => {
        if (step % 2 !== 0) return null;
        const seq = [0, 2, 4, 7, 4, 2, 4, 7];
        return { notes: [scale[seq[(step / 2) % seq.length]] + 12], dur: 0.15, vel: 0.1, type: 'triangle' };
      },
      lead: (step, bar, scale) => {
        // Simple melody on bars 1 and 3
        if (bar % 2 !== 0) return null;
        const pat = [null, null, 4, null, 2, null, 0, null, null, 2, 4, null, 5, null, 4, null];
        const p = pat[step];
        if (p === null || p === undefined) return null;
        return { notes: [scale[p] + 12], dur: 0.25, vel: 0.14, type: 'sine' };
      },
      drum: (step) => {
        if (step % 8 === 0) return { drum: 'kick', vel: 0.4 };
        if (step % 8 === 4) return { drum: 'snare', vel: 0.22 };
        if (step % 4 === 2) return { drum: 'hat', vel: 0.1 };
        return null;
      },
    },
    game: {
      bpm: 128,
      root: -9,           // C4
      scale: 'minor',
      bars: 2,
      voices: ['bass', 'lead', 'arp', 'drum'],
      bass: (step, bar) => {
        const pat = [0, null, 0, null, 7, null, 0, null, 3, null, 3, null, 5, null, 7, null];
        const p = pat[step];
        if (p === null) return null;
        return { notes: [p - 24], dur: 0.18, vel: 0.35, type: 'square' };
      },
      lead: (step, bar, scale) => {
        const patA = [0, null, 2, null, 4, null, 7, null, 6, 4, 2, null, 4, null, null, null];
        const patB = [7, null, 4, null, 2, null, 0, null, 2, 4, 2, null, 0, null, null, null];
        const pat = bar % 2 === 0 ? patA : patB;
        const p = pat[step];
        if (p === null || p === undefined) return null;
        return { notes: [scale[p]], dur: 0.22, vel: 0.16, type: 'sawtooth' };
      },
      arp: (step, bar, scale) => {
        if (step % 2 !== 0) return null;
        const seq = [0, 4, 7, 4, 0, 4, 7, 4];
        const n = seq[(step / 2) % seq.length];
        return { notes: [scale[n] + 12], dur: 0.12, vel: 0.08, type: 'triangle' };
      },
      drum: (step) => {
        // Noise-based kick/hat/snare
        if (step % 4 === 0) return { drum: 'kick', vel: 0.5 };
        if (step % 8 === 4) return { drum: 'snare', vel: 0.35 };
        if (step % 2 === 1) return { drum: 'hat', vel: 0.15 };
        return null;
      },
    },
    boss: {
      bpm: 148,
      root: -11,          // Bb3 (dark)
      scale: 'phryg',
      bars: 2,
      voices: ['bass', 'lead', 'drum'],
      bass: (step) => {
        const pat = [0, 0, null, 0, 0, null, 0, null, 1, 1, null, 1, 0, null, -2, null];
        const p = pat[step];
        if (p === null) return null;
        return { notes: [p - 24], dur: 0.15, vel: 0.42, type: 'square' };
      },
      lead: (step, bar, scale) => {
        // Indices stay within scale bounds (0..7)
        const pat = [0, 3, 5, 7, 5, 3, 7, null, 7, 5, 3, 5, 3, 1, 0, null];
        const p = pat[step];
        if (p === null) return null;
        return { notes: [scale[p]], dur: 0.18, vel: 0.18, type: 'sawtooth' };
      },
      drum: (step) => {
        if (step % 2 === 0) return { drum: 'kick', vel: 0.55 };
        if (step % 4 === 3) return { drum: 'snare', vel: 0.4 };
        return { drum: 'hat', vel: 0.12 };
      },
    },
    victory: {
      bpm: 120,
      root: -9,
      scale: 'major',
      bars: 2,
      voices: ['lead', 'arp', 'drum'],
      lead: (step, bar, scale) => {
        const pat = [0, 2, 4, 7, 4, 7, 9, 11, 12, 9, 7, 4, 7, 4, 2, 0];
        const p = pat[step];
        return { notes: [scale[p]], dur: 0.22, vel: 0.2, type: 'triangle' };
      },
      arp: (step, bar, scale) => {
        const seq = [0, 4, 7, 12, 7, 4, 7, 12];
        return { notes: [scale[seq[step % seq.length]] + 12], dur: 0.15, vel: 0.1, type: 'square' };
      },
      drum: (step) => {
        if (step % 4 === 0) return { drum: 'kick', vel: 0.45 };
        if (step % 4 === 2) return { drum: 'snare', vel: 0.3 };
        return { drum: 'hat', vel: 0.1 };
      },
    },
    gameover: {
      bpm: 60,
      root: -12,
      scale: 'minor',
      bars: 2,
      voices: ['pad', 'lead'],
      pad: (step, bar, scale) => {
        if (step % 8 !== 0) return null;
        return { notes: [scale[0], scale[2], scale[4]], dur: 2.5, vel: 0.2 };
      },
      lead: (step, bar, scale) => {
        const pat = [7, null, null, null, 5, null, null, null, 3, null, null, null, 0, null, null, null];
        const p = pat[step];
        if (p === null) return null;
        return { notes: [scale[p]], dur: 0.6, vel: 0.18, type: 'triangle' };
      },
    },
  };

  const GameMusic = {
    ctx: null,
    master: null,
    reverb: null,
    current: null,
    _timer: null,
    _step: 0,
    _bar: 0,
    _volume: 0.4,
    _muted: false,

    _init() {
      if (this.ctx) return;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return; }

      this.master = this.ctx.createGain();
      this.master.gain.value = this._volume;
      this.master.connect(this.ctx.destination);

      // Resume on first user gesture (browsers block autoplay) and
      // replay any pending track that was requested before unlock.
      const resume = () => {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            if (this._pending) {
              const t = this._pending; this._pending = null;
              this.play(t);
            }
          });
        } else if (this._pending) {
          const t = this._pending; this._pending = null;
          this.play(t);
        }
      };
      window.addEventListener('pointerdown', resume);
      window.addEventListener('keydown', resume);
      window.addEventListener('touchstart', resume);

      // Simple reverb send via delay+feedback (cheap)
      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.18;
      const fb = this.ctx.createGain();
      fb.gain.value = 0.28;
      const wet = this.ctx.createGain();
      wet.gain.value = 0.22;
      delay.connect(fb).connect(delay);
      delay.connect(wet).connect(this.master);
      this.reverb = delay;
    },

    setVolume(v) {
      this._volume = Math.max(0, Math.min(1, v));
      if (this.master && !this._muted) this.master.gain.value = this._volume;
    },
    mute(m) {
      this._muted = m;
      if (this.master) this.master.gain.value = m ? 0 : this._volume;
    },
    toggleMute() { this.mute(!this._muted); return this._muted; },

    play(trackName) {
      this._init();
      if (!this.ctx) return;
      // If context still locked, remember the track and start it on first gesture
      if (this.ctx.state === 'suspended') {
        this._pending = trackName;
        this.ctx.resume().catch(() => {});
        return;
      }
      if (this.current === trackName && this._timer) return;

      this.stop();
      const track = TRACKS[trackName];
      if (!track) return;
      this.current = trackName;
      this._step = 0;
      this._bar = 0;

      const stepMs = (60 / track.bpm) * 1000 / 4; // 16th notes
      this._timer = setInterval(() => this._tick(track), stepMs);
    },

    stop() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
      this.current = null;
    },

    _tick(track) {
      if (!this.ctx) return;
      const scale = SCALES[track.scale].map(s => s + track.root);
      const t = this.ctx.currentTime;

      for (const voice of track.voices) {
        const fn = track[voice];
        if (!fn) continue;
        const ev = fn(this._step, this._bar, scale);
        if (!ev) continue;
        try {
          if (ev.drum) {
            this._playDrum(ev.drum, ev.vel || 0.3, t);
          } else {
            for (const n of ev.notes) {
              if (n == null || isNaN(n)) continue;
              this._playNote(NOTE.freq(n), ev.dur || 0.2, ev.vel || 0.2, ev.type || 'triangle', t);
            }
          }
        } catch (e) { /* never let one bad note kill the sequencer */ }
      }

      this._step++;
      if (this._step >= 16) {
        this._step = 0;
        this._bar = (this._bar + 1) % track.bars;
      }
    },

    _playNote(freq, dur, vel, type, when) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(vel, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = Math.min(8000, freq * 6);
      filt.Q.value = 2;

      osc.connect(filt).connect(g);
      g.connect(this.master);
      if (this.reverb) g.connect(this.reverb);

      osc.start(when);
      osc.stop(when + dur + 0.05);
    },

    _playDrum(kind, vel, when) {
      const ctx = this.ctx;
      if (kind === 'kick') {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(120, when);
        osc.frequency.exponentialRampToValueAtTime(40, when + 0.12);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vel, when);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
        osc.connect(g).connect(this.master);
        osc.start(when); osc.stop(when + 0.2);
      } else if (kind === 'snare' || kind === 'hat') {
        const bufSize = ctx.sampleRate * 0.12;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = kind === 'hat' ? 'highpass' : 'bandpass';
        filt.frequency.value = kind === 'hat' ? 7000 : 1800;
        const g = ctx.createGain();
        const len = kind === 'hat' ? 0.04 : 0.1;
        g.gain.setValueAtTime(vel, when);
        g.gain.exponentialRampToValueAtTime(0.0001, when + len);
        src.connect(filt).connect(g).connect(this.master);
        src.start(when); src.stop(when + len + 0.02);
      }
    },
  };

  window.GameMusic = GameMusic;
})();
