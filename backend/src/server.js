require('dotenv').config();
require('./jobs/emailProcessor');
const express = require('express');
const { google } = require('googleapis');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const i18n = require('i18n');
const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerConfig = require('./config/swaggerConfig');
const { startRotation } = require('./utils/secretManager');

const analyticsRoutes = require('./routes/analyticsRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const faultRoutes = require('./routes/faultRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const inspectionTypeRoutes = require('./routes/inspectionTypeRoutes');
const siteRoutes = require('./routes/siteRoutes');
const entrepreneurRoutes = require('./routes/entrepreneurRoutes');

const { processEmails } = require('./utils/emailFaultProcessor');

const db = require('./models');
const cache = require('./utils/cache');
const AppError = require('./utils/appError');
const logger = require('./utils/logger');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const notificationController = require('./controllers/notificationController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const swaggerDocs = swaggerJsDoc(swaggerConfig);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

if (process.env.NODE_ENV !== 'test') {
  startRotation();
}

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
app.use(cookieParser());

// WebSocket setup
notificationController.setIo(io);

// CSRF protection
if (process.env.NODE_ENV === 'production') {
  app.use(csrf({ cookie: true }));
} else {
  app.use((req, res, next) => {
    req.csrfToken = () => '';
    next();
  });
}

// Internationalization setup
i18n.configure({
  locales: ['en', 'he'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  objectNotation: true
});
app.use(i18n.init);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000'  
);

app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify']
  });
  res.redirect(url);
});

app.get('/', async (req, res) => {
  const { code } = req.query;
  if (code) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      
      console.log('Refresh Token:', tokens.refresh_token);
      res.send('Authentication successful! Check your console for the refresh token.');
      
    } catch (error) {
      console.error('Error getting tokens:', error);
      res.status(500).send('Authentication failed');
    }
  } else {
    res.send('No authentication code provided');
  }
});

setInterval(processEmails, 1 * 60 * 1000);

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faults', faultRoutes);
app.use('/api/inspection-types', inspectionTypeRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/entrepreneurs', entrepreneurRoutes);

// Language middleware
app.use((req, res, next) => {
  const lang = req.query.lang || req.cookies.lang || 'en';
  res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
  req.setLocale(lang);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.error('CSRF error:', err);
    return res.status(403).json({
      status: 'error',
      message: 'Session has expired or form tampered with',
      errorCode: 'CSRF_ERROR'
    });
  }

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
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  logger.error(`Error ${statusCode}: ${err.message}`, {
    errorCode: err.errorCode,
    path: err.path,
    method: err.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  res.status(statusCode).json(errorResponse);
});

// Server startup
const PORT = process.env.PORT || 5000;

function setupWebSocket() {
  io.on('connection', (socket) => {
    logger.info('New client connected');
    socket.on('disconnect', () => {
      logger.info('Client disconnected');
    });
  });
}

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
  db.sequelize.close();
  cache.quit();
});

async function startServer() {
  try {
    await db.sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    await db.sequelize.sync({ alter: true });
    logger.info('Database synced successfully.');

    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
  await db.sequelize.close();
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };