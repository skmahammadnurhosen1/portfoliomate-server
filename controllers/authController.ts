import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Admin } from '../models/Admin.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'noor_portfolio_super_secure_production_jwt_secret_key_2026!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isProduction = process.env.NODE_ENV === 'production';

    // If MongoDB is not connected, use environment credentials in fallback mode
    if (mongoose.connection.readyState !== 1) {
      const fallbackEmail = (process.env.ADMIN_EMAIL || 'admin@noor.dev').toLowerCase();
      const fallbackPass = process.env.ADMIN_INITIAL_PASSWORD || 'AdminSecurePass2026!';

      if (normalizedEmail === fallbackEmail && password === fallbackPass) {
        const token = jwt.sign(
          { id: 'dev-admin-id', email: fallbackEmail, role: 'admin' },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN as any }
        );

        res.cookie('admin_token', token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'strict' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
          success: true,
          token,
          admin: {
            id: 'dev-admin-id',
            email: fallbackEmail,
            role: 'admin',
            lastLoginAt: new Date(),
          },
          notice: 'Authenticated in local fallback mode. Configure MONGODB_URI to persist changes in MongoDB.',
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: 'Invalid credentials or unauthorized access.',
      });
      return;
    }

    // Database is connected: Query admin explicitly selecting password
    const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials or unauthorized access.',
      });
      return;
    }

    // Check if account is locked
    if (admin.isLocked()) {
      const lockRemainingMinutes = Math.ceil(
        ((admin.lockUntil?.getTime() || 0) - Date.now()) / (60 * 1000)
      );
      res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please retry in ${lockRemainingMinutes} minute(s).`,
      });
      return;
    }

    // Verify password with bcrypt
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      await admin.incLoginAttempts();
      const attemptsLeft = 5 - (admin.failedLoginAttempts + 1);

      res.status(401).json({
        success: false,
        message: attemptsLeft > 0
          ? `Invalid credentials. ${attemptsLeft} attempt(s) remaining before temporary lockout.`
          : 'Invalid credentials. Account has been temporarily locked for 15 minutes.',
      });
      return;
    }

    // Reset attempt counters
    await admin.resetLoginAttempts();

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('[Auth Controller] Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred during authentication.',
    });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.admin) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  res.status(200).json({
    success: true,
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      role: req.admin.role,
      lastLoginAt: req.admin.lastLoginAt,
    },
  });
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database is not connected. Configure MONGODB_URI in .env to change password in MongoDB.',
      });
      return;
    }

    const admin = await Admin.findById(req.admin?._id).select('+password');
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found.' });
      return;
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Current password does not match.',
      });
      return;
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('[Auth Controller] Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password.',
    });
  }
}
