import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Storage engine generating collision-resistant secure filenames
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const randomHex = crypto.randomBytes(12).toString('hex');
    const sanitizedExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    cb(null, `${Date.now()}-${randomHex}${sanitizedExt}`);
  },
});

// Filter for image uploads (Disallow raw SVG to prevent Stored XSS attacks)
const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP, and GIF raster images are allowed.'));
  }
};

// Filter for CV PDF uploads
const pdfFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');
  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('Only valid PDF documents (.pdf) are allowed.'));
  }
};

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export const uploadPdf = multer({
  storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 12 * 1024 * 1024, // 12MB limit (Safe ceiling below MongoDB Atlas 16MB BSON limit)
  },
});
