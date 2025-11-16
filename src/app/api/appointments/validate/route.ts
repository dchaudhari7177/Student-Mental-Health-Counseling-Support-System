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

// Book appointment with validation using stored procedure
export async function POST(request: NextRequest) {
  try {
    const { student_id, counselor_id, appointment_date, appointment_time, mode } = await request.json();

    if (!student_id || !counselor_id || !appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call stored procedure with OUT parameter
    const connection = await pool.getConnection();
    try {
      await connection.query('SET @result = ""');
      await connection.query(
        'CALL BookAppointmentWithValidation(?, ?, ?, ?, ?, @result)',
        [student_id, counselor_id, appointment_date, appointment_time, mode || 'Online']
      );
      
      const [rows] = await connection.query('SELECT @result as result');
      const result = (rows as any[])[0].result;

      if (result.startsWith('ERROR')) {
        return NextResponse.json(
          { error: result.replace('ERROR: ', '') },
          { status: 400 }
        );
      }

      // Create notification for counselor
      await connection.query(
        `INSERT INTO NOTIFICATION (user_id, user_role, message, sent_at, read_status)
         VALUES (?, 'Counselor', ?, NOW(), FALSE)`,
        [
          counselor_id,
          `New appointment request from student for ${appointment_date} at ${appointment_time}`
        ]
      );

      return NextResponse.json({
        message: 'Appointment booked successfully',
        details: result
      }, { status: 201 });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { error: 'Failed to book appointment' },
      { status: 500 }
    );
  }
}

// Check if slot is available using function
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const counselorId = searchParams.get('counselorId');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!counselorId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Use function to check availability
    const [results] = await pool.query(
      'SELECT IsAppointmentSlotAvailable(?, ?, ?) as available',
      [parseInt(counselorId), date, time]
    );

    const isAvailable = (results as any[])[0].available === 1;

    // Get available slots count for the day
    const [slotsResults] = await pool.query(
      'SELECT GetCounselorAvailableSlots(?, ?) as available_slots',
      [parseInt(counselorId), date]
    );

    const availableSlots = (slotsResults as any[])[0].available_slots;

    return NextResponse.json({
      slotAvailable: isAvailable,
      availableSlotsForDay: availableSlots
    });

  } catch (error) {
    console.error('Error checking slot availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
