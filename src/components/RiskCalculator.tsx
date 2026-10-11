import React, { useState, useEffect } from 'react';
import { InstrumentSymbol } from '../types/trading';
import { ShieldCheck, AlertTriangle, Calculator, RefreshCw, Info } from 'lucide-react';

interface RiskCalculatorProps {
  initialEntry?: number;
  initialSL?: number;
  initialTP?: number;
  initialInstrument?: string;
}

export const RiskCalculator: React.FC<RiskCalculatorProps> = ({
  initialEntry,
  initialSL,
  initialTP,
  initialInstrument,
}) => {
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [customRisk, setCustomRisk] = useState<string>('');
  const [isCustomRisk, setIsCustomRisk] = useState<boolean>(false);

  const [instrument, setInstrument] = useState<InstrumentSymbol>(
    (initialInstrument as InstrumentSymbol) || 'XAUUSD'
  );
  const [accountCurrency, setAccountCurrency] = useState<string>('USD');

  const [entryPrice, setEntryPrice] = useState<number>(initialEntry || 2655.40);
  const [slPrice, setSlPrice] = useState<number>(initialSL || 2648.20);
  const [tpPrice, setTpPrice] = useState<number>(initialTP || 2672.00);

  // Contract size presets based on instrument
  const [contractSize, setContractSize] = useState<number>(100); // 100oz for gold
  const [pipValuePerLot, setPipValuePerLot] = useState<number>(10);

  // Update defaults when instrument changes
  useEffect(() => {
    if (instrument === 'XAUUSD') {
      setContractSize(100); // 100 oz
      setPipValuePerLot(10.0); // 1 pip ($0.10) on 1 lot = $10
    } else if (instrument === 'USD/JPY') {
      setContractSize(100000);
      setPipValuePerLot(6.7); // Approximate USD value of 1 pip on USDJPY
    } else {
      setContractSize(100000); // Standard 100k lot
      setPipValuePerLot(10.0);
    }
  }, [instrument]);

  // Sync props if passed from analysis report
  useEffect(() => {
    if (initialEntry) setEntryPrice(initialEntry);
    if (initialSL) setSlPrice(initialSL);
    if (initialTP) setTpPrice(initialTP);
    if (initialInstrument) setInstrument(initialInstrument as InstrumentSymbol);
  }, [initialEntry, initialSL, initialTP, initialInstrument]);

  const activeRiskPercent = isCustomRisk ? parseFloat(customRisk) || 0 : riskPercent;
  const cashRiskAmount = (accountBalance * activeRiskPercent) / 100;

  // Price distance
  const priceDiffSL = Math.abs(entryPrice - slPrice);
  const priceDiffTP = Math.abs(tpPrice - entryPrice);

  // Pip calculation
  const pipMultiplier = instrument === 'XAUUSD' ? 10 : instrument.includes('JPY') ? 100 : 10000;
  const pipsAtRisk = priceDiffSL * pipMultiplier;
  const pipsAtReward = priceDiffTP * pipMultiplier;

  // Position Sizing in Standard Lots
  // Position Size = Risk Amount / (Pips at Risk * Pip Value per lot)
  let calculatedLots = 0;
  if (pipsAtRisk > 0 && pipValuePerLot > 0) {
    calculatedLots = cashRiskAmount / (pipsAtRisk * pipValuePerLot);
  }

  // Potential Profit Amount
  const potentialRewardAmount = calculatedLots * pipsAtReward * pipValuePerLot;
  const riskRewardRatio = priceDiffSL > 0 ? (priceDiffTP / priceDiffSL).toFixed(2) : '0';

  const isRiskWarning = activeRiskPercent > 2.0;

  return (
    <div className="bg-[#111622] rounded-xl border border-slate-800 p-6 shadow-xl max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Quantitative Risk Management Calculator
            </h2>
            <p className="text-xs text-slate-400">
              Precise Lot Sizing, Equity Preservation & Institutional R:R Engine
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
          Broker Multiplier Calibrated
        </span>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
        {/* Account Balance */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
          <label className="text-[10px] text-slate-400 block uppercase mb-1">
            Account Balance
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">$</span>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white font-bold focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Instrument Selector */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
          <label className="text-[10px] text-slate-400 block uppercase mb-1">
            Trading Instrument
          </label>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value as InstrumentSymbol)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="XAUUSD">XAUUSD (Gold 100oz)</option>
            <option value="EUR/USD">EUR/USD (Standard 100k)</option>
            <option value="GBP/USD">GBP/USD (Standard 100k)</option>
            <option value="USD/JPY">USD/JPY (Standard 100k)</option>
            <option value="USD/CHF">USD/CHF (Standard 100k)</option>
            <option value="AUD/USD">AUD/USD (Standard 100k)</option>
            <option value="NZD/USD">NZD/USD (Standard 100k)</option>
            <option value="USD/CAD">USD/CAD (Standard 100k)</option>
          </select>
        </div>

        {/* Currency Account */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
          <label className="text-[10px] text-slate-400 block uppercase mb-1">
            Account Currency
          </label>
          <select
            value={accountCurrency}
            onChange={(e) => setAccountCurrency(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="USD">USD ($ - US Dollar)</option>
            <option value="EUR">EUR (€ - Euro)</option>
            <option value="GBP">GBP (£ - British Pound)</option>
            <option value="IDR">IDR (Rp - Indonesian Rupiah)</option>
          </select>
        </div>
      </div>

      {/* Risk Percentage Selection */}
      <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-2">
        <label className="text-[11px] font-mono text-slate-400 block uppercase font-bold">
          Risk Allocation Per Trade (% of Equity)
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {[0.25, 0.5, 1.0, 2.0].map((pct) => (
            <button
              key={pct}
              onClick={() => {
                setRiskPercent(pct);
                setIsCustomRisk(false);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded cursor-pointer transition-colors ${
                !isCustomRisk && riskPercent === pct
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {pct}%
            </button>
          ))}

          {/* Custom Risk Option */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsCustomRisk(true)}
              className={`px-3 py-1.5 text-xs font-mono rounded cursor-pointer transition-colors ${
                isCustomRisk
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Custom %
            </button>
            {isCustomRisk && (
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 1.5"
                value={customRisk}
                onChange={(e) => setCustomRisk(e.target.value)}
                className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            )}
          </div>
        </div>
      </div>

      {/* Trade Prices: Entry, Stop Loss, Take Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
          <label className="text-[10px] text-cyan-400 block uppercase font-bold mb-1">
            Planned Entry Price
          </label>
          <input
            type="number"
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white font-bold focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="bg-slate-900/80 p-3 rounded-lg border border-rose-900/40">
          <label className="text-[10px] text-rose-400 block uppercase font-bold mb-1">
            Stop Loss Price
          </label>
          <input
            type="number"
            step="any"
            value={slPrice}
            onChange={(e) => setSlPrice(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-rose-800/60 rounded px-2.5 py-1.5 text-sm text-rose-300 font-bold focus:outline-none focus:border-rose-400"
          />
        </div>

        <div className="bg-slate-900/80 p-3 rounded-lg border border-emerald-900/40">
          <label className="text-[10px] text-emerald-400 block uppercase font-bold mb-1">
            Take Profit Price
          </label>
          <input
            type="number"
            step="any"
            value={tpPrice}
            onChange={(e) => setTpPrice(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-950 border border-emerald-800/60 rounded px-2.5 py-1.5 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Risk Warning Alert */}
      {isRiskWarning && (
        <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/70 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Aggressive Risk Notice:</strong> Allocating &gt;2.0% per trade increases exponential drawdown risks during consecutive loss streaks. Professional prop-firm standards recommend ≤ 1.0%.
          </span>
        </div>
      )}

      {/* CALCULATED OUTPUT SCOREBOARD */}
      <div className="p-5 rounded-xl bg-slate-900/95 border border-slate-800 shadow-inner grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
        {/* Recommended Position Size */}
        <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30">
          <span className="text-[10px] text-cyan-400 block uppercase tracking-wider font-semibold">
            Position Size (Lots)
          </span>
          <span className="text-2xl font-black text-cyan-200 block mt-1">
            {calculatedLots.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500">Standard Lots</span>
        </div>

        {/* Exact Cash at Risk */}
        <div className="p-3 rounded-lg bg-slate-950 border border-rose-800/40">
          <span className="text-[10px] text-rose-400 block uppercase tracking-wider font-semibold">
            Cash Risk ($)
          </span>
          <span className="text-2xl font-black text-rose-300 block mt-1">
            ${cashRiskAmount.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500">
            {activeRiskPercent.toFixed(2)}% of Balance
          </span>
        </div>

        {/* Potential Profit */}
        <div className="p-3 rounded-lg bg-slate-950 border border-emerald-800/40">
          <span className="text-[10px] text-emerald-400 block uppercase tracking-wider font-semibold">
            Potential Reward ($)
          </span>
          <span className="text-2xl font-black text-emerald-300 block mt-1">
            ${potentialRewardAmount.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500">
            +{(accountBalance > 0 ? (potentialRewardAmount / accountBalance) * 100 : 0).toFixed(1)}% Gain
          </span>
        </div>

        {/* Risk-to-Reward Ratio */}
        <div className="p-3 rounded-lg bg-slate-950 border border-amber-800/40">
          <span className="text-[10px] text-amber-400 block uppercase tracking-wider font-semibold">
            Risk-to-Reward
          </span>
          <span className="text-2xl font-black text-amber-300 block mt-1">
            1:{riskRewardRatio}
          </span>
          <span className="text-[10px] text-slate-500">
            {pipsAtRisk.toFixed(1)} pips SL · {pipsAtReward.toFixed(1)} pips TP
          </span>
        </div>
      </div>

      {/* Formulas & Institutional Notes */}
      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold font-mono">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Calculation Assumptions & Formulas:</span>
        </div>
        <p>
          Position Size = (Account Balance × Risk %) / (SL Distance in Pips × Pip Value per Lot).
          Pip value assumed at default standard contract specs ($10/pip for EUR/USD & Gold, ~$6.70 for USD/JPY). Adjust according to specific broker spreads and commission tiers.
        </p>
      </div>
    </div>
  );
};
