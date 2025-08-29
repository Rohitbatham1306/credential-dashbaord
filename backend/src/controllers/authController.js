const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActionLog = require('../models/ActionLog');
const { 
  sendVerificationEmail, 
  sendOnboardingEmail, 
  sendPasswordResetEmail, 
  generateToken 
} = require('../services/mailer');

// Generate JWT tokens
function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  
  return { accessToken, refreshToken };
}

async function register(req, res) {
  try {
    const { email, name, password, role } = req.body;
    
    // Validate input
    if (!email || !name || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Check if user already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create user
    const user = await User.create({ 
      email, 
      name, 
      passwordHash, 
      role: role || 'user',
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });
    
    // Send verification email
    let emailSent = false;
    try {
      await sendVerificationEmail({ email, name, token: verificationToken });
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // For development, log the verification URL
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Verification URL:', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`);
      }
    }
    
    // Log action
    await ActionLog.create({ 
      userEmail: email, 
      action: 'register', 
      details: JSON.stringify({ role, verificationSent: true }) 
    });
    
    const message = emailSent 
      ? 'Registration successful. Please check your email to verify your account.'
      : 'Registration successful. Please contact administrator for email verification.';
    
    return res.status(201).json({ 
      message,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
      emailSent,
      verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    });
  } catch (e) {
    console.error('Registration error:', e);
    return res.status(500).json({ message: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(400).json({ 
        message: 'Please verify your email before logging in. Check your inbox for verification link.' 
      });
    }
    
    // Check password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is offboarded
    if (user.status === 'Offboarded') {
      return res.status(403).json({ message: 'Account has been offboarded. Contact administrator.' });
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Update last login
    await user.update({ lastLoginAt: new Date() });
    
    // Log action
    await ActionLog.create({ 
      userEmail: email, 
      action: 'login', 
      details: JSON.stringify({ success: true, timestamp: new Date() }) 
    });
    
    return res.json({ 
      accessToken, 
      refreshToken,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        status: user.status 
      } 
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ message: 'Login failed' });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }
    
    console.log('Verifying email with token:', token);
    
    // Find user with this token
    const user = await User.findOne({ 
      where: { 
        emailVerificationToken: token,
        emailVerificationExpires: { [require('sequelize').Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      // Check if user exists but token is expired
      const expiredUser = await User.findOne({ 
        where: { emailVerificationToken: token }
      });
      
      if (expiredUser) {
        return res.status(400).json({ 
          message: 'Verification token has expired. Please request a new verification email.',
          expired: true
        });
      }
      
      return res.status(400).json({ message: 'Invalid verification token' });
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified. You can now log in.' });
    }
    
    // Verify email
    await user.update({ 
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });
    
    // Log action
    await ActionLog.create({ 
      userEmail: user.email, 
      action: 'email_verified', 
      details: JSON.stringify({ timestamp: new Date() }) 
    });
    
    console.log('Email verified successfully for user:', user.email);
    
    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (e) {
    console.error('Email verification error:', e);
    return res.status(500).json({ message: 'Email verification failed' });
  }
}

async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Generate new verification token
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Update user
    await user.update({ 
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });
    
    // Send verification email
    try {
      await sendVerificationEmail({ email, name: user.name, token: verificationToken });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ message: 'Failed to send verification email' });
    }
    
    // Log action
    await ActionLog.create({ 
      userEmail: email, 
      action: 'resend_verification', 
      details: JSON.stringify({ timestamp: new Date() }) 
    });
    
    return res.json({ message: 'Verification email sent successfully' });
  } catch (e) {
    console.error('Resend verification error:', e);
    return res.status(500).json({ message: 'Failed to resend verification email' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    
    // Generate reset token
    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Update user
    await user.update({ 
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires
    });
    
    // Send reset email
    try {
      await sendPasswordResetEmail({ email, name: user.name, token: resetToken });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({ message: 'Failed to send password reset email' });
    }
    
    // Log action
    await ActionLog.create({ 
      userEmail: email, 
      action: 'forgot_password', 
      details: JSON.stringify({ timestamp: new Date() }) 
    });
    
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (e) {
    console.error('Forgot password error:', e);
    return res.status(500).json({ message: 'Failed to process password reset request' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Find user with valid reset token
    const user = await User.findOne({ 
      where: { 
        passwordResetToken: token,
        passwordResetExpires: { [require('sequelize').Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update user
    await user.update({ 
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null
    });
    
    // Log action
    await ActionLog.create({ 
      userEmail: user.email, 
      action: 'password_reset', 
      details: JSON.stringify({ timestamp: new Date() }) 
    });
    
    return res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (e) {
    console.error('Password reset error:', e);
    return res.status(500).json({ message: 'Password reset failed' });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh-secret');
    
    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    return res.json(tokens);
  } catch (e) {
    console.error('Token refresh error:', e);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // From auth middleware
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const currentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!currentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await user.update({ passwordHash: newPasswordHash });
    
    // Log action
    await ActionLog.create({ 
      userEmail: user.email, 
      action: 'password_changed', 
      details: JSON.stringify({ timestamp: new Date() }) 
    });
    
    return res.json({ message: 'Password changed successfully' });
  } catch (e) {
    console.error('Change password error:', e);
    return res.status(500).json({ message: 'Failed to change password' });
  }
}

module.exports = { 
  register, 
  login, 
  verifyEmail, 
  resendVerification, 
  forgotPassword, 
  resetPassword, 
  refreshToken, 
  changePassword 
};

