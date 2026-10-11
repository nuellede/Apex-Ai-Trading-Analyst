import { GoogleGenAI } from '@google/genai';

// Helper to sanitize and extract JSON response from model text
export function extractJSON(text: string): any {
  let cleaned = text.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt to locate outer curly brace block
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const slice = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(slice);
    }
    throw new Error('Gagal mengurai respons model ke format JSON terstruktur: ' + (err as Error).message);
  }
}

export interface AnalyzePayload {
  images: Array<{
    data: string;
    mimeType?: string;
    label?: string;
  }>;
  selectedInstrument?: string;
  selectedTimeframe?: string;
  tradingMode?: 'SCALPING' | 'INTRADAY' | 'SWING';
  knownPrice?: number;
  userNotes?: string;
}

export async function processChartAnalysis(payload: AnalyzePayload) {
  const {
    images,
    selectedInstrument,
    selectedTimeframe,
    tradingMode,
    knownPrice,
    userNotes,
  } = payload;

  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new Error('Minimal satu screenshot grafik candlestick trading harus diunggah.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Kunci GEMINI_API_KEY belum dikonfigurasi di server. Jika Anda membuka di Vercel: Buka Vercel Dashboard > Project Settings > Environment Variables > Tambahkan GEMINI_API_KEY lalu klik Redeploy.'
    );
  }

  // Primary and fallback models
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const fallbackModel = 'gemini-flash-latest';

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Build multimodal parts
  const parts: any[] = [];

  images.forEach((img, idx) => {
    let base64Data = img.data || '';
    let detectedMime = img.mimeType || 'image/png';

    // Handle data URI prefix: data:image/png;base64,...
    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
      if (matches) {
        detectedMime = matches[1];
        base64Data = matches[2];
      } else if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
    }

    parts.push({
      inlineData: {
        mimeType: detectedMime,
        data: base64Data,
      },
    });

    parts.push({
      text: `[IMAGE ${idx + 1} CONTEXT: User label or timeframe hint: "${img.label || 'Screenshot ' + (idx + 1)}"]`,
    });
  });

  const isMultiTF = images.length > 1;

  const analysisPrompt = `
You are the quantitative algorithmic core of "APEX AI TRADING ANALYST", a Senior Quantitative Trading Analyst, Market Structure Specialist, and Technical Analysis Engine.

Analyze the uploaded trading chart screenshot(s) with clinical precision, visual objectivity, and strict risk discipline.

USER PARAMETERS:
- Target Instrument Selected by User: ${selectedInstrument || 'Auto-Detect'}
- Timeframe Selected by User: ${selectedTimeframe || 'Auto-Detect'}
- Trading Mode Requested: ${tradingMode || 'INTRADAY'} (Available: SCALPING [M1/M5/M15], INTRADAY [M15/H1/H4], SWING [H4/D1/W1])
- Current Reference Price Stated by User: ${knownPrice ? knownPrice : 'None specified (read visually from chart)'}
- User Trading Notes / Focus: ${userNotes ? userNotes : 'None provided'}
- Multi-Timeframe Submission: ${isMultiTF ? `YES (${images.length} screenshots submitted)` : 'NO (Single screenshot submitted - do NOT invent multi-timeframe confirmation; state clearly that only this timeframe is available)'}

CORE INSTRUCTIONS:
1. IMAGE QUALITY AUDIT:
   - Check if candlesticks are sharp, price axis scale is clearly legible, timeframe text is readable, pair symbol is visible, and the latest active candle area is uncropped.
   - If price scale is blurry or unreadable, flag imageQualityIssues and do NOT invent fake precision numbers. State what must be clarified.
2. INSTRUMENT & TIMEFRAME VERIFICATION:
   - Read the exact pair symbol and timeframe from the chart image (e.g. TradingView watermark, MT4/MT5 upper-left title, price scale).
   - If the detected pair differs from "${selectedInstrument || ''}", set "instrumentMismatchDetected": true, "detectedInstrument": "<Detected>", and "mismatchWarning": "<Explicit Warning message explaining the discrepancy>".
   - If pair cannot be identified from image, set detectedInstrument to "Unidentified / Relies on User Input".
3. MARKET STRUCTURE RECOGNITION (Only what is visually proven):
   - Identify Swing Highs, Swing Lows, Higher Highs (HH), Higher Lows (HL), Lower Highs (LH), Lower Lows (LL).
   - Classify structure: Uptrend, Downtrend, or Sideways/Ranging Consolidation.
   - Look for genuine structural events: BOS (Break of Structure), CHoCH (Change of Character), MSS (Market Structure Shift), Liquidity Sweeps, Equal Highs/Lows (EQH/EQL), Fair Value Gaps (FVG) or Supply/Demand zones, Rejections.
   - Separate visible facts from speculative hypotheses. Do NOT state institutional or smart money activity as absolute certainty.
4. TECHNICAL INDICATORS AUDIT:
   - Only report indicators visible on chart (e.g., EMA 20/50/200, SMA, RSI, MACD, Bollinger Bands, ATR, VWAP, Volume, Fibonacci).
   - If an indicator is not on the chart, explicitly mark status as "Tidak tersedia / Not visible on chart" and do NOT invent numerical readings.
5. MARKET STRUCTURE & CRITICAL ZONES:
   - Primary Trend (Bullish, Bearish, Neutral)
   - Secondary Trend (Short-term pullbacks or counter-trends)
   - Current Market Phase (Trending, Ranging Consolidation, Breakout Phase, Reversal Candidate)
   - Critical Resistance Zone (low, high, timeframe, technical rationale, calibrated confidence %)
   - Critical Support Zone (low, high, timeframe, technical rationale, calibrated confidence %)
   - Bullish Invalidation Level (exact price that kills bullish thesis)
   - Bearish Invalidation Level (exact price that kills bearish thesis)
   - Breakout Confirmation Zone & Potential Reversal Zone
   - No-Trade Zone (range where chop will cause whipsaws)
6. MULTI-TIMEFRAME SYNTHESIS:
   - Produce a matrix table array of timeframes evaluated.
   - If single screenshot, list the single timeframe and explicitly mark other higher/lower timeframes as "Insufficient Data - Requires separate timeframe screenshot".
   - If conflicting signals exist, state the conflict without bias and reduce setup quality.
7. ENTRY ENGINE (BUY & SELL SCENARIOS):
   - Provide Scenario A: BUY Setup (Entry range, SL, TP1, TP2, TP3, R:R, Trigger condition, Invalidation level).
   - Provide Scenario B: SELL Setup (Entry range, SL, TP1, TP2, TP3, R:R, Trigger condition, Invalidation level).
   - Strict logic: BUY SL must be below Entry, TP above Entry. SELL SL must be above Entry, TP below Entry.
   - Entry Type: "Aggressive Entry", "Confirmation Entry", or "Retest Entry".
   - Determine PREFERRED SETUP ("BUY", "SELL", or "WAIT / NO TRADE"). Prioritize the side with clear technical confluence.
   - If market is in an unviable chop or high risk: set preferredSetup to "WAIT / NO TRADE".
8. STOP LOSS & TAKE PROFIT PRECISION:
   - Format prices properly: Gold (XAUUSD) 2 decimals (e.g. 2652.40); JPY pairs 3 decimals (e.g. 152.350); EURUSD/GBPUSD/others 5 decimals (e.g. 1.08450).
   - Calculate Risk Distance, Reward Distance, and Risk-to-Reward (R:R) for TP1, TP2, TP3.
9. TRADE SETUP QUALITY ENGINE (Score 0-100):
   - Transparent rubric scores:
     * marketStructureClarity (0-20)
     * trendAlignment (0-20)
     * proximityToCriticalZone (0-15)
     * entryConfirmationQuality (0-15)
     * momentumAlignment (0-10)
     * riskRewardScore (0-10)
     * multiTimeframeConfluence (0-10)
     Total Score = sum of the 7 components.
   - Label:
     * 85-100: "High Confluence"
     * 70-84: "Good Confluence"
     * 50-69: "Moderate Confluence"
     * 0-49: "Weak Setup / No Trade"
   - Explicit disclaimer that this is an internal technical confluence score, NOT a win-rate or financial guarantee.
10. FULL 19-SECTION REPORT:
   Provide complete, detailed answers for all 19 mandated sections:
   1. executiveSummary
   2. instrumentAndScreenshotDetails
   3. currentMarketBias
   4. marketStructure
   5. trendAnalysis
   6. supportAndResistance
   7. criticalZones
   8. multiTimeframeConfirmation
   9. buyScenario
   10. sellScenario
   11. preferredTradingSetup
   12. entrySlTpLevels
   13. riskToRewardAnalysis
   14. setupQualityScore
   15. invalidationConditions
   16. noTradeConditions
   17. alternativeScenario
   18. missingDataAndLimitations
   19. riskManagementNotes

OUTPUT MUST BE VALID STRICT JSON ONLY matching the following schema without preamble:
{
  "audit": {
    "isImageClear": boolean,
    "candlestickLegibility": "High" | "Medium" | "Low",
    "priceScaleLegibility": "High" | "Medium" | "Low",
    "timeframeIdentified": string,
    "instrumentIdentified": string,
    "instrumentMismatchDetected": boolean,
    "mismatchWarning": string | null,
    "highVolatilityWarning": boolean,
    "qualityNotes": string
  },
  "metadata": {
    "analyzedInstrument": string,
    "analyzedTimeframe": string,
    "tradingMode": "SCALPING" | "INTRADAY" | "SWING",
    "screenshotTimestamp": string | null,
    "analysisTimestamp": string,
    "estimatedCurrentPrice": number | null
  },
  "executiveSummary": string,
  "marketBias": {
    "primaryTrend": "Bullish" | "Bearish" | "Sideways / Neutral",
    "secondaryTrend": "Bullish Pullback" | "Bearish Retracement" | "Consolidation" | "Trend Continuation",
    "currentMarketPhase": "Accumulation" | "Markup (Bullish Trend)" | "Distribution" | "Markdown (Bearish Trend)" | "Consolidation Range" | "Reversal Candidate",
    "biasSummary": string
  },
  "marketStructure": {
    "structureType": string,
    "keySwingPoints": string,
    "bosChochEvents": string,
    "liquidityState": string,
    "momentumAssessment": string
  },
  "indicators": [
    { "name": string, "visible": boolean, "reading": string, "interpretation": string }
  ],
  "criticalZones": {
    "resistanceZone": { "low": number, "high": number, "timeframe": string, "rationale": string, "confidencePercent": number },
    "supportZone": { "low": number, "high": number, "timeframe": string, "rationale": string, "confidencePercent": number },
    "bullishInvalidation": { "price": number, "rationale": string },
    "bearishInvalidation": { "price": number, "rationale": string },
    "breakoutConfirmation": { "zone": string, "rationale": string },
    "potentialReversalZone": { "zone": string, "rationale": string },
    "noTradeZone": { "range": string, "reason": string }
  },
  "multiTimeframeMatrix": [
    { "timeframe": string, "trend": string, "marketStructure": string, "criticalZone": string, "bias": "Bullish" | "Bearish" | "Neutral" | "Conflicting Signals" | "Insufficient Data" }
  ],
  "multiTimeframeSynthesis": string,
  "buyScenario": {
    "status": "Active Setup" | "Wait for Retest" | "Not Recommended",
    "entryType": "Aggressive Entry" | "Confirmation Entry" | "Retest Entry",
    "entryZone": { "min": number, "max": number, "ideal": number },
    "stopLoss": number,
    "takeProfit1": number,
    "takeProfit2": number,
    "takeProfit3": number,
    "riskDistance": number,
    "rewardDistanceTP1": number,
    "rewardDistanceTP2": number,
    "rewardDistanceTP3": number,
    "riskRewardRatioTP1": string,
    "riskRewardRatioTP2": string,
    "riskRewardRatioTP3": string,
    "technicalRationale": string,
    "confirmationTrigger": string,
    "invalidationCondition": string
  },
  "sellScenario": {
    "status": "Active Setup" | "Wait for Retest" | "Not Recommended",
    "entryType": "Aggressive Entry" | "Confirmation Entry" | "Retest Entry",
    "entryZone": { "min": number, "max": number, "ideal": number },
    "stopLoss": number,
    "takeProfit1": number,
    "takeProfit2": number,
    "takeProfit3": number,
    "riskDistance": number,
    "rewardDistanceTP1": number,
    "rewardDistanceTP2": number,
    "rewardDistanceTP3": number,
    "riskRewardRatioTP1": string,
    "riskRewardRatioTP2": string,
    "riskRewardRatioTP3": string,
    "technicalRationale": string,
    "confirmationTrigger": string,
    "invalidationCondition": string
  },
  "preferredSetup": {
    "action": "BUY" | "SELL" | "WAIT / NO TRADE",
    "biasStrength": "High Conviction" | "Moderate Conviction" | "Cautious / Wait",
    "selectedEntryType": string,
    "entryPriceAssumed": number,
    "stopLossPrice": number,
    "tp1": number,
    "tp2": number,
    "tp3": number,
    "riskRewardTP1": string,
    "riskRewardTP2": string,
    "riskRewardTP3": string,
    "primaryRationale": string,
    "executionTrigger": string,
    "expirationOrCancelCondition": string
  },
  "qualityScore": {
    "totalScore": number,
    "tier": "High Confluence" | "Good Confluence" | "Moderate Confluence" | "Weak Setup / No Trade",
    "breakdown": {
      "marketStructureClarity": number,
      "trendAlignment": number,
      "proximityToCriticalZone": number,
      "entryConfirmationQuality": number,
      "momentumAlignment": number,
      "riskRewardScore": number,
      "multiTimeframeConfluence": number
    },
    "scoreExplanation": string
  },
  "invalidationConditions": string[],
  "noTradeConditions": string[],
  "alternativeScenario": string,
  "missingDataAndLimitations": string[],
  "riskManagementNotes": string
}
`;

  parts.push({ text: analysisPrompt });

  // Call Gemini model with automatic retry on temporary high demand / rate limit (503/429)
  let rawText = '';
  let lastError: any = null;

  const modelsToTry = [primaryModel, fallbackModel];

  for (const currentModel of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: {
            parts,
          },
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2, // Low temperature for maximum analytical consistency and precision
          },
        });

        rawText = response.text || '';
        if (rawText) {
          lastError = null;
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';
        // If 503 (high demand) or 429 (rate limit), pause briefly before retry
        if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('429')) {
          await new Promise((r) => setTimeout(r, 1500 * attempt));
          continue;
        }
        // Non-recoverable error for this model, break to fallback model
        break;
      }
    }
    if (rawText) break;
  }

  if (!rawText) {
    if (lastError) {
      const msg = lastError.message || '';
      if (msg.includes('503') || msg.includes('high demand')) {
        throw new Error(
          'Model Gemini sedang mengalami lonjakan antrean trafik tinggi sementara dari Google. Silakan klik "Run Apex Technical Analysis" sekali lagi dalam beberapa detik.'
        );
      }
      throw new Error(`Gagal memproses analisis chart: ${msg}`);
    }
    throw new Error('Model AI mengembalikan respons analisis kosong.');
  }

  const structuredData = extractJSON(rawText);

  // Attach server-side analysis timestamp
  if (structuredData.metadata) {
    structuredData.metadata.analysisTimestamp = new Date().toISOString();
  }

  return structuredData;
}
