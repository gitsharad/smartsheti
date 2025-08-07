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
  devLimiter,
  securityHeaders,
  sanitizeRequest,
  errorHandler
} = require('./utils/security');
const { advancedSecurityMiddleware } = require('./utils/advancedSecurity');
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
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRecommendationRoutes = require('./routes/aiRecommendationRoutes');
const gpsMappingRoutes = require('./routes/gpsMappingRoutes');
const iotSensorRoutes = require('./routes/iotSensorRoutes');
const trustRoutes = require('./routes/trustRoutes');

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

  // Debug environment information
  console.log('=== Server Environment ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('ALLOW_ALL_ORIGINS:', process.env.ALLOW_ALL_ORIGINS);
  console.log('=======================');

  // Basic middleware
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // For now, allow all origins to fix the immediate issue
      console.log('Allowing origin:', origin);
      return callback(null, true);
      
      // TODO: Restore proper CORS configuration after testing
      /*
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'https://app.smartsheti.com',
        'https://smartsheti.com',
        'https://www.smartsheti.com'
      ];
      
      // Add FRONTEND_URL from environment if it exists
      if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log('Allowing origin:', origin);
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        console.log('Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
      */
    },
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
  };
  
  app.use(cors(corsOptions));
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

  // Enhanced security middleware
  // app.use(advancedSecurityMiddleware.enhancedSecurityHeaders);
  // app.use(advancedSecurityMiddleware.encryptSensitiveData);
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

  // CORS test endpoint
  app.get('/api/v1/cors-test', (req, res) => {
    res.json({
      message: 'CORS test successful',
      origin: req.headers.origin,
      host: req.headers.host,
      timestamp: new Date().toISOString()
    });
  });

  // Simple test endpoint
  app.get('/api/v1/test', (req, res) => {
    res.json({
      message: 'Server is working!',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // Development endpoint to reset rate limits (only in development)
  if (process.env.NODE_ENV === 'development') {
    app.get('/api/v1/dev/reset-rate-limit', (req, res) => {
      res.json({ 
        message: 'Rate limit reset endpoint available in development',
        note: 'Rate limits are automatically more generous in development mode'
      });
    });
  }

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

  // Apply enhanced JWT authentication to all routes
  v1Router.use(auth);

  // Apply intelligent rate limiting
  // v1Router.use(advancedSecurityMiddleware.intelligentRateLimit);

  // Apply strict rate limiting to sensitive endpoints
  v1Router.use('/ndvi', strictLimiter);
  v1Router.use('/disease', strictLimiter);

  // Apply routes to v1 router with role-based authorization
  v1Router.use('/users', userRoutes);
  v1Router.use('/fields', fieldRoutes);
  v1Router.use('/coordinator', coordinatorRoutes);
  v1Router.use('/admin', adminRoutes);
  v1Router.use('/analytics', authorize('superadmin', 'admin', 'coordinator', 'farmer'), analyticsRoutes);
  v1Router.use('/notifications', authorize('superadmin', 'admin', 'coordinator', 'farmer'), notificationRoutes);
  v1Router.use('/sensor-data', authorize('superadmin', 'admin', 'coordinator', 'farmer'), sensorRoutes);
  v1Router.use('/ndvi', authorize('superadmin', 'admin', 'coordinator', 'farmer'), ndviRoutes);
  v1Router.use('/land', authorize('superadmin', 'admin', 'coordinator', 'farmer'), landRoutes);
  v1Router.use('/chatbot', authorize('superadmin', 'admin', 'coordinator', 'farmer'), chatbotRoutes);
  v1Router.use('/disease', authorize('superadmin', 'admin', 'coordinator', 'farmer'), diseaseRoutes);
  v1Router.use('/fdss', authorize('superadmin', 'admin', 'coordinator', 'farmer'), fdssRoutes);
  v1Router.use('/ai-recommendations', authorize('superadmin', 'admin', 'coordinator', 'farmer'), aiRecommendationRoutes);
  v1Router.use('/gps-mapping', authorize('superadmin', 'admin', 'coordinator', 'farmer'), gpsMappingRoutes);
  v1Router.use('/iot-sensors', authorize('superadmin', 'admin', 'coordinator', 'farmer'), iotSensorRoutes);
  
  // Trust routes - accessible to all authenticated users
  v1Router.use('/trust', authorize('superadmin', 'admin', 'coordinator', 'farmer'), trustRoutes);

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