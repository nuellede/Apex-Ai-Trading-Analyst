import { InstrumentSymbol, Timeframe, TradingMode } from '../types/trading';

export interface SampleChartPreset {
  id: string;
  instrument: InstrumentSymbol;
  timeframe: Timeframe;
  mode: TradingMode;
  title: string;
  subtitle: string;
  description: string;
  currentPrice: number;
  generateDataUrl: () => string;
}

// Helper to draw realistic financial candlestick charts onto an off-screen HTML canvas
function createChartImage(config: {
  pair: string;
  timeframe: string;
  basePrice: number;
  priceDecimals: number;
  trend: 'bullish' | 'bearish' | 'range-breakout';
  candlesCount: number;
  showIndicators?: boolean;
}): string {
  if (typeof document === 'undefined') return '';
  const width = 1280;
  const height = 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#0f141d';
  ctx.fillRect(0, 0, width, height);

  // Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 80; x < width - 100; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, height - 70);
    ctx.stroke();
  }
  for (let y = 60; y < height - 70; y += 60) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 100, y);
    ctx.stroke();
  }

  // Watermark (TradingView style)
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.font = '700 84px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${config.pair} · ${config.timeframe}`, width / 2 - 40, height / 2 - 20);
  ctx.restore();

  // Header Bar
  ctx.fillStyle = '#161d2a';
  ctx.fillRect(0, 0, width, 44);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(0, 44);
  ctx.lineTo(width, 44);
  ctx.stroke();

  // Header Title & Specs
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(config.pair, 20, 28);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13px system-ui, sans-serif';
  ctx.fillText(`· ${config.timeframe} · TradingView Pro Platform · APEX Terminal Feed`, 120, 27);

  // Generate Candlestick price series
  let cur = config.basePrice;
  const stepPrice = config.basePrice * (config.trend === 'bullish' ? 0.0006 : config.trend === 'bearish' ? -0.0006 : 0.0002);
  const candles: Array<{ o: number; h: number; l: number; c: number; v: number }> = [];

  for (let i = 0; i < config.candlesCount; i++) {
    const isUpTrend = config.trend === 'bullish';
    const isDownTrend = config.trend === 'bearish';
    const drift = (Math.random() - (isUpTrend ? 0.42 : isDownTrend ? 0.58 : 0.5)) * stepPrice * 4;
    const open = cur;
    let close = open + drift;
    if (i === config.candlesCount - 5 && isUpTrend) {
      // Big bullish expansion candle
      close = open + stepPrice * 6;
    }
    const high = Math.max(open, close) + Math.random() * Math.abs(stepPrice) * 2;
    const low = Math.min(open, close) - Math.random() * Math.abs(stepPrice) * 2;
    const volume = Math.floor(Math.random() * 4000) + 1500;
    candles.push({ o: open, h: high, l: low, c: close, v: volume });
    cur = close;
  }

  // Min and Max prices
  const minPrice = Math.min(...candles.map((c) => c.l)) * 0.999;
  const maxPrice = Math.max(...candles.map((c) => c.h)) * 1.001;
  const priceRange = maxPrice - minPrice;

  const chartTop = 60;
  const chartBottom = height - 120;
  const chartHeight = chartBottom - chartTop;
  const chartLeft = 40;
  const chartRight = width - 110;
  const chartWidth = chartRight - chartLeft;

  const getY = (p: number) => chartBottom - ((p - minPrice) / priceRange) * chartHeight;
  const candleSpacing = chartWidth / config.candlesCount;
  const candleBodyWidth = Math.max(4, candleSpacing * 0.7);

  // Draw EMA 20 & EMA 50 Lines
  if (config.showIndicators) {
    const ema20: number[] = [];
    let k20 = 2 / (20 + 1);
    let prev20 = candles[0].c;
    candles.forEach((c) => {
      prev20 = c.c * k20 + prev20 * (1 - k20);
      ema20.push(prev20);
    });

    ctx.strokeStyle = '#38bdf8'; // Sky Blue EMA 20
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ema20.forEach((val, i) => {
      const cx = chartLeft + i * candleSpacing + candleSpacing / 2;
      const cy = getY(val);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    // EMA Legend
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText('EMA 20 (38bdf8)', 20, 58);
  }

  // Draw BOS/CHoCH annotation box if applicable
  if (config.trend === 'bullish') {
    const boxStartIdx = Math.floor(config.candlesCount * 0.65);
    const boxEndIdx = config.candlesCount - 2;
    const boxX = chartLeft + boxStartIdx * candleSpacing;
    const boxW = (boxEndIdx - boxStartIdx) * candleSpacing;
    const boxY = getY(candles[boxStartIdx].h);
    const boxH = 28;

    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#10b981';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.setLineDash([]);

    ctx.fillStyle = '#10b981';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('DEMAND ZONE (FVG + BOS)', boxX + 6, boxY - 6);
  } else if (config.trend === 'bearish') {
    const boxStartIdx = Math.floor(config.candlesCount * 0.55);
    const boxEndIdx = config.candlesCount - 3;
    const boxX = chartLeft + boxStartIdx * candleSpacing;
    const boxW = (boxEndIdx - boxStartIdx) * candleSpacing;
    const boxY = getY(candles[boxStartIdx].l) - 24;
    const boxH = 26;

    ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#f43f5e';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('SUPPLY ZONE (LIQUIDITY SWEEP)', boxX + 6, boxY - 6);
  }

  // Draw Candlesticks & Volume
  candles.forEach((c, i) => {
    const cx = chartLeft + i * candleSpacing + candleSpacing / 2;
    const isBull = c.c >= c.o;
    const color = isBull ? '#10b981' : '#f43f5e';

    // Volume bar at bottom
    const vHeight = (c.v / 6000) * 45;
    ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
    ctx.fillRect(cx - candleBodyWidth / 2, height - 70 - vHeight, candleBodyWidth, vHeight);

    // Candle Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, getY(c.h));
    ctx.lineTo(cx, getY(c.l));
    ctx.stroke();

    // Candle Body
    const topY = getY(Math.max(c.o, c.c));
    const botY = getY(Math.min(c.o, c.c));
    const hBody = Math.max(2, botY - topY);

    ctx.fillStyle = color;
    ctx.fillRect(cx - candleBodyWidth / 2, topY, candleBodyWidth, hBody);
  });

  // Price Scale Axis (Right Column)
  ctx.fillStyle = '#111722';
  ctx.fillRect(width - 100, 44, 100, height - 44);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(width - 100, 44);
  ctx.lineTo(width - 100, height);
  ctx.stroke();

  // Price Labels on Axis
  const numSteps = 8;
  for (let s = 0; s <= numSteps; s++) {
    const p = minPrice + (s / numSteps) * priceRange;
    const py = getY(p);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(p.toFixed(config.priceDecimals), width - 90, py + 4);

    // Tiny tick line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(width - 100, py);
    ctx.lineTo(width - 94, py);
    ctx.stroke();
  }

  // Current Price Badge on Axis
  const latestPrice = candles[candles.length - 1].c;
  const latestY = getY(latestPrice);
  ctx.fillStyle = latestPrice >= candles[candles.length - 1].o ? '#10b981' : '#f43f5e';
  ctx.fillRect(width - 100, latestY - 11, 95, 22);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillText(latestPrice.toFixed(config.priceDecimals), width - 90, latestY + 4);

  // Crosshair line to latest price
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(chartLeft, latestY);
  ctx.lineTo(width - 100, latestY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Time Axis (Bottom Row)
  ctx.fillStyle = '#111722';
  ctx.fillRect(0, height - 26, width, 26);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(0, height - 26);
  ctx.lineTo(width, height - 26);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '500 10px "JetBrains Mono", monospace';
  const times = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  times.forEach((t, i) => {
    ctx.fillText(t, chartLeft + i * (chartWidth / times.length), height - 8);
  });

  return canvas.toDataURL('image/png');
}

export const SAMPLE_CHARTS: SampleChartPreset[] = [
  {
    id: 'sample-xauusd-h1',
    instrument: 'XAUUSD',
    timeframe: 'H1',
    mode: 'INTRADAY',
    title: 'XAUUSD H1 · Bullish BOS & Demand Retest',
    subtitle: 'Institutional Liquidity & Orderblock Retest',
    description: 'Gold creates clean Higher Highs with Fair Value Gap (FVG) retest at $2,652-$2,656 support following New York session expansion.',
    currentPrice: 2658.40,
    generateDataUrl: () =>
      createChartImage({
        pair: 'XAUUSD',
        timeframe: '1H',
        basePrice: 2642.50,
        priceDecimals: 2,
        trend: 'bullish',
        candlesCount: 48,
        showIndicators: true,
      }),
  },
  {
    id: 'sample-eurusd-m15',
    instrument: 'EUR/USD',
    timeframe: 'M15',
    mode: 'SCALPING',
    title: 'EUR/USD M15 · Asian High Sweep & CHoCH',
    subtitle: 'Liquidity Grab & Bearish Structure Shift',
    description: 'London Open sweeps Asian session liquidity at 1.08750 followed by aggressive bearish candle close below previous Higher Low.',
    currentPrice: 1.08420,
    generateDataUrl: () =>
      createChartImage({
        pair: 'EURUSD',
        timeframe: '15m',
        basePrice: 1.08680,
        priceDecimals: 5,
        trend: 'bearish',
        candlesCount: 42,
        showIndicators: true,
      }),
  },
  {
    id: 'sample-usdjpy-h4',
    instrument: 'USD/JPY',
    timeframe: 'H4',
    mode: 'SWING',
    title: 'USD/JPY H4 · Ascending Channel Continuation',
    subtitle: 'Multi-Day Swing Support at EMA 50',
    description: 'Dollar-Yen holds key diagonal ascending trendline support near 152.400 with pin bar rejection and divergence.',
    currentPrice: 153.250,
    generateDataUrl: () =>
      createChartImage({
        pair: 'USDJPY',
        timeframe: '4H',
        basePrice: 151.800,
        priceDecimals: 3,
        trend: 'bullish',
        candlesCount: 40,
        showIndicators: true,
      }),
  },
  {
    id: 'sample-gbpusd-m5',
    instrument: 'GBP/USD',
    timeframe: 'M5',
    mode: 'SCALPING',
    title: 'GBP/USD M5 · Tight Morning Range Breakout',
    subtitle: 'High-Speed Micro Momentum Scalp',
    description: 'Cable forms a 15-pip consolidation box before explosive breakout with volume spike and clean retest trigger.',
    currentPrice: 1.29820,
    generateDataUrl: () =>
      createChartImage({
        pair: 'GBPUSD',
        timeframe: '5m',
        basePrice: 1.29650,
        priceDecimals: 5,
        trend: 'bullish',
        candlesCount: 36,
        showIndicators: false,
      }),
  },
];
