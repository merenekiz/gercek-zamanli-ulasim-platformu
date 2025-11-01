import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables
dotenv.config();

// Import configurations and middleware
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import logger from './utils/logger';
import { initializeDatabases } from './config/database';

// Import routes
import routes from './routes';

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// ============================================
// Middleware
// ============================================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// Health Check
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Gerçek Zamanlı Ulaşım Platformu API - Sağlıklı',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Info
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'Gerçek Zamanlı Ulaşım Platformu API',
    version: '0.1.0',
    description: 'Gerçek zamanlı toplu taşıma ve çok modlu seyahat planlama API',
    endpoints: {
      health: '/health',
      api: '/api',
      routes: '/api/v1/routes',
      places: '/api/v1/places',
      transit: '/api/v1/transit',
      taxi: '/api/v1/taxi',
      users: '/api/v1/users',
    },
    documentation: '/api/docs',
  });
});

// ============================================
// Routes
// ============================================

// API v1 routes
app.use('/api/v1', routes);

// ============================================
// WebSocket Events
// ============================================

io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  // Vehicle location updates
  socket.on('subscribe:vehicle-updates', (data) => {
    logger.info(`Client ${socket.id} subscribed to vehicle updates`);
    socket.join('vehicle-updates');
  });

  // Route updates
  socket.on('subscribe:route-updates', (routeId) => {
    logger.info(`Client ${socket.id} subscribed to route ${routeId}`);
    socket.join(`route:${routeId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 5000;

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server gracefully...');

  httpServer.close(() => {
    logger.info('HTTP server closed');

    // Close database connections here
    // await sequelize.close();
    // await mongoose.disconnect();
    // await redisClient.quit();

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize databases and start server
const startServer = async () => {
  try {
    // Initialize database connections
    await initializeDatabases();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Gerçek Zamanlı Ulaşım Platformu API`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 Server running on port ${PORT}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API Info: http://localhost:${PORT}/api`);
      logger.info(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown();
});

export { app, io };
