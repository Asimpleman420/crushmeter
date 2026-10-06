import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  publicId: { type: String, required: true, unique: true, index: true },
  managementTokenHash: { type: String, required: true, unique: true, index: true, select: false },
  creatorDisplayName: { type: String, trim: true, maxlength: 50, default: '' },
  expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

quizSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Quiz = mongoose.model('Quiz', quizSchema);
