import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { AlertTriangle, BarChart3, Database, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { accusedStatisticsApi, caseCategoriesApi } from '../services/api';

type Group = { name: string; count: number; percentage: number };
type Breakdown = { name: string; count: number; redZone: number; redZoneRate: number; highAcademicRisk: number; highFinancialRisk: number; highDropoutRisk: number; poorPoor: number; averageCgpa?: number; averageDues?: number };
type Complaint = Breakdown & {
  percentage: number; male: number; female: number; belowMmsCgpa: number; financiallyPoor: number; anyHighRisk: number;
  maleRate: number; femaleRate: number; belowMmsCgpaRate: number; financiallyPoorRate: number; anyHighRiskRate: number;
  averageRiskScore?: number; medianRiskScore?: number; redZoneAverageCgpa?: number; nonRedZoneAverageCgpa?: number; cgpaGap?: number;
  redZoneAverageDues?: number; nonRedZoneAverageDues?: number; topDepartments: string;
};
type CrossTab = { name: string; values: { name: string; count: number }[] };
type Statistics = {
  generatedAt: string; periodFrom?: string; periodTo?: string;
  summary: { totalRecords: number; uniqueStudents: number; repeatOffenders: number; redZone: number; redZoneRate: number; highAcademicRisk: number; highFinancialRisk: number; highDropoutRisk: number; poorPoor: number; averageCgpa?: number; medianCgpa?: number; averageDues?: number };
  dataCoverage: Record<string, number>;
  yearlyTrend: { year: number; total: number; redZone: number; redZoneRate: number; averageCgpa?: number }[];
  complaintYearlyTrend: { year: number; values: { name: string; count: number }[] }[];
  mmsYearlyTrend: { year: number; values: { name: string; count: number }[] }[];
  complaints: Complaint[]; mmsDistribution: Group[]; mmsProfiles: Breakdown[]; mmsByRisk: CrossTab[];
  academicRisk: Group[]; financialRisk: Group[]; ccrRisk: Group[]; dropoutRisk: Group[]; cgpaDistribution: Group[];
  departments: Breakdown[]; batches: Breakdown[]; genders: Breakdown[];
  complaintByMms: CrossTab[]; complaintByRisk: CrossTab[]; complaintByAcademicRisk: CrossTab[]; complaintByFinancialRisk: CrossTab[];
  highRiskProfile: { count: number; male: number; female: number; averageCgpa?: number; averageDues?: number; topComplaint?: string; topDepartment?: string };
  highRiskComplaints: Group[]; highRiskDepartments: Group[]; highRiskMmsDistribution: Group[]; highRiskYearlyTrend: { year: number; count: number }[];
  topDepartmentComplaints: { rank: number; department: string; complaint: string; count: number; percentage: number }[];
};

const COLORS = ['#0b2652', '#2563eb', '#06b6d4', '#f59e0b', '#ef4444', '#7c3aed', '#10b981', '#64748b'];
const RISK_COLORS: Record<string, string> = { Low: '#22c55e', Moderate: '#f59e0b', High: '#ef4444', Severe: '#991b1b', 'Very High': '#7f1d1d', Unknown: '#94a3b8' };
const MMS_COLORS: Record<string, string> = { 'Fit–Fit': '#22c55e', 'Poor–Fit': '#f97316', 'Fit–Poor': '#eab308', 'Poor–Poor': '#ef4444', Unknown: '#94a3b8' };
const money = (value?: number) => value == null ? '—' : `৳${Math.round(value).toLocaleString()}`;
const number = (value?: number, digits = 1) => value == null ? '—' : Number(value).toFixed(digits);
const date = (value?: string) => value ? new Date(value).toLocaleDateString() : '—';

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}>
    <h2 className="mb-4 text-sm font-semibold" style={{ color: '#0b2652' }}>{title}</h2>
    {children}
  </section>;
}

function EmptyChart() {
  return <div className="flex h-64 items-center justify-center text-sm text-gray-400">No data for the selected filters.</div>;
}

function RiskBars({ data }: { data: Group[] }) {
  return data.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
      <Tooltip formatter={(value: number, _name, item) => [`${value} (${item.payload.percentage}%)`, 'Records']} />
      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
        {data.map((entry, index) => <Cell key={entry.name} fill={entry.name === 'Unknown' ? '#94a3b8' : COLORS[index % COLORS.length]} />)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>;
}

function Donut({ data, colors = {} }: { data: Group[]; colors?: Record<string, string> }) {
  const visible = data.filter(item => item.count > 0);
  return visible.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={270}>
    <PieChart>
      <Pie data={visible} dataKey="count" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={2}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
        {visible.map((entry, index) => <Cell key={entry.name} fill={colors[entry.name] || (entry.name === 'Unknown' ? '#94a3b8' : COLORS[index % COLORS.length])} />)}
      </Pie>
      <Tooltip formatter={(value: number) => [value, 'Records']} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
    </PieChart>
  </ResponsiveContainer>;
}

function AnalysisSection({ number: sectionNumber, title, description, summary, children }: {
  number: number; title: string; description: string; summary: string; children: React.ReactNode;
}) {
  return <section className="space-y-4">
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-800">{sectionNumber}</span>
        <h2 className="text-xl font-bold" style={{ color: '#0b2652' }}>{title}</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
    <details className="group rounded-xl border border-cyan-200 bg-cyan-50/50 px-4 py-3">
      <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-wider text-cyan-700">
        <span className="flex items-center justify-between"><span>Section summary</span><span className="transition-transform group-open:rotate-180">▾</span></span>
      </summary>
      <p className="mt-3 text-sm text-slate-600">{summary}</p>
    </details>
    {children}
  </section>;
}

function BreakdownTable({ rows }: { rows: Breakdown[] }) {
  return <div className="overflow-x-auto"><table className="min-w-[920px] w-full text-left text-sm">
    <thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Name', 'Records', 'Red Zone', 'RZ rate', 'Poor academic', 'Poor financial', 'High dropout risk', 'Avg CGPA', 'Avg dues'].map(x => <th key={x} className="px-3 py-2 font-semibold">{x}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.name} className="border-t border-slate-100">
      <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td><td className="px-3 py-2">{row.count}</td><td className="px-3 py-2">{row.redZone}</td>
      <td className="px-3 py-2">{row.redZoneRate}%</td><td className="px-3 py-2">{row.highAcademicRisk}</td><td className="px-3 py-2">{row.highFinancialRisk}</td><td className="px-3 py-2">{row.highDropoutRisk}</td><td className="px-3 py-2">{number(row.averageCgpa, 2)}</td><td className="px-3 py-2">{money(row.averageDues)}</td>
    </tr>)}</tbody>
  </table></div>;
}

function CrossTable({ rows }: { rows: CrossTab[] }) {
  const columns = Array.from(new Set(rows.flatMap(row => row.values.map(value => value.name))));
  return <div className="overflow-x-auto"><table className="min-w-full text-left text-sm">
    <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2">Complaint</th>{columns.map(column => <th key={column} className="px-3 py-2">{column}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.name} className="border-t border-slate-100"><td className="px-3 py-2 font-medium">{row.name}</td>{columns.map(column => <td key={column} className="px-3 py-2">{row.values.find(value => value.name === column)?.count ?? 0}</td>)}</tr>)}</tbody>
  </table></div>;
}

function RiskCompositionTable({ label, levels, totals, chart }: {
  label: string; levels: string[]; totals: Record<string, number>; chart: Array<Record<string, string | number>>;
}) {
  return <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm">
    <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2">{label}</th>{chart.map(row => <th key={String(row.name)} className="px-3 py-2">{row.name}</th>)}</tr></thead>
    <tbody>{levels.map(level => <tr key={level} className="border-t border-slate-100"><td className="px-3 py-2 font-semibold">{level} (n={totals[level]})</td>{chart.map(row => <td key={String(row.name)} className="px-3 py-2">{Number(row[level] || 0).toFixed(1)}%</td>)}</tr>)}</tbody>
  </table></div>;
}

export default function AccusedStatisticsPage() {
  const [data, setData] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({ from: '', to: '', department: '', batch: '', gender: '', categoryId: '' });

  const load = useCallback(async () => {
    setLoading(true); setError(''); setForbidden(false);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) as Record<string, string>;
      const response = await accusedStatisticsApi.get(params);
      setData(response.data.data || response.data);
    } catch (err: any) {
      setForbidden(err?.response?.status === 403);
      setError(err?.response?.status === 403 ? 'You do not have permission to view accused statistics.' : (err?.response?.data?.message || 'Could not load accused statistics.'));
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { caseCategoriesApi.getAll().then(res => setCategories(res.data.data || [])).catch(() => setCategories([])); }, []);
  useEffect(() => { const timer = window.setTimeout(load, 150); return () => window.clearTimeout(timer); }, [load]);

  const complaintPie = useMemo(() => (data?.complaints || []).map(item => ({ name: item.name, count: item.count, percentage: item.percentage })), [data]);
  const genderPie = useMemo(() => (data?.genders || []).map(item => ({ name: item.name[0]?.toUpperCase() + item.name.slice(1), count: item.count, percentage: data?.summary.totalRecords ? Math.round(item.count * 1000 / data.summary.totalRecords) / 10 : 0 })), [data]);
  const yearlyBars = useMemo(() => (data?.yearlyTrend || []).map(item => ({ ...item, nonRedZone: item.total - item.redZone })), [data]);
  const complaintSeries = useMemo(() => (data?.complaints || []).map((item, index) => ({ name: item.name, key: `complaint${index}` })), [data]);
  const complaintTrend = useMemo(() => (data?.complaintYearlyTrend || []).map(row => ({
    year: row.year,
    ...Object.fromEntries(complaintSeries.map(series => [series.key, row.values.find(value => value.name === series.name)?.count ?? 0])),
  })), [data, complaintSeries]);
  const riskSeries = ['Low', 'Moderate', 'High', 'Very High', 'Unknown'];
  const mmsRisk = useMemo(() => (data?.mmsByRisk || []).map(row => ({
    name: row.name,
    ...Object.fromEntries(row.values.map(value => [value.name, value.count])),
  })), [data]);
  const departmentChart = useMemo(() => (data?.departments || []).filter(row => row.name !== 'Unknown'), [data]);
  const batchChart = useMemo(() => (data?.batches || []).filter(row => row.name !== 'Unknown').map(row => ({ ...row, nonRedZone: row.count - row.redZone })), [data]);
  const genderRisk = useMemo(() => {
    const rows = data?.genders || [];
    const percentage = (value: number, total: number) => total === 0 ? 0 : Math.round(value * 1000 / total) / 10;
    return [
      { metric: 'Red Zone', ...Object.fromEntries(rows.map(row => [row.name, row.redZoneRate])) },
      { metric: 'Poor Academic', ...Object.fromEntries(rows.map(row => [row.name, percentage(row.highAcademicRisk, row.count)])) },
      { metric: 'Poor Financial', ...Object.fromEntries(rows.map(row => [row.name, percentage(row.highFinancialRisk, row.count)])) },
      { metric: 'High Dropout Risk', ...Object.fromEntries(rows.map(row => [row.name, percentage(row.highDropoutRisk, row.count)])) },
    ];
  }, [data]);
  const mmsOrder = ['Fit–Fit', 'Fit–Poor', 'Poor–Fit', 'Poor–Poor', 'Unknown'];
  const mmsComplaintComposition = useMemo(() => mmsOrder.map(mms => {
    const counts = complaintSeries.map(series => ({ series, count: data?.complaintByMms.find(row => row.name === series.name)?.values.find(value => value.name === mms)?.count ?? 0 }));
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    return { name: mms, total, ...Object.fromEntries(counts.map(item => [item.series.key, total ? Math.round(item.count * 1000 / total) / 10 : 0])) };
  }).filter(row => row.total > 0), [data, complaintSeries]);
  const mmsTrend = useMemo(() => (data?.mmsYearlyTrend || []).map(row => {
    const total = row.values.reduce((sum, value) => sum + value.count, 0);
    return { year: row.year, ...Object.fromEntries(mmsOrder.map(name => [name, total ? Math.round((row.values.find(value => value.name === name)?.count ?? 0) * 1000 / total) / 10 : 0])) };
  }), [data]);
  const focusedComplaint = useMemo(() => data?.complaints.find(row => row.name.toLowerCase().includes('drug')) || data?.complaints[0], [data]);
  const focusedComplaintMms = useMemo(() => {
    if (!focusedComplaint) return [];
    const row = data?.complaintByMms.find(item => item.name === focusedComplaint.name);
    return mmsOrder.filter(name => name !== 'Unknown').map(name => {
      const count = row?.values.find(value => value.name === name)?.count ?? 0;
      const total = mmsComplaintComposition.find(item => item.name === name)?.total ?? 0;
      return { name, share: total ? Math.round(count * 1000 / total) / 10 : 0 };
    });
  }, [data, focusedComplaint, mmsComplaintComposition]);
  const buildRiskComposition = (crossTab: CrossTab[] | undefined) => {
    const levels = ['Low', 'Moderate', 'High', 'Severe', 'Unknown'].filter(level => (crossTab || []).some(row => (row.values.find(value => value.name === level)?.count ?? 0) > 0));
    const totals = Object.fromEntries(levels.map(level => [level, (crossTab || []).reduce((sum, row) => sum + (row.values.find(value => value.name === level)?.count ?? 0), 0)]));
    const chart = complaintSeries.map(series => ({ name: series.name, ...Object.fromEntries(levels.map(level => {
      const count = crossTab?.find(row => row.name === series.name)?.values.find(value => value.name === level)?.count ?? 0;
      return [level, totals[level] ? Math.round(count * 1000 / totals[level]) / 10 : 0];
    })) }));
    return { levels, totals, chart };
  };
  const academicComposition = useMemo(() => buildRiskComposition(data?.complaintByAcademicRisk), [data, complaintSeries]);
  const financialComposition = useMemo(() => buildRiskComposition(data?.complaintByFinancialRisk), [data, complaintSeries]);
  const complaintMmsComposition = useMemo(() => complaintSeries.map(series => {
    const row = data?.complaintByMms.find(item => item.name === series.name);
    const total = row?.values.reduce((sum, value) => sum + value.count, 0) ?? 0;
    return { name: series.name, ...Object.fromEntries(mmsOrder.map(mms => [mms, total ? Math.round((row?.values.find(value => value.name === mms)?.count ?? 0) * 1000 / total) / 10 : 0])) };
  }), [data, complaintSeries]);
  const radarComplaints = useMemo(() => (data?.complaints || []).slice(0, 4), [data]);
  const radarData = useMemo(() => [
    { metric: 'Academic risk', key: 'academic' }, { metric: 'Financial risk', key: 'financial' },
    { metric: 'Red Zone', key: 'redZone' }, { metric: 'High dropout', key: 'dropout' },
    { metric: 'Poor–Poor', key: 'poorPoor' }, { metric: 'Below 2.90', key: 'below' },
  ].map(metric => ({ metric: metric.metric, ...Object.fromEntries(radarComplaints.map((row, index) => [`series${index}`, metric.key === 'academic' ? row.count ? Math.round(row.highAcademicRisk * 1000 / row.count) / 10 : 0 : metric.key === 'financial' ? row.count ? Math.round(row.highFinancialRisk * 1000 / row.count) / 10 : 0 : metric.key === 'redZone' ? row.redZoneRate : metric.key === 'dropout' ? row.count ? Math.round(row.highDropoutRisk * 1000 / row.count) / 10 : 0 : metric.key === 'poorPoor' ? row.count ? Math.round(row.poorPoor * 1000 / row.count) / 10 : 0 : row.belowMmsCgpaRate])) })), [radarComplaints]);

  if (loading && !data) return <div className="flex min-h-[420px] items-center justify-center"><RefreshCw className="animate-spin text-blue-700" /></div>;
  if (error && !data) return <div className={`rounded-xl border p-8 text-center ${forbidden ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
    {forbidden ? <ShieldAlert className="mx-auto mb-3" /> : <AlertTriangle className="mx-auto mb-3" />}<p className="font-medium">{error}</p>
  </div>;
  if (!data) return null;

  const summaryCards = [
    ['Accused records', data.summary.totalRecords, 'One accused person in one case'],
    ['Unique students', data.summary.uniqueStudents, `${data.summary.repeatOffenders} repeat accused`],
    ['Red Zone', data.summary.redZone, `${data.summary.redZoneRate}% of all records`],
    ['High dropout risk', data.summary.highDropoutRisk, 'High and Very High tiers'],
    ['Poor–Poor', data.summary.poorPoor, 'Academic and financial distress'],
    ['Average CGPA', number(data.summary.averageCgpa, 2), `Median ${number(data.summary.medianCgpa, 2)}`],
    ['Average dues', money(data.summary.averageDues), 'Known financial records only'],
  ];

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-2 text-blue-800"><BarChart3 size={24} /></span><div><h1 className="text-2xl font-semibold" style={{ color: '#0b2652' }}>Accused Statistics</h1><p className="text-sm text-gray-500">Risk intelligence from accessible disciplinary-case accused records</p></div></div>
        <p className="mt-2 text-xs text-gray-400">Period {date(data.periodFrom)} – {date(data.periodTo)} · Generated {new Date(data.generatedAt).toLocaleString()}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:grid-cols-3 xl:grid-cols-6">
        <input type="date" value={filters.from} onChange={e => setFilters(v => ({ ...v, from: e.target.value }))} className="rounded-lg border border-gray-200 px-2 py-2 text-xs" aria-label="From date" />
        <input type="date" value={filters.to} onChange={e => setFilters(v => ({ ...v, to: e.target.value }))} className="rounded-lg border border-gray-200 px-2 py-2 text-xs" aria-label="To date" />
        <select value={filters.department} onChange={e => setFilters(v => ({ ...v, department: e.target.value }))} className="rounded-lg border border-gray-200 px-2 py-2 text-xs"><option value="">All departments</option>{data.departments.filter(x => x.name !== 'Unknown').map(x => <option key={x.name}>{x.name}</option>)}</select>
        <select value={filters.batch} onChange={e => setFilters(v => ({ ...v, batch: e.target.value }))} className="rounded-lg border border-gray-200 px-2 py-2 text-xs"><option value="">All batches</option>{data.batches.filter(x => x.name !== 'Unknown').map(x => <option key={x.name}>{x.name}</option>)}</select>
        <select value={filters.gender} onChange={e => setFilters(v => ({ ...v, gender: e.target.value }))} className="rounded-lg border border-gray-200 px-2 py-2 text-xs"><option value="">All genders</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
        <select value={filters.categoryId} onChange={e => setFilters(v => ({ ...v, categoryId: e.target.value }))} className="rounded-lg border border-gray-200 px-2 py-2 text-xs"><option value="">All complaints</option>{categories.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      </div>
    </header>

    {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">Showing the last loaded result. Refresh failed: {error}</div>}
    {data.summary.totalRecords === 0 ? <Card title="No accused data"><div className="py-12 text-center text-gray-500"><Users className="mx-auto mb-3 text-gray-300" size={38} /><p>No accused records match these filters.</p></div></Card> : <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">{summaryCards.map(([label, value, note], index) => <div key={String(label)} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm" style={{ borderTopColor: COLORS[index % COLORS.length], borderTopWidth: 3 }}><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p><p className="mt-2 text-2xl font-bold" style={{ color: '#0b2652' }}>{value}</p><p className="mt-1 text-xs text-gray-500">{note}</p></div>)}</div>

      <AnalysisSection number={1} title="Year-over-Year Trend Analysis" description="Evolution of accused occurrences and Red Zone screening over the selected period." summary="The stacked bars separate Red Zone from non-Red Zone records without double-counting. The line chart compares Red Zone rate with average CGPA on independent axes.">
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Accused records and Red Zone records by year"><ResponsiveContainer width="100%" height={300}><BarChart data={yearlyBars}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="year" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="nonRedZone" stackId="records" name="Non-Red Zone" fill="#2563eb" /><Bar dataKey="redZone" stackId="records" name="Red Zone" fill="#ef4444" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Card>
          <Card title="Red Zone rate and average CGPA by year"><ResponsiveContainer width="100%" height={300}><LineChart data={data.yearlyTrend}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="year" /><YAxis yAxisId="rate" domain={[0, 100]} unit="%" /><YAxis yAxisId="cgpa" orientation="right" domain={[0, 4]} /><Tooltip /><Legend /><Line yAxisId="rate" type="monotone" dataKey="redZoneRate" name="Red Zone Rate (%)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} /><Line yAxisId="cgpa" type="monotone" dataKey="averageCgpa" name="Average CGPA" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></Card>
        </div>
      </AnalysisSection>

      <AnalysisSection number={2} title="Complaint Type Analysis" description="Complaint volume, Red Zone rate, yearly trend, and risk profile by case category." summary="Counts use one accused occurrence per case. Red Zone rates use each complaint type's own record count as the denominator.">
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title={`Complaint distribution (n=${data.summary.totalRecords})`}><Donut data={complaintPie} /></Card>
          <Card title="Red Zone rate by complaint type"><ResponsiveContainer width="100%" height={Math.max(280, data.complaints.length * 38)}><BarChart data={data.complaints} layout="vertical" margin={{ left: 28, right: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" domain={[0, 100]} unit="%" /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} /><Tooltip formatter={(value: number) => [`${value}%`, 'Red Zone rate']} /><Bar dataKey="redZoneRate" fill="#ef4444" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></Card>
        </div>
        <Card title="Complaint type trend by year">{complaintTrend.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={340}><BarChart data={complaintTrend}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="year" /><YAxis allowDecimals={false} /><Tooltip /><Legend />{complaintSeries.map((series, index) => <Bar key={series.key} dataKey={series.key} name={series.name} stackId="complaints" fill={COLORS[index % COLORS.length]} radius={index === complaintSeries.length - 1 ? [4, 4, 0, 0] : undefined} />)}</BarChart></ResponsiveContainer>}</Card>
        <Card title="Complaint risk profile"><div className="overflow-x-auto"><table className="min-w-[1000px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Complaint', 'Records', '% total', 'Avg CGPA', 'Avg dues', 'Red Zone', 'RZ rate', 'High academic', 'High financial', 'High dropout', 'Poor–Poor'].map(x => <th key={x} className="px-3 py-2">{x}</th>)}</tr></thead><tbody>{data.complaints.map(row => <tr key={row.name} className="border-t border-slate-100"><td className="px-3 py-2 font-medium">{row.name}</td><td className="px-3 py-2">{row.count}</td><td className="px-3 py-2">{row.percentage}%</td><td className="px-3 py-2">{number(row.averageCgpa, 2)}</td><td className="px-3 py-2">{money(row.averageDues)}</td><td className="px-3 py-2">{row.redZone}</td><td className="px-3 py-2">{row.redZoneRate}%</td><td className="px-3 py-2">{row.highAcademicRisk}</td><td className="px-3 py-2">{row.highFinancialRisk}</td><td className="px-3 py-2">{row.highDropoutRisk}</td><td className="px-3 py-2">{row.poorPoor}</td></tr>)}</tbody></table></div></Card>
      </AnalysisSection>

      <AnalysisSection number={3} title="MMS 4-Quadrant Classification" description="Academic fit uses CGPA ≥2.90 and financial fit uses dues ≤৳35,000." summary="The four quadrants separate academic and financial fitness. Unknown records remain visible and are not classified into a quadrant.">
        <div className="grid gap-3 md:grid-cols-2">
          {(data.mmsProfiles || []).filter(item => item.name !== 'Unknown').map(item => <div key={item.name} className="rounded-xl border-2 bg-white p-5 text-center shadow-sm" style={{ borderColor: MMS_COLORS[item.name] }}><p className="font-semibold" style={{ color: MMS_COLORS[item.name] }}>{item.name}</p><p className="mt-2 text-3xl font-bold" style={{ color: MMS_COLORS[item.name] }}>{item.count}</p><p className="mt-2 text-xs text-gray-500">{data.summary.totalRecords ? number(item.count * 100 / data.summary.totalRecords) : '0.0'}% · Avg CGPA {number(item.averageCgpa, 2)} · Avg dues {money(item.averageDues)}</p><p className="mt-1 text-xs text-gray-500">Red Zone: {item.redZone} ({item.redZoneRate}%)</p></div>)}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="MMS category distribution"><Donut data={data.mmsDistribution} colors={MMS_COLORS} /></Card>
          <Card title="MMS category vs dropout risk"><ResponsiveContainer width="100%" height={300}><BarChart data={mmsRisk}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend />{riskSeries.map(name => <Bar key={name} dataKey={name} stackId="risk" fill={RISK_COLORS[name]} />)}</BarChart></ResponsiveContainer></Card>
        </div>
        <Card title="Complaint composition within each MMS category (%)"><ResponsiveContainer width="100%" height={340}><BarChart data={mmsComplaintComposition}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Legend />{complaintSeries.map((series, index) => <Bar key={series.key} dataKey={series.key} name={series.name} stackId="mms-complaints" fill={COLORS[index % COLORS.length]} />)}</BarChart></ResponsiveContainer>
          <div className="mt-4 overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2">MMS category</th>{complaintSeries.map(series => <th key={series.key} className="px-3 py-2">{series.name}</th>)}</tr></thead><tbody>{mmsComplaintComposition.map(row => <tr key={row.name} className="border-t border-slate-100"><td className="px-3 py-2 font-semibold">{row.name} (n={row.total})</td>{complaintSeries.map(series => { const count = data.complaintByMms.find(item => item.name === series.name)?.values.find(value => value.name === row.name)?.count ?? 0; return <td key={series.key} className="px-3 py-2">{count} ({Number((row as any)[series.key] || 0).toFixed(1)}%)</td>; })}</tr>)}</tbody></table></div>
        </Card>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title={`${focusedComplaint?.name || 'Complaint'} concentration by MMS category`}><ResponsiveContainer width="100%" height={290}><BarChart data={focusedComplaintMms}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} unit="%" /><Tooltip formatter={(value: number) => `${value}%`} /><Bar dataKey="share" name="Share within MMS category" fill="#ef4444" radius={[5, 5, 0, 0]}>{focusedComplaintMms.map((item, index) => <Cell key={item.name} fill={Object.values(MMS_COLORS)[index]} />)}</Bar></BarChart></ResponsiveContainer></Card>
          <Card title="MMS composition shift over time (%)"><ResponsiveContainer width="100%" height={290}><LineChart data={mmsTrend}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="year" /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Legend />{mmsOrder.filter(name => name !== 'Unknown').map(name => <Line key={name} type="monotone" dataKey={name} stroke={MMS_COLORS[name]} strokeWidth={2} dot={{ r: 4 }} />)}</LineChart></ResponsiveContainer></Card>
        </div>
      </AnalysisSection>

      <AnalysisSection number={4} title="Academic, Financial, CCR and Dropout Risk" description="Risk distributions use the configured screening thresholds and preserve Unknown values." summary="Each donut uses all accused records as its denominator. CGPA bands separately expose the MMS boundary at 2.90 and the academic-risk boundaries.">
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Academic risk distribution"><Donut data={data.academicRisk} colors={RISK_COLORS} /></Card>
          <Card title="Financial risk distribution"><Donut data={data.financialRisk} colors={RISK_COLORS} /></Card>
          <Card title="Credit completion risk distribution"><Donut data={data.ccrRisk} colors={RISK_COLORS} /></Card>
          <Card title="Dropout risk distribution (composite score)"><Donut data={data.dropoutRisk} colors={RISK_COLORS} /></Card>
        </div>
        <Card title="CGPA distribution"><RiskBars data={data.cgpaDistribution || []} /></Card>
        <Card title="Complaint type share by academic risk level"><ResponsiveContainer width="100%" height={340}><BarChart data={academicComposition.chart}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={65} tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Legend />{academicComposition.levels.map(level => <Bar key={level} dataKey={level} fill={RISK_COLORS[level]} radius={[3, 3, 0, 0]} />)}</BarChart></ResponsiveContainer><RiskCompositionTable label="Academic risk" {...academicComposition} /></Card>
        <Card title="Complaint type share by financial risk level"><ResponsiveContainer width="100%" height={340}><BarChart data={financialComposition.chart}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={65} tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Legend />{financialComposition.levels.map(level => <Bar key={level} dataKey={level} fill={RISK_COLORS[level]} radius={[3, 3, 0, 0]} />)}</BarChart></ResponsiveContainer><RiskCompositionTable label="Financial risk" {...financialComposition} /></Card>
      </AnalysisSection>

      <AnalysisSection number={5} title="Department Analysis" description="Top departments by accused-record volume with Red Zone rates and supporting risk indicators." summary="Bars show occurrence volume; the line uses a separate percentage axis so departments of different sizes remain comparable.">
        <Card title={`${departmentChart.length} ${departmentChart.length === 1 ? 'department' : 'departments'}: accused-record volume and Red Zone rate`}><div className="overflow-x-auto"><div style={{ minWidth: Math.max(720, departmentChart.length * 75) }}><ResponsiveContainer width="100%" height={360}><ComposedChart data={departmentChart} margin={{ bottom: 45 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={65} tick={{ fontSize: 11 }} /><YAxis yAxisId="count" allowDecimals={false} /><YAxis yAxisId="rate" orientation="right" domain={[0, 100]} unit="%" /><Tooltip /><Legend /><Bar yAxisId="count" dataKey="count" name="Accused records" fill="#2563eb" radius={[4, 4, 0, 0]} /><Line yAxisId="rate" type="monotone" dataKey="redZoneRate" name="Red Zone rate %" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} /></ComposedChart></ResponsiveContainer></div></div></Card>
        <Card title="Department risk profile"><BreakdownTable rows={data.departments} /></Card>
      </AnalysisSection>

      <AnalysisSection number={6} title="Gender Analysis" description="Accused-record distribution and within-gender risk-rate comparison." summary="Each comparison bar is a percentage within that gender, preventing the larger gender group from dominating the interpretation.">
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title={`Gender split (n=${data.summary.totalRecords})`}><Donut data={genderPie} /></Card>
          <Card title="Risk comparison by gender"><ResponsiveContainer width="100%" height={300}><BarChart data={genderRisk}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="metric" tick={{ fontSize: 10 }} interval={0} /><YAxis domain={[0, 100]} unit="%" /><Tooltip formatter={(value: number) => `${value}%`} /><Legend />{data.genders.filter(row => row.name !== 'Unknown').map((row, index) => <Bar key={row.name} dataKey={row.name} name={row.name[0]?.toUpperCase() + row.name.slice(1)} fill={COLORS[(index + 1) % COLORS.length]} radius={[4, 4, 0, 0]} />)}</BarChart></ResponsiveContainer></Card>
        </div>
        <Card title="Gender risk profile"><BreakdownTable rows={data.genders} /></Card>
      </AnalysisSection>

      <AnalysisSection number={7} title="Batch Analysis" description="Highest-volume batches split into Red Zone and non-Red Zone records." summary="The bars are stacked so their full height equals total accused occurrences for the batch; the table provides rate and average-value context.">
        <Card title={`${batchChart.length} ${batchChart.length === 1 ? 'batch' : 'batches'} by accused-record volume`}><div className="overflow-x-auto"><div style={{ minWidth: Math.max(680, batchChart.length * 85) }}><ResponsiveContainer width="100%" height={330}><BarChart data={batchChart}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="nonRedZone" stackId="batch" name="Non-Red Zone" fill="#2563eb" /><Bar dataKey="redZone" stackId="batch" name="Red Zone" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div></Card>
        <Card title="Batch risk profile"><BreakdownTable rows={data.batches} /></Card>
      </AnalysisSection>

      <AnalysisSection number={8} title="Detailed Risk Relationships" description="Cross-tabs and concentrated high-risk combinations for deeper review." summary="These tables support investigation but do not represent diagnoses or confirmed dropout outcomes.">
        <div className="grid gap-4 xl:grid-cols-2"><Card title={`High dropout risk: complaint breakdown (n=${data.highRiskProfile.count})`}><Donut data={data.highRiskComplaints || []} /></Card><Card title={`High dropout risk: department breakdown (n=${data.highRiskProfile.count})`}><Donut data={data.highRiskDepartments || []} /></Card></div>
        <Card title="High dropout-risk profile summary"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><tbody className="divide-y divide-slate-100">
          <tr><th className="px-3 py-2 text-cyan-700">Total records</th><td className="px-3 py-2">{data.highRiskProfile.count} ({data.summary.totalRecords ? number(data.highRiskProfile.count * 100 / data.summary.totalRecords) : '0.0'}% of all accused records)</td></tr>
          <tr><th className="px-3 py-2 text-cyan-700">MMS category</th><td className="px-3 py-2">{(data.highRiskMmsDistribution || []).filter(item => item.count > 0).map(item => `${item.name}: ${item.count} (${item.percentage}%)`).join(', ') || '—'}</td></tr>
          <tr><th className="px-3 py-2 text-cyan-700">Gender</th><td className="px-3 py-2">{data.highRiskProfile.male} male / {data.highRiskProfile.female} female</td></tr>
          <tr><th className="px-3 py-2 text-cyan-700">Average CGPA</th><td className="px-3 py-2">{number(data.highRiskProfile.averageCgpa, 2)} (overall {number(data.summary.averageCgpa, 2)})</td></tr>
          <tr><th className="px-3 py-2 text-cyan-700">Average dues</th><td className="px-3 py-2">{money(data.highRiskProfile.averageDues)} (overall {money(data.summary.averageDues)})</td></tr>
          <tr><th className="px-3 py-2 text-cyan-700">Top complaint</th><td className="px-3 py-2">{data.highRiskProfile.topComplaint || '—'}</td></tr>
          <tr><th className="px-3 py-2 text-cyan-700">Top department</th><td className="px-3 py-2">{data.highRiskProfile.topDepartment || '—'}</td></tr>
          <tr><th className="px-3 py-2 text-cyan-700">Year trend</th><td className="px-3 py-2">{(data.highRiskYearlyTrend || []).map(item => `${item.year}: ${item.count}`).join(' → ') || '—'}</td></tr>
        </tbody></table></div></Card>
        <div className="grid gap-4 xl:grid-cols-2"><Card title="Complaint × MMS quadrant"><CrossTable rows={data.complaintByMms} /></Card><Card title="Complaint × dropout-risk level"><CrossTable rows={data.complaintByRisk} /></Card></div>
        <Card title={`${data.topDepartmentComplaints.length} highest-volume department × complaint combinations`}><ResponsiveContainer width="100%" height={Math.max(360, data.topDepartmentComplaints.length * 30)}><BarChart data={data.topDepartmentComplaints.map(row => ({ ...row, label: `${row.department} – ${row.complaint}` }))} layout="vertical" margin={{ left: 55, right: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="label" width={170} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" name="Accused records" fill="#2563eb" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></Card>
        <Card title="Top department × complaint combinations"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2">Rank</th><th className="px-3 py-2">Department</th><th className="px-3 py-2">Complaint</th><th className="px-3 py-2">Records</th><th className="px-3 py-2">% of all records</th></tr></thead><tbody>{data.topDepartmentComplaints.map(row => <tr key={`${row.department}-${row.complaint}`} className="border-t border-slate-100"><td className="px-3 py-2">{row.rank}</td><td className="px-3 py-2 font-medium">{row.department}</td><td className="px-3 py-2">{row.complaint}</td><td className="px-3 py-2">{row.count}</td><td className="px-3 py-2">{row.percentage}%</td></tr>)}</tbody></table></div></Card>
      </AnalysisSection>

      <AnalysisSection number={9} title="Complaint Risk Comparison" description="Complaint-level severity, CGPA, MMS, gender, and financial comparisons." summary="All rates use known values or the complaint's own record count as labelled. The average screening score follows the configured 0–10 dropout-score rules; it is not a probability.">
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Complaint severity index (average screening score)"><ResponsiveContainer width="100%" height={Math.max(300, data.complaints.length * 38)}><BarChart data={data.complaints} layout="vertical" margin={{ left: 25, right: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" domain={[0, 10]} /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="averageRiskScore" name="Average screening score" fill="#ef4444" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></Card>
          <Card title="Red Zone records: CGPA gap by complaint type"><ResponsiveContainer width="100%" height={320}><BarChart data={data.complaints}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={70} tick={{ fontSize: 10 }} /><YAxis domain={[0, 4]} /><Tooltip /><Legend /><Bar dataKey="redZoneAverageCgpa" name="Red Zone CGPA" fill="#ef4444" radius={[4, 4, 0, 0]} /><Bar dataKey="nonRedZoneAverageCgpa" name="Non-Red Zone CGPA" fill="#22c55e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Card>
        </div>
        <Card title="Complaint severity and CGPA-gap table"><div className="overflow-x-auto"><table className="min-w-[1150px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Complaint', 'Avg score', 'Median', 'Any high risk', 'RZ CGPA', 'Non-RZ CGPA', 'CGPA gap', 'RZ avg dues', 'Non-RZ avg dues'].map(label => <th key={label} className="px-3 py-2">{label}</th>)}</tr></thead><tbody>{data.complaints.map(row => <tr key={row.name} className="border-t border-slate-100"><td className="px-3 py-2 font-semibold">{row.name}</td><td className="px-3 py-2">{number(row.averageRiskScore, 2)}</td><td className="px-3 py-2">{number(row.medianRiskScore, 1)}</td><td className="px-3 py-2">{row.anyHighRiskRate}%</td><td className="px-3 py-2">{number(row.redZoneAverageCgpa, 2)}</td><td className="px-3 py-2">{number(row.nonRedZoneAverageCgpa, 2)}</td><td className="px-3 py-2">{number(row.cgpaGap, 2)}</td><td className="px-3 py-2">{money(row.redZoneAverageDues)}</td><td className="px-3 py-2">{money(row.nonRedZoneAverageDues)}</td></tr>)}</tbody></table></div></Card>
        <Card title="Complaint type comparison"><div className="overflow-x-auto"><table className="min-w-[1250px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Complaint', 'N', 'Avg CGPA', 'Male %', 'RZ %', 'High academic %', 'High financial %', 'High dropout %', 'Poor–Poor %', 'Avg dues', 'Top departments'].map(label => <th key={label} className="px-3 py-2">{label}</th>)}</tr></thead><tbody>{data.complaints.map(row => <tr key={row.name} className="border-t border-slate-100"><td className="px-3 py-2 font-semibold">{row.name}</td><td className="px-3 py-2">{row.count}</td><td className="px-3 py-2">{number(row.averageCgpa, 2)}</td><td className="px-3 py-2">{row.maleRate}%</td><td className="px-3 py-2">{row.redZoneRate}%</td><td className="px-3 py-2">{row.count ? number(row.highAcademicRisk * 100 / row.count) : '0.0'}%</td><td className="px-3 py-2">{row.count ? number(row.highFinancialRisk * 100 / row.count) : '0.0'}%</td><td className="px-3 py-2">{row.count ? number(row.highDropoutRisk * 100 / row.count) : '0.0'}%</td><td className="px-3 py-2">{row.count ? number(row.poorPoor * 100 / row.count) : '0.0'}%</td><td className="px-3 py-2">{money(row.averageDues)}</td><td className="px-3 py-2">{row.topDepartments || '—'}</td></tr>)}</tbody></table></div></Card>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Red Zone rate by complaint type (%)"><ResponsiveContainer width="100%" height={Math.max(300, data.complaints.length * 38)}><BarChart data={data.complaints} layout="vertical" margin={{ left: 25, right: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" domain={[0, 100]} unit="%" /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="redZoneRate" name="Red Zone rate" fill="#ef4444" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></Card>
          <Card title={`Risk radar: ${radarComplaints.length} highest-volume complaint ${radarComplaints.length === 1 ? 'type' : 'types'}`}><ResponsiveContainer width="100%" height={360}><RadarChart data={radarData}><PolarGrid /><PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} /><PolarRadiusAxis domain={[0, 100]} /><Tooltip /><Legend />{radarComplaints.map((row, index) => <Radar key={row.name} name={row.name} dataKey={`series${index}`} stroke={COLORS[index]} fill={COLORS[index]} fillOpacity={0.08} />)}</RadarChart></ResponsiveContainer></Card>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="MMS quadrant distribution by complaint (%)"><ResponsiveContainer width="100%" height={340}><BarChart data={complaintMmsComposition}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={70} tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Legend />{mmsOrder.filter(name => name !== 'Unknown').map(name => <Bar key={name} dataKey={name} stackId="complaint-mms" fill={MMS_COLORS[name]} />)}</BarChart></ResponsiveContainer></Card>
          <Card title="Female accused % by complaint type"><ResponsiveContainer width="100%" height={Math.max(300, data.complaints.length * 38)}><BarChart data={data.complaints} layout="vertical" margin={{ left: 25, right: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" domain={[0, 100]} unit="%" /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="femaleRate" name="Female accused %" fill="#ec4899" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></Card>
          <Card title="Students below CGPA 2.90 by complaint (%)"><ResponsiveContainer width="100%" height={320}><BarChart data={data.complaints}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={70} tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Bar dataKey="belowMmsCgpaRate" name="Below CGPA 2.90" fill="#f97316" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Card>
          <Card title="Average outstanding dues by complaint"><ResponsiveContainer width="100%" height={320}><BarChart data={data.complaints}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={70} tick={{ fontSize: 10 }} /><YAxis /><Tooltip formatter={(value: number) => money(value)} /><Bar dataKey="averageDues" name="Average dues" fill="#0b2652" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Card>
        </div>
        <div className="grid gap-4 xl:grid-cols-2"><Card title="Academic status by complaint type"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2">Complaint</th><th className="px-3 py-2">Fit</th><th className="px-3 py-2">Poor</th></tr></thead><tbody>{data.complaints.map(row => <tr key={row.name} className="border-t border-slate-100"><td className="px-3 py-2 font-semibold">{row.name}</td><td className="px-3 py-2">{number(100 - row.belowMmsCgpaRate)}%</td><td className="px-3 py-2">{row.belowMmsCgpaRate}%</td></tr>)}</tbody></table></div></Card><Card title="Financial status by complaint type"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2">Complaint</th><th className="px-3 py-2">Fit</th><th className="px-3 py-2">Poor</th></tr></thead><tbody>{data.complaints.map(row => <tr key={row.name} className="border-t border-slate-100"><td className="px-3 py-2 font-semibold">{row.name}</td><td className="px-3 py-2">{number(100 - row.financiallyPoorRate)}%</td><td className="px-3 py-2">{row.financiallyPoorRate}%</td></tr>)}</tbody></table></div></Card></div>
      </AnalysisSection>
    </>}

    <Card title="Data completeness"><div className="mb-4 flex items-start gap-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900"><Database className="mt-0.5 shrink-0" size={18} /><p>Unknown values stay visible and are never treated as zero or low risk. Percentages in risk charts use all accused records and include an explicit Unknown tier.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(data.dataCoverage).map(([key, value]) => <div key={key} className="rounded-lg border border-gray-100 p-3"><p className="text-xs capitalize text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</p><p className="mt-1 text-xl font-semibold text-gray-800">{value}</p></div>)}</div></Card>

    <details className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"><summary className="cursor-pointer text-sm font-semibold" style={{ color: '#0b2652' }}>Methodology and thresholds</summary><div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2"><p><strong>MMS:</strong> academic fit at CGPA ≥2.90; financial fit at dues ≤৳35,000.</p><p><strong>Academic:</strong> Low ≥3.50, Moderate 3.00–3.49, High 2.50–2.99, Severe &lt;2.50.</p><p><strong>Financial:</strong> Low at zero, Moderate through ৳35,000, High above it, Severe when unregistered for financial reasons.</p><p><strong>CCR:</strong> completed ÷ expected credits; Low ≥0.85, Moderate ≥0.70, High ≥0.50, Severe below 0.50.</p><p className="md:col-span-2"><strong>Important:</strong> High dropout risk is a deterministic screening indicator, not a confirmed dropout or clinical diagnosis.</p></div></details>
  </div>;
}
