'use client';

export default function LoadingSpinner({ size = 'md', text = 'Loading...' }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className={`${sizeClasses[size]} border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin`}></div>
      {text && <p className="mt-4 text-gray-600 font-medium">{text}</p>}
    </div>
  );
}
