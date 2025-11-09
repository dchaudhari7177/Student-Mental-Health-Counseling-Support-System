import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';
const { getAppointmentsByUser } = require('@/lib/database-utils.js');

interface DecodedToken extends JwtPayload {
  id: number;
  role: string;
}

export async function GET() {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify and decode the token
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'your-secret-key') as DecodedToken;
    
    if (!decoded || !decoded.id || decoded.role !== 'student') {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 403 }
      );
    }

    // Get appointments for the student
    const appointments = await getAppointmentsByUser(decoded.id, 'student');
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching student appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}