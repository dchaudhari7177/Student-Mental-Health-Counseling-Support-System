'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  available?: boolean;
}

interface Appointment {
  appointment_id: number;
  appointment_date: string;
  appointment_time: string;
  mode: string;
  status: string;
  student_name: string;
  student_email: string;
}

interface Notification {
  notification_id: number;
  message: string;
  sent_at: string;
  read_status: boolean;
}

export default function CounselorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'counselor') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    fetchAppointments(parsedUser.id);
    fetchNotifications(parsedUser.id);
  }, [router]);

  const fetchAppointments = async (userId: number) => {
    try {
      const response = await fetch(`/api/appointments?userId=${userId}&role=counselor`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchNotifications = async (userId: number) => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&role=counselor`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentAction = async (appointmentId: number, status: string) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId, status }),
      });

      if (response.ok) {
        // Refresh appointments
        if (user) {
          fetchAppointments(user.id);
        }
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const toggleAvailability = async () => {
    try {
      const newAvailability = !user?.available;
      const response = await fetch('/api/counselors/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          counselorId: user?.id, 
          available: newAvailability 
        }),
      });

      if (response.ok) {
        setUser(prev => prev ? { ...prev, available: newAvailability } : null);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">SMHCSS - Counselor Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Available:</span>
                <button
                  onClick={toggleAvailability}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    user?.available ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      user?.available ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <span className="text-gray-700">Dr. {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/counselor/appointments"
            className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold">Manage Appointments</h3>
            <p className="text-sm opacity-90">View & handle requests</p>
          </Link>

          <Link
            href="/counselor/sessions"
            className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            <div className="text-3xl mb-2">💼</div>
            <h3 className="font-semibold">Session Notes</h3>
            <p className="text-sm opacity-90">Manage session records</p>
          </Link>

          <Link
            href="/counselor/mental-health-records"
            className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold">Health Records</h3>
            <p className="text-sm opacity-90">Student mental health data</p>
          </Link>

          <Link
            href="/counselor/resources"
            className="bg-orange-600 text-white p-6 rounded-lg hover:bg-orange-700 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-semibold">Upload Resources</h3>
            <p className="text-sm opacity-90">Share materials</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Appointments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Appointments</h2>
            {appointments.filter(apt => apt.status === 'Pending').length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending appointments</p>
            ) : (
              <div className="space-y-4">
                {appointments.filter(apt => apt.status === 'Pending').slice(0, 3).map((appointment) => (
                  <div key={appointment.appointment_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {appointment.student_name}
                        </h3>
                        <p className="text-sm text-gray-600">{appointment.student_email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mb-3">
                      <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                      <span>{appointment.appointment_time}</span>
                      <span className="capitalize">{appointment.mode}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAppointmentAction(appointment.appointment_id, 'Confirmed')}
                        className="flex-1 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleAppointmentAction(appointment.appointment_id, 'Rejected')}
                        className="flex-1 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h2>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`p-3 rounded-lg ${
                      notification.read_status ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-400'
                    }`}
                  >
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.sent_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h2>
          {appointments.filter(apt => 
            apt.status === 'Confirmed' && 
            new Date(apt.appointment_date).toDateString() === new Date().toDateString()
          ).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No appointments scheduled for today</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments
                .filter(apt => 
                  apt.status === 'Confirmed' && 
                  new Date(apt.appointment_date).toDateString() === new Date().toDateString()
                )
                .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                .map((appointment) => (
                  <div key={appointment.appointment_id} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">
                        {appointment.student_name}
                      </h3>
                      <span className="text-sm font-medium text-green-700">
                        {appointment.appointment_time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{appointment.student_email}</p>
                    <p className="text-xs text-gray-500 capitalize">{appointment.mode} Session</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}