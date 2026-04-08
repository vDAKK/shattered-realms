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
    g.fillCircle(7, 7, 7);
    g.generateTexture('ball', 14, 14);
    g.destroy();

    // ── Ball glow ────────────────────────────────────────
    g = this.make.graphics({ add: false });
    g.fillStyle(0xaaddff, 0.4);
    g.fillCircle(11, 11, 11);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(11, 11, 5);
    g.generateTexture('ball_glow', 22, 22);
    g.destroy();

    // ── Paddle ───────────────────────────────────────────
    g = this.make.graphics({ add: false });
    g.fillStyle(0x1a1a2e, 1);
    g.fillRoundedRect(0, 0, 120, 14, 7);
    g.fillStyle(0x00e5ff, 1);
    g.fillRoundedRect(2, 2, 116, 4, 3);
    g.fillStyle(0x0099cc, 1);
    g.fillRoundedRect(2, 7, 116, 4, 3);
    g.fillStyle(0xffffff, 0.4);
    g.fillRoundedRect(6, 3, 104, 2, 2);
    g.generateTexture('paddle', 120, 14);
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

    // ── Brick textures (types 1-9) : portrait size 30×14 ─
    const BRICK_W = 30, BRICK_H = 14;
    const brickConfigs = [
      null,
      { base: 0x224466, top: 0x3399cc, line: 0x55ccff },
      { base: 0x2a3a22, top: 0x44aa44, line: 0x66ff66 },
      { base: 0x332211, top: 0xaa6600, line: 0xffaa00 },
      { base: 0x441122, top: 0xcc2244, line: 0xff4488 },
      { base: 0x3a1144, top: 0x9922cc, line: 0xcc44ff },
      { base: 0x442200, top: 0xdd4400, line: 0xff8800 },
      { base: 0x441144, top: 0xcc0088, line: 0xff00cc },
      { base: 0x222222, top: 0x666666, line: 0x999999 },
      { base: 0x443300, top: 0xffcc00, line: 0xffee88 },
    ];

    for (let i = 1; i <= 9; i++) {
      const cfg = brickConfigs[i];
      g = this.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.5);
      g.fillRect(1, 1, BRICK_W, BRICK_H);
      g.fillStyle(cfg.base, 1);
      g.fillRect(0, 0, BRICK_W - 1, BRICK_H - 1);
      g.fillStyle(cfg.top, 1);
      g.fillRect(0, 0, BRICK_W - 1, 4);
      g.lineStyle(1, cfg.line, 0.8);
      g.strokeRect(1, 1, BRICK_W - 3, BRICK_H - 3);
      g.fillStyle(0xffffff, 0.15);
      g.fillRect(2, 2, BRICK_W - 6, 2);
      if (i === 8) {
        g.lineStyle(1, 0x888888, 0.3);
        for (let x = 0; x < BRICK_W; x += 5) {
          g.lineBetween(x, 0, x, BRICK_H);
        }
      }
      if (i === 9) {
        g.fillStyle(0xffee00, 0.9);
        g.fillCircle(BRICK_W / 2, BRICK_H / 2 - 1, 3);
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(BRICK_W / 2, BRICK_H / 2 - 1, 1.5);
      }
      g.generateTexture(`brick_${i}`, BRICK_W + 1, BRICK_H + 1);
      g.destroy();

      // Cracked variant
      g = this.make.graphics({ add: false });
      g.fillStyle(cfg.base, 1);
      g.fillRect(0, 0, BRICK_W - 1, BRICK_H - 1);
      g.fillStyle(cfg.top, 0.5);
      g.fillRect(0, 0, BRICK_W - 1, 4);
      g.lineStyle(2, 0x000000, 0.8);
      g.lineBetween(5, 0, 8, BRICK_H);
      g.lineBetween(15, 1, 12, BRICK_H - 1);
      g.lineBetween(23, 0, 26, BRICK_H);
      g.lineStyle(1, cfg.line, 0.5);
      g.strokeRect(1, 1, BRICK_W - 3, BRICK_H - 3);
      g.generateTexture(`brick_${i}_cracked`, BRICK_W + 1, BRICK_H + 1);
      g.destroy();
    }

    // ── Enemy textures ────────────────────────────────────
    // Drifter
    g = this.make.graphics({ add: false });
    g.fillStyle(0xcc2244, 1);
    g.fillTriangle(16, 0, 32, 16, 0, 16);
    g.fillTriangle(16, 32, 32, 16, 0, 16);
    g.fillStyle(0xff4466, 0.8);
    g.fillTriangle(16, 3, 28, 16, 4, 16);
    g.lineStyle(1, 0xff0033, 1);
    g.strokeTriangle(16, 0, 32, 16, 0, 16);
    g.strokeTriangle(16, 32, 32, 16, 0, 16);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(16, 16, 4);
    g.generateTexture('enemy_drifter', 32, 32);
    g.destroy();

    // Shooter
    g = this.make.graphics({ add: false });
    g.fillStyle(0x884400, 1);
    g.fillRect(3, 3, 26, 26);
    g.fillStyle(0xcc6600, 1);
    g.fillRect(6, 6, 20, 20);
    g.fillStyle(0xff8800, 1);
    g.fillRect(12, 0, 8, 12);
    g.fillStyle(0xffaa44, 0.6);
    g.fillRect(8, 8, 16, 6);
    g.lineStyle(1, 0xffaa00, 0.9);
    g.strokeRect(3, 3, 26, 26);
    g.fillStyle(0xffee00, 1);
    g.fillCircle(16, 16, 4);
    g.generateTexture('enemy_shooter', 32, 32);
    g.destroy();

    // Guardian
    g = this.make.graphics({ add: false });
    g.lineStyle(2, 0x00ccff, 0.4);
    g.strokeCircle(16, 16, 14);
    g.fillStyle(0x004466, 1);
    g.fillCircle(16, 16, 11);
    g.fillStyle(0x0088cc, 1);
    g.fillCircle(16, 16, 8);
    g.fillStyle(0x00eeff, 1);
    g.fillCircle(16, 16, 4);
    g.lineStyle(1, 0x00ccff, 0.7);
    g.strokeCircle(16, 16, 11);
    g.generateTexture('enemy_guardian', 32, 32);
    g.destroy();

    // Invader (new type for space-invader waves)
    g = this.make.graphics({ add: false });
    g.fillStyle(0x9900ff, 1);
    g.fillRect(4, 8, 24, 16);
    g.fillRect(0, 12, 32, 8);
    g.fillStyle(0xcc44ff, 0.8);
    g.fillRect(6, 10, 20, 12);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(11, 16, 3);
    g.fillCircle(21, 16, 3);
    g.fillStyle(0xff00ff, 1);
    g.fillCircle(11, 16, 1.5);
    g.fillCircle(21, 16, 1.5);
    g.generateTexture('enemy_invader', 32, 32);
    g.destroy();

    // ── Boss textures ─────────────────────────────────────
    this._genBossTexture('boss_crystal_warden',  0x00ccff, 0x004466, 100, 80);
    this._genBossTexture('boss_forge_tyrant',    0xff4400, 0x441100, 110, 90);
    this._genBossTexture('boss_void_lurker',     0xaa00ff, 0x220044, 110, 100);
    this._genBossTexture('boss_circuit_mind',    0x00ff88, 0x002211, 110, 90);
    this._genBossTexture('boss_void_architect',  0xffffff, 0x111111, 120, 110);
    this._genBossTexture('boss_petrified_queen', 0xffaa33, 0x442200, 120, 100);
    this._genBossTexture('boss_primordial_idea', 0xe0e0e0, 0x222233, 130, 110);

    // ── Power-up icons ────────────────────────────────────
    const puColors = {
      pu_multi:  0xff88ff, pu_expand: 0x00e5ff, pu_slow:   0x8888ff,
      pu_laser:  0xff4400, pu_shield: 0x44ff88, pu_fire:   0xff8800,
      pu_hp:     0xff3388, pu_bomb:   0xffcc00,
      pu_pierce: 0x00ffcc, pu_minigun: 0xff2200, pu_freeze: 0x44aaff, pu_double: 0xffff00,
    };
    for (const [id, color] of Object.entries(puColors)) {
      g = this.make.graphics({ add: false });
      g.fillStyle(color, 0.25);
      g.fillCircle(12, 12, 12);
      g.lineStyle(2, color, 0.9);
      g.strokeCircle(12, 12, 10);
      g.fillStyle(color, 1);
      g.fillCircle(12, 12, 4);
      g.generateTexture(id, 24, 24);
      g.destroy();
    }

    // ── Upgrade card icons ────────────────────────────────
    const upgradeColors = {
      upgrade_wide: 0x00e5ff, upgrade_speed: 0xffff00, upgrade_dual: 0xff88ff,
      upgrade_laser: 0xff4400, upgrade_net: 0x44ff88, upgrade_fire: 0xff6600,
      upgrade_chain: 0xffaa00, upgrade_shield: 0x8888ff, upgrade_heal: 0xff3388,
      upgrade_time: 0x00ffff, upgrade_magnet: 0xffcc00, upgrade_armor: 0x88ccff,
      upgrade_ghost: 0xaaaaff, upgrade_explode: 0xff8800, upgrade_over: 0xff0066,
      upgrade_pierce: 0x00ffcc, upgrade_score: 0xffff00, upgrade_surge: 0xff88ff,
      upgrade_luck: 0x44ff44,
    };
    for (const [id, color] of Object.entries(upgradeColors)) {
      g = this.make.graphics({ add: false });
      g.fillStyle(0x0a0a1a, 1);
      g.fillRect(0, 0, 40, 40);
      g.fillStyle(color, 0.15);
      g.fillRect(0, 0, 40, 40);
      g.lineStyle(2, color, 0.8);
      g.strokeRect(1, 1, 38, 38);
      g.fillStyle(color, 1);
      g.fillCircle(20, 20, 8);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(16, 16, 3);
      g.generateTexture(id, 40, 40);
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
    g.fillRect(0, 0, 4, 16);
    g.fillStyle(0xffcc00, 0.8);
    g.fillRect(1, 0, 2, 16);
    g.generateTexture('laser_beam', 4, 16);
    g.destroy();

    // ── Net / Shield ──────────────────────────────────────
    g = this.make.graphics({ add: false });
    g.fillStyle(0x44ff88, 0.4);
    g.fillRect(0, 0, 480, 6);
    g.lineStyle(2, 0x44ff88, 0.9);
    g.lineBetween(0, 0, 480, 0);
    for (let x = 0; x < 480; x += 16) {
      g.lineStyle(1, 0x44ff88, 0.5);
      g.lineBetween(x, 0, x, 6);
    }
    g.generateTexture('shield_net', 480, 6);
    g.destroy();
  }

  _genBossTexture(key, primaryColor, darkColor, w, h) {
    const g = this.make.graphics({ add: false });
    const cx = w / 2, cy = h / 2;

    g.lineStyle(3, primaryColor, 0.3);
    g.strokeEllipse(cx, cy, w - 4, h - 4);
    g.fillStyle(darkColor, 1);
    g.fillEllipse(cx, cy, w - 10, h - 10);
    g.fillStyle(primaryColor, 0.2);
    g.fillEllipse(cx, cy, w - 18, h - 18);
    g.fillStyle(primaryColor, 0.4);
    g.fillEllipse(cx, cy, (w - 18) * 0.7, (h - 18) * 0.7);
    g.fillStyle(primaryColor, 0.8);
    g.fillEllipse(cx, cy, (w - 18) * 0.35, (h - 18) * 0.35);
    g.fillStyle(0xffffff, 0.9);
    g.fillEllipse(cx, cy, (w - 18) * 0.15, (h - 18) * 0.15);
    g.lineStyle(1, primaryColor, 0.6);
    g.strokeEllipse(cx, cy, w - 14, h - 14);
    g.strokeEllipse(cx, cy, (w - 14) * 0.6, (h - 14) * 0.6);

    g.generateTexture(key, w, h);
    g.destroy();
  }
}
