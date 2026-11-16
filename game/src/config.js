// Emberfall tuning: every number that shapes how the game feels lives here,
// so balancing never means hunting through the simulation code.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const WALL = 46;
export const STEP = 1 / 60;

export const PALETTE = {
  skyTop: '#0b1026',
  skyBottom: '#1a1033',
  floor: '#141a33',
  floorLine: '#232a4d',
  wall: '#2e3a63',
  ember: '#ffb347',
  emberCore: '#fff3c4',
  emberGlow: 'rgba(255, 179, 71, 0.35)',
  player: '#ffd76e',
  playerTrim: '#7fe3c0',
  bolt: '#ffe9a3',
  shade: '#8b7ff0',
  moth: '#c9b8ff',
  spitter: '#7fd4ff',
  wisp: '#5df2d6',
  brute: '#ff7d6b',
  boss: '#ff5d8f',
  glob: '#9be15d',
  pickup: '#8affc1',
  text: '#f4efe4',
  dimText: '#aab0c8',
  danger: '#ff6b6b',
};

export const PLAYER_TUNING = {
  radius: 14,
  speed: 268,
  maxHp: 100,
  fireInterval: 0.2,
  boltSpeed: 660,
  boltDamage: 12,
  boltRadius: 5,
  dashDistance: 210,
  dashTime: 0.16,
  dashCooldown: 2.1,
  novaRadius: 230,
  novaDamage: 55,
  novaCooldown: 7,
  novaCharges: 2,
  contactGrace: 0.55,
};

export const EMBER_TUNING = {
  radius: 26,
  maxHp: 320,
  regenPerSecond: 5,
  regenDelay: 5,
  waveHeal: 45,
  lightRadius: 210,
};

export const ENEMY_KINDS = {
  mothling: { hp: 18, speed: 152, radius: 12, damage: 8, score: 50, color: PALETTE.moth, prefersEmber: false },
  shade: { hp: 72, speed: 68, radius: 17, damage: 18, score: 90, color: PALETTE.shade, prefersEmber: true },
  spitter: { hp: 30, speed: 92, radius: 14, damage: 10, score: 110, color: PALETTE.spitter, prefersEmber: false },
  wisp: { hp: 24, speed: 196, radius: 11, damage: 10, score: 120, color: PALETTE.wisp, prefersEmber: false },
  brute: { hp: 165, speed: 54, radius: 24, damage: 26, score: 220, color: PALETTE.brute, prefersEmber: true },
};

export const BOSS_KINDS = {
  matron: { hp: 950, speed: 52, radius: 40, damage: 22, score: 1500, color: PALETTE.boss, name: 'GLOOM MATRON' },
  sovereign: { hp: 1750, speed: 62, radius: 48, damage: 28, score: 4000, color: '#ff3d7e', name: 'NIGHT SOVEREIGN' },
};

// Wave composition: [mothling, shade, spitter, wisp, brute]. Boss waves add a boss.
export const WAVE_TABLE = [
  null,
  [6, 0, 0, 0, 0],
  [8, 2, 0, 0, 0],
  [9, 3, 3, 0, 0],
  [10, 4, 3, 3, 1],
  [8, 4, 4, 3, 1],
  [12, 5, 4, 4, 2],
  [13, 6, 5, 5, 2],
  [14, 6, 6, 6, 3],
  [15, 8, 6, 7, 3],
  [10, 5, 5, 5, 2],
];
export const BOSS_WAVE = { 5: 'matron', 10: 'sovereign' };
export const FINAL_WAVE = 10;

export const BOON_POOL = [
  { id: 'damage', name: 'Ember Rounds', text: '+35% bolt damage', icon: 'DMG' },
  { id: 'firerate', name: 'Rapid Lantern', text: '+25% fire rate', icon: 'SPD' },
  { id: 'multishot', name: 'Twin Flames', text: '+1 bolt per shot', icon: 'x2' },
  { id: 'pierce', name: 'Piercing Light', text: 'Bolts pierce +1 enemy', icon: 'PIR' },
  { id: 'speed', name: 'Swift Steps', text: '+18% move speed', icon: 'RUN' },
  { id: 'health', name: 'Sturdy Wick', text: '+30 max health, heal 30', icon: 'HP' },
  { id: 'dash', name: 'Flicker Dash', text: '-35% dash cooldown', icon: 'DSH' },
  { id: 'nova', name: 'Nova Cache', text: '+1 nova charge, -20% nova cooldown', icon: 'NOVA' },
  { id: 'ember', name: 'Kindled Hearth', text: 'Restore 120 ember health', icon: 'EMB' },
  { id: 'magnet', name: 'Lodestar', text: '+90% pickup radius, +25% score', icon: 'MAG' },
  { id: 'leech', name: 'Warmth Siphon', text: 'Kills heal 2 health', icon: 'LEE' },
  { id: 'bulletspeed', name: 'Sunlance', text: '+30% bolt speed and +10 damage', icon: 'LNC' },
];

export const PICKUP_KINDS = {
  heart: { color: '#ff8fa3', label: '+20 HP', radius: 11 },
  shard: { color: PALETTE.ember, label: '+25 EMBER', radius: 11 },
  star: { color: '#ffe66d', label: '+250', radius: 11 },
  nova: { color: '#7fd4ff', label: '+NOVA', radius: 11 },
};

export const COMBO_WINDOW = 3;
export const COMBO_STEP = 0.12;
export const COMBO_MAX = 3;
