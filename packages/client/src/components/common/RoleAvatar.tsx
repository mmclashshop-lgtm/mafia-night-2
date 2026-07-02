import type { RoleId } from '@mafia/shared';
import { getRoleIconPath } from '../../lib/roleConfig';

interface RoleAvatarProps {
  roleId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function RoleAvatar({ roleId, size = 'md', className = '', animate = false }: RoleAvatarProps) {
  return (
    <img
      src={getRoleIconPath(roleId)}
      alt={roleId}
      className={`${sizeMap[size]} object-contain ${animate ? 'transition-transform duration-300 group-hover:scale-110' : ''} ${className}`}
      loading="lazy"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        if (target.nextElementSibling) {
          (target.nextElementSibling as HTMLElement).style.display = 'flex';
        }
      }}
    />
  );
}

export function RoleAvatarWithFallback({ roleId, emoji, size = 'md', className = '', animate = false }: RoleAvatarProps & { emoji: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <img
        src={getRoleIconPath(roleId)}
        alt={roleId}
        className={`${sizeMap[size]} object-contain ${animate ? 'transition-transform duration-300 hover:scale-110' : ''}`}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <span
        className={`${sizeMap[size]} flex items-center justify-center text-lg absolute inset-0`}
        style={{ display: 'none' }}
      >
        {emoji}
      </span>
    </div>
  );
}
