export type TradingMode = 'SCALPING' | 'INTRADAY' | 'SWING';

export type InstrumentSymbol =
  | 'XAUUSD'
  | 'EUR/USD'
  | 'GBP/USD'
  | 'USD/JPY'
  | 'USD/CHF'
  | 'AUD/USD'
  | 'NZD/USD'
  | 'USD/CAD';

export type Timeframe =
  | 'M1'
  | 'M5'
  | 'M15'
  | 'M30'
  | 'H1'
  | 'H4'
  | 'D1'
  | 'W1'
  | 'MN1';

export interface ChartImagePayload {
  id: string;
  data: string; // base64 data URI
  mimeType: string;
  name: string;
  timeframeLabel?: string;
  previewUrl: string;
}

export interface InstrumentInfo {
  symbol: InstrumentSymbol;
  name: string;
  category: string;
  pipDecimals: number;
  defaultContractSize: number;
  pipValue1Lot: number;
  typicalSpread: number;
}

export interface ImageQualityAudit {
  isImageClear: boolean;
  candlestickLegibility: 'High' | 'Medium' | 'Low';
  priceScaleLegibility: 'High' | 'Medium' | 'Low';
  timeframeIdentified: string;
  instrumentIdentified: string;
  instrumentMismatchDetected: boolean;
  mismatchWarning: string | null;
  highVolatilityWarning: boolean;
  qualityNotes: string;
}

export interface AnalysisMetadata {
  analyzedInstrument: string;
  analyzedTimeframe: string;
  tradingMode: TradingMode;
  screenshotTimestamp: string | null;
  analysisTimestamp: string;
  estimatedCurrentPrice: number | null;
}

export interface MarketBias {
  primaryTrend: 'Bullish' | 'Bearish' | 'Sideways / Neutral';
  secondaryTrend: string;
  currentMarketPhase: string;
  biasSummary: string;
}

export interface MarketStructureDetails {
  structureType: string;
  keySwingPoints: string;
  bosChochEvents: string;
  liquidityState: string;
  momentumAssessment: string;
}

export interface IndicatorAudit {
  name: string;
  visible: boolean;
  reading: string;
  interpretation: string;
}

export interface CriticalZones {
  resistanceZone: {
    low: number;
    high: number;
    timeframe: string;
    rationale: string;
    confidencePercent: number;
  };
  supportZone: {
    low: number;
    high: number;
    timeframe: string;
    rationale: string;
    confidencePercent: number;
  };
  bullishInvalidation: {
    price: number;
    rationale: string;
  };
  bearishInvalidation: {
    price: number;
    rationale: string;
  };
  breakoutConfirmation: {
    zone: string;
    rationale: string;
  };
  potentialReversalZone: {
    zone: string;
    rationale: string;
  };
  noTradeZone: {
    range: string;
    reason: string;
  };
}

export interface MultiTimeframeRow {
  timeframe: string;
  trend: string;
  marketStructure: string;
  criticalZone: string;
  bias: 'Bullish' | 'Bearish' | 'Neutral' | 'Conflicting Signals' | 'Insufficient Data';
}

export interface TradeScenario {
  status: 'Active Setup' | 'Wait for Retest' | 'Not Recommended';
  entryType: 'Aggressive Entry' | 'Confirmation Entry' | 'Retest Entry';
  entryZone: {
    min: number;
    max: number;
    ideal: number;
  };
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskDistance: number;
  rewardDistanceTP1: number;
  rewardDistanceTP2: number;
  rewardDistanceTP3: number;
  riskRewardRatioTP1: string;
  riskRewardRatioTP2: string;
  riskRewardRatioTP3: string;
  technicalRationale: string;
  confirmationTrigger: string;
  invalidationCondition: string;
}

export interface PreferredSetup {
  action: 'BUY' | 'SELL' | 'WAIT / NO TRADE';
  biasStrength: 'High Conviction' | 'Moderate Conviction' | 'Cautious / Wait';
  selectedEntryType: string;
  entryPriceAssumed: number;
  stopLossPrice: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskRewardTP1: string;
  riskRewardTP2: string;
  riskRewardTP3: string;
  primaryRationale: string;
  executionTrigger: string;
  expirationOrCancelCondition: string;
}

export interface SetupQualityScore {
  totalScore: number;
  tier: 'High Confluence' | 'Good Confluence' | 'Moderate Confluence' | 'Weak Setup / No Trade';
  breakdown: {
    marketStructureClarity: number;
    trendAlignment: number;
    proximityToCriticalZone: number;
    entryConfirmationQuality: number;
    momentumAlignment: number;
    riskRewardScore: number;
    multiTimeframeConfluence: number;
  };
  scoreExplanation: string;
}

export interface FullAnalysisResult {
  audit: ImageQualityAudit;
  metadata: AnalysisMetadata;
  executiveSummary: string;
  marketBias: MarketBias;
  marketStructure: MarketStructureDetails;
  indicators: IndicatorAudit[];
  criticalZones: CriticalZones;
  multiTimeframeMatrix: MultiTimeframeRow[];
  multiTimeframeSynthesis: string;
  buyScenario: TradeScenario;
  sellScenario: TradeScenario;
  preferredSetup: PreferredSetup;
  qualityScore: SetupQualityScore;
  invalidationConditions: string[];
  noTradeConditions: string[];
  alternativeScenario: string;
  missingDataAndLimitations: string[];
  riskManagementNotes: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  instrument: string;
  timeframe: string;
  tradingMode: TradingMode;
  preferredAction: 'BUY' | 'SELL' | 'WAIT / NO TRADE';
  score: number;
  thumbnail: string;
  result: FullAnalysisResult;
}

export interface SeasonalityMonthly {
  month: string;
  winRate: number;
  avgReturn: number;
  bias: string;
  notes: string;
}

export interface DayOfWeekData {
  day: string;
  avgVolatilityPips: number;
  tendency: string;
}

export interface SeasonalityData {
  instrument: string;
  name: string;
  sampleYears: string;
  sampleSize: string;
  dataReliabilityScore: number;
  monthlyTendency: SeasonalityMonthly[];
  dayOfWeekProfile: DayOfWeekData[];
  sessionProfile: {
    asian: { hoursUTC: string; volatility: string; character: string };
    london: { hoursUTC: string; volatility: string; character: string };
    newYork: { hoursUTC: string; volatility: string; character: string };
  };
  drawdownHistory: string;
  disclaimer: string;
}
