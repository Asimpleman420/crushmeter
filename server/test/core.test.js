import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../app.js';
import { calculateScore, hashToken } from '../lib/security.js';
import { parseBody, submissionSchema } from '../lib/validation.js';
import { Quiz } from '../models/Quiz.js';
import { Submission } from '../models/Submission.js';

test('submission validation requires explicit consent and valid names', () => {
  assert.match(parseBody(submissionSchema, { visitorName: 'A', crushName: 'B', consent: false }).error, /agree/i);
  assert.match(parseBody(submissionSchema, { visitorName: '   ', crushName: 'B', consent: true }).error, /required/i);
  assert.match(parseBody(submissionSchema, { visitorName: 'A'.repeat(61), crushName: 'B', consent: true }).error, /60/);
  assert.deepEqual(parseBody(submissionSchema, { visitorName: '  আবির  ', crushName: '  নীলা ', consent: true }).data, {
    visitorName: 'আবির', crushName: 'নীলা', consent: true,
  });
});

test('scores are deterministic and normalize case, width, and spacing', () => {
  const first = calculateScore('  Alice ', 'BOB', 'quiz-one');
  const repeated = calculateScore('alice', 'bob', 'quiz-one');
  assert.equal(first, repeated);
  assert.ok(Number.isInteger(first) && first >= 0 && first <= 100);
  assert.equal(calculateScore('Ａlice', 'Bob', 'quiz-one'), repeated);
  assert.notEqual(calculateScore('alice', 'bob', 'another-quiz'), first);
});

const original = {
  quizFindOne: Quiz.findOne,
  submissionCount: Submission.countDocuments,
  submissionDeleteOne: Submission.deleteOne,
};
let baseUrl;
let server;
let lastDeleteFilter;
const token = 'a'.repeat(43);
const quizId = '507f1f77bcf86cd799439011';

before(async () => {
  Quiz.findOne = (query) => {
    if (query.managementTokenHash) {
      return {
        select: async () => query.managementTokenHash === hashToken(token) ? {
          _id: quizId,
          publicId: 'public-123456789',
          creatorDisplayName: 'Mina',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          expiresAt: new Date('2099-01-01T00:00:00Z'),
        } : null,
      };
    }
    return Promise.resolve(query.publicId === 'public-123456789' ? {
      publicId: 'public-123456789',
      creatorDisplayName: 'Mina',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      expiresAt: new Date('2099-01-01T00:00:00Z'),
      managementTokenHash: 'must-never-leak',
    } : null);
  };
  Submission.countDocuments = async () => 0;
  Submission.deleteOne = async (filter) => {
    lastDeleteFilter = filter;
    return { deletedCount: String(filter.quizId) === quizId ? 1 : 0 };
  };

  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  Quiz.findOne = original.quizFindOne;
  Submission.countDocuments = original.submissionCount;
  Submission.deleteOne = original.submissionDeleteOne;
  await new Promise((resolve) => server.close(resolve));
});

test('public metadata never exposes management credentials', async () => {
  const response = await fetch(`${baseUrl}/api/quizzes/public-123456789`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.publicId, 'public-123456789');
  assert.equal(body.managementTokenHash, undefined);
  assert.equal(body.managementToken, undefined);
});

test('private APIs reject missing tokens', async () => {
  const response = await fetch(`${baseUrl}/api/manage/quiz`);
  assert.equal(response.status, 401);
});

test('response deletion is always scoped to the authorized quiz', async () => {
  const response = await fetch(`${baseUrl}/api/manage/submissions/507f191e810c19729de860ea`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 204);
  assert.equal(String(lastDeleteFilter.quizId), quizId);
  assert.equal(String(lastDeleteFilter._id), '507f191e810c19729de860ea');
});

test('expired or missing public quizzes return a clear not-found response', async () => {
  const response = await fetch(`${baseUrl}/api/quizzes/expired-quiz-000`);
  assert.equal(response.status, 404);
  assert.match((await response.json()).error, /expired/i);
});
