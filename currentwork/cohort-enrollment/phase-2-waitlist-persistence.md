# Phase 2: Waitlist + Persistence

**Total Size: M + M** (10 sections after condense; old 2.2 + 2.3 merged into new 2.2)
**Prerequisites: Phase 1 complete (catalog + seed cohorts loading cleanly). `storefront-auth` Phase 2.1 shipped (Drizzle + Postgres + `users` table + `docker-compose.yml` + `drizzle-kit` scripts in `package.json`). `RESEND_API_KEY` in `.env.local` (from wf 4.1).**
**New Tables: `cohort_waitlist`, `cohort_applications`, `cohort_admissions`, `cohort_enrollments`**
**New Files: `src/db/migrations/0002_cohort_enrollment.sql` (generated), `src/components/cohorts/{WaitlistForm,actions}.ts`, `src/lib/email/cohort-waitlist-confirmation.ts`, plus tests**

Phase 2 gives Phase 1's `announced` cohort detail page a working waitlist
form and lays down every DB table the rest of the job will write to. The
three other tables (`cohort_applications`, `cohort_admissions`,
`cohort_enrollments`) are declared here so downstream phases don't bounce
back for migration edits — they're inert in Phase 2 and hydrated in Phases
3 and 4. By the end of this phase, a visitor on `/cohorts/ai-delivery-2026-q3`
can submit their email, land in a `cohort_waitlist` row + the dedicated
Resend audience, and receive a confirmation email.

---

## Feature 2.1: Drizzle Migration + Four New Tables

**Complexity: M** — Append four Drizzle table builders to `src/db/schema.ts`,
generate the migration via `drizzle-kit`, verify it applies cleanly, and
ship a schema test that covers inserts + constraints + cascades.

### Problem

The job needs persistence for four distinct records: waitlist emails,
submitted applications, admin decisions, and paid enrollments. These are
all cohort-specific and live independently of sa's `purchases` table —
mixing a cohort enrollment into `purchases` would force both jobs to
co-evolve every schema change, and the `/products/account` vs
`/products/account/cohorts` pages would need a join that could simply be
two separate queries. Declaring all four tables in one migration keeps the
migration graph simple (one file, one atomic change) and lets Phase 3 and
Phase 4 focus on behaviour instead of schema churn.

### Implementation

**MODIFY** `src/db/schema.ts` — append cohort tables + relations + type
exports, reusing the existing imports from sa 2.1:

```ts
// (existing imports + tables: users, sessions, verificationTokens, purchases)

import {
  // add to existing pg-core import if not already present
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { CONTENT_PILLARS } from '@/content/schemas/content-pillar';
import { COHORT_STATUSES } from '@/content/schemas/cohort';
import { APPLICATION_COMMITMENT_LEVELS } from '@/content/schemas/cohort-application';

// --- cohort_waitlist -----------------------------------------------------
export const cohortWaitlist = pgTable(
  'cohort_waitlist',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: text('email').notNull(),
    cohortSlug: text('cohort_slug').notNull(),
    sourceTag: text('source_tag'),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailCohortUnique: uniqueIndex('cohort_waitlist_email_cohort_idx').on(
      table.email,
      table.cohortSlug,
    ),
    cohortSlugIdx: index('cohort_waitlist_cohort_slug_idx').on(table.cohortSlug),
  }),
);

// --- cohort_applications -------------------------------------------------
export const cohortApplications = pgTable(
  'cohort_applications',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    cohortSlug: text('cohort_slug').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    background: text('background').notNull(),
    goals: text('goals').notNull(),
    commitmentLevel: text('commitment_level').notNull(),
    commitmentHours: integer('commitment_hours').notNull(),
    timezone: text('timezone').notNull(),
    pillarInterest: text('pillar_interest').notNull(),
    referralSource: text('referral_source'),
    waitlistId: uuid('waitlist_id').references(() => cohortWaitlist.id, {
      onDelete: 'set null',
    }),
    decision: text('decision').notNull().default('pending'),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    cohortUserUnique: uniqueIndex('cohort_applications_cohort_user_idx').on(
      table.cohortSlug,
      table.userId,
    ),
    cohortDecisionIdx: index('cohort_applications_cohort_decision_idx').on(
      table.cohortSlug,
      table.decision,
    ),
    userIdx: index('cohort_applications_user_idx').on(table.userId),
    commitmentLevelCheck: check(
      'cohort_applications_commitment_level_check',
      sql`${table.commitmentLevel} IN (${sql.join(
        APPLICATION_COMMITMENT_LEVELS.map((v) => sql`${v}`),
        sql`, `,
      )})`,
    ),
    pillarInterestCheck: check(
      'cohort_applications_pillar_interest_check',
      sql`${table.pillarInterest} IN (${sql.join(
        CONTENT_PILLARS.map((v) => sql`${v}`),
        sql`, `,
      )})`,
    ),
    decisionCheck: check(
      'cohort_applications_decision_check',
      sql`${table.decision} IN ('pending','accepted','waitlisted','declined')`,
    ),
  }),
);

// --- cohort_admissions ---------------------------------------------------
export const cohortAdmissions = pgTable(
  'cohort_admissions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    applicationId: uuid('application_id')
      .notNull()
      .unique()
      .references(() => cohortApplications.id, { onDelete: 'cascade' }),
    decidedBy: text('decided_by').notNull(),
    decision: text('decision').notNull(),
    decisionNote: text('decision_note'),
    acceptedUntil: timestamp('accepted_until', { withTimezone: true }),
    decidedAt: timestamp('decided_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    decisionCheck: check(
      'cohort_admissions_decision_check',
      sql`${table.decision} IN ('accepted','waitlisted','declined')`,
    ),
  }),
);

// --- cohort_enrollments --------------------------------------------------
export const cohortEnrollments = pgTable(
  'cohort_enrollments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    applicationId: uuid('application_id')
      .notNull()
      .unique()
      .references(() => cohortApplications.id, { onDelete: 'cascade' }),
    cohortSlug: text('cohort_slug').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripeSessionId: text('stripe_session_id').notNull().unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('cohort_enrollments_user_idx').on(table.userId),
  }),
);

// --- type exports --------------------------------------------------------
export type CohortWaitlistRow = typeof cohortWaitlist.$inferSelect;
export type NewCohortWaitlistRow = typeof cohortWaitlist.$inferInsert;
export type CohortApplicationRow = typeof cohortApplications.$inferSelect;
export type NewCohortApplicationRow = typeof cohortApplications.$inferInsert;
export type CohortAdmissionRow = typeof cohortAdmissions.$inferSelect;
export type NewCohortAdmissionRow = typeof cohortAdmissions.$inferInsert;
export type CohortEnrollmentRow = typeof cohortEnrollments.$inferSelect;
export type NewCohortEnrollmentRow = typeof cohortEnrollments.$inferInsert;
```

**Generate the migration:**

```bash
npm run db:generate
```

This creates `src/db/migrations/0002_cohort_enrollment.sql` (the number
will shift to `0003_...` automatically if `email-funnel` already shipped
`0001_email_funnel.sql` — accept whatever number `drizzle-kit` assigns).
Commit the file as-is; do NOT hand-edit it.

**Apply the migration locally:**

```bash
docker compose up -d postgres
npm run db:migrate
```

### Tests (red phase of section `cohort-enrollment-2.1`)

**NEW** `src/db/__tests__/cohort-tables.test.ts`:

Uses a real Drizzle-over-Postgres test database (same pattern as sa's
schema tests). Each `describe` block sets up a fresh user via
`db.insert(schema.users)` and tears down in `afterEach`.

- **`cohort_waitlist`**:
  - Insert one row → row round-trips with default `id` + `createdAt`.
  - Insert duplicate `(email, cohort_slug)` → throws unique-violation error.
  - Inserting with a non-existent `user_id` fails fk constraint.
  - Deleting the parent user sets `user_id` to `null` (on delete set null).
- **`cohort_applications`**:
  - Insert with valid `commitmentLevel` from `APPLICATION_COMMITMENT_LEVELS`
    and valid `pillarInterest` from `CONTENT_PILLARS` → passes.
  - `commitmentLevel = 'bogus'` → check-constraint violation.
  - `pillarInterest = 'marketing'` → check-constraint violation.
  - `decision = 'foo'` → check-constraint violation.
  - Default `decision` is `'pending'`.
  - Duplicate `(cohort_slug, user_id)` → unique-violation.
  - Deleting the parent user cascades (rows removed).
  - Setting `waitlist_id` to a real `cohort_waitlist.id` then deleting the
    waitlist row → application row's `waitlist_id` becomes `null`.
- **`cohort_admissions`**:
  - Insert with a valid `applicationId` → passes, default `decidedAt` set.
  - Duplicate `applicationId` → unique violation (one admission per app).
  - `decision = 'pending'` → check-constraint violation (pending is only a
    valid *application* decision, not an admission decision).
  - Deleting the parent application cascades.
- **`cohort_enrollments`**:
  - Insert with a valid `applicationId` → passes, default `currency` is `'usd'`.
  - Duplicate `stripe_session_id` → unique violation.
  - Deleting the parent application cascades.
  - Deleting the parent user cascades.

### Design Decisions

- **One migration, four tables** — Drizzle handles atomic multi-table
  creation per migration file. Splitting them would complicate rollback
  and make Phase 3/4 wait on multiple migration applies. The four tables
  are tightly coupled (admission → application → user; enrollment →
  application → user) so they belong in one atomic change.
- **CHECK constraints mirror TS tuples via `sql.join`** — the tuples in
  `@/content/schemas` are the single source of truth. Importing them into
  the schema file and injecting them into `check(...)` via `sql.join`
  keeps the DB layer honest: adding a value to the tuple without
  regenerating the migration fails loudly at the next insert. Rebuilding
  the migration when a tuple changes is an acceptable migration cost for
  the safety it buys.
- **`cohort_admissions.decision` excludes `'pending'`** — an admission row
  only exists once a decision has been made. `cohort_applications.decision`
  starts as `'pending'`; when an admin acts, a new `cohort_admissions` row
  is inserted *and* the parent application's `decision` is updated to
  match. Two denormalized copies of the decision are acceptable here
  because the application row is the one queried by the dashboard + the
  account view, and joining the admission table on every read is wasteful.
- **`cohort_enrollments.applicationId` UNIQUE** — a user can only enrol in
  a cohort once per application. If they decline and re-apply to a future
  cohort, that's a different application, different enrollment row.
- **`acceptedUntil` nullable** — only `accepted` admissions set this field.
  `waitlisted` and `declined` leave it null. The checkout route rejects
  tokens whose admission row has `acceptedUntil IS NULL` or is in the past.
- **No `updated_at` columns** — these tables are effectively append-only
  (applications get one decision update; admissions + enrollments are
  write-once). Skipping `updated_at` keeps the migration minimal.
- **`userId` NOT NULL on applications/admissions/enrollments** — chosen
  option: magic-link sign-in required before applying, so every application
  has a known `users.id`. Waitlist is the only table where `userId` is
  nullable (anonymous emails can waitlist).
- **Cascade deletes** — deleting a user should wipe their applications,
  admissions, and enrollments. Auditors sometimes want soft deletes here;
  this job ships hard deletes and flags soft-delete as a future job if
  compliance ever needs it.

### Files

| Action | File                                                      |
|--------|-----------------------------------------------------------|
| MODIFY | `src/db/schema.ts`                                         |
| NEW    | `src/db/migrations/0002_cohort_enrollment.sql` (generated) |
| NEW    | `src/db/migrations/meta/0002_snapshot.json` (generated)    |
| NEW    | `src/db/__tests__/cohort-tables.test.ts`                   |

---

## Feature 2.2: Waitlist Form + `submitWaitlist` Server Action + Confirmation Email

**Complexity: M** — Merged from old 2.2 + 2.3. Renders the waitlist form on
the `/cohorts/[slug]` detail page when `cohort.status === 'announced'`,
writes a `cohort_waitlist` row, adds the email to the cohort-specific
Resend audience, sends the confirmation email, and documents the two new
env vars. The form + server action + email helper are merged because the
submit action calls `sendCohortWaitlistConfirmation` directly; they're the
same inseparable slice (same merge as shipped `wf-4.1` email capture +
Resend send). Two sub-parts below:
**#### Form + Server Action** (old 2.2) and **#### Confirmation Email + Env**
(old 2.3).

#### Form + Server Action

### Problem

Phase 1's detail page has a placeholder CTA slot for `announced` cohorts.
Phase 2.2 hydrates that slot with a real form. The form has to dedupe
(no duplicate waitlist rows per email per cohort), survive JS-disabled
browsers (server action pattern, `useActionState` + progressive
enhancement), and tag the Resend contact with the cohort slug so the
operator can segment the audience by which cohort the signup came from.

### Implementation

**NEW** `src/components/cohorts/actions.ts`:

```ts
'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';
import { db, schema } from '@/db/client';
import { auth } from '@/auth';
import { getCohortBySlug } from '@/lib/content/cohorts';
import { sendCohortWaitlistConfirmation } from '@/lib/email/cohort-waitlist-confirmation';

const WaitlistInputSchema = z.object({
  email: z.string().email().max(254),
  cohortSlug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'invalid slug'),
  sourceTag: z.string().max(128).optional(),
});

export type WaitlistState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export async function submitWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = WaitlistInputSchema.safeParse({
    email: formData.get('email'),
    cohortSlug: formData.get('cohortSlug'),
    sourceTag: formData.get('sourceTag') ?? undefined,
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Please enter a valid email.' };
  }

  const { email, cohortSlug, sourceTag } = parsed.data;

  // Verify the cohort exists (defense against slug tampering).
  const cohort = await getCohortBySlug(cohortSlug);
  if (!cohort) {
    return { status: 'error', message: 'Cohort not found.' };
  }

  // Link to the signed-in user if there is one; anonymous waitlisters are fine.
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Idempotent upsert: UNIQUE (email, cohort_slug) silently no-ops on conflict.
  const inserted = await db
    .insert(schema.cohortWaitlist)
    .values({ email, cohortSlug, sourceTag: sourceTag ?? null, userId })
    .onConflictDoNothing({
      target: [schema.cohortWaitlist.email, schema.cohortWaitlist.cohortSlug],
    })
    .returning();

  if (inserted.length === 0) {
    return {
      status: 'success',
      message: "You're already on the waitlist for this cohort.",
    };
  }

  // Resend audience add — kept best-effort so a Resend outage doesn't swallow
  // the DB row. The operator can resync from the table if needed.
  const audienceId = process.env.RESEND_COHORT_WAITLIST_AUDIENCE_ID;
  const apiKey = process.env.RESEND_API_KEY;
  if (audienceId && apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.contacts.create({
        audienceId,
        email,
        unsubscribed: false,
      });
    } catch (err) {
      // Swallow — row is already in the DB, operator can resync.
    }
  }

  // Confirmation email — also best-effort for the same reason.
  try {
    await sendCohortWaitlistConfirmation({ to: email, cohort });
  } catch (err) {
    // Swallow.
  }

  return {
    status: 'success',
    message: "You're on the waitlist. We'll email you when applications open.",
  };
}
```

**NEW** `src/components/cohorts/WaitlistForm.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { submitWaitlist, type WaitlistState } from './actions';

const INITIAL: WaitlistState = { status: 'idle' };

interface WaitlistFormProps {
  cohortSlug: string;
  sourceTag?: string;
}

export function WaitlistForm({ cohortSlug, sourceTag }: WaitlistFormProps) {
  const [state, formAction, isPending] = useActionState(submitWaitlist, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <input type="hidden" name="cohortSlug" value={cohortSlug} />
      {sourceTag ? <input type="hidden" name="sourceTag" value={sourceTag} /> : null}
      <label className="sr-only" htmlFor={`waitlist-email-${cohortSlug}`}>
        Email address
      </label>
      <input
        id={`waitlist-email-${cohortSlug}`}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        disabled={isPending}
        className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:max-w-xs"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-parchment hover:bg-accent/90 disabled:opacity-60"
      >
        {isPending ? 'Joining…' : 'Join the waitlist'}
      </button>
      {state.status !== 'idle' ? (
        <p
          role="status"
          className={`text-sm sm:w-full ${
            state.status === 'success' ? 'text-foreground' : 'text-red-600'
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
```

**MODIFY** `src/app/cohorts/[slug]/page.tsx` — replace the `announced`
placeholder with `<WaitlistForm>`:

```tsx
// (imports at top — add WaitlistForm)
import { WaitlistForm } from '@/components/cohorts/WaitlistForm';

// Inside the <section aria-labelledby="cta-heading"> block:

{meta.status === 'announced' ? (
  <div className="mt-6 rounded-md border border-mist p-6">
    <p className="text-sm text-muted">
      Applications open soon. Drop your email below and we'll let you know
      the moment the form is live — no spam, one email per cohort milestone.
    </p>
    <div className="mt-6">
      <WaitlistForm cohortSlug={meta.slug} sourceTag="cohort-detail" />
    </div>
  </div>
) : meta.status === 'open' ? (
  <p>Application form coming online in Phase 3.</p>
) : /* rest unchanged */}
```

### Tests — Form + Action (part of `cohort-enrollment-2.2` red phase)

**NEW** `src/components/cohorts/__tests__/WaitlistForm.test.tsx`:

- Initial render shows an email input + "Join the waitlist" button.
- Empty submit → HTML5 validation blocks submit (`required`).
- Valid submit calls `submitWaitlist` (mocked) with the email + slug.
- Pending state disables input + button, shows "Joining…".
- Success state renders the confirmation message inside a `role="status"`.
- Error state renders the error message in red.
- Hidden `cohortSlug` input matches prop value.
- Hidden `sourceTag` input only renders when prop is provided.

**NEW** `src/components/cohorts/__tests__/actions.test.ts` — server-action
unit tests against a real Drizzle test DB + MSW-mocked Resend:

- Valid submission for an existing cohort inserts a `cohort_waitlist` row
  with the correct fields and returns `status: 'success'`.
- Duplicate submission (same email + slug) returns `status: 'success'`
  with the "already on the waitlist" message and does NOT insert a second
  row.
- Non-existent cohort slug returns `status: 'error'` with "Cohort not found".
- Invalid email returns `status: 'error'` with "valid email" message.
- Resend audience add is called with the correct `audienceId` + `email`
  when the env vars are set; not called when either is missing.
- Resend failure does NOT swallow the DB row — the row is still committed
  and the action still returns `status: 'success'`.
- `userId` is set when a session exists, `null` otherwise.

### Design Decisions — Form + Action

- **Server action, not API route** — matches wf 4.1's `captureEmail`. No
  fetch boilerplate, progressive enhancement works, `useActionState` ties
  form state to submission lifecycle with no client-side state management.
- **Defense-in-depth on the slug** — the form has a hidden `cohortSlug`
  input, but the action re-validates it via `getCohortBySlug()` to prevent
  a caller from tampering with DevTools and posting an arbitrary slug. The
  DB schema would accept any text value, so the validation lives at the
  action layer.
- **Resend + email are best-effort** — the DB row is the canonical record
  of "this person is on the waitlist". If Resend is down, we'd rather keep
  the DB row and let the operator resync than roll back the insert. The
  user sees success because, from their perspective, they're on the list.
- **Idempotent upsert via `onConflictDoNothing`** — same pattern as sa's
  webhook handler. The UNIQUE constraint catches duplicates at the DB
  layer; the action translates `returning().length === 0` into a
  user-friendly "already on the waitlist" message.
- **No CSRF token on server action** — Next.js 16 server actions are
  CSRF-safe by default (same-origin enforced by the framework). No extra
  handling needed.
- **`userId ?? null` on anonymous waitlist** — a visitor who hasn't signed
  in can still join; linking the row to their user once they do is a
  future job (or it happens naturally when they apply and the action
  looks up the waitlist by email).
- **`sourceTag` as an opaque string** — `"cohort-detail"` from the detail
  page, future integrations (e.g., a popup on the homepage) would use
  different tags. Not an enum because the tag vocabulary will grow.
- **No React-specific form library** — plain HTML form + server action is
  the Next.js 16 idiom. Adding react-hook-form / zod-react for one email
  input would be premature.

### Files — Form + Action

| Action | File                                                          |
|--------|---------------------------------------------------------------|
| NEW    | `src/components/cohorts/actions.ts`                           |
| NEW    | `src/components/cohorts/WaitlistForm.tsx`                     |
| NEW    | `src/components/cohorts/__tests__/WaitlistForm.test.tsx`      |
| NEW    | `src/components/cohorts/__tests__/actions.test.ts`            |
| MODIFY | `src/app/cohorts/[slug]/page.tsx`                             |

---

#### Confirmation Email + Env

(Merged from old Feature 2.3 — size S. Ships a single Resend email
helper that renders plain-text + HTML confirmation, plus documents the
two new environment variables `RESEND_COHORT_WAITLIST_AUDIENCE_ID` and
`RESEND_FROM_COHORTS`.)

### Problem — Confirmation Email

Phase 2.2's action calls `sendCohortWaitlistConfirmation` but the helper
doesn't exist yet. It needs to render an email that tells the waitlister
what they signed up for and when to expect updates, and it needs to be
reliable enough that the action's best-effort call is actually useful.

### Implementation — Confirmation Email

**NEW** `src/lib/email/cohort-waitlist-confirmation.ts`:

```ts
import { Resend } from 'resend';
import type { LoadedEntry } from '@/lib/content/loader';
import type { Cohort } from '@/content/schemas';

interface SendOptions {
  to: string;
  cohort: LoadedEntry<Cohort>;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function renderBody(meta: Cohort, appUrl: string): { text: string; html: string } {
  const detailUrl = `${appUrl}/cohorts/${meta.slug}`;

  const text = [
    `You're on the waitlist for ${meta.title}.`,
    '',
    `Starts: ${formatDate(meta.startDate)}`,
    `Duration: ${meta.durationWeeks} weeks (${meta.commitmentHoursPerWeek}h/week)`,
    '',
    "We'll email you the moment applications open. No spam, one update per cohort milestone.",
    '',
    `Cohort page: ${detailUrl}`,
    '',
    '— Travis Gautier',
  ].join('\n');

  const html = `
<!doctype html>
<html lang="en">
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#faf8f3;color:#0a0a0a;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px">
    <h1 style="font-size:22px;margin:0 0 16px">You're on the waitlist</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      Thanks for joining the waitlist for
      <strong>${escapeHtml(meta.title)}</strong>.
    </p>
    <p style="font-size:14px;line-height:1.5;margin:0 0 16px;color:#475569">
      Starts ${formatDate(meta.startDate)} · ${meta.durationWeeks} weeks · ${meta.commitmentHoursPerWeek} hours per week
    </p>
    <p style="font-size:15px;line-height:1.5;margin:0 0 24px">
      We'll email you the moment applications open. No spam, one update per
      cohort milestone.
    </p>
    <p style="margin:0 0 16px">
      <a href="${detailUrl}" style="display:inline-block;background:#c2410c;color:#faf8f3;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">
        View cohort page
      </a>
    </p>
    <p style="font-size:12px;color:#475569;margin:24px 0 0">— Travis Gautier</p>
  </div>
</body>
</html>
  `.trim();

  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendCohortWaitlistConfirmation({
  to,
  cohort,
}: SendOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_COHORTS;
  const appUrl = process.env.AUTH_URL ?? 'https://travisgautier.com';

  if (!apiKey || !from) {
    // Dev ergonomics — don't blow up the submit if env isn't set locally.
    // Phase-2 verification ensures both are set before end-to-end testing.
    return;
  }

  const resend = new Resend(apiKey);
  const { text, html } = renderBody(cohort.meta, appUrl);

  await resend.emails.send({
    from,
    to,
    subject: `You're on the waitlist for ${cohort.meta.title}`,
    text,
    html,
  });
}
```

**MODIFY** `.env.example` (create if it doesn't exist yet) — append:

```
# Cohort enrollment (Phase 2+)
RESEND_COHORT_WAITLIST_AUDIENCE_ID=
RESEND_FROM_COHORTS=
```

**MODIFY** `CLAUDE.md` (or equivalent env-doc file from wf) — add a
"Cohort enrollment env vars" section pointing to
`currentwork/cohort-enrollment/README.md` for the full list.

### Tests — Confirmation Email (part of `cohort-enrollment-2.2` red phase)

**NEW** `src/lib/email/__tests__/cohort-waitlist-confirmation.test.ts`:

- With `RESEND_API_KEY` + `RESEND_FROM_COHORTS` set and Resend mocked via
  MSW: `sendCohortWaitlistConfirmation(...)` calls Resend's `/emails` POST
  with the correct `from`, `to`, `subject`, and a body containing the
  cohort title + formatted start date.
- Missing `RESEND_API_KEY` → returns silently without calling Resend.
- Missing `RESEND_FROM_COHORTS` → returns silently without calling Resend.
- Cohort with a `"` in its title → HTML body escapes correctly (no broken
  markup).
- Plain-text body contains the detail URL with the `AUTH_URL` origin.
- Plain-text body contains `formatDate(cohort.startDate)` as
  "September 14, 2026" for the seed fixture.

### Design Decisions — Confirmation Email

- **Inline HTML string, not React Email** — matches sa 3.5's
  `purchase-confirmation.ts` pattern. React Email would be the right call
  if `email-funnel` ships first and delivers the shared renderer, but
  this job ships independently and inline HTML is one file. Flagged as a
  follow-up in the README's Open Items.
- **Best-effort send with silent no-op on missing env** — dev ergonomics:
  the submit action should still work locally even when Resend isn't
  configured. Real verification happens in the Phase 2 verification plan
  against a live `RESEND_API_KEY`.
- **`escapeHtml` helper inline** — the seed cohort titles are agent- or
  operator-authored and should not contain HTML, but defense-in-depth
  against any character the operator types into the MDX frontmatter. Not
  worth pulling in a dependency.
- **`RESEND_FROM_COHORTS` distinct from `AUTH_RESEND_FROM`** — Auth.js's
  magic-link sender identity is a transactional sender the app cannot
  afford to have sullied by bounces or spam complaints. Cohort emails are
  marketing-adjacent and should live on a separate sender (and a separate
  reputation) so a bad cohort campaign can't break sign-in delivery.
- **No unsubscribe link on the confirmation** — the waitlist confirmation
  is a one-shot transactional email sent in response to an explicit
  opt-in. Unsubscribe links are for recurring marketing sends and ship in
  a future job (`email-funnel` covers that surface for the main
  newsletter; cohort marketing sends — when and if they start — will
  reuse the same pattern).
- **`formatDate` inline rather than imported** — dependency minimization.
  The function is 4 lines and lives in multiple places in the codebase
  already (card, hero, list). Extracting a shared helper is a Phase 4
  cleanup, not a Phase 2 concern.

### Files — Confirmation Email

| Action | File                                                           |
|--------|----------------------------------------------------------------|
| NEW    | `src/lib/email/cohort-waitlist-confirmation.ts`                |
| NEW    | `src/lib/email/__tests__/cohort-waitlist-confirmation.test.ts` |
| MODIFY | `.env.example`                                                  |
| MODIFY | `CLAUDE.md` (env doc section)                                   |

### Combined Files Summary — `cohort-enrollment-2.2`

| Action | File                                                          |
|--------|---------------------------------------------------------------|
| NEW    | `src/components/cohorts/actions.ts`                           |
| NEW    | `src/components/cohorts/WaitlistForm.tsx`                     |
| NEW    | `src/components/cohorts/__tests__/WaitlistForm.test.tsx`      |
| NEW    | `src/components/cohorts/__tests__/actions.test.ts`            |
| NEW    | `src/lib/email/cohort-waitlist-confirmation.ts`                |
| NEW    | `src/lib/email/__tests__/cohort-waitlist-confirmation.test.ts` |
| MODIFY | `src/app/cohorts/[slug]/page.tsx`                              |
| MODIFY | `.env.example`                                                  |
| MODIFY | `CLAUDE.md` (env doc section)                                   |
