// Boons: the choice between waves. Three are offered, one is taken, and each
// one changes how the rest of the run plays. No boon is a pure number on a
// screen nobody reads: the card says exactly what changes.
import { BOON_POOL } from './config.js';

export function rollBoons(rng, count = 3) {
  const pool = [...BOON_POOL];
  const rolled = [];
  while (rolled.length < count && pool.length > 0) {
    const index = Math.floor(rng.next() * pool.length);
    rolled.push(pool.splice(index, 1)[0]);
  }
  return rolled;
}

export function applyBoon(game, boon) {
  const player = game.player;
  const m = player.multipliers;
  switch (boon.id) {
    case 'damage':
      m.damage *= 1.35;
      break;
    case 'firerate':
      m.fireRate *= 1.25;
      break;
    case 'multishot':
      m.bolts = Math.min(4, m.bolts + 1);
      break;
    case 'pierce':
      m.pierce += 1;
      break;
    case 'speed':
      m.speed *= 1.18;
      break;
    case 'health':
      player.maxHp += 30;
      player.heal(30);
      break;
    case 'dash':
      m.dashCooldown *= 0.65;
      break;
    case 'nova':
      player.novaCharges = Math.min(4, player.novaCharges + 1);
      m.novaCooldown *= 0.8;
      break;
    case 'ember':
      game.ember.heal(120);
      break;
    case 'magnet':
      m.pickupRadius *= 1.9;
      m.score *= 1.25;
      break;
    case 'leech':
      m.leech += 2;
      break;
    case 'bulletspeed':
      m.boltSpeed *= 1.3;
      m.damage *= 1.12;
      break;
    default:
      break;
  }
  game.boonsTaken.push(boon);
  game.audio.boon();
  game.particles.floatText(player.x, player.y - 34, boon.name.toUpperCase(), '#ffd76e', 20);
}
