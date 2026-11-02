import { CheckCircle2, FileCheck2 } from 'lucide-react';

const steps = [
  { key: 'completed-reports', label: 'Completed Reports', detail: 'Proctor Office' },
  { key: 'registrar-review', label: 'Registrar', detail: 'Report review' },
  { key: 'vc-review', label: 'VC', detail: 'Review' },
  { key: 'dc-chairman-review', label: 'DC Chairman', detail: 'Send for comments' },
  { key: 'dc-member-review', label: 'DC Members', detail: 'Optional comments' },
  { key: 'dc-secretary-review', label: 'DCS', detail: 'Prepare resolution' },
  { key: 'resolution-dc-chairman-review', label: 'DC Chairman', detail: 'Resolution review' },
  { key: 'chairman-review', label: 'Chairman', detail: 'Final approval' },
  { key: 'completed', label: 'Completed', detail: 'Approved resolution' },
];

const stepColors = [
  'bg-[#0b2652]',
  'bg-[#17457f]',
  'bg-[#2563a6]',
  'bg-[#3478b8]',
  'bg-[#3c8cae]',
  'bg-[#287d88]',
  'bg-[#316f78]',
  'bg-[#256554]',
  'bg-[#198754]',
];

export default function ReportWorkflowOverview({ activeStage }: { activeStage: string }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Report forwarding workflow">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#0b2652]"><FileCheck2 size={17}/> Report Forwarding Workflow</h2>
        <p className="mt-0.5 text-xs text-slate-500">Follow the finalized report from the Proctor Office through final approval.</p>
      </div>
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Selected status is highlighted</span>
    </div>

    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-stretch pr-3">
        {steps.map((step, index) => {
          const active = step.key === activeStage;
          const last = index === steps.length - 1;
          const shape = index === 0
            ? 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)'
            : 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)';
          return <div
            key={step.key}
            style={{
              clipPath: shape,
              filter: active
                ? 'drop-shadow(0 0 2px #fff3a3) drop-shadow(0 0 7px rgba(250, 204, 21, 0.95)) drop-shadow(0 3px 5px rgba(180, 83, 9, 0.35))'
                : undefined,
            }}
            className={`relative flex h-16 min-w-40 items-center py-2 pr-7 text-white transition-all duration-200 ${index === 0 ? 'pl-3' : '-ml-1 pl-7'} ${active ? 'z-20 -translate-y-0.5 bg-yellow-400 text-amber-950' : stepColors[index]}`}
            aria-current={active ? 'step' : undefined}
          >
            <span className={`mr-2 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${active ? 'bg-amber-900 text-yellow-100 ring-2 ring-yellow-100/90' : 'bg-white/20'}`}>{last ? <CheckCircle2 size={15}/> : index + 1}</span>
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-xs font-bold">{step.label}</span>
              <span className={`mt-0.5 block whitespace-nowrap text-[10px] ${active ? 'text-amber-900/80' : 'text-white/80'}`}>{step.detail}</span>
            </span>
          </div>;
        })}
      </div>
    </div>
  </section>;
}
