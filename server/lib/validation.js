import { z } from 'zod';

const cleanString = (max, label) => z.string({ error: `${label} is required.` })
  .transform((value) => value.trim().replace(/\s+/gu, ' '))
  .pipe(z.string().min(1, `${label} is required.`).max(max, `${label} must be ${max} characters or fewer.`));

export const createQuizSchema = z.object({
  creatorDisplayName: z.string().max(50, 'Display name must be 50 characters or fewer.')
    .transform((value) => value.trim().replace(/\s+/gu, ' '))
    .optional()
    .default(''),
}).strict();

export const submissionSchema = z.object({
  visitorName: cleanString(60, 'Your name'),
  crushName: cleanString(60, "Your crush's name"),
  consent: z.literal(true, { error: 'You must agree before sharing these names.' }),
}).strict();

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (result.success) return { data: result.data };

  return {
    error: result.error.issues[0]?.message || 'Please check the information you entered.',
    details: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  };
}
