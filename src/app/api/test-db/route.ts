import { NextResponse } from 'next/server';
import * as db from '@/lib/database-utils';

export async function GET() {
  try {
    // Try to get departments as a test
    const departments = await db.getAllDepartments();
    
    // Try to get specializations
    const specializations = await db.getAllSpecializations();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      data: {
        departments,
        specializations
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}