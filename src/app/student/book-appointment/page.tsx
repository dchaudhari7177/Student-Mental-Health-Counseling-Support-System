'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Counselor {
  counselor_id: number;
  name: string;
  email: string;
  specialization_name?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function BookAppointment() {
  const [user, setUser] = useState<User | null>(null);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [formData, setFormData] = useState({
    counselor_id: '',
    appointment_date: '',
    appointment_time: '',
    mode: 'Online'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
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
    fetchCounselors();
  }, [router]);

  const fetchCounselors = async () => {
    try {
      const response = await fetch('/api/counselors/available');
      if (response.ok) {
        const data = await response.json();
        setCounselors(data);
      }
    } catch (error) {
      console.error('Error fetching counselors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const appointmentData = {
        ...formData,
        student_id: user?.id,
        counselor_id: parseInt(formData.counselor_id)
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Appointment booked successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard/student');
        }, 2000);
      } else {
        setError(data.error || 'Failed to book appointment');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/student"
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Book Appointment</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Your Appointment</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="counselor_id" className="block text-sm font-medium text-gray-700 mb-2">
                Select Counselor
              </label>
              <select
                id="counselor_id"
                name="counselor_id"
                value={formData.counselor_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a counselor...</option>
                {counselors.map((counselor) => (
                  <option key={counselor.counselor_id} value={counselor.counselor_id}>
                    Dr. {counselor.name} 
                    {counselor.specialization_name && ` - ${counselor.specialization_name}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date
                </label>
                <input
                  type="date"
                  id="appointment_date"
                  name="appointment_date"
                  value={formData.appointment_date}
                  onChange={handleChange}
                  min={minDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="appointment_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time
                </label>
                <select
                  id="appointment_time"
                  name="appointment_time"
                  value={formData.appointment_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select time...</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-2">
                Session Mode
              </label>
              <select
                id="mode"
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Online">Online</option>
                <option value="In-Person">In-Person</option>
              </select>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
            )}

            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">{success}</div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </button>
              
              <Link
                href="/dashboard/student"
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Information Box */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Important Information:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Appointments are subject to counselor availability</li>
              <li>• You will receive a confirmation notification</li>
              <li>• Please arrive 5 minutes early for your session</li>
              <li>• You can cancel or reschedule up to 24 hours in advance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}