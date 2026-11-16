// Screens: title, pause, boon choice, game over and victory. Each one draws
// itself and answers clicks and keys, returning the action the game should
// take next. The title shows the goal and the controls before a run starts;
// the end screens show the run's stats and the way back in.
import { FINAL_WAVE, PALETTE, VIEW_H, VIEW_W } from './config.js';
import { pointInRect } from './input.js';
import { drawButton, drawPanel } from './hud.js';
import { drawStar } from './render.js';

function centerRect(w, h, y) {
  return { x: VIEW_W / 2 - w / 2, y, w, h };
}

export function titleButtons() {
  return {
    start: centerRect(300, 56, 470),
    howto: centerRect(300, 48, 538),
  };
}

export function drawTitle(ctx, game, showHowTo) {
  // Dim the arena behind the title so the text owns the screen.
  ctx.fillStyle = 'rgba(8, 10, 26, 0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.ember;
  ctx.font = '800 84px Verdana, sans-serif';
  ctx.strokeStyle = 'rgba(10, 8, 24, 0.9)';
  ctx.lineWidth = 10;
  ctx.strokeText('EMBERFALL', VIEW_W / 2, 168);
  ctx.fillText('EMBERFALL', VIEW_W / 2, 168);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 24px Verdana, sans-serif';
  ctx.fillText('Keep the last light burning.', VIEW_W / 2, 208);
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '400 17px Verdana, sans-serif';
  ctx.fillText('Defend the Ember through 10 waves of night. If the Ember dies, the night wins.', VIEW_W / 2, 240);
  ctx.fillText('Survive wave 10 and defeat the Night Sovereign to win.', VIEW_W / 2, 266);

  if (showHowTo) {
    const panel = { x: VIEW_W / 2 - 330, y: 292, w: 660, h: 158 };
    drawPanel(ctx, panel);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 19px Verdana, sans-serif';
    ctx.textAlign = 'left';
    const lines = [
      'WASD / Arrows — move the Lanternkeeper',
      'Mouse — aim    ·    Hold left click — shoot ember bolts',
      'SPACE / SHIFT — dash (briefly untouchable)',
      'E / Q — nova burst: damages all nearby creatures',
      'P — pause    ·    M — sound on/off',
    ];
    lines.forEach((line, i) => ctx.fillText(line, panel.x + 26, panel.y + 34 + i * 26));
    ctx.textAlign = 'center';
  } else {
    ctx.fillStyle = PALETTE.dimText;
    ctx.font = '400 16px Verdana, sans-serif';
    ctx.fillText('WASD move  ·  Mouse aim  ·  Hold click to shoot  ·  SPACE dash  ·  E nova', VIEW_W / 2, 316);
    ctx.fillText('Between waves, choose 1 of 3 boons. Pickups heal you and the Ember.', VIEW_W / 2, 342);
  }

  if (game.bestScore > 0 || game.victories > 0) {
    ctx.fillStyle = '#ffe66d';
    ctx.font = '700 18px Verdana, sans-serif';
    ctx.fillText(`BEST SCORE ${game.bestScore}    ·    VICTORIES ${game.victories}`, VIEW_W / 2, 428);
  }

  const buttons = titleButtons();
  const hover = game.input;
  drawButton(ctx, buttons.start, '▶  START THE DEFENSE', pointInRect(hover.mouseX, hover.mouseY, buttons.start), { fontSize: 21, fill: '#7a4a12', hoverFill: '#a8651a' });
  drawButton(ctx, buttons.howto, showHowTo ? 'HIDE CONTROLS' : 'HOW TO PLAY', pointInRect(hover.mouseX, hover.mouseY, buttons.howto), { fontSize: 17 });
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '400 14px Verdana, sans-serif';
  ctx.fillText('Press ENTER to start  ·  An original game — code, art and sound made for this entry', VIEW_W / 2, 632);
}

export function handleTitleClick(game, click, showHowTo) {
  const buttons = titleButtons();
  if (pointInRect(click.x, click.y, buttons.start)) return 'start';
  if (pointInRect(click.x, click.y, buttons.howto)) return showHowTo ? 'hide-howto' : 'show-howto';
  return null;
}

export function drawPause(ctx, game) {
  ctx.fillStyle = 'rgba(8, 10, 26, 0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const panel = { x: VIEW_W / 2 - 260, y: 200, w: 520, h: 300 };
  drawPanel(ctx, panel);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 44px Verdana, sans-serif';
  ctx.fillText('PAUSED', VIEW_W / 2, 262);
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '400 16px Verdana, sans-serif';
  ctx.fillText(`Wave ${game.wave} of ${FINAL_WAVE}  ·  Score ${Math.floor(game.score)}`, VIEW_W / 2, 296);
  const buttons = pauseButtons();
  const hover = game.input;
  drawButton(ctx, buttons.resume, 'RESUME', pointInRect(hover.mouseX, hover.mouseY, buttons.resume));
  drawButton(ctx, buttons.restart, 'RESTART RUN', pointInRect(hover.mouseX, hover.mouseY, buttons.restart));
  drawButton(ctx, buttons.quit, 'QUIT TO TITLE', pointInRect(hover.mouseX, hover.mouseY, buttons.quit));
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '400 14px Verdana, sans-serif';
  ctx.fillText('P or ESC resumes  ·  M toggles sound', VIEW_W / 2, 480);
}

export function pauseButtons() {
  return {
    resume: centerRect(280, 48, 316),
    restart: centerRect(280, 48, 374),
    quit: centerRect(280, 48, 432),
  };
}

export function handlePauseClick(game, click) {
  const buttons = pauseButtons();
  if (pointInRect(click.x, click.y, buttons.resume)) return 'resume';
  if (pointInRect(click.x, click.y, buttons.restart)) return 'restart';
  if (pointInRect(click.x, click.y, buttons.quit)) return 'quit';
  return null;
}

export function drawBoonChoice(ctx, game) {
  ctx.fillStyle = 'rgba(8, 10, 26, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 40px Verdana, sans-serif';
  ctx.fillText(`WAVE ${game.wave - 1} CLEARED`, VIEW_W / 2, 150);
  ctx.fillStyle = '#ffe66d';
  ctx.font = '700 22px Verdana, sans-serif';
  ctx.fillText('Choose a boon — it lasts for the rest of the run', VIEW_W / 2, 190);
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '400 15px Verdana, sans-serif';
  ctx.fillText('The Ember recovers 45 health. Your nova gains a charge.', VIEW_W / 2, 216);
  const cards = boonCards();
  game.boonOptions.forEach((boon, i) => {
    const rect = cards[i];
    const hovered = pointInRect(game.input.mouseX, game.input.mouseY, rect);
    drawPanel(ctx, rect);
    if (hovered) {
      ctx.strokeStyle = PALETTE.ember;
      ctx.lineWidth = 3;
      ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    }
    ctx.fillStyle = PALETTE.ember;
    ctx.font = '800 30px Verdana, sans-serif';
    ctx.fillText(boon.icon, rect.x + rect.w / 2, rect.y + 62);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 20px Verdana, sans-serif';
    ctx.fillText(boon.name, rect.x + rect.w / 2, rect.y + 104);
    ctx.fillStyle = PALETTE.dimText;
    ctx.font = '400 15px Verdana, sans-serif';
    wrapText(ctx, boon.text, rect.x + rect.w / 2, rect.y + 136, rect.w - 36, 22);
    ctx.fillStyle = '#7fe3c0';
    ctx.font = '700 14px Verdana, sans-serif';
    ctx.fillText(`PRESS ${i + 1}`, rect.x + rect.w / 2, rect.y + rect.h - 18);
  });
}

export function boonCards() {
  const w = 250;
  const h = 220;
  const gap = 26;
  const total = w * 3 + gap * 2;
  const x0 = VIEW_W / 2 - total / 2;
  return [0, 1, 2].map((i) => ({ x: x0 + i * (w + gap), y: 258, w, h }));
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, lineY);
}

export function handleBoonClick(game, click) {
  const cards = boonCards();
  for (let i = 0; i < cards.length; i += 1) {
    if (pointInRect(click.x, click.y, cards[i])) return i;
  }
  return -1;
}

function statLines(game) {
  const accuracy = game.player.stats.shotsFired > 0
    ? Math.round((game.player.stats.shotsHit / Math.max(1, game.player.stats.shotsFired)) * 100)
    : 0;
  return [
    `SCORE  ${Math.floor(game.score)}`,
    `BEST  ${game.bestScore}`,
    `WAVE REACHED  ${Math.min(game.wave, FINAL_WAVE)} / ${FINAL_WAVE}`,
    `CREATURES FELLED  ${game.kills}`,
    `TIME  ${formatTime(game.runTime)}`,
    `BOLT ACCURACY  ${accuracy}%`,
    `BOONS TAKEN  ${game.boonsTaken.length}`,
  ];
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(8, 10, 26, 0.74)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.danger;
  ctx.font = '800 58px Verdana, sans-serif';
  ctx.fillText('THE LIGHT FALLS', VIEW_W / 2, 168);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 20px Verdana, sans-serif';
  ctx.fillText(game.loseReason, VIEW_W / 2, 204);
  const panel = { x: VIEW_W / 2 - 250, y: 236, w: 500, h: 210 };
  drawPanel(ctx, panel);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 17px Verdana, sans-serif';
  statLines(game).forEach((line, i) => ctx.fillText(line, VIEW_W / 2, panel.y + 36 + i * 26));
  if (game.newBest) {
    ctx.fillStyle = '#ffe66d';
    ctx.font = '800 20px Verdana, sans-serif';
    ctx.fillText('★ NEW BEST SCORE ★', VIEW_W / 2, 478);
  }
  const buttons = endButtons();
  const hover = game.input;
  drawButton(ctx, buttons.again, '↻  TRY AGAIN', pointInRect(hover.mouseX, hover.mouseY, buttons.again), { fill: '#7a4a12', hoverFill: '#a8651a' });
  drawButton(ctx, buttons.title, 'BACK TO TITLE', pointInRect(hover.mouseX, hover.mouseY, buttons.title));
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '400 14px Verdana, sans-serif';
  ctx.fillText('Press ENTER to try again', VIEW_W / 2, 664);
}

export function drawVictory(ctx, game) {
  ctx.fillStyle = 'rgba(8, 10, 26, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.ember;
  ctx.font = '800 58px Verdana, sans-serif';
  ctx.strokeStyle = 'rgba(10, 8, 24, 0.9)';
  ctx.lineWidth = 8;
  ctx.strokeText('DAWN BREAKS', VIEW_W / 2, 148);
  ctx.fillText('DAWN BREAKS', VIEW_W / 2, 148);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 20px Verdana, sans-serif';
  ctx.fillText('The Night Sovereign falls. The Ember burns on.', VIEW_W / 2, 184);
  // Stars: earned from the Ember's remaining health at the moment of victory.
  for (let i = 0; i < 3; i += 1) {
    const earned = i < game.stars;
    drawStar(ctx, VIEW_W / 2 + (i - 1) * 74, 240, 5, 30, 13, earned ? '#ffe66d' : 'rgba(244, 239, 228, 0.22)');
  }
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '400 14px Verdana, sans-serif';
  ctx.fillText(game.starText, VIEW_W / 2, 288);
  const panel = { x: VIEW_W / 2 - 250, y: 308, w: 500, h: 190 };
  drawPanel(ctx, panel);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 17px Verdana, sans-serif';
  statLines(game).forEach((line, i) => ctx.fillText(line, VIEW_W / 2, panel.y + 34 + i * 24));
  if (game.newBest) {
    ctx.fillStyle = '#ffe66d';
    ctx.font = '800 20px Verdana, sans-serif';
    ctx.fillText('★ NEW BEST SCORE ★', VIEW_W / 2, 524);
  }
  const buttons = endButtons();
  const hover = game.input;
  drawButton(ctx, buttons.again, '↻  PLAY AGAIN', pointInRect(hover.mouseX, hover.mouseY, buttons.again), { fill: '#7a4a12', hoverFill: '#a8651a' });
  drawButton(ctx, buttons.title, 'BACK TO TITLE', pointInRect(hover.mouseX, hover.mouseY, buttons.title));
  ctx.fillStyle = PALETTE.dimText;
  ctx.font = '400 14px Verdana, sans-serif';
  ctx.fillText('Press ENTER to play again', VIEW_W / 2, 664);
}

export function endButtons() {
  return {
    again: centerRect(300, 48, 540),
    title: centerRect(300, 42, 596),
  };
}

export function handleEndClick(game, click) {
  const buttons = endButtons();
  if (pointInRect(click.x, click.y, buttons.again)) return 'again';
  if (pointInRect(click.x, click.y, buttons.title)) return 'title';
  return null;
}
