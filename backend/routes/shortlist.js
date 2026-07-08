const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/connection');

/**
 * Lightweight "shortlist" feature scoped to an anonymous session id
 * (generated client-side and stored in localStorage) — lets a student
 * save colleges to compare later without needing a full login system.
 */

/**
 * GET /api/shortlist/:sessionId
 */
router.get('/:sessionId', (req, res) => {
  try {
    const rows = all(
      `SELECT c.id, c.name, c.city, c.state, c.stream, c.college_type,
              c.naac_grade, c.avg_fees_per_year, s.created_at as shortlisted_at
       FROM shortlists s
       JOIN colleges c ON c.id = s.college_id
       WHERE s.session_id = ?
       ORDER BY s.created_at DESC`,
      [req.params.sessionId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('GET /api/shortlist/:sessionId error:', err);
    res.status(500).json({ error: 'Failed to fetch shortlist.' });
  }
});

/**
 * POST /api/shortlist/:sessionId
 * Body: { college_id }
 */
router.post('/:sessionId', (req, res) => {
  try {
    const { college_id } = req.body;
    if (!college_id) {
      return res.status(400).json({ error: 'college_id is required.' });
    }

    const college = get('SELECT id FROM colleges WHERE id = ?', [college_id]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    run(
      `INSERT INTO shortlists (session_id, college_id) VALUES (?, ?)
       ON CONFLICT(session_id, college_id) DO NOTHING`,
      [req.params.sessionId, college_id]
    );

    res.status(201).json({ message: 'Added to shortlist.' });
  } catch (err) {
    console.error('POST /api/shortlist/:sessionId error:', err);
    res.status(500).json({ error: 'Failed to add to shortlist.' });
  }
});

/**
 * DELETE /api/shortlist/:sessionId/:collegeId
 */
router.delete('/:sessionId/:collegeId', (req, res) => {
  try {
    run(
      'DELETE FROM shortlists WHERE session_id = ? AND college_id = ?',
      [req.params.sessionId, req.params.collegeId]
    );
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/shortlist/:sessionId/:collegeId error:', err);
    res.status(500).json({ error: 'Failed to remove from shortlist.' });
  }
});

module.exports = router;
