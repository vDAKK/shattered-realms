class UpgradeScene extends Phaser.Scene {
  constructor() { super({ key: 'UpgradeScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const gs = window.GameState;

    if (window.Juice) window.Juice.applyScenePostFX(this, { bloom: false, scanlines: false, vignette: true, vignetteStrength: 0.04 });
    if (window.GameMusic) window.GameMusic.play('menu');

    // ── Background ──────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x020810);
    this._createStarField(W, H);
    this._createGrid(W, H);

    // ── Decorative lines ────────────────────────────────
    const worldData = NARRATIVE.worlds[gs.world - 1] || NARRATIVE.worlds[0];
    const worldColor = parseInt(worldData.glowColor.replace('#', '0x'));
    const worldColorStr = worldData.glowColor;

    const topLine = this.add.rectangle(W / 2, H * 0.08, 0, 1, worldColor, 0.6);
    this.tweens.add({ targets: topLine, width: W * 0.7, duration: 600, ease: 'Expo.easeOut' });

    // ── Header ──────────────────────────────────────────
    this.add.text(W / 2, H * 0.05, NARRATIVE.upgradeScreen.title, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '28px', fontStyle: 'bold',
      color: '#ffffff', letterSpacing: 6,
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.11, NARRATIVE.upgradeScreen.subtitle, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '13px', color: worldColorStr, letterSpacing: 2,
    }).setOrigin(0.5);

    // ── World / Level info ───────────────────────────────
    const nextLevelLabel = gs.level <= 4
      ? `MONDE ${gs.world} : Niveau ${gs.level}`
      : `MONDE ${gs.world + 1} : À venir`;

    this.add.text(W / 2, H * 0.15, nextLevelLabel, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '13px', color: '#aaccdd',
    }).setOrigin(0.5);

    // ── Score / Shards ───────────────────────────────────
    this.add.text(W - 20, H * 0.05, `SCORE: ${gs.score.toString().padStart(6, '0')}`, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '14px', color: '#ffcc00',
    }).setOrigin(1, 0.5);

    this.add.text(W - 20, H * 0.1, `◆ ${gs.voidShards} ÉCLATS`, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '12px', color: '#aa88ff',
    }).setOrigin(1, 0.5);

    // HP display
    let hpStr = '';
    for (let i = 0; i < gs.maxHp; i++) {
      hpStr += i < gs.hp ? '♥ ' : '♡ ';
    }
    this.add.text(20, H * 0.05, hpStr.trim(), {
      fontFamily: 'monospace',
      fontSize: '20px', color: '#ff3388',
    }).setOrigin(0, 0.5);

    // ── Pick 3 random upgrades ───────────────────────────
    const availableUpgrades = this._getAvailableUpgrades();
    const choices = Phaser.Utils.Array.Shuffle(availableUpgrades).slice(0, 3);

    // ── Draw upgrade cards ───────────────────────────────
    const cardY = H * 0.57;
    const cardW = 220, cardH = 300;
    const spacing = (W - 3 * cardW) / 4;

    choices.forEach((upg, i) => {
      const cardX = spacing + cardW / 2 + i * (cardW + spacing);
      this._createUpgradeCard(cardX, cardY, cardW, cardH, upg, i);
    });

    // ── Skip button ──────────────────────────────────────
    const skipBtn = this.add.text(W / 2, H * 0.92, '[ PASSER ]', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '14px', color: '#99aabb', letterSpacing: 3,
    }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
    skipBtn.on('pointerover', () => skipBtn.setColor('#ffffff'));
    skipBtn.on('pointerout',  () => skipBtn.setColor('#99aabb'));
    skipBtn.on('pointerdown', () => this._proceed());

    // ── Current upgrades strip ───────────────────────────
    if (gs.upgrades.length > 0) {
      this.add.text(20, H * 0.85, 'ACTIFS:', {
        fontFamily: 'Share Tech Mono, Courier New',
        fontSize: '11px', color: '#99aabb',
      });
      gs.upgrades.slice(0, 6).forEach((u, i) => {
        this.add.text(70 + i * 90, H * 0.85, u.name.slice(0, 12), {
          fontFamily: 'Share Tech Mono, Courier New',
          fontSize: '9px',
          color: `#${(u.color || 0x00e5ff).toString(16).padStart(6, '0')}`,
        });
      });
    }

    // Camera fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  _createUpgradeCard(x, y, w, h, upg, index) {
    const H = this.scale.height;
    const color = upg.color || 0x00e5ff;
    const colorStr = `#${color.toString(16).padStart(6, '0')}`;
    const rarityColors = { common: '#667788', rare: '#8844ff', epic: '#ff8800' };
    const rarityColor = rarityColors[upg.rarity] || '#667788';

    // Entrance animation
    const startY = H + 100;

    // Card container (group of elements)
    const bg = this.add.rectangle(x, startY, w, h, 0x050a12, 1);
    const border = this.add.rectangle(x, startY, w, h, 0x000000, 0).setStrokeStyle(1, color, 0.4);
    const topBar = this.add.rectangle(x, startY - h / 2 + 4, w, 8, color, 0.6);

    // Rarity label
    const rarityLabel = this.add.text(x, startY - h / 2 + 18, upg.rarity.toUpperCase(), {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '9px', color: rarityColor, letterSpacing: 3,
    }).setOrigin(0.5);

    // Icon
    const icon = this.add.image(x, startY - h / 2 + 72, upg.icon || 'upgrade_wide').setScale(1.2);

    // Name
    const nameText = this.add.text(x, startY + 10, upg.name, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '14px', fontStyle: 'bold',
      color: colorStr, align: 'center',
      wordWrap: { width: w - 24 },
    }).setOrigin(0.5);

    // Description
    const descText = this.add.text(x, startY + 55, upg.desc, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '12px', color: '#ccddee', align: 'center',
      wordWrap: { width: w - 32 }, lineSpacing: 4,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Select button
    const btnBg = this.add.rectangle(x, startY + h / 2 - 28, w - 20, 32, color, 0.15);
    const btnText = this.add.text(x, startY + h / 2 - 28, 'SÉLECTIONNER', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '11px', fontStyle: 'bold', color: colorStr, letterSpacing: 2,
    }).setOrigin(0.5);
    const btnBorder = this.add.rectangle(x, startY + h / 2 - 28, w - 20, 32, 0x000000, 0)
      .setStrokeStyle(1, color, 0.6);

    const allElements = [bg, border, topBar, rarityLabel, icon, nameText, descText, btnBg, btnText, btnBorder];

    // Slide in animation
    const targetY = y;
    this.tweens.add({
      targets: allElements, y: `+=${targetY - startY}`,
      duration: 500, delay: 100 + index * 120, ease: 'Back.easeOut'
    });

    // Hover / click zones
    const zone = this.add.zone(x, startY, w, h).setInteractive({ cursor: 'pointer' });
    this.tweens.add({
      targets: zone, y: `+=${targetY - startY}`,
      duration: 500, delay: 100 + index * 120, ease: 'Back.easeOut'
    });

    zone.on('pointerover', () => {
      this.tweens.add({ targets: bg, scaleY: 1.02, scaleX: 1.02, duration: 100 });
      border.setStrokeStyle(2, color, 0.9);
      btnBg.setFillStyle(color, 0.3);
    });

    zone.on('pointerout', () => {
      this.tweens.add({ targets: bg, scaleY: 1, scaleX: 1, duration: 100 });
      border.setStrokeStyle(1, color, 0.4);
      btnBg.setFillStyle(color, 0.15);
    });

    zone.on('pointerdown', () => {
      this._selectUpgrade(upg, allElements, zone);
    });
  }

  _selectUpgrade(upg, elements, zone) {
    zone.removeInteractive();
    const gs = window.GameState;

    // Apply upgrade
    upg.apply(gs);
    gs.upgrades.push(upg);

    // Visual feedback
    this.cameras.main.flash(200, 100, 200, 100, false);
    this.cameras.main.shake(100, 0.005);

    // Fly-out animation
    this.tweens.add({
      targets: elements, scaleX: 1.1, scaleY: 1.1, alpha: 0,
      duration: 300, ease: 'Quad.easeIn',
      onComplete: () => {
        elements.forEach(e => e.destroy());
        zone.destroy();
      }
    });

    const colorStr = `#${(upg.color || 0x00e5ff).toString(16).padStart(6, '0')}`;
    this.add.text(this.scale.width / 2, this.scale.height * 0.5, upg.name + ' ACQUIS!', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '24px', fontStyle: 'bold', color: colorStr,
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.time.delayedCall(800, () => this._proceed());
  }

  _proceed() {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const gs = window.GameState;
      // Show world intro if new world started
      const ld = getLevelData(gs.world, gs.level);
      if (gs.level === 1 && gs.world <= 4) {
        const worldData = NARRATIVE.worlds[gs.world - 1];
        this.scene.start('NarrativeScene', {
          lines: [worldData.description, ...ld.intro ? [ld.intro] : []],
          nextScene: 'GameScene',
          worldColor: worldData.glowColor,
          title: worldData.name
        });
      } else {
        this.scene.start('GameScene');
      }
    });
  }

  _getAvailableUpgrades() {
    const gs = window.GameState;
    // Don't offer the same upgrade more than 3 times (except healing)
    const counts = {};
    gs.upgrades.forEach(u => { counts[u.id] = (counts[u.id] || 0) + 1; });
    return UPGRADES.filter(u => (counts[u.id] || 0) < 3 || u.id === 'healing_light');
  }

  _createStarField(W, H) {
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      this.add.circle(x, y, Phaser.Math.FloatBetween(0.3, 1.2), 0xffffff, Phaser.Math.FloatBetween(0.05, 0.3));
    }
  }

  _createGrid(W, H) {
    const g = this.add.graphics();
    g.lineStyle(1, 0x001133, 0.3);
    for (let x = 0; x < W; x += 60) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 60) g.lineBetween(0, y, W, y);
  }
}
