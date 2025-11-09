import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import dbConfig from '@/lib/db';

const pool = mysql.createPool(dbConfig);

export async function GET() {
  try {
    const [sessions] = await pool.query(`
      SELECT 
        s.*,
        sp.name as student_name,
        sp.email as student_email
      FROM SESSION s
      JOIN STUDENT sp ON s.student_id = sp.student_id
      WHERE s.counselor_id = ?
      ORDER BY s.session_date DESC
    `, [/* TODO: Get counselor_id from session */1]);

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
    const { student_id, session_date, notes, diagnosis, recommendations } = await request.json();

    const [result] = await pool.execute<mysql.ResultSetHeader>(`
      INSERT INTO SESSION (
        student_id,
        counselor_id,
        session_date,
        notes,
        diagnosis,
        recommendations,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      student_id,
      /* TODO: Get counselor_id from session */1,
      session_date,
      notes,
      diagnosis,
      recommendations
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
    const { session_id, notes, diagnosis, recommendations } = await request.json();

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      `UPDATE sessions 
       SET notes = ?, diagnosis = ?, recommendations = ?
       WHERE session_id = ? AND counselor_id = ?`,
      [notes, diagnosis, recommendations, session_id, /* TODO: Get counselor_id from session */1]
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