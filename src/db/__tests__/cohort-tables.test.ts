import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import * as schema from '@/db/schema';
import type {
  CohortAdmissionRow,
  CohortApplicationRow,
  CohortEnrollmentRow,
  CohortWaitlistRow,
  NewCohortAdmissionRow,
  NewCohortApplicationRow,
  NewCohortEnrollmentRow,
  NewCohortWaitlistRow,
} from '@/db/schema';

// ─────────────────────────────────────────────────────────────
// Unit tests (no DB) — schema structure via getTableConfig
// ─────────────────────────────────────────────────────────────

describe('cohort tables schema structure (unit)', () => {
  it('unit_schema_cohort_tables_exported: cohortWaitlist/cohortApplications/cohortAdmissions/cohortEnrollments are named exports', () => {
    expect(schema).toHaveProperty('cohortWaitlist');
    expect(schema).toHaveProperty('cohortApplications');
    expect(schema).toHaveProperty('cohortAdmissions');
    expect(schema).toHaveProperty('cohortEnrollments');
  });

  it('unit_schema_cohort_types_exported: row + insert types are importable and shape-correct', () => {
    // The type imports are compile-time only and esbuild strips them silently.
    // Anchor the test to runtime: the four table exports must exist as objects
    // — only then are the $inferSelect / $inferInsert types meaningfully defined.
    expect(schema.cohortWaitlist).toBeDefined();
    expect(schema.cohortApplications).toBeDefined();
    expect(schema.cohortAdmissions).toBeDefined();
    expect(schema.cohortEnrollments).toBeDefined();
    const w: CohortWaitlistRow = {
      id: 'w-1',
      email: 'a@example.com',
      cohortSlug: 'ai-delivery-2026-q3',
      sourceTag: null,
      userId: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const nw: NewCohortWaitlistRow = {
      email: 'b@example.com',
      cohortSlug: 'ai-delivery-2026-q3',
    };
    const a: CohortApplicationRow = {
      id: 'a-1',
      cohortSlug: 'ai-delivery-2026-q3',
      userId: 'u-1',
      background: 'bg',
      goals: 'goals',
      commitmentLevel: 'standard',
      commitmentHours: 6,
      timezone: 'America/New_York',
      pillarInterest: 'delivery',
      referralSource: null,
      waitlistId: null,
      decision: 'pending',
      submittedAt: new Date('2026-01-01T00:00:00Z'),
    };
    const na: NewCohortApplicationRow = {
      cohortSlug: 'ai-delivery-2026-q3',
      userId: 'u-1',
      background: 'bg',
      goals: 'goals',
      commitmentLevel: 'standard',
      commitmentHours: 6,
      timezone: 'America/New_York',
      pillarInterest: 'delivery',
    };
    const ad: CohortAdmissionRow = {
      id: 'd-1',
      applicationId: 'a-1',
      decidedBy: 'admin@travisgautier.com',
      decision: 'accepted',
      decisionNote: null,
      acceptedUntil: null,
      decidedAt: new Date('2026-01-01T00:00:00Z'),
    };
    const nad: NewCohortAdmissionRow = {
      applicationId: 'a-1',
      decidedBy: 'admin@travisgautier.com',
      decision: 'accepted',
    };
    const e: CohortEnrollmentRow = {
      id: 'e-1',
      applicationId: 'a-1',
      cohortSlug: 'ai-delivery-2026-q3',
      userId: 'u-1',
      stripeSessionId: 'cs_test_1',
      stripePaymentIntentId: 'pi_test_1',
      amountCents: 49900,
      currency: 'usd',
      paidAt: new Date('2026-01-01T00:00:00Z'),
    };
    const ne: NewCohortEnrollmentRow = {
      applicationId: 'a-1',
      cohortSlug: 'ai-delivery-2026-q3',
      userId: 'u-1',
      stripeSessionId: 'cs_test_2',
      stripePaymentIntentId: 'pi_test_2',
      amountCents: 49900,
    };
    expect(w.email).toBe('a@example.com');
    expect(nw.email).toBe('b@example.com');
    expect(a.decision).toBe('pending');
    expect(na.commitmentLevel).toBe('standard');
    expect(ad.decision).toBe('accepted');
    expect(nad.decidedBy).toBe('admin@travisgautier.com');
    expect(e.amountCents).toBe(49900);
    expect(ne.cohortSlug).toBe('ai-delivery-2026-q3');
  });

  it('unit_schema_waitlist_email_notnull: cohort_waitlist.email column is NOT NULL', () => {
    const cfg = getTableConfig(schema.cohortWaitlist);
    const col = cfg.columns.find((c) => c.name === 'email');
    expect(col).toBeDefined();
    expect(col?.notNull).toBe(true);
  });

  it('unit_schema_waitlist_cohort_slug_notnull: cohort_waitlist.cohort_slug column is NOT NULL', () => {
    const cfg = getTableConfig(schema.cohortWaitlist);
    const col = cfg.columns.find((c) => c.name === 'cohort_slug');
    expect(col).toBeDefined();
    expect(col?.notNull).toBe(true);
  });

  it('unit_schema_waitlist_user_id_fk_set_null: cohort_waitlist.user_id FK has onDelete=set null', () => {
    const cfg = getTableConfig(schema.cohortWaitlist);
    expect(cfg.foreignKeys.length).toBeGreaterThan(0);
    const userFk = cfg.foreignKeys.find((fk) => {
      const ref = fk.reference();
      return ref.columns[0].name === 'user_id';
    });
    expect(userFk).toBeDefined();
    expect(userFk?.onDelete).toBe('set null');
  });

  it('unit_schema_waitlist_unique_email_cohort_index: cohort_waitlist has uniqueIndex on (email, cohort_slug)', () => {
    const cfg = getTableConfig(schema.cohortWaitlist);
    const uniqueIdx = cfg.indexes.find((i) => i.config.unique);
    expect(uniqueIdx).toBeDefined();
    const cols = (uniqueIdx?.config.columns ?? []).map((c: unknown) => (c as { name: string }).name);
    expect(cols).toContain('email');
    expect(cols).toContain('cohort_slug');
  });

  it('unit_schema_waitlist_cohort_slug_index: cohort_waitlist has non-unique index on cohort_slug', () => {
    const cfg = getTableConfig(schema.cohortWaitlist);
    const idx = cfg.indexes.find(
      (i) =>
        !i.config.unique &&
        (i.config.columns ?? []).some((c: unknown) => (c as { name: string }).name === 'cohort_slug'),
    );
    expect(idx).toBeDefined();
  });

  it('unit_schema_applications_user_id_fk_cascade: cohort_applications.user_id FK has onDelete=cascade', () => {
    const cfg = getTableConfig(schema.cohortApplications);
    const userFk = cfg.foreignKeys.find((fk) => {
      const ref = fk.reference();
      return ref.columns[0].name === 'user_id';
    });
    expect(userFk).toBeDefined();
    expect(userFk?.onDelete).toBe('cascade');
  });

  it('unit_schema_applications_waitlist_id_fk_set_null: cohort_applications.waitlist_id FK has onDelete=set null', () => {
    const cfg = getTableConfig(schema.cohortApplications);
    const waitlistFk = cfg.foreignKeys.find((fk) => {
      const ref = fk.reference();
      return ref.columns[0].name === 'waitlist_id';
    });
    expect(waitlistFk).toBeDefined();
    expect(waitlistFk?.onDelete).toBe('set null');
  });

  it('unit_schema_applications_unique_cohort_user_index: cohort_applications has uniqueIndex on (cohort_slug, user_id)', () => {
    const cfg = getTableConfig(schema.cohortApplications);
    const uniqueIdx = cfg.indexes.find((i) => {
      if (!i.config.unique) return false;
      const cols = (i.config.columns ?? []).map((c: unknown) => (c as { name: string }).name);
      return cols.includes('cohort_slug') && cols.includes('user_id');
    });
    expect(uniqueIdx).toBeDefined();
  });

  it('unit_schema_applications_cohort_decision_index: cohort_applications has index on (cohort_slug, decision)', () => {
    const cfg = getTableConfig(schema.cohortApplications);
    const idx = cfg.indexes.find((i) => {
      if (i.config.unique) return false;
      const cols = (i.config.columns ?? []).map((c: unknown) => (c as { name: string }).name);
      return cols.includes('cohort_slug') && cols.includes('decision');
    });
    expect(idx).toBeDefined();
  });

  it('unit_schema_applications_user_id_index: cohort_applications has index on user_id', () => {
    const cfg = getTableConfig(schema.cohortApplications);
    const idx = cfg.indexes.find((i) => {
      if (i.config.unique) return false;
      const cols = (i.config.columns ?? []).map((c: unknown) => (c as { name: string }).name);
      return cols.length === 1 && cols[0] === 'user_id';
    });
    expect(idx).toBeDefined();
  });

  it('unit_schema_applications_decision_default_pending: cohort_applications.decision column has default "pending"', () => {
    const cfg = getTableConfig(schema.cohortApplications);
    const col = cfg.columns.find((c) => c.name === 'decision');
    expect(col).toBeDefined();
    expect(col?.hasDefault).toBe(true);
    expect(col?.default).toBe('pending');
  });

  it('unit_schema_admissions_application_id_unique_fk_cascade: cohort_admissions.application_id is UNIQUE + FK with onDelete=cascade', () => {
    const cfg = getTableConfig(schema.cohortAdmissions);
    const col = cfg.columns.find((c) => c.name === 'application_id');
    expect(col).toBeDefined();
    expect(col?.notNull).toBe(true);
    expect(col?.isUnique).toBe(true);
    const fk = cfg.foreignKeys.find((f) => f.reference().columns[0].name === 'application_id');
    expect(fk).toBeDefined();
    expect(fk?.onDelete).toBe('cascade');
  });

  it('unit_schema_admissions_accepted_until_nullable: cohort_admissions.accepted_until is nullable', () => {
    const cfg = getTableConfig(schema.cohortAdmissions);
    const col = cfg.columns.find((c) => c.name === 'accepted_until');
    expect(col).toBeDefined();
    expect(col?.notNull).toBe(false);
  });

  it('unit_schema_enrollments_application_id_unique_fk_cascade: cohort_enrollments.application_id is UNIQUE + FK with onDelete=cascade', () => {
    const cfg = getTableConfig(schema.cohortEnrollments);
    const col = cfg.columns.find((c) => c.name === 'application_id');
    expect(col).toBeDefined();
    expect(col?.notNull).toBe(true);
    expect(col?.isUnique).toBe(true);
    const fk = cfg.foreignKeys.find((f) => f.reference().columns[0].name === 'application_id');
    expect(fk).toBeDefined();
    expect(fk?.onDelete).toBe('cascade');
  });

  it('unit_schema_enrollments_user_id_fk_cascade: cohort_enrollments.user_id FK has onDelete=cascade', () => {
    const cfg = getTableConfig(schema.cohortEnrollments);
    const fk = cfg.foreignKeys.find((f) => f.reference().columns[0].name === 'user_id');
    expect(fk).toBeDefined();
    expect(fk?.onDelete).toBe('cascade');
  });

  it('unit_schema_enrollments_stripe_session_id_unique: cohort_enrollments.stripe_session_id is NOT NULL + UNIQUE', () => {
    const cfg = getTableConfig(schema.cohortEnrollments);
    const col = cfg.columns.find((c) => c.name === 'stripe_session_id');
    expect(col).toBeDefined();
    expect(col?.notNull).toBe(true);
    expect(col?.isUnique).toBe(true);
  });

  it('unit_schema_enrollments_currency_default_usd: cohort_enrollments.currency column has default "usd"', () => {
    const cfg = getTableConfig(schema.cohortEnrollments);
    const col = cfg.columns.find((c) => c.name === 'currency');
    expect(col).toBeDefined();
    expect(col?.hasDefault).toBe(true);
    expect(col?.default).toBe('usd');
  });

  it('unit_schema_enrollments_user_id_index: cohort_enrollments has index on user_id', () => {
    const cfg = getTableConfig(schema.cohortEnrollments);
    const idx = cfg.indexes.find((i) => {
      const cols = (i.config.columns ?? []).map((c: unknown) => (c as { name: string }).name);
      return cols.length === 1 && cols[0] === 'user_id';
    });
    expect(idx).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────
// Integration tests (require DATABASE_URL — gated)
// ─────────────────────────────────────────────────────────────

const hasDb =
  typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.length > 0;

describe.skipIf(!hasDb)('cohort tables (integration)', () => {
  let db: typeof import('@/db/client').db;

  const truncateAll = async () => {
    await db.delete(schema.cohortEnrollments);
    await db.delete(schema.cohortAdmissions);
    await db.delete(schema.cohortApplications);
    await db.delete(schema.cohortWaitlist);
    await db.delete(schema.users);
  };

  const seedUser = async (email: string) => {
    const [u] = await db.insert(schema.users).values({ email }).returning();
    return u;
  };

  const seedApplication = async (cohortSlug = 'ai-delivery-2026-q3') => {
    const user = await seedUser(`applicant-${cohortSlug}-${Math.floor(Math.random() * 1e9)}@example.com`);
    const [app] = await db
      .insert(schema.cohortApplications)
      .values({
        cohortSlug,
        userId: user.id,
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'standard',
        commitmentHours: 6,
        timezone: 'America/New_York',
        pillarInterest: 'delivery',
      })
      .returning();
    return { user, app };
  };

  beforeAll(async () => {
    const mod = await import('@/db/client');
    db = mod.db;
  });

  beforeEach(truncateAll);
  afterAll(truncateAll);

  // ── Integration: round-trip inserts ──────────────────────────

  it('integration_insert_waitlist_round_trip: insert defaults; id uuid, createdAt near now, sourceTag/userId null', async () => {
    const before = Date.now();
    const [row] = await db
      .insert(schema.cohortWaitlist)
      .values({ email: 'a@example.com', cohortSlug: 'ai-delivery-2026-q3' })
      .returning();
    const after = Date.now();
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(row.sourceTag).toBeNull();
    expect(row.userId).toBeNull();
    expect(row.createdAt.getTime()).toBeGreaterThanOrEqual(before - 5000);
    expect(row.createdAt.getTime()).toBeLessThanOrEqual(after + 5000);
  });

  it('integration_insert_application_round_trip: valid commitmentLevel + pillarInterest; decision defaults pending; submittedAt near now', async () => {
    const user = await seedUser('applicant@example.com');
    const before = Date.now();
    const [row] = await db
      .insert(schema.cohortApplications)
      .values({
        cohortSlug: 'ai-delivery-2026-q3',
        userId: user.id,
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'standard',
        commitmentHours: 6,
        timezone: 'America/New_York',
        pillarInterest: 'delivery',
      })
      .returning();
    const after = Date.now();
    expect(row.decision).toBe('pending');
    expect(row.submittedAt.getTime()).toBeGreaterThanOrEqual(before - 5000);
    expect(row.submittedAt.getTime()).toBeLessThanOrEqual(after + 5000);
  });

  it('integration_insert_admission_round_trip: insert admission; decidedAt defaults now; decisionNote+acceptedUntil null', async () => {
    const { app } = await seedApplication();
    const before = Date.now();
    const [row] = await db
      .insert(schema.cohortAdmissions)
      .values({
        applicationId: app.id,
        decidedBy: 'admin@travisgautier.com',
        decision: 'accepted',
      })
      .returning();
    const after = Date.now();
    expect(row.decisionNote).toBeNull();
    expect(row.acceptedUntil).toBeNull();
    expect(row.decidedAt.getTime()).toBeGreaterThanOrEqual(before - 5000);
    expect(row.decidedAt.getTime()).toBeLessThanOrEqual(after + 5000);
  });

  it('integration_insert_enrollment_round_trip: insert enrollment; currency defaults usd; paidAt near now', async () => {
    const { user, app } = await seedApplication();
    const before = Date.now();
    const [row] = await db
      .insert(schema.cohortEnrollments)
      .values({
        applicationId: app.id,
        cohortSlug: app.cohortSlug,
        userId: user.id,
        stripeSessionId: 'cs_test_round_trip_1',
        stripePaymentIntentId: 'pi_test_round_trip_1',
        amountCents: 49900,
      })
      .returning();
    const after = Date.now();
    expect(row.currency).toBe('usd');
    expect(row.paidAt.getTime()).toBeGreaterThanOrEqual(before - 5000);
    expect(row.paidAt.getTime()).toBeLessThanOrEqual(after + 5000);
  });

  // ── Integration: UNIQUE constraints ─────────────────────────

  it('integration_waitlist_unique_email_cohort: duplicate (email,cohort_slug) rejects; (email,diff-slug) and (diff-email,slug) succeed', async () => {
    await db
      .insert(schema.cohortWaitlist)
      .values({ email: 'dup@example.com', cohortSlug: 'cohort-a' });
    await expect(
      db
        .insert(schema.cohortWaitlist)
        .values({ email: 'dup@example.com', cohortSlug: 'cohort-a' }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(schema.cohortWaitlist)
        .values({ email: 'dup@example.com', cohortSlug: 'cohort-b' }),
    ).resolves.toBeDefined();
    await expect(
      db
        .insert(schema.cohortWaitlist)
        .values({ email: 'other@example.com', cohortSlug: 'cohort-a' }),
    ).resolves.toBeDefined();
  });

  it('integration_applications_unique_cohort_user: dup (cohort_slug,user_id) rejects; same user+diff cohort ok; diff user+same cohort ok', async () => {
    const userA = await seedUser('userA@example.com');
    const userB = await seedUser('userB@example.com');
    await db.insert(schema.cohortApplications).values({
      cohortSlug: 'cohort-x',
      userId: userA.id,
      background: 'bg',
      goals: 'goals',
      commitmentLevel: 'standard',
      commitmentHours: 6,
      timezone: 'UTC',
      pillarInterest: 'delivery',
    });
    await expect(
      db.insert(schema.cohortApplications).values({
        cohortSlug: 'cohort-x',
        userId: userA.id,
        background: 'bg2',
        goals: 'goals2',
        commitmentLevel: 'light',
        commitmentHours: 3,
        timezone: 'UTC',
        pillarInterest: 'workflow',
      }),
    ).rejects.toThrow();
    await expect(
      db.insert(schema.cohortApplications).values({
        cohortSlug: 'cohort-y',
        userId: userA.id,
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'standard',
        commitmentHours: 6,
        timezone: 'UTC',
        pillarInterest: 'delivery',
      }),
    ).resolves.toBeDefined();
    await expect(
      db.insert(schema.cohortApplications).values({
        cohortSlug: 'cohort-x',
        userId: userB.id,
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'standard',
        commitmentHours: 6,
        timezone: 'UTC',
        pillarInterest: 'delivery',
      }),
    ).resolves.toBeDefined();
  });

  it('integration_admissions_unique_application_id: second admission for same application rejects', async () => {
    const { app } = await seedApplication();
    await db
      .insert(schema.cohortAdmissions)
      .values({ applicationId: app.id, decidedBy: 'admin@x.co', decision: 'accepted' });
    await expect(
      db
        .insert(schema.cohortAdmissions)
        .values({ applicationId: app.id, decidedBy: 'admin@x.co', decision: 'declined' }),
    ).rejects.toThrow();
  });

  it('integration_enrollments_unique_stripe_session_id: duplicate stripe_session_id rejects', async () => {
    const { user, app } = await seedApplication();
    await db.insert(schema.cohortEnrollments).values({
      applicationId: app.id,
      cohortSlug: app.cohortSlug,
      userId: user.id,
      stripeSessionId: 'cs_dup_1',
      stripePaymentIntentId: 'pi_dup_1',
      amountCents: 49900,
    });
    // To trigger ONLY stripe_session_id uniqueness (not application_id), we need a different app
    const { user: u2, app: app2 } = await seedApplication('cohort-z');
    await expect(
      db.insert(schema.cohortEnrollments).values({
        applicationId: app2.id,
        cohortSlug: app2.cohortSlug,
        userId: u2.id,
        stripeSessionId: 'cs_dup_1',
        stripePaymentIntentId: 'pi_dup_2',
        amountCents: 49900,
      }),
    ).rejects.toThrow();
  });

  it('integration_enrollments_unique_application_id: second enrollment for same application rejects', async () => {
    const { user, app } = await seedApplication();
    await db.insert(schema.cohortEnrollments).values({
      applicationId: app.id,
      cohortSlug: app.cohortSlug,
      userId: user.id,
      stripeSessionId: 'cs_unique_app_1',
      stripePaymentIntentId: 'pi_unique_app_1',
      amountCents: 49900,
    });
    await expect(
      db.insert(schema.cohortEnrollments).values({
        applicationId: app.id,
        cohortSlug: app.cohortSlug,
        userId: user.id,
        stripeSessionId: 'cs_unique_app_2',
        stripePaymentIntentId: 'pi_unique_app_2',
        amountCents: 49900,
      }),
    ).rejects.toThrow();
  });

  it('integration_waitlist_link_to_application: application.waitlist_id correctly references waitlist row', async () => {
    const user = await seedUser('waitlinked@example.com');
    const [w] = await db
      .insert(schema.cohortWaitlist)
      .values({ email: 'waitlinked@example.com', cohortSlug: 'cohort-link', userId: user.id })
      .returning();
    const [a] = await db
      .insert(schema.cohortApplications)
      .values({
        cohortSlug: 'cohort-link',
        userId: user.id,
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'standard',
        commitmentHours: 6,
        timezone: 'UTC',
        pillarInterest: 'delivery',
        waitlistId: w.id,
      })
      .returning();
    expect(a.waitlistId).toBe(w.id);
  });

  // ── Edge cases (input + state) ───────────────────────────────

  it('edge_state_waitlist_user_id_null_allowed: anonymous waitlist join with user_id=null succeeds', async () => {
    const [row] = await db
      .insert(schema.cohortWaitlist)
      .values({ email: 'anon@example.com', cohortSlug: 'cohort-anon' })
      .returning();
    expect(row.userId).toBeNull();
  });

  it('edge_state_waitlist_user_id_invalid_fk_throws: cohort_waitlist insert with non-existent user_id throws FK violation', async () => {
    await expect(
      db.insert(schema.cohortWaitlist).values({
        email: 'orphan@example.com',
        cohortSlug: 'cohort-orphan',
        userId: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toThrow();
  });

  it('edge_input_applications_invalid_commitment_level: commitmentLevel="bogus" rejects with CHECK violation', async () => {
    const user = await seedUser('bad-level@example.com');
    await expect(
      db.insert(schema.cohortApplications).values({
        cohortSlug: 'cohort-q',
        userId: user.id,
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'bogus',
        commitmentHours: 6,
        timezone: 'UTC',
        pillarInterest: 'delivery',
      }),
    ).rejects.toThrow();
  });

  it('edge_input_applications_invalid_pillar_interest: pillarInterest="marketing" rejects with CHECK violation', async () => {
    const user = await seedUser('bad-pillar@example.com');
    await expect(
      db.insert(schema.cohortApplications).values({
        cohortSlug: 'cohort-q',
        userId: user.id,
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'standard',
        commitmentHours: 6,
        timezone: 'UTC',
        pillarInterest: 'marketing',
      }),
    ).rejects.toThrow();
  });

  it('edge_input_applications_invalid_decision: decision="foo" rejects with CHECK violation', async () => {
    const user = await seedUser('bad-decision@example.com');
    await expect(
      db.insert(schema.cohortApplications).values({
        cohortSlug: 'cohort-q',
        userId: user.id,
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'standard',
        commitmentHours: 6,
        timezone: 'UTC',
        pillarInterest: 'delivery',
        decision: 'foo',
      }),
    ).rejects.toThrow();
  });

  it('edge_state_applications_user_fk_required: insert with non-existent user_id throws FK violation', async () => {
    await expect(
      db.insert(schema.cohortApplications).values({
        cohortSlug: 'cohort-q',
        userId: '00000000-0000-0000-0000-000000000000',
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'standard',
        commitmentHours: 6,
        timezone: 'UTC',
        pillarInterest: 'delivery',
      }),
    ).rejects.toThrow();
  });

  it('edge_input_admissions_pending_decision_rejected: decision="pending" rejects with CHECK violation (admissions excludes pending)', async () => {
    const { app } = await seedApplication();
    await expect(
      db.insert(schema.cohortAdmissions).values({
        applicationId: app.id,
        decidedBy: 'admin@x.co',
        decision: 'pending',
      }),
    ).rejects.toThrow();
  });

  it('edge_state_admissions_accepted_until_nullable_for_waitlisted: decision="waitlisted", acceptedUntil=null succeeds', async () => {
    const { app } = await seedApplication();
    const [row] = await db
      .insert(schema.cohortAdmissions)
      .values({
        applicationId: app.id,
        decidedBy: 'admin@x.co',
        decision: 'waitlisted',
      })
      .returning();
    expect(row.acceptedUntil).toBeNull();
    expect(row.decision).toBe('waitlisted');
  });

  it('edge_state_admissions_application_fk_required: insert with non-existent application_id throws FK violation', async () => {
    await expect(
      db.insert(schema.cohortAdmissions).values({
        applicationId: '00000000-0000-0000-0000-000000000000',
        decidedBy: 'admin@x.co',
        decision: 'accepted',
      }),
    ).rejects.toThrow();
  });

  it('edge_state_enrollments_application_fk_required: insert with non-existent application_id throws FK violation', async () => {
    const user = await seedUser('enroll-fk@example.com');
    await expect(
      db.insert(schema.cohortEnrollments).values({
        applicationId: '00000000-0000-0000-0000-000000000000',
        cohortSlug: 'cohort-fk',
        userId: user.id,
        stripeSessionId: 'cs_fk_1',
        stripePaymentIntentId: 'pi_fk_1',
        amountCents: 49900,
      }),
    ).rejects.toThrow();
  });

  it('edge_state_enrollments_user_fk_required: insert with non-existent user_id throws FK violation', async () => {
    const { app } = await seedApplication();
    await expect(
      db.insert(schema.cohortEnrollments).values({
        applicationId: app.id,
        cohortSlug: app.cohortSlug,
        userId: '00000000-0000-0000-0000-000000000000',
        stripeSessionId: 'cs_fk_2',
        stripePaymentIntentId: 'pi_fk_2',
        amountCents: 49900,
      }),
    ).rejects.toThrow();
  });

  it('edge_input_enrollments_amount_cents_integer: amount_cents stored as integer for 0,1,4900,999999', async () => {
    const inputs = [0, 1, 4900, 999999];
    for (const amt of inputs) {
      const { user, app } = await seedApplication(`cohort-int-${amt}`);
      const [row] = await db
        .insert(schema.cohortEnrollments)
        .values({
          applicationId: app.id,
          cohortSlug: app.cohortSlug,
          userId: user.id,
          stripeSessionId: `cs_int_${amt}`,
          stripePaymentIntentId: `pi_int_${amt}`,
          amountCents: amt,
        })
        .returning();
      expect(row.amountCents).toBe(amt);
      expect(Number.isInteger(row.amountCents)).toBe(true);
    }
  });

  // ── Data integrity (cascade + consistency + serialization) ─

  it('data_cascade_user_delete_removes_applications: deleting a user cascades to cohort_applications', async () => {
    const { user, app } = await seedApplication();
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    const rows = await db
      .select()
      .from(schema.cohortApplications)
      .where(eq(schema.cohortApplications.id, app.id));
    expect(rows).toHaveLength(0);
  });

  it('data_cascade_user_delete_removes_enrollments: deleting a user cascades to cohort_enrollments', async () => {
    const { user, app } = await seedApplication();
    await db.insert(schema.cohortEnrollments).values({
      applicationId: app.id,
      cohortSlug: app.cohortSlug,
      userId: user.id,
      stripeSessionId: 'cs_cascade_user_1',
      stripePaymentIntentId: 'pi_cascade_user_1',
      amountCents: 49900,
    });
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    const rows = await db
      .select()
      .from(schema.cohortEnrollments)
      .where(eq(schema.cohortEnrollments.userId, user.id));
    expect(rows).toHaveLength(0);
  });

  it('data_setnull_user_delete_nulls_waitlist_user_id: deleting a user with waitlist rows sets user_id to null (row preserved)', async () => {
    const user = await seedUser('waitlist-setnull@example.com');
    const [w] = await db
      .insert(schema.cohortWaitlist)
      .values({
        email: 'waitlist-setnull-2@example.com',
        cohortSlug: 'cohort-setnull',
        userId: user.id,
      })
      .returning();
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    const rows = await db
      .select()
      .from(schema.cohortWaitlist)
      .where(eq(schema.cohortWaitlist.id, w.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBeNull();
  });

  it('data_cascade_application_delete_removes_admission: deleting cohort_applications row cascades to cohort_admissions', async () => {
    const { app } = await seedApplication();
    await db.insert(schema.cohortAdmissions).values({
      applicationId: app.id,
      decidedBy: 'admin@x.co',
      decision: 'accepted',
    });
    await db.delete(schema.cohortApplications).where(eq(schema.cohortApplications.id, app.id));
    const rows = await db
      .select()
      .from(schema.cohortAdmissions)
      .where(eq(schema.cohortAdmissions.applicationId, app.id));
    expect(rows).toHaveLength(0);
  });

  it('data_cascade_application_delete_removes_enrollment: deleting cohort_applications row cascades to cohort_enrollments', async () => {
    const { user, app } = await seedApplication();
    await db.insert(schema.cohortEnrollments).values({
      applicationId: app.id,
      cohortSlug: app.cohortSlug,
      userId: user.id,
      stripeSessionId: 'cs_cascade_app_1',
      stripePaymentIntentId: 'pi_cascade_app_1',
      amountCents: 49900,
    });
    await db.delete(schema.cohortApplications).where(eq(schema.cohortApplications.id, app.id));
    const rows = await db
      .select()
      .from(schema.cohortEnrollments)
      .where(eq(schema.cohortEnrollments.applicationId, app.id));
    expect(rows).toHaveLength(0);
  });

  it('data_setnull_waitlist_delete_nulls_application_waitlist_id: deleting waitlist row sets application.waitlist_id to null', async () => {
    const user = await seedUser('app-waitnull@example.com');
    const [w] = await db
      .insert(schema.cohortWaitlist)
      .values({ email: 'app-waitnull@example.com', cohortSlug: 'cohort-waitnull', userId: user.id })
      .returning();
    const [a] = await db
      .insert(schema.cohortApplications)
      .values({
        cohortSlug: 'cohort-waitnull',
        userId: user.id,
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'standard',
        commitmentHours: 6,
        timezone: 'UTC',
        pillarInterest: 'delivery',
        waitlistId: w.id,
      })
      .returning();
    await db.delete(schema.cohortWaitlist).where(eq(schema.cohortWaitlist.id, w.id));
    const rows = await db
      .select()
      .from(schema.cohortApplications)
      .where(eq(schema.cohortApplications.id, a.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].waitlistId).toBeNull();
  });

  it('data_consistency_uuid_defaults_distinct: 10 cohort_waitlist inserts produce 10 unique uuids', async () => {
    const batch = Array.from({ length: 10 }).map((_, i) => ({
      email: `uuid-${i}@example.com`,
      cohortSlug: 'cohort-uuid',
    }));
    const rows = await db.insert(schema.cohortWaitlist).values(batch).returning();
    const ids = rows.map((r) => r.id);
    expect(new Set(ids).size).toBe(10);
    for (const id of ids) {
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }
  });

  it('data_returning_clause_matches_insert_shape: .returning() yields rows matching $inferSelect for each table', async () => {
    const [w] = await db
      .insert(schema.cohortWaitlist)
      .values({ email: 'shape@example.com', cohortSlug: 'cohort-shape' })
      .returning();
    expect(w).toHaveProperty('id');
    expect(w).toHaveProperty('email');
    expect(w).toHaveProperty('cohortSlug');
    expect(w).toHaveProperty('sourceTag');
    expect(w).toHaveProperty('userId');
    expect(w).toHaveProperty('createdAt');
    expect(w.createdAt).toBeInstanceOf(Date);

    const user = await seedUser('shape-app@example.com');
    const [a] = await db
      .insert(schema.cohortApplications)
      .values({
        cohortSlug: 'cohort-shape',
        userId: user.id,
        background: 'bg',
        goals: 'goals',
        commitmentLevel: 'standard',
        commitmentHours: 6,
        timezone: 'UTC',
        pillarInterest: 'delivery',
      })
      .returning();
    expect(a).toHaveProperty('decision');
    expect(a).toHaveProperty('submittedAt');
    expect(a.submittedAt).toBeInstanceOf(Date);
    expect(typeof a.decision).toBe('string');

    const [d] = await db
      .insert(schema.cohortAdmissions)
      .values({ applicationId: a.id, decidedBy: 'admin@x.co', decision: 'accepted' })
      .returning();
    expect(d).toHaveProperty('decidedAt');
    expect(d.decidedAt).toBeInstanceOf(Date);

    const [e] = await db
      .insert(schema.cohortEnrollments)
      .values({
        applicationId: a.id,
        cohortSlug: a.cohortSlug,
        userId: user.id,
        stripeSessionId: 'cs_shape_1',
        stripePaymentIntentId: 'pi_shape_1',
        amountCents: 49900,
      })
      .returning();
    expect(e).toHaveProperty('amountCents');
    expect(e).toHaveProperty('currency');
    expect(e).toHaveProperty('paidAt');
    expect(typeof e.amountCents).toBe('number');
    expect(e.paidAt).toBeInstanceOf(Date);
  });
});
