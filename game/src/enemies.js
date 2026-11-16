// Enemies: five creature kinds with distinct movement and targeting, plus the
// two bosses with phased attacks. Every kind telegraphs before it hurts.
import { BOSS_KINDS, ENEMY_KINDS, VIEW_H, VIEW_W, WALL } from './config.js';
import { clamp, distance } from './rng.js';

let nextId = 1;

export function spawnEnemy(game, kind, x, y) {
  const def = ENEMY_KINDS[kind];
  const waveScale = 1 + (game.wave - 1) * 0.09;
  const enemy = {
    id: nextId,
    kind,
    name: kind,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: def.radius,
    hp: Math.round(def.hp * waveScale),
    maxHp: Math.round(def.hp * waveScale),
    speed: def.speed * (1 + (game.wave - 1) * 0.02),
    damage: def.damage,
    score: def.score,
    color: def.color,
    prefersEmber: def.prefersEmber,
    isBoss: false,
    dead: false,
    touchCooldown: 0,
    attackTimer: 1.2,
    windup: 0,
    dashTimer: 0,
    dashAngle: 0,
    phase: 0,
    spawnTimer: 0,
    wobble: game.rng.float(0, Math.PI * 2),
    flash: 0,
  };
  nextId += 1;
  game.enemies.push(enemy);
  return enemy;
}

export function spawnBoss(game, bossKind) {
  const def = BOSS_KINDS[bossKind];
  const enemy = {
    id: nextId,
    kind: bossKind,
    name: def.name,
    x: VIEW_W / 2,
    y: WALL + 90,
    vx: 0,
    vy: 0,
    radius: def.radius,
    hp: def.hp,
    maxHp: def.hp,
    speed: def.speed,
    damage: def.damage,
    score: def.score,
    color: def.color,
    prefersEmber: false,
    isBoss: true,
    dead: false,
    touchCooldown: 0,
    attackTimer: 2.2,
    windup: 0,
    dashTimer: 0,
    dashAngle: 0,
    phase: 1,
    spawnTimer: 0,
    wobble: 0,
    flash: 0,
    chargeWarn: 0,
  };
  nextId += 1;
  game.enemies.push(enemy);
  game.boss = enemy;
  game.audio.bossRoar();
  game.particles.shake(8, 0.4);
  return enemy;
}

export function spawnAtEdge(game, kind) {
  const side = game.rng.int(0, 3);
  let x;
  let y;
  if (side === 0) {
    x = game.rng.float(WALL + 20, VIEW_W - WALL - 20);
    y = WALL + 14;
  } else if (side === 1) {
    x = game.rng.float(WALL + 20, VIEW_W - WALL - 20);
    y = VIEW_H - WALL - 14;
  } else if (side === 2) {
    x = WALL + 14;
    y = game.rng.float(WALL + 20, VIEW_H - WALL - 20);
  } else {
    x = VIEW_W - WALL - 14;
    y = game.rng.float(WALL + 20, VIEW_H - WALL - 20);
  }
  return spawnEnemy(game, kind, x, y);
}

function steer(enemy, tx, ty, dt, speedScale = 1) {
  const dx = tx - enemy.x;
  const dy = ty - enemy.y;
  const len = Math.hypot(dx, dy) || 1;
  enemy.vx = (dx / len) * enemy.speed * speedScale;
  enemy.vy = (dy / len) * enemy.speed * speedScale;
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
}

function keepInside(enemy) {
  enemy.x = clamp(enemy.x, WALL + enemy.radius, VIEW_W - WALL - enemy.radius);
  enemy.y = clamp(enemy.y, WALL + enemy.radius, VIEW_H - WALL - enemy.radius);
}

function fireGlob(game, enemy, tx, ty, speed = 235, damage = 10) {
  const angle = Math.atan2(ty - enemy.y, tx - enemy.x);
  game.enemyShots.push({
    x: enemy.x + Math.cos(angle) * (enemy.radius + 6),
    y: enemy.y + Math.sin(angle) * (enemy.radius + 6),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    damage,
    radius: 7,
    life: 3.2,
  });
}

export function updateEnemy(dt, game, enemy) {
  if (enemy.flash > 0) enemy.flash -= dt;
  enemy.wobble += dt * 3;
  const player = game.player;
  const ember = game.ember;
  const target = enemy.prefersEmber && ember.alive ? ember : player;
  if (enemy.isBoss) {
    updateBoss(dt, game, enemy);
    keepInside(enemy);
    return;
  }

  if (enemy.kind === 'mothling') {
    const wobble = Math.sin(enemy.wobble * 2.2) * 0.55;
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x) + wobble * 0.4;
    enemy.x += Math.cos(angle) * enemy.speed * dt;
    enemy.y += Math.sin(angle) * enemy.speed * dt;
  } else if (enemy.kind === 'shade' || enemy.kind === 'brute') {
    steer(enemy, target.x, target.y, dt);
  } else if (enemy.kind === 'spitter') {
    const dist = distance(enemy.x, enemy.y, target.x, target.y);
    if (enemy.windup > 0) {
      enemy.windup -= dt;
      if (enemy.windup <= 0) {
        fireGlob(game, enemy, target.x, target.y);
        game.particles.burst(enemy.x, enemy.y, { count: 6, color: '#9be15d', speed: 90, life: 0.3, size: 3 });
      }
    } else if (dist > 300) {
      steer(enemy, target.x, target.y, dt);
    } else if (dist < 210) {
      steer(enemy, enemy.x + (enemy.x - target.x), enemy.y + (enemy.y - target.y), dt, 0.8);
    } else {
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        enemy.windup = 0.55;
        enemy.attackTimer = 2.4;
      }
    }
  } else if (enemy.kind === 'wisp') {
    if (enemy.dashTimer > 0) {
      enemy.dashTimer -= dt;
      enemy.x += Math.cos(enemy.dashAngle) * enemy.speed * 2.4 * dt;
      enemy.y += Math.sin(enemy.dashAngle) * enemy.speed * 2.4 * dt;
      game.particles.trail(enemy.x, enemy.y, '#5df2d6', 2);
    } else {
      steer(enemy, target.x, target.y, dt, 0.7);
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0 && distance(enemy.x, enemy.y, target.x, target.y) < 260) {
        enemy.dashAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        enemy.dashTimer = 0.32;
        enemy.attackTimer = game.rng.float(1.4, 2.2);
      }
    }
  }
  keepInside(enemy);
}

function updateBoss(dt, game, boss) {
  const player = game.player;
  const fraction = boss.hp / boss.maxHp;
  if (boss.kind === 'matron') {
    updateMatron(dt, game, boss, fraction, player);
  } else {
    updateSovereign(dt, game, boss, fraction, player);
  }
}

function updateMatron(dt, game, boss, fraction, player) {
  boss.spawnTimer -= dt;
  if (boss.spawnTimer <= 0) {
    boss.spawnTimer = fraction < 0.5 ? 3.4 : 4.6;
    for (let i = 0; i < 2; i += 1) {
      const angle = game.rng.angle();
      spawnEnemy(game, 'mothling', boss.x + Math.cos(angle) * 60, boss.y + Math.sin(angle) * 60);
    }
    game.particles.burst(boss.x, boss.y, { count: 18, color: '#ff5d8f', speed: 170, life: 0.5, size: 3 });
  }
  steer(boss, player.x, player.y, dt, 0.85);
  boss.attackTimer -= dt;
  if (boss.attackTimer <= 0) {
    boss.attackTimer = fraction < 0.5 ? 2.2 : 2.9;
    const shots = fraction < 0.5 ? 12 : 8;
    const offset = game.rng.angle();
    for (let i = 0; i < shots; i += 1) {
      const angle = offset + (i / shots) * Math.PI * 2;
      game.enemyShots.push({
        x: boss.x + Math.cos(angle) * (boss.radius + 6),
        y: boss.y + Math.sin(angle) * (boss.radius + 6),
        vx: Math.cos(angle) * 190,
        vy: Math.sin(angle) * 190,
        damage: 12,
        radius: 8,
        life: 3.4,
      });
    }
    game.audio.bossRoar();
  }
}

function updateSovereign(dt, game, boss, fraction, player) {
  const nextPhase = fraction < 0.33 ? 3 : fraction < 0.66 ? 2 : 1;
  if (nextPhase !== boss.phase) {
    boss.phase = nextPhase;
    boss.attackTimer = 1.2;
    game.particles.burst(boss.x, boss.y, { count: 40, color: '#ff3d7e', speed: 320, life: 0.7, size: 4 });
    game.particles.shake(9, 0.4);
    game.particles.floatText(boss.x, boss.y - 70, boss.phase === 2 ? 'THE SOVEREIGN CRACKS' : 'THE SOVEREIGN RAGES', '#ff3d7e', 22);
  }
  if (boss.chargeWarn > 0) {
    boss.chargeWarn -= dt;
    if (boss.chargeWarn <= 0) {
      boss.dashAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.dashTimer = 0.5;
    }
    return;
  }
  if (boss.dashTimer > 0) {
    boss.dashTimer -= dt;
    boss.x += Math.cos(boss.dashAngle) * 430 * dt;
    boss.y += Math.sin(boss.dashAngle) * 430 * dt;
    game.particles.trail(boss.x, boss.y, '#ff3d7e', 4);
    return;
  }
  steer(boss, player.x, player.y, dt, boss.phase === 3 ? 1.15 : 0.9);
  boss.attackTimer -= dt;
  if (boss.attackTimer > 0) return;
  if (boss.phase === 1) {
    boss.attackTimer = 2.6;
    const shots = 10;
    const offset = game.rng.angle();
    for (let i = 0; i < shots; i += 1) {
      const angle = offset + (i / shots) * Math.PI * 2;
      game.enemyShots.push({
        x: boss.x + Math.cos(angle) * (boss.radius + 6),
        y: boss.y + Math.sin(angle) * (boss.radius + 6),
        vx: Math.cos(angle) * 205,
        vy: Math.sin(angle) * 205,
        damage: 13,
        radius: 8,
        life: 3.4,
      });
    }
  } else if (boss.phase === 2) {
    boss.attackTimer = 3.1;
    for (let i = 0; i < 3; i += 1) {
      const angle = game.rng.angle();
      spawnEnemy(game, i === 0 ? 'shade' : 'mothling', boss.x + Math.cos(angle) * 70, boss.y + Math.sin(angle) * 70);
    }
    fireGlob(game, boss, player.x, player.y, 300, 14);
    fireGlob(game, boss, player.x + 60, player.y - 40, 300, 14);
    fireGlob(game, boss, player.x - 60, player.y + 40, 300, 14);
  } else {
    boss.attackTimer = 3.4;
    boss.chargeWarn = 0.7;
    game.particles.floatText(boss.x, boss.y - 70, '!', '#ff3d7e', 34);
  }
}

export function separateEnemies(game) {
  const list = game.enemies;
  for (let i = 0; i < list.length; i += 1) {
    const a = list[i];
    if (a.dead) continue;
    for (let j = i + 1; j < list.length; j += 1) {
      const b = list[j];
      if (b.dead) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const min = a.radius + b.radius - 4;
      if (dist > 0 && dist < min) {
        const push = (min - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push * 0.5;
        a.y -= ny * push * 0.5;
        b.x += nx * push * 0.5;
        b.y += ny * push * 0.5;
      }
    }
  }
}
