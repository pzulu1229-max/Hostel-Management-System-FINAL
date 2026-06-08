const pool = require('./db');

async function createAllocations() {
  try {
    console.log('🔧 Creating allocations table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS allocations (
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
    
    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_allocations_user_id ON allocations(user_id);
      CREATE INDEX IF NOT EXISTS idx_allocations_room_id ON allocations(room_id);
    `);
    
    console.log('✅ Indexes created');
    console.log('\n✅ Bookings system ready!');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAllocations();
