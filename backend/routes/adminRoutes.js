const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

console.log('✅ Admin routes loaded!');

// Get all pending bookings
router.get('/pending-bookings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.name as user_name, u.email, r.room_number, r.price, r.capacity, r.current_occupancy
      FROM allocations b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      WHERE b.approval_status = 'pending' AND b.status = 'active'
      ORDER BY b.allocated_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bookings
router.get('/all-bookings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, u.name as user_name, u.email, r.room_number, r.price, r.current_occupancy, r.capacity
      FROM allocations b
      JOIN users u ON b.user_id = u.id
      JOIN rooms r ON b.room_id = r.id
      WHERE b.status = 'active'
      ORDER BY b.allocated_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, created_at 
      FROM users 
      WHERE role = 'student'
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update student
router.put('/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;
  try {
    let query = 'UPDATE users SET name = $1, email = $2, role = $3';
    let params = [name, email, role];
    
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = $4';
      params.push(hashedPassword);
      params.push(id);
    } else {
      params.push(id);
    }
    
    query += ' WHERE id = $4 RETURNING id, name, email, role';
    
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete student
router.delete('/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // First delete their bookings
    await pool.query('DELETE FROM allocations WHERE user_id = $1', [id]);
    // Then delete the user
    const result = await pool.query('DELETE FROM users WHERE id = $1 AND role = $2 RETURNING *', [id, 'student']);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve a booking
router.put('/approve/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE allocations SET approval_status = $1 WHERE id = $2', ['approved', id]);
    res.json({ success: true, message: 'Booking approved!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject a booking
router.put('/reject/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await pool.query('SELECT room_id, user_id FROM allocations WHERE id = $1', [id]);
    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const roomId = booking.rows[0].room_id;
    const userId = booking.rows[0].user_id;
    
    await pool.query('DELETE FROM allocations WHERE id = $1', [id]);
    await pool.query('UPDATE rooms SET current_occupancy = GREATEST(current_occupancy - 1, 0) WHERE id = $1', [roomId]);
    await pool.query('INSERT INTO blocked_rooms (user_id, room_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, roomId]);
    
    res.json({ success: true, message: 'Booking rejected!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke approval
router.put('/revoke-approval/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE allocations SET approval_status = $1 WHERE id = $2', ['pending', id]);
    res.json({ success: true, message: 'Approval revoked!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Delete a specific booking
router.delete('/booking/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await pool.query('SELECT room_id FROM allocations WHERE id = $1', [id]);
    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const roomId = booking.rows[0].room_id;
    
    // Delete the booking
    await pool.query('DELETE FROM allocations WHERE id = $1', [id]);
    
    // Decrease room occupancy if it was active
    await pool.query('UPDATE rooms SET current_occupancy = GREATEST(current_occupancy - 1, 0) WHERE id = $1', [roomId]);
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear ALL bookings from database
router.delete('/clear-all-bookings', async (req, res) => {
  try {
    // Delete all bookings
    await pool.query('DELETE FROM allocations');
    
    // Reset all room occupancy to 0
    await pool.query('UPDATE rooms SET current_occupancy = 0, is_available = true');
    
    // Clear all blocked rooms
    await pool.query('DELETE FROM blocked_rooms');
    
    res.json({ message: 'All bookings cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
