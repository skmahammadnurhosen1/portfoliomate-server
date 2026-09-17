import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio';

  try {
    mongoose.set('strictQuery', true);
    // Disable query buffering so requests don't hang indefinitely when disconnected
    mongoose.set('bufferCommands', false);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 30000,
    });
    console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error: any) {
    console.warn(`[Database] Could not connect to MongoDB at "${uri}": ${error.message}`);
    console.warn('[Database] Running in disconnected/fallback mode. Configure MONGODB_URI in .env to connect to your MongoDB Atlas cluster.');
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB connection dropped.');
  });

  mongoose.connection.on('connected', () => {
    console.log('[Database] MongoDB connection established.');
  });
}
