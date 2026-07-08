-- =====================================================================
-- India College Finder — Database Schema
-- =====================================================================
-- Design notes:
--   * colleges        -> one row per institution
--   * courses         -> one row per course offered (many per college)
--   * college_contacts -> one row per contact channel (many per college:
--                          phone, email, website, admissions office, etc.)
--   * FULL TEXT-ish search is done via normal indexed LIKE queries on
--     name/city/state/stream, which is sufficient at this dataset size.
--     For a much larger dataset, swap to SQLite FTS5 or a real search
--     engine (e.g. MySQL FULLTEXT / Postgres tsvector / Elasticsearch)
--     without changing the API contract.
-- =====================================================================

CREATE TABLE IF NOT EXISTS colleges (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    city            TEXT NOT NULL,
    state           TEXT NOT NULL,
    stream          TEXT NOT NULL,        -- Engineering, Medical, Arts, Commerce, Law, Management, Science, Design
    college_type    TEXT NOT NULL,        -- Government, Private, Deemed, Autonomous
    affiliation     TEXT,                 -- e.g. "UGC, AICTE", "MCI/NMC", university name
    naac_grade      TEXT,                 -- e.g. "A++", "A", "B+", or NULL if not graded
    established_year INTEGER,
    description     TEXT,
    address         TEXT,
    pincode         TEXT,
    latitude        REAL,
    longitude       REAL,
    avg_fees_per_year INTEGER,            -- in INR, approximate, for sorting/filtering
    nirf_ranking    INTEGER,
    avg_placement_package REAL,           -- in LPA, e.g. 12.5 for 12.5 LPA
    highest_placement_package REAL,       -- in LPA
    total_courses   INTEGER DEFAULT 0,    -- denormalized counter, kept in sync by app code
    logo_url        TEXT,                 -- wikipedia logo/image cache
    placement_rate  REAL,
    campus_size     TEXT,
    facilities      TEXT,
    hostel_available INTEGER,
    contact_email   TEXT,
    contact_phone   TEXT,
    website         TEXT,
    student_rating  REAL,
    top_recruiters  TEXT,
    scholarships_info TEXT,
    application_deadline TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS courses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,         -- e.g. "B.Tech Computer Science and Engineering"
    level           TEXT NOT NULL,         -- UG, PG, Diploma, PhD, Certificate
    duration_years  REAL,                  -- e.g. 4, 2, 1.5
    degree_type     TEXT,                  -- e.g. "B.Tech", "B.Sc", "MBA", "MBBS"
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS college_courses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    course_id       INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    fees_per_year   INTEGER,               -- INR
    seats           INTEGER,
    entrance_exam   TEXT,                  -- e.g. "JEE Main", "NEET", "CAT"
    eligibility     TEXT,                  -- e.g. "10+2 with 50%"
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(college_id, course_id)
);

CREATE TABLE IF NOT EXISTS college_contacts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    contact_type    TEXT NOT NULL,         -- phone, email, website, address, admissions_office
    contact_value   TEXT NOT NULL,
    label           TEXT                   -- e.g. "Admissions Office", "Registrar", "General Enquiry"
);

-- Saved/shortlisted colleges per (anonymous) browser session — optional
-- feature that lets the frontend offer a "shortlist" without requiring
-- a full user-accounts system for this MVP.
CREATE TABLE IF NOT EXISTS shortlists (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL,
    college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, college_id)
);

-- ---------------------------------------------------------------------
-- Indexes to keep search and filtering fast
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_colleges_name      ON colleges(name);
CREATE INDEX IF NOT EXISTS idx_colleges_city      ON colleges(city);
CREATE INDEX IF NOT EXISTS idx_colleges_state     ON colleges(state);
CREATE INDEX IF NOT EXISTS idx_colleges_stream    ON colleges(stream);
CREATE INDEX IF NOT EXISTS idx_colleges_type      ON colleges(college_type);
CREATE INDEX IF NOT EXISTS idx_courses_name           ON courses(name);
CREATE INDEX IF NOT EXISTS idx_cc_college_id          ON college_courses(college_id);
CREATE INDEX IF NOT EXISTS idx_cc_course_id           ON college_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_contacts_college_id ON college_contacts(college_id);
CREATE INDEX IF NOT EXISTS idx_shortlists_session  ON shortlists(session_id);

CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT UNIQUE NOT NULL,
    name            TEXT,
    picture         TEXT,
    role            TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user'
    password_hash   TEXT,                         -- Format: salt:pbkdf2_hex
    jee_rank        INTEGER,
    neet_rank       INTEGER,
    cat_percentile  REAL,
    board_percentage REAL,
    academic_stream TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

-- Seed default admin account
INSERT OR IGNORE INTO users (email, name, role, password_hash)
VALUES (
    'admin@pathshalakhoj.com',
    'System Admin',
    'admin',
    '461e7123984db8c8:1d82cdf777e9e0c25262870a503ccdb9cb458260f7ad9ef94cd984c0aee520f4935095fba53687e9941dd7677dc70a0269ef69abaf59bad8fecd40b676ad7ab8'
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_name       TEXT NOT NULL,
    stream          TEXT NOT NULL,
    dates_details   TEXT NOT NULL,
    status          TEXT NOT NULL,          -- Ongoing, Upcoming, Scheduled, Completed
    badge_filter    TEXT NOT NULL,          -- e.g. "JEE Main", "NEET"
    post_exam_note  TEXT,                   -- counseling or result note
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL,          -- we use session_id to identify the user
    college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'Applied', -- Applied, Under Review, Accepted, Rejected
    created_at      TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, college_id)
);


-- Seed default exams timeline
INSERT OR IGNORE INTO timeline_events (id, exam_name, stream, dates_details, status, badge_filter, post_exam_note)
VALUES
(1, 'JEE Main 2026', 'Engineering', 'Exam: Jan 22 - Feb 2, 2026 | Session 2: Apr 2026', 'Ongoing', 'JEE Main', NULL),
(2, 'NEET UG 2026', 'Medical', 'Exam Date: May 3, 2026', 'Upcoming', 'NEET', NULL),
(3, 'JoSAA Counseling', 'Engineering', 'Starts: June 15, 2026 (Post JEE Advanced)', 'Scheduled', 'JEE Advanced', 'Check portal at josaa.nic.in for options.'),
(4, 'CAT 2026', 'Management', 'Registration: Aug - Sep | Exam: Nov 29, 2026', 'Scheduled', 'CAT', NULL),
(5, 'CLAT 2026', 'Law', 'Exam Date: Dec 6, 2026', 'Scheduled', 'CLAT', NULL);

CREATE TABLE IF NOT EXISTS college_reviews (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    author_name     TEXT NOT NULL,
    rating          INTEGER NOT NULL,
    review_text     TEXT NOT NULL,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS college_qna (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    author_name     TEXT NOT NULL,
    question        TEXT NOT NULL,
    answer          TEXT,
    answered_by     TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);
