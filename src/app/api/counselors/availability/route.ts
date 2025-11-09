import { NextRequest, NextResponse } from 'next/server';
const { updateCounselorAvailability } = require('../../../../../lib/database-utils.js');

export async function PATCH(request: NextRequest) {
  try {
    const { counselorId, available } = await request.json();

    if (!counselorId || available === undefined) {
      return NextResponse.json(
        { error: 'Counselor ID and availability status are required' },
        { status: 400 }
      );
    }

    await updateCounselorAvailability(counselorId, available);

    return NextResponse.json({
      message: 'Counselor availability updated successfully'
    });

  } catch (error) {
    console.error('Error updating counselor availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}