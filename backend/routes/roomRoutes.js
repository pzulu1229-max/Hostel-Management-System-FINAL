const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY room_number');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single room
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new room
router.post('/', async (req, res) => {
  const { room_number, capacity, price, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO rooms (room_number, capacity, price, description, current_occupancy, is_available) VALUES ($1, $2, $3, $4, 0, true) RETURNING *',
      [room_number, capacity, price, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update room
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { room_number, capacity, price, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE rooms SET room_number = $1, capacity = $2, price = $3, description = $4 WHERE id = $5 RETURNING *',
      [room_number, capacity, price, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete room
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // First delete any bookings for this room
    await pool.query('DELETE FROM allocations WHERE room_id = $1', [id]);
    // Then delete the room
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
