// Human-readable role names. The kebab-case keys are the wire format used by the API;
// anything not listed here is title-cased from its key ("deputy-proctor" → "Deputy Proctor").
//
// "Coordinator" is a legacy key: the role is the Proctor Office's Administrative Officer and
// carries the same power as the Proctor. Only the label differs — renaming the enum would
// ripple through forwarding rules, seeded settings and persisted values.
const ROLE_LABELS: Record<string, string> = {
  'coordinator': 'Administrative Officer',
  'female-coordinator': 'Female Administrative Officer',
  'vc': 'VC',
  'super-admin': 'Super Admin',
  'external': 'External Participant',
};

export function roleLabel(role?: string): string {
  if (!role) return '';
  return (
    ROLE_LABELS[role] ??
    role.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  );
}
