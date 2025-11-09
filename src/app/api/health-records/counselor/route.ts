import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import dbConfig from '@/lib/db';

const pool = mysql.createPool(dbConfig);

export async function GET() {
  try {
    const [records] = await pool.query(`
      SELECT 
        mhr.*,
        sp.name as student_name,
        sp.email as student_email
      FROM mental_health_record mhr
      JOIN student_profile sp ON mhr.student_id = sp.student_id
      WHERE mhr.counselor_id = ?
      ORDER BY mhr.created_at DESC
    `, [/* TODO: Get counselor_id from session */1]);

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching health records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health records' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      student_id,
      assessment,
      diagnosis,
      treatment_plan,
      medications,
      notes
    } = await request.json();

    const [result] = await pool.execute<mysql.ResultSetHeader>(`
      INSERT INTO mental_health_record (
        student_id,
        counselor_id,
        assessment,
        diagnosis,
        treatment_plan,
        medications,
        notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      student_id,
      /* TODO: Get counselor_id from session */1,
      assessment,
      diagnosis,
      treatment_plan,
      medications,
      notes
    ]);

    return NextResponse.json({
      message: 'Health record created successfully',
      id: result.insertId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating health record:', error);
    return NextResponse.json(
      { error: 'Failed to create health record' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const {
      record_id,
      assessment,
      diagnosis,
      treatment_plan,
      medications,
      notes
    } = await request.json();

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      `UPDATE mental_health_record 
       SET assessment = ?,
           diagnosis = ?,
           treatment_plan = ?,
           medications = ?,
           notes = ?,
           updated_at = NOW()
       WHERE record_id = ? AND counselor_id = ?`,
      [
        assessment,
        diagnosis,
        treatment_plan,
        medications,
        notes,
        record_id,
        /* TODO: Get counselor_id from session */1
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Record not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Health record updated successfully' });
  } catch (error) {
    console.error('Error updating health record:', error);
    return NextResponse.json(
      { error: 'Failed to update health record' },
      { status: 500 }
    );
  }
}