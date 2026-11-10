# NexusTrace

NexusTrace is a web-based requirements traceability and change impact analytics system for student software project teams.

It links every **requirement** to the **tasks** that build it and the **test cases** that check it. When a requirement changes, NexusTrace shows which tasks and tests are affected and must be redone or re-run, and the change must be approved by the project supervisor first.

## What it does (project objectives)

| Objective | What it covers | Where in the app |
|---|---|---|
| **RO1** Requirements and traceability | Record requirements, keep every old version, link tasks and tests, auto-built traceability matrix | Requirements, Test cases, Traceability matrix |
| **RO2** Change impact analysis | Propose a change, see everything it affects (up to 3 levels), supervisor approves or rejects | Change requests |
| **RO3** Analytics and quality | Project health at a glance, rule-based quality score for requirement wording (ISO/IEC/IEEE 29148) | Overview, Quality check |

## Tech stack

- **Next.js 15** (App Router): the web app
- **Supabase**: PostgreSQL database, sign-in (email magic link), row-level security
- **Vercel**: hosting (not set up yet)

## Run it on your computer

You need [Node.js](https://nodejs.org) (LTS) and Git.

```bash
git clone https://github.com/nurliyananajwa/nexustrace
cd nexustrace
npm install
```

Create a file named `.env.local` in the project folder (copy `.env.example`) and fill in the Supabase values from **Supabase → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

Then start it and open http://localhost:3000:

```bash
npm run dev
```

`.env.local` is never uploaded to GitHub. Only use the **publishable (anon)** key. Never put the `service_role` key in this project.

## How the code is organised

### Where each screen lives

| Screen | URL | Folder |
|---|---|---|
| Home page | `/` | `app/page.tsx` |
| Sign in | `/signin` | `app/signin/` |
| Design preview (sample data, no sign-in) | `/preview` | `app/preview/page.tsx` |
| Your projects | `/teams` | `app/(app)/teams/` |
| Overview (dashboard) | `/projects/[id]/dashboard` | `app/(app)/projects/[id]/dashboard/` |
| Requirements (card view and Circuit view) | `/projects/[id]/requirements` | `app/(app)/projects/[id]/requirements/` |
| Test cases | `/projects/[id]/tests` | `app/(app)/projects/[id]/tests/` |
| Traceability matrix | `/projects/[id]/matrix` | `app/(app)/projects/[id]/matrix/` |
| Change requests | `/projects/[id]/changes` | `app/(app)/projects/[id]/changes/` |
| Quality check | `/projects/[id]/quality` | `app/(app)/projects/[id]/quality/` |

`[id]` is the project's ID. Folders in brackets like `(app)` group pages without changing the URL. Every page inside `(app)` requires sign-in.

### The three files in each screen folder

Most screen folders follow the same pattern:

| File | Job |
|---|---|
| `page.tsx` | Runs on the server. **Reads** the data from the database. |
| `...View.tsx` | Runs in the browser. **Shows** the data and handles clicks, filters and forms. |
| `actions.ts` | Runs on the server. **Saves** changes (new requirement, record a test result, approve a change). |

So to change what a screen *shows*, edit the `View` file. To change what it *saves*, edit `actions.ts`.

The Requirements screen is bigger, so its pop-ups and detail panel each have their own file (`DetailPanel.tsx`, `NewRequirementModal.tsx`, `AddTaskModal.tsx`, `LinkTestModal.tsx`, `ProposeChangeModal.tsx`), with shared types in `types.ts`.

### Shared folders

| Folder / file | What it is |
|---|---|
| `components/Sidebar.tsx` | The left menu on every project screen |
| `components/CircuitView.tsx` | The Circuit view (used by Requirements and the preview) |
| `components/Modal.tsx` | The pop-up window used by every form |
| `components/Highlighted.tsx` | Highlights the words flagged by the quality checker |
| `components/Brand.tsx` | The NexusTrace logo |
| `components/ui.tsx` | Small shared pieces: page heading, status pills, empty state |
| `lib/quality.ts` | The rule-based quality checker (scoring rules and penalties) |
| `lib/codes.ts` | Makes the next readable ID (FR03, TC12, CR04) |
| `lib/constants.ts` | App name, role names, status labels |
| `lib/data.ts` | Helpers to load the signed-in user and their projects |
| `lib/supabase/` | Connection to Supabase. `database.types.ts` is generated from the database, so don't edit it by hand |
| `middleware.ts` | Sends signed-out visitors to the sign-in page |
| `app/auth/` | Sign-in callback and sign-out |
| `app/globals.css` | Colours and styles for the whole app |

## Database and security

The database lives in Supabase. Its structure is saved as code in `supabase/migrations/`, applied in order:

| File | What it does |
|---|---|
| `0001_schema.sql` | The 14 tables, row-level security, version history, impact analysis, change approval and audit log |
| `0002_test_run_order.sql` | The latest test run always counts as the current result |
| `0003_private_helpers.sql` | Moves internal helpers out of the public API, and stops a team lead from making themselves supervisor |
| `0004_drop_quality_score.sql` | Removes the stored quality score; the score is always calculated live from the wording |

Key security rules (enforced in the database, not only the screens):

- A user only sees projects they are a member of.
- Only the **supervisor** can approve or reject a change request.
- An approved requirement can only change through an approved change request, and every old version is kept.
- Test history and the audit log can't be edited or deleted.

`supabase/tests/security_test.sql` tries 9 access-control attacks as a team lead, a student, a supervisor and an outsider. Paste it into the Supabase SQL editor. Every row should show `ok = true`, and it leaves no data behind.

## Current status

**Working:** database and security rules (tested), all screens connected to the real database, design preview with sample data.

**Not done yet:**

- **Email sign-in only works for the project owner.** Supabase's built-in email service only sends to members of the Supabase team, at most 2 emails per hour. Connect a custom email service (for example Brevo or Resend) under Supabase → Authentication → Emails → SMTP so other people can sign in.
- **No screen to add a supervisor or teammates**, so a change request can't be approved yet.
- **No way to change a requirement's status** (everything stays Draft).
- **No way to link requirements to each other**, so the impact map only shows tasks and tests, not dependent requirements.
- **Dashboard analytics** (pass rate, test results, quality summary) need to come back under the new overview design.

## Branches

Everything is on `main`. Create a new branch for experiments and merge it back into `main` when it works.
