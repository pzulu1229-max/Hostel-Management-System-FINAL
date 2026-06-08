const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs');
const path = require('path');

// Get all complaints (for admin)
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as user_name, u.email 
      FROM complaints c 
      JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's complaints
router.get('/my-complaints/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT * FROM complaints 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create complaint
router.post('/', async (req, res) => {
  const { user_id, description, image_url } = req.body;
  
  // Check description length (max 100 characters)
  if (description.length > 100) {
    return res.status(400).json({ error: 'Description cannot exceed 100 characters' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO complaints (user_id, description, image_url, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, description, image_url, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update complaint (edit)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;
  
  // Check description length (max 100 characters)
  if (description.length > 100) {
    return res.status(400).json({ error: 'Description cannot exceed 100 characters' });
  }
  
  try {
    const result = await pool.query(
      'UPDATE complaints SET description = $1 WHERE id = $2 RETURNING *',
      [description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update complaint status (admin)
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete complaint (student or admin)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Get image path to delete file
    const complaint = await pool.query('SELECT image_url FROM complaints WHERE id = $1', [id]);
    if (complaint.rows.length > 0 && complaint.rows[0].image_url) {
      const imagePath = path.join(__dirname, '../uploads', path.basename(complaint.rows[0].image_url));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    const result = await pool.query('DELETE FROM complaints WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
