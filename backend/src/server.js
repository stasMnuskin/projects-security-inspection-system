const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const logger = require('./utils/logger');

// Add debug logs
logger.info('Starting server with configuration:', {
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME
});

require('./jobs/emailProcessor');
require('./jobs/faultReminderJob'); 
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const i18n = require('i18n');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerConfig = require('./config/swaggerConfig');
const { startRotation } = require('./utils/secretManager');

// Route imports
const analyticsRoutes = require('./routes/analyticsRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const faultRoutes = require('./routes/faultRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const inspectionTypeRoutes = require('./routes/inspectionTypeRoutes');
const siteRoutes = require('./routes/siteRoutes');
const organizationRoutes = require('./routes/organizationRoutes');

const db = require('./models');
const cache = require('./utils/cache');
const AppError = require('./utils/appError');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const notificationController = require('./controllers/notificationController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const swaggerDocs = swaggerJsDoc(swaggerConfig);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

startRotation();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
app.use(cookieParser());

// Add request logging middleware
app.use((req, res, next) => {
  logger.debug('Incoming request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  next();
});

// WebSocket setup
notificationController.setIo(io);

// Int. setup
i18n.configure({
  locales: ['en', 'he'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  objectNotation: true
});
app.use(i18n.init);

// Basic API route and health check
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: db.sequelize.authenticate().then(() => true).catch(() => false)
  });
});

// Routes
// Authentication & User Management
app.use('/api/auth/register', registrationRoutes);
app.use('/api/users', userRoutes);

// Core Features
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/faults', faultRoutes);
app.use('/api/inspection-types', inspectionTypeRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/organizations', organizationRoutes);

// Language
app.use((req, res, next) => {
  const lang = req.query.lang || req.cookies.lang || 'en';
  res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
  req.setLocale(lang);
  next();
});

// Error handling
app.use((err, req, res, next) => {
  if (!(err instanceof AppError)) {
    logger.error('Unhandled error:', err);
    err = new AppError('An unexpected error occurred', 500, 'INTERNAL_SERVER_ERROR')
      .setRequestDetails(req);
  }

  if (!err.path || !err.method) {
    err.setRequestDetails(req);
  }

  const statusCode = err.statusCode || 500;
  const errorResponse = {
    status: err.status || 'error',
    message: err.message,
    errorCode: err.errorCode,
    stack: err.stack
  };

  logger.error(`Error ${statusCode}: ${err.message}`, {
    errorCode: err.errorCode,
    path: err.path,
    method: err.method,
    stack: err.stack
  });

  res.status(statusCode).json(errorResponse);
});

const PORT = process.env.PORT || 5001;

function setupWebSocket() {
  io.on('connection', (socket) => {
    logger.info('New client connected');
    socket.on('disconnect', () => {
      logger.info('Client disconnected');
    });
  });
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
  process.exit(1);
});

async function startServer() {
  try {
    // First connect to database
    await db.sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Then sync database (force: false to prevent dropping tables)
    await db.sequelize.sync();
    logger.info('Database synced successfully.');

    // Finally start the server
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    // Setup WebSocket
    setupWebSocket();
  } catch (error) {
    logger.error('Unable to start server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
  await db.sequelize.close();
  cache.quit();
});

startServer();

module.exports = { app, startServer };
