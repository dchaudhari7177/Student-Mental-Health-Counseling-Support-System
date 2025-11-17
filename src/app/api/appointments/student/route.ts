import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

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
  keepAliveInitialDelay: 0
};

const pool = mysql.createPool(dbConfig);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || '3'; // Default to 3 for testing

    const [appointments] = await pool.query(`
      SELECT 
        a.*,
        c.name as counselor_name,
        c.email as counselor_email,
        s.name as specialization
      FROM APPOINTMENT a
      JOIN COUNSELOR c ON a.counselor_id = c.counselor_id
      LEFT JOIN SPECIALIZATION s ON c.specialization_id = s.specialization_id
      WHERE a.student_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [parseInt(studentId)]);

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching student appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { student_id, counselor_id, appointment_date, appointment_time, mode } = await request.json();

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      `INSERT INTO APPOINTMENT (student_id, counselor_id, appointment_date, appointment_time, mode, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Pending', NOW(), NOW())`,
      [student_id || 3, counselor_id, appointment_date, appointment_time, mode]
    );

    // Create notification for counselor
    await pool.execute(
      `INSERT INTO NOTIFICATION (user_id, user_role, message, sent_at, read_status)
       VALUES (?, 'Counselor', ?, NOW(), FALSE)`,
      [counselor_id, `New appointment request for ${appointment_date} at ${appointment_time}`]
    );

    return NextResponse.json({
      message: 'Appointment booked successfully',
      id: result.insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { error: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}