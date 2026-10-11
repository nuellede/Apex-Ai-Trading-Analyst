import React, { useState, useEffect } from 'react';
import { InstrumentSymbol, SeasonalityData } from '../types/trading';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Clock,
  Database,
  BarChart2,
} from 'lucide-react';

interface SeasonalityModuleProps {
  currentInstrument?: InstrumentSymbol;
}

export const SeasonalityModule: React.FC<SeasonalityModuleProps> = ({
  currentInstrument = 'XAUUSD',
}) => {
  const [selectedInst, setSelectedInst] = useState<InstrumentSymbol>(currentInstrument);
  const [seasonality, setSeasonality] = useState<SeasonalityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/seasonality/${encodeURIComponent(selectedInst)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Seasonality data unavailable for ' + selectedInst);
        return res.json();
      })
      .then((data: SeasonalityData) => {
        if (isMounted) {
          setSeasonality(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedInst]);

  const instrumentsList: { symbol: InstrumentSymbol; label: string }[] = [
    { symbol: 'XAUUSD', label: 'Gold (XAUUSD)' },
    { symbol: 'EUR/USD', label: 'EUR/USD' },
    { symbol: 'GBP/USD', label: 'GBP/USD' },
    { symbol: 'USD/JPY', label: 'USD/JPY' },
    { symbol: 'USD/CHF', label: 'USD/CHF' },
    { symbol: 'AUD/USD', label: 'AUD/USD' },
    { symbol: 'NZD/USD', label: 'NZD/USD' },
    { symbol: 'USD/CAD', label: 'USD/CAD' },
  ];

  return (
    <div className="bg-[#111622] rounded-xl border border-slate-800 p-6 shadow-xl max-w-5xl mx-auto space-y-6">
      {/* Top Header & Disclaimers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Seasonality & Historical Tendency Engine
            </h2>
            <p className="text-xs text-slate-400">
              Multi-Decade Statistical Profiles · Institutional Flow Tendencies
            </p>
          </div>
        </div>

        {/* Instrument Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {instrumentsList.map((item) => (
            <button
              key={item.symbol}
              onClick={() => setSelectedInst(item.symbol)}
              className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                selectedInst === item.symbol
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Crucial Statistical Boundary Notice */}
      <div className="p-3.5 rounded-lg bg-slate-900/90 border border-amber-800/40 text-xs text-slate-300 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300 font-mono">
            CRITICAL STATISTICAL PROTOCOL: SEASONALITY ≠ IMMEDIATE PRICE PREDICTION
          </p>
          <p className="leading-relaxed text-[11px] text-slate-400">
            Seasonality represents multi-decade macro aggregate tendencies and portfolio rebalancing windows. It is <strong>never deduced from a single chart screenshot</strong>, nor should it override immediate candlestick structure or invalidation levels.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-xs font-mono">Loading 20+ Year Historical Dataset for {selectedInst}...</span>
        </div>
      ) : error || !seasonality ? (
        <div className="py-12 text-center text-rose-400 text-xs font-mono">
          Seasonality data unavailable: {error || 'No records returned'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dataset Statistics Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Sample Window</span>
              <span className="font-bold text-white">{seasonality.sampleYears}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Sample Size</span>
              <span className="font-bold text-white">{seasonality.sampleSize}</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Historical Reliability</span>
              <span className="font-bold text-emerald-400">{seasonality.dataReliabilityScore}% Quantitative Fit</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Asset Class</span>
              <span className="font-bold text-cyan-300">{seasonality.name}</span>
            </div>
          </div>

          {/* 12-Month Performance Heatmap */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  12-Month Historical Return & Win-Rate Profile
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Long Win-Rate (% Positive Months)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
              {seasonality.monthlyTendency.map((m) => {
                const isBull = m.winRate >= 55;
                const isBear = m.winRate < 45;
                return (
                  <div
                    key={m.month}
                    className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                      isBull
                        ? 'bg-emerald-950/20 border-emerald-800/40'
                        : isBear
                        ? 'bg-rose-950/20 border-rose-800/40'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-sm">{m.month}</span>
                      <span
                        className={`text-[11px] font-bold ${
                          isBull ? 'text-emerald-400' : isBear ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {m.winRate}%
                      </span>
                    </div>

                    <div className="my-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Avg Return:</span>
                      <span className={`font-semibold ${m.avgReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.avgReturn > 0 ? `+${m.avgReturn}%` : `${m.avgReturn}%`}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-sans line-clamp-2 mt-1">
                      {m.notes}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day of Week Volatility & Session Profiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
            {/* Day of Week Tendency */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Day of Week Volatility (Average Pips)
                </h3>
              </div>

              <div className="space-y-2">
                {seasonality.dayOfWeekProfile.map((d) => (
                  <div key={d.day} className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <div className="w-12 font-bold text-slate-300">{d.day}</div>
                    <div className="flex-1 px-3">
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full rounded-full"
                          style={{ width: `${Math.min(100, (d.avgVolatilityPips / 300) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-sans block mt-1">
                        {d.tendency}
                      </span>
                    </div>
                    <div className="text-right font-bold text-cyan-300 w-16">
                      {d.avgVolatilityPips} pips
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trading Session Characteristics */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Market Session Orderflow Dynamics
                </h3>
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-200 font-bold mb-1">
                    <span>Tokyo / Asian Session</span>
                    <span className="text-[10px] text-slate-500">{seasonality.sessionProfile.asian.hoursUTC}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    {seasonality.sessionProfile.asian.character} (Volatility: {seasonality.sessionProfile.asian.volatility})
                  </p>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-200 font-bold mb-1">
                    <span>London Session</span>
                    <span className="text-[10px] text-slate-500">{seasonality.sessionProfile.london.hoursUTC}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    {seasonality.sessionProfile.london.character} (Volatility: {seasonality.sessionProfile.london.volatility})
                  </p>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-200 font-bold mb-1">
                    <span>New York Session & Overlap</span>
                    <span className="text-[10px] text-slate-500">{seasonality.sessionProfile.newYork.hoursUTC}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    {seasonality.sessionProfile.newYork.character} (Volatility: {seasonality.sessionProfile.newYork.volatility})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Drawdown & Statistical Disclaimers */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold font-mono">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Historical Drawdowns & Statistical Bounds:</span>
            </div>
            <p className="font-sans leading-relaxed text-[11px]">
              {seasonality.drawdownHistory}
            </p>
            <p className="font-sans leading-relaxed text-[11px] text-slate-500 pt-1 italic">
              {seasonality.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
