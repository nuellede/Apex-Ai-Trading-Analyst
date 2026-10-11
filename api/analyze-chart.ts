import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processChartAnalysis } from '../src/server/analyzeCore.js';

export const config = {
  maxDuration: 60, // Allow up to 60s for multimodal vision reasoning
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers if accessed across domains
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const payload = req.body;
    if (!payload || !payload.images) {
      return res.status(400).json({ error: 'At least one chart screenshot image is required.' });
    }

    const result = await processChartAnalysis(payload);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[Vercel Serverless] Error in /api/analyze-chart:', error.message || error);
    return res.status(500).json({
      error: error.message || 'An error occurred during chart analysis.',
    });
  }
}
