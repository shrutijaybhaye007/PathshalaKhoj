/**
 * routes/reviews.js
 * GET  /api/reviews/:college_id   — fetch all reviews for a college
 * POST /api/reviews/:college_id   — submit a review (auth required)
 * DELETE /api/reviews/:id         — delete own review (auth required)
 */
const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/connection');
const { requireAuth } = require('../middlewares/authMiddleware');

/**
 * GET /api/reviews/:college_id
 * Returns all approved reviews for a college, newest first.
 */
router.get('/:college_id', async (req, res) => {
  try {
    const reviews = await all(
      `SELECT r.id, r.rating, r.review_text, r.pros, r.cons, r.created_at,
              COALESCE(r.author_name, u.name, 'Anonymous') AS reviewer_name
       FROM college_reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.college_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.college_id]
    );

    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

    res.json({ reviews, avg_rating: avg, total: reviews.length });
  } catch (err) {
    console.error('GET /api/reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

/**
 * POST /api/reviews/:college_id
 * Submit a review. Auth required.
 * Body: { rating (1-5), review_text, pros, cons }
 */
router.post('/:college_id', requireAuth, async (req, res) => {
  try {
    const { rating, review_text, pros, cons } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const college = await get('SELECT id FROM colleges WHERE id = ?', [req.params.college_id]);
    if (!college) return res.status(404).json({ error: 'College not found.' });

    // One review per user per college
    const existing = await get(
      'SELECT id FROM college_reviews WHERE college_id = ? AND user_id = ?',
      [req.params.college_id, req.user.id]
    );
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this college.' });
    }

    const result = await run(
      `INSERT INTO college_reviews (college_id, user_id, author_name, rating, review_text, pros, cons)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.college_id, req.user.id, req.user.name || 'Anonymous', rating, review_text || null, pros || null, cons || null]
    );

    // Update avg student_rating on the colleges table
    const avgRow = await get(
      'SELECT AVG(rating) as avg FROM college_reviews WHERE college_id = ?',
      [req.params.college_id]
    );
    try {
      if (avgRow && avgRow.avg !== null) {
        await run('UPDATE colleges SET student_rating = ? WHERE id = ?', [parseFloat(avgRow.avg), req.params.college_id]);
      }
    } catch(e) {}

    res.status(201).json({ id: result.lastInsertRowid, message: 'Review submitted! Thank you.' });
  } catch (err) {
    console.error('POST /api/reviews error:', err);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete own review (or admin can delete any).
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const review = await get('SELECT * FROM college_reviews WHERE id = ?', [req.params.id]);
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own reviews.' });
    }
    await run('DELETE FROM college_reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    console.error('DELETE /api/reviews error:', err);
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});

module.exports = router;
