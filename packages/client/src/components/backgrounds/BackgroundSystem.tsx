import { ReactNode } from 'react';

export function BackgroundSystem({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-ambient pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
