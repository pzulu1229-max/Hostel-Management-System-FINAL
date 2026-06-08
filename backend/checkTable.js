const pool = require('./db');

async function check() {
  try {
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS allocations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        booking_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(20) DEFAULT 'active'
      )
    `);
    console.log('✅ Allocations table ready');
    
    // Check rooms
    const rooms = await pool.query('SELECT COUNT(*) FROM rooms');
    console.log(`📊 Total rooms: ${rooms.rows[0].count}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
