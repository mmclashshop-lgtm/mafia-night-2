import fs from 'fs';
import { gamesFile, enqueueWrite } from './io';
import type { StoredGame } from './types';

function readGames(): StoredGame[] {
  try {
    if (fs.existsSync(gamesFile)) {
      const data = fs.readFileSync(gamesFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // File might be corrupted
  }
  return [];
}

function writeGames(games: StoredGame[]): void {
  enqueueWrite(() => {
    const tmp = gamesFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(games, null, 2));
    fs.renameSync(tmp, gamesFile);
  });
}

export function saveGame(gameData: StoredGame): void {
  const games = readGames();
  games.push(gameData);
  writeGames(games);
}

export function getTotalGames(): number {
  return readGames().length;
}

export function getRecentGames(limit = 10): StoredGame[] {
  return readGames()
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, limit);
}
