import { Role } from '@mafia/shared';
import { TEAM_COLORS, TEAM_NAMES } from '@mafia/shared';
import { RoleAvatarWithFallback } from '../common/RoleAvatar';

interface RoleCardProps {
  role: Role;
}

export function RoleCard({ role }: RoleCardProps) {
  const teamColor = TEAM_COLORS[role.team];
  const teamName = TEAM_NAMES[role.team];

  return (
    <div className="card overflow-hidden animate-scale-in">
      <div
        className="p-5 text-center"
        style={{ borderBottom: `1px solid ${teamColor}33` }}
      >
        <div className="flex justify-center mb-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center animate-float"
            style={{ background: `${teamColor}15`, border: `2px solid ${teamColor}40` }}
          >
            <RoleAvatarWithFallback roleId={role.id} emoji={role.emoji} size="xl" animate />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-0.5">{role.name}</h2>
        <span
          className="text-sm font-medium px-3 py-0.5 rounded-full inline-block"
          style={{
            background: `${teamColor}20`,
            color: teamColor,
            border: `1px solid ${teamColor}40`,
          }}
        >
          {teamName}
        </span>
      </div>
      <div className="p-4">
        <p
          className="text-sm leading-relaxed"
          style={{ color: `${teamColor}cc` }}
        >
          {role.description}
        </p>
        {role.team === 'mafia' && (
          <p className="text-xs mt-3 opacity-60" style={{ color: teamColor }}>
            Mafia members: work together to eliminate the Town.
          </p>
        )}
      </div>
    </div>
  );
}
