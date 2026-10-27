const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// Small in-process throttle for password guessing. Deploying behind a reverse
// proxy/WAF is still recommended, but this prevents unlimited attempts on one
// server instance without adding another runtime dependency.
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const clientKey = (req, email = '') => `${req.ip || 'unknown'}:${String(email).trim().toLowerCase()}`;
const isLocked = (key) => {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAttempt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
};
const recordFailure = (key) => {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.firstAttempt > WINDOW_MS) attempts.set(key, { count: 1, firstAttempt: Date.now() });
  else attempts.set(key, { ...entry, count: entry.count + 1 });
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const key = clientKey(req, email);

    if (isLocked(key)) {
      return res.status(429).json({ success: false, message: 'Too many login attempts. Please try again in 15 minutes.' });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminPasswordHash || !process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Admin authentication is not configured.'
      });
    }

    if (
      email.trim().toLowerCase() !==
      adminEmail.trim().toLowerCase()
    ) {
      recordFailure(key);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      adminPasswordHash
    );

    if (!passwordMatches) {
      recordFailure(key);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    attempts.delete(key);

    const token = jwt.sign(
      {
        email: adminEmail,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h'
      }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      admin: {
        email: adminEmail,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Admin Login Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
});

// Used by the frontend guard to verify that a saved browser token is valid.
router.get('/me', protect, (req, res) => {
  return res.json({ success: true, admin: { email: req.admin.email, role: req.admin.role } });
});

module.exports = router;
