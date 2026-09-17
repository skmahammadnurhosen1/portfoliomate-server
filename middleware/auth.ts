import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Admin, IAdmin } from '../models/Admin.ts';

export interface AuthenticatedRequest extends Request {
  admin?: IAdmin;
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.admin_token || req.cookies?.token;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No session token provided.',
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'noor_portfolio_super_secure_production_jwt_secret_key_2026!';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Session has expired. Please sign in again.',
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: 'Invalid session token.',
      });
      return;
    }

    if (!decoded || !decoded.id) {
      res.status(401).json({
        success: false,
        message: 'Malformed session token.',
      });
      return;
    }

    // Handle dev fallback admin token when DB is in fallback mode
    if (decoded.id === 'dev-admin-id' && mongoose.connection.readyState !== 1) {
      req.admin = {
        _id: 'dev-admin-id',
        email: decoded.email,
        role: 'admin',
        isLocked: () => false,
      } as any;
      return next();
    }

    // Check database if connected
    if (mongoose.connection.readyState === 1) {
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Authorized admin account no longer exists.',
        });
        return;
      }

      if (admin.isLocked()) {
        res.status(423).json({
          success: false,
          message: 'Admin account is temporarily locked due to security policy.',
        });
        return;
      }

      req.admin = admin;
      return next();
    }

    res.status(503).json({
      success: false,
      message: 'Database connection is not available.',
    });
  } catch (error) {
    console.error('[Auth Middleware] Error verifying admin authorization:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization check.',
    });
  }
}
