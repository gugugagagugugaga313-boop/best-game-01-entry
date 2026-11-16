// Screenshot staging: deterministic scenes for the four dossier shots. A
// ?shot=<scene>&seed=<n> URL starts a scripted run, steps the simulation a
// fixed number of ticks with scripted input, and sets window.__shotReady
// when the frame is ready to capture. No randomness leaks in: the seed
// fixes every spawn, roll and particle.
import { FINAL_WAVE } from './config.js';
import { spawnBoss, spawnEnemy } from './enemies.js';
import { rollBoons } from './boons.js';
import { SeededRandom } from './rng.js';

function aimAt(game, x, y) {
  game.input.drive({
    mouse: { x, y, down: true },
    keys: new Set(),
  });
}

function nearestEnemy(game) {
  let best = null;
  let bestDist = Infinity;
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    const dist = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = enemy;
    }
  }
  return best;
}

function stepFrames(game, count, drive) {
  for (let i = 0; i < count; i += 1) {
    if (drive) drive(i);
    game.fixedStep(1 / 60);
    game.input.endFrame();
  }
}

export function stageShot(game, scene, seed) {
  game.rng = new SeededRandom(seed);
  game.startRun();
  if (scene === 'title') {
    game.screen = 'title';
    game.showHowTo = false;
    // A quiet arena behind the title: a few creatures drift at the edges.
    game.enemies = [];
    spawnEnemy(game, 'mothling', 300, 200);
    spawnEnemy(game, 'shade', 980, 520);
    spawnEnemy(game, 'wisp', 1050, 220);
    stepFrames(game, 30, () => aimAt(game, 640, 360));
    game.screen = 'title';
  } else if (scene === 'play') {
    game.director.startWave(game, 1);
    spawnEnemy(game, 'mothling', 480, 260);
    spawnEnemy(game, 'shade', 820, 300);
    spawnEnemy(game, 'mothling', 900, 480);
    spawnEnemy(game, 'wisp', 380, 460);
    stepFrames(game, 240, () => {
      const target = nearestEnemy(game);
      if (target) aimAt(game, target.x, target.y);
      else aimAt(game, 640, 300);
    });
    game.bannerTimer = 0;
  } else if (scene === 'boss') {
    game.wave = 5;
    game.score = 2450;
    game.director.startWave(game, 5);
    game.director.queue = [];
    spawnBoss(game, 'matron');
    game.director.bossSpawned = true;
    spawnEnemy(game, 'mothling', 420, 240);
    spawnEnemy(game, 'shade', 880, 480);
    spawnEnemy(game, 'spitter', 950, 240);
    stepFrames(game, 110, (i) => {
      const boss = game.boss;
      const keys = new Set();
      if (i < 45) keys.add('KeyA');
      else if (i < 70) keys.add('KeyS');
      game.input.drive({
        mouse: { x: boss ? boss.x : 640, y: boss ? boss.y : 360, down: true },
        keys,
      });
    });
    game.bannerTimer = 0;
  } else if (scene === 'victory') {
    game.wave = FINAL_WAVE;
    game.score = 12840;
    game.kills = 96;
    game.runTime = 612;
    game.player.stats.shotsFired = 480;
    game.player.stats.shotsHit = 366;
    game.boonsTaken = rollBoons(game.rng, 3);
    game.ember.hp = 240;
    game.winRun();
    game.newBest = true;
    stepFrames(game, 20, () => aimAt(game, 640, 560));
  }
  game.render();
  window.__shotReady = true;
}
