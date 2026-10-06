import express from 'express';
import mongoose from 'mongoose';
import { authorizeManagement } from '../middleware/auth.js';
import { rateLimit } from '../lib/security.js';
import { Submission } from '../models/Submission.js';

const router = express.Router();

router.use(rateLimit({ windowMs: 60 * 1000, limit: 90, keyPrefix: 'manage' }));
router.use(authorizeManagement);

router.get('/quiz', async (req, res) => {
  const submissionCount = await Submission.countDocuments({ quizId: req.quiz._id, expiresAt: { $gt: new Date() } });
  res.json({
    publicId: req.quiz.publicId,
    creatorDisplayName: req.quiz.creatorDisplayName,
    createdAt: req.quiz.createdAt,
    expiresAt: req.quiz.expiresAt,
    submissionCount,
  });
});

router.get('/submissions', async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const query = { quizId: req.quiz._id, expiresAt: { $gt: new Date() } };
  const [items, total] = await Promise.all([
    Submission.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Submission.countDocuments(query),
  ]);

  res.json({
    items: items.map(({ _id, visitorName, crushName, score, createdAt }) => ({
      id: _id,
      visitorName,
      crushName,
      score,
      createdAt,
    })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

router.delete('/submissions/:submissionId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.submissionId)) {
    return res.status(404).json({ error: 'Response not found.' });
  }

  const result = await Submission.deleteOne({ _id: req.params.submissionId, quizId: req.quiz._id });
  if (!result.deletedCount) return res.status(404).json({ error: 'Response not found.' });
  res.status(204).end();
});

router.delete('/quiz', async (req, res) => {
  await Submission.deleteMany({ quizId: req.quiz._id });
  await req.quiz.deleteOne();
  res.status(204).end();
});

export default router;
