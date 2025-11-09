'use client';

import { useState } from 'react';

interface Resource {
  resource_id: number;
  title: string;
  type: 'Article' | 'Video' | 'Document' | 'Link' | 'Audio';
  url: string;
  description: string;
  uploaded_at: string;
}

export default function UploadResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState({
    title: '',
    type: 'Article',
    url: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/resources/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource),
      });

      if (!response.ok) throw new Error('Failed to create resource');

      // Refresh resources list
      const updatedResponse = await fetch('/api/resources');
      const data = await updatedResponse.json();
      setResources(data);

      // Reset form
      setNewResource({
        title: '',
        type: 'Article',
        url: '',
        description: ''
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Upload Resources</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Resource</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Type
                </label>
                <select
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value as Resource['type'] })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="Article">Article</option>
                  <option value="Video">Video</option>
                  <option value="Document">Document</option>
                  <option value="Link">Link</option>
                  <option value="Audio">Audio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Description
                </label>
                <textarea
                  value={newResource.description}
                  onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  className="w-full h-32 p-2 border rounded-md"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Upload Resource
              </button>
            </form>
          </div>

          {/* Resources List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Uploaded Resources</h2>
            {resources.length === 0 ? (
              <p className="text-gray-500 text-center">No resources uploaded yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {resources.map((resource) => (
                  <li key={resource.resource_id} className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{resource.title}</h3>
                        <p className="text-sm text-gray-600">{resource.type}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {resource.description}
                        </p>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-sm mt-2 inline-block"
                        >
                          View Resource
                        </a>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(resource.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}