// ═══════════════════════════════════════════════════════
//  SHATTERED REALMS — GameScene (Portrait + Roguelite)
// ═══════════════════════════════════════════════════════
const GW = 480, GH = 854;
const BRICK_W = 30, BRICK_H = 14;
const BRICK_COLS = 14, BRICK_ROWS = 10;
const BRICK_OFFSET_X = 16, BRICK_OFFSET_Y = 92;
const BRICK_PAD_X = 2, BRICK_PAD_Y = 2;
const PADDLE_Y = GH - 64;
const BALL_SIZE = 14;

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ──────────────────────────────────────────────────────
  create() {
    const gs = window.GameState;
    this.levelData = getLevelData(gs.world, gs.level);

    // Post-FX + music
    if (window.Juice) window.Juice.applyScenePostFX(this, { bloomStrength: 0.5, vignetteStrength: 0.08 });
    if (window.GameMusic) {
      const isBoss = this.levelData && this.levelData.isBoss;
      let track = 'game';
      if (isBoss) track = 'boss';
      else if (gs.world === 1 && gs.level === 1) track = 'intro';
      window.GameMusic.play(track);
    }

    // State flags
    this.ballLaunched = false;
    this.gamePaused = false;
    this.bossPhase = 0;
    this.bossActive = false;
    this.bossDefeated = false;
    this.levelComplete = false;
    this.laserCooldown = 0;
    this.bricksBrokenThisLevel = 0;
    this.explosiveCounter = 0;
    this.hitstopTimer = 0;
    this.levelingUp = false;

    // Combo system
    this.combo = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;

    // Invader wave tracking
    this.invaderWaveCounter = 0;
    this.invaderWaveThreshold = 12;
    this.invaderWaveNum = 0;

    // Temporary power-up timers
    this.puExpandTimer = 0;
    this.puSlowTimer = 0;
    this.puLaserTimer = 0;
    this.puShieldTimer = 0;
    this.puFireTimer = 0;
    this.puGhostTimer = 0;
    this.puBombTimer = 0;
    this.puPierceTimer = 0;
    this.puMinigunTimer = 0;
    this.puFreezeTimer = 0;
    this.puDoubleTimer = 0;
    this.puSlow = false;
    this.puFire = false;
    this.puGhost = false;

    // Time dilation
    this.timeDilationActive = false;
    this.timeDilationTimer = 0;

    // Collections
    this.balls = [];
    this.bricks = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.playerLasers = [];
    this.powerUps = [];
    this.particles = [];
    this.levelUpElements = [];

    // ── Background ──────────────────────────────────────
    this._buildBackground();
    this._buildStarField();
    this._buildBiomeEffects();

    // ── Auto-save the run state at the start of each level ──
    this._saveRun();

    // ── HUD ─────────────────────────────────────────────
    this._buildHUD();

    // ── Bricks ──────────────────────────────────────────
    this._buildLevel();

    // ── Boss ────────────────────────────────────────────
    if (this.levelData.isBoss) {
      this._spawnBoss();
    }

    // ── Paddle ──────────────────────────────────────────
    this._buildPaddle();

    // ── Ball ────────────────────────────────────────────
    const numBalls = gs.startBalls || 1;
    for (let i = 0; i < numBalls; i++) {
      this._spawnBall();
    }

    // ── Shield net ──────────────────────────────────────
    this._buildShieldNet();

    // ── Particle emitter ────────────────────────────────
    this.particleEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 50, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: { min: 200, max: 700 },
      quantity: 1,
      emitting: false,
    });

    // ── World overlay label ──────────────────────────────
    this._showWorldLabel();

    // ── Input ────────────────────────────────────────────
    this.input.on('pointermove', (ptr) => {
      if (this.levelingUp || this.gamePaused) return;
      if (ptr.id === 0 || !this._mobileActionPointer || ptr.id !== this._mobileActionPointer) {
        this._movePaddle(ptr.x);
      }
    });
    this.input.on('pointerdown', (ptr) => {
      if (this.levelingUp) return;
      if (ptr.rightButtonDown()) { this._fireLaser(); return; }
      if (!this.ballLaunched) this._launchBall();
    });
    this.input.keyboard.on('keydown-SPACE', () => this._activateTimeDilation());
    this.input.keyboard.on('keydown-R', () => this._fireLaser());

    // ── Mobile buttons ───────────────────────────────────
    this._buildMobileButtons();

    // ── Camera fade in ───────────────────────────────────
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ── Level intro ──────────────────────────────────────
    this._showLevelIntro();
    this._applyStartBuffs();
  }

  // ──────────────────────────────────────────────────────
  update(time, delta) {
    if (this.gamePaused || this.levelComplete || this.levelingUp) return;

    // Hitstop freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= delta;
      return;
    }

    const gs = window.GameState;
    const timeScale = this.timeDilationActive ? 0.3 : 1.0;
    const scaledDelta = delta * timeScale;

    // ── Timers ──────────────────────────────────────────
    this._tickTimers(scaledDelta);

    // ── Combo decay ─────────────────────────────────────
    if (this.combo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // ── Ball logic ──────────────────────────────────────
    for (let i = this.balls.length - 1; i >= 0; i--) {
      this._updateBall(this.balls[i], scaledDelta);
    }

    // ── Enemies ─────────────────────────────────────────
    for (const enemy of this.enemies) {
      this._updateEnemy(enemy, scaledDelta);
    }

    // ── Enemy bullets ───────────────────────────────────
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      if (bullet.vx !== undefined) {
        if (bullet.homing && this.paddle) {
          const hdx = this.paddle.x - bullet.sprite.x;
          const hdy = PADDLE_Y - bullet.sprite.y;
          const hDist = Math.sqrt(hdx * hdx + hdy * hdy) || 1;
          const turnStr = 120 * (scaledDelta / 1000);
          bullet.vx += (hdx / hDist) * turnStr;
          bullet.vy += (hdy / hDist) * turnStr;
          const spd = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
          if (spd > 400) { bullet.vx = (bullet.vx / spd) * 400; bullet.vy = (bullet.vy / spd) * 400; }
        }
        bullet.sprite.x += bullet.vx * (scaledDelta / 1000);
        bullet.sprite.y += bullet.vy * (scaledDelta / 1000);
      } else {
        bullet.sprite.y += 220 * (scaledDelta / 1000);
      }
      if (bullet.sprite.y > GH + 20 || bullet.sprite.x < -20 || bullet.sprite.x > GW + 20) {
        bullet.sprite.destroy();
        this.enemyBullets.splice(i, 1);
        continue;
      }
      if (this._rectOverlap(bullet.sprite, this.paddle) && !this.timeDilationActive) {
        this._hitPaddleByBullet(bullet);
        this.enemyBullets.splice(i, 1);
      }
    }

    // ── Player lasers ────────────────────────────────────
    for (let i = this.playerLasers.length - 1; i >= 0; i--) {
      const laser = this.playerLasers[i];
      laser.sprite.y -= 600 * (scaledDelta / 1000);
      if (laser.sprite.y < -20) {
        laser.sprite.destroy();
        this.playerLasers.splice(i, 1);
        continue;
      }
      this._checkLaserBrickCollision(laser, i);
    }

    // ── Power-ups ────────────────────────────────────────
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.sprite.y += 100 * (scaledDelta / 1000);
      pu.sprite.rotation += 1.5 * (scaledDelta / 1000);
      pu.label.x = pu.sprite.x;
      pu.label.y = pu.sprite.y + 22;
      if (pu.sprite.y > GH + 30) {
        pu.sprite.destroy();
        pu.label.destroy();
        this.powerUps.splice(i, 1);
        continue;
      }
      if (this._rectOverlap(pu.sprite, this.paddle)) {
        this._collectPowerUp(pu);
        this.powerUps.splice(i, 1);
      }
    }

    // ── Boss ─────────────────────────────────────────────
    if (this.bossActive && !this.bossDefeated) {
      this._updateBoss(scaledDelta);
    }

    // ── HUD update ───────────────────────────────────────
    this._updateHUD();

    // ── Time dilation timer ──────────────────────────────
    if (this.timeDilationActive) {
      this.timeDilationTimer -= delta;
      if (this.timeDilationTimer <= 0) {
        this.timeDilationActive = false;
        this._showFloatingText(GW / 2, GH / 2, 'TEMPS NORMAL', '#8888ff');
      }
    }

    // ── Check win condition ──────────────────────────────
    if (!this.levelComplete) {
      this._checkWinCondition();
    }
  }

  // ══════════════════════════════════════════════════════
  //  BUILD METHODS
  // ══════════════════════════════════════════════════════

  _buildMobileButtons() {
    const isTouch = this.sys.game.device.input.touch;

    this._btnLaser = this._makeTouchBtn(GW - 40, GH - 36, 'LASER', 0xff4400, () => {
      this._fireLaser();
    });
    this._btnSlow = this._makeTouchBtn(40, GH - 36, 'SLOW', 0x8888ff, () => {
      this._activateTimeDilation();
    });

    if (!isTouch) {
      this._btnLaser.bg.setVisible(false);
      this._btnLaser.txt.setVisible(false);
      this._btnSlow.bg.setVisible(false);
      this._btnSlow.txt.setVisible(false);
    }
  }

  _makeTouchBtn(x, y, label, color, onPress) {
    const r = 28;
    const bg = this.add.circle(x, y, r, color, 0.18).setDepth(200);
    bg.setStrokeStyle(1.5, color, 0.6);
    const txt = this.add.text(x, y, label, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '8px', color: `#${color.toString(16).padStart(6, '0')}`,
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(201);

    const zone = this.add.zone(x, y, r * 2.2, r * 2.2).setInteractive().setDepth(202);
    zone.on('pointerdown', (ptr) => {
      this._mobileActionPointer = ptr.id;
      bg.setFillStyle(color, 0.45);
      onPress();
    });
    zone.on('pointerup',  () => { bg.setFillStyle(color, 0.18); this._mobileActionPointer = null; });
    zone.on('pointerout', () => { bg.setFillStyle(color, 0.18); this._mobileActionPointer = null; });

    return { bg, txt, zone };
  }

  _updateMobileButtons() {
    const gs = window.GameState;
    const isTouch = this.sys.game.device.input.touch;
    if (!isTouch || !this._btnLaser) return;

    const hasLaser = gs.hasLaser || this.puMinigunTimer > 0;
    this._btnLaser.bg.setAlpha(hasLaser ? 1 : 0.3);
    this._btnLaser.txt.setAlpha(hasLaser ? 1 : 0.3);

    const hasSlow = (gs.timeDilationCharges || 0) > 0 && !this.timeDilationActive;
    this._btnSlow.bg.setAlpha(hasSlow ? 1 : 0.3);
    this._btnSlow.txt.setAlpha(hasSlow ? 1 : 0.3);
    this._btnSlow.txt.setText(hasSlow ? `SLOW\nx${gs.timeDilationCharges}` : 'SLOW');
  }

  _buildBackground() {
    const worldColors = [null, 0x020818, 0x0f0300, 0x050008, 0x100600, 0x000a03, 0x030306, 0x0a0a0c];
    const wc = worldColors[window.GameState.world] || 0x020810;
    this.add.rectangle(GW / 2, GH / 2, GW, GH, wc);
    this.add.rectangle(GW / 2, 24, GW, 48, 0x000000, 0.4);
  }

  _buildStarField() {
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GW);
      const y = Phaser.Math.Between(0, GH);
      this.add.circle(x, y, Phaser.Math.FloatBetween(0.3, 1), 0xffffff, Phaser.Math.FloatBetween(0.05, 0.25));
    }
  }

  _buildBiomeEffects() {
    const world = window.GameState.world;
    switch (world) {
      case 1: this._biomeIce();   break;
      case 2: this._biomeForge(); break;
      case 3: this._biomeVoid();  break;
      case 4: this._biomeIce();   break; // Jardins — réutilise particules ambiantes
      case 5: this._biomeNeon();  break;
      case 6: this._biomeFinal(); break;
      case 7: this._biomeFinal(); break;
    }
  }

  _biomeIce() {
    for (let i = 0; i < 4; i++) {
      const x = Phaser.Math.Between(30, GW - 30);
      const beam = this.add.rectangle(x, GH / 2, 2, GH, 0x88ddff, 0);
      this.tweens.add({ targets: beam, alpha: { from: 0, to: 0.06 }, duration: Phaser.Math.Between(1800, 3500), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 4000) });
    }
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(0, GW), y = Phaser.Math.Between(50, GH - 80);
      const shard = this.add.rectangle(x, y, Phaser.Math.FloatBetween(1.5, 4), Phaser.Math.FloatBetween(4, 10), 0x88eeff, 0);
      shard.setRotation(Phaser.Math.FloatBetween(0, Math.PI));
      this.tweens.add({ targets: shard, y: y + Phaser.Math.Between(20, 60), alpha: { from: 0, to: 0.2 }, duration: Phaser.Math.Between(3000, 6000), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 4000) });
    }
  }

  _biomeForge() {
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, GW), startY = Phaser.Math.Between(GH * 0.5, GH);
      const ember = this.add.circle(x, startY, Phaser.Math.FloatBetween(1, 3),
        Phaser.Utils.Array.GetRandom([0xff4400, 0xff8800, 0xffcc00]), 0);
      this.tweens.add({
        targets: ember, y: startY - Phaser.Math.Between(100, 300), alpha: { from: 0, to: 0.5 },
        duration: Phaser.Math.Between(1500, 3000), delay: Phaser.Math.Between(0, 4000),
        repeat: -1, onRepeat: () => { ember.x = Phaser.Math.Between(0, GW); ember.y = Phaser.Math.Between(GH * 0.6, GH); }
      });
    }
  }

  _biomeVoid() {
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(0, GW), y = Phaser.Math.Between(50, GH);
      const wisp = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 3),
        Phaser.Utils.Array.GetRandom([0x9900ff, 0xcc00ff, 0x6600aa]), 0);
      this.tweens.add({ targets: wisp, x: x + Phaser.Math.Between(-40, 40), y: y + Phaser.Math.Between(-30, 30), alpha: { from: 0, to: 0.35 }, duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 3000) });
    }
  }

  _biomeNeon() {
    for (let i = 0; i < 6; i++) {
      const y = 50 + i * 130;
      const dot = this.add.circle(-4, y, 2, 0x00ff88, 0.6);
      this.tweens.add({ targets: dot, x: GW + 4, duration: Phaser.Math.Between(1000, 2500), delay: Phaser.Math.Between(0, 2000), repeat: -1 });
    }
    const scanLine = this.add.rectangle(GW / 2, 50, GW, 2, 0x00ff88, 0.12);
    this.tweens.add({ targets: scanLine, y: GH, duration: 3000, repeat: -1, onRepeat: () => { scanLine.y = 50; } });
  }

  _biomeFinal() {
    this._biomeIce();
    this._biomeVoid();
    for (let i = 0; i < 10; i++) {
      const flash = this.add.circle(Phaser.Math.Between(0, GW), Phaser.Math.Between(50, GH),
        Phaser.Math.FloatBetween(2, 6), Phaser.Utils.Array.GetRandom([0xffffff, 0xff4400, 0x00e5ff, 0xffcc00]), 0);
      this.tweens.add({ targets: flash, alpha: { from: 0, to: 0.4 }, duration: Phaser.Math.Between(400, 1000), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000) });
    }
  }

  _buildHUD() {
    const gs = window.GameState;
    const worldData = NARRATIVE.worlds[gs.world - 1];
    const worldColor = worldData ? parseInt(worldData.glowColor.replace('#', '0x')) : 0x00e5ff;
    const worldColorStr = worldData ? worldData.glowColor : '#00e5ff';

    // Top bar background
    this.add.rectangle(GW / 2, 24, GW, 48, 0x000000, 0.7).setDepth(10);
    this.add.rectangle(GW / 2, 48, GW, 1, worldColor, 0.5).setDepth(10);

    // World name (top-left)
    this.hudWorldText = this.add.text(8, 8, worldData ? worldData.name : 'MONDE 1', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '13px', color: worldColorStr, fontStyle: 'bold', letterSpacing: 1
    }).setDepth(11);

    // Level indicator
    const levelData = this.levelData;
    this.hudLevelText = this.add.text(8, 24, levelData.isBoss ? '⚡ BOSS' : `Niv ${gs.level}/4`, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '13px', color: '#aaccee', fontStyle: 'bold'
    }).setDepth(11);

    // Score (center)
    this.hudScore = this.add.text(GW / 2, 16, '0', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    this.add.text(GW / 2, 34, 'SCORE', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '11px', color: '#99aabb', letterSpacing: 2
    }).setOrigin(0.5).setDepth(11);

    // HP display (top-right)
    this.hpGroup = [];
    this._buildHPDisplay();

    // Combo text (below score)
    this.comboText = this.add.text(GW / 2, 42, '', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '13px', color: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    // ── XP Bar ──────────────────────────────────────────
    const xpBarY = 54;
    this.xpBarBg = this.add.rectangle(GW / 2, xpBarY, GW - 16, 8, 0x111122, 1).setDepth(10);
    this.xpBarFill = this.add.rectangle(8, xpBarY, 0, 8, 0x00e5ff, 1).setOrigin(0, 0.5).setDepth(10);
    this.xpBarBorder = this.add.rectangle(GW / 2, xpBarY, GW - 16, 8, 0x000000, 0).setStrokeStyle(1, 0x00e5ff, 0.4).setDepth(10);
    this.xpLevelText = this.add.text(GW / 2, xpBarY, `LV ${gs.xpLevel}`, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '10px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);

    // Active upgrades strip
    this.upgradeIcons = [];
    this._buildUpgradeStrip();

    // Power-up status bar
    this.puStatusText = this.add.text(GW - 8, 66, '', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '11px', color: '#00e5ff', align: 'right'
    }).setOrigin(1, 0).setDepth(11);

    // Boss health bar
    this._buildBossHealthBar();

    // Time dilation indicator
    this.tdIndicator = this.add.text(GW / 2, 80, '', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '12px', color: '#a0a0ff', letterSpacing: 3
    }).setOrigin(0.5).setAlpha(0).setDepth(11);
  }

  _buildHPDisplay() {
    const gs = window.GameState;
    this.hpGroup.forEach(h => h.destroy());
    this.hpGroup = [];
    for (let i = 0; i < gs.maxHp; i++) {
      const x = GW - 12 - i * 16;
      const filled = i < gs.hp;
      const heart = this.add.text(x, 8, '♥', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: filled ? '#ff3388' : '#331122',
        stroke: filled ? '#ff0044' : '#220011',
        strokeThickness: 1
      }).setOrigin(0.5, 0).setDepth(11);
      this.hpGroup.push(heart);
    }
  }

  _buildUpgradeStrip() {
    const gs = window.GameState;
    gs.upgrades.forEach((upg, i) => {
      if (i >= 10) return;
      const x = 8 + i * 14;
      const icon = this.add.circle(x, 68, 5, upg.color || 0x00e5ff, 0.7).setDepth(11);
      this.upgradeIcons.push(icon);
    });
  }

  _buildBossHealthBar() {
    this.bossHpBar = {
      bg:     this.add.rectangle(GW / 2, 78, 300, 8, 0x220000, 1).setVisible(false).setDepth(10),
      fill:   this.add.rectangle(GW / 2 - 150, 78, 300, 8, 0xff0044, 1).setVisible(false).setOrigin(0, 0.5).setDepth(10),
      label:  this.add.text(GW / 2, 88, '', {
        fontFamily: 'Orbitron, Courier New', fontSize: '14px', color: '#ff6688',
        fontStyle: 'bold', letterSpacing: 2,
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5, 0).setVisible(false).setDepth(11),
      border: this.add.rectangle(GW / 2, 78, 302, 10, 0x000000, 0).setVisible(false)
        .setStrokeStyle(1, 0xff0044, 0.6).setDepth(10),
    };
  }

  _buildLevel() {
    const gs = window.GameState;
    const grid = this.levelData.grid.map(row => [...row]); // clone

    // Dynamically inject bonus bricks based on total level number
    const totalLevel = (gs.world - 1) * 4 + gs.level;
    const bonusBricksToAdd = Math.min(totalLevel, 10);
    let added = 0;
    const emptyCells = [];
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 0 && r < BRICK_ROWS - 2) emptyCells.push({ r, c });
      });
    });
    Phaser.Utils.Array.Shuffle(emptyCells);
    for (let i = 0; i < bonusBricksToAdd && i < emptyCells.length; i++) {
      grid[emptyCells[i].r][emptyCells[i].c] = 9;
    }

    grid.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (cell === 0) return;

        const x = BRICK_OFFSET_X + colIdx * (BRICK_W + BRICK_PAD_X) + BRICK_W / 2;
        const y = BRICK_OFFSET_Y + rowIdx * (BRICK_H + BRICK_PAD_Y) + BRICK_H / 2;

        const hpMap = [0, 1, 1, 1, 2, 2, 3, 3, Infinity, 1];
        const hp = hpMap[cell] || 1;
        const maxHp = hp;
        const indestructible = (cell === 8);

        const sprite = this.add.image(x, y, `brick_${cell}`);

        const brick = { sprite, hp, maxHp, indestructible, cell, x, y, col: colIdx, row: rowIdx };
        // Mark secret bricks (subtle golden glow)
        if (this.levelData.secrets && this.levelData.secrets.some(s => s.col === colIdx && s.row === rowIdx)) {
          brick.isSecret = true;
          sprite.setTint(0xffe066);
          this.tweens.add({
            targets: sprite, alpha: { from: 1, to: 0.55 },
            duration: 700, yoyo: true, repeat: -1,
          });
        }
        this.bricks.push(brick);

        sprite.setAlpha(0).setY(y - 20);
        this.tweens.add({
          targets: sprite, alpha: 1, y: y,
          duration: 200 + rowIdx * 40,
          delay: colIdx * 15 + rowIdx * 25,
          ease: 'Back.easeOut'
        });
      });
    });

    // Spawn enemies
    this.levelData.enemies.forEach((eData) => {
      this._spawnEnemy(eData);
    });

    // Difficulty scaling: add extra enemies for later levels
    const extraEnemies = Math.floor(totalLevel / 3);
    for (let i = 0; i < extraEnemies; i++) {
      const types = ['drifter', 'shooter', 'guardian'];
      const type = types[Math.min(Math.floor(i / 2), 2)];
      const col = Phaser.Math.Between(1, 12);
      this._spawnEnemy({ type, col, row: 0 });
    }
  }

  _buildPaddle() {
    const gs = window.GameState;
    this.paddle = this.add.image(GW / 2, PADDLE_Y, 'paddle');
    this.paddle.setDisplaySize(gs.paddleWidth, 14);
    this.paddleGlow = this.add.rectangle(GW / 2, PADDLE_Y, gs.paddleWidth, 14, 0x00e5ff, 0.08);
  }

  _buildShieldNet() {
    const gs = window.GameState;
    this.shieldNet = this.add.image(GW / 2, GH - 8, 'shield_net');
    this.shieldNet.setVisible(gs.netBounces > 0 || this.puShieldTimer > 0);
    this.shieldNetBounces = gs.netBounces || 0;
    if (this.shieldNet.visible && this.shieldNetBounces > 0) this._flashShield();
  }

  _spawnBall(x, y, vx, vy) {
    const gs = window.GameState;
    const bx = x || GW / 2;
    const by = y || PADDLE_Y - 16;
    const launched = (vx !== undefined);

    const sprite = this.add.image(bx, by, 'ball');
    const glow   = this.add.image(bx, by, 'ball_glow').setAlpha(0.4).setDepth(-1);

    const ball = { sprite, glow, vx: vx || 0, vy: vy || 0, launched, trail: [], trailMax: 10, piercesLeft: 0 };
    this.balls.push(ball);

    if (!launched && this.balls.length === 1) {
      this.ballLaunched = false;
    }
    return ball;
  }

  _spawnEnemy(eData) {
    const x = BRICK_OFFSET_X + eData.col * (BRICK_W + BRICK_PAD_X) + BRICK_W / 2;
    const y = BRICK_OFFSET_Y - 30;

    const typeKey = `enemy_${eData.type}`;
    const sprite = this.add.image(x, y, typeKey).setScale(0.7);

    const world = window.GameState.world;
    const diffMult = 1 - (world - 1) * 0.18;

    const enemy = {
      sprite, type: eData.type, x, y,
      hp: eData.type === 'guardian' ? 2 + Math.floor(world / 2) : (eData.type === 'invader' ? 1 : 1),
      dir: 1,
      speed: (eData.type === 'drifter' || eData.type === 'invader' ? 70 : (eData.type === 'guardian' ? 55 : 0)) + world * 10,
      fireRate: eData.type === 'shooter' ? Math.max(600, 2400 * diffMult)
        : eData.type === 'guardian' ? Math.max(800, 2800 * diffMult)
        : eData.type === 'invader' ? Math.max(1200, 3000 * diffMult) : 99999,
      fireTimer: 600 + Math.random() * 1200,
      alive: true,
      isInvader: eData.type === 'invader',
      descendSpeed: eData.type === 'invader' ? 8 + world * 2 : 0,
    };
    this.enemies.push(enemy);

    sprite.setAlpha(0).setY(y - 20);
    this.tweens.add({ targets: sprite, alpha: 1, y, duration: 300, delay: 400, ease: 'Back.easeOut' });
  }

  _spawnInvaderWave() {
    this.invaderWaveNum++;
    const gs = window.GameState;
    const totalLevel = (gs.world - 1) * 4 + gs.level;
    const count = Math.min(3 + Math.floor(totalLevel / 4), 8);
    const spacing = Math.min(GW / (count + 1), 60);
    const startX = (GW - (count - 1) * spacing) / 2;

    for (let i = 0; i < count; i++) {
      const col = Math.floor((startX + i * spacing - BRICK_OFFSET_X) / (BRICK_W + BRICK_PAD_X));
      this._spawnEnemy({ type: 'invader', col: Phaser.Math.Clamp(col, 0, 13), row: 0 });
    }

    this._showFloatingText(GW / 2, GH / 2 - 60, '⚠ VAGUE D\'ENVAHISSEURS!', '#ff4466', 16);
    this.cameras.main.shake(100, 0.005);
  }

  _spawnBoss() {
    const bossData = this.levelData.boss;
    const keyMap = {
      crystal_warden: 'boss_crystal_warden',
      forge_tyrant:   'boss_forge_tyrant',
      void_lurker:    'boss_void_lurker',
      circuit_mind:   'boss_circuit_mind',
      void_architect: 'boss_void_architect',
      petrified_queen:  'boss_petrified_queen',
      primordial_idea:  'boss_primordial_idea',
    };
    const bossKey = keyMap[bossData.type] || 'boss_crystal_warden';

    this.boss = {
      sprite: this.add.image(GW / 2, 140, bossKey),
      hp: bossData.hp, maxHp: bossData.hp,
      speed: bossData.speed * 0.6, fireRate: bossData.fireRate,
      fireTimer: bossData.fireRate,
      dir: 1, phase: 1, type: bossData.type, alive: true, hitCooldown: 0,
    };

    const ws = NARRATIVE.worlds[window.GameState.world - 1];
    const bossName = ws ? ws.bossName : 'BOSS';
    this.bossHpBar.bg.setVisible(true);
    this.bossHpBar.fill.setVisible(true);
    this.bossHpBar.label.setVisible(true).setText(bossName);
    this.bossHpBar.border.setVisible(true);

    this.boss.sprite.setAlpha(0).setY(-60);
    this.tweens.add({
      targets: this.boss.sprite, alpha: 1, y: 140,
      duration: 700, ease: 'Back.easeOut',
      onComplete: () => { this.bossActive = true; }
    });

    this.cameras.main.flash(300, 255, 0, 50, false);
    this._showFloatingText(GW / 2, GH / 2, '⚡ BOSS', '#ff4466', 36);
  }

  // ══════════════════════════════════════════════════════
  //  UPDATE METHODS
  // ══════════════════════════════════════════════════════

  _movePaddle(mouseX) {
    const gs = window.GameState;
    const hw = gs.paddleWidth / 2;
    const clampedX = Phaser.Math.Clamp(mouseX, hw + 4, GW - hw - 4);
    this.paddle.x = clampedX;
    this.paddleGlow.x = clampedX;
    this.paddle.setDisplaySize(gs.paddleWidth, 14);
    this.paddleGlow.width = gs.paddleWidth;

    if (!this.ballLaunched && this.balls.length > 0) {
      const ball = this.balls[0];
      if (!ball.launched) {
        ball.sprite.x = clampedX;
        ball.glow.x = clampedX;
      }
    }
  }

  _launchBall() {
    if (this.ballLaunched) return;
    this.ballLaunched = true;
    const gs = window.GameState;

    this.balls.forEach((ball, i) => {
      if (!ball.launched) {
        ball.launched = true;
        const angle = -Math.PI / 2 + (i === 0 ? 0 : (i % 2 === 0 ? 1 : -1) * 0.3);
        ball.vx = Math.cos(angle) * gs.ballSpeed;
        ball.vy = Math.sin(angle) * gs.ballSpeed;
      }
    });

    if (gs.fireCoreDuration > 0) {
      this.puFireTimer = gs.fireCoreDuration;
      this.puFire = true;
    }
    if (gs.ghostDuration > 0) {
      this.puGhostTimer = gs.ghostDuration;
      this.puGhost = true;
    }
  }

  _updateBall(ball, scaledDelta) {
    if (!ball.launched) return;
    const gs = window.GameState;
    const dt = scaledDelta / 1000;

    // Magnet
    if (gs.hasMagnet) {
      const steer = (this.paddle.x - ball.sprite.x) * 0.28;
      ball.vx += steer * dt;
      const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (spd > gs.ballSpeed * 1.9) {
        ball.vx = (ball.vx / spd) * gs.ballSpeed * 1.9;
        ball.vy = (ball.vy / spd) * gs.ballSpeed * 1.9;
      }
    }

    // Move
    ball.sprite.x += ball.vx * dt;
    ball.sprite.y += ball.vy * dt;
    ball.glow.x = ball.sprite.x;
    ball.glow.y = ball.sprite.y;

    // Trail
    this._updateBallTrail(ball);

    // Tint
    if (this.puFire)       ball.sprite.setTint(0xff6600);
    else if (this.puGhost) ball.sprite.setTint(0x8888ff);
    else if (this.puPierceTimer > 0) ball.sprite.setTint(0x00ffcc);
    else                   ball.sprite.clearTint();

    // Wall bounces
    if (ball.sprite.x <= BALL_SIZE / 2) {
      ball.sprite.x = BALL_SIZE / 2;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.sprite.x >= GW - BALL_SIZE / 2) {
      ball.sprite.x = GW - BALL_SIZE / 2;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.sprite.y <= 60 + BALL_SIZE / 2) {
      ball.sprite.y = 60 + BALL_SIZE / 2;
      ball.vy = Math.abs(ball.vy);
    }

    // Paddle collision
    if (this._ballHitsPaddle(ball)) {
      this._bounceBallOffPaddle(ball);
      this._emitParticles(ball.sprite.x, ball.sprite.y, 0x00e5ff, 6);
    }

    // Brick collisions
    const isPiercing = this.puGhost || this.puPierceTimer > 0 || (gs.piercingCount > 0 && ball.piercesLeft > 0);
    if (!isPiercing) {
      this._checkBallBrickCollisions(ball);
    } else {
      this._checkBallBrickGhost(ball);
    }

    // Enemy collision
    this._checkBallEnemyCollisions(ball);

    // Boss collision
    if (this.bossActive && !this.bossDefeated && this.boss) {
      this._checkBallBossCollision(ball);
    }

    // Fell off bottom
    if (ball.sprite.y > GH + 20) {
      this._ballFell(ball);
    }
  }

  _ballHitsPaddle(ball) {
    const p = this.paddle;
    const hw = (window.GameState.paddleWidth / 2) + BALL_SIZE / 2;
    const hh = 7 + BALL_SIZE / 2;
    return (
      ball.vy > 0 &&
      ball.sprite.y + BALL_SIZE / 2 >= p.y - 7 &&
      ball.sprite.y - BALL_SIZE / 2 <= p.y + 7 &&
      ball.sprite.x >= p.x - hw &&
      ball.sprite.x <= p.x + hw
    );
  }

  _bounceBallOffPaddle(ball) {
    const gs = window.GameState;
    const p = this.paddle;
    const hw = gs.paddleWidth / 2;
    const relX = Phaser.Math.Clamp((ball.sprite.x - p.x) / hw, -0.95, 0.95);
    const maxAngle = 70 * (Math.PI / 180);
    const bounceAngle = relX * maxAngle;
    const spd = Math.max(Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy), gs.ballSpeed);
    ball.vx = spd * Math.sin(bounceAngle);
    ball.vy = -spd * Math.cos(bounceAngle);
    ball.sprite.y = p.y - BALL_SIZE / 2 - 7 - 1;
    ball.piercesLeft = gs.piercingCount || 0;

    if (window.SFX) window.SFX.play('paddleHit');

    // Paddle flash
    this.tweens.add({ targets: this.paddle, alpha: { from: 0.6, to: 1 }, duration: 80 });
    // Paddle scale punch
    this.tweens.add({
      targets: this.paddle, scaleY: 1.3,
      duration: 40, yoyo: true, ease: 'Quad.easeOut'
    });
  }

  _checkBallBrickCollisions(ball) {
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      if (!brick.sprite.visible) continue;
      if (brick.indestructible) {
        if (this._ballHitsBrick(ball, brick)) {
          this._resolveBounceBrick(ball, brick);
        }
        continue;
      }
      if (this._ballHitsBrick(ball, brick)) {
        this._resolveBounceBrick(ball, brick);
        this._damageBrick(brick, i);
        break;
      }
    }
  }

  _checkBallBrickGhost(ball) {
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      if (!brick.sprite.visible || brick.indestructible) continue;
      if (this._ballHitsBrick(ball, brick)) {
        this._damageBrick(brick, i);
      }
    }
  }

  _ballHitsBrick(ball, brick) {
    const hw = BRICK_W / 2 + BALL_SIZE / 2;
    const hh = BRICK_H / 2 + BALL_SIZE / 2;
    return (
      Math.abs(ball.sprite.x - brick.sprite.x) < hw &&
      Math.abs(ball.sprite.y - brick.sprite.y) < hh
    );
  }

  _resolveBounceBrick(ball, brick) {
    const overlapX = (BRICK_W / 2 + BALL_SIZE / 2) - Math.abs(ball.sprite.x - brick.sprite.x);
    const overlapY = (BRICK_H / 2 + BALL_SIZE / 2) - Math.abs(ball.sprite.y - brick.sprite.y);
    if (overlapX < overlapY) {
      ball.vx *= -1;
      ball.sprite.x += ball.vx > 0 ? overlapX : -overlapX;
    } else {
      ball.vy *= -1;
      ball.sprite.y += ball.vy > 0 ? overlapY : -overlapY;
    }
  }

  _damageBrick(brick, index) {
    if (brick.indestructible) return;
    const gs = window.GameState;

    const damage = this.puFire ? brick.hp : 1;
    brick.hp -= damage;
    if (window.SFX) window.SFX.play(brick.hp <= 0 ? 'brickBreak' : 'brickHit', { minGap: 0.015 });
    this.bricksBrokenThisLevel++;

    // Combo-driven ball acceleration — every brick destroyed makes the game more nervous
    if (brick.hp <= 0) {
      const targetMult = Math.min(1 + this.combo * 0.025, 1.7);
      const targetSpeed = gs.ballSpeed * targetMult;
      this.balls.forEach(b => {
        const s = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (s > 0 && s < targetSpeed) {
          const k = (s + (targetSpeed - s) * 0.35) / s;
          b.vx *= k;
          b.vy *= k;
        }
      });
    }
    this.explosiveCounter++;
    gs.bricksBroken = (gs.bricksBroken || 0) + 1;

    // Combo
    this.combo++;
    this.comboTimer = 1500;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
      gs.maxCombo = this.combo;
    }

    if (brick.hp <= 0) {
      // Secret fragment collected
      if (brick.isSecret) {
        this._collectSecret(brick.sprite.x, brick.sprite.y);
      }
      // XP gain
      const xpGain = Math.floor((brick.maxHp * 4 + this.combo) * (this.puDoubleTimer > 0 ? 2 : 1));
      this._addXP(xpGain, brick.sprite.x, brick.sprite.y);

      // Destroyed effects — JUICE
      const color = this._brickColor(brick.cell);
      this._emitParticles(brick.sprite.x, brick.sprite.y, color, 18);
      this._emitParticles(brick.sprite.x, brick.sprite.y, 0xffffff, 6);
      this._destroyBrick(brick, index);

      // Score with combo multiplier
      const comboMult = 1 + Math.min(this.combo * 0.1, 2);
      const pts = Math.floor(brick.maxHp * 10 * gs.world * comboMult * (gs.scoreMult || 1) * (this.puDoubleTimer > 0 ? 2 : 1));
      gs.score += pts;
      this._showFloatingScore(brick.sprite.x, brick.sprite.y, pts);

      // Show combo text
      if (this.combo >= 3) {
        this._showFloatingText(brick.sprite.x, brick.sprite.y - 20,
          `x${this.combo} COMBO!`,
          this.combo >= 10 ? '#ff4400' : this.combo >= 5 ? '#ffcc00' : '#00e5ff',
          this.combo >= 10 ? 18 : 14
        );
      }

      // Hitstop — only on combo milestones or tough bricks, never stacked
      // (rapid-fire kills like minigun were chaining 60ms freezes back-to-back)
      let stop = 0;
      if (this.combo > 0 && this.combo % 10 === 0) stop = 35;
      else if (brick.maxHp >= 3) stop = 18;
      if (stop > this.hitstopTimer) this.hitstopTimer = stop;

      // Camera flash matching brick color
      const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
      // flash supprimé (désagréable à chaque impact)

      // Chain reaction
      if (gs.chainChance && Math.random() < gs.chainChance) {
        this.time.delayedCall(60, () => this._chainExplode(brick));
      }

      // Explosive every N bricks
      if (gs.explosiveEvery && this.explosiveCounter >= gs.explosiveEvery) {
        this.explosiveCounter = 0;
        this._explosiveArea(brick.sprite.x, brick.sprite.y);
      }

      // Power-up drop (rarer: 8% base, modified by luck)
      const dropChance = 0.08 * (gs.dropLuckMult || 1);
      if (brick.cell === 9 || Math.random() < dropChance) {
        this._dropPowerUp(brick.sprite.x, brick.sprite.y);
      }

      // Invader wave trigger
      this.invaderWaveCounter++;
      if (this.invaderWaveCounter >= this.invaderWaveThreshold && !this.levelData.isBoss) {
        this.invaderWaveCounter = 0;
        this.invaderWaveThreshold = Math.max(8, this.invaderWaveThreshold - 1);
        this._spawnInvaderWave();
      }

    } else {
      // Cracked
      brick.sprite.setTexture(`brick_${brick.cell}_cracked`);
      this._emitParticles(brick.sprite.x, brick.sprite.y, this._brickColor(brick.cell), 5);
      this.cameras.main.shake(50, 0.004);
      // No hitstop on simple cracks — only on destruction. Avoids minigun freeze.
    }
  }

  _destroyBrick(brick, index) {
    // Scale-up pop effect
    this.tweens.add({
      targets: brick.sprite,
      scaleX: 1.5, scaleY: 1.5, alpha: 0,
      duration: 120, ease: 'Quad.easeOut',
      onComplete: () => brick.sprite.destroy()
    });
    this.bricks.splice(index, 1);
    this.cameras.main.shake(40, 0.004);
  }

  _chainExplode(sourceBrick) {
    const sx = sourceBrick.sprite.x || sourceBrick.x;
    const sy = sourceBrick.sprite.y || sourceBrick.y;
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const b = this.bricks[i];
      if (b.indestructible) continue;
      const dx = b.sprite.x - sx, dy = b.sprite.y - sy;
      if (Math.sqrt(dx * dx + dy * dy) < (BRICK_W + BRICK_PAD_X) * 1.8) {
        const bx = b.sprite.x, by = b.sprite.y;
        this._emitParticles(bx, by, this._brickColor(b.cell), 10);
        b.sprite.destroy();
        this.bricks.splice(i, 1);
        window.GameState.score += b.maxHp * 5;
        this._addXP(b.maxHp * 2, bx, by);
      }
    }
    this.cameras.main.shake(100, 0.008);
    this._showFloatingText(sx, sy, 'CHAÎNE!', '#ffaa00', 18);
  }

  _explosiveArea(cx, cy) {
    if (window.SFX) window.SFX.play('explode');
    const radius = BRICK_W * 2.5;
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const b = this.bricks[i];
      if (b.indestructible) continue;
      const dx = b.sprite.x - cx, dy = b.sprite.y - cy;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        const bx = b.sprite.x, by = b.sprite.y;
        this._emitParticles(bx, by, 0xff8800, 12);
        b.sprite.destroy();
        this.bricks.splice(i, 1);
        window.GameState.score += b.maxHp * 8;
        this._addXP(b.maxHp * 3, bx, by);
      }
    }
    this._emitParticles(cx, cy, 0xffcc00, 30);
    this.cameras.main.shake(120, 0.012);
    this.hitstopTimer = 50;
    this._showFloatingText(cx, cy, 'EXPLOSION!', '#ff8800', 22);
  }

  _checkBallEnemyCollisions(ball) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.alive) continue;
      const dx = ball.sprite.x - enemy.sprite.x;
      const dy = ball.sprite.y - enemy.sprite.y;
      if (Math.sqrt(dx * dx + dy * dy) < 18) {
        enemy.hp--;
        ball.vy *= -1;
        this._emitParticles(enemy.sprite.x, enemy.sprite.y, 0xff4466, 10);
        if (window.SFX) window.SFX.play(enemy.hp <= 0 ? 'enemyDie' : 'enemyHit');
        if (enemy.hp <= 0) {
          this._killEnemy(enemy, i);
          const pts = (enemy.isInvader ? 80 : 50) * window.GameState.world;
          window.GameState.score += pts;
          this._addXP(enemy.isInvader ? 12 : 7, enemy.sprite.x, enemy.sprite.y);
          this._showFloatingScore(enemy.sprite.x, enemy.sprite.y, pts);
        } else {
          this.tweens.add({ targets: enemy.sprite, alpha: 0.3, duration: 60, yoyo: true });
        }
        break;
      }
    }
  }

  _checkBallBossCollision(ball) {
    if (!this.boss || !this.boss.alive) return;
    if (this.boss.hitCooldown > 0) return;
    const boss = this.boss;
    const dx = ball.sprite.x - boss.sprite.x;
    const dy = ball.sprite.y - boss.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hitRadius = 45;

    if (dist < hitRadius) {
      const dmg = this.puFire ? 3 : 1;
      boss.hp -= dmg;
      boss.hitCooldown = 200;

      const nx = dx / dist, ny = dy / dist;
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;

      const ratio = Math.max(0, boss.hp / boss.maxHp);
      this.bossHpBar.fill.setDisplaySize(300 * ratio, 8);

      this._addXP(10, boss.sprite.x, boss.sprite.y);
      if (window.SFX) window.SFX.play('bossHit');

      if (boss.hp <= 0) {
        this._defeatBoss();
      } else {
        this.tweens.add({ targets: boss.sprite, alpha: 0.3, duration: 80, yoyo: true });
        this.cameras.main.shake(80, 0.008);
        this._emitParticles(boss.sprite.x, boss.sprite.y, 0xff0044, 14);
        this.hitstopTimer = 30;

        const newPhase = boss.hp < boss.maxHp * 0.33 ? 3 : boss.hp < boss.maxHp * 0.66 ? 2 : 1;
        if (newPhase > boss.phase) {
          boss.phase = newPhase;
          boss.speed *= 1.2;
          boss.fireRate = Math.max(500, boss.fireRate * 0.75);
          this._showFloatingText(GW / 2, GH / 3, `PHASE ${newPhase}!`, '#ff4400', 28);
          this.cameras.main.flash(200, 255, 50, 0, false);
          this.hitstopTimer = 60;
        }
      }
    }
  }

  _checkLaserBrickCollision(laser, laserIndex) {
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      if (brick.indestructible) continue;
      if (
        Math.abs(laser.sprite.x - brick.sprite.x) < BRICK_W / 2 + 2 &&
        laser.sprite.y >= brick.sprite.y - BRICK_H / 2 &&
        laser.sprite.y <= brick.sprite.y + BRICK_H / 2
      ) {
        this._damageBrick(brick, i);
        laser.sprite.destroy();
        this.playerLasers.splice(laserIndex, 1);
        return;
      }
    }

    // Boss hit
    if (this.bossActive && !this.bossDefeated && this.boss) {
      const boss = this.boss;
      if (Math.abs(laser.sprite.x - boss.sprite.x) < 45 && Math.abs(laser.sprite.y - boss.sprite.y) < 40) {
        boss.hp -= 2;
        const ratio = Math.max(0, boss.hp / boss.maxHp);
        this.bossHpBar.fill.setDisplaySize(300 * ratio, 8);
        this._emitParticles(laser.sprite.x, laser.sprite.y, 0xff6600, 6);
        laser.sprite.destroy();
        this.playerLasers.splice(laserIndex, 1);
        this._addXP(5, boss.sprite.x, boss.sprite.y);
        if (boss.hp <= 0) this._defeatBoss();
      }
    }

    // Enemy hit
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.alive) continue;
      if (Math.abs(laser.sprite.x - enemy.sprite.x) < 16 && Math.abs(laser.sprite.y - enemy.sprite.y) < 16) {
        enemy.hp--;
        this._emitParticles(enemy.sprite.x, enemy.sprite.y, 0xff4466, 6);
        if (enemy.hp <= 0) {
          this._killEnemy(enemy, i);
          window.GameState.score += 50 * window.GameState.world;
          this._addXP(7, enemy.sprite.x, enemy.sprite.y);
        }
        laser.sprite.destroy();
        this.playerLasers.splice(laserIndex, 1);
        return;
      }
    }
  }

  _updateEnemy(enemy, scaledDelta) {
    if (!enemy.alive || this.puFreezeTimer > 0) return;
    const dt = scaledDelta / 1000;

    if (enemy.type === 'drifter' || enemy.type === 'guardian' || enemy.type === 'invader') {
      enemy.sprite.x += enemy.speed * enemy.dir * dt;
      if (enemy.sprite.x > GW - 20) enemy.dir = -1;
      if (enemy.sprite.x < 20) enemy.dir = 1;
    }
    if (enemy.type === 'guardian') {
      enemy.sprite.y = enemy.y + Math.sin(this.time.now * 0.002) * 15;
    }
    if (enemy.isInvader) {
      enemy.sprite.y += enemy.descendSpeed * dt;
      if (enemy.sprite.y > PADDLE_Y - 40) {
        this._killEnemy(enemy, this.enemies.indexOf(enemy));
        this._loseHP();
        return;
      }
    }

    enemy.fireTimer -= scaledDelta;
    if (enemy.fireTimer <= 0) {
      enemy.fireTimer = enemy.fireRate + Math.random() * 800;
      if (enemy.type !== 'drifter') {
        this._enemyFire(enemy);
      }
    }

    enemy.sprite.alpha = 0.8 + Math.sin(this.time.now * 0.003 + enemy.sprite.x) * 0.2;
  }

  _updateBoss(scaledDelta) {
    const boss = this.boss;
    const dt = scaledDelta / 1000;
    const t = this.time.now;

    if (boss.hitCooldown > 0) boss.hitCooldown -= scaledDelta;

    // ── Per-type movement ─────────────────────────────────
    switch (boss.type) {
      case 'petrified_queen': {
        // Lent, ample, "respiration" sinusoïdale + dash latéral en phase 3
        const sway = Math.sin(t * 0.0012) * (GW * 0.32);
        boss.sprite.x = GW / 2 + sway;
        boss.sprite.y = 150 + Math.sin(t * 0.0018) * 28;
        if (boss.phase >= 3) {
          // Dash imprévisible toutes les 1.6s
          boss._dashCd = (boss._dashCd || 0) - scaledDelta;
          if (boss._dashCd <= 0) {
            boss._dashCd = 1600;
            const targetX = Phaser.Math.Clamp(this.paddle.x, 60, GW - 60);
            this.tweens.add({ targets: boss.sprite, x: targetX, duration: 280, ease: 'Cubic.easeOut' });
            this._emitParticles(boss.sprite.x, boss.sprite.y, 0xffaa33, 14);
          }
        }
        break;
      }
      case 'primordial_idea': {
        // Téléportation glitchée + lévitation chaotique
        boss._tpCd = (boss._tpCd || 1500) - scaledDelta;
        if (boss._tpCd <= 0) {
          boss._tpCd = boss.phase >= 3 ? 1100 : boss.phase >= 2 ? 1500 : 2000;
          // Flash white, fade out, teleport, fade in
          this._emitParticles(boss.sprite.x, boss.sprite.y, 0xffffff, 18);
          const newX = Phaser.Math.Between(80, GW - 80);
          const newY = Phaser.Math.Between(110, 220);
          this.tweens.add({
            targets: boss.sprite, alpha: 0.1, duration: 90,
            onComplete: () => {
              boss.sprite.x = newX;
              boss.sprite.y = newY;
              this._emitParticles(newX, newY, 0xffffff, 18);
              this.tweens.add({ targets: boss.sprite, alpha: 1, duration: 120 });
              // Fire a circular burst right after teleport
              this._burstFire(boss, boss.phase >= 2 ? 12 : 8);
            }
          });
        }
        // Slight jitter
        boss.sprite.x += Math.sin(t * 0.02) * 0.6;
        boss.sprite.y += Math.cos(t * 0.018) * 0.4;
        break;
      }
      default: {
        // Default: horizontal patrol + vertical bob
        boss.sprite.x += boss.speed * boss.dir * dt;
        if (boss.sprite.x > GW - 60) boss.dir = -1;
        if (boss.sprite.x < 60) boss.dir = 1;
        if (boss.phase >= 2) {
          boss.sprite.y = 140 + Math.sin(t * 0.001) * 25;
        }
      }
    }

    boss.fireTimer -= scaledDelta;
    if (boss.fireTimer <= 0) {
      boss.fireTimer = boss.fireRate;
      this._bossFire(boss);
    }

    boss.sprite.alpha = Math.max(boss.sprite.alpha, 0.85) + Math.sin(t * 0.004) * 0.06;
  }

  // Circular bullet burst — used by primordial_idea
  _burstFire(boss, count) {
    const speed = 240 + boss.phase * 50;
    const tint = this._bossColor(boss.type);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (boss._burstOffset || 0);
      const sprite = this.add.image(boss.sprite.x, boss.sprite.y, 'enemy_bullet')
        .setScale(1.6).setTint(tint);
      this.enemyBullets.push({
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        homing: false,
      });
    }
    boss._burstOffset = (boss._burstOffset || 0) + 0.3;
  }

  _tickTimers(scaledDelta) {
    const durMult = window.GameState.puDurationMult || 1;

    if (this.puExpandTimer > 0) {
      this.puExpandTimer -= scaledDelta;
      if (this.puExpandTimer <= 0) {
        window.GameState.paddleWidth = Math.max(120, window.GameState.paddleWidth - 30);
        this.paddle.setDisplaySize(window.GameState.paddleWidth, 14);
      }
    }
    if (this.puSlowTimer > 0) {
      this.puSlowTimer -= scaledDelta;
      if (this.puSlowTimer <= 0) {
        this.puSlow = false;
        this.balls.forEach(b => {
          const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          if (spd > 0) { b.vx = (b.vx / spd) * window.GameState.ballSpeed; b.vy = (b.vy / spd) * window.GameState.ballSpeed; }
        });
      }
    }
    if (this.puLaserTimer > 0) this.puLaserTimer -= scaledDelta;
    if (this.puShieldTimer > 0) {
      this.puShieldTimer -= scaledDelta;
      if (this.puShieldTimer <= 0) this.shieldNet.setVisible(this.shieldNetBounces > 0);
    }
    if (this.puFireTimer > 0) {
      this.puFireTimer -= scaledDelta;
      if (this.puFireTimer <= 0) this.puFire = false;
    }
    if (this.puGhostTimer > 0) {
      this.puGhostTimer -= scaledDelta;
      if (this.puGhostTimer <= 0) this.puGhost = false;
    }
    if (this.puBombTimer > 0) this.puBombTimer -= scaledDelta;
    if (this.puPierceTimer > 0) this.puPierceTimer -= scaledDelta;
    if (this.puMinigunTimer > 0) {
      this.puMinigunTimer -= scaledDelta;
      // Auto-fire lasers rapidly
      if (this.laserCooldown <= 0) this._fireLaser();
    }
    if (this.puFreezeTimer > 0) this.puFreezeTimer -= scaledDelta;
    if (this.puDoubleTimer > 0) this.puDoubleTimer -= scaledDelta;
    if (this.laserCooldown > 0) this.laserCooldown -= scaledDelta;
  }

  _updateHUD() {
    const gs = window.GameState;
    this.hudScore.setText(gs.score.toString().padStart(6, '0'));

    // XP bar
    const xpNeeded = xpForLevel(gs.xpLevel);
    const xpRatio = Math.min(gs.xp / xpNeeded, 1);
    const maxBarW = GW - 16;
    this.xpBarFill.setDisplaySize(maxBarW * xpRatio, 8);
    this.xpLevelText.setText(`LV ${gs.xpLevel}`);

    // Pulse XP bar when close to level-up
    if (xpRatio > 0.8) {
      this.xpBarFill.setFillStyle(0xffcc00, 1);
    } else {
      this.xpBarFill.setFillStyle(0x00e5ff, 1);
    }

    // Combo display
    if (this.combo >= 2) {
      this.comboText.setAlpha(1).setText(`COMBO x${this.combo}`);
      if (this.combo >= 10) this.comboText.setColor('#ff4400');
      else if (this.combo >= 5) this.comboText.setColor('#ffcc00');
      else this.comboText.setColor('#00e5ff');
    } else {
      this.comboText.setAlpha(0);
    }

    // Power-up status
    const statuses = [];
    if (this.puFireTimer > 0)    statuses.push(`FEU ${(this.puFireTimer/1000).toFixed(0)}s`);
    if (this.puGhostTimer > 0)   statuses.push(`GHOST ${(this.puGhostTimer/1000).toFixed(0)}s`);
    if (this.puSlowTimer > 0)    statuses.push(`SLOW ${(this.puSlowTimer/1000).toFixed(0)}s`);
    if (this.puPierceTimer > 0)  statuses.push(`PIERCE ${(this.puPierceTimer/1000).toFixed(0)}s`);
    if (this.puMinigunTimer > 0) statuses.push(`MINIGUN ${(this.puMinigunTimer/1000).toFixed(0)}s`);
    if (this.puFreezeTimer > 0)  statuses.push(`FREEZE ${(this.puFreezeTimer/1000).toFixed(0)}s`);
    if (this.puDoubleTimer > 0)  statuses.push(`x2 ${(this.puDoubleTimer/1000).toFixed(0)}s`);
    this.puStatusText.setText(statuses.join('\n'));

    // Time dilation
    if (!this.sys.game.device.input.touch) {
      if (gs.timeDilationCharges > 0) {
        this.tdIndicator.setAlpha(1).setText(`[ESP] RALENTIR x${gs.timeDilationCharges}`);
      } else {
        this.tdIndicator.setAlpha(0);
      }
    }

    this._updateMobileButtons();
  }

  // ══════════════════════════════════════════════════════
  //  XP & LEVEL-UP SYSTEM
  // ══════════════════════════════════════════════════════

  _addXP(amount, srcX, srcY) {
    const gs = window.GameState;
    gs.xp += amount;
    const needed = xpForLevel(gs.xpLevel);
    if (gs.xp >= needed) {
      gs.xp -= needed;
      gs.xpLevel++;
      this._triggerLevelUp();
    }
    if (srcX !== undefined && srcY !== undefined) {
      this._spawnXPOrbs(srcX, srcY, amount);
    }
  }

  _spawnXPOrbs(x, y, amount) {
    if (!this.paddle) return;
    const count = Phaser.Math.Clamp(2 + Math.floor(amount / 8), 2, 8);
    for (let i = 0; i < count; i++) {
      const orb = this.add.circle(
        x + Phaser.Math.Between(-8, 8),
        y + Phaser.Math.Between(-8, 8),
        2.5, 0x00e5ff, 1
      ).setDepth(50);
      orb.setStrokeStyle(1, 0xffffff, 0.8);

      // Intermediate control point for curved arc
      const midX = Phaser.Math.Between(x - 40, x + 40);
      const midY = y + Phaser.Math.Between(20, 80);

      const delay = i * 40 + Phaser.Math.Between(0, 60);
      const dur = 480 + Phaser.Math.Between(0, 140);

      this.tweens.addCounter({
        from: 0, to: 1,
        duration: dur,
        delay,
        ease: 'Cubic.easeIn',
        onUpdate: (tw) => {
          const t = tw.getValue();
          // Always target the paddle's *current* position so orbs track it
          const px = this.paddle.x;
          const py = this.paddle.y;
          const u = 1 - t;
          orb.x = u * u * x + 2 * u * t * midX + t * t * px;
          orb.y = u * u * y + 2 * u * t * midY + t * t * py;
          orb.setScale(1 + t * 0.8);
          orb.setAlpha(1 - t * 0.3);
        },
        onComplete: () => {
          if (window.SFX) window.SFX.play('xpCollect', { minGap: 0.04 });
          // Tiny flash on paddle when orb arrives
          const flash = this.add.circle(this.paddle.x, this.paddle.y, 6, 0x00e5ff, 0.9).setDepth(51);
          this.tweens.add({
            targets: flash,
            scale: { from: 0.5, to: 2 },
            alpha: { from: 0.9, to: 0 },
            duration: 220,
            onComplete: () => flash.destroy(),
          });
          // Pulse the XP bar
          if (this.xpBarFill) {
            this.tweens.add({
              targets: this.xpBarFill,
              alpha: { from: 1, to: 0.5 },
              duration: 80, yoyo: true,
            });
          }
          orb.destroy();
        },
      });
    }
  }

  _triggerLevelUp() {
    this.levelingUp = true;
    if (window.SFX) window.SFX.play('levelUp');

    // Flash and shake
    this.cameras.main.flash(300, 0, 200, 255, false);
    this.cameras.main.shake(150, 0.008);

    // XP bar flash
    this.tweens.add({ targets: this.xpBarFill, alpha: { from: 0.3, to: 1 }, duration: 100, repeat: 3, yoyo: true });

    this._showFloatingText(GW / 2, GH / 2 - 100, 'NIVEAU SUPÉRIEUR!', '#ffcc00', 24);

    // Delay then show upgrade overlay
    this.time.delayedCall(600, () => this._showLevelUpOverlay());
  }

  _showLevelUpOverlay() {
    const gs = window.GameState;

    // Dark overlay
    const overlay = this.add.rectangle(GW / 2, GH / 2, GW, GH, 0x000000, 0.75).setDepth(300);
    this.levelUpElements.push(overlay);

    // Title
    const title = this.add.text(GW / 2, GH * 0.18, `NIVEAU ${gs.xpLevel}`, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '22px', fontStyle: 'bold', color: '#ffcc00', letterSpacing: 4,
    }).setOrigin(0.5).setDepth(301);
    this.levelUpElements.push(title);

    const subtitle = this.add.text(GW / 2, GH * 0.22, 'Choisis une amélioration', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '12px', color: '#cce0ff', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(301);
    this.levelUpElements.push(subtitle);

    // Pick 3 random upgrades
    const counts = {};
    gs.upgrades.forEach(u => { counts[u.id] = (counts[u.id] || 0) + 1; });
    const available = UPGRADES.filter(u => (counts[u.id] || 0) < 3 || u.id === 'healing_light');
    const choices = Phaser.Utils.Array.Shuffle(available).slice(0, 3);

    // 3 cards stacked vertically for portrait
    const cardW = GW - 40, cardH = 65;
    const startY = GH * 0.30;

    choices.forEach((upg, i) => {
      const y = startY + i * (cardH + 12);
      this._createLevelUpCard(GW / 2, y, cardW, cardH, upg, i);
    });

    // Skip button
    const skipBtn = this.add.text(GW / 2, GH * 0.82, '[ PASSER ]', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '12px', color: '#aabbcc', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(301).setInteractive({ cursor: 'pointer' });
    skipBtn.on('pointerdown', () => this._closeLevelUpOverlay());
    this.levelUpElements.push(skipBtn);
  }

  _createLevelUpCard(x, y, w, h, upg, index) {
    const color = upg.color || 0x00e5ff;
    const colorStr = `#${color.toString(16).padStart(6, '0')}`;
    const rarityColors = { common: '#667788', rare: '#8844ff', epic: '#ff8800' };
    const rarityColor = rarityColors[upg.rarity] || '#667788';

    const bg = this.add.rectangle(x, y, w, h, 0x050a12, 1).setDepth(301);
    const border = this.add.rectangle(x, y, w, h, 0x000000, 0).setStrokeStyle(1, color, 0.5).setDepth(301);
    const topBar = this.add.rectangle(x, y - h / 2 + 2, w, 4, color, 0.6).setDepth(301);

    const icon = this.add.image(x - w / 2 + 30, y, upg.icon || 'upgrade_wide').setScale(0.8).setDepth(302);

    const nameText = this.add.text(x - w / 2 + 58, y - 16, upg.name, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '15px', fontStyle: 'bold', color: colorStr,
    }).setDepth(302);

    const descText = this.add.text(x - w / 2 + 58, y + 4, upg.desc, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '12px', color: '#dde8f5', stroke: '#000000', strokeThickness: 2,
      wordWrap: { width: w - 90 },
    }).setDepth(302);

    const rarityLabel = this.add.text(x + w / 2 - 8, y - 16, upg.rarity.toUpperCase(), {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '10px', color: rarityColor, letterSpacing: 1,
    }).setOrigin(1, 0).setDepth(302);

    const elements = [bg, border, topBar, icon, nameText, descText, rarityLabel];
    this.levelUpElements.push(...elements);

    // Slide in
    elements.forEach(el => { el.setAlpha(0); });
    this.tweens.add({
      targets: elements, alpha: 1,
      duration: 200, delay: 50 + index * 80, ease: 'Quad.easeOut'
    });

    // Interactive zone
    const zone = this.add.zone(x, y, w, h).setInteractive({ cursor: 'pointer' }).setDepth(303);
    this.levelUpElements.push(zone);

    zone.on('pointerover', () => {
      bg.setFillStyle(color, 0.15);
      border.setStrokeStyle(2, color, 1);
    });
    zone.on('pointerout', () => {
      bg.setFillStyle(0x050a12, 1);
      border.setStrokeStyle(1, color, 0.5);
    });
    zone.on('pointerdown', () => {
      this._selectLevelUpUpgrade(upg);
    });
  }

  _selectLevelUpUpgrade(upg) {
    const gs = window.GameState;
    upg.apply(gs);
    gs.upgrades.push(upg);

    this.cameras.main.flash(200, 100, 200, 100, false);
    this.cameras.main.shake(80, 0.005);

    const colorStr = `#${(upg.color || 0x00e5ff).toString(16).padStart(6, '0')}`;
    const acquired = this.add.text(GW / 2, GH * 0.6, upg.name + ' !', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '20px', fontStyle: 'bold', color: colorStr,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(310);
    this.levelUpElements.push(acquired);

    this.time.delayedCall(600, () => this._closeLevelUpOverlay());
  }

  _closeLevelUpOverlay() {
    this.tweens.add({
      targets: this.levelUpElements, alpha: 0,
      duration: 200,
      onComplete: () => {
        this.levelUpElements.forEach(el => el.destroy());
        this.levelUpElements = [];
        this.levelingUp = false;

        // Rebuild upgrade strip
        this.upgradeIcons.forEach(ic => ic.destroy());
        this.upgradeIcons = [];
        this._buildUpgradeStrip();
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  ACTIONS
  // ══════════════════════════════════════════════════════

  _enemyFire(enemy) {
    const world = window.GameState.world;
    const speed = 160 + world * 45;

    const dx = this.paddle.x - enemy.sprite.x;
    const dy = PADDLE_Y - enemy.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const jitter = (Math.random() - 0.5) * 0.25;
    const angle = Math.atan2(dy, dx) + jitter;

    const sprite = this.add.image(enemy.sprite.x, enemy.sprite.y + 16, 'enemy_bullet')
      .setScale(1.2)
      .setTint(this._worldBulletTint());

    this.enemyBullets.push({
      sprite,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }

  _bossFire(boss) {
    const tint = this._bossColor(boss.type);

    // ── Petrified Queen — large wave of slow homing pollen + tracking spit ──
    if (boss.type === 'petrified_queen') {
      const waveCount = boss.phase >= 3 ? 9 : boss.phase >= 2 ? 7 : 5;
      const speed = 170 + boss.phase * 35;
      // Downward fan
      for (let i = 0; i < waveCount; i++) {
        const t = (i / (waveCount - 1)) - 0.5; // -0.5..0.5
        const angle = Math.PI / 2 + t * 1.4;
        const sprite = this.add.image(boss.sprite.x, boss.sprite.y + 40, 'enemy_bullet')
          .setScale(1.5).setTint(tint);
        this.enemyBullets.push({
          sprite,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          homing: boss.phase >= 3 && (i === 0 || i === waveCount - 1),
        });
      }
      // Aimed spit at the paddle (always)
      const dx = this.paddle.x - boss.sprite.x;
      const dy = PADDLE_Y - boss.sprite.y;
      const aim = Math.atan2(dy, dx);
      const aimedSprite = this.add.image(boss.sprite.x, boss.sprite.y + 40, 'enemy_bullet')
        .setScale(2).setTint(0xff8800);
      this.enemyBullets.push({
        sprite: aimedSprite,
        vx: Math.cos(aim) * (speed + 80),
        vy: Math.sin(aim) * (speed + 80),
        homing: boss.phase >= 2,
      });
      return;
    }

    // ── Primordial Idea — spinning spiral, accelerates per phase ──
    if (boss.type === 'primordial_idea') {
      const arms = boss.phase >= 3 ? 5 : boss.phase >= 2 ? 4 : 3;
      const speed = 230 + boss.phase * 40;
      boss._spiralAngle = (boss._spiralAngle || 0) + 0.5;
      for (let i = 0; i < arms; i++) {
        const angle = boss._spiralAngle + (i / arms) * Math.PI * 2;
        const sprite = this.add.image(boss.sprite.x, boss.sprite.y, 'enemy_bullet')
          .setScale(1.4).setTint(tint);
        this.enemyBullets.push({
          sprite,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          homing: false,
        });
      }
      // Phase 3: also lob a homing missile at the paddle
      if (boss.phase >= 3) {
        const dx = this.paddle.x - boss.sprite.x;
        const dy = PADDLE_Y - boss.sprite.y;
        const aim = Math.atan2(dy, dx);
        const sprite = this.add.image(boss.sprite.x, boss.sprite.y, 'enemy_bullet')
          .setScale(2.2).setTint(0xff44aa);
        this.enemyBullets.push({
          sprite,
          vx: Math.cos(aim) * 200,
          vy: Math.sin(aim) * 200,
          homing: true,
        });
      }
      return;
    }

    // ── Default boss fire ──
    const numShots = boss.phase >= 3 ? 5 : boss.phase >= 2 ? 3 : 1;
    const speed = 220 + boss.phase * 60;

    const dx = this.paddle.x - boss.sprite.x;
    const dy = PADDLE_Y - boss.sprite.y;
    const baseAngle = Math.atan2(dy, dx);
    const spreadStep = boss.phase >= 3 ? 0.30 : 0.25;

    for (let i = 0; i < numShots; i++) {
      const spread = (i - (numShots - 1) / 2) * spreadStep;
      const angle = baseAngle + spread;

      const sprite = this.add.image(boss.sprite.x, boss.sprite.y + 45, 'enemy_bullet')
        .setScale(1.5).setTint(tint);

      this.enemyBullets.push({
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        homing: boss.phase >= 3 && i === Math.floor(numShots / 2),
      });
    }
  }

  _bossColor(type) {
    const map = { crystal_warden: 0x00ccff, forge_tyrant: 0xff6600, void_lurker: 0xcc00ff, circuit_mind: 0x00ff88, void_architect: 0xffffff, petrified_queen: 0xffaa33, primordial_idea: 0xe0e0e0 };
    return map[type] || 0xff4400;
  }

  _worldBulletTint() {
    return [0x00ccff, 0xff6600, 0xcc00ff, 0xffaa33, 0x00ff88, 0xffffff, 0xe0e0e0][(window.GameState.world - 1)] || 0xff4400;
  }

  _fireLaser() {
    if (!window.GameState.hasLaser && this.puMinigunTimer <= 0) return;
    if (this.laserCooldown > 0) return;
    this.laserCooldown = 160;

    this.playerLasers.push({ sprite: this.add.image(this.paddle.x - 20, PADDLE_Y - 16, 'laser_beam') });
    this.playerLasers.push({ sprite: this.add.image(this.paddle.x + 20, PADDLE_Y - 16, 'laser_beam') });
    if (window.SFX) window.SFX.play('laser');
  }

  _hitPaddleByBullet(bullet) {
    const gs = window.GameState;
    bullet.sprite.destroy();

    if (gs.voidShieldCharges > 0) {
      gs.voidShieldCharges--;
      this._showFloatingText(this.paddle.x, PADDLE_Y - 30, 'BOUCLIER!', '#8888ff');
      this._emitParticles(this.paddle.x, PADDLE_Y, 0x8888ff, 12);
      return;
    }
    this._loseHP();
  }

  _loseHP() {
    const gs = window.GameState;
    gs.hp--;
    if (window.SFX) window.SFX.play('loseLife');
    this._buildHPDisplay();
    this.cameras.main.shake(180, 0.02);
    this.cameras.main.flash(250, 255, 0, 0, false);
    this._showFloatingText(GW / 2, GH / 2, '-1 VIE', '#ff3388', 30);
    this.hitstopTimer = 80;

    // Reset combo on hit
    this.combo = 0;

    if (gs.hp <= 0) {
      this.time.delayedCall(500, () => this._gameOver());
    }
  }

  _ballFell(ball) {
    const idx = this.balls.indexOf(ball);
    ball.sprite.destroy();
    ball.glow.destroy();
    if (idx >= 0) this.balls.splice(idx, 1);

    if (this.shieldNet.visible && (this.shieldNetBounces > 0 || this.puShieldTimer > 0)) {
      const newBall = this._spawnBall(this.paddle.x, PADDLE_Y - 16);
      newBall.launched = false;
      this.ballLaunched = false;
      if (this.shieldNetBounces > 0) {
        this.shieldNetBounces--;
        if (this.shieldNetBounces <= 0 && this.puShieldTimer <= 0) this.shieldNet.setVisible(false);
      }
      this._showFloatingText(GW / 2, GH - 80, 'FILET!', '#44ff88');
      return;
    }

    // Reset combo
    this.combo = 0;

    if (this.balls.length === 0) {
      this._loseHP();
      if (window.GameState.hp > 0) {
        this.time.delayedCall(500, () => {
          if (!this.levelComplete) this._respawnBall();
        });
      }
    }
  }

  _respawnBall() {
    this.ballLaunched = false;
    const ball = this._spawnBall(this.paddle.x, PADDLE_Y - 16);
    ball.launched = false;
  }

  _killEnemy(enemy, index) {
    this._emitParticles(enemy.sprite.x, enemy.sprite.y, 0xff4466, 18);
    enemy.alive = false;
    window.GameState.enemiesKilled = (window.GameState.enemiesKilled || 0) + 1;
    this.tweens.add({
      targets: enemy.sprite,
      scaleX: 2, scaleY: 2, alpha: 0, duration: 150,
      onComplete: () => enemy.sprite.destroy()
    });
    if (index >= 0) this.enemies.splice(index, 1);
    this.cameras.main.shake(60, 0.005);
    this.hitstopTimer = 25;

    // Enemies can drop power-ups
    if (Math.random() < 0.25) {
      this._dropPowerUp(enemy.sprite.x, enemy.sprite.y);
    }
  }

  _defeatBoss() {
    if (this.bossDefeated) return;
    this.bossDefeated = true;
    const boss = this.boss;
    const gs = window.GameState;

    boss.alive = false;
    gs.bossesDefeated = (gs.bossesDefeated || 0) + 1;
    gs.score += 500 * gs.world;
    gs.voidShards = (gs.voidShards || 0) + gs.world * 5;
    this._addXP(50 * gs.world);

    if (gs.upgrades.find(u => u.id === 'healing_light') && gs.hp < gs.maxHp) {
      gs.hp++;
      this._buildHPDisplay();
      this._showFloatingText(GW / 2, GH / 2 - 40, '+1 VIE', '#ff3388', 24);
    }

    this.cameras.main.flash(500, 255, 100, 0, false);
    this.cameras.main.shake(400, 0.025);
    this._emitParticles(boss.sprite.x, boss.sprite.y, 0xff4400, 40);
    this._emitParticles(boss.sprite.x, boss.sprite.y, 0xffcc00, 30);
    this.hitstopTimer = 100;

    this.tweens.add({
      targets: boss.sprite,
      scaleX: 3, scaleY: 3, alpha: 0, rotation: 2,
      duration: 500, ease: 'Quad.easeOut',
      onComplete: () => {
        boss.sprite.destroy();
        this.bossHpBar.bg.setVisible(false);
        this.bossHpBar.fill.setVisible(false);
        this.bossHpBar.label.setVisible(false);
        this.bossHpBar.border.setVisible(false);
      }
    });

    this._showFloatingText(GW / 2, GH / 2, 'BOSS VAINCU!', '#ffcc00', 32);
    this.time.delayedCall(1200, () => this._levelComplete());
  }

  _collectPowerUp(pu) {
    const gs = window.GameState;
    const durMult = gs.puDurationMult || 1;
    if (window.SFX) window.SFX.play('powerup');
    this._emitParticles(pu.sprite.x, pu.sprite.y, pu.color || 0xffffff, 14);
    pu.sprite.destroy();
    pu.label.destroy();

    // Camera punch on collect
    this.cameras.main.flash(60, 255, 255, 255, false, null, true);

    switch (pu.id) {
      case 'pu_multi':
        if (this.balls.length < 5) {
          const ref = this.balls[0];
          this._spawnBall(ref.sprite.x + 8, ref.sprite.y, -ref.vx + Phaser.Math.Between(-40, 40), ref.vy);
          this.balls[this.balls.length - 1].launched = true;
        }
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'MULTI BALLE!', '#ff88ff');
        break;
      case 'pu_expand':
        gs.paddleWidth = Math.min(gs.paddleWidth + 30, 220);
        this.puExpandTimer = 15000 * durMult;
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'ÉTENDUE!', '#00e5ff');
        break;
      case 'pu_slow':
        this.puSlowTimer = 10000 * durMult;
        this.puSlow = true;
        this.balls.forEach(b => { b.vx *= 0.55; b.vy *= 0.55; });
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'RALENTI!', '#8888ff');
        break;
      case 'pu_shield':
        this.puShieldTimer = 20000 * durMult;
        this.shieldNet.setVisible(true);
        this._flashShield();
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'FILET!', '#44ff88');
        break;
      case 'pu_fire':
        this.puFireTimer = 8000 * durMult;
        this.puFire = true;
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'FEU!', '#ff8800');
        break;
      case 'pu_hp':
        if (gs.hp < gs.maxHp) { gs.hp++; this._buildHPDisplay(); }
        this._showFloatingText(pu.sprite.x, pu.sprite.y, '+VIE!', '#ff3388');
        break;
      case 'pu_bomb':
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'BOMBE!', '#ffcc00');
        this._explosiveArea(this.paddle.x, PADDLE_Y - 80);
        break;
      case 'pu_pierce':
        this.puPierceTimer = 10000 * durMult;
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'PERÇANT!', '#00ffcc');
        break;
      case 'pu_minigun':
        this.puMinigunTimer = 6000 * durMult;
        gs.hasLaser = true; // temporarily ensure laser works
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'MINIGUN!', '#ff2200');
        break;
      case 'pu_freeze':
        this.puFreezeTimer = 8000 * durMult;
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'GELÉ!', '#44aaff');
        // Flash all enemies blue
        this.enemies.forEach(e => { if (e.alive) e.sprite.setTint(0x44aaff); });
        this.time.delayedCall(this.puFreezeTimer, () => {
          this.enemies.forEach(e => { if (e.alive) e.sprite.clearTint(); });
        });
        break;
      case 'pu_double':
        this.puDoubleTimer = 12000 * durMult;
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'SCORE x2!', '#ffff00');
        break;
    }

    gs.score += 25;
    this._addXP(5);
  }

  _dropPowerUp(x, y) {
    const puDef = Phaser.Utils.Array.GetRandom(POWERUPS);
    const sprite = this.add.image(x, y, puDef.id).setScale(1.1);
    const label = this.add.text(x, y + 22, puDef.label, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '13px', fontStyle: 'bold', color: puDef.textColor,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.powerUps.push({ sprite, label, id: puDef.id, color: parseInt(puDef.textColor.replace('#', '0x')) });
  }

  _activateTimeDilation() {
    const gs = window.GameState;
    if (gs.timeDilationCharges <= 0 || this.timeDilationActive) return;
    gs.timeDilationCharges--;
    this.timeDilationActive = true;
    this.timeDilationTimer = 4000;
    this.cameras.main.flash(100, 50, 50, 200, false);
    this._showFloatingText(GW / 2, GH / 2, 'DILATATION!', '#8888ff', 26);
  }

  _applyStartBuffs() {
    // Applied to state at selection, state carries them
  }

  // ══════════════════════════════════════════════════════
  //  WIN / LOSE CONDITIONS
  // ══════════════════════════════════════════════════════

  _checkWinCondition() {
    if (this.levelData.isBoss) return;
    const remaining = this.bricks.filter(b => !b.indestructible);
    if (remaining.length === 0 && this.ballLaunched) {
      this._levelComplete();
    }
  }

  _levelComplete() {
    if (this.levelComplete) return;
    this.levelComplete = true;

    this.cameras.main.flash(400, 0, 200, 100, false);
    this._showFloatingText(GW / 2, GH / 2, 'NIVEAU COMPLÉTÉ!', '#00ff88', 30);

    // Bonus XP for completion
    this._addXP(25 * window.GameState.world);

    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this._advanceLevel();
      });
    });
  }

  _collectSecret(x, y) {
    let collected = 0;
    try { collected = parseInt(localStorage.getItem('sr_secrets') || '0', 10) || 0; } catch (e) {}
    collected++;
    try { localStorage.setItem('sr_secrets', String(collected)); } catch (e) {}

    this._showFloatingText(x, y - 20, '◆ FRAGMENT SECRET ◆', '#ffe066', 18);
    this._showFloatingText(GW / 2, 100, `${collected} / ${TOTAL_SECRETS}`, '#ffe066', 22);
    this._emitParticles(x, y, 0xffe066, 30);
    this.cameras.main.flash(200, 255, 220, 100, false);
    if (window.SFX) window.SFX.play('levelUp');

    if (collected >= TOTAL_SECRETS) {
      try { localStorage.setItem('sr_archives_unlocked', '1'); } catch (e) {}
      this._showFloatingText(GW / 2, GH / 2, 'ARCHIVES DÉVERROUILLÉES', '#ffffff', 20);
    }
  }

  _archivesUnlocked() {
    try { return localStorage.getItem('sr_archives_unlocked') === '1'; } catch (e) { return false; }
  }

  _saveRun() {
    const gs = window.GameState;
    if (!gs) return;
    try {
      const snap = {
        world: gs.world, level: gs.level,
        score: gs.score, hp: gs.hp, maxHp: gs.maxHp,
        voidShards: gs.voidShards,
        upgradeIds: (gs.upgrades || []).map(u => u.id),
        ballSpeed: gs.ballSpeed, paddleWidth: gs.paddleWidth, startBalls: gs.startBalls,
        hasLaser: gs.hasLaser, netBounces: gs.netBounces,
        voidShieldCharges: gs.voidShieldCharges, timeDilationCharges: gs.timeDilationCharges,
        fireCoreDuration: gs.fireCoreDuration, ghostDuration: gs.ghostDuration,
        chainChance: gs.chainChance, hasMagnet: gs.hasMagnet, explosiveEvery: gs.explosiveEvery,
        bricksBroken: gs.bricksBroken, bossesDefeated: gs.bossesDefeated, enemiesKilled: gs.enemiesKilled,
        xp: gs.xp, xpLevel: gs.xpLevel, maxCombo: gs.maxCombo,
        piercingCount: gs.piercingCount, scoreMult: gs.scoreMult,
        puDurationMult: gs.puDurationMult, dropLuckMult: gs.dropLuckMult,
        metaUpgrades: gs.metaUpgrades || null,
      };
      localStorage.setItem('sr_run', JSON.stringify(snap));
    } catch (e) {}
  }

  _clearRun() {
    try { localStorage.removeItem('sr_run'); } catch (e) {}
  }

  _advanceLevel() {
    const gs = window.GameState;
    gs.level++;
    this._saveRun();

    // Realm-specific level counts
    const maxLevel = (gs.world === 6) ? 1 : 4;

    if (gs.level > maxLevel) {
      gs.world++;
      gs.level = 1;

      // After Architect (world 6): branch to Archives if unlocked, else Victory
      if (gs.world === 7) {
        if (this._archivesUnlocked()) {
          // Continue into Realm 7
        } else {
          this.scene.start('VictoryScene');
          return;
        }
      }

      if (gs.world > 7) {
        this._clearRun();
        this.scene.start('VictoryScene');
        return;
      }

      // World complete narrative
      const prevWorld = NARRATIVE.worlds[gs.world - 2];
      if (prevWorld && prevWorld.bossDefeated) {
        this.scene.start('NarrativeScene', {
          lines: prevWorld.bossDefeated,
          nextScene: 'GameScene',
          worldColor: prevWorld.glowColor,
          title: `MONDE ${gs.world - 1} TERMINÉ`
        });
        return;
      }
    }

    // Go directly to next level — no UpgradeScene!
    this.scene.start('GameScene');
  }

  _gameOver() {
    this.levelComplete = true;
    this._clearRun();
    this.cameras.main.fadeOut(600, 100, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameOverScene');
    });
  }

  // ══════════════════════════════════════════════════════
  //  VISUAL HELPERS
  // ══════════════════════════════════════════════════════

  _emitParticles(x, y, color, count) {
    this.particleEmitter.setParticleTint(color);
    this.particleEmitter.explode(count, x, y);
  }

  _updateBallTrail(ball) {
    const color = this.puFire ? 0xff6600
      : this.puGhost ? 0x8888ff
      : this.puPierceTimer > 0 ? 0x00ffcc
      : 0x00e5ff;
    const trail = this.add.circle(ball.sprite.x, ball.sprite.y, 4, color, 0.6).setDepth(-1);
    ball.trail.push(trail);
    if (ball.trail.length > ball.trailMax) {
      ball.trail.shift().destroy();
    }
    ball.trail.forEach((t, i) => {
      const k = i / ball.trail.length;
      t.setAlpha(k * 0.55);
      t.setScale(0.4 + k * 0.9);
    });
  }

  _showFloatingText(x, y, text, color, size = 16) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: `${size}px`, fontStyle: 'bold', color: color,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: t, y: y - 50, alpha: 0, scaleX: 1.2, scaleY: 1.2,
      duration: 900, ease: 'Quad.easeOut',
      onComplete: () => t.destroy()
    });
  }

  _showFloatingScore(x, y, pts) {
    const t = this.add.text(x, y - 8, `+${pts}`, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '12px', color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: t, y: y - 40, alpha: 0,
      duration: 600, ease: 'Quad.easeOut',
      onComplete: () => t.destroy()
    });
  }

  _showWorldLabel() {
    const gs = window.GameState;
    const worldData = NARRATIVE.worlds[gs.world - 1];
    if (!worldData) return;
    const ld = this.levelData;
    const levelNarr = worldData.levels && worldData.levels[gs.level - 1];
    const displayName = ld.isBoss
      ? ('⚡ ' + (worldData.bossName || 'BOSS'))
      : (levelNarr ? levelNarr.name : `NIVEAU ${gs.level}`);

    const label = this.add.text(GW / 2, GH / 2 - 20, displayName, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '14px', color: worldData.glowColor, letterSpacing: 3
    }).setOrigin(0.5).setAlpha(0).setDepth(50);

    this.tweens.add({
      targets: label, alpha: 1, y: GH / 2 - 35,
      duration: 500, ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: label, alpha: 0, delay: 1200, duration: 400, onComplete: () => label.destroy() });
      }
    });
  }

  _showLevelIntro() {
    const gs = window.GameState;
    const worldData = NARRATIVE.worlds[gs.world - 1];
    if (!worldData) return;
    const levelNarr = worldData.levels && worldData.levels[gs.level - 1];
    if (!levelNarr || !levelNarr.intro) return;

    const introText = this.add.text(GW / 2, GH - 100, levelNarr.intro, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '12px', color: '#dde8f5', align: 'center',
      stroke: '#000000', strokeThickness: 3,
      wordWrap: { width: GW - 40 },
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: introText, alpha: 0.8,
      duration: 600, delay: 200, ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: introText, alpha: 0, delay: 2500, duration: 800, onComplete: () => introText.destroy() });
      }
    });
  }

  _flashShield() {
    this.tweens.add({ targets: this.shieldNet, alpha: { from: 0.3, to: 1.0 }, duration: 200, yoyo: true, repeat: 2 });
  }

  _brickColor(cell) {
    const colors = [0, 0x3399cc, 0x44aa44, 0xaa6600, 0xcc2244, 0x9922cc, 0xdd4400, 0xcc0088, 0x666666, 0xffcc00];
    return colors[cell] || 0xffffff;
  }

  _rectOverlap(sprA, sprB) {
    const aw = (sprA.displayWidth || sprA.width || 14) / 2;
    const ah = (sprA.displayHeight || sprA.height || 14) / 2;
    const bw = (sprB.displayWidth || sprB.width || 120) / 2;
    const bh = (sprB.displayHeight || sprB.height || 14) / 2;
    return Math.abs(sprA.x - sprB.x) < aw + bw && Math.abs(sprA.y - sprB.y) < ah + bh;
  }
}
