const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'smhcss_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true
};

console.log('Database Enhancements - Connecting to MySQL...');

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database enhancement queries
const enhancementQueries = [
  // 1. Create APPOINTMENT_HISTORY table for tracking status changes
  `CREATE TABLE IF NOT EXISTS APPOINTMENT_HISTORY (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_appointment_id (appointment_id)
  );`,

  // 2. Create COUNSELOR_STATS table for maintaining counselor statistics
  `CREATE TABLE IF NOT EXISTS COUNSELOR_STATS (
    counselor_id INT PRIMARY KEY,
    total_appointments INT DEFAULT 0,
    completed_sessions INT DEFAULT 0,
    cancelled_appointments INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (counselor_id) REFERENCES COUNSELOR(counselor_id) ON DELETE CASCADE
  );`,

  // 3. Create STUDENT_ACTIVITY table for tracking student engagement
  `CREATE TABLE IF NOT EXISTS STUDENT_ACTIVITY (
    student_id INT PRIMARY KEY,
    total_appointments INT DEFAULT 0,
    completed_sessions INT DEFAULT 0,
    cancelled_appointments INT DEFAULT 0,
    last_appointment_date DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE
  );`
];

// Drop existing triggers and procedures if they exist
const dropQueries = [
  `DROP TRIGGER IF EXISTS after_appointment_insert;`,
  `DROP TRIGGER IF EXISTS after_appointment_update;`,
  `DROP TRIGGER IF EXISTS after_feedback_insert;`,
  `DROP TRIGGER IF EXISTS before_appointment_update;`,
  `DROP TRIGGER IF EXISTS after_session_insert;`,
  `DROP PROCEDURE IF EXISTS GetCounselorPerformance;`,
  `DROP PROCEDURE IF EXISTS GetStudentHistory;`,
  `DROP PROCEDURE IF EXISTS BookAppointmentWithValidation;`,
  `DROP PROCEDURE IF EXISTS CompleteAppointmentWithSession;`,
  `DROP FUNCTION IF EXISTS CalculateCounselorRating;`,
  `DROP FUNCTION IF EXISTS GetStudentSessionCount;`,
  `DROP FUNCTION IF EXISTS IsAppointmentSlotAvailable;`,
  `DROP FUNCTION IF EXISTS GetCounselorAvailableSlots;`
];

// Stored Procedures
const procedureQueries = [
  // Procedure 1: Get Counselor Performance Statistics
  `CREATE PROCEDURE GetCounselorPerformance(IN counselor_id_param INT)
  BEGIN
    SELECT 
      c.counselor_id,
      c.name,
      c.email,
      s.name as specialization,
      COALESCE(cs.total_appointments, 0) as total_appointments,
      COALESCE(cs.completed_sessions, 0) as completed_sessions,
      COALESCE(cs.cancelled_appointments, 0) as cancelled_appointments,
      COALESCE(cs.average_rating, 0.00) as average_rating,
      COALESCE(cs.total_ratings, 0) as total_ratings,
      c.available
    FROM COUNSELOR c
    LEFT JOIN SPECIALIZATION s ON c.specialization_id = s.specialization_id
    LEFT JOIN COUNSELOR_STATS cs ON c.counselor_id = cs.counselor_id
    WHERE c.counselor_id = counselor_id_param;
  END;`,

  // Procedure 2: Get Student Appointment History with Details
  `CREATE PROCEDURE GetStudentHistory(IN student_id_param INT)
  BEGIN
    SELECT 
      a.appointment_id,
      a.appointment_date,
      a.appointment_time,
      a.mode,
      a.status,
      c.name as counselor_name,
      s.name as specialization,
      ses.notes,
      ses.follow_up_required,
      f.rating,
      f.comments as feedback
    FROM APPOINTMENT a
    LEFT JOIN COUNSELOR c ON a.counselor_id = c.counselor_id
    LEFT JOIN SPECIALIZATION s ON c.specialization_id = s.specialization_id
    LEFT JOIN SESSION ses ON a.appointment_id = ses.appointment_id
    LEFT JOIN FEEDBACK f ON a.appointment_id = f.appointment_id AND f.student_id = student_id_param
    WHERE a.student_id = student_id_param
    ORDER BY a.appointment_date DESC, a.appointment_time DESC;
  END;`,

  // Procedure 3: Book Appointment with Validation
  `CREATE PROCEDURE BookAppointmentWithValidation(
    IN p_student_id INT,
    IN p_counselor_id INT,
    IN p_date DATE,
    IN p_time TIME,
    IN p_mode VARCHAR(20),
    OUT p_result VARCHAR(100)
  )
  BEGIN
    DECLARE slot_available INT;
    DECLARE counselor_available BOOLEAN;
    
    -- Check if counselor is available
    SELECT available INTO counselor_available
    FROM COUNSELOR
    WHERE counselor_id = p_counselor_id;
    
    IF counselor_available = FALSE THEN
      SET p_result = 'ERROR: Counselor is not available';
    ELSE
      -- Check if slot is already booked
      SELECT COUNT(*) INTO slot_available
      FROM APPOINTMENT
      WHERE counselor_id = p_counselor_id
        AND appointment_date = p_date
        AND appointment_time = p_time
        AND status NOT IN ('Cancelled', 'Rejected');
      
      IF slot_available > 0 THEN
        SET p_result = 'ERROR: Time slot already booked';
      ELSE
        -- Insert appointment
        INSERT INTO APPOINTMENT (student_id, counselor_id, appointment_date, appointment_time, mode, status)
        VALUES (p_student_id, p_counselor_id, p_date, p_time, p_mode, 'Pending');
        
        SET p_result = CONCAT('SUCCESS: Appointment booked with ID ', LAST_INSERT_ID());
      END IF;
    END IF;
  END;`,

  // Procedure 4: Complete Appointment and Create Session
  `CREATE PROCEDURE CompleteAppointmentWithSession(
    IN p_appointment_id INT,
    IN p_start_time TIMESTAMP,
    IN p_end_time TIMESTAMP,
    IN p_notes TEXT,
    IN p_follow_up BOOLEAN,
    OUT p_result VARCHAR(100)
  )
  BEGIN
    DECLARE v_student_id INT;
    DECLARE v_counselor_id INT;
    DECLARE v_status VARCHAR(20);
    
    -- Get appointment details
    SELECT student_id, counselor_id, status 
    INTO v_student_id, v_counselor_id, v_status
    FROM APPOINTMENT
    WHERE appointment_id = p_appointment_id;
    
    IF v_status != 'Confirmed' THEN
      SET p_result = 'ERROR: Only confirmed appointments can be completed';
    ELSE
      -- Update appointment status
      UPDATE APPOINTMENT 
      SET status = 'Completed', updated_at = NOW()
      WHERE appointment_id = p_appointment_id;
      
      -- Create session record
      INSERT INTO SESSION (start_time, end_time, notes, follow_up_required, 
                          appointment_id, counselor_id, student_id)
      VALUES (p_start_time, p_end_time, p_notes, p_follow_up, 
              p_appointment_id, v_counselor_id, v_student_id);
      
      SET p_result = CONCAT('SUCCESS: Appointment completed, Session ID ', LAST_INSERT_ID());
    END IF;
  END;`
];

// Functions
const functionQueries = [
  // Function 1: Calculate Average Rating for Counselor
  `CREATE FUNCTION CalculateCounselorRating(counselor_id_param INT)
  RETURNS DECIMAL(3,2)
  DETERMINISTIC
  READS SQL DATA
  BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    
    SELECT COALESCE(AVG(rating), 0.00)
    INTO avg_rating
    FROM FEEDBACK
    WHERE counselor_id = counselor_id_param;
    
    RETURN avg_rating;
  END;`,

  // Function 2: Get Total Session Count for Student
  `CREATE FUNCTION GetStudentSessionCount(student_id_param INT)
  RETURNS INT
  DETERMINISTIC
  READS SQL DATA
  BEGIN
    DECLARE session_count INT;
    
    SELECT COUNT(*)
    INTO session_count
    FROM SESSION
    WHERE student_id = student_id_param;
    
    RETURN session_count;
  END;`,

  // Function 3: Check if Appointment Slot is Available
  `CREATE FUNCTION IsAppointmentSlotAvailable(
    counselor_id_param INT,
    appt_date DATE,
    appt_time TIME
  )
  RETURNS BOOLEAN
  DETERMINISTIC
  READS SQL DATA
  BEGIN
    DECLARE slot_count INT;
    
    SELECT COUNT(*)
    INTO slot_count
    FROM APPOINTMENT
    WHERE counselor_id = counselor_id_param
      AND appointment_date = appt_date
      AND appointment_time = appt_time
      AND status NOT IN ('Cancelled', 'Rejected');
    
    RETURN (slot_count = 0);
  END;`,

  // Function 4: Get Available Slots Count for Counselor on a Date
  `CREATE FUNCTION GetCounselorAvailableSlots(
    counselor_id_param INT,
    check_date DATE
  )
  RETURNS INT
  DETERMINISTIC
  READS SQL DATA
  BEGIN
    DECLARE booked_count INT;
    DECLARE total_slots INT;
    
    -- Assuming 8 slots per day (9 AM to 5 PM)
    SET total_slots = 8;
    
    SELECT COUNT(*)
    INTO booked_count
    FROM APPOINTMENT
    WHERE counselor_id = counselor_id_param
      AND appointment_date = check_date
      AND status NOT IN ('Cancelled', 'Rejected');
    
    RETURN (total_slots - booked_count);
  END;`
];

// Triggers
const triggerQueries = [
  // Trigger 1: Log Appointment Status Changes
  `CREATE TRIGGER after_appointment_update
  AFTER UPDATE ON APPOINTMENT
  FOR EACH ROW
  BEGIN
    IF OLD.status != NEW.status THEN
      INSERT INTO APPOINTMENT_HISTORY (appointment_id, old_status, new_status, changed_at)
      VALUES (NEW.appointment_id, OLD.status, NEW.status, NOW());
    END IF;
  END;`,

  // Trigger 2: Update Counselor Stats on New Appointment
  `CREATE TRIGGER after_appointment_insert
  AFTER INSERT ON APPOINTMENT
  FOR EACH ROW
  BEGIN
    INSERT INTO COUNSELOR_STATS (counselor_id, total_appointments)
    VALUES (NEW.counselor_id, 1)
    ON DUPLICATE KEY UPDATE 
      total_appointments = total_appointments + 1,
      last_updated = NOW();
    
    INSERT INTO STUDENT_ACTIVITY (student_id, total_appointments)
    VALUES (NEW.student_id, 1)
    ON DUPLICATE KEY UPDATE 
      total_appointments = total_appointments + 1,
      last_updated = NOW();
  END;`,

  // Trigger 3: Update Stats When Appointment Status Changes
  `CREATE TRIGGER before_appointment_update
  BEFORE UPDATE ON APPOINTMENT
  FOR EACH ROW
  BEGIN
    IF OLD.status != NEW.status THEN
      -- Update counselor stats
      IF NEW.status = 'Completed' THEN
        UPDATE COUNSELOR_STATS
        SET completed_sessions = completed_sessions + 1,
            last_updated = NOW()
        WHERE counselor_id = NEW.counselor_id;
        
        UPDATE STUDENT_ACTIVITY
        SET completed_sessions = completed_sessions + 1,
            last_appointment_date = NEW.appointment_date,
            last_updated = NOW()
        WHERE student_id = NEW.student_id;
      ELSEIF NEW.status = 'Cancelled' THEN
        UPDATE COUNSELOR_STATS
        SET cancelled_appointments = cancelled_appointments + 1,
            last_updated = NOW()
        WHERE counselor_id = NEW.counselor_id;
        
        UPDATE STUDENT_ACTIVITY
        SET cancelled_appointments = cancelled_appointments + 1,
            last_updated = NOW()
        WHERE student_id = NEW.student_id;
      END IF;
    END IF;
  END;`,

  // Trigger 4: Update Student Stats on Session Creation
  `CREATE TRIGGER after_session_insert
  AFTER INSERT ON SESSION
  FOR EACH ROW
  BEGIN
    UPDATE STUDENT
    SET total_sessions = total_sessions + 1,
        last_session_date = NOW(),
        updated_at = NOW()
    WHERE student_id = NEW.student_id;
  END;`,

  // Trigger 5: Update Counselor Rating on Feedback
  `CREATE TRIGGER after_feedback_insert
  AFTER INSERT ON FEEDBACK
  FOR EACH ROW
  BEGIN
    DECLARE new_avg_rating DECIMAL(3,2);
    DECLARE rating_count INT;
    
    SELECT AVG(rating), COUNT(*)
    INTO new_avg_rating, rating_count
    FROM FEEDBACK
    WHERE counselor_id = NEW.counselor_id;
    
    UPDATE COUNSELOR_STATS
    SET average_rating = new_avg_rating,
        total_ratings = rating_count,
        last_updated = NOW()
    WHERE counselor_id = NEW.counselor_id;
  END;`
];

// Function to initialize database enhancements
async function initializeEnhancements() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server');

    // Select the database
    await connection.query('USE smhcss_db');
    console.log('Using smhcss_db database');

    // Create enhancement tables
    console.log('\n=== Creating Enhancement Tables ===');
    for (const query of enhancementQueries) {
      await connection.query(query);
      console.log('✓ Created enhancement table');
    }

    // Drop existing triggers and procedures
    console.log('\n=== Dropping Existing Database Objects ===');
    for (const query of dropQueries) {
      await connection.query(query);
      console.log('✓ Dropped existing object');
    }

    // Create stored procedures
    console.log('\n=== Creating Stored Procedures ===');
    for (const query of procedureQueries) {
      await connection.query(query);
      console.log('✓ Created stored procedure');
    }

    // Create functions
    console.log('\n=== Creating Functions ===');
    for (const query of functionQueries) {
      await connection.query(query);
      console.log('✓ Created function');
    }

    // Create triggers
    console.log('\n=== Creating Triggers ===');
    for (const query of triggerQueries) {
      await connection.query(query);
      console.log('✓ Created trigger');
    }

    // Initialize stats for existing counselors and students
    console.log('\n=== Initializing Statistics ===');
    
    // Initialize counselor stats
    await connection.query(`
      INSERT IGNORE INTO COUNSELOR_STATS (counselor_id)
      SELECT counselor_id FROM COUNSELOR;
    `);
    console.log('✓ Initialized counselor statistics');

    // Initialize student activity
    await connection.query(`
      INSERT IGNORE INTO STUDENT_ACTIVITY (student_id)
      SELECT student_id FROM STUDENT;
    `);
    console.log('✓ Initialized student activity tracking');

    // Update existing stats based on current data
    await connection.query(`
      UPDATE COUNSELOR_STATS cs
      SET total_appointments = (
        SELECT COUNT(*) FROM APPOINTMENT 
        WHERE counselor_id = cs.counselor_id
      ),
      completed_sessions = (
        SELECT COUNT(*) FROM APPOINTMENT 
        WHERE counselor_id = cs.counselor_id AND status = 'Completed'
      ),
      cancelled_appointments = (
        SELECT COUNT(*) FROM APPOINTMENT 
        WHERE counselor_id = cs.counselor_id AND status = 'Cancelled'
      );
    `);
    console.log('✓ Updated counselor statistics from existing data');

    await connection.query(`
      UPDATE STUDENT_ACTIVITY sa
      SET total_appointments = (
        SELECT COUNT(*) FROM APPOINTMENT 
        WHERE student_id = sa.student_id
      ),
      completed_sessions = (
        SELECT COUNT(*) FROM APPOINTMENT 
        WHERE student_id = sa.student_id AND status = 'Completed'
      ),
      cancelled_appointments = (
        SELECT COUNT(*) FROM APPOINTMENT 
        WHERE student_id = sa.student_id AND status = 'Cancelled'
      ),
      last_appointment_date = (
        SELECT MAX(appointment_date) FROM APPOINTMENT 
        WHERE student_id = sa.student_id
      );
    `);
    console.log('✓ Updated student activity from existing data');

    console.log('\n✅ Database enhancements completed successfully!');
    console.log('\n=== Summary ===');
    console.log('✓ 3 Enhancement Tables Created');
    console.log('✓ 4 Stored Procedures Created');
    console.log('✓ 4 Functions Created');
    console.log('✓ 5 Triggers Created');
    console.log('\n=== Available Database Objects ===');
    console.log('\nStored Procedures:');
    console.log('  - GetCounselorPerformance(counselor_id)');
    console.log('  - GetStudentHistory(student_id)');
    console.log('  - BookAppointmentWithValidation(student_id, counselor_id, date, time, mode, @result)');
    console.log('  - CompleteAppointmentWithSession(appointment_id, start_time, end_time, notes, follow_up, @result)');
    console.log('\nFunctions:');
    console.log('  - CalculateCounselorRating(counselor_id) -> DECIMAL');
    console.log('  - GetStudentSessionCount(student_id) -> INT');
    console.log('  - IsAppointmentSlotAvailable(counselor_id, date, time) -> BOOLEAN');
    console.log('  - GetCounselorAvailableSlots(counselor_id, date) -> INT');
    console.log('\nTriggers:');
    console.log('  - after_appointment_insert: Track new appointments');
    console.log('  - after_appointment_update: Log status changes');
    console.log('  - before_appointment_update: Update statistics');
    console.log('  - after_session_insert: Update student session count');
    console.log('  - after_feedback_insert: Update counselor ratings');
    
  } catch (error) {
    console.error('\n❌ Error initializing database enhancements:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

module.exports = {
  initializeEnhancements,
  pool
};

// If this file is run directly, initialize the enhancements
if (require.main === module) {
  initializeEnhancements()
    .then(() => {
      console.log('\n🎉 All database enhancements applied successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to apply database enhancements:', error);
      process.exit(1);
    });
}
