import { useState } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#3F3A6D",
  secondary: "#2E5AAC",
  accent: "#2DBE60",
  bg: "#F5F6FA",
  card: "#FFFFFF",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
};

const CREDENTIALS = [
  { role: "student",       label: "Student",                    email: "student@uni.edu",      password: "student123",   name: "Rahim Ahmed",          avatar: "RA" },
  { role: "officer",       label: "Officer / Coordinator",      email: "officer@uni.edu",      password: "officer123",   name: "Fatima Begum",         avatar: "FB" },
  { role: "proctor",       label: "Proctor",                    email: "proctor@uni.edu",      password: "proctor123",   name: "Prof. Dr. Karim",      avatar: "PK" },
  { role: "deputy",        label: "Deputy Proctor",             email: "deputy@uni.edu",       password: "deputy123",    name: "Dr. Nasrin Sultana",   avatar: "NS" },
  { role: "assistant",     label: "Assistant Proctor",          email: "assistant@uni.edu",    password: "assist123",    name: "Mr. Hasan Ali",        avatar: "HA" },
  { role: "registrar",     label: "Registrar Office",           email: "registrar@uni.edu",    password: "registrar123", name: "Md. Selim Reza",       avatar: "SR" },
  { role: "disciplinary",  label: "Disciplinary Committee",     email: "disc@uni.edu",         password: "disc123",      name: "Prof. Anwar Hossain",  avatar: "AH" },
  { role: "harassment",    label: "Sexual Harassment Committee",email: "harassment@uni.edu",   password: "harass123",    name: "Dr. Shamima Akhter",   avatar: "SA" },
  { role: "vc",            label: "Vice Chancellor",            email: "vc@uni.edu",           password: "vc123",        name: "Prof. Dr. M. Rafiq",   avatar: "VC" },
  { role: "system",        label: "System Admin",               email: "admin@uni.edu",        password: "admin123",     name: "System Administrator", avatar: "SY" },
  { role: "fcoord",        label: "Female Coordinator",         email: "fcoord@uni.edu",       password: "fcoord123",    name: "Ms. Roksana Parvin",   avatar: "RP" },
];

const DUMMY_CASES = [
  { id:"CASE-001", type:"Type-2", category:"Normal",       status:"Pending Review",    student:"Rahim Ahmed",   subject:"Ragging incident in dormitory",         date:"2026-03-15", priority:"High",   assignedTo:"Proctor" },
  { id:"CASE-002", type:"Type-1", category:"Instant",      status:"Converted",         student:"Sumon Das",     subject:"Physical assault near cafeteria",        date:"2026-03-16", priority:"High",   assignedTo:"Deputy Proctor" },
  { id:"CASE-003", type:"Type-2", category:"Confidential", status:"Under Investigation",student:"Nasrin Akter", subject:"Harassment by faculty member",           date:"2026-03-17", priority:"Critical",assignedTo:"Sexual Harassment Committee" },
  { id:"CASE-004", type:"Type-2", category:"Normal",       status:"Resolved",          student:"Kamal Hossain", subject:"Bullying in library",                   date:"2026-03-10", priority:"Medium", assignedTo:"Closed" },
  { id:"CASE-005", type:"Type-2", category:"Normal",       status:"Forwarded to Registrar",student:"Tania Begum",subject:"Drug use on campus",                  date:"2026-03-18", priority:"Critical",assignedTo:"Registrar" },
  { id:"CASE-006", type:"Type-1", category:"Instant",      status:"Closed",            student:"Jahid Islam",   subject:"Minor altercation in corridor",          date:"2026-03-12", priority:"Low",    assignedTo:"Closed" },
  { id:"CASE-007", type:"Type-2", category:"Normal",       status:"Hearing Scheduled", student:"Mitu Rani",     subject:"Academic dishonesty complaint",          date:"2026-03-19", priority:"Medium", assignedTo:"Assistant Proctor" },
  { id:"CASE-008", type:"Type-2", category:"Confidential", status:"Resolved",          student:"Confidential",  subject:"Confidential - Harassment Case",         date:"2026-03-08", priority:"Critical",assignedTo:"Closed" },
];

const STATS = { active: 12, pending: 7, resolved: 34, confidential: 3 };

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const Badge = ({ text, color }) => {
  const map = {
    High:"#EF4444", Critical:"#DC2626", Medium:"#F59E0B", Low:"#6B7280",
    "Pending Review":"#F59E0B","Converted":"#3B82F6","Under Investigation":"#8B5CF6",
    "Resolved":"#2DBE60","Forwarded to Registrar":"#EF4444","Closed":"#6B7280",
    "Hearing Scheduled":"#2E5AAC","Active":"#2DBE60","Normal":"#2E5AAC","Confidential":"#8B5CF6",
    "Type-1":"#F59E0B","Type-2":"#3F3A6D","Instant":"#F59E0B",
  };
  const bg = color || map[text] || "#6B7280";
  return (
    <span style={{ background: bg, color: "#fff", borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 700, whiteSpace:"nowrap" }}>
      {text}
    </span>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(63,58,109,0.08)", padding: 24, ...style }}>
    {children}
  </div>
);

const StatCard = ({ label, value, color, icon }) => (
  <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(63,58,109,0.08)", padding: "20px 24px", display:"flex", alignItems:"center", gap: 16 }}>
    <div style={{ background: color + "18", borderRadius: 12, width: 52, height: 52, display:"flex", alignItems:"center", justifyContent:"center", fontSize: 22 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{label}</div>
    </div>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled = false }) => {
  const base = { borderRadius: 999, padding: "10px 24px", fontWeight: 700, fontSize: 14, border: "none", cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s", ...style };
  const variants = {
    primary:   { background: COLORS.primary,   color: "#fff" },
    secondary: { background: COLORS.secondary, color: "#fff" },
    accent:    { background: COLORS.accent,    color: "#fff" },
    outline:   { background: "transparent", color: COLORS.primary, border: `2px solid ${COLORS.primary}` },
    danger:    { background: "#EF4444", color: "#fff" },
    warning:   { background: "#F59E0B", color: "#fff" },
    ghost:     { background: "#F3F4F6", color: COLORS.textPrimary },
  };
  return <button style={{ ...base, ...variants[variant], opacity: disabled ? 0.6 : 1 }} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Input = ({ label, type = "text", value, onChange, placeholder }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 6 }}>{label}</div>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing:"border-box", color: COLORS.textPrimary, background: "#FAFAFA" }}
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 6 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", background: "#FAFAFA", color: COLORS.textPrimary }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 6 }}>{label}</div>}
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", resize:"vertical", boxSizing:"border-box", background: "#FAFAFA", color: COLORS.textPrimary }}
    />
  </div>
);

const Table = ({ cols, rows }) => (
  <div style={{ overflowX:"auto" }}>
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ background: COLORS.primary + "10" }}>
          {cols.map(c => <th key={c} style={{ padding:"10px 14px", textAlign:"left", color: COLORS.primary, fontWeight: 700, borderBottom:"2px solid #E5E7EB", whiteSpace:"nowrap" }}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
            {row.map((cell, j) => <td key={j} style={{ padding:"10px 14px", color: COLORS.textPrimary, verticalAlign:"middle" }}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding: 20 }} onClick={onClose}>
    <div style={{ background:"#fff", borderRadius:20, padding:32, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:800, color:COLORS.primary }}>{title}</div>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:COLORS.textSecondary }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Sidebar = ({ user, activeTab, setActiveTab, tabs, onLogout }) => (
  <div style={{ width: 240, background: COLORS.primary, minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
    <div style={{ padding:"28px 20px 20px", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ fontSize: 11, color:"rgba(255,255,255,0.5)", fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Proctor System</div>
      <div style={{ fontSize: 15, fontWeight:800, color:"#fff" }}>University Portal</div>
    </div>
    <div style={{ padding:"16px 12px", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:"50%", background: COLORS.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", flexShrink:0 }}>{user.avatar}</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", lineHeight:1.2 }}>{user.name}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{user.label}</div>
        </div>
      </div>
    </div>
    <nav style={{ flex:1, padding:"12px 8px", overflowY:"auto" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActiveTab(t.id)}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer", marginBottom:2,
            background: activeTab === t.id ? "rgba(255,255,255,0.15)" : "transparent",
            color: activeTab === t.id ? "#fff" : "rgba(255,255,255,0.7)", fontSize:13, fontWeight: activeTab === t.id ? 700 : 500, textAlign:"left", transition:"all 0.15s" }}>
          <span style={{ fontSize:16 }}>{t.icon}</span>{t.label}
        </button>
      ))}
    </nav>
    <div style={{ padding:12 }}>
      <button onClick={onLogout} style={{ width:"100%", padding:"10px", background:"rgba(255,255,255,0.1)", color:"#fff", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600 }}>
        🚪 Logout
      </button>
    </div>
  </div>
);

const Layout = ({ user, tabs, activeTab, setActiveTab, onLogout, children }) => (
  <div style={{ display:"flex", minHeight:"100vh", background: COLORS.bg, fontFamily:"'Segoe UI', sans-serif" }}>
    <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} onLogout={onLogout} />
    <div style={{ flex:1, padding:32, overflowY:"auto", minWidth:0 }}>
      <div style={{ marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color: COLORS.textPrimary }}>{tabs.find(t=>t.id===activeTab)?.label}</div>
          <div style={{ fontSize:13, color: COLORS.textSecondary, marginTop:2 }}>{new Date().toLocaleDateString("en-BD", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ background: COLORS.accent + "20", color: COLORS.accent, borderRadius:999, padding:"4px 14px", fontSize:12, fontWeight:700 }}>● Online</div>
        </div>
      </div>
      {children}
    </div>
  </div>
);

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
const Landing = ({ onSelectRole }) => {
  return (
    <div style={{ minHeight:"100vh", background: COLORS.bg, fontFamily:"'Segoe UI', sans-serif" }}>
      <nav style={{ background:"#fff", boxShadow:"0 2px 12px rgba(63,58,109,0.08)", padding:"0 40px", display:"flex", alignItems:"center", justifyContent:"space-between", height:64, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:12, background: COLORS.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🎓</div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color: COLORS.secondary }}>Proctor Office</div>
            <div style={{ fontSize:11, color: COLORS.textSecondary }}>Automation System</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          {["Dashboard","Submit Complaint","Case Tracking","Notifications"].map(item => (
            <span key={item} style={{ fontSize:13, color: COLORS.textSecondary, cursor:"pointer", fontWeight:500 }}>{item}</span>
          ))}
        </div>
      </nav>
      <div style={{ textAlign:"center", padding:"80px 20px 60px" }}>
        <div style={{ width:90, height:90, borderRadius:24, background: COLORS.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, margin:"0 auto 24px" }}>🎓</div>
        <h1 style={{ fontSize:36, fontWeight:900, color: COLORS.textPrimary, margin:"0 0 12px", lineHeight:1.2 }}>Welcome to Proctor Office<br/>Automation System</h1>
        <p style={{ fontSize:16, color: COLORS.textSecondary, margin:"0 auto 40px", maxWidth:520 }}>Manage incidents, complaints, and disciplinary actions efficiently across your university campus</p>
        <div style={{ background:"#fff", borderRadius:24, boxShadow:"0 8px 40px rgba(63,58,109,0.12)", padding:40, maxWidth:480, margin:"0 auto" }}>
          <h2 style={{ fontSize:22, fontWeight:800, color: COLORS.textPrimary, margin:"0 0 8px" }}>Access Your Portal</h2>
          <p style={{ fontSize:14, color: COLORS.textSecondary, margin:"0 0 28px" }}>Login to submit complaints, track cases, and manage investigations</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Btn variant="primary" onClick={() => onSelectRole("student")} style={{ padding:"14px 32px", fontSize:15, width:"100%" }}>
              🎓 Student Login
            </Btn>
            <Btn variant="outline" onClick={() => onSelectRole("staff")} style={{ padding:"14px 32px", fontSize:15, width:"100%" }}>
              🏛️ Staff / Admin Login
            </Btn>
          </div>
        </div>
      </div>
      <footer style={{ background: COLORS.primary, color:"#fff", textAlign:"center", padding:"20px", marginTop:60, fontSize:13 }}>
        © 2026 Proctor Office Automation System. All rights reserved. | University of Bangladesh
      </footer>
    </div>
  );
};

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const LoginPage = ({ loginType, onLogin, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const isStudent = loginType === "student";
  const allowedCredentials = isStudent
    ? CREDENTIALS.filter(c => c.role === "student")
    : CREDENTIALS.filter(c => c.role !== "student");

  const handle = () => {
    const found = allowedCredentials.find(c => c.email === email && c.password === password);
    if (found) { setError(""); onLogin(found); }
    else setError("Invalid credentials. Please try again.");
  };

  return (
    <div style={{ minHeight:"100vh", background: COLORS.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI', sans-serif", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, boxShadow:"0 8px 40px rgba(63,58,109,0.12)", padding:40, width:"100%", maxWidth:420 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color: COLORS.textSecondary, cursor:"pointer", fontSize:13, marginBottom:20, padding:0 }}>← Back to Home</button>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:60, height:60, borderRadius:16, background: COLORS.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 16px" }}>
            {isStudent ? "🎓" : "🏛️"}
          </div>
          <h2 style={{ fontSize:22, fontWeight:800, color: COLORS.textPrimary, margin:0 }}>
            {isStudent ? "Student Login" : "Staff / Admin Login"}
          </h2>
          <p style={{ fontSize:13, color: COLORS.textSecondary, margin:"8px 0 0" }}>
            {isStudent ? "Enter your student credentials" : "Enter your staff credentials to access your dashboard"}
          </p>
        </div>
        <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="Enter your email" />
        <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter your password" />
        {error && <div style={{ background:"#FEF2F2", color:"#EF4444", padding:"10px 14px", borderRadius:10, fontSize:13, marginBottom:16 }}>{error}</div>}
        <Btn variant="primary" onClick={handle} style={{ width:"100%", padding:"13px", fontSize:15 }}>Login →</Btn>
        <div style={{ marginTop:20, background: COLORS.bg, borderRadius:12, padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color: COLORS.textSecondary, marginBottom:8 }}>Demo Credentials</div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {allowedCredentials.map(c => (
              <div key={c.role} onClick={() => { setEmail(c.email); setPassword(c.password); }}
                style={{ fontSize:11, color: COLORS.secondary, cursor:"pointer", padding:"3px 0" }}>
                {c.label}: {c.email}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────────
const StudentDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ type:"Type-1", category:"Normal", subject:"", desc:"", evidence:"" });
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [fbCase, setFbCase] = useState("");
  const [fbRating, setFbRating] = useState("5");
  const myCases = DUMMY_CASES.slice(0,3);

  const tabs = [
    {id:"dashboard",label:"My Dashboard",icon:"🏠"},
    {id:"submit",label:"Submit Complaint",icon:"📝"},
    {id:"track",label:"Case Tracking",icon:"🔍"},
    {id:"notifications",label:"Notifications",icon:"🔔"},
    {id:"feedback",label:"Feedback",icon:"⭐"},
  ];

  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16, marginBottom:28 }}>
            <StatCard label="My Active Cases" value={2} color={COLORS.secondary} icon="📋" />
            <StatCard label="Pending Hearings" value={1} color="#F59E0B" icon="⏳" />
            <StatCard label="Resolved Cases" value={1} color={COLORS.accent} icon="✅" />
            <StatCard label="Notifications" value={3} color={COLORS.primary} icon="🔔" />
          </div>
          <Card>
            <h3 style={{ fontSize:16, fontWeight:700, color:COLORS.textPrimary, marginTop:0, marginBottom:16 }}>My Recent Cases</h3>
            <Table cols={["Case ID","Type","Status","Subject","Date","Action"]}
              rows={myCases.map(c=>[
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
                <Badge text={c.type}/>,
                <Badge text={c.status}/>,
                c.subject.slice(0,30)+"...",
                c.date,
                <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>View</Btn>
              ])}
            />
          </Card>
          <div style={{marginTop:20, display:"flex", gap:12}}>
            <Btn variant="primary" onClick={()=>setTab("submit")}>+ Submit New Complaint</Btn>
            <Btn variant="outline" onClick={()=>setTab("track")}>Track Cases</Btn>
          </div>
        </div>
      )}
      {tab === "submit" && (
        <Card>
          <h3 style={{fontSize:18,fontWeight:800,color:COLORS.textPrimary,marginTop:0,marginBottom:4}}>Submit a Complaint</h3>
          <p style={{fontSize:13,color:COLORS.textSecondary,marginBottom:24}}>Choose complaint type and provide details. All information is kept confidential.</p>
          {submitted ? (
            <div style={{textAlign:"center",padding:40}}>
              <div style={{fontSize:60,marginBottom:16}}>✅</div>
              <div style={{fontSize:20,fontWeight:800,color:COLORS.accent,marginBottom:8}}>Complaint Submitted Successfully!</div>
              <div style={{fontSize:14,color:COLORS.textSecondary,marginBottom:24}}>Your Case ID: <strong>CASE-{Date.now().toString().slice(-4)}</strong><br/>You will be notified of updates via email and SMS.</div>
              <Btn variant="primary" onClick={()=>{setSubmitted(false);setForm({type:"Type-1",category:"Normal",subject:"",desc:"",evidence:""})}}>Submit Another</Btn>
            </div>
          ) : (
            <>
              <Select label="Complaint Type" value={form.type} onChange={v=>setForm({...form,type:v})} options={[{value:"Type-1",label:"Type-1: Instant Incident (Photo/Video)"},{value:"Type-2",label:"Type-2: Regular Complaint (Detailed)"}]} />
              {form.type === "Type-2" && (
                <Select label="Complaint Category" value={form.category} onChange={v=>setForm({...form,category:v})} options={[{value:"Normal",label:"Normal Complaint"},{value:"Confidential",label:"Confidential (Sexual Harassment)"}]} />
              )}
              <Input label="Subject / Incident Title" value={form.subject} onChange={v=>setForm({...form,subject:v})} placeholder="Brief description of incident" />
              <Textarea label="Detailed Description" value={form.desc} onChange={v=>setForm({...form,desc:v})} placeholder="Describe the incident in detail..." rows={5} />
              {form.type === "Type-1" && <Input label="Upload Image/Video URL" value={form.evidence} onChange={v=>setForm({...form,evidence:v})} placeholder="Attach evidence link" />}
              {form.type === "Type-2" && <Input label="Upload Evidence" value={form.evidence} onChange={v=>setForm({...form,evidence:v})} placeholder="Attach evidence link or file path" />}
              {form.category === "Confidential" && (
                <div style={{background:"#F3F0FF",borderRadius:12,padding:16,marginBottom:16,fontSize:13,color:"#6D28D9"}}>
                  🔒 This complaint will be handled confidentially by the Female Coordinator and Sexual Harassment Committee. Your identity will be protected.
                </div>
              )}
              <Btn variant="primary" onClick={()=>setSubmitted(true)} disabled={!form.subject} style={{marginTop:8}}>Submit Complaint →</Btn>
            </>
          )}
        </Card>
      )}
      {tab === "track" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Case Tracking</h3>
          <Table cols={["Case ID","Type","Category","Status","Subject","Date","Action"]}
            rows={myCases.map(c=>[
              <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
              <Badge text={c.type}/>,<Badge text={c.category}/>,<Badge text={c.status}/>,
              c.subject.slice(0,25)+"...",c.date,
              <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Details</Btn>
            ])}
          />
          <div style={{marginTop:16,padding:16,background:"#F0FDF4",borderRadius:12,fontSize:13,color:"#16A34A"}}>
            ✅ CASE-004 has been resolved by the Proctor. No further action required.
          </div>
        </Card>
      )}
      {tab === "notifications" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Notifications</h3>
          {[
            {icon:"📅",text:"Hearing scheduled for CASE-007 on April 10, 2026 at 10:00 AM",time:"2h ago",color:"#EFF6FF"},
            {icon:"✅",text:"Your case CASE-004 has been resolved",time:"2 days ago",color:"#F0FDF4"},
            {icon:"📋",text:"CASE-001 has been reviewed and forwarded to Proctor",time:"3 days ago",color:"#F9FAFB"},
          ].map((n,i)=>(
            <div key={i} style={{background:n.color,borderRadius:12,padding:16,marginBottom:12,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:20}}>{n.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:COLORS.textPrimary,fontWeight:500}}>{n.text}</div>
                <div style={{fontSize:11,color:COLORS.textSecondary,marginTop:4}}>{n.time}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "feedback" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:8}}>Submit Feedback</h3>
          <p style={{fontSize:13,color:COLORS.textSecondary,marginBottom:20}}>Rate your experience with the complaint handling process</p>
          <Select label="Select Case" value={fbCase} onChange={setFbCase} options={[{value:"",label:"-- Select a case --"},...myCases.map(c=>({value:c.id,label:c.id+" - "+c.subject.slice(0,30)}))]} />
          <Select label="Overall Rating" value={fbRating} onChange={setFbRating} options={[{value:"5",label:"⭐⭐⭐⭐⭐ Excellent"},{value:"4",label:"⭐⭐⭐⭐ Good"},{value:"3",label:"⭐⭐⭐ Average"},{value:"2",label:"⭐⭐ Poor"},{value:"1",label:"⭐ Very Poor"}]} />
          <Textarea label="Your Feedback" value={feedback} onChange={setFeedback} placeholder="Share your experience..." />
          <Btn variant="accent" onClick={()=>{setFeedback("");setFbCase("");alert("Feedback submitted! Thank you.");}}>Submit Feedback</Btn>
        </Card>
      )}
      {modal && <Modal title={`Case Details: ${modal.id}`} onClose={()=>setModal(null)}>
        <div style={{display:"flex",flexDirection:"column",gap:12,fontSize:13}}>
          {[["Case ID",modal.id],["Type",<Badge text={modal.type}/>],["Category",<Badge text={modal.category}/>],["Status",<Badge text={modal.status}/>],["Priority",<Badge text={modal.priority}/>],["Subject",modal.subject],["Date Filed",modal.date],["Assigned To",modal.assignedTo]].map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:8,borderBottom:"1px solid #F3F4F6",paddingBottom:10}}>
              <div style={{fontWeight:700,color:COLORS.textSecondary,width:120,flexShrink:0}}>{k}:</div>
              <div style={{color:COLORS.textPrimary}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:20}}><Btn variant="outline" onClick={()=>setModal(null)}>Close</Btn></div>
      </Modal>}
    </Layout>
  );
};

// ─── OFFICER DASHBOARD ────────────────────────────────────────────────────────
const OfficerDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [cases, setCases] = useState(DUMMY_CASES);
  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:"🏠"},
    {id:"review",label:"Review Cases",icon:"📋"},
    {id:"verify",label:"Verify Documents",icon:"🔍"},
    {id:"forward",label:"Forward Cases",icon:"➡️"},
    {id:"reports",label:"Reports",icon:"📊"},
  ];
  const handleAction = (caseId, action) => {
    setCases(prev => prev.map(c => c.id === caseId ? {...c, status: action} : c));
    setModal(null);
  };
  const forwardedCount = cases.filter(c=>c.status==="Forwarded to Proctor"||c.status==="Forwarded to SH Committee").length;
  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            <StatCard label="Total Cases" value={cases.length} color={COLORS.primary} icon="📁" />
            <StatCard label="Pending Review" value={cases.filter(c=>c.status==="Pending Review").length} color="#F59E0B" icon="⏳" />
            <StatCard label="Forwarded" value={forwardedCount} color={COLORS.secondary} icon="➡️" />
            <StatCard label="Confidential" value={cases.filter(c=>c.category==="Confidential").length} color="#8B5CF6" icon="🔒" />
          </div>
          <Card>
            <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Recent Submissions</h3>
            <Table cols={["Case ID","Student","Type","Category","Status","Priority","Action"]}
              rows={cases.slice(0,5).map(c=>[
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
                c.student === "Confidential" ? <span style={{color:"#8B5CF6",fontWeight:600}}>🔒 Hidden</span> : c.student,
                <Badge text={c.type}/>,<Badge text={c.category}/>,<Badge text={c.status}/>,<Badge text={c.priority}/>,
                <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Review</Btn>
              ])}
            />
          </Card>
        </div>
      )}
      {tab === "review" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>All Submitted Cases</h3>
          <Table cols={["Case ID","Student","Type","Category","Status","Priority","Action"]}
            rows={cases.map(c=>[
              <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
              c.student === "Confidential" ? <span style={{color:"#8B5CF6",fontWeight:600}}>🔒 Hidden</span> : c.student,
              <Badge text={c.type}/>,<Badge text={c.category}/>,<Badge text={c.status}/>,<Badge text={c.priority}/>,
              <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Review</Btn>
            ])}
          />
        </Card>
      )}
      {tab === "verify" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Document Verification</h3>
          {cases.filter(c=>c.status==="Pending Review").map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div><span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span> — {c.subject.slice(0,40)}...</div>
                <Badge text={c.priority}/>
              </div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:12}}>Student: {c.student} | Date: {c.date}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="accent" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Accepted")}>✅ Accept</Btn>
                <Btn variant="danger" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Rejected")}>❌ Reject</Btn>
                <Btn variant="warning" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Resubmission Required")}>⚠️ Request Resubmission</Btn>
                <Btn variant="ghost" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"On Hold")}>⏸ Hold</Btn>
              </div>
            </div>
          ))}
          {cases.filter(c=>c.status==="Pending Review").length===0 && <div style={{textAlign:"center",padding:40,color:COLORS.textSecondary}}>No pending cases for verification</div>}
        </Card>
      )}
      {tab === "forward" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:8}}>Forward Cases</h3>
          <p style={{fontSize:13,color:COLORS.textSecondary,marginBottom:16}}>Routing: Normal → Proctor | Confidential → Female Coordinator → Sexual Harassment Committee</p>
          {cases.filter(c=>c.status==="Accepted"||c.status==="Pending Review").map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:COLORS.primary,marginBottom:4}}>{c.id}</div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:12}}>{c.subject}</div>
              <div style={{display:"flex",gap:8}}>
                {c.category === "Normal" ?
                  <Btn variant="secondary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Forwarded to Proctor")}>➡️ Forward to Proctor</Btn> :
                  <Btn variant="primary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Forwarded to SH Committee")}>🔒 Forward to SH Committee</Btn>
                }
              </div>
            </div>
          ))}
          {cases.filter(c=>c.status==="Accepted"||c.status==="Pending Review").length === 0 && (
            <div style={{textAlign:"center",padding:40,color:COLORS.textSecondary}}>No cases ready for forwarding</div>
          )}
        </Card>
      )}
      {tab === "reports" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Case Reports</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {[["Total Received",cases.length,COLORS.primary],["Accepted",cases.filter(c=>c.status==="Accepted").length,COLORS.accent],["Rejected",cases.filter(c=>c.status==="Rejected").length,"#EF4444"],["Pending",cases.filter(c=>c.status==="Pending Review").length,"#F59E0B"]].map(([l,v,c])=>(
              <div key={l} style={{background:c+"15",borderRadius:12,padding:20,textAlign:"center"}}>
                <div style={{fontSize:36,fontWeight:900,color:c}}>{v}</div>
                <div style={{fontSize:13,color:COLORS.textSecondary,marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {modal && <Modal title={`Review: ${modal.id}`} onClose={()=>setModal(null)}>
        <div style={{display:"flex",flexDirection:"column",gap:10,fontSize:13,marginBottom:20}}>
          {[["Case ID",modal.id],["Student",modal.student==="Confidential"?"🔒 Confidential":modal.student],["Subject",modal.subject],["Type",<Badge text={modal.type}/>],["Category",<Badge text={modal.category}/>],["Status",<Badge text={modal.status}/>],["Priority",<Badge text={modal.priority}/>],["Date",modal.date]].map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:8,borderBottom:"1px solid #F3F4F6",paddingBottom:8}}>
              <div style={{fontWeight:700,color:COLORS.textSecondary,width:100,flexShrink:0}}>{k}:</div>
              <div style={{color:COLORS.textPrimary}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn variant="accent" style={{padding:"8px 16px",fontSize:13}} onClick={()=>handleAction(modal.id,"Accepted")}>✅ Accept</Btn>
          <Btn variant="danger" style={{padding:"8px 16px",fontSize:13}} onClick={()=>handleAction(modal.id,"Rejected")}>❌ Reject</Btn>
          <Btn variant="warning" style={{padding:"8px 16px",fontSize:13}} onClick={()=>handleAction(modal.id,"Resubmission Required")}>⚠️ Resubmit</Btn>
          <Btn variant="ghost" style={{padding:"8px 16px",fontSize:13}} onClick={()=>handleAction(modal.id,"On Hold")}>⏸ Hold</Btn>
          {modal.category === "Normal" ?
            <Btn variant="secondary" style={{padding:"8px 16px",fontSize:13}} onClick={()=>handleAction(modal.id,"Forwarded to Proctor")}>➡️ → Proctor</Btn> :
            <Btn variant="primary" style={{padding:"8px 16px",fontSize:13}} onClick={()=>handleAction(modal.id,"Forwarded to SH Committee")}>🔒 → SH Committee</Btn>
          }
        </div>
      </Modal>}
    </Layout>
  );
};

// ─── PROCTOR DASHBOARD ────────────────────────────────────────────────────────
const ProctorDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [cases, setCases] = useState(DUMMY_CASES.filter(c=>c.category==="Normal"));
  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:"🏠"},
    {id:"cases",label:"All Cases",icon:"📋"},
    {id:"assign",label:"Assign Cases",icon:"👥"},
    {id:"decisions",label:"Decisions",icon:"⚖️"},
    {id:"monitor",label:"Monitor Progress",icon:"📊"},
    {id:"reports",label:"Reports",icon:"📄"},
  ];
  const handleAction = (caseId, action) => { setCases(prev=>prev.map(c=>c.id===caseId?{...c,status:action}:c)); setModal(null); };
  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            <StatCard label="Active Cases" value={cases.filter(c=>!["Resolved","Closed"].includes(c.status)).length} color={COLORS.primary} icon="📋" />
            <StatCard label="Assigned" value={cases.filter(c=>c.status.includes("Assigned")).length} color={COLORS.secondary} icon="👥" />
            <StatCard label="Resolved" value={cases.filter(c=>c.status==="Resolved").length} color={COLORS.accent} icon="✅" />
            <StatCard label="Escalated" value={cases.filter(c=>c.status.includes("Registrar")).length} color="#EF4444" icon="🔺" />
          </div>
          <Card>
            <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Normal Cases Overview</h3>
            <Table cols={["Case ID","Student","Status","Priority","Assigned To","Action"]}
              rows={cases.map(c=>[
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
                c.student,<Badge text={c.status}/>,<Badge text={c.priority}/>,c.assignedTo,
                <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Manage</Btn>
              ])}
            />
          </Card>
        </div>
      )}
      {tab === "cases" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>All Normal Cases</h3>
          <Table cols={["Case ID","Student","Subject","Status","Priority","Date","Action"]}
            rows={cases.map(c=>[
              <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
              c.student,c.subject.slice(0,28)+"...",<Badge text={c.status}/>,<Badge text={c.priority}/>,c.date,
              <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Manage</Btn>
            ])}
          />
        </Card>
      )}
      {tab === "assign" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Assign Cases to Officers</h3>
          {cases.filter(c=>!["Resolved","Closed"].includes(c.status)).map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:COLORS.primary,marginBottom:4}}>{c.id} — {c.subject.slice(0,40)}</div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:12}}>Current: <Badge text={c.status}/> | Priority: <Badge text={c.priority}/></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="secondary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Assigned to Deputy Proctor")}>→ Deputy Proctor</Btn>
                <Btn variant="outline" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Assigned to Assistant Proctor")}>→ Assistant Proctor</Btn>
                <Btn variant="accent" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Resolved")}>✅ Resolve Directly</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "decisions" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Proctor Decisions</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span><Badge text={c.status}/>
              </div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:12}}>{c.subject}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="accent" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Resolved")}>✅ Resolve Case</Btn>
                <Btn variant="danger" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Forwarded to Registrar")}>🔺 Forward to Registrar</Btn>
                <Btn variant="warning" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Police Case - Closed")}>🚔 Mark as Police Case</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "monitor" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Progress Monitoring</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,color:COLORS.primary}}>{c.id}</div>
                <div style={{fontSize:13,color:COLORS.textSecondary}}>{c.subject.slice(0,45)}</div>
                <div style={{fontSize:12,color:COLORS.textSecondary,marginTop:4}}>Assigned: {c.assignedTo}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                <Badge text={c.status}/><Badge text={c.priority}/>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "reports" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Proctor Reports</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
            {[["Total Cases",cases.length,COLORS.primary],["Active",cases.filter(c=>!["Resolved","Closed"].includes(c.status)).length,COLORS.secondary],["Resolved",cases.filter(c=>c.status==="Resolved").length,COLORS.accent],["Escalated",cases.filter(c=>c.status.includes("Registrar")).length,"#EF4444"]].map(([l,v,c])=>(
              <div key={l} style={{background:c+"15",borderRadius:12,padding:20,textAlign:"center"}}>
                <div style={{fontSize:36,fontWeight:900,color:c}}>{v}</div>
                <div style={{fontSize:13,color:COLORS.textSecondary,marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
          <Btn variant="primary">📄 Generate Full Report</Btn>
        </Card>
      )}
      {modal && <Modal title={`Manage: ${modal.id}`} onClose={()=>setModal(null)}>
        <div style={{fontSize:13,marginBottom:16}}>
          <strong>{modal.subject}</strong><br/>
          <span style={{color:COLORS.textSecondary}}>Student: {modal.student} | Date: {modal.date}</span>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn variant="accent" style={{padding:"8px 16px",fontSize:12}} onClick={()=>handleAction(modal.id,"Resolved")}>✅ Resolve</Btn>
          <Btn variant="secondary" style={{padding:"8px 16px",fontSize:12}} onClick={()=>handleAction(modal.id,"Assigned to Deputy Proctor")}>→ Deputy</Btn>
          <Btn variant="outline" style={{padding:"8px 16px",fontSize:12}} onClick={()=>handleAction(modal.id,"Assigned to Assistant Proctor")}>→ Assistant</Btn>
          <Btn variant="danger" style={{padding:"8px 16px",fontSize:12}} onClick={()=>handleAction(modal.id,"Forwarded to Registrar")}>🔺 Escalate</Btn>
          <Btn variant="warning" style={{padding:"8px 16px",fontSize:12}} onClick={()=>handleAction(modal.id,"Police Case - Closed")}>🚔 Police Case</Btn>
        </div>
      </Modal>}
    </Layout>
  );
};

// ─── DEPUTY PROCTOR DASHBOARD ─────────────────────────────────────────────────
const DeputyDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [cases, setCases] = useState(DUMMY_CASES.filter(c=>["Deputy Proctor","Assigned to Deputy Proctor"].includes(c.assignedTo)||c.id==="CASE-002"));
  const [remark, setRemark] = useState("");
  const [remarkCase, setRemarkCase] = useState("");
  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:"🏠"},
    {id:"review",label:"Review Reports",icon:"📋"},
    {id:"remarks",label:"Add Remarks",icon:"✏️"},
    {id:"forward",label:"Forward to Proctor",icon:"➡️"},
    {id:"decisions",label:"Decisions",icon:"⚖️"},
  ];
  const handleAction = (caseId,action) => { setCases(prev=>prev.map(c=>c.id===caseId?{...c,status:action}:c)); setModal(null); };
  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            <StatCard label="Assigned Cases" value={cases.length} color={COLORS.primary} icon="📋" />
            <StatCard label="Pending" value={cases.filter(c=>!["Resolved","Closed"].includes(c.status)).length} color="#F59E0B" icon="⏳" />
            <StatCard label="Forwarded" value={cases.filter(c=>c.status.includes("Forwarded")).length} color={COLORS.secondary} icon="➡️" />
            <StatCard label="Resolved" value={cases.filter(c=>c.status==="Resolved").length} color={COLORS.accent} icon="✅" />
          </div>
          <Card>
            <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>My Assigned Cases</h3>
            <Table cols={["Case ID","Student","Status","Priority","Action"]}
              rows={cases.map(c=>[
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
                c.student,<Badge text={c.status}/>,<Badge text={c.priority}/>,
                <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Review</Btn>
              ])}
            />
          </Card>
        </div>
      )}
      {tab === "review" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Reports from Assistant Proctor</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span><Badge text={c.status}/>
              </div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:8}}>{c.subject}</div>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="ghost" style={{padding:"6px 14px",fontSize:12}} onClick={()=>setModal(c)}>📄 Review Details</Btn>
                <Btn variant="warning" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Sent Back to Assistant")}>↩ Send Back</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "remarks" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Add Remarks to Cases</h3>
          <Select label="Select Case" value={remarkCase} onChange={setRemarkCase} options={[{value:"",label:"-- Select --"},...cases.map(c=>({value:c.id,label:c.id}))]} />
          <Textarea label="Deputy Proctor Remarks" value={remark} onChange={setRemark} placeholder="Add your official remarks and observations..." />
          <Btn variant="primary" onClick={()=>{setRemark("");alert("Remarks saved!");}}>💾 Save Remarks</Btn>
        </Card>
      )}
      {tab === "forward" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Forward Cases to Proctor</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:COLORS.primary,marginBottom:4}}>{c.id}</div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:12}}>{c.subject}</div>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="secondary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Forwarded to Proctor")}>➡️ Forward to Proctor</Btn>
                <Btn variant="danger" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Forwarded to Registrar")}>🔺 Forward to Registrar</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "decisions" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Deputy Decisions</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:COLORS.primary,marginBottom:8}}>{c.id} — <Badge text={c.status}/></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="accent" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Resolved")}>✅ Resolve</Btn>
                <Btn variant="secondary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Forwarded to Proctor")}>→ Proctor</Btn>
                <Btn variant="danger" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Forwarded to Registrar")}>🔺 Registrar</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
      {modal && <Modal title={`Case: ${modal.id}`} onClose={()=>setModal(null)}>
        <div style={{fontSize:13,marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
          {[["Subject",modal.subject],["Student",modal.student],["Status",<Badge text={modal.status}/>],["Priority",<Badge text={modal.priority}/>],["Date",modal.date]].map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:8,borderBottom:"1px solid #F3F4F6",paddingBottom:8}}>
              <span style={{fontWeight:700,width:80,color:COLORS.textSecondary}}>{k}:</span><span>{v}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn variant="accent" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Resolved")}>✅ Resolve</Btn>
          <Btn variant="warning" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Sent Back to Assistant")}>↩ Send Back</Btn>
          <Btn variant="secondary" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Forwarded to Proctor")}>→ Proctor</Btn>
          <Btn variant="danger" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Forwarded to Registrar")}>🔺 Registrar</Btn>
        </div>
      </Modal>}
    </Layout>
  );
};

// ─── ASSISTANT PROCTOR DASHBOARD ──────────────────────────────────────────────
const AssistantDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [cases, setCases] = useState(DUMMY_CASES.filter(c=>c.id==="CASE-007"||c.assignedTo==="Assistant Proctor"));
  const [hearingNote, setHearingNote] = useState("");
  const [hearingCase, setHearingCase] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [hearingTime, setHearingTime] = useState("");
  const [venue, setVenue] = useState("");
  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:"🏠"},
    {id:"cases",label:"Assigned Cases",icon:"📋"},
    {id:"hearing",label:"Arrange Hearing",icon:"📅"},
    {id:"notes",label:"Notes & Remarks",icon:"✏️"},
    {id:"report",label:"Draft Report",icon:"📄"},
    {id:"forward",label:"Forward to Deputy",icon:"➡️"},
  ];
  const handleAction = (caseId,action) => { setCases(prev=>prev.map(c=>c.id===caseId?{...c,status:action}:c)); setModal(null); };
  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            <StatCard label="Assigned Cases" value={cases.length} color={COLORS.primary} icon="📋" />
            <StatCard label="Hearings Scheduled" value={cases.filter(c=>c.status==="Hearing Scheduled").length} color={COLORS.secondary} icon="📅" />
            <StatCard label="Reports Prepared" value={1} color={COLORS.accent} icon="📄" />
          </div>
          <Card>
            <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>My Cases</h3>
            <Table cols={["Case ID","Student","Status","Priority","Action"]}
              rows={cases.map(c=>[
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
                c.student,<Badge text={c.status}/>,<Badge text={c.priority}/>,
                <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Manage</Btn>
              ])}
            />
          </Card>
        </div>
      )}
      {tab === "cases" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Assigned Cases</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:COLORS.primary,marginBottom:4}}>{c.id}</div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:8}}>{c.subject}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="ghost" style={{padding:"6px 14px",fontSize:12}} onClick={()=>setModal(c)}>📋 View Details</Btn>
                <Btn variant="warning" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Hearing Scheduled")}>📅 Schedule Hearing</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "hearing" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Arrange Hearing</h3>
          <Select label="Select Case" value={hearingCase} onChange={setHearingCase} options={[{value:"",label:"-- Select --"},...cases.map(c=>({value:c.id,label:c.id+" - "+c.subject.slice(0,30)}))]} />
          <Input label="Hearing Date" type="date" value={hearingDate} onChange={setHearingDate} placeholder="" />
          <Input label="Hearing Time" type="time" value={hearingTime} onChange={setHearingTime} placeholder="" />
          <Input label="Venue" value={venue} onChange={setVenue} placeholder="Proctor Office / Room No." />
          <Textarea label="Hearing Notes" value={hearingNote} onChange={setHearingNote} placeholder="Additional notes for the hearing..." />
          <Btn variant="primary" onClick={()=>{setHearingNote("");alert("Hearing scheduled and notification sent!");}}>📅 Schedule & Notify</Btn>
        </Card>
      )}
      {tab === "notes" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Case Notes & Remarks</h3>
          <Select label="Select Case" value="" onChange={()=>{}} options={[{value:"",label:"-- Select --"},...cases.map(c=>({value:c.id,label:c.id}))]} />
          <Textarea label="Notes / Observations" value="" onChange={()=>{}} placeholder="Record your observations, witness statements, evidence notes..." rows={5}/>
          <Textarea label="Remarks" value="" onChange={()=>{}} placeholder="Official remarks for the deputy proctor..." rows={3}/>
          <Btn variant="primary" onClick={()=>alert("Notes saved!")}>💾 Save Notes</Btn>
        </Card>
      )}
      {tab === "report" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Prepare Draft Report</h3>
          <Select label="Select Case" value="" onChange={()=>{}} options={[{value:"",label:"-- Select --"},...cases.map(c=>({value:c.id,label:c.id}))]} />
          <Input label="Report Title" value="" onChange={()=>{}} placeholder="Investigation Report - CASE-XXX" />
          <Textarea label="Summary of Incident" value="" onChange={()=>{}} placeholder="Brief summary of the incident..." rows={3} />
          <Textarea label="Investigation Findings" value="" onChange={()=>{}} placeholder="Detailed findings from the investigation..." rows={5} />
          <Textarea label="Recommendation" value="" onChange={()=>{}} placeholder="Recommended action..." rows={3} />
          <div style={{display:"flex",gap:12}}>
            <Btn variant="ghost" onClick={()=>alert("Draft saved!")}>💾 Save Draft</Btn>
            <Btn variant="primary" onClick={()=>alert("Report submitted to Deputy!")}>📤 Submit to Deputy</Btn>
          </div>
        </Card>
      )}
      {tab === "forward" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Forward Report to Deputy Proctor</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:COLORS.primary,marginBottom:4}}>{c.id}</div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:12}}>{c.subject}</div>
              <Btn variant="secondary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Forwarded to Deputy Proctor")}>➡️ Forward to Deputy Proctor</Btn>
            </div>
          ))}
        </Card>
      )}
      {modal && <Modal title={`Case: ${modal.id}`} onClose={()=>setModal(null)}>
        <div style={{fontSize:13,marginBottom:16}}>
          <strong>{modal.subject}</strong><br/>
          <span style={{color:COLORS.textSecondary}}>Student: {modal.student} | Priority: </span><Badge text={modal.priority}/>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn variant="warning" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Hearing Scheduled")}>📅 Schedule Hearing</Btn>
          <Btn variant="secondary" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Forwarded to Deputy Proctor")}>➡️ Forward</Btn>
        </div>
      </Modal>}
    </Layout>
  );
};

// ─── REGISTRAR DASHBOARD ──────────────────────────────────────────────────────
const RegistrarDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [cases, setCases] = useState(DUMMY_CASES.filter(c=>c.status==="Forwarded to Registrar"||c.id==="CASE-005"));
  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:"🏠"},
    {id:"cases",label:"Escalated Cases",icon:"📋"},
    {id:"review",label:"Review & Decide",icon:"⚖️"},
    {id:"records",label:"Official Records",icon:"🗄️"},
    {id:"track",label:"Track Progress",icon:"📊"},
  ];
  const handleAction = (caseId,action) => { setCases(prev=>prev.map(c=>c.id===caseId?{...c,status:action}:c)); setModal(null); };
  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            <StatCard label="Received Cases" value={cases.length} color={COLORS.primary} icon="📋" />
            <StatCard label="Pending Decision" value={cases.filter(c=>!["Sent Back to Proctor","Forwarded to Disciplinary Committee"].includes(c.status)).length} color="#F59E0B" icon="⏳" />
            <StatCard label="Forwarded to DC" value={cases.filter(c=>c.status==="Forwarded to Disciplinary Committee").length} color="#EF4444" icon="🔺" />
          </div>
          <Card>
            <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Escalated Cases</h3>
            <Table cols={["Case ID","Student","Subject","Status","Priority","Action"]}
              rows={cases.map(c=>[
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
                c.student,c.subject.slice(0,25)+"...",<Badge text={c.status}/>,<Badge text={c.priority}/>,
                <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Review</Btn>
              ])}
            />
          </Card>
        </div>
      )}
      {tab === "cases" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>All Escalated Cases</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span><Badge text={c.priority}/>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:COLORS.textPrimary,marginBottom:4}}>{c.subject}</div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:12}}>Student: {c.student} | Date: {c.date}</div>
              <Badge text={c.status}/>
            </div>
          ))}
        </Card>
      )}
      {tab === "review" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Review & Make Decisions</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:COLORS.primary,marginBottom:4}}>{c.id} — {c.subject.slice(0,40)}</div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:12}}>Status: <Badge text={c.status}/></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="secondary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Sent Back to Proctor")}>↩ Send Back to Proctor</Btn>
                <Btn variant="danger" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Forwarded to Disciplinary Committee")}>🔺 → Disciplinary Committee</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "records" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Official Records</h3>
          <Table cols={["Case ID","Student","Subject","Final Status","Date"]}
            rows={DUMMY_CASES.map(c=>[
              <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
              c.student==="Confidential"?"🔒 Confidential":c.student,
              c.subject.slice(0,30)+"...",<Badge text={c.status}/>,c.date
            ])}
          />
        </Card>
      )}
      {tab === "track" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Track Case Progress</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,color:COLORS.primary}}>{c.id}</div>
                <div style={{fontSize:13,color:COLORS.textSecondary}}>{c.subject.slice(0,40)}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <Badge text={c.status}/><Badge text={c.priority}/>
              </div>
            </div>
          ))}
        </Card>
      )}
      {modal && <Modal title={`Registrar Review: ${modal.id}`} onClose={()=>setModal(null)}>
        <div style={{fontSize:13,marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
          {[["Subject",modal.subject],["Student",modal.student],["Priority",<Badge text={modal.priority}/>],["Status",<Badge text={modal.status}/>],["Date",modal.date]].map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:8,borderBottom:"1px solid #F3F4F6",paddingBottom:8}}>
              <span style={{fontWeight:700,width:80,color:COLORS.textSecondary}}>{k}:</span><span>{v}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="secondary" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Sent Back to Proctor")}>↩ Send Back</Btn>
          <Btn variant="danger" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Forwarded to Disciplinary Committee")}>🔺 Disciplinary Committee</Btn>
        </div>
      </Modal>}
    </Layout>
  );
};

// ─── DISCIPLINARY COMMITTEE DASHBOARD ─────────────────────────────────────────
const DisciplinaryDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [cases, setCases] = useState(DUMMY_CASES.filter(c=>c.status==="Forwarded to Registrar"||c.id==="CASE-005"||c.id==="CASE-003"));
  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:"🏠"},
    {id:"cases",label:"Review Cases",icon:"📋"},
    {id:"evidence",label:"Analyze Evidence",icon:"🔍"},
    {id:"verdict",label:"Final Verdict",icon:"⚖️"},
    {id:"close",label:"Close Cases",icon:"✅"},
  ];
  const handleAction = (caseId,action) => { setCases(prev=>prev.map(c=>c.id===caseId?{...c,status:action}:c)); setModal(null); };
  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            <StatCard label="Cases for Review" value={cases.length} color={COLORS.primary} icon="📋" />
            <StatCard label="Under Analysis" value={2} color="#F59E0B" icon="🔍" />
            <StatCard label="Final Verdicts" value={1} color={COLORS.accent} icon="⚖️" />
            <StatCard label="Closed" value={cases.filter(c=>c.status==="Case Closed - Final Verdict").length} color="#6B7280" icon="🔒" />
          </div>
          <Card>
            <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Committee Cases</h3>
            <Table cols={["Case ID","Student","Status","Priority","Action"]}
              rows={cases.map(c=>[
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
                c.student==="Confidential"?"🔒 Confidential":c.student,
                <Badge text={c.status}/>,<Badge text={c.priority}/>,
                <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Review</Btn>
              ])}
            />
          </Card>
        </div>
      )}
      {tab === "cases" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Cases from Registrar</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span><Badge text={c.priority}/>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:COLORS.textPrimary,marginBottom:8}}>{c.subject}</div>
              <Badge text={c.status}/>
            </div>
          ))}
        </Card>
      )}
      {tab === "evidence" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Evidence Analysis</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:COLORS.primary,marginBottom:8}}>{c.id}</div>
              <Btn variant="warning" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Under Analysis")}>🔍 Start Analysis</Btn>
            </div>
          ))}
        </Card>
      )}
      {tab === "verdict" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Final Verdict</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:COLORS.primary,marginBottom:8}}>{c.id} — <Badge text={c.status}/></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="accent" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Case Closed - Final Verdict")}>⚖️ Final Verdict & Close</Btn>
                <Btn variant="secondary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Sent Back to Proctor")}>↩ Back to Proctor</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "close" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Close Cases</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,color:COLORS.primary}}>{c.id}</div>
                <div style={{fontSize:13,color:COLORS.textSecondary}}>{c.subject.slice(0,40)}</div>
              </div>
              <Badge text={c.status}/>
            </div>
          ))}
        </Card>
      )}
      {modal && <Modal title={`DC Review: ${modal.id}`} onClose={()=>setModal(null)}>
        <div style={{fontSize:13,marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
          {[["Subject",modal.subject],["Student",modal.student==="Confidential"?"🔒 Confidential":modal.student],["Priority",<Badge text={modal.priority}/>],["Status",<Badge text={modal.status}/>],["Date",modal.date]].map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:8,borderBottom:"1px solid #F3F4F6",paddingBottom:8}}>
              <span style={{fontWeight:700,width:80,color:COLORS.textSecondary}}>{k}:</span><span>{v}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn variant="secondary" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Sent Back to Proctor")}>↩ Back to Proctor</Btn>
          <Btn variant="accent" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Case Closed - Final Verdict")}>⚖️ Final Verdict</Btn>
        </div>
      </Modal>}
    </Layout>
  );
};

// ─── SEXUAL HARASSMENT COMMITTEE DASHBOARD ─────────────────────────────────────
const HarassmentDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [cases, setCases] = useState(DUMMY_CASES.filter(c=>c.category==="Confidential"));
  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:"🏠"},
    {id:"cases",label:"Confidential Cases",icon:"🔒"},
    {id:"investigate",label:"Investigation",icon:"🔍"},
    {id:"decisions",label:"Decisions",icon:"⚖️"},
    {id:"escalate",label:"Escalate to Registrar",icon:"🔺"},
  ];
  const handleAction = (caseId,action) => { setCases(prev=>prev.map(c=>c.id===caseId?{...c,status:action}:c)); setModal(null); };
  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{background:"#FFF7ED",borderRadius:14,padding:16,marginBottom:20,fontSize:13,color:"#92400E",display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:20}}>🔒</span>
            <div><strong>Strict Confidentiality Notice:</strong> All cases handled by this committee are strictly confidential.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            <StatCard label="Confidential Cases" value={cases.length} color="#8B5CF6" icon="🔒" />
            <StatCard label="Under Investigation" value={cases.filter(c=>c.status==="Under Investigation").length} color="#F59E0B" icon="🔍" />
            <StatCard label="Resolved Internally" value={cases.filter(c=>c.status==="Resolved").length} color={COLORS.accent} icon="✅" />
            <StatCard label="Escalated" value={cases.filter(c=>c.status==="Escalated to Registrar").length} color="#EF4444" icon="🔺" />
          </div>
          <Card>
            <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Confidential Cases</h3>
            <Table cols={["Case ID","Status","Priority","Action"]}
              rows={cases.map(c=>[
                <span style={{fontWeight:700,color:"#8B5CF6"}}>{c.id}</span>,
                <Badge text={c.status}/>,<Badge text={c.priority}/>,
                <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Review</Btn>
              ])}
            />
          </Card>
        </div>
      )}
      {tab === "cases" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:4}}>🔒 Confidential Cases Only</h3>
          <p style={{fontSize:13,color:COLORS.textSecondary,marginBottom:16}}>Student identities are protected.</p>
          {cases.map(c=>(
            <div key={c.id} style={{border:"2px solid #8B5CF620",background:"#FAFAFE",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontWeight:700,color:"#8B5CF6"}}>{c.id}</span><Badge text={c.priority}/>
              </div>
              <div style={{fontSize:14,color:COLORS.textPrimary,marginBottom:4}}>🔒 {c.subject}</div>
              <div style={{fontSize:12,color:COLORS.textSecondary,marginBottom:12}}>Date Filed: {c.date} | Status: <Badge text={c.status}/></div>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="ghost" style={{padding:"6px 14px",fontSize:12}} onClick={()=>setModal(c)}>📋 Details</Btn>
                <Btn variant="warning" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Under Investigation")}>🔍 Start Investigation</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "investigate" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Investigation Panel</h3>
          <Select label="Select Case" value="" onChange={()=>{}} options={[{value:"",label:"-- Select --"},...cases.map(c=>({value:c.id,label:c.id+" (Confidential)"}))]} />
          <Textarea label="Investigation Notes (Strictly Confidential)" value="" onChange={()=>{}} placeholder="Document investigation details..." rows={6}/>
          <Input label="Attach Secure Evidence" value="" onChange={()=>{}} placeholder="Secure file path"/>
          <Select label="Investigation Status" value="" onChange={()=>{}} options={[{value:"ongoing",label:"Ongoing"},{value:"complete",label:"Complete"},{value:"needsMore",label:"Needs More Information"}]}/>
          <Btn variant="primary" onClick={()=>alert("Investigation saved!")}>🔒 Save Investigation (Encrypted)</Btn>
        </Card>
      )}
      {tab === "decisions" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Committee Decisions</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:"#8B5CF6",marginBottom:8}}>{c.id} — <Badge text={c.status}/></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Btn variant="accent" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Resolved")}>✅ Resolve Internally</Btn>
                <Btn variant="danger" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Escalated to Registrar")}>🔺 Escalate to Registrar</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}
      {tab === "escalate" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:8}}>Escalate to Registrar Office</h3>
          <p style={{fontSize:13,color:COLORS.textSecondary,marginBottom:16}}>Cases that cannot be resolved internally are forwarded to Registrar → Disciplinary Committee → Final Decision</p>
          {cases.filter(c=>c.status==="Under Investigation"||c.status==="Escalated to Registrar").map(c=>(
            <div key={c.id} style={{border:"2px solid #EF444420",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:"#8B5CF6",marginBottom:4}}>{c.id}</div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:12}}>🔒 Sensitive/Unresolved</div>
              <Btn variant="danger" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Escalated to Registrar")}>🔺 Forward to Registrar Office</Btn>
            </div>
          ))}
          {cases.filter(c=>c.status==="Under Investigation"||c.status==="Escalated to Registrar").length===0 && <div style={{textAlign:"center",padding:30,color:COLORS.textSecondary}}>No cases pending escalation</div>}
        </Card>
      )}
      {modal && <Modal title={`Confidential Case: ${modal.id}`} onClose={()=>setModal(null)}>
        <div style={{background:"#FFF7ED",borderRadius:10,padding:12,marginBottom:16,fontSize:12,color:"#92400E"}}>🔒 This case is strictly confidential. Handle with care.</div>
        <div style={{fontSize:13,marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
          {[["Case ID",modal.id],["Subject","🔒 "+modal.subject],["Category",<Badge text={modal.category}/>],["Priority",<Badge text={modal.priority}/>],["Status",<Badge text={modal.status}/>],["Date",modal.date]].map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:8,borderBottom:"1px solid #F3F4F6",paddingBottom:8}}>
              <span style={{fontWeight:700,width:80,color:COLORS.textSecondary}}>{k}:</span><span>{v}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn variant="accent" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Resolved")}>✅ Resolve</Btn>
          <Btn variant="danger" style={{padding:"8px 14px",fontSize:12}} onClick={()=>handleAction(modal.id,"Escalated to Registrar")}>🔺 Escalate</Btn>
        </div>
      </Modal>}
    </Layout>
  );
};

// ─── VC DASHBOARD ─────────────────────────────────────────────────────────────
const VCDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const tabs = [
    {id:"dashboard",label:"Overview Dashboard",icon:"🏠"},
    {id:"monitor",label:"System Monitor",icon:"📊"},
    {id:"highcases",label:"High-Level Cases",icon:"🔺"},
    {id:"analytics",label:"Analytics",icon:"📈"},
  ];
  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{background:"linear-gradient(135deg,#3F3A6D,#2E5AAC)",borderRadius:16,padding:24,marginBottom:24,color:"#fff"}}>
            <div style={{fontSize:14,opacity:0.8,marginBottom:4}}>Vice Chancellor — System Overview</div>
            <div style={{fontSize:26,fontWeight:900}}>University Proctor System Dashboard</div>
            <div style={{fontSize:13,opacity:0.7,marginTop:8}}>Read-only monitoring access</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            <StatCard label="Total Cases" value={DUMMY_CASES.length} color={COLORS.primary} icon="📁" />
            <StatCard label="Active Cases" value={STATS.active} color={COLORS.secondary} icon="🔵" />
            <StatCard label="Resolved" value={STATS.resolved} color={COLORS.accent} icon="✅" />
            <StatCard label="Confidential" value={STATS.confidential} color="#8B5CF6" icon="🔒" />
            <StatCard label="Pending" value={STATS.pending} color="#F59E0B" icon="⏳" />
            <StatCard label="Police Cases" value={1} color="#EF4444" icon="🚔" />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <Card>
              <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Case Type Distribution</h3>
              {[["Normal Cases","#2E5AAC",70],["Confidential Cases","#8B5CF6",20],["Type-1 Instant","#F59E0B",10]].map(([l,c,p])=>(
                <div key={l} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13}}>
                    <span style={{color:COLORS.textSecondary}}>{l}</span><span style={{fontWeight:700}}>{p}%</span>
                  </div>
                  <div style={{background:"#F3F4F6",borderRadius:999,height:8}}>
                    <div style={{background:c,width:p+"%",height:"100%",borderRadius:999}}/>
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Departmental Load</h3>
              {[["Proctor Office",4,COLORS.primary],["Deputy Proctor",2,COLORS.secondary],["Assistant Proctor",2,"#F59E0B"],["Registrar",1,"#EF4444"],["SH Committee",2,"#8B5CF6"]].map(([l,v,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F3F4F6",fontSize:13}}>
                  <span style={{color:COLORS.textSecondary}}>{l}</span>
                  <span style={{fontWeight:700,background:c+"20",color:c,borderRadius:999,padding:"2px 12px"}}>{v} cases</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
      {tab === "monitor" && (
        <div>
          <Card style={{marginBottom:20}}>
            <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Full System Monitor (Read-Only)</h3>
            <Table cols={["Case ID","Student","Type","Category","Status","Priority","Assigned To"]}
              rows={DUMMY_CASES.map(c=>[
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span>,
                c.student==="Confidential"?"🔒 Hidden":c.student,
                <Badge text={c.type}/>,<Badge text={c.category}/>,<Badge text={c.status}/>,<Badge text={c.priority}/>,c.assignedTo
              ])}
            />
          </Card>
          <div style={{background:"#FFF7ED",borderRadius:12,padding:16,fontSize:13,color:"#92400E"}}>
            ℹ️ As Vice Chancellor, you have read-only access to all cases.
          </div>
        </div>
      )}
      {tab === "highcases" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>High-Level Escalated Cases</h3>
          {DUMMY_CASES.filter(c=>c.priority==="Critical").map(c=>(
            <div key={c.id} style={{border:"2px solid #EF444430",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span><Badge text={c.priority}/>
              </div>
              <div style={{fontSize:14,color:COLORS.textPrimary,marginBottom:4}}>{c.subject}</div>
              <div style={{fontSize:12,color:COLORS.textSecondary}}>Status: <Badge text={c.status}/> | Date: {c.date}</div>
            </div>
          ))}
        </Card>
      )}
      {tab === "analytics" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
          {[["Cases This Month",DUMMY_CASES.length,COLORS.primary,"📅"],["Resolution Rate","77%",COLORS.accent,"📈"],["Avg Resolution Time","8 days","#F59E0B","⏱️"],["Student Satisfaction","4.2/5",COLORS.secondary,"⭐"],["Police Referrals",1,"#EF4444","🚔"],["Pending >7 Days",3,"#8B5CF6","⚠️"]].map(([l,v,c,i])=>(
            <StatCard key={l} label={l} value={v} color={c} icon={i}/>
          ))}
        </div>
      )}
    </Layout>
  );
};

// ─── SYSTEM ADMIN DASHBOARD ────────────────────────────────────────────────────
const SystemDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const tabs = [
    {id:"dashboard",label:"System Dashboard",icon:"🏠"},
    {id:"users",label:"User Management",icon:"👥"},
    {id:"routing",label:"Case Routing",icon:"🔀"},
    {id:"logs",label:"System Logs",icon:"📜"},
    {id:"notifications",label:"Notifications",icon:"📧"},
    {id:"backup",label:"Backup & Recovery",icon:"💾"},
  ];
  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{background:"linear-gradient(135deg,#1F2937,#374151)",borderRadius:16,padding:24,marginBottom:24,color:"#fff"}}>
            <div style={{fontSize:14,opacity:0.7}}>System Administration Panel</div>
            <div style={{fontSize:24,fontWeight:900,marginTop:4}}>Automation Engine Control Center</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            <StatCard label="System Uptime" value="99.9%" color={COLORS.accent} icon="✅" />
            <StatCard label="Total Users" value={11} color={COLORS.primary} icon="👥" />
            <StatCard label="Total Cases" value={DUMMY_CASES.length} color={COLORS.secondary} icon="📁" />
            <StatCard label="Auto-Notifications" value={24} color="#F59E0B" icon="📧" />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <Card>
              <h3 style={{fontSize:15,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>System Health</h3>
              {[["Database","🟢 Online"],["Notification Engine","🟢 Running"],["File Storage","🟢 99% Available"],["Auth Service","🟢 Secure"],["Backup","🟡 Last: 2h ago"]].map(([s,v])=>(
                <div key={s} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #F3F4F6",fontSize:13}}>
                  <span style={{color:COLORS.textSecondary}}>{s}</span><span style={{fontWeight:600}}>{v}</span>
                </div>
              ))}
            </Card>
            <Card>
              <h3 style={{fontSize:15,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Auto-Generated Case IDs</h3>
              {DUMMY_CASES.map(c=>(
                <div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F3F4F6",fontSize:12}}>
                  <span style={{fontWeight:700,color:COLORS.primary}}>{c.id}</span><Badge text={c.type}/>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
      {tab === "users" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>User Management</h3>
          <Table cols={["Name","Role","Email","Access Level","Status"]}
            rows={CREDENTIALS.map(c=>[
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:COLORS.primary,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{c.avatar}</div>
                {c.name}
              </div>,
              c.label,c.email,
              c.role==="vc"?"Highest":c.role==="system"?"Admin":c.role==="student"?"Basic":"Standard",
              <Badge text="Active" color={COLORS.accent}/>
            ])}
          />
        </Card>
      )}
      {tab === "routing" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Case Routing Rules</h3>
          {[
            {label:"Type-1 Cases",desc:"Student → Proctor / Deputy Proctor → Convert to Type-2 OR Close",color:"#F59E0B"},
            {label:"Normal Type-2 Cases",desc:"Student → Officer → Proctor → (Assistant/Deputy Investigation) → Report → Decision",color:COLORS.secondary},
            {label:"Confidential Cases",desc:"Student → Female Coordinator → Sexual Harassment Committee → Resolve OR → Registrar → DC → Close",color:"#8B5CF6"},
            {label:"Serious Cases",desc:"Proctor → Registrar → Disciplinary Committee → Final Decision → Close",color:"#EF4444"},
          ].map(r=>(
            <div key={r.label} style={{border:`2px solid ${r.color}25`,borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:r.color,marginBottom:4}}>{r.label}</div>
              <div style={{fontSize:13,color:COLORS.textSecondary}}>{r.desc}</div>
            </div>
          ))}
        </Card>
      )}
      {tab === "logs" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>System Audit Logs</h3>
          {[
            {time:"2026-04-03 09:15:22",action:"Case CASE-001 submitted by student",user:"student@uni.edu",type:"CREATE"},
            {time:"2026-04-03 09:20:11",action:"Case CASE-001 reviewed by Officer",user:"officer@uni.edu",type:"UPDATE"},
            {time:"2026-04-03 10:05:44",action:"Case CASE-002 converted to Type-2",user:"proctor@uni.edu",type:"UPDATE"},
            {time:"2026-04-03 11:30:00",action:"Hearing scheduled for CASE-007",user:"assistant@uni.edu",type:"ACTION"},
            {time:"2026-04-03 14:00:00",action:"Case CASE-004 resolved and closed",user:"proctor@uni.edu",type:"CLOSE"},
          ].map((log,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #F3F4F6",fontSize:12}}>
              <span style={{color:COLORS.textSecondary,whiteSpace:"nowrap"}}>{log.time}</span>
              <span style={{background:log.type==="CREATE"?COLORS.accent+"20":log.type==="CLOSE"?"#EF444420":"#3B82F620",color:log.type==="CREATE"?COLORS.accent:log.type==="CLOSE"?"#EF4444":"#3B82F6",borderRadius:4,padding:"1px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{log.type}</span>
              <span style={{flex:1,color:COLORS.textPrimary}}>{log.action}</span>
              <span style={{color:COLORS.textSecondary}}>{log.user}</span>
            </div>
          ))}
        </Card>
      )}
      {tab === "notifications" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Notification Engine</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
            <StatCard label="SMS Sent Today" value={18} color={COLORS.secondary} icon="📱"/>
            <StatCard label="Emails Sent Today" value={24} color={COLORS.primary} icon="📧"/>
          </div>
          {[
            {to:"student@uni.edu",subject:"Your case CASE-001 has been received",via:"Email+SMS",time:"2h ago"},
            {to:"assistant@uni.edu",subject:"New case assigned: CASE-007",via:"Email",time:"3h ago"},
            {to:"student@uni.edu",subject:"Hearing scheduled for CASE-007",via:"SMS",time:"4h ago"},
          ].map((n,i)=>(
            <div key={i} style={{border:"1px solid #E5E7EB",borderRadius:10,padding:12,marginBottom:8,fontSize:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontWeight:700,color:COLORS.primary}}>To: {n.to}</span>
                <span style={{color:COLORS.textSecondary}}>{n.time}</span>
              </div>
              <div style={{color:COLORS.textSecondary,marginBottom:4}}>{n.subject}</div>
              <Badge text={n.via} color={COLORS.secondary}/>
            </div>
          ))}
        </Card>
      )}
      {tab === "backup" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Backup & Recovery</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
            <StatCard label="Last Backup" value="2h ago" color={COLORS.accent} icon="💾"/>
            <StatCard label="Storage Used" value="24GB" color={COLORS.secondary} icon="🗄️"/>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <Btn variant="primary" onClick={()=>alert("Backup started!")}>🔄 Run Backup Now</Btn>
            <Btn variant="outline" onClick={()=>alert("Restore initiated!")}>📥 Restore from Backup</Btn>
            <Btn variant="ghost">📊 View Backup History</Btn>
          </div>
          <div style={{marginTop:20,background:"#F0FDF4",borderRadius:12,padding:16,fontSize:13,color:"#16A34A"}}>
            ✅ All systems operational. Last backup completed successfully. Data encrypted with AES-256.
          </div>
        </Card>
      )}
    </Layout>
  );
};

// ─── FEMALE COORDINATOR DASHBOARD ─────────────────────────────────────────────
const FCoordDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [cases, setCases] = useState(DUMMY_CASES.filter(c=>c.category==="Confidential"));
  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:"🏠"},
    {id:"receive",label:"Receive Confidential",icon:"📥"},
    {id:"forward",label:"Forward to SH Committee",icon:"➡️"},
    {id:"privacy",label:"Privacy Management",icon:"🔒"},
  ];
  const handleAction = (caseId,action) => { setCases(prev=>prev.map(c=>c.id===caseId?{...c,status:action}:c)); setModal(null); };
  return (
    <Layout user={user} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout}>
      {tab === "dashboard" && (
        <div>
          <div style={{background:"#F5F3FF",borderRadius:14,padding:16,marginBottom:20,fontSize:13,color:"#6D28D9",display:"flex",gap:10}}>
            <span style={{fontSize:20}}>🔒</span>
            <div>Female Coordinator handles ONLY confidential complaints. All cases are forwarded to the Sexual Harassment Committee for investigation.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:16,marginBottom:28}}>
            <StatCard label="Confidential Received" value={cases.length} color="#8B5CF6" icon="📥"/>
            <StatCard label="Forwarded to SHC" value={cases.filter(c=>c.status==="Forwarded to SH Committee").length} color={COLORS.secondary} icon="➡️"/>
            <StatCard label="Pending" value={cases.filter(c=>c.status==="Under Investigation").length} color="#F59E0B" icon="⏳"/>
          </div>
          <Card>
            <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Confidential Cases</h3>
            <Table cols={["Case ID","Status","Priority","Date","Action"]}
              rows={cases.map(c=>[
                <span style={{fontWeight:700,color:"#8B5CF6"}}>{c.id}</span>,
                <Badge text={c.status}/>,<Badge text={c.priority}/>,c.date,
                <Btn variant="ghost" style={{padding:"4px 12px",fontSize:12}} onClick={()=>setModal(c)}>Review</Btn>
              ])}
            />
          </Card>
        </div>
      )}
      {tab === "receive" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:4}}>Confidential Complaints Received</h3>
          <p style={{fontSize:13,color:COLORS.textSecondary,marginBottom:16}}>These cases arrived via the Officer/Coordinator routing for confidential complaints</p>
          {cases.map(c=>(
            <div key={c.id} style={{border:"2px solid #8B5CF620",background:"#FAFAFE",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontWeight:700,color:"#8B5CF6"}}>{c.id}</span><Badge text={c.priority}/>
              </div>
              <div style={{fontSize:14,color:COLORS.textPrimary,marginBottom:4}}>🔒 {c.subject}</div>
              <div style={{fontSize:12,color:COLORS.textSecondary,marginBottom:12}}>Date: {c.date} | Status: <Badge text={c.status}/></div>
              <Btn variant="ghost" onClick={()=>setModal(c)} style={{padding:"6px 14px",fontSize:12}}>📋 View Details</Btn>
            </div>
          ))}
        </Card>
      )}
      {tab === "forward" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Forward to Sexual Harassment Committee</h3>
          {cases.map(c=>(
            <div key={c.id} style={{border:"1px solid #E5E7EB",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{fontWeight:700,color:"#8B5CF6",marginBottom:4}}>{c.id}</div>
              <div style={{fontSize:13,color:COLORS.textSecondary,marginBottom:12}}>🔒 Confidential | Priority: <Badge text={c.priority}/></div>
              <Btn variant="primary" style={{padding:"6px 14px",fontSize:12}} onClick={()=>handleAction(c.id,"Forwarded to SH Committee")}>
                🔒 Forward to SH Committee
              </Btn>
            </div>
          ))}
        </Card>
      )}
      {tab === "privacy" && (
        <Card>
          <h3 style={{fontSize:16,fontWeight:700,color:COLORS.textPrimary,marginTop:0,marginBottom:16}}>Privacy & Access Management</h3>
          <div style={{background:"#F5F3FF",borderRadius:12,padding:16,marginBottom:16,fontSize:13,color:"#6D28D9"}}>
            🔐 All confidential cases are accessible only to: Female Coordinator, Sexual Harassment Committee, and authorized administrators.
          </div>
          {[["Identity Protection","Student identities masked in all reports","✅ Active"],["Access Control","Role-based access enforced","✅ Active"],["Data Encryption","All confidential data encrypted","✅ AES-256"],["Audit Trail","All access logged securely","✅ Active"]].map(([t,d,s])=>(
            <div key={t} style={{border:"1px solid #E5E7EB",borderRadius:10,padding:14,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontWeight:700,color:COLORS.textPrimary,fontSize:14}}>{t}</span>
                <span style={{color:COLORS.accent,fontSize:12,fontWeight:600}}>{s}</span>
              </div>
              <div style={{fontSize:12,color:COLORS.textSecondary}}>{d}</div>
            </div>
          ))}
        </Card>
      )}
      {modal && <Modal title={`Confidential: ${modal.id}`} onClose={()=>setModal(null)}>
        <div style={{background:"#F5F3FF",borderRadius:10,padding:12,marginBottom:16,fontSize:12,color:"#6D28D9"}}>🔒 Strictly Confidential</div>
        <div style={{fontSize:13,marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
          {[["Case ID",modal.id],["Subject","🔒 "+modal.subject],["Priority",<Badge text={modal.priority}/>],["Status",<Badge text={modal.status}/>],["Date",modal.date]].map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:8,borderBottom:"1px solid #F3F4F6",paddingBottom:8}}>
              <span style={{fontWeight:700,width:80,color:COLORS.textSecondary}}>{k}:</span><span>{v}</span>
            </div>
          ))}
        </div>
        <Btn variant="primary" onClick={()=>handleAction(modal.id,"Forwarded to SH Committee")}>🔒 Forward to SH Committee</Btn>
      </Modal>}
    </Layout>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
const ROLE_COMPONENTS = {
  student:      StudentDashboard,
  officer:      OfficerDashboard,
  fcoord:       FCoordDashboard,
  proctor:      ProctorDashboard,
  deputy:       DeputyDashboard,
  assistant:    AssistantDashboard,
  registrar:    RegistrarDashboard,
  disciplinary: DisciplinaryDashboard,
  harassment:   HarassmentDashboard,
  vc:           VCDashboard,
  system:       SystemDashboard,
};

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [loginType, setLoginType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  if (screen === "landing") return (
    <Landing onSelectRole={type => { setLoginType(type); setScreen("login"); }} />
  );
  if (screen === "login") return (
    <LoginPage loginType={loginType} onLogin={user => { setCurrentUser(user); setScreen("dashboard"); }} onBack={() => setScreen("landing")} />
  );
  if (screen === "dashboard" && currentUser) {
    const Component = ROLE_COMPONENTS[currentUser.role];
    return Component ? <Component user={currentUser} onLogout={() => { setCurrentUser(null); setScreen("landing"); }} /> : null;
  }
  return null;
}
