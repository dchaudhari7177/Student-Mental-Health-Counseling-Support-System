'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  mode: string;
  status: string;
  counselor_name: string;
  specialization?: string;
}

interface Notification {
  notification_id: number;
  message: string;
  sent_at: string;
  read_status: boolean;
}

export default function StudentDashboard() {
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
    if (parsedUser.role !== 'student') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    fetchAppointments(parsedUser.id);
    fetchNotifications(parsedUser.id);
  }, [router]);

  const fetchAppointments = async (userId: number) => {
    try {
      const response = await fetch(`/api/appointments?userId=${userId}&role=student`);
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
      const response = await fetch(`/api/notifications?userId=${userId}&role=student`);
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
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
              <h1 className="text-xl font-semibold text-gray-900">SMHCSS - Student Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
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
            href="/student/book-appointment"
            className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold">Book Appointment</h3>
            <p className="text-sm opacity-90">Schedule a session</p>
          </Link>

          <Link
            href="/student/appointments"
            className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold">My Appointments</h3>
            <p className="text-sm opacity-90">View & manage</p>
          </Link>

          <Link
            href="/student/resources"
            className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-semibold">Resources</h3>
            <p className="text-sm opacity-90">Mental health materials</p>
          </Link>

          <Link
            href="/student/feedback"
            className="bg-orange-600 text-white p-6 rounded-lg hover:bg-orange-700 transition-colors text-center"
          >
            <div className="text-3xl mb-2">💬</div>
            <h3 className="font-semibold">Feedback</h3>
            <p className="text-sm opacity-90">Rate your sessions</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h2>
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No appointments found</p>
            ) : (
              <div className="space-y-4">
                {appointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.appointment_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Dr. {appointment.counselor_name}
                        </h3>
                        {appointment.specialization && (
                          <p className="text-sm text-gray-600">{appointment.specialization}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                      <span>{appointment.appointment_time}</span>
                      <span className="capitalize">{appointment.mode}</span>
                    </div>
                  </div>
                ))}
                {appointments.length > 3 && (
                  <Link
                    href="/student/appointments"
                    className="block text-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all appointments →
                  </Link>
                )}
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

        {/* Mental Health Tips */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mental Health Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🧘 Practice Mindfulness</h3>
              <p className="text-sm text-blue-800">Take 5 minutes daily for deep breathing and meditation.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">💪 Stay Active</h3>
              <p className="text-sm text-green-800">Regular exercise can boost mood and reduce stress.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">🤝 Connect with Others</h3>
              <p className="text-sm text-purple-800">Maintain social connections and seek support when needed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}