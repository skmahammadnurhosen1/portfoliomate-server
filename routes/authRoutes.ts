import { Router } from 'express';
import { login, logout, getMe, changePassword } from '../controllers/authController.ts';
import { requireAdmin } from '../middleware/auth.ts';
import { loginLimiter } from '../middleware/rateLimiter.ts';

const router = Router();

// Public login endpoint protected by anti brute-force rate limiter
router.post('/login', loginLimiter, login);

// Admin-only endpoints
router.post('/logout', logout);
router.get('/me', requireAdmin, getMe);
router.post('/change-password', requireAdmin, changePassword);

export default router;
