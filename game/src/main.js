// Emberfall: the game object and the loop. The loop runs a fixed 60 Hz
// simulation with an accumulator, so the game plays the same on a fast
// machine and a slow one, and the screenshot scenes step the same ticks.
import { COMBO_MAX, COMBO_STEP, COMBO_WINDOW, FINAL_WAVE, PALETTE, STEP, VIEW_H, VIEW_W } from './config.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { ParticleField } from './particles.js';
import { EmberLight } from './ember.js';
import { Lanternkeeper } from './player.js';
import { WaveDirector } from './waves.js';
import { SeededRandom } from './rng.js';
import { loadBestScore, loadVictories, saveBestScore, saveVictories } from './storage.js';
import { updateBolts, updateEnemyShots, resolveContactDamage } from './projectiles.js';
import { rollDrop, updatePickups } from './pickups.js';
import { separateEnemies, updateEnemy } from './enemies.js';
import { applyBoon, rollBoons } from './boons.js';
import { drawArena, drawEmber, drawEmberGlow, drawEnemies, drawPickups, drawPlayer, drawProjectiles, drawVignette } from './render.js';
import { drawHUD } from './hud.js';
import {
  drawBoonChoice,
  drawGameOver,
  drawPause,
  drawTitle,
  drawVictory,
  handleBoonClick,
  handleEndClick,
  handlePauseClick,
  handleTitleClick,
} from './screens.js';
import { stageShot } from './shots.js';

const GAME_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyQ', 'Enter']);

export class EmberfallGame {
  constructor(canvas, statusEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.statusEl = statusEl;
    this.input = new Input(canvas);
    this.audio = new SoundBank();
    this.particles = new ParticleField();
    this.player = new Lanternkeeper();
    this.ember = new EmberLight();
    this.director = new WaveDirector();
    this.rng = new SeededRandom((Math.random() * 0xffffffff) >>> 0);
    this.screen = 'title';
    this.showHowTo = false;
    this.time = 0;
    this.bestScore = loadBestScore();
    this.victories = loadVictories();
    this.resetRunState();
  }

  resetRunState() {
    this.player.reset();
    this.ember.reset();
    this.enemies = [];
    this.bolts = [];
    this.enemyShots = [];
    this.pickups = [];
    this.particles = new ParticleField();
    this.director = new WaveDirector();
    this.wave = 1;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.kills = 0;
    this.runTime = 0;
    this.runStartTime = 0;
    this.boss = null;
    this.waveActive = false;
    this.banner = '';
    this.bannerTimer = 0;
    this.novaFlash = 0;
    this.boonsTaken = [];
    this.boonOptions = [];
    this.loseReason = '';
    this.stars = 0;
    this.starText = '';
    this.newBest = false;
  }

  comboMultiplier() {
    return Math.min(COMBO_MAX, 1 + this.combo * COMBO_STEP);
  }

  addScore(base, x, y) {
    const gained = Math.round(base * this.comboMultiplier() * this.player.multipliers.score);
    this.score += gained;
    if (x !== undefined) {
      this.particles.floatText(x, y, `+${gained}`, '#ffe66d', 16);
    }
    return gained;
  }

  damageEnemy(enemy, amount, fromX, fromY) {
    if (enemy.dead) return;
    enemy.hp -= amount;
    enemy.flash = 0.09;
    this.audio.enemyHit();
    if (enemy.hp > 0) return;
    enemy.dead = true;
    this.kills += 1;
    this.combo += 1;
    this.comboTimer = COMBO_WINDOW;
    this.addScore(enemy.score, enemy.x, enemy.y - 16);
    this.particles.burst(enemy.x, enemy.y, { count: enemy.isBoss ? 46 : 14, color: enemy.color, speed: enemy.isBoss ? 320 : 200, life: 0.55, size: 4 });
    this.audio.enemyDown();
    if (this.player.multipliers.leech > 0) {
      this.player.heal(this.player.multipliers.leech);
    }
    const drop = rollDrop(this.rng, enemy.x, enemy.y);
    if (drop) this.pickups.push(drop);
    if (enemy.isBoss) {
      this.particles.freeze(0.14);
      this.particles.shake(12, 0.5);
      this.boss = null;
      this.pickups.push({ kind: 'heart', x: enemy.x - 24, y: enemy.y, radius: 13, life: 12, bob: 0 });
      this.pickups.push({ kind: 'shard', x: enemy.x + 24, y: enemy.y, radius: 13, life: 12, bob: 1 });
    }
  }

  startRun() {
    this.resetRunState();
    this.screen = 'playing';
    this.runStartTime = this.time;
    this.director.startWave(this, 1);
    this.announce('Wave 1. Defend the Ember.');
  }

  openBoonChoice() {
    this.boonOptions = rollBoons(this.rng, 3);
    this.screen = 'boon';
    this.announce(`Wave ${this.wave - 1} cleared. Choose a boon.`);
  }

  chooseBoon(index) {
    const boon = this.boonOptions[index];
    if (!boon) return;
    applyBoon(this, boon);
    this.screen = 'playing';
    this.director.startWave(this, this.wave);
    this.announce(`Wave ${this.wave}. Boon chosen: ${boon.name}.`);
  }

  winRun() {
    const fraction = this.ember.healthFraction;
    this.stars = fraction >= 0.66 ? 3 : fraction >= 0.33 ? 2 : 1;
    this.starText = this.stars === 3
      ? 'Three stars: the Ember kept more than two thirds of its light.'
      : this.stars === 2
        ? 'Two stars: keep the Ember above two thirds for three stars.'
        : 'One star: finish with the Ember healthier to earn more.';
    this.finishRun(true);
    this.screen = 'victory';
    this.audio.victory();
    this.announce(`Victory. Score ${Math.floor(this.score)}. ${this.stars} stars.`);
  }

  loseRun(reason) {
    this.loseReason = reason;
    this.finishRun(false);
    this.screen = 'gameover';
    this.audio.gameOver();
    this.announce(`Defeat. ${reason} Score ${Math.floor(this.score)}.`);
  }

  finishRun(won) {
    const finalScore = Math.floor(this.score);
    if (finalScore > this.bestScore) {
      this.bestScore = finalScore;
      this.newBest = true;
      saveBestScore(finalScore);
    }
    if (won) {
      this.victories += 1;
      saveVictories(this.victories);
    }
  }

  quitToTitle() {
    this.resetRunState();
    this.screen = 'title';
    this.announce('Emberfall. Title screen.');
  }

  announce(message) {
    if (this.statusEl) this.statusEl.textContent = message;
  }

  // One fixed simulation step. Screens other than 'playing' advance only
  // ambient animation; the world itself freezes on pause and menus.
  fixedStep(dt) {
    this.time += dt;
    if (this.particles.hitStop > 0) {
      this.particles.hitStop -= dt;
      return;
    }
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    if (this.novaFlash > 0) this.novaFlash -= dt;
    this.particles.emberDrift(this.ember.x, this.ember.y);
    this.particles.update(dt);

    if (this.screen === 'title') {
      for (const enemy of this.enemies) updateEnemy(dt, this, enemy);
      this.ember.update(dt);
      return;
    }
    if (this.screen !== 'playing') return;

    this.runTime += dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    this.player.update(dt, this);
    this.ember.update(dt);
    this.director.update(dt, this);
    for (const enemy of this.enemies) updateEnemy(dt, this, enemy);
    separateEnemies(this);
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    updateBolts(dt, this);
    updateEnemyShots(dt, this);
    resolveContactDamage(dt, this);
    updatePickups(dt, this);
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);

    if (!this.player.alive) {
      this.loseRun('The Lanternkeeper has fallen.');
    } else if (!this.ember.alive) {
      this.loseRun('The Ember has gone out.');
    }
  }

  handleScreenInput() {
    const input = this.input;
    if (input.wasPressed('KeyM')) {
      this.audio.toggleMute();
    }
    if (this.screen === 'title') {
      if (input.wasPressed('Enter')) {
        this.audio.ensure();
        this.audio.click();
        this.startRun();
        return;
      }
      const click = input.consumeClick();
      if (click) {
        const action = handleTitleClick(this, click, this.showHowTo);
        if (action === 'start') {
          this.audio.ensure();
          this.audio.click();
          this.startRun();
        } else if (action === 'show-howto') {
          this.showHowTo = true;
          this.audio.click();
        } else if (action === 'hide-howto') {
          this.showHowTo = false;
          this.audio.click();
        }
      }
      return;
    }
    if (this.screen === 'playing') {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
        this.screen = 'paused';
        this.audio.click();
        this.announce('Paused.');
      }
      return;
    }
    if (this.screen === 'paused') {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape') || input.wasPressed('Enter')) {
        this.screen = 'playing';
        this.audio.click();
        return;
      }
      const click = input.consumeClick();
      if (click) {
        const action = handlePauseClick(this, click);
        if (action === 'resume') {
          this.screen = 'playing';
          this.audio.click();
        } else if (action === 'restart') {
          this.audio.click();
          this.startRun();
        } else if (action === 'quit') {
          this.audio.click();
          this.quitToTitle();
        }
      }
      return;
    }
    if (this.screen === 'boon') {
      if (input.wasPressed('Digit1')) this.chooseBoon(0);
      else if (input.wasPressed('Digit2')) this.chooseBoon(1);
      else if (input.wasPressed('Digit3')) this.chooseBoon(2);
      const click = input.consumeClick();
      if (click) {
        const index = handleBoonClick(this, click);
        if (index >= 0) this.chooseBoon(index);
      }
      return;
    }
    if (this.screen === 'gameover' || this.screen === 'victory') {
      if (input.wasPressed('Enter')) {
        this.audio.click();
        this.startRun();
        return;
      }
      const click = input.consumeClick();
      if (click) {
        const action = handleEndClick(this, click);
        if (action === 'again') {
          this.audio.click();
          this.startRun();
        } else if (action === 'title') {
          this.audio.click();
          this.quitToTitle();
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    const offset = this.particles.shakeOffset();
    ctx.translate(offset.x, offset.y);
    drawArena(ctx, this);
    drawEmberGlow(ctx, this);
    drawPickups(ctx, this);
    drawEmber(ctx, this);
    drawEnemies(ctx, this);
    drawPlayer(ctx, this);
    drawProjectiles(ctx, this);
    this.particles.draw(ctx);
    this.particles.drawTexts(ctx);
    drawVignette(ctx, this);
    ctx.restore();

    if (this.screen === 'playing' || this.screen === 'boon' || this.screen === 'paused') {
      drawHUD(ctx, this);
    }
    if (this.screen === 'title') {
      drawTitle(ctx, this, this.showHowTo);
    } else if (this.screen === 'paused') {
      drawPause(ctx, this);
    } else if (this.screen === 'boon') {
      drawBoonChoice(ctx, this);
    } else if (this.screen === 'gameover') {
      drawGameOver(ctx, this);
    } else if (this.screen === 'victory') {
      drawVictory(ctx, this);
    }
  }
}

function fitCanvas(canvas) {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H, 1);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}

export function boot() {
  const canvas = document.getElementById('game');
  const statusEl = document.getElementById('status');
  const game = new EmberfallGame(canvas, statusEl);
  window.__game = game;

  window.addEventListener('keydown', (event) => {
    if (GAME_KEYS.has(event.code)) event.preventDefault();
    if (event.code === 'KeyM') game.audio.ensure();
  });
  window.addEventListener('pointerdown', () => game.audio.ensure(), { once: false });
  window.addEventListener('resize', () => fitCanvas(canvas));
  fitCanvas(canvas);

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    const seed = Number.parseInt(params.get('seed') || '1', 10) || 1;
    stageShot(game, shot, seed);
    return game;
  }

  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      game.handleScreenInput();
      game.fixedStep(STEP);
      game.input.endFrame();
      accumulator -= STEP;
    }
    const intense = Boolean(game.boss) || game.wave >= 8;
    game.audio.tick(elapsed);
    game.audio.updateMusic(elapsed, intense);
    game.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return game;
}

boot();
