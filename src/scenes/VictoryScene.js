class VictoryScene extends Phaser.Scene {
  constructor() { super({ key: 'VictoryScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const gs = window.GameState;

    if (window.Juice) window.Juice.applyScenePostFX(this, { bloomStrength: 0.55, vignetteStrength: 0.1 });
    if (window.GameMusic) window.GameMusic.play('victory');
    if (window.SFX) window.SFX.play('victory');

    gs.voidShards = (gs.voidShards || 0) + 50;
    gs.score += 9999;
    this._saveMeta(gs);

    // ── Background ──────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x020510);
    this._createVictoryField(W, H);
    this.cameras.main.fadeIn(800, 255, 255, 255);

    // ── Epilogue narrative ──────────────────────────────
    let lineIdx = 0;
    const lines = NARRATIVE.finalBoss.defeated;
    const lineText = this.add.text(W / 2, H * 0.30, '', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '15px', color: '#ccddee', align: 'center',
      wordWrap: { width: W - 40 }, lineSpacing: 5,
    }).setOrigin(0.5).setAlpha(0);

    const showNextLine = () => {
      if (lineIdx >= lines.length) { showVictory(); return; }
      lineText.setAlpha(0).setText(lines[lineIdx]);
      this.tweens.add({ targets: lineText, alpha: 1, duration: 300 });
      this.time.delayedCall(1800, () => {
        this.tweens.add({ targets: lineText, alpha: 0, duration: 300, onComplete: () => { lineIdx++; showNextLine(); }});
      });
    };
    this.time.delayedCall(1000, showNextLine);

    const showVictory = () => {
      const glowTitle = this.add.text(W / 2, H * 0.12 + 3, 'VICTOIRE', {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '48px', fontStyle: 'bold',
        color: '#000000', stroke: '#ffcc00', strokeThickness: 12,
      }).setOrigin(0.5).setAlpha(0);

      const mainTitle = this.add.text(W / 2, H * 0.12, 'VICTOIRE', {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '48px', fontStyle: 'bold',
        color: '#ffffff', stroke: '#ff8800', strokeThickness: 3,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: [glowTitle, mainTitle], alpha: 1, duration: 800 });
      this.tweens.add({ targets: glowTitle, alpha: { from: 0.5, to: 1 }, duration: 1200, yoyo: true, repeat: -1, delay: 800 });

      this.add.text(W / 2, H * 0.20, 'LE VOID ARCHITECT EST VAINCU', {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '12px', color: '#ffcc00', letterSpacing: 3,
      }).setOrigin(0.5);

      this.cameras.main.flash(500, 255, 220, 100, false);
      this.cameras.main.shake(300, 0.015);

      // ── Stats ─────────────────────────────────────────
      const statsY = H * 0.30;
      const stats = [
        { label: 'SCORE LÉGENDAIRE', value: gs.score.toString().padStart(7, '0'), color: '#ffcc00' },
        { label: 'BOSS VAINCUS',     value: `${gs.bossesDefeated || 5} / 5`,      color: '#ff4466' },
        { label: 'BRIQUES BRISÉES',  value: `${gs.bricksBroken || 0}`,            color: '#44ff88' },
        { label: 'ENNEMIS TUÉS',     value: `${gs.enemiesKilled || 0}`,           color: '#ff88ff' },
        { label: 'NIVEAU XP',        value: `${gs.xpLevel || 0}`,                 color: '#00e5ff' },
        { label: 'VIES RESTANTES',   value: `${gs.hp} / ${gs.maxHp}`,             color: '#ff3388' },
        { label: 'ÉCLATS GAGNÉS',    value: `+${gs.voidShards} ◆`,               color: '#aa88ff' },
      ];

      stats.forEach((s, i) => {
        const y = statsY + i * 28;
        this.add.text(16, y, s.label, {
          fontFamily: 'Share Tech Mono, Courier New', fontSize: '12px', color: '#aabbcc',
        }).setOrigin(0, 0.5);
        this.add.text(W - 16, y, s.value, {
          fontFamily: 'Orbitron, Courier New', fontSize: '13px', fontStyle: 'bold', color: s.color,
        }).setOrigin(1, 0.5);
        const line = this.add.rectangle(W / 2, y + 12, 0, 1, 0x334433, 0.4);
        this.tweens.add({ targets: line, width: W - 32, duration: 250, delay: i * 60 });
      });

      // ── Upgrades recap ────────────────────────────────
      if (gs.upgrades.length > 0) {
        this.add.text(W / 2, H * 0.68, 'Augments acquis:', {
          fontFamily: 'Share Tech Mono, Courier New',
          fontSize: '11px', color: '#aabbcc',
        }).setOrigin(0.5);

        const perRow = 4;
        gs.upgrades.slice(0, 8).forEach((u, i) => {
          const row = Math.floor(i / perRow);
          const col = i % perRow;
          const x = W / 2 - (perRow - 1) * 55 / 2 + col * 55;
          const y = H * 0.72 + row * 18;
          this.add.text(x, y, u.name.slice(0, 12), {
            fontFamily: 'Share Tech Mono, Courier New',
            fontSize: '8px',
            color: `#${(u.color || 0x00e5ff).toString(16).padStart(6, '0')}`,
          }).setOrigin(0.5);
        });
      }

      // ── Buttons ──────────────────────────────────────
      this.time.delayedCall(600, () => {
        this._createButton(W / 2, H * 0.86, 'REJOUER', '#ffcc00', () => this._restart());
        this._createButton(W / 2, H * 0.92, 'MENU',    '#446677', () => this._menu());
      });
    };
  }

  _createVictoryField(W, H) {
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, W), y = Phaser.Math.Between(0, H);
      const colors = [0xffcc00, 0xff8800, 0x00e5ff, 0xff4466, 0x00ff88, 0xaa88ff];
      const p = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 4),
        Phaser.Utils.Array.GetRandom(colors), Phaser.Math.FloatBetween(0.2, 0.7));
      this.tweens.add({
        targets: p, y: y - Phaser.Math.Between(80, 300), alpha: 0,
        duration: Phaser.Math.Between(1500, 3500), delay: Phaser.Math.Between(0, 2000),
        repeat: -1, onRepeat: () => { p.x = Phaser.Math.Between(0, W); p.y = H + 10; p.setAlpha(0.5); }
      });
    }
    const g = this.add.graphics();
    g.lineStyle(1, 0x111122, 0.3);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);
  }

  _createButton(x, y, label, color, callback) {
    const W = this.scale.width;
    const btnW = W - 80;
    const colorInt = parseInt(color.replace('#', '0x'));
    const bg = this.add.rectangle(x, y, btnW, 36, colorInt, 0.15);
    const border = this.add.rectangle(x, y, btnW, 36, 0, 0).setStrokeStyle(1, colorInt, 0.7);
    const text = this.add.text(x, y, label, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '12px', fontStyle: 'bold', color: color, letterSpacing: 3,
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, btnW + 5, 40).setInteractive({ cursor: 'pointer' });
    zone.on('pointerover', () => { bg.setFillStyle(colorInt, 0.35); text.setColor('#ffffff'); });
    zone.on('pointerout',  () => { bg.setFillStyle(colorInt, 0.15); text.setColor(color); });
    zone.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', callback);
    });
  }

  _restart() {
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
    this.scene.start('GameScene');
  }

  _menu() { this.scene.start('MenuScene'); }

  _saveMeta(gs) {
    try {
      const meta = this._loadMeta();
      meta.totalShards = (meta.totalShards || 0) + gs.voidShards;
      meta.bestScore = Math.max(meta.bestScore || 0, gs.score);
      meta.wins = (meta.wins || 0) + 1;
      localStorage.setItem('shattered_meta', JSON.stringify(meta));
    } catch {}
  }

  _loadMeta() {
    try { return JSON.parse(localStorage.getItem('shattered_meta') || '{}'); } catch { return {}; }
  }
}
