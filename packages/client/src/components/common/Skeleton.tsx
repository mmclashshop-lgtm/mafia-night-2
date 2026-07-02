import { memo } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
}

function SkeletonBase({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:400%_100%] animate-shimmer ${className || ''}`}
    />
  );
}

export const Skeleton = memo(function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  if (variant === 'circular') {
    return <SkeletonBase className={`rounded-full ${width || 'w-12'} ${height || 'h-12'} ${className || ''}`} />;
  }
  if (variant === 'card') {
    return (
      <div className={`rounded-xl bg-gray-900/50 p-4 ${className || ''}`}>
        <SkeletonBase className="w-12 h-12 rounded-full mb-3" />
        <SkeletonBase className="h-4 w-3/4 mb-2" />
        <SkeletonBase className="h-3 w-1/2" />
      </div>
    );
  }
  if (variant === 'rectangular') {
    return <SkeletonBase className={`rounded-lg ${width || 'w-full'} ${height || 'h-24'} ${className || ''}`} />;
  }
  return <SkeletonBase className={`h-4 ${width || 'w-full'} ${className || ''}`} />;
});

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      <Skeleton variant="circular" className="w-12 h-12 mx-auto" />
      <Skeleton className="h-4 w-3/4 mx-auto" />
      <Skeleton className="h-3 w-1/2 mx-auto" />
    </div>
  );
}

export function SkeletonPlayerList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonLobby() {
  return (
    <div className="card p-6 space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      <SkeletonPlayerList count={6} />
    </div>
  );
}

export function SkeletonGame() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="md:col-span-1 lg:col-span-2 space-y-4">
        <Skeleton variant="rectangular" className="w-full h-20" />
        <Skeleton variant="rectangular" className="w-full h-48" />
        <SkeletonPlayerList count={4} />
      </div>
      <div className="space-y-4">
        <Skeleton variant="rectangular" className="w-full h-32" />
        <Skeleton variant="rectangular" className="w-full h-64" />
      </div>
    </div>
  );
}

export function SkeletonLeaderboard() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="card-hover p-3 flex items-center gap-3">
          <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16 hidden sm:block" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
