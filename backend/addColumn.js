const pool = require('./db');

async function addColumn() {
  try {
    await pool.query('ALTER TABLE allocations ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT $1', ['pending']);
    console.log('✅ Added approval_status column');
  } catch (err) {
    console.log('Column may already exist:', err.message);
  }
  process.exit(0);
}

addColumn();
