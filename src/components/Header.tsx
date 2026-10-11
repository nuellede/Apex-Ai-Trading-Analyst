import React, { useState, useEffect } from 'react';
import { TradingMode } from '../types/trading';
import {
  Activity,
  Clock,
  ShieldCheck,
  History,
  BarChart3,
  Sparkles,
  Smartphone,
} from 'lucide-react';

interface HeaderProps {
  currentMode: TradingMode;
  onModeChange: (mode: TradingMode) => void;
  activeTab: 'analyzer' | 'seasonality' | 'calculator';
  onTabChange: (tab: 'analyzer' | 'seasonality' | 'calculator') => void;
  onOpenHistory: () => void;
  historyCount: number;
  onOpenInstallModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  activeTab,
  onTabChange,
  onOpenHistory,
  historyCount,
  onOpenInstallModal,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [sessions, setSessions] = useState<{ name: string; isOpen: boolean; hours: string }[]>([]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getUTCHours();
      const minutes = now.getUTCMinutes();
      const seconds = now.getUTCSeconds();
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} UTC`;
      setUtcTime(timeStr);

      // Session calculations based on UTC
      // Sydney: 21:00 - 06:00 UTC
      const sydneyOpen = hours >= 21 || hours < 6;
      // Tokyo: 00:00 - 09:00 UTC
      const tokyoOpen = hours >= 0 && hours < 9;
      // London: 07:00 - 15:30 UTC
      const londonOpen = (hours > 7 || (hours === 7 && minutes >= 0)) && (hours < 15 || (hours === 15 && minutes <= 30));
      // New York: 12:00 - 20:30 UTC
      const nyOpen = (hours > 12 || (hours === 12 && minutes >= 0)) && (hours < 20 || (hours === 20 && minutes <= 30));

      setSessions([
        { name: 'Tokyo', isOpen: tokyoOpen, hours: '00-09 UTC' },
        { name: 'London', isOpen: londonOpen, hours: '07-15:30 UTC' },
        { name: 'New York', isOpen: nyOpen, hours: '12-20:30 UTC' },
        { name: 'Sydney', isOpen: sydneyOpen, hours: '21-06 UTC' },
      ]);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-800/80 bg-[#0d111a]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Utility Bar with Real-Time Market Session Status */}
      <div className="border-b border-slate-800/40 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{utcTime || 'Loading UTC...'}</span>
          </div>
          <span className="text-slate-700 hidden sm:inline" aria-hidden="true">|</span>
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-slate-500 font-medium">Global Sessions:</span>
            {sessions.map((s) => (
              <div key={s.name} className="flex items-center gap-1 text-[11px]">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    s.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span className={s.isOpen ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-[11px]">
          {/* In-App Mobile Install Button */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 text-cyan-300 hover:text-white transition-all bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 px-2.5 py-0.5 rounded border border-cyan-500/40 cursor-pointer shadow-sm hover:shadow-cyan-950"
            title="Instal aplikasi ke HP Android atau iPhone"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">Instal di HP (Android / iOS)</span>
          </button>

          <span className="text-slate-400 font-mono hidden md:flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Strict Visual Evidence
          </span>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors bg-slate-800/60 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 cursor-pointer"
            title="View saved chart analysis history"
          >
            <History className="w-3 h-3 text-slate-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1 py-0.1 text-[10px] bg-cyan-950 text-cyan-300 rounded border border-cyan-800">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Terminal Branding & Navigation Controls */}
      <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-950/40 border border-cyan-400/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white font-sans uppercase">
                Apex AI Trading Analyst
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-wider bg-slate-800 text-cyan-400 border border-slate-700 rounded font-semibold">
                QUANT TERMINAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multimodal Visual Technical Analysis · Forex & Gold (XAUUSD)
            </p>
          </div>
        </div>

        {/* Center: Primary Tab Controls */}
        <div className="flex items-center p-1 bg-slate-900/90 rounded-lg border border-slate-800">
          <button
            onClick={() => onTabChange('analyzer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'analyzer'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chart Analyzer</span>
          </button>
          <button
            onClick={() => onTabChange('seasonality')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'seasonality'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Seasonality & Tendency</span>
          </button>
          <button
            onClick={() => onTabChange('calculator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Risk Calculator</span>
          </button>
        </div>

        {/* Right: Trading Mode Segmented Control (Mode 1: Scalping, Mode 2: Intraday, Mode 3: Swing) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 hidden lg:inline">
            Mode:
          </span>
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800">
            {(['SCALPING', 'INTRADAY', 'SWING'] as TradingMode[]).map((mode) => {
              const isActive = currentMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={`px-3 py-1 text-xs font-medium rounded-md font-mono transition-all cursor-pointer ${
                    isActive
                      ? mode === 'SCALPING'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : mode === 'INTRADAY'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
