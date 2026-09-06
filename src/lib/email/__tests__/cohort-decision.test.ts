import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type React from 'react';

vi.hoisted(() => {
  if (!process.env.COHORT_CHECKOUT_SECRET) {
    process.env.COHORT_CHECKOUT_SECRET = 'test-cohort-checkout-secret-32b!';
  }
  return {};
});

const mockSend = vi.fn();
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: (...args: unknown[]) => mockSend(...args) },
  })),
}));

function makeCohort() {
  return {
    meta: {
      id: 'cohort-id-1',
      slug: 'ai-delivery-2026-q3',
      title: 'AI Delivery — Q3 2026',
      series: 'ai-delivery',
      tagline: 't',
      summary: 's',
      status: 'open' as const,
      pillar: 'delivery' as const,
      startDate: '2026-07-01',
      endDate: '2026-09-01',
      durationWeeks: 8,
      capacity: 12,
      priceCents: 200000,
      currency: 'usd',
      stripePriceId: 'price_real_abc',
      commitmentHoursPerWeek: 10,
      lllEntryUrls: [],
      relatedEpisodeIds: [],
      relatedCaseIds: [],
      publishedAt: '2026-06-01',
    },
    slug: 'ai-delivery-2026-q3',
    Component: (() => null) as unknown as React.ComponentType,
    body: '',
  };
}

function makeApplication() {
  return {
    id: 'app-uuid-1',
    userId: 'user-1',
    userEmail: 'applicant@example.com',
    cohortSlug: 'ai-delivery-2026-q3',
    waitlistId: null,
    decision: 'pending',
    submittedAt: new Date('2026-06-01T00:00:00Z'),
    commitmentLevel: 'standard',
    commitmentHours: 10,
    timezone: 'UTC',
    pillarInterest: 'delivery',
    background: 'bg',
    goals: 'g',
    referralSource: null,
  };
}

describe('sendCohortDecision', () => {
  let originalApiKey: string | undefined;
  let originalFrom: string | undefined;
  let originalAuthUrl: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null });
    originalApiKey = process.env.RESEND_API_KEY;
    originalFrom = process.env.RESEND_FROM_COHORTS;
    originalAuthUrl = process.env.AUTH_URL;
    process.env.RESEND_API_KEY = 're_test_stub';
    process.env.RESEND_FROM_COHORTS = 'cohorts@travisgautier.com';
    process.env.AUTH_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.RESEND_FROM_COHORTS;
    else process.env.RESEND_FROM_COHORTS = originalFrom;
    if (originalAuthUrl === undefined) delete process.env.AUTH_URL;
    else process.env.AUTH_URL = originalAuthUrl;
  });

  it("email_accepted_signs_token_and_includes_url: accepted with acceptedUntil sends `You're in — <title>` and body has signed checkout URL", async () => {
    const { sendCohortDecision } = await import('../cohort-decision');
    const acceptedUntil = new Date(Date.now() + 14 * 86_400_000);
    await sendCohortDecision({
      to: 'applicant@example.com',
      decision: 'accepted',
      application: makeApplication(),
      cohort: makeCohort(),
      acceptedUntil,
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const args = mockSend.mock.calls[0][0];
    expect(args.subject).toContain("You're in");
    expect(args.subject).toContain('AI Delivery — Q3 2026');
    expect(String(args.html)).toContain('/cohorts/ai-delivery-2026-q3/checkout?token=');
    expect(String(args.text)).toContain('/cohorts/ai-delivery-2026-q3/checkout?token=');
  });

  it('email_accepted_null_acceptedUntil_throws: accepted with null acceptedUntil throws', async () => {
    const { sendCohortDecision } = await import('../cohort-decision');
    await expect(
      sendCohortDecision({
        to: 'applicant@example.com',
        decision: 'accepted',
        application: makeApplication(),
        cohort: makeCohort(),
        acceptedUntil: null,
      }),
    ).rejects.toThrow();
  });

  it('email_waitlisted_subject_and_no_checkout: waitlisted sends `Waitlisted — <title>` body with no checkout URL', async () => {
    const { sendCohortDecision } = await import('../cohort-decision');
    await sendCohortDecision({
      to: 'applicant@example.com',
      decision: 'waitlisted',
      application: makeApplication(),
      cohort: makeCohort(),
      acceptedUntil: null,
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const args = mockSend.mock.calls[0][0];
    expect(args.subject).toContain('Waitlisted');
    expect(args.subject).toContain('AI Delivery — Q3 2026');
    expect(String(args.html)).not.toContain('/checkout?token=');
    expect(String(args.text)).not.toContain('/checkout?token=');
  });

  it('email_declined_subject_and_no_checkout: declined sends `Update on your application — <title>`, no checkout URL', async () => {
    const { sendCohortDecision } = await import('../cohort-decision');
    await sendCohortDecision({
      to: 'applicant@example.com',
      decision: 'declined',
      application: makeApplication(),
      cohort: makeCohort(),
      acceptedUntil: null,
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const args = mockSend.mock.calls[0][0];
    expect(args.subject).toContain('Update on your application');
    expect(args.subject).toContain('AI Delivery — Q3 2026');
    expect(String(args.html)).not.toContain('/checkout?token=');
    expect(String(args.text)).not.toContain('/checkout?token=');
  });

  it('email_missing_env_silent_return: missing RESEND_API_KEY or RESEND_FROM_COHORTS → silent return, no Resend call', async () => {
    delete process.env.RESEND_API_KEY;
    const { sendCohortDecision } = await import('../cohort-decision');
    await sendCohortDecision({
      to: 'applicant@example.com',
      decision: 'waitlisted',
      application: makeApplication(),
      cohort: makeCohort(),
      acceptedUntil: null,
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('err_email_send_failure_does_not_throw: Resend returns error → caller does not see it (best-effort)', async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: 'rate limited' } });
    const { sendCohortDecision } = await import('../cohort-decision');
    await expect(
      sendCohortDecision({
        to: 'applicant@example.com',
        decision: 'waitlisted',
        application: makeApplication(),
        cohort: makeCohort(),
        acceptedUntil: null,
      }),
    ).resolves.toBeUndefined();
  });
});
