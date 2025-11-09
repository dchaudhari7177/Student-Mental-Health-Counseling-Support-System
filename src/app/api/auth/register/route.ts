import { NextRequest, NextResponse } from 'next/server';
const { createUser, findUserByEmail } = require('../../../../../lib/database-utils.js');

export async function POST(request: NextRequest) {
  try {
    console.log('Processing registration request...');
    const userData = await request.json();
    const { email, role, name, password, phone, qualification, license_no, specialization_id } = userData;
    console.log('Registration data:', { 
      email, role, name, phone,
      qualification, license_no, specialization_id 
    }); // Don't log password

    // Validate required fields
    if (!email || !role || !name || !password) {
      console.warn('Missing required fields:', {
        email: !email,
        role: !role,
        name: !name,
        password: !password
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Additional validation for counselor
    if (role === 'counselor' && (!qualification || !license_no || !specialization_id)) {
      console.warn('Missing required counselor fields:', {
        qualification: !qualification,
        license_no: !license_no,
        specialization_id: !specialization_id
      });
      return NextResponse.json(
        { error: 'Missing required counselor fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('Checking for existing user:', { email, role });
    const existingUser = await findUserByEmail(email, role);
    if (existingUser) {
      console.warn('User already exists:', { email, role });
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }

    // Create new user
    const result = await createUser(userData, role);
    console.log('User creation result:', result);

    return NextResponse.json({
      message: 'User registered successfully',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}