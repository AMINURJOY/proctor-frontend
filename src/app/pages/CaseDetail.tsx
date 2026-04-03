import { useParams, useNavigate } from 'react-router';
import { mockCases } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import {
  CheckIcon,
  XIcon,
  ClockIcon,
  FileIcon,
  ImageIcon,
  VideoIcon,
  EditIcon,
  SendIcon,
  LockIcon
} from '../components/Icons';
import { CaseStatus } from '../types';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'hearing' | 'notes' | 'timeline'>('overview');
  const [newNote, setNewNote] = useState('');

  const caseItem = mockCases.find(c => c.id === id);

  if (!caseItem) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-4" style={{ color: '#0b2652' }}>Case Not Found</h2>
        <button
          onClick={() => navigate('/cases')}
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: '#0b2652' }}
        >
          Back to Cases
        </button>
      </div>
    );
  }

  const isConfidential = caseItem.type === 'confidential';
  const canViewConfidential = currentUser?.role === 'proctor' ||
    currentUser?.role === 'female-coordinator' ||
    currentUser?.role === 'sexual-harassment-committee' ||
    currentUser?.role === 'vc';

  if (isConfidential && !canViewConfidential) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <LockIcon />
        </div>
        <h2 className="text-2xl mb-2 text-red-600">Access Restricted</h2>
        <p className="text-gray-600 mb-4">You don't have permission to view this confidential case.</p>
        <button
          onClick={() => navigate('/cases')}
          className="px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: '#0b2652' }}
        >
          Back to Cases
        </button>
      </div>
    );
  }

  const statusColors: Record<CaseStatus, string> = {
    'submitted': 'bg-blue-100 text-blue-700',
    'pending': 'bg-yellow-100 text-yellow-700',
    'under-review': 'bg-indigo-100 text-indigo-700',
    'verified': 'bg-cyan-100 text-cyan-700',
    'assigned': 'bg-purple-100 text-purple-700',
    'hearing-scheduled': 'bg-orange-100 text-orange-700',
    'hearing-completed': 'bg-teal-100 text-teal-700',
    'resolved': 'bg-green-100 text-green-700',
    'closed': 'bg-gray-100 text-gray-700',
    'rejected': 'bg-red-100 text-red-700',
    'on-hold': 'bg-amber-100 text-amber-700'
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'hearing', label: 'Hearing' },
    { id: 'notes', label: 'Notes' },
    { id: 'timeline', label: 'Activity Timeline' }
  ] as const;

  const canTakeAction = ['proctor', 'assistant-proctor', 'deputy-proctor', 'disciplinary-committee'].includes(currentUser?.role || '');

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/cases')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Cases
        </button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl" style={{ color: '#0b2652' }}>
                {caseItem.caseNumber}
              </h1>
              {isConfidential && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                  <LockIcon />
                  <span className="text-sm font-medium">CONFIDENTIAL</span>
                </div>
              )}
              <span className={`inline-flex px-3 py-1 text-sm rounded-full ${statusColors[caseItem.status]}`}>
                {caseItem.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            </div>
            <p className="text-gray-600">
              {caseItem.studentName} · {caseItem.studentId}
            </p>
          </div>
          {canTakeAction && (
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700">
                <CheckIcon />
                Accept
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700">
                <XIcon />
                Reject
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700">
                <ClockIcon />
                Hold
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-4 text-sm font-medium transition-colors sm:px-6 ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#0b2652' }}></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Case Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Case Type</p>
                    <p className="font-medium">
                      {caseItem.type === 'type-1' ? 'Type-1 (Incident)' : caseItem.type === 'type-2' ? 'Type-2 (Academic)' : 'Confidential'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Priority</p>
                    <p className="font-medium capitalize">{caseItem.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assigned To</p>
                    <p className="font-medium">{caseItem.assignedTo || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created Date</p>
                    <p className="font-medium">{new Date(caseItem.createdDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{new Date(caseItem.updatedDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Description</h3>
                <p className="text-gray-700 leading-relaxed">{caseItem.description}</p>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4" style={{ color: '#0b2652' }}>
                Attached Documents ({caseItem.documents.length})
              </h3>
              {caseItem.documents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No documents attached</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {caseItem.documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f5f7fb' }}>
                          {doc.type === 'image' && <ImageIcon />}
                          {doc.type === 'video' && <VideoIcon />}
                          {doc.type === 'pdf' && <FileIcon />}
                          {doc.type === 'other' && <FileIcon />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">Uploaded by {doc.uploadedBy}</p>
                          <p className="text-xs text-gray-500">{new Date(doc.uploadedDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {doc.type === 'image' && doc.url.startsWith('http') && (
                        <img src={doc.url} alt={doc.name} className="mt-3 w-full h-40 object-cover rounded-lg" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hearing Tab */}
          {activeTab === 'hearing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: '#0b2652' }}>
                  Hearings ({caseItem.hearings.length})
                </h3>
                {canTakeAction && (
                  <button
                    className="px-4 py-2 rounded-lg text-white text-sm"
                    style={{ backgroundColor: '#0b2652' }}
                  >
                    Schedule Hearing
                  </button>
                )}
              </div>
              {caseItem.hearings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hearings scheduled</p>
              ) : (
                <div className="space-y-4">
                  {caseItem.hearings.map((hearing) => (
                    <div key={hearing.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium">{hearing.date} at {hearing.time}</p>
                          <p className="text-sm text-gray-600">{hearing.location}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          hearing.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          hearing.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {hearing.status.charAt(0).toUpperCase() + hearing.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Participants:</p>
                        <div className="flex flex-wrap gap-2">
                          {hearing.participants.map((participant, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {participant}
                            </span>
                          ))}
                        </div>
                      </div>
                      {hearing.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-700">{hearing.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4" style={{ color: '#0b2652' }}>
                Case Notes & Remarks
              </h3>

              {/* Add Note */}
              {canTakeAction && (
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note or remark..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    rows={3}
                  />
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm"
                    style={{ backgroundColor: '#0b2652' }}
                  >
                    <SendIcon />
                    Add Note
                  </button>
                </div>
              )}

              {/* Notes List */}
              {caseItem.notes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No notes added yet</p>
              ) : (
                <div className="space-y-4">
                  {caseItem.notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <p className="font-medium">{note.author}</p>
                        <p className="text-sm text-gray-500">{new Date(note.createdDate).toLocaleString()}</p>
                      </div>
                      <p className="text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-4" style={{ color: '#0b2652' }}>
                Activity Timeline
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  {caseItem.timeline.map((event, index) => (
                    <div key={event.id} className="relative pl-10">
                      <div className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0b2652' }}>
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <p className="font-medium">{event.action}</p>
                          <p className="text-sm text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                        <p className="text-xs text-gray-500">by {event.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
