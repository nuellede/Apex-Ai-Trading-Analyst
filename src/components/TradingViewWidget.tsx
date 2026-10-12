import React, { useEffect, useRef, useState } from 'react';
import { InstrumentSymbol } from '../types/trading';
import {
  Camera,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
  Maximize2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface TradingViewWidgetProps {
  currentInstrument: InstrumentSymbol;
  onSelectInstrument: (inst: InstrumentSymbol) => void;
  onCaptureChart: (dataUrl: string, instrument: InstrumentSymbol, timeframe: string) => void;
}

const TV_SYMBOL_MAP: Record<InstrumentSymbol, string> = {
  XAUUSD: 'OANDA:XAUUSD',
  'EUR/USD': 'FX:EURUSD',
  'GBP/USD': 'FX:GBPUSD',
  'USD/JPY': 'FX:USDJPY',
  'USD/CHF': 'FX:USDCHF',
  'AUD/USD': 'FX:AUDUSD',
  'NZD/USD': 'FX:NZDUSD',
  'USD/CAD': 'FX:USDCAD',
};

const TIMEFRAMES = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
];

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  currentInstrument,
  onSelectInstrument,
  onCaptureChart,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeInterval, setActiveInterval] = useState<string>('60');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);

  const tvSymbol = TV_SYMBOL_MAP[currentInstrument] || 'OANDA:XAUUSD';

  // Mount TradingView Advanced Chart Widget
  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';

    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: activeInterval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      backgroundColor: '#0c1017',
      gridColor: 'rgba(255, 255, 255, 0.05)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    });

    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [tvSymbol, activeInterval]);

  // Method 1: Web Screen Capture API (Captures live video frame into canvas and sends to Analyzer)
  const handleCaptureScreen = async () => {
    setIsCapturing(true);
    setCaptureStatus('Pilih jendela/tab browser untuk mengambil tangkapan layar...');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert(
          'Browser Anda membatasi getDisplayMedia. Gunakan cara cepat: Klik ikon Kamera di kanan atas TradingView (Alt+S) -> "Copy Image" lalu tekan Ctrl+V di aplikasi ini!'
        );
        setIsCapturing(false);
        setCaptureStatus(null);
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        },
        audio: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        // Wait 300ms for video frame to render
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

            // Stop screen sharing tracks immediately
            stream.getTracks().forEach((track) => track.stop());

            setCaptureStatus('Screenshot berhasil diambil! Mengalihkan ke Analyzer...');
            setTimeout(() => {
              onCaptureChart(dataUrl, currentInstrument, activeInterval);
              setIsCapturing(false);
              setCaptureStatus(null);
            }, 600);
          }
        }, 350);
      };
    } catch (err: any) {
      console.warn('Screen capture cancelled or error:', err);
      setIsCapturing(false);
      setCaptureStatus(null);
    }
  };

  const instrumentOptions: InstrumentSymbol[] = [
    'XAUUSD',
    'EUR/USD',
    'GBP/USD',
    'USD/JPY',
    'USD/CHF',
    'AUD/USD',
    'NZD/USD',
    'USD/CAD',
  ];

  return (
    <div className="bg-[#111622] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col gap-4">
      {/* Top Controls: Instrument Selector, Timeframe, and Screenshot Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Live Chart Terminal
            </span>
          </div>

          {/* Quick Instrument Switcher Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {instrumentOptions.map((sym) => (
              <button
                key={sym}
                onClick={() => onSelectInstrument(sym)}
                className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                  currentInstrument === sym
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setActiveInterval(tf.value)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeInterval === tf.value
                    ? 'bg-slate-800 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Direct Screenshot Capture Button */}
          <button
            onClick={handleCaptureScreen}
            disabled={isCapturing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/50 border border-cyan-400/40 cursor-pointer transition-all"
            title="Ambil tangkapan layar live chart ini dan langsung kirim ke AI Analyzer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCapturing ? 'Menangkap...' : '📸 Screenshot Live Chart'}</span>
          </button>
        </div>
      </div>

      {/* Helper Notification Banner */}
      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-2 font-mono">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Tips Screenshot TradingView:</strong> Anda juga bisa menekan tombol Kamera di kanan atas chart (atau shortcut <kbd className="px-1 py-0.2 bg-slate-800 text-cyan-300 rounded border border-slate-700">Alt + S</kbd>) lalu klik <em>"Salin Gambar"</em> dan tekan <kbd className="px-1 py-0.2 bg-slate-800 text-cyan-300 rounded border border-slate-700">Ctrl + V</kbd> di aplikasi untuk analisa instan!
          </span>
        </div>
      </div>

      {captureStatus && (
        <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-700 text-cyan-200 text-xs font-mono animate-pulse flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span>{captureStatus}</span>
        </div>
      )}

      {/* Main TradingView Live Chart Container */}
      <div className="w-full h-[640px] rounded-xl overflow-hidden border border-slate-800 bg-[#0c1017] shadow-inner relative">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
