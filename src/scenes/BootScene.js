class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    this._genTextures();
    this.scene.start('MenuScene');
  }

  _genTextures() {
    // ── Ball ─────────────────────────────────────────────
    let g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(9, 9, 9);
    g.generateTexture('ball', 18, 18);
    g.destroy();

    // ── Ball glow (soft outer ring) ──────────────────────
    g = this.make.graphics({ add: false });
    g.fillStyle(0xaaddff, 0.4);
    g.fillCircle(14, 14, 14);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(14, 14, 7);
    g.generateTexture('ball_glow', 28, 28);
    g.destroy();

    // ── Paddle ───────────────────────────────────────────
    g = this.make.graphics({ add: false });
    g.fillStyle(0x1a1a2e, 1);
    g.fillRoundedRect(0, 0, 140, 16, 8);
    g.fillStyle(0x00e5ff, 1);
    g.fillRoundedRect(2, 2, 136, 5, 4);
    g.fillStyle(0x0099cc, 1);
    g.fillRoundedRect(2, 8, 136, 5, 4);
    g.fillStyle(0xffffff, 0.4);
    g.fillRoundedRect(8, 3, 120, 2, 2);
    g.generateTexture('paddle', 140, 16);
    g.destroy();

    // ── Particle ─────────────────────────────────────────
    g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();

    // ── Star ─────────────────────────────────────────────
    g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(2, 2, 2);
    g.generateTexture('star', 4, 4);
    g.destroy();

    // ── Brick textures (types 1-9) ────────────────────────
    const BRICK_W = 60, BRICK_H = 22;
    const brickConfigs = [
      null, // index 0 = empty
      { base: 0x224466, top: 0x3399cc, line: 0x55ccff }, // 1 = 1HP
      { base: 0x2a3a22, top: 0x44aa44, line: 0x66ff66 }, // 2 = 1HP
      { base: 0x332211, top: 0xaa6600, line: 0xffaa00 }, // 3 = 1HP
      { base: 0x441122, top: 0xcc2244, line: 0xff4488 }, // 4 = 2HP
      { base: 0x3a1144, top: 0x9922cc, line: 0xcc44ff }, // 5 = 2HP
      { base: 0x442200, top: 0xdd4400, line: 0xff8800 }, // 6 = 3HP
      { base: 0x441144, top: 0xcc0088, line: 0xff00cc }, // 7 = 3HP
      { base: 0x222222, top: 0x666666, line: 0x999999 }, // 8 = indestructible
      { base: 0x443300, top: 0xffcc00, line: 0xffee88 }, // 9 = power-up brick
    ];

    for (let i = 1; i <= 9; i++) {
      const cfg = brickConfigs[i];
      g = this.make.graphics({ add: false });
      // Shadow
      g.fillStyle(0x000000, 0.5);
      g.fillRect(1, 1, BRICK_W, BRICK_H);
      // Base
      g.fillStyle(cfg.base, 1);
      g.fillRect(0, 0, BRICK_W - 1, BRICK_H - 1);
      // Top highlight
      g.fillStyle(cfg.top, 1);
      g.fillRect(0, 0, BRICK_W - 1, 5);
      // Inner accent
      g.lineStyle(1, cfg.line, 0.8);
      g.strokeRect(2, 2, BRICK_W - 5, BRICK_H - 5);
      // Shine
      g.fillStyle(0xffffff, 0.15);
      g.fillRect(3, 3, BRICK_W - 9, 3);
      // Special: indestructible gets cross-hatch
      if (i === 8) {
        g.lineStyle(1, 0x888888, 0.3);
        for (let x = 0; x < BRICK_W; x += 8) {
          g.lineBetween(x, 0, x, BRICK_H);
        }
      }
      // Special: powerup gets star indicator
      if (i === 9) {
        g.fillStyle(0xffee00, 0.9);
        g.fillCircle(BRICK_W / 2, BRICK_H / 2 - 1, 4);
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(BRICK_W / 2, BRICK_H / 2 - 1, 2);
      }
      g.generateTexture(`brick_${i}`, BRICK_W + 1, BRICK_H + 1);
      g.destroy();

      // Cracked variant (for half-HP bricks)
      g = this.make.graphics({ add: false });
      g.fillStyle(cfg.base, 1);
      g.fillRect(0, 0, BRICK_W - 1, BRICK_H - 1);
      g.fillStyle(cfg.top, 0.5);
      g.fillRect(0, 0, BRICK_W - 1, 5);
      g.lineStyle(2, 0x000000, 0.8);
      g.lineBetween(10, 0, 15, BRICK_H);
      g.lineBetween(30, 2, 20, BRICK_H - 2);
      g.lineBetween(45, 0, 50, BRICK_H);
      g.lineStyle(1, cfg.line, 0.5);
      g.strokeRect(2, 2, BRICK_W - 5, BRICK_H - 5);
      g.generateTexture(`brick_${i}_cracked`, BRICK_W + 1, BRICK_H + 1);
      g.destroy();
    }

    // ── Enemy textures ────────────────────────────────────
    // Drifter (diamond shape)
    g = this.make.graphics({ add: false });
    g.fillStyle(0xcc2244, 1);
    g.fillTriangle(20, 0, 40, 20, 0, 20);
    g.fillTriangle(20, 40, 40, 20, 0, 20);
    g.fillStyle(0xff4466, 0.8);
    g.fillTriangle(20, 4, 36, 20, 4, 20);
    g.lineStyle(1, 0xff0033, 1);
    g.strokeTriangle(20, 0, 40, 20, 0, 20);
    g.strokeTriangle(20, 40, 40, 20, 0, 20);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(20, 20, 5);
    g.generateTexture('enemy_drifter', 40, 40);
    g.destroy();

    // Shooter (turret)
    g = this.make.graphics({ add: false });
    g.fillStyle(0x884400, 1);
    g.fillRect(4, 4, 32, 32);
    g.fillStyle(0xcc6600, 1);
    g.fillRect(8, 8, 24, 24);
    g.fillStyle(0xff8800, 1);
    g.fillRect(16, 0, 8, 16);  // barrel
    g.fillStyle(0xffaa44, 0.6);
    g.fillRect(10, 10, 20, 8);
    g.lineStyle(1, 0xffaa00, 0.9);
    g.strokeRect(4, 4, 32, 32);
    g.fillStyle(0xffee00, 1);
    g.fillCircle(20, 20, 5);
    g.generateTexture('enemy_shooter', 40, 40);
    g.destroy();

    // Guardian (circle with orbit rings)
    g = this.make.graphics({ add: false });
    g.lineStyle(2, 0x00ccff, 0.4);
    g.strokeCircle(20, 20, 18);
    g.fillStyle(0x004466, 1);
    g.fillCircle(20, 20, 14);
    g.fillStyle(0x0088cc, 1);
    g.fillCircle(20, 20, 10);
    g.fillStyle(0x00eeff, 1);
    g.fillCircle(20, 20, 5);
    g.lineStyle(1, 0x00ccff, 0.7);
    g.strokeCircle(20, 20, 14);
    g.generateTexture('enemy_guardian', 40, 40);
    g.destroy();

    // ── Boss textures ─────────────────────────────────────
    this._genBossTexture('boss_crystal_warden',  0x00ccff, 0x004466, 120, 100);
    this._genBossTexture('boss_forge_tyrant',     0xff4400, 0x441100, 130, 110);
    this._genBossTexture('boss_void_lurker',      0xaa00ff, 0x220044, 140, 120);
    this._genBossTexture('boss_circuit_mind',     0x00ff88, 0x002211, 130, 110);
    this._genBossTexture('boss_void_architect',   0xffffff, 0x111111, 150, 130);

    // ── Power-up icons ────────────────────────────────────
    const puColors = {
      pu_multi:  0xff88ff, pu_expand: 0x00e5ff, pu_slow:   0x8888ff,
      pu_laser:  0xff4400, pu_shield: 0x44ff88, pu_fire:   0xff8800,
      pu_hp:     0xff3388, pu_bomb:   0xffcc00
    };
    for (const [id, color] of Object.entries(puColors)) {
      g = this.make.graphics({ add: false });
      g.fillStyle(color, 0.25);
      g.fillCircle(14, 14, 14);
      g.lineStyle(2, color, 0.9);
      g.strokeCircle(14, 14, 12);
      g.fillStyle(color, 1);
      g.fillCircle(14, 14, 5);
      g.generateTexture(id, 28, 28);
      g.destroy();
    }

    // ── Upgrade card icons ────────────────────────────────
    const upgradeColors = {
      upgrade_wide: 0x00e5ff, upgrade_speed: 0xffff00, upgrade_dual: 0xff88ff,
      upgrade_laser: 0xff4400, upgrade_net: 0x44ff88, upgrade_fire: 0xff6600,
      upgrade_chain: 0xffaa00, upgrade_shield: 0x8888ff, upgrade_heal: 0xff3388,
      upgrade_time: 0x00ffff, upgrade_magnet: 0xffcc00, upgrade_armor: 0x88ccff,
      upgrade_ghost: 0xaaaaff, upgrade_explode: 0xff8800, upgrade_over: 0xff0066
    };
    for (const [id, color] of Object.entries(upgradeColors)) {
      g = this.make.graphics({ add: false });
      g.fillStyle(0x0a0a1a, 1);
      g.fillRect(0, 0, 48, 48);
      g.fillStyle(color, 0.15);
      g.fillRect(0, 0, 48, 48);
      g.lineStyle(2, color, 0.8);
      g.strokeRect(1, 1, 46, 46);
      g.fillStyle(color, 1);
      g.fillCircle(24, 24, 10);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(19, 19, 4);
      g.generateTexture(id, 48, 48);
      g.destroy();
    }

    // ── Enemy bullet ─────────────────────────────────────
    g = this.make.graphics({ add: false });
    g.fillStyle(0xff4400, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xff8800, 0.7);
    g.fillCircle(4, 4, 2);
    g.generateTexture('enemy_bullet', 8, 8);
    g.destroy();

    // ── Player laser ─────────────────────────────────────
    g = this.make.graphics({ add: false });
    g.fillStyle(0xff4400, 1);
    g.fillRect(0, 0, 4, 20);
    g.fillStyle(0xffcc00, 0.8);
    g.fillRect(1, 0, 2, 20);
    g.generateTexture('laser_beam', 4, 20);
    g.destroy();

    // ── Net / Shield ──────────────────────────────────────
    g = this.make.graphics({ add: false });
    g.fillStyle(0x44ff88, 0.4);
    g.fillRect(0, 0, 960, 8);
    g.lineStyle(2, 0x44ff88, 0.9);
    g.lineBetween(0, 0, 960, 0);
    for (let x = 0; x < 960; x += 20) {
      g.lineStyle(1, 0x44ff88, 0.5);
      g.lineBetween(x, 0, x, 8);
    }
    g.generateTexture('shield_net', 960, 8);
    g.destroy();
  }

  _genBossTexture(key, primaryColor, darkColor, w, h) {
    const g = this.make.graphics({ add: false });
    const cx = w / 2, cy = h / 2;

    // Outer glow ring
    g.lineStyle(3, primaryColor, 0.3);
    g.strokeEllipse(cx, cy, w - 4, h - 4);
    // Body
    g.fillStyle(darkColor, 1);
    g.fillEllipse(cx, cy, w - 12, h - 12);
    // Core gradient layers
    g.fillStyle(primaryColor, 0.2);
    g.fillEllipse(cx, cy, w - 20, h - 20);
    g.fillStyle(primaryColor, 0.4);
    g.fillEllipse(cx, cy, (w - 20) * 0.7, (h - 20) * 0.7);
    g.fillStyle(primaryColor, 0.8);
    g.fillEllipse(cx, cy, (w - 20) * 0.35, (h - 20) * 0.35);
    g.fillStyle(0xffffff, 0.9);
    g.fillEllipse(cx, cy, (w - 20) * 0.15, (h - 20) * 0.15);
    // Accent lines
    g.lineStyle(1, primaryColor, 0.6);
    g.strokeEllipse(cx, cy, w - 16, h - 16);
    g.strokeEllipse(cx, cy, (w - 16) * 0.6, (h - 16) * 0.6);

    g.generateTexture(key, w, h);
    g.destroy();
  }
}
