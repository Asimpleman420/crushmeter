import { Quiz } from '../models/Quiz.js';
import { hashToken } from '../lib/security.js';

export async function authorizeManagement(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+([A-Za-z0-9_-]{43,})$/);

  if (!match) {
    return res.status(401).json({ error: 'This dashboard link is invalid or incomplete.' });
  }

  const quiz = await Quiz.findOne({
    managementTokenHash: hashToken(match[1]),
    expiresAt: { $gt: new Date() },
  }).select('+managementTokenHash');

  if (!quiz) {
    return res.status(404).json({ error: 'This dashboard is invalid, expired, or has been deleted.' });
  }

  req.quiz = quiz;
  res.set('Cache-Control', 'no-store');
  next();
}
