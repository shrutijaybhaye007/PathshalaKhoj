const express = require('express');
const router = express.Router();
const { run, all } = require('../db/connection');

/**
 * GET /api/applications/:sessionId
 * Fetches all applications for a specific user session.
 */
router.get('/:sessionId', (req, res) => {
  try {
    const rows = all(
      `SELECT a.id as application_id, a.status, a.created_at, 
              c.id, c.name, c.city, c.state, c.stream, c.college_type
       FROM applications a
       JOIN colleges c ON c.id = a.college_id
       WHERE a.session_id = ?
       ORDER BY a.created_at DESC`,
      [req.params.sessionId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('GET /api/applications/:sessionId error:', err);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

/**
 * POST /api/applications/:sessionId
 * Creates a new application.
 * Body: { college_id }
 */
router.post('/:sessionId', (req, res) => {
  try {
    const { college_id } = req.body;
    if (!college_id) {
      return res.status(400).json({ error: 'college_id is required' });
    }

    run(
      `INSERT INTO applications (session_id, college_id) VALUES (?, ?)
       ON CONFLICT(session_id, college_id) DO NOTHING`,
      [req.params.sessionId, college_id]
    );

    res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (err) {
    console.error('POST /api/applications/:sessionId error:', err);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});

module.exports = router;
