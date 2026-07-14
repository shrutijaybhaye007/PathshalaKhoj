/**
 * PathshalaKhoj — Backend Server
 *
 * Express app exposing a REST API over a SQLite database of Indian
 * colleges, their courses, and their contact details. Also serves the
 * static frontend so the whole app can run from a single `npm start`.
 */
require('dotenv').config();

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

// Make sure tables exist even if someone forgets to run the seed script.
initDb();

// ─── Run idempotent schema migrations ─────────────────────────────────────
// These ALTER TABLE calls are safe to run on every boot; they silently
// succeed when the column already exists and skip when it doesn't.
const { run: runDb } = require('./db/connection');

const migrations = [
  // Users — academic profile
  "ALTER TABLE users ADD COLUMN jee_rank INTEGER",
  "ALTER TABLE users ADD COLUMN neet_rank INTEGER",
  "ALTER TABLE users ADD COLUMN cat_percentile REAL",
  "ALTER TABLE users ADD COLUMN board_percentage REAL",
  "ALTER TABLE users ADD COLUMN academic_stream TEXT",
  "ALTER TABLE users ADD COLUMN password_reset_token TEXT",
  "ALTER TABLE users ADD COLUMN password_reset_expires TEXT",
  // Colleges — extended data
  "ALTER TABLE colleges ADD COLUMN student_rating REAL",
  "ALTER TABLE colleges ADD COLUMN top_recruiters TEXT",
  "ALTER TABLE colleges ADD COLUMN scholarships_info TEXT",
  "ALTER TABLE colleges ADD COLUMN application_deadline TEXT",
  "ALTER TABLE colleges ADD COLUMN placement_rate REAL",
  "ALTER TABLE colleges ADD COLUMN hostel_available INTEGER",
  "ALTER TABLE colleges ADD COLUMN contact_email TEXT",
  "ALTER TABLE colleges ADD COLUMN contact_phone TEXT",
  "ALTER TABLE colleges ADD COLUMN website TEXT",
  "ALTER TABLE colleges ADD COLUMN campus_size TEXT",
  "ALTER TABLE colleges ADD COLUMN facilities TEXT",
  // Reviews — extended data
  "ALTER TABLE college_reviews ADD COLUMN user_id INTEGER",
  "ALTER TABLE college_reviews ADD COLUMN pros TEXT",
  "ALTER TABLE college_reviews ADD COLUMN cons TEXT",
  "ALTER TABLE college_reviews ADD COLUMN status TEXT DEFAULT 'approved'",
];

migrations.forEach(sql => {
  try { runDb(sql); } catch (_) { /* column already exists — expected */ }
});

// ─── Security: Helmet (HTTP headers) ──────────────────────────────────────
app.use(helmet({
  // Allow Google Fonts, our own API, and Wikipedia (for wiki-preview)
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
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

app.set('etag', false);
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});
app.use(express.static(frontendPath, { etag: false, lastModified: false }));

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

app.listen(PORT, () => {
  console.log(`\nPathshalaKhoj API running at http://localhost:${PORT}`);
  console.log(`Frontend served from the same URL.`);
  console.log(`Allowed CORS origin: ${ALLOWED_ORIGIN}\n`);
});
