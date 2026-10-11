import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { INSTRUMENT_SEASONALITY, SUPPORTED_INSTRUMENTS_META } from './src/server/seasonalityData.js';
import { processChartAnalysis } from './src/server/analyzeCore.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase JSON body limit for multi-chart image base64 payloads
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// API Endpoint: Get seasonality data for an instrument
app.get('/api/seasonality/:instrument', (req, res) => {
  const instrument = decodeURIComponent(req.params.instrument).toUpperCase();
  const data = INSTRUMENT_SEASONALITY[instrument];
  if (!data) {
    return res.status(404).json({
      error: 'Seasonality data unavailable for the requested instrument',
      instrument,
      supported: Object.keys(INSTRUMENT_SEASONALITY),
    });
  }
  return res.json(data);
});

// API Endpoint: Get list of supported instruments and specifications
app.get('/api/instruments', (_req, res) => {
  return res.json({ instruments: SUPPORTED_INSTRUMENTS_META });
});

// API Endpoint: Multimodal Chart Analysis Engine
app.post('/api/analyze-chart', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.images || !Array.isArray(payload.images) || payload.images.length === 0) {
      return res.status(400).json({ error: 'At least one chart screenshot image is required.' });
    }

    const result = await processChartAnalysis(payload);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/analyze-chart:', error.message || error);
    return res.status(500).json({
      error: error.message || 'An error occurred while analyzing the chart screenshot.',
    });
  }
});

// Setup Vite middleware for local dev OR serve static build in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Apex AI Trading Analyst] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
