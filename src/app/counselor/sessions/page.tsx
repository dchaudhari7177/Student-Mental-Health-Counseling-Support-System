'use client';

import { useEffect, useState } from 'react';

interface Session {
  session_id: number;
  start_time: string;
  end_time: string;
  notes: string;
  student_name: string;
  appointment_id: number;
  follow_up_required: boolean;
}

export default function SessionNotes() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions/counselor');
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleSaveNotes = async (sessionId: number) => {
    try {
      const response = await fetch('/api/sessions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, notes }),
      });

      if (!response.ok) throw new Error('Failed to update session notes');

      // Refresh sessions list
      const updatedResponse = await fetch('/api/sessions/counselor');
      const data = await updatedResponse.json();
      setSessions(data);
      setSelectedSession(null);
    } catch (error) {
      console.error('Error:', error);
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
        <h1 className="text-3xl font-semibold mb-6">Session Notes</h1>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No sessions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Sessions List</h2>
              <ul className="divide-y divide-gray-200">
                {sessions.map((session) => (
                  <li
                    key={session.session_id}
                    className="py-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedSession(session);
                      setNotes(session.notes || '');
                    }}
                  >
                    <p className="font-medium">{session.student_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.start_time).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {selectedSession && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Session Details</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Student</p>
                    <p className="font-medium">{selectedSession.student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {new Date(selectedSession.start_time).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium">
                      {new Date(selectedSession.start_time).toLocaleTimeString()} - 
                      {new Date(selectedSession.end_time).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Session Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-40 p-2 border rounded-md"
                      placeholder="Enter session notes..."
                    />
                  </div>
                  <button
                    onClick={() => handleSaveNotes(selectedSession.session_id)}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );