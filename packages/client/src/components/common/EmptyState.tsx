import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-400 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-600 max-w-xs mb-4">{description}</p>}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
