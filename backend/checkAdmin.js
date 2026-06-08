const pool = require('./db');

async function checkAdmin() {
  const result = await pool.query('SELECT email, role FROM users WHERE email = $1', ['admin@hostel.com']);
  console.log('Admin user:', result.rows[0]);
  process.exit(0);
}

checkAdmin();
