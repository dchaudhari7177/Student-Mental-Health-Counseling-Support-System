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

export async function POST(request: NextRequest) {
  try {
    const appointmentData = await request.json();
    
    if (!appointmentData.student_id || !appointmentData.counselor_id || 
        !appointmentData.appointment_date || !appointmentData.appointment_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert appointment into database
    const [result] = await pool.execute<mysql.ResultSetHeader>(
      `INSERT INTO APPOINTMENT (student_id, counselor_id, appointment_date, appointment_time, mode, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Pending', NOW(), NOW())`,
      [
        appointmentData.student_id,
        appointmentData.counselor_id,
        appointmentData.appointment_date,
        appointmentData.appointment_time,
        appointmentData.mode || 'Online'
      ]
    );

    // Create notification for counselor
    await pool.execute(
      `INSERT INTO NOTIFICATION (user_id, user_role, message, sent_at, read_status)
       VALUES (?, 'Counselor', ?, NOW(), FALSE)`,
      [
        appointmentData.counselor_id,
        `New appointment request from student for ${appointmentData.appointment_date} at ${appointmentData.appointment_time}`
      ]
    );

    return NextResponse.json({
      message: 'Appointment booked successfully',
      appointmentId: result.insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    let query = '';
    if (role === 'student') {
      query = `
        SELECT 
          a.*,
          c.name as counselor_name,
          c.email as counselor_email
        FROM APPOINTMENT a
        JOIN COUNSELOR c ON a.counselor_id = c.counselor_id
        WHERE a.student_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;
    } else if (role === 'counselor') {
      query = `
        SELECT 
          a.*,
          s.name as student_name,
          s.email as student_email
        FROM APPOINTMENT a
        JOIN STUDENT s ON a.student_id = s.student_id
        WHERE a.counselor_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;
    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const [appointments] = await pool.query(query, [parseInt(userId)]);
    return NextResponse.json(appointments);

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { appointmentId, status } = await request.json();

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'Appointment ID and status are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      'UPDATE APPOINTMENT SET status = ?, updated_at = NOW() WHERE appointment_id = ?',
      [status, appointmentId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Appointment status updated successfully'
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}