// ═══════════════════════════════════════════════════════
//  SFX — Procedural sound effects (WebAudio)
//  window.SFX.play('name') — all synths, no assets
// ═══════════════════════════════════════════════════════

(function () {
  const SFX = {
    ctx: null,
    master: null,
    _volume: 0.45,
    _muted: false,
    _lastPlay: {},

    _init() {
      if (this.ctx) return;
      try {
        // Reuse GameMusic context if possible so both share unlock state
        if (window.GameMusic && window.GameMusic.ctx) {
          this.ctx = window.GameMusic.ctx;
        } else {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
      } catch (e) { return; }
      this.master = this.ctx.createGain();
      this.master.gain.value = this._volume;
      this.master.connect(this.ctx.destination);
    },

    setVolume(v) {
      this._volume = Math.max(0, Math.min(1, v));
      if (this.master && !this._muted) this.master.gain.value = this._volume;
    },

    mute(m) {
      this._muted = m;
      if (this.master) this.master.gain.value = m ? 0 : this._volume;
    },

    play(name, opts = {}) {
      this._init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
      // Throttle rapid repeats of the same sound (stops "machine-gun" stacking)
      const now = this.ctx.currentTime;
      const minGap = opts.minGap != null ? opts.minGap : 0.02;
      if (this._lastPlay[name] && now - this._lastPlay[name] < minGap) return;
      this._lastPlay[name] = now;

      const fn = SFX_DEFS[name];
      if (fn) fn(this.ctx, this.master, now, opts);
    },
  };

  // ── Helpers ────────────────────────────────────────────
  function tone(ctx, dst, freq, dur, vel, type, t, freqEnd) {
    const osc = ctx.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(dst);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    return osc;
  }

  function noise(ctx, dst, dur, vel, t, filter) {
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = src;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter.type || 'bandpass';
      f.frequency.value = filter.freq || 2000;
      f.Q.value = filter.q || 1;
      src.connect(f);
      node = f;
    }
    node.connect(g).connect(dst);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // ── Sound definitions ──────────────────────────────────
  const SFX_DEFS = {
    // Ball hitting the paddle — soft woody thump
    paddleHit(ctx, dst, t) {
      tone(ctx, dst, 320, 0.09, 0.3, 'triangle', t, 180);
      tone(ctx, dst, 650, 0.05, 0.1, 'sine', t, 400);
    },

    // Ball hitting a brick — crisp tick
    brickHit(ctx, dst, t, opts) {
      const pitch = opts.pitch || 1;
      tone(ctx, dst, 880 * pitch, 0.06, 0.22, 'square', t, 1200 * pitch);
    },

    // Brick destroyed — shatter
    brickBreak(ctx, dst, t) {
      tone(ctx, dst, 600, 0.12, 0.25, 'triangle', t, 180);
      noise(ctx, dst, 0.15, 0.18, t, { type: 'highpass', freq: 2500, q: 1 });
    },

    // Wall hit — soft bonk
    wallHit(ctx, dst, t) {
      tone(ctx, dst, 200, 0.05, 0.18, 'sine', t, 140);
    },

    // Enemy hit (non-lethal)
    enemyHit(ctx, dst, t) {
      tone(ctx, dst, 500, 0.07, 0.22, 'sawtooth', t, 280);
      noise(ctx, dst, 0.05, 0.12, t, { type: 'bandpass', freq: 1400, q: 2 });
    },

    // Enemy killed — zap + noise burst
    enemyDie(ctx, dst, t) {
      tone(ctx, dst, 700, 0.18, 0.3, 'square', t, 120);
      tone(ctx, dst, 350, 0.2, 0.2, 'sawtooth', t, 80);
      noise(ctx, dst, 0.2, 0.2, t, { type: 'bandpass', freq: 1000, q: 1 });
    },

    // Power-up collected — bright arpeggio
    powerup(ctx, dst, t) {
      tone(ctx, dst, 523, 0.08, 0.25, 'triangle', t);
      tone(ctx, dst, 784, 0.08, 0.25, 'triangle', t + 0.06);
      tone(ctx, dst, 1047, 0.12, 0.28, 'triangle', t + 0.12);
    },

    // Laser shot
    laser(ctx, dst, t) {
      tone(ctx, dst, 1400, 0.08, 0.18, 'sawtooth', t, 400);
    },

    // Explosion — big noise burst + low boom
    explode(ctx, dst, t) {
      tone(ctx, dst, 120, 0.35, 0.45, 'sine', t, 35);
      noise(ctx, dst, 0.35, 0.4, t, { type: 'lowpass', freq: 1800, q: 0.8 });
    },

    // Boss damaged
    bossHit(ctx, dst, t) {
      tone(ctx, dst, 200, 0.1, 0.35, 'sawtooth', t, 80);
      tone(ctx, dst, 400, 0.08, 0.2, 'square', t, 200);
      noise(ctx, dst, 0.1, 0.15, t, { type: 'bandpass', freq: 600, q: 2 });
    },

    // Level-up fanfare
    levelUp(ctx, dst, t) {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone(ctx, dst, f, 0.25, 0.3, 'triangle', t + i * 0.08));
    },

    // XP orb absorbed by paddle
    xpCollect(ctx, dst, t, opts) {
      const base = 1200 + Math.random() * 300;
      tone(ctx, dst, base, 0.07, 0.08, 'sine', t, base * 1.6);
    },

    // Lost a life
    loseLife(ctx, dst, t) {
      tone(ctx, dst, 400, 0.4, 0.3, 'sawtooth', t, 60);
      noise(ctx, dst, 0.3, 0.15, t + 0.05, { type: 'lowpass', freq: 800 });
    },

    // Game over
    gameOver(ctx, dst, t) {
      const notes = [523, 440, 349, 262, 196];
      notes.forEach((f, i) => tone(ctx, dst, f, 0.35, 0.28, 'triangle', t + i * 0.15));
    },

    // Victory
    victory(ctx, dst, t) {
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((f, i) => tone(ctx, dst, f, 0.3, 0.32, 'triangle', t + i * 0.09));
    },

    // UI click
    uiClick(ctx, dst, t) {
      tone(ctx, dst, 900, 0.04, 0.15, 'square', t, 600);
    },
  };

  window.SFX = SFX;
})();
