// ═══════════════════════════════════════════════════════
//  JUICE : Post-processing + game-feel helpers
//  Provides: bloom, vignette, scanlines, hit-stop, RGB split flash
// ═══════════════════════════════════════════════════════

window.Juice = {
  _scanTexKey: '__juice_scanlines',
  _noiseTexKey: '__juice_noise',

  // Apply camera post-FX (bloom + vignette) and scanline overlay to a scene
  applyScenePostFX(scene, opts = {}) {
    const {
      bloom = true,
      vignette = true,
      scanlines = true,
      noise = false,
      bloomStrength = 0.45,
      vignetteStrength = 0.1,
    } = opts;

    const cam = scene.cameras.main;

    try {
      if (bloom && cam.postFX && cam.postFX.addBloom) {
        cam.postFX.addBloom(0xffffff, 1, 1, 1, bloomStrength, 6);
      }
      if (vignette && cam.postFX && cam.postFX.addVignette) {
        cam.postFX.addVignette(0.5, 0.5, 1.3, vignetteStrength);
      }
    } catch (e) {
      // Canvas renderer fallback : silently skip
    }

    if (scanlines) this._addScanlines(scene);
    if (noise) this._addNoise(scene);
  },

  _ensureScanTex(scene) {
    if (scene.textures.exists(this._scanTexKey)) return;
    // 3px tall: line 0 = slightly bright, lines 1-2 = fully transparent
    // Using a separate canvas so we control alpha precisely (graphics fillStyle
    // alpha gets baked into RGBA and interacts badly with blend modes)
    const c = document.createElement('canvas');
    c.width = 2; c.height = 3;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 2, 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
    ctx.fillRect(0, 0, 2, 1);
    scene.textures.addCanvas(this._scanTexKey, c);
  },

  _ensureNoiseTex(scene) {
    if (scene.textures.exists(this._noiseTexKey)) return;
    const size = 128;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255 | 0;
      img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 18;
    }
    ctx.putImageData(img, 0, 0);
    scene.textures.addCanvas(this._noiseTexKey, c);
  },

  _addScanlines(scene) {
    this._ensureScanTex(scene);
    const w = scene.scale.width, h = scene.scale.height;
    const ts = scene.add.tileSprite(0, 0, w, h, this._scanTexKey)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(99998);
    ts.alpha = 0.07;
    scene.events.once('shutdown', () => ts.destroy());
    scene.events.once('destroy', () => ts.destroy());
    return ts;
  },

  _addNoise(scene) {
    this._ensureNoiseTex(scene);
    const w = scene.scale.width, h = scene.scale.height;
    const ts = scene.add.tileSprite(0, 0, w, h, this._noiseTexKey)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(99999)
      .setBlendMode(Phaser.BlendModes.ADD);
    ts.alpha = 0.35;
    scene.events.on('update', () => {
      ts.tilePositionX = Math.random() * 128;
      ts.tilePositionY = Math.random() * 128;
    });
    scene.events.once('shutdown', () => ts.destroy());
    return ts;
  },

  // Hit-stop: briefly freeze time for impact feel
  hitstop(scene, ms = 60) {
    if (!scene || !scene.tweens) return;
    const prevT = scene.tweens.timeScale;
    const prevP = scene.physics && scene.physics.world ? scene.physics.world.timeScale : 1;
    scene.tweens.timeScale = 0.0001;
    if (scene.physics && scene.physics.world) scene.physics.world.timeScale = 100; // Phaser inverts: higher = slower
    // We intentionally use real setTimeout so the freeze is unaffected by timeScale
    setTimeout(() => {
      scene.tweens.timeScale = prevT;
      if (scene.physics && scene.physics.world) scene.physics.world.timeScale = prevP;
    }, ms);
  },

  // Quick RGB-split-ish punch using a scaled tinted copy of the camera flash
  punchFlash(scene, color = 0xffffff, duration = 80) {
    scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, false);
  },
};
