// Rendering: everything the player sees of the arena, drawn in layers from
// the floor up. The palette stays in config; this file only decides shapes.
import { PALETTE, VIEW_H, VIEW_W, WALL } from './config.js';

export function drawArena(ctx, game) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gradient.addColorStop(0, PALETTE.skyTop);
  gradient.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(WALL, WALL, VIEW_W - WALL * 2, VIEW_H - WALL * 2);

  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = WALL; x <= VIEW_W - WALL; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, WALL);
    ctx.lineTo(x, VIEW_H - WALL);
    ctx.stroke();
  }
  for (let y = WALL; y <= VIEW_H - WALL; y += 64) {
    ctx.beginPath();
    ctx.moveTo(WALL, y);
    ctx.lineTo(VIEW_W - WALL, y);
    ctx.stroke();
  }

  // Worn stone ring around the ember's hearth.
  ctx.strokeStyle = 'rgba(255, 179, 71, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(game.ember.x, game.ember.y, 74, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 179, 71, 0.12)';
  ctx.beginPath();
  ctx.arc(game.ember.x, game.ember.y, 120, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = PALETTE.wall;
  ctx.lineWidth = 6;
  ctx.strokeRect(WALL - 3, WALL - 3, VIEW_W - WALL * 2 + 6, VIEW_H - WALL * 2 + 6);

  // Corner braziers: small fixed flames so the arena reads as a place. The
  // top pair sits below the HUD so no flame hides behind a label.
  drawBrazier(ctx, WALL + 26, WALL + 104, game.time);
  drawBrazier(ctx, VIEW_W - WALL - 26, WALL + 104, game.time + 1.3);
  drawBrazier(ctx, WALL + 26, VIEW_H - WALL - 26, game.time + 2.1);
  drawBrazier(ctx, VIEW_W - WALL - 26, VIEW_H - WALL - 26, game.time + 0.7);
}

function drawBrazier(ctx, x, y, time) {
  ctx.fillStyle = '#3a2f56';
  ctx.beginPath();
  ctx.arc(x, y + 8, 10, 0, Math.PI * 2);
  ctx.fill();
  const flicker = 1 + Math.sin(time * 7 + x) * 0.15;
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 5 * flicker, 9 * flicker, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.ellipse(x, y, 2.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawEmberGlow(ctx, game) {
  const ember = game.ember;
  const radius = ember.glowRadius();
  const glow = ctx.createRadialGradient(ember.x, ember.y, 10, ember.x, ember.y, radius);
  glow.addColorStop(0, 'rgba(255, 211, 120, 0.30)');
  glow.addColorStop(0.55, 'rgba(255, 179, 71, 0.13)');
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(ember.x, ember.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawEmber(ctx, game) {
  const ember = game.ember;
  const flicker = 1 + Math.sin(ember.flicker * 6.3) * 0.08;
  ctx.save();
  if (ember.hurtFlash > 0) {
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 24;
  }
  // Hearth stone.
  ctx.fillStyle = '#4a3f66';
  ctx.beginPath();
  ctx.arc(ember.x, ember.y + 14, ember.radius + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d4f80';
  ctx.beginPath();
  ctx.arc(ember.x, ember.y + 12, ember.radius, 0, Math.PI * 2);
  ctx.fill();
  // Flame.
  ctx.fillStyle = PALETTE.ember;
  ctx.beginPath();
  ctx.ellipse(ember.x, ember.y - 6, 16 * flicker, 26 * flicker, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.emberCore;
  ctx.beginPath();
  ctx.ellipse(ember.x, ember.y - 2, 8 * flicker, 14 * flicker, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Health ring.
  ctx.strokeStyle = 'rgba(244, 239, 228, 0.25)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(ember.x, ember.y + 4, ember.radius + 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = ember.healthFraction > 0.35 ? PALETTE.ember : PALETTE.danger;
  ctx.beginPath();
  ctx.arc(ember.x, ember.y + 4, ember.radius + 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ember.healthFraction);
  ctx.stroke();
}

export function drawPlayer(ctx, game) {
  const player = game.player;
  if (!player.alive) return;
  const blink = player.invulnerable > 0 && Math.floor(game.time * 18) % 2 === 0;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.45;
  ctx.translate(player.x, player.y);
  // Dash trail ghost.
  if (player.dashing) {
    ctx.globalAlpha *= 0.6;
  }
  // Cloak.
  ctx.fillStyle = '#3d6b5e';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.quadraticCurveTo(15, -4, 13, 14);
  ctx.quadraticCurveTo(0, 19, -13, 14);
  ctx.quadraticCurveTo(-15, -4, 0, -16);
  ctx.fill();
  // Hood and face.
  ctx.fillStyle = '#2c4f45';
  ctx.beginPath();
  ctx.arc(0, -6, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd76e';
  ctx.beginPath();
  ctx.arc(2, -6, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Lantern arm: points where the player aims.
  ctx.rotate(player.aimAngle);
  ctx.strokeStyle = '#7fe3c0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(4, 2);
  ctx.lineTo(20, 0);
  ctx.stroke();
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.arc(24, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(24, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.hurtFlash > 0) {
    ctx.strokeStyle = `rgba(255, 107, 107, ${Math.min(1, player.hurtFlash * 3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawEnemies(ctx, game) {
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    if (enemy.flash > 0) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 18;
    }
    drawCreatureBody(ctx, enemy, game.time);
    ctx.restore();
    drawEnemyHealth(ctx, enemy);
  }
}

function drawCreatureBody(ctx, enemy, time) {
  const wobble = Math.sin(enemy.wobble) * 0.12;
  const r = enemy.radius;
  ctx.fillStyle = enemy.color;
  if (enemy.kind === 'mothling') {
    const flap = Math.sin(time * 14 + enemy.wobble) * 0.5;
    ctx.save();
    ctx.rotate(flap * 0.3);
    ctx.beginPath();
    ctx.ellipse(-r * 0.8, 0, r * 0.75, r * 0.45, -0.5, 0, Math.PI * 2);
    ctx.ellipse(r * 0.8, 0, r * 0.75, r * 0.45, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#6b5a9e';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.45, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === 'shade') {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r, -r * 0.4, r * 0.8, r * 0.7);
    ctx.quadraticCurveTo(r * 0.4, r * 0.35, 0, r * 0.85);
    ctx.quadraticCurveTo(-r * 0.4, r * 0.35, -r * 0.8, r * 0.7);
    ctx.quadraticCurveTo(-r, -r * 0.4, 0, -r);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(-r * 0.32, -r * 0.25, 3, 0, Math.PI * 2);
    ctx.arc(r * 0.32, -r * 0.25, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === 'spitter') {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d3a52';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    if (enemy.windup > 0) {
      ctx.fillStyle = '#9be15d';
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.55 + 0.3 * (1 - enemy.windup / 0.55)), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#9be15d';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (enemy.kind === 'wisp') {
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, -r - 4);
    ctx.quadraticCurveTo(r, -2, r * 0.5, r);
    ctx.quadraticCurveTo(0, r * 0.5, -r * 0.5, r);
    ctx.quadraticCurveTo(-r, -2, 0, -r - 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === 'brute') {
    ctx.save();
    ctx.rotate(wobble);
    ctx.fillRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
    ctx.fillStyle = '#5a2e28';
    ctx.fillRect(-r * 0.5, -r * 0.5, r, r);
    ctx.restore();
    ctx.fillStyle = '#ffe9a3';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.2, 3, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.isBoss) {
    drawBossBody(ctx, enemy, time);
  }
}

function drawBossBody(ctx, boss, time) {
  const r = boss.radius;
  const pulse = 1 + Math.sin(time * 3) * 0.04;
  ctx.scale(pulse, pulse);
  // Crown of thorns.
  ctx.fillStyle = boss.color;
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 + time * 0.4;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -r - 14);
    ctx.lineTo(7, -r + 4);
    ctx.lineTo(-7, -r + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b1030';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  // Eyes.
  ctx.fillStyle = '#fff3c4';
  const eyeY = -r * 0.15;
  ctx.beginPath();
  ctx.arc(-r * 0.28, eyeY, 6, 0, Math.PI * 2);
  ctx.arc(r * 0.28, eyeY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff3d7e';
  ctx.beginPath();
  ctx.arc(-r * 0.28, eyeY, 3, 0, Math.PI * 2);
  ctx.arc(r * 0.28, eyeY, 3, 0, Math.PI * 2);
  ctx.fill();
  if (boss.chargeWarn > 0) {
    ctx.strokeStyle = 'rgba(255, 61, 126, 0.9)';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, r + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawEnemyHealth(ctx, enemy) {
  if (enemy.isBoss || enemy.hp >= enemy.maxHp) return;
  const w = enemy.radius * 2;
  const y = enemy.y - enemy.radius - 10;
  ctx.fillStyle = 'rgba(10, 8, 24, 0.7)';
  ctx.fillRect(enemy.x - w / 2, y, w, 4);
  ctx.fillStyle = enemy.color;
  ctx.fillRect(enemy.x - w / 2, y, w * Math.max(0, enemy.hp / enemy.maxHp), 4);
}

export function drawProjectiles(ctx, game) {
  for (const bolt of game.bolts) {
    ctx.save();
    ctx.shadowColor = '#ffe9a3';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffe9a3';
    ctx.beginPath();
    ctx.arc(bolt.x, bolt.y, bolt.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bolt.x, bolt.y, bolt.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const shot of game.enemyShots) {
    ctx.save();
    ctx.shadowColor = '#9be15d';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#9be15d';
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eaffd0';
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawPickups(ctx, game) {
  for (const pickup of game.pickups) {
    const bobY = Math.sin(pickup.bob) * 3;
    const blink = pickup.life < 2 && Math.floor(game.time * 6) % 2 === 0;
    if (blink) continue;
    ctx.save();
    ctx.translate(pickup.x, pickup.y + bobY);
    ctx.shadowColor = pickup.kind === 'heart' ? '#ff8fa3' : pickup.kind === 'shard' ? '#ffb347' : pickup.kind === 'star' ? '#ffe66d' : '#7fd4ff';
    ctx.shadowBlur = 12;
    if (pickup.kind === 'star') {
      drawStar(ctx, 0, 0, 5, 12, 5.5, '#ffe66d');
    } else {
      ctx.fillStyle = ctx.shadowColor;
      ctx.beginPath();
      ctx.arc(0, 0, pickup.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '700 11px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pickup.kind === 'heart' ? '+' : pickup.kind === 'shard' ? 'E' : 'N', 0, 1);
    }
    ctx.restore();
  }
}

export function drawStar(ctx, x, y, points, outer, inner, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawVignette(ctx, game) {
  if (game.player.healthFraction < 0.3 && game.player.alive) {
    const pulse = 0.25 + Math.sin(game.time * 5) * 0.1;
    const gradient = ctx.createRadialGradient(640, 360, 260, 640, 360, 640);
    gradient.addColorStop(0, 'rgba(255, 40, 40, 0)');
    gradient.addColorStop(1, `rgba(255, 40, 40, ${pulse})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (game.novaFlash > 0) {
    ctx.fillStyle = `rgba(255, 233, 163, ${Math.min(0.35, game.novaFlash)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
