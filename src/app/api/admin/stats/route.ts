import { NextResponse } from 'next/server';
const { executeQuery } = require('../../../../lib/db.js');

export async function GET() {
  try {
    // Get system statistics
    const [studentsResult] = await executeQuery('SELECT COUNT(*) as count FROM STUDENT');
    const [counselorsResult] = await executeQuery('SELECT COUNT(*) as count FROM COUNSELOR');
    const [appointmentsResult] = await executeQuery('SELECT COUNT(*) as count FROM APPOINTMENT');
    const [completedResult] = await executeQuery("SELECT COUNT(*) as count FROM APPOINTMENT WHERE status = 'Completed'");
    const [pendingResult] = await executeQuery("SELECT COUNT(*) as count FROM APPOINTMENT WHERE status = 'Pending'");

    const stats = {
      totalStudents: studentsResult.count || 0,
      totalCounselors: counselorsResult.count || 0,
      totalAppointments: appointmentsResult.count || 0,
      completedSessions: completedResult.count || 0,
      pendingAppointments: pendingResult.count || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}