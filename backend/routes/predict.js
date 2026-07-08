const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');
const { all } = require('../db/connection');

/**
 * POST /api/predict
 * Receives: { stream, board, rank }
 * Returns categorized arrays: { safe: [], target: [], reach: [] }
 */
// POST /api/predict -> returns safe/target/reach matches
// AUTH REQUIRED: Only logged-in students can use this
router.post('/', requireAuth, (req, res) => {
  try {
    const { stream, board, rank } = req.body;

    if (!stream || !board || !rank) {
      return res.status(400).json({ error: 'Missing required fields: stream, board, rank' });
    }

    const studentRank = parseInt(rank, 10);
    const boardPct = parseFloat(board);

    // Fetch all colleges matching the stream
    const colleges = all(
      `SELECT id, name, city, state, stream, naac_grade, nirf_ranking, avg_fees_per_year, logo_url 
       FROM colleges 
       WHERE stream = ? 
       ORDER BY nirf_ranking ASC`,
      [stream]
    );

    const safe = [];
    const target = [];
    const reach = [];

    // AI Prediction Algorithm Logic (Simulated Cutoffs based on NIRF Ranking)
    // - Top Tier (NIRF 1-50): Needs Rank < 20,000 and Board > 85%
    // - Mid Tier (NIRF 51-150): Needs Rank < 60,000 and Board > 75%
    // - Lower Tier / Unranked: Needs Rank < 200,000 and Board > 60%

    colleges.forEach(c => {
      let requiredRank;
      
      if (c.nirf_ranking && c.nirf_ranking <= 50) {
        requiredRank = 20000;
      } else if (c.nirf_ranking && c.nirf_ranking <= 150) {
        requiredRank = 60000;
      } else {
        requiredRank = 200000;
      }

      // Buffer ranges to determine match type
      // Safe: Student rank is much better (lower) than required
      // Target: Student rank is close to required
      // Reach: Student rank is worse (higher) than required, but within 20% margin

      if (studentRank <= requiredRank * 0.7) {
        // Safe Match
        if (safe.length < 5) safe.push(c);
      } else if (studentRank <= requiredRank) {
        // Target Match
        if (target.length < 5) target.push(c);
      } else if (studentRank <= requiredRank * 1.5) {
        // Reach Match
        if (reach.length < 5) reach.push(c);
      }
    });

    res.json({
      success: true,
      results: {
        safe,
        target,
        reach
      }
    });

  } catch (err) {
    console.error('POST /api/predict error:', err);
    res.status(500).json({ error: 'AI Prediction Engine failed to process scores.' });
  }
});

module.exports = router;
