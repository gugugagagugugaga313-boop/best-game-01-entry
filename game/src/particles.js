// Particles, floating text and screen shake: the feedback layer. Every hit,
// death, pickup and dash leaves something visible behind.
import { SeededRandom } from './rng.js';

export class ParticleField {
  constructor() {
    this.items = [];
    this.texts = [];
    this.rng = new SeededRandom(1);
    this.shakeTime = 0;
    this.shakeStrength = 0;
    this.hitStop = 0;
  }

  seed(seed) {
    this.rng = new SeededRandom(seed);
    this.items.length = 0;
    this.texts.length = 0;
    this.shakeTime = 0;
    this.hitStop = 0;
  }

  burst(x, y, { count = 10, color = '#ffd76e', speed = 160, life = 0.5, size = 3, gravity = 0 }) {
    for (let i = 0; i < count; i += 1) {
      const angle = this.rng.angle();
      const velocity = this.rng.float(speed * 0.3, speed);
      this.items.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: this.rng.float(life * 0.5, life),
        maxLife: life,
        size: this.rng.float(size * 0.5, size * 1.4),
        color,
        gravity,
      });
    }
    if (this.items.length > 420) this.items.splice(0, this.items.length - 420);
  }

  trail(x, y, color, size = 3) {
    this.items.push({
      x: x + this.rng.float(-3, 3),
      y: y + this.rng.float(-3, 3),
      vx: this.rng.float(-14, 14),
      vy: this.rng.float(-26, -6),
      life: this.rng.float(0.2, 0.4),
      maxLife: 0.4,
      size,
      color,
      gravity: 0,
    });
  }

  emberDrift(x, y) {
    if (this.items.length > 300) return;
    this.items.push({
      x: x + this.rng.float(-70, 70),
      y: y + this.rng.float(-20, 30),
      vx: this.rng.float(-8, 8),
      vy: this.rng.float(-34, -14),
      life: this.rng.float(0.8, 1.6),
      maxLife: 1.6,
      size: this.rng.float(1.5, 3),
      color: this.rng.chance(0.5) ? '#ffb347' : '#ffe9a3',
      gravity: -8,
    });
  }

  floatText(x, y, text, color = '#f4efe4', size = 17) {
    this.texts.push({ x, y, text, color, size, life: 0.9, maxLife: 0.9 });
    if (this.texts.length > 24) this.texts.shift();
  }

  shake(strength, time = 0.25) {
    this.shakeStrength = Math.max(this.shakeStrength, strength);
    this.shakeTime = Math.max(this.shakeTime, time);
  }

  freeze(time) {
    this.hitStop = Math.max(this.hitStop, time);
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.items.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i -= 1) {
      const t = this.texts[i];
      t.life -= dt;
      t.y -= 42 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) this.shakeStrength = 0;
    }
    if (this.hitStop > 0) this.hitStop -= dt;
  }

  shakeOffset() {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    const strength = this.shakeStrength * Math.min(1, this.shakeTime / 0.25);
    return {
      x: this.rng.float(-strength, strength),
      y: this.rng.float(-strength, strength),
    };
  }

  draw(ctx) {
    for (const p of this.items) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawTexts(ctx) {
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${t.size}px Verdana, sans-serif`;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = 'rgba(10, 8, 24, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
