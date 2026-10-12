import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Sparkles, Sliders } from 'lucide-react';
import { FullAnalysisResult } from '../types/trading';

interface VoiceNarratorProps {
  result: FullAnalysisResult;
  autoPlayDefault?: boolean;
}

export const VoiceNarrator: React.FC<VoiceNarratorProps> = ({ result, autoPlayDefault = true }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('apex_voice_autoplay');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasAutoPlayedRef = useRef<string | null>(null);

  // Generate clear Indonesian speech script
  const generateIndonesianScript = (): string => {
    const { metadata, marketBias, preferredSetup, qualityScore, executiveSummary } = result;

    const actionText =
      preferredSetup.action === 'BUY'
        ? 'Beli atau BUY'
        : preferredSetup.action === 'SELL'
        ? 'Jual atau SELL'
        : 'Wait and See, atau Hindari Trade Sementara';

    let script = `Laporan Analisis Apex AI untuk instrumen ${metadata.analyzedInstrument}, pada mode ${metadata.tradingMode}. `;
    script += `Kecenderungan pasar utama adalah ${marketBias.primaryTrend}, fase ${marketBias.currentMarketPhase}. `;
    script += `Rekomendasi setup adalah ${actionText}, dengan keyakinan ${preferredSetup.biasStrength}. `;

    if (preferredSetup.action !== 'WAIT / NO TRADE') {
      script += `Level Entry diasumsikan pada ${preferredSetup.entryPriceAssumed}. `;
      script += `Stop Loss dipasang pada ${preferredSetup.stopLossPrice}. `;
      script += `Target Take Profit satu pada ${preferredSetup.tp1}, dengan rasio Risk to Reward ${preferredSetup.riskRewardTP1}. `;
    }

    script += `Skor kualitas setup sebesar ${qualityScore.totalScore} dari 100, tergolong ${qualityScore.tier}. `;

    // Append short executive summary excerpt (up to 2 sentences)
    if (executiveSummary) {
      const firstSentence = executiveSummary.split('.')[0];
      if (firstSentence) {
        script += `Catatan analis: ${firstSentence}.`;
      }
    }

    return script;
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const playSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Browser Anda belum mendukung Web Speech Synthesis.');
      return;
    }

    // Stop current speech
    window.speechSynthesis.cancel();

    const textToSpeak = generateIndonesianScript();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Pick best Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.includes('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia'));
    if (idVoice) {
      utterance.voice = idVoice;
      utterance.lang = idVoice.lang;
    } else {
      utterance.lang = 'id-ID';
    }

    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseOrResume = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      playSpeech();
    }
  };

  // Auto-Play Voice when a new analysis report appears
  useEffect(() => {
    const analysisId = result.metadata.analysisTimestamp;
    if (autoPlayEnabled && hasAutoPlayedRef.current !== analysisId) {
      hasAutoPlayedRef.current = analysisId;
      // Slight delay to let UI render first
      const timer = setTimeout(() => {
        playSpeech();
      }, 700);
      return () => clearTimeout(timer);
    }

    return () => {
      stopSpeech();
    };
  }, [result.metadata.analysisTimestamp, autoPlayEnabled]);

  const toggleAutoPlay = (enabled: boolean) => {
    setAutoPlayEnabled(enabled);
    try {
      localStorage.setItem('apex_voice_autoplay', JSON.stringify(enabled));
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-xl p-3.5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Left: Status & Audio Waveform Animation */}
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            isPlaying && !isPaused
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/50 animate-pulse'
              : 'bg-slate-800 text-cyan-400 border border-slate-700'
          }`}
        >
          <Volume2 className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Narasi Suara AI (Indonesian Voice)
            </span>
            {isPlaying && !isPaused && (
              <span className="inline-flex items-center gap-0.5 ml-1">
                <span className="w-1 h-3 bg-cyan-400 animate-[bounce_0.6s_infinite] rounded-full" />
                <span className="w-1 h-4.5 bg-emerald-400 animate-[bounce_0.8s_infinite] rounded-full" />
                <span className="w-1 h-2 bg-blue-400 animate-[bounce_0.5s_infinite] rounded-full" />
                <span className="w-1 h-4 bg-cyan-300 animate-[bounce_0.7s_infinite] rounded-full" />
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {isPlaying && !isPaused
              ? 'Sedang membacakan ringkasan trading dan level kunci...'
              : isPaused
              ? 'Suara dijeda. Klik Lanjutkan.'
              : 'Dengarkan pembacaan ringkasan analisis secara otomatis'}
          </p>
        </div>
      </div>

      {/* Right: Controls (Play / Pause / Stop / Speed / Autoplay Toggle) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={pauseOrResume}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
            isPlaying && !isPaused
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950'
          }`}
          title={isPlaying && !isPaused ? 'Jeda suara' : 'Putar suara'}
        >
          {isPlaying && !isPaused ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Jeda</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPaused ? 'Lanjutkan' : 'Dengarkan'}</span>
            </>
          )}
        </button>

        {/* Stop Button */}
        {isPlaying && (
          <button
            onClick={stopSpeech}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 transition-colors cursor-pointer"
            title="Hentikan narasi suara"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        )}

        {/* Speed Selector */}
        <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-[11px] font-mono">
          <button
            onClick={() => {
              setSpeechRate(1.0);
              if (isPlaying) {
                stopSpeech();
                setTimeout(playSpeech, 100);
              }
            }}
            className={`px-1.5 py-0.5 rounded cursor-pointer ${
              speechRate === 1.0 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            1.0x
          </button>
          <button
            onClick={() => {
              setSpeechRate(1.2);
              if (isPlaying) {
                stopSpeech();
                setTimeout(playSpeech, 100);
              }
            }}
            className={`px-1.5 py-0.5 rounded cursor-pointer ${
              speechRate === 1.2 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            1.2x
          </button>
        </div>

        {/* Auto-Play Checkbox */}
        <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 cursor-pointer hover:text-slate-200 select-none ml-1">
          <input
            type="checkbox"
            checked={autoPlayEnabled}
            onChange={(e) => toggleAutoPlay(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
          />
          <span>Auto-Play</span>
        </label>
      </div>
    </div>
  );
};
