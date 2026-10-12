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
      'Kunci GEMINI_API_KEY belum dikonfigurasi di server. Pada Vercel, buka Project Settings > Environment Variables > tambahkan GEMINI_API_KEY lalu klik Redeploy.'
    );
  }

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
      text: `[CHART IMAGE ${idx + 1}: ${img.label || 'Timeframe screenshot'}]`,
    });
  });

  const isMultiTF = images.length > 1;

  const analysisPrompt = `
You are the quantitative trading analyst core of "APEX AI TRADING ANALYST".
Analyze the attached trading chart screenshot(s) with visual objectivity and strict risk discipline.

INPUT CONTEXT:
- Target Instrument: ${selectedInstrument || 'Auto-Detect'}
- Timeframe: ${selectedTimeframe || 'Auto-Detect'}
- Trading Mode: ${tradingMode || 'INTRADAY'} (SCALPING: M1-M15, INTRADAY: M15-H4, SWING: H4-W1)
- Stated Reference Price: ${knownPrice ? knownPrice : 'Read from chart'}
- Notes: ${userNotes ? userNotes : 'None'}
- Multi-Timeframe Submission: ${isMultiTF ? 'YES' : 'NO (Single TF - do not invent multi-TF confirmation)'}

REQUIREMENTS:
1. Audit image quality (candlestick legibility, price scale readability, symbol match). Flag mismatch if chart differs from "${selectedInstrument || ''}".
2. Market structure (HH, HL, LH, LL, BOS, CHoCH, MSS, Supply/Demand, Sweeps, FVG).
3. Indicators visible on chart (mark missing as "Tidak tersedia").
4. Critical resistance & support zones with exact price ranges, invalidation levels.
5. Dual scenarios: BUY Setup and SELL Setup with Entry, SL, TP1, TP2, TP3, R:R.
6. Preferred Setup: "BUY", "SELL", or "WAIT / NO TRADE".
7. 7-Rubric Quality Score (0-100 total): structure(20), trend(20), proximity(15), confirmation(15), momentum(10), rr(10), multiTF(10).
8. Invalidation and No-Trade conditions.
9. BAHASA INDONESIA: Sampaikan seluruh narasi (executiveSummary, biasSummary, marketStructure, technicalRationale, confirmationTrigger, qualityNotes, alternativeScenario, invalidationConditions, noTradeConditions, riskManagementNotes) dalam BAHASA INDONESIA yang profesional dan terstruktur, dengan tetap mempertahankan istilah baku trading (Bullish, Bearish, Support, Resistance, BOS, CHoCH, Liquidity Sweep, FVG, Order Block, Retest, Entry, SL, TP).

Respond strictly in valid JSON matching this schema:
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
    "secondaryTrend": string,
    "currentMarketPhase": string,
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

  let rawText = '';
  let lastError: any = null;

  // Prioritize fast, high-availability models: gemini-flash-latest, gemini-3.1-flash-lite, then gemini-3.8-flash
  const modelsToTry = [
    process.env.GEMINI_MODEL || 'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
  ];

  for (const currentModel of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: {
          parts,
        },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      rawText = response.text || '';
      if (rawText) {
        lastError = null;
        break;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${currentModel} returned: ${err?.message || err}. Trying next fallback model...`);
    }
  }

  if (!rawText) {
    const msg = lastError?.message || '';
    if (msg.includes('503') || msg.includes('high demand')) {
      throw new Error(
        'Server model AI sedang mengalami antrean trafik tinggi dari Google. Silakan klik "Run Apex Technical Analysis" sekali lagi dalam beberapa detik.'
      );
    }
    if (msg.includes('timeout') || msg.includes('504')) {
      throw new Error(
        'Proses analisis mencapai batas waktu (timeout). Silakan gunakan ukuran gambar yang lebih ringkas atau coba kembali.'
      );
    }
    throw new Error(msg || 'Model AI mengembalikan respons analisis kosong.');
  }

  const structuredData = extractJSON(rawText);

  // Attach server-side analysis timestamp
  if (structuredData.metadata) {
    structuredData.metadata.analysisTimestamp = new Date().toISOString();
  }

  return structuredData;
}
