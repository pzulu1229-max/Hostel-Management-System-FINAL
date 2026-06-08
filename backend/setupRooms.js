const pool = require('./db');

async function setup() {
  try {
    console.log('Setting up rooms...');
    
    // Add columns if needed
    await pool.query('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true');
    
    // Clear existing
    await pool.query('DELETE FROM allocations');
    await pool.query('DELETE FROM rooms');
    
    // Insert 20 rooms (4 persons, K500)
    const rooms = [
      'A101', 'A102', 'A103', 'A104', 'A105',
      'B201', 'B202', 'B203', 'B204', 'B205',
      'C301', 'C302', 'C303', 'C304', 'C305',
      'D401', 'D402', 'D403', 'D404', 'D405'
    ];
    
    for (let room of rooms) {
      await pool.query(
        'INSERT INTO rooms (room_number, capacity, price, is_available) VALUES ($1, 4, 500, true)',
        [room]
      );
      console.log(`Added ${room}`);
    }
    
    const count = await pool.query('SELECT COUNT(*) FROM rooms');
    console.log(`\nTotal rooms: ${count.rows[0].count} (all 4-person at K500)`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

setup();
