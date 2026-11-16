// The HUD: health, ember, wave, score, combo, cooldowns and banners. Every
// number the player needs to judge the run sits in one glance at the top.
import { FINAL_WAVE, PALETTE, VIEW_H, VIEW_W, WALL } from './config.js';

function bar(ctx, x, y, w, h, fraction, fill, back = 'rgba(10, 8, 24, 0.72)') {
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, fraction)), h);
  ctx.strokeStyle = 'rgba(244, 239, 228, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

export function drawHUD(ctx, game) {
  const player = game.player;
  const ember = game.ember;
  ctx.textBaseline = 'alphabetic';

  // Top-left: keeper health + dash + nova.
  ctx.textAlign = 'left';
  ctx.font = '700 14px Verdana, sans-serif';
  ctx.fillStyle = PALETTE.dimText;
  ctx.fillText('KEEPER', WALL + 4, 30);
  bar(ctx, WALL + 4, 38, 220, 14, player.healthFraction, player.healthFraction > 0.3 ? '#7fe3c0' : PALETTE.danger);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 13px Verdana, sans-serif';
  ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, WALL + 232, 50);

  ctx.font = '700 12px Verdana, sans-serif';
  ctx.fillStyle = PALETTE.dimText;
  ctx.fillText('DASH [SPACE]', WALL + 4, 72);
  bar(ctx, WALL + 104, 62, 120, 10, player.dashFraction, '#7fe3c0');
  ctx.fillText(`NOVA [E] x${player.novaCharges}`, WALL + 4, 90);
  bar(ctx, WALL + 104, 80, 120, 10, player.novaFraction, '#7fd4ff');

  // Top-center: ember health + wave.
  ctx.textAlign = 'center';
  ctx.font = '700 14px Verdana, sans-serif';
  ctx.fillStyle = PALETTE.dimText;
  ctx.fillText('THE EMBER', VIEW_W / 2, 30);
  bar(ctx, VIEW_W / 2 - 130, 38, 260, 14, ember.healthFraction, ember.healthFraction > 0.35 ? PALETTE.ember : PALETTE.danger);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 13px Verdana, sans-serif';
  ctx.fillText(`${Math.ceil(ember.hp)} / ${ember.maxHp}`, VIEW_W / 2, 70);
  ctx.font = '700 20px Verdana, sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`WAVE ${Math.min(game.wave, FINAL_WAVE)} / ${FINAL_WAVE}`, VIEW_W / 2, 94);
  if (game.waveActive) {
    ctx.font = '700 13px Verdana, sans-serif';
    ctx.fillStyle = PALETTE.dimText;
    const remaining = game.enemies.length + game.director.queue.length;
    ctx.fillText(`${remaining} creatures remain`, VIEW_W / 2, 112);
  }

  // Top-right: score, combo, best.
  ctx.textAlign = 'right';
  ctx.font = '700 24px Verdana, sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`${Math.floor(game.score)}`, VIEW_W - WALL - 4, 52);
  ctx.font = '700 13px Verdana, sans-serif';
  ctx.fillStyle = PALETTE.dimText;
  ctx.fillText(`BEST ${game.bestScore}`, VIEW_W - WALL - 4, 70);
  if (game.combo > 1) {
    ctx.font = '700 20px Verdana, sans-serif';
    ctx.fillStyle = '#ffe66d';
    ctx.fillText(`COMBO x${game.comboMultiplier().toFixed(1)}`, VIEW_W - WALL - 4, 96);
    bar(ctx, VIEW_W - WALL - 124, 102, 120, 6, game.comboTimer / 3, '#ffe66d');
  }

  // Boss bar: inside the arena, above the bottom wall, clear of the
  // corner affordances and the first-wave hint (bosses arrive later).
  if (game.boss && !game.boss.dead) {
    const boss = game.boss;
    ctx.textAlign = 'center';
    ctx.font = '700 15px Verdana, sans-serif';
    ctx.fillStyle = '#ffb3c8';
    ctx.fillText(boss.name, VIEW_W / 2, VIEW_H - WALL - 34);
    bar(ctx, VIEW_W / 2 - 260, VIEW_H - WALL - 28, 520, 12, boss.hp / boss.maxHp, boss.color);
  }

  // First-wave hint bar.
  if (game.wave === 1 && game.waveActive && game.time - game.runStartTime < 14) {
    ctx.textAlign = 'center';
    ctx.font = '700 14px Verdana, sans-serif';
    ctx.fillStyle = 'rgba(244, 239, 228, 0.85)';
    ctx.fillText('WASD move  ·  Mouse aim  ·  Hold click to shoot  ·  SPACE dash  ·  E nova  ·  P pause', VIEW_W / 2, VIEW_H - WALL - 14);
  }

  // Mute + pause affordances, bottom corners.
  ctx.textAlign = 'left';
  ctx.font = '700 12px Verdana, sans-serif';
  ctx.fillStyle = PALETTE.dimText;
  ctx.fillText(game.audio.muted ? 'M: SOUND OFF' : 'M: SOUND ON', WALL + 4, VIEW_H - 14);
  ctx.textAlign = 'right';
  ctx.fillText('P: PAUSE', VIEW_W - WALL - 4, VIEW_H - 14);

  drawBanner(ctx, game);
}

export function drawBanner(ctx, game) {
  if (game.bannerTimer <= 0 || !game.banner) return;
  const alpha = Math.min(1, game.bannerTimer / 0.5, (2.2 - game.bannerTimer) / 0.3 + 1);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.textAlign = 'center';
  ctx.font = '800 54px Verdana, sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.strokeStyle = 'rgba(10, 8, 24, 0.85)';
  ctx.lineWidth = 8;
  ctx.strokeText(game.banner, VIEW_W / 2, 210);
  ctx.fillText(game.banner, VIEW_W / 2, 210);
  ctx.restore();
}

export function drawButton(ctx, rect, label, hovered, opts = {}) {
  const { fontSize = 20, fill = '#2e3a63', hoverFill = '#3d4f86', textColor = PALETTE.text } = opts;
  ctx.fillStyle = hovered ? hoverFill : fill;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = hovered ? PALETTE.ember : 'rgba(244, 239, 228, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  ctx.fillStyle = textColor;
  ctx.font = `700 ${fontSize}px Verdana, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

export function drawPanel(ctx, rect) {
  ctx.fillStyle = 'rgba(11, 16, 38, 0.88)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255, 179, 71, 0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
}
