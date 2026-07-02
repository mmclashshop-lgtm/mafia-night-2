import { GameState, Player, Team } from '../types/game';
import { PlayerId } from '../types/ids';
import { addEvent } from './gameEngine';

export function resolveNightActions(state: GameState): { state: GameState; killed: Player[] } {
  const nightActions = state.players
    .filter(p => p.alive && p.nightAction)
    .map(p => ({
      sourceId: p.id,
      action: p.nightAction!,
      priority: p.role?.priority ?? 0,
    }))
    .sort((a, b) => b.priority - a.priority);

  const healTargets = new Set<string>();
  const killAttempts: Array<{ targetId: string; sourceId: string; actionType: string }> = [];
  const investigateResults: Array<{ sourceId: string; targetId: string; result: string }> = [];
  let witchKillTarget: string | null = null;
  let witchSaveTarget: string | null = null;

  for (const { sourceId, action } of nightActions) {
    const source = state.players.find(p => p.id === sourceId);
    if (!source) continue;

    switch (action.type as string) {
      case 'doctor':
      case 'medic':
        healTargets.add(action.targetId);
        break;
      case 'mafia':
      case 'godfather':
      case 'serial_killer':
      case 'vigilante':
      case 'sniper':
        killAttempts.push({ targetId: action.targetId, sourceId, actionType: action.type });
        break;
      case 'cop': {
        const target = state.players.find(p => p.id === action.targetId);
        const result = target?.team === 'mafia' ? 'mafia' : 'town';
        investigateResults.push({ sourceId, targetId: action.targetId, result });
        break;
      }
      case 'detective': {
        const target = state.players.find(p => p.id === action.targetId);
        investigateResults.push({ sourceId, targetId: action.targetId, result: target?.role?.id ?? 'unknown' });
        break;
      }
      case 'spy': {
        const target = state.players.find(p => p.id === action.targetId);
        investigateResults.push({ sourceId, targetId: action.targetId, result: target?.role?.name ?? 'unknown' });
        break;
      }
      case 'witch_save': {
        if (!state.witchState?.savePotionUsed) {
          witchSaveTarget = action.targetId;
        }
        break;
      }
      case 'witch_kill': {
        if (!state.witchState?.killPotionUsed) {
          witchKillTarget = action.targetId;
        }
        break;
      }
    }
  }

  // Witch save overrides doctor heal for tracking
  if (witchSaveTarget) {
    healTargets.add(witchSaveTarget);
  }

  // Witch kill adds another kill attempt
  if (witchKillTarget) {
    killAttempts.push({ targetId: witchKillTarget, sourceId: '', actionType: 'witch' });
  }

  // Determine who actually dies
  const killedIds = new Set<string>();
  for (const kill of killAttempts) {
    if (!healTargets.has(kill.targetId)) {
      killedIds.add(kill.targetId);
    }
  }

  // Godfather cannot be killed at night
  const godfatherIds = new Set<string>(
    state.players.filter(p => p.role?.id === 'godfather' && p.alive).map(p => p.id as string)
  );
  for (const id of killedIds) {
    if (godfatherIds.has(id)) {
      killedIds.delete(id);
    }
  }

  const newState = structuredClone(state) as GameState;
  const killedPlayers: Player[] = [];

  for (const player of state.players) {
    if (player.alive && killedIds.has(player.id)) {
      const lover = newState.loverPair
        ? newState.players.find(
            p => p.id !== player.id && p.alive && newState.loverPair?.includes(p.id as PlayerId)
          )
        : null;

      killedPlayers.push(structuredClone(player));

      if (lover) {
        killedPlayers.push(structuredClone(lover));
      }
    }
  }

  const killedSet = new Set(killedPlayers.map(p => p.id));
  newState.players = newState.players.map(p =>
    killedSet.has(p.id)
      ? { ...p, alive: false }
      : { ...p, nightAction: null }
  );
  newState.eliminated = [...newState.eliminated, ...killedPlayers];

  // Update witch state
  if (witchSaveTarget && state.witchState && !state.witchState.savePotionUsed && newState.witchState) {
    newState.witchState = { savePotionUsed: true, killPotionUsed: newState.witchState.killPotionUsed, savedPlayerId: witchSaveTarget as PlayerId };
  }
  if (witchKillTarget && state.witchState && !state.witchState.killPotionUsed && newState.witchState) {
    newState.witchState = { savePotionUsed: newState.witchState.savePotionUsed, killPotionUsed: true, savedPlayerId: newState.witchState.savedPlayerId };
  }

  // Add events
  for (const kp of killedPlayers) {
    const killSource = killAttempts.find(k => k.targetId === kp.id);
    addEvent(newState, 'kill', {
      targetId: kp.id,
      cause: 'night_kill',
      killerId: killSource?.sourceId || null,
      actionType: killSource?.actionType || null,
    });
  }
  for (const inv of investigateResults) {
    addEvent(newState, 'investigate', inv);
  }

  return { state: newState, killed: killedPlayers };
}

export function resolveVotes(state: GameState): { state: GameState; eliminated: Player | null } {
  const voteCount = new Map<string, number>();
  for (const vote of state.votes) {
    voteCount.set(vote.to, (voteCount.get(vote.to) ?? 0) + 1);
  }

  if (voteCount.size === 0) {
    return { state, eliminated: null };
  }

  let maxVotes = 0;
  let maxVotedId = '';
  for (const [id, count] of voteCount) {
    const player = state.players.find(p => p.id === id);
    const voteWeight = player?.role?.id === 'mayor' ? 2 : 1;
    const weightedCount = count * voteWeight;
    if (weightedCount > maxVotes) {
      maxVotes = weightedCount;
      maxVotedId = id;
    }
  }

  const eliminated = state.players.find(p => p.id === maxVotedId);
  if (!eliminated) return { state, eliminated: null };

  const newState = structuredClone(state) as GameState;
  newState.players = state.players.map(p =>
    p.id === eliminated.id ? { ...p, alive: false } : { ...p, votedFor: null, nightAction: null }
  );
  newState.votes = [];
  newState.eliminated = [...state.eliminated, eliminated];

  // Add lynch event
  addEvent(newState, 'lynch', { targetId: eliminated.id, votes: state.votes });

  // Jester wins if lynched
  if (eliminated.role?.id === 'jester') {
    newState.winner = 'neutral' as Team;
    newState.phase = 'ended';
  }

  // Lover dies too if their partner was lynched
  if (newState.loverPair) {
    const [lover1, lover2] = newState.loverPair;
    const otherLoverId = eliminated.id === lover1 ? lover2 : eliminated.id === lover2 ? lover1 : null;
    if (otherLoverId) {
      newState.players = newState.players.map(p =>
        p.id === otherLoverId ? { ...p, alive: false } : p
      );
    }
  }

  return { state: newState, eliminated };
}
