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

// Get student appointment history using stored procedure
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Call stored procedure
    const [results] = await pool.query(
      'CALL GetStudentHistory(?)',
      [parseInt(studentId)]
    );

    // Stored procedures return results in an array
    const historyData = (results as any[])[0];

    return NextResponse.json(historyData);

  } catch (error) {
    console.error('Error fetching student history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student history' },
      { status: 500 }
    );
  }
}
