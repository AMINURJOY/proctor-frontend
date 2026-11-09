import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, ImageIcon, VideoIcon, ArrowRightIcon, XIcon } from '../components/Icons';
import { Case, CaseStatus, Priority } from '../types';
import { casesApi, settingsApi } from '../services/api';
import { statusLabel } from '../utils/status';
import { usePermissions } from '../hooks/usePermissions';
import { roleLabel } from '../utils/roles';
import TablePagination from '../components/TablePagination';
import { Phone } from 'lucide-react';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const permissions = usePermissions();
  const canDelete = permissions['incidents']?.canDelete ?? false;

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
        const response = await casesApi.getAll({ type: 'type-1', pageSize: 1000 });
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
  const totalPages = Math.max(1, Math.ceil(type1Cases.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedCases = type1Cases.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const statusColors: Record<CaseStatus, string> = {
    'submitted': 'bg-blue-100 text-blue-700',
    'pending': 'bg-yellow-100 text-yellow-700',
    'under-review': 'bg-indigo-100 text-indigo-700',
    'verified': 'bg-green-100 text-green-700',
    'assigned': 'bg-purple-100 text-purple-700',
    'hearing-scheduled': 'bg-orange-100 text-orange-700',
    'hearing-completed': 'bg-teal-100 text-teal-700',
    'resolved': 'bg-emerald-100 text-emerald-700',
    'closed': 'bg-gray-100 text-gray-700',
    'rejected': 'bg-red-100 text-red-700',
    'on-hold': 'bg-amber-100 text-amber-700',
    'suggested-type-2': 'bg-purple-100 text-purple-700',
    'police-case': 'bg-red-200 text-red-800',
    'forwarded-to-registrar': 'bg-teal-100 text-teal-700',
    'forwarded-to-committee': 'bg-rose-100 text-rose-700',
    'resubmission-requested': 'bg-orange-100 text-orange-700',
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
        <p className="text-gray-600">You don't have permission to view Message to Proctor submissions.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Message to Proctor</h1>
        <p className="text-gray-600">Messages submitted with image or video evidence</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-semibold text-[#0b2652]">Incident messages</h2><p className="text-xs text-slate-500">Compact view of submitted Message to Proctor records</p></div>
          <span className="w-fit rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">{type1Cases.length} total</span>
        </div>

        {loading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-lg bg-slate-100" />)}</div> : (
          <div className="divide-y divide-slate-200">
            {paginatedCases.map((incident) => {
              const accusedList = incident.accusedPersons && incident.accusedPersons.length > 0
                ? incident.accusedPersons
                : (incident.accusedName ? [{ id: 'legacy', name: incident.accusedName }] : []);
              const media = incident.documents?.filter(document => document.type === 'image' || document.type === 'video').slice(0, 1) || [];
              return <article key={incident.id} className="px-4 py-3 transition-colors hover:bg-blue-50/40">
                <div className="grid gap-3 lg:grid-cols-[minmax(250px,.95fr)_minmax(320px,1.45fr)_64px_minmax(240px,auto)] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button onClick={() => navigate(`/cases/${incident.id}`)} className="truncate text-left text-sm font-bold text-[#0b2652] hover:underline">{incident.caseNumber}</button>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColors[incident.status]}`}>{statusLabel(incident.status)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${priorityColors[incident.priority]}`}>{incident.priority}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                      {incident.categoryName && <span className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-700">{incident.categoryName}</span>}
                      {incident.isAcknowledged && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">✓ Acknowledged</span>}
                      {incident.forwardedToRole && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700">→ {roleLabel(incident.forwardedToRole)}</span>}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500">Submitted {new Date(incident.createdDate).toLocaleDateString()}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{incident.studentName} <span className="font-normal text-slate-500">· {incident.studentId || 'No ID'}{incident.studentDepartment ? ` · ${incident.studentDepartment}` : ''}</span></p>
                    <p className="mt-1 truncate text-xs text-slate-600" title={incident.description}>{incident.description || 'No description provided'}</p>
                    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      {incident.studentContact && <span className="inline-flex items-center gap-1"><Phone size={12} strokeWidth={1.8} aria-hidden="true" />{incident.studentContact}</span>}
                      {accusedList.length > 0 && <span className="max-w-full truncate text-orange-700" title={accusedList.map(person => person.name).join(', ')}>Accused ({accusedList.length}): {accusedList.map(person => person.name).join(', ')}</span>}
                      {(incident.incidentLocationDescription || incident.incidentLatitude != null) && <span className="truncate">⌖ {incident.incidentLocationDescription || 'Map location attached'}</span>}
                      {incident.videoLink && <a href={incident.videoLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Video link</a>}
                    </div>
                  </div>

                  <div className="hidden lg:block">
                    {media.map(document => <div key={document.id} className="relative h-14 w-14 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                      {document.type === 'image' && document.url.startsWith('http') ? <img src={document.url} alt={document.name} className="h-full w-full object-cover" /> : document.type === 'video' ? <div className="flex h-full w-full items-center justify-center bg-slate-800 text-white"><VideoIcon /><span className="absolute bottom-0.5 right-0.5 rounded bg-black/50 px-1 text-[8px]">MP4</span></div> : <div className="flex h-full w-full items-center justify-center"><ImageIcon /></div>}
                    </div>)}
                    {media.length === 0 && <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-slate-300 text-[9px] text-slate-400">No media</div>}
                  </div>

                  <div className="flex flex-wrap gap-1.5 lg:justify-end">
                    <button onClick={() => navigate(`/cases/${incident.id}`)} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><EyeIcon /> Details</button>
                    {canTakeAction && !['closed', 'resolved', 'suggested-type-2'].includes(incident.status) && <>
                      <button onClick={() => setShowSuggestModal(incident.id)} className="inline-flex h-8 items-center gap-1 rounded-md bg-purple-600 px-2.5 text-xs font-medium text-white hover:bg-purple-700" title="Suggest as Complain to Proctor"><ArrowRightIcon /> Suggest complaint</button>
                      <button onClick={() => setShowCloseModal(incident.id)} className="inline-flex h-8 items-center gap-1 rounded-md bg-slate-600 px-2.5 text-xs font-medium text-white hover:bg-slate-700"><XIcon /> Close</button>
                    </>}
                    {canDelete && <button onClick={() => setDeleteId(incident.id)} className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 text-xs font-medium text-red-700 hover:bg-red-100"><XIcon /> Delete</button>}
                  </div>
                </div>
              </article>;
            })}
            {type1Cases.length === 0 && <div className="px-4 py-12 text-center text-sm text-slate-500">No Message to Proctor submissions found</div>}
          </div>
        )}

        <TablePagination currentPage={safePage} pageSize={pageSize} totalItems={type1Cases.length} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="incidents" />
      </div>

      {/* Suggest to Type-2 Modal */}
      {showSuggestModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setShowSuggestModal(null); setSuggestReason(''); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0b2652' }}>Suggest as Complain to Proctor</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will suggest that this message should be handled as a formal complaint. The suggestion will be reviewed before any conversion.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for suggestion</label>
                <textarea
                  value={suggestReason}
                  onChange={(e) => setSuggestReason(e.target.value)}
                  placeholder="Explain why this message should be handled as a formal complaint..."
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
                      toast.success('Case marked as Suggested as Complain to Proctor');
                    } catch (err: any) {
                      toast.error('Action failed', { description: err?.response?.data?.message || 'Could not update status' });
                    }
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
                      toast.success('Case closed');
                    } catch (err: any) {
                      toast.error('Action failed', { description: err?.response?.data?.message || 'Could not close case' });
                    }
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
