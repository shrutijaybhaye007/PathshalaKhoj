const express = require('express');
const { get, all, run } = require('../db/connection');
const { requireAuth, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * GET /api/exams
 * Public endpoint to fetch all upcoming exams / counseling timeline events.
 */
router.get('/', (req, res) => {
  try {
    const exams = all('SELECT * FROM timeline_events ORDER BY id ASC');
    res.json(exams);
  } catch (err) {
    console.error('GET /api/exams error:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming exams timeline.' });
  }
});

/**
 * POST /api/exams
 * Create a new timeline event (Admin only).
 */
router.post('/', requireAuth, requireAdmin, (req, res) => {
  try {
    const { exam_name, stream, dates_details, status, badge_filter, post_exam_note } = req.body;
    if (!exam_name || !stream || !dates_details || !status || !badge_filter) {
      return res.status(400).json({
        error: 'Missing required fields: exam_name, stream, dates_details, status, and badge_filter are required.'
      });
    }

    const result = run(
      `INSERT INTO timeline_events (exam_name, stream, dates_details, status, badge_filter, post_exam_note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [exam_name, stream, dates_details, status, badge_filter, post_exam_note || null]
    );

    const created = get('SELECT * FROM timeline_events WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(created);
  } catch (err) {
    console.error('POST /api/exams error:', err);
    res.status(500).json({ error: 'Failed to create timeline event.' });
  }
});

/**
 * PUT /api/exams/:id
 * Update an existing timeline event (Admin only).
 */
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const existing = get('SELECT * FROM timeline_events WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Timeline event not found.' });
    }

    const fields = ['exam_name', 'stream', 'dates_details', 'status', 'badge_filter', 'post_exam_note'];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);

    run(`UPDATE timeline_events SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = get('SELECT * FROM timeline_events WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/exams/:id error:', err);
    res.status(500).json({ error: 'Failed to update timeline event.' });
  }
});

/**
 * DELETE /api/exams/:id
 * Delete a timeline event (Admin only).
 */
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const existing = get('SELECT * FROM timeline_events WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Timeline event not found.' });
    }
    run('DELETE FROM timeline_events WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/exams/:id error:', err);
    res.status(500).json({ error: 'Failed to delete timeline event.' });
  }
});

module.exports = router;
