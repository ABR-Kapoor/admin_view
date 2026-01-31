'use client';

import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string | null;
  name: string;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, name, onClose }: ImageModalProps) {
  if (!imageUrl) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="relative max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-200">
        <img 
          src={imageUrl} 
          alt={name}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full p-2 cursor-pointer hover:bg-white/20 transition-colors">
          <X className="w-6 h-6 text-white" onClick={onClose} />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full">
          <p className="text-white font-medium text-center">{name}</p>
        </div>
      </div>
    </div>
  );
}
