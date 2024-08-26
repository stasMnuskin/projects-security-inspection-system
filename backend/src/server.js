require('dotenv').config();
const express = require('express');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const i18n = require('i18n');
const path = require('path');

const analyticsRoutes = require('./routes/analyticsRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const faultRoutes = require('./routes/faultRoutes');

const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');

const db = require('./models');
const cache = require('./utils/cache');
const AppError = require('./utils/appError');
const logger = require('./utils/logger');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const notificationController = require('./controllers/notificationController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// WebSocket setup
notificationController.setIo(io);

app.use(cookieParser());
if (process.env.NODE_ENV === 'production') {
  app.use(csrf({ cookie: true }));
} else {
  app.use((req, res, next) => {
    req.csrfToken = () => '';
    next();
  });
}

i18n.configure({
  locales: ['en', 'he'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  objectNotation: true
});
app.use(i18n.init);

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/faults', faultRoutes);


app.use((err, req, res, next) => {
  if (!(err instanceof AppError)) {
    console.error('Global error handler:', err);
    err = new AppError('An unexpected error occurred', 500, 'INTERNAL_SERVER_ERROR')
      .setRequestDetails(req);
  }

  if (!err.path || !err.method) {
    err.setRequestDetails(req);
  }

  res.status(err.statusCode).json(err.toJSON());

  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const message = err.message || 'Something went wrong';

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

});


app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  res.status(403);
  res.send('Session has expired or form tampered with');
});

app.use((req, res, next) => {
  const lang = req.query.lang || req.cookies.lang || 'en';
  res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
  req.setLocale(lang);
  next();
});

const PORT = process.env.PORT || 5000;

async function seedDatabase() {
  try {
    const [entrepreneur] = await db.Entrepreneur.findOrCreate({
      where: { name: 'Test Entrepreneur' },
      defaults: { 
        name: 'Test Entrepreneur',
        contactPerson: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890'
      }
    });
    
    const [site] = await db.Site.findOrCreate({
      where: { name: 'Test Site', entrepreneurId: entrepreneur.id },
      defaults: { name: 'Test Site', entrepreneurId: entrepreneur.id }
    });
    
    await db.InspectionType.findOrCreate({
      where: { name: 'Test Inspection Type', siteId: site.id },
      defaults: { 
        name: 'Test Inspection Type', 
        siteId: site.id,
        formStructure: JSON.stringify({ field1: 'text', field2: 'checkbox' })
      }
    });
    logger.info('Database seeded successfully');
  } catch (err) {
    logger.error('Error seeding database', { error: err });
  }
}

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

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
  db.sequelize.close();
  cache.client.quit();
});

async function startServer() {
  try {
    await db.sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    if (process.env.NODE_ENV !== 'test') {
      await db.sequelize.sync({ alter: true });
      logger.info('Database synced successfully.');
      await seedDatabase();
    }

    setupWebSocket();

    cache.client.on('connect', () => {
      logger.info('Redis connected');
    });

    return server;
  } catch (error) {
    logger.error('Unable to start server:', { error: error });
    throw error;
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer().then(server => {
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  });
}

module.exports = { app, startServer };