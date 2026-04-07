// ═══════════════════════════════════════════════════════
//  SHATTERED REALMS — Entry Point
// ═══════════════════════════════════════════════════════

window.GameState = {
  world: 1, level: 1,
  score: 0, hp: 3, maxHp: 3,
  voidShards: 0, upgrades: [],
  ballSpeed: 390, paddleWidth: 140, startBalls: 1,
  hasLaser: false, netBounces: 0,
  voidShieldCharges: 0, timeDilationCharges: 0,
  fireCoreDuration: 0, ghostDuration: 0,
  chainChance: 0, hasMagnet: false, explosiveEvery: 0,
  bricksBroken: 0, bossesDefeated: 0,
};

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  backgroundColor: '#000005',
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
    UpgradeScene,
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
