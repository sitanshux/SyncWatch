const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const routes = require('./routes');
const socketHandler = require('./socket/socket');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for REST API
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api', routes);

const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Socket event handlers
socketHandler(io);

// Server startup
server.listen(PORT, () => {
  console.log(`[SyncWatch Server] Running on http://localhost:${PORT}`);
});
