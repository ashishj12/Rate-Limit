import { PrismaClient } from '../generated/prisma/index.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient({
  log: ['error', 'info', 'warn'],
});

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected sucessfully');
  } catch (error) {
    logger.error('Error while connecting database');
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected successfully');
};

export default prisma;
