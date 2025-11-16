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

// Demonstrate usage of custom functions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and id' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'counselor-rating':
        // Use CalculateCounselorRating function
        const [ratingRows] = await pool.query(
          'SELECT CalculateCounselorRating(?) as rating',
          [parseInt(id)]
        );
        result = {
          counselorId: id,
          averageRating: (ratingRows as any[])[0].rating
        };
        break;

      case 'student-sessions':
        // Use GetStudentSessionCount function
        const [sessionRows] = await pool.query(
          'SELECT GetStudentSessionCount(?) as session_count',
          [parseInt(id)]
        );
        result = {
          studentId: id,
          totalSessions: (sessionRows as any[])[0].session_count
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: counselor-rating or student-sessions' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
