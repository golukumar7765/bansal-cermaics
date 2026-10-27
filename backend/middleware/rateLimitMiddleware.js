/*
 * Lightweight in-memory limiter. It deliberately has no external dependency,
 * but production must use a shared store/WAF when more than one API instance
 * is running.  The limits here are a safe final line of defence.
 */
const buckets = new Map();

const clientIp = (req) => {
  // Express applies the configured trust-proxy policy to req.ip. Reading the
  // header directly would let a client rotate arbitrary fake IP addresses.
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const rateLimit = ({ windowMs, max, keyPrefix = 'api' }) => (req, res, next) => {
  const now = Date.now();
  const key = `${keyPrefix}:${clientIp(req)}`;
  const current = buckets.get(key);
  const entry = !current || now >= current.resetAt
    ? { count: 0, resetAt: now + windowMs }
    : current;

  entry.count += 1;
  buckets.set(key, entry);
  res.setHeader('RateLimit-Limit', String(max));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));

  if (entry.count > max) {
    res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  }

  return next();
};

module.exports = { rateLimit };
