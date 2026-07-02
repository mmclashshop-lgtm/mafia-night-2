import { useState } from 'react';
import { Player, Role } from '@mafia/shared';
import { Heart, Skull, Search, Syringe, Swords } from 'lucide-react';

interface NightActionsProps {
  players: Player[];
  role: Role;
  onSubmit: (targetId: string, actionType?: string) => Promise<void>;
}

const roleActionLabels: Record<string, { verb: string; icon: React.ReactNode; color: string }> = {
  mafia: { verb: 'Kill', icon: <Swords className="w-4 h-4" />, color: 'bg-red-600 hover:bg-red-700' },
  godfather: { verb: 'Kill', icon: <Swords className="w-4 h-4" />, color: 'bg-red-600 hover:bg-red-700' },
  doctor: { verb: 'Heal', icon: <Heart className="w-4 h-4" />, color: 'bg-green-600 hover:bg-green-700' },
  medic: { verb: 'Heal', icon: <Heart className="w-4 h-4" />, color: 'bg-green-600 hover:bg-green-700' },
        cop: { verb: 'Investigate', icon: <Search className="w-4 h-4" />, color: 'bg-[#8B0000] hover:bg-[#B22222]' },
        detective: { verb: 'Investigate', icon: <Search className="w-4 h-4" />, color: 'bg-[#8B0000] hover:bg-[#B22222]' },
  spy: { verb: 'Spy on', icon: <Search className="w-4 h-4" />, color: 'bg-purple-600 hover:bg-purple-700' },
  serial_killer: { verb: 'Kill', icon: <Skull className="w-4 h-4" />, color: 'bg-red-700 hover:bg-red-800' },
  vigilante: { verb: 'Shoot', icon: <Swords className="w-4 h-4" />, color: 'bg-orange-600 hover:bg-orange-700' },
  sniper: { verb: 'Snipe', icon: <Swords className="w-4 h-4" />, color: 'bg-orange-600 hover:bg-orange-700' },
};

export function NightActions({ players, role, onSubmit }: NightActionsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [witchAction, setWitchAction] = useState<'save' | 'kill' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const actionConfig = roleActionLabels[role.id] ?? { verb: 'Target', icon: null, color: 'btn-primary' };
  const isWitch = role.id === 'witch';

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    if (isWitch && witchAction) {
      const actionType = witchAction === 'save' ? 'witch_save' : 'witch_kill';
      await onSubmit(selected, actionType);
    } else {
      await onSubmit(selected);
    }
    setSubmitting(false);
  };

  return (
    <div className="card p-4">
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>🌙</span> Night Action: {role.name}
      </h3>

      {isWitch && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setWitchAction(witchAction === 'save' ? null : 'save')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              witchAction === 'save'
                ? 'bg-green-600 text-white ring-2 ring-green-400'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            💚 Save Potion
          </button>
          <button
            onClick={() => setWitchAction(witchAction === 'kill' ? null : 'kill')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              witchAction === 'kill'
                ? 'bg-red-600 text-white ring-2 ring-red-400'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            💀 Kill Potion
          </button>
        </div>
      )}

      <p className="text-sm text-gray-400 mb-3">
        {isWitch
          ? witchAction === 'save'
            ? 'Choose a player to save from death tonight'
            : witchAction === 'kill'
              ? 'Choose a player to kill tonight'
              : 'Select a potion first'
          : `Choose a target to ${actionConfig.verb.toLowerCase()}`}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => setSelected(player.id)}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              selected === player.id
                ? `${actionConfig.color} text-white`
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected || !witchAction && isWitch || submitting}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {actionConfig.icon}
        {submitting
          ? 'Submitting...'
          : isWitch && witchAction
            ? `${witchAction === 'save' ? 'Save' : 'Kill'} ${players.find((p) => p.id === selected)?.name ?? ''}`
            : `${actionConfig.verb} ${players.find((p) => p.id === selected)?.name ?? ''}`}
      </button>
    </div>
  );
}
