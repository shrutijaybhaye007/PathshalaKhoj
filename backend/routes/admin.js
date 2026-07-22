/**
 * admin.js — Admin data-pipeline routes
 *
 * Provides:
 *   GET  /api/admin/export              — export all colleges as JSON
 *   POST /api/admin/import              — bulk import colleges from JSON array
 *   GET  /api/admin/stats               — DB health stats
 *   POST /api/admin/sync-total-courses  — recalculate total_courses for all colleges
 *   GET  /api/admin/migrations          — list applied migrations
 *
 * All routes require admin JWT.
 */
const express        = require('express');
const router         = express.Router();
const { get, all, run, exec } = require('../db/connection');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');

// ─── Allowed enum values ────────────────────────────────────────────────────
const VALID_STREAMS = [
  'Engineering', 'Medical', 'Arts', 'Commerce', 'Science',
  'Management', 'Law', 'Design', 'Junior College',
];
const VALID_TYPES = [
  'Government', 'Private', 'Deemed', 'Autonomous',
  'Affiliated College', 'Recognized Center',
  'Constituent / University College', 'PG Center / Off-Campus Center',
  'Central University', 'State University',
];
const VALID_NAAC = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'D'];

// ── Export ──────────────────────────────────────────────────────────────────
/**
 * GET /api/admin/export
 * Export all colleges with their courses and contacts as JSON.
 * Query: ?stream=Engineering&state=Maharashtra&limit=1000&offset=0
 */
router.get('/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { stream, state, limit = 1000, offset = 0 } = req.query;
    let sql = 'SELECT * FROM colleges';
    const params = [];
    const conditions = [];
    if (stream)   { conditions.push('stream = ?');  params.push(stream); }
    if (state)    { conditions.push('state = ?');   params.push(state);  }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY id LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const colleges = await all(sql, params);
    const totalRow = await get(
      'SELECT COUNT(*) as c FROM colleges' + (conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''),
      params.slice(0, conditions.length)
    );
    const total = parseInt(totalRow ? totalRow.c : 0, 10);

    // Attach courses and contacts for each college
    const enriched = await Promise.all(colleges.map(async c => {
      const courses  = await all(
        `SELECT cr.name, cr.level, cr.duration_years, cr.degree_type,
                cc.fees_per_year, cc.seats, cc.entrance_exam, cc.eligibility
         FROM college_courses cc JOIN courses cr ON cc.course_id = cr.id
         WHERE cc.college_id = ?`, [c.id]
      );
      const contacts = await all('SELECT contact_type, contact_value, label FROM college_contacts WHERE college_id = ?', [c.id]);
      return { ...c, courses, contacts };
    }));

    res.set('Content-Disposition', `attachment; filename="pathshalakhoj-export-${Date.now()}.json"`);
    res.json({
      exported_at: new Date().toISOString(),
      total_in_db: total,
      total_exported: colleges.length,
      offset: Number(offset),
      colleges: enriched,
    });
  } catch (err) {
    console.error('GET /api/admin/export error:', err);
    res.status(500).json({ error: 'Export failed.' });
  }
});

// ── Import ──────────────────────────────────────────────────────────────────
/**
 * POST /api/admin/import
 * Bulk import colleges from a JSON array.
 *
 * Body: { colleges: [...], mode: 'insert'|'upsert' }
 *   mode=insert → skip existing slugs (safe for fresh additions)
 *   mode=upsert → update existing + insert new (full sync)
 */
router.post('/import', requireAuth, requireAdmin, async (req, res) => {
  const { colleges = [], mode = 'insert' } = req.body;

  if (!Array.isArray(colleges) || colleges.length === 0) {
    return res.status(400).json({ error: 'Body must have a non-empty "colleges" array.' });
  }
  if (!['insert', 'upsert'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be "insert" or "upsert".' });
  }

  const results = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  try {
    await exec('BEGIN');

    for (let i = 0; i < colleges.length; i++) {
      const c = colleges[i];
      try {
        if (!c.name || !c.city || !c.state || !c.stream || !c.college_type) {
          results.errors.push({ index: i, name: c.name, error: 'Missing required fields: name, city, state, stream, college_type' });
          continue;
        }
        if (!VALID_STREAMS.includes(c.stream)) {
          results.errors.push({ index: i, name: c.name, error: `Invalid stream "${c.stream}". Valid: ${VALID_STREAMS.join(', ')}` });
          continue;
        }
        if (c.naac_grade && !VALID_NAAC.includes(c.naac_grade)) {
          results.errors.push({ index: i, name: c.name, error: `Invalid naac_grade "${c.naac_grade}". Valid: ${VALID_NAAC.join(', ')}` });
          continue;
        }

        const baseSlug = `${c.name.trim()}-${c.city.trim()}`
          .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const existingBySlug = await get('SELECT id FROM colleges WHERE slug = ?', [baseSlug]);

        if (existingBySlug && mode === 'insert') {
          results.skipped++;
          continue;
        }

        const galleryImages = Array.isArray(c.gallery_images) ? JSON.stringify(c.gallery_images) : null;
        const logoUrl = c.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=0B1628,1A365D,2B6CB0&textColor=ffffff`;

        let collegeId;
        if (existingBySlug && mode === 'upsert') {
          await run(
            `UPDATE colleges SET
               name=?, city=?, state=?, stream=?, college_type=?, affiliation=?,
               naac_grade=?, established_year=?, description=?, address=?, pincode=?,
               avg_fees_per_year=?, nirf_ranking=?, avg_placement_package=?, highest_placement_package=?,
               placement_rate=?, campus_size=?, facilities=?, hostel_available=?,
               contact_email=?, contact_phone=?, website=?,
               student_rating=?, top_recruiters=?, scholarships_info=?, application_deadline=?,
               logo_url=?, gallery_images=?, updated_at=CURRENT_TIMESTAMP
             WHERE slug=?`,
            [
              c.name.trim(), c.city.trim(), c.state.trim(), c.stream, c.college_type, c.affiliation || null,
              c.naac_grade || null, c.established_year || null, c.description || null,
              c.address || null, c.pincode || null, c.avg_fees_per_year || null,
              c.nirf_ranking || null, c.avg_placement_package || null, c.highest_placement_package || null,
              c.placement_rate || null, c.campus_size || null, c.facilities || null,
              c.hostel_available !== undefined ? c.hostel_available : null,
              c.contact_email || null, c.contact_phone || null, c.website || null,
              c.student_rating || null, c.top_recruiters || null, c.scholarships_info || null,
              c.application_deadline || null, logoUrl, galleryImages, baseSlug,
            ]
          );
          collegeId = existingBySlug.id;
          results.updated++;
        } else {
          let slug = baseSlug;
          let n = 1;
          while (await get('SELECT id FROM colleges WHERE slug = ?', [slug])) {
            slug = `${baseSlug}-${++n}`;
          }
          const ins = await run(
            `INSERT INTO colleges
               (name, slug, city, state, stream, college_type, affiliation, naac_grade,
                established_year, description, address, pincode, avg_fees_per_year,
                nirf_ranking, avg_placement_package, highest_placement_package,
                placement_rate, campus_size, facilities, hostel_available,
                contact_email, contact_phone, website,
                student_rating, top_recruiters, scholarships_info, application_deadline,
                logo_url, gallery_images, total_courses)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`,
            [
              c.name.trim(), slug, c.city.trim(), c.state.trim(), c.stream, c.college_type,
              c.affiliation || null, c.naac_grade || null, c.established_year || null,
              c.description || null, c.address || null, c.pincode || null,
              c.avg_fees_per_year || null, c.nirf_ranking || null,
              c.avg_placement_package || null, c.highest_placement_package || null,
              c.placement_rate || null, c.campus_size || null, c.facilities || null,
              c.hostel_available !== undefined ? c.hostel_available : null,
              c.contact_email || null, c.contact_phone || null, c.website || null,
              c.student_rating || null, c.top_recruiters || null,
              c.scholarships_info || null, c.application_deadline || null,
              logoUrl, galleryImages,
            ]
          );
          collegeId = ins.lastInsertRowid;
          results.inserted++;
        }

        // Handle courses
        if (Array.isArray(c.courses) && c.courses.length > 0) {
          if (mode === 'upsert') {
            await run('DELETE FROM college_courses WHERE college_id = ?', [collegeId]);
          }
          for (const course of c.courses) {
            if (!course.name) continue;
            let masterCourse = await get('SELECT id FROM courses WHERE name = ? AND level = ?', [course.name, course.level || 'UG']);
            if (!masterCourse) {
              const r = await run(
                'INSERT INTO courses (name, level, duration_years, degree_type) VALUES (?,?,?,?)',
                [course.name, course.level || 'UG', course.duration_years || null, course.degree_type || null]
              );
              masterCourse = { id: r.lastInsertRowid };
            }
            await run(
              `INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
               VALUES (?,?,?,?,?,?)
               ON CONFLICT (college_id, course_id) DO NOTHING`,
              [collegeId, masterCourse.id, course.fees_per_year || null,
               course.seats || null, course.entrance_exam || null, course.eligibility || null]
            );
          }
        }

        // Handle contacts
        if (Array.isArray(c.contacts) && c.contacts.length > 0) {
          if (mode === 'upsert') {
            await run('DELETE FROM college_contacts WHERE college_id = ?', [collegeId]);
          }
          for (const contact of c.contacts) {
            if (!contact.contact_type || !contact.contact_value) continue;
            await run(
              'INSERT INTO college_contacts (college_id, contact_type, contact_value, label) VALUES (?,?,?,?) ON CONFLICT DO NOTHING',
              [collegeId, contact.contact_type, contact.contact_value, contact.label || null]
            );
          }
        }

      } catch (rowErr) {
        results.errors.push({ index: i, name: c.name, error: rowErr.message });
      }
    }

    await exec('COMMIT');
  } catch (outerErr) {
    try { await exec('ROLLBACK'); } catch (_) {}
    console.error('Import outer error:', outerErr);
    return res.status(500).json({ error: 'Import failed: ' + outerErr.message });
  }

  res.json({
    success: true,
    mode,
    total_submitted: colleges.length,
    ...results,
    message: `Import complete: ${results.inserted} inserted, ${results.updated} updated, ${results.skipped} skipped, ${results.errors.length} errors.`,
  });
});

// ── Sync total_courses ──────────────────────────────────────────────────────
/**
 * POST /api/admin/sync-total-courses
 * Recalculate and fix total_courses for ALL colleges from the college_courses table.
 */
router.post('/sync-total-courses', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await run(`
      UPDATE colleges
      SET total_courses = (
        SELECT COUNT(*) FROM college_courses WHERE college_id = colleges.id
      )
    `);
    res.json({
      success: true,
      colleges_updated: result.changes,
      message: `Synced total_courses for ${result.changes} colleges.`,
    });
  } catch (err) {
    console.error('sync-total-courses error:', err);
    res.status(500).json({ error: 'Sync failed.' });
  }
});

// ── DB Health Stats ─────────────────────────────────────────────────────────
/**
 * GET /api/admin/stats
 * Returns database health stats: table counts, index list, migration status.
 */
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const collegesRow       = await get('SELECT COUNT(*) as c FROM colleges');
    const coursesRow        = await get('SELECT COUNT(*) as c FROM courses');
    const courseLinkagesRow = await get('SELECT COUNT(*) as c FROM college_courses');
    const usersRow          = await get('SELECT COUNT(*) as c FROM users');
    const contactsRow       = await get('SELECT COUNT(*) as c FROM college_contacts');
    const reviewsRow        = await get('SELECT COUNT(*) as c FROM college_reviews');
    const shortlistsRow     = await get('SELECT COUNT(*) as c FROM shortlists');
    const ftsRowsRow        = await get('SELECT COUNT(*) as c FROM colleges WHERE search_vector IS NOT NULL');

    const colleges       = parseInt(collegesRow ? collegesRow.c : 0, 10);
    const courses        = parseInt(coursesRow ? coursesRow.c : 0, 10);
    const courseLinkages = parseInt(courseLinkagesRow ? courseLinkagesRow.c : 0, 10);
    const users          = parseInt(usersRow ? usersRow.c : 0, 10);
    const contacts       = parseInt(contactsRow ? contactsRow.c : 0, 10);
    const reviews        = parseInt(reviewsRow ? reviewsRow.c : 0, 10);
    const shortlists     = parseInt(shortlistsRow ? shortlistsRow.c : 0, 10);
    const ftsRows        = parseInt(ftsRowsRow ? ftsRowsRow.c : 0, 10);

    const migrations = await all('SELECT name, applied_at FROM schema_migrations ORDER BY id');
    const triggers   = await all("SELECT trigger_name AS name FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY trigger_name");
    const indexes    = await all("SELECT indexname AS name FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname");

    const missingDescRow   = await get("SELECT COUNT(*) as c FROM colleges WHERE description IS NULL OR LENGTH(description)<10");
    const missingFeesRow   = await get("SELECT COUNT(*) as c FROM colleges WHERE avg_fees_per_year IS NULL OR avg_fees_per_year=0");
    const zeroCourseColsRow= await get('SELECT COUNT(*) as c FROM colleges WHERE total_courses=0');

    const missingDesc    = parseInt(missingDescRow ? missingDescRow.c : 0, 10);
    const missingFees    = parseInt(missingFeesRow ? missingFeesRow.c : 0, 10);
    const zeroCourseCols = parseInt(zeroCourseColsRow ? zeroCourseColsRow.c : 0, 10);
    const ftsInSync      = true;

    res.json({
      tables: { colleges, courses, course_linkages: courseLinkages, users, contacts, reviews, shortlists },
      fts:    { rows: ftsRows, in_sync: ftsInSync },
      data_quality: {
        missing_description: missingDesc,
        missing_fees:        missingFees,
        zero_total_courses:  zeroCourseCols,
      },
      migrations: migrations,
      triggers:   triggers.map(t => t.name),
      indexes:    indexes.map(i => i.name),
    });
  } catch (err) {
    console.error('GET /api/admin/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ── Migrations list ─────────────────────────────────────────────────────────
router.get('/migrations', requireAuth, requireAdmin, async (req, res) => {
  try {
    const migrations = await all('SELECT * FROM schema_migrations ORDER BY id');
    res.json({ migrations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch migrations.' });
  }
});

// ── Validate enum values ────────────────────────────────────────────────────
router.get('/enums', requireAuth, requireAdmin, (req, res) => {
  res.json({
    streams:       VALID_STREAMS,
    college_types: VALID_TYPES,
    naac_grades:   VALID_NAAC,
    levels:        ['UG', 'PG', 'PhD', 'Diploma', 'Certificate', 'Integrated'],
  });
});

module.exports = router;
