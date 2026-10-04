import { Router, Request, Response, NextFunction } from 'express';
import { getCV, updateCV, uploadCVPdf, removeCVPdf, downloadCVPdf } from '../controllers/cvController.ts';
import { requireAdmin } from '../middleware/auth.ts';
import { uploadPdf } from '../middleware/upload.ts';

const router = Router();

// Public endpoints
router.get('/', getCV);
router.get('/download', downloadCVPdf);

// Admin endpoints
const handlePdfUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadPdf.single('pdf')(req, res, (err: any) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'PDF exceeds the 20MB size limit.' : err.message || 'Invalid PDF upload.';
      res.status(status).json({ success: false, message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No PDF file received. Please choose a .pdf file.' });
      return;
    }
    next();
  });
};

router.put('/admin', requireAdmin, updateCV);
router.post('/admin/upload-pdf', requireAdmin, handlePdfUpload, uploadCVPdf);
router.delete('/admin/pdf', requireAdmin, removeCVPdf);

export default router;

