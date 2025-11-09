import { NextResponse } from 'next/server';
const { getAllSpecializations } = require('../../../../lib/database-utils.js');

export async function GET() {
  try {
    const specializations = await getAllSpecializations();
    if (!specializations || specializations.length === 0) {
      console.log('No specializations found');
      return NextResponse.json([]);
    }
    console.log('Fetched specializations:', specializations);
    return NextResponse.json(specializations);
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}