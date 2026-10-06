import crypto from 'node:crypto';

const rateSalt = crypto.randomBytes(16);

export function randomId(bytes = 12) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function normalizeName(value) {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('und');
}

export function calculateScore(visitorName, crushName, publicId) {
  const normalized = `${normalizeName(visitorName)}\u0000${normalizeName(crushName)}\u0000${publicId}`;
  const digest = crypto.createHash('sha256').update(normalized).digest();
  return digest.readUInt32BE(0) % 101;
}

export function securityHeaders(req, res, next) {
  res.set({
    'Content-Security-Policy': req.path.startsWith('/api')
      ? "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
      : "default-src 'self'; connect-src 'self' https:; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    'Cross-Origin-Resource-Policy': req.path.startsWith('/api') ? 'cross-origin' : 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  });
  if (req.path.startsWith('/manage/')) res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  next();
}

export function rateLimit({ windowMs, limit, keyPrefix }) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const identity = crypto.createHmac('sha256', rateSalt).update(req.ip || 'unknown').digest('hex');
    const key = `${keyPrefix}:${identity}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= limit) {
      res.set('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests. Please wait a little and try again.' });
    }

    current.count += 1;
    next();
  };
}
