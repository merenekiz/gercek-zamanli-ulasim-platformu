import { Sequelize } from 'sequelize';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import logger from '../utils/logger';

// PostgreSQL Configuration
export const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'ankara_ulasim_db',
  process.env.POSTGRES_USER || 'ankara_admin',
  process.env.POSTGRES_PASSWORD || 'ankara_password_2024',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// MongoDB Configuration
export const connectMongoDB = async (): Promise<typeof mongoose> => {
  try {
    const mongoUri = process.env.MONGODB_URI ||
      'mongodb://ankara_admin:ankara_password_2024@localhost:27017/ankara_ulasim_realtime?authSource=admin';

    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB connected successfully');
    return mongoose;
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Redis Configuration
export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redisClient.on('error', (error) => {
  logger.error('❌ Redis connection error:', error);
});

// Test and initialize connections
export const initializeDatabases = async (): Promise<void> => {
  try {
    // Test PostgreSQL
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected successfully');

    // Sync models (development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('📦 Database models synchronized');
    }

    // Connect MongoDB
    await connectMongoDB();

    logger.info('🎉 All databases initialized successfully');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export default {
  sequelize,
  mongoose,
  redisClient,
  initializeDatabases,
};
