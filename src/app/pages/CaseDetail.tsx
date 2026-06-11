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
import HearingCountdown from '../components/HearingCountdown';

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
  const [newInfo, setNewInfo] = useState('');
  const [addingInfo, setAddingInfo] = useState(false);
  const [caseItem, setCaseItem] = useState<Case | null | undefined>(undefined);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const permissions = usePermissions();
  const canDelete = permissions['cases']?.canDelete ?? false;

  // Acknowledge dialog
  const [showAckDialog, setShowAckDialog] = useState(false);
  const [ackComment, setAckComment] = useState('');
  const [ackSubmitting, setAckSubmitting] = useState(false);

  // Multi-assignment dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [primaryAssigneeId, setPrimaryAssigneeId] = useState<string>('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  // Dynamic case-assignment permission (Settings → Forwarding → Case Assignment Permission)
  const [canAssign, setCanAssign] = useState(false);

  useEffect(() => {
    const r = currentUser?.role;
    if (!r) { setCanAssign(false); return; }
    forwardingRulesApi.getSpecial(r)
      .then(res => setCanAssign(!!res.data.data?.canAssign))
      .catch(() => setCanAssign(false));
  }, [currentUser?.role]);

  useEffect(() => {
    const fetchCase = async () => {
      setLoading(true);
      try {
        const response = await casesApi.getById(id!);
        setCaseItem(response.data.data || response.data);
        // Also fetch coordinator checklist verifications for this case
        try {
          const vRes = await checklistApi.getVerifications(id!);
          setVerifications(vRes.data.data || []);
        } catch { setVerifications([]); }
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

  const handleAddInfo = async () => {
    if (!newInfo.trim() || !caseItem) return;
    setAddingInfo(true);
    try {
      await casesApi.addAdditionalInfo(caseItem.id, newInfo.trim());
      const response = await casesApi.getById(caseItem.id);
      setCaseItem(response.data.data || response.data);
      setNewInfo('');
      toast.success('Additional information added');
    } catch (err: any) {
      toast.error('Could not add information', { description: err?.response?.data?.message || 'Try again' });
    } finally {
      setAddingInfo(false);
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
      try {
        const vRes = await checklistApi.getVerifications(caseItem.id);
        setVerifications(vRes.data.data || []);
      } catch { /* silent */ }
    } catch { /* silent */ }
  };

  const handleAcknowledge = async () => {
    if (!caseItem) return;
    setAckSubmitting(true);
    try {
      await casesApi.acknowledge(caseItem.id, ackComment.trim());
      toast.success('Incident acknowledged');
      setShowAckDialog(false);
      setAckComment('');
      await refreshCase();
    } catch (err: any) {
      toast.error('Acknowledge failed', { description: err?.response?.data?.message || 'Could not acknowledge' });
    } finally {
      setAckSubmitting(false);
    }
  };

  const openAssignDialog = async () => {
    if (!caseItem) return;
    try {
      const [aRes, dRes] = await Promise.all([
        usersApi.getByRole('assistant-proctor'),
        usersApi.getByRole('deputy-proctor'),
      ]);
      const combined: User[] = [
        ...(aRes.data?.data || []),
        ...(dRes.data?.data || []),
      ];
      setAssignableUsers(combined);
      const existing = (caseItem.assignments || []).filter(a => a.isActive);
      setSelectedAssigneeIds(existing.map(a => a.userId));
      setPrimaryAssigneeId(existing.find(a => a.isPrimary)?.userId || '');
      setShowAssignDialog(true);
    } catch (err: any) {
      toast.error('Failed to load users', { description: err?.response?.data?.message || '' });
    }
  };

  const handleAssign = async () => {
    if (!caseItem) return;
    if (selectedAssigneeIds.length === 0) {
      toast.error('Select at least one user');
      return;
    }
    setAssignSubmitting(true);
    try {
      await casesApi.assign(caseItem.id, selectedAssigneeIds, primaryAssigneeId || undefined);
      toast.success('Assignments updated');
      setShowAssignDialog(false);
      await refreshCase();
    } catch (err: any) {
      toast.error('Assignment failed', { description: err?.response?.data?.message || 'Could not assign' });
    } finally {
      setAssignSubmitting(false);
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
  const isOwnSubmission = !!currentUser?.id && (
    caseItem.submittedByUserId === currentUser.id ||
    caseItem.studentId === currentUser.id
  );
  const isAssignedToMe = !!currentUser?.name && caseItem.assignedTo === currentUser.name;
  const isInMyRoleQueue = !!currentUser?.role && caseItem.forwardedToRole === currentUser.role;
  const isActiveAssignee = (caseItem.assignments || []).some(a => a.isActive && (a.userId === currentUser?.id || a.userName === currentUser?.name));
  // Owner student OR any staff the case has been forwarded/assigned to may edit case info.
  const canEditCase = (isOwnSubmission && currentUser?.role === 'student')
    || isAssignedToMe || isInMyRoleQueue || isActiveAssignee
    || currentUser?.role === 'super-admin';
  // Associated staff (not the student/VC) may append additional information to the case.
  const canAddInfo = !!currentUser?.role
    && currentUser.role !== 'student' && currentUser.role !== 'vc'
    && (isAssignedToMe || isInMyRoleQueue || isActiveAssignee || currentUser.role === 'super-admin');
  const hasConfidentialMenu = permissions['confidential']?.canRead === true;
  const canViewConfidential = isOwnSubmission
    || isAssignedToMe
    || isInMyRoleQueue
    || hasConfidentialMenu
    || currentUser?.role === 'super-admin';

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

  const allTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'hearing', label: 'Hearing' },
    { id: 'notes', label: 'Notes' },
    { id: 'timeline', label: 'Activity Timeline' }
  ] as const;
  // Type-1 (instant incident) cases have no hearings, so hide that tab.
  const tabs = caseItem.type === 'type-1'
    ? allTabs.filter(t => t.id !== 'hearing')
    : allTabs;

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
          <div className="flex flex-col gap-3 items-end">
            {(() => {
              const upcoming = (caseItem.hearings || [])
                .filter(h => h.status === 'scheduled' && h.date)
                .map(h => {
                  const dt = new Date(`${h.date}T${h.time && h.time.length === 5 ? h.time + ':00' : h.time || '00:00:00'}`);
                  return { hearing: h, dt };
                })
                .filter(x => !isNaN(x.dt.getTime()) && x.dt.getTime() > Date.now())
                .sort((a, b) => a.dt.getTime() - b.dt.getTime())[0];
              return upcoming ? <HearingCountdown date={upcoming.hearing.date} time={upcoming.hearing.time} /> : null;
            })()}
            <div className="flex flex-wrap gap-2 justify-end">
              {canEditCase && (
                <button
                  onClick={() => navigate(`/cases/${caseItem.id}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
                >
                  Edit Case
                </button>
              )}
              {caseItem.type === 'type-1' && !caseItem.isAcknowledged && ['proctor', 'assistant-proctor', 'deputy-proctor', 'coordinator', 'female-coordinator', 'super-admin'].includes(currentUser?.role || '') && (
                <button
                  onClick={() => setShowAckDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                >
                  <CheckIcon /> Acknowledge
                </button>
              )}
              {canAssign && (
                <button
                  onClick={openAssignDialog}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-sm hover:bg-blue-100"
                >
                  Manage Assignments
                </button>
              )}
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
                    <p className="text-sm text-gray-500">Primary Assignee</p>
                    <p className="font-medium">{caseItem.assignedTo || 'Not assigned'}</p>
                  </div>
                  {caseItem.categoryName && (
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">
                        {caseItem.categoryName}
                        {caseItem.categoryIsConfidential && (
                          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                            <LockIcon /> Confidential
                          </span>
                        )}
                      </p>
                    </div>
                  )}
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
                  {caseItem.incidentDate && (
                    <div>
                      <p className="text-sm text-gray-500">Incident Date &amp; Time</p>
                      <p className="font-medium">{new Date(caseItem.incidentDate).toLocaleString()}</p>
                    </div>
                  )}
                  {caseItem.videoLink && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Video Evidence Link</p>
                      <a href={caseItem.videoLink} target="_blank" rel="noreferrer" className="font-medium text-blue-600 break-all hover:underline">
                        {caseItem.videoLink}
                      </a>
                    </div>
                  )}
                  {caseItem.forwardedToRole && (
                    <div>
                      <p className="text-sm text-gray-500">Currently With</p>
                      <p className="font-medium capitalize">{caseItem.forwardedToRole.split('-').join(' ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {(caseItem.incidentLatitude != null || caseItem.incidentLocationDescription) && (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Incident Location</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {caseItem.incidentLocationDescription && (
                      <p className="text-gray-700">{caseItem.incidentLocationDescription}</p>
                    )}
                    {caseItem.incidentLatitude != null && caseItem.incidentLongitude != null && (
                      <>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500">
                            {caseItem.incidentLatitude.toFixed(6)}, {caseItem.incidentLongitude.toFixed(6)}
                          </span>
                          <a
                            href={`https://maps.google.com/?q=${caseItem.incidentLatitude},${caseItem.incidentLongitude}`}
                            target="_blank" rel="noreferrer"
                            className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Open in Google Maps
                          </a>
                        </div>
                        <iframe
                          title="Incident location map"
                          className="w-full h-64 rounded-lg border border-gray-200"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://maps.google.com/maps?q=${caseItem.incidentLatitude},${caseItem.incidentLongitude}&z=16&output=embed`}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {caseItem.isAcknowledged && (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Acknowledgment</h3>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-1">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-emerald-700">Received — taking action shortly.</span>
                      {caseItem.acknowledgedByName && <> Acknowledged by <strong>{caseItem.acknowledgedByName}</strong></>}
                      {caseItem.acknowledgedAt && <> on {new Date(caseItem.acknowledgedAt).toLocaleString()}</>}
                    </p>
                    {caseItem.acknowledgmentComment && (
                      <p className="text-gray-700">{caseItem.acknowledgmentComment}</p>
                    )}
                  </div>
                </div>
              )}

              {caseItem.assignments && caseItem.assignments.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Assigned Officers ({caseItem.assignments.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {caseItem.assignments.map(a => (
                      <span key={a.id} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${a.isPrimary ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        {a.userName}
                        <span className="text-xs text-gray-500">({a.userRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')})</span>
                        {a.isPrimary && <span className="text-xs font-semibold">★ Primary</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submitter / student info (works for both Type-1 and Type-2) */}
              {(caseItem.studentName || caseItem.studentId || caseItem.studentDepartment || caseItem.studentContact || caseItem.studentAdvisorName || caseItem.studentFatherName) && (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Submitter / Student Information</h3>
                  {(caseItem.studentName || caseItem.studentContact) && (
                    <div className="space-y-2 mb-3 rounded-lg p-4 text-white" style={{ backgroundColor: '#0b2652' }}>
                      {caseItem.studentName && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-blue-200">Name</p>
                          <p className="text-lg font-semibold">{caseItem.studentName}</p>
                        </div>
                      )}
                      {caseItem.studentContact && (
                        <div>
                          <p className="text-xs uppercase tracking-wide text-blue-200">Phone</p>
                          <a href={`tel:${caseItem.studentContact}`} className="text-lg font-semibold underline-offset-2 hover:underline">
                            {caseItem.studentContact}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4 text-sm">
                    {caseItem.studentName && <div><span className="text-gray-500">Name: </span><span className="font-medium">{caseItem.studentName}</span></div>}
                    {caseItem.studentId && <div><span className="text-gray-500">Student ID: </span><span className="font-medium">{caseItem.studentId}</span></div>}
                    {caseItem.studentDepartment && <div><span className="text-gray-500">Department: </span><span className="font-medium">{caseItem.studentDepartment}</span></div>}
                    {caseItem.studentContact && <div><span className="text-gray-500">Contact: </span><span className="font-medium">{caseItem.studentContact}</span></div>}
                    {caseItem.studentAdvisorName && <div><span className="text-gray-500">Advisor: </span><span className="font-medium">{caseItem.studentAdvisorName}</span></div>}
                    {caseItem.studentFatherName && <div><span className="text-gray-500">Father's Name: </span><span className="font-medium">{caseItem.studentFatherName}</span></div>}
                    {caseItem.studentFatherContact && <div><span className="text-gray-500">Father's Contact: </span><span className="font-medium">{caseItem.studentFatherContact}</span></div>}
                  </div>
                </div>
              )}

              {(caseItem.complainants?.length || 0) > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Complainants ({caseItem.complainants!.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {caseItem.complainants!.map((c) => (
                      <div key={c.id} className="border border-gray-200 rounded-lg overflow-hidden text-sm">
                        <div className="p-3 text-white space-y-2" style={{ backgroundColor: '#0b2652' }}>
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-wide text-blue-200">Name</p>
                            <p className="text-base font-semibold">{c.name} {c.studentId && <span className="text-blue-200 text-xs font-normal">({c.studentId})</span>}</p>
                          </div>
                          {c.contact && (
                            <div>
                              <p className="text-[11px] uppercase tracking-wide text-blue-200">Phone</p>
                              <a href={`tel:${c.contact}`} className="text-base font-semibold underline-offset-2 hover:underline">{c.contact}</a>
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-0.5">
                          {c.department && <p className="text-gray-600">Dept: {c.department}</p>}
                          {c.advisorName && <p className="text-gray-600">Advisor: {c.advisorName}</p>}
                          {c.fatherName && <p className="text-gray-600">Father: {c.fatherName} {c.fatherContact && `(${c.fatherContact})`}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(caseItem.accusedPersons?.length || 0) > 0 ? (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Accused Persons ({caseItem.accusedPersons!.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {caseItem.accusedPersons!.map((a) => (
                      <div key={a.id} className="border border-orange-200 bg-orange-50/50 rounded-lg p-3 text-sm space-y-0.5">
                        <p className="font-medium">{a.name} {a.accusedStudentId && <span className="text-gray-400 text-xs">({a.accusedStudentId})</span>}</p>
                        {a.department && <p className="text-gray-600">Dept: {a.department}</p>}
                        {a.contact && <p className="text-gray-600">Contact: {a.contact}</p>}
                        {a.guardianContact && <p className="text-gray-600">Guardian: {a.guardianContact}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (caseItem.accusedName || caseItem.accusedId || caseItem.accusedDepartment || caseItem.accusedContact || caseItem.accusedGuardianContact) ? (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Accused Person</h3>
                  <div className="border border-orange-200 bg-orange-50/50 rounded-lg p-3 text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
                    {caseItem.accusedName && <div><span className="text-gray-500">Name: </span><span className="font-medium">{caseItem.accusedName}</span></div>}
                    {caseItem.accusedId && <div><span className="text-gray-500">ID: </span><span className="font-medium">{caseItem.accusedId}</span></div>}
                    {caseItem.accusedDepartment && <div><span className="text-gray-500">Dept: </span><span className="font-medium">{caseItem.accusedDepartment}</span></div>}
                    {caseItem.accusedContact && <div><span className="text-gray-500">Contact: </span><span className="font-medium">{caseItem.accusedContact}</span></div>}
                    {caseItem.accusedGuardianContact && <div className="md:col-span-2"><span className="text-gray-500">Guardian Contact: </span><span className="font-medium">{caseItem.accusedGuardianContact}</span></div>}
                  </div>
                </div>
              ) : null}

              <div>
                <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{caseItem.description}</p>
              </div>

              {/* Additional Information — appended by associated staff after submission */}
              {(canAddInfo || (caseItem.additionalInfos?.length || 0) > 0) && (
                <div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: '#0b2652' }}>Additional Information</h3>

                  {canAddInfo && (
                    <div className="border border-gray-200 rounded-lg p-4 mb-3">
                      <textarea
                        value={newInfo}
                        onChange={(e) => setNewInfo(e.target.value)}
                        placeholder="Add new information to this case…"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      />
                      <button
                        onClick={handleAddInfo}
                        disabled={addingInfo || !newInfo.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50"
                        style={{ backgroundColor: '#0b2652' }}
                      >
                        <SendIcon />
                        {addingInfo ? 'Adding…' : 'Add Information'}
                      </button>
                    </div>
                  )}

                  {(caseItem.additionalInfos?.length || 0) === 0 ? (
                    <p className="text-sm text-gray-400">No additional information added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {caseItem.additionalInfos!.map((info) => (
                        <div key={info.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-medium text-gray-800">
                              {info.author}
                              {info.authorRole && <span className="ml-2 text-xs text-gray-500 capitalize">{info.authorRole.split('-').join(' ')}</span>}
                            </p>
                            <p className="text-xs text-gray-500">{new Date(info.createdDate).toLocaleString()}</p>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{info.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
          {activeTab === 'hearing' && caseItem.type !== 'type-1' && (
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

              {/* Add Note - any assigned officer (or any non-student/non-VC role) can add */}
              {(role !== 'student' && role !== 'vc') && (
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

              {/* Coordinator checklist verifications (rendered above regular notes) */}
              {verifications.length > 0 && (
                <div className="space-y-4 mb-4">
                  {verifications.map((v: any) => {
                    let items: { label: string; passed: boolean }[] = [];
                    try { items = JSON.parse(v.checklistResultsJson || '[]'); } catch { items = []; }
                    return (
                      <div key={v.id} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <p className="font-medium text-orange-700">Coordinator Checklist Verification — {v.createdByName || 'Coordinator'}</p>
                          <p className="text-sm text-gray-500">{new Date(v.createdAt).toLocaleString()}</p>
                        </div>
                        {v.comment && (
                          <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{v.comment}</p>
                        )}
                        {items.length > 0 && (
                          <ul className="space-y-1">
                            {items.map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                {item.passed ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs">✓</span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs">✕</span>
                                )}
                                <span className={item.passed ? 'text-gray-700' : 'text-red-700 line-through'}>{item.label}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {caseItem.notes.length === 0 && verifications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No notes added yet</p>
              ) : (
                <div className="space-y-4">
                  {caseItem.notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <p className="font-medium">{note.author}</p>
                        <p className="text-sm text-gray-500">{new Date(note.createdDate).toLocaleString()}</p>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
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

      {/* Acknowledge dialog */}
      {showAckDialog && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAckDialog(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0b2652' }}>Acknowledge Incident</h3>
              <p className="text-sm text-gray-600 mb-4">Send a quick "received — taking action shortly" note to the student.</p>
              <textarea
                value={ackComment}
                onChange={(e) => setAckComment(e.target.value)}
                rows={3}
                placeholder="Received — taking action shortly. Please standby for further updates."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowAckDialog(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleAcknowledge}
                  disabled={ackSubmitting || !ackComment.trim()}
                  className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {ackSubmitting ? 'Acknowledging…' : 'Acknowledge & Notify Student'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assignment dialog */}
      {showAssignDialog && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowAssignDialog(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-auto">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0b2652' }}>Manage Assignments</h3>
              <p className="text-sm text-gray-600 mb-4">Assign one or more Assistant or Deputy Proctors. Mark one as primary.</p>
              <div className="space-y-2 mb-4">
                {assignableUsers.length === 0 ? (
                  <p className="text-sm text-gray-500">No assignable users found.</p>
                ) : assignableUsers.map(u => {
                  const checked = selectedAssigneeIds.includes(u.id);
                  return (
                    <label key={u.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedAssigneeIds(prev => e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id));
                          if (!e.target.checked && primaryAssigneeId === u.id) setPrimaryAssigneeId('');
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                      </div>
                      {checked && (
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="primary"
                            checked={primaryAssigneeId === u.id}
                            onChange={() => setPrimaryAssigneeId(u.id)}
                          />
                          Primary
                        </label>
                      )}
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowAssignDialog(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={handleAssign}
                  disabled={assignSubmitting || selectedAssigneeIds.length === 0}
                  className="px-4 py-2 text-sm rounded-lg text-white hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: '#0b2652' }}
                >
                  {assignSubmitting ? 'Saving…' : 'Save Assignments'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
  const { currentUser } = useAuth();
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
  const [canHearing, setCanHearing] = useState(false);

  useEffect(() => {
    if (!role) return;
    forwardingRulesApi.getSpecial(role).then(res => {
      setCanHearing(!!res.data.data?.canHearing);
    }).catch(() => {});
  }, [role]);

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
    // Coordinators act on cases routed to their role (gender-based) or not-yet-routed (legacy).
    // The specific assigned coordinator is additionally covered by isActiveAssignee below.
    'coordinator': !caseItem.forwardedToRole || caseItem.forwardedToRole === 'coordinator',
    'female-coordinator': !caseItem.forwardedToRole || caseItem.forwardedToRole === 'female-coordinator',
    'proctor': caseItem.forwardedToRole === 'proctor',
    'assistant-proctor': caseItem.forwardedToRole === 'assistant-proctor',
    'deputy-proctor': caseItem.forwardedToRole === 'deputy-proctor',
    'registrar': caseItem.forwardedToRole === 'registrar',
    'disciplinary-committee': caseItem.forwardedToRole === 'disciplinary-committee',
    'sexual-harassment-committee': caseItem.forwardedToRole === 'sexual-harassment-committee',
    'super-admin': true,
  };

  // A user can also act when the case is directly assigned to them (primary or co-assignee),
  // not only when it sits in their role's forward queue. This lets all assigned/forwarded
  // officers share the case — e.g. an assistant proctor assigned to a case can schedule a
  // hearing or add to it, the same as the rest of the team.
  const isActiveAssignee =
    caseItem.assignedTo === currentUser?.name ||
    (caseItem.assignments || []).some(a => a.isActive && (a.userId === currentUser?.id || a.userName === currentUser?.name));
  const canAct = (roleForwardMap[role] ?? false) || isActiveAssignee;
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
    return (
      <>
        <HearingScheduleSection caseItem={caseItem} canHearing={canHearing} onRefresh={onRefresh} />
        <CoordinatorPanel actionLoading={actionLoading} withLoading={withLoading} onStatusChange={onStatusChange} onForward={onForward} caseItem={caseItem} isConfidential={isConfidential} />
      </>
    );
  }

  // Proctor panel
  if (role === 'proctor') {
    return (
      <>
        <HearingScheduleSection caseItem={caseItem} canHearing={canHearing} onRefresh={onRefresh} />
        <ProctorPanel actionLoading={actionLoading} withLoading={withLoading} onStatusChange={onStatusChange} onForward={onForward} caseItem={caseItem} />
      </>
    );
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

        <div className={`grid grid-cols-1 ${canHearing ? 'sm:grid-cols-2' : ''} gap-4 mb-4`}>
          {canHearing && (
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
          )}
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

        <UnifiedForwardSection
          fromRole="assistant-proctor"
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
      <>
      <HearingScheduleSection caseItem={caseItem} canHearing={canHearing} onRefresh={onRefresh} />
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

        <UnifiedForwardSection fromRole="deputy-proctor" actionLoading={actionLoading} withLoading={withLoading} onForward={(r: string, ex?: any) => onForward(r, { ...ex, note: remarks })} />
      </div>
      </>
    );
  }

  // Registrar panel
  if (role === 'registrar') {
    return (
      <>
        <HearingScheduleSection caseItem={caseItem} canHearing={canHearing} onRefresh={onRefresh} />
        <RegistrarPanel actionLoading={actionLoading} withLoading={withLoading} onStatusChange={onStatusChange} onForward={onForward} caseItem={caseItem} recommendation={recommendation} setRecommendation={setRecommendation} />
      </>
    );
  }

  // Disciplinary Committee panel
  if (role === 'disciplinary-committee') {
    return (
      <>
        <HearingScheduleSection caseItem={caseItem} canHearing={canHearing} onRefresh={onRefresh} />
        <DisciplinaryCommitteePanel actionLoading={actionLoading} withLoading={withLoading} onStatusChange={onStatusChange} onForward={onForward} caseItem={caseItem} onRefresh={onRefresh} verdict={verdict} setVerdict={setVerdict} verdictFileInputRef={verdictFileInputRef} verdictUploading={verdictUploading} setVerdictUploading={setVerdictUploading} />
      </>
    );
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
  const [canClose, setCanClose] = useState(false);
  useEffect(() => {
    forwardingRulesApi.getSpecial('disciplinary-committee').then(res => {
      setCanClose(!!res.data.data?.canClose);
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

      <UnifiedForwardSection
        fromRole="disciplinary-committee"
        actionLoading={actionLoading}
        withLoading={withLoading}
        onForward={(r: string, ex?: any) => onForward(r, { ...ex, verdict })}
      />

      <div className="flex flex-wrap gap-2">
        {canClose && (
          <button disabled={actionLoading || !verdict.trim()} onClick={() => withLoading(async () => {
            await casesApi.createReport(caseItem.id, { content: verdict, isDraft: false, isFinal: true });
            await onStatusChange('closed', { verdict });
          })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900 disabled:opacity-50">
            <CheckIcon /> Issue Verdict & Close Case
          </button>
        )}
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
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-red-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><LockIcon /></div>
        <div>
          <h3 className="font-semibold text-red-700">Female Coordinator: Confidential Review</h3>
          <p className="text-xs text-red-500">Review and forward case</p>
        </div>
      </div>
      <UnifiedForwardSection
        fromRole="female-coordinator"
        actionLoading={actionLoading}
        withLoading={withLoading}
        title="Verify & Forward to:"
        beforeForward={async () => { await onStatusChange('verified'); }}
        onForward={onForward}
      />
      <div className="flex flex-wrap gap-2">
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
  const [canClose, setCanClose] = useState(false);
  useEffect(() => {
    forwardingRulesApi.getSpecial('sexual-harassment-committee').then(res => {
      setCanClose(!!res.data.data?.canClose);
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
        {canClose && (
          <button disabled={actionLoading || !investigationNotes.trim()} onClick={() => withLoading(() => onStatusChange('closed', { verdict: investigationNotes }))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900 disabled:opacity-50">
            <CheckIcon /> Close Case
          </button>
        )}
      </div>
      <UnifiedForwardSection
        fromRole="sexual-harassment-committee"
        actionLoading={actionLoading}
        withLoading={withLoading}
        onForward={onForward}
      />
    </div>
  );
}

// Proctor panel using shared UnifiedForwardSection + dynamic forwarding rules
function ProctorPanel({ actionLoading, withLoading, onStatusChange, onForward, caseItem }: {
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onStatusChange: (status: string, extra?: any) => Promise<void>;
  onForward: (targetRole: string, extra?: any) => Promise<void>;
  caseItem: Case;
}) {
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    forwardingRulesApi.getSpecial('proctor').then(res => {
      setCanClose(!!res.data.data?.canClose);
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
        {canClose && (
          <>
            <button disabled={actionLoading} onClick={() => withLoading(() => onStatusChange('closed'))}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900 disabled:opacity-50">
              <CheckIcon /> Close Case
            </button>
            <button disabled={actionLoading} onClick={() => withLoading(() => onStatusChange('police-case'))}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 text-white text-sm hover:bg-red-800 disabled:opacity-50">
              <XIcon /> Mark as Police Case
            </button>
          </>
        )}
      </div>

      <UnifiedForwardSection
        fromRole="proctor"
        actionLoading={actionLoading}
        withLoading={withLoading}
        title="Assign / Forward to:"
        onForward={onForward}
      />
    </div>
  );
}

// Registrar panel with dynamic forwarding rules
function RegistrarPanel({ actionLoading, withLoading, onStatusChange, onForward, caseItem, recommendation, setRecommendation }: {
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onStatusChange: (status: string, extra?: any) => Promise<void>;
  onForward: (targetRole: string, extra?: any) => Promise<void>;
  caseItem: Case;
  recommendation: string;
  setRecommendation: (v: string) => void;
}) {
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    forwardingRulesApi.getSpecial('registrar').then(res => {
      setCanClose(!!res.data.data?.canClose);
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

      {canClose && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button disabled={actionLoading} onClick={() => withLoading(() => onStatusChange('closed', { recommendation }))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900 disabled:opacity-50">
            <CheckIcon /> Close Case
          </button>
        </div>
      )}
      <UnifiedForwardSection
        fromRole="registrar"
        actionLoading={actionLoading}
        withLoading={withLoading}
        onForward={(r: string, ex?: any) => onForward(r, { ...ex, recommendation })}
      />
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

    // Build a meaningful note even when comment is empty or no items failed
    const failedSummary = failedItems.length > 0
      ? `Failed items:\n- ${failedItems.join('\n- ')}`
      : 'All checklist items were marked, but the coordinator requested clarification.';
    const noteText = comment.trim()
      ? `${comment.trim()}\n\n${failedSummary}`
      : `Resubmission requested.\n\n${failedSummary}`;

    await onStatusChange('resubmission-requested', { note: noteText });
  };

  const coordRole = isConfidential ? 'female-coordinator' : 'coordinator';

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

      {/* Accept & Forward - one unified people dropdown across every role the
          coordinator is permitted to forward to (driven by forwarding rules). */}
      <UnifiedForwardSection
        fromRole={coordRole}
        actionLoading={actionLoading}
        withLoading={withLoading}
        title="Accept & Forward to:"
        beforeForward={async () => {
          // Verify only once, and only if the case is still awaiting verification —
          // otherwise forwarding to a second/third person would retry submitted→verified
          // on an already-assigned case and be rejected by the workflow.
          if (['submitted', 'resubmission-requested', 'on-hold'].includes(caseItem.status)) {
            await onStatusChange('verified');
          }
        }}
        onForward={onForward}
      />

      <div className="flex flex-wrap gap-2">
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
  const [uploading, setUploading] = useState(false);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResubmit = async () => {
    setSaving(true);
    try {
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

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        await casesApi.addDocument(caseItem.id, file);
      }
      await onRefresh();
      toast.success('Files uploaded');
    } catch (err: any) {
      toast.error('Upload failed', { description: err?.response?.data?.message || 'Unable to upload files' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDoc = async (docId: string, docName: string) => {
    if (!confirm(`Delete document "${docName}"?`)) return;
    setBusyDocId(docId);
    try {
      await casesApi.deleteDocument(caseItem.id, docId);
      await onRefresh();
      toast.success('Document deleted');
    } catch (err: any) {
      toast.error('Delete failed', { description: err?.response?.data?.message || 'Unable to delete document' });
    } finally {
      setBusyDocId(null);
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
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{caseItem.notes[caseItem.notes.length - 1].content}</p>
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

      {/* Existing documents with delete + upload new */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Documents</label>
        {caseItem.documents.length > 0 ? (
          <div className="space-y-2 mb-3">
            {caseItem.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between bg-white border border-orange-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b2652" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                  <span className="text-xs text-gray-400">({doc.type})</span>
                </div>
                <button
                  disabled={busyDocId === doc.id}
                  onClick={() => handleDeleteDoc(doc.id, doc.name)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  title="Delete document"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 mb-3">No documents uploaded yet.</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf,.doc,.docx"
          onChange={handleAddFiles}
          className="hidden"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {uploading ? 'Uploading...' : 'Add new file'}
        </button>
      </div>

      <button disabled={actionLoading || saving || !description.trim()} onClick={() => withLoading(handleResubmit)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50">
        <SendIcon /> Resubmit Case
      </button>
    </div>
  );
}

// Unified forward control: ONE searchable people dropdown that aggregates every
// user the current role is permitted to forward to (derived from the forwarding
// rules in Settings). Selecting people and clicking Forward assigns the case to
// each of them, deriving the target role from each person's own role.
// Renders nothing when the role has no forwarding permission / no eligible users.
function UnifiedForwardSection({ fromRole, actionLoading, withLoading, onForward, title, beforeForward }: {
  fromRole: string;
  actionLoading: boolean;
  withLoading: (fn: () => Promise<void>) => Promise<void>;
  onForward: (targetRole: string, extra?: any) => Promise<void>;
  title?: string;
  // Runs ONCE before forwarding to the selected users (e.g. verify the case).
  // Must not be re-run per recipient, or a one-time transition (submitted→verified)
  // would be attempted again on an already-advanced case and fail.
  beforeForward?: () => Promise<void>;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fromRole) { setLoaded(true); return; }
    usersApi.getForwardable(fromRole)
      .then(res => setUsers(res.data.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoaded(true));
  }, [fromRole]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabel = (r: string) => r.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Nothing to forward to: hide the whole section (no forwarding permission).
  if (!loaded) return null;
  if (users.length === 0) return null;

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roleLabel(u.role).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleForwardSelected = async () => {
    if (selectedUsers.length === 0) return;
    // One-time pre-step (e.g. coordinator verification) before forwarding to everyone.
    if (beforeForward) await beforeForward();
    for (const uid of selectedUsers) {
      const u = users.find(x => x.id === uid);
      if (!u) continue;
      // Target role is derived from the selected person's role.
      await onForward(u.role, { assignedToUserId: uid });
    }
    setSelectedUsers([]);
    setShowDropdown(false);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <p className="text-sm font-medium text-gray-700 mb-2">{title || 'Forward to:'}</p>

      {/* Single searchable multi-select people dropdown across all permitted roles */}
      <div className="relative mb-3" ref={dropdownRef}>
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm cursor-pointer flex items-center justify-between min-h-[38px]"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedUsers.length === 0 ? (
              <span className="text-gray-400">Search and select people to forward to...</span>
            ) : (
              selectedUsers.map(uid => {
                const u = users.find(x => x.id === uid);
                return u ? (
                  <span key={uid} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    {u.name} <span className="opacity-60">· {roleLabel(u.role)}</span>
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
                placeholder="Search by name, email or role..."
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
                  <span className="text-gray-400 text-xs flex-1 truncate">{u.email}</span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 text-[10px] whitespace-nowrap">{roleLabel(u.role)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <button
        disabled={actionLoading || selectedUsers.length === 0}
        onClick={() => withLoading(handleForwardSelected)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <ForwardIcon /> Forward{selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}
      </button>
    </div>
  );
}

// Reusable hearing schedule form. Renders only when the current role has __hearing__ permission.
// Used inside any role panel (proctor, deputy proctor, disciplinary committee, etc.) on the case detail.
function HearingScheduleSection({ caseItem, canHearing, onRefresh }: {
  caseItem: Case;
  canHearing: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);

  if (!canHearing) return null;

  const handleSchedule = async () => {
    if (!date || !time || !location) return;
    setBusy(true);
    try {
      await hearingsApi.create({
        caseId: caseItem.id,
        date, time, location,
        participants: [caseItem.studentName],
      });
      await onRefresh();
      toast.success('Hearing scheduled');
      setDate(''); setTime(''); setLocation('');
    } catch (err: any) {
      toast.error('Schedule failed', { description: err?.response?.data?.message || 'Unable to schedule' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
      <p className="text-sm font-semibold text-indigo-700 mb-2">Schedule Hearing</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location"
          className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <button disabled={busy || !date || !time || !location} onClick={handleSchedule}
        className="mt-3 px-4 py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
        {busy ? 'Scheduling...' : 'Schedule Hearing'}
      </button>
    </div>
  );
}
