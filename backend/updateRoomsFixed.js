const pool = require('./db');

async function updateRooms() {
  try {
    console.log('🔧 Updating rooms to 4-person rooms at K500...');
    
    // Clear existing rooms
    await pool.query('DELETE FROM rooms');
    console.log('✅ Cleared existing rooms');
    
    // Insert 20 rooms - All 4-person rooms at K500
    const rooms = [];
    const prefixes = ['A', 'B', 'C', 'D'];
    let roomCounter = 1;
    
    for (let i = 1; i <= 20; i++) {
      const prefix = prefixes[Math.floor((i-1) / 5)];
      const number = ((i-1) % 5) + 1;
      const roomNumber = `${prefix}${number.toString().padStart(3, '0')}`;
      
      rooms.push([
        roomNumber,
        4, // capacity
        500.00, // price
        'available',
        true,
        `Modern 4-bed room with comfortable beds, study area, and attached bathroom`
      ]);
    }
    
    console.log('📝 Adding rooms...');
    
    for (const room of rooms) {
      await pool.query(`
        INSERT INTO rooms (room_number, capacity, price, status, is_available, description) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, room);
      console.log(`  ✅ ${room[0]} - ${room[2]} K per month (${room[1]} persons)`);
    }
    
    // Show results
    const count = await pool.query('SELECT COUNT(*) FROM rooms');
    const sample = await pool.query('SELECT room_number, capacity, price FROM rooms LIMIT 5');
    
    console.log(`\n📊 Room Statistics:`);
    console.log(`   Total rooms: ${count.rows[0].count}`);
    console.log(`\n📋 Sample rooms:`);
    sample.rows.forEach(row => {
      console.log(`   ${row.room_number} - ${row.capacity} persons - K${row.price}`);
    });
    
    console.log('\n✅ Update complete!');
    console.log('   Restart your backend: Press Ctrl+C then node server.js');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

updateRooms();
