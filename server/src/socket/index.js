const jwt = require('jsonwebtoken');

/**
 * Initialize Socket.IO event handlers.
 * @param {import('socket.io').Server} io
 */
const initSocket = (io) => {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.userId}`);

    // Join personal room for user-specific events
    socket.join(`user_${socket.userId}`);

    // Join ticket room for real-time ticket updates
    socket.on('ticket:join', (ticketId) => {
      socket.join(`ticket_${ticketId}`);
      console.log(`User ${socket.userId} joined ticket room ${ticketId}`);
    });

    socket.on('ticket:leave', (ticketId) => {
      socket.leave(`ticket_${ticketId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);
    });
  });
};

module.exports = initSocket;
