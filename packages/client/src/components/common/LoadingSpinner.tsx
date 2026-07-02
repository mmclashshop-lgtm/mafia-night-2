interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-5 h-5 border-2' : size === 'lg' ? 'w-10 h-10 border-3' : 'w-8 h-8 border-2';
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizeClass} border-[#8B0000] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(139,0,0,0.3)]`} />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}
