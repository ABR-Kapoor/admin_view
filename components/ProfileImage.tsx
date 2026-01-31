'use client';

interface ProfileImageProps {
  imageUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function ProfileImage({ imageUrl, name, size = 'md', onClick }: ProfileImageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-16 h-16 text-2xl'
  };

  const initial = name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div 
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-bold overflow-hidden shrink-0 ${
        imageUrl && onClick ? 'cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all' : ''
      }`}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  );
}
