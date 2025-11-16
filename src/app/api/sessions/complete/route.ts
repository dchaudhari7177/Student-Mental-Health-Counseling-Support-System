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

// Complete appointment and create session using stored procedure
export async function POST(request: NextRequest) {
  try {
    const { appointment_id, start_time, end_time, notes, follow_up_required } = await request.json();

    if (!appointment_id || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      // Call stored procedure with OUT parameter
      await connection.query('SET @result = ""');
      await connection.query(
        'CALL CompleteAppointmentWithSession(?, ?, ?, ?, ?, @result)',
        [appointment_id, start_time, end_time, notes || '', follow_up_required || false]
      );
      
      const [rows] = await connection.query('SELECT @result as result');
      const result = (rows as any[])[0].result;

      if (result.startsWith('ERROR')) {
        return NextResponse.json(
          { error: result.replace('ERROR: ', '') },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: 'Appointment completed successfully',
        details: result
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error completing appointment:', error);
    return NextResponse.json(
      { error: 'Failed to complete appointment' },
      { status: 500 }
    );
  }
}
