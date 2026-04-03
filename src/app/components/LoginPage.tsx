import { useAuth } from '../context/AuthContext';
import { users } from '../data/mockData';
import { useNavigate } from 'react-router';
import { LockIcon, UserIcon } from './Icons';
import { useState } from 'react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (userId: string) => {
    login(userId);
    navigate('/dashboard');
  };

  const handleFormLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const matchedUser = users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());

    if (!matchedUser || !password.trim()) {
      setError('Enter a valid university email and demo password to continue.');
      return;
    }

    setError('');
    handleLogin(matchedUser.id);
  };

  const roleColors: Record<string, string> = {
    'student': 'bg-blue-100 text-blue-700',
    'coordinator': 'bg-green-100 text-green-700',
    'proctor': 'bg-purple-100 text-purple-700',
    'assistant-proctor': 'bg-indigo-100 text-indigo-700',
    'deputy-proctor': 'bg-pink-100 text-pink-700',
    'registrar': 'bg-orange-100 text-orange-700',
    'disciplinary-committee': 'bg-red-100 text-red-700',
    'female-coordinator': 'bg-teal-100 text-teal-700',
    'sexual-harassment-committee': 'bg-amber-100 text-amber-700',
    'vc': 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="min-h-[100svh] w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_#f4f7fc_0%,_#e9eef8_45%,_#dde7f4_100%)]">
      <div className="grid min-h-[100svh] w-full lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex min-h-[42svh] items-center overflow-hidden bg-[#0b2652] px-6 py-10 text-white shadow-2xl sm:px-8 md:px-12 lg:min-h-[100svh] lg:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(78,124,255,0.18),_transparent_40%)]" />
          <div className="absolute -right-16 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-14 bottom-10 h-32 w-32 rounded-full bg-blue-300/10 blur-3xl" />

          <div className="relative flex w-full flex-col justify-between gap-10 lg:min-h-[80vh]">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/85 backdrop-blur">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <LockIcon />
                </div>
                Secure access for university case operations
              </div>

              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Proctor Office Automation System
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 md:text-lg">
                Manage incidents, cases, hearings, and committee workflows from a single professional portal built for clarity and control.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {['Case tracking', 'Hearing scheduling', 'Role-based access'].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/90 backdrop-blur">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Secure', value: 'Access' },
                { label: 'Unified', value: 'Workflow' },
                { label: 'Trusted by', value: 'Committees' },
              ].map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/55">{metric.label}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{metric.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-[58svh] flex-col justify-center overflow-y-auto bg-white px-6 py-8 shadow-[0_0_0_1px_rgba(15,23,42,0.06)] sm:px-8 md:px-12 lg:min-h-[100svh] lg:px-16 lg:py-12">
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#0b2652]">Sign In</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Use your university email to continue, or pick a quick login profile below for demo access.
              </p>
            </div>

            <form onSubmit={handleFormLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  University Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@university.edu"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b2652] focus:bg-white focus:ring-4 focus:ring-[#0b2652]/10"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Demo Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter any demo password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0b2652] focus:bg-white focus:ring-4 focus:ring-[#0b2652]/10"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#0b2652]/10 bg-[#0b2652]/5 px-4 py-3 text-sm text-slate-600">
                  Demo tip: any listed university email works with the quick login profiles below.
                </div>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b2652] px-4 py-3.5 font-medium text-white shadow-lg shadow-[#0b2652]/20 transition hover:bg-[#10336a]"
              >
                <LockIcon />
                Sign In
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Quick Login</h3>
                  <p className="text-sm text-slate-500">Select a role to jump directly into the portal.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {users.length} roles
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleLogin(user.id)}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#0b2652]/25 hover:bg-white hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0b2652] text-white shadow-lg shadow-[#0b2652]/20">
                        <UserIcon />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-slate-900">{user.name}</h4>
                        <p className="mt-1 truncate text-xs text-slate-500">{user.email}</p>
                        <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[user.role]}`}>
                          {user.role.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-5 text-center text-sm text-slate-500">
                Demo System - Choose any account to enter immediately.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
