import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface FigureLightboxProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const FigureLightbox: React.FC<FigureLightboxProps> = ({ imageUrl, title = 'Civil Engineering Diagram', onClose }) => {
  const [scale, setScale] = useState(1);

  if (!imageUrl) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setScale(1);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl w-full max-h-[92vh] bg-zinc-950 dark:bg-black border border-orange-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/90 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="font-semibold text-sm text-zinc-100 truncate">{title}</span>
            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-zinc-700 mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-orange-500 hover:text-white text-zinc-400 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Content Container with scroll & zoom */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-900/40 min-h-[300px]">
          <img
            src={imageUrl}
            alt={title}
            style={{ transform: `scale(${scale})`, transition: 'transform 0.15s ease-out' }}
            className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-lg select-none"
          />
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>Use zoom controls or scroll to examine load ordinates, dimensions, and stress distributions.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
