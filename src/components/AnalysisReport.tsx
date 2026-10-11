import React, { useState } from 'react';
import {
  FullAnalysisResult,
  TradeScenario,
} from '../types/trading';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldAlert,
  Target,
  Copy,
  Printer,
  Calculator,
  ChevronDown,
  ChevronUp,
  Eye,
  Info,
  Sliders,
  Check,
} from 'lucide-react';

interface AnalysisReportProps {
  result: FullAnalysisResult;
  onSendToCalculator: (entry: number, sl: number, tp: number, instrument: string) => void;
  onOpenMismatchModal?: () => void;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({
  result,
  onSendToCalculator,
}) => {
  const [copiedPlan, setCopiedPlan] = useState(false);
  const [activeScenarioTab, setActiveScenarioTab] = useState<'preferred' | 'buy' | 'sell'>('preferred');
  const [showIndicatorsDetail, setShowIndicatorsDetail] = useState(false);

  const {
    audit,
    metadata,
    executiveSummary,
    marketBias,
    marketStructure,
    indicators,
    criticalZones,
    multiTimeframeMatrix,
    multiTimeframeSynthesis,
    buyScenario,
    sellScenario,
    preferredSetup,
    qualityScore,
    invalidationConditions,
    noTradeConditions,
    alternativeScenario,
    missingDataAndLimitations,
    riskManagementNotes,
  } = result;

  // Format Copyable Trading Plan
  const handleCopyPlan = () => {
    const isPreferredBuy = preferredSetup.action === 'BUY';
    const planText = `
=== APEX AI TRADING PLAN: ${metadata.analyzedInstrument} (${metadata.tradingMode}) ===
Action: ${preferredSetup.action} [${preferredSetup.biasStrength}]
Entry Type: ${preferredSetup.selectedEntryType}
Assumed Entry Price: ${preferredSetup.entryPriceAssumed}
Stop Loss: ${preferredSetup.stopLossPrice}
Take Profit 1: ${preferredSetup.tp1} (R:R ${preferredSetup.riskRewardTP1})
Take Profit 2: ${preferredSetup.tp2} (R:R ${preferredSetup.riskRewardTP2})
Take Profit 3: ${preferredSetup.tp3} (R:R ${preferredSetup.riskRewardTP3})
Execution Trigger: ${preferredSetup.executionTrigger}
Cancel/Invalidation: ${preferredSetup.expirationOrCancelCondition}
Setup Quality Score: ${qualityScore.totalScore}/100 (${qualityScore.tier})
Timestamp: ${metadata.analysisTimestamp}
======================================================
    `.trim();

    navigator.clipboard.writeText(planText);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Color mapping for Bias
  const getBiasBadge = (bias: string) => {
    if (bias.toLowerCase().includes('bull')) {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold font-mono text-xs">
          <TrendingUp className="w-3.5 h-3.5" /> Bullish
        </span>
      );
    }
    if (bias.toLowerCase().includes('bear')) {
      return (
        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold font-mono text-xs">
          <TrendingDown className="w-3.5 h-3.5" /> Bearish
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold font-mono text-xs">
        <Sliders className="w-3.5 h-3.5" /> Neutral / Range
      </span>
    );
  };

  // Score Badge
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
    if (score >= 70) return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/30';
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* 1. TOP HEADER & ACTION CONTROLS */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-lg font-bold text-white font-mono tracking-wide">
              {metadata.analyzedInstrument}
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {metadata.analyzedTimeframe}
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-cyan-950 text-cyan-300 border border-cyan-800">
              {metadata.tradingMode}
            </span>
            {metadata.estimatedCurrentPrice && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-xs font-mono text-slate-400">
                  Last Chart Price: <strong className="text-white">{metadata.estimatedCurrentPrice}</strong>
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Analysis Timestamp: {new Date(metadata.analysisTimestamp).toLocaleString()} UTC
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Copy systematic trading plan to clipboard"
          >
            {copiedPlan ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedPlan ? 'Copied Plan!' : 'Copy Plan'}</span>
          </button>
          <button
            onClick={() =>
              onSendToCalculator(
                preferredSetup.entryPriceAssumed,
                preferredSetup.stopLossPrice,
                preferredSetup.tp1,
                metadata.analyzedInstrument
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 transition-colors cursor-pointer"
            title="Transfer trade numbers to Risk Management Calculator"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Load to Calculator</span>
          </button>
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Print or export PDF report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export / Print</span>
          </button>
        </div>
      </div>

      {/* WARNING NOTIFICATIONS IF APPLICABLE */}
      {audit.instrumentMismatchDetected && audit.mismatchWarning && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/60 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold uppercase tracking-wider text-amber-300">
              Discrepancy Warning: Instrument Mismatch Detected
            </h4>
            <p className="leading-relaxed">{audit.mismatchWarning}</p>
            <p className="text-[11px] text-amber-400/80">
              Chart appears to show <strong>{audit.instrumentIdentified}</strong> while user selected <strong>{metadata.analyzedInstrument}</strong>.
            </p>
          </div>
        </div>
      )}

      {audit.highVolatilityWarning && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-700 text-rose-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>High Volatility Warning:</strong> Large expansion candle or high-frequency news event detected on chart. Re-check real-time broker spreads before executing.
          </span>
        </div>
      )}

      {/* 2. SECTION 1: EXECUTIVE SUMMARY */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              01. Executive Summary
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Primary Bias:</span>
            {getBiasBadge(marketBias.primaryTrend)}
          </div>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {executiveSummary}
        </p>
      </div>

      {/* 3. SECTION 11 & 14: PREFERRED TRADING SETUP & QUALITY SCORE HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Preferred Setup Banner (2 Cols) */}
        <div className="lg:col-span-2 bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Preferred Trading Setup
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Conviction:</span>
                <span className="text-xs font-semibold font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {preferredSetup.biasStrength}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-900/90 border border-slate-800 mb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  Recommended Action
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-2xl font-black font-mono tracking-tight ${
                      preferredSetup.action === 'BUY'
                        ? 'text-emerald-400'
                        : preferredSetup.action === 'SELL'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {preferredSetup.action}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({preferredSetup.selectedEntryType})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center sm:text-right font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Entry</span>
                  <span className="text-sm font-bold text-white">
                    {preferredSetup.entryPriceAssumed}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-400 block uppercase">Stop Loss</span>
                  <span className="text-sm font-bold text-rose-300">
                    {preferredSetup.stopLossPrice}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 block uppercase">Take Profit 1</span>
                  <span className="text-sm font-bold text-emerald-300">
                    {preferredSetup.tp1}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                <strong className="text-slate-200">Execution Trigger:</strong> {preferredSetup.executionTrigger}
              </p>
              <p>
                <strong className="text-slate-200">Cancellation / Invalidation:</strong>{' '}
                <span className="text-rose-300">{preferredSetup.expirationOrCancelCondition}</span>
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>R:R Profile: TP1 ({preferredSetup.riskRewardTP1}) · TP2 ({preferredSetup.riskRewardTP2}) · TP3 ({preferredSetup.riskRewardTP3})</span>
          </div>
        </div>

        {/* Quality Score Hero Card (1 Col) */}
        <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                14. Setup Quality Score
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">0-100 Internal</span>
            </div>

            {/* Score Ring / Number */}
            <div className="flex items-center justify-center my-3">
              <div
                className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center shadow-lg ${getScoreColor(
                  qualityScore.totalScore
                )}`}
              >
                <span className="text-3xl font-black font-mono leading-none">
                  {qualityScore.totalScore}
                </span>
                <span className="text-[10px] font-mono mt-1 opacity-80">/ 100</span>
              </div>
            </div>

            <div className="text-center mb-3">
              <span
                className={`text-xs font-bold font-mono px-2.5 py-1 rounded border ${getScoreColor(
                  qualityScore.totalScore
                )}`}
              >
                {qualityScore.tier}
              </span>
            </div>

            {/* 7-Rubric Component Breakdown */}
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Structure Clarity (max 20)</span>
                <span className="text-slate-200">{qualityScore.breakdown.marketStructureClarity}/20</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${(qualityScore.breakdown.marketStructureClarity / 20) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-slate-400 pt-1">
                <span>Trend Alignment (max 20)</span>
                <span className="text-slate-200">{qualityScore.breakdown.trendAlignment}/20</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-400 h-full rounded-full"
                  style={{ width: `${(qualityScore.breakdown.trendAlignment / 20) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-slate-400 pt-1">
                <span>Zone Proximity & Trigger (max 30)</span>
                <span className="text-slate-200">
                  {qualityScore.breakdown.proximityToCriticalZone + qualityScore.breakdown.entryConfirmationQuality}/30
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{
                    width: `${
                      ((qualityScore.breakdown.proximityToCriticalZone + qualityScore.breakdown.entryConfirmationQuality) / 30) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 pt-3 border-t border-slate-800 mt-3 italic">
            * Confluence score represents internal structural clarity, NOT win-rate probability or financial guarantee.
          </p>
        </div>
      </div>

      {/* 4. SECTION 3, 4, 5: MARKET BIAS, STRUCTURE & AUDIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Market Bias & Phases */}
        <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              03. Market Bias & Phase
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 font-mono text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Primary Trend</span>
              <span className="font-semibold text-slate-200">{marketBias.primaryTrend}</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Secondary Trend</span>
              <span className="font-semibold text-slate-200">{marketBias.secondaryTrend}</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 mb-3 font-mono text-xs">
            <span className="text-[10px] text-slate-500 block uppercase">Current Market Phase</span>
            <span className="font-semibold text-cyan-300">{marketBias.currentMarketPhase}</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {marketBias.biasSummary}
          </p>
        </div>

        {/* Market Structure Details */}
        <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              04. Market Structure Components
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Structure Type & Swings:
              </span>
              <p className="text-slate-200">{marketStructure.structureType} · {marketStructure.keySwingPoints}</p>
            </div>

            <div className="flex flex-col gap-0.5 border-t border-slate-800/60 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                BOS / CHoCH Events:
              </span>
              <p className="text-slate-200 font-mono text-[11px]">{marketStructure.bosChochEvents}</p>
            </div>

            <div className="flex flex-col gap-0.5 border-t border-slate-800/60 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Liquidity Pool / Sweep State:
              </span>
              <p className="text-slate-200">{marketStructure.liquidityState}</p>
            </div>

            <div className="flex flex-col gap-0.5 border-t border-slate-800/60 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Momentum Assessment:
              </span>
              <p className="text-slate-200">{marketStructure.momentumAssessment}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECTION 7: CRITICAL ZONES & INVALIDATION LEVELS */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              07. Market Structure & Critical Zones
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Calibrated Price Boundaries
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs mb-4">
          {/* Critical Resistance Zone */}
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/50">
            <div className="flex items-center justify-between text-rose-400 text-[11px] font-bold mb-1">
              <span>CRITICAL RESISTANCE</span>
              <span className="text-[10px] bg-rose-900/50 px-1.5 py-0.2 rounded">
                {criticalZones.resistanceZone.confidencePercent}% Conf.
              </span>
            </div>
            <div className="text-base font-bold text-white mb-1">
              {criticalZones.resistanceZone.low} - {criticalZones.resistanceZone.high}
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              {criticalZones.resistanceZone.rationale}
            </p>
          </div>

          {/* Critical Support Zone */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/50">
            <div className="flex items-center justify-between text-emerald-400 text-[11px] font-bold mb-1">
              <span>CRITICAL SUPPORT</span>
              <span className="text-[10px] bg-emerald-900/50 px-1.5 py-0.2 rounded">
                {criticalZones.supportZone.confidencePercent}% Conf.
              </span>
            </div>
            <div className="text-base font-bold text-white mb-1">
              {criticalZones.supportZone.low} - {criticalZones.supportZone.high}
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              {criticalZones.supportZone.rationale}
            </p>
          </div>

          {/* No-Trade Zone */}
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/50">
            <div className="flex items-center justify-between text-amber-400 text-[11px] font-bold mb-1">
              <span>NO-TRADE ZONE (CHOP)</span>
            </div>
            <div className="text-base font-bold text-white mb-1">
              {criticalZones.noTradeZone.range}
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              {criticalZones.noTradeZone.reason}
            </p>
          </div>
        </div>

        {/* Structural Invalidation Levels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80">
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-rose-400 block uppercase font-bold">
              Bullish Invalidation
            </span>
            <span className="text-sm font-bold text-white">
              {criticalZones.bullishInvalidation.price}
            </span>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              {criticalZones.bullishInvalidation.rationale}
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-emerald-400 block uppercase font-bold">
              Bearish Invalidation
            </span>
            <span className="text-sm font-bold text-white">
              {criticalZones.bearishInvalidation.price}
            </span>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              {criticalZones.bearishInvalidation.rationale}
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-cyan-400 block uppercase font-bold">
              Breakout Trigger Zone
            </span>
            <span className="text-sm font-bold text-white">
              {criticalZones.breakoutConfirmation.zone}
            </span>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              {criticalZones.breakoutConfirmation.rationale}
            </p>
          </div>

          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-indigo-400 block uppercase font-bold">
              Potential Reversal Zone
            </span>
            <span className="text-sm font-bold text-white">
              {criticalZones.potentialReversalZone.zone}
            </span>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              {criticalZones.potentialReversalZone.rationale}
            </p>
          </div>
        </div>
      </div>

      {/* 6. SECTION 8: MULTI-TIMEFRAME ANALYSIS TABLE */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              08. Multi-Timeframe Matrix
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Structured Confluence Hierarchy
          </span>
        </div>

        <div className="overflow-x-auto mb-3">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2 px-3">Timeframe</th>
                <th className="py-2 px-3">Trend</th>
                <th className="py-2 px-3">Market Structure</th>
                <th className="py-2 px-3">Critical Zone</th>
                <th className="py-2 px-3">Bias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {multiTimeframeMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2 px-3 font-bold text-cyan-300">{row.timeframe}</td>
                  <td className="py-2 px-3 text-slate-300">{row.trend}</td>
                  <td className="py-2 px-3 text-slate-300">{row.marketStructure}</td>
                  <td className="py-2 px-3 text-slate-400">{row.criticalZone}</td>
                  <td className="py-2 px-3">{getBiasBadge(row.bias)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
          <strong>Multi-TF Synthesis:</strong> {multiTimeframeSynthesis}
        </p>
      </div>

      {/* 7. SECTION 9 & 10: ENTRY ENGINE DUAL SCENARIOS (BUY vs SELL) */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              09 & 10. Entry Engine: Scenario A (BUY) vs Scenario B (SELL)
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveScenarioTab('buy')}
              className={`px-3 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                activeScenarioTab === 'buy'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BUY Scenario
            </button>
            <button
              onClick={() => setActiveScenarioTab('sell')}
              className={`px-3 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                activeScenarioTab === 'sell'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SELL Scenario
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* BUY SETUP CARD */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              preferredSetup.action === 'BUY'
                ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                : 'bg-slate-900/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  SCENARIO A: BUY
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {buyScenario.entryType}
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                {buyScenario.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">ENTRY ZONE</span>
                <span className="text-sm font-bold text-white">
                  {buyScenario.entryZone.min} - {buyScenario.entryZone.max}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-rose-400 block">STOP LOSS</span>
                <span className="text-sm font-bold text-rose-300">{buyScenario.stopLoss}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-3 text-center">
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">TP1 (R:R {buyScenario.riskRewardRatioTP1})</span>
                <span className="font-bold text-emerald-300">{buyScenario.takeProfit1}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">TP2 (R:R {buyScenario.riskRewardRatioTP2})</span>
                <span className="font-bold text-emerald-300">{buyScenario.takeProfit2}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">TP3 (R:R {buyScenario.riskRewardRatioTP3})</span>
                <span className="font-bold text-emerald-300">{buyScenario.takeProfit3}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <p>
                <strong className="text-slate-200">Confirmation Trigger:</strong> {buyScenario.confirmationTrigger}
              </p>
              <p>
                <strong className="text-slate-200">Technical Rationale:</strong> {buyScenario.technicalRationale}
              </p>
              <p>
                <strong className="text-slate-200">Invalidation:</strong>{' '}
                <span className="text-rose-400">{buyScenario.invalidationCondition}</span>
              </p>
            </div>
          </div>

          {/* SELL SETUP CARD */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              preferredSetup.action === 'SELL'
                ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/30'
                : 'bg-slate-900/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-950 text-rose-300 border border-rose-800">
                  SCENARIO B: SELL
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {sellScenario.entryType}
                </span>
              </div>
              <span className="text-[11px] font-mono text-rose-400">
                {sellScenario.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">ENTRY ZONE</span>
                <span className="text-sm font-bold text-white">
                  {sellScenario.entryZone.min} - {sellScenario.entryZone.max}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-rose-400 block">STOP LOSS</span>
                <span className="text-sm font-bold text-rose-300">{sellScenario.stopLoss}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-3 text-center">
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">TP1 (R:R {sellScenario.riskRewardRatioTP1})</span>
                <span className="font-bold text-emerald-300">{sellScenario.takeProfit1}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">TP2 (R:R {sellScenario.riskRewardRatioTP2})</span>
                <span className="font-bold text-emerald-300">{sellScenario.takeProfit2}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">TP3 (R:R {sellScenario.riskRewardRatioTP3})</span>
                <span className="font-bold text-emerald-300">{sellScenario.takeProfit3}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <p>
                <strong className="text-slate-200">Confirmation Trigger:</strong> {sellScenario.confirmationTrigger}
              </p>
              <p>
                <strong className="text-slate-200">Technical Rationale:</strong> {sellScenario.technicalRationale}
              </p>
              <p>
                <strong className="text-slate-200">Invalidation:</strong>{' '}
                <span className="text-rose-400">{sellScenario.invalidationCondition}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 8. SECTION 12 & 13: STOP LOSS, TAKE PROFIT & RISK-TO-REWARD LADDER */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              12 & 13. Stop Loss & Take Profit Visual Ladder
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Direct Mathematical Verification
          </span>
        </div>

        {/* Visual Price Ladder */}
        <div className="space-y-2 font-mono text-xs max-w-2xl mx-auto">
          {/* Target 3 */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-bold text-emerald-300">TAKE PROFIT 3 (Expansion Target)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">R:R {preferredSetup.riskRewardTP3}</span>
              <span className="text-sm font-bold text-emerald-300">{preferredSetup.tp3}</span>
            </div>
          </div>

          {/* Target 2 */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-emerald-300">TAKE PROFIT 2 (Major Swing Target)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">R:R {preferredSetup.riskRewardTP2}</span>
              <span className="text-sm font-bold text-emerald-300">{preferredSetup.tp2}</span>
            </div>
          </div>

          {/* Target 1 */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/15 border border-emerald-800/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-400">TAKE PROFIT 1 (First Resistance/Support)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">R:R {preferredSetup.riskRewardTP1}</span>
              <span className="text-sm font-bold text-emerald-300">{preferredSetup.tp1}</span>
            </div>
          </div>

          {/* Entry Level */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 shadow-sm my-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              <span className="font-bold text-cyan-200 uppercase">
                {preferredSetup.action} ENTRY POINT
              </span>
            </div>
            <span className="text-base font-bold text-white">
              {preferredSetup.entryPriceAssumed}
            </span>
          </div>

          {/* Stop Loss Level */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="font-bold text-rose-300">STOP LOSS (Structural Invalidation)</span>
            </div>
            <span className="text-sm font-bold text-rose-300">{preferredSetup.stopLossPrice}</span>
          </div>
        </div>
      </div>

      {/* 9. TECHNICAL INDICATORS AUDIT (Only visible indicators verified) */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowIndicatorsDetail(!showIndicatorsDetail)}
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Technical Indicators Audit (Visible vs Missing)
            </h3>
          </div>
          <button className="text-slate-400 hover:text-white">
            {showIndicatorsDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showIndicatorsDetail && (
          <div className="mt-4 pt-4 border-t border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-3">Indicator</th>
                  <th className="py-2 px-3">Visual Status</th>
                  <th className="py-2 px-3">Observed Reading</th>
                  <th className="py-2 px-3">Technical Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {indicators.map((ind, i) => (
                  <tr key={i} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-semibold text-slate-200">{ind.name}</td>
                    <td className="py-2 px-3">
                      {ind.visible ? (
                        <span className="text-emerald-400 font-medium">Visible on Chart</span>
                      ) : (
                        <span className="text-slate-500">Tidak tersedia / Not Visible</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-300">{ind.reading}</td>
                    <td className="py-2 px-3 text-slate-400">{ind.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 10. SECTION 15, 16, 17, 18, 19: CONDITIONS & PROTOCOLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Invalidation & No-Trade Conditions */}
        <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono mb-2 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" /> 15. Invalidation Conditions
            </h4>
            <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
              {invalidationConditions.map((cond, i) => (
                <li key={i}>{cond}</li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> 16. No-Trade Conditions
            </h4>
            <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
              {noTradeConditions.map((cond, i) => (
                <li key={i}>{cond}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Alternative Scenario & Limitations */}
        <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> 17. Alternative Scenario
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {alternativeScenario}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> 18. Missing Data & Visual Limitations
            </h4>
            <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
              {missingDataAndLimitations.map((limit, i) => (
                <li key={i}>{limit}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 11. SECTION 19: RISK MANAGEMENT NOTES */}
      <div className="bg-[#111622] rounded-xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            19. Professional Risk Management Notes
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {riskManagementNotes}
        </p>
      </div>
    </div>
  );
};
