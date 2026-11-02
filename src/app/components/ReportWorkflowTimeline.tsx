import { ArrowRight } from 'lucide-react';

export type ReportWorkflowTransition = {
  from: string;
  to: string;
  actorName: string;
  actorRole: string;
  targetRole: string;
  remarks?: string;
  createdAt: string;
};

const roleLabel = (value: string) => value === 'vc'
  ? 'VC'
  : value.split('-').map(part => part.toUpperCase() === 'dc' ? 'DC' : part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

const colors = [
  'border-[#0b2652] bg-[#0b2652] text-white',
  'border-blue-700 bg-blue-700 text-white',
  'border-indigo-600 bg-indigo-600 text-white',
  'border-cyan-700 bg-cyan-700 text-white',
  'border-teal-700 bg-teal-700 text-white',
];

export default function ReportWorkflowTimeline({ transitions, pending = false }: {
  transitions: ReportWorkflowTransition[];
  pending?: boolean;
}) {
  if (!transitions.length) return <p className="text-sm text-slate-500">No forwarding steps have been recorded yet.</p>;

  return <div className="overflow-x-auto pb-2">
    <div className="flex min-w-max items-stretch gap-1">
      {transitions.map((item, index) => {
        const isLast = index === transitions.length - 1;
        return <div key={`${item.createdAt}-${index}`} className="flex items-center">
          <div className={`min-w-44 max-w-64 rounded-lg border px-3 py-2 shadow-sm ${colors[index % colors.length]}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide">{index + 1}. {roleLabel(item.targetRole)}</span>
              {isLast && pending && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-950">Pending</span>}
            </div>
            <p className="mt-1 truncate text-xs opacity-85" title={`${item.actorName} (${roleLabel(item.actorRole)})`}>
              From {roleLabel(item.actorRole)} · {item.actorName}
            </p>
            <p className="mt-1 text-[10px] opacity-75">{new Date(item.createdAt).toLocaleString()}</p>
            {!!item.remarks?.trim() && <p className="mt-2 line-clamp-2 border-t border-white/20 pt-1.5 text-xs" title={item.remarks}>{item.remarks}</p>}
          </div>
          {!isLast && <ArrowRight size={20} strokeWidth={2.5} className="mx-1 shrink-0 text-slate-400" aria-hidden="true" />}
        </div>;
      })}
    </div>
  </div>;
}
