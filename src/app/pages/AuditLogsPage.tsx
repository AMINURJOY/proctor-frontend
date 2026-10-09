import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { auditLogsApi } from '../services/api';
import TablePagination from '../components/TablePagination';
import { roleLabel } from '../utils/roles';

type AuditLog = {
  id: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  httpMethod: string;
  path: string;
  queryString?: string;
  statusCode: number;
  succeeded: boolean;
  ipAddress?: string;
  userAgent?: string;
  durationMs: number;
  detailsJson?: string;
  createdAt: string;
};

type Filters = { actions: string[]; roles: string[]; entityTypes: string[] };

const humanize = (value: string) => value
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[-_]/g, ' ')
  .replace(/\b\w/g, letter => letter.toUpperCase());

const prettyJson = (value?: string) => {
  if (!value) return '';
  try { return JSON.stringify(JSON.parse(value), null, 2); }
  catch { return value; }
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState<Filters>({ actions: [], roles: [], entityTypes: [] });
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [role, setRole] = useState('');
  const [entityType, setEntityType] = useState('');
  const [result, setResult] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageSize = 20;

  const hasFilters = !!(search || action || role || entityType || result || from || to);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await auditLogsApi.getAll({
        page,
        pageSize,
        search: search || undefined,
        action: action || undefined,
        role: role || undefined,
        entityType: entityType || undefined,
        succeeded: result === '' ? undefined : result === 'success',
        from: from || undefined,
        to: to || undefined,
      });
      const data = response.data?.data || response.data;
      setLogs(data?.items || []);
      setTotal(data?.totalCount || 0);
    } catch (requestError: any) {
      setLogs([]);
      setTotal(0);
      setError(requestError?.response?.status === 403
        ? 'You do not have permission to view audit logs.'
        : 'Could not load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    auditLogsApi.getFilters().then(response => {
      const data = response.data?.data || response.data;
      setFilters({
        actions: data?.actions || [],
        roles: data?.roles || [],
        entityTypes: data?.entityTypes || [],
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadLogs, search ? 300 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, action, role, entityType, result, from, to]);

  useEffect(() => { setPage(1); }, [search, action, role, entityType, result, from, to]);

  const selectedLog = useMemo(() => logs.find(log => log.id === expandedId), [logs, expandedId]);

  const clearFilters = () => {
    setSearch(''); setAction(''); setRole(''); setEntityType(''); setResult(''); setFrom(''); setTo('');
  };

  return <div className="space-y-5">
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold text-[#0b2652]">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">Review user activity, API actions, outcomes, and request details.</p>
      </div>
      <button type="button" onClick={loadLogs} disabled={loading}
        className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
      </button>
    </header>

    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="relative xl:col-span-2">
          <span className="sr-only">Search audit logs</span>
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={event => setSearch(event.target.value)}
            placeholder="Search user, action, target, path, or IP…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <select value={action} onChange={event => setAction(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">All actions</option>
          {filters.actions.map(item => <option key={item} value={item}>{humanize(item)}</option>)}
        </select>
        <select value={result} onChange={event => setResult(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">All results</option><option value="success">Successful</option><option value="failed">Failed</option>
        </select>
        <select value={role} onChange={event => setRole(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">All roles</option>
          {filters.roles.map(item => <option key={item} value={item}>{roleLabel(item)}</option>)}
        </select>
        <select value={entityType} onChange={event => setEntityType(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">All areas</option>
          {filters.entityTypes.map(item => <option key={item} value={item}>{humanize(item)}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          From <input type="date" value={from} onChange={event => setFrom(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-700" />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          To <input type="date" value={to} onChange={event => setTo(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-700" />
        </label>
      </div>
      {hasFilters && <div className="mt-3 flex justify-end">
        <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"><X size={14} /> Clear filters</button>
      </div>}
    </section>

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Date & time</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Request</th><th className="px-4 py-3">Result</th><th className="px-4 py-3 text-right">Details</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && logs.map(log => <tr key={log.id} className="hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                <div className="font-medium text-slate-800">{new Date(log.createdAt).toLocaleDateString()}</div>
                <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
              </td>
              <td className="px-4 py-3 text-sm"><div className="font-medium text-slate-800">{log.userName}</div><div className="text-xs text-slate-500">{roleLabel(log.userRole)}</div></td>
              <td className="px-4 py-3"><div className="text-sm font-medium text-slate-800">{humanize(log.action)}</div><div className="text-xs text-slate-500">{log.durationMs} ms</div></td>
              <td className="px-4 py-3"><div className="text-sm text-slate-800">{humanize(log.entityType)}</div><div className="max-w-40 truncate font-mono text-[11px] text-slate-500" title={log.entityId}>{log.entityId || '—'}</div></td>
              <td className="px-4 py-3"><span className="mr-2 rounded bg-slate-100 px-1.5 py-1 font-mono text-[10px] font-semibold text-slate-600">{log.httpMethod}</span><span className="font-mono text-xs text-slate-600">{log.path}</span></td>
              <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${log.succeeded ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{log.succeeded ? 'Success' : 'Failed'} · {log.statusCode}</span></td>
              <td className="px-4 py-3 text-right"><button type="button" onClick={() => setExpandedId(log.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">View <ChevronDown size={14} /></button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {loading && <div className="flex min-h-52 items-center justify-center text-sm text-slate-500"><RefreshCw size={18} className="mr-2 animate-spin" /> Loading audit logs…</div>}
      {!loading && error && <div className="flex min-h-52 items-center justify-center p-6 text-sm text-red-600">{error}</div>}
      {!loading && !error && logs.length === 0 && <div className="flex min-h-52 items-center justify-center p-6 text-sm text-slate-500">No audit logs match the selected filters.</div>}
      <TablePagination currentPage={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} itemLabel="audit logs" />
    </section>

    {selectedLog && <>
      <div className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setExpandedId(null)} />
      <aside role="dialog" aria-modal="true" aria-label="Audit log details" className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 p-5">
          <div><h2 className="text-lg font-semibold text-[#0b2652]">Audit log details</h2><p className="mt-1 text-sm text-slate-500">{humanize(selectedLog.action)} · {new Date(selectedLog.createdAt).toLocaleString()}</p></div>
          <button type="button" onClick={() => setExpandedId(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <Detail label="User" value={`${selectedLog.userName} (${roleLabel(selectedLog.userRole)})`} />
            <Detail label="Result" value={`${selectedLog.succeeded ? 'Success' : 'Failed'} · HTTP ${selectedLog.statusCode}`} />
            <Detail label="Action" value={humanize(selectedLog.action)} />
            <Detail label="Target" value={`${humanize(selectedLog.entityType)}${selectedLog.entityId ? ` · ${selectedLog.entityId}` : ''}`} />
            <Detail label="Request" value={`${selectedLog.httpMethod} ${selectedLog.path}`} />
            <Detail label="Duration" value={`${selectedLog.durationMs} ms`} />
            <Detail label="IP address" value={selectedLog.ipAddress || 'Not available'} />
            <Detail label="User agent" value={selectedLog.userAgent || 'Not available'} />
          </div>
          {selectedLog.queryString && <JsonBlock title="Query parameters" value={selectedLog.queryString} />}
          {selectedLog.detailsJson && <JsonBlock title="Request details" value={selectedLog.detailsJson} />}
          {!selectedLog.queryString && !selectedLog.detailsJson && <div className="rounded-xl border border-slate-200 p-5 text-center text-slate-500">No additional request details were recorded.</div>}
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800"><ShieldCheck size={16} /> Passwords, tokens, secrets, and authorization values are automatically redacted.</div>
        </div>
      </aside>
    </>}
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div><div className="mt-1 break-words text-slate-700">{value}</div></div>;
}

function JsonBlock({ title, value }: { title: string; value: string }) {
  const [open, setOpen] = useState(true);
  return <section className="overflow-hidden rounded-xl border border-slate-200">
    <button type="button" onClick={() => setOpen(current => !current)} className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left font-medium text-slate-700">{title}{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
    {open && <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all bg-slate-950 p-4 text-xs leading-5 text-slate-100">{prettyJson(value)}</pre>}
  </section>;
}
