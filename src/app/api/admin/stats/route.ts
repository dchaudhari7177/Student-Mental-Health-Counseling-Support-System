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
    // Get system statistics
    const [studentsResult] = await pool.query('SELECT COUNT(*) as count FROM STUDENT');
    const [counselorsResult] = await pool.query('SELECT COUNT(*) as count FROM COUNSELOR');
    const [appointmentsResult] = await pool.query('SELECT COUNT(*) as count FROM APPOINTMENT');
    const [completedResult] = await pool.query("SELECT COUNT(*) as count FROM APPOINTMENT WHERE status = 'Completed'");
    const [pendingResult] = await pool.query("SELECT COUNT(*) as count FROM APPOINTMENT WHERE status = 'Pending'");

    const students = studentsResult as any[];
    const counselors = counselorsResult as any[];
    const appointments = appointmentsResult as any[];
    const completed = completedResult as any[];
    const pending = pendingResult as any[];

    const stats = {
      totalStudents: students[0]?.count || 0,
      totalCounselors: counselors[0]?.count || 0,
      totalAppointments: appointments[0]?.count || 0,
      completedSessions: completed[0]?.count || 0,
      pendingAppointments: pending[0]?.count || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    );
  }
}