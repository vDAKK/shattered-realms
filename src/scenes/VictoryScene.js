class VictoryScene extends Phaser.Scene {
  constructor() { super({ key: 'VictoryScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const gs = window.GameState;

    // Final void shards bonus
    gs.voidShards = (gs.voidShards || 0) + 50;
    gs.score += 9999;
    this._saveMeta(gs);

    // ── Background ──────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x020510);
    this._createVictoryField(W, H);

    // ── Big flash on entry ───────────────────────────────
    this.cameras.main.fadeIn(800, 255, 255, 255);

    // ── Epilogue narrative (typewriter style) ────────────
    let lineIdx = 0;
    const lines = NARRATIVE.finalBoss.defeated;
    const lineText = this.add.text(W / 2, H * 0.35, '', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '18px', color: '#ccddee', align: 'center',
      wordWrap: { width: W * 0.7 }, lineSpacing: 6,
    }).setOrigin(0.5).setAlpha(0);

    const showNextLine = () => {
      if (lineIdx >= lines.length) {
        showVictory();
        return;
      }
      lineText.setAlpha(0).setText(lines[lineIdx]);
      this.tweens.add({ targets: lineText, alpha: 1, duration: 300 });
      this.time.delayedCall(1800, () => {
        this.tweens.add({ targets: lineText, alpha: 0, duration: 300, onComplete: () => {
          lineIdx++;
          showNextLine();
        }});
      });
    };

    this.time.delayedCall(1000, showNextLine);

    const showVictory = () => {
      // ── VICTORY title ────────────────────────────────
      const glowTitle = this.add.text(W / 2, H * 0.22 + 3, 'VICTOIRE', {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '72px', fontStyle: 'bold',
        color: '#000000', stroke: '#ffcc00', strokeThickness: 14,
      }).setOrigin(0.5).setAlpha(0);

      const mainTitle = this.add.text(W / 2, H * 0.22, 'VICTOIRE', {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '72px', fontStyle: 'bold',
        color: '#ffffff', stroke: '#ff8800', strokeThickness: 3,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: [glowTitle, mainTitle], alpha: 1, duration: 800, ease: 'Quad.easeOut' });
      this.tweens.add({
        targets: glowTitle, alpha: { from: 0.5, to: 1 },
        duration: 1200, yoyo: true, repeat: -1, delay: 800
      });

      this.add.text(W / 2, H * 0.33, 'LE VOID ARCHITECT EST VAINCU', {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '16px', color: '#ffcc00', letterSpacing: 4,
      }).setOrigin(0.5).setAlpha(0);

      // Camera celebrations
      this.cameras.main.flash(500, 255, 220, 100, false);
      this.cameras.main.shake(300, 0.015);

      // ── Stats ─────────────────────────────────────────
      const statsY = H * 0.48;
      const stats = [
        { label: 'SCORE LÉGENDAIRE', value: gs.score.toString().padStart(7, '0'), color: '#ffcc00' },
        { label: 'BOSS VAINCUS',     value: `${gs.bossesDefeated || 5} / 5`,      color: '#ff4466' },
        { label: 'BRIQUES BRISÉES',  value: `${gs.bricksBroken || 0}`,            color: '#44ff88' },
        { label: 'VIES RESTANTES',   value: `${gs.hp} / ${gs.maxHp}`,             color: '#ff3388' },
        { label: 'ÉCLATS GAGNÉS',    value: `+${gs.voidShards} ◆`,               color: '#aa88ff' },
      ];

      stats.forEach((s, i) => {
        const y = statsY + i * 34;
        this.add.text(W * 0.28, y, s.label, {
          fontFamily: 'Share Tech Mono, Courier New', fontSize: '13px', color: '#667788',
        }).setOrigin(0, 0.5);
        this.add.text(W * 0.72, y, s.value, {
          fontFamily: 'Orbitron, Courier New', fontSize: '15px', color: s.color,
        }).setOrigin(1, 0.5);
        const line = this.add.rectangle(W / 2, y + 15, 0, 1, 0x334433, 0.5);
        this.tweens.add({ targets: line, width: 520, duration: 300, delay: i * 80 });
      });

      // ── Upgrade recap ─────────────────────────────────
      if (gs.upgrades.length > 0) {
        this.add.text(W / 2, H * 0.82, 'Augments de cette partie:', {
          fontFamily: 'Share Tech Mono, Courier New',
          fontSize: '11px', color: '#334455',
        }).setOrigin(0.5);
        const maxShow = Math.min(gs.upgrades.length, 7);
        gs.upgrades.slice(0, maxShow).forEach((u, i) => {
          const x = W / 2 - (maxShow - 1) * 55 + i * 110;
          this.add.text(x, H * 0.87, u.name.slice(0, 14), {
            fontFamily: 'Share Tech Mono, Courier New',
            fontSize: '9px',
            color: `#${(u.color || 0x00e5ff).toString(16).padStart(6, '0')}`,
          }).setOrigin(0.5);
        });
      }

      // ── Buttons ──────────────────────────────────────
      this.time.delayedCall(600, () => {
        this._createButton(W * 0.33, H * 0.94, 'REJOUER', '#ffcc00', () => this._restart());
        this._createButton(W * 0.67, H * 0.94, 'MENU',    '#446677', () => this._menu());
      });
    };
  }

  _createVictoryField(W, H) {
    // Gold/rainbow particles floating upward
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const colors = [0xffcc00, 0xff8800, 0x00e5ff, 0xff4466, 0x00ff88, 0xaa88ff];
      const color = Phaser.Utils.Array.GetRandom(colors);
      const p = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 5), color, Phaser.Math.FloatBetween(0.2, 0.8));
      this.tweens.add({
        targets: p, y: y - Phaser.Math.Between(100, 400),
        alpha: 0, duration: Phaser.Math.Between(1500, 4000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        onRepeat: () => { p.x = Phaser.Math.Between(0, W); p.y = H + 10; p.setAlpha(Phaser.Math.FloatBetween(0.2, 0.8)); }
      });
    }

    // Background grid
    const g = this.add.graphics();
    g.lineStyle(1, 0x111122, 0.4);
    for (let x = 0; x < W; x += 60) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 60) g.lineBetween(0, y, W, y);
  }

  _createButton(x, y, label, color, callback) {
    const colorInt = parseInt(color.replace('#', '0x'));
    const bg = this.add.rectangle(x, y, 180, 40, colorInt, 0.15);
    const border = this.add.rectangle(x, y, 180, 40, 0x000000, 0).setStrokeStyle(1, colorInt, 0.8);
    const text = this.add.text(x, y, label, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '14px', fontStyle: 'bold',
      color: color, letterSpacing: 3,
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, 185, 44).setInteractive({ cursor: 'pointer' });
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
      ballSpeed: 390 + (meta.extraSpeed || 0), paddleWidth: 140,
      startBalls: 1 + (meta.extraBalls || 0),
      hasLaser: false, netBounces: 0,
      voidShieldCharges: 0, timeDilationCharges: 0,
      fireCoreDuration: 0, ghostDuration: 0,
      chainChance: 0, hasMagnet: false, explosiveEvery: 0,
      bricksBroken: 0, bossesDefeated: 0, metaUpgrades: meta,
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
