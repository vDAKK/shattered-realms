const UPGRADES = [
  {
    id: 'wide_paddle',
    name: 'Palette Étendue',
    desc: 'La palette gagne +35px de largeur',
    icon: 'upgrade_wide',
    rarity: 'common',
    color: 0x00e5ff,
    apply: (state) => { state.paddleWidth = Math.min(state.paddleWidth + 35, 240); }
  },
  {
    id: 'swift_ball',
    name: 'Noyau Rapide',
    desc: 'La balle gagne +40 de vitesse',
    icon: 'upgrade_speed',
    rarity: 'common',
    color: 0xffff00,
    apply: (state) => { state.ballSpeed += 40; }
  },
  {
    id: 'dual_ball',
    name: 'Dualité',
    desc: 'Commence chaque niveau avec 2 balles',
    icon: 'upgrade_dual',
    rarity: 'rare',
    color: 0xff88ff,
    apply: (state) => { state.startBalls = Math.min((state.startBalls || 1) + 1, 3); }
  },
  {
    id: 'laser_cannon',
    name: 'Canon Laser',
    desc: 'La palette tire des lasers (clic droit)',
    icon: 'upgrade_laser',
    rarity: 'rare',
    color: 0xff4400,
    apply: (state) => { state.hasLaser = true; }
  },
  {
    id: 'safety_net',
    name: 'Filet de Sécurité',
    desc: 'Un filet protège le bas pendant 3 rebonds',
    icon: 'upgrade_net',
    rarity: 'common',
    color: 0x44ff88,
    apply: (state) => { state.netBounces = (state.netBounces || 0) + 3; }
  },
  {
    id: 'fire_core',
    name: 'Noyau de Feu',
    desc: 'La balle brise tout en 1 coup pendant 8 sec',
    icon: 'upgrade_fire',
    rarity: 'epic',
    color: 0xff6600,
    apply: (state) => { state.fireCoreDuration = (state.fireCoreDuration || 0) + 8000; }
  },
  {
    id: 'chain_reaction',
    name: 'Réaction en Chaîne',
    desc: 'Briques détruites : 30% de chance d\'exploser voisines',
    icon: 'upgrade_chain',
    rarity: 'rare',
    color: 0xffaa00,
    apply: (state) => { state.chainChance = Math.min((state.chainChance || 0) + 0.3, 0.75); }
  },
  {
    id: 'void_shield',
    name: 'Bouclier du Vide',
    desc: 'Absorbe un projectile ennemi',
    icon: 'upgrade_shield',
    rarity: 'common',
    color: 0x8888ff,
    apply: (state) => { state.voidShieldCharges = (state.voidShieldCharges || 0) + 2; }
  },
  {
    id: 'healing_light',
    name: 'Lumière Soignante',
    desc: '+1 HP (max 6)',
    icon: 'upgrade_heal',
    rarity: 'epic',
    color: 0xff3388,
    apply: (state) => { state.hp = Math.min(state.hp + 1, state.maxHp + 1); state.maxHp = Math.min(state.maxHp + 1, 6); }
  },
  {
    id: 'time_dilation',
    name: 'Dilatation Temporelle',
    desc: 'Ralentit le temps 1x par niveau pendant 4 sec',
    icon: 'upgrade_time',
    rarity: 'epic',
    color: 0x00ffff,
    apply: (state) => { state.timeDilationCharges = (state.timeDilationCharges || 0) + 1; }
  },
  {
    id: 'magnet_pull',
    name: 'Attraction Magnétique',
    desc: 'La balle suit légèrement la souris en vol',
    icon: 'upgrade_magnet',
    rarity: 'rare',
    color: 0xffcc00,
    apply: (state) => { state.hasMagnet = true; }
  },
  {
    id: 'crystal_armor',
    name: 'Armure de Cristal',
    desc: '+1 HP max et +1 HP maintenant',
    icon: 'upgrade_armor',
    rarity: 'epic',
    color: 0x88ccff,
    apply: (state) => { state.maxHp = Math.min(state.maxHp + 1, 6); state.hp = Math.min(state.hp + 1, state.maxHp); }
  },
  {
    id: 'ghost_ball',
    name: 'Balle Fantôme',
    desc: 'La balle traverse les briques pendant 6 sec',
    icon: 'upgrade_ghost',
    rarity: 'rare',
    color: 0xaaaaff,
    apply: (state) => { state.ghostDuration = (state.ghostDuration || 0) + 6000; }
  },
  {
    id: 'explosive_impact',
    name: 'Impact Explosif',
    desc: 'Chaque 5ème brique explose en AOE',
    icon: 'upgrade_explode',
    rarity: 'rare',
    color: 0xff8800,
    apply: (state) => { state.explosiveEvery = 5; }
  },
  {
    id: 'overclock',
    name: 'Surchauffe',
    desc: 'Vitesse balle x1.5, mais +25% de risque',
    icon: 'upgrade_over',
    rarity: 'epic',
    color: 0xff0066,
    apply: (state) => { state.ballSpeed = Math.round(state.ballSpeed * 1.5); }
  }
];

// Temporary power-ups that drop from bricks
const POWERUPS = [
  { id: 'pu_multi',   label: 'MULTI',   color: 0xff88ff, textColor: '#ff88ff', desc: '+1 balle' },
  { id: 'pu_expand',  label: 'EXPAND',  color: 0x00e5ff, textColor: '#00e5ff', desc: 'Palette +40px (15s)' },
  { id: 'pu_slow',    label: 'SLOW',    color: 0x8888ff, textColor: '#8888ff', desc: 'Balle ralentie (10s)' },
  { id: 'pu_laser',   label: 'LASER',   color: 0xff4400, textColor: '#ff4400', desc: 'Laser actif (12s)' },
  { id: 'pu_shield',  label: 'SHIELD',  color: 0x44ff88, textColor: '#44ff88', desc: 'Filet (20s)' },
  { id: 'pu_fire',    label: 'FIRE',    color: 0xff8800, textColor: '#ff8800', desc: '1-shot briques (8s)' },
  { id: 'pu_hp',      label: '+HP',     color: 0xff3388, textColor: '#ff3388', desc: '+1 vie' },
  { id: 'pu_bomb',    label: 'BOMB',    color: 0xffcc00, textColor: '#ffcc00', desc: 'Explosion AOE (8s)' },
];
