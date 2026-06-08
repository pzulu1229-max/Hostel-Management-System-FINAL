const pool = require('./db');

async function checkBookings() {
  try {
    // Check if allocations table exists
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'allocations'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('Creating allocations table...');
      await pool.query(`
        CREATE TABLE allocations (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
          booking_date DATE DEFAULT CURRENT_DATE,
          check_in DATE,
          check_out DATE,
          status VARCHAR(20) DEFAULT 'active'
        )
      `);
      console.log('✅ Allocations table created');
    } else {
      console.log('✅ Allocations table exists');
    }
    
    // Check for any existing bookings
    const bookings = await pool.query('SELECT COUNT(*) FROM allocations');
    console.log(`📋 Current bookings: ${bookings.rows[0].count}`);
    
    // Show rooms
    const rooms = await pool.query('SELECT room_number, capacity, price, is_available FROM rooms ORDER BY room_number');
    console.log('\n🏠 Rooms in database:');
    rooms.rows.forEach(room => {
      console.log(`   ${room.room_number} - ${room.capacity} persons - K${room.price} - ${room.is_available ? 'Available' : 'Occupied'}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkBookings();
