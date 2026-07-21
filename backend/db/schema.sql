-- =====================================================================
-- India College Finder — PostgreSQL Database Schema
-- =====================================================================

CREATE TABLE IF NOT EXISTS colleges (
    id                      SERIAL PRIMARY KEY,
    name                    TEXT NOT NULL,
    slug                    TEXT NOT NULL UNIQUE,
    city                    TEXT NOT NULL,
    state                   TEXT NOT NULL,
    stream                  TEXT NOT NULL,        -- Engineering, Medical, Arts, Commerce, Law, Management, Science, Design
    college_type            TEXT NOT NULL,        -- Government, Private, Deemed, Autonomous
    affiliation             TEXT,                 -- e.g. "UGC, AICTE", "MCI/NMC", university name
    naac_grade              TEXT,                 -- e.g. "A++", "A", "B+", or NULL if not graded
    established_year        INTEGER,
    description             TEXT,
    address                 TEXT,
    pincode                 TEXT,
    latitude                DOUBLE PRECISION,
    longitude               DOUBLE PRECISION,
    avg_fees_per_year       INTEGER,              -- in INR, approximate, for sorting/filtering
    nirf_ranking            INTEGER,
    avg_placement_package   DOUBLE PRECISION,     -- in LPA, e.g. 12.5 for 12.5 LPA
    highest_placement_package DOUBLE PRECISION,   -- in LPA
    total_courses           INTEGER DEFAULT 0,    -- denormalized counter, kept in sync by trigger
    logo_url                TEXT,                 -- wikipedia logo/image cache
    placement_rate          DOUBLE PRECISION,
    campus_size             TEXT,
    facilities              TEXT,
    hostel_available        INTEGER,
    contact_email           TEXT,
    contact_phone           TEXT,
    website                 TEXT,
    student_rating          DOUBLE PRECISION,
    top_recruiters          TEXT,
    scholarships_info       TEXT,
    application_deadline    TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    search_vector           tsvector
);

CREATE TABLE IF NOT EXISTS courses (
    id                      SERIAL PRIMARY KEY,
    name                    TEXT NOT NULL,         -- e.g. "B.Tech Computer Science and Engineering"
    level                   TEXT NOT NULL,         -- UG, PG, Diploma, PhD, Certificate
    duration_years          DOUBLE PRECISION,      -- e.g. 4, 2, 1.5
    degree_type             TEXT,                  -- e.g. "B.Tech", "B.Sc", "MBA", "MBBS"
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS college_courses (
    id                      SERIAL PRIMARY KEY,
    college_id              INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    course_id               INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    fees_per_year           INTEGER,               -- INR
    seats                   INTEGER,
    entrance_exam           TEXT,                  -- e.g. "JEE Main", "NEET", "CAT"
    eligibility             TEXT,                  -- e.g. "10+2 with 50%"
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(college_id, course_id)
);

CREATE TABLE IF NOT EXISTS college_contacts (
    id                      SERIAL PRIMARY KEY,
    college_id              INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    contact_type            TEXT NOT NULL,         -- phone, email, website, address, admissions_office
    contact_value           TEXT NOT NULL,
    label                   TEXT                   -- e.g. "Admissions Office", "Registrar", "General Enquiry"
);

CREATE TABLE IF NOT EXISTS shortlists (
    id                      SERIAL PRIMARY KEY,
    session_id              TEXT NOT NULL,
    college_id              INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, college_id)
);

CREATE TABLE IF NOT EXISTS users (
    id                      SERIAL PRIMARY KEY,
    email                   TEXT UNIQUE NOT NULL,
    name                    TEXT,
    picture                 TEXT,
    role                    TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user'
    password_hash           TEXT,                         -- Format: salt:pbkdf2_hex
    password_reset_token    TEXT,
    password_reset_expires  TEXT,
    jee_rank                INTEGER,
    neet_rank               INTEGER,
    cat_percentile          DOUBLE PRECISION,
    board_percentage        DOUBLE PRECISION,
    academic_stream         TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id                      SERIAL PRIMARY KEY,
    exam_name               TEXT NOT NULL,
    stream                  TEXT NOT NULL,
    dates_details           TEXT NOT NULL,
    status                  TEXT NOT NULL,          -- Ongoing, Upcoming, Scheduled, Completed
    badge_filter            TEXT NOT NULL,          -- e.g. "JEE Main", "NEET"
    post_exam_note          TEXT,                   -- counseling or result note
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
    id                      SERIAL PRIMARY KEY,
    session_id              TEXT NOT NULL,          -- session_id identifies user
    college_id              INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    status                  TEXT NOT NULL DEFAULT 'Applied', -- Applied, Under Review, Accepted, Rejected
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, college_id)
);

CREATE TABLE IF NOT EXISTS college_reviews (
    id                      SERIAL PRIMARY KEY,
    college_id              INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    author_name             TEXT NOT NULL,
    rating                  INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text             TEXT NOT NULL,
    user_id                 INTEGER,
    pros                    TEXT,
    cons                    TEXT,
    status                  TEXT DEFAULT 'approved',
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS college_qna (
    id                      SERIAL PRIMARY KEY,
    college_id              INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    author_name             TEXT NOT NULL,
    question                TEXT NOT NULL,
    answer                  TEXT,
    answered_by             TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schema_migrations (
    id                      SERIAL PRIMARY KEY,
    name                    VARCHAR(255) NOT NULL UNIQUE,
    applied_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_colleges_name         ON colleges(name);
CREATE INDEX IF NOT EXISTS idx_colleges_city         ON colleges(city);
CREATE INDEX IF NOT EXISTS idx_colleges_state        ON colleges(state);
CREATE INDEX IF NOT EXISTS idx_colleges_stream       ON colleges(stream);
CREATE INDEX IF NOT EXISTS idx_colleges_type         ON colleges(college_type);
CREATE INDEX IF NOT EXISTS idx_courses_name          ON courses(name);
CREATE INDEX IF NOT EXISTS idx_cc_college_id         ON college_courses(college_id);
CREATE INDEX IF NOT EXISTS idx_cc_course_id          ON college_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_contacts_college_id  ON college_contacts(college_id);
CREATE INDEX IF NOT EXISTS idx_shortlists_session   ON shortlists(session_id);
CREATE INDEX IF NOT EXISTS idx_colleges_search_vector ON colleges USING gin(search_vector);

-- ---------------------------------------------------------------------
-- Full-Text Search Vector Update Trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION colleges_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS colleges_search_vector_update ON colleges;
CREATE TRIGGER colleges_search_vector_update
BEFORE INSERT OR UPDATE ON colleges
FOR EACH ROW EXECUTE FUNCTION colleges_search_vector_trigger();

-- ---------------------------------------------------------------------
-- Auto-sync total_courses Trigger
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_college_total_courses() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE colleges
    SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = NEW.college_id)
    WHERE id = NEW.college_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE colleges
    SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = OLD.college_id)
    WHERE id = OLD.college_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cc_ai_sync ON college_courses;
CREATE TRIGGER cc_ai_sync AFTER INSERT ON college_courses
FOR EACH ROW EXECUTE FUNCTION update_college_total_courses();

DROP TRIGGER IF EXISTS cc_ad_sync ON college_courses;
CREATE TRIGGER cc_ad_sync AFTER DELETE ON college_courses
FOR EACH ROW EXECUTE FUNCTION update_college_total_courses();

-- Seed default exams timeline if not present
INSERT INTO timeline_events (id, exam_name, stream, dates_details, status, badge_filter, post_exam_note)
VALUES
(1, 'JEE Main 2026', 'Engineering', 'Exam: Jan 22 - Feb 2, 2026 | Session 2: Apr 2026', 'Ongoing', 'JEE Main', NULL),
(2, 'NEET UG 2026', 'Medical', 'Exam Date: May 3, 2026', 'Upcoming', 'NEET', NULL),
(3, 'JoSAA Counseling', 'Engineering', 'Starts: June 15, 2026 (Post JEE Advanced)', 'Scheduled', 'JEE Advanced', 'Check portal at josaa.nic.in for options.'),
(4, 'CAT 2026', 'Management', 'Registration: Aug - Sep | Exam: Nov 29, 2026', 'Scheduled', 'CAT', NULL),
(5, 'CLAT 2026', 'Law', 'Exam Date: Dec 6, 2026', 'Scheduled', 'CLAT', NULL)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- Migration: add data_verified and data_source columns
-- data_verified = true  → college is matched to a real NIRF entry
-- data_source           → 'legacy' | 'aishe' | 'manual'
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM schema_migrations WHERE name = 'add_data_verified_and_source_columns'
  ) THEN
    ALTER TABLE colleges ADD COLUMN IF NOT EXISTS data_verified BOOLEAN DEFAULT false;
    ALTER TABLE colleges ADD COLUMN IF NOT EXISTS data_source   TEXT    DEFAULT 'legacy';

    -- Backfill: all pre-existing rows get data_source = 'legacy'
    UPDATE colleges SET data_source = 'legacy'
    WHERE data_source IS NULL OR data_source = 'legacy';

    INSERT INTO schema_migrations (name)
    VALUES ('add_data_verified_and_source_columns');

    RAISE NOTICE 'Migration applied: data_verified + data_source columns added.';
  ELSE
    RAISE NOTICE 'Migration already applied: skipping.';
  END IF;
END
$$;
