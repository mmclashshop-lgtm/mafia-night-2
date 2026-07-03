import { GameState, Player, PlayerId, RoleId, getAlivePlayers, checkWinCondition } from '@mafia/shared';

type Difficulty = 'easy' | 'medium' | 'hard';

const BOT_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry',
  'Ivy', 'Jack', 'Kara', 'Leo', 'Mona', 'Nick', 'Olive', 'Paul',
  'Quinn', 'Rosa', 'Sam', 'Tina', 'Uma', 'Vince', 'Wendy', 'Xander',
];

const MAFIA_NAMES = ['Tony', 'Vito', 'Luca', 'Sophia', 'Marco', 'Rosa'];

interface BotMemory {
  playerId: PlayerId;
  investigationResults: Map<PlayerId, string>;
  votedForMe: PlayerId[];
  ITrust: Set<PlayerId>;
  IBypass: Set<PlayerId>;
}

const botMemory = new Map<string, BotMemory>();

function getMemory(playerId: PlayerId): BotMemory {
  if (!botMemory.has(playerId)) {
    botMemory.set(playerId, {
      playerId,
      investigationResults: new Map(),
      votedForMe: [],
      ITrust: new Set(),
      IBypass: new Set(),
    });
  }
  return botMemory.get(playerId)!;
}

function getAliveOtherPlayers(state: GameState, playerId: PlayerId): Player[] {
  return getAlivePlayers(state).filter(p => p.id !== playerId);
}

function randomPick<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Night Action Decisions ---

function decideMafiaNightAction(state: GameState, playerId: PlayerId, difficulty: Difficulty): PlayerId | null {
  const aliveOthers = getAliveOtherPlayers(state, playerId);
  const targets = aliveOthers.filter(p => p.team !== 'mafia');
  if (targets.length === 0) return null;

  if (difficulty === 'easy') {
    return randomPick(targets)?.id ?? null;
  }

  if (difficulty === 'medium') {
    const powerRoles = targets.filter(p =>
      p.role && ['cop', 'detective', 'doctor', 'medic', 'vigilante'].includes(p.role.id)
    );
    if (powerRoles.length > 0 && Math.random() < 0.6) {
      return randomPick(powerRoles)?.id ?? null;
    }
    return randomPick(targets)?.id ?? null;
  }

  // Hard: target confirmed town power roles, avoid suspicious patterns
  const memory = getMemory(playerId);
  const confirmedTown = targets.filter(p => memory.IBypass.has(p.id));
  const powerRoles = targets.filter(p =>
    p.role && ['cop', 'detective', 'doctor', 'vigilante', 'mayor'].includes(p.role.id)
  );

  if (powerRoles.length > 0 && Math.random() < 0.8) {
    const nightTargets = state.history.filter(h => h.type === 'kill' || h.type === 'heal');
    const recentlyTargeted = new Set(nightTargets.map(h => (h.data as { targetId?: string }).targetId));
    const fresh = powerRoles.filter(p => !recentlyTargeted.has(p.id));
    return randomPick(fresh.length > 0 ? fresh : powerRoles)?.id ?? randomPick(targets)?.id ?? null;
  }

  return randomPick(targets)?.id ?? null;
}

function decideDoctorNightAction(state: GameState, playerId: PlayerId, difficulty: Difficulty): PlayerId | null {
  const aliveOthers = getAliveOtherPlayers(state, playerId);
  if (difficulty === 'easy') {
    return randomPick(aliveOthers)?.id ?? null;
  }
  if (difficulty === 'medium') {
    const targets = aliveOthers.filter(p => p.team === 'town');
    return randomPick(targets.length > 0 ? targets : aliveOthers)?.id ?? null;
  }
  // Hard: heal most likely to be targeted (active players, power roles)
  const priority = aliveOthers.filter(p =>
    p.role && ['cop', 'detective', 'doctor'].includes(p.role.id)
  );
  return randomPick(priority.length > 0 ? priority : aliveOthers)?.id ?? null;
}

function decideCopNightAction(state: GameState, playerId: PlayerId, difficulty: Difficulty): PlayerId | null {
  const aliveOthers = getAliveOtherPlayers(state, playerId);
  if (difficulty === 'easy') {
    return randomPick(aliveOthers)?.id ?? null;
  }
  if (difficulty === 'medium') {
    // Investigate quiet/suspicious players
    const votedCount = new Map<string, number>();
    for (const vote of state.votes) {
      votedCount.set(vote.to, (votedCount.get(vote.to) ?? 0) + 1);
    }
    const suspicious = aliveOthers.filter(p => (votedCount.get(p.id) ?? 0) > 1);
    return randomPick(suspicious.length > 0 ? suspicious : aliveOthers)?.id ?? null;
  }
  // Hard: investigate those acting suspiciously
  const votedAgainstTown = aliveOthers.filter(p => {
    const memory = getMemory(p.id);
    return memory.investigationResults.size > 0;
  });
  const memory = getMemory(playerId);
  const uninspected = aliveOthers.filter(p => !memory.investigationResults.has(p.id));
  return randomPick(uninspected.length > 0 ? uninspected : aliveOthers)?.id ?? null;
}

function decideSerialKillerNightAction(state: GameState, playerId: PlayerId, difficulty: Difficulty): PlayerId | null {
  const aliveOthers = getAliveOtherPlayers(state, playerId);
  if (difficulty === 'easy') return randomPick(aliveOthers)?.id ?? null;
  if (difficulty === 'medium') {
    const memory = getMemory(playerId);
    const votedForMe = aliveOthers.filter(p => memory.votedForMe.includes(p.id));
    return randomPick(votedForMe.length > 0 ? votedForMe : aliveOthers)?.id ?? null;
  }
  const targets = aliveOthers.filter(p => p.team !== 'neutral');
  return randomPick(targets.length > 0 ? targets : aliveOthers)?.id ?? null;
}

function decideWitchNightAction(state: GameState, playerId: PlayerId, difficulty: Difficulty): { action: 'witch_save' | 'witch_kill' | null; targetId: PlayerId | null } {
  if (difficulty !== 'hard') {
    // Easy/Medium witch doesn't use potions effectively
    if (Math.random() < 0.3 && !state.witchState?.savePotionUsed) {
      const target = randomPick(getAliveOtherPlayers(state, playerId));
      return target ? { action: 'witch_save', targetId: target.id } : { action: null, targetId: null };
    }
    return { action: null, targetId: null };
  }
  // Hard witch: saves if someone is likely targeted, kills dangerous roles
  if (!state.witchState?.savePotionUsed && state.day > 1 && Math.random() < 0.5) {
    const healedBefore = state.history.filter(h => h.type === 'heal').map(h => (h.data as { targetId?: string }).targetId);
    const priority = getAliveOtherPlayers(state, playerId).filter(p =>
      !healedBefore.includes(p.id) && p.team === 'town' && p.role &&
      ['cop', 'detective', 'doctor'].includes(p.role.id)
    );
    if (priority.length > 0) {
      return { action: 'witch_save', targetId: priority[0]!.id };
    }
  }
  if (!state.witchState?.killPotionUsed && state.day > 2 && Math.random() < 0.4) {
    const mafiaSuspects = getAliveOtherPlayers(state, playerId).filter(p => {
      const memory = getMemory(p.id);
      return memory.IBypass.size > 2;
    });
    if (mafiaSuspects.length > 0) {
      return { action: 'witch_kill', targetId: randomPick(mafiaSuspects)!.id };
    }
  }
  return { action: null, targetId: null };
}

// --- Voting Decisions ---

function decideVote(state: GameState, playerId: PlayerId, difficulty: Difficulty): PlayerId | null {
  const aliveOthers = getAliveOtherPlayers(state, playerId);
  if (aliveOthers.length === 0) return null;

  if (difficulty === 'easy') {
    return randomPick(aliveOthers)?.id ?? null;
  }

  const memory = getMemory(playerId);

  if (difficulty === 'medium') {
    // Vote for those who voted for me or random
    const votedForMe = aliveOthers.filter(p => memory.votedForMe.includes(p.id));
    if (votedForMe.length > 0 && Math.random() < 0.5) {
      return randomPick(votedForMe)?.id ?? null;
    }
    // Trust investigation results
    for (const [targetId, result] of memory.investigationResults) {
      if (result === 'mafia' && aliveOthers.some(p => p.id === targetId)) {
        return targetId as PlayerId;
      }
    }
    return randomPick(aliveOthers)?.id ?? null;
  }

  // Hard: strategic voting
  // First, trust investigation results
  for (const [targetId, result] of memory.investigationResults) {
    if (result === 'mafia' && aliveOthers.some(p => p.id === targetId)) {
      return targetId as PlayerId;
    }
  }

  // Vote with the majority (bandwagon)
  const voteCounts = new Map<string, number>();
  for (const vote of state.votes) {
    if (vote.from !== playerId) {
      voteCounts.set(vote.to, (voteCounts.get(vote.to) ?? 0) + 1);
    }
  }

  let maxVotes = 0;
  let maxVoted: PlayerId | null = null;
  for (const [targetId, count] of voteCounts) {
    if (count > maxVotes) {
      maxVotes = count;
      maxVoted = targetId as PlayerId;
    }
  }

  if (maxVoted && maxVotes >= 2) {
    return maxVoted;
  }

  // Vote against those I don't trust
  const enemies = aliveOthers.filter(p => memory.IBypass.has(p.id));
  if (enemies.length > 0) {
    return randomPick(enemies)?.id ?? null;
  }

  return randomPick(aliveOthers)?.id ?? null;
}

// --- Main Bot API ---

export function getBotNames(count: number): string[] {
  const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  const names = shuffled.slice(0, count);
  // Occasionally use mafia-themed names
  if (Math.random() < 0.3 && names.length > 0) {
    names[Math.floor(Math.random() * names.length)] = randomPick(MAFIA_NAMES)!;
  }
  return names;
}

export function getBotDifficulty(): Difficulty {
  const r = Math.random();
  if (r < 0.33) return 'easy';
  if (r < 0.66) return 'medium';
  return 'hard';
}

export function botDecideNightAction(
  state: GameState,
  playerId: PlayerId,
  difficulty: Difficulty
): { action: string; targetId: PlayerId } | null {
  const player = state.players.find(p => p.id === playerId);
  if (!player?.alive || !player.role) return null;

  const roleId = player.role.id;

  switch (roleId) {
    case 'mafia':
    case 'godfather': {
      const targetId = decideMafiaNightAction(state, playerId, difficulty);
      return targetId ? { action: roleId, targetId } : null;
    }
    case 'serial_killer': {
      const targetId = decideSerialKillerNightAction(state, playerId, difficulty);
      return targetId ? { action: roleId, targetId } : null;
    }
    case 'vigilante':
    case 'sniper': {
      const targetId = decideMafiaNightAction(state, playerId, difficulty);
      return targetId ? { action: roleId, targetId } : null;
    }
    case 'doctor':
    case 'medic': {
      const targetId = decideDoctorNightAction(state, playerId, difficulty);
      return targetId ? { action: roleId, targetId } : null;
    }
    case 'cop':
    case 'detective':
    case 'spy': {
      const targetId = decideCopNightAction(state, playerId, difficulty);
      return targetId ? { action: roleId, targetId } : null;
    }
    case 'witch': {
      const result = decideWitchNightAction(state, playerId, difficulty);
      if (result.action && result.targetId) {
        return { action: result.action, targetId: result.targetId };
      }
      return null;
    }
    default:
      return null;
  }
}

export function botDecideVote(
  state: GameState,
  playerId: PlayerId,
  difficulty: Difficulty
): PlayerId | null {
  return decideVote(state, playerId, difficulty);
}

export function botRecordVote(botId: PlayerId, voterId: PlayerId, targetId: PlayerId): void {
  const memory = getMemory(botId);
  if (memory.votedForMe.includes(voterId)) return;
  if (targetId === botId) {
    memory.votedForMe.push(voterId);
  }
}

export function botRecordInvestigation(botId: PlayerId, targetId: PlayerId, result: string): void {
  const memory = getMemory(botId);
  memory.investigationResults.set(targetId, result);
  if (result === 'mafia' || result === 'serial_killer') {
    memory.IBypass.add(targetId);
  } else if (result === 'town') {
    memory.ITrust.add(targetId);
  }
}

export function botGetNightActionDelay(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy': return 8000 + Math.random() * 12000;
    case 'medium': return 4000 + Math.random() * 8000;
    case 'hard': return 2000 + Math.random() * 5000;
  }
}

export function botGetVoteDelay(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy': return 15000 + Math.random() * 10000;
    case 'medium': return 8000 + Math.random() * 8000;
    case 'hard': return 3000 + Math.random() * 5000;
  }
}

export function botGetNaturalDelay(difficulty: Difficulty): number {
  return botGetNightActionDelay(difficulty);
}
