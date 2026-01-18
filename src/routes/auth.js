const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { signupValidation, loginValidation } = require('../middleware/validators');

const router = express.Router();

// Helper to generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// POST /api/auth/signup
router.post('/signup', signupValidation, async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({ error: `User with this ${field} already exists` });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists with this email, you will receive a reset link' });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In production, send email here with nodemailer
    // For now, log the token (for testing with friends)
    console.log(`\n========================================`);
    console.log(`PASSWORD RESET REQUEST`);
    console.log(`User: ${user.email}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Reset URL: http://localhost:5173/reset-password?token=${resetToken}`);
    console.log(`Expires: ${resetTokenExpiry}`);
    console.log(`========================================\n`);

    res.json({
      message: 'If an account exists with this email, you will receive a reset link',
      // Include token in response for testing (remove in production)
      ...(process.env.NODE_ENV !== 'production' && { resetToken }),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
