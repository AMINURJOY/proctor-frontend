import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, LockKeyhole, UserRound } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { proctorialBody, users } from '../data/mockData';
import { User } from '../types';
import { landingPathForRole } from '../utils/roleNavigation';
import { roleLabel } from '../utils/roles';

const roleColors: Record<string, string> = {
  student: 'bg-blue-600 hover:bg-blue-700',
  coordinator: 'bg-emerald-700 hover:bg-emerald-800',
  proctor: 'bg-purple-700 hover:bg-purple-800',
  'assistant-proctor': 'bg-sky-700 hover:bg-sky-800',
  'deputy-proctor': 'bg-indigo-600 hover:bg-indigo-700',
  registrar: 'bg-orange-600 hover:bg-orange-700',
  'disciplinary-committee': 'bg-rose-800 hover:bg-rose-900',
  'female-coordinator': 'bg-teal-600 hover:bg-teal-700',
  'sexual-harassment-committee': 'bg-amber-600 hover:bg-amber-700',
  vc: 'bg-slate-700 hover:bg-slate-800',
  'super-admin': 'bg-green-700 hover:bg-green-800',
  external: 'bg-stone-600 hover:bg-stone-700',
  'dc-chairman': 'bg-fuchsia-700 hover:bg-fuchsia-800',
  'dc-member': 'bg-violet-700 hover:bg-violet-800',
  'dc-secretary': 'bg-indigo-700 hover:bg-indigo-800',
  chairman: 'bg-rose-800 hover:bg-rose-900',
};

export default function LoginPage() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoginOpen, setQuickLoginOpen] = useState(true);

  const committeeAccounts = useMemo(
    () => users.filter((user) =>
      ['registrar', 'disciplinary-committee', 'vc', 'sexual-harassment-committee', 'dc-chairman', 'dc-member', 'dc-secretary', 'chairman'].includes(user.role)
    ),
    []
  );
  const otherAccounts = useMemo(() => users.filter((user) => user.role === 'student' || user.role === 'super-admin'), []);
  const quickLoginProfiles = [...proctorialBody, ...committeeAccounts, ...otherAccounts];

  const destinationFor = (user: User) => {
    const requestedPath = searchParams.get('next');
    const safeRequestedPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : null;
    return user.role === 'student' && safeRequestedPath ? safeRequestedPath : landingPathForRole(user.role);
  };

  const handleFormLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user) navigate(destinationFor(user));
      else setError('Invalid email, student ID, or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: User) => {
    setError('');
    setLoading(true);
    try {
      const demoPassword = user.role === 'super-admin' ? 'Admin@123!' : 'Password123!';
      const loggedInUser = await login(user.email, demoPassword);
      if (loggedInUser) navigate(destinationFor(loggedInUser));
      else setError('Quick login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderQuickLoginChip = (user: User) => (
    <button
      key={user.id}
      type="button"
      onClick={() => handleQuickLogin(user)}
      disabled={loading}
      title={`${user.name} - ${user.rank ?? roleLabel(user.role)} (${user.email})`}
      className={`min-w-0 rounded-lg px-2.5 py-2 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${roleColors[user.role] ?? 'bg-slate-700 hover:bg-slate-800'}`}
    >
      <span className="block truncate text-xs font-semibold leading-tight">{user.name}</span>
      <span className="mt-0.5 block truncate text-[10px] leading-tight text-white/75">{user.rank ?? roleLabel(user.role)}</span>
    </button>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f4f6f8] px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-65">
        <div className="absolute inset-0 [background-image:linear-gradient(28deg,transparent_49.7%,rgba(11,38,82,0.09)_50%,transparent_50.3%),linear-gradient(152deg,transparent_49.7%,rgba(11,38,82,0.07)_50%,transparent_50.3%)] [background-size:310px_230px]" />
        <div className="absolute -bottom-36 -left-20 h-[460px] w-[120%] rounded-[50%] border-[3px] border-cyan-300/45" />
        <div className="absolute -bottom-44 -left-32 h-[430px] w-[125%] rounded-[50%] border-2 border-white" />
        <div className="absolute bottom-14 left-[22%] h-5 w-5 rounded-full bg-white shadow-[0_0_28px_10px_rgba(103,232,249,0.55)]" />
        <div className="absolute bottom-24 right-[18%] h-4 w-4 rounded-full bg-white shadow-[0_0_24px_9px_rgba(103,232,249,0.45)]" />
      </div>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="relative z-10 mx-auto flex w-full max-w-5xl items-center gap-2 text-sm font-semibold text-[#0b2652] transition hover:text-blue-700"
      >
        <ArrowLeft size={17} /> Back to home
      </button>

      <main className="relative z-10 mx-auto mt-7 flex w-full max-w-5xl flex-col items-center">
        <img src="/daffodil_logo.svg" alt="Daffodil International University" className="h-auto w-[245px] sm:w-[290px]" />
        <p className="mt-2 text-sm font-semibold text-[#0b2652]">Proctor Office Student Support Portal</p>

        <section className="mt-8 w-full max-w-[520px] border-t-4 border-blue-600 bg-white px-6 py-7 shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:px-10 sm:py-8" aria-labelledby="login-heading">
          <div className="text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700"><LockKeyhole size={21} /></div>
            <h1 id="login-heading" className="mt-4 text-2xl font-medium text-slate-800 sm:text-3xl">Sign in to your account</h1>
            <p className="mt-2 text-sm text-slate-500">Use your university account to continue securely.</p>
          </div>

          <form onSubmit={handleFormLogin} className="mt-7 space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700">University Email or Student ID</label>
              <div className="relative">
                <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="student@diu.edu.bd or 023-001"
                  className="h-12 w-full border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>
            </div>

            {error && <div role="alert" className="border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>}

            <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {currentUser && (
            <button type="button" onClick={() => navigate(landingPathForRole(currentUser.role))} className="mt-3 w-full text-center text-xs font-semibold text-blue-700 hover:underline">
              You are already signed in — open your portal
            </button>
          )}
        </section>

        <section className="mt-5 w-full max-w-3xl rounded-xl border border-slate-200 bg-white/95 shadow-lg shadow-slate-900/5">
          <button
            type="button"
            onClick={() => setQuickLoginOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            aria-expanded={quickLoginOpen}
          >
            <div>
              <h2 className="text-sm font-bold text-[#0b2652]">Quick Login <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-700">Demo only</span></h2>
              <p className="mt-1 text-xs text-slate-500">Choose a seeded account for testing. This section can be removed later.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-500">
              {quickLoginProfiles.length} profiles
              {quickLoginOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </div>
          </button>

          {quickLoginOpen && (
            <div className="border-t border-slate-200 px-5 pb-5 pt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Proctorial Body</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{proctorialBody.map(renderQuickLoginChip)}</div>

              <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Registrar, Committees &amp; VC</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{committeeAccounts.map(renderQuickLoginChip)}</div>

              {otherAccounts.length > 0 && (
                <>
                  <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Student &amp; Admin</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{otherAccounts.map(renderQuickLoginChip)}</div>
                </>
              )}
            </div>
          )}
        </section>

        <p className="mt-6 max-w-xl text-center text-xs leading-5 text-slate-500">For account access problems, contact the university support team. Do not share your password with anyone.</p>
      </main>
    </div>
  );
}
