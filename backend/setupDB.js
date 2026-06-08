const pool = require('./db');

async function setup() {
  try {
    // Create allocations table
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
    
    if (rooms.rows[0].count === 0) {
      console.log('Adding 20 rooms...');
      const roomNumbers = [
        'A101', 'A102', 'A103', 'A104', 'A105',
        'B201', 'B202', 'B203', 'B204', 'B205',
        'C301', 'C302', 'C303', 'C304', 'C305',
        'D401', 'D402', 'D403', 'D404', 'D405'
      ];
      
      for (let room of roomNumbers) {
        await pool.query(
          'INSERT INTO rooms (room_number, capacity, price, is_available) VALUES ($1, 4, 500, true)',
          [room]
        );
      }
      console.log('✅ 20 rooms added (4 persons, K500 each)');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

setup();
