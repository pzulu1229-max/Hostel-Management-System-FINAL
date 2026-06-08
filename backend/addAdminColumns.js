const pool = require('./db');

async function addColumns() {
  try {
    // Add status column for bookings (pending, approved, rejected)
    await pool.query(`
      ALTER TABLE allocations 
      ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'
    `);
    console.log('✅ Added approval_status column');
    
    // Add admin notes
    await pool.query(`
      ALTER TABLE allocations 
      ADD COLUMN IF NOT EXISTS admin_notes TEXT
    `);
    console.log('✅ Added admin_notes column');
    
    // Update existing active bookings to approved
    await pool.query(`
      UPDATE allocations 
      SET approval_status = 'approved' 
      WHERE status = 'active' AND approval_status IS NULL
    `);
    console.log('✅ Updated existing bookings');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

addColumns();
