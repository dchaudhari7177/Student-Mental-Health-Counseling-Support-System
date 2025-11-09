'use client';

import { useEffect, useState } from 'react';

interface Appointment {
  appointment_id: number;
  appointment_date: string;
  appointment_time: string;
  mode: 'Online' | 'In-Person';
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rejected';
  student_name: string;
  student_email: string;
}

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('/api/appointments/counselor');
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const data = await response.json();
        setAppointments(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (appointmentId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/appointments/counselor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointmentId, status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Refresh appointments list
      const updatedResponse = await fetch('/api/appointments/counselor');
      if (!updatedResponse.ok) throw new Error('Failed to fetch appointments');
      const data = await updatedResponse.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Confirmed: 'bg-green-100 text-green-800',
      Completed: 'bg-blue-100 text-blue-800',
      Cancelled: 'bg-red-100 text-red-800',
      Rejected: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6">Loading appointments...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Manage Appointments</h1>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No appointments found.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <li key={appointment.appointment_id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">
                        {appointment.student_name}
                      </h3>
                      <p className="text-sm text-gray-600">{appointment.student_email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      Date: {new Date(appointment.appointment_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Time: {appointment.appointment_time}
                    </p>
                    <p className="text-sm text-gray-600">
                      Mode: {appointment.mode}
                    </p>
                  </div>
                  {appointment.status === 'Pending' && (
                    <div className="mt-4 space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(appointment.appointment_id, 'Confirmed')}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appointment.appointment_id, 'Rejected')}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {appointment.status === 'Confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(appointment.appointment_id, 'Completed')}
                      className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Mark as Completed
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );