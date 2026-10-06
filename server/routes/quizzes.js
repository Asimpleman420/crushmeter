import express from 'express';
import { Quiz } from '../models/Quiz.js';
import { Submission } from '../models/Submission.js';
import { calculateScore, hashToken, randomId, rateLimit } from '../lib/security.js';
import { createQuizSchema, parseBody, submissionSchema } from '../lib/validation.js';

const router = express.Router();
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const CONSENT_VERSION = '2026-10-01';

router.param('publicId', (req, res, next, value) => {
  if (!/^[A-Za-z0-9_-]{16}$/.test(value)) {
    return res.status(404).json({ error: 'This quiz is invalid, expired, or has been deleted.' });
  }
  next();
});

function appUrl() {
  const configured = process.env.PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:' && !isLocalhost) return null;
      return url.origin;
    } catch {
      return null;
    }
  }
  if (process.env.NODE_ENV === 'production') return null;
  return 'http://localhost:5173';
}

router.post('/', rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, keyPrefix: 'create' }), async (req, res) => {
  const parsed = parseBody(createQuizSchema, req.body);
  if (parsed.error) return res.status(400).json(parsed);

  const publicAppUrl = appUrl();
  if (!publicAppUrl) {
    return res.status(503).json({ error: 'The app URL is not configured. Please contact the site owner.' });
  }

  const managementToken = randomId(32);
  const expiresAt = new Date(Date.now() + THIRTY_DAYS);
  const quiz = await Quiz.create({
    publicId: randomId(12),
    managementTokenHash: hashToken(managementToken),
    creatorDisplayName: parsed.data.creatorDisplayName,
    expiresAt,
  });

  res.status(201).set('Cache-Control', 'no-store').json({
    publicId: quiz.publicId,
    publicUrl: `${publicAppUrl}/q/${quiz.publicId}`,
    managementUrl: `${publicAppUrl}/manage/${managementToken}`,
    creatorDisplayName: quiz.creatorDisplayName,
    createdAt: quiz.createdAt,
    expiresAt,
  });
});

router.get('/:publicId', rateLimit({ windowMs: 60 * 1000, limit: 120, keyPrefix: 'public-read' }), async (req, res) => {
  const quiz = await Quiz.findOne({ publicId: req.params.publicId, expiresAt: { $gt: new Date() } });
  if (!quiz) return res.status(404).json({ error: 'This quiz is invalid, expired, or has been deleted.' });

  res.json({
    publicId: quiz.publicId,
    creatorDisplayName: quiz.creatorDisplayName,
    createdAt: quiz.createdAt,
    expiresAt: quiz.expiresAt,
  });
});

router.post('/:publicId/submissions', rateLimit({ windowMs: 60 * 60 * 1000, limit: 40, keyPrefix: 'submit' }), async (req, res) => {
  const parsed = parseBody(submissionSchema, req.body);
  if (parsed.error) return res.status(400).json(parsed);

  const quiz = await Quiz.findOne({ publicId: req.params.publicId, expiresAt: { $gt: new Date() } });
  if (!quiz) return res.status(404).json({ error: 'This quiz is invalid, expired, or has been deleted.' });

  const score = calculateScore(parsed.data.visitorName, parsed.data.crushName, quiz.publicId);
  const submission = await Submission.create({
    quizId: quiz._id,
    visitorName: parsed.data.visitorName,
    crushName: parsed.data.crushName,
    score,
    consentVersion: CONSENT_VERSION,
    consentedAt: new Date(),
    expiresAt: quiz.expiresAt,
  });

  res.status(201).set('Cache-Control', 'no-store').json({
    submissionId: submission._id,
    score,
    message: score >= 85 ? 'A seriously sweet match!' : score >= 65 ? 'There may be a little sparkle here.' : score >= 40 ? 'A charming maybe—keep smiling!' : 'Plot twist! Friendship can be lovely too.',
    disclaimer: "Just for fun — this cannot measure someone’s feelings.",
  });
});

export default router;
