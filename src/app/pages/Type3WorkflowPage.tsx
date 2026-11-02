import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronRight, Download, Eye, FileCheck2, Forward, Loader2, MessageSquareText, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { type3Api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TablePagination from '../components/TablePagination';
import ReportWorkflowTimeline, { ReportWorkflowTransition } from '../components/ReportWorkflowTimeline';
import ReportWorkflowOverview from '../components/ReportWorkflowOverview';
import { arrangeReportImagesAtEnd } from '../utils/pdfExport';

type ResolutionSummary = { id: string; number: string; status: string };
type ResolutionDetail = ResolutionSummary & {
  createdByName: string; createdAt: string; forwardRemarks?: string; approvedByName?: string; approvedAt?: string;
  cases: Array<{ serial: number; caseId: string; shortDescription: string; people: Array<{ name: string; studentId: string; batch?: string; department?: string; status: string; remarks: string }> }>;
};

type QueueRow = {
  id: string; caseId: string; caseNumber: string; studentName: string; studentId: string;
  reportId: string; reportContent: string; reportCreatedByName: string; reportCreatedDate: string;
  isConfidential: boolean; stage: string; statusLabel: string;
  pendingForCurrentRole: boolean;
  people: Array<{ id?: string; identityKey: string; name: string; studentId: string; batch?: string; department?: string; isSubmitter: boolean; isComplainant: boolean; isAccused: boolean; initialDisposition: string; initialRemarks?: string; finalOutcome?: string; finalRemarks?: string }>;
  submittedRemarks: number; requiredRemarks: number; ownRemark?: string; ownRemarkLocked: boolean;
  remarks?: Array<{ memberName: string; content: string; submittedAt: string }>;
  transitions: ReportWorkflowTransition[];
  resolution?: ResolutionSummary;
};

const titles: Record<string, string> = {
  registrar: 'Registrar Reports', vc: 'VC Reports', 'dc-chairman': 'DC Reports',
  'dc-member': 'DC Members Reports', 'dc-secretary': 'DCS Reports', chairman: 'Chairman Reports',
  'super-admin': 'Type-3 Workflow',
};

const workflowStageOrder = [
  'registrar-review', 'vc-review', 'dc-chairman-review', 'dc-member-review',
  'dc-secretary-review', 'resolution-dc-chairman-review', 'chairman-review', 'completed',
];

export default function Type3WorkflowPage() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const openCaseId = searchParams.get('openCase');
  const role = currentUser?.role || '';
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [resolutionFields, setResolutionFields] = useState<Record<string, { shortDescription: string; people: Record<string, { outcome: string; remarks: string }> }>>({});
  const [viewReport, setViewReport] = useState<QueueRow | null>(null);
  const [viewResolution, setViewResolution] = useState<ResolutionDetail | null>(null);
  const [selectedRow, setSelectedRow] = useState<QueueRow | null>(null);
  const [reportZoom, setReportZoom] = useState(100);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const load = async () => {
    setLoading(true);
    try {
      const response = await type3Api.queue();
      const nextRows: QueueRow[] = response.data.data || [];
      setRows(nextRows);
      setSelectedRow(current => current ? nextRows.find(row => row.caseId === current.caseId) || null : null);
    }
    catch { toast.error('Could not load the Type-3 queue.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!openCaseId || loading) return;
    const report = rows.find(row => row.caseId === openCaseId);
    if (!report) return;
    setSelectedRow(report);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('openCase');
    setSearchParams(nextParams, { replace: true });
  }, [openCaseId, loading, rows, searchParams, setSearchParams]);

  const availableForBatch = useMemo(() => rows.filter(row => ['dc-member-review', 'dc-secretary-review'].includes(row.stage) && !row.resolution), [rows]);
  const statusOptions = useMemo(() => {
    const labels = new Map<string, string>();
    rows.forEach(row => labels.set(row.stage, row.statusLabel));
    return [...labels.entries()].sort(([left], [right]) => workflowStageOrder.indexOf(left) - workflowStageOrder.indexOf(right));
  }, [rows]);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(row => {
      if (statusFilter === 'pending-for-you' && !row.pendingForCurrentRole) return false;
      if (statusFilter !== 'all' && statusFilter !== 'pending-for-you' && row.stage !== statusFilter) return false;
      return !term || [row.caseNumber, row.studentName, row.studentId, row.statusLabel, row.reportCreatedByName, row.resolution?.number]
        .some(value => value?.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredRows, currentPage]
  );
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const activeTimelineStage = useMemo(() => {
    const pendingRows = rows.filter(row => row.pendingForCurrentRole);
    if (statusFilter !== 'all' && statusFilter !== 'pending-for-you') return statusFilter;
    if (statusFilter === 'pending-for-you' && pendingRows.length > 0) return pendingRows[0].stage;
    if (role === 'dc-chairman') {
      // The same role owns two distinct steps. Incoming reports from VC take the
      // first DC Chairman position; resolution approval uses the later position.
      if (pendingRows.some(row => row.stage === 'dc-chairman-review')) return 'dc-chairman-review';
      if (pendingRows.some(row => row.stage === 'resolution-dc-chairman-review')) return 'resolution-dc-chairman-review';
      return 'dc-chairman-review';
    }
    return ({
      registrar: 'registrar-review',
      vc: 'vc-review',
      'dc-member': 'dc-member-review',
      'dc-secretary': 'dc-secretary-review',
      chairman: 'chairman-review',
    } as Record<string, string>)[role] || '';
  }, [role, rows, statusFilter]);

  const canForwardReport = (row: QueueRow) => (role === 'registrar' && row.stage === 'registrar-review')
    || (role === 'vc' && row.stage === 'vc-review')
    || (role === 'dc-chairman' && row.stage === 'dc-chairman-review')
    || (role === 'super-admin' && ['registrar-review', 'vc-review', 'dc-chairman-review'].includes(row.stage));
  const canMemberRemark = (row: QueueRow) => role === 'dc-member' && row.stage === 'dc-member-review';
  const canForwardResolution = (row: QueueRow) => !!row.resolution
    && ((role === 'dc-secretary' && row.resolution.status === 'draft')
      || (role === 'dc-chairman' && row.resolution.status === 'pending-dc-chairman'));
  const canApprove = (row: QueueRow) => !!row.resolution && role === 'chairman' && row.resolution.status === 'pending-chairman';
  const canAct = (row: QueueRow) => canForwardReport(row) || canMemberRemark(row) || canForwardResolution(row) || canApprove(row);

  const requireRemarks = (key: string) => {
    const value = remarks[key]?.trim();
    if (!value) toast.error('Remarks are required.');
    return value;
  };

  const forwardCase = async (row: QueueRow) => {
    const value = remarks[row.caseId]?.trim() || '';
    setBusy(row.caseId);
    try { await type3Api.forwardCase(row.caseId, value); window.dispatchEvent(new Event('report-queues-updated')); toast.success('Report forwarded to the next stage.'); await load(); }
    catch (error: any) {
      if (error.response?.status === 409) {
        toast.info(error.response?.data?.message || 'The report was already updated. The page has been refreshed.');
        await load();
      } else toast.error(error.response?.data?.message || 'Could not forward the report.');
    }
    finally { setBusy(''); }
  };

  const saveMemberRemark = async (row: QueueRow) => {
    const value = requireRemarks(row.caseId); if (!value) return;
    setBusy(row.caseId);
    try { await type3Api.saveRemark(row.caseId, value); toast.success('Your remark was saved.'); await load(); }
    catch (error: any) { toast.error(error.response?.data?.message || 'Could not save the remark.'); }
    finally { setBusy(''); }
  };

  const createResolution = async () => {
    if (!selected.length) return toast.error('Select at least one case.');
    const cases = selected.map(caseId => {
      const row = rows.find(item => item.caseId === caseId)!;
      const fields = resolutionFields[caseId] || { shortDescription: '', people: {} };
      return { caseId, shortDescription: fields.shortDescription, people: row.people.filter(person => person.initialDisposition === 'referred-to-registrar' || person.initialDisposition === 'not-recorded').map(person => ({ decisionId: person.id!, outcome: fields.people[person.id!]?.outcome || '', remarks: fields.people[person.id!]?.remarks || '' })) };
    });
    if (cases.some(item => !item.shortDescription.trim())) return toast.error('Add a short description for every selected case.');
    if (cases.some(item => item.people.some(person => !person.outcome || !person.remarks.trim()))) return toast.error('Add a final status and remarks for every referred person.');
    setBusy('resolution');
    try { await type3Api.createResolution(cases); window.dispatchEvent(new Event('report-queues-updated')); toast.success('Resolution draft created.'); setSelected([]); await load(); }
    catch (error: any) { toast.error(error.response?.data?.message || 'Could not create the resolution.'); }
    finally { setBusy(''); }
  };

  const actOnResolution = async (row: QueueRow, approve = false) => {
    if (!row.resolution) return;
    const value = remarks[row.resolution.id]?.trim() || '';
    setBusy(row.resolution.id);
    try {
      if (approve) await type3Api.approveResolution(row.resolution.id, value);
      else await type3Api.forwardResolution(row.resolution.id, value);
      window.dispatchEvent(new Event('report-queues-updated'));
      toast.success(approve ? 'Resolution approved and cases completed.' : 'Resolution forwarded.');
      await load();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Could not update the resolution.'); }
    finally { setBusy(''); }
  };

  const downloadResolution = async (resolution: ResolutionSummary) => {
    try {
      const response = await type3Api.downloadResolution(resolution.id);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${resolution.number}.docx`; anchor.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Could not download the resolution.'); }
  };

  const download = (row: QueueRow) => row.resolution ? downloadResolution(row.resolution) : undefined;

  const openResolution = async (row: QueueRow) => {
    if (!row.resolution) return;
    const busyKey = `preview-${row.resolution.id}`;
    setBusy(busyKey);
    try {
      const response = await type3Api.getResolution(row.resolution.id);
      setViewResolution(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not load the resolution preview.');
    } finally {
      setBusy('');
    }
  };

  if (loading && rows.length === 0) return <div className="flex min-h-[55vh] items-center justify-center text-slate-500"><Loader2 className="mr-2 animate-spin" /> Loading Type-3 queue…</div>;

  return <div className="space-y-5">
    <header>
      <h1 className="text-2xl font-bold text-[#0b2652]">{titles[role] || 'Type-3 Reports'}</h1>
      <p className="mt-1 text-sm text-slate-500">Forward-only disciplinary workflow with a complete remarks and resolution history.</p>
    </header>

    <ReportWorkflowOverview activeStage={activeTimelineStage} />

    {role === 'dc-secretary' && availableForBatch.length > 0 && <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
      <div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-indigo-950">Create Resolution</h2><p className="text-xs text-indigo-700">Select one or more cases. DC Member comments are optional and do not block completion.</p></div><button onClick={createResolution} disabled={busy === 'resolution'} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Create Resolution</button></div>
      <div className="space-y-3">{availableForBatch.map(row => {
        const checked = selected.includes(row.caseId);
        return <div key={row.caseId} className="rounded-lg border border-indigo-100 bg-white p-3">
          <label className="flex items-center gap-2 font-medium text-slate-800"><input type="checkbox" checked={checked} onChange={() => setSelected(value => checked ? value.filter(id => id !== row.caseId) : [...value, row.caseId])} /> {row.caseNumber}</label>
          {checked && <div className="mt-2 grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]"><label className="text-xs font-medium text-slate-600">Case description<textarea rows={4} className="mt-1 min-h-24 w-full resize-y rounded-md border px-2.5 py-2 text-xs font-normal text-slate-800" placeholder="Short description of the case" value={resolutionFields[row.caseId]?.shortDescription || ''} onChange={e => setResolutionFields(v => ({ ...v, [row.caseId]: { shortDescription: e.target.value, people: v[row.caseId]?.people || {} } }))} /></label><div className="overflow-hidden rounded-md border border-slate-200"><div className="hidden grid-cols-[1fr_150px_minmax(180px,1.25fr)] gap-2 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:grid"><span>Person</span><span>Status</span><span>Remarks</span></div>{row.people.map(person => { const needsFinalDecision = person.initialDisposition === 'referred-to-registrar' || person.initialDisposition === 'not-recorded'; const fields = resolutionFields[row.caseId]?.people?.[person.id || ''] || { outcome: '', remarks: '' }; return <div key={person.identityKey} className={`grid gap-2 border-t p-2 first:border-t-0 md:grid-cols-[1fr_150px_minmax(180px,1.25fr)] ${needsFinalDecision ? 'border-indigo-100 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{person.name}</p><p className="truncate text-[10px] text-slate-500">{person.studentId || 'No ID'} · {person.batch || 'No batch'} · {person.department || 'No department'}</p></div>{needsFinalDecision ? <><select value={fields.outcome} onChange={e => setResolutionFields(v => ({ ...v, [row.caseId]: { shortDescription: v[row.caseId]?.shortDescription || '', people: { ...(v[row.caseId]?.people || {}), [person.id!]: { ...fields, outcome: e.target.value } } } }))} className="h-8 rounded-md border bg-white px-2 text-xs"><option value="">Final status</option><option value="guilty">Guilty</option><option value="not-guilty">Not Guilty</option><option value="warning">Warning</option><option value="counselling-needed-with-mentor">Counselling Needed with Mentor</option></select><textarea rows={1} value={fields.remarks} onChange={e => setResolutionFields(v => ({ ...v, [row.caseId]: { shortDescription: v[row.caseId]?.shortDescription || '', people: { ...(v[row.caseId]?.people || {}), [person.id!]: { ...fields, remarks: e.target.value } } } }))} placeholder="Remarks required" className="h-8 min-h-8 resize-y rounded-md border bg-white px-2 py-1.5 text-xs" /></> : <><span className="flex h-8 items-center rounded-md bg-slate-50 px-2 text-xs font-medium capitalize text-slate-700">{person.initialDisposition.replaceAll('-', ' ')}</span><p className="min-h-8 rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-600">{person.initialRemarks || 'Decision recorded by Proctor Office.'}</p></>}</div>; })}</div></div>}
        </div>;
      })}</div>
    </section>}

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="font-semibold text-slate-900">Report workflow</h2><p className="text-xs text-slate-500">Select a report to view remarks, history, and available actions.</p></div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-end"><label className="block w-full text-xs font-medium text-slate-600 sm:w-56"><span className="block">Status</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option value="all">All statuses</option><option value="pending-for-you">Pending for you</option>{statusOptions.map(([stage, label]) => <option key={stage} value={stage}>{label}</option>)}</select></label><label className="block w-full text-xs font-medium text-slate-600 sm:w-72"><span className="block">Search</span><span className="relative mt-1 block"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search reports…" className="h-9 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></span></label></div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Case & student</th><th className="px-4 py-3">Finalized report</th><th className="px-4 py-3">Current status</th><th className="px-4 py-3">Resolution</th><th className="w-12 px-4 py-3"><span className="sr-only">Open</span></th></tr></thead>
          <tbody className="divide-y divide-slate-100">{paginatedRows.map(row => <tr key={row.caseId} tabIndex={0} onClick={() => setSelectedRow(row)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setSelectedRow(row); }} className="cursor-pointer bg-white transition hover:bg-blue-50/60 focus:bg-blue-50 focus:outline-none">
            <td className="px-4 py-3"><div className="flex items-center gap-2"><b className="text-sm text-[#0b2652]">{row.caseNumber}</b>{row.isConfidential && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">Confidential</span>}</div><p className="mt-1 text-xs text-slate-500">{row.studentName} · {row.studentId}</p></td>
            <td className="px-4 py-3"><p className="text-sm font-medium text-slate-700">{row.reportCreatedByName}</p><p className="mt-1 text-xs text-slate-500">{new Date(row.reportCreatedDate).toLocaleString()}</p></td>
            <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${row.pendingForCurrentRole ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>{row.pendingForCurrentRole ? 'Pending for you' : row.statusLabel}</span><p className="mt-1 text-xs text-slate-400">{row.transitions.length} forwarding step{row.transitions.length === 1 ? '' : 's'}</p></td>
            <td className="px-4 py-3">{row.resolution ? <><p className="text-sm font-medium text-emerald-800">{row.resolution.number}</p><p className="mt-1 text-xs capitalize text-emerald-600">{row.resolution.status.replaceAll('-', ' ')}</p></> : <span className="text-sm text-slate-400">—</span>}</td>
            <td className="px-4 py-3 text-right">{canForwardReport(row) || canForwardResolution(row) ? <span title="Open and forward this report" className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"><Forward size={16}/><span className="hidden xl:inline">Forward</span></span> : <ChevronRight size={18} className="inline text-slate-400"/>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {filteredRows.length === 0 && <div className="px-4 py-16 text-center text-sm text-slate-500">{search.trim() || statusFilter !== 'all' ? 'No reports match the selected search and status.' : 'No reports have reached this stage yet.'}</div>}
      <TablePagination currentPage={currentPage} pageSize={pageSize} totalItems={filteredRows.length} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} itemLabel="reports" />
    </section>

    {selectedRow && <>
      <div className="fixed inset-0 z-40 bg-slate-950/35" onClick={() => setSelectedRow(null)} />
      <aside role="dialog" aria-modal="true" aria-label={`Workflow details for ${selectedRow.caseNumber}`} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-[#0b2652]">{selectedRow.caseNumber}</h2>{selectedRow.isConfidential && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">Confidential</span>}<span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{selectedRow.statusLabel}</span></div><p className="mt-1 text-sm text-slate-500">{selectedRow.studentName} · {selectedRow.studentId}</p></div>
          <button type="button" aria-label="Close workflow details" onClick={() => setSelectedRow(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={19}/></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <section className="rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-800">Finalized report</h3><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-700">Created by <b>{selectedRow.reportCreatedByName}</b></p><p className="mt-1 text-xs text-slate-500">{new Date(selectedRow.reportCreatedDate).toLocaleString()}</p></div><button type="button" onClick={() => { setSelectedRow(null); setViewReport(selectedRow); setReportZoom(100); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Eye size={16}/> View Report</button></div></section>

          <section className="rounded-lg border border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-800">People and decisions</h3><div className="mt-3 space-y-2">{selectedRow.people.map(person => { const displayedOutcome = person.finalOutcome || person.initialDisposition; return <div key={person.identityKey} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"><div><p className="text-sm font-medium text-slate-800">{person.name}</p><p className="text-xs text-slate-500">{person.studentId || 'No ID'} · {person.batch || 'No batch'} · {person.department || 'No department'}</p></div><div className="text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${displayedOutcome === 'guilty' ? 'bg-rose-100 text-rose-700' : displayedOutcome === 'referred-to-registrar' || displayedOutcome === 'not-recorded' ? 'bg-indigo-100 text-indigo-700' : displayedOutcome === 'warning' ? 'bg-amber-100 text-amber-800' : displayedOutcome === 'counselling-needed-with-mentor' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>{displayedOutcome.replaceAll('-', ' ')}</span><p className="mt-1 max-w-xs text-xs text-slate-500">{person.finalRemarks || person.initialRemarks || ''}</p></div></div>; })}</div></section>

          <section><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><MessageSquareText size={16}/> Forwarding timeline</div><ReportWorkflowTimeline transitions={selectedRow.transitions} pending={selectedRow.pendingForCurrentRole}/></section>

          {['dc-member-review', 'dc-secretary-review'].includes(selectedRow.stage) && <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">Optional DC Member comments received: {selectedRow.submittedRemarks} of {selectedRow.requiredRemarks} invited members. The DC Secretary may continue at any time.</div>}
          {!!selectedRow.remarks?.length && <section className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><MessageSquareText size={16}/> DC Member remarks</div><div className="space-y-3">{selectedRow.remarks.map((item, index) => <div key={index}><p className="text-xs font-semibold text-slate-700">{item.memberName}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.content}</p></div>)}</div></section>}

          {selectedRow.resolution && <section className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm"><FileCheck2 size={17} className="text-emerald-700"/><b>{selectedRow.resolution.number}</b><span className="capitalize text-emerald-700">{selectedRow.resolution.status.replaceAll('-', ' ')}</span><div className="ml-auto flex gap-2"><button type="button" disabled={busy === `preview-${selectedRow.resolution.id}`} onClick={() => openResolution(selectedRow)} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-800 disabled:opacity-50">{busy === `preview-${selectedRow.resolution.id}` ? <Loader2 size={13} className="animate-spin"/> : <Eye size={13}/>} View Resolution</button><button type="button" onClick={() => download(selectedRow)} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-medium text-emerald-800"><Download size={13}/> Download DOCX</button></div></section>}

          {canAct(selectedRow) && <section className="rounded-lg border border-blue-100 bg-blue-50/40 p-4"><label className="text-sm font-semibold text-slate-800">{canMemberRemark(selectedRow) ? 'Your DC Member remark' : canApprove(selectedRow) ? 'Approval remarks' : 'Forwarding remarks'} {canMemberRemark(selectedRow) ? <span className="text-red-500">*</span> : <span className="font-normal text-slate-500">(optional)</span>}</label><textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder={canMemberRemark(selectedRow) ? 'Write your DC Member remark…' : canApprove(selectedRow) ? 'Add approval remarks if needed…' : 'Add forwarding remarks if needed…'} value={remarks[selectedRow.resolution?.id || selectedRow.caseId] ?? (canMemberRemark(selectedRow) ? selectedRow.ownRemark || '' : '')} onChange={event => setRemarks(value => ({ ...value, [selectedRow.resolution?.id || selectedRow.caseId]: event.target.value }))} disabled={selectedRow.ownRemarkLocked} /></section>}
        </div>

        {canAct(selectedRow) && <div className="flex justify-end border-t bg-white px-5 py-4"><button disabled={busy === selectedRow.caseId || busy === selectedRow.resolution?.id || selectedRow.ownRemarkLocked} onClick={() => canMemberRemark(selectedRow) ? saveMemberRemark(selectedRow) : canApprove(selectedRow) ? actOnResolution(selectedRow, true) : canForwardResolution(selectedRow) ? actOnResolution(selectedRow) : forwardCase(selectedRow)} className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-[#0b2652] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy === selectedRow.caseId || busy === selectedRow.resolution?.id ? <Loader2 size={16} className="animate-spin"/> : <Forward size={16}/>} {canMemberRemark(selectedRow) ? 'Save Remark' : canApprove(selectedRow) ? 'Approve & Complete' : 'Forward'}</button></div>}
      </aside>
    </>}

    {viewReport && <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setViewReport(null)} />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        <div role="dialog" aria-modal="true" aria-label="View finalized report" className="pointer-events-auto flex h-[calc(100vh-2rem)] max-h-[900px] w-full max-w-[960px] flex-col overflow-hidden rounded-xl bg-slate-100 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3">
            <div><h2 className="font-semibold text-[#0b2652]">View Report</h2><p className="text-xs text-slate-500">{viewReport.caseNumber} · Finalized by {viewReport.reportCreatedByName}</p></div>
            <div className="flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-lg border bg-white">
                <button type="button" aria-label="Zoom out" disabled={reportZoom <= 60} onClick={() => setReportZoom(value => Math.max(60, value - 10))} className="grid h-9 w-9 place-items-center hover:bg-slate-50 disabled:opacity-30"><ZoomOut size={16}/></button>
                <button type="button" title="Reset zoom" onClick={() => setReportZoom(100)} className="h-9 min-w-14 border-x px-2 text-xs font-medium tabular-nums">{reportZoom}%</button>
                <button type="button" aria-label="Zoom in" disabled={reportZoom >= 160} onClick={() => setReportZoom(value => Math.min(160, value + 10))} className="grid h-9 w-9 place-items-center hover:bg-slate-50 disabled:opacity-30"><ZoomIn size={16}/></button>
              </div>
              <button type="button" aria-label="Close report" onClick={() => setViewReport(null)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={19}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-200/60 p-3 sm:p-5">
            <div className="flex min-w-max justify-center">
              <div
                className="report-content-wrapper prose min-h-[1123px] w-[794px] max-w-none rounded-sm border border-slate-200 bg-white p-10 shadow-md"
                style={{ zoom: reportZoom / 100 }}
                dangerouslySetInnerHTML={{ __html: viewReport.reportContent ? arrangeReportImagesAtEnd(viewReport.reportContent) : '<p class="text-center text-slate-500">No report content is available.</p>' }}
              />
            </div>
          </div>
        </div>
      </div>
    </>}

    {viewResolution && <>
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => setViewResolution(null)} />
      <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
        <div role="dialog" aria-modal="true" aria-label={`Resolution ${viewResolution.number}`} className="pointer-events-auto flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-[#0b2652]">Disciplinary Committee Resolution</h2><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium capitalize text-emerald-800">{viewResolution.status.replaceAll('-', ' ')}</span></div>
              <p className="mt-1 text-sm font-medium text-slate-700">{viewResolution.number}</p>
              <p className="mt-1 text-xs text-slate-500">Created by {viewResolution.createdByName} · {new Date(viewResolution.createdAt).toLocaleString()}</p>
            </div>
            <button type="button" aria-label="Close resolution preview" onClick={() => setViewResolution(null)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={19}/></button>
          </div>

          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="overflow-x-auto rounded-lg border border-slate-300">
              <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
                <thead className="bg-[#e8f0f8] text-[#0b2652]"><tr><th className="border-b px-3 py-3">Serial</th><th className="border-b px-3 py-3">Case ID</th><th className="border-b px-3 py-3">Short Description</th><th className="border-b px-3 py-3">Person</th><th className="border-b px-3 py-3">Student ID</th><th className="border-b px-3 py-3">Batch</th><th className="border-b px-3 py-3">Department</th><th className="border-b px-3 py-3">Status</th><th className="border-b px-3 py-3">Remarks</th></tr></thead>
                <tbody>{viewResolution.cases.flatMap(item => item.people.map((person, index) => <tr key={`${item.caseId}-${person.studentId}-${index}`} className="align-top odd:bg-white even:bg-slate-50/70"><td className="border-t px-3 py-3">{item.serial}</td><td className="border-t px-3 py-3 font-semibold text-[#0b2652]">{item.caseId}</td><td className="border-t px-3 py-3">{item.shortDescription}</td><td className="border-t px-3 py-3 font-medium">{person.name}</td><td className="border-t px-3 py-3">{person.studentId || '—'}</td><td className="border-t px-3 py-3">{person.batch || '—'}</td><td className="border-t px-3 py-3">{person.department || '—'}</td><td className="border-t px-3 py-3 font-semibold capitalize">{person.status.replaceAll('-', ' ')}</td><td className="whitespace-pre-wrap border-t px-3 py-3">{person.remarks}</td></tr>))}</tbody>
              </table>
            </div>
            {viewResolution.approvedAt && <p className="mt-4 text-sm font-medium text-emerald-800">Approved by {viewResolution.approvedByName} on {new Date(viewResolution.approvedAt).toLocaleString()}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-4"><button type="button" onClick={() => setViewResolution(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button><button type="button" onClick={() => downloadResolution(viewResolution)} className="inline-flex items-center gap-2 rounded-lg bg-[#0b2652] px-4 py-2 text-sm font-medium text-white"><Download size={16}/> Download DOCX</button></div>
        </div>
      </div>
    </>}
  </div>;
}
