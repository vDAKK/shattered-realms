class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // ── FX + Music ────────────────────────────────────────
    if (window.Juice) window.Juice.applyScenePostFX(this, { bloom: false, scanlines: false, vignette: true, vignetteStrength: 0.04 });
    if (window.GameMusic) window.GameMusic.play('menu');

    // ── Background ────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x020810);
    this._createStarField(W, H);
    this._createGridLines(W, H);
    this._createFloatingParticles(W, H);

    // ── Title ─────────────────────────────────────────────
    const titleY = H * 0.14;

    const glowTitle = this.add.text(W / 2, titleY + 2, 'SHATTERED', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '42px', fontStyle: 'bold',
      color: '#001133', stroke: '#00e5ff', strokeThickness: 10,
    }).setOrigin(0.5).setAlpha(0.5);

    this.add.text(W / 2, titleY, 'SHATTERED', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '42px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#00aaff', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(W / 2, titleY + 50, 'R E A L M S', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '22px', fontStyle: 'bold',
      color: '#00e5ff', letterSpacing: 10,
    }).setOrigin(0.5);

    this.add.text(W / 2, titleY + 82, ': Un roguelite brick-breaker :', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '11px', color: '#88bbcc', letterSpacing: 1,
    }).setOrigin(0.5);

    // ── World label strip ─────────────────────────────────
    const worlds = [
      { name: 'CRISTAL', color: '#00e5ff' },
      { name: 'FORGE',   color: '#ff4400' },
      { name: 'VIDE',    color: '#aa00ff' },
      { name: 'JARDINS', color: '#ffaa33' },
      { name: 'NÉON',    color: '#00ff88' },
      { name: 'CŒUR',    color: '#ffffff' },
    ];
    let archivesUnlocked = false;
    try { archivesUnlocked = localStorage.getItem('sr_archives_unlocked') === '1'; } catch (e) {}
    if (archivesUnlocked) worlds.push({ name: 'ARCHIVES', color: '#e0e0e0' });
    const stripY = titleY + 110;
    const stepX = (W - 40) / worlds.length;
    worlds.forEach((w, i) => {
      const x = 20 + stepX / 2 + i * stepX;
      this.add.text(x, stripY, w.name, {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '9px', color: w.color, letterSpacing: 1,
      }).setOrigin(0.5);
      const line = this.add.rectangle(x, stripY + 12, stepX - 8, 1, parseInt(w.color.replace('#', '0x')), 0.6);
      this.tweens.add({
        targets: line, alpha: { from: 0.2, to: 0.9 },
        duration: 1200 + i * 300, yoyo: true, repeat: -1
      });
    });

    // ── Menu buttons ──────────────────────────────────────
    const hasSave = this._hasSavedRun();
    const btnY = H * 0.44;
    let row = 0;
    if (hasSave) {
      const save = this._loadSavedRun();
      const label = save ? `REPRENDRE  (M${save.world}-${save.level})` : 'REPRENDRE';
      this._createButton(W / 2, btnY + row * 55, label, '#44ff88', () => this._resumeRun());
      row++;
    }
    this._createButton(W / 2, btnY + row * 55, 'NOUVELLE PARTIE', '#00e5ff', () => this._startGame()); row++;
    this._createButton(W / 2, btnY + row * 55, 'AMÉLIORATIONS',   '#ffcc00', () => this._openMeta()); row++;
    this._createButton(W / 2, btnY + row * 55, 'CRÉDITS',          '#888888', () => this._showCredits());

    // ── Meta stats preview ────────────────────────────────
    const meta = this._loadMeta();
    const statsY = H * 0.76;
    this.add.text(W / 2, statsY, `MEILLEUR SCORE: ${(meta.bestScore || 0).toString().padStart(6, '0')}`, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '12px', color: '#aaccdd',
    }).setOrigin(0.5);
    this.add.text(W / 2, statsY + 18, `ÉCLATS: ${meta.totalShards || 0} ◆  |  PARTIES: ${meta.totalRuns || 0}  |  VICTOIRES: ${meta.wins || 0}`, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '10px', color: '#8899bb',
    }).setOrigin(0.5);

    // ── Controls hint ─────────────────────────────────────
    this.add.text(W / 2, H - 40, 'TOUCHER → déplacer  |  TAP → lancer', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '10px', color: '#88aabb',
    }).setOrigin(0.5);

    this.add.text(W / 2, H - 24, 'XP → upgrades en jeu  |  Éclats → upgrades permanents', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '10px', color: '#88aabb',
    }).setOrigin(0.5);

    // ── Pulsing glow ──────────────────────────────────────
    this.tweens.add({
      targets: glowTitle, alpha: { from: 0.3, to: 0.7 },
      duration: 1800, yoyo: true, repeat: -1
    });

    this.add.text(W - 8, H - 8, 'v2.0', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '10px', color: '#667788',
    }).setOrigin(1, 1);

    this._scanlineEffect(W, H);
  }

  _createButton(x, y, label, color, callback) {
    const W = this.scale.width;
    const btnW = W - 60;
    const bg = this.add.rectangle(x, y, btnW, 42, 0x000000, 0);
    const border = this.add.rectangle(x, y, btnW, 42, 0x000000, 0);
    border.setStrokeStyle(1, parseInt(color.replace('#', '0x')), 0.5);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '13px', fontStyle: 'bold',
      color: color, letterSpacing: 3,
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, btnW + 10, 46).setInteractive({ cursor: 'pointer' });

    zone.on('pointerover', () => {
      bg.setFillStyle(parseInt(color.replace('#', '0x')), 0.08);
      border.setStrokeStyle(1, parseInt(color.replace('#', '0x')), 1);
      text.setColor('#ffffff');
    });
    zone.on('pointerout', () => {
      bg.setFillStyle(0x000000, 0);
      border.setStrokeStyle(1, parseInt(color.replace('#', '0x')), 0.5);
      text.setColor(color);
    });
    zone.on('pointerdown', () => {
      this.tweens.add({
        targets: text, scaleX: 0.92, scaleY: 0.92,
        duration: 60, yoyo: true, onComplete: callback
      });
    });
  }

  _createStarField(W, H) {
    for (let i = 0; i < 150; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.FloatBetween(0.5, 1.5), 0xffffff,
        Phaser.Math.FloatBetween(0.1, 0.6)
      );
      if (Math.random() < 0.3) {
        this.tweens.add({
          targets: star, alpha: { from: star.alpha * 0.3, to: star.alpha },
          duration: Phaser.Math.Between(1000, 3000), yoyo: true, repeat: -1,
          delay: Phaser.Math.Between(0, 2000)
        });
      }
    }
  }

  _createGridLines(W, H) {
    const g = this.add.graphics();
    g.lineStyle(1, 0x001133, 0.3);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);
  }

  _createFloatingParticles(W, H) {
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(30, W - 30);
      const y = Phaser.Math.Between(30, H - 30);
      const color = Phaser.Utils.Array.GetRandom([0x00e5ff, 0xaa00ff, 0xff4400, 0x00ff88]);
      const p = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 3), color, 0.4);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-50, 50), y: y + Phaser.Math.Between(-40, 40),
        alpha: { from: 0.1, to: 0.6 },
        duration: Phaser.Math.Between(3000, 7000), yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }
  }

  _scanlineEffect(W, H) {
    const scanline = this.add.rectangle(W / 2, -2, W, 2, 0x00e5ff, 0.05);
    this.tweens.add({ targets: scanline, y: H + 2, duration: 4000, repeat: -1, delay: 2000 });
  }

  _hasSavedRun() {
    try { return !!localStorage.getItem('sr_run'); } catch (e) { return false; }
  }

  _loadSavedRun() {
    try { return JSON.parse(localStorage.getItem('sr_run') || 'null'); } catch (e) { return null; }
  }

  _resumeRun() {
    const snap = this._loadSavedRun();
    if (!snap) { this._startGame(); return; }
    const upgrades = (snap.upgradeIds || [])
      .map(id => UPGRADES.find(u => u.id === id))
      .filter(Boolean);
    window.GameState = {
      world: snap.world, level: snap.level, score: snap.score || 0,
      hp: snap.hp, maxHp: snap.maxHp,
      voidShards: snap.voidShards || 0,
      upgrades, // already-applied; do NOT re-call .apply()
      ballSpeed: snap.ballSpeed, paddleWidth: snap.paddleWidth, startBalls: snap.startBalls,
      hasLaser: !!snap.hasLaser, netBounces: snap.netBounces || 0,
      voidShieldCharges: snap.voidShieldCharges || 0,
      timeDilationCharges: snap.timeDilationCharges || 0,
      fireCoreDuration: snap.fireCoreDuration || 0,
      ghostDuration: snap.ghostDuration || 0,
      chainChance: snap.chainChance || 0,
      hasMagnet: !!snap.hasMagnet,
      explosiveEvery: snap.explosiveEvery || 0,
      bricksBroken: snap.bricksBroken || 0,
      bossesDefeated: snap.bossesDefeated || 0,
      enemiesKilled: snap.enemiesKilled || 0,
      xp: snap.xp || 0, xpLevel: snap.xpLevel || 0,
      maxCombo: snap.maxCombo || 0,
      piercingCount: snap.piercingCount || 0,
      scoreMult: snap.scoreMult || 1,
      puDurationMult: snap.puDurationMult || 1,
      dropLuckMult: snap.dropLuckMult || 1,
      metaUpgrades: snap.metaUpgrades || this._loadMeta(),
    };
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene'));
  }

  _startGame() {
    try { localStorage.removeItem('sr_run'); } catch (e) {}
    const meta = this._loadMeta();
    window.GameState = {
      world: 1, level: 1, score: 0,
      hp: 3 + (meta.extraHp || 0),
      maxHp: 3 + (meta.extraHp || 0),
      voidShards: 0, upgrades: [],
      ballSpeed: 520 + (meta.extraSpeed || 0),
      paddleWidth: 45 + (meta.extraPaddleW || 0),
      startBalls: 1 + (meta.extraBalls || 0),
      hasLaser: !!(meta.startLaser),
      netBounces: (meta.extraNet || 0),
      voidShieldCharges: 0, timeDilationCharges: 0,
      fireCoreDuration: 0, ghostDuration: 0,
      chainChance: 0, hasMagnet: false, explosiveEvery: 0,
      bricksBroken: 0, bossesDefeated: 0,
      xp: 0, xpLevel: 0, enemiesKilled: 0,
      piercingCount: 0, scoreMult: 1, puDurationMult: 1, dropLuckMult: 1,
      metaUpgrades: meta,
    };

    this.cameras.main.fadeOut(500, 0, 0, 0);
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
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.92).setDepth(200).setInteractive();

    // Title
    this.add.text(W / 2, H * 0.06, 'AMÉLIORATIONS PERMANENTES', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '14px', fontStyle: 'bold', color: '#ffcc00', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(201);

    // Shards display
    const shardsText = this.add.text(W / 2, H * 0.10, `◆ ${meta.totalShards || 0} ÉCLATS DISPONIBLES`, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '12px', color: '#aa88ff',
    }).setOrigin(0.5).setDepth(201);

    // Meta upgrades
    const upgrades = [
      { key: 'extraHp',      label: '+1 PV Max',          cost: 25,  max: 3,  unit: '' },
      { key: 'extraSpeed',   label: '+20 Vitesse Balle',  cost: 30,  max: 5,  unit: '', step: 20 },
      { key: 'extraBalls',   label: '+1 Balle Départ',    cost: 60,  max: 2,  unit: '' },
      { key: 'extraPaddleW', label: '+15px Palette',       cost: 25,  max: 4,  unit: 'px', step: 15 },
      { key: 'startLaser',   label: 'Laser Permanent',    cost: 50,  max: 1,  unit: '' },
      { key: 'extraNet',     label: '+2 Filet Départ',    cost: 40,  max: 3,  unit: '', step: 2 },
    ];

    const startY = H * 0.16;
    const elements = [overlay, shardsText];

    upgrades.forEach((upg, i) => {
      const y = startY + i * 72;
      const current = meta[upg.key] || 0;
      const currentLevel = upg.step ? current / upg.step : current;
      const isMaxed = currentLevel >= upg.max;
      const cost = upg.cost * (currentLevel + 1); // escalating cost

      // Card background
      const cardBg = this.add.rectangle(W / 2, y + 20, W - 24, 60, 0x060c18, 1).setDepth(201);
      const cardBorder = this.add.rectangle(W / 2, y + 20, W - 24, 60, 0, 0)
        .setStrokeStyle(1, isMaxed ? 0x334455 : 0xffcc00, 0.4).setDepth(201);

      const nameText = this.add.text(16, y + 8, upg.label, {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '11px', fontStyle: 'bold', color: isMaxed ? '#445566' : '#ffffff',
      }).setDepth(202);

      // Progress dots
      let progressStr = '';
      for (let j = 0; j < upg.max; j++) {
        progressStr += j < currentLevel ? '●' : '○';
      }
      const progressText = this.add.text(16, y + 26, progressStr, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffcc00',
      }).setDepth(202);

      // Buy button
      const btnColor = isMaxed ? 0x334455 : 0xffcc00;
      const btnLabel = isMaxed ? 'MAX' : `◆ ${cost}`;
      const btnBg = this.add.rectangle(W - 60, y + 20, 80, 30, btnColor, 0.15).setDepth(201);
      const btnBorder = this.add.rectangle(W - 60, y + 20, 80, 30, 0, 0)
        .setStrokeStyle(1, btnColor, 0.6).setDepth(201);
      const btnText = this.add.text(W - 60, y + 20, btnLabel, {
        fontFamily: 'Orbitron, Courier New',
        fontSize: '10px', fontStyle: 'bold', color: isMaxed ? '#445566' : '#ffcc00',
      }).setOrigin(0.5).setDepth(202);

      elements.push(cardBg, cardBorder, nameText, progressText, btnBg, btnBorder, btnText);

      if (!isMaxed) {
        const btnZone = this.add.zone(W - 60, y + 20, 85, 35).setInteractive({ cursor: 'pointer' }).setDepth(203);
        elements.push(btnZone);

        btnZone.on('pointerover', () => { btnBg.setFillStyle(btnColor, 0.35); });
        btnZone.on('pointerout',  () => { btnBg.setFillStyle(btnColor, 0.15); });
        btnZone.on('pointerdown', () => {
          const shards = meta.totalShards || 0;
          if (shards >= cost) {
            meta.totalShards = shards - cost;
            const step = upg.step || 1;
            meta[upg.key] = (meta[upg.key] || 0) + step;
            this._saveMeta(meta);
            // Refresh
            elements.forEach(el => el.destroy());
            this._openMeta();
          } else {
            this._showNotEnough(W, H);
          }
        });
      }
    });

    // Close button
    const closeBtn = this.add.text(W / 2, H * 0.92, '[ FERMER ]', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '12px', color: '#99bbcc', letterSpacing: 3,
    }).setOrigin(0.5).setDepth(202).setInteractive({ cursor: 'pointer' });
    elements.push(closeBtn);

    closeBtn.on('pointerdown', () => {
      elements.forEach(el => el.destroy());
    });

    // Also close on overlay click (outside cards)
    overlay.on('pointerdown', (ptr) => {
      if (ptr.y > H * 0.88) {
        elements.forEach(el => el.destroy());
      }
    });
  }

  _showNotEnough(W, H) {
    const t = this.add.text(W / 2, H * 0.85, 'Pas assez d\'éclats !', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '12px', color: '#ff4466',
    }).setOrigin(0.5).setDepth(300);
    this.tweens.add({
      targets: t, alpha: 0, y: H * 0.82,
      duration: 1000, delay: 600,
      onComplete: () => t.destroy()
    });
  }

  _showCredits() {
    const W = this.scale.width, H = this.scale.height;
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);
    const txt = this.add.text(W / 2, H / 2, [
      'SHATTERED REALMS',
      '',
      'Un roguelite brick-breaker',
      'narratif en portrait',
      '',
      'Propulsé par Phaser 3',
      '',
      'Cliquez pour fermer',
    ].join('\n'), {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '14px', color: '#00e5ff', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);

    overlay.setInteractive();
    overlay.on('pointerdown', () => { overlay.destroy(); txt.destroy(); });
  }

  _loadMeta() {
    try { return JSON.parse(localStorage.getItem('shattered_meta') || '{}'); } catch { return {}; }
  }

  _saveMeta(meta) {
    try { localStorage.setItem('shattered_meta', JSON.stringify(meta)); } catch {}
  }
}
