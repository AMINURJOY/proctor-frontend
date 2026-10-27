export function caseTypeLabel(type?: string | null): string {
  if (type === 'type-1') return 'Message to Proctor';
  if (type === 'type-2') return 'Complain to Proctor';
  if (type === 'confidential') return 'Confidential';
  if (type === 'type-3') return 'Type-3';
  return type || '—';
}
