import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio';

  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    });
    console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error: any) {
    console.warn(`[Database] Could not connect to MongoDB at "${uri}": ${error.message}`);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB connection dropped.');
  });

  mongoose.connection.on('connected', () => {
    console.log('[Database] MongoDB connection established.');
  });
}

/**
 * Ensures MongoDB connection is active.
 * If connecting (during Render cold start), awaits connection up to timeoutMs.
 */
export async function ensureDbConnected(timeoutMs = 12000): Promise<boolean> {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // If disconnected, trigger connect
  if ((mongoose.connection.readyState as number) === 0) {
    connectDB().catch(() => {});
  }

  const startTime = Date.now();
  while ((mongoose.connection.readyState as number) !== 1 && (Date.now() - startTime) < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return (mongoose.connection.readyState as number) === 1;
}
