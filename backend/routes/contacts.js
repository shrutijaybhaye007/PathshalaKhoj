const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db/connection');

/**
 * GET /api/contacts/college/:collegeId
 */
router.get('/college/:collegeId', (req, res) => {
  try {
    const rows = all(
      'SELECT * FROM college_contacts WHERE college_id = ? ORDER BY contact_type',
      [req.params.collegeId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('GET /api/contacts/college/:collegeId error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
});

/**
 * POST /api/contacts/college/:collegeId
 * Body: { contact_type, contact_value, label }
 */
router.post('/college/:collegeId', (req, res) => {
  try {
    const college = get('SELECT id FROM colleges WHERE id = ?', [req.params.collegeId]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    const { contact_type, contact_value, label } = req.body;
    if (!contact_type || !contact_value) {
      return res.status(400).json({ error: 'contact_type and contact_value are required.' });
    }

    const result = run(
      `INSERT INTO college_contacts (college_id, contact_type, contact_value, label)
       VALUES (?, ?, ?, ?)`,
      [req.params.collegeId, contact_type, contact_value, label || null]
    );

    const created = get('SELECT * FROM college_contacts WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(created);
  } catch (err) {
    console.error('POST /api/contacts/college/:collegeId error:', err);
    res.status(500).json({ error: 'Failed to add contact.' });
  }
});

/**
 * DELETE /api/contacts/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const existing = get('SELECT * FROM college_contacts WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Contact not found.' });
    }
    run('DELETE FROM college_contacts WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/contacts/:id error:', err);
    res.status(500).json({ error: 'Failed to delete contact.' });
  }
});

module.exports = router;
