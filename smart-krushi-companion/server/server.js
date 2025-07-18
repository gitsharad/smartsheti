require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const { connection } = require('./utils/mongoClient');
const { logger, requestLogger } = require('./utils/logger');
const { 
  standardLimiter, 
  strictLimiter,
  securityHeaders,
  sanitizeRequest,
  errorHandler
} = require('./utils/security');
const { auth, authorize } = require('./middleware/auth');
const swaggerSpec = require('./utils/swagger');
const Field = require('./models/Field');
const userController = require('./controllers/userController');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const diseaseRoutes = require('./routes/diseaseRoutes');
const fdssRoutes = require('./routes/fdssRoutes');
const landRoutes = require('./routes/landRoutes');
const ndviRoutes = require('./routes/ndviRoutes');
const healthRoutes = require('./routes/healthRoutes');
const coordinatorRoutes = require('./routes/coordinatorRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Implement clustering for better performance
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  logger.info(`Master process ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();
  app.set('trust proxy', 1);

  // Basic middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));
  app.use(compression({
    filter: (req, res) => {
      if (res.noCompression) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(requestLogger);

  // Security middleware
  app.use(securityHeaders);
  app.use(sanitizeRequest);

  // Swagger UI configuration
  const swaggerUiOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true
    }
  };

  // API Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Health check endpoint (no authentication)
  app.use('/api/v1/health', healthRoutes);

  // Auth routes (no authentication)
  app.use('/api/v1/auth', authRoutes);

  // Public coordinators endpoint (no authentication)
  const User = require('./models/User');
  app.get('/api/v1/coordinators', async (req, res) => {
    try {
      const coordinators = await User.find({ role: 'coordinator' }, 'name email phoneNumber _id');
      res.json({ users: coordinators });
    } catch (error) {
      logger.error('Error fetching coordinators:', error);
      res.status(500).json({ error: 'Failed to fetch coordinators' });
    }
  });

  // API versioning with JWT auth
  const v1Router = express.Router();

  // Create uploads directory if it doesn't exist
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // Apply JWT authentication to all routes
  v1Router.use(auth);

  // Apply rate limiting to sensitive endpoints
  v1Router.use('/ndvi', strictLimiter);
  v1Router.use('/disease', strictLimiter);

  // Apply general rate limiting to all other routes
  v1Router.use(standardLimiter);

  // Apply routes to v1 router with role-based authorization
  v1Router.use('/users', userRoutes);
  v1Router.use('/fields', fieldRoutes);
  v1Router.use('/coordinator', coordinatorRoutes);
  v1Router.use('/admin', adminRoutes);
  v1Router.use('/sensor-data', authorize('superadmin', 'admin', 'coordinator', 'farmer'), sensorRoutes);
  v1Router.use('/ndvi', authorize('superadmin', 'admin', 'coordinator', 'farmer'), ndviRoutes);
  v1Router.use('/land', authorize('superadmin', 'admin', 'coordinator', 'farmer'), landRoutes);
  v1Router.use('/chatbot', authorize('superadmin', 'admin', 'coordinator', 'farmer'), chatbotRoutes);
  v1Router.use('/disease', authorize('superadmin', 'admin', 'coordinator', 'farmer'), diseaseRoutes);
  v1Router.use('/fdss', authorize('superadmin', 'admin', 'coordinator', 'farmer'), fdssRoutes);

  // Mount v1 router
  app.use('/api/v1', v1Router);

  // 404 handler for undefined API routes
  app.use('/api/v1/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Error handling
  app.use(errorHandler);

  // Graceful shutdown
  const gracefulShutdown = () => {
    logger.info('Received shutdown signal. Starting graceful shutdown...');
    
    // Close server
    server.close(() => {
      logger.info('HTTP server closed.');
      
      // Close database connection
      connection.close(false, () => {
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT,"0.0.0.0", () => {
    logger.info(`Server running on port ${PORT}`);
  });

  // Keep-alive configuration
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
}

// Schedule data cleanup job (run daily at 2 AM)
// const { SensorData } = require('./utils/mongoClient');
// const schedule = require('node-schedule');
// schedule.scheduleJob('0 2 * * *', async () => {
//   try {
//     await SensorData.cleanupOldData();
//     logger.info('Daily data cleanup completed');
//   } catch (error) {
//     logger.error('Error in daily data cleanup:', error);
//   }
// }); 