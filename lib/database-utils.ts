import mysql from 'mysql2/promise';
const dbConfig = require('./db.js');
import bcrypt from 'bcryptjs';

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Type definitions
export interface UserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  enrollment_no?: string;
  department_id?: number;
  qualification?: string;
  license_no?: string;
  specialization_id?: number;
}

interface AppointmentData {
  date: string;
  time: string;
  mode: 'Online' | 'In-Person';
  student_id: number;
  counselor_id: number;
  status?: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rejected';
}

interface ResourceData {
  title: string;
  type: 'Article' | 'Video' | 'Document' | 'Link' | 'Audio';
  url: string;
  description: string;
  uploaded_by: number;
  uploaded_by_role: 'Admin' | 'Counselor';
}

interface SessionData {
  start_time: string;
  end_time: string;
  notes: string;
  follow_up_required: boolean;
  appointment_id: number;
  counselor_id: number;
  student_id: number;
}

interface MentalHealthRecordData {
  record_date: string;
  summary: string;
  diagnosis: string;
  observations: string;
  student_id: number;
  counselor_id: number;
}

// User authentication functions
export async function createUser(userData: UserData, role: 'student' | 'counselor' | 'admin') {
  try {
    const { name, email, password, ...otherData } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let query: string;
    let params: any[];
    
    switch (role) {
      case 'student':
        query = `INSERT INTO STUDENT (name, email, password, phone, dob, gender, address, enrollment_no, department_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        params = [name, email, hashedPassword, otherData.phone, otherData.dob, otherData.gender, 
                 otherData.address, otherData.enrollment_no, otherData.department_id];
        break;
      case 'counselor':
        query = `INSERT INTO COUNSELOR (name, email, password, phone, qualification, license_no, specialization_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
        params = [name, email, hashedPassword, otherData.phone, otherData.qualification, 
                 otherData.license_no, otherData.specialization_id];
        break;
      case 'admin':
        query = `INSERT INTO ADMIN (name, email, password) VALUES (?, ?, ?)`;
        params = [name, email, hashedPassword];
        break;
      default:
        throw new Error('Invalid role');
    }
    
    const [result] = await pool.execute(query, params);
    return result;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}

export async function findUserByEmail(email: string, role: 'student' | 'counselor' | 'admin') {
  try {
    let query: string;
    
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
    
    const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await pool.query(query, [email]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error in findUserByEmail:', error);
    throw error;
  }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Appointment functions
export async function createAppointment(appointmentData: AppointmentData) {
  try {
    const query = `INSERT INTO APPOINTMENT (appointment_date, appointment_time, mode, student_id, counselor_id) 
                   VALUES (?, ?, ?, ?, ?)`;
    const params = [appointmentData.date, appointmentData.time, appointmentData.mode, 
                   appointmentData.student_id, appointmentData.counselor_id];
    const [result] = await pool.execute(query, params);
    return result;
  } catch (error) {
    console.error('Error in createAppointment:', error);
    throw error;
  }
}

export async function getAppointmentsByUser(userId: number, role: 'student' | 'counselor') {
  try {
    let query: string;
    
    if (role === 'student') {
      query = `SELECT a.*, c.name as counselor_name, s.name as specialization 
               FROM APPOINTMENT a 
               JOIN COUNSELOR c ON a.counselor_id = c.counselor_id 
               LEFT JOIN SPECIALIZATION s ON c.specialization_id = s.specialization_id 
               WHERE a.student_id = ? 
               ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
    } else {
      query = `SELECT a.*, st.name as student_name, st.email as student_email 
               FROM APPOINTMENT a 
               JOIN STUDENT st ON a.student_id = st.student_id 
               WHERE a.counselor_id = ? 
               ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
    }
    
    const [rows] = await pool.query(query, [userId]);
    return rows;
  } catch (error) {
    console.error('Error in getAppointmentsByUser:', error);
    throw error;
  }
}

export async function updateAppointmentStatus(
  appointmentId: number,
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rejected'
) {
  try {
    const [result] = await pool.execute(
      'UPDATE APPOINTMENT SET status = ? WHERE appointment_id = ?',
      [status, appointmentId]
    );
    return result;
  } catch (error) {
    console.error('Error in updateAppointmentStatus:', error);
    throw error;
  }
}

// Resource functions
export async function createResource(resourceData: ResourceData) {
  try {
    const query = `INSERT INTO RESOURCE (title, type, url, description, uploaded_by, uploaded_by_role) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [resourceData.title, resourceData.type, resourceData.url, 
                   resourceData.description, resourceData.uploaded_by, resourceData.uploaded_by_role];
    const [result] = await pool.execute(query, params);
    return result;
  } catch (error) {
    console.error('Error in createResource:', error);
    throw error;
  }
}

export async function getAllResources() {
  try {
    const [rows] = await pool.query('SELECT * FROM RESOURCE ORDER BY uploaded_at DESC');
    return rows;
  } catch (error) {
    console.error('Error in getAllResources:', error);
    throw error;
  }
}

// Session functions
export async function createSession(sessionData: SessionData) {
  try {
    const query = `INSERT INTO SESSION (start_time, end_time, notes, follow_up_required, appointment_id, counselor_id, student_id) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [sessionData.start_time, sessionData.end_time, sessionData.notes, 
                   sessionData.follow_up_required, sessionData.appointment_id, 
                   sessionData.counselor_id, sessionData.student_id];
    const [result] = await pool.execute(query, params);
    return result;
  } catch (error) {
    console.error('Error in createSession:', error);
    throw error;
  }
}

// Mental Health Record functions
export async function createMentalHealthRecord(recordData: MentalHealthRecordData) {
  try {
    const query = `INSERT INTO MENTAL_HEALTH_RECORD (record_date, summary, diagnosis, observations, student_id, counselor_id) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [recordData.record_date, recordData.summary, recordData.diagnosis, 
                   recordData.observations, recordData.student_id, recordData.counselor_id];
    const [result] = await pool.execute(query, params);
    return result;
  } catch (error) {
    console.error('Error in createMentalHealthRecord:', error);
    throw error;
  }
}

export async function getMentalHealthRecordsByStudent(studentId: number) {
  try {
    const query = `SELECT mhr.*, c.name as counselor_name 
                   FROM MENTAL_HEALTH_RECORD mhr 
                   JOIN COUNSELOR c ON mhr.counselor_id = c.counselor_id 
                   WHERE mhr.student_id = ? 
                   ORDER BY mhr.record_date DESC`;
    const [rows] = await pool.query(query, [studentId]);
    return rows;
  } catch (error) {
    console.error('Error in getMentalHealthRecordsByStudent:', error);
    throw error;
  }
}

// Department and Specialization functions
export async function getAllDepartments() {
  try {
    const [rows] = await pool.query('SELECT * FROM DEPARTMENT ORDER BY name');
    return rows;
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    throw error;
  }
}

export async function getAllSpecializations() {
  try {
    const [rows] = await pool.query('SELECT * FROM SPECIALIZATION ORDER BY name');
    return rows;
  } catch (error) {
    console.error('Error in getAllSpecializations:', error);
    throw error;
  }
}

// Counselor functions
export async function getAvailableCounselors() {
  try {
    const query = `SELECT c.*, s.name as specialization_name 
                   FROM COUNSELOR c 
                   LEFT JOIN SPECIALIZATION s ON c.specialization_id = s.specialization_id 
                   WHERE c.available = TRUE 
                   ORDER BY c.name`;
    const [rows] = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('Error in getAvailableCounselors:', error);
    throw error;
  }
}

// Add any additional functions here if needed

export async function updateCounselorAvailability(counselorId, available) {
  const query = 'UPDATE COUNSELOR SET available = ? WHERE counselor_id = ?';
  return await executeQuery(query, [available, counselorId]);
}
