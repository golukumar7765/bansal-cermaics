const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

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
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        email: adminEmail,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '8h'
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

module.exports = router;