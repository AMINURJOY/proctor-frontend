import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  BellRing,
  ChevronRight,
  FileText,
  Home,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  Mail,
  Menu,
  MessageSquareWarning,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { proctorialBody } from '../data/mockData';
import { landingPathForRole } from '../utils/roleNavigation';

const sectionLinks = [
  { label: 'Home', href: '#home', icon: Home },
  { label: 'Proctorial Body', href: '#proctorial-body', icon: Users },
  { label: 'Procedure', href: '#procedure', icon: ListChecks },
  { label: 'Submit a Concern', href: '#services', icon: FileText },
  { label: 'Privacy & Support', href: '#support', icon: ShieldCheck },
];

const messageExamples = ['Ragging', 'Fighting', 'Threats', 'Urgent safety concern'];
const complaintExamples = ['Harassment', 'Bullying', 'Misconduct', 'Documented complaint'];

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openPortal = () => navigate(currentUser ? landingPathForRole(currentUser.role) : '/login');
  const startSubmission = () => navigate(currentUser ? landingPathForRole(currentUser.role) : '/login?next=/submit');

  const followSection = () => setMobileMenuOpen(false);

  useEffect(() => {
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    return () => { document.documentElement.style.scrollBehavior = previousBehavior; };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="hidden border-b border-slate-100 bg-[#f5f7fa] md:block">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-end gap-5 px-6 text-[11px] font-medium text-slate-500 lg:px-8">
            <a href="#proctorial-body" className="hover:text-[#074b8c]">Proctorial Body</a>
            <a href="#procedure" className="hover:text-[#074b8c]">Procedure</a>
            <a href="#services" className="hover:text-[#074b8c]">Student Services</a>
            <a href="https://aiproctor.daffodilglobal.ai/" target="_blank" rel="noreferrer" className="hover:text-[#074b8c]">AI Proctor</a>
            <a href="mailto:proctoroffice@daffodilvarsity.edu.bd" className="hover:text-[#074b8c]">Contact the Office</a>
          </div>
        </div>

        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 text-left">
            <img src="/daffodil_logo.svg" alt="Daffodil International University" className="h-12 w-auto sm:h-14" />
            <span className="hidden border-l border-slate-200 pl-3 xl:block">
              <span className="block text-sm font-bold text-[#082c52]">Daffodil Proctorial Management System</span>
              <span className="block text-[11px] text-slate-500">DPMS · Student Portal</span>
            </span>
          </button>

          <nav className="hidden items-center gap-5 text-[13px] font-semibold text-[#253f5d] lg:flex" aria-label="Primary navigation">
            <a href="#home" className="transition hover:text-[#0662ad]">Home</a>
            <a href="#proctorial-body" className="transition hover:text-[#0662ad]">Proctorial Body</a>
            <a href="#procedure" className="transition hover:text-[#0662ad]">Procedure</a>
            <a href="#services" className="transition hover:text-[#0662ad]">Submit Concern</a>
            <a href="#support" className="transition hover:text-[#0662ad]">Support</a>
            <a href="https://aiproctor.daffodilglobal.ai/" target="_blank" rel="noreferrer" className="rounded-md border border-[#07559a]/20 bg-blue-50 px-3 py-2 text-[#07559a] transition hover:border-[#07559a]/40 hover:bg-blue-100">AI Proctor</a>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={openPortal} className="inline-flex items-center gap-2 rounded-md bg-[#07559a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-950/10 transition hover:bg-[#064780]">
              {currentUser ? 'Open Portal' : 'Login'}
              <ArrowRight size={15} />
            </button>
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-md border border-slate-200 p-2.5 text-[#082c52] lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-slate-100 bg-white px-5 py-3 shadow-lg lg:hidden" aria-label="Mobile navigation">
            {sectionLinks.map((item) => (
              <a key={item.href} href={item.href} onClick={followSection} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#07559a]">
                <item.icon size={17} /> {item.label}
              </a>
            ))}
            <a href="https://aiproctor.daffodilglobal.ai/" target="_blank" rel="noreferrer" onClick={followSection} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-[#07559a] hover:bg-blue-50">
              <ShieldCheck size={17} /> AI Proctor <ArrowRight size={14} className="ml-auto" />
            </a>
          </nav>
        )}
      </header>

      <main>
        <section id="home" className="relative isolate scroll-mt-28 overflow-hidden bg-[#08335d] text-white">
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(105deg,#062849_0%,rgba(7,55,97,0.96)_48%,rgba(8,57,98,0.78)_100%)]" />
          <div className="absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(115deg,transparent_0%,transparent_44%,rgba(255,255,255,0.2)_44.2%,transparent_44.5%),linear-gradient(25deg,transparent_0%,transparent_58%,rgba(255,255,255,0.16)_58.2%,transparent_58.5%)] [background-size:420px_260px]" />
          <img src="/report_logo.png" alt="" aria-hidden="true" className="absolute -right-16 top-1/2 -z-10 h-[430px] w-[430px] -translate-y-1/2 object-contain opacity-[0.09] sm:right-10" />

          <div className="mx-auto flex min-h-[340px] max-w-7xl items-center px-5 py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-100/80">
                <span>Home</span><ChevronRight size={13} /><span>Proctor Office</span>
              </div>
              <h1 className="mt-5 max-w-5xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[52px]">Daffodil Proctorial Management System (DPMS)</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100/85 sm:text-lg">
                A secure student portal for reporting urgent incidents, submitting formal complaints, and following official updates from the Proctor Office.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button onClick={startSubmission} className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-[#07335d] transition hover:bg-blue-50">
                  Submit a concern <ArrowRight size={16} />
                </button>
                <a href="#procedure" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  View procedure
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:px-8">
            <aside className="hidden lg:block">
              <div className="sticky top-32">
                <p className="border-b border-slate-200 pb-3 text-sm font-bold text-slate-700">Browse by Section (05)</p>
                <nav className="mt-3 border-l border-slate-300" aria-label="Page sections">
                  {sectionLinks.map((item, index) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between border-l-2 px-4 py-3 text-sm font-medium transition ${index === 0 ? '-ml-px border-[#0862a8] bg-[#e7f3fc] text-[#064f8d]' : '-ml-px border-transparent text-slate-600 hover:border-[#0862a8] hover:bg-slate-50 hover:text-[#064f8d]'}`}
                    >
                      <span className="flex items-center gap-2.5"><item.icon size={16} />{item.label}</span>
                      <ChevronRight size={14} />
                    </a>
                  ))}
                </nav>

                <div className="mt-8 border-t border-slate-200 pt-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Quick actions</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={startSubmission} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#174870] hover:border-[#0862a8] hover:bg-blue-50">Submit concern</button>
                    <button onClick={openPortal} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#174870] hover:border-[#0862a8] hover:bg-blue-50">Student login</button>
                  </div>
                </div>

              </div>
            </aside>

            <div className="min-w-0 space-y-16">
              <section aria-labelledby="welcome-title">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0871be]">Student support</p>
                <h2 id="welcome-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">Welcome to Daffodil Proctorial Management System (DPMS)</h2>
                <p className="mt-5 max-w-4xl text-[15px] leading-7 text-slate-600">
                  The portal gives students a clear route to inform the Proctor Office, submit evidence, and receive private case updates. Choose the service that best matches the situation; both are handled through the university workflow.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {[
                    { icon: LockKeyhole, title: 'Secure access', text: 'Sign in with your university account.' },
                    { icon: FileText, title: 'Structured submission', text: 'Provide details and supporting evidence.' },
                    { icon: BellRing, title: 'Private updates', text: 'Follow progress from your student portal.' },
                  ].map((item) => (
                    <div key={item.title} className="border border-slate-200 bg-white p-5 shadow-sm">
                      <item.icon size={22} className="text-[#0871be]" />
                      <h3 className="mt-4 text-sm font-bold text-slate-800">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="proctorial-body" className="scroll-mt-32" aria-labelledby="body-title">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0871be]">Office directory</p>
                    <h2 id="body-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">Proctorial Body</h2>
                  </div>
                  <a href="mailto:proctoroffice@daffodilvarsity.edu.bd" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0862a8] hover:underline">
                    <Mail size={16} /> Contact office
                  </a>
                </div>

                <div className="mt-7 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                    {[proctorialBody.slice(0, 5), proctorialBody.slice(5)].map((members, columnIndex) => (
                      <div key={columnIndex} className="divide-y divide-slate-100">
                        {members.map((member) => {
                          return (
                            <article key={member.id} className="flex min-h-[104px] items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
                              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 shadow-sm">
                                <img src={member.avatar} alt={`Portrait of ${member.name}`} loading="lazy" className="h-full w-full object-cover object-top" onError={(event) => { event.currentTarget.src = '/report_logo.png'; event.currentTarget.className = 'h-full w-full object-contain p-1'; }} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-800">{member.name}</h3>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{member.rank}</p>
                                <a href={`mailto:${member.email}`} className="mt-1 block truncate text-xs text-[#0862a8] hover:underline">{member.email}</a>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section id="procedure" className="scroll-mt-32" aria-labelledby="procedure-title">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0871be]">Submission procedure</p>
                <h2 id="procedure-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">How the portal works</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">The process is designed to be direct for students and traceable for the Proctor Office.</p>

                <div className="mt-8 pb-3" aria-label="Student submission flow">
                  <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:gap-0">
                    {[
                      ['01', 'Sign in', 'Use your university student account.', 'bg-[#0b2652]'],
                      ['02', 'Choose a service', 'Select an urgent message or formal complaint.', 'bg-[#174f86]'],
                      ['03', 'Submit details', 'Describe the concern and attach evidence.', 'bg-[#0871be]'],
                      ['04', 'Follow updates', 'Check My Cases and Notifications.', 'bg-[#168a73]'],
                    ].map(([number, title, text, color], index) => {
                      const shape = index === 0
                        ? 'polygon(0 0, calc(100% - 26px) 0, 100% 50%, calc(100% - 26px) 100%, 0 100%)'
                        : 'polygon(0 0, calc(100% - 26px) 0, 100% 50%, calc(100% - 26px) 100%, 0 100%, 26px 50%)';
                      return (
                        <article
                          key={number}
                          style={{ clipPath: shape }}
                          className={`relative flex h-28 w-full min-w-0 items-center pr-7 text-white shadow-sm transition-transform duration-200 hover:-translate-y-1 sm:flex-1 ${index === 0 ? 'pl-5' : 'pl-9 sm:-ml-2'} ${color}`}
                        >
                          <span className="mr-3 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-bold ring-1 ring-white/25">{number}</span>
                          <span className="min-w-0">
                            <h3 className="text-sm font-bold leading-5">{title}</h3>
                            <p className="mt-1 text-xs leading-4 text-white/80">{text}</p>
                          </span>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section id="services" className="scroll-mt-32" aria-labelledby="services-title">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0871be]">Student services</p>
                <h2 id="services-title" className="mt-3 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">Choose the right submission</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Both options reach the Proctor Office. Choose based on urgency and the level of detail required.</p>

                <div className="mt-8 grid gap-5 xl:grid-cols-2">
                  <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-5 border-b border-slate-100 p-5">
                      <img src="/animations/urgent-fight.gif" alt="Illustration of an urgent incident" className="h-24 w-24 shrink-0 rounded-md bg-blue-50 object-contain" />
                      <div>
                        <div className="flex items-center gap-2 text-[#0862a8]"><MessageSquareWarning size={19} /><span className="text-xs font-bold uppercase tracking-wider">Urgent incident</span></div>
                        <h3 className="mt-2 text-xl font-bold text-slate-800">Message to Proctor</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">For a situation the Proctor Office should know about quickly.</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm leading-7 text-slate-600">আপনার যদি মনে হয়, এমন কোনো ঘটনা বা পরিস্থিতি ঘটছে, যা Proctor Office-কে জানানো উচিত, তাহলে অনুগ্রহ করে আমাদের জানান।</p>
                      <div className="mt-4 flex flex-wrap gap-2">{messageExamples.map((item) => <span key={item} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#07559a]">{item}</span>)}</div>
                    </div>
                  </article>

                  <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-5 border-b border-slate-100 p-5">
                      <img src="/animations/complaint-writing.gif" alt="Illustration of writing a formal complaint" className="h-24 w-24 shrink-0 rounded-md bg-violet-50 object-contain" />
                      <div>
                        <div className="flex items-center gap-2 text-violet-700"><FileText size={19} /><span className="text-xs font-bold uppercase tracking-wider">Formal complaint</span></div>
                        <h3 className="mt-2 text-xl font-bold text-slate-800">Complain to Proctor</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">For a detailed complaint with person information and documents.</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm leading-7 text-slate-600">আপনার যদি কারও বিরুদ্ধে কোনো অভিযোগ থাকে, তাহলে অনুগ্রহ করে এখানে জমা দিন।</p>
                      <div className="mt-4 flex flex-wrap gap-2">{complaintExamples.map((item) => <span key={item} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">{item}</span>)}</div>
                    </div>
                  </article>
                </div>

                <button onClick={startSubmission} className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#07559a] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#064780]">
                  Sign in and submit <ArrowRight size={16} />
                </button>
              </section>

              <section id="support" className="scroll-mt-32 overflow-hidden rounded-lg bg-[#f0f7fc]" aria-labelledby="support-title">
                <div className="grid lg:grid-cols-[1fr_280px]">
                  <div className="p-7 sm:p-9">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#07559a] text-white"><LifeBuoy size={22} /></div>
                    <h2 id="support-title" className="mt-5 text-2xl font-semibold text-slate-800">Private, role-based case handling</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Case information is handled inside the university workflow. Students receive relevant updates through their own account, while office access follows assigned responsibilities.</p>
                  </div>
                  <div className="flex flex-col justify-center bg-[#0a4d85] p-7 text-white sm:p-9">
                    <ShieldCheck size={28} className="text-blue-200" />
                    <p className="mt-4 text-sm font-bold">Need to check an update?</p>
                    <p className="mt-2 text-xs leading-5 text-blue-100/80">Open your portal to view My Cases, Notifications, and Warnings.</p>
                    <button onClick={openPortal} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white hover:underline">Open portal <ArrowRight size={15} /></button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="bg-[#07559a] text-white">
          <div className="mx-auto grid max-w-7xl sm:grid-cols-3">
            {[
              { icon: MessageSquareWarning, title: 'Message to Proctor', text: 'Report an urgent incident', action: startSubmission },
              { icon: FileText, title: 'Complain to Proctor', text: 'Submit a formal complaint', action: startSubmission },
              { icon: LockKeyhole, title: 'Student Portal', text: 'Track cases and notifications', action: openPortal },
            ].map((item, index) => (
              <button key={item.title} onClick={item.action} className={`flex items-center justify-between gap-4 px-6 py-6 text-left transition hover:bg-white/10 sm:px-8 ${index > 0 ? 'border-t border-white/15 sm:border-l sm:border-t-0' : ''}`}>
                <span className="flex items-center gap-4"><item.icon size={24} className="text-blue-200" /><span><span className="block text-sm font-bold">{item.title}</span><span className="mt-1 block text-xs text-blue-100/75">{item.text}</span></span></span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#052b4d] text-blue-100/75">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
            <div>
              <img src="/daffodil_logo.svg" alt="Daffodil International University" className="h-14 w-auto rounded-md bg-white px-2 py-1" />
              <h2 className="mt-5 text-base font-bold text-white">Daffodil Proctorial Management System (DPMS)</h2>
              <p className="mt-3 max-w-sm text-sm leading-6">A secure university portal for student incident reporting, formal complaints, and disciplinary case updates.</p>
              <a href="mailto:proctoroffice@daffodilvarsity.edu.bd" className="mt-4 inline-flex items-center gap-2 text-sm text-white hover:underline"><Mail size={15} /> proctoroffice@daffodilvarsity.edu.bd</a>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">Student Services</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm"><a href="#services" className="hover:text-white">Message to Proctor</a><a href="#services" className="hover:text-white">Complain to Proctor</a><a href="#procedure" className="hover:text-white">Submission Procedure</a></div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Portal</h3>
              <div className="mt-4 flex flex-col items-start gap-3 text-sm"><button onClick={openPortal} className="hover:text-white">Student Login</button><button onClick={openPortal} className="hover:text-white">My Cases</button><button onClick={openPortal} className="hover:text-white">Notifications</button><button onClick={openPortal} className="hover:text-white">Warnings</button></div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Office Information</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm"><a href="#proctorial-body" className="hover:text-white">Proctorial Body</a><a href="#support" className="hover:text-white">Privacy &amp; Support</a><a href="mailto:proctoroffice@daffodilvarsity.edu.bd" className="hover:text-white">Contact the Office</a></div>
              <a href="https://aiproctor.daffodilglobal.ai/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm hover:text-white">AI Proctor <ArrowRight size={13} /></a>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Daffodil International University. All rights reserved.</p>
            <p>Daffodil Proctorial Management System (DPMS)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
