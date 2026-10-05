import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { caseCategoriesApi, dashboardApi } from '../services/api';
import { CaseCategory } from '../types';
import { roleLabel } from '../utils/roles';
import { statusLabel } from '../utils/status';

type Group = { name: string; count: number };
type Person = { id: string; name: string; role: string };
type CaseRow = { id: string; caseNumber: string; studentName: string; studentId: string; department?: string; categoryName?: string; status: string; type: string; assignedTo?: string; createdAt: string; accusedName?: string; complainantName?: string; punishment?: string; semester?: number; cgpa?: number; collaborators?: string };
type Activity = { caseId: string; caseNumber: string; action: string; user: string; timestamp: string };
type Analytics = { totalCases: number; openCases: number; resolvedCases: number; pendingCases: number; underReview: number; type1Pending: number; type2Pending: number; monthlyTrend: Group[]; yearlyTrend: Group[]; semesters: Group[]; caseTypes: Group[]; categories: Group[]; cgpaRanges: Group[]; workload: Group[]; roleWorkload: Group[]; departments: string[]; people: Person[]; cases: CaseRow[]; activity: Activity[]; page: number; pageSize: number };
type Filters = { search: string; status: string; type: string; categoryId: string; department: string; responsiblePersonId: string; year: string; semester: string; minCgpa: string; maxCgpa: string; from: string; to: string; page: number };
const emptyFilters: Filters = { search: '', status: '', type: '', categoryId: '', department: '', responsiblePersonId: '', year: '', semester: '', minCgpa: '', maxCgpa: '', from: '', to: '', page: 1 };
const colors = ['#173b70', '#377cb2', '#57a5b5', '#95c6a5', '#e7a85a', '#a98ec0'];
const statuses = ['submitted', 'pending', 'under-review', 'verified', 'assigned', 'hearing-scheduled', 'hearing-completed', 'resolved', 'closed', 'rejected', 'on-hold', 'suggested-type-2', 'police-case', 'forwarded-to-registrar', 'forwarded-to-committee', 'resubmission-requested'];
const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none';

function ChartCard({ title, data, kind = 'bar' }: { title: string; data: Group[]; kind?: 'bar' | 'line' | 'pie' }) {
  return <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="mb-4 font-semibold text-slate-800">{title}</h2>
    {!data.length ? <div className="flex h-56 items-center justify-center text-sm text-slate-500">No data for these filters</div> :
      <ResponsiveContainer width="100%" height={240}>
        {kind === 'pie' ? <PieChart><Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={82} label={({ name, value }) => `${name}: ${value}`}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Pie><Tooltip /></PieChart> : kind === 'line' ? <LineChart data={data} margin={{ top: 5, right: 12, bottom: 12, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip />
          <Line dataKey="count" name="Cases" stroke="#173b70" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart> : <BarChart data={data} margin={{ top: 5, right: 12, bottom: 12, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} /><YAxis allowDecimals={false} /><Tooltip />
          <Bar dataKey="count" name="Cases" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>}
      </ResponsiveContainer>}
  </section>;
}

export default function AdvancedSearch() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [searchText, setSearchText] = useState('');
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trend, setTrend] = useState<'month' | 'year'>('month');

  const [categories, setCategories] = useState<CaseCategory[]>([]);
  const [taxonomyError, setTaxonomyError] = useState('');

  useEffect(() => {
    let active = true;
    caseCategoriesApi.getAll(true)
      .then((categoryRes) => {
        if (!active) return;
        setCategories(categoryRes.data.data || []);
        setTaxonomyError('');
      })
      .catch(() => { if (active) setTaxonomyError('Unable to load categories.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setFilters(f => ({ ...f, search: searchText, page: 1 })), 350);
    return () => window.clearTimeout(timer);
  }, [searchText]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    dashboardApi.getAnalytics({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')), pageSize: 10 })
      .then(res => { if (active) { setData(res.data.data); setError(''); } })
      .catch(() => { if (active) setError('Unable to load dashboard data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  const update = (key: keyof Filters, value: string | number) => setFilters(f => ({ ...f, [key]: value, page: key === 'page' ? Number(value) : 1 }));
  const people = data?.people || [];
  const roles = [...new Set(people.map(p => p.role))];
  const cards = data ? [
    ['Total cases', data.totalCases], ['Open cases', data.openCases], ['Awaiting action', data.pendingCases],
    ['Under review', data.underReview], ['Resolved / closed', data.resolvedCases],
    ['Type 1 open', data.type1Pending], ['Type 2 open', data.type2Pending]
  ] : [];

  const chartsRef = useRef<HTMLDivElement>(null);

  const printCharts = useReactToPrint({
    contentRef: chartsRef,
    documentTitle: 'Charts',
  });

  const downloadExcel = () => {
    if (!data) return;
    const worksheet = XLSX.utils.json_to_sheet(data.cases.map(c => ({
      'Case Number': c.caseNumber,
      'Accused Name': c.accusedName || '—',
      'Student ID': c.studentId,
      'Complainant Name': c.complainantName || '—',
      'Department': c.department || '—',
      'Category': c.categoryName || '—',
      'Type': c.type,
      'Status': statusLabel(c.status),
      'Punishment': c.punishment || '—',
      'Responsible': c.assignedTo || 'Unassigned',
      'Collaborators': c.collaborators || '—',
      'Opened Date': new Date(c.createdAt).toLocaleDateString()
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cases Report');
    XLSX.writeFile(workbook, 'case-report.xlsx');
  };

  return <div className="space-y-6 pb-8">
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-[#0b2652]">Advanced Search</h1>
        <p className="mt-1 text-sm text-slate-600">Explore cases and their history with the filters below.</p>
      </div>
      {data && (
        <div className="flex gap-2">
          <button onClick={() => printCharts()} className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100">
            Download Charts
          </button>
          <button onClick={() => downloadExcel()} className="rounded-lg bg-[#0b2652] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0b2652]/90">
            Download Report (Excel)
          </button>
        </div>
      )}
    </header>
    <nav aria-label="Case shortcuts" className="flex flex-wrap gap-2 text-sm">
      {[['My cases', '/my-cases'], ['My tasks', '/my-cases?filter=my-tasks'], ['Pending', '/my-cases?filter=pending'], ['Completed', '/my-cases?filter=completed']].map(([label, path]) =>
        <button key={path} onClick={() => navigate(path)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-blue-700 hover:bg-blue-50">{label}</button>)}
    </nav>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold text-slate-800">Search and filters</h2>
        <button className="text-sm font-medium text-blue-700 hover:underline" onClick={() => { setFilters(emptyFilters); setSearchText(''); }}>Clear filters</button></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-slate-600 lg:col-span-2">Search case, student or accused<input className={field} value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Name, ID, case number, description" /></label>
        <label className="text-xs font-medium text-slate-600">From date<input className={field} type="date" value={filters.from} onChange={e => update('from', e.target.value)} /></label>
        <label className="text-xs font-medium text-slate-600">To date<input className={field} type="date" value={filters.to} onChange={e => update('to', e.target.value)} /></label>
        <label className="text-xs font-medium text-slate-600">Status<select className={field} value={filters.status} onChange={e => update('status', e.target.value)}><option value="">All statuses</option>{statuses.map(x => <option key={x} value={x}>{statusLabel(x)}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Case type<select className={field} value={filters.type} onChange={e => update('type', e.target.value)}><option value="">All types</option><option value="type-1">Type 1</option><option value="type-2">Type 2</option><option value="confidential">Confidential</option></select></label>
        <label className="text-xs font-medium text-slate-600">Category<select className={field} value={filters.categoryId} onChange={e => update('categoryId', e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (inactive)'}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Year<input className={field} type="number" min="2000" max="2100" value={filters.year} onChange={e => update('year', e.target.value)} placeholder="All years" /></label>
        <label className="text-xs font-medium text-slate-600">Semester<select className={field} value={filters.semester} onChange={e => update('semester', e.target.value)}><option value="">All semesters</option>{data?.semesters?.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Department<select className={field} value={filters.department} onChange={e => update('department', e.target.value)}><option value="">All departments</option>{data?.departments?.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">CGPA minimum<input className={field} type="number" min="0" max="4" step="0.01" value={filters.minCgpa} onChange={e => update('minCgpa', e.target.value)} placeholder="0.00" /></label>
        <label className="text-xs font-medium text-slate-600">CGPA maximum<input className={field} type="number" min="0" max="4" step="0.01" value={filters.maxCgpa} onChange={e => update('maxCgpa', e.target.value)} placeholder="4.00" /></label>
        <label className="text-xs font-medium text-slate-600">Responsible person<select className={field} value={filters.responsiblePersonId} onChange={e => update('responsiblePersonId', e.target.value)}><option value="">All people</option>{people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      </div>
    </section>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {taxonomyError && <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">{taxonomyError}</p>}
    {loading && <p className="text-sm text-slate-500">Updating dashboard…</p>}
    {data && <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{cards.map(([label, value]) =>
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-2xl font-semibold text-[#0b2652]">{value}</p><p className="mt-1 text-xs text-slate-600">{label}</p></div>)}</div>
      <div className="flex justify-end gap-2"><button className={`rounded-lg px-3 py-1.5 text-sm ${trend === 'month' ? 'bg-[#0b2652] text-white' : 'bg-white text-slate-700'}`} onClick={() => setTrend('month')}>Monthly</button><button className={`rounded-lg px-3 py-1.5 text-sm ${trend === 'year' ? 'bg-[#0b2652] text-white' : 'bg-white text-slate-700'}`} onClick={() => setTrend('year')}>Yearly</button></div>
      <div ref={chartsRef} id="charts-section" className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={`${trend === 'month' ? 'Monthly' : 'Yearly'} case trend`} data={(trend === 'month' ? data.monthlyTrend : data.yearlyTrend) || []} kind="line" />
        <ChartCard title="Semester-wise cases" data={data.semesters || []} />
        <ChartCard title="Category distribution" data={data.categories || []} />
        <ChartCard title="CGPA distribution" data={data.cgpaRanges || []} />
        <ChartCard title="Assigned Proctorial Member Workload" data={data.workload || []} />
      </div>
      <div>
        <section id="report-section" className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5"><h2 className="font-semibold text-slate-800">Cases ({data.totalCases})</h2><p className="text-xs text-slate-500">Select a case to see student details, investigation, action, outcome, and timeline.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-600"><tr>{['Case', 'Accused', 'Complainant', 'Department', 'Category', 'Type', 'Status', 'Punishment', 'Responsible', 'Collaborators', 'Opened'].map(x => <th key={x} className="px-4 py-3 font-semibold">{x}</th>)}</tr></thead><tbody>
          {(data.cases || []).map(c => <tr key={c.id} tabIndex={0} role="link" onClick={() => navigate(`/cases/${c.id}`)} onKeyDown={e => { if (e.key === 'Enter') navigate(`/cases/${c.id}`); }} className="cursor-pointer border-t border-slate-100 hover:bg-blue-50 focus:bg-blue-50"><td className="px-4 py-3 font-medium text-blue-700">{c.caseNumber}</td><td className="px-4 py-3">{c.accusedName || '—'}<span className="block text-xs text-slate-500">{c.studentId}</span></td><td className="px-4 py-3">{c.complainantName || '—'}</td><td className="px-4 py-3">{c.department || '—'}</td><td className="px-4 py-3">{c.categoryName || '—'}</td><td className="px-4 py-3">{c.type}</td><td className="px-4 py-3">{statusLabel(c.status)}</td><td className="px-4 py-3">{c.punishment || '—'}</td><td className="px-4 py-3">{c.assignedTo || 'Unassigned'}</td><td className="px-4 py-3">{c.collaborators || '—'}</td><td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}
          {!(data.cases?.length) && <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-500">No cases match these filters.</td></tr>}
        </tbody></table></div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-4 text-sm"><button disabled={filters.page <= 1} onClick={() => update('page', filters.page - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Previous</button><span>Page {data.page} of {Math.max(1, Math.ceil(data.totalCases / data.pageSize))}</span><button disabled={data.page * data.pageSize >= data.totalCases} onClick={() => update('page', filters.page + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Next</button></div>
      </section>
      </div>

    </>}
  </div>;
}
