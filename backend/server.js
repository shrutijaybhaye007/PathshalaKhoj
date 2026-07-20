/**
 * PathshalaKhoj — Backend Server
 *
 * Express app exposing a REST API over a SQLite database of Indian
 * colleges, their courses, and their contact details. Also serves the
 * static frontend so the whole app can run from a single `npm start`.
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });

// ─── Environment validation — fail fast rather than run insecurely ────────
if (!process.env.JWT_SECRET) {
  console.error('\n[FATAL] JWT_SECRET environment variable is not set.');
  console.error('[FATAL] Copy backend/.env.example to backend/.env and set a strong JWT_SECRET.');
  console.error('[FATAL] Refusing to start in an insecure state.\n');
  process.exit(1);
}

const path = require('node:path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const collegesRouter     = require('./routes/colleges');
const coursesRouter      = require('./routes/courses');
const contactsRouter     = require('./routes/contacts');
const shortlistRouter    = require('./routes/shortlist');
const authRouter         = require('./routes/auth');
const examsRouter        = require('./routes/exams');
const newsRouter         = require('./routes/news');
const applicationsRouter = require('./routes/applications');
const predictRouter      = require('./routes/predict');
const reviewsRouter      = require('./routes/reviews');
const adminRouter        = require('./routes/admin');
const { initDb }         = require('./db/init');

const app  = express();
const PORT = process.env.PORT || 4000;

async function bootstrapDb() {
  try {
    await initDb();

    const { run: runDb } = require('./db/connection');
    const migrations = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS jee_rank INTEGER",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS neet_rank INTEGER",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS cat_percentile DOUBLE PRECISION",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS board_percentage DOUBLE PRECISION",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_stream TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TEXT",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS student_rating DOUBLE PRECISION",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS top_recruiters TEXT",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS scholarships_info TEXT",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS application_deadline TEXT",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS placement_rate DOUBLE PRECISION",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS hostel_available INTEGER",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS contact_email TEXT",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS contact_phone TEXT",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS website TEXT",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS campus_size TEXT",
      "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS facilities TEXT",
      "ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS user_id INTEGER",
      "ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS pros TEXT",
      "ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS cons TEXT",
      "ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'"
    ];

    for (const sql of migrations) {
      try { await runDb(sql); } catch (_) { /* column already exists */ }
    }
  } catch (err) {
    console.warn('DB Bootstrap warning:', err.message);
  }
}

bootstrapDb();

// ─── Security: Helmet (HTTP headers) ──────────────────────────────────────
app.use(helmet({
  // Allow Google Fonts, our own API, and Wikipedia (for wiki-preview)
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com", "https://unpkg.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https:", "blob:"],
      connectSrc:  ["'self'", "https://en.wikipedia.org", "https://accounts.google.com"],
      frameSrc:    ["https://accounts.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Google Identity Services
}));

// ─── Security: CORS — only allow our own origin ───────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || `http://localhost:${PORT}`;
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman) and
    // same-origin browser requests (origin === undefined when same-origin).
    if (!origin || origin === ALLOWED_ORIGIN) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// ─── Rate limiting — auth endpoints only ──────────────────────────────────
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,                                   // 15 minutes
  max:             process.env.NODE_ENV === 'production' ? 20 : 100, // relaxed in dev/test
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many requests. Please try again after 15 minutes.' },
  skipSuccessfulRequests: false,
});
app.use('/api/auth/login',           authLimiter);
app.use('/api/auth/register',        authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// ─── Request logger ───────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ─── API routes ───────────────────────────────────────────────────────────
app.use('/api/colleges',     collegesRouter);
app.use('/api/courses',      coursesRouter);
app.use('/api/contacts',     contactsRouter);
app.use('/api/shortlist',    shortlistRouter);
app.use('/api/auth',         authRouter);
app.use('/api/exams',        examsRouter);
app.use('/api/news',         newsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/predict',      predictRouter);
app.use('/api/reviews',      reviewsRouter);
app.use('/api/admin',        adminRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), version: '2.0.0' });
});

// ─── Serve static frontend ────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');

app.set('etag', 'strong');
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    // Only disable caching for HTML pages so users always get fresh content.
    // CSS, JS, images and other static assets are safe to cache for 1 hour.
    const isHtml = req.path === '/' || req.path.endsWith('.html') || req.path === '';
    if (isHtml) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour for assets
    }
  }
  next();
});
app.use(express.static(frontendPath, { etag: true, lastModified: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─── 404 for unmatched API routes ─────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// ─── Global error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const { migrateToPg } = require('./db/migrate-to-pg');

app.listen(PORT, () => {
  console.log(`\nPathshalaKhoj API running at http://localhost:${PORT}`);
  console.log(`Frontend served from the same URL.`);
  console.log(`Allowed CORS origin: ${ALLOWED_ORIGIN}\n`);

  // Run database migration check asynchronously after port is open
  migrateToPg().catch(err => {
    console.error('Database initialization warning:', err.message);
  });
});
