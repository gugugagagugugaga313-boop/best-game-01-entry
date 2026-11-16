// The wave director: builds each wave's roster from the table, trickles the
// creatures in from the edges, calls the bosses, and hands the run to the
// boon choice between waves.
import { BOSS_WAVE, FINAL_WAVE, WAVE_TABLE } from './config.js';
import { spawnAtEdge, spawnBoss } from './enemies.js';

const KIND_ORDER = ['mothling', 'shade', 'spitter', 'wisp', 'brute'];

export class WaveDirector {
  constructor() {
    this.queue = [];
    this.spawnTimer = 0;
    this.betweenTimer = 0;
    this.bossSpawned = false;
  }

  startWave(game, wave) {
    this.queue = [];
    const row = WAVE_TABLE[wave] || WAVE_TABLE[WAVE_TABLE.length - 1];
    KIND_ORDER.forEach((kind, i) => {
      for (let n = 0; n < row[i]; n += 1) this.queue.push(kind);
    });
    // Shuffle the queue so the wave arrives as a mix, not kind by kind.
    for (let i = this.queue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(game.rng.next() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    this.spawnTimer = 0.4;
    this.bossSpawned = false;
    game.waveActive = true;
    game.banner = wave === FINAL_WAVE ? 'FINAL WAVE' : `WAVE ${wave}`;
    game.bannerTimer = 2.2;
    game.audio.waveStart();
  }

  update(dt, game) {
    if (!game.waveActive) return;
    if (this.queue.length > 0) {
      this.spawnTimer -= dt;
      const interval = Math.max(0.22, 0.62 - game.wave * 0.04);
      if (this.spawnTimer <= 0) {
        this.spawnTimer = interval;
        const kind = this.queue.shift();
        spawnAtEdge(game, kind);
        if (game.wave >= 6 && this.queue.length > 0 && game.rng.chance(0.3)) {
          spawnAtEdge(game, this.queue.shift());
        }
      }
    } else if (BOSS_WAVE[game.wave] && !this.bossSpawned) {
      this.bossSpawned = true;
      spawnBoss(game, BOSS_WAVE[game.wave]);
      game.banner = game.boss.name;
      game.bannerTimer = 2.4;
    } else if (game.enemies.length === 0) {
      this.finishWave(game);
    }
  }

  finishWave(game) {
    game.waveActive = false;
    game.ember.heal(45);
    game.player.novaCharges = Math.min(4, game.player.novaCharges + 1);
    if (game.wave >= FINAL_WAVE) {
      game.winRun();
      return;
    }
    game.wave += 1;
    game.openBoonChoice();
  }
}
