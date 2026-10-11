import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileImage,
  Trash2,
  Maximize2,
  Sparkles,
  Plus,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import {
  ChartImagePayload,
  InstrumentSymbol,
  Timeframe,
  TradingMode,
} from '../types/trading';
import { SAMPLE_CHARTS, SampleChartPreset } from '../data/sampleCharts';

interface UploadAreaProps {
  images: ChartImagePayload[];
  onImagesChange: (images: ChartImagePayload[]) => void;
  selectedInstrument: InstrumentSymbol | 'AUTO';
  onInstrumentChange: (inst: InstrumentSymbol | 'AUTO') => void;
  selectedTimeframe: Timeframe | 'AUTO';
  onTimeframeChange: (tf: Timeframe | 'AUTO') => void;
  tradingMode: TradingMode;
  onTradingModeChange: (mode: TradingMode) => void;
  knownPrice: string;
  onKnownPriceChange: (price: string) => void;
  userNotes: string;
  onUserNotesChange: (notes: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onInspectImage: (img: ChartImagePayload) => void;
}

const SUPPORTED_INSTRUMENTS: { symbol: InstrumentSymbol; label: string }[] = [
  { symbol: 'XAUUSD', label: 'XAUUSD · Gold vs US Dollar' },
  { symbol: 'EUR/USD', label: 'EUR/USD · Euro vs US Dollar' },
  { symbol: 'GBP/USD', label: 'GBP/USD · British Pound vs US Dollar' },
  { symbol: 'USD/JPY', label: 'USD/JPY · US Dollar vs Japanese Yen' },
  { symbol: 'USD/CHF', label: 'USD/CHF · US Dollar vs Swiss Franc' },
  { symbol: 'AUD/USD', label: 'AUD/USD · Australian Dollar vs US Dollar' },
  { symbol: 'NZD/USD', label: 'NZD/USD · New Zealand Dollar vs US Dollar' },
  { symbol: 'USD/CAD', label: 'USD/CAD · US Dollar vs Canadian Dollar' },
];

const TIMEFRAMES: (Timeframe | 'AUTO')[] = [
  'AUTO',
  'M1',
  'M5',
  'M15',
  'M30',
  'H1',
  'H4',
  'D1',
  'W1',
  'MN1',
];

export const UploadArea: React.FC<UploadAreaProps> = ({
  images,
  onImagesChange,
  selectedInstrument,
  onInstrumentChange,
  selectedTimeframe,
  onTimeframeChange,
  tradingMode,
  onTradingModeChange,
  knownPrice,
  onKnownPriceChange,
  userNotes,
  onUserNotesChange,
  onAnalyze,
  isAnalyzing,
  onInspectImage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for Clipboard Paste (Ctrl+V / Cmd+V) globally
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessFile(file, `Pasted Screenshot ${images.length + 1}`);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [images]);

  const handleProcessFile = (file: File, fallbackName?: string) => {
    setUploadError(null);
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      setUploadError('Invalid format. Please upload PNG, JPG, JPEG, or WEBP chart screenshots.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds 15MB limit. Please compress or crop the screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUri = event.target?.result as string;
      
      // Optimize image resolution if overly large for Vercel serverless limits
      const img = new Image();
      img.onload = () => {
        let targetWidth = img.width;
        let targetHeight = img.height;
        const maxDim = 1920;

        if (targetWidth > maxDim || targetHeight > maxDim) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
            targetWidth = maxDim;
          } else {
            targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
            targetHeight = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const optimizedDataUri = canvas.toDataURL('image/jpeg', 0.92);
            const newImg: ChartImagePayload = {
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              data: optimizedDataUri,
              mimeType: 'image/jpeg',
              name: file.name || fallbackName || 'Chart Screenshot',
              timeframeLabel: images.length === 0 ? 'Primary TF' : `Secondary TF (${images.length + 1})`,
              previewUrl: optimizedDataUri,
            };
            const updated = [...images, newImg];
            onImagesChange(updated);
            setActiveImageIdx(updated.length - 1);
            return;
          }
        }

        const newImg: ChartImagePayload = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          data: rawDataUri,
          mimeType: file.type,
          name: file.name || fallbackName || 'Chart Screenshot',
          timeframeLabel: images.length === 0 ? 'Primary TF' : `Secondary TF (${images.length + 1})`,
          previewUrl: rawDataUri,
        };
        const updated = [...images, newImg];
        onImagesChange(updated);
        setActiveImageIdx(updated.length - 1);
      };
      img.src = rawDataUri;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => handleProcessFile(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => handleProcessFile(file));
    }
  };

  const handleRemoveImage = (idxToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== idxToRemove);
    onImagesChange(updated);
    if (activeImageIdx >= updated.length) {
      setActiveImageIdx(Math.max(0, updated.length - 1));
    }
  };

  const handleLoadSample = (sample: SampleChartPreset) => {
    const dataUri = sample.generateDataUrl();
    const newImg: ChartImagePayload = {
      id: `sample-${sample.id}-${Date.now()}`,
      data: dataUri,
      mimeType: 'image/png',
      name: `${sample.instrument} ${sample.timeframe} Preset`,
      timeframeLabel: `${sample.timeframe} TF`,
      previewUrl: dataUri,
    };
    onImagesChange([newImg]);
    setActiveImageIdx(0);
    onInstrumentChange(sample.instrument);
    onTimeframeChange(sample.timeframe);
    onTradingModeChange(sample.mode);
    onKnownPriceChange(sample.currentPrice.toString());
    onUserNotesChange(sample.description);
  };

  const currentActiveImg = images[activeImageIdx];

  return (
    <div className="bg-[#111622] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col gap-4">
      {/* Top Section: Quick Sample Bar for instant 1-click test */}
      <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Sample Setups
          </span>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            (1-Click Load Realistic Charts)
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SAMPLE_CHARTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample)}
              className="px-2.5 py-1 text-[11px] font-mono bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
              title={sample.title}
            >
              {sample.instrument} {sample.timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Main Upload Drop Zone / Active Chart Preview */}
      {images.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px] ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/70'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".png,.jpg,.jpeg,.webp"
            multiple
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3 text-cyan-400 shadow-md">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            Upload Chart Screenshot
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-3">
            Drag & drop TradingView, MT4, or MT5 screenshots here, or paste from clipboard (
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-cyan-300 border border-slate-700">
              Ctrl+V
            </kbd>
            ).
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span>PNG · JPG · WEBP</span>
            <span aria-hidden="true">·</span>
            <span>Up to 15MB</span>
            <span aria-hidden="true">·</span>
            <span>Multi-TF Supported</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Multiple Timeframe Image Tab Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[calc(100%-120px)]">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-mono transition-all cursor-pointer ${
                    activeImageIdx === idx
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <FileImage className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[100px]">{img.name}</span>
                  {images.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="text-slate-500 hover:text-rose-400 ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/60 rounded cursor-pointer"
                title="Add second screenshot for Multi-Timeframe confirmation"
              >
                <Plus className="w-3 h-3" />
                <span>Add Timeframe</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
              />
            </div>
          </div>

          {/* Active Screenshot Display & Inspection */}
          {currentActiveImg && (
            <div className="relative rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 group max-h-[360px] flex items-center justify-center">
              <img
                src={currentActiveImg.previewUrl}
                alt="Trading Chart Screenshot"
                className="w-full h-auto max-h-[360px] object-contain cursor-zoom-in"
                onClick={() => onInspectImage(currentActiveImg)}
              />

              {/* Hover overlay control bar */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-md border border-slate-700 shadow-lg">
                <button
                  onClick={() => onInspectImage(currentActiveImg)}
                  className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Inspect Full Resolution Lightbox"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRemoveImage(activeImageIdx)}
                  className="p-1 text-slate-300 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Remove Screenshot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Caption */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-2 text-xs text-slate-300 flex items-center justify-between font-mono">
                <span className="truncate">{currentActiveImg.name}</span>
                <span className="text-[10px] text-slate-500">
                  {images.length > 1 ? `${images.length} Timeframes queued` : 'Single Timeframe Mode'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Analysis Control Parameters (Optional / Explicit Configuration) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Instrument Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">
            Instrument / Pair
          </label>
          <select
            value={selectedInstrument}
            onChange={(e) => onInstrumentChange(e.target.value as InstrumentSymbol | 'AUTO')}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="AUTO">✨ Auto-Detect from Screenshot</option>
            {SUPPORTED_INSTRUMENTS.map((inst) => (
              <option key={inst.symbol} value={inst.symbol}>
                {inst.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">
            Timeframe
          </label>
          <select
            value={selectedTimeframe}
            onChange={(e) => onTimeframeChange(e.target.value as Timeframe | 'AUTO')}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>
                {tf === 'AUTO' ? '✨ Auto-Detect Timeframe' : tf}
              </option>
            ))}
          </select>
        </div>

        {/* Trading Mode */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">
            Trading Mode
          </label>
          <select
            value={tradingMode}
            onChange={(e) => onTradingModeChange(e.target.value as TradingMode)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="SCALPING">Mode 1: SCALPING (M1-M15 Micro)</option>
            <option value="INTRADAY">Mode 2: INTRADAY (M15-H4 Session)</option>
            <option value="SWING">Mode 3: SWING (H4-W1 Macro)</option>
          </select>
        </div>

        {/* Known Current Price */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono flex items-center justify-between">
            <span>Known Price</span>
            <span className="text-[10px] text-slate-500 font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 2658.40 / 1.0845"
            value={knownPrice}
            onChange={(e) => onKnownPriceChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* User Notes (Optional) */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono flex items-center justify-between">
          <span>Analysis Focus / User Notes</span>
          <span className="text-[10px] text-slate-500 font-normal lowercase">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Checking for London session liquidity sweep, Asian high breakout, or H1 FVG retest..."
          value={userNotes}
          onChange={(e) => onUserNotesChange(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
        />
      </div>

      {/* Action Button: Execute AI Multimodal Analysis */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Multimodal Gemini 3.8 Flash Vision Engine</span>
        </div>

        <button
          onClick={onAnalyze}
          disabled={images.length === 0 || isAnalyzing}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg cursor-pointer ${
            images.length === 0 || isAnalyzing
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-950/50 border border-cyan-400/30'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Analyzing Market Structure & Critical Zones...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              <span>Run Apex Technical Analysis</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
