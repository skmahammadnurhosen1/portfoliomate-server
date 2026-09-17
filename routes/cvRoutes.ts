import { Router } from 'express';
import { getCV, updateCV, uploadCVPdf, removeCVPdf } from '../controllers/cvController.ts';
import { requireAdmin } from '../middleware/auth.ts';
import { uploadPdf } from '../middleware/upload.ts';

const router = Router();

// Public endpoint
router.get('/', getCV);

// Admin endpoints
router.put('/admin', requireAdmin, updateCV);
router.post('/admin/upload-pdf', requireAdmin, uploadPdf.single('pdf'), uploadCVPdf);
router.delete('/admin/pdf', requireAdmin, removeCVPdf);

export default router;
