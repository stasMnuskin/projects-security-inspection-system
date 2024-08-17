const express = require('express');
const cors = require('cors');
const db = require('./models');
const inspectionRoutes = require('./routes/inspectionRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationController = require('./controllers/notificationController');
const notificationRoutes = require('./routes/notificationRoutes');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = socketIo(server);
notificationController.setIo(io);
// Routes
app.use('/api/users', userRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
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
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    await db.sequelize.sync({ alter: true });
    console.log('Database synced successfully.');

    await seedDatabase();

    io.on('connection', (socket) => {
      console.log('New client connected');
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();