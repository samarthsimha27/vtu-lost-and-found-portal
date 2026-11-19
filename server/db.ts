import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vtu_lost_found';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (isConnected) return true;

  try {
    console.log(`[MongoDB] Connecting to ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log('[MongoDB] Connected successfully to database');
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[MongoDB] Could not connect to MongoDB: ${errorMsg}`);
    console.warn(
      '[MongoDB] Running in-memory store fallback. Set MONGODB_URI in .env to persist across server restarts.'
    );
    isConnected = false;
    return false;
  }
}

export function getIsConnected(): boolean {
  return isConnected;
}
