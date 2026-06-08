const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@hostel.com',
      password: 'admin123'
    });
    console.log('✅ Login successful!');
    console.log('User:', response.data.user);
  } catch (err) {
    console.log('❌ Login failed:', err.response?.data?.error || err.message);
  }
  process.exit(0);
}

testLogin();
