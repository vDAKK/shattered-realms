// ═══════════════════════════════════════════════════════
//  SHATTERED REALMS — GameScene
// ═══════════════════════════════════════════════════════
const GW = 960, GH = 640;
const BRICK_W = 60, BRICK_H = 22;
const BRICK_COLS = 14, BRICK_ROWS = 10;
const BRICK_OFFSET_X = 18, BRICK_OFFSET_Y = 115;
const BRICK_PAD_X = 4, BRICK_PAD_Y = 3;
const PADDLE_Y = GH - 52;
const BALL_SIZE = 18;

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ──────────────────────────────────────────────────────
  create() {
    const gs = window.GameState;
    this.levelData = getLevelData(gs.world, gs.level);

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

    // Temporary power-up timers
    this.puExpandTimer = 0;
    this.puSlowTimer = 0;
    this.puLaserTimer = 0;
    this.puShieldTimer = 0;
    this.puFireTimer = 0;
    this.puGhostTimer = 0;
    this.puBombTimer = 0;
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

    // ── Background ──────────────────────────────────────
    this._buildBackground();
    this._buildStarField();
    this._buildBiomeEffects();

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
      speed: { min: 40, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      lifespan: { min: 200, max: 600 },
      quantity: 1,
      emitting: false,
    });

    // ── World overlay label ──────────────────────────────
    this._showWorldLabel();

    // ── Input ────────────────────────────────────────────
    this.input.on('pointermove', (ptr) => {
      // Sur mobile, ne déplacer la palette que si c'est le pointeur principal
      if (ptr.id === 0 || !this._mobileActionPointer || ptr.id !== this._mobileActionPointer) {
        this._movePaddle(ptr.x);
      }
    });
    this.input.on('pointerdown', (ptr) => {
      if (ptr.rightButtonDown()) { this._fireLaser(); return; }
      if (!this.ballLaunched) this._launchBall();
    });
    this.input.keyboard.on('keydown-SPACE', () => this._activateTimeDilation());
    this.input.keyboard.on('keydown-R', () => this._fireLaser());

    // ── Boutons mobiles (laser + ralentir) ───────────────
    this._buildMobileButtons();

    // ── Camera fade in ───────────────────────────────────
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // ── Level intro narrative ────────────────────────────
    this._showLevelIntro();

    // ── Apply run start buffs ────────────────────────────
    this._applyStartBuffs();
  }

  // ──────────────────────────────────────────────────────
  update(time, delta) {
    if (this.gamePaused || this.levelComplete) return;

    const dt = delta / 1000;
    const gs = window.GameState;

    // Slow-mo multiplier
    const timeScale = this.timeDilationActive ? 0.3 : 1.0;
    const scaledDelta = delta * timeScale;

    // ── Timers ──────────────────────────────────────────
    this._tickTimers(scaledDelta);

    // ── Move paddle toward mouse ─────────────────────────
    // (paddle follows pointer, handled in event but also checked here)

    // ── Ball logic ──────────────────────────────────────
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      this._updateBall(ball, scaledDelta);
    }

    // ── Enemies ─────────────────────────────────────────
    for (const enemy of this.enemies) {
      this._updateEnemy(enemy, scaledDelta);
    }

    // ── Enemy bullets ───────────────────────────────────
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      if (bullet.boss && bullet.vx !== undefined) {
        // Homing correction (phase 3 boss center shot)
        if (bullet.homing && this.paddle) {
          const hdx = this.paddle.x - bullet.sprite.x;
          const hdy = PADDLE_Y - bullet.sprite.y;
          const hDist = Math.sqrt(hdx * hdx + hdy * hdy) || 1;
          const turnStr = 120 * (scaledDelta / 1000);
          bullet.vx += (hdx / hDist) * turnStr;
          bullet.vy += (hdy / hDist) * turnStr;
          // Clamp speed
          const spd = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
          if (spd > 450) { bullet.vx = (bullet.vx / spd) * 450; bullet.vy = (bullet.vy / spd) * 450; }
        }
        bullet.sprite.x += bullet.vx * (scaledDelta / 1000);
        bullet.sprite.y += bullet.vy * (scaledDelta / 1000);
      } else {
        bullet.sprite.y += 250 * (scaledDelta / 1000);
      }
      if (bullet.sprite.y > GH + 20 || bullet.sprite.x < -20 || bullet.sprite.x > GW + 20) {
        bullet.sprite.destroy();
        this.enemyBullets.splice(i, 1);
        continue;
      }
      // Hit paddle?
      if (this._rectOverlap(bullet.sprite, this.paddle) && !this.timeDilationActive) {
        this._hitPaddleByBullet(bullet);
        this.enemyBullets.splice(i, 1);
      }
    }

    // ── Player lasers ────────────────────────────────────
    for (let i = this.playerLasers.length - 1; i >= 0; i--) {
      const laser = this.playerLasers[i];
      laser.sprite.y -= 700 * (scaledDelta / 1000);
      if (laser.sprite.y < -20) {
        laser.sprite.destroy();
        this.playerLasers.splice(i, 1);
        continue;
      }
      // Hit bricks
      this._checkLaserBrickCollision(laser, i);
    }

    // ── Power-ups ────────────────────────────────────────
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.sprite.y += 120 * (scaledDelta / 1000);
      pu.sprite.rotation += 1.5 * (scaledDelta / 1000);
      if (pu.sprite.y > GH + 40) {
        pu.sprite.destroy();
        pu.label.destroy();
        this.powerUps.splice(i, 1);
        continue;
      }
      // Collect?
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
        this.cameras.main.resetPostPipeline();
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
    const gs = window.GameState;
    // Affichés seulement sur écran tactile
    const isTouch = this.sys.game.device.input.touch;

    // Bouton LASER (bas droite)
    this._btnLaser = this._makeTouchBtn(GW - 44, GH - 44, 'LASER', 0xff4400, () => {
      this._fireLaser();
    });

    // Bouton SLOW / Time dilation (bas gauche)
    this._btnSlow = this._makeTouchBtn(44, GH - 44, 'SLOW', 0x8888ff, () => {
      this._activateTimeDilation();
    });

    // Masquer si pas tactile
    if (!isTouch) {
      this._btnLaser.bg.setVisible(false);
      this._btnLaser.txt.setVisible(false);
      this._btnSlow.bg.setVisible(false);
      this._btnSlow.txt.setVisible(false);
    }
  }

  _makeTouchBtn(x, y, label, color, onPress) {
    const r = 34;
    const bg = this.add.circle(x, y, r, color, 0.18).setDepth(200);
    bg.setStrokeStyle(1.5, color, 0.6);
    const txt = this.add.text(x, y, label, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '9px', color: `#${color.toString(16).padStart(6, '0')}`,
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(201);

    // Zone interactive (légèrement plus grande pour le tactile)
    const zone = this.add.zone(x, y, r * 2.2, r * 2.2).setInteractive().setDepth(202);
    zone.on('pointerdown', (ptr) => {
      this._mobileActionPointer = ptr.id; // ne pas bouger la palette avec ce doigt
      bg.setFillStyle(color, 0.45);
      onPress();
    });
    zone.on('pointerup',   () => { bg.setFillStyle(color, 0.18); this._mobileActionPointer = null; });
    zone.on('pointerout',  () => { bg.setFillStyle(color, 0.18); this._mobileActionPointer = null; });

    return { bg, txt, zone };
  }

  _updateMobileButtons() {
    const gs = window.GameState;
    const isTouch = this.sys.game.device.input.touch;
    if (!isTouch || !this._btnLaser) return;

    // Laser : visible si disponible
    const hasLaser = gs.hasLaser || this.puLaserTimer > 0;
    this._btnLaser.bg.setAlpha(hasLaser ? 1 : 0.3);
    this._btnLaser.txt.setAlpha(hasLaser ? 1 : 0.3);

    // Slow : visible si charges dispo
    const hasSlow = (gs.timeDilationCharges || 0) > 0 && !this.timeDilationActive;
    this._btnSlow.bg.setAlpha(hasSlow ? 1 : 0.3);
    this._btnSlow.txt.setAlpha(hasSlow ? 1 : 0.3);
    this._btnSlow.txt.setText(hasSlow ? `SLOW\nx${gs.timeDilationCharges}` : 'SLOW');
  }

  _buildBackground() {
    const worldColors = [null, 0x020818, 0x0f0300, 0x050008, 0x000a03, 0x030306];
    const wc = worldColors[window.GameState.world] || 0x020810;
    this.add.rectangle(GW / 2, GH / 2, GW, GH, wc);

    // Subtle gradient top bar
    this.add.rectangle(GW / 2, 55, GW, 110, 0x000000, 0.4);
  }

  _buildStarField() {
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GW);
      const y = Phaser.Math.Between(0, GH);
      const r = Phaser.Math.FloatBetween(0.3, 1.2);
      this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.05, 0.25));
    }
  }

  _buildBiomeEffects() {
    const world = window.GameState.world;
    switch (world) {
      case 1: this._biomeIce();   break;
      case 2: this._biomeForge(); break;
      case 3: this._biomeVoid();  break;
      case 4: this._biomeNeon();  break;
      case 5: this._biomeFinal(); break;
    }
  }

  // ── World 1 : Cristaux de glace ───────────────────────
  _biomeIce() {
    // Rayons de lumière froide verticaux
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(60, GW - 60);
      const beam = this.add.rectangle(x, GH / 2, 2, GH, 0x88ddff, 0);
      this.tweens.add({
        targets: beam, alpha: { from: 0, to: 0.06 },
        duration: Phaser.Math.Between(1800, 3500),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
        ease: 'Sine.easeInOut'
      });
    }
    // Cristaux dérivants (petits éclats)
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(0, GW);
      const y = Phaser.Math.Between(65, GH - 80);
      const size = Phaser.Math.FloatBetween(1.5, 5);
      const shard = this.add.rectangle(x, y, size, size * 2.5, 0x88eeff, 0);
      shard.setRotation(Phaser.Math.FloatBetween(0, Math.PI));
      this.tweens.add({
        targets: shard,
        y: y + Phaser.Math.Between(30, 90),
        x: x + Phaser.Math.Between(-20, 20),
        alpha: { from: 0, to: 0.25 },
        rotation: shard.rotation + Phaser.Math.FloatBetween(-0.5, 0.5),
        duration: Phaser.Math.Between(3000, 7000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 5000),
        ease: 'Sine.easeInOut'
      });
    }
    // Brume froide en bas
    const mist = this.add.rectangle(GW / 2, GH - 40, GW, 80, 0x004466, 0.12);
    this.tweens.add({ targets: mist, alpha: { from: 0.06, to: 0.18 }, duration: 2000, yoyo: true, repeat: -1 });
  }

  // ── World 2 : Forge infernale ────────────────────────
  _biomeForge() {
    // Braises montantes
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, GW);
      const startY = Phaser.Math.Between(GH * 0.5, GH);
      const size = Phaser.Math.FloatBetween(1, 3.5);
      const ember = this.add.circle(x, startY, size,
        Phaser.Utils.Array.GetRandom([0xff4400, 0xff8800, 0xffcc00, 0xff2200]), 0);
      this.tweens.add({
        targets: ember,
        y: startY - Phaser.Math.Between(150, 350),
        x: x + Phaser.Math.Between(-30, 30),
        alpha: { from: 0, to: 0.55 },
        duration: Phaser.Math.Between(1500, 3500),
        delay: Phaser.Math.Between(0, 5000),
        repeat: -1, yoyo: false,
        onRepeat: () => { ember.x = Phaser.Math.Between(0, GW); ember.y = Phaser.Math.Between(GH * 0.6, GH); }
      });
    }
    // Lueur de lave en bas
    const lava = this.add.rectangle(GW / 2, GH - 20, GW, 40, 0xff3300, 0.08);
    this.tweens.add({ targets: lava, alpha: { from: 0.04, to: 0.15 }, duration: 800, yoyo: true, repeat: -1 });
    // Lignes de chaleur (distorsion simulée)
    for (let i = 0; i < 4; i++) {
      const y = GH * 0.6 + i * 30;
      const heatLine = this.add.rectangle(GW / 2, y, GW, 1, 0xff6600, 0);
      this.tweens.add({
        targets: heatLine, alpha: { from: 0, to: 0.07 }, y: y - 15,
        duration: 600 + i * 150, yoyo: true, repeat: -1,
        delay: i * 200
      });
    }
  }

  // ── World 3 : Désolation du Vide ─────────────────────
  _biomeVoid() {
    // Particules de matière noire
    for (let i = 0; i < 25; i++) {
      const x = Phaser.Math.Between(0, GW);
      const y = Phaser.Math.Between(65, GH);
      const size = Phaser.Math.FloatBetween(1, 4);
      const wisp = this.add.circle(x, y, size,
        Phaser.Utils.Array.GetRandom([0x9900ff, 0xcc00ff, 0x6600aa, 0x440088]), 0);
      const cx = x + Phaser.Math.Between(-60, 60);
      const cy = y + Phaser.Math.Between(-40, 40);
      this.tweens.add({
        targets: wisp, x: cx, y: cy,
        alpha: { from: 0, to: 0.4 },
        duration: Phaser.Math.Between(2000, 5000),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
        ease: 'Sine.easeInOut'
      });
    }
    // Grille vide pulsante violette
    const g = this.add.graphics().setAlpha(0.07);
    g.lineStyle(1, 0x8800cc, 1);
    for (let x = 0; x < GW; x += 48) g.lineBetween(x, 65, x, GH);
    for (let y = 65; y < GH; y += 48) g.lineBetween(0, y, GW, y);
    this.tweens.add({ targets: g, alpha: { from: 0.03, to: 0.12 }, duration: 1500, yoyo: true, repeat: -1 });
    // Vortex central (cercles)
    for (let r = 20; r <= 120; r += 25) {
      const ring = this.add.circle(GW / 2, GH / 2, r, 0x000000, 0);
      ring.setStrokeStyle(1, 0x6600cc, 0.06);
      this.tweens.add({
        targets: ring, scaleX: 1.15, scaleY: 1.15, alpha: { from: 0.03, to: 0.09 },
        duration: 2000 + r * 10, yoyo: true, repeat: -1, delay: r * 8
      });
    }
  }

  // ── World 4 : Citadelle de Néon ───────────────────────
  _biomeNeon() {
    // Flux de données horizontaux
    for (let i = 0; i < 8; i++) {
      const y = 70 + i * 72;
      const dot = this.add.circle(-6, y, 3, 0x00ff88, 0.7);
      this.tweens.add({
        targets: dot, x: GW + 6,
        duration: Phaser.Math.Between(1200, 2800),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1, ease: 'Linear',
        onRepeat: () => { dot.y = 70 + Phaser.Math.Between(0, 8) * 72; dot.alpha = Phaser.Math.FloatBetween(0.3, 0.8); }
      });
    }
    // Grille néon verte pulsante
    const g = this.add.graphics().setAlpha(0.06);
    g.lineStyle(1, 0x00ff88, 1);
    for (let x = 0; x < GW; x += 60) g.lineBetween(x, 65, x, GH);
    for (let y = 65; y < GH; y += 60) g.lineBetween(0, y, GW, y);
    // Pulse séquentiel colonne par colonne
    this.time.addEvent({
      delay: 120, repeat: -1,
      callback: () => { g.setAlpha(0.04 + Math.sin(this.time.now * 0.003) * 0.04); }
    });
    // Scan line descendante
    const scanLine = this.add.rectangle(GW / 2, 65, GW, 2, 0x00ff88, 0.15);
    this.tweens.add({ targets: scanLine, y: GH, duration: 2500, repeat: -1, ease: 'Linear',
      onRepeat: () => { scanLine.y = 65; } });
    // Coins lumineux
    [[0,0], [GW,0], [0,GH], [GW,GH]].forEach(([cx, cy]) => {
      const corner = this.add.circle(cx, cy, 40, 0x00ff88, 0);
      corner.setStrokeStyle(1, 0x00ff88, 0.25);
      this.tweens.add({ targets: corner, alpha: { from: 0.1, to: 0.4 }, duration: 1000, yoyo: true, repeat: -1, delay: Math.random() * 1000 });
    });
  }

  // ── World 5 : Final ───────────────────────────────────
  _biomeFinal() {
    this._biomeIce();
    this._biomeVoid();
    // Extra chaos
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, GW);
      const y = Phaser.Math.Between(65, GH);
      const flash = this.add.circle(x, y, Phaser.Math.FloatBetween(2, 8),
        Phaser.Utils.Array.GetRandom([0xffffff, 0xff4400, 0x00e5ff, 0xffcc00]), 0);
      this.tweens.add({
        targets: flash, alpha: { from: 0, to: 0.5 },
        duration: Phaser.Math.Between(400, 1200),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }
  }

  _buildHUD() {
    const gs = window.GameState;
    const worldData = NARRATIVE.worlds[gs.world - 1];
    const worldColor = worldData ? parseInt(worldData.glowColor.replace('#', '0x')) : 0x00e5ff;
    const worldColorStr = worldData ? worldData.glowColor : '#00e5ff';

    // Top bar
    this.add.rectangle(GW / 2, 28, GW, 56, 0x000000, 0.7);
    this.add.rectangle(GW / 2, 56, GW, 1, worldColor, 0.5);

    // World name
    this.hudWorldText = this.add.text(12, 14, worldData ? worldData.name : 'MONDE 1', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '13px', color: worldColorStr, fontStyle: 'bold', letterSpacing: 2
    });

    // Level indicator
    const levelData = this.levelData;
    this.hudLevelText = this.add.text(12, 34, levelData.isBoss ? '⚡ BOSS' : `Niveau ${gs.level} / 4`, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '11px', color: '#446677'
    });

    // Score
    this.hudScore = this.add.text(GW / 2, 28, '0', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Score label
    this.add.text(GW / 2, 44, 'SCORE', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '9px', color: '#334455', letterSpacing: 3
    }).setOrigin(0.5);

    // HP display
    this.hpGroup = [];
    this._buildHPDisplay();

    // Active upgrades strip
    this.upgradeIcons = [];
    this._buildUpgradeStrip();

    // Power-up status bar (below HUD)
    this.puStatusText = this.add.text(GW - 12, 14, '', {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '10px', color: '#00e5ff', align: 'right'
    }).setOrigin(1, 0);

    // Boss health bar (hidden initially)
    this._buildBossHealthBar();

    // Time dilation indicator
    this.tdIndicator = this.add.text(GW / 2, 60, '', {
      fontFamily: 'Orbitron, Courier New',
      fontSize: '11px', color: '#8888ff', letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0);
  }

  _buildHPDisplay() {
    const gs = window.GameState;
    this.hpGroup.forEach(h => h.destroy());
    this.hpGroup = [];
    for (let i = 0; i < gs.maxHp; i++) {
      const x = GW - 20 - i * 22;
      const filled = i < gs.hp;
      const heart = this.add.text(x, 14, '♥', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: filled ? '#ff3388' : '#331122',
        stroke: filled ? '#ff0044' : '#220011',
        strokeThickness: 1
      }).setOrigin(0.5, 0);
      this.hpGroup.push(heart);
    }
  }

  _buildUpgradeStrip() {
    // Small icons for active upgrades
    const gs = window.GameState;
    gs.upgrades.forEach((upg, i) => {
      if (i >= 8) return;
      const x = 12 + i * 20;
      const icon = this.add.circle(x, 68, 7, upg.color || 0x00e5ff, 0.7);
      this.upgradeIcons.push(icon);
    });
  }

  _buildBossHealthBar() {
    this.bossHpBar = {
      bg:    this.add.rectangle(GW / 2, 75, 400, 10, 0x220000, 1).setVisible(false),
      fill:  this.add.rectangle(GW / 2 - 200, 75, 400, 10, 0xff0044, 1).setVisible(false).setOrigin(0, 0.5),
      label: this.add.text(GW / 2, 86, '', {
        fontFamily: 'Orbitron, Courier New', fontSize: '10px', color: '#ff4466', letterSpacing: 3
      }).setOrigin(0.5, 0).setVisible(false),
      border: this.add.rectangle(GW / 2, 75, 402, 12, 0x000000, 0).setVisible(false)
        .setStrokeStyle(1, 0xff0044, 0.6),
    };
  }

  _buildLevel() {
    const gs = window.GameState;
    const worldData = NARRATIVE.worlds[gs.world - 1] || NARRATIVE.worlds[0];

    this.levelData.grid.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (cell === 0) return;

        const x = BRICK_OFFSET_X + colIdx * (BRICK_W + BRICK_PAD_X) + BRICK_W / 2;
        const y = BRICK_OFFSET_Y + rowIdx * (BRICK_H + BRICK_PAD_Y) + BRICK_H / 2;

        // Determine HP based on brick type
        const hpMap = [0, 1, 1, 1, 2, 2, 3, 3, Infinity, 1];
        const hp = hpMap[cell] || 1;
        const maxHp = hp;
        const indestructible = (cell === 8);

        // Choose brick texture key based on world color theme
        let brickKey = `brick_${cell}`;

        const sprite = this.add.image(x, y, brickKey);

        const brick = { sprite, hp, maxHp, indestructible, cell, x, y };
        this.bricks.push(brick);

        // Entrance animation
        sprite.setAlpha(0).setY(y - 30);
        this.tweens.add({
          targets: sprite, alpha: 1, y: y,
          duration: 300 + rowIdx * 50,
          delay: colIdx * 20 + rowIdx * 30,
          ease: 'Back.easeOut'
        });
      });
    });

    // Spawn enemies after bricks
    this.levelData.enemies.forEach((eData) => {
      this._spawnEnemy(eData);
    });
  }

  _buildPaddle() {
    const gs = window.GameState;
    this.paddle = this.add.image(GW / 2, PADDLE_Y, 'paddle');
    this.paddle.setDisplaySize(gs.paddleWidth, 16);
    this.paddleGlow = this.add.rectangle(GW / 2, PADDLE_Y, gs.paddleWidth, 16, 0x00e5ff, 0.08);
  }

  _buildShieldNet() {
    const gs = window.GameState;
    const hasNet = gs.netBounces > 0;
    this.shieldNet = this.add.image(GW / 2, GH - 8, 'shield_net');
    this.shieldNet.setVisible(hasNet || this.puShieldTimer > 0);
    this.shieldNetBounces = gs.netBounces || 0;
    if (this.shieldNet.visible && this.shieldNetBounces > 0) {
      this._flashShield();
    }
  }

  _spawnBall(x, y, vx, vy) {
    const gs = window.GameState;
    const bx = x || GW / 2;
    const by = y || PADDLE_Y - 20;
    const launched = (vx !== undefined);
    const speed = gs.ballSpeed;

    const sprite = this.add.image(bx, by, 'ball');
    const glow   = this.add.image(bx, by, 'ball_glow').setAlpha(0.4).setDepth(-1);

    const ball = {
      sprite, glow,
      vx: vx || 0,
      vy: vy || 0,
      launched: launched,
      trail: [],
      trailMax: 6,
    };
    this.balls.push(ball);

    if (!launched && this.balls.length === 1) {
      this.ballLaunched = false;
    }
    return ball;
  }

  _spawnEnemy(eData) {
    const x = BRICK_OFFSET_X + eData.col * (BRICK_W + BRICK_PAD_X) + BRICK_W / 2;
    const y = BRICK_OFFSET_Y - 40;

    const typeKey = `enemy_${eData.type}`;
    const sprite = this.add.image(x, y, typeKey);
    sprite.setScale(0.85);

    // Fire rate and speed scale with world difficulty
    const world = window.GameState.world;
    const diffMult = 1 - (world - 1) * 0.18; // world 1=1.0, world 4=0.46 → faster
    const baseShooterRate = 2600;
    const baseGuardianRate = 3200;

    const enemy = {
      sprite,
      type: eData.type,
      x, y,
      hp: eData.type === 'guardian' ? 2 + Math.floor(world / 2) : 1,
      dir: 1,
      speed: (eData.type === 'drifter' ? 85 : (eData.type === 'guardian' ? 65 : 0)) + world * 12,
      fireRate: eData.type === 'shooter'
        ? Math.max(700, baseShooterRate * diffMult)
        : eData.type === 'guardian'
          ? Math.max(900, baseGuardianRate * diffMult)
          : 99999,
      fireTimer: 600 + Math.random() * 1200, // first shot comes quickly
      alive: true,
    };
    this.enemies.push(enemy);

    // Float-in animation
    sprite.setAlpha(0).setY(y - 20);
    this.tweens.add({ targets: sprite, alpha: 1, y, duration: 400, delay: 500, ease: 'Back.easeOut' });
  }

  _spawnBoss() {
    const bossData = this.levelData.boss;
    const keyMap = {
      crystal_warden: 'boss_crystal_warden',
      forge_tyrant:   'boss_forge_tyrant',
      void_lurker:    'boss_void_lurker',
      circuit_mind:   'boss_circuit_mind',
      void_architect: 'boss_void_architect',
    };
    const bossKey = keyMap[bossData.type] || 'boss_crystal_warden';
    const bossW   = bossKey === 'boss_void_architect' ? 150 : 130;
    const bossH   = bossKey === 'boss_void_architect' ? 130 : 110;

    this.boss = {
      sprite: this.add.image(GW / 2, 160, bossKey),
      hp: bossData.hp,
      maxHp: bossData.hp,
      speed: bossData.speed,
      fireRate: bossData.fireRate,
      fireTimer: bossData.fireRate,
      dir: 1,
      phase: 1,
      type: bossData.type,
      alive: true,
      hitCooldown: 0,
    };
    this.boss.sprite.setScale(1);

    // Show HP bar
    const ws = NARRATIVE.worlds[window.GameState.world - 1];
    const bossName = ws ? ws.bossName : 'BOSS';
    this.bossHpBar.bg.setVisible(true);
    this.bossHpBar.fill.setVisible(true);
    this.bossHpBar.label.setVisible(true).setText(bossName);
    this.bossHpBar.border.setVisible(true);

    // Entrance animation
    this.boss.sprite.setAlpha(0).setY(-80);
    this.tweens.add({
      targets: this.boss.sprite, alpha: 1, y: 160,
      duration: 800, ease: 'Back.easeOut',
      onComplete: () => { this.bossActive = true; }
    });

    // Intro flash
    this.cameras.main.flash(300, 255, 0, 50, false);
    this._showFloatingText(GW / 2, GH / 2, '⚡ BOSS', '#ff4466', 48);
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
    this.paddle.setDisplaySize(gs.paddleWidth, 16);
    this.paddleGlow.width = gs.paddleWidth;

    // Move unlaunchedball with paddle
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

    // Apply start fire buff
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

    // Magnet: gently steer toward paddle center
    if (gs.hasMagnet) {
      // Works on both desktop (mouse) and mobile (paddle position)
      const targetX = this.paddle.x;
      const steer = (targetX - ball.sprite.x) * 0.28;
      ball.vx += steer * dt;
      // Clamp speed
      const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (spd > gs.ballSpeed * 1.5) {
        ball.vx = (ball.vx / spd) * gs.ballSpeed * 1.5;
        ball.vy = (ball.vy / spd) * gs.ballSpeed * 1.5;
      }
    }

    // Move
    ball.sprite.x += ball.vx * dt;
    ball.sprite.y += ball.vy * dt;
    ball.glow.x = ball.sprite.x;
    ball.glow.y = ball.sprite.y;

    // Trail particles
    this._updateBallTrail(ball);

    // Color tint for power-ups
    if (this.puFire)  ball.sprite.setTint(0xff6600);
    else if (this.puGhost) ball.sprite.setTint(0x8888ff);
    else              ball.sprite.clearTint();

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
      this._emitParticles(ball.sprite.x, ball.sprite.y, 0x00e5ff, 4);
    }

    // Brick collisions
    if (!this.puGhost) {
      this._checkBallBrickCollisions(ball);
    } else {
      // Ghost: still destroy bricks, no bounce
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
    const hh = 8 + BALL_SIZE / 2;
    return (
      ball.vy > 0 &&
      ball.sprite.y + BALL_SIZE / 2 >= p.y - 8 &&
      ball.sprite.y - BALL_SIZE / 2 <= p.y + 8 &&
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
    const spd = Math.max(
      Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy),
      gs.ballSpeed
    );
    ball.vx = spd * Math.sin(bounceAngle);
    ball.vy = -spd * Math.cos(bounceAngle);
    ball.sprite.y = p.y - BALL_SIZE / 2 - 8 - 1;

    // Paddle flash
    this.tweens.add({
      targets: this.paddle, alpha: { from: 0.6, to: 1 },
      duration: 100, ease: 'Linear'
    });
  }

  _checkBallBrickCollisions(ball) {
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      if (!brick.sprite.visible) continue;
      if (brick.indestructible) {
        // Still bounce
        if (this._ballHitsBrick(ball, brick)) {
          this._resolveBounceBrick(ball, brick);
        }
        continue;
      }
      if (this._ballHitsBrick(ball, brick)) {
        this._resolveBounceBrick(ball, brick);
        this._damageBrick(brick, i);
        break; // Only one brick per frame
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
    const bx = brick.sprite.x, by = brick.sprite.y;
    const hw = BRICK_W / 2 + BALL_SIZE / 2;
    const hh = BRICK_H / 2 + BALL_SIZE / 2;
    return (
      Math.abs(ball.sprite.x - bx) < hw &&
      Math.abs(ball.sprite.y - by) < hh
    );
  }

  _resolveBounceBrick(ball, brick) {
    const bx = brick.sprite.x, by = brick.sprite.y;
    const overlapX = (BRICK_W / 2 + BALL_SIZE / 2) - Math.abs(ball.sprite.x - bx);
    const overlapY = (BRICK_H / 2 + BALL_SIZE / 2) - Math.abs(ball.sprite.y - by);

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
    this.bricksBrokenThisLevel++;
    this.explosiveCounter++;
    window.GameState.bricksBroken = (window.GameState.bricksBroken || 0) + 1;

    if (brick.hp <= 0) {
      // Destroyed
      this._emitParticles(brick.sprite.x, brick.sprite.y, this._brickColor(brick.cell), 12);
      this._destroyBrick(brick, index);

      // Score
      const pts = brick.maxHp * 10 * window.GameState.world;
      gs.score += pts;
      this._showFloatingScore(brick.sprite.x, brick.sprite.y, pts);

      // Chain reaction
      if (gs.chainChance && Math.random() < gs.chainChance) {
        this.time.delayedCall(80, () => this._chainExplode(brick));
      }

      // Explosive every N bricks
      if (gs.explosiveEvery && this.explosiveCounter >= gs.explosiveEvery) {
        this.explosiveCounter = 0;
        this._explosiveArea(brick.sprite.x, brick.sprite.y);
      }

      // Power-up drop
      if (brick.cell === 9 || Math.random() < 0.18) {
        this._dropPowerUp(brick.sprite.x, brick.sprite.y);
      }
    } else {
      // Cracked
      const crackedKey = `brick_${brick.cell}_cracked`;
      brick.sprite.setTexture(crackedKey);
      this._emitParticles(brick.sprite.x, brick.sprite.y, this._brickColor(brick.cell), 4);
      this.cameras.main.shake(40, 0.003);
    }
  }

  _destroyBrick(brick, index) {
    this.tweens.add({
      targets: brick.sprite,
      scaleX: 1.3, scaleY: 1.3, alpha: 0,
      duration: 150, ease: 'Quad.easeOut',
      onComplete: () => brick.sprite.destroy()
    });
    this.bricks.splice(index, 1);
    this.cameras.main.shake(30, 0.002);
  }

  _chainExplode(sourceBrick) {
    const sx = sourceBrick.sprite.x || sourceBrick.x;
    const sy = sourceBrick.sprite.y || sourceBrick.y;
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const b = this.bricks[i];
      if (b.indestructible) continue;
      const dx = b.sprite.x - sx;
      const dy = b.sprite.y - sy;
      if (Math.sqrt(dx * dx + dy * dy) < (BRICK_W + BRICK_PAD_X) * 1.5) {
        this._emitParticles(b.sprite.x, b.sprite.y, this._brickColor(b.cell), 8);
        b.sprite.destroy();
        this.bricks.splice(i, 1);
        window.GameState.score += b.maxHp * 5;
      }
    }
    this.cameras.main.shake(80, 0.006);
    this._showFloatingText(sx, sy, 'CHAÎNE!', '#ffaa00');
  }

  _explosiveArea(cx, cy) {
    const radius = BRICK_W * 2;
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const b = this.bricks[i];
      if (b.indestructible) continue;
      const dx = b.sprite.x - cx, dy = b.sprite.y - cy;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        this._emitParticles(b.sprite.x, b.sprite.y, 0xff8800, 10);
        b.sprite.destroy();
        this.bricks.splice(i, 1);
        window.GameState.score += b.maxHp * 8;
      }
    }
    this._emitParticles(cx, cy, 0xffcc00, 25);
    this.cameras.main.shake(100, 0.008);
    this._showFloatingText(cx, cy, 'EXPLOSION!', '#ff8800', 28);
  }

  _checkBallEnemyCollisions(ball) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.alive) continue;
      const dx = ball.sprite.x - enemy.sprite.x;
      const dy = ball.sprite.y - enemy.sprite.y;
      if (Math.sqrt(dx * dx + dy * dy) < 24) {
        enemy.hp--;
        ball.vy *= -1;
        this._emitParticles(enemy.sprite.x, enemy.sprite.y, 0xff4466, 8);
        if (enemy.hp <= 0) {
          this._killEnemy(enemy, i);
          window.GameState.score += 50 * window.GameState.world;
          this._showFloatingScore(enemy.sprite.x, enemy.sprite.y, 50 * window.GameState.world);
        } else {
          this.tweens.add({ targets: enemy.sprite, alpha: 0.3, duration: 80, yoyo: true });
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
    const hitRadius = 55;

    if (dist < hitRadius) {
      const dmg = this.puFire ? 3 : 1;
      boss.hp -= dmg;
      boss.hitCooldown = 200;

      // Bounce ball
      const nx = dx / dist, ny = dy / dist;
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;

      // HUD update
      const ratio = Math.max(0, boss.hp / boss.maxHp);
      this.bossHpBar.fill.setDisplaySize(400 * ratio, 10);

      // Phase transitions
      if (boss.hp <= 0) {
        this._defeatBoss();
      } else {
        // Flash
        this.tweens.add({ targets: boss.sprite, alpha: 0.3, duration: 100, yoyo: true });
        this.cameras.main.shake(60, 0.005);
        this._emitParticles(boss.sprite.x, boss.sprite.y, 0xff0044, 10);

        // Phase change
        const newPhase = boss.hp < boss.maxHp * 0.33 ? 3 : boss.hp < boss.maxHp * 0.66 ? 2 : 1;
        if (newPhase > boss.phase) {
          boss.phase = newPhase;
          boss.speed *= 1.25;
          boss.fireRate = Math.max(600, boss.fireRate * 0.75);
          this._showFloatingText(GW / 2, GH / 3, `PHASE ${newPhase}!`, '#ff4400', 36);
          this.cameras.main.flash(200, 255, 50, 0, false);
        }
      }
    }
  }

  _checkLaserBrickCollision(laser, laserIndex) {
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      if (brick.indestructible) continue;
      const bx = brick.sprite.x, by = brick.sprite.y;
      if (
        Math.abs(laser.sprite.x - bx) < BRICK_W / 2 + 2 &&
        laser.sprite.y >= by - BRICK_H / 2 &&
        laser.sprite.y <= by + BRICK_H / 2
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
      const dx = Math.abs(laser.sprite.x - boss.sprite.x);
      const dy = Math.abs(laser.sprite.y - boss.sprite.y);
      if (dx < 55 && dy < 50) {
        boss.hp -= 2;
        const ratio = Math.max(0, boss.hp / boss.maxHp);
        this.bossHpBar.fill.setDisplaySize(400 * ratio, 10);
        this._emitParticles(laser.sprite.x, laser.sprite.y, 0xff6600, 5);
        laser.sprite.destroy();
        this.playerLasers.splice(laserIndex, 1);
        if (boss.hp <= 0) this._defeatBoss();
      }
    }
  }

  _updateEnemy(enemy, scaledDelta) {
    if (!enemy.alive) return;
    const dt = scaledDelta / 1000;

    // Movement
    if (enemy.type === 'drifter' || enemy.type === 'guardian') {
      enemy.sprite.x += enemy.speed * enemy.dir * dt;
      if (enemy.sprite.x > GW - 30) enemy.dir = -1;
      if (enemy.sprite.x < 30) enemy.dir = 1;
    }
    if (enemy.type === 'guardian') {
      // Oscillate vertically
      enemy.sprite.y = enemy.y + Math.sin(this.time.now * 0.002) * 20;
    }

    // Firing
    enemy.fireTimer -= scaledDelta;
    if (enemy.fireTimer <= 0) {
      enemy.fireTimer = enemy.fireRate + Math.random() * 1000;
      if (enemy.type === 'shooter' || enemy.type === 'guardian') {
        this._enemyFire(enemy);
      }
    }

    // Glow pulse
    enemy.sprite.alpha = 0.8 + Math.sin(this.time.now * 0.003 + enemy.sprite.x) * 0.2;
  }

  _updateBoss(scaledDelta) {
    const boss = this.boss;
    const dt = scaledDelta / 1000;

    // Hit cooldown
    if (boss.hitCooldown > 0) boss.hitCooldown -= scaledDelta;

    // Movement
    boss.sprite.x += boss.speed * boss.dir * dt;
    if (boss.sprite.x > GW - 80) boss.dir = -1;
    if (boss.sprite.x < 80) boss.dir = 1;

    // Vertical oscillation (phase 2+)
    if (boss.phase >= 2) {
      boss.sprite.y = 160 + Math.sin(this.time.now * 0.001) * 30;
    }

    // Fire
    boss.fireTimer -= scaledDelta;
    if (boss.fireTimer <= 0) {
      boss.fireTimer = boss.fireRate;
      this._bossFire(boss);
    }

    // Glow pulse
    boss.sprite.alpha = 0.85 + Math.sin(this.time.now * 0.004) * 0.15;
  }

  _tickTimers(scaledDelta) {
    if (this.puExpandTimer > 0) {
      this.puExpandTimer -= scaledDelta;
      if (this.puExpandTimer <= 0) {
        window.GameState.paddleWidth = Math.max(140, window.GameState.paddleWidth - 40);
        this.paddle.setDisplaySize(window.GameState.paddleWidth, 16);
      }
    }
    if (this.puSlowTimer > 0) {
      this.puSlowTimer -= scaledDelta;
      if (this.puSlowTimer <= 0) {
        this.puSlow = false;
        this.balls.forEach(b => {
          const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          const targetSpeed = window.GameState.ballSpeed;
          b.vx = (b.vx / spd) * targetSpeed;
          b.vy = (b.vy / spd) * targetSpeed;
        });
      }
    }
    if (this.puLaserTimer > 0) {
      this.puLaserTimer -= scaledDelta;
    }
    if (this.puShieldTimer > 0) {
      this.puShieldTimer -= scaledDelta;
      if (this.puShieldTimer <= 0) {
        this.shieldNet.setVisible(this.shieldNetBounces > 0);
      }
    }
    if (this.puFireTimer > 0) {
      this.puFireTimer -= scaledDelta;
      if (this.puFireTimer <= 0) this.puFire = false;
    }
    if (this.puGhostTimer > 0) {
      this.puGhostTimer -= scaledDelta;
      if (this.puGhostTimer <= 0) this.puGhost = false;
    }
    if (this.puBombTimer > 0) {
      this.puBombTimer -= scaledDelta;
    }
    if (this.laserCooldown > 0) {
      this.laserCooldown -= scaledDelta;
    }
  }

  _updateHUD() {
    const gs = window.GameState;
    this.hudScore.setText(gs.score.toString().padStart(6, '0'));

    // Power-up status
    const statuses = [];
    if (this.puFireTimer > 0)   statuses.push(`FIRE ${(this.puFireTimer/1000).toFixed(1)}s`);
    if (this.puGhostTimer > 0)  statuses.push(`GHOST ${(this.puGhostTimer/1000).toFixed(1)}s`);
    if (this.puSlowTimer > 0)   statuses.push(`SLOW ${(this.puSlowTimer/1000).toFixed(1)}s`);
    if (this.puExpandTimer > 0) statuses.push(`+SIZE ${(this.puExpandTimer/1000).toFixed(1)}s`);
    if (this.puLaserTimer > 0)  statuses.push(`LASER ${(this.puLaserTimer/1000).toFixed(1)}s`);
    if (this.puShieldTimer > 0) statuses.push(`SHIELD ${(this.puShieldTimer/1000).toFixed(1)}s`);
    this.puStatusText.setText(statuses.join('  '));

    // Time dilation charges indicator (desktop seulement)
    if (!this.sys.game.device.input.touch) {
      if (gs.timeDilationCharges > 0) {
        this.tdIndicator.setAlpha(1).setText(`[ESPACE] RALENTIR x${gs.timeDilationCharges}`);
      } else {
        this.tdIndicator.setAlpha(0);
      }
    }

    this._updateMobileButtons();
  }

  // ══════════════════════════════════════════════════════
  //  ACTIONS
  // ══════════════════════════════════════════════════════

  _enemyFire(enemy) {
    const world = window.GameState.world;
    const speed = 190 + world * 55;  // world 1=245, world 4=410 px/s

    // Aim at paddle with slight randomness
    const dx = this.paddle.x - enemy.sprite.x;
    const dy = PADDLE_Y - enemy.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const jitter = (Math.random() - 0.5) * 0.25; // ±7° random
    const baseAngle = Math.atan2(dy, dx);
    const angle = baseAngle + jitter;

    const sprite = this.add.image(enemy.sprite.x, enemy.sprite.y + 20, 'enemy_bullet')
      .setScale(1.4)
      .setTint(this._worldBulletTint());

    this.enemyBullets.push({
      sprite,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      boss: true,  // use vx/vy path in update loop
    });
  }

  _bossFire(boss) {
    const numShots = boss.phase >= 3 ? 5 : boss.phase >= 2 ? 3 : 1;
    const speed = 260 + boss.phase * 70;

    // Always aim at the paddle (center shot), spread around that
    const dx = this.paddle.x - boss.sprite.x;
    const dy = PADDLE_Y - boss.sprite.y;
    const baseAngle = Math.atan2(dy, dx);
    const spreadStep = boss.phase >= 3 ? 0.32 : 0.28;

    for (let i = 0; i < numShots; i++) {
      const spread = (i - (numShots - 1) / 2) * spreadStep;
      const angle = baseAngle + spread;

      const sprite = this.add.image(boss.sprite.x, boss.sprite.y + 55, 'enemy_bullet')
        .setScale(1.8)
        .setTint(this._bossColor(boss.type));

      // Phase 3: add homing correction every 300ms
      this.enemyBullets.push({
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        boss: true,
        homing: boss.phase >= 3 && i === Math.floor(numShots / 2), // center bullet homes
      });
    }
  }

  _bossColor(type) {
    const map = {
      crystal_warden: 0x00ccff,
      forge_tyrant:   0xff6600,
      void_lurker:    0xcc00ff,
      circuit_mind:   0x00ff88,
      void_architect: 0xffffff,
    };
    return map[type] || 0xff4400;
  }

  _worldBulletTint() {
    const tints = [0xff4400, 0x00ccff, 0xff6600, 0xcc00ff, 0x00ff88];
    return tints[(window.GameState.world - 1)] || 0xff4400;
  }

  _fireLaser() {
    if (!window.GameState.hasLaser && this.puLaserTimer <= 0) return;
    if (this.laserCooldown > 0) return;
    this.laserCooldown = 180;

    const laser = {
      sprite: this.add.image(this.paddle.x - 30, PADDLE_Y - 20, 'laser_beam')
    };
    const laser2 = {
      sprite: this.add.image(this.paddle.x + 30, PADDLE_Y - 20, 'laser_beam')
    };
    this.playerLasers.push(laser, laser2);
  }

  _hitPaddleByBullet(bullet) {
    const gs = window.GameState;
    bullet.sprite.destroy();

    if (gs.voidShieldCharges > 0) {
      gs.voidShieldCharges--;
      this._showFloatingText(this.paddle.x, PADDLE_Y - 30, 'BOUCLIER!', '#8888ff');
      this._emitParticles(this.paddle.x, PADDLE_Y, 0x8888ff, 10);
      return;
    }
    this._loseHP();
  }

  _loseHP() {
    const gs = window.GameState;
    gs.hp--;
    this._buildHPDisplay();
    this.cameras.main.shake(150, 0.015);
    this.cameras.main.flash(200, 255, 0, 0, false);
    this._showFloatingText(GW / 2, GH / 2, '-1 VIE', '#ff3388', 36);

    if (gs.hp <= 0) {
      this.time.delayedCall(500, () => this._gameOver());
    }
  }

  _ballFell(ball) {
    const idx = this.balls.indexOf(ball);
    ball.sprite.destroy();
    ball.glow.destroy();
    if (idx >= 0) this.balls.splice(idx, 1);

    // Shield net catch
    if (this.shieldNet.visible && (this.shieldNetBounces > 0 || this.puShieldTimer > 0)) {
      const newBall = this._spawnBall(this.paddle.x, PADDLE_Y - 20);
      newBall.launched = false;
      this.ballLaunched = false;
      if (this.shieldNetBounces > 0) {
        this.shieldNetBounces--;
        if (this.shieldNetBounces <= 0 && this.puShieldTimer <= 0) {
          this.shieldNet.setVisible(false);
        }
      }
      this._showFloatingText(GW / 2, GH - 80, 'FILET!', '#44ff88');
      return;
    }

    if (this.balls.length === 0) {
      this._loseHP();
      if (window.GameState.hp > 0) {
        this.time.delayedCall(600, () => {
          if (!this.levelComplete) this._respawnBall();
        });
      }
    }
  }

  _respawnBall() {
    this.ballLaunched = false;
    const ball = this._spawnBall(this.paddle.x, PADDLE_Y - 20);
    ball.launched = false;
  }

  _killEnemy(enemy, index) {
    this._emitParticles(enemy.sprite.x, enemy.sprite.y, 0xff4466, 15);
    enemy.alive = false;
    this.tweens.add({
      targets: enemy.sprite,
      scaleX: 2, scaleY: 2, alpha: 0,
      duration: 200,
      onComplete: () => enemy.sprite.destroy()
    });
    this.enemies.splice(index, 1);
    this.cameras.main.shake(50, 0.004);
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

    // Healing upgrade
    if (gs.upgrades.find(u => u.id === 'healing_light') && gs.hp < gs.maxHp) {
      gs.hp++;
      this._buildHPDisplay();
      this._showFloatingText(GW / 2, GH / 2 - 40, '+1 VIE', '#ff3388', 30);
    }

    // Explosion sequence
    this.cameras.main.flash(400, 255, 100, 0, false);
    this.cameras.main.shake(300, 0.02);
    this._emitParticles(boss.sprite.x, boss.sprite.y, 0xff4400, 40);
    this._emitParticles(boss.sprite.x, boss.sprite.y, 0xffcc00, 30);

    this.tweens.add({
      targets: boss.sprite,
      scaleX: 3, scaleY: 3, alpha: 0, rotation: 2,
      duration: 600, ease: 'Quad.easeOut',
      onComplete: () => {
        boss.sprite.destroy();
        this.bossHpBar.bg.setVisible(false);
        this.bossHpBar.fill.setVisible(false);
        this.bossHpBar.label.setVisible(false);
        this.bossHpBar.border.setVisible(false);
      }
    });

    this._showFloatingText(GW / 2, GH / 2, 'BOSS VAINCU!', '#ffcc00', 42);
    this.time.delayedCall(1200, () => this._levelComplete());
  }

  _collectPowerUp(pu) {
    const gs = window.GameState;
    this._emitParticles(pu.sprite.x, pu.sprite.y, pu.color || 0xffffff, 12);
    pu.sprite.destroy();
    pu.label.destroy();

    switch (pu.id) {
      case 'pu_multi':
        if (this.balls.length < 5) {
          const ref = this.balls[0];
          this._spawnBall(ref.sprite.x + 10, ref.sprite.y,
            -ref.vx + Phaser.Math.Between(-50, 50), ref.vy);
          this.balls[this.balls.length - 1].launched = true;
        }
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'MULTI BALLE!', '#ff88ff');
        break;
      case 'pu_expand':
        gs.paddleWidth = Math.min(gs.paddleWidth + 40, 260);
        this.puExpandTimer = 15000;
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'ÉTENDUE!', '#00e5ff');
        break;
      case 'pu_slow':
        this.puSlowTimer = 10000;
        this.puSlow = true;
        this.balls.forEach(b => { b.vx *= 0.55; b.vy *= 0.55; });
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'RALENTI!', '#8888ff');
        break;
      case 'pu_laser':
        this.puLaserTimer = 12000;
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'LASER!', '#ff4400');
        break;
      case 'pu_shield':
        this.puShieldTimer = 20000;
        this.shieldNet.setVisible(true);
        this._flashShield();
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'FILET!', '#44ff88');
        break;
      case 'pu_fire':
        this.puFireTimer = 8000;
        this.puFire = true;
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'FEU!', '#ff8800');
        break;
      case 'pu_hp':
        if (gs.hp < gs.maxHp) { gs.hp++; this._buildHPDisplay(); }
        this._showFloatingText(pu.sprite.x, pu.sprite.y, '+VIE!', '#ff3388');
        break;
      case 'pu_bomb':
        this.puBombTimer = 8000;
        this._showFloatingText(pu.sprite.x, pu.sprite.y, 'BOMBES!', '#ffcc00');
        // Immediate explosion near paddle
        this._explosiveArea(this.paddle.x, PADDLE_Y - 100);
        break;
    }

    gs.score += 25;
  }

  _dropPowerUp(x, y) {
    const puDef = Phaser.Utils.Array.GetRandom(POWERUPS);
    const sprite = this.add.image(x, y, puDef.id).setScale(0.9);
    const label = this.add.text(x, y + 20, puDef.label, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '8px', color: puDef.textColor,
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
    this._showFloatingText(GW / 2, GH / 2, 'DILATATION!', '#8888ff', 32);
  }

  _applyStartBuffs() {
    const gs = window.GameState;
    // Apply run upgrade effects at level start
    // (they were applied to state at selection, so state carries them)
  }

  // ══════════════════════════════════════════════════════
  //  WIN / LOSE CONDITIONS
  // ══════════════════════════════════════════════════════

  _checkWinCondition() {
    // Boss level: won when boss defeated (handled in _defeatBoss)
    if (this.levelData.isBoss) return;

    // Normal level: all non-indestructible bricks cleared
    const remaining = this.bricks.filter(b => !b.indestructible);
    if (remaining.length === 0 && this.ballLaunched) {
      this._levelComplete();
    }
  }

  _levelComplete() {
    if (this.levelComplete) return;
    this.levelComplete = true;

    this.cameras.main.flash(300, 0, 200, 100, false);
    this._showFloatingText(GW / 2, GH / 2, 'NIVEAU COMPLÉTÉ!', '#00ff88', 40);

    this.time.delayedCall(1400, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this._advanceLevel();
      });
    });
  }

  _advanceLevel() {
    const gs = window.GameState;
    gs.level++;

    // Check if world complete
    if (gs.level > 4) {
      gs.world++;
      gs.level = 1;

      if (gs.world > 5) {
        // Victory!
        this.scene.start('VictoryScene');
        return;
      }

      // World complete narrative
      const prevWorld = NARRATIVE.worlds[gs.world - 2];
      if (prevWorld && prevWorld.bossDefeated) {
        this.scene.start('NarrativeScene', {
          lines: prevWorld.bossDefeated,
          nextScene: 'UpgradeScene',
          worldColor: prevWorld.glowColor,
          title: `MONDE ${gs.world - 1} TERMINÉ`
        });
        return;
      }
    }

    this.scene.start('UpgradeScene');
  }

  _gameOver() {
    this.levelComplete = true; // prevent further updates
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
    // Create fading trail circles
    const trail = this.add.circle(ball.sprite.x, ball.sprite.y, 4,
      this.puFire ? 0xff6600 : this.puGhost ? 0x8888ff : 0x00aaff, 0.35);
    ball.trail.push(trail);
    if (ball.trail.length > ball.trailMax) {
      const old = ball.trail.shift();
      old.destroy();
    }
    // Fade out trail
    ball.trail.forEach((t, i) => {
      t.setAlpha((i / ball.trail.length) * 0.3);
    });
  }

  _showFloatingText(x, y, text, color, size = 20) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Orbitron, Courier New',
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: t, y: y - 60, alpha: 0,
      duration: 1000, ease: 'Quad.easeOut',
      onComplete: () => t.destroy()
    });
  }

  _showFloatingScore(x, y, pts) {
    const t = this.add.text(x, y - 10, `+${pts}`, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '14px',
      color: '#ffcc00',
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: t, y: y - 45, alpha: 0,
      duration: 700, ease: 'Quad.easeOut',
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
      fontSize: '18px', color: worldData.glowColor, letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(50);

    this.tweens.add({
      targets: label, alpha: 1, y: GH / 2 - 40,
      duration: 600, ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: label, alpha: 0, delay: 1500, duration: 500, onComplete: () => label.destroy() });
      }
    });
  }

  _showLevelIntro() {
    const gs = window.GameState;
    const worldData = NARRATIVE.worlds[gs.world - 1];
    if (!worldData) return;
    const levelNarr = worldData.levels && worldData.levels[gs.level - 1];
    const introLine = levelNarr ? levelNarr.intro : null;
    if (!introLine) return;

    const introText = this.add.text(GW / 2, GH - 90, introLine, {
      fontFamily: 'Share Tech Mono, Courier New',
      fontSize: '14px',
      color: '#8899aa',
      align: 'center',
      wordWrap: { width: 600 },
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: introText, alpha: 0.8,
      duration: 800, delay: 300, ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: introText, alpha: 0,
          delay: 3000, duration: 1000,
          onComplete: () => introText.destroy()
        });
      }
    });
  }

  _flashShield() {
    this.tweens.add({
      targets: this.shieldNet, alpha: { from: 0.3, to: 1.0 },
      duration: 300, yoyo: true, repeat: 2
    });
  }

  _brickColor(cell) {
    const colors = [0, 0x3399cc, 0x44aa44, 0xaa6600, 0xcc2244, 0x9922cc, 0xdd4400, 0xcc0088, 0x666666, 0xffcc00];
    return colors[cell] || 0xffffff;
  }

  // ── Rectangle overlap helper ─────────────────────────
  _rectOverlap(sprA, sprB) {
    const ax = sprA.x, ay = sprA.y;
    const aw = (sprA.displayWidth || sprA.width || 16) / 2;
    const ah = (sprA.displayHeight || sprA.height || 16) / 2;
    const bx = sprB.x, by = sprB.y;
    const bw = (sprB.displayWidth || sprB.width || 140) / 2;
    const bh = (sprB.displayHeight || sprB.height || 16) / 2;
    return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
  }
}
