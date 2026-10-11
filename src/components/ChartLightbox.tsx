import React, { useState } from 'react';
import { ChartImagePayload } from '../types/trading';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface ChartLightboxProps {
  image: ChartImagePayload | null;
  onClose: () => void;
}

export const ChartLightbox: React.FC<ChartLightboxProps> = ({ image, onClose }) => {
  const [zoom, setZoom] = useState<number>(1);

  if (!image) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      {/* Lightbox Modal Container */}
      <div className="relative w-full max-w-6xl h-[85vh] bg-[#0c1017] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3 font-mono">
            <span className="text-sm font-bold text-white">{image.name}</span>
            <span className="text-xs text-cyan-400">({image.timeframeLabel || 'Chart Inspection'})</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono text-slate-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 border-l border-slate-700 cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950/80">
          <img
            src={image.previewUrl}
            alt="Full-Resolution Trading Chart"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-w-full max-h-full object-contain transition-transform duration-150 select-none cursor-grab active:cursor-grabbing"
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between bg-slate-900/60">
          <span>Inspect candlestick wicks, price scale values, and indicator readings</span>
          <span>Click outside or press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
