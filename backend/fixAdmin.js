const bcrypt = require('bcrypt');
const pool = require('./db');

async function fixPassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, 'admin@hostel.com']);
    console.log('✅ Admin password has been hashed');
    console.log('📧 Email: admin@hostel.com');
    console.log('🔑 Password: admin123');
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

fixPassword();
