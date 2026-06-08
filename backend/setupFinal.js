const pool = require('./db');

async function setup() {
  try {
    console.log('🔧 Setting up database...');
    
    // Create allocations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS allocations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        booking_date DATE DEFAULT CURRENT_DATE,
        check_in DATE,
        check_out DATE,
        status VARCHAR(20) DEFAULT 'active'
      )
    `);
    console.log('✅ Allocations table ready');
    
    // Add columns if needed
    await pool.query('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true');
    await pool.query('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT');
    
    // Clear and recreate rooms
    await pool.query('DELETE FROM allocations');
    await pool.query('DELETE FROM rooms');
    
    // Insert 20 rooms - 4 persons, K500
    const rooms = [
      'A101', 'A102', 'A103', 'A104', 'A105',
      'B201', 'B202', 'B203', 'B204', 'B205',
      'C301', 'C302', 'C303', 'C304', 'C305',
      'D401', 'D402', 'D403', 'D404', 'D405'
    ];
    
    for (let room of rooms) {
      await pool.query(
        `INSERT INTO rooms (room_number, capacity, price, status, is_available, description) 
         VALUES ($1, 4, 500, 'available', true, 'Modern 4-bed room with comfortable beds and study area')`,
        [room]
      );
      console.log(`  ✅ Added ${room}`);
    }
    
    const count = await pool.query('SELECT COUNT(*) FROM rooms');
    console.log(`\n📊 Total rooms: ${count.rows[0].count} (all 4-person at K500)`);
    console.log('\n✅ Setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setup();
