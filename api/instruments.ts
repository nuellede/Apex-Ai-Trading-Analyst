import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPPORTED_INSTRUMENTS_META } from '../src/server/seasonalityData.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({ instruments: SUPPORTED_INSTRUMENTS_META });
}
