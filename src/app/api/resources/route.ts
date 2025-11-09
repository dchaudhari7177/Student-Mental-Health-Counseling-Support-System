import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import dbConfig from '@/lib/db';

const pool = mysql.createPool(dbConfig);

export async function GET() {
  try {
    const [resources] = await pool.query('SELECT * FROM resources ORDER BY uploaded_at DESC');
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
      'INSERT INTO resources (title, type, url, description, uploaded_at) VALUES (?, ?, ?, ?, NOW())',
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