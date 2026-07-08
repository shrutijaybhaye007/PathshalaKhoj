const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/connection');

/**
 * GET /api/courses?q=computer+science
 * Search across all courses regardless of college — useful for a
 * "find colleges offering X course" search mode.
 */
router.get('/', (req, res) => {
  try {
    const { q, level, entrance_exam } = req.query;
    const conditions = [];
    const params = [];

    if (q && q.trim()) {
      conditions.push('LOWER(co.name) LIKE ?');
      params.push(`%${q.trim().toLowerCase()}%`);
    }
    if (level) {
      conditions.push('co.level = ?');
      params.push(level);
    }
    if (entrance_exam && entrance_exam.trim()) {
      conditions.push('LOWER(cc.entrance_exam) LIKE ?');
      params.push(`%${entrance_exam.trim().toLowerCase()}%`);
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const offset = (page - 1) * limit;

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalRow = get(
      `SELECT COUNT(*) as count 
       FROM college_courses cc 
       JOIN courses co ON cc.course_id = co.id 
       JOIN colleges c ON cc.college_id = c.id 
       ${whereClause}`, 
       params
    );
    const total = totalRow.count;

    const rows = all(
      `SELECT co.id as master_course_id, co.name, co.level, co.duration_years, co.degree_type,
              cc.id, cc.fees_per_year, cc.seats, cc.entrance_exam, cc.eligibility,
              c.name as college_name, c.city, c.state, c.slug as college_slug, c.id as college_id
       FROM college_courses cc
       JOIN courses co ON cc.course_id = co.id
       JOIN colleges c ON cc.college_id = c.id
       ${whereClause}
       ORDER BY co.name
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.max(Math.ceil(total / limit), 1)
      }
    });
  } catch (err) {
    console.error('GET /api/courses error:', err);
    res.status(500).json({ error: 'Failed to search courses.' });
  }
});

/**
 * GET /api/courses/autocomplete
 * Provides live suggestions across courses and colleges.
 */
router.get('/autocomplete', (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ courses: [], colleges: [] });
    const term = `%${q.trim().toLowerCase()}%`;
    
    const courses = all(
      `SELECT DISTINCT name 
       FROM courses 
       WHERE LOWER(name) LIKE ? 
       LIMIT 5`,
      [term]
    );

    const colleges = all(
      `SELECT DISTINCT c.id, c.name, c.city, c.state 
       FROM colleges c
       JOIN college_courses cc ON cc.college_id = c.id
       JOIN courses co ON cc.course_id = co.id
       WHERE LOWER(co.name) LIKE ? OR LOWER(c.name) LIKE ?
       LIMIT 4`,
      [term, term]
    );

    res.json({ courses, colleges });
  } catch (err) {
    console.error('GET /api/courses/autocomplete error:', err);
    res.status(500).json({ error: 'Failed to fetch course autocomplete suggestions.' });
  }
});

/**
 * GET /api/courses/:id/colleges
 * Returns all colleges that offer a specific master course.
 */
router.get('/:id/colleges', (req, res) => {
  try {
    const { id } = req.params;
    const rows = all(
      `SELECT c.id, c.name, c.slug, c.city, c.state, c.stream, c.college_type, c.naac_grade, c.avg_fees_per_year,
              cc.fees_per_year as course_fees, cc.seats, cc.entrance_exam
       FROM college_courses cc
       JOIN colleges c ON cc.college_id = c.id
       WHERE cc.course_id = ?
       ORDER BY c.name ASC`,
      [id]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('GET /api/courses/:id/colleges error:', err);
    res.status(500).json({ error: 'Failed to fetch colleges for course.' });
  }
});
/**
 * POST /api/courses/college/:collegeId
 * Admin only: Maps an existing master course to a college.
 */
router.post('/college/:collegeId', (req, res) => {
  try {
    const { course_id, fees_per_year, seats, entrance_exam, eligibility } = req.body;
    run(
      `INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.collegeId, course_id, fees_per_year || null, seats || null, entrance_exam || null, eligibility || null]
    );
    
    // Update count
    run(
      `UPDATE colleges SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = ?) WHERE id = ?`,
      [req.params.collegeId, req.params.collegeId]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('POST /api/courses/college/:collegeId error:', err);
    res.status(500).json({ error: 'Failed to add course.' });
  }
});

module.exports = router;
