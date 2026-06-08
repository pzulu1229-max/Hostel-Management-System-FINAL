const pool = require('./db');

async function fixSchema() {
  try {
    console.log('🔧 Fixing database schema...');
    
    // Add current_occupancy column to rooms
    await pool.query(`
      ALTER TABLE rooms 
      ADD COLUMN IF NOT EXISTS current_occupancy INTEGER DEFAULT 0
    `);
    console.log('✅ Added current_occupancy column');
    
    // Update existing rooms to have 0 occupancy
    await pool.query(`
      UPDATE rooms SET current_occupancy = 0 WHERE current_occupancy IS NULL
    `);
    
    // First, cancel all active bookings to clean up
    await pool.query(`
      UPDATE allocations SET status = 'cancelled' WHERE status = 'active'
    `);
    console.log('✅ Cleared all active bookings');
    
    // Reset all rooms to available
    await pool.query(`
      UPDATE rooms SET 
        current_occupancy = 0,
        is_available = true
    `);
    console.log('✅ Reset all rooms');
    
    // Drop the index if it exists
    await pool.query(`
      DROP INDEX IF EXISTS unique_user_active_booking
    `);
    
    // Create the partial unique index
    await pool.query(`
      CREATE UNIQUE INDEX unique_user_active_booking 
      ON allocations (user_id) 
      WHERE status = 'active'
    `);
    console.log('✅ Added constraint: users can only book one room at a time');
    
    console.log('\n📊 Schema update complete!');
    console.log('All rooms are now available for booking.');
    
    // Show current room status
    const rooms = await pool.query(`
      SELECT room_number, capacity, current_occupancy, is_available 
      FROM rooms 
      ORDER BY room_number
      LIMIT 5
    `);
    
    console.log('\n📋 Sample rooms:');
    rooms.rows.forEach(room => {
      console.log(`   ${room.room_number}: ${room.current_occupancy}/${room.capacity} - ${room.is_available ? 'Available' : 'Full'}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixSchema();
