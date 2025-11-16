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
    const [counselors] = await pool.query(`
      SELECT 
        c.counselor_id,
        c.name,
        c.email,
        c.phone,
        c.qualification,
        s.name as specialization_name
      FROM COUNSELOR c
      LEFT JOIN SPECIALIZATION s ON c.specialization_id = s.specialization_id
      WHERE c.available = TRUE
      ORDER BY c.name
    `);

    return NextResponse.json(counselors);
  } catch (error) {
    console.error('Error fetching available counselors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch counselors' },
      { status: 500 }
    );
  }
}