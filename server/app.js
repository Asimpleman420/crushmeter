import express from 'express';
import cors from 'cors';
import manageRoutes from './routes/manage.js';
import quizRoutes from './routes/quizzes.js';
import { securityHeaders } from './lib/security.js';

function corsOptions() {
  const allowed = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return {
    origin(origin, callback) {
      const normalizedOrigin = origin?.replace(/\/$/, '');
      if (!origin || process.env.NODE_ENV !== 'production' || allowed.includes(normalizedOrigin)) return callback(null, true);
      callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(securityHeaders);
  app.use(cors(corsOptions()));
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/manage', manageRoutes);

  app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
    if (error?.message === 'Origin not allowed by CORS') return res.status(403).json({ error: 'Origin not allowed.' });
    console.error('Request failed:', error.name || 'Error');
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return app;
}
