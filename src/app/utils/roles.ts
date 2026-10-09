// Human-readable role names. The kebab-case keys are the wire format used by the API;
// anything not listed here is title-cased from its key ("deputy-proctor" → "Deputy Proctor").
//
// "Coordinator" is a legacy key: the role is the Proctor Office's Administrative Officer and
// carries the same power as the Proctor. Only the label differs — renaming the enum would
// ripple through forwarding rules, seeded settings and persisted values.
const ROLE_LABELS: Record<string, string> = {
  'coordinator': 'Assistant Administrative Officer',
  'female-coordinator': 'Female Administrative Officer',
  'vc': 'VC',
  'super-admin': 'Super Admin',
  'external': 'External Participant',
  'dc-chairman': 'DC Chairman',
  'dc-member': 'DC Member',
  'dc-secretary': 'DC Secretary',
  'chairman': 'Chairman',
};

export function normalizeRoleKey(role?: string): string {
  if (!role) return '';
  const aliases: Record<string, string> = {
    'v-c': 'vc',
    'd-c-chairman': 'dc-chairman',
    'd-c-member': 'dc-member',
    'd-c-secretary': 'dc-secretary',
    'dcchairman': 'dc-chairman',
    'dcmember': 'dc-member',
    'dcsecretary': 'dc-secretary',
  };
  return aliases[role] || role;
}

export function roleLabel(role?: string): string {
  const normalizedRole = normalizeRoleKey(role);
  if (!normalizedRole) return '';
  return (
    ROLE_LABELS[normalizedRole] ??
    normalizedRole.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  );
}
