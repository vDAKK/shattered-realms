// ═══════════════════════════════════════════════════════
//  SHATTERED REALMS : Entry Point (Portrait Mode)
// ═══════════════════════════════════════════════════════

window.GameState = {
  world: 1, level: 1,
  score: 0, hp: 3, maxHp: 3,
  voidShards: 0, upgrades: [],
  ballSpeed: 520, paddleWidth: 45, startBalls: 1,
  hasLaser: false, netBounces: 0,
  voidShieldCharges: 0, timeDilationCharges: 0,
  fireCoreDuration: 0, ghostDuration: 0,
  chainChance: 0, hasMagnet: false, explosiveEvery: 0,
  bricksBroken: 0, bossesDefeated: 0,
  // XP / Roguelite
  xp: 0, xpLevel: 0, enemiesKilled: 0,
  piercingCount: 0, scoreMult: 1, puDurationMult: 1, dropLuckMult: 1,
};

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 854,
  backgroundColor: '#0a1020',
  parent: 'game-container',

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    }
  },

  scene: [
    BootScene,
    MenuScene,
    NarrativeScene,
    GameScene,
    GameOverScene,
    VictoryScene,
  ],

  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
};

const game = new Phaser.Game(config);

// Prevent context menu on right-click (for laser fire)
document.addEventListener('contextmenu', (e) => e.preventDefault());
