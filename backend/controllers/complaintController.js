const pool = require('../db');

// Get all complaints
const getComplaints = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as user_name, u.email 
      FROM complaints c 
      JOIN users u ON c.user_id = u.id 
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single complaint by ID
const getComplaintById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT c.*, u.name as user_name, u.email 
      FROM complaints c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create new complaint
const createComplaint = async (req, res) => {
  const { user_id, description, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO complaints (user_id, description, image_url, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, description, image_url, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update complaint
const updateComplaint = async (req, res) => {
  const { id } = req.params;
  const { description, status, image_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE complaints SET description = $1, status = $2, image_url = $3 WHERE id = $4 RETURNING *',
      [description, status, image_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete complaint
const deleteComplaint = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM complaints WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getComplaints, getComplaintById, createComplaint, updateComplaint, deleteComplaint };
