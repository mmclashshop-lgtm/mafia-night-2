import { memo } from 'react';

interface PlayerAvatarProps {
  avatar: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-11 h-11 text-base',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-24 h-24 text-4xl',
};

const ICON_MAP: Record<string, string> = {
  mask: '🎭', crown: '👑', detective: '🔍', skull: '☠️', ghost: '👻',
  knife: '🔪', gun: '🔫', heart: '❤️‍🔥', spy: '🕵️', vampire: '🧛',
  wolf: '🐺', fox: '🦊', owl: '🦉', raven: '🐦‍⬛', moon: '🌙',
  star: '⭐', crystal: '🔮', clown: '🤡', angel: '👼', devil: '😈',
};

function getDiceBearUrl(name: string) {
  return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent&backgroundType=gradientLinear&backgroundRotation=0`;
}

export const PlayerAvatar = memo(function PlayerAvatar({ avatar, name, size = 'md', className = '' }: PlayerAvatarProps) {
  if (!avatar || avatar === 'dicebear') {
    return (
      <img
        src={getDiceBearUrl(name)}
        alt={name}
        className={`${SIZES[size]} rounded-full object-cover bg-gray-800 ${className}`}
        crossOrigin="anonymous"
      />
    );
  }

  if (avatar.startsWith('upload:')) {
    return (
      <img
        src={avatar.replace('upload:', '')}
        alt={name}
        className={`${SIZES[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  if (avatar.startsWith('icon:')) {
    const iconId = avatar.replace('icon:', '');
    const emoji = ICON_MAP[iconId] || '🎭';
    return (
      <div className={`${SIZES[size]} rounded-full bg-gray-800 flex items-center justify-center ${className}`}>
        <span>{emoji}</span>
      </div>
    );
  }

  return (
    <img
      src={getDiceBearUrl(name)}
      alt={name}
      className={`${SIZES[size]} rounded-full object-cover bg-gray-800 ${className}`}
      crossOrigin="anonymous"
    />
  );
});
