import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.ts';
import { uploadImage } from '../middleware/upload.ts';

const router = Router();

// Admin: Upload project / profile image
router.post('/admin/image', requireAdmin, uploadImage.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No image file was uploaded.' });
    return;
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully.',
    url: imageUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

export default router;
