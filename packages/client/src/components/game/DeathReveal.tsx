import { Role, TEAM_COLORS, TEAM_NAMES } from '@mafia/shared';
import { RoleAvatarWithFallback } from '../common/RoleAvatar';

interface DeathRevealProps {
  role: Role;
}

export function DeathReveal({ role }: DeathRevealProps) {
  const color = TEAM_COLORS[role.team];
  return (
    <div className="card p-6 text-center animate-scale-in">
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full animate-ping opacity-20" style={{ background: color }} />
        </div>
        <div className="text-5xl mb-2 animate-float">💀</div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">You are dead</h2>
      <div className="flex items-center justify-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: `${color}20`, border: `2px solid ${color}40` }}
        >
          <RoleAvatarWithFallback roleId={role.id} emoji={role.emoji} size="lg" />
        </div>
        <div className="text-left">
          <p className="text-lg font-semibold text-white">{role.name}</p>
          <p className="text-sm" style={{ color }}>{TEAM_NAMES[role.team]} Team</p>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-1">You can now see all roles</p>
      <p className="text-xs text-gray-500">You can still chat with alive players</p>
    </div>
  );
}
