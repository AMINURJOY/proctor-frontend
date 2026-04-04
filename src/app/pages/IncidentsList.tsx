import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, ImageIcon, VideoIcon, ArrowRightIcon, XIcon } from '../components/Icons';
import { Case, CaseStatus, Priority } from '../types';
import { casesApi, settingsApi } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

export default function IncidentsList() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showSuggestModal, setShowSuggestModal] = useState<string | null>(null);
  const [suggestReason, setSuggestReason] = useState('');
  const [showCloseModal, setShowCloseModal] = useState<string | null>(null);
  const [closeNote, setCloseNote] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [canViewType1, setCanViewType1] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const permissions = usePermissions();
  const canDelete = permissions['cases']?.canDelete ?? false;

  useEffect(() => {
    if (!currentUser?.role) return;
    const checkAccess = async () => {
      try {
        const res = await settingsApi.getByKey('case_viewing_type1');
        const setting = res.data.data || res.data;
        if (setting?.value) {
          const roles = setting.value.split(',').map((r: string) => r.trim());
          setCanViewType1(roles.includes(currentUser.role));
        }
      } catch { /* keep default true */ }
    };
    checkAccess();
  }, [currentUser?.role]);

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const response = await casesApi.getAll({ type: 'type-1' });
        setCases(response.data.data?.items || []);
      } catch {
        setCases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const type1Cases = cases.filter(c => c.type === 'type-1');

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

  const priorityColors: Record<Priority, string> = {
    'low': 'bg-slate-100 text-slate-700',
    'medium': 'bg-blue-100 text-blue-700',
    'high': 'bg-orange-100 text-orange-700',
    'urgent': 'bg-red-100 text-red-700'
  };

  const canTakeAction = currentUser?.role === 'proctor' || currentUser?.role === 'deputy-proctor';

  if (!canViewType1) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-2" style={{ color: '#0b2652' }}>Access Restricted</h2>
        <p className="text-gray-600">You don't have permission to view Type-1 incidents.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Incidents (Type-1)</h1>
        <p className="text-gray-600">Instant incidents with image/video evidence</p>
      </div>

      {/* Incident Cards */}
      <div className="space-y-4">
        {type1Cases.map((incident) => (
          <div key={incident.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: '#0b2652' }}>
                      {incident.caseNumber}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[incident.status]}`}>
                      {incident.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${priorityColors[incident.priority]}`}>
                      {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">{incident.studentName}</span> ({incident.studentId})
                  </p>
                  <p className="text-sm text-gray-500 mb-3">{incident.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>Submitted: {new Date(incident.createdDate).toLocaleDateString()}</span>
                    {incident.assignedTo && <span>Assigned: {incident.assignedTo}</span>}
                  </div>
                </div>

                {/* Right: Media Preview */}
                <div className="flex gap-3 flex-shrink-0">
                  {incident.documents?.filter(d => d.type === 'image' || d.type === 'video').slice(0, 2).map(doc => (
                    <div key={doc.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      {doc.type === 'image' && doc.url.startsWith('http') ? (
                        <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                      ) : doc.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <VideoIcon />
                          <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black/50 px-1 rounded">MP4</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon />
                        </div>
                      )}
                    </div>
                  ))}
                  {(!incident.documents || incident.documents.length === 0) && (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                      <span className="text-xs">No media</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/cases/${incident.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <EyeIcon />
                  View Details
                </button>
                {canTakeAction && incident.status !== 'closed' && incident.status !== 'resolved' && incident.status !== 'suggested-type-2' && (
                  <>
                    <button
                      onClick={() => setShowSuggestModal(incident.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      <ArrowRightIcon />
                      Suggest to Type-2
                    </button>
                    <button
                      onClick={() => setShowCloseModal(incident.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                    >
                      <XIcon />
                      Close Case
                    </button>
                  </>
                )}
                {canDelete && (
                  <button
                    onClick={() => setDeleteId(incident.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <XIcon />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {type1Cases.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <p className="text-gray-500">No Type-1 incidents found</p>
        </div>
      )}

      {/* Suggest to Type-2 Modal */}
      {showSuggestModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setShowSuggestModal(null); setSuggestReason(''); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0b2652' }}>Suggest as Type-2 Case</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will suggest that this incident should be handled as a Type-2 case. The suggestion will be reviewed before any conversion.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for suggestion</label>
                <textarea
                  value={suggestReason}
                  onChange={(e) => setSuggestReason(e.target.value)}
                  placeholder="Explain why this incident should be handled as Type-2..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowSuggestModal(null); setSuggestReason(''); }}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await casesApi.updateStatus(showSuggestModal, { status: 'suggested-type-2', note: suggestReason });
                      setCases(prev => prev.map(c => c.id === showSuggestModal ? { ...c, status: 'suggested-type-2' as const } : c));
                    } catch { /* silent */ }
                    setShowSuggestModal(null);
                    setSuggestReason('');
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  Submit Suggestion
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Close Case Modal */}
      {showCloseModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setShowCloseModal(null); setCloseNote(''); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0b2652' }}>Close Case</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to close this incident? This action can be reversed later if needed.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution note</label>
                <textarea
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  placeholder="Add a closing note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowCloseModal(null); setCloseNote(''); }}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await casesApi.updateStatus(showCloseModal, { status: 'closed', note: closeNote });
                      setCases(prev => prev.map(c => c.id === showCloseModal ? { ...c, status: 'closed' as const } : c));
                    } catch { /* silent */ }
                    setShowCloseModal(null);
                    setCloseNote('');
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                >
                  Close Case
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2 text-red-600">Delete Incident</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to permanently delete this incident? All associated data will be removed. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await casesApi.delete(deleteId);
                      setCases(prev => prev.filter(c => c.id !== deleteId));
                    } catch { /* silent */ }
                    setDeleteId(null);
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
