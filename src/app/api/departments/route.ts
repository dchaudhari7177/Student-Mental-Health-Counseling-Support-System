import { NextResponse } from 'next/server';
const { getAllDepartments } = require('../../../../lib/database-utils.js');

export async function GET() {
  try {
    const departments = await getAllDepartments();
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}