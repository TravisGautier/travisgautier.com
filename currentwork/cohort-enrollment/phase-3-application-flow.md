# Phase 3: Application Flow

**Total Size: S + L** (2 sections after condense: old 3.1 → new 3.1, old 3.2 + 3.3 + 3.4 merged → new 3.2)
**Prerequisites: Phase 2 complete (all four cohort tables exist + the waitlist form is live). `storefront-auth` Phase 2.2 shipped (Auth.js v5 magic-link working, `auth()` helper available) + Phase 2.3 shipped (`middleware.ts` at project root with the existing matcher that this job extends).**
**New Types: `CohortApplicationInput` + `APPLICATION_COMMITMENT_LEVELS` tuple + `CohortApplicationInputSchema` Zod validator**
**New Files: `src/content/schemas/cohort-application.ts`, `src/app/cohorts/[slug]/apply/page.tsx`, `src/components/cohorts/ApplicationForm.tsx`, `src/lib/email/cohort-application-received.ts`, plus tests. MODIFY `src/components/cohorts/actions.ts`, `src/content/schemas/validators.ts`, `middleware.ts`, `src/app/cohorts/[slug]/page.tsx`.**

Phase 3 gives Phase 1's `open` cohort detail page a working apply CTA
linked to a real auth-gated form. By the end of this phase, a signed-in
visitor on `/cohorts/workflow-mastery-2026-q4` can click "Apply now", land
on `/cohorts/workflow-mastery-2026-q4/apply`, fill out background + goals +
commitment details, submit, and receive a confirmation email. The
application lands in `cohort_applications` with `decision: 'pending'` and
sits there until Phase 4's admin dashboard decides its fate.

---

## Feature 3.1: `CohortApplicationInput` Schema + Validator ✅ SHIPPED (2026-06-06)

**Status:** shipped. cohort-application.ts forward-decl from ce-2.1 was extended in-place; CohortApplicationInputSchema + CohortApplicationInputType appended to validators.ts. 28 new tests (11 unit + 6 security + 2 infra + 8 edge + 1 err + 2 data). Deviations from this plan when shipped: tuple values kept as `['light','standard','intense']` from ce-2.1 (DB CHECK constraint locks these — labels rewritten to match); `z.coerce.number()` used (Zod 4 syntax) instead of `z.number({ coerce: true })`; `z.preprocess` used for empty-string→undefined coercion (cleaner than `.or` chain); referralSource max-length message reads "max 200" rather than "under 200".

**Complexity: S** — Define the shape of the application FormData + the
Zod validator that runs at the server-action boundary.

### Problem

The application form has ~6 fields (background, goals, commitment level,
commitment hours, timezone, pillar interest, optional referral source).
Each needs a length and format constraint, and the whole thing needs to
be round-trippable through FormData (which coerces everything to strings).
Without a central schema, every downstream consumer (server action, form
component, admin dashboard detail page, confirmation email) would
re-define its own field list and drift.

### Implementation

**NEW** `src/content/schemas/cohort-application.ts`:

```ts
import type { ContentPillar } from './content-pillar';

export const APPLICATION_COMMITMENT_LEVELS = [
  'exploring',
  'serious',
  'all-in',
] as const;

export type ApplicationCommitmentLevel =
  (typeof APPLICATION_COMMITMENT_LEVELS)[number];

export const APPLICATION_COMMITMENT_LEVEL_LABELS: Record<
  ApplicationCommitmentLevel,
  string
> = {
  exploring: 'Exploring — not sure yet whether this is the right fit',
  serious: 'Serious — if accepted, I plan to attend every week',
  'all-in': 'All in — this is my top priority for the duration',
};

/**
 * Raw shape submitted from `<ApplicationForm>`. Not a content record —
 * never lands on disk as MDX. Lives alongside the content schemas for
 * colocation with `CohortSchema` and because `validators.ts` imports from
 * here.
 */
export interface CohortApplicationInput {
  cohortSlug: string;
  background: string;
  goals: string;
  commitmentLevel: ApplicationCommitmentLevel;
  commitmentHours: number;
  timezone: string;
  pillarInterest: ContentPillar;
  referralSource?: string;
}
```

**MODIFY** `src/content/schemas/validators.ts` — append:

```ts
import {
  APPLICATION_COMMITMENT_LEVELS,
  type CohortApplicationInput,
} from './cohort-application';

export const CohortApplicationInputSchema = z.object({
  cohortSlug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'invalid slug'),
  background: z
    .string()
    .min(80, 'Tell us a bit more — at least a couple of sentences.')
    .max(2000, 'Please keep background under 2000 characters.'),
  goals: z
    .string()
    .min(40, 'Share at least one concrete outcome you are aiming for.')
    .max(1500, 'Please keep goals under 1500 characters.'),
  commitmentLevel: z.enum(APPLICATION_COMMITMENT_LEVELS),
  commitmentHours: z
    .number({ coerce: true })
    .int()
    .min(1, 'Please enter at least 1 hour per week.')
    .max(80, 'Please enter a realistic weekly commitment (max 80 hours).'),
  timezone: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z_+\-/0-9]+$/, 'Invalid timezone.'),
  pillarInterest: z.enum(CONTENT_PILLARS),
  referralSource: z.string().max(200).optional().or(z.literal('').transform(() => undefined)),
}) satisfies z.ZodType<CohortApplicationInput>;
```

### Tests (red phase of section `cohort-enrollment-3.1`)

**MODIFY** `src/content/schemas/__tests__/validators.test.ts` — append:

- Valid minimal input (every required field, placeholder referralSource) passes.
- `background` of 10 characters → error "at least a couple of sentences".
- `background` of 5000 characters → error "under 2000".
- `goals` of 20 characters → error "at least one concrete outcome".
- `commitmentLevel = 'maybe'` → error (not in tuple).
- `commitmentHours = '8'` (string from FormData) → coerces to `8` and passes.
- `commitmentHours = 0` → error "at least 1 hour".
- `commitmentHours = 100` → error "max 80 hours".
- `pillarInterest = 'marketing'` → error (not in `CONTENT_PILLARS`).
- `referralSource = ''` → transforms to `undefined` and passes (empty string
  from an untouched optional input is the common FormData case).
- `referralSource` of 500 characters → error "max 200".
- `timezone = 'America/New_York'` passes.
- `timezone = 'GMT+5'` passes (regex permits the `+` / `-` forms).
- `timezone = 'bad!zone'` → error.
- `cohortSlug = 'UPPER'` → error (lowercase kebab only).

### Design Decisions

- **`commitmentLevel` vs `commitmentHours` as two fields** — commitment
  level is the self-assessment ("how serious are you"); hours is the
  concrete capacity. Both matter to reviewers — a "serious" applicant with
  2 hours/week is a different profile from an "exploring" applicant with
  15 hours. Collapsing them would lose information that the admin
  dashboard specifically needs to sort by.
- **`background` min 80 chars / max 2000** — short enough that a
  thoughtful-but-busy applicant can finish it in 5 minutes, long enough
  that an applicant who types one word gets caught and bounced back. The
  error messages nudge toward "at least a couple of sentences".
- **`referralSource` as optional free text** — a fixed enum (`'google'`,
  `'youtube'`, `'friend'`) would invite clicking a random option; free
  text gives richer signal at the cost of slightly worse analytics. The
  admin dashboard in Phase 4.1 just renders it as-is.
- **`timezone` as a free-text field, not a picker** — asking for an IANA
  timezone string is enough; browsers send `Intl.DateTimeFormat().resolvedOptions().timeZone`
  which the form can auto-detect and pre-fill. Building a full-featured
  timezone picker is a large dependency for marginal UX benefit.
- **`cohortSlug` validated at the action layer + the schema** — the form
  hides it, but the schema still validates it so a DevTools-edited submit
  can't inject an arbitrary slug.
- **`satisfies z.ZodType<CohortApplicationInput>`** — compile-time
  guarantee the Zod schema exactly matches the TypeScript interface,
  catching drift if one is updated without the other.

### Files

| Action | File                                                   |
|--------|--------------------------------------------------------|
| NEW    | `src/content/schemas/cohort-application.ts`            |
| MODIFY | `src/content/schemas/validators.ts`                    |
| MODIFY | `src/content/schemas/__tests__/validators.test.ts`     |

---

## Feature 3.2: Apply Page + `<ApplicationForm>` + `submitApplication` + Applicant Email

**Complexity: L** — Merged from old 3.2 + 3.3 + 3.4. One coherent apply
flow: auth-gated page + middleware matcher extension + client form + server
action + applicant confirmation email. None are meaningfully shippable
alone (page renders the form, action calls the email). Three sub-parts
below: **#### Auth-Gated Page + Middleware** (old 3.2), **#### Form +
Submit Action** (old 3.3), **#### Applicant Confirmation Email** (old 3.4).

#### Auth-Gated Page + Middleware

(Old Feature 3.2 — Complexity M on its own.) A new dynamic route that
hydrates the session, loads the cohort, and renders `<ApplicationForm>`.
Middleware is extended to cover the route so unauthenticated visitors are
redirected to `/login`.

### Problem — Auth-Gated Page

The application form needs a concrete URL per cohort so every marketing
CTA ("Apply now") has a stable target. The URL must be auth-gated so only
signed-in users can submit an application (cohort_applications.userId is
NOT NULL). The page also has to confirm the cohort exists and is
currently accepting applications — rendering an apply form for a `closed`
or `enrolled` cohort would be misleading.

### Implementation — Auth-Gated Page

**NEW** `src/app/cohorts/[slug]/apply/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq, and } from 'drizzle-orm';
import { Container } from '@/components/site/Container';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getCohortBySlug } from '@/lib/content/cohorts';
import { CohortDetailHero } from '@/components/cohorts/CohortDetailHero';
import { ApplicationForm } from '@/components/cohorts/ApplicationForm';

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: 'Apply',
  robots: { index: false, follow: false },
};

export default async function ApplyPage({ params }: RouteParams) {
  const { slug } = await params;
  const entry = await getCohortBySlug(slug);
  if (!entry) notFound();

  // Middleware already redirects unauthenticated users — this is
  // defense-in-depth for the code path, and it gives the page a stable
  // `session.user` to work with without null checks.
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect(`/login?callbackUrl=%2Fcohorts%2F${encodeURIComponent(slug)}%2Fapply`);
  }

  if (entry.meta.status !== 'open') {
    return (
      <Container as="main" className="py-16">
        <CohortDetailHero cohort={entry.meta} />
        <div className="mt-12 rounded-md border border-mist p-6 text-sm text-muted">
          <p>
            Applications for this cohort are not currently open.{' '}
            <Link
              href={`/cohorts/${slug}`}
              className="text-link underline-offset-2 hover:underline"
            >
              Back to cohort page
            </Link>
          </p>
        </div>
      </Container>
    );
  }

  // Check whether this user has already applied — show the "already
  // applied" state instead of a pre-filled form.
  const [existing] = await db
    .select({ id: schema.cohortApplications.id })
    .from(schema.cohortApplications)
    .where(
      and(
        eq(schema.cohortApplications.cohortSlug, slug),
        eq(schema.cohortApplications.userId, session.user.id),
      ),
    )
    .limit(1);

  if (existing) {
    return (
      <Container as="main" className="py-16">
        <CohortDetailHero cohort={entry.meta} />
        <div className="mt-12 rounded-md border border-accent/40 bg-accent/5 p-6 text-sm">
          <p>
            You've already applied to this cohort. You'll get a decision
            email once the review window closes.
          </p>
          <p className="mt-4">
            <Link
              href="/products/account/cohorts"
              className="text-link underline-offset-2 hover:underline"
            >
              Check your application status
            </Link>
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container as="main" className="py-16">
      <CohortDetailHero cohort={entry.meta} />

      <section className="mt-16 max-w-2xl">
        <h2 className="font-display text-2xl font-semibold">Your application</h2>
        <p className="mt-3 text-sm text-muted">
          Signed in as <strong className="text-foreground">{session.user.email}</strong>.
          Applications are reviewed editorially, and everyone hears back within
          two weeks of the cohort's application close date.
        </p>

        <div className="mt-8">
          <ApplicationForm cohortSlug={slug} />
        </div>
      </section>
    </Container>
  );
}
```

**MODIFY** `middleware.ts` at the project root — extend the matcher:

```ts
// (existing config from sa 2.3)
export const config = {
  matcher: [
    '/products/account/:path*',
    '/products/downloads/:path*',
    // Added by cohort-enrollment 3.2 + 4.1 + 4.6:
    '/cohorts/:slug/apply',
    '/cohorts/:slug/checkout',
    '/admin/:path*',
    '/products/account/cohorts',
  ],
};
```

The body of `middleware.ts` doesn't change — sa's existing session-cookie
check continues to handle the redirect to `/login?callbackUrl=...` for any
path that matches.

**MODIFY** `src/app/cohorts/[slug]/page.tsx` — replace the `open`
placeholder with a link into the apply page:

```tsx
{meta.status === 'open' ? (
  <div className="mt-6 rounded-md border border-mist p-6">
    <p className="text-sm text-muted">
      Applications are open. Review below, then submit yours.
    </p>
    <div className="mt-6">
      <Link
        href={`/cohorts/${meta.slug}/apply`}
        className="inline-flex items-center rounded-md bg-accent px-5 py-3 text-sm font-semibold text-parchment hover:bg-accent/90"
      >
        Apply to this cohort
      </Link>
    </div>
  </div>
) : /* rest unchanged */}
```

### Tests — Auth-Gated Page (part of `cohort-enrollment-3.2` red phase)

**NEW** `src/app/cohorts/[slug]/apply/__tests__/page.test.tsx`:

- Unknown slug → `notFound()` called.
- No session → `redirect('/login?callbackUrl=...')` called with correct
  encoded URL.
- Signed-in user, cohort status `announced` → renders "Applications for
  this cohort are not currently open" with a link back to the cohort page.
- Signed-in user, cohort status `closed` → same not-open fallback.
- Signed-in user, cohort status `open`, no existing application → renders
  the hero, the "Signed in as {email}" line, and `<ApplicationForm>`.
- Signed-in user, cohort status `open`, existing application row → renders
  the "You've already applied" panel with a link to
  `/products/account/cohorts`.
- `metadata.robots` is `{ index: false, follow: false }` (the apply page
  should never appear in Google).

**NEW** `src/__tests__/middleware.cohort.test.ts` (or extend the existing
sa middleware test):

- Matcher includes `/cohorts/foo/apply`.
- Matcher includes `/cohorts/foo/checkout`.
- Matcher includes `/admin/cohorts/applications`.
- Matcher does NOT match `/cohorts` or `/cohorts/foo`.

### Design Decisions — Auth-Gated Page

- **Double-check auth in the page body** — middleware already runs, but
  Next.js 16's pattern is to treat every server component as if it could
  be called from anywhere. The `auth()` + redirect inside the page body
  is a belt-and-braces check that also gives the rest of the function a
  non-null `session.user` without type narrowing.
- **Status check in the page, not middleware** — middleware runs on
  every request and can't easily read the cohort content, so the page
  handles status-specific rendering. This also means the apply page URL
  is "visitable" for any status; it just renders different copy.
- **`existing` lookup in the page, not the form** — checking "already
  applied" after the user lands on the apply page (instead of after they
  submit) prevents the user from filling out a multi-field form only to
  be told they already applied. It's a single DB query on page load —
  cheap compared to rendering the form.
- **`robots: index: false, follow: false`** — the apply page is gated;
  Google shouldn't crawl it. sa's `/products/account/page.tsx` uses the
  same metadata.
- **`<CohortDetailHero>` reused** — the applicant should see what they're
  applying to above the form. Reusing the component means the two pages
  stay visually consistent.
- **No pre-filled email input** — the session email is shown as
  read-only text above the form. The DB row is keyed on
  `(cohort_slug, user_id)` (not email), so there's no reason to send the
  email through the form at all.
- **Middleware matcher extended here, not in Phase 2** — Phase 2 didn't
  need any gated routes (waitlist is public), so the matcher extension
  naturally lands with the first gated surface.

### Files — Auth-Gated Page

| Action | File                                                            |
|--------|-----------------------------------------------------------------|
| NEW    | `src/app/cohorts/[slug]/apply/page.tsx`                         |
| NEW    | `src/app/cohorts/[slug]/apply/__tests__/page.test.tsx`          |
| NEW    | `src/__tests__/middleware.cohort.test.ts`                       |
| MODIFY | `middleware.ts` (project root)                                  |
| MODIFY | `src/app/cohorts/[slug]/page.tsx`                               |

---

#### Form + Submit Action

(Old Feature 3.3 — Complexity M on its own.) Client form component with
`useActionState`, plus the server action that validates the FormData,
looks up a matching waitlist row, inserts the application, and fires the
confirmation email.

### Problem — Form + Action

`<ApplicationForm>` is the most complex form in the job: 6 required
fields, 1 optional, a select for commitment level, a select for pillar
interest, a numeric input for commitment hours, two longform textareas.
It needs per-field error messages (not just a single top-level error),
submit button disabled while pending, and the success state should
redirect to a "thanks" view instead of the form.

### Implementation — Form + Action

**MODIFY** `src/components/cohorts/actions.ts` — append `submitApplication`:

```ts
// (existing imports + submitWaitlist above)
import { redirect } from 'next/navigation';
import { CohortApplicationInputSchema } from '@/content/schemas/validators';
import { sendCohortApplicationReceived } from '@/lib/email/cohort-application-received';

export type ApplicationFieldErrors = Partial<
  Record<
    'background' | 'goals' | 'commitmentLevel' | 'commitmentHours' | 'timezone' | 'pillarInterest' | 'referralSource' | 'cohortSlug' | '_form',
    string
  >
>;

export type ApplicationState =
  | { status: 'idle' }
  | { status: 'error'; fieldErrors: ApplicationFieldErrors }
  | { status: 'success'; applicationId: string };

export async function submitApplication(
  _prev: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return {
      status: 'error',
      fieldErrors: { _form: 'You must be signed in to apply.' },
    };
  }

  const parsed = CohortApplicationInputSchema.safeParse({
    cohortSlug: formData.get('cohortSlug'),
    background: formData.get('background'),
    goals: formData.get('goals'),
    commitmentLevel: formData.get('commitmentLevel'),
    commitmentHours: formData.get('commitmentHours'),
    timezone: formData.get('timezone'),
    pillarInterest: formData.get('pillarInterest'),
    referralSource: formData.get('referralSource') ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: ApplicationFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ApplicationFieldErrors;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: 'error', fieldErrors };
  }

  const input = parsed.data;

  const cohort = await getCohortBySlug(input.cohortSlug);
  if (!cohort) {
    return {
      status: 'error',
      fieldErrors: { cohortSlug: 'Cohort not found.' },
    };
  }
  if (cohort.meta.status !== 'open') {
    return {
      status: 'error',
      fieldErrors: { _form: 'Applications for this cohort are closed.' },
    };
  }

  // Link a matching waitlist row (same email + same cohort) if one exists.
  const [waitlist] = await db
    .select({ id: schema.cohortWaitlist.id })
    .from(schema.cohortWaitlist)
    .where(
      and(
        eq(schema.cohortWaitlist.email, session.user.email),
        eq(schema.cohortWaitlist.cohortSlug, input.cohortSlug),
      ),
    )
    .limit(1);

  try {
    const [inserted] = await db
      .insert(schema.cohortApplications)
      .values({
        cohortSlug: input.cohortSlug,
        userId: session.user.id,
        background: input.background,
        goals: input.goals,
        commitmentLevel: input.commitmentLevel,
        commitmentHours: input.commitmentHours,
        timezone: input.timezone,
        pillarInterest: input.pillarInterest,
        referralSource: input.referralSource ?? null,
        waitlistId: waitlist?.id ?? null,
      })
      .returning({ id: schema.cohortApplications.id });

    // Best-effort email — don't roll back the row if Resend is down.
    try {
      await sendCohortApplicationReceived({
        to: session.user.email,
        cohort,
      });
    } catch (err) {
      // Swallow — application is still saved.
    }

    // Redirect to the "already applied" state on the same URL so a
    // refresh of the success page is safe.
    redirect(`/cohorts/${input.cohortSlug}/apply?submitted=${inserted.id}`);
  } catch (err) {
    // Unique violation → user already has an application for this cohort.
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      return {
        status: 'error',
        fieldErrors: { _form: "You've already applied to this cohort." },
      };
    }
    throw err;
  }
}
```

**NEW** `src/components/cohorts/ApplicationForm.tsx`:

```tsx
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  APPLICATION_COMMITMENT_LEVELS,
  APPLICATION_COMMITMENT_LEVEL_LABELS,
} from '@/content/schemas';
import { CONTENT_PILLARS, CONTENT_PILLAR_QUESTIONS } from '@/content/schemas';
import { submitApplication, type ApplicationState } from './actions';

const INITIAL: ApplicationState = { status: 'idle' };

interface ApplicationFormProps {
  cohortSlug: string;
}

export function ApplicationForm({ cohortSlug }: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(submitApplication, INITIAL);
  const [autoTimezone, setAutoTimezone] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      setAutoTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setAutoTimezone('');
    }
  }, []);

  const fieldErrors = state.status === 'error' ? state.fieldErrors : {};

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="cohortSlug" value={cohortSlug} />

      <Field
        id="background"
        label="Your background"
        hint="A short paragraph on what you do, what you're working on, and what brought you here."
        error={fieldErrors.background}
      >
        <textarea
          id="background"
          name="background"
          required
          minLength={80}
          maxLength={2000}
          rows={5}
          className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </Field>

      <Field
        id="goals"
        label="What do you want to walk out of this cohort with?"
        hint="One concrete outcome is enough. Be specific."
        error={fieldErrors.goals}
      >
        <textarea
          id="goals"
          name="goals"
          required
          minLength={40}
          maxLength={1500}
          rows={4}
          className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </Field>

      <Field
        id="commitmentLevel"
        label="How serious are you about this cohort?"
        error={fieldErrors.commitmentLevel}
      >
        <select
          id="commitmentLevel"
          name="commitmentLevel"
          required
          className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          defaultValue=""
        >
          <option value="" disabled>
            Pick one
          </option>
          {APPLICATION_COMMITMENT_LEVELS.map((level) => (
            <option key={level} value={level}>
              {APPLICATION_COMMITMENT_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="commitmentHours"
        label="How many hours per week can you realistically commit?"
        hint="We treat this as a planning input, not a contract."
        error={fieldErrors.commitmentHours}
      >
        <input
          id="commitmentHours"
          name="commitmentHours"
          type="number"
          min={1}
          max={80}
          required
          className="w-32 rounded-md border border-mist bg-parchment px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </Field>

      <Field
        id="timezone"
        label="Your timezone"
        hint="Auto-detected from your browser — edit if it's wrong."
        error={fieldErrors.timezone}
      >
        <input
          id="timezone"
          name="timezone"
          type="text"
          required
          defaultValue={autoTimezone}
          className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:max-w-md"
        />
      </Field>

      <Field
        id="pillarInterest"
        label="Which of the four questions pulls you most strongly?"
        error={fieldErrors.pillarInterest}
      >
        <select
          id="pillarInterest"
          name="pillarInterest"
          required
          className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          defaultValue=""
        >
          <option value="" disabled>
            Pick one
          </option>
          {CONTENT_PILLARS.map((pillar) => (
            <option key={pillar} value={pillar}>
              {CONTENT_PILLAR_QUESTIONS[pillar]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="referralSource"
        label="How did you find this cohort? (optional)"
        error={fieldErrors.referralSource}
      >
        <input
          id="referralSource"
          name="referralSource"
          type="text"
          maxLength={200}
          className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:max-w-md"
        />
      </Field>

      {fieldErrors._form ? (
        <p role="alert" className="text-sm text-red-600">
          {fieldErrors._form}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-parchment hover:bg-accent/90 disabled:opacity-60"
        >
          {isPending ? 'Submitting…' : 'Submit application'}
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

### Tests — Form + Action (part of `cohort-enrollment-3.2` red phase)

**NEW** `src/components/cohorts/__tests__/ApplicationForm.test.tsx`:

- Initial render shows every field with its label + required marker.
- `commitmentLevel` select has 4 options: disabled placeholder + 3 real.
- `pillarInterest` select has 5 options: disabled placeholder + 4 pillars
  (with the pillar question as the visible label).
- Timezone input pre-fills via `Intl.DateTimeFormat` after mount
  (asserted via mocked `Intl`).
- Error state renders each `fieldErrors.{field}` next to its field.
- `fieldErrors._form` renders as a top-level alert.
- Pending state disables submit button + shows "Submitting…".

**NEW** `src/components/cohorts/__tests__/actions.submitApplication.test.ts`
— server-action unit tests against a real Drizzle test DB:

- Unauthenticated call → returns `_form: "You must be signed in"`.
- Valid FormData + existing `open` cohort + no duplicate → inserts a row
  with the right fields, returns redirect (test asserts `redirect` was
  called with the `?submitted=` URL).
- `commitmentHours = '8'` (FormData string) → coerces + persists as
  integer `8`.
- Missing `background` → returns `fieldErrors.background`.
- Missing `goals` → returns `fieldErrors.goals`.
- Invalid `commitmentLevel` → returns `fieldErrors.commitmentLevel`.
- Duplicate `(cohortSlug, userId)` (insert throws 23505) → returns
  `_form: "already applied"`.
- Cohort status `closed` → returns `_form: "Applications … closed"`.
- Existing waitlist row with matching email + slug → inserted row's
  `waitlistId` points at the waitlist row.
- No matching waitlist row → inserted row's `waitlistId` is null.
- Resend failure → row still committed, redirect still called.

### Design Decisions — Form + Action

- **Per-field errors via `fieldErrors` object** — one blanket "something
  was wrong with your form" is terrible UX for a 7-field form. Zod's
  `issue.path[0]` maps each issue to its field, and the state machine
  carries them to `<Field>`.
- **`redirect` on success, not a success-state render** — lets a refresh
  of the URL land on the "already applied" state from Phase 3.2 instead
  of re-submitting the form. The `?submitted=` query param is purely a
  "just happened" marker for the target page to render a small toast if
  we want to add one later.
- **Unique-violation catch via `err.code === '23505'`** — PostgreSQL's
  unique-constraint violation error code. The alternative would be a
  SELECT-then-INSERT pattern that races with concurrent submits. The
  catch is cleaner and naturally idempotent.
- **Waitlist lookup by email, not by `waitlistId`** — the user didn't
  submit their waitlist row ID; we look them up by the session email +
  cohort slug. If they used a different email on the waitlist than the
  one bound to their user account, the link is silently skipped — that's
  fine, it's a best-effort analytics feature.
- **`<Field>` helper inline in the same file** — pulling it to a shared
  component would be over-engineering for seven call sites in one form.
  If future forms reuse it, lift it then.
- **`autoTimezone` via `useEffect` after mount** — `Intl.DateTimeFormat`
  is browser-only; doing it server-side would throw. Post-mount assignment
  + `defaultValue` means the field is editable and the user can override
  if they're in a different timezone than their browser reports.
- **No client-side schema validation library** — HTML5 `required`,
  `minLength`, `max`, etc., plus server-side Zod. One validation language
  is enough for a 7-field form.

### Files — Form + Action

| Action | File                                                             |
|--------|------------------------------------------------------------------|
| MODIFY | `src/components/cohorts/actions.ts`                              |
| NEW    | `src/components/cohorts/ApplicationForm.tsx`                     |
| NEW    | `src/components/cohorts/__tests__/ApplicationForm.test.tsx`      |
| NEW    | `src/components/cohorts/__tests__/actions.submitApplication.test.ts` |

---

#### Applicant Confirmation Email

(Old Feature 3.4 — Complexity S on its own.) One more Resend helper,
this time sent the moment an application lands.

### Problem — Applicant Confirmation Email

The applicant has no way of knowing whether their application was
received — they filled out a form, got redirected to the "already applied"
state, and now sit in silence for two weeks. An immediate confirmation
email reassures them and gives them a written record of what they signed
up for.

### Implementation — Applicant Confirmation Email

**NEW** `src/lib/email/cohort-application-received.ts`:

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendCohortApplicationReceived({
  to,
  cohort,
}: SendOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_COHORTS;
  const appUrl = process.env.AUTH_URL ?? 'https://travisgautier.com';

  if (!apiKey || !from) return;

  const accountUrl = `${appUrl}/products/account/cohorts`;
  const meta = cohort.meta;

  const text = [
    `Your application for ${meta.title} is in.`,
    '',
    'We review applications editorially. You will hear back within two weeks',
    "of the application close date — usually sooner. There's nothing else",
    'you need to do right now.',
    '',
    `Cohort: ${meta.title}`,
    `Starts: ${formatDate(meta.startDate)}`,
    `Duration: ${meta.durationWeeks} weeks`,
    '',
    `Track your application: ${accountUrl}`,
    '',
    '— Travis Gautier',
  ].join('\n');

  const html = `
<!doctype html>
<html lang="en">
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#faf8f3;color:#0a0a0a;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px">
    <h1 style="font-size:22px;margin:0 0 16px">Application received</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      Your application for <strong>${escapeHtml(meta.title)}</strong> is in.
    </p>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      We review applications editorially. You will hear back within two weeks
      of the application close date — usually sooner. There's nothing else you
      need to do right now.
    </p>
    <p style="font-size:14px;color:#475569;line-height:1.5;margin:0 0 24px">
      Starts ${formatDate(meta.startDate)} · ${meta.durationWeeks} weeks · ${meta.commitmentHoursPerWeek} hours per week
    </p>
    <p>
      <a href="${accountUrl}" style="display:inline-block;background:#c2410c;color:#faf8f3;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">
        Track your application
      </a>
    </p>
    <p style="font-size:12px;color:#475569;margin:24px 0 0">— Travis Gautier</p>
  </div>
</body>
</html>
  `.trim();

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: `Application received — ${meta.title}`,
    text,
    html,
  });
}
```

### Tests — Applicant Confirmation Email (part of `cohort-enrollment-3.2` red phase)

**NEW** `src/lib/email/__tests__/cohort-application-received.test.ts`:

- With env vars set + MSW-mocked Resend: calls `/emails` POST with the
  correct `from`, `to`, subject ("Application received — {title}"), and
  body containing the formatted start date + the account URL.
- Missing env vars → no Resend call.
- Cohort with `"` in title → HTML is escaped, no broken markup.
- Plain-text body contains the account tracking URL with the correct
  `AUTH_URL` origin.

### Design Decisions — Applicant Confirmation Email

- **Inline HTML again** — consistency with 2.3 and sa 3.5. If `email-funnel`
  ships first, migrating all three helpers to React Email is a single
  follow-up commit.
- **No CTA link in the email body other than "Track your application"** —
  the applicant has already submitted; anything else (marketing, upsells)
  would feel spammy and undermine the transactional character of the
  email.
- **"Within two weeks of the application close date"** — deliberate
  vagueness because we don't know *when* the cohort closes applications
  at send time. The reviewer can always be more specific in the decision
  email.
- **Plain-text body is first-class** — some email clients default to text,
  and the text version acts as our fallback record of what the email
  said. Keeping it in sync with the HTML version manually is acceptable
  for a 10-line body.
- **`RESEND_FROM_COHORTS` same as 2.3** — reuses the same sender identity
  because both emails are cohort-flavoured and should look to the
  applicant like they came from the same place.

### Files — Applicant Confirmation Email

| Action | File                                                             |
|--------|------------------------------------------------------------------|
| NEW    | `src/lib/email/cohort-application-received.ts`                   |
| NEW    | `src/lib/email/__tests__/cohort-application-received.test.ts`    |

### Combined Files Summary — `cohort-enrollment-3.2`

| Action | File                                                             |
|--------|------------------------------------------------------------------|
| NEW    | `src/app/cohorts/[slug]/apply/page.tsx`                          |
| NEW    | `src/app/cohorts/[slug]/apply/__tests__/page.test.tsx`           |
| NEW    | `src/__tests__/middleware.cohort.test.ts`                        |
| MODIFY | `middleware.ts` (project root)                                   |
| MODIFY | `src/app/cohorts/[slug]/page.tsx`                                |
| MODIFY | `src/components/cohorts/actions.ts`                              |
| NEW    | `src/components/cohorts/ApplicationForm.tsx`                     |
| NEW    | `src/components/cohorts/__tests__/ApplicationForm.test.tsx`      |
| NEW    | `src/components/cohorts/__tests__/actions.submitApplication.test.ts` |
| NEW    | `src/lib/email/cohort-application-received.ts`                   |
| NEW    | `src/lib/email/__tests__/cohort-application-received.test.ts`    |
