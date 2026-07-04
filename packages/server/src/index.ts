import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config';
import { createSocketServer } from './socket';
import { initDatabase } from './db';
import { apiRoutes } from './routes';
import { roomStore } from './rooms/store';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(config.cors));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API routes
app.use('/api', apiRoutes);

// In production, serve client static files
if (config.nodeEnv === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Initialize storage
initDatabase();

// Create Socket.io server
const io = createSocketServer(httpServer);

// Periodic room cleanup
setInterval(() => {
  const cleaned = roomStore.cleanupInactiveRooms();
  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} inactive rooms`);
  }
}, config.room.cleanupInterval);

// Start server
httpServer.listen(config.port, () => {
  console.log(`🎭 Mafia Game Server running on port ${config.port}`);
  console.log(`   Client URL: ${config.clientUrl}`);
  console.log(`   Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  io.close();
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, httpServer, io };
