import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { casesApi, forwardingRulesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

type DraftReport = {
  id: string;
  content: string;
  createdByName: string;
  createdById?: string;
  createdDate: string;
  updatedDate?: string;
};

export default function DraftReportsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('caseId') || '';
  const { currentUser } = useAuth();

  const [caseNumber, setCaseNumber] = useState<string>('');
  const [drafts, setDrafts] = useState<DraftReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [canDraftReport, setCanDraftReport] = useState(false);

  // "+ New Draft" modal state
  const [showNewDraft, setShowNewDraft] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);

  // Pull the user's draft-report permission once on mount
  useEffect(() => {
    const role = currentUser?.role || '';
    if (!role) { setCanDraftReport(false); return; }
    forwardingRulesApi.getSpecial(role)
      .then(res => setCanDraftReport(!!res.data?.data?.canDraftReport))
      .catch(() => setCanDraftReport(false));
  }, [currentUser?.role]);

  const loadDrafts = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      // Case details for the subtitle (case number). Best-effort — if it fails
      // we still render the draft list.
      try {
        const cRes = await casesApi.getById(caseId);
        setCaseNumber(cRes.data?.data?.caseNumber || cRes.data?.caseNumber || '');
      } catch { /* ignore */ }

      const rRes = await casesApi.getReports(caseId);
      const all = rRes.data?.data || [];
      const onlyDrafts = (all as any[])
        .filter(r => r.isDraft === true)
        .map(r => ({
          id: r.id,
          content: r.content,
          createdByName: r.createdByName,
          createdById: r.createdById,
          createdDate: r.createdDate,
          updatedDate: r.updatedDate,
        }));
      setDrafts(onlyDrafts);
    } catch (err: any) {
      toast.error('Failed to load drafts', { description: err?.response?.data?.message || '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrafts(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [caseId]);

  if (!caseId) {
    return (
      <div>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800 mb-4">&larr; Back</button>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">No case selected. Open a case and click <strong>Draft Report</strong> to view its drafts.</p>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    setCreating(true);
    try {
      await casesApi.createReport(caseId, { content: newContent, isDraft: true });
      toast.success('Draft report created');
      setNewContent('');
      setShowNewDraft(false);
      await loadDrafts();
    } catch (err: any) {
      toast.error('Failed to create draft', { description: err?.response?.data?.message || '' });
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate(`/cases/${caseId}`)} className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to case
        </button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0b2652' }}>Draft Reports</h1>
            {caseNumber && <p className="text-sm text-gray-500 mt-1">Case <span className="font-mono">{caseNumber}</span></p>}
          </div>
          {canDraftReport && (
            <button onClick={() => setShowNewDraft(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Draft
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          </div>
          <p className="text-gray-700 font-medium">No draft reports yet for this case.</p>
          <p className="text-sm text-gray-500 mt-1">
            {canDraftReport
              ? 'Click "New Draft" above to add the first one.'
              : 'When someone with draft report permission adds one, it will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map(d => {
            // A draft belongs to whoever wrote it: everyone with access can read it, but only
            // the author may edit. Legacy drafts with no recorded author fall back to the name.
            const isMine = d.createdById
              ? d.createdById === currentUser?.id
              : d.createdByName === currentUser?.name;
            return (
            <div key={d.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700">
                      {(d.createdByName || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{d.createdByName}</span>
                    {isMine && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">you</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Created {formatDate(d.createdDate)}
                    {d.updatedDate && d.updatedDate !== d.createdDate && (
                      <> · Last edited {formatDate(d.updatedDate)}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isMine ? (
                    <button onClick={() => navigate(`/reports/${caseId}/edit?reportId=${d.id}`)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                      Edit
                    </button>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 border border-gray-200">
                      Read-only
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {d.content.length > 220 ? d.content.slice(0, 220).trimEnd() + '…' : d.content}
              </p>
            </div>
            );
          })}
        </div>
      )}

      {/* + New Draft modal */}
      {showNewDraft && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => !creating && setShowNewDraft(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#0b2652' }}>
                New Draft Report{caseNumber ? ` — ${caseNumber}` : ''}
              </h3>
              <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
                placeholder="Write your investigation report..." rows={6}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3" />
              <div className="flex justify-end gap-2">
                <button disabled={creating} onClick={() => setShowNewDraft(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button disabled={creating || !newContent.trim()} onClick={handleCreate}
                  className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
                  {creating ? 'Creating…' : 'Create Draft Report'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}