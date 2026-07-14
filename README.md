# PathshalaKhoj — India College Finder

A production-ready, full-stack web application for prospective students to search, discover, and compare colleges across India. Includes authentication, an admin dashboard, FTS5-powered search, AI college prediction, student reviews, exams timeline, and education news.

[![Node.js](https://img.shields.io/badge/Node.js-22.5%2B-green)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/SQLite-FTS5-blue)](https://sqlite.org)
[![Express](https://img.shields.io/badge/Express-4.x-black)](https://expressjs.com)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **FTS5 Search** | Full-text search with BM25 relevance ranking across 130+ institutions |
| 🎓 **College Detail** | NAAC grade, NIRF ranking, placement, fees, courses, contacts, reviews |
| 📊 **Compare Mode** | Side-by-side comparison of up to 3 colleges |
| ⭐ **Shortlist** | Save colleges for later (session-based, no login required) |
| 🔐 **Authentication** | Email/password + Google OAuth, PBKDF2 hashed passwords, JWT sessions |
| 🛠️ **Admin Panel** | College and exam CRUD, Wikipedia data sync, coverage metrics |
| 🤖 **AI Predictor** | Rank-based college admission prediction |
| 📰 **News Feed** | Live education news via RSS aggregation |
| 📅 **Exams Timeline** | Upcoming entrance exam calendar |
| 🌗 **Dark Mode** | Full dark/light theme with no flash-of-unstyled-theme |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET (see below)

# 3. Seed the database
npm run seed          # Imports 130+ colleges
npm run seed:admin    # Creates the admin account from .env

# 4. Start the server
npm start             # Production
npm run dev           # Development (auto-restart with nodemon)
```

Open **http://localhost:4000** — the Express server serves the frontend at the same URL.

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **YES** | Long random string for JWT signing. Server refuses to start without this. |
| `PORT` | No | Port to listen on. Default: `4000` |
| `ALLOWED_ORIGIN` | No | Allowed CORS origin. Default: `http://localhost:PORT` |
| `GOOGLE_CLIENT_ID` | No | Enables Google Sign-In. Omit to use only email/password. |
| `ADMIN_EMAIL` | No | Used by `npm run seed:admin`. Default: `admin@pathshalakhoj.com` |
| `ADMIN_PASSWORD` | No | Used by `npm run seed:admin`. Must be ≥ 8 characters. |

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 🛡️ Security

- **Passwords**: PBKDF2-SHA512 with random salt
- **Sessions**: JWT tokens signed with `JWT_SECRET` (7-day expiry)
- **Rate limiting**: 20 req / 15 min on `/login`, `/register`, `/forgot-password`
- **CORS**: Restricted to `ALLOWED_ORIGIN` (not open wildcard)
- **HTTP Headers**: `helmet.js` — CSP, X-Frame-Options, HSTS, X-Content-Type-Options
- **Google OAuth**: Real signature verification via `google-auth-library` (bypass removed)
- **Admin seed**: Hash never stored in source — `npm run seed:admin` reads from env

---

## 📁 Project Structure

```
college-finder/
├── backend/
│   ├── server.js               # Entry point — security, middleware, routes
│   ├── routes/
│   │   ├── auth.js             # Login, register, Google OAuth, profile
│   │   ├── colleges.js         # Search (FTS5), filter, CRUD, stats
│   │   ├── courses.js          # Per-college courses + cross-college search
│   │   ├── contacts.js         # College contact entries
│   │   ├── shortlist.js        # Session-based college shortlist
│   │   ├── reviews.js          # Student reviews (auth required)
│   │   ├── exams.js            # Exam/event timeline
│   │   ├── news.js             # Education news via RSS
│   │   ├── predict.js          # AI college prediction
│   │   └── applications.js     # Application tracking
│   ├── middlewares/
│   │   └── authMiddleware.js   # requireAuth / requireAdmin
│   ├── db/
│   │   ├── connection.js       # SQLite abstraction (get, all, run, exec)
│   │   ├── schema.sql          # Canonical table definitions + indexes
│   │   ├── init.js             # Applies schema (idempotent)
│   │   ├── seed.js             # Seeds 130+ colleges
│   │   └── seed-admin.js       # Creates admin from .env (run after first boot)
│   ├── package.json
│   ├── .env.example
│   └── smoke.test.js           # 16-test API smoke suite (node:test)
└── frontend/
    ├── index.html              # Main SPA page
    ├── college.html            # College detail page
    ├── courses.html            # Course explorer
    ├── exams.html              # Exams calendar
    ├── news.html               # Education news
    ├── predict.html            # AI predictor
    ├── dashboard.html          # Student dashboard
    ├── styles.css              # Global design system
    ├── global.js               # Shared UI: theme, nav, auth sync
    ├── app.js                  # Core: search, filters, cards, shortlist
    └── js/
        ├── auth.module.js      # Auth modals, profile management
        └── admin.module.js     # Admin dashboard, CRUD operations
```

---

## 🗄️ Database

Uses Node's **built-in `node:sqlite`** module (stable in Node 22.5+) — zero setup, no external DB server.

**Key tables:**

| Table | Description |
|-------|-------------|
| `colleges` | 130+ institutions with NAAC, NIRF, fees, placement, description |
| `courses` | Per-college courses with level, duration, seats, entrance exam |
| `college_contacts` | Phones, emails, websites (normalized, 1-to-many) |
| `college_reviews` | Student reviews with rating (1–5), pros/cons |
| `users` | Email+password or Google OAuth accounts |
| `shortlists` | Session-based saved colleges |
| `timeline_events` | Entrance exam calendar |
| `colleges_fts` | FTS5 virtual table with BM25 relevance triggers |

Switching to PostgreSQL/MySQL is a single-file change in `backend/db/connection.js`.

---

## 🔌 API Reference

Base URL: `/api` — all responses are JSON.

### Colleges
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/colleges` | No | Search/filter/sort/paginate |
| GET | `/colleges/stats` | No | Aggregate stats (cached 5 min) |
| GET | `/colleges/meta/filters` | No | Dynamic dropdown values (cached 5 min) |
| GET | `/colleges/autocomplete` | No | FTS5 instant suggestions |
| GET | `/colleges/:id` | No | Full college detail |
| POST | `/colleges` | Admin | Create college |
| PUT | `/colleges/:id` | Admin | Update college |
| DELETE | `/colleges/:id` | Admin | Delete college (cascades) |

**Search query params** (`GET /colleges`):
`q`, `stream`, `state`, `city`, `type`, `naac`, `max_fees`, `exam`, `sort`, `page`, `limit`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account → returns `201` + JWT |
| POST | `/auth/login` | Email/password login → JWT |
| POST | `/auth/google` | Google OAuth → JWT |
| GET | `/auth/me` | Current user (no `password_hash` exposed) |
| PUT | `/auth/profile` | Update name / picture / password |
| POST | `/auth/forgot-password` | Send reset token |
| POST | `/auth/reset-password` | Set new password |

### Other Endpoints
- `GET /api/courses?q=&level=&entrance_exam=` — Search courses
- `GET /api/reviews/:college_id` — College reviews
- `POST /api/reviews/:college_id` — Submit review (auth required)
- `GET /api/shortlist/:sessionId` — Session-based shortlist
- `GET /api/exams` — Upcoming exams
- `GET /api/news` — Education news
- `POST /api/predict` — AI college prediction
- `GET /api/health` — Health check

---

## 🧪 Testing

```bash
# In one terminal:
npm start

# In another:
npm run test:smoke
```

16 smoke tests cover: health, college search/filter, auth register/login/me (including checking no sensitive fields leak), shortlist CRUD, 404 handling.

---

## 🚢 Deployment

1. **Set a real `JWT_SECRET`** — never deploy with the default value
2. Set `ALLOWED_ORIGIN` to your production domain
3. Set `GOOGLE_CLIENT_ID` if using Google Sign-In
4. Run `npm run seed` then `npm run seed:admin`
5. Start with `npm start` behind a reverse proxy (nginx/Caddy)

For process management, use `PM2`:
```bash
npm install -g pm2
pm2 start server.js --name pathshalakhoj
pm2 startup
pm2 save
```

---

## 📜 License

MIT — see [LICENSE](LICENSE) for details.
