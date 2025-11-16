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

// Get counselor performance using stored procedure
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const counselorId = searchParams.get('counselorId');

    if (!counselorId) {
      return NextResponse.json(
        { error: 'Counselor ID is required' },
        { status: 400 }
      );
    }

    // Call stored procedure
    const [results] = await pool.query(
      'CALL GetCounselorPerformance(?)',
      [parseInt(counselorId)]
    );

    // Stored procedures return results in an array
    const performanceData = (results as any[])[0][0];

    if (!performanceData) {
      return NextResponse.json(
        { error: 'Counselor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(performanceData);

  } catch (error) {
    console.error('Error fetching counselor performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counselor performance' },
      { status: 500 }
    );
  }
}
