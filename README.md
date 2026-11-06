# NexusTrace

NexusTrace is a web-based requirements traceability and change impact analytics system for student software project teams.

## Development design preview

Run `npm run dev -- --port 3000` and open `/preview` to explore the interactive design. It opens directly with sample team data, without Supabase credentials. The overview shows the basic Requirement → Task → Test workflow and what needs attention. On **Requirements**, switch between a searchable **List** and a **Transit map**. The map shows colored requirement lines, task and test stops, dependency links, shared tests, and a change impact preview. Select a module to keep the map readable. Test cases, the matrix, change requests and the quality checker remain available under the navigation and requirement details. Demo edits and the chosen requirement view are saved in the browser's local storage.

The design preview is separate from the Supabase-backed application routes; connect a NexusTrace Supabase project to use those routes with real team data.

## Stack
- Next.js (App Router)
- Supabase: PostgreSQL, Auth (Google sign-in), row-level security
- Vercel (deployment, later)

## Database
`supabase/migrations/` holds the schema, applied in order:

| File | What it does |
|---|---|
| 0001_schema.sql | 14 tables, row-level security, version history, impact analysis, change request approval, audit log |
| 0002_test_run_order.sql | Latest test run always wins, even with identical timestamps |
| 0003_private_helpers.sql | Moves RLS helpers out of the public API; blocks a team lead from making themselves supervisor |

`supabase/tests/security_test.sql` runs 10 access-control attacks as a lead, student, supervisor and outsider.
Paste it into the Supabase SQL editor; every row should show `ok = true`. It leaves no data behind.
