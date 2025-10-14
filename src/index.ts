import express, { type Application } from 'express';
import cors from 'cors';
import { config } from './config/dotenv.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
// import routes from './routes';
// import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
// app.use('/api', routes);

// Error handling
// app.use(notFoundHandler);
// app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    // Start listening
    app.listen(config.port, () => {
      console.log(`server is running at port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
