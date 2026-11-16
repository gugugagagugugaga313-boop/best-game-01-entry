// Projectiles both ways: the keeper's ember bolts and the creatures' globs,
// plus the collision pass that resolves them against enemies, the ember and
// the player. One pass, no per-frame allocation beyond the arrays' own churn.
import { WALL, VIEW_H, VIEW_W } from './config.js';
import { distance } from './rng.js';

export function updateBolts(dt, game) {
  const bolts = game.bolts;
  for (let i = bolts.length - 1; i >= 0; i -= 1) {
    const bolt = bolts[i];
    bolt.life -= dt;
    bolt.x += bolt.vx * dt;
    bolt.y += bolt.vy * dt;
    let dead = bolt.life <= 0 || bolt.x < WALL || bolt.x > VIEW_W - WALL || bolt.y < WALL || bolt.y > VIEW_H - WALL;
    if (!dead) {
      for (const enemy of game.enemies) {
        if (enemy.dead || bolt.hitIds.has(enemy.id)) continue;
        if (distance(bolt.x, bolt.y, enemy.x, enemy.y) <= bolt.radius + enemy.radius) {
          bolt.hitIds.add(enemy.id);
          game.player.stats.shotsHit += 1;
          game.damageEnemy(enemy, bolt.damage, bolt.x, bolt.y);
          game.particles.burst(bolt.x, bolt.y, { count: 5, color: '#ffe9a3', speed: 130, life: 0.3, size: 2.5 });
          if (bolt.pierceLeft > 0) {
            bolt.pierceLeft -= 1;
          } else {
            dead = true;
          }
          break;
        }
      }
    }
    if (dead) bolts.splice(i, 1);
  }
}

export function updateEnemyShots(dt, game) {
  const shots = game.enemyShots;
  const player = game.player;
  const ember = game.ember;
  for (let i = shots.length - 1; i >= 0; i -= 1) {
    const shot = shots[i];
    shot.life -= dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    let dead = shot.life <= 0 || shot.x < WALL - 10 || shot.x > VIEW_W - WALL + 10 || shot.y < WALL - 10 || shot.y > VIEW_H - WALL + 10;
    if (!dead && player.alive && distance(shot.x, shot.y, player.x, player.y) <= shot.radius + player.radius) {
      player.damage(shot.damage, game);
      dead = true;
    }
    if (!dead && ember.alive && distance(shot.x, shot.y, ember.x, ember.y) <= shot.radius + ember.radius) {
      ember.damage(shot.damage, game);
      dead = true;
    }
    if (dead) {
      game.particles.burst(shot.x, shot.y, { count: 6, color: '#9be15d', speed: 110, life: 0.35, size: 3 });
      shots.splice(i, 1);
    }
  }
}

export function resolveContactDamage(dt, game) {
  const player = game.player;
  const ember = game.ember;
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    if (enemy.touchCooldown > 0) enemy.touchCooldown -= dt;
    if (enemy.touchCooldown > 0) continue;
    if (player.alive && distance(enemy.x, enemy.y, player.x, player.y) <= enemy.radius + player.radius + 2) {
      if (player.damage(enemy.damage, game)) {
        enemy.touchCooldown = 0.8;
        pushApart(enemy, player);
      }
    } else if (ember.alive && distance(enemy.x, enemy.y, ember.x, ember.y) <= enemy.radius + ember.radius + 2) {
      ember.damage(enemy.damage, game);
      enemy.touchCooldown = 0.9;
      pushApart(enemy, ember);
    }
  }
}

function pushApart(enemy, target) {
  const dx = enemy.x - target.x;
  const dy = enemy.y - target.y;
  const len = Math.hypot(dx, dy) || 1;
  enemy.x = target.x + (dx / len) * (enemy.radius + target.radius + 4);
  enemy.y = target.y + (dy / len) * (enemy.radius + target.radius + 4);
}
