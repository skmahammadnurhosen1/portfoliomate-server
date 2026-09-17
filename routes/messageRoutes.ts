import { Router } from 'express';
import {
  submitContactMessage,
  getAdminMessages,
  toggleMessageRead,
  deleteMessage,
} from '../controllers/messageController.ts';
import { requireAdmin } from '../middleware/auth.ts';
import { contactLimiter } from '../middleware/rateLimiter.ts';

const router = Router();

// Public endpoint with spam protection
router.post('/', contactLimiter, submitContactMessage);

// Admin endpoints
router.get('/admin/all', requireAdmin, getAdminMessages);
router.patch('/admin/:id/read', requireAdmin, toggleMessageRead);
router.delete('/admin/:id', requireAdmin, deleteMessage);

export default router;
