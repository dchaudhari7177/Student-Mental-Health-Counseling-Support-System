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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const [records] = await pool.query(`
      SELECT 
        mhr.*,
        c.name as counselor_name
      FROM MENTAL_HEALTH_RECORD mhr
      LEFT JOIN COUNSELOR c ON mhr.counselor_id = c.counselor_id
      WHERE mhr.student_id = ?
      ORDER BY mhr.record_date DESC
    `, [studentId]);

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching mental health records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mental health records' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { 
      student_id, 
      counselor_id,
      record_date,
      diagnosis,
      observations,
      summary
    } = await request.json();

    if (!student_id || !record_date) {
      return NextResponse.json(
        { error: 'Student ID and record date are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<mysql.ResultSetHeader>(`
      INSERT INTO MENTAL_HEALTH_RECORD (
        student_id,
        counselor_id,
        record_date,
        diagnosis,
        observations,
        summary,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      student_id,
      counselor_id || null,
      record_date,
      diagnosis || null,
      observations || null,
      summary || null
    ]);

    return NextResponse.json({
      message: 'Mental health record created successfully',
      id: result.insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating mental health record:', error);
    return NextResponse.json(
      { error: 'Failed to create mental health record' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { 
      record_id,
      diagnosis,
      observations,
      summary
    } = await request.json();

    if (!record_id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      `UPDATE MENTAL_HEALTH_RECORD 
       SET diagnosis = ?,
           observations = ?,
           summary = ?,
           updated_at = NOW()
       WHERE record_id = ?`,
      [diagnosis, observations, summary, record_id]
    );

    if ((result as mysql.ResultSetHeader).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Mental health record updated successfully'
    });
  } catch (error) {
    console.error('Error updating mental health record:', error);
    return NextResponse.json(
      { error: 'Failed to update mental health record' },
      { status: 500 }
    );
  }
}
