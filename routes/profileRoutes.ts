import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.ts';
import { requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Public endpoint
router.get('/', getProfile);

// Admin endpoint
router.put('/admin', requireAdmin, updateProfile);

export default router;
