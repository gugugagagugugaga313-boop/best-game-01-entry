// The Ember: the light at the arena's heart that the player defends. If its
// health reaches zero, the night wins, whatever the player's health is.
import { EMBER_TUNING, VIEW_H, VIEW_W } from './config.js';
import { clamp } from './rng.js';

export class EmberLight {
  constructor() {
    this.x = VIEW_W / 2;
    this.y = VIEW_H / 2;
    this.radius = EMBER_TUNING.radius;
    this.maxHp = EMBER_TUNING.maxHp;
    this.hp = this.maxHp;
    this.timeSinceDamage = 99;
    this.flicker = 0;
    this.hurtFlash = 0;
  }

  reset() {
    this.hp = this.maxHp;
    this.timeSinceDamage = 99;
    this.hurtFlash = 0;
  }

  get alive() {
    return this.hp > 0;
  }

  get healthFraction() {
    return clamp(this.hp / this.maxHp, 0, 1);
  }

  damage(amount, game) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    this.timeSinceDamage = 0;
    this.hurtFlash = 0.35;
    game.particles.burst(this.x, this.y - 10, { count: 14, color: '#ff8a5c', speed: 190, life: 0.55, size: 4 });
    game.particles.floatText(this.x, this.y - 52, `-${amount} EMBER`, '#ff9d6b', 17);
    game.audio.emberHurt();
    game.particles.shake(5, 0.2);
  }

  heal(amount) {
    const healed = Math.min(amount, this.maxHp - this.hp);
    this.hp += healed;
    return healed;
  }

  update(dt) {
    this.flicker += dt;
    this.timeSinceDamage += dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.alive && this.timeSinceDamage > EMBER_TUNING.regenDelay && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + EMBER_TUNING.regenPerSecond * dt);
    }
  }

  // How brightly the ember burns: dims as it takes damage, so its state is
  // readable from across the arena without reading a number.
  glowRadius() {
    const base = EMBER_TUNING.lightRadius * (0.55 + 0.45 * this.healthFraction);
    return base + Math.sin(this.flicker * 6.3) * 6 + Math.sin(this.flicker * 13.7) * 3;
  }
}
