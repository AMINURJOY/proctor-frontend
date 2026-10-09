import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Download, Eye, FileCheck2, Forward, Loader2, MessageSquareText, Search, X, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { type3Api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TablePagination from '../components/TablePagination';

type QueueRow = {
  id: string; caseId: string; caseNumber: string; studentName: string; studentId: string;
  reportId: string; reportContent: string; reportCreatedByName: string; reportCreatedDate: string;
  isConfidential: boolean; stage: string; statusLabel: string;
  submittedRemarks: number; requiredRemarks: number; ownRemark?: string; ownRemarkLocked: boolean;
  remarks?: Array<{ memberName: string; content: string; submittedAt: string }>;
  transitions: Array<{ from: string; to: string; actorName: string; actorRole: string; targetRole: string; remarks: string; createdAt: string }>;
  resolution?: { id: string; number: string; status: string };
};

const titles: Record<string, string> = {
  registrar: 'Registrar Reports', vc: 'VC Reports', 'dc-chairman': 'DC Reports',
  'dc-member': 'DC Members Reports', 'dc-secretary': 'DCS Reports', chairman: 'Chairman Reports',
  'super-admin': 'Type-3 Workflow',
};

const roleLabel = (value: string) => value === 'vc'
  ? 'VC'
  : value.split('-').map(part => part.toUpperCase() === 'dc' ? 'DC' : part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

export default function Type3WorkflowPage() {
  const { currentUser } = useAuth();
  const role = currentUser?.role || '';
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [resolutionFields, setResolutionFields] = useState<Record<string, { shortDescription: string; secretaryRemarks: string }>>({});
  const [viewReport, setViewReport] = useState<QueueRow | null>(null);
  const [selectedRow, setSelectedRow] = useState<QueueRow | null>(null);
  const [reportZoom, setReportZoom] = useState(100);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  const availableForBatch = useMemo(() => rows.filter(row => row.stage === 'dc-secretary-review' && !row.resolution), [rows]);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(row => [row.caseNumber, row.studentName, row.studentId, row.statusLabel, row.reportCreatedByName, row.resolution?.number]
      .some(value => value?.toLowerCase().includes(term)));
  }, [rows, search]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredRows, currentPage]
  );
  useEffect(() => { setCurrentPage(1); }, [search]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

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
    const value = requireRemarks(row.caseId); if (!value) return;
    setBusy(row.caseId);
    try { await type3Api.forwardCase(row.caseId, value); toast.success('Report forwarded to the next stage.'); await load(); }
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
    const cases = selected.map(caseId => ({ caseId, ...(resolutionFields[caseId] || { shortDescription: '', secretaryRemarks: '' }) }));
    if (cases.some(item => !item.shortDescription.trim() || !item.secretaryRemarks.trim())) return toast.error('Complete both resolution fields for every selected case.');
    setBusy('resolution');
    try { await type3Api.createResolution(cases); toast.success('Resolution draft created.'); setSelected([]); await load(); }
    catch (error: any) { toast.error(error.response?.data?.message || 'Could not create the resolution.'); }
    finally { setBusy(''); }
  };

  const actOnResolution = async (row: QueueRow, approve = false) => {
    if (!row.resolution) return;
    const value = requireRemarks(row.resolution.id); if (!value) return;
    setBusy(row.resolution.id);
    try {
      if (approve) await type3Api.approveResolution(row.resolution.id, value);
      else await type3Api.forwardResolution(row.resolution.id, value);
      toast.success(approve ? 'Resolution approved and cases completed.' : 'Resolution forwarded.');
      await load();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Could not update the resolution.'); }
    finally { setBusy(''); }
  };

  const download = async (row: QueueRow) => {
    if (!row.resolution) return;
    try {
      const response = await type3Api.downloadResolution(row.resolution.id);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${row.resolution.number}.docx`; anchor.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Could not download the resolution.'); }
  };

  if (loading && rows.length === 0) return <div className="flex min-h-[55vh] items-center justify-center text-slate-500"><Loader2 className="mr-2 animate-spin" /> Loading Type-3 queue…</div>;

  return <div className="space-y-5">
    <header>
      <h1 className="text-2xl font-bold text-[#0b2652]">{titles[role] || 'Type-3 Reports'}</h1>
      <p className="mt-1 text-sm text-slate-500">Forward-only disciplinary workflow with a complete remarks and resolution history.</p>
    </header>

    {role === 'dc-secretary' && availableForBatch.length > 0 && <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
      <div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-indigo-950">Create Resolution</h2><p className="text-xs text-indigo-700">Select one or more fully reviewed cases.</p></div><button onClick={createResolution} disabled={busy === 'resolution'} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Create Resolution</button></div>
      <div className="space-y-3">{availableForBatch.map(row => {
        const checked = selected.includes(row.caseId);
        return <div key={row.caseId} className="rounded-lg border border-indigo-100 bg-white p-3">
          <label className="flex items-center gap-2 font-medium text-slate-800"><input type="checkbox" checked={checked} onChange={() => setSelected(value => checked ? value.filter(id => id !== row.caseId) : [...value, row.caseId])} /> {row.caseNumber}</label>
          {checked && <div className="mt-3 grid gap-2 md:grid-cols-2"><input className="rounded-lg border px-3 py-2 text-sm" placeholder="Short description" value={resolutionFields[row.caseId]?.shortDescription || ''} onChange={e => setResolutionFields(v => ({ ...v, [row.caseId]: { shortDescription: e.target.value, secretaryRemarks: v[row.caseId]?.secretaryRemarks || '' } }))} /><textarea className="rounded-lg border px-3 py-2 text-sm" placeholder="Secretary resolution / remarks" value={resolutionFields[row.caseId]?.secretaryRemarks || ''} onChange={e => setResolutionFields(v => ({ ...v, [row.caseId]: { shortDescription: v[row.caseId]?.shortDescription || '', secretaryRemarks: e.target.value } }))} /></div>}
        </div>;
      })}</div>
    </section>}

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold text-slate-900">Report workflow</h2><p className="text-xs text-slate-500">Select a report to view remarks, history, and available actions.</p></div>
        <div className="relative w-full sm:w-72"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search reports…" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Case & student</th><th className="px-4 py-3">Finalized report</th><th className="px-4 py-3">Current status</th><th className="px-4 py-3">Resolution</th><th className="w-12 px-4 py-3"><span className="sr-only">Open</span></th></tr></thead>
          <tbody className="divide-y divide-slate-100">{paginatedRows.map(row => <tr key={row.caseId} tabIndex={0} onClick={() => setSelectedRow(row)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setSelectedRow(row); }} className="cursor-pointer bg-white transition hover:bg-blue-50/60 focus:bg-blue-50 focus:outline-none">
            <td className="px-4 py-3"><div className="flex items-center gap-2"><b className="text-sm text-[#0b2652]">{row.caseNumber}</b>{row.isConfidential && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700">Confidential</span>}</div><p className="mt-1 text-xs text-slate-500">{row.studentName} · {row.studentId}</p></td>
            <td className="px-4 py-3"><p className="text-sm font-medium text-slate-700">{row.reportCreatedByName}</p><p className="mt-1 text-xs text-slate-500">{new Date(row.reportCreatedDate).toLocaleString()}</p></td>
            <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${canAct(row) ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>{row.statusLabel}</span><p className="mt-1 text-xs text-slate-400">{row.transitions.length} forwarding step{row.transitions.length === 1 ? '' : 's'}</p></td>
            <td className="px-4 py-3">{row.resolution ? <><p className="text-sm font-medium text-emerald-800">{row.resolution.number}</p><p className="mt-1 text-xs capitalize text-emerald-600">{row.resolution.status.replaceAll('-', ' ')}</p></> : <span className="text-sm text-slate-400">—</span>}</td>
            <td className="px-4 py-3 text-right"><ChevronRight size={18} className="text-slate-400"/></td>
          </tr>)}</tbody>
        </table>
      </div>
      {filteredRows.length === 0 && <div className="px-4 py-16 text-center text-sm text-slate-500">{search.trim() ? 'No reports match your search.' : 'No reports have reached this stage yet.'}</div>}
      <TablePagination currentPage={currentPage} pageSize={pageSize} totalItems={filteredRows.length} onPageChange={setCurrentPage} itemLabel="reports" />
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

          <section><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><MessageSquareText size={16}/> Forwarding history</div><div className="space-y-3">{selectedRow.transitions.map((item, index) => <div key={`${item.createdAt}-${index}`} className="rounded-lg border border-amber-100 bg-amber-50/60 p-3"><div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500"><b className="text-slate-800">{item.actorName}</b><span>({roleLabel(item.actorRole)})</span><span aria-hidden="true">→</span><span>{roleLabel(item.targetRole)}</span><span>· {new Date(item.createdAt).toLocaleString()}</span></div><p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{item.remarks}</p></div>)}</div></section>

          {selectedRow.stage === 'dc-member-review' && <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">DC Member remarks submitted: {selectedRow.submittedRemarks}/{selectedRow.requiredRemarks}</div>}
          {!!selectedRow.remarks?.length && <section className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><MessageSquareText size={16}/> DC Member remarks</div><div className="space-y-3">{selectedRow.remarks.map((item, index) => <div key={index}><p className="text-xs font-semibold text-slate-700">{item.memberName}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.content}</p></div>)}</div></section>}

          {selectedRow.resolution && <section className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm"><FileCheck2 size={17} className="text-emerald-700"/><b>{selectedRow.resolution.number}</b><span className="capitalize text-emerald-700">{selectedRow.resolution.status.replaceAll('-', ' ')}</span><button type="button" onClick={() => download(selectedRow)} className="ml-auto inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-xs text-emerald-800"><Download size={13}/> DOCX</button></section>}

          {canAct(selectedRow) && <section className="rounded-lg border border-blue-100 bg-blue-50/40 p-4"><label className="text-sm font-semibold text-slate-800">{canMemberRemark(selectedRow) ? 'Your DC Member remark' : canApprove(selectedRow) ? 'Approval remarks' : 'Forwarding remarks'} <span className="text-red-500">*</span></label><textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder={canMemberRemark(selectedRow) ? 'Write your DC Member remark…' : 'Enter the mandatory remarks…'} value={remarks[selectedRow.resolution?.id || selectedRow.caseId] ?? (canMemberRemark(selectedRow) ? selectedRow.ownRemark || '' : '')} onChange={event => setRemarks(value => ({ ...value, [selectedRow.resolution?.id || selectedRow.caseId]: event.target.value }))} disabled={selectedRow.ownRemarkLocked} /></section>}
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
                dangerouslySetInnerHTML={{ __html: viewReport.reportContent || '<p class="text-center text-slate-500">No report content is available.</p>' }}
              />
            </div>
          </div>
        </div>
      </div>
    </>}
  </div>;
}
