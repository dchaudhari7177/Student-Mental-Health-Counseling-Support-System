'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Appointment {
  appointment_id: number;
  appointment_date: string;
  appointment_time: string;
  mode: 'Online' | 'In-Person';
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rejected';
  student_name: string;
  student_email: string;
  student_id: number;
  counselor_id: number;
}

interface SessionData {
  notes: string;
  diagnosis: string;
  observations: string;
  follow_up_required: boolean;
}

export default function ManageAppointments() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [sessionData, setSessionData] = useState<SessionData>({
    notes: '',
    diagnosis: '',
    observations: '',
    follow_up_required: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchAppointments(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAppointments = async (counselorId: number) => {
    try {
      const response = await fetch(`/api/appointments/counselor?counselor_id=${counselorId}`);
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/appointments/counselor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointmentId, status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      if (user) await fetchAppointments(user.id);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update appointment status');
    }
  };

  const openCompletionModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSessionData({
      notes: '',
      diagnosis: '',
      observations: '',
      follow_up_required: false
    });
    setShowModal(true);
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;

    setSubmitting(true);
    try {
      const userData = localStorage.getItem('user');
      const counselorId = userData ? JSON.parse(userData).id : 2;

      // Update appointment status to Completed
      const updateResponse = await fetch('/api/appointments/counselor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appointment_id: selectedAppointment.appointment_id, 
          status: 'Completed' 
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update appointment');

      // Create session record
      // Format start_time properly (convert ISO date to YYYY-MM-DD format)
      const appointmentDate = new Date(selectedAppointment.appointment_date);
      const formattedDate = appointmentDate.toISOString().split('T')[0];
      const startTime = `${formattedDate} ${selectedAppointment.appointment_time}`;
      const endTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const sessionResponse = await fetch('/api/sessions/counselor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: selectedAppointment.appointment_id,
          student_id: selectedAppointment.student_id,
          counselor_id: counselorId,
          start_time: startTime,
          end_time: endTime,
          notes: sessionData.notes,
          follow_up_required: sessionData.follow_up_required
        }),
      });

      if (!sessionResponse.ok) throw new Error('Failed to create session');

      // Create mental health record if diagnosis or observations provided
      if (sessionData.diagnosis || sessionData.observations) {
        const recordResponse = await fetch('/api/mental-health-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: selectedAppointment.student_id,
            counselor_id: counselorId,
            record_date: new Date().toISOString().split('T')[0],
            diagnosis: sessionData.diagnosis,
            observations: sessionData.observations,
            summary: sessionData.notes
          }),
        });

        if (!recordResponse.ok) {
          console.error('Failed to create mental health record');
        }
      }

      // Close modal and refresh
      setShowModal(false);
      setSelectedAppointment(null);
      if (user) await fetchAppointments(user.id);
      alert('Appointment completed successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to complete appointment. Please try again.');
    } finally {
      setSubmitting(false);
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
                      onClick={() => openCompletionModal(appointment)}
                      className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Complete Appointment
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Completion Modal */}
        {showModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Complete Appointment</h2>
              <p className="text-gray-600 mb-6">
                Patient: <span className="font-semibold">{selectedAppointment.student_name}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Notes *
                  </label>
                  <textarea
                    value={sessionData.notes}
                    onChange={(e) => setSessionData({ ...sessionData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter session notes..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnosis
                  </label>
                  <textarea
                    value={sessionData.diagnosis}
                    onChange={(e) => setSessionData({ ...sessionData, diagnosis: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter diagnosis (optional)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observations
                  </label>
                  <textarea
                    value={sessionData.observations}
                    onChange={(e) => setSessionData({ ...sessionData, observations: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter observations (optional)..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="follow_up"
                    checked={sessionData.follow_up_required}
                    onChange={(e) => setSessionData({ ...sessionData, follow_up_required: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="follow_up" className="ml-2 block text-sm text-gray-900">
                    Follow-up required
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCompleteAppointment}
                  disabled={submitting || !sessionData.notes}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Completing...' : 'Complete Appointment'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAppointment(null);
                  }}
                  disabled={submitting}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
