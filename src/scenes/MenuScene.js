class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // ── Background ────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x020810);
    this._createStarField(W, H);

    // ── Animated grid lines ───────────────────────────────
    this._createGridLines(W, H);

    // ── Floating crystal particles ─────────────────────────
    this._createFloatingParticles(W, H);

    // ── Title ─────────────────────────────────────────────
    const titleY = H * 0.22;

    // Glow layer
    const glowTitle = this.add.text(W / 2, titleY + 2, 'SHATTERED', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '68px',
      fontStyle: 'bold',
      color: '#001133',
      stroke: '#00e5ff',
      strokeThickness: 12,
    }).setOrigin(0.5).setAlpha(0.5);

    this.add.text(W / 2, titleY, 'SHATTERED', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '68px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#00aaff',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, titleY + 72, 'R E A L M S', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#00e5ff',
      letterSpacing: 14,
    }).setOrigin(0.5);

    // Subtitle line
    this.add.text(W / 2, titleY + 120, '— Un jeu de bris narratif —', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '14px',
      color: '#335566',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // ── World label strip ─────────────────────────────────
    const worlds = [
      { name: 'CRISTAL', color: '#00e5ff' },
      { name: 'FORGE',   color: '#ff4400' },
      { name: 'VIDE',    color: '#aa00ff' },
      { name: 'NÉON',    color: '#00ff88' },
    ];
    const stripY = titleY + 155;
    worlds.forEach((w, i) => {
      const x = W * 0.2 + i * (W * 0.2);
      const rect = this.add.rectangle(x, stripY, 140, 30, 0x000000, 0);
      this.add.text(x, stripY, w.name, {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '11px',
        color: w.color,
        letterSpacing: 4,
      }).setOrigin(0.5);
      const line = this.add.rectangle(x, stripY + 18, 140, 1, parseInt(w.color.replace('#', '0x')), 0.6);
      this.tweens.add({
        targets: line, alpha: { from: 0.2, to: 0.9 },
        duration: 1200 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });

    // ── Menu buttons ──────────────────────────────────────
    const btnY = H * 0.62;
    this._createButton(W / 2, btnY,      'NOUVELLE PARTIE', '#00e5ff', () => this._startGame());
    this._createButton(W / 2, btnY + 65, 'AMÉLIORATIONS',   '#ffcc00', () => this._openMeta());
    this._createButton(W / 2, btnY + 130,'CRÉDITS',          '#888888', () => this._showCredits());

    // ── Bottom lore text ──────────────────────────────────
    this.add.text(W / 2, H - 30, 'MONDE CRISTALLISÉ PAR LE VOID ARCHITECT  |  KAEL DOIT LE BRISER', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '11px',
      color: '#224444',
      letterSpacing: 1,
    }).setOrigin(0.5);

    // ── Controls hint ─────────────────────────────────────
    this.add.text(W / 2, H - 52, 'SOURIS → déplacer  |  CLIC → lancer  |  CLIC DROIT → laser  |  ESPACE → ralentir', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '11px',
      color: '#2a4455',
    }).setOrigin(0.5);

    // ── Pulsing title glow ────────────────────────────────
    this.tweens.add({
      targets: glowTitle, alpha: { from: 0.3, to: 0.7 },
      duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // ── Version ───────────────────────────────────────────
    this.add.text(W - 12, H - 10, 'v1.0', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '10px', color: '#223333',
    }).setOrigin(1, 1);

    // ── Floating brick preview ────────────────────────────
    this._createBrickPreview(W, H);

    // ── Music note (flavor) ───────────────────────────────
    this._scanlineEffect(W, H);
  }

  _createButton(x, y, label, color, callback) {
    const W = this.scale.width;
    const bg = this.add.rectangle(x, y, 280, 46, 0x000000, 0);
    const border = this.add.rectangle(x, y, 280, 46, 0x000000, 0);
    border.setStrokeStyle(1, parseInt(color.replace('#', '0x')), 0.5);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '15px',
      fontStyle: 'bold',
      color: color,
      letterSpacing: 3,
    }).setOrigin(0.5);

    // Left/right chevrons
    const leftChevron  = this.add.text(x - 155, y, '▶', { fontFamily: 'monospace', fontSize: '12px', color: color }).setOrigin(0.5).setAlpha(0);
    const rightChevron = this.add.text(x + 155, y, '◀', { fontFamily: 'monospace', fontSize: '12px', color: color }).setOrigin(0.5).setAlpha(0);

    const zone = this.add.zone(x, y, 290, 50).setInteractive({ cursor: 'pointer' });

    zone.on('pointerover', () => {
      bg.setFillStyle(parseInt(color.replace('#', '0x')), 0.08);
      border.setStrokeStyle(1, parseInt(color.replace('#', '0x')), 1);
      text.setColor('#ffffff');
      leftChevron.setAlpha(1);
      rightChevron.setAlpha(1);
      this.tweens.add({ targets: [leftChevron, rightChevron], alpha: { from: 0.5, to: 1.0 }, duration: 400, yoyo: true, repeat: -1 });
    });

    zone.on('pointerout', () => {
      bg.setFillStyle(0x000000, 0);
      border.setStrokeStyle(1, parseInt(color.replace('#', '0x')), 0.5);
      text.setColor(color);
      leftChevron.setAlpha(0);
      rightChevron.setAlpha(0);
      this.tweens.killTweensOf([leftChevron, rightChevron]);
    });

    zone.on('pointerdown', () => {
      this.tweens.add({
        targets: text, scaleX: 0.92, scaleY: 0.92,
        duration: 80, yoyo: true, ease: 'Quad.easeOut',
        onComplete: callback
      });
    });
  }

  _createStarField(W, H) {
    const stars = [];
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.8);
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      stars.push(star);

      if (Math.random() < 0.3) {
        this.tweens.add({
          targets: star, alpha: { from: alpha * 0.3, to: alpha },
          duration: Phaser.Math.Between(1000, 3000),
          yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000),
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  _createGridLines(W, H) {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x001133, 0.4);
    for (let x = 0; x < W; x += 60) {
      graphics.lineBetween(x, 0, x, H);
    }
    for (let y = 0; y < H; y += 60) {
      graphics.lineBetween(0, y, W, y);
    }
  }

  _createFloatingParticles(W, H) {
    // Create drifting particles that look like void fragments
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(50, W - 50);
      const y = Phaser.Math.Between(50, H - 50);
      const color = Phaser.Utils.Array.GetRandom([0x00e5ff, 0xaa00ff, 0xff4400, 0x00ff88]);
      const size = Phaser.Math.FloatBetween(1, 4);
      const particle = this.add.circle(x, y, size, color, 0.6);

      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-80, 80),
        y: y + Phaser.Math.Between(-60, 60),
        alpha: { from: 0.1, to: 0.7 },
        duration: Phaser.Math.Between(3000, 8000),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 4000),
        ease: 'Sine.easeInOut'
      });
    }
  }

  _createBrickPreview(W, H) {
    // Small animated brick display on right side
    const colors = [0x00e5ff, 0x00aaff, 0x0088ff, 0xff4400, 0xff8800, 0xaa00ff, 0x00ff88];
    const startX = W - 20;
    for (let i = 0; i < 7; i++) {
      const brickH = 18;
      const gap = 4;
      const yPos = H * 0.3 + i * (brickH + gap);
      const brick = this.add.rectangle(startX, yPos, 6, brickH, colors[i], 0.6);
      this.tweens.add({
        targets: brick,
        x: startX - 2, alpha: { from: 0.3, to: 0.8 },
        duration: 600 + i * 150,
        yoyo: true, repeat: -1, delay: i * 100,
        ease: 'Sine.easeInOut'
      });
    }
  }

  _scanlineEffect(W, H) {
    // Periodic horizontal sweep line
    const scanline = this.add.rectangle(W / 2, -2, W, 2, 0x00e5ff, 0.06);
    this.tweens.add({
      targets: scanline, y: H + 2,
      duration: 4000, repeat: -1, delay: 2000,
      ease: 'Linear'
    });
  }

  _startGame() {
    // Init / reset game state
    const meta = this._loadMeta();
    window.GameState = {
      world: 1,
      level: 1,
      score: 0,
      hp: 3 + (meta.extraHp || 0),
      maxHp: 3 + (meta.extraHp || 0),
      voidShards: 0,
      upgrades: [],
      ballSpeed: 390 + (meta.extraSpeed || 0),
      paddleWidth: 140,
      startBalls: 1 + (meta.extraBalls || 0),
      hasLaser: false,
      netBounces: 0,
      voidShieldCharges: 0,
      timeDilationCharges: 0,
      fireCoreDuration: 0,
      ghostDuration: 0,
      chainChance: 0,
      hasMagnet: false,
      explosiveEvery: 0,
      bricksBroken: 0,
      bossesDefeated: 0,
      metaUpgrades: meta,
    };

    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('NarrativeScene', {
        lines: NARRATIVE.opening,
        nextScene: 'GameScene',
        worldColor: '#00e5ff',
        title: 'PROLOGUE'
      });
    });
  }

  _openMeta() {
    const meta = this._loadMeta();
    const W = this.scale.width, H = this.scale.height;
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(200);
    const lines = [
      'ÉCLATS DU VIDE TOTAUX : ' + (meta.totalShards || 0) + ' ◆',
      'MEILLEUR SCORE : ' + (meta.bestScore || 0).toString().padStart(7, '0'),
      'PARTIES JOUÉES : ' + (meta.totalRuns || 0),
      'VICTOIRES : ' + (meta.wins || 0),
      '',
      '── AMÉLIORATIONS PERMANENTES (à venir) ──',
      '',
      'Accumule des Éclats en jouant.',
      'Les améliorations méta seront débloquées ici.',
      '',
      '[ CLIQUER POUR FERMER ]',
    ].join('\n');
    const txt = this.add.text(W / 2, H / 2, lines, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '14px', color: '#00e5ff', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setDepth(201);
    overlay.setInteractive();
    overlay.on('pointerdown', () => { overlay.destroy(); txt.destroy(); });
  }

  _showCredits() {
    // Simple credits overlay
    const W = this.scale.width, H = this.scale.height;
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);
    const txt = this.add.text(W / 2, H / 2, [
      'SHATTERED REALMS',
      '',
      'Un roguelite brick-breaker narratif',
      '',
      'Propulsé par Phaser 3',
      '',
      'Cliquez pour fermer',
    ].join('\n'), {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '16px',
      color: '#00e5ff',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    overlay.setInteractive();
    overlay.on('pointerdown', () => { overlay.destroy(); txt.destroy(); });
  }

  _loadMeta() {
    try {
      return JSON.parse(localStorage.getItem('shattered_meta') || '{}');
    } catch { return {}; }
  }
}
