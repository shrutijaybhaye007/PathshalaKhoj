/**
 * India College Finder — Backend Server
 *
 * Express app exposing a REST API over a SQLite database of Indian
 * colleges, their courses, and their contact details. Also serves the
 * static frontend so the whole app can run from a single `npm start`.
 */
require('dotenv').config();

const path = require('node:path');
const express = require('express');
const cors = require('cors');

const collegesRouter = require('./routes/colleges');
const coursesRouter = require('./routes/courses');
const contactsRouter = require('./routes/contacts');
const shortlistRouter = require('./routes/shortlist');
const authRouter = require('./routes/auth');
const examsRouter = require('./routes/exams');
const newsRouter = require('./routes/news');
const applicationsRouter = require('./routes/applications');
const predictRouter = require('./routes/predict');
const reviewsRouter = require('./routes/reviews');
const { initDb } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 4000;

// Make sure tables exist even if someone forgets to run the seed script.
initDb();

// Run schema migrations for user academic profiles
const { run: runDb } = require('./db/connection');
try { runDb("ALTER TABLE users ADD COLUMN jee_rank INTEGER;"); } catch(e){}
try { runDb("ALTER TABLE users ADD COLUMN neet_rank INTEGER;"); } catch(e){}
try { runDb("ALTER TABLE users ADD COLUMN cat_percentile REAL;"); } catch(e){}
try { runDb("ALTER TABLE users ADD COLUMN board_percentage REAL;"); } catch(e){}
try { runDb("ALTER TABLE users ADD COLUMN academic_stream TEXT;"); } catch(e){}
try { runDb("ALTER TABLE users ADD COLUMN password_reset_token TEXT;"); } catch(e){}
try { runDb("ALTER TABLE users ADD COLUMN password_reset_expires TEXT;"); } catch(e){}

// Run schema migrations for new comprehensive college fields
try { runDb("ALTER TABLE colleges ADD COLUMN student_rating REAL;"); } catch(e){}
try { runDb("ALTER TABLE colleges ADD COLUMN top_recruiters TEXT;"); } catch(e){}
try { runDb("ALTER TABLE colleges ADD COLUMN scholarships_info TEXT;"); } catch(e){}
try { runDb("ALTER TABLE colleges ADD COLUMN application_deadline TEXT;"); } catch(e){}
try { runDb("ALTER TABLE colleges ADD COLUMN placement_rate REAL;"); } catch(e){}
try { runDb("ALTER TABLE colleges ADD COLUMN hostel_available INTEGER;"); } catch(e){}
try { runDb("ALTER TABLE colleges ADD COLUMN contact_email TEXT;"); } catch(e){}
try { runDb("ALTER TABLE colleges ADD COLUMN contact_phone TEXT;"); } catch(e){}
try { runDb("ALTER TABLE colleges ADD COLUMN website TEXT;"); } catch(e){}
try { runDb("ALTER TABLE colleges ADD COLUMN campus_size TEXT;"); } catch(e){}
try { runDb("ALTER TABLE colleges ADD COLUMN facilities TEXT;"); } catch(e){}
// college_reviews extra columns
try { runDb("ALTER TABLE college_reviews ADD COLUMN user_id INTEGER;"); } catch(e){}
try { runDb("ALTER TABLE college_reviews ADD COLUMN pros TEXT;"); } catch(e){}
try { runDb("ALTER TABLE college_reviews ADD COLUMN cons TEXT;"); } catch(e){}
try { runDb("ALTER TABLE college_reviews ADD COLUMN status TEXT DEFAULT 'approved';"); } catch(e){}

app.use(cors());
app.use(express.json());

// Simple request log — handy when demoing the API.
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// --- API routes ---
app.use('/api/colleges', collegesRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/shortlist', shortlistRouter);
app.use('/api/auth', authRouter);
app.use('/api/exams', examsRouter);
app.use('/api/news', newsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/predict', predictRouter);
app.use('/api/reviews', reviewsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- Serve the static frontend (so `npm start` is the whole app) ---
const frontendPath = path.join(__dirname, '..', 'frontend');

// Disable ETags + cache in development so CSS/JS changes show immediately.
app.set('etag', false);
app.use((req, res, next) => {
  // Only apply no-cache to frontend static files (not API responses)
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

// --- 404 handler for unmatched API routes ---
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// --- Generic error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`\nIndia College Finder API running at http://localhost:${PORT}`);
  console.log(`Frontend served from the same URL.`);
  console.log(`Try: http://localhost:${PORT}/api/colleges?q=delhi\n`);
});
