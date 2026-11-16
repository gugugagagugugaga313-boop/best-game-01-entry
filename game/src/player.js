// The Lanternkeeper: movement, aiming, shooting, dashing and the nova burst.
// Boons mutate the multipliers object; the base numbers stay in config.
import { PLAYER_TUNING, VIEW_H, VIEW_W, WALL } from './config.js';
import { clamp, distance } from './rng.js';

export class Lanternkeeper {
  constructor() {
    this.x = VIEW_W / 2;
    this.y = VIEW_H / 2 + 170;
    this.vx = 0;
    this.vy = 0;
    this.radius = PLAYER_TUNING.radius;
    this.maxHp = PLAYER_TUNING.maxHp;
    this.hp = this.maxHp;
    this.aimAngle = -Math.PI / 2;
    this.fireTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashAngle = 0;
    this.invulnerable = 0;
    this.contactTimer = 0;
    this.novaCooldown = 0;
    this.novaCharges = PLAYER_TUNING.novaCharges;
    this.walkTime = 0;
    this.hurtFlash = 0;
    this.multipliers = {
      damage: 1,
      fireRate: 1,
      speed: 1,
      bolts: 1,
      pierce: 0,
      boltSpeed: 1,
      score: 1,
      pickupRadius: 1,
      leech: 0,
      dashCooldown: 1,
      novaCooldown: 1,
    };
    this.stats = { shotsFired: 0, shotsHit: 0, dashes: 0, novas: 0 };
  }

  reset() {
    const fresh = new Lanternkeeper();
    Object.assign(this, fresh);
  }

  get alive() {
    return this.hp > 0;
  }

  get healthFraction() {
    return clamp(this.hp / this.maxHp, 0, 1);
  }

  get dashing() {
    return this.dashTimer > 0;
  }

  get dashFraction() {
    if (this.dashCooldown <= 0) return 1;
    return clamp(1 - this.dashCooldown / (PLAYER_TUNING.dashCooldown * this.multipliers.dashCooldown), 0, 1);
  }

  get novaFraction() {
    if (this.novaCooldown <= 0) return 1;
    return clamp(1 - this.novaCooldown / (PLAYER_TUNING.novaCooldown * this.multipliers.novaCooldown), 0, 1);
  }

  fireInterval() {
    return PLAYER_TUNING.fireInterval / this.multipliers.fireRate;
  }

  damage(amount, game) {
    if (!this.alive || this.invulnerable > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerable = PLAYER_TUNING.contactGrace;
    this.hurtFlash = 0.3;
    game.combo = 0;
    game.particles.burst(this.x, this.y, { count: 16, color: '#ff6b6b', speed: 220, life: 0.5, size: 4 });
    game.particles.shake(7, 0.28);
    game.audio.playerHurt();
    return true;
  }

  heal(amount) {
    const healed = Math.min(amount, this.maxHp - this.hp);
    this.hp += healed;
    return healed;
  }

  tryDash(game) {
    if (this.dashCooldown > 0 || this.dashing) return false;
    const axis = game.input.moveAxis();
    this.dashAngle = axis.x !== 0 || axis.y !== 0 ? Math.atan2(axis.y, axis.x) : this.aimAngle;
    this.dashTimer = PLAYER_TUNING.dashTime;
    this.dashCooldown = PLAYER_TUNING.dashCooldown * this.multipliers.dashCooldown;
    this.invulnerable = Math.max(this.invulnerable, PLAYER_TUNING.dashTime + 0.1);
    this.stats.dashes += 1;
    game.audio.dash();
    game.particles.burst(this.x, this.y, { count: 10, color: '#7fe3c0', speed: 120, life: 0.35, size: 3 });
    return true;
  }

  tryNova(game) {
    if (this.novaCooldown > 0 || this.novaCharges <= 0) return false;
    this.novaCharges -= 1;
    this.novaCooldown = PLAYER_TUNING.novaCooldown * this.multipliers.novaCooldown;
    this.stats.novas += 1;
    const radius = PLAYER_TUNING.novaRadius;
    game.audio.nova();
    game.particles.shake(10, 0.35);
    game.particles.freeze(0.06);
    game.particles.burst(this.x, this.y, { count: 46, color: '#ffe9a3', speed: 420, life: 0.6, size: 4 });
    game.novaFlash = 0.35;
    for (const enemy of game.enemies) {
      if (distance(this.x, this.y, enemy.x, enemy.y) <= radius + enemy.radius) {
        game.damageEnemy(enemy, PLAYER_TUNING.novaDamage * this.multipliers.damage, this.x, this.y);
      }
    }
    game.enemyShots.length = 0;
    return true;
  }

  fireBolts(game) {
    const count = this.multipliers.bolts;
    const spread = 0.09;
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * spread;
      const angle = this.aimAngle + offset;
      game.bolts.push({
        x: this.x + Math.cos(angle) * (this.radius + 6),
        y: this.y + Math.sin(angle) * (this.radius + 6),
        vx: Math.cos(angle) * PLAYER_TUNING.boltSpeed * this.multipliers.boltSpeed,
        vy: Math.sin(angle) * PLAYER_TUNING.boltSpeed * this.multipliers.boltSpeed,
        damage: PLAYER_TUNING.boltDamage * this.multipliers.damage,
        radius: PLAYER_TUNING.boltRadius,
        pierceLeft: this.multipliers.pierce,
        hitIds: new Set(),
        life: 1.4,
      });
    }
    this.stats.shotsFired += 1;
    game.audio.shoot();
    game.particles.trail(this.x + Math.cos(this.aimAngle) * 20, this.y + Math.sin(this.aimAngle) * 20, '#ffe9a3', 2);
  }

  update(dt, game) {
    const input = game.input;
    this.aimAngle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.novaCooldown > 0) this.novaCooldown -= dt;
    if (this.invulnerable > 0) this.invulnerable -= dt;
    if (this.contactTimer > 0) this.contactTimer -= dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;

    if (input.wasPressed('Space') || input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight')) {
      this.tryDash(game);
    }
    if (input.wasPressed('KeyE') || input.wasPressed('KeyQ')) {
      this.tryNova(game);
    }

    if (this.dashing) {
      this.dashTimer -= dt;
      const speed = PLAYER_TUNING.dashDistance / PLAYER_TUNING.dashTime;
      this.vx = Math.cos(this.dashAngle) * speed;
      this.vy = Math.sin(this.dashAngle) * speed;
      game.particles.trail(this.x, this.y, '#7fe3c0', 3);
    } else {
      const axis = input.moveAxis();
      const speed = PLAYER_TUNING.speed * this.multipliers.speed;
      this.vx = axis.x * speed;
      this.vy = axis.y * speed;
      if (axis.x !== 0 || axis.y !== 0) this.walkTime += dt;
    }

    this.x = clamp(this.x + this.vx * dt, WALL + this.radius, VIEW_W - WALL - this.radius);
    this.y = clamp(this.y + this.vy * dt, WALL + this.radius, VIEW_H - WALL - this.radius);

    if (input.mouseDown && this.fireTimer <= 0) {
      this.fireBolts(game);
      this.fireTimer = this.fireInterval();
    }
  }
}
