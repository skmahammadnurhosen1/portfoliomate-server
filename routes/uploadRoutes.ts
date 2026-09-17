import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../middleware/auth.ts';
import { uploadImage } from '../middleware/upload.ts';
import { UploadedFile } from '../models/UploadedFile.ts';

const router = Router();

// Admin: Upload project / profile image
router.post('/admin/image', requireAdmin, uploadImage.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No image file was uploaded.' });
    return;
  }

  try {
    // Persist file buffer in MongoDB Atlas so it survives Render dyno restarts
    const fileBuffer = fs.readFileSync(req.file.path);
    await UploadedFile.findOneAndUpdate(
      { filename: req.file.filename },
      {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: fileBuffer,
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('[Upload] Failed to persist image in MongoDB Atlas:', error);
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

// Public: Serve uploaded file directly (fallback endpoint)
router.get('/file/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const diskPath = path.resolve(process.cwd(), 'uploads', filename);

    if (fs.existsSync(diskPath)) {
      return res.sendFile(diskPath);
    }

    const file = await UploadedFile.findOne({ filename });
    if (file && file.data) {
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Length', file.size.toString());
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.send(file.data);
    }

    return res.status(404).json({ success: false, message: 'File not found.' });
  } catch (error) {
    console.error('[Upload] Error serving file:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving file.' });
  }
});

export default router;
