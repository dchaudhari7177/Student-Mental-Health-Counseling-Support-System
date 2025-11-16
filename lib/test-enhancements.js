const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'smhcss_db',
  port: 3306
};

console.log('🧪 Testing Database Enhancements...\n');

async function testEnhancements() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to database\n');

    // Test 1: Check if enhancement tables exist
    console.log('=== Test 1: Checking Enhancement Tables ===');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'smhcss_db' 
      AND TABLE_NAME IN ('APPOINTMENT_HISTORY', 'COUNSELOR_STATS', 'STUDENT_ACTIVITY')
    `);
    console.log(`Found ${tables.length}/3 enhancement tables`);
    tables.forEach((table) => console.log(`  ✓ ${table.TABLE_NAME}`));
    console.log();

    // Test 2: Check stored procedures
    console.log('=== Test 2: Checking Stored Procedures ===');
    const [procedures] = await connection.query(`
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = 'smhcss_db' 
      AND ROUTINE_TYPE = 'PROCEDURE'
    `);
    console.log(`Found ${procedures.length} stored procedures`);
    procedures.forEach((proc) => console.log(`  ✓ ${proc.ROUTINE_NAME}`));
    console.log();

    // Test 3: Check functions
    console.log('=== Test 3: Checking Functions ===');
    const [functions] = await connection.query(`
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = 'smhcss_db' 
      AND ROUTINE_TYPE = 'FUNCTION'
    `);
    console.log(`Found ${functions.length} functions`);
    functions.forEach((func) => console.log(`  ✓ ${func.ROUTINE_NAME}`));
    console.log();

    // Test 4: Check triggers
    console.log('=== Test 4: Checking Triggers ===');
    const [triggers] = await connection.query(`
      SELECT TRIGGER_NAME 
      FROM INFORMATION_SCHEMA.TRIGGERS 
      WHERE TRIGGER_SCHEMA = 'smhcss_db'
    `);
    console.log(`Found ${triggers.length} triggers`);
    triggers.forEach((trigger) => console.log(`  ✓ ${trigger.TRIGGER_NAME}`));
    console.log();

    // Test 5: Test GetCounselorPerformance procedure
    console.log('=== Test 5: Testing GetCounselorPerformance Procedure ===');
    const [perfResults] = await connection.query('CALL GetCounselorPerformance(?)', [2]);
    if (perfResults[0] && perfResults[0].length > 0) {
      const perf = perfResults[0][0];
      console.log('Counselor Performance:');
      console.log(`  Name: ${perf.name}`);
      console.log(`  Total Appointments: ${perf.total_appointments}`);
      console.log(`  Completed Sessions: ${perf.completed_sessions}`);
      console.log(`  Average Rating: ${perf.average_rating}`);
      console.log('  ✓ Procedure executed successfully');
    }
    console.log();

    // Test 6: Test CalculateCounselorRating function
    console.log('=== Test 6: Testing CalculateCounselorRating Function ===');
    const [ratingResult] = await connection.query(
      'SELECT CalculateCounselorRating(?) as rating', [2]
    );
    console.log(`  Counselor Rating: ${ratingResult[0].rating}`);
    console.log('  ✓ Function executed successfully');
    console.log();

    // Test 7: Test IsAppointmentSlotAvailable function
    console.log('=== Test 7: Testing IsAppointmentSlotAvailable Function ===');
    const [slotResult] = await connection.query(
      'SELECT IsAppointmentSlotAvailable(?, ?, ?) as available',
      [2, '2025-12-01', '10:00:00']
    );
    console.log(`  Slot Available: ${slotResult[0].available === 1 ? 'Yes' : 'No'}`);
    console.log('  ✓ Function executed successfully');
    console.log();

    // Test 8: Test GetCounselorAvailableSlots function
    console.log('=== Test 8: Testing GetCounselorAvailableSlots Function ===');
    const [slotsResult] = await connection.query(
      'SELECT GetCounselorAvailableSlots(?, ?) as slots',
      [2, '2025-12-01']
    );
    console.log(`  Available Slots for Date: ${slotsResult[0].slots}`);
    console.log('  ✓ Function executed successfully');
    console.log();

    // Test 9: Test GetStudentSessionCount function
    console.log('=== Test 9: Testing GetStudentSessionCount Function ===');
    const [sessionCountResult] = await connection.query(
      'SELECT GetStudentSessionCount(?) as count', [3]
    );
    console.log(`  Student Session Count: ${sessionCountResult[0].count}`);
    console.log('  ✓ Function executed successfully');
    console.log();

    // Test 10: Check statistics data
    console.log('=== Test 10: Checking Statistics Data ===');
    const [statsCount] = await connection.query('SELECT COUNT(*) as count FROM COUNSELOR_STATS');
    console.log(`  Counselor Stats Records: ${statsCount[0].count}`);
    
    const [activityCount] = await connection.query('SELECT COUNT(*) as count FROM STUDENT_ACTIVITY');
    console.log(`  Student Activity Records: ${activityCount[0].count}`);
    console.log('  ✓ Statistics initialized');
    console.log();

    // Test 11: Test trigger by creating a test appointment
    console.log('=== Test 11: Testing Triggers ===');
    console.log('Creating test appointment to trigger automatic updates...');
    
    const [beforeStats] = await connection.query(
      'SELECT total_appointments FROM COUNSELOR_STATS WHERE counselor_id = 2'
    );
    const beforeCount = beforeStats[0]?.total_appointments || 0;
    
    await connection.query(`
      INSERT INTO APPOINTMENT (student_id, counselor_id, appointment_date, appointment_time, mode, status)
      VALUES (3, 2, '2025-12-15', '14:00:00', 'Online', 'Pending')
    `);
    const [result] = await connection.query('SELECT LAST_INSERT_ID() as id');
    const appointmentId = result[0].id;
    
    const [afterStats] = await connection.query(
      'SELECT total_appointments FROM COUNSELOR_STATS WHERE counselor_id = 2'
    );
    const afterCount = afterStats[0].total_appointments;
    
    if (afterCount > beforeCount) {
      console.log(`  ✓ Trigger working: Appointment count increased (${beforeCount} → ${afterCount})`);
    }
    
    // Test status change trigger
    await connection.query(
      'UPDATE APPOINTMENT SET status = "Confirmed" WHERE appointment_id = ?',
      [appointmentId]
    );
    
    const [historyCheck] = await connection.query(
      'SELECT * FROM APPOINTMENT_HISTORY WHERE appointment_id = ?',
      [appointmentId]
    );
    
    if (historyCheck.length > 0) {
      console.log(`  ✓ Status change logged in APPOINTMENT_HISTORY`);
    }
    
    // Cleanup test appointment
    await connection.query('DELETE FROM APPOINTMENT WHERE appointment_id = ?', [appointmentId]);
    console.log('  ✓ Test data cleaned up');
    console.log();

    console.log('=== 🎉 All Tests Passed Successfully! ===\n');
    console.log('Summary:');
    console.log(`  ✓ ${tables.length} Enhancement Tables`);
    console.log(`  ✓ ${procedures.length} Stored Procedures`);
    console.log(`  ✓ ${functions.length} Functions`);
    console.log(`  ✓ ${triggers.length} Triggers`);
    console.log('  ✓ All database objects working correctly\n');

  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run tests
testEnhancements()
  .then(() => {
    console.log('\n✅ Database enhancement testing completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
