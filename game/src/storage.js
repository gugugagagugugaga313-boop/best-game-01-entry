// Best-score persistence: guarded so the game still runs where storage is
// unavailable (private windows, sandboxed iframes, file URLs).
const BEST_KEY = 'emberfall.bestScore';
const WINS_KEY = 'emberfall.victories';

export function loadBestScore() {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    const value = raw === null ? 0 : parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(Math.floor(score)));
  } catch {
    // Storage unavailable: the score simply does not persist.
  }
}

export function loadVictories() {
  try {
    const raw = window.localStorage.getItem(WINS_KEY);
    const value = raw === null ? 0 : parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function saveVictories(count) {
  try {
    window.localStorage.setItem(WINS_KEY, String(count));
  } catch {
    // Storage unavailable: the count simply does not persist.
  }
}
