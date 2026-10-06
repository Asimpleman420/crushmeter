import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  publicId: { type: String, required: true, unique: true, index: true },
  managementTokenHash: { type: String, required: true, unique: true, index: true, select: false },
  creatorDisplayName: { type: String, required: true, trim: true, maxlength: 50 },
  creatorNameKey: { type: String, select: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

quizSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
quizSchema.index(
  { creatorNameKey: 1 },
  { unique: true, partialFilterExpression: { creatorNameKey: { $type: 'string' } } },
);

export const Quiz = mongoose.model('Quiz', quizSchema);
