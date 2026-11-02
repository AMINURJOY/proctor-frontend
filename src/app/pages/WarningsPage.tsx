import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { warningsApi } from '../services/api';

type WarningItem = { id: string; caseNumber: string; studentName: string; studentId: string; remarks: string; sourceStage: string; issuedByName: string; issuedAt: string; isRead: boolean };

export default function WarningsPage() {
  const [items, setItems] = useState<WarningItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { warningsApi.getAll().then(r => setItems(r.data.data || [])).catch(() => toast.error('Could not load warnings.')).finally(() => setLoading(false)); }, []);
  const markRead = async (id: string) => { await warningsApi.markRead(id); setItems(value => value.map(x => x.id === id ? { ...x, isRead: true } : x)); window.dispatchEvent(new Event('warnings-updated')); };
  const markAll = async () => { await warningsApi.markAllRead(); setItems(value => value.map(x => ({ ...x, isRead: true }))); window.dispatchEvent(new Event('warnings-updated')); };

  return <div className="space-y-5"><header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-[#0b2652]">Warnings</h1><p className="mt-1 text-sm text-slate-500">Official warnings issued by the Proctor Office or an approved disciplinary resolution.</p></div><button onClick={markAll} disabled={!items.some(x => !x.isRead)} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"><CheckCheck size={16}/> Mark all read</button></header>
    {loading ? <div className="flex justify-center py-16 text-slate-500"><Loader2 className="mr-2 animate-spin"/> Loading warnings…</div> : items.length === 0 ? <div className="rounded-xl border bg-white p-12 text-center text-slate-500">You have no warnings.</div> : <div className="space-y-3">{items.map(item => <article key={item.id} className={`rounded-xl border p-4 shadow-sm ${item.isRead ? 'border-slate-200 bg-white' : 'border-amber-300 bg-amber-50'}`}><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"><AlertTriangle size={20}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-[#0b2652]">Warning for {item.caseNumber}</h2><span className="text-xs text-slate-500">{new Date(item.issuedAt).toLocaleString()}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.remarks}</p><p className="mt-2 text-xs text-slate-500">Issued by {item.issuedByName} · {item.sourceStage === 'final-resolution' ? 'Approved resolution' : 'Proctor Office'}</p>{!item.isRead && <button onClick={() => markRead(item.id)} className="mt-3 rounded-lg bg-[#0b2652] px-3 py-1.5 text-xs font-medium text-white">Mark as read</button>}</div></div></article>)}</div>}
  </div>;
}
