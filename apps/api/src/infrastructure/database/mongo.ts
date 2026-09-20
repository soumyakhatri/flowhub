import mongoose from 'mongoose';
import { env } from '../../config/env';
import { logger } from '../logging/logger';

export async function connectMongo(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, { autoIndex: true });
  logger.info('mongodb connected');
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

export function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}