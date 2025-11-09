'use client';

import { useEffect, useState } from 'react';

interface HealthRecord {
  record_id: number;
  student_name: string;
  record_date: string;
  summary: string;
  diagnosis: string;
  observations: string;
}

export default function HealthRecords() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [newRecord, setNewRecord] = useState({
    student_id: '',
    summary: '',
    diagnosis: '',
    observations: ''
  });

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch('/api/health-records/counselor');
        if (!response.ok) throw new Error('Failed to fetch health records');
        const data = await response.json();
        setRecords(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/health-records/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });

      if (!response.ok) throw new Error('Failed to create record');

      // Refresh records list
      const updatedResponse = await fetch('/api/health-records/counselor');
      const data = await updatedResponse.json();
      setRecords(data);

      // Reset form
      setNewRecord({
        student_id: '',
        summary: '',
        diagnosis: '',
        observations: ''
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6">Loading health records...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Mental Health Records</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Records List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Records List</h2>
            {records.length === 0 ? (
              <p className="text-gray-500 text-center">No records found.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {records.map((record) => (
                  <li
                    key={record.record_id}
                    className="py-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <p className="font-medium">{record.student_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(record.record_date).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Record Details or New Record Form */}
          <div className="bg-white shadow rounded-lg p-6">
            {selectedRecord ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">Record Details</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Student</p>
                    <p className="font-medium">{selectedRecord.student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {new Date(selectedRecord.record_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Summary</p>
                    <p className="mt-1">{selectedRecord.summary}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Diagnosis</p>
                    <p className="mt-1">{selectedRecord.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Observations</p>
                    <p className="mt-1">{selectedRecord.observations}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateRecord}>
                <h2 className="text-xl font-semibold mb-4">Create New Record</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      value={newRecord.student_id}
                      onChange={(e) => setNewRecord({ ...newRecord, student_id: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Summary
                    </label>
                    <textarea
                      value={newRecord.summary}
                      onChange={(e) => setNewRecord({ ...newRecord, summary: e.target.value })}
                      className="w-full h-20 p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Diagnosis
                    </label>
                    <textarea
                      value={newRecord.diagnosis}
                      onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
                      className="w-full h-20 p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Observations
                    </label>
                    <textarea
                      value={newRecord.observations}
                      onChange={(e) => setNewRecord({ ...newRecord, observations: e.target.value })}
                      className="w-full h-20 p-2 border rounded-md"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Create Record
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}