import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { AnalysisReport } from './components/AnalysisReport';
import { RiskCalculator } from './components/RiskCalculator';
import { SeasonalityModule } from './components/SeasonalityModule';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ChartLightbox } from './components/ChartLightbox';
import { MismatchModal } from './components/MismatchModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  ChartImagePayload,
  FullAnalysisResult,
  HistoryRecord,
  InstrumentSymbol,
  Timeframe,
  TradingMode,
} from './types/trading';
import { AlertCircle, BarChart2, Smartphone, Download } from 'lucide-react';

const STORAGE_KEY = 'apex_ai_analysis_history';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'seasonality' | 'calculator'>('analyzer');
  const [currentMode, setCurrentMode] = useState<TradingMode>('INTRADAY');

  // Chart upload states
  const [images, setImages] = useState<ChartImagePayload[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentSymbol | 'AUTO'>('AUTO');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe | 'AUTO'>('AUTO');
  const [knownPrice, setKnownPrice] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');

  // Execution states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FullAnalysisResult | null>(null);

  // Modals & Panels
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [inspectingImage, setInspectingImage] = useState<ChartImagePayload | null>(null);
  const [mismatchState, setMismatchState] = useState<{
    isOpen: boolean;
    detected: string;
    selected: string;
  } | null>(null);

  // PWA hook status
  const { isInstalled } = usePWAInstall();

  // Calculator pre-fill data
  const [calcPrefill, setCalcPrefill] = useState<{
    entry: number;
    sl: number;
    tp: number;
    instrument: string;
  } | null>(null);

  // Load history from localStorage on first render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse history from localStorage', e);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (result: FullAnalysisResult, thumbnail: string) => {
    try {
      const newRecord: HistoryRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: result.metadata.analysisTimestamp,
        instrument: result.metadata.analyzedInstrument,
        timeframe: result.metadata.analyzedTimeframe,
        tradingMode: result.metadata.tradingMode,
        preferredAction: result.preferredSetup.action,
        score: result.qualityScore.totalScore,
        thumbnail,
        result,
      };
      const updated = [newRecord, ...history.slice(0, 19)]; // Keep latest 20
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save record to localStorage', err);
    }
  };

  const handleDeleteHistoryRecord = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    setAnalysisResult(record.result);
    setCurrentMode(record.tradingMode);
    setActiveTab('analyzer');
  };

  // Run AI Multimodal Analysis
  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const payload = {
        images: images.map((img) => ({
          data: img.data,
          mimeType: img.mimeType,
          label: img.name,
        })),
        selectedInstrument: selectedInstrument === 'AUTO' ? undefined : selectedInstrument,
        selectedTimeframe: selectedTimeframe === 'AUTO' ? undefined : selectedTimeframe,
        tradingMode: currentMode,
        knownPrice: knownPrice ? parseFloat(knownPrice) : undefined,
        userNotes: userNotes.trim() || undefined,
      };

      const res = await fetch('/api/analyze-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const result: FullAnalysisResult = await res.json();
      setAnalysisResult(result);

      // Check if pair mismatch detected
      if (
        result.audit.instrumentMismatchDetected &&
        selectedInstrument !== 'AUTO' &&
        result.audit.instrumentIdentified &&
        result.audit.instrumentIdentified !== 'Unidentified / Relies on User Input' &&
        result.audit.instrumentIdentified !== selectedInstrument
      ) {
        setMismatchState({
          isOpen: true,
          detected: result.audit.instrumentIdentified,
          selected: selectedInstrument,
        });
      }

      // Archive in history
      saveToHistory(result, images[0]?.previewUrl || '');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setAnalysisError(err.message || 'An unexpected error occurred during chart analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send parameters to Risk Calculator
  const handleSendToCalculator = (
    entry: number,
    sl: number,
    tp: number,
    instrument: string
  ) => {
    setCalcPrefill({ entry, sl, tp, instrument });
    setActiveTab('calculator');
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e2e8f0] flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Quantitative Header */}
      <Header
        currentMode={currentMode}
        onModeChange={(m) => setCurrentMode(m)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Mobile Install Promotion Banner (if not already installed) */}
        {!isInstalled && (
          <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white font-mono">
                  Instal ke HP Android & iPhone
                </p>
                <p className="text-slate-400 text-[11px]">
                  Nikmati pengalaman terminal trading mandiri (PWA) tanpa address bar browser.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 border border-cyan-400/40 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Petunjuk & Instal</span>
            </button>
          </div>
        )}

        {activeTab === 'analyzer' && (
          <div className="space-y-6">
            {/* Upload & Configuration Section */}
            <UploadArea
              images={images}
              onImagesChange={setImages}
              selectedInstrument={selectedInstrument}
              onInstrumentChange={setSelectedInstrument}
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
              tradingMode={currentMode}
              onTradingModeChange={setCurrentMode}
              knownPrice={knownPrice}
              onKnownPriceChange={setKnownPrice}
              userNotes={userNotes}
              onUserNotesChange={setUserNotes}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              onInspectImage={(img) => setInspectingImage(img)}
            />

            {/* Error Message */}
            {analysisError && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold uppercase tracking-wider font-mono">
                    Analysis Execution Error
                  </h4>
                  <p>{analysisError}</p>
                </div>
              </div>
            )}

            {/* Analysis Report Output (Full 19 sections) */}
            {analysisResult && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Institutional Technical Analysis Report
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: {analysisResult.metadata.analysisTimestamp.substring(0, 19)}
                  </span>
                </div>

                <AnalysisReport
                  result={analysisResult}
                  onSendToCalculator={handleSendToCalculator}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'seasonality' && (
          <SeasonalityModule
            currentInstrument={
              selectedInstrument !== 'AUTO' ? selectedInstrument : 'XAUUSD'
            }
          />
        )}

        {activeTab === 'calculator' && (
          <div className="space-y-4">
            <RiskCalculator
              initialEntry={calcPrefill?.entry}
              initialSL={calcPrefill?.sl}
              initialTP={calcPrefill?.tp}
              initialInstrument={calcPrefill?.instrument}
            />
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      <ChartLightbox
        image={inspectingImage}
        onClose={() => setInspectingImage(null)}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectRecord={handleSelectHistoryRecord}
        onDeleteRecord={handleDeleteHistoryRecord}
        onClearHistory={handleClearHistory}
      />

      {/* PWA Install Modal (Android & iPhone) */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Instrument Mismatch Confirmation Modal */}
      {mismatchState && (
        <MismatchModal
          isOpen={mismatchState.isOpen}
          selectedInstrument={mismatchState.selected}
          detectedInstrument={mismatchState.detected}
          onConfirmSwitch={() => {
            setSelectedInstrument(mismatchState.detected as InstrumentSymbol);
            setMismatchState(null);
          }}
          onKeepSelected={() => {
            setMismatchState(null);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0d13] px-4 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Apex AI Trading Analyst · Quantitative Technical Architecture</span>
          <span className="text-[11px] text-slate-600">
            PWA Standalone Ready · Android & iPhone Support
          </span>
        </div>
      </footer>
    </div>
  );
}
