import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CV } from '../models/CV.ts';
import { UploadedFile } from '../models/UploadedFile.ts';
import { DEFAULT_CV_DATA } from '../data/defaultData.ts';
import fs from 'fs';
import path from 'path';

// Public: Get CV data
export async function getCV(_req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(200).json({
        success: true,
        data: DEFAULT_CV_DATA,
        isFallback: true,
      });
      return;
    }

    let cv = await CV.findOne().lean();
    if (!cv) {
      res.status(200).json({
        success: true,
        data: DEFAULT_CV_DATA,
      });
      return;
    }

    res.status(200).json({ success: true, data: cv });
  } catch (error) {
    console.error('[CV Controller] Error fetching CV data:', error);
    res.status(200).json({
      success: true,
      data: DEFAULT_CV_DATA,
      isFallback: true,
    });
  }
}

// Admin: Update CV data
export async function updateCV(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please configure MONGODB_URI in .env.',
      });
      return;
    }

    const updates = req.body;

    const cv = await CV.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'CV data updated successfully.',
      data: cv,
    });
  } catch (error: any) {
    console.error('[CV Controller] Error updating CV data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update CV data.',
    });
  }
}

// Admin: Upload custom PDF
export async function uploadCVPdf(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please configure MONGODB_URI in .env.',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No PDF file was provided.' });
      return;
    }

    const file = req.file;
    const fileUrl = `/uploads/${file.filename}`;
    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;
    const uploadDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const cv = await CV.findOne();
    if (cv?.customPdfUrl && cv.customPdfUrl.startsWith('/uploads/')) {
      const oldFilename = path.basename(cv.customPdfUrl);
      const oldPath = path.resolve(process.cwd(), 'uploads', oldFilename);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn('[CV Controller] Failed to delete old PDF file:', e);
        }
      }
      await UploadedFile.deleteOne({ filename: oldFilename }).catch(() => {});
    }

    // Persist PDF buffer in MongoDB Atlas so it survives Render dyno restarts
    try {
      const fileBuffer = fs.readFileSync(file.path);
      await UploadedFile.findOneAndUpdate(
        { filename: file.filename },
        {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype || 'application/pdf',
          size: file.size,
          data: fileBuffer,
        },
        { upsert: true, new: true }
      );
    } catch (persistErr) {
      console.error('[CV Controller] Failed to persist CV PDF in MongoDB Atlas:', persistErr);
    }

    const updated = await CV.findOneAndUpdate(
      {},
      {
        $set: {
          customPdfUrl: fileUrl,
          customPdfFileName: file.originalname,
          customPdfFileSize: formattedSize,
          customPdfUploadDate: uploadDate,
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'CV PDF uploaded successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('[CV Controller] Error uploading CV PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload PDF.',
    });
  }
}

// Admin: Remove custom PDF
export async function removeCVPdf(_req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please configure MONGODB_URI in .env.',
      });
      return;
    }

    const cv = await CV.findOne();
    if (cv?.customPdfUrl && cv.customPdfUrl.startsWith('/uploads/')) {
      const filename = path.basename(cv.customPdfUrl);
      const filePath = path.resolve(process.cwd(), 'uploads', filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('[CV Controller] Failed to delete PDF file on disk:', e);
        }
      }
      await UploadedFile.deleteOne({ filename }).catch(() => {});
    }

    const updated = await CV.findOneAndUpdate(
      {},
      {
        $unset: {
          customPdfUrl: 1,
          customPdfFileName: 1,
          customPdfFileSize: 1,
          customPdfUploadDate: 1,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Custom CV PDF removed successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('[CV Controller] Error removing CV PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to remove CV PDF.' });
  }
}

// Public: Download custom CV PDF with attachment headers
export async function downloadCVPdf(_req: Request, res: Response): Promise<void> {
  try {
    const cv = await CV.findOne().lean();
    if (!cv || !cv.customPdfUrl) {
      res.status(404).json({ success: false, message: 'No CV PDF has been uploaded yet.' });
      return;
    }

    const filename = path.basename(cv.customPdfUrl);
    const downloadFileName = cv.customPdfFileName || 'Nur_Hosen_CV.pdf';

    // Try local disk first
    const diskPath = path.resolve(process.cwd(), 'uploads', filename);
    if (fs.existsSync(diskPath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadFileName)}"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.sendFile(diskPath);
      return;
    }

    // Fallback to MongoDB Atlas UploadedFile
    const uploadedFile = await UploadedFile.findOne({ filename });
    if (uploadedFile && uploadedFile.data) {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadFileName)}"`);
      res.setHeader('Content-Type', uploadedFile.mimetype || 'application/pdf');
      res.setHeader('Content-Length', uploadedFile.size.toString());
      res.send(uploadedFile.data);
      return;
    }

    res.status(404).json({ success: false, message: 'CV PDF file content not found on server.' });
  } catch (error) {
    console.error('[CV Controller] Error downloading CV PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to download CV PDF.' });
  }
}
