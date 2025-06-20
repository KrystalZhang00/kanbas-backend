require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const quizzesRouter = require('./routes/quizzes');
const quizAttemptsRouter = require('./routes/quizAttempts');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://kambazquiz.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // For legacy browser support
};

// Trust proxy for cloud platforms (Heroku, Render, etc.)
app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'kambaz-quiz-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Always true in production for SameSite=None
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined
  },
  name: 'kambaz.sid' // Custom session name
};

console.log('Session configuration:', {
  ...sessionConfig,
  secret: '[HIDDEN]',
  store: 'MongoStore'
});

// Add middleware to check HTTPS and log request details
app.use((req, res, next) => {
  if (req.path.includes('/api/auth/signin')) {
    console.log('=== SIGNIN REQUEST DEBUG ===');
    console.log('Protocol:', req.protocol);
    console.log('Secure:', req.secure);
    console.log('Headers x-forwarded-proto:', req.headers['x-forwarded-proto']);
    console.log('Host:', req.get('host'));
    console.log('Origin:', req.get('origin'));
    console.log('User-Agent:', req.get('user-agent'));
    console.log('===============================');
  }
  next();
});

app.use(session(sessionConfig));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Backend service is running!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Routes
app.use(authRouter);
app.use(quizzesRouter);
app.use(quizAttemptsRouter);