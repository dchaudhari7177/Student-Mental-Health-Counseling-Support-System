const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'smhcss_user',
  password: process.env.DB_PASSWORD || 'smhcss_password',
  database: process.env.DB_NAME || 'smhcss_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  port: 3306
};

const pool = mysql.createPool(dbConfig);

async function executeQuery(query, params = []) {
  let connection;
  try {
    console.log('Attempting to get database connection...');
    connection = await pool.getConnection();
    console.log('Connected to database successfully');
    console.log('Executing query:', query);
    const [results] = await connection.execute(query, params);
    console.log('Query executed successfully');
    return results;
  } catch (error) {
    console.error('Database error:', {
      message: error.message,
      code: error.code,
      state: error.sqlState,
      stack: error.stack
    });
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('Database connection released');
    }
  }
}

// User authentication functions
async function createUser(userData, role) {
  const { name, email, password, ...otherData } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  let query, params;
  
  switch (role) {
    case 'student':
      // Simple registration first
      const result = await executeQuery(
        `INSERT INTO STUDENT (name, email, password, phone) 
         VALUES (?, ?, ?, ?)`,
        [name, email, hashedPassword, otherData.phone || null]
      );
      
      // Create student profile
      await executeQuery(
        `INSERT INTO STUDENT_PROFILE (student_id, academic_year, semester) 
         VALUES (?, ?, ?)`,
        [result.insertId, otherData.academic_year || 1, otherData.semester || 1]
      );
      
      return result;
      break;
    case 'counselor':
      query = `INSERT INTO COUNSELOR (name, email, password, phone, qualification, license_no, specialization_id, available) 
               VALUES (?, ?, ?, ?, ?, ?, ?, true)`;
      params = [name, email, hashedPassword, otherData.phone || null, otherData.qualification || null,
               otherData.license_no || null, otherData.specialization_id || null];
      break;
    case 'admin':
      query = `INSERT INTO ADMIN (name, email, password) VALUES (?, ?, ?)`;
      params = [name, email, hashedPassword];
      break;
    default:
      throw new Error('Invalid role');
  }
  
  return await executeQuery(query, params);
}

async function findUserByEmail(email, role) {
  let query;
  
  switch (role) {
    case 'student':
      query = 'SELECT * FROM STUDENT WHERE email = ?';
      break;
    case 'counselor':
      query = 'SELECT * FROM COUNSELOR WHERE email = ?';
      break;
    case 'admin':
      query = 'SELECT * FROM ADMIN WHERE email = ?';
      break;
    default:
      throw new Error('Invalid role');
  }
  
  const results = await executeQuery(query, [email]);
  return results[0] || null;
}

async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Counselor functions
async function getAvailableCounselors() {
  const query = `
    SELECT c.counselor_id, c.name, c.email, c.phone, c.qualification, s.name as specialization 
    FROM COUNSELOR c
    LEFT JOIN SPECIALIZATION s ON c.specialization_id = s.specialization_id
    WHERE c.available = true
    ORDER BY c.name ASC`;
  
  return await executeQuery(query);
}

// Appointment functions
async function createAppointment(appointmentData) {
  const query = `INSERT INTO APPOINTMENT (appointment_date, appointment_time, mode, student_id, counselor_id) 
                 VALUES (?, ?, ?, ?, ?)`;
  const params = [appointmentData.date, appointmentData.time, appointmentData.mode, 
                 appointmentData.student_id, appointmentData.counselor_id];
  return await executeQuery(query, params);
}

async function getAppointmentsByUser(userId, role) {
  let query;
  
  if (role === 'student') {
    query = `SELECT a.*, c.name as counselor_name, s.name as specialization 
             FROM APPOINTMENT a 
             JOIN COUNSELOR c ON a.counselor_id = c.counselor_id 
             LEFT JOIN SPECIALIZATION s ON c.specialization_id = s.specialization_id 
             WHERE a.student_id = ? 
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
  } else if (role === 'counselor') {
    query = `SELECT a.*, st.name as student_name, st.email as student_email 
             FROM APPOINTMENT a 
             JOIN STUDENT st ON a.student_id = st.student_id 
             WHERE a.counselor_id = ? 
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
  }
  
  return await executeQuery(query, [userId]);
}

async function updateAppointmentStatus(appointmentId, status) {
  const query = 'UPDATE APPOINTMENT SET status = ? WHERE appointment_id = ?';
  return await executeQuery(query, [status, appointmentId]);
}

// Resource functions
async function createResource(resourceData) {
  const query = `INSERT INTO RESOURCE (title, type, url, description, uploaded_by, uploaded_by_role) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [resourceData.title, resourceData.type, resourceData.url, 
                 resourceData.description, resourceData.uploaded_by, resourceData.uploaded_by_role];
  return await executeQuery(query, params);
}

async function getAllResources() {
  const query = 'SELECT * FROM RESOURCE ORDER BY uploaded_at DESC';
  return await executeQuery(query);
}

// Feedback functions
async function createFeedback(feedbackData) {
  const query = `INSERT INTO FEEDBACK (student_id, counselor_id, rating, comments) 
                 VALUES (?, ?, ?, ?)`;
  const params = [feedbackData.student_id, feedbackData.counselor_id, 
                 feedbackData.rating, feedbackData.comments];
  return await executeQuery(query, params);
}

// Notification functions
async function createNotification(userId, userRole, message) {
  const query = 'INSERT INTO NOTIFICATION (user_id, user_role, message) VALUES (?, ?, ?)';
  return await executeQuery(query, [userId, userRole, message]);
}

async function getNotificationsByUser(userId, userRole) {
  const query = 'SELECT * FROM NOTIFICATION WHERE user_id = ? AND user_role = ? ORDER BY sent_at DESC';
  return await executeQuery(query, [userId, userRole]);
}

async function markNotificationAsRead(notificationId) {
  const query = 'UPDATE NOTIFICATION SET read_status = TRUE WHERE notification_id = ?';
  return await executeQuery(query, [notificationId]);
}

// Session functions
async function createSession(sessionData) {
  const query = `INSERT INTO SESSION (start_time, end_time, notes, follow_up_required, appointment_id, counselor_id, student_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [sessionData.start_time, sessionData.end_time, sessionData.notes, 
                 sessionData.follow_up_required, sessionData.appointment_id, 
                 sessionData.counselor_id, sessionData.student_id];
  return await executeQuery(query, params);
}

// Mental Health Record functions
async function createMentalHealthRecord(recordData) {
  const query = `INSERT INTO MENTAL_HEALTH_RECORD (record_date, summary, diagnosis, observations, student_id, counselor_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [recordData.record_date, recordData.summary, recordData.diagnosis, 
                 recordData.observations, recordData.student_id, recordData.counselor_id];
  return await executeQuery(query, params);
}

async function getMentalHealthRecordsByStudent(studentId) {
  const query = `SELECT mhr.*, c.name as counselor_name 
                 FROM MENTAL_HEALTH_RECORD mhr 
                 JOIN COUNSELOR c ON mhr.counselor_id = c.counselor_id 
                 WHERE mhr.student_id = ? 
                 ORDER BY mhr.record_date DESC`;
  return await executeQuery(query, [studentId]);
}

// Department and Specialization functions
async function getAllDepartments() {
  const query = 'SELECT * FROM DEPARTMENT ORDER BY name';
  return await executeQuery(query);
}

async function getAllSpecializations() {
  const query = 'SELECT * FROM SPECIALIZATION ORDER BY name';
  return await executeQuery(query);
}

// Counselor functions
async function getAvailableCounselors() {
  const query = `SELECT c.*, s.name as specialization_name 
                 FROM COUNSELOR c 
                 LEFT JOIN SPECIALIZATION s ON c.specialization_id = s.specialization_id 
                 WHERE c.available = TRUE 
                 ORDER BY c.name`;
  return await executeQuery(query);
}

async function updateCounselorAvailability(counselorId, available) {
  const query = 'UPDATE COUNSELOR SET available = ? WHERE counselor_id = ?';
  return await executeQuery(query, [available, counselorId]);
}

module.exports = {
  createUser,
  findUserByEmail,
  verifyPassword,
  createAppointment,
  getAppointmentsByUser,
  updateAppointmentStatus,
  createResource,
  getAllResources,
  createFeedback,
  createNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  createSession,
  createMentalHealthRecord,
  getMentalHealthRecordsByStudent,
  getAllDepartments,
  getAllSpecializations,
  getAvailableCounselors,
  updateCounselorAvailability
};