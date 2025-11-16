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
    const [resources] = await pool.query('SELECT * FROM RESOURCE ORDER BY uploaded_at DESC');
    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, type, url, description } = await request.json();

    // Insert new resource
    const [result] = await pool.execute<mysql.ResultSetHeader>(
      'INSERT INTO RESOURCE (title, type, url, description, uploaded_at) VALUES (?, ?, ?, ?, NOW())',
      [title, type, url, description]
    );

    return NextResponse.json(
      { message: 'Resource created successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}