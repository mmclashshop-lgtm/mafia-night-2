import { GameState, Player, Team } from '../types/game';
import { PlayerId } from '../types/ids';
import { addEvent } from './gameEngine';

export interface InvestigationResult {
  sourceId: PlayerId;
  targetId: PlayerId;
  result: string;
}

function chooseMafiaKill(votes: Map<string, string[]>): { targetId: string; sourceId: string } | null {
  let selectedTarget: string | null = null;
  let selectedSources: string[] = [];
  let topVotes = 0;
  let tied = false;

  for (const [targetId, sourceIds] of votes) {
    if (sourceIds.length > topVotes) {
      selectedTarget = targetId;
      selectedSources = sourceIds;
      topVotes = sourceIds.length;
      tied = false;
    } else if (sourceIds.length === topVotes) {
      tied = true;
    }
  }

  if (!selectedTarget || tied) return null;
  return { targetId: selectedTarget, sourceId: selectedSources[0] ?? 'mafia' };
}

export function resolveNightActions(state: GameState): { state: GameState; killed: Player[]; investigations: InvestigationResult[] } {
  const nightActions = state.players
    .filter(p => p.alive && p.nightAction)
    .map(p => ({
      sourceId: p.id,
      action: p.nightAction!,
      priority: p.role?.priority ?? 0,
    }))
    .sort((a, b) => b.priority - a.priority);

  const healTargets = new Set<string>();
  const healEvents: Array<{ sourceId: string; targetId: string; healer: string }> = [];
  const killAttempts: Array<{ targetId: string; sourceId: string; actionType: string }> = [];
  const mafiaKillVotes = new Map<string, string[]>();
  const investigateResults: InvestigationResult[] = [];
  let witchKill: { sourceId: string; targetId: string } | null = null;
  let witchSave: { sourceId: string; targetId: string } | null = null;

  for (const { sourceId, action } of nightActions) {
    const source = state.players.find(p => p.id === sourceId);
    if (!source) continue;
    
    // Enforce maxUses for limited-use roles
    if (source.role && source.role.maxUses > 0 && source.actionUses >= source.role.maxUses) {
      continue;
    }

    switch (action.type as string) {
      case 'doctor':
      case 'medic':
        healTargets.add(action.targetId);
        healEvents.push({ sourceId, targetId: action.targetId, healer: action.type });
        break;
      case 'mafia':
      case 'godfather': {
        const sources = mafiaKillVotes.get(action.targetId) ?? [];
        sources.push(sourceId);
        mafiaKillVotes.set(action.targetId, sources);
        break;
      }
      case 'serial_killer':
      case 'vigilante':
      case 'sniper':
        killAttempts.push({ targetId: action.targetId, sourceId, actionType: action.type });
        break;
      case 'cop': {
        const target = state.players.find(p => p.id === action.targetId);
        if (!target) break;
        const appearsMafia = target.team === 'mafia' && target.role?.id !== 'godfather';
        investigateResults.push({ sourceId, targetId: action.targetId, result: appearsMafia ? 'mafia' : 'town' });
        break;
      }
      case 'detective': {
        const target = state.players.find(p => p.id === action.targetId);
        if (!target) break;
        investigateResults.push({ sourceId, targetId: action.targetId, result: target.role?.id ?? 'unknown' });
        break;
      }
      case 'spy': {
        const target = state.players.find(p => p.id === action.targetId);
        if (!target) break;
        investigateResults.push({ sourceId, targetId: action.targetId, result: target.role?.name ?? 'unknown' });
        break;
      }
      case 'witch_save': {
        if (!state.witchState?.savePotionUsed && !witchSave) {
          witchSave = { sourceId, targetId: action.targetId };
        }
        break;
      }
      case 'witch_kill': {
        if (!state.witchState?.killPotionUsed && !witchKill) {
          witchKill = { sourceId, targetId: action.targetId };
        }
        break;
      }
    }
  }

  const mafiaKill = chooseMafiaKill(mafiaKillVotes);
  if (mafiaKill) {
    killAttempts.push({ targetId: mafiaKill.targetId, sourceId: mafiaKill.sourceId, actionType: 'mafia' });
  }

  // Witch save overrides doctor heal for tracking
  if (witchSave) {
    healTargets.add(witchSave.targetId);
    healEvents.push({ sourceId: witchSave.sourceId, targetId: witchSave.targetId, healer: 'witch' });
  }

  // Witch kill adds another kill attempt
  if (witchKill) {
    killAttempts.push({ targetId: witchKill.targetId, sourceId: witchKill.sourceId, actionType: 'witch' });
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
  for (const id of godfatherIds) {
    killedIds.delete(id);
  }

  let newState = structuredClone(state) as GameState;
  const killedPlayers: Player[] = [];
  const killedPlayerIds = new Set<string>();

  const addKilledPlayer = (player: Player) => {
    if (killedPlayerIds.has(player.id)) return;
    killedPlayerIds.add(player.id);
    killedPlayers.push(structuredClone(player));
  };

  for (const player of state.players) {
    if (player.alive && killedIds.has(player.id)) {
      const lover = newState.loverPair
        ? newState.players.find(
            p => p.id !== player.id && p.alive && newState.loverPair?.includes(p.id as PlayerId)
          )
        : null;

      addKilledPlayer(player);

      if (lover) {
        addKilledPlayer(lover);
      }
    }
  }

  const killedSet = new Set(killedPlayers.map(p => p.id));
  newState.players = newState.players.map(p => {
    if (killedSet.has(p.id)) {
      // If lover dies from heartbreak (their partner was killed), still increment their actionUses
      const hadAction = state.players.find(sp => sp.id === p.id)?.nightAction;
      return {
        ...p,
        alive: false,
        nightAction: null,
        actionUses: hadAction ? p.actionUses + (p.nightAction ? 1 : 0) : p.actionUses,
      };
    }
    return p.nightAction
      ? { ...p, actionUses: p.actionUses + 1, nightAction: null }
      : { ...p, nightAction: null };
  });
  newState.eliminated = [...newState.eliminated, ...killedPlayers];

  // Update witch state (use newState.witchState for both reads and writes)
  if (witchSave && newState.witchState && !newState.witchState.savePotionUsed) {
    newState.witchState = { savePotionUsed: true, killPotionUsed: newState.witchState.killPotionUsed, savedPlayerId: witchSave.targetId as PlayerId };
  }
  if (witchKill && newState.witchState && !newState.witchState.killPotionUsed) {
    newState.witchState = { savePotionUsed: newState.witchState.savePotionUsed, killPotionUsed: true, savedPlayerId: newState.witchState.savedPlayerId };
  }

  // Add events
  for (const heal of healEvents) {
    newState = addEvent(newState, 'heal', heal);
  }
  for (const kp of killedPlayers) {
    const killSource = killAttempts.find(k => k.targetId === kp.id);
    newState = addEvent(newState, 'kill', {
      targetId: kp.id,
      cause: 'night_kill',
      killerId: killSource?.sourceId || null,
      actionType: killSource?.actionType || null,
    });
  }
  for (const inv of investigateResults) {
    newState = addEvent(newState, 'investigate', inv);
  }

  return { state: newState, killed: killedPlayers, investigations: investigateResults };
}

export function resolveVotes(state: GameState): { state: GameState; eliminated: Player | null } {
  const voteCount = new Map<string, number>();
  for (const vote of state.votes) {
    const voter = state.players.find(p => p.id === vote.from);
    const target = state.players.find(p => p.id === vote.to);
    if (!voter?.alive || !target?.alive) continue;
    const voteWeight = voter.role?.id === 'mayor' ? 2 : 1;
    voteCount.set(vote.to, (voteCount.get(vote.to) ?? 0) + voteWeight);
  }

  let newState = structuredClone(state) as GameState;

  if (voteCount.size === 0) {
    newState.votes = [];
    newState.players = newState.players.map(p => ({ ...p, votedFor: null, nightAction: null }));
    return { state: newState, eliminated: null };
  }

  let maxVotes = 0;
  const leaders: string[] = [];
  for (const [id, count] of voteCount) {
    if (count > maxVotes) {
      maxVotes = count;
      leaders.length = 0;
      leaders.push(id);
    } else if (count === maxVotes) {
      leaders.push(id);
    }
  }

  newState.players = state.players.map(p => ({ ...p, votedFor: null, nightAction: null }));
  newState.votes = [];

  if (leaders.length !== 1) {
    newState = addEvent(newState, 'vote', { outcome: 'tie', votes: state.votes, voteCount: Object.fromEntries(voteCount) });
    return { state: newState, eliminated: null };
  }

  const maxVotedId = leaders[0]!;
  const eliminated = state.players.find(p => p.id === maxVotedId);
  if (!eliminated) return { state: newState, eliminated: null };

  newState.players = newState.players.map(p =>
    p.id === eliminated.id ? { ...p, alive: false } : p
  );
  newState.eliminated = [...state.eliminated, eliminated];

  // Add lynch event
  newState = addEvent(newState, 'lynch', { targetId: eliminated.id, votes: state.votes, voteCount: Object.fromEntries(voteCount) });

  // Lover dies too if their partner was lynched (before jester check — lover dies anyway)
  if (newState.loverPair) {
    const [lover1, lover2] = newState.loverPair;
    const otherLoverId = eliminated.id === lover1 ? lover2 : eliminated.id === lover2 ? lover1 : null;
    if (otherLoverId) {
      const otherLover = state.players.find(p => p.id === otherLoverId);
      newState.players = newState.players.map(p =>
        p.id === otherLoverId ? { ...p, alive: false } : p
      );
      if (otherLover && !newState.eliminated.some(p => p.id === otherLover.id)) {
        newState.eliminated = [...newState.eliminated, otherLover];
      }
    }
  }

  // Jester wins if lynched (after lover heartbreak so eliminated list is complete)
  if (eliminated.role?.id === 'jester') {
    newState.winner = 'neutral' as Team;
    newState.phase = 'ended';
  }

  return { state: newState, eliminated };
}
