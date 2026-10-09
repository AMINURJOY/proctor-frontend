import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { casesApi, type3Api } from '../services/api';
import { toast } from 'sonner';
import { Case } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { exportReportToPdf } from '../utils/pdfExport';
import TablePagination from '../components/TablePagination';

type SortKey = 'caseNumber' | 'studentName' | 'type' | 'status' | 'createdDate' | 'updatedDate';
type SortDir = 'asc' | 'desc';
type ReportFilter = 'all' | 'none' | 'draft' | 'final';
type ReportsPageMode = 'pending' | 'completed';

const titleCase = (s: string) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const isType2Case = (caseItem: Case) => caseItem.type === 'type-2' || caseItem.type === 'confidential';

export default function ReportsPage({ mode = 'pending' }: { mode?: ReportsPageMode }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const permissions = usePermissions();

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all');
  // View Report Modal State
  const [viewReportCaseId, setViewReportCaseId] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportZoom, setReportZoom] = useState(100);
  const [sendCase, setSendCase] = useState<Case | null>(null);
  const [sendRemarks, setSendRemarks] = useState('');
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const sendToRegistrar = async () => {
    if (!sendCase || !sendRemarks.trim()) return toast.error('Remarks are required.');
    const finalReport = [...(sendCase.reports || [])]
      .filter(report => report.isFinal)
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())[0];
    if (!finalReport) return toast.error('A finalized report is required.');
    setSending(true);
    try {
      await type3Api.start(sendCase.id, finalReport.id, sendRemarks.trim());
      setCases(items => items.map(item => item.id === sendCase.id ? { ...item, type: 'type-3', type3Stage: 'registrar-review', workflowStatusLabel: 'Sent to Registrar' } : item));
      toast.success('Report sent to Registrar and Type-3 workflow started.');
      setSendCase(null); setSendRemarks('');
    } catch (error: any) { toast.error(error.response?.data?.message || 'Could not send this report.'); }
    finally { setSending(false); }
  };

  const openViewReport = async (caseId: string) => {
    setViewReportCaseId(caseId);
    setReportContent(null);
    setReportZoom(100);
    setReportLoading(true);
    try {
      const res = await casesApi.getReports(caseId);
      const reports = res.data?.data || [];
      const finalReport = reports.find((r: any) => r.isFinal);
      setReportContent(finalReport?.content || null);
    } catch {
      setReportContent(null);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    casesApi.getAll({ pageSize: 1000 }).then(res => {
      setCases(res.data.data?.items || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Pending Reports is exclusively a Type-2 work queue. Confidential cases remain eligible
  // because confidentiality is a flag on Type-2 (the legacy API label is still supported).
  const optionCases = useMemo(
    () => mode === 'pending' ? cases.filter(isType2Case) : cases,
    [cases, mode]);
  const typeOptions = useMemo(
    () => Array.from(new Set(optionCases.map(c => c.type).filter(Boolean))).sort(),
    [optionCases]);
  const statusOptions = useMemo(
    () => Array.from(new Set(optionCases.map(c => c.status).filter(Boolean))).sort(),
    [optionCases]);

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (mode === 'pending' && reportFilter !== 'all' ? 1 : 0);

  const clearFilters = () => { setTypeFilter('all'); setStatusFilter('all'); setReportFilter('all'); };

  const visibleCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = cases.filter(c => {
      const hasFinal = !!c.reports?.some(r => r.isFinal);
      if (mode === 'pending' && !isType2Case(c)) return false;
      // Completed Reports is a finalized-only archive. Pending Reports remains the main
      // report tracker, so completed rows stay visible there with a Completed status.
      if (mode === 'completed' && !hasFinal) return false;
      if (term &&
        !c.caseNumber.toLowerCase().includes(term) &&
        !(c.studentName || '').toLowerCase().includes(term) &&
        !(c.studentId || '').toLowerCase().includes(term)) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (mode === 'pending' && reportFilter !== 'all') {
        const count = c.reports?.length || 0;
        if (reportFilter === 'none' && count !== 0) return false;
        if (reportFilter === 'draft' && (count === 0 || hasFinal)) return false;
        if (reportFilter === 'final' && !hasFinal) return false;
      }
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey] ?? '';
      const bv = (b as any)[sortKey] ?? '';
      // Date columns: compare as Date when possible
      if (sortKey === 'createdDate' || sortKey === 'updatedDate') {
        const ad = new Date(av).getTime() || 0;
        const bd = new Date(bv).getTime() || 0;
        return sortDir === 'asc' ? ad - bd : bd - ad;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [cases, mode, search, sortKey, sortDir, typeFilter, statusFilter, reportFilter]);

  const queueCount = useMemo(() => cases.filter(c => {
    const hasFinal = !!c.reports?.some(r => r.isFinal);
    return mode === 'pending' ? isType2Case(c) : hasFinal;
  }).length, [cases, mode]);
  const totalPages = Math.max(1, Math.ceil(visibleCases.length / pageSize));
  const paginatedCases = useMemo(() => visibleCases.slice((page - 1) * pageSize, page * pageSize), [visibleCases, page]);
  useEffect(() => { setPage(1); }, [mode, search, typeFilter, statusFilter, reportFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdDate' || key === 'updatedDate' ? 'desc' : 'asc');
    }
  };

  // Inline SVG rather than the ↕/↑/↓ characters — those get picked up by the emoji font on
  // Windows/Android and render as coloured stickers instead of a typographic sort indicator.
  const sortIcon = (key: SortKey) => {
    const active = sortKey === key;
    if (!active) {
      return (
        <svg width="10" height="12" viewBox="0 0 10 12" className="text-gray-300 group-hover:text-gray-400 shrink-0" aria-hidden="true">
          <path d="M5 1L8 4.5H2L5 1z" fill="currentColor" />
          <path d="M5 11L2 7.5h6L5 11z" fill="currentColor" />
        </svg>
      );
    }
    return (
      <svg width="10" height="12" viewBox="0 0 10 12" className="text-blue-600 shrink-0" aria-hidden="true">
        {sortDir === 'asc'
          ? <path d="M5 2L9 7.5H1L5 2z" fill="currentColor" />
          : <path d="M5 10L1 4.5h8L5 10z" fill="currentColor" />}
      </svg>
    );
  };

  // Every sortable header shares the same shell so spacing/hover stay consistent.
  const SortableTh = ({ label, sortKey: key }: { label: string; sortKey: SortKey }) => (
    <th
      scope="col"
      onClick={() => toggleSort(key)}
      aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="group px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors whitespace-nowrap"
    >
      <span className="inline-flex items-center gap-1.5">{label}{sortIcon(key)}</span>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0b2652' }}>
            {mode === 'pending' ? 'Pending Reports' : 'Completed Reports'}
          </h1>
          <p className="text-sm text-gray-500">
            {mode === 'pending'
              ? 'Create and track investigation reports for Type-2 cases'
              : 'View reports that have been finalized'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by case number, student name, or ID..."
              className="w-full sm:w-80 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter
            {activeFilterCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="mb-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Case Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All types</option>
              {typeOptions.map(t => <option key={t} value={t}>{titleCase(t)}</option>)}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All statuses</option>
              {statusOptions.map(s => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </div>
          {mode === 'pending' && (
            <div className="min-w-[170px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Pending State</label>
              <select value={reportFilter} onChange={e => setReportFilter(e.target.value as ReportFilter)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="all">All reports</option>
                <option value="none">Not started</option>
                <option value="draft">Draft started</option>
                <option value="final">Completed</option>
              </select>
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-500">
              {visibleCases.length} of {queueCount} cases
            </span>
            <button onClick={clearFilters} disabled={activeFilterCount === 0}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <SortableTh label="Case" sortKey="caseNumber" />
                <SortableTh label="Student" sortKey="studentName" />
                <SortableTh label="Type" sortKey="type" />
                <SortableTh label="Status" sortKey="status" />
                <SortableTh label="Case Date" sortKey="createdDate" />
                <SortableTh label="Updated" sortKey="updatedDate" />
                <th scope="col" className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Reports</th>
                <th scope="col" className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCases.map(c => {
                const reportCount = c.reports?.length || 0;
                const hasFinal = !!c.reports?.some(r => r.isFinal);
                const canWorkOnReport = currentUser?.role === 'super-admin' || (reportCount > 0
                  ? permissions.reports?.canUpdate
                  : permissions.reports?.canCreate);
                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-medium" style={{ color: '#0b2652' }}>{c.caseNumber}</td>
                    <td className="px-4 py-3 text-sm">{c.studentName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{c.type.replace('-', ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">{c.workflowStatusLabel || c.status.split('-').join(' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {c.createdDate ? new Date(c.createdDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {c.updatedDate ? new Date(c.updatedDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {hasFinal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          <span aria-hidden="true">✓</span> Completed
                        </span>
                      ) : reportCount === 0 ? (
                        <span className="text-gray-400">None</span>
                      ) : (
                        <span className="text-orange-600">Draft ({reportCount})</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {hasFinal && (
                          <button
                            type="button"
                            onClick={() => openViewReport(c.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg text-white" style={{ backgroundColor: '#10b981' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            View Report
                          </button>
                        )}
                        {mode === 'completed' && hasFinal && !c.type3Stage && (c.type === 'type-2' || c.type === 'confidential') && (currentUser?.role === 'super-admin' || permissions['completed-reports']?.canSend) && (
                          <button type="button" onClick={() => { setSendCase(c); setSendRemarks(''); }} className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-800">Send to Registrar</button>
                        )}
                        {mode === 'pending' && !hasFinal && canWorkOnReport && (
                          <button
                            type="button"
                            onClick={() => navigate(`/reports/${c.id}/edit`)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            style={{ backgroundColor: '#0b2652' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            {reportCount > 0 ? 'Continue Report' : 'Create Report'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleCases.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {search.trim()
              ? `No cases match "${search}"`
              : activeFilterCount > 0
                ? 'No cases match the selected filters'
                : mode === 'pending' ? 'No report records available' : 'No completed reports'}
          </div>
        )}
        <TablePagination currentPage={page} pageSize={pageSize} totalItems={visibleCases.length} onPageChange={setPage} itemLabel="reports" />
      </div>

      {sendCase && <><div className="fixed inset-0 z-40 bg-black/40" onClick={() => !sending && setSendCase(null)} /><div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"><div className="pointer-events-auto w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"><h3 className="text-lg font-semibold text-[#0b2652]">Send Report to Registrar</h3><p className="mt-1 text-sm text-slate-500">Send the finalized report for {sendCase.caseNumber}. The case will only be marked Type-3; its status and assignment will not change.</p><label className="mt-4 block text-sm font-medium text-slate-700">Remarks <span className="text-red-500">*</span><textarea autoFocus value={sendRemarks} onChange={e => setSendRemarks(e.target.value)} className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 p-3 text-sm" placeholder="Add remarks for the Registrar…" /></label><div className="mt-4 flex justify-end gap-2"><button disabled={sending} onClick={() => setSendCase(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button disabled={sending || !sendRemarks.trim()} onClick={sendToRegistrar} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{sending ? 'Sending…' : 'Send Report'}</button></div></div></div></>}

      {/* View Report Modal */}
      {viewReportCaseId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setViewReportCaseId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="View finalized report"
            className="pointer-events-auto flex h-[calc(100vh-1.5rem)] max-h-[900px] w-full max-w-[960px] flex-col overflow-hidden rounded-xl bg-gray-100 shadow-2xl sm:h-[calc(100vh-3rem)]"
          >
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white px-4 py-3 border-b border-gray-200 sm:px-5">
              <h3 className="text-lg font-bold" style={{ color: '#0b2652' }}>View Report</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-gray-300 bg-white" aria-label="Report zoom controls">
                  <button
                    type="button"
                    aria-label="Zoom out"
                    title="Zoom out"
                    disabled={reportZoom <= 60}
                    onClick={() => setReportZoom(value => Math.max(60, value - 10))}
                    className="flex h-8 w-8 items-center justify-center rounded-l-lg text-lg text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35"
                  >−</button>
                  <button
                    type="button"
                    title="Reset zoom"
                    onClick={() => setReportZoom(100)}
                    className="h-8 min-w-14 border-x border-gray-300 px-2 text-xs font-medium tabular-nums text-gray-700 hover:bg-gray-100"
                  >{reportZoom}%</button>
                  <button
                    type="button"
                    aria-label="Zoom in"
                    title="Zoom in"
                    disabled={reportZoom >= 160}
                    onClick={() => setReportZoom(value => Math.min(160, value + 10))}
                    className="flex h-8 w-8 items-center justify-center rounded-r-lg text-lg text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35"
                  >+</button>
                </div>
                <button onClick={() => {
                  const caseNumber = cases.find(c => c.id === viewReportCaseId)?.caseNumber || viewReportCaseId;
                  exportReportToPdf(reportContent || '', caseNumber);
                }} disabled={!reportContent || reportLoading} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Print
                </button>
                <button onClick={() => setViewReportCaseId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-200/60 p-3 sm:p-5">
              {reportLoading ? (
                <div className="flex items-center justify-center h-full w-full">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex min-w-max justify-center">
                  <div
                    className="report-content-wrapper prose min-h-[1123px] w-[794px] max-w-none rounded-sm border border-gray-200 bg-white p-10 shadow-md"
                    style={{ zoom: reportZoom / 100 }}
                    dangerouslySetInnerHTML={{ __html: reportContent || '<p class="text-center text-gray-500">No final report available for this case.</p>' }}
                  />
                </div>
              )}
            </div>
          </div>
          </div>
        </>

      )}
    </div>
  );
}
