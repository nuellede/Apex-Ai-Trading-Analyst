import type { VercelRequest, VercelResponse } from '@vercel/node';
import { INSTRUMENT_SEASONALITY } from '../src/server/seasonalityData.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { instrument } = req.query;
  const symbol = (Array.isArray(instrument) ? instrument[0] : instrument || 'XAUUSD').toUpperCase();

  const data = INSTRUMENT_SEASONALITY[symbol];
  if (!data) {
    return res.status(404).json({
      error: 'Seasonality data unavailable for ' + symbol,
      instrument: symbol,
      supported: Object.keys(INSTRUMENT_SEASONALITY),
    });
  }

  return res.status(200).json(data);
}
