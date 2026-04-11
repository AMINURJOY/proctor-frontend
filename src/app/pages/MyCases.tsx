import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { casesApi } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700',
  verified: 'bg-cyan-100 text-cyan-700',
  assigned: 'bg-indigo-100 text-indigo-700',
  'hearing-scheduled': 'bg-purple-100 text-purple-700',
  'hearing-completed': 'bg-violet-100 text-violet-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  rejected: 'bg-red-100 text-red-700',
  'on-hold': 'bg-amber-100 text-amber-700',
  'forwarded-to-registrar': 'bg-teal-100 text-teal-700',
  'forwarded-to-committee': 'bg-rose-100 text-rose-700',
  'resubmission-requested': 'bg-orange-100 text-orange-700',
  'police-case': 'bg-red-200 text-red-800',
};

export default function MyCases() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const canDelete = permissions['cases']?.canDelete ?? false;
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const fetchMyCases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await casesApi.getMyCases({ page, pageSize });
      const data = response.data.data || response.data;
      setCases(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchMyCases();
  }, [fetchMyCases]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await casesApi.delete(deleteId);
      toast.success('Case deleted');
      setDeleteId(null);
      await fetchMyCases();
    } catch (err: any) {
      toast.error('Delete failed', { description: err?.response?.data?.message || 'Unable to delete case' });
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const deletingCase = cases.find(c => c.id === deleteId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>My Cases</h1>
        <p className="text-gray-600">Cases assigned to you or forwarded to your role</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 border border-gray-100 text-center">
          <p className="text-gray-500 text-lg">No cases assigned to you</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Case ID</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Forwarded To</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Updated</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c: any) => (
                    <tr key={c.id}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-mono text-sm font-medium" style={{ color: '#0b2652' }}>{c.caseNumber}</td>
                      <td className="px-4 py-3 text-sm">{c.studentName}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {c.type === 'type-1' ? 'Type-1' : c.type === 'type-2' ? 'Type-2' : 'Confidential'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status] || 'bg-gray-100 text-gray-700'}`}>
                          {c.status.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          c.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          c.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          c.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {c.forwardedToRole ? c.forwardedToRole.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.updatedDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}`); }}
                            title="View Case"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); window.open(`/cases/${c.id}/report`, '_blank'); }}
                            title="View Report as PDF"
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                          </button>
                          {canDelete && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}
                              title="Delete Case"
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50">Previous</button>
              <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => !deleting && setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2 text-red-700">Delete Case</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete case <strong>{deletingCase?.caseNumber}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button disabled={deleting} onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Cancel
                </button>
                <button disabled={deleting} onClick={handleDelete}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
