# Phase 4: Review + Payment + Account

**Total Size: L + L + M** (3 sections after condense: old 4.1+4.2 → new 4.1, old 4.3+4.4 → new 4.2, old 4.5+4.6 → new 4.3)
**Prerequisites: Phase 3 complete — applications land in `cohort_applications` with `decision: 'pending'`. `storefront-auth` Phase 3.1 shipped (`src/lib/stripe/client.ts` + `STRIPE_SECRET_KEY` in env). `storefront-auth` Phase 3.3 shipped (`src/app/api/stripe/webhook/route.ts` + `STRIPE_WEBHOOK_SECRET`). `storefront-auth` Phase 4.1 shipped (`/products/account/page.tsx`).**
**New Env Vars: `ADMIN_EMAILS` (comma-separated allowlist), `COHORT_CHECKOUT_SECRET` (HMAC signing key, `openssl rand -base64 32`)**
**New Files: See feature-specific file tables below.**

Phase 4 closes the loop. An admin reviews pending applications, decides
who's in, accepted applicants get a signed checkout link, they pay via
Stripe, the webhook writes their enrollment, and the enrollment surfaces
on their `/products/account` page. By the end of this phase the full
funnel is live and the job is shippable.

---

## Feature 4.1: Admin Layout + Applications List + Detail + `decideApplication`

**Complexity: L** — Merged from old 4.1 + 4.2. Same-entity views (list +
detail) for admin cohort applications: shared admin layout + allowlist +
`src/lib/cohorts/admin.ts` helpers (`listApplications`, `getApplication`,
`decideApplication`). List and detail cannot be tested in isolation of
the helpers they share. Two sub-parts below: **#### Admin Layout + List
Page** (old 4.1) and **#### Application Detail + `decideApplication`**
(old 4.2).

#### Admin Layout + List Page

(Old Feature 4.1 — Complexity M on its own.) A new `/admin/layout.tsx`
that reads `ADMIN_EMAILS` from the env and 403s any session whose email
isn't on the list. On top of that layout,
`/admin/cohorts/applications` renders pending + decided applications
grouped by cohort.

### Problem — Admin Layout + List

There is no admin surface in the repo yet. Phase 4 is where the first
gated-admin page lands, and since `email-funnel` plans an
`/admin/email-funnel` dashboard under the same allowlist, this job has
to ship the shared layout that both jobs use. The allowlist is
env-driven (no DB-backed `admins` table yet) because a DB table is
over-engineered for a one-or-two-person admin surface and adds a
migration that neither job strictly needs.

### Implementation — Admin Layout + List

**NEW** `src/app/admin/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { Container } from '@/components/site/Container';

function parseAllowlist(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login?callbackUrl=%2Fadmin%2Fcohorts%2Fapplications');
  }

  const allowlist = parseAllowlist(process.env.ADMIN_EMAILS);
  const email = session.user.email.toLowerCase();
  if (!allowlist.includes(email)) {
    return (
      <Container as="main" className="py-16">
        <h1 className="font-display text-2xl font-semibold">Forbidden</h1>
        <p className="mt-3 text-sm text-muted">
          Your account is not in the admin allowlist.{' '}
          <Link href="/" className="text-link underline-offset-2 hover:underline">
            Back to site
          </Link>
        </p>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="border-b border-mist bg-parchment/80 backdrop-blur">
        <Container className="flex items-center justify-between py-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            Admin
          </p>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/cohorts/applications" className="hover:text-accent">
              Cohort applications
            </Link>
            <span className="text-xs text-muted">Signed in as {session.user.email}</span>
          </nav>
        </Container>
      </header>
      {children}
    </div>
  );
}
```

**NEW** `src/lib/cohorts/admin.ts`:

```ts
import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db/client';
import type { CohortApplicationRow } from '@/db/schema';

export interface ApplicationListRow extends CohortApplicationRow {
  userEmail: string;
}

/**
 * List applications for a given cohort + decision, joined with the user's
 * email for display.
 */
export async function listApplications(options: {
  cohortSlug?: string;
  decision?: 'pending' | 'accepted' | 'waitlisted' | 'declined';
}): Promise<ApplicationListRow[]> {
  const conditions = [];
  if (options.cohortSlug) {
    conditions.push(eq(schema.cohortApplications.cohortSlug, options.cohortSlug));
  }
  if (options.decision) {
    conditions.push(eq(schema.cohortApplications.decision, options.decision));
  }

  const rows = await db
    .select({
      application: schema.cohortApplications,
      userEmail: schema.users.email,
    })
    .from(schema.cohortApplications)
    .innerJoin(schema.users, eq(schema.cohortApplications.userId, schema.users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.cohortApplications.submittedAt));

  return rows.map((row) => ({
    ...row.application,
    userEmail: row.userEmail,
  }));
}

export async function getApplication(
  id: string,
): Promise<ApplicationListRow | null> {
  const [row] = await db
    .select({
      application: schema.cohortApplications,
      userEmail: schema.users.email,
    })
    .from(schema.cohortApplications)
    .innerJoin(schema.users, eq(schema.cohortApplications.userId, schema.users.id))
    .where(eq(schema.cohortApplications.id, id))
    .limit(1);

  if (!row) return null;
  return { ...row.application, userEmail: row.userEmail };
}
```

**NEW** `src/app/admin/cohorts/applications/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { listApplications } from '@/lib/cohorts/admin';
import { getAllCohorts } from '@/lib/content/cohorts';

export const metadata: Metadata = {
  title: 'Cohort applications',
  robots: { index: false, follow: false },
};

type RouteParams = {
  searchParams: Promise<{ cohort?: string; decision?: string }>;
};

const DECISION_FILTERS = ['pending', 'accepted', 'waitlisted', 'declined'] as const;
type DecisionFilter = (typeof DECISION_FILTERS)[number];

function isDecisionFilter(value: string | undefined): value is DecisionFilter {
  return (
    value !== undefined &&
    (DECISION_FILTERS as readonly string[]).includes(value)
  );
}

export default async function AdminApplicationsPage({ searchParams }: RouteParams) {
  const { cohort, decision } = await searchParams;
  const cohorts = await getAllCohorts();
  const decisionFilter = isDecisionFilter(decision) ? decision : 'pending';

  const applications = await listApplications({
    cohortSlug: cohort,
    decision: decisionFilter,
  });

  return (
    <Container as="main" className="py-10">
      <h1 className="font-display text-3xl font-semibold">Applications</h1>
      <p className="mt-2 text-sm text-muted">
        Review and decide on cohort applications.
      </p>

      <form className="mt-8 flex flex-wrap gap-3 text-sm" method="get">
        <label className="flex items-center gap-2">
          Cohort
          <select
            name="cohort"
            defaultValue={cohort ?? ''}
            className="rounded-md border border-mist bg-parchment px-3 py-2"
          >
            <option value="">All</option>
            {cohorts.map((entry) => (
              <option key={entry.meta.slug} value={entry.meta.slug}>
                {entry.meta.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Decision
          <select
            name="decision"
            defaultValue={decisionFilter}
            className="rounded-md border border-mist bg-parchment px-3 py-2"
          >
            {DECISION_FILTERS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md border border-mist bg-parchment px-4 py-2 text-sm font-semibold hover:border-accent"
        >
          Filter
        </button>
      </form>

      <section className="mt-10">
        {applications.length === 0 ? (
          <p className="rounded-md border border-mist p-6 text-sm text-muted">
            No applications match the current filter.
          </p>
        ) : (
          <ul className="divide-y divide-mist">
            {applications.map((app) => (
              <li key={app.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{app.userEmail}</p>
                    <p className="mt-1 text-xs text-muted">
                      {app.cohortSlug} · {app.commitmentLevel} · {app.commitmentHours}h/wk · {app.timezone} · {app.pillarInterest}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {app.goals}
                    </p>
                  </div>
                  <Link
                    href={`/admin/cohorts/applications/${app.id}`}
                    className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-parchment hover:bg-accent/90"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
```

### Tests — Admin Layout + List (part of `cohort-enrollment-4.1` red phase)

**NEW** `src/app/admin/__tests__/layout.test.tsx`:

- No session → redirects to `/login?callbackUrl=%2Fadmin...`.
- Session with email not in `ADMIN_EMAILS` → renders the "Forbidden" state
  (test sets `process.env.ADMIN_EMAILS = 'root@travisgautier.com'` + session
  email `intruder@example.com`).
- Session with email in `ADMIN_EMAILS` (case-insensitive) → renders the
  `{children}` slot wrapped in the admin header.
- `ADMIN_EMAILS` unset → any session is forbidden (empty allowlist, deny
  by default).
- Allowlist handles whitespace + case: `ADMIN_EMAILS="Admin@Foo.com,  test@bar.com"`
  matches `admin@foo.com` and `test@bar.com`.

**NEW** `src/app/admin/cohorts/applications/__tests__/page.test.tsx`:

- Renders heading + filter form.
- Filter form has one option per cohort.
- Default filter is `decision: 'pending'`.
- Applications list renders one row per application with email + slug + metadata.
- Empty list renders the "No applications match" fallback.
- "Review" link goes to `/admin/cohorts/applications/{id}`.

**NEW** `src/lib/cohorts/__tests__/admin.test.ts`:

- `listApplications({})` returns all applications joined with user emails.
- `listApplications({ cohortSlug: 'workflow-mastery-2026-q4' })` filters by slug.
- `listApplications({ decision: 'pending' })` filters by decision.
- `listApplications({ cohortSlug, decision })` applies both filters.
- Sort order is `desc(submittedAt)`.
- `getApplication(id)` returns the row with user email joined.
- `getApplication('bogus-uuid')` returns `null`.

### Design Decisions — Admin Layout + List

- **Layout-level allowlist check** — every nested route under `/admin/*`
  inherits the gate automatically. No need to repeat the check in each
  page component.
- **Case-insensitive email match** — operators routinely register emails
  with mixed case in the env var and lowercase in their Auth.js identity;
  matching lowercase-lowercase avoids a frustrating debugging session.
- **Empty allowlist denies by default** — safer than defaulting to "any
  signed-in user is an admin". If the env var is forgotten, the page is
  inaccessible rather than wide open.
- **Middleware already gates `/admin/*`** — the Phase 3.2 middleware
  extension covers redirect-to-login. The layout gate is the second-level
  check for "is this user an admin" since middleware can't read env vars
  (Edge runtime, no `process.env` access to arbitrary names).
- **Filter form uses `method="get"`** — plain HTML form, no JS. The URL
  query string carries the filter state, which means the admin can
  bookmark filtered views and the server component re-reads the URL.
- **Default decision filter is `pending`** — the most common admin
  workflow is "show me the queue of work I need to do".
- **`listApplications` in `src/lib/cohorts/admin.ts`** — pulling the DB
  query out of the page component lets Phase 4.2's detail page reuse
  `getApplication` and the unit tests exercise them without rendering.

### Files — Admin Layout + List

| Action | File                                                                  |
|--------|-----------------------------------------------------------------------|
| NEW    | `src/app/admin/layout.tsx`                                            |
| NEW    | `src/app/admin/__tests__/layout.test.tsx`                             |
| NEW    | `src/app/admin/cohorts/applications/page.tsx`                         |
| NEW    | `src/app/admin/cohorts/applications/__tests__/page.test.tsx`          |
| NEW    | `src/lib/cohorts/admin.ts`                                            |
| NEW    | `src/lib/cohorts/__tests__/admin.test.ts`                             |

---

#### Application Detail + `decideApplication`

(Old Feature 4.2 — Complexity L on its own.) The admin clicks "Review"
and lands on a page showing the full application. Three buttons (Accept
/ Waitlist / Decline) dispatch a server action that writes a
`cohort_admissions` row, updates `cohort_applications.decision`, and
triggers the decision email.

### Problem — Application Detail + `decideApplication`

Phase 4.1 lists applications; Phase 4.2 is where the admin actually
decides them. The decision action has to do several things atomically:
insert an `admissions` row, update the parent application's `decision`
column, compute an `acceptedUntil` timestamp for accepted applications,
and fire the decision email with the signed checkout token (for the
accept case). Anything that fails mid-flight should leave the DB in a
consistent state — a database transaction is mandatory.

### Implementation — Application Detail + `decideApplication`

**NEW** `src/lib/cohorts/constants.ts`:

```ts
export const ACCEPTANCE_WINDOW_DAYS = 14;

export const COHORT_METADATA_KEYS = {
  kind: 'kind',
  cohortSlug: 'cohortSlug',
  applicationId: 'applicationId',
  userId: 'userId',
} as const;

export const COHORT_METADATA_KIND = 'cohort' as const;
```

**MODIFY** `src/lib/cohorts/admin.ts` — append `decideApplication`:

```ts
import { and, eq, sql } from 'drizzle-orm';
// (existing imports)
import { getCohortBySlug } from '@/lib/content/cohorts';
import { ACCEPTANCE_WINDOW_DAYS } from './constants';
import { sendCohortDecision } from '@/lib/email/cohort-decision';

export type AdminDecision = 'accepted' | 'waitlisted' | 'declined';

interface DecideOptions {
  applicationId: string;
  decision: AdminDecision;
  decidedBy: string;
  decisionNote?: string;
}

export async function decideApplication({
  applicationId,
  decision,
  decidedBy,
  decisionNote,
}: DecideOptions): Promise<void> {
  const application = await getApplication(applicationId);
  if (!application) {
    throw new Error(`Application ${applicationId} not found`);
  }

  const cohort = await getCohortBySlug(application.cohortSlug);
  if (!cohort) {
    throw new Error(`Cohort ${application.cohortSlug} no longer exists`);
  }

  const acceptedUntil =
    decision === 'accepted'
      ? new Date(Date.now() + ACCEPTANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
      : null;

  await db.transaction(async (tx) => {
    // Write the admission row — UNIQUE constraint on application_id
    // makes this naturally idempotent for retries against the same app.
    await tx
      .insert(schema.cohortAdmissions)
      .values({
        applicationId,
        decidedBy,
        decision,
        decisionNote: decisionNote ?? null,
        acceptedUntil,
      })
      .onConflictDoNothing({
        target: schema.cohortAdmissions.applicationId,
      });

    // Update the parent application's decision column so the list view
    // shows the new state without joining.
    await tx
      .update(schema.cohortApplications)
      .set({ decision })
      .where(eq(schema.cohortApplications.id, applicationId));
  });

  // Fire the decision email outside the transaction — best-effort.
  try {
    await sendCohortDecision({
      to: application.userEmail,
      decision,
      application,
      cohort,
      acceptedUntil,
    });
  } catch (err) {
    // Swallow — admin can manually re-trigger from the detail page if needed.
  }
}
```

**NEW** `src/app/admin/cohorts/applications/[id]/page.tsx`:

```tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { auth } from '@/auth';
import {
  getApplication,
  decideApplication,
  type AdminDecision,
} from '@/lib/cohorts/admin';
import { getCohortBySlug } from '@/lib/content/cohorts';
import {
  APPLICATION_COMMITMENT_LEVEL_LABELS,
  type ApplicationCommitmentLevel,
} from '@/content/schemas';

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function decide(decision: AdminDecision, formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthenticated');

  const applicationId = String(formData.get('applicationId') ?? '');
  const decisionNote =
    (formData.get('decisionNote') as string | null)?.trim() || undefined;

  await decideApplication({
    applicationId,
    decision,
    decidedBy: session.user.email,
    decisionNote,
  });

  redirect('/admin/cohorts/applications');
}

async function acceptAction(formData: FormData) {
  'use server';
  await decide('accepted', formData);
}
async function waitlistAction(formData: FormData) {
  'use server';
  await decide('waitlisted', formData);
}
async function declineAction(formData: FormData) {
  'use server';
  await decide('declined', formData);
}

export default async function ApplicationDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  const cohort = await getCohortBySlug(application.cohortSlug);

  return (
    <Container as="main" className="py-10">
      <p className="text-sm">
        <Link
          href="/admin/cohorts/applications"
          className="text-link underline-offset-2 hover:underline"
        >
          ← All applications
        </Link>
      </p>

      <header className="mt-6">
        <h1 className="font-display text-2xl font-semibold">
          {application.userEmail}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Applied {new Intl.DateTimeFormat('en-US', {
            dateStyle: 'long',
            timeStyle: 'short',
          }).format(application.submittedAt)}{' '}
          · {cohort?.meta.title ?? application.cohortSlug}
        </p>
        <p className="mt-2 text-sm">
          Current decision: <strong>{application.decision}</strong>
        </p>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-6 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Commitment</dt>
          <dd className="mt-1">
            {APPLICATION_COMMITMENT_LEVEL_LABELS[application.commitmentLevel as ApplicationCommitmentLevel]}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Hours/week</dt>
          <dd className="mt-1">{application.commitmentHours}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Timezone</dt>
          <dd className="mt-1">{application.timezone}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Pillar</dt>
          <dd className="mt-1">{application.pillarInterest}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Referral</dt>
          <dd className="mt-1">{application.referralSource ?? '—'}</dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Background</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm">{application.background}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Goals</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm">{application.goals}</p>
      </section>

      <section className="mt-12 rounded-md border border-mist p-6">
        <h2 className="font-display text-lg font-semibold">Decide</h2>
        <p className="mt-2 text-xs text-muted">
          Internal note is private — it is stored on the admission row but
          never shown to the applicant.
        </p>
        <div className="mt-5 space-y-3">
          <textarea
            form="cohort-decide-form"
            name="decisionNote"
            rows={3}
            placeholder="Private reviewer notes (optional)"
            className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm"
          />
          <form id="cohort-decide-form" action={acceptAction} className="flex flex-wrap gap-3">
            <input type="hidden" name="applicationId" value={application.id} />
            <button
              type="submit"
              formAction={acceptAction}
              className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-parchment hover:bg-accent/90"
            >
              Accept
            </button>
            <button
              type="submit"
              formAction={waitlistAction}
              className="rounded-md bg-signal px-5 py-3 text-sm font-semibold text-parchment hover:bg-signal/90"
            >
              Waitlist
            </button>
            <button
              type="submit"
              formAction={declineAction}
              className="rounded-md border border-mist bg-parchment px-5 py-3 text-sm font-semibold hover:border-red-500 hover:text-red-600"
            >
              Decline
            </button>
          </form>
        </div>
      </section>
    </Container>
  );
}
```

### Tests — Application Detail + `decideApplication` (part of `cohort-enrollment-4.1` red phase)

**NEW** `src/lib/cohorts/__tests__/admin.decide.test.ts`:

- `decideApplication({ decision: 'accepted' })` writes a row to
  `cohort_admissions` with `acceptedUntil` set to ~14 days from now.
- `decideApplication({ decision: 'waitlisted' })` writes a row with
  `acceptedUntil: null`.
- `decideApplication({ decision: 'declined' })` writes a row with
  `acceptedUntil: null`.
- Parent `cohort_applications.decision` is updated to match.
- `decidedBy` is persisted to the admission row.
- `decisionNote` (when provided) is persisted; when omitted, column is null.
- Non-existent `applicationId` → throws "not found".
- Cohort removed from disk (slug no longer resolves) → throws with a
  descriptive message.
- Re-deciding an already-decided application is idempotent (UNIQUE on
  `application_id` + `onConflictDoNothing` → no new admission row) but
  the function still fires the email (for retry convenience).
- `sendCohortDecision` is called once per decision, with the cohort +
  application + `acceptedUntil` values.
- Email failure does NOT roll back the DB changes.
- Transaction atomicity: simulating a failure during the
  `cohortApplications.update` step rolls back the `cohortAdmissions.insert`.

**NEW** `src/app/admin/cohorts/applications/[id]/__tests__/page.test.tsx`:

- Unknown id → `notFound()`.
- Renders applicant email, cohort title, commitment level label,
  background + goals with preserved whitespace.
- Shows current decision (`pending` on fresh applications).
- Three action buttons are present.
- Clicking "Accept" submits the form to the accept server action (wired
  through `formAction`).

### Design Decisions — Application Detail + `decideApplication`

- **DB transaction wraps admission insert + application update** — both
  rows describe the same state change and must commit or roll back
  together. Drizzle's `db.transaction` runs both inside a single Postgres
  transaction.
- **Email outside the transaction** — HTTP calls inside a DB transaction
  hold the lock for the duration of the call. On a slow Resend response,
  that means the rows are locked for hundreds of milliseconds, creating
  lock contention. The email is best-effort; the DB rows are the source
  of truth.
- **Redirect on success instead of re-rendering the detail page** —
  admins typically decide multiple applications in a session. Landing
  back on the list is a better workflow than refreshing the same detail
  page.
- **Three separate server actions** — the form uses `formAction` to
  override the action per button. Next.js 16 allows multiple server
  actions inside a single `<form>` as long as each button specifies its
  own `formAction`. Keeps the DOM to one `<form>`.
- **`decisionNote` is private** — the column is on `cohort_admissions` and
  never exposed to the applicant in any email or UI. Admins can write
  honest internal notes without worrying about leaking them.
- **`ACCEPTANCE_WINDOW_DAYS` as a constant, not env var** — the 14-day
  window is a policy decision, not a deployment-specific knob. Changing
  it requires a code change + redeploy, which is the right friction level.
- **`onConflictDoNothing` on the admission insert** — if the admin
  double-clicks Accept, only one admission row is written. The email
  still fires both times (idempotent for the user, since the email
  carries the same link).
- **`getApplication` reuse** — Phase 4.1's helper is the same query this
  page needs. Shared.

### Files — Application Detail + `decideApplication`

| Action | File                                                                   |
|--------|------------------------------------------------------------------------|
| NEW    | `src/lib/cohorts/constants.ts`                                         |
| MODIFY | `src/lib/cohorts/admin.ts` (append `decideApplication`)                |
| NEW    | `src/lib/cohorts/__tests__/admin.decide.test.ts`                       |
| NEW    | `src/app/admin/cohorts/applications/[id]/page.tsx`                     |
| NEW    | `src/app/admin/cohorts/applications/[id]/__tests__/page.test.tsx`      |

### Combined Files Summary — `cohort-enrollment-4.1`

| Action | File                                                                   |
|--------|------------------------------------------------------------------------|
| NEW    | `src/app/admin/layout.tsx`                                             |
| NEW    | `src/app/admin/__tests__/layout.test.tsx`                              |
| NEW    | `src/app/admin/cohorts/applications/page.tsx`                          |
| NEW    | `src/app/admin/cohorts/applications/__tests__/page.test.tsx`           |
| NEW    | `src/lib/cohorts/admin.ts`                                             |
| NEW    | `src/lib/cohorts/__tests__/admin.test.ts`                              |
| NEW    | `src/lib/cohorts/constants.ts`                                         |
| NEW    | `src/lib/cohorts/__tests__/admin.decide.test.ts`                       |
| NEW    | `src/app/admin/cohorts/applications/[id]/page.tsx`                     |
| NEW    | `src/app/admin/cohorts/applications/[id]/__tests__/page.test.tsx`      |

---

## Feature 4.2: Decision Email + HMAC Token + Checkout Route + Webhook Cohort Branch

**Complexity: L** — Merged from old 4.3 + 4.4. The two halves of the
Stripe flow: token sign + decision email + checkout redirect route (old
4.3) AND webhook cohort branch that verifies `metadata.applicationId`
set by the checkout redirect (old 4.4). Shared Stripe-metadata keys
(`metadata.kind: 'cohort'`, `metadata.applicationId`), shared env vars
(`COHORT_CHECKOUT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
Two sub-parts below: **#### Decision Email + HMAC Token + Checkout
Route** (old 4.3) and **#### Webhook Cohort Branch** (old 4.4).

#### Decision Email + HMAC Token + Checkout Route

(Old Feature 4.3 — Complexity M on its own.) Three coupled pieces: a
token utility, a decision
email renderer (accept / waitlist / decline variants), and a GET route
that verifies the token and redirects to Stripe Checkout.

### Problem — Decision Email + HMAC Token + Checkout Route

The accepted applicant needs a link that (a) proves they were accepted
(b) isn't guessable or forgeable and (c) maps to a specific application
so the Checkout Session metadata lets the webhook write the right
`cohort_enrollments` row. An HMAC-signed token is the right shape — small,
stateless, server-verifiable.

### Implementation — Decision Email + HMAC Token + Checkout Route

**NEW** `src/lib/cohorts/checkout-token.ts`:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

interface TokenPayload {
  applicationId: string;
  cohortSlug: string;
  expiresAt: number; // unix ms
}

function base64urlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(value: string): Buffer {
  const pad = 4 - (value.length % 4 || 4);
  const padded = value + '='.repeat(pad === 4 ? 0 : pad);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(body: string): string {
  const secret = process.env.COHORT_CHECKOUT_SECRET;
  if (!secret) throw new Error('COHORT_CHECKOUT_SECRET is not set');
  return base64urlEncode(createHmac('sha256', secret).update(body).digest());
}

export function signCheckoutToken(payload: TokenPayload): string {
  const body = base64urlEncode(Buffer.from(JSON.stringify(payload)));
  const signature = sign(body);
  return `${body}.${signature}`;
}

export type VerifyResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' };

export function verifyCheckoutToken(token: string): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [body, signature] = parts;

  const expected = sign(body);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    return { ok: false, reason: 'bad-signature' };
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(body).toString('utf8')) as TokenPayload;
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  if (
    typeof payload.applicationId !== 'string' ||
    typeof payload.cohortSlug !== 'string' ||
    typeof payload.expiresAt !== 'number'
  ) {
    return { ok: false, reason: 'malformed' };
  }

  if (Date.now() > payload.expiresAt) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, payload };
}
```

**NEW** `src/lib/cohorts/checkout.ts`:

```ts
import { stripe } from '@/lib/stripe/client';
import type { Cohort } from '@/content/schemas';
import { COHORT_METADATA_KEYS, COHORT_METADATA_KIND } from './constants';

interface CreateCohortCheckoutSessionInput {
  cohort: Cohort;
  applicationId: string;
  userId: string;
  userEmail: string;
}

export async function createCohortCheckoutSession(
  input: CreateCohortCheckoutSessionInput,
): Promise<string> {
  const { cohort, applicationId, userId, userEmail } = input;

  if (cohort.stripePriceId.includes('REPLACE_ME')) {
    throw new Error(
      `Cohort "${cohort.slug}" has a placeholder stripePriceId. Set a real ` +
        `price_xxx in src/content/cohorts/${cohort.slug}.mdx before accepting applicants.`,
    );
  }

  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: cohort.stripePriceId, quantity: 1 }],
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      [COHORT_METADATA_KEYS.kind]: COHORT_METADATA_KIND,
      [COHORT_METADATA_KEYS.cohortSlug]: cohort.slug,
      [COHORT_METADATA_KEYS.applicationId]: applicationId,
      [COHORT_METADATA_KEYS.userId]: userId,
    },
    success_url: `${baseUrl}/products/account/cohorts?enrolled=${encodeURIComponent(cohort.slug)}`,
    cancel_url: `${baseUrl}/cohorts/${cohort.slug}?canceled=1`,
    allow_promotion_codes: false,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return session.url;
}
```

**NEW** `src/lib/email/cohort-decision.ts`:

```ts
import { Resend } from 'resend';
import type { LoadedEntry } from '@/lib/content/loader';
import type { Cohort } from '@/content/schemas';
import type { ApplicationListRow } from '@/lib/cohorts/admin';
import { signCheckoutToken } from '@/lib/cohorts/checkout-token';
import type { AdminDecision } from '@/lib/cohorts/admin';

interface SendOptions {
  to: string;
  decision: AdminDecision;
  application: ApplicationListRow;
  cohort: LoadedEntry<Cohort>;
  acceptedUntil: Date | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(`${iso}T00:00:00Z`) : iso;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function acceptBody(params: {
  meta: Cohort;
  checkoutUrl: string;
  acceptedUntil: Date;
}): { text: string; html: string } {
  const { meta, checkoutUrl, acceptedUntil } = params;
  const text = [
    `You're in — ${meta.title}.`,
    '',
    'We reviewed your application and would love to have you in the cohort.',
    '',
    `Starts: ${formatDate(meta.startDate)}`,
    `Duration: ${meta.durationWeeks} weeks`,
    `Tuition: $${Math.round(meta.priceCents / 100)} ${meta.currency.toUpperCase()}`,
    '',
    `Confirm your seat by ${formatDate(acceptedUntil)}:`,
    checkoutUrl,
    '',
    'This link is single-use and expires at the date above. After that the',
    "seat is released and we'll reach out to someone on the waitlist.",
    '',
    '— Travis Gautier',
  ].join('\n');

  const html = `
<!doctype html>
<html lang="en">
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#faf8f3;color:#0a0a0a;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px">
    <h1 style="font-size:22px;margin:0 0 16px">You're in</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      We reviewed your application and would love to have you in
      <strong>${escapeHtml(meta.title)}</strong>.
    </p>
    <p style="font-size:14px;color:#475569;line-height:1.5;margin:0 0 24px">
      Starts ${formatDate(meta.startDate)} · ${meta.durationWeeks} weeks · $${Math.round(meta.priceCents / 100)} ${meta.currency.toUpperCase()}
    </p>
    <p style="margin:0 0 16px">
      <a href="${checkoutUrl}" style="display:inline-block;background:#c2410c;color:#faf8f3;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600">
        Confirm your seat
      </a>
    </p>
    <p style="font-size:13px;color:#475569;margin:0 0 16px">
      Confirm by <strong>${formatDate(acceptedUntil)}</strong>. This link is
      single-use and expires at the date above. After that the seat is
      released and we will reach out to someone on the waitlist.
    </p>
    <p style="font-size:12px;color:#475569;margin:24px 0 0">— Travis Gautier</p>
  </div>
</body>
</html>
  `.trim();

  return { text, html };
}

function waitlistBody(meta: Cohort): { text: string; html: string } {
  const text = [
    `Waitlisted — ${meta.title}.`,
    '',
    'Thanks for applying. We received more strong applications than we have',
    "seats for this run. You're on the waitlist and we'll reach out if a seat",
    'opens up before the cohort starts.',
    '',
    "If it doesn't work out for this run, we'll keep your application on file",
    'and invite you to apply again for the next cohort in this series.',
    '',
    '— Travis Gautier',
  ].join('\n');

  const html = `
<!doctype html>
<html lang="en"><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#faf8f3;color:#0a0a0a;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px">
    <h1 style="font-size:22px;margin:0 0 16px">Waitlisted</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      Thanks for applying to <strong>${escapeHtml(meta.title)}</strong>. We
      received more strong applications than we have seats for this run.
      You're on the waitlist and we will reach out if a seat opens up before
      the cohort starts.
    </p>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      If it does not work out for this run, we will keep your application on
      file and invite you to apply again for the next cohort in this series.
    </p>
    <p style="font-size:12px;color:#475569;margin:24px 0 0">— Travis Gautier</p>
  </div>
</body></html>
  `.trim();

  return { text, html };
}

function declineBody(meta: Cohort): { text: string; html: string } {
  const text = [
    `Update on your application — ${meta.title}.`,
    '',
    "Thanks for putting the work into a real application. We aren't able to",
    'offer you a seat in this cohort.',
    '',
    "We don't send detailed feedback, but the decision is specific to this",
    "cohort run's capacity and mix — not a judgment on your project. Future",
    'cohorts in this series remain open to you.',
    '',
    '— Travis Gautier',
  ].join('\n');

  const html = `
<!doctype html>
<html lang="en"><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#faf8f3;color:#0a0a0a;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px">
    <h1 style="font-size:22px;margin:0 0 16px">Thanks for applying</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      Thanks for putting the work into a real application for
      <strong>${escapeHtml(meta.title)}</strong>. We aren't able to offer you a
      seat in this cohort.
    </p>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      We don't send detailed feedback, but the decision is specific to this
      cohort run's capacity and mix — not a judgment on your project. Future
      cohorts in this series remain open to you.
    </p>
    <p style="font-size:12px;color:#475569;margin:24px 0 0">— Travis Gautier</p>
  </div>
</body></html>
  `.trim();

  return { text, html };
}

export async function sendCohortDecision({
  to,
  decision,
  application,
  cohort,
  acceptedUntil,
}: SendOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_COHORTS;
  const appUrl = process.env.AUTH_URL ?? 'https://travisgautier.com';
  if (!apiKey || !from) return;

  let subject: string;
  let body: { text: string; html: string };

  if (decision === 'accepted') {
    if (!acceptedUntil) {
      throw new Error('acceptedUntil is required for accepted decisions');
    }
    const token = signCheckoutToken({
      applicationId: application.id,
      cohortSlug: cohort.meta.slug,
      expiresAt: acceptedUntil.getTime(),
    });
    const checkoutUrl = `${appUrl}/cohorts/${cohort.meta.slug}/checkout?token=${encodeURIComponent(token)}`;
    subject = `You're in — ${cohort.meta.title}`;
    body = acceptBody({ meta: cohort.meta, checkoutUrl, acceptedUntil });
  } else if (decision === 'waitlisted') {
    subject = `Waitlisted — ${cohort.meta.title}`;
    body = waitlistBody(cohort.meta);
  } else {
    subject = `Update on your application — ${cohort.meta.title}`;
    body = declineBody(cohort.meta);
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({ from, to, subject, ...body });
}
```

**NEW** `src/app/cohorts/[slug]/checkout/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { verifyCheckoutToken } from '@/lib/cohorts/checkout-token';
import { getCohortBySlug } from '@/lib/content/cohorts';
import { getApplication } from '@/lib/cohorts/admin';
import { createCohortCheckoutSession } from '@/lib/cohorts/checkout';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.redirect(
      new URL(
        `/login?callbackUrl=${encodeURIComponent(`/cohorts/${slug}/checkout${request.nextUrl.search}`)}`,
        request.url,
      ),
    );
  }

  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return renderError('Missing token.', request);
  }

  const result = verifyCheckoutToken(token);
  if (!result.ok) {
    const reason =
      result.reason === 'expired'
        ? 'This acceptance link has expired. Contact us if you still want to join.'
        : 'This acceptance link is invalid. Contact us if you were expecting one.';
    return renderError(reason, request);
  }

  const { applicationId, cohortSlug } = result.payload;
  if (cohortSlug !== slug) {
    return renderError('This acceptance link does not match the cohort.', request);
  }

  const application = await getApplication(applicationId);
  if (!application) {
    return renderError('Application not found.', request);
  }
  if (application.userId !== session.user.id) {
    return renderError('This acceptance link belongs to a different account.', request);
  }

  const cohort = await getCohortBySlug(cohortSlug);
  if (!cohort) {
    return renderError('Cohort not found.', request);
  }

  const checkoutUrl = await createCohortCheckoutSession({
    cohort: cohort.meta,
    applicationId,
    userId: session.user.id,
    userEmail: session.user.email,
  });

  return NextResponse.redirect(checkoutUrl);
}

function renderError(message: string, request: NextRequest): NextResponse {
  const url = new URL('/cohorts', request.url);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}
```

### Tests — Decision Email + HMAC Token + Checkout Route (part of `cohort-enrollment-4.2` red phase)

**NEW** `src/lib/cohorts/__tests__/checkout-token.test.ts`:

- `signCheckoutToken(payload)` → `verifyCheckoutToken(token)` round-trips.
- Malformed token (no `.`) → `{ ok: false, reason: 'malformed' }`.
- Tampered body → `{ ok: false, reason: 'bad-signature' }`.
- Wrong secret → `{ ok: false, reason: 'bad-signature' }`.
- Expired `expiresAt` → `{ ok: false, reason: 'expired' }`.
- JSON-invalid body → `{ ok: false, reason: 'malformed' }`.
- Missing `applicationId` → `{ ok: false, reason: 'malformed' }`.
- `timingSafeEqual` used for signature check (asserted via crypto spy).
- Missing `COHORT_CHECKOUT_SECRET` env → throws on sign.

**NEW** `src/lib/cohorts/__tests__/checkout.test.ts`:

- Valid cohort + placeholder `stripePriceId` → throws "placeholder" error.
- Valid cohort + real `stripePriceId` → calls
  `stripe.checkout.sessions.create` with correct `price`, `customer_email`,
  `client_reference_id`, `metadata.kind = 'cohort'`, `metadata.cohortSlug`,
  `metadata.applicationId`, `metadata.userId`, `success_url`, `cancel_url`.
- Returns `session.url`.
- Stripe SDK returns no URL → throws.

**NEW** `src/lib/email/__tests__/cohort-decision.test.ts`:

- `accepted` decision with valid `acceptedUntil` → calls Resend with
  subject "You're in — {title}" and a body containing the signed
  checkout URL.
- `accepted` with null `acceptedUntil` → throws.
- `waitlisted` decision → calls Resend with "Waitlisted — {title}" subject
  and the waitlist body, no checkout link.
- `declined` decision → calls Resend with "Update on your application"
  subject and the decline body, no checkout link.
- Missing env vars → returns silently.

**NEW** `src/app/cohorts/[slug]/checkout/__tests__/route.test.ts`:

- No session → redirects to `/login?callbackUrl=...`.
- Missing `token` query param → redirects to `/cohorts?error=...`.
- Malformed token → redirects to `/cohorts?error=invalid`.
- Expired token → redirects with expiration error.
- Token cohortSlug mismatch → redirects with error.
- Token applicationId missing from DB → redirects with "not found".
- Application belongs to a different user → redirects with error.
- Placeholder `stripePriceId` on the cohort → error response (bubbles from
  `createCohortCheckoutSession`).
- Happy path → redirects to `stripe.checkout.sessions.create`'s returned
  URL.

### Design Decisions — Decision Email + HMAC Token + Checkout Route

- **HMAC-signed JSON token** — the cleanest stateless acceptance link.
  Alternatives considered: a DB-tracked single-use table (adds a write per
  generated link and a cleanup job), or a Stripe payment-link with the
  applicationId in metadata (forces re-creating a Payment Link per
  accepted applicant and loses the ability to enforce the expiration
  window client-side before hitting Stripe). HMAC is the lightest option.
- **`expiresAt` in the payload, not just the admission row** — doubles
  as a client-side expiration check + defense-in-depth against a
  replay-attack window where the admin changes their mind and updates
  the DB. The admission row's `acceptedUntil` is the final gate.
- **`timingSafeEqual` for signature comparison** — prevents timing
  side-channel attacks on the signature. Standard practice.
- **Base64url encoding** — the token appears in a URL query param; `+` /
  `/` / `=` would need to be URL-encoded, and the resulting token would
  be ugly. Base64url is the URL-safe variant.
- **Error responses redirect, don't render** — error pages under a
  semi-public URL path are harder to maintain than a redirect with a
  query string, and the `/cohorts?error=...` flow lets the catalog page
  render a user-friendly banner (deferred as a follow-up polish).
- **Second auth check on the route** — middleware catches the first one;
  the route body re-checks for the same reason the apply page does. The
  route also verifies that `application.userId === session.user.id` — a
  leaked token should only work for the applicant it was issued to.
- **`runtime = 'nodejs'`** — the Stripe SDK + `node:crypto` both need
  the Node runtime. Middleware stays Edge.
- **Decision email branches in one function** — three variants live close
  together so operators can review accept / waitlist / decline copy in a
  single file. Splitting into three files would hide the structural
  symmetry.

### Files — Decision Email + HMAC Token + Checkout Route

| Action | File                                                                  |
|--------|-----------------------------------------------------------------------|
| NEW    | `src/lib/cohorts/checkout-token.ts`                                   |
| NEW    | `src/lib/cohorts/__tests__/checkout-token.test.ts`                    |
| NEW    | `src/lib/cohorts/checkout.ts`                                         |
| NEW    | `src/lib/cohorts/__tests__/checkout.test.ts`                          |
| NEW    | `src/lib/email/cohort-decision.ts`                                    |
| NEW    | `src/lib/email/__tests__/cohort-decision.test.ts`                     |
| NEW    | `src/app/cohorts/[slug]/checkout/route.ts`                            |
| NEW    | `src/app/cohorts/[slug]/checkout/__tests__/route.test.ts`             |

---

#### Webhook Cohort Branch

(Old Feature 4.4 — Complexity M on its own.) MODIFY the existing webhook
route from sa 3.3 to inspect `metadata.kind` and branch between the
product-purchase path (existing) and the new cohort-enrollment path.

### Problem — Webhook Cohort Branch

sa's webhook writes to `purchases`. Cohort enrollment needs its own
`cohort_enrollments` row. Adding a second webhook route is redundant —
Stripe sends all events to one URL, and the signature verification /
retry / idempotency machinery is already in place. A branch inside the
existing handler is cleaner.

### Implementation — Webhook Cohort Branch

**MODIFY** `src/app/api/stripe/webhook/route.ts` — add the branch:

```ts
// (existing imports + webhookSecret + POST fn signature)
import { COHORT_METADATA_KEYS, COHORT_METADATA_KIND } from '@/lib/cohorts/constants';

// ... inside POST, AFTER signature verification + event type check:

if (event.type !== 'checkout.session.completed') {
  return NextResponse.json({ received: true });
}

const session = event.data.object as Stripe.Checkout.Session;
const metadata = session.metadata ?? {};

// --- Cohort enrollment branch ------------------------------------------
if (metadata[COHORT_METADATA_KEYS.kind] === COHORT_METADATA_KIND) {
  return handleCohortCheckout(session);
}

// --- Existing product-purchase branch (sa 3.3) -------------------------
// ... unchanged code ...
```

**NEW** helper `handleCohortCheckout` — same file, added below the POST
function:

```ts
async function handleCohortCheckout(
  session: Stripe.Checkout.Session,
): Promise<NextResponse> {
  const metadata = session.metadata ?? {};
  const userId = metadata[COHORT_METADATA_KEYS.userId];
  const cohortSlug = metadata[COHORT_METADATA_KEYS.cohortSlug];
  const applicationId = metadata[COHORT_METADATA_KEYS.applicationId];
  const stripeSessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
  const amountCents = session.amount_total ?? 0;
  const currency = session.currency ?? 'usd';

  if (!userId || !cohortSlug || !applicationId || !paymentIntentId) {
    return NextResponse.json(
      { error: 'Cohort checkout session missing required metadata' },
      { status: 400 },
    );
  }

  await db
    .insert(schema.cohortEnrollments)
    .values({
      applicationId,
      cohortSlug,
      userId,
      stripeSessionId,
      stripePaymentIntentId: paymentIntentId,
      amountCents,
      currency,
    })
    .onConflictDoNothing({
      target: schema.cohortEnrollments.stripeSessionId,
    });

  return NextResponse.json({ received: true });
}
```

### Tests — Webhook Cohort Branch (part of `cohort-enrollment-4.2` red phase)

**NEW** `src/app/api/stripe/webhook/__tests__/route.cohort.test.ts` (or
extend the existing sa webhook test file):

- `checkout.session.completed` event with `metadata.kind = 'cohort'` →
  inserts exactly one row into `cohort_enrollments` with all metadata
  fields mapped correctly.
- Replay of the same event → no duplicate row (UNIQUE on
  `stripe_session_id` + `onConflictDoNothing`).
- Missing `metadata.applicationId` → 400, no row inserted.
- Missing `metadata.cohortSlug` → 400.
- Missing `metadata.userId` → 400.
- Missing `payment_intent` → 400.
- `metadata.kind = 'product'` → does NOT insert into `cohort_enrollments`
  (uses the existing product-purchase branch; `purchases` row created).
- Missing `metadata.kind` → falls through to the product-purchase branch
  (maintains backwards compatibility with sa's existing pattern).
- `event.type = 'payment_intent.succeeded'` → 200 `{ received: true }`,
  no row inserted.
- Signature verification failures unchanged from sa's tests (this branch
  doesn't touch that path).

### Design Decisions — Webhook Cohort Branch

- **Single webhook route, branch on `metadata.kind`** — Stripe Checkout
  Sessions can carry arbitrary metadata. The `kind` discriminator is set
  by whichever code path created the session (`createCheckoutSession` for
  products, `createCohortCheckoutSession` for cohorts). Every new
  checkout type added later follows the same pattern.
- **`metadata.kind` defaults fall through to the product branch** — sa's
  existing `createCheckoutSession` does not set `metadata.kind`.
  Preserving backwards compatibility means the existing product flow
  works unchanged and this job doesn't have to touch sa's phase-3.2
  helper.
- **`handleCohortCheckout` returns 200 instead of erroring on conflict**
  — webhook replays are normal. `onConflictDoNothing` + return-200 is
  the right behaviour to stop Stripe from retrying forever.
- **No confirmation email fired from the webhook** — for cohorts, the
  acceptance email was the "you're in, click here to pay" email; after
  payment the user lands on `/products/account/cohorts` and sees the
  enrollment live. A separate "thanks for paying" email is
  over-communication. If it turns out to be missed in practice, add a
  receipt email later.
- **No `purchases` row for cohort checkouts** — deliberately keeping the
  two tables separate so `purchases` stays clean and `/products/account`
  renders products and cohorts from distinct sources.

### Files — Webhook Cohort Branch

| Action | File                                                               |
|--------|--------------------------------------------------------------------|
| MODIFY | `src/app/api/stripe/webhook/route.ts`                              |
| NEW    | `src/app/api/stripe/webhook/__tests__/route.cohort.test.ts`        |

### Combined Files Summary — `cohort-enrollment-4.2`

| Action | File                                                                  |
|--------|-----------------------------------------------------------------------|
| NEW    | `src/lib/cohorts/checkout-token.ts`                                   |
| NEW    | `src/lib/cohorts/__tests__/checkout-token.test.ts`                    |
| NEW    | `src/lib/cohorts/checkout.ts`                                         |
| NEW    | `src/lib/cohorts/__tests__/checkout.test.ts`                          |
| NEW    | `src/lib/email/cohort-decision.ts`                                    |
| NEW    | `src/lib/email/__tests__/cohort-decision.test.ts`                     |
| NEW    | `src/app/cohorts/[slug]/checkout/route.ts`                            |
| NEW    | `src/app/cohorts/[slug]/checkout/__tests__/route.test.ts`             |
| MODIFY | `src/app/api/stripe/webhook/route.ts`                                 |
| NEW    | `src/app/api/stripe/webhook/__tests__/route.cohort.test.ts`           |

---

## Feature 4.3: Account Cohorts View + SEO/Sitemap/Robots/Nav/Middleware Polish

**Complexity: M** — Merged from old 4.5 + 4.6. Final visible surface for
the cohort job. Student-facing view of enrollments + applications AND
the sitemap / robots / nav / middleware / JSON-LD polish that makes the
public cohort catalog indexable while keeping gated routes hidden. Both
are "finishing touches" shipped together so the cohort surface goes live
in a single commit. Two sub-parts below: **#### Account Cohorts View**
(old 4.5) and **#### SEO + Nav + Middleware Polish** (old 4.6).

#### Account Cohorts View

(Old Feature 4.5 — Complexity M on its own.) Student-facing view of
applications + enrollments on `/products/account/cohorts`, plus a "My
cohorts" card on the existing `/products/account` overview.

New page listing the signed-in user's applications and enrollments, plus
a "My cohorts" card added to the existing `/products/account` overview
from sa 4.1.

### Problem — Account Cohorts View

A paying student needs a place to see their enrollment. An applicant
with a pending decision needs a place to check their status. Both live
under `/products/account` (the existing authenticated surface), which
Phase 3.2 already redirects applicants toward with the "Check your
application status" link.

### Implementation — Account Cohorts View

**NEW** `src/app/products/account/cohorts/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Container } from '@/components/site/Container';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getAllCohorts } from '@/lib/content/cohorts';
import { CohortList } from '@/components/account/CohortList';

export const metadata: Metadata = {
  title: 'Your cohorts',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ enrolled?: string }>;
};

export default async function AccountCohortsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Fproducts%2Faccount%2Fcohorts');
  }

  const { enrolled } = await searchParams;

  const [applications, enrollments, cohorts] = await Promise.all([
    db
      .select()
      .from(schema.cohortApplications)
      .where(eq(schema.cohortApplications.userId, session.user.id))
      .orderBy(desc(schema.cohortApplications.submittedAt)),
    db
      .select()
      .from(schema.cohortEnrollments)
      .where(eq(schema.cohortEnrollments.userId, session.user.id))
      .orderBy(desc(schema.cohortEnrollments.paidAt)),
    getAllCohorts(),
  ]);

  const cohortsBySlug = new Map(cohorts.map((c) => [c.meta.slug, c.meta]));

  return (
    <Container as="section" className="py-16">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted">Account</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Your cohorts
        </h1>
        <p className="mt-2 text-sm text-muted">
          <Link href="/products/account" className="text-link underline-offset-2 hover:underline">
            ← Back to account overview
          </Link>
        </p>
      </header>

      {enrolled ? (
        <div
          role="status"
          className="mt-8 rounded-md border border-accent/40 bg-accent/5 px-4 py-3 text-sm"
        >
          Payment received. Welcome to{' '}
          <strong>{cohortsBySlug.get(enrolled)?.title ?? enrolled}</strong>.
          Logistics details will land in your inbox shortly.
        </div>
      ) : null}

      <div className="mt-12">
        <CohortList
          applications={applications}
          enrollments={enrollments}
          cohortsBySlug={cohortsBySlug}
        />
      </div>
    </Container>
  );
}
```

**NEW** `src/components/account/CohortList.tsx`:

```tsx
import Link from 'next/link';
import type { Cohort } from '@/content/schemas';
import type {
  CohortApplicationRow,
  CohortEnrollmentRow,
} from '@/db/schema';

interface CohortListProps {
  applications: CohortApplicationRow[];
  enrollments: CohortEnrollmentRow[];
  cohortsBySlug: Map<string, Cohort>;
}

function formatDate(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(`${iso}T00:00:00Z`) : iso;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function CohortList({
  applications,
  enrollments,
  cohortsBySlug,
}: CohortListProps) {
  const enrolledApplicationIds = new Set(enrollments.map((e) => e.applicationId));

  // Filter applications to those that have NOT been paid yet — paid
  // applications surface under the enrollments section instead.
  const openApplications = applications.filter(
    (app) => !enrolledApplicationIds.has(app.id),
  );

  if (openApplications.length === 0 && enrollments.length === 0) {
    return (
      <div className="rounded-md border border-mist p-6 text-sm text-muted">
        <p>You haven't applied to a cohort yet.</p>
        <p className="mt-2">
          Browse{' '}
          <Link href="/cohorts" className="text-link underline-offset-2 hover:underline">
            open cohorts
          </Link>{' '}
          to see which ones are accepting applications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {enrollments.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold">Enrolled</h2>
          <ul className="mt-6 divide-y divide-mist">
            {enrollments.map((e) => {
              const cohort = cohortsBySlug.get(e.cohortSlug);
              return (
                <li key={e.id} className="py-4">
                  <p className="font-semibold">
                    {cohort?.title ?? e.cohortSlug}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Paid {formatDate(e.paidAt)} · $
                    {Math.round(e.amountCents / 100)}{' '}
                    {e.currency.toUpperCase()}
                  </p>
                  {cohort ? (
                    <p className="mt-1 text-xs text-muted">
                      Starts {formatDate(cohort.startDate)} ·{' '}
                      {cohort.durationWeeks} weeks
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {openApplications.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold">Applications</h2>
          <ul className="mt-6 divide-y divide-mist">
            {openApplications.map((app) => {
              const cohort = cohortsBySlug.get(app.cohortSlug);
              return (
                <li key={app.id} className="py-4">
                  <p className="font-semibold">
                    {cohort?.title ?? app.cohortSlug}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Submitted {formatDate(app.submittedAt)} · Decision:{' '}
                    <strong>{app.decision}</strong>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
```

**MODIFY** `src/app/products/account/page.tsx` — add a "My cohorts" card
above the purchases list:

```tsx
// (existing imports)
import { desc, eq } from 'drizzle-orm';
// ... plus
// load cohort applications + enrollments in parallel with purchases

const [purchases, products, cohortApplications, cohortEnrollments, cohorts] =
  await Promise.all([
    // existing purchases + products queries
    db
      .select()
      .from(schema.cohortApplications)
      .where(eq(schema.cohortApplications.userId, session.user.id)),
    db
      .select()
      .from(schema.cohortEnrollments)
      .where(eq(schema.cohortEnrollments.userId, session.user.id)),
    getAllCohorts(),
  ]);

const cohortsBySlug = new Map(cohorts.map((c) => [c.meta.slug, c.meta]));
const hasCohortActivity =
  cohortApplications.length > 0 || cohortEnrollments.length > 0;
```

And in the JSX, above the `<h2>Purchases</h2>` block:

```tsx
{hasCohortActivity ? (
  <div className="mt-12">
    <div className="flex items-center justify-between">
      <h2 className="font-display text-xl font-semibold">My cohorts</h2>
      <Link
        href="/products/account/cohorts"
        className="text-sm text-link underline-offset-2 hover:underline"
      >
        View all
      </Link>
    </div>
    <div className="mt-6">
      <CohortList
        applications={cohortApplications}
        enrollments={cohortEnrollments}
        cohortsBySlug={cohortsBySlug}
      />
    </div>
  </div>
) : null}
```

### Tests — Account Cohorts View (part of `cohort-enrollment-4.3` red phase)

**NEW** `src/app/products/account/cohorts/__tests__/page.test.tsx`:

- Unauthenticated → redirects to `/login?callbackUrl=...`.
- Authenticated user with no cohort activity → renders "haven't applied"
  empty state with link to `/cohorts`.
- User with one pending application → renders the "Applications" section
  with that application.
- User with one enrollment → renders the "Enrolled" section.
- User with one application that has an enrollment → that application
  does NOT appear in the "Applications" section (filtered out because
  `enrolledApplicationIds` includes its id).
- `?enrolled=slug` query param → renders the post-payment success banner.
- `metadata.robots` is `{ index: false, follow: false }`.

**NEW** `src/app/products/account/__tests__/page.cohort.test.tsx`:

- User with no cohort activity → "My cohorts" card not rendered.
- User with at least one application → "My cohorts" card rendered with a
  "View all" link.
- "My cohorts" card renders above the "Purchases" section.

### Design Decisions — Account Cohorts View

- **Paid applications filtered out of "Applications" section** — a user
  who has already paid shouldn't see their application still listed as
  pending. The enrollment section is their correct home.
- **`CohortList` as a shared component** — used by both the overview
  card (with all data) and the dedicated cohorts page. Same rendering
  logic means the two surfaces never drift.
- **"My cohorts" card only renders when there's activity** — keeps the
  overview clean for users who haven't engaged with cohorts yet. The
  purchases list still shows even when empty for product buyers.
- **Account cohorts page has its own route** — lets the user deep-link
  directly to cohort activity without scrolling past their purchases.
- **`enrolled` query-param banner** — matches sa's `?purchased=` banner
  pattern on the overview page. Same shape, same class names, different
  copy.
- **No cohort-specific navigation in the account header** — the "View
  all" link on the card is the path. A tab-bar with 3+ tabs is
  over-engineering for the current surface area (cohorts + purchases).

### Files — Account Cohorts View

| Action | File                                                              |
|--------|-------------------------------------------------------------------|
| NEW    | `src/app/products/account/cohorts/page.tsx`                       |
| NEW    | `src/app/products/account/cohorts/__tests__/page.test.tsx`        |
| NEW    | `src/components/account/CohortList.tsx`                           |
| MODIFY | `src/app/products/account/page.tsx`                               |
| NEW    | `src/app/products/account/__tests__/page.cohort.test.tsx`         |

---

#### SEO + Nav + Middleware Polish

(Old Feature 4.6 — Complexity S on its own.) Wire `/cohorts` into the
nav, the sitemap, the robots.txt, and finish the middleware matcher
touch-up. Add `Course` + `Offer` JSON-LD to the cohort detail page.
Final a11y + Lighthouse pass.

### Problem — SEO + Nav + Middleware Polish

Phase 1 shipped `/cohorts` and `/cohorts/[slug]` but they're not in the
nav or the sitemap yet — wf 4.4's sitemap doesn't know about cohorts and
the header doesn't have a "Cohorts" link. Phase 3 extended the middleware
matcher for gated routes, but the public `/cohorts` surface needs to be
explicitly listed in the sitemap + llms.txt + robots.txt. Every gated
cohort subroute (`/apply`, `/checkout`, `/admin/*`, `/products/account/cohorts`)
has to be excluded from the sitemap and disallowed in robots.

### Implementation — SEO + Nav + Middleware Polish

**MODIFY** `src/app/sitemap.ts` — add cohort URLs:

```ts
// Inside the sitemap() function, after episodes + cases + products:
const cohorts = await getAllCohorts();

return [
  // ... existing entries
  {
    url: `${baseUrl}/cohorts`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  },
  ...cohorts.map((entry) => ({
    url: `${baseUrl}/cohorts/${entry.meta.slug}`,
    lastModified: entry.meta.publishedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  })),
];
```

Never included: `/cohorts/*/apply`, `/cohorts/*/checkout`, `/admin/*`,
`/products/account/cohorts` — they are gated and have `robots: index: false`
metadata set on the page level.

**MODIFY** `src/app/robots.ts` — disallow gated subroutes:

```ts
return {
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: [
      // existing
      '/products/account',
      '/products/downloads',
      '/login',
      // added by cohort-enrollment 4.6
      '/cohorts/*/apply',
      '/cohorts/*/checkout',
      '/admin',
      '/products/account/cohorts',
    ],
  },
  sitemap: `${baseUrl}/sitemap.xml`,
};
```

**MODIFY** `src/components/site/Header.tsx` — insert `/cohorts` into
`NAV_ITEMS`:

```ts
export const NAV_ITEMS = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases', label: 'Cases' },
  { href: '/cohorts', label: 'Cohorts' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
] as const;
```

**MODIFY** `src/app/cohorts/[slug]/page.tsx` — add JSON-LD for `Course` +
`Offer`:

```tsx
// Inside the default export, before the closing </Container>:

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: meta.title,
  description: meta.summary,
  provider: {
    '@type': 'Organization',
    name: 'Travis Gautier',
    url: 'https://travisgautier.com',
  },
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'Online',
    startDate: meta.startDate,
    endDate: meta.endDate,
    courseWorkload: `PT${meta.commitmentHoursPerWeek}H`,
  },
  offers: {
    '@type': 'Offer',
    price: (meta.priceCents / 100).toFixed(2),
    priceCurrency: meta.currency.toUpperCase(),
    availability:
      meta.status === 'open'
        ? 'https://schema.org/InStock'
        : meta.status === 'announced'
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/SoldOut',
  },
};

// before return:
return (
  <Container as="main" className="py-16">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    {/* ... existing body */}
  </Container>
);
```

**MODIFY** `public/llms.txt` — add a brief `/cohorts` mention:

```
## /cohorts
Application-required live cohort programs. Public catalog of upcoming and
past cohorts. Application and payment flows are gated behind magic-link auth
at /cohorts/{slug}/apply and /cohorts/{slug}/checkout respectively.
```

### Tests — SEO + Nav + Middleware Polish (part of `cohort-enrollment-4.3` red phase)

**MODIFY** `src/__tests__/sitemap.test.ts` (or create if not existing):

- Sitemap contains `/cohorts`.
- Sitemap contains one entry per cohort at `/cohorts/{slug}`.
- Sitemap does NOT contain any `/cohorts/*/apply` URLs.
- Sitemap does NOT contain any `/cohorts/*/checkout` URLs.
- Sitemap does NOT contain any `/admin/*` URLs.
- Sitemap does NOT contain `/products/account/cohorts`.

**MODIFY** `src/__tests__/robots.test.ts`:

- Robots disallow list includes `/cohorts/*/apply`, `/cohorts/*/checkout`,
  `/admin`, `/products/account/cohorts`.

**MODIFY** `src/app/cohorts/[slug]/__tests__/page.test.tsx` (extend Phase 1.5 tests):

- Page renders a `<script type="application/ld+json">` tag.
- JSON-LD `@type` is `Course`.
- `offers.availability` reflects cohort status (`PreOrder` for `announced`,
  `InStock` for `open`, `SoldOut` for `closed`/`enrolled`/`shipped`).

**MODIFY** `src/components/site/__tests__/Header.test.tsx`:

- `NAV_ITEMS` contains `{ href: '/cohorts', label: 'Cohorts' }`.
- Link renders with the correct label in the rendered header.

### Design Decisions — SEO + Nav + Middleware Polish

- **Add nav link last, after every cohort surface exists** — adding
  `/cohorts` to the nav in Phase 1 would surface a dead-end page (apply +
  waitlist both placeholders). Phase 4.6 is the first moment the nav
  link can point somewhere that's fully wired.
- **`Course` JSON-LD** — Google rewards schema.org `Course` structured
  data with rich snippets (including start date, provider, price). The
  cohort page is the closest to a traditional course page this site has,
  so the schema fits.
- **`availability` derived from status** — `SoldOut` on `closed` /
  `enrolled` / `shipped` prevents the cohort from looking like a buyable
  product to a crawler when the enrollment form is unavailable.
- **Sitemap `changeFrequency: weekly`** — cohorts don't change daily but
  their status will change weekly as announcements, openings, closings
  happen. Weekly is the right hint for the crawler.
- **llms.txt update is descriptive, not exhaustive** — the file is a
  declaration to AI crawlers of what lives where. A one-paragraph mention
  is enough.
- **Middleware matcher unchanged in this feature** — Phase 3.2 already
  extended the matcher for `/cohorts/:slug/apply`, `/cohorts/:slug/checkout`,
  `/admin/:path*`, `/products/account/cohorts`. Phase 4.6 verifies the
  final matcher covers everything but adds no new entries.
- **Final a11y + Lighthouse sweep** — run Lighthouse against `/cohorts`,
  `/cohorts/ai-delivery-2026-q3`, `/cohorts/workflow-mastery-2026-q4/apply`
  (signed in), `/admin/cohorts/applications` (signed in as admin), and
  `/products/account/cohorts`. Target a11y ≥ 95, perf ≥ 90, SEO ≥ 95,
  best practices ≥ 90. Any failures get fixed inline (contrast, tab
  order, aria labels). Keyboard-only walkthrough of the full
  waitlist → apply → accept → pay → account flow.

### Files — SEO + Nav + Middleware Polish

| Action | File                                                           |
|--------|----------------------------------------------------------------|
| MODIFY | `src/app/sitemap.ts`                                           |
| MODIFY | `src/app/robots.ts`                                            |
| MODIFY | `src/components/site/Header.tsx`                               |
| MODIFY | `src/app/cohorts/[slug]/page.tsx` (append JSON-LD)             |
| MODIFY | `public/llms.txt`                                              |
| MODIFY | `src/__tests__/sitemap.test.ts`                                |
| MODIFY | `src/__tests__/robots.test.ts`                                 |
| MODIFY | `src/app/cohorts/[slug]/__tests__/page.test.tsx`               |
| MODIFY | `src/components/site/__tests__/Header.test.tsx`                |

### Combined Files Summary — `cohort-enrollment-4.3`

| Action | File                                                           |
|--------|----------------------------------------------------------------|
| NEW    | `src/app/products/account/cohorts/page.tsx`                    |
| NEW    | `src/app/products/account/cohorts/__tests__/page.test.tsx`     |
| NEW    | `src/components/account/CohortList.tsx`                        |
| MODIFY | `src/app/products/account/page.tsx`                            |
| NEW    | `src/app/products/account/__tests__/page.cohort.test.tsx`      |
| MODIFY | `src/app/sitemap.ts`                                           |
| MODIFY | `src/app/robots.ts`                                            |
| MODIFY | `src/components/site/Header.tsx`                               |
| MODIFY | `src/app/cohorts/[slug]/page.tsx` (append JSON-LD)             |
| MODIFY | `public/llms.txt`                                              |
| MODIFY | `src/__tests__/sitemap.test.ts`                                |
| MODIFY | `src/__tests__/robots.test.ts`                                 |
| MODIFY | `src/app/cohorts/[slug]/__tests__/page.test.tsx`               |
| MODIFY | `src/components/site/__tests__/Header.test.tsx`                |
