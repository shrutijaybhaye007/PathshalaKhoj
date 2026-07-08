# Pathshala Khoj — India College Finder

A full-stack web app for prospective students to search and discover colleges
across India, with detailed course listings and contact details for each
institution.

Built to satisfy the brief: **Node.js + SQL backend with a REST API**, and a
**responsive HTML/CSS/JS frontend with a search-first experience**.

---

## What's inside

```
college-finder/
├── backend/
│   ├── server.js           # Express app entry point
│   ├── routes/
│   │   ├── colleges.js     # search, filter, sort, pagination, CRUD
│   │   ├── courses.js      # per-college courses + cross-college course search
│   │   ├── contacts.js     # per-college contact channels
│   │   └── shortlist.js    # session-based "save for later" list
│   ├── db/
│   │   ├── schema.sql      # table definitions + indexes
│   │   ├── connection.js   # the ONLY file that talks to the database engine
│   │   ├── init.js         # applies schema.sql (idempotent)
│   │   └── seed.js         # 20 real Indian institutions, courses, contacts
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── styles.css
    └── app.js
```

## Quick start

```bash
cd backend
npm install
npm run seed     # creates db/colleges.db and populates it
npm start        # http://localhost:4000
```

Open **http://localhost:4000** — the Express server serves the frontend
directly, so there's nothing else to run. The API lives under `/api/*` on
the same origin (no CORS setup needed, though `cors` is enabled anyway in
case you want to point a separately-hosted frontend at it).

To wipe and reseed the database at any point: `npm run seed` again — it's
safe to re-run.

---

## Database engine — important note

This project uses Node's **built-in `node:sqlite` module** (stable in
Node 22.5+) rather than a separately-installed database server. This was a
deliberate choice so the project runs with **zero setup** — no MySQL/Postgres
install, no native module compilation, no Docker.

It is still real SQL: proper `CREATE TABLE`, foreign keys, joins, indexes —
everything in `schema.sql` is standard SQL with only trivial SQLite-specific
syntax (`AUTOINCREMENT`, `datetime('now')`).

**All database access goes through `backend/db/connection.js`.** No other
file ever imports a database driver directly. This means swapping to MySQL
or PostgreSQL for production is a localized change:

1. Install a driver (`npm install mysql2` or `npm install pg`)
2. Rewrite `connection.js` to export the same four functions
   (`get`, `all`, `run`, `exec`) using that driver
3. Adjust `?` placeholders to `?`/named params as needed by the driver
   (mysql2 uses `?` already; pg uses `$1, $2...`, which would need a small
   helper to convert)

Nothing in `routes/` or `seed.js` needs to change.

---

## Database schema

```
colleges (id, name, slug, city, state, stream, college_type, affiliation,
          naac_grade, established_year, description, address, pincode,
          avg_fees_per_year, total_courses, created_at, updated_at)

courses (id, college_id → colleges.id, name, level, duration_years,
         seats, fees_per_year, entrance_exam)

college_contacts (id, college_id → colleges.id, contact_type,
                   contact_value, label)

shortlists (id, session_id, college_id → colleges.id, created_at)
```

One college has many courses and many contacts (1-to-many, normalized,
`ON DELETE CASCADE`). Indexes are on every column used for filtering or
joining (`name`, `city`, `state`, `stream`, `college_type`, `college_id`).

`shortlists` is keyed by a random `session_id` generated client-side and
stored in `localStorage` — it lets a visitor save colleges to compare
without building a full login system.

---

## API reference

All responses are JSON. Base URL: `/api`.

### Colleges

| Method | Endpoint | Description |
|---|---|---|
| GET | `/colleges` | Search/filter/sort/paginate (see query params below) |
| GET | `/colleges/meta/filters` | Distinct streams, states, types, NAAC grades, fee range — used to populate dropdowns |
| GET | `/colleges/:id` | Full detail: college + courses + contacts |
| POST | `/colleges` | Create a college (with optional nested `courses[]`, `contacts[]`) |
| PUT | `/colleges/:id` | Update top-level college fields |
| DELETE | `/colleges/:id` | Delete a college (cascades to its courses/contacts) |

**`GET /colleges` query params** (all optional, combinable):

| Param | Example | Behaviour |
|---|---|---|
| `q` | `q=computer science` | Free text across name, city, state, description, **and course names** |
| `stream` | `stream=Engineering` | Exact match |
| `state` | `state=Maharashtra` | Exact match |
| `city` | `city=Mumbai` | Exact match |
| `type` | `type=Government` | college_type exact match |
| `naac` | `naac=A++` | Exact match |
| `max_fees` | `max_fees=200000` | avg_fees_per_year ≤ value |
| `exam` | `exam=NEET` | Colleges offering a course with a matching entrance exam |
| `sort` | `sort=fees_low` | `name` \| `fees_low` \| `fees_high` \| `established` |
| `page` | `page=2` | Default 1 |
| `limit` | `limit=12` | Default 12, max 50 |

Example: `GET /api/colleges?stream=Engineering&max_fees=250000&sort=fees_low&page=1`

### Courses

| Method | Endpoint | Description |
|---|---|---|
| GET | `/courses?q=...&level=...&entrance_exam=...` | Search courses across all colleges |
| GET | `/courses/college/:collegeId` | All courses for one college |
| POST | `/courses/college/:collegeId` | Add a course |
| PUT | `/courses/:id` | Update a course |
| DELETE | `/courses/:id` | Delete a course |

### Contacts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/contacts/college/:collegeId` | All contact entries for one college |
| POST | `/contacts/college/:collegeId` | Add a contact (`contact_type`, `contact_value`, `label`) |
| DELETE | `/contacts/:id` | Delete a contact |

### Shortlist (session-based, no login)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/shortlist/:sessionId` | List shortlisted colleges |
| POST | `/shortlist/:sessionId` | Add `{ college_id }` |
| DELETE | `/shortlist/:sessionId/:collegeId` | Remove one |

### Health

`GET /api/health` → `{ status: "ok", time: ... }`

---

## Frontend

Plain HTML/CSS/JS, no build step or framework — open `frontend/index.html`
served by Express, or point any static server at the `frontend/` folder
(update `API_BASE` in `app.js` if hosting separately).

**Design notes:** the visual language is built around the Indian admissions
season specifically (NAAC grades, entrance exams, "admit card" search panel,
index-card-style result tiles with a verified-grade corner stamp) rather than
a generic dashboard look. Palette: deep navy + marigold accent on warm paper.
Type: serif display headings (Source Serif 4) + Inter for UI + JetBrains Mono
for data (fees, codes, counts).

**Features:**
- Free-text search across college name, city, state, description, and course names
- Stream filter chips (Engineering, Medical, Law, Management, Arts, Commerce, Science, Design)
- Advanced filters: state, institution type, NAAC grade, max fees, sort order
- Paginated results grid
- Click-through detail view: full course table (duration, seats, fees, entrance exam) + clickable contacts (`tel:`, `mailto:`, website)
- Shortlist: save colleges to a drawer for later comparison, persisted server-side per anonymous session
- Responsive down to mobile; visible keyboard focus; `prefers-reduced-motion` respected

---

## Known limitations / next steps

- Search uses indexed `LIKE` queries, which is plenty fast at this dataset
  size. For a much larger catalogue, swap to SQLite FTS5 (or your SQL
  engine's full-text search) inside `connection.js`/`colleges.js` without
  changing the route contracts.
- The shortlist has no real authentication — it's scoped to a random ID in
  `localStorage`, which is fine for "save for this browser session" but
  wouldn't survive a cleared cache or follow a user across devices. A real
  accounts system would replace `session_id` with a `user_id`.
- Only 20 sample institutions are seeded. The schema and API already support
  any number of colleges/courses/contacts — add more via `seed.js` or the
  `POST` endpoints.
