const pool = require('./db');

async function updateRooms() {
  try {
    console.log('🔧 Updating rooms to K500 for 4-person rooms...');
    
    // First, add columns if they don't exist
    await pool.query('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true');
    await pool.query('ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT');
    
    // Clear existing rooms
    await pool.query('DELETE FROM rooms');
    console.log('✅ Cleared existing rooms');
    
    // Insert 20 rooms - All 4-person rooms at K500
    const rooms = [
      // 4-person rooms (K500 each)
      ['A101', 4, 500.00, 'available', true, 'Spacious 4-bed room with attached bathroom'],
      ['A102', 4, 500.00, 'available', true, 'Spacious 4-bed room with attached bathroom'],
      ['A103', 4, 500.00, 'available', true, '4-bed room with balcony and study area'],
      ['A104', 4, 500.00, 'available', true, '4-bed room with balcony and study area'],
      ['A105', 4, 500.00, 'available', true, 'Standard 4-bed shared room'],
      ['B201', 4, 500.00, 'available', true, 'Deluxe 4-bed room with AC and TV'],
      ['B202', 4, 500.00, 'available', true, 'Deluxe 4-bed room with AC and TV'],
      ['B203', 4, 500.00, 'available', true, 'Premium 4-bed room with extra space'],
      ['B204', 4, 500.00, 'available', true, 'Premium 4-bed room with extra space'],
      ['B205', 4, 500.00, 'available', true, 'Standard 4-bed shared room'],
      ['C301', 4, 500.00, 'available', true, 'Economy 4-bed shared room'],
      ['C302', 4, 500.00, 'available', true, 'Economy 4-bed shared room'],
      ['C303', 4, 500.00, 'available', true, '4-bed room with AC and study table'],
      ['C304', 4, 500.00, 'available', true, '4-bed room with AC and study table'],
      ['C305', 4, 500.00, 'available', true, 'Standard 4-bed shared room'],
      ['D401', 4, 500.00, 'available', true, '4-bed room with modern furniture'],
      ['D402', 4, 500.00, 'available', true, '4-bed room with modern furniture'],
      ['D403', 4, 500.00, 'available', true, 'Premium 4-bed room with balcony'],
      ['D404', 4, 500.00, 'available', true, 'Premium 4-bed room with balcony'],
      ['D405', 4, 500.00, 'available', true, 'Standard 4-bed shared room']
    ];
    
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
    const available = await pool.query('SELECT COUNT(*) FROM rooms WHERE is_available = true');
    const roomTypes = await pool.query('SELECT capacity, COUNT(*) FROM rooms GROUP BY capacity');
    
    console.log(`\n📊 Room Statistics:`);
    console.log(`   Total rooms: ${count.rows[0].count}`);
    console.log(`   🟢 Available: ${available.rows[0].count}`);
    console.log(`\n📋 Room breakdown:`);
    roomTypes.rows.forEach(row => {
      console.log(`   ${row.capacity}-person rooms: ${row.count}`);
    });
    
    console.log('\n✅ Update complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

updateRooms();
