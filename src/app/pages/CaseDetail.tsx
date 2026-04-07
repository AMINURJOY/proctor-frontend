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
import { Case, CaseStatus, User } from '../types';
import { casesApi, hearingsApi, usersApi, checklistApi, forwardingRulesApi, API_BASE_URL } from '../services/api';
import { toast } from 'sonner';
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
    'resubmission-requested': 0,
    'verified': 1,
    'under-review': 2,
    'assigned': 3,
    'hearing-scheduled': 4,
    'hearing-completed': 5,
    'forwarded-to-registrar': 6,
    'forwarded-to-committee': 6,
    'resolved': 7,
    'police-case': 7,
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
      toast.success('Document uploaded successfully');
    } catch (err: any) {
      toast.error('Upload failed', { description: err?.response?.data?.message || 'Could not upload document' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getDocUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  const handleStatusChange = async (newStatus: string, extra?: { verdict?: string; recommendation?: string; note?: string }) => {
    if (!caseItem) return;
    try {
      await casesApi.updateStatus(caseItem.id, { status: newStatus, ...extra });
      const response = await casesApi.getById(caseItem.id);
      setCaseItem(response.data.data || response.data);
      toast.success('Status updated', { description: `Case status changed to ${newStatus.split('-').join(' ')}` });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update status';
      toast.error('Error', { description: msg });
    }
  };

  const handleForward = async (targetRole: string, extra?: { note?: string; recommendation?: string; verdict?: string }) => {
    if (!caseItem) return;
    try {
      await casesApi.forward(caseItem.id, { targetRole, ...extra });
      const response = await casesApi.getById(caseItem.id);
      setCaseItem(response.data.data || response.data);
      toast.success('Case forwarded', { description: `Forwarded to ${targetRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}` });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to forward case';
      toast.error('Error', { description: msg });
    }
  };

  const refreshCase = async () => {
    if (!caseItem) return;
    try {
      const response = await casesApi.getById(caseItem.id);
      setCaseItem(response.data.data || response.data);
    } catch { /* silent */ }
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
    'suggested-type-2': 'bg-purple-100 text-purple-700',
    'police-case': 'bg-red-200 text-red-800',
    'forwarded-to-registrar': 'bg-teal-100 text-teal-700',
    'forwarded-to-committee': 'bg-rose-100 text-rose-700',
    'resubmission-requested': 'bg-orange-100 text-orange-700',
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
              {caseItem.forwardedToRole && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
                  <ForwardIcon /> Forwarded to {caseItem.forwardedToRole.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              )}
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
      <RoleActionPanel role={role} caseItem={caseItem} isConfidential={isConfidential} onStatusChange={handleStatusChange} onForward={handleForward} onRefresh={refreshCase} />

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
                  {caseItem.forwardedToRole && (
                    <div>
                      <p className="text-sm text-gray-500">Currently With</p>
                      <p className="font-medium capitalize">{caseItem.forwardedToRole.split('-').join(' ')}</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Description</h3>
                <p className="text-gray-700 leading-relaxed">{caseItem.description}</p>
              </div>
              {caseItem.recommendation && (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Registrar Recommendation</h3>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{caseItem.recommendation}</p>
                  </div>
                </div>
              )}
              {caseItem.verdict && (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Final Verdict</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{caseItem.verdict}</p>
                  </div>
                </div>
              )}
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
                          <p className="text-xs text-gray-500">
                            Uploaded by {doc.uploadedBy}
                            {doc.uploadedByRole && <span className="ml-1 text-gray-400">({doc.uploadedByRole.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')})</span>}
                          </p>
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
                      toast.success('Case deleted successfully');
                      navigate('/cases');
                    } catch (err: any) {
                      toast.error('Delete failed', { description: err?.response?.data?.message || 'Could not delete case' });
                    }
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
function RoleActionPanel({ role, caseItem, isConfidential, onStatusChange, onForward, onRefresh }: {
  role: string;
  caseItem: Case;
  isConfidential: boolean;
  onStatusChange: (status: string, extra?: { verdict?: string; recommendation?: string; note?: string }) => Promise<void>;
  onForward: (targetRole: string, extra?: { note?: string; recommendation?: string; verdict?: string }) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [verdict, setVerdict] = useState('');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [hearingTime, setHearingTime] = useState('');
  const [hearingLocation, setHearingLocation] = useState('');
  const verdictFileInputRef = useRef<HTMLInputElement>(null);
  const [verdictUploading, setVerdictUploading] = useState(false);

  const isClosed = caseItem.status === 'closed' || caseItem.status === 'resolved' || caseItem.status === 'rejected' || caseItem.status === 'police-case';

  const withLoading = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    try { await fn(); } finally { setActionLoading(false); }
  };

  if (isClosed) return null;
  if (caseItem.type === 'type-1') return null;

  // Student can see resubmission feedback and edit the case
  if (role === 'student') {
    if (caseItem.status === 'resubmission-requested') {
      return <StudentResubmitPanel caseItem={caseItem} actionLoading={actionLoading} withLoading={withLoading} onStatusChange={onStatusChange} onRefresh={onRefresh} />;
    }
    return null;
  }

  if (role === 'vc') return null;

  // View-only enforcement: if case hasn't been forwarded to this role, show read-only message
  const roleForwardMap: Record<string, boolean> = {
    'coordinator': !caseItem.forwardedToRole || caseItem.forwardedToRole === 'coordinator' || caseItem.status === 'submitted' || caseItem.status === 'resubmission-requested',
    'female-coordinator': !caseItem.forwardedToRole || caseItem.forwardedToRole === 'female-coordinator' || caseItem.status === 'submitted' || caseItem.status === 'resubmission-requested',
    'proctor': caseItem.forwardedToRole === 'proctor',
    'assistant-proctor': caseItem.forwardedToRole === 'assistant-proctor',
    'deputy-proctor': caseItem.forwardedToRole === 'deputy-proctor',
    'registrar': caseItem.forwardedToRole === 'registrar',
    'disciplinary-committee': caseItem.forwardedToRole === 'disciplinary-committee',
    'sexual-harassment-committee': caseItem.forwardedToRole === 'sexual-harassment-committee',
    'super-admin': true,
  };

  const canAct = roleForwardMap[role] ?? false;
  if (!canAct) {
    return (
      <div className="bg-yellow-50 rounded-xl shadow-md p-4 border border-yellow-200 mb-6">
        <p className="text-sm text-yellow-700">
          This case is currently being handled by <strong>{caseItem.forwardedToRole?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</strong>. You can view the case details but cannot take actions until it is forwarded to you.
        </p>
      </div>
    );
  }

  // Coordinator panel
  if (role === 'coordinator' || role === 'female-coordinator') {
    return <CoordinatorPanel actionLoading={actionLoading} withLoading={withLoading} onStatusChange={onStatusChange} onForward={onForward} caseItem={caseItem} isConfidential={isConfidential} />;
  }

  // Proctor panel
  if (role === 'proctor') {
    return <ProctorPanel actionLoading={actionLoading} withLoading={withLoading} onStatusChange={onStatusChange} onForward={onForward} caseItem={caseItem} />;
  }

  // Assistant Proctor panel
  if (role === 'assistant-proctor') {
    const handleScheduleHearing = async () => {
      if (!hearingDate || !hearingTime || !hearingLocation) return;
      await hearingsApi.create({ caseId: caseItem.id, date: hearingDate, time: hearingTime, location: hearingLocation, participants: [caseItem.studentName] });
      if (caseItem.status !== 'hearing-scheduled') {
        await onStatusChange('hearing-scheduled');
      }
      await onRefresh();
      toast.success('Hearing scheduled successfully');
      setHearingDate(''); setHearingTime(''); setHearingLocation('');
    };
    const handleCreateReport = async () => {
      if (!reportContent.trim()) return;
      await casesApi.createReport(caseItem.id, { content: reportContent, isDraft: true });
      await onRefresh();
      toast.success('Draft report created');
      setReportContent('');
    };
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
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-700 mb-2">Schedule Hearing</p>
            <div className="space-y-2">
              <input type="date" value={hearingDate} onChange={e => setHearingDate(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <input type="time" value={hearingTime} onChange={e => setHearingTime(e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <input type="text" value={hearingLocation} onChange={e => setHearingLocation(e.target.value)} placeholder="Location" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button disabled={actionLoading || !hearingDate || !hearingTime || !hearingLocation} onClick={() => withLoading(handleScheduleHearing)}
                className="w-full px-3 py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">Schedule</button>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-700 mb-2">Draft Report</p>
            <div className="space-y-2">
              <textarea value={reportContent} onChange={e => setReportContent(e.target.value)} placeholder="Write your investigation report..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500" rows={3} />
              <button disabled={actionLoading || !reportContent.trim()} onClick={() => withLoading(handleCreateReport)}
                className="w-full px-3 py-1.5 text-sm rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">Create Draft Report</button>
            </div>
          </div>
        </div>

        <ForwardToRoleSection
          label="Forward to Deputy Proctor"
          targetRole="deputy-proctor"
          fromRole="assistant-proctor"
          caseId={caseItem.id}
          actionLoading={actionLoading}
          withLoading={withLoading}
          onForward={onForward}
        />
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
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
            placeholder="Add your review remarks..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={2}
          />
        </div>

        <ForwardToRoleSection label="Send Back to Asst. Proctor" targetRole="assistant-proctor" fromRole="deputy-proctor" caseId={caseItem.id} actionLoading={actionLoading} withLoading={withLoading} onForward={(r: string, ex?: any) => onForward(r, { ...ex, note: remarks })} />
        <ForwardToRoleSection label="Forward to Proctor" targetRole="proctor" fromRole="deputy-proctor" caseId={caseItem.id} actionLoading={actionLoading} withLoading={withLoading} onForward={(r: string, ex?: any) => onForward(r, { ...ex, note: remarks })} simple />
      </div>
    );
  }

  // Registrar panel
  if (role === 'registrar') {
    return <RegistrarPanel actionLoading={actionLoading} withLoading={withLoading} onForward={onForward} caseItem={caseItem} recommendation={recommendation} setRecommendation={setRecommendation} />;
  }

  // Disciplinary Committee panel
  if (role === 'disciplinary-committee') {
    return <DisciplinaryCommitteePanel actionLoading={actionLoading} withLoading={withLoading} onStatusChange={onStatusChange} onForward={onForward} caseItem={caseItem} onRefresh={onRefresh} verdict={verdict} setVerdict={setVerdict} verdictFileInputRef={verdictFileInputRef} verdictUploading={verdictUploading} setVerdictUploading={setVerdictUploading} />;
  }

  // Female Coordinator panel
  if (role === 'female-coordinator' && isConfidential) {
    return <FemaleCoordinatorPanel actionLoading={actionLoading} withLoading={withLoading} onStatusChange={onStatusChange} onForward={onForward} />;
  }

  // SH Committee panel
  if (role === 'sexual-harassment-committee' && isConfidential) {
    return <SHCommitteePanel actionLoading={actionLoading} withLoading={withLoading} onStatusChange={onStatusChange} onForward={onForward} caseItem={caseItem} onRefresh={onRefresh} investigationNotes={investigationNotes} setInvestigationNotes={setInvestigationNotes} />;
  }

  return null;
}

// Disciplinary Committee panel with rule-based forwarding
function DisciplinaryCommitteePanel({ actionLoading, withLoading, onStatusChange, onForward, caseItem, onRefresh, verdict, setVerdict, verdictFileInputRef, verdictUploading, setVerdictUploading }: {
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onStatusChange: (status: string, extra?: any) => Promise<void>;
  onForward: (targetRole: string, extra?: any) => Promise<void>;
  caseItem: Case;
  onRefresh: () => Promise<void>;
  verdict: string;
  setVerdict: (v: string) => void;
  verdictFileInputRef: React.RefObject<HTMLInputElement | null>;
  verdictUploading: boolean;
  setVerdictUploading: (v: boolean) => void;
}) {
  const [allowedTargets, setAllowedTargets] = useState<string[]>([]);
  useEffect(() => {
    forwardingRulesApi.getForRole('disciplinary-committee').then(res => {
      setAllowedTargets((res.data.data || []).filter((r: any) => r.isActive).map((r: any) => r.toRole));
    }).catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <path d="M14.5 2l6 6-8 8-6-6 8-8z" /><path d="M3 21l4.5-4.5" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: '#0b2652' }}>Disciplinary Committee: Final Verdict</h3>
          <p className="text-xs text-gray-500">Review all evidence and issue final decision</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Final Decision</label>
        <textarea value={verdict} onChange={e => setVerdict(e.target.value)} placeholder="Enter the committee's final decision..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" rows={3} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Attach Documents</label>
        <input ref={verdictFileInputRef} type="file" multiple accept="image/*,video/*,application/pdf,.doc,.docx" onChange={async (e) => {
          if (!e.target.files?.length) return;
          setVerdictUploading(true);
          try {
            for (const file of Array.from(e.target.files)) { await casesApi.addDocument(caseItem.id, file); }
            await onRefresh();
            toast.success('Documents attached successfully');
          } catch (err: any) {
            toast.error('Upload failed', { description: err?.response?.data?.message || 'Could not upload documents' });
          } finally {
            setVerdictUploading(false);
            if (verdictFileInputRef.current) verdictFileInputRef.current.value = '';
          }
        }} className="hidden" />
        <div onClick={() => verdictFileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400">
          <p className="text-sm text-gray-500">{verdictUploading ? 'Uploading...' : 'Click to attach final verdict documents'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {allowedTargets.includes('proctor') && (
          <button disabled={actionLoading} onClick={() => withLoading(() => onForward('proctor'))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600 disabled:opacity-50">
            <ArrowLeftIcon /> Return to Proctor
          </button>
        )}
        {allowedTargets.filter(t => t !== 'proctor').map(target => (
          <button key={target} disabled={actionLoading} onClick={() => withLoading(() => onForward(target))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50">
            <ForwardIcon /> Forward to {target.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
        <button disabled={actionLoading || !verdict.trim()} onClick={() => withLoading(async () => {
          await casesApi.createReport(caseItem.id, { content: verdict, isDraft: false, isFinal: true });
          await onStatusChange('closed', { verdict });
        })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900 disabled:opacity-50">
          <CheckIcon /> Issue Verdict & Close Case
        </button>
        <button onClick={() => window.open(`/cases/${caseItem.id}/report`, '_blank')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">
          <FileIcon /> View / Print Report
        </button>
      </div>
    </div>
  );
}

// Female Coordinator panel with rule-based forwarding
function FemaleCoordinatorPanel({ actionLoading, withLoading, onStatusChange, onForward }: {
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onStatusChange: (status: string, extra?: any) => Promise<void>;
  onForward: (targetRole: string, extra?: any) => Promise<void>;
}) {
  const [allowedTargets, setAllowedTargets] = useState<string[]>([]);
  useEffect(() => {
    forwardingRulesApi.getForRole('female-coordinator').then(res => {
      setAllowedTargets((res.data.data || []).filter((r: any) => r.isActive).map((r: any) => r.toRole));
    }).catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-red-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><LockIcon /></div>
        <div>
          <h3 className="font-semibold text-red-700">Female Coordinator: Confidential Review</h3>
          <p className="text-xs text-red-500">Review and forward case</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {allowedTargets.includes('sexual-harassment-committee') && (
          <button disabled={actionLoading} onClick={() => withLoading(async () => { await onStatusChange('verified'); await onForward('sexual-harassment-committee'); })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">
            <ForwardIcon /> Verify & Forward to SH Committee
          </button>
        )}
        {allowedTargets.includes('proctor') && (
          <button disabled={actionLoading} onClick={() => withLoading(async () => { await onStatusChange('verified'); await onForward('proctor'); })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50" style={{ backgroundColor: '#0b2652' }}>
            <ForwardIcon /> Verify & Forward to Proctor
          </button>
        )}
        <button disabled={actionLoading} onClick={() => withLoading(() => onStatusChange('resubmission-requested'))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600 disabled:opacity-50">
          <RefreshIcon /> Request More Information
        </button>
      </div>
    </div>
  );
}

// SH Committee panel with rule-based forwarding
function SHCommitteePanel({ actionLoading, withLoading, onStatusChange, onForward, caseItem, onRefresh, investigationNotes, setInvestigationNotes }: {
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onStatusChange: (status: string, extra?: any) => Promise<void>;
  onForward: (targetRole: string, extra?: any) => Promise<void>;
  caseItem: Case;
  onRefresh: () => Promise<void>;
  investigationNotes: string;
  setInvestigationNotes: (v: string) => void;
}) {
  const [allowedTargets, setAllowedTargets] = useState<string[]>([]);
  useEffect(() => {
    forwardingRulesApi.getForRole('sexual-harassment-committee').then(res => {
      setAllowedTargets((res.data.data || []).filter((r: any) => r.isActive).map((r: any) => r.toRole));
    }).catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-red-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><LockIcon /></div>
        <div>
          <h3 className="font-semibold text-red-700">SH Committee: Investigation & Decision</h3>
          <p className="text-xs text-red-500">Conduct investigation and issue decision</p>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Notes</label>
        <textarea value={investigationNotes} onChange={e => setInvestigationNotes(e.target.value)}
          placeholder="Add investigation findings..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" rows={3} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button disabled={actionLoading || !investigationNotes.trim()} onClick={() => withLoading(async () => {
          await casesApi.createReport(caseItem.id, { content: investigationNotes, isDraft: false });
          await onRefresh(); setInvestigationNotes('');
        })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
          <SendIcon /> Add Investigation Report
        </button>
        <button disabled={actionLoading || !investigationNotes.trim()} onClick={() => withLoading(() => onStatusChange('resolved', { verdict: investigationNotes }))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">
          <CheckIcon /> Issue Decision
        </button>
        <button disabled={actionLoading} onClick={() => withLoading(() => onStatusChange('closed'))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900 disabled:opacity-50">
          <CheckIcon /> Close Case
        </button>
        {allowedTargets.includes('registrar') && (
          <button disabled={actionLoading} onClick={() => withLoading(() => onForward('registrar'))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700 disabled:opacity-50">
            <ForwardIcon /> Forward to Registrar
          </button>
        )}
        {allowedTargets.filter(t => t !== 'registrar').map(target => (
          <button key={target} disabled={actionLoading} onClick={() => withLoading(() => onForward(target))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50">
            <ForwardIcon /> Forward to {target.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

// Proctor panel using shared ForwardToRoleSection + dynamic forwarding rules
function ProctorPanel({ actionLoading, withLoading, onStatusChange, onForward, caseItem }: {
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onStatusChange: (status: string, extra?: any) => Promise<void>;
  onForward: (targetRole: string, extra?: any) => Promise<void>;
  caseItem: Case;
}) {
  const [allowedTargets, setAllowedTargets] = useState<string[]>([]);

  useEffect(() => {
    forwardingRulesApi.getForRole('proctor').then(res => {
      const rules = res.data.data || [];
      setAllowedTargets(rules.filter((r: any) => r.isActive).map((r: any) => r.toRole));
    }).catch(() => {});
  }, []);

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

      <div className="flex flex-wrap gap-2 mb-4">
        <button disabled={actionLoading} onClick={() => withLoading(() => onStatusChange('resolved'))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50">
          <CheckIcon /> Resolve Case
        </button>
        <button disabled={actionLoading} onClick={() => withLoading(() => onStatusChange('police-case'))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 text-white text-sm hover:bg-red-800 disabled:opacity-50">
          <XIcon /> Mark as Police Case
        </button>
        {allowedTargets.includes('registrar') && (
          <button disabled={actionLoading} onClick={() => withLoading(() => onForward('registrar'))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700 disabled:opacity-50">
            <ForwardIcon /> Forward to Registrar
          </button>
        )}
      </div>

      {allowedTargets.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">Assign / Forward to:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allowedTargets.filter(t => t !== 'registrar').map(target => (
              <ForwardToRoleSection
                key={target}
                label={target.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                targetRole={target}
                fromRole="proctor"
                caseId={caseItem.id}
                actionLoading={actionLoading}
                withLoading={withLoading}
                onForward={onForward}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Registrar panel with dynamic forwarding rules
function RegistrarPanel({ actionLoading, withLoading, onForward, caseItem, recommendation, setRecommendation }: {
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onForward: (targetRole: string, extra?: any) => Promise<void>;
  caseItem: Case;
  recommendation: string;
  setRecommendation: (v: string) => void;
}) {
  const [allowedTargets, setAllowedTargets] = useState<string[]>([]);

  useEffect(() => {
    forwardingRulesApi.getForRole('registrar').then(res => {
      const rules = res.data.data || [];
      setAllowedTargets(rules.filter((r: any) => r.isActive).map((r: any) => r.toRole));
    }).catch(() => {});
  }, []);

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
        <textarea value={recommendation} onChange={e => setRecommendation(e.target.value)}
          placeholder="Enter your recommendation for this case..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          rows={3}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {allowedTargets.includes('proctor') && (
          <button disabled={actionLoading || !recommendation.trim()} onClick={() => withLoading(() => onForward('proctor', { recommendation }))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600 disabled:opacity-50">
            <ArrowLeftIcon /> Send Back with Recommendation
          </button>
        )}
      </div>
      {allowedTargets.filter(t => t !== 'proctor').map(target => (
        <ForwardToRoleSection
          key={target}
          label={`Forward to ${target.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
          targetRole={target}
          fromRole="registrar"
          caseId={caseItem.id}
          actionLoading={actionLoading}
          withLoading={withLoading}
          onForward={(r: string, ex?: any) => onForward(r, { ...ex, recommendation })}
        />
      ))}
    </div>
  );
}

// Coordinator panel with dynamic checklist
function CoordinatorPanel({ actionLoading, withLoading, onStatusChange, onForward, caseItem, isConfidential }: {
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onStatusChange: (status: string, extra?: any) => Promise<void>;
  onForward: (targetRole: string, extra?: any) => Promise<void>;
  caseItem: Case;
  isConfidential: boolean;
}) {
  const [checklistItems, setChecklistItems] = useState<{ id: string; label: string }[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    checklistApi.getAll().then(res => {
      const items = res.data.data || [];
      const itemsArray = Array.isArray(items) ? items : [];
      setChecklistItems(itemsArray);
      // Default all to checked
      const defaults: Record<string, boolean> = {};
      itemsArray.forEach((item: any) => { defaults[item.id] = true; });
      setCheckedItems(defaults);
    }).catch(() => {
      // Fallback to default items
      const defaults = [
        { id: '1', label: 'Student identity verified' },
        { id: '2', label: 'All required documents attached' },
        { id: '3', label: 'Incident description is complete' },
        { id: '4', label: 'Evidence is valid and relevant' },
        { id: '5', label: 'No duplicate case exists' },
      ];
      setChecklistItems(defaults);
      const checked: Record<string, boolean> = {};
      defaults.forEach(d => { checked[d.id] = true; });
      setCheckedItems(checked);
    });
  }, []);

  const handleResubmission = async () => {
    const failedItems = checklistItems.filter(item => !checkedItems[item.id]).map(item => item.label);
    const resultsJson = JSON.stringify(checklistItems.map(item => ({
      label: item.label,
      passed: !!checkedItems[item.id]
    })));

    await checklistApi.createVerification(caseItem.id, {
      comment: comment || 'Resubmission requested',
      checklistResultsJson: resultsJson
    });
    await onStatusChange('resubmission-requested', { note: comment || `Resubmission requested. Failed items: ${failedItems.join(', ')}` });
  };

  const forwardTarget = isConfidential ? 'sexual-harassment-committee' : 'proctor';

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

      {/* Dynamic Verification Checklist */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Verification Checklist:</p>
        <div className="space-y-2">
          {checklistItems.map((item) => (
            <label key={item.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={!!checkedItems[item.id]}
                onChange={e => setCheckedItems(prev => ({ ...prev, [item.id]: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Comment textbox */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Comment (for resubmission)</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Add comments for the student..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          rows={2}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button disabled={actionLoading} onClick={() => withLoading(async () => { await onStatusChange('verified'); await onForward(forwardTarget); })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50">
          <CheckIcon /> Accept & Forward
        </button>
        <button disabled={actionLoading} onClick={() => withLoading(() => onStatusChange('rejected'))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">
          <XIcon /> Reject
        </button>
        <button disabled={actionLoading} onClick={() => withLoading(() => onStatusChange('on-hold'))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-50">
          <ClockIcon /> Hold
        </button>
        <button disabled={actionLoading} onClick={() => withLoading(handleResubmission)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-300 text-orange-700 text-sm hover:bg-orange-50 disabled:opacity-50">
          <RefreshIcon /> Request Resubmission
        </button>
      </div>
    </div>
  );
}

// Student resubmission panel with editable fields
function StudentResubmitPanel({ caseItem, actionLoading, withLoading, onStatusChange, onRefresh }: {
  caseItem: Case;
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onStatusChange: (status: string, extra?: any) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [description, setDescription] = useState(caseItem.description);
  const [saving, setSaving] = useState(false);

  const handleResubmit = async () => {
    setSaving(true);
    try {
      // Update the case description if changed
      if (description !== caseItem.description) {
        await casesApi.update(caseItem.id, { description });
      }
      await onStatusChange('submitted');
      toast.success('Case resubmitted successfully');
    } catch (err: any) {
      toast.error('Resubmit failed', { description: err?.response?.data?.message || 'Could not resubmit case' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-orange-50 rounded-xl shadow-md p-6 border border-orange-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
          <RefreshIcon />
        </div>
        <div>
          <h3 className="font-semibold text-orange-700">Resubmission Requested</h3>
          <p className="text-xs text-orange-600">The coordinator has requested changes to your case. Edit and resubmit below.</p>
        </div>
      </div>

      {/* Coordinator Comments */}
      {caseItem.notes.length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4 border border-orange-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Coordinator Comments:</p>
          <p className="text-sm text-gray-700">{caseItem.notes[caseItem.notes.length - 1].content}</p>
          <p className="text-xs text-gray-500 mt-1">by {caseItem.notes[caseItem.notes.length - 1].author}</p>
        </div>
      )}

      {/* Editable Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Edit Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          rows={5}
        />
      </div>

      <button disabled={actionLoading || saving || !description.trim()} onClick={() => withLoading(handleResubmit)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50">
        <SendIcon /> Resubmit Case
      </button>
    </div>
  );
}

// Reusable forward-to-role section with searchable user picker
// Checks forwarding rules - renders nothing if no rule allows this forward
function ForwardToRoleSection({ label, targetRole, fromRole, caseId, actionLoading, withLoading, onForward, simple }: {
  label: string;
  targetRole: string;
  fromRole?: string;
  caseId: string;
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onForward: (targetRole: string, extra?: any) => Promise<void>;
  simple?: boolean;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [ruleAllowed, setRuleAllowed] = useState<boolean | null>(null); // null = loading
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    usersApi.getByRole(targetRole).then(res => setUsers(res.data.data || [])).catch(() => {});
  }, [targetRole]);

  // Check if forwarding rule exists for fromRole -> targetRole
  useEffect(() => {
    if (!fromRole) { setRuleAllowed(true); return; }
    forwardingRulesApi.getForRole(fromRole).then(res => {
      const rules = res.data.data || [];
      const allowed = rules.some((r: any) => r.toRole === targetRole && r.isActive);
      setRuleAllowed(allowed);
    }).catch(() => setRuleAllowed(true));
  }, [fromRole, targetRole]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if rule check says not allowed (AFTER all hooks)
  if (ruleAllowed === false) return null;
  if (ruleAllowed === null) return null;

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleForwardSelected = async () => {
    if (selectedUsers.length === 0) return;
    if (selectedUsers.length === 1) {
      await casesApi.forward(caseId, { targetRole, assignedToUserId: selectedUsers[0] });
    } else {
      for (const uid of selectedUsers) {
        await casesApi.forward(caseId, { targetRole, assignedToUserId: uid });
      }
    }
  };

  const handleForwardAll = async () => {
    await casesApi.forward(caseId, { targetRole, forwardToAll: true });
  };

  const roleLabel = targetRole.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Simple mode: just a forward button without user selection (for single-person roles like proctor, registrar)
  if (simple || users.length <= 1) {
    return (
      <div className="flex flex-wrap gap-2 mb-2">
        <button disabled={actionLoading} onClick={() => withLoading(() => onForward(targetRole))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50" style={{ backgroundColor: '#0b2652' }}>
          <ForwardIcon /> {label}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-3">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>

      {/* Searchable multi-select dropdown */}
      <div className="relative mb-3" ref={dropdownRef}>
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm cursor-pointer flex items-center justify-between min-h-[38px]"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedUsers.length === 0 ? (
              <span className="text-gray-400">Search and select {roleLabel}...</span>
            ) : (
              selectedUsers.map(uid => {
                const u = users.find(x => x.id === uid);
                return u ? (
                  <span key={uid} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    {u.name}
                    <button onClick={(e) => { e.stopPropagation(); toggleUser(uid); }} className="hover:text-blue-900">&times;</button>
                  </span>
                ) : null;
              })
            )}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        {showDropdown && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            </div>
            {filteredUsers.length === 0 ? (
              <div className="p-3 text-sm text-gray-400 text-center">No users found</div>
            ) : (
              filteredUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedUsers.includes(u.id) ? 'bg-blue-50' : ''}`}
                >
                  <input type="checkbox" checked={selectedUsers.includes(u.id)} readOnly className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                  <span className="font-medium">{u.name}</span>
                  <span className="text-gray-400 text-xs">{u.email}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          disabled={actionLoading || selectedUsers.length === 0}
          onClick={() => withLoading(handleForwardSelected)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <ForwardIcon /> Assign Selected ({selectedUsers.length})
        </button>
        <button
          disabled={actionLoading}
          onClick={() => withLoading(handleForwardAll)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <ForwardIcon /> Forward to All {roleLabel}
        </button>
      </div>
    </div>
  );
}
