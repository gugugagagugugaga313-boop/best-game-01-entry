// Pickups: what the night drops when it dies, and what each one does when the
// keeper walks over it. Drops are the run's small mercies; the magnet boon
// pulls them in from further away.
import { PICKUP_KINDS } from './config.js';
import { distance } from './rng.js';

export function rollDrop(rng, x, y) {
  const roll = rng.next();
  if (roll > 0.2) return null;
  let kind = 'star';
  if (roll < 0.06) kind = 'heart';
  else if (roll < 0.11) kind = 'shard';
  else if (roll < 0.16) kind = 'nova';
  return { kind, x, y, radius: PICKUP_KINDS[kind].radius, life: 9, bob: rng.float(0, Math.PI * 2) };
}

export function updatePickups(dt, game) {
  const player = game.player;
  const magnetRadius = 46 * player.multipliers.pickupRadius;
  for (let i = game.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = game.pickups[i];
    pickup.life -= dt;
    pickup.bob += dt * 3;
    const dist = distance(pickup.x, pickup.y, player.x, player.y);
    if (dist <= magnetRadius + pickup.radius) {
      const pull = 340 * dt;
      const dx = (player.x - pickup.x) / (dist || 1);
      const dy = (player.y - pickup.y) / (dist || 1);
      pickup.x += dx * pull;
      pickup.y += dy * pull;
    }
    if (dist <= player.radius + pickup.radius + 4) {
      collectPickup(pickup, game);
      game.pickups.splice(i, 1);
      continue;
    }
    if (pickup.life <= 0) game.pickups.splice(i, 1);
  }
}

export function collectPickup(pickup, game) {
  const player = game.player;
  const def = PICKUP_KINDS[pickup.kind];
  game.particles.burst(pickup.x, pickup.y, { count: 12, color: def.color, speed: 150, life: 0.45, size: 3 });
  game.audio.pickup();
  if (pickup.kind === 'heart') {
    const healed = player.heal(20);
    game.particles.floatText(pickup.x, pickup.y - 18, healed > 0 ? '+20 HP' : 'FULL HP', '#ff8fa3', 16);
  } else if (pickup.kind === 'shard') {
    const healed = game.ember.heal(25);
    game.particles.floatText(pickup.x, pickup.y - 18, healed > 0 ? '+25 EMBER' : 'EMBER FULL', '#ffb347', 16);
  } else if (pickup.kind === 'star') {
    game.addScore(250, pickup.x, pickup.y);
  } else if (pickup.kind === 'nova') {
    player.novaCharges = Math.min(4, player.novaCharges + 1);
    game.particles.floatText(pickup.x, pickup.y - 18, '+NOVA CHARGE', '#7fd4ff', 16);
  }
}
