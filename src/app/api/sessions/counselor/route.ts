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
    const counselorId = searchParams.get('counselor_id') || '1';

    const [sessions] = await pool.query(`
      SELECT 
        s.*,
        sp.name as student_name,
        sp.email as student_email
      FROM SESSION s
      JOIN STUDENT sp ON s.student_id = sp.student_id
      WHERE s.counselor_id = ?
      ORDER BY s.start_time DESC
    `, [counselorId]);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching counselor sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { 
      student_id, 
      counselor_id,
      appointment_id,
      start_time, 
      end_time, 
      notes, 
      follow_up_required 
    } = await request.json();

    const [result] = await pool.execute<mysql.ResultSetHeader>(`
      INSERT INTO SESSION (
        student_id,
        counselor_id,
        appointment_id,
        start_time,
        end_time,
        notes,
        follow_up_required,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      student_id,
      counselor_id || 1,
      appointment_id,
      start_time,
      end_time,
      notes,
      follow_up_required || false
    ]);

    return NextResponse.json({
      message: 'Session created successfully',
      id: result.insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { 
      session_id, 
      notes, 
      follow_up_required,
      end_time 
    } = await request.json();

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      `UPDATE SESSION 
       SET notes = ?,
           follow_up_required = ?,
           end_time = ?
       WHERE session_id = ? AND counselor_id = ?`,
      [notes, follow_up_required, end_time, session_id, /* TODO: Get counselor_id from session */1]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Session updated successfully' });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}