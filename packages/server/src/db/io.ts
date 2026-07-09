import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const dataDir = path.resolve(__dirname, '../../data');
export const gamesFile = path.join(dataDir, 'games.json');
export const profilesFile = path.join(dataDir, 'profiles.json');
export const usersFile = path.join(dataDir, 'users.json');

const writeQueue: Array<() => void> = [];
let writing = false;

function processQueue(): void {
  if (writing || writeQueue.length === 0) return;
  writing = true;
  const task = writeQueue.shift();
  if (task) {
    try {
      task();
    } catch (err) {
      console.error('Write queue task failed:', err);
    }
  }
  writing = false;
  processQueue();
}

export function enqueueWrite(fn: () => void): void {
  writeQueue.push(fn);
  if (!writing) processQueue();
}

export function initDatabase(): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}
