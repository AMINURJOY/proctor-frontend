# Proctor Office Automation System — Frontend

The frontend for Daffodil International University’s Proctor Office Automation System. It provides one role-aware portal for incident submission, case investigation, hearings, reports, disciplinary approvals, notifications, analytics, and system administration.

The application is a React single-page application (SPA) backed by the companion ASP.NET Core API in `../proctor-backend`.

## Main features

### Authentication and access control

- University email and password login.
- JWT access tokens with automatic refresh-token handling.
- Role-specific menus and actions controlled by backend permissions.
- Separate Create, View, Update, Delete, and Send permissions where applicable.
- Development Quick Login profiles for seeded users.
- Personal profile page for every signed-in user.

### Incident and case management

- Submit incidents with student, accused-person, location, category, and supporting-evidence details.
- Preview an incident before submission and print/save the preview as PDF.
- Track cases through overview, documents, hearings, notes, messages, and activity timeline tabs.
- Assign primary and collaborating officers from seeded university users.
- Acknowledge, forward, schedule hearings, record findings, close, or escalate cases according to role and case type.
- Searchable and paginated Cases, My Cases, Incidents, Hearings, Reports, Students, and Audit Logs pages.

### Case types and workflows

| Type | Purpose | Typical flow |
| --- | --- | --- |
| Type‑1 | Immediate or fast-response incident | Submit → acknowledge → close, send to police, or suggest Type‑2 |
| Type‑2 | Formal investigation | Submit → verify → assign → hearing → report |
| Confidential | A confidentiality flag on a Type‑2 case | Female intake → female administrative officer → confidential recipient |
| Type‑3 | Disciplinary approval workflow for a finalized report | Proctor → Registrar → VC → DC Chairman → six DC Members → DC Secretary → DC Chairman → Chairman |

Type‑1 incidents do not appear in Pending Reports. Only Type‑2 and confidential Type‑2 cases can produce investigation reports. When an authorized user sends a finalized report into Type‑3, the case is marked Type‑3 while the finalized report moves through the approval chain.

### Hearings and reports

- Schedule, reschedule, conduct, and complete hearings with participants and remarks.
- Prepare rich-text investigation reports with structured case information.
- Save drafts and finalize reports.
- Optional Google Gemini-assisted report drafting when configured by an administrator.
- Preview reports in a page-sized viewer with zoom controls.
- Print or export reports as PDF and DOCX.
- Separate Pending Reports and Completed Reports views.

### Type‑3 disciplinary workflow

- Dedicated report queues for Registrar, VC, DC Chairman, DC Members, DC Secretary, and Chairman.
- Mandatory forwarding remarks and a visible forwarding history at every stage.
- One attributed remark from each of six DC Members.
- DC Secretary can combine eligible cases into a resolution and generate a DOCX.
- DC Chairman reviews the resolution before the Chairman gives final approval.
- Approved resolutions and their cases remain available as completed history.

### Documents and investigation access

- Normal case attachments support images, video, PDF, and document files.
- Type‑2 and Type‑3 cases include a separate **Investigation Attachments** area.
- Restricted investigation evidence supports uploaded images and validated Google Drive links.
- View and upload access is independently controlled by role in General Settings and enforced by the API.
- Google Drive permissions must still be configured correctly in Google Drive itself.

### Search, analytics, and monitoring

- Advanced Search filters by text, status, case type, category, department, batch, responsible person, year, semester, CGPA, and date range.
- Summary cards for total, open, pending, under-review, and resolved cases.
- Charts for trends, case types, categories, CGPA ranges, and workload.
- Print analytics and export filtered case results to Excel.
- VC Monitoring view for oversight.
- Student directory with batch and profile information.

### Notifications and auditing

- In-app notifications with unread counts and mark-as-read actions.
- Notifications link users to relevant cases where appropriate.
- Duplicate-safe workflow notifications are handled by the API.
- Audit Logs provide a detailed, paginated history of API activity for authorized roles.

### Administration and settings

Super Admin can manage:

- Users and roles
- Roles & Permissions
- Incident routing
- Case viewing rules
- Verification checklist
- Case categories
- Ranks and disciplinary articles
- Type‑1 and Type‑2 forwarding/action rules
- Investigation attachment access
- AI integration

## Roles

The interface currently recognizes these role keys:

- Student
- Assistant Administrative Officer (`coordinator`)
- Female Administrative Officer (`female-coordinator`)
- Proctor
- Assistant Proctor
- Deputy Proctor
- Registrar
- Vice Chancellor
- Disciplinary Committee (legacy Type‑2 role)
- Sexual Harassment Committee
- DC Chairman
- DC Member
- DC Secretary
- Chairman
- Super Admin

Actual menu visibility and available buttons come from the permissions returned by the backend, not from the role name alone.

## Technology

- React 18 and TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- Axios
- TipTap rich-text editor
- Recharts
- Radix UI and Material UI components
- SheetJS for Excel export
- DOCX/PDF/print utilities

## Project structure

```text
src/
├── app/
│   ├── components/       Shared layout, controls, viewers, and pagination
│   ├── context/          Authentication state
│   ├── data/             Quick-login/demo profile definitions
│   ├── hooks/            Permission helpers
│   ├── pages/            Route-level application screens
│   │   └── settings/     Administrative settings screens
│   ├── services/         Axios client and API functions
│   ├── utils/            Role, status, and export helpers
│   ├── routes.ts         Application route definitions
│   └── types.ts          Shared frontend types
├── main.tsx              React entry point
└── styles/               Global styling
```

## Local setup

### Prerequisites

- A current Node.js LTS release and npm
- The backend API and PostgreSQL database

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the API URL

Create `.env.local` in this frontend directory:

```env
VITE_API_URL=http://localhost:5106
```

Do not append `/api`; the frontend API client adds it automatically. If `VITE_API_URL` is omitted, the same local URL is used by default.

### 3. Start the backend

From the sibling backend repository:

```bash
cd ../proctor-backend
dotnet run --project src/PROCTOR.API/PROCTOR.API.csproj
```

The backend applies EF Core migrations and performs idempotent seed/data-repair work during startup.

### 4. Start the frontend

```bash
npm run dev
```

Open the URL displayed by Vite, normally `http://localhost:5173`.

## Seeded Quick Login

When the backend seed data is available, the login screen provides Quick Login buttons for students, the proctorial body, Registrar, VC, disciplinary roles, Chairman, and Super Admin.

Development seed-password convention:

- Super Admin: `Admin@123!`
- Other seeded accounts: `Password123!`

These credentials are for development/demo environments only. Remove or disable demo access and replace all seeded passwords before using the application with real data.

## Available commands

```bash
# Start the development server
npm run dev

# Create an optimized production build
npm run build
```

The generated production files are written to `dist/`.

## Production deployment

1. Set `VITE_API_URL` to the public backend origin at build time, for example:

   ```env
   VITE_API_URL=https://api.example.edu
   ```

2. Run `npm ci` and `npm run build`.
3. Serve the generated `dist/` directory from a static web server.
4. Configure SPA fallback so unknown paths return `index.html`; direct visits to routes such as `/cases/...` must be handled by React Router.
5. Add the frontend origin to the backend CORS allow-list.
6. Use HTTPS in production because authentication tokens and protected case data are transmitted between the browser and API.

Vite environment variables are embedded during the build. Changing `VITE_API_URL` requires rebuilding the frontend.

## Security notes

- The browser stores access and refresh tokens in local storage; always deploy over HTTPS and avoid running untrusted scripts on the same origin.
- Hiding a button in the UI is not authorization. All permissions, confidential-case access, report transitions, and protected downloads must remain enforced by the backend.
- Investigation attachment URLs should only be obtained through authenticated API calls.
- Never commit production API keys or secrets. AI provider credentials are configured through the protected settings API and stored server-side.

## Troubleshooting

### Login or API requests fail

- Confirm the backend is running.
- Confirm `VITE_API_URL` contains only the API origin, without `/api`.
- Check that the frontend origin is allowed by backend CORS.
- Clear stale `accessToken`, `refreshToken`, and `userData` values from browser local storage, then sign in again.

### A menu or action button is missing

- Check the user’s role in **Users / Roles**.
- Check the menu action in **General Settings → Roles & Permissions**.
- For case-specific actions, also check **Case Forwarding** rules.

### Batch options are empty in Advanced Search

- Ensure the backend has applied the student batch migration and completed startup seeding/data repair.
- Ensure cases use student IDs that exist in the Students directory.
- Restart the backend after deploying seed or migration changes.

### Refreshing a nested URL returns 404

Configure the production web server to fall back to `index.html` for frontend routes.

