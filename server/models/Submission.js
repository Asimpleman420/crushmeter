import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  visitorName: { type: String, required: true, trim: true, maxlength: 60 },
  crushName: { type: String, required: true, trim: true, maxlength: 60 },
  score: { type: Number, required: true, min: 0, max: 100 },
  consentVersion: { type: String, required: true },
  consentedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

submissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
submissionSchema.index({ quizId: 1, createdAt: -1 });

export const Submission = mongoose.model('Submission', submissionSchema);
