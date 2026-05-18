require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const { connectMySQL, sequelize } = require('./config/mysql');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const initSocket = require('./socket');
const setupSwagger = require('./docs/swagger');
const { checkAndEscalate } = require('./services/sla.service');

// Import routes
const authRoutes = require('./routes/auth.routes');
const ticketRoutes = require('./routes/ticket.routes');
const userRoutes = require('./routes/user.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const kbRoutes = require('./routes/kb.routes');
const notificationRoutes = require('./routes/notification.routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io available in controllers via req.app.get('io')
app.set('io', io);
initSocket(io);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Global middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));
app.use('/api', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/notifications', notificationRoutes);

// Swagger docs
setupSwagger(app);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect both databases (Polyglot)
  await connectDB(); // MongoDB
  await connectMySQL(); // MySQL
  
  // Sync SQL tables safely
  if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: true }); 
    console.log('✅ MySQL tables synchronized successfully.');
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Run SLA escalation check every 15 minutes
  setInterval(() => checkAndEscalate(io), 15 * 60 * 1000);
};

startServer();

module.exports = { app, server };
