import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Player } from '@mafia/shared';

interface VotingPanelProps {
  players: Player[];
  hasVoted: boolean;
  onSubmit: (targetId: string) => Promise<void>;
}

export function VotingPanel({ players, hasVoted, onSubmit }: VotingPanelProps) {
  const { t } = useTranslation();
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
        <p className="text-green-400 font-medium">{t('votingPanel.voted')}</p>
        <p className="text-sm text-gray-400 mt-1">{t('votingPanel.waiting')}</p>
      </div>
    );
  }

  const handleSkip = async () => {
    setSubmitting(true);
    await onSubmit('skip');
    setSubmitting(false);
  };

  return (
    <div className="card-glass p-4">
      <h3 className="text-lg font-bold mb-1">{t('votingPanel.title')}</h3>
      <p className="text-sm text-gray-400 mb-3">
        {t('votingPanel.choosePlayer')}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => setSelected(player.id)}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              selected === player.id
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!selected || submitting}
          className="btn-danger flex-1"
        >
          {submitting
            ? t('votingPanel.voting')
            : selected
              ? t('votingPanel.eliminate', { name: players.find((p) => p.id === selected)?.name })
              : t('votingPanel.selectPlayer')}
        </button>
        <button
          onClick={handleSkip}
          disabled={submitting}
          className="btn-secondary px-4"
        >
          {t('votingPanel.skip')}
        </button>
      </div>
    </div>
  );
}
