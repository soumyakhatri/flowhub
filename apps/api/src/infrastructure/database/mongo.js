import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { logger } from '../logging/logger.js';
export async function connectMongo() {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, { autoIndex: true });
    logger.info('mongodb connected');
}
export async function disconnectMongo() {
    await mongoose.disconnect();
}
export function isMongoReady() {
    return mongoose.connection.readyState === 1;
}
