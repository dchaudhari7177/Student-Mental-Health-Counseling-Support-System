import { NextRequest, NextResponse } from 'next/server';
const { createAppointment, getAppointmentsByUser, updateAppointmentStatus, createNotification } = require('../../../../lib/database-utils.js');

export async function POST(request: NextRequest) {
  try {
    const appointmentData = await request.json();
    
    if (!appointmentData.student_id || !appointmentData.counselor_id || 
        !appointmentData.appointment_date || !appointmentData.appointment_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format the data for database
    const dbData = {
      date: appointmentData.appointment_date,
      time: appointmentData.appointment_time,
      mode: appointmentData.mode || 'Online',
      student_id: appointmentData.student_id,
      counselor_id: appointmentData.counselor_id
    };

    await createAppointment(dbData);

    // Create notification for counselor
    await createNotification(
      appointmentData.counselor_id,
      'counselor',
      `New appointment request from student for ${appointmentData.appointment_date} at ${appointmentData.appointment_time}`
    );

    return NextResponse.json({
      message: 'Appointment booked successfully'
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    const appointments = await getAppointmentsByUser(parseInt(userId), role);
    return NextResponse.json(appointments);

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { appointmentId, status } = await request.json();

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'Appointment ID and status are required' },
        { status: 400 }
      );
    }

    await updateAppointmentStatus(appointmentId, status);

    return NextResponse.json({
      message: 'Appointment status updated successfully'
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}