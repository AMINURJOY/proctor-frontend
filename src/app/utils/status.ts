// Shared case-status presentation. Business relabeling requested by the Proctor Office:
//   submitted → Pending, verified → In Progress, closed → Report Incomplete.
// Any other status falls back to title-casing its kebab form (e.g. "under-review" → "Under Review").

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Pending',
  verified: 'In Progress',
  closed: 'Report Incomplete',
};

export function statusLabel(status?: string | null): string {
  if (!status) return '—';
  const key = status.toLowerCase();
  if (STATUS_LABELS[key]) return STATUS_LABELS[key];
  return status
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
