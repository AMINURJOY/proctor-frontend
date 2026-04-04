import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import {
  CheckIcon,
  XIcon,
  ClockIcon,
  FileIcon,
  ImageIcon,
  VideoIcon,
  SendIcon,
  LockIcon,
  ForwardIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  MailIcon,
  RefreshIcon
} from '../components/Icons';
import { Case, CaseStatus } from '../types';
import { casesApi, API_BASE_URL } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

// Workflow steps for the stepper
const workflowSteps = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'verified', label: 'Verified' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'hearing', label: 'Hearing' },
  { key: 'report', label: 'Report' },
  { key: 'review', label: 'Review' },
  { key: 'decision', label: 'Decision' },
  { key: 'closed', label: 'Closed' },
];

function getStepIndex(status: CaseStatus): number {
  const map: Record<CaseStatus, number> = {
    'submitted': 0,
    'pending': 0,
    'verified': 1,
    'under-review': 2,
    'assigned': 3,
    'hearing-scheduled': 4,
    'hearing-completed': 5,
    'resolved': 7,
    'closed': 8,
    'rejected': -1,
    'on-hold': -2,
    'suggested-type-2': -3,
  };
  return map[status] ?? 0;
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'hearing' | 'notes' | 'timeline'>('overview');
  const [newNote, setNewNote] = useState('');
  const [caseItem, setCaseItem] = useState<Case | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const permissions = usePermissions();
  const canDelete = permissions['cases']?.canDelete ?? false;

  useEffect(() => {
    const fetchCase = async () => {
      setLoading(true);
      try {
        const response = await casesApi.getById(id!);
        setCaseItem(response.data.data || response.data);
      } catch {
        setCaseItem(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCase();
  }, [id]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !caseItem) return;
    setAddingNote(true);
    try {
      await casesApi.addNote(caseItem.id, { content: newNote, author: currentUser?.name || 'Unknown' });
      // Refresh case data
      const response = await casesApi.getById(caseItem.id);
      setCaseItem(response.data.data || response.data);
      setNewNote('');
    } catch {
      // Optimistic update for mock fallback
      const newNoteObj = {
        id: `n-${Date.now()}`,
        content: newNote,
        author: currentUser?.name || 'Unknown',
        createdDate: new Date().toISOString(),
      };
      setCaseItem(prev => prev ? { ...prev, notes: [...prev.notes, newNoteObj] } : prev);
      setNewNote('');
    } finally {
      setAddingNote(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!caseItem || !e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        await casesApi.addDocument(caseItem.id, file);
      }
      const response = await casesApi.getById(caseItem.id);
      setCaseItem(response.data.data || response.data);
    } catch { /* silent */ }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getDocUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!caseItem) return;
    try {
      await casesApi.updateStatus(caseItem.id, { status: newStatus });
      const response = await casesApi.getById(caseItem.id);
      setCaseItem(response.data.data || response.data);
    } catch {
      // Optimistic update for mock
      setCaseItem(prev => prev ? { ...prev, status: newStatus as CaseStatus } : prev);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-4" style={{ color: '#0b2652' }}>Case Not Found</h2>
        <button onClick={() => navigate('/cases')} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#0b2652' }}>
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
        <button onClick={() => navigate('/cases')} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#0b2652' }}>
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
    'on-hold': 'bg-amber-100 text-amber-700',
    'suggested-type-2': 'bg-purple-100 text-purple-700'
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'hearing', label: 'Hearing' },
    { id: 'notes', label: 'Notes' },
    { id: 'timeline', label: 'Activity Timeline' }
  ] as const;

  const currentStepIndex = getStepIndex(caseItem.status);
  const isRejected = caseItem.status === 'rejected';
  const isOnHold = caseItem.status === 'on-hold';

  const role = currentUser?.role || '';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800 mb-4">
          &larr; Back
        </button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl" style={{ color: '#0b2652' }}>{caseItem.caseNumber}</h1>
              {isConfidential && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                  <LockIcon />
                  <span className="text-sm font-medium">CONFIDENTIAL</span>
                </div>
              )}
              <span className={`inline-flex px-3 py-1 text-sm rounded-full ${statusColors[caseItem.status]}`}>
                {caseItem.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                caseItem.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                caseItem.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                caseItem.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {caseItem.priority.charAt(0).toUpperCase() + caseItem.priority.slice(1)} Priority
              </span>
            </div>
            <p className="text-gray-600">
              {caseItem.studentName} &middot; {caseItem.studentId}
              {caseItem.type === 'type-1' && ' &middot; Type-1 (Instant Incident)'}
              {caseItem.type === 'type-2' && ' &middot; Type-2 (Formal Case)'}
            </p>
          </div>
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors flex-shrink-0"
            >
              <XIcon /> Delete Case
            </button>
          )}
        </div>
      </div>

      {/* Visual Stepper / Progress Tracker */}
      {!isConfidential && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Case Progress</h3>

          {isRejected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
              <XIcon />
              <span className="text-sm text-red-700 font-medium">This case has been rejected</span>
            </div>
          )}
          {isOnHold && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2">
              <ClockIcon />
              <span className="text-sm text-amber-700 font-medium">This case is currently on hold</span>
            </div>
          )}

          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {workflowSteps.map((step, index) => {
              const isCompleted = currentStepIndex > index;
              const isCurrent = currentStepIndex === index;
              const isFuture = currentStepIndex < index;

              return (
                <div key={step.key} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'text-white ring-4 ring-blue-200'
                            : 'bg-gray-200 text-gray-500'
                      }`}
                      style={isCurrent ? { backgroundColor: '#0b2652' } : {}}
                    >
                      {isCompleted ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`mt-1.5 text-xs whitespace-nowrap ${
                      isCurrent ? 'font-semibold text-blue-900' : isCompleted ? 'text-green-700' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 mt-[-16px] ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Role-Based Action Panel */}
      <RoleActionPanel role={role} caseItem={caseItem} isConfidential={isConfidential} onStatusChange={handleStatusChange} />

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-4 text-sm font-medium transition-colors sm:px-6 ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#0b2652' }} />
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
                      {caseItem.type === 'type-1' ? 'Type-1 (Instant Incident)' : caseItem.type === 'type-2' ? 'Type-2 (Formal Case)' : 'Confidential'}
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
                  <div>
                    <p className="text-sm text-gray-500">Documents</p>
                    <p className="font-medium">{caseItem.documents.length} file(s)</p>
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: '#0b2652' }}>
                  Attached Documents ({caseItem.documents.length})
                </h3>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,application/pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50"
                    style={{ backgroundColor: '#0b2652' }}
                  >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </div>
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
                          {(doc.type === 'pdf' || doc.type === 'other') && <FileIcon />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">Uploaded by {doc.uploadedBy}</p>
                          <p className="text-xs text-gray-500">{new Date(doc.uploadedDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {doc.type === 'image' && (
                        <img src={getDocUrl(doc.url)} alt={doc.name} className="mt-3 w-full h-40 object-cover rounded-lg" />
                      )}
                      {doc.type === 'video' && (
                        <video controls className="mt-3 w-full h-40 rounded-lg bg-gray-900 object-cover">
                          <source src={getDocUrl(doc.url)} />
                        </video>
                      )}
                      {doc.type === 'pdf' && (
                        <a
                          href={getDocUrl(doc.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"
                        >
                          <FileIcon /> View PDF
                        </a>
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
                          <p className="text-xs text-gray-500 mb-1">Hearing Notes:</p>
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
              {role !== 'student' && role !== 'vc' && (
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note or remark..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50"
                    style={{ backgroundColor: '#0b2652' }}
                  >
                    <SendIcon />
                    {addingNote ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              )}

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
                  {[...caseItem.timeline].reverse().map((event) => (
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2 text-red-600">Delete Case</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to permanently delete case <strong>{caseItem.caseNumber}</strong>? This will also delete all associated documents, notes, hearings, and timeline events. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await casesApi.delete(caseItem.id);
                      navigate('/cases');
                    } catch { /* silent */ }
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Role-based action panel component
function RoleActionPanel({ role, caseItem, isConfidential, onStatusChange }: { role: string; caseItem: Case; isConfidential: boolean; onStatusChange: (status: string) => void }) {
  const isClosed = caseItem.status === 'closed' || caseItem.status === 'resolved' || caseItem.status === 'rejected';

  if (isClosed || role === 'student' || role === 'vc') return null;

  // Type-1 cases can only be closed or suggested as Type-2 — no forwarding/assigning
  if (caseItem.type === 'type-1') return null;

  // Coordinator panel
  if (role === 'coordinator') {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: '#0b2652' }}>Coordinator: Verify Case</h3>
            <p className="text-xs text-gray-500">Review documents and verify case details</p>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Verification Checklist:</p>
          <div className="space-y-2">
            {[
              'Student identity verified',
              'All required documents attached',
              'Incident description is complete',
              'Evidence is valid and relevant',
              'No duplicate case exists',
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={i < 3} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700">
            <CheckIcon /> Accept
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
            <XIcon /> Reject
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700">
            <ClockIcon /> Hold
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 text-orange-700 text-sm hover:bg-orange-50">
            <RefreshIcon /> Request Resubmission
          </button>
        </div>
      </div>
    );
  }

  // Proctor panel
  if (role === 'proctor') {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: '#0b2652' }}>Proctor: Case Decision Panel</h3>
            <p className="text-xs text-gray-500">Review case and decide on action</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700">
            <CheckIcon /> Resolve Case
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: '#0b2652' }}>
              <ForwardIcon /> Assign Case
            </button>
          </div>
        </div>

        {/* Assign options */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Assign to:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">DP</div>
              <div>
                <p className="text-sm font-medium">Deputy Proctor</p>
                <p className="text-xs text-gray-500">Dr. Robert Deputy</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">AP</div>
              <div>
                <p className="text-sm font-medium">Assistant Proctor</p>
                <p className="text-xs text-gray-500">Prof. Emily Assistant</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assistant Proctor panel
  if (role === 'assistant-proctor') {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: '#0b2652' }}>Assistant Proctor: Hearing & Report</h3>
            <p className="text-xs text-gray-500">Schedule hearings, gather evidence, and create reports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Schedule Hearing */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-700 mb-2">Schedule Hearing</p>
            <div className="space-y-2">
              <input type="date" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <input type="time" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <input type="text" placeholder="Location" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Send Notifications */}
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-700 mb-2">Notifications</p>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700">
                <MailIcon /> Send Email to Student
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Send SMS to Student
              </button>
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Last email sent: Apr 1, 2026
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">
            <SendIcon /> Add Notes / Remarks
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700">
            <FileIcon /> Create Draft Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: '#0b2652' }}>
            <ForwardIcon /> Forward to Deputy Proctor
          </button>
        </div>
      </div>
    );
  }

  // Deputy Proctor panel
  if (role === 'deputy-proctor') {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: '#0b2652' }}>Deputy Proctor: Review & Decision</h3>
            <p className="text-xs text-gray-500">Review reports and make decisions</p>
          </div>
        </div>

        {/* Report preview from Assistant Proctor */}
        {caseItem.notes.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Latest Report / Notes:</p>
            <div className="border border-gray-200 rounded p-3 bg-white">
              <p className="text-sm text-gray-700">{caseItem.notes[caseItem.notes.length - 1].content}</p>
              <p className="text-xs text-gray-500 mt-1">by {caseItem.notes[caseItem.notes.length - 1].author}</p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Add Remarks</label>
          <textarea
            placeholder="Add your review remarks..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={2}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600">
            <ArrowLeftIcon /> Send Back to Asst. Proctor
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: '#0b2652' }}>
            <ForwardIcon /> Forward to Proctor
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700">
            <CheckIcon /> Resolve Case
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
            <ArrowRightIcon /> Escalate to Registrar
          </button>
        </div>
      </div>
    );
  }

  // Registrar panel
  if (role === 'registrar') {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: '#0b2652' }}>Registrar Office: Recommendation Panel</h3>
            <p className="text-xs text-gray-500">Add recommendation and decide on forwarding</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
          <textarea
            placeholder="Enter your recommendation for this case..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            <SendIcon /> Add Recommendation
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600">
            <ArrowLeftIcon /> Send Back to Proctor Office
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
            <ForwardIcon /> Forward to Disciplinary Committee
          </button>
        </div>
      </div>
    );
  }

  // Disciplinary Committee panel
  if (role === 'disciplinary-committee') {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <path d="M14.5 2l6 6-8 8-6-6 8-8z" />
              <path d="M3 21l4.5-4.5" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: '#0b2652' }}>Disciplinary Committee: Final Verdict</h3>
            <p className="text-xs text-gray-500">Review all evidence and issue final decision</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Final Decision</label>
          <textarea
            placeholder="Enter the committee's final decision..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={3}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Attach Documents</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400">
            <p className="text-sm text-gray-500">Click to attach final verdict documents</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600">
            <ArrowLeftIcon /> Return to Proctor
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            <SendIcon /> Add Final Decision
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900">
            <CheckIcon /> Close Case
          </button>
        </div>
      </div>
    );
  }

  // Female Coordinator panel
  if (role === 'female-coordinator' && isConfidential) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-red-200 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <LockIcon />
          </div>
          <div>
            <h3 className="font-semibold text-red-700">Female Coordinator: Confidential Review</h3>
            <p className="text-xs text-red-500">Review and forward to Sexual Harassment Committee</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
            <ForwardIcon /> Forward to SH Committee
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600">
            <RefreshIcon /> Request More Information
          </button>
        </div>
      </div>
    );
  }

  // SH Committee panel
  if (role === 'sexual-harassment-committee' && isConfidential) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-red-200 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <LockIcon />
          </div>
          <div>
            <h3 className="font-semibold text-red-700">SH Committee: Investigation & Decision</h3>
            <p className="text-xs text-red-500">Conduct investigation and issue decision</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Notes</label>
          <textarea
            placeholder="Add investigation findings..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            <SendIcon /> Add Investigation Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">
            <CheckIcon /> Issue Decision
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900">
            <CheckIcon /> Close Case
          </button>
        </div>
      </div>
    );
  }

  return null;
}
