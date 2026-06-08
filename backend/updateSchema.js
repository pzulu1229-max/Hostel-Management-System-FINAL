const pool = require('./db');

async function updateSchema() {
  try {
    console.log('🔧 Updating database schema...');
    
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
    
    // Drop existing constraint if it exists
    await pool.query(`
      ALTER TABLE allocations 
      DROP CONSTRAINT IF EXISTS unique_user_active_booking
    `);
    
    // Create a partial unique index (works in PostgreSQL)
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_user_active_booking 
      ON allocations (user_id) 
      WHERE status = 'active'
    `);
    console.log('✅ Added constraint: users can only book one room at a time');
    
    // Reset any existing active bookings (keep only the first one per user)
    await pool.query(`
      DELETE FROM allocations 
      WHERE id IN (
        SELECT id FROM allocations 
        WHERE status = 'active' 
        AND id NOT IN (
          SELECT MIN(id) FROM allocations 
          WHERE status = 'active' 
          GROUP BY user_id
        )
      )
    `);
    console.log('✅ Cleaned up duplicate bookings');
    
    console.log('\n📊 Schema update complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateSchema();
