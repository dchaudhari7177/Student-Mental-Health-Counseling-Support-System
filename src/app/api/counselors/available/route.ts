import { NextResponse } from 'next/server';
const { getAvailableCounselors } = require('@/lib/database-utils.js');

export async function GET() {
  try {
    const counselors = await getAvailableCounselors();
    return NextResponse.json(counselors);
  } catch (error) {
    console.error('Error fetching available counselors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}