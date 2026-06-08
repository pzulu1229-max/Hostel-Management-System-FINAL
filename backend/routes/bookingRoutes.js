const express = require('express');
const router = express.Router();
const pool = require('../db');

console.log('🔥 BOOKING ROUTES LOADED 🔥');

// Create a booking
router.post('/', async (req, res) => {
  const { user_id, room_id } = req.body;
  
  console.log('📚 Booking request:', { user_id, room_id });
  
  try {
    // Check if user is blocked from this room
    const blocked = await pool.query(
      'SELECT * FROM blocked_rooms WHERE user_id = $1 AND room_id = $2',
      [user_id, room_id]
    );
    
    if (blocked.rows.length > 0) {
      return res.status(403).json({ 
        error: '❌ You are blocked from this room. Choose another room.' 
      });
    }
    
    // Check if user already has an active booking
    const existing = await pool.query(
      "SELECT * FROM allocations WHERE user_id = $1 AND status = 'active'",
      [user_id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a pending or approved booking!' });
    }
    
    // Get room details
    const room = await pool.query('SELECT * FROM rooms WHERE id = $1', [room_id]);
    if (room.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const currentOcc = room.rows[0].current_occupancy || 0;
    const capacity = room.rows[0].capacity || 4;
    
    if (currentOcc >= capacity) {
      return res.status(400).json({ error: `Room is full! (${currentOcc}/${capacity})` });
    }
    
    // Create booking
    await pool.query(
      "INSERT INTO allocations (user_id, room_id, status, approval_status, allocated_date) VALUES ($1, $2, 'active', 'pending', CURRENT_DATE)",
      [user_id, room_id]
    );
    
    // Increase occupancy
    await pool.query(
      'UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = $1',
      [room_id]
    );
    
    const updatedRoom = await pool.query(
      'SELECT room_number, current_occupancy, capacity FROM rooms WHERE id = $1',
      [room_id]
    );
    
    console.log(`✅ Booking created - Room ${updatedRoom.rows[0].room_number} now ${updatedRoom.rows[0].current_occupancy}/${updatedRoom.rows[0].capacity}`);
    
    res.json({ 
      success: true, 
      message: 'Booking request sent! Waiting for admin approval.'
    });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get user's active bookings
router.get('/my-bookings/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT b.*, r.room_number, r.price, r.capacity, r.current_occupancy
      FROM allocations b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.user_id = $1 AND b.status = 'active'
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel a booking - PERMANENTLY DELETE it
router.put('/cancel/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get the booking details before deleting
    const booking = await pool.query(
      "SELECT room_id, approval_status FROM allocations WHERE id = $1 AND status = 'active'",
      [id]
    );
    
    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const roomId = booking.rows[0].room_id;
    const wasApproved = booking.rows[0].approval_status === 'approved';
    
    // PERMANENTLY DELETE the booking (not just update status)
    await pool.query("DELETE FROM allocations WHERE id = $1", [id]);
    
    // Decrease occupancy if it was approved or pending
    await pool.query('UPDATE rooms SET current_occupancy = current_occupancy - 1 WHERE id = $1', [roomId]);
    
    const room = await pool.query('SELECT room_number, current_occupancy FROM rooms WHERE id = $1', [roomId]);
    console.log(`Booking cancelled and removed - Room ${room.rows[0].room_number} now ${room.rows[0].current_occupancy}/4`);
    
    res.json({ success: true, message: 'Booking cancelled and removed' });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get all active bookings (not cancelled)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM allocations WHERE status = 'active'");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
