import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from './config/googleAuth.js';
import { createServer as createViteServer } from 'vite';

import connectDB from './config/db.js';
import { testMySQLConnection } from './config/mysql.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import songRoutes from './routes/songRoutes.js';
import artistRoutes from './routes/artistRoutes.js';
import albumRoutes from './routes/albumRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

console.log('--- SERVER STARTING ---');

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing in .env');
  process.exit(1);
}

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  console.warn('⚠️ SMTP email settings are incomplete. Verification/password reset emails may fail.');
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️ Google OAuth settings are incomplete. Continue with Google may fail.');
}

connectDB();
testMySQLConnection();

const app = express();

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api', (req, res) => {
  res.json({
    message: 'StreamKloud API is running',
    auth: 'MySQL + JWT + Google OAuth',
    email: 'Nodemailer SMTP',
    storage: 'local uploads',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'StreamKloud backend is running',
    auth: 'MySQL + JWT + Google OAuth',
    email: 'Nodemailer SMTP',
    storage: 'local uploads',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/upload', uploadRoutes);

app.all('/api/*', (req, res) => {
  res.status(404).json({
    message: `API route not found - ${req.originalUrl}`,
  });
});

if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);
} else {
  const __dirname = path.resolve();

  app.use(express.static(path.join(__dirname, 'dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('--- SERVER IS LISTENING ---');
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`API health check: http://localhost:${PORT}/api/health`);
  console.log(`Local uploads available at http://localhost:${PORT}/uploads`);
});