import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.ts';
import { seedDatabase } from './utils/seed.ts';
import { apiLimiter } from './middleware/rateLimiter.ts';
import { errorHandler } from './middleware/errorHandler.ts';

import authRoutes from './routes/authRoutes.ts';
import projectRoutes from './routes/projectRoutes.ts';
import profileRoutes from './routes/profileRoutes.ts';
import cvRoutes from './routes/cvRoutes.ts';
import messageRoutes from './routes/messageRoutes.ts';
import uploadRoutes from './routes/uploadRoutes.ts';

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Connect to MongoDB & Seed initial data
(async () => {
  await connectDB();
  await seedDatabase();
})();

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible media and fonts across dev/preview
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows uploaded images/PDFs to load
  })
);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CORS_ORIGIN,
  process.env.APP_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps or curl) or matching origins
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in local dev, but credentials-friendly
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsing & Cookie Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'noor_cookie_secret_key_2026'));

// Static uploads directory for images and custom CV PDFs
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Apply general API rate limiter to all /api routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/contact', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Production Static Serving
if (isProduction) {
  const distDir = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distDir));

  // Catch-all route to serve SPA index.html for client-side routing
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
}

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] Portfolio backend running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log(`[Server] API endpoints available at http://localhost:${PORT}/api`);
});

export default app;
