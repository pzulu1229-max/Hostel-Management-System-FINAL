const pool = require('../db');

// Get all rooms
const getRooms = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single room by ID
const getRoomById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new room
const createRoom = async (req, res) => {
  const { room_number, capacity, price, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO rooms (room_number, capacity, price, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [room_number, capacity, price, status || 'available']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update room
const updateRoom = async (req, res) => {
  const { id } = req.params;
  const { room_number, capacity, current_occupancy, status, price } = req.body;
  try {
    const result = await pool.query(
      'UPDATE rooms SET room_number = $1, capacity = $2, current_occupancy = $3, status = $4, price = $5 WHERE id = $6 RETURNING *',
      [room_number, capacity, current_occupancy, status, price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete room
const deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getRooms, getRoomById, createRoom, updateRoom, deleteRoom };
