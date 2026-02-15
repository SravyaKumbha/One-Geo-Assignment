require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { syncDatabase } = require('./models');
const authenticate = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { setupChatHandler } = require('./handlers/chatHandler');

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const wellsRoutes = require('./routes/wells');
const curvesRoutes = require('./routes/curves');
const dataRoutes = require('./routes/data');
const interpretRoutes = require('./routes/interpret');

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws/chat' });
setupChatHandler(wss);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.use('/api/upload', authenticate, uploadRoutes);
app.use('/api/wells', authenticate, wellsRoutes);
app.use('/api/wells', authenticate, curvesRoutes);
app.use('/api/wells', authenticate, dataRoutes);
app.use('/api/interpret', authenticate, interpretRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await syncDatabase();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebSocket chat available at ws://localhost:${PORT}/ws/chat`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    console.error('Make sure PostgreSQL is running and the database exists.');
    process.exit(1);
  }
}

startServer();
