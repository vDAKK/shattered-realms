class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const gs = window.GameState;

    if (window.Juice) window.Juice.applyScenePostFX(this, { bloomStrength: 0.45, vignetteStrength: 0.15 });
    if (window.GameMusic) window.GameMusic.play('gameover');
    if (window.SFX) window.SFX.play('gameOver');

    this._saveMeta(gs);

    // ── Background ──────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x050003);
    this._createDeathField(W, H);
    this._createCracks(W, H);

    // ── Title ───────────────────────────────────────────
    const titleIdx = Phaser.Math.Between(0, NARRATIVE.gameOver.titles.length - 1);
    const msgIdx   = Phaser.Math.Between(0, NARRATIVE.gameOver.messages.length - 1);

    const titleGlow = this.add.text(W / 2, H * 0.14 + 3, NARRATIVE.gameOver.titles[titleIdx], {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '38px', fontStyle: 'bold',
      color: '#000000', stroke: '#cc0033', strokeThickness: 8,
    }).setOrigin(0.5).setAlpha(0.6);

    const titleText = this.add.text(W / 2, H * 0.14, NARRATIVE.gameOver.titles[titleIdx], {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '38px', fontStyle: 'bold',
      color: '#ff1144', stroke: '#660011', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [titleText, titleGlow], alpha: 1, duration: 600, delay: 200 });
    this.tweens.add({ targets: titleGlow, alpha: { from: 0.4, to: 0.8 }, duration: 1500, yoyo: true, repeat: -1, delay: 800 });

    const msgText = this.add.text(W / 2, H * 0.22, NARRATIVE.gameOver.messages[msgIdx], {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '14px', color: '#ff99aa', align: 'center', stroke: '#000000', strokeThickness: 3,
      wordWrap: { width: W - 40 },
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: msgText, alpha: 1, duration: 500, delay: 800 });

    // ── Stats ────────────────────────────────────────────
    const statsY = H * 0.34;
    const stats = [
      { label: 'SCORE FINAL',      value: gs.score.toString().padStart(6, '0'), color: '#ffcc00' },
      { label: 'MONDE ATTEINT',    value: `${gs.world} / 6`,                   color: '#00e5ff' },
      { label: 'NIVEAU XP',        value: `${gs.xpLevel || 0}`,                color: '#00e5ff' },
      { label: 'BOSS VAINCUS',     value: `${gs.bossesDefeated || 0}`,          color: '#ff4466' },
      { label: 'BRIQUES BRISÉES',  value: `${gs.bricksBroken || 0}`,            color: '#44ff88' },
      { label: 'ENNEMIS TUÉS',     value: `${gs.enemiesKilled || 0}`,           color: '#ff88ff' },
      { label: 'MAX COMBO',        value: `x${gs.maxCombo || 0}`,               color: '#ffcc00' },
      { label: 'ÉCLATS DU VIDE',   value: `+${gs.voidShards} ◆`,               color: '#aa88ff' },
    ];

    stats.forEach((s, i) => {
      const y = statsY + i * 30;
      const lbl = this.add.text(16, y, s.label, {
        fontFamily: 'Share Tech Mono, Courier New', fontSize: '12px', color: '#aabbcc',
      }).setAlpha(0);
      const val = this.add.text(W - 16, y, s.value, {
        fontFamily: 'Orbitron, Courier New', fontSize: '13px', fontStyle: 'bold', color: s.color,
      }).setOrigin(1, 0).setAlpha(0);

      const line = this.add.rectangle(W / 2, y + 14, 0, 1, 0x223344, 0.4);
      this.tweens.add({ targets: line, width: W - 32, duration: 250, delay: 600 + i * 60 });
      this.tweens.add({ targets: [lbl, val], alpha: 1, duration: 250, delay: 550 + i * 60 });
    });

    // ── Buttons ──────────────────────────────────────────
    const btnY = H * 0.85;
    this._createButton(W / 2, btnY,      'NOUVELLE PARTIE', '#ff4466', () => this._startNewGame());
    this._createButton(W / 2, btnY + 50, 'MENU PRINCIPAL',  '#445566', () => this._goMenu());

    // ── Shards notice ───────────────────────────────────
    if (gs.voidShards > 0) {
      const notice = this.add.text(W / 2, H * 0.95, `+${gs.voidShards} éclats sauvegardés`, {
        fontFamily: 'Share Tech Mono, Courier New',
        fontSize: '11px', color: '#bb99cc',
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: notice, alpha: 0.8, duration: 500, delay: 1500 });
    }

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  _createDeathField(W, H) {
    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(H * 0.4, H);
      const p = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 3), 0xff1133, Phaser.Math.FloatBetween(0.1, 0.4));
      this.tweens.add({
        targets: p, y: y - Phaser.Math.Between(150, 400), alpha: 0,
        duration: Phaser.Math.Between(2000, 4000), delay: Phaser.Math.Between(0, 2000),
        repeat: -1, onRepeat: () => { p.x = Phaser.Math.Between(0, W); p.y = H + 10; }
      });
    }
  }

  _createCracks(W, H) {
    const g = this.add.graphics();
    g.lineStyle(1, 0x440011, 0.3);
    for (let i = 0; i < 10; i++) {
      const sx = Phaser.Math.Between(0, W), sy = Phaser.Math.Between(0, H);
      g.lineBetween(sx, sy, sx + Phaser.Math.Between(-70, 70), sy + Phaser.Math.Between(-70, 70));
    }
  }

  _createButton(x, y, label, color, callback) {
    const W = this.scale.width;
    const btnW = W - 60;
    const colorInt = parseInt(color.replace('#', '0x'));
    const bg = this.add.rectangle(x, y, btnW, 40, colorInt, 0.12);
    const border = this.add.rectangle(x, y, btnW, 40, 0x000000, 0).setStrokeStyle(1, colorInt, 0.6);
    const text = this.add.text(x, y, label, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '12px', fontStyle: 'bold', color: color, letterSpacing: 2,
    }).setOrigin(0.5);

    [bg, border, text].forEach(el => el.setAlpha(0));
    this.tweens.add({ targets: [bg, border, text], alpha: 1, duration: 400, delay: 1400 });

    const zone = this.add.zone(x, y, btnW + 5, 44).setInteractive({ cursor: 'pointer' });
    zone.on('pointerover', () => { bg.setFillStyle(colorInt, 0.25); text.setColor('#ffffff'); });
    zone.on('pointerout',  () => { bg.setFillStyle(colorInt, 0.12); text.setColor(color); });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: text, scaleX: 0.9, scaleY: 0.9, duration: 60, yoyo: true, onComplete: callback });
    });
  }

  _startNewGame() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const meta = this._loadMeta();
      window.GameState = {
        world: 1, level: 1, score: 0,
        hp: 3 + (meta.extraHp || 0), maxHp: 3 + (meta.extraHp || 0),
        voidShards: 0, upgrades: [],
        ballSpeed: 350 + (meta.extraSpeed || 0),
        paddleWidth: 120 + (meta.extraPaddleW || 0),
        startBalls: 1 + (meta.extraBalls || 0),
        hasLaser: !!(meta.startLaser), netBounces: (meta.extraNet || 0),
        voidShieldCharges: 0, timeDilationCharges: 0,
        fireCoreDuration: 0, ghostDuration: 0,
        chainChance: 0, hasMagnet: false, explosiveEvery: 0,
        bricksBroken: 0, bossesDefeated: 0,
        xp: 0, xpLevel: 0, enemiesKilled: 0,
        piercingCount: 0, scoreMult: 1, puDurationMult: 1, dropLuckMult: 1,
        metaUpgrades: meta,
      };
      this.scene.start('NarrativeScene', {
        lines: NARRATIVE.opening, nextScene: 'GameScene',
        worldColor: '#00e5ff', title: 'PROLOGUE'
      });
    });
  }

  _goMenu() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
  }

  _saveMeta(gs) {
    try {
      const meta = this._loadMeta();
      meta.totalShards = (meta.totalShards || 0) + (gs.voidShards || 0);
      meta.bestScore = Math.max(meta.bestScore || 0, gs.score || 0);
      meta.totalRuns = (meta.totalRuns || 0) + 1;
      localStorage.setItem('shattered_meta', JSON.stringify(meta));
    } catch {}
  }

  _loadMeta() {
    try { return JSON.parse(localStorage.getItem('shattered_meta') || '{}'); } catch { return {}; }
  }
}
