'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Session {
  session_id: number;
  start_time: string;
  end_time: string;
  notes: string;
  counselor_name: string;
  specialization_name?: string;
  appointment_id: number;
  follow_up_required: boolean;
}

export default function StudentSessions() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchSessions(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSessions = async (studentId: number) => {
    try {
      const response = await fetch(`/api/sessions/student?student_id=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6">Loading sessions...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">My Sessions</h1>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No sessions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sessions History</h2>
              <ul className="divide-y divide-gray-200">
                {sessions.map((session) => (
                  <li
                    key={session.session_id}
                    className="py-4 cursor-pointer hover:bg-blue-50 rounded px-2 transition-colors"
                    onClick={() => setSelectedSession(session)}
                  >
                    <p className="font-medium text-gray-900">Dr. {session.counselor_name}</p>
                    {session.specialization_name && (
                      <p className="text-sm text-gray-600">{session.specialization_name}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      {new Date(session.start_time).toLocaleDateString()} at {new Date(session.start_time).toLocaleTimeString()}
                    </p>
                    {session.follow_up_required && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        Follow-up Required
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {selectedSession && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Details</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Counselor</p>
                    <p className="font-medium text-gray-900">Dr. {selectedSession.counselor_name}</p>
                    {selectedSession.specialization_name && (
                      <p className="text-sm text-gray-600">{selectedSession.specialization_name}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedSession.start_time).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-700">
                      {new Date(selectedSession.start_time).toLocaleTimeString()} - {new Date(selectedSession.end_time).toLocaleTimeString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Session Notes</p>
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedSession.notes || 'No notes available'}
                      </p>
                    </div>
                  </div>

                  {selectedSession.follow_up_required && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <p className="text-sm font-medium text-yellow-800">
                        Follow-up session recommended
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
