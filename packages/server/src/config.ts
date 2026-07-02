import dotenv from 'dotenv';
dotenv.config();

const env = process.env as Record<string, string | undefined>;

export const config = {
  port: parseInt(env['PORT'] ?? '3001', 10),
  clientUrl: env['CLIENT_URL'] ?? 'http://localhost:5173',
  nodeEnv: env['NODE_ENV'] ?? 'development',
  cors: {
    origin: env['CLIENT_URL'] ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  room: {
    cleanupInterval: parseInt(env['ROOM_CLEANUP_INTERVAL'] ?? '300000', 10),
    inactiveTimeout: parseInt(env['ROOM_INACTIVE_TIMEOUT'] ?? '3600000', 10),
  },
};
