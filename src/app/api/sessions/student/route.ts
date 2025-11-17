import { NextResponse, NextRequest } from 'next/server';
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
    const studentId = searchParams.get('student_id') || '1';

    const [sessions] = await pool.query(`
      SELECT 
        s.*,
        c.name as counselor_name,
        c.email as counselor_email,
        sp.name as specialization_name
      FROM SESSION s
      JOIN COUNSELOR c ON s.counselor_id = c.counselor_id
      LEFT JOIN SPECIALIZATION sp ON c.specialization_id = sp.specialization_id
      WHERE s.student_id = ?
      ORDER BY s.start_time DESC
    `, [studentId]);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching student sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
