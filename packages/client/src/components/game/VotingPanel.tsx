import { useState } from 'react';
import { Player } from '@mafia/shared';

interface VotingPanelProps {
  players: Player[];
  hasVoted: boolean;
  onSubmit: (targetId: string) => Promise<void>;
}

export function VotingPanel({ players, hasVoted, onSubmit }: VotingPanelProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    await onSubmit(selected);
    setSubmitting(false);
  };

  if (hasVoted) {
    return (
      <div className="card p-4 text-center">
        <p className="text-green-400 font-medium">✓ You have voted</p>
        <p className="text-sm text-gray-400 mt-1">Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-lg font-bold mb-3">🗳️ Vote to Eliminate</h3>
      <p className="text-sm text-gray-400 mb-3">
        Choose a player to eliminate
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => setSelected(player.id)}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              selected === player.id
                ? 'bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected || submitting}
        className="btn-danger w-full"
      >
        {submitting
          ? 'Voting...'
          : selected
            ? `Eliminate ${players.find((p) => p.id === selected)?.name}`
            : 'Select a player'}
      </button>
    </div>
  );
}
