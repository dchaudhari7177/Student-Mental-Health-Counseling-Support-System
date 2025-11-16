import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const [appointments] = await pool.query(`
      SELECT 
        a.*,
        s.name as student_name,
        s.email as student_email
      FROM APPOINTMENT a
      JOIN STUDENT s ON a.student_id = s.student_id
      WHERE a.counselor_id = ?
      ORDER BY a.appointment_date DESC
    `, [/* TODO: Get counselor_id from session */1]);

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching counselor appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { appointment_id, status } = await request.json();

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      'UPDATE APPOINTMENT SET status = ? WHERE appointment_id = ?',
      [status, appointment_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}