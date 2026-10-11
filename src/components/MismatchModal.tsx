import React from 'react';
import { AlertTriangle, Check, ArrowRight } from 'lucide-react';

interface MismatchModalProps {
  isOpen: boolean;
  selectedInstrument: string;
  detectedInstrument: string;
  onConfirmSwitch: () => void;
  onKeepSelected: () => void;
}

export const MismatchModal: React.FC<MismatchModalProps> = ({
  isOpen,
  selectedInstrument,
  detectedInstrument,
  onConfirmSwitch,
  onKeepSelected,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111622] border border-amber-600/60 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-amber-400">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              Pair Discrepancy Detected
            </h3>
            <span className="text-xs text-amber-300">Confirmation Required</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          The AI visual reader detected <strong className="text-cyan-300 font-mono">{detectedInstrument}</strong> on the chart screenshot watermark/header, which differs from your selected pair <strong className="text-amber-300 font-mono">{selectedInstrument}</strong>.
        </p>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block">MANUAL SELECTION</span>
            <span className="text-slate-300 font-bold">{selectedInstrument}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600" />
          <div className="text-right">
            <span className="text-[10px] text-cyan-400 block">AI DETECTED PAIR</span>
            <span className="text-cyan-300 font-bold">{detectedInstrument}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={onConfirmSwitch}
            className="w-full sm:flex-1 py-2 px-3 text-xs font-mono font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
          >
            Switch to {detectedInstrument}
          </button>
          <button
            onClick={onKeepSelected}
            className="w-full sm:flex-1 py-2 px-3 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
          >
            Keep {selectedInstrument}
          </button>
        </div>
      </div>
    </div>
  );
};
