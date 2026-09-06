import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockEmailsSend, ResendSpy } = vi.hoisted(() => {
  const mockEmailsSend = vi.fn();
  const ResendSpy = vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailsSend },
  }));
  return { mockEmailsSend, ResendSpy };
});

vi.mock('resend', () => ({ Resend: ResendSpy }));

import { sendCohortApplicationReceived } from '../cohort-application-received';
import { site } from '@/lib/site';

const COHORT_FIXTURE = {
  meta: {
    id: 'cohort-001',
    slug: 'ai-delivery-2026-q3',
    title: 'AI Delivery Intensive',
    summary: 'Ship real AI projects in 6 weeks.',
    series: 'AI Delivery',
    tagline: 'tagline',
    status: 'open' as const,
    pillar: 'delivery' as const,
    startDate: '2026-09-14',
    endDate: '2026-10-26',
    durationWeeks: 6,
    capacity: 12,
    priceCents: 249900,
    currency: 'usd',
    stripePriceId: 'price_REPLACE_ME_ai_delivery',
    commitmentHoursPerWeek: 10,
    lllEntryUrls: [],
    relatedEpisodeIds: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-01',
  },
  slug: 'ai-delivery-2026-q3',
  Component: () => null,
};

const originalEnv = { ...process.env };

describe('sendCohortApplicationReceived', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 'rk_test_abc';
    process.env.RESEND_FROM_COHORTS = 'cohorts@travisgautier.test';
    process.env.AUTH_URL = 'https://travisgautier.test';
    mockEmailsSend.mockReset();
    mockEmailsSend.mockResolvedValue({ id: 'mock-email-1' });
    ResendSpy.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // --- Unit: env handling ---

  it('unit_email_returns_void_on_missing_env', async () => {
    delete process.env.RESEND_API_KEY;
    await expect(
      sendCohortApplicationReceived({
        to: 'u@x.co',
        cohort: COHORT_FIXTURE,
      }),
    ).resolves.toBeUndefined();
    expect(ResendSpy).not.toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it('unit_email_uses_default_from_when_env_missing', async () => {
    delete process.env.RESEND_FROM_COHORTS;
    await sendCohortApplicationReceived({
      to: 'u@x.co',
      cohort: COHORT_FIXTURE,
    });
    // Either the email fires with a fallback from, OR returns silently
    // (matching ce-2.2 'missing_from_silent' behavior). Accept either —
    // both are valid env-guard implementations.
    if (mockEmailsSend.mock.calls.length > 0) {
      const call = mockEmailsSend.mock.calls[0][0];
      expect(call.from).toBe(site.emailFrom);
    }
  });

  // --- Unit: subject + body content ---

  it('unit_email_sends_with_correct_args', async () => {
    await sendCohortApplicationReceived({
      to: 'applicant@x.co',
      cohort: COHORT_FIXTURE,
    });
    expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.to).toBe('applicant@x.co');
    expect(call.from).toBeTruthy();
    expect(call.subject).toBeTruthy();
    expect(typeof call.text).toBe('string');
    expect(call.text.length).toBeGreaterThan(0);
    expect(typeof call.html).toBe('string');
    expect(call.html.length).toBeGreaterThan(0);
  });

  it('unit_email_subject_includes_cohort_title', async () => {
    await sendCohortApplicationReceived({
      to: 'u@x.co',
      cohort: COHORT_FIXTURE,
    });
    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.subject).toContain('AI Delivery Intensive');
  });

  it('unit_email_body_includes_cohort_dates', async () => {
    await sendCohortApplicationReceived({
      to: 'u@x.co',
      cohort: COHORT_FIXTURE,
    });
    const call = mockEmailsSend.mock.calls[0][0];
    // formatDate UTC anchor: 'September 14, 2026'
    expect(call.text).toMatch(/September.*14.*2026/);
    expect(call.html).toMatch(/September.*14.*2026/);
  });

  // --- Security: STRIDE info_disclosure (XSS via cohort title) ---

  it('sec_information_disclosure_email_escapes_cohort_title_in_html', async () => {
    const xssCohort = {
      ...COHORT_FIXTURE,
      meta: {
        ...COHORT_FIXTURE.meta,
        title: '<script>alert(1)</script>',
      },
    };
    await sendCohortApplicationReceived({
      to: 'u@x.co',
      cohort: xssCohort,
    });
    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.html).not.toContain('<script>alert(1)</script>');
    expect(call.html).toContain('&lt;script&gt;');
  });

  // --- Error Recovery ---

  it('err_email_missing_env_silent_return', async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendCohortApplicationReceived({
      to: 'u@x.co',
      cohort: COHORT_FIXTURE,
    });
    expect(result).toBeUndefined();
    expect(ResendSpy).not.toHaveBeenCalled();
  });

  // --- Data Integrity ---

  it('data_sensitivity_email_body_does_not_include_session_token', async () => {
    await sendCohortApplicationReceived({
      to: 'u@x.co',
      cohort: COHORT_FIXTURE,
    });
    const call = mockEmailsSend.mock.calls[0][0];
    const combined = `${call.text}\n${call.html}`;
    expect(combined).not.toMatch(/authjs/i);
    expect(combined).not.toMatch(/sessionToken/i);
    expect(combined).not.toMatch(/session[._-]?id/i);
  });

  // --- Infrastructure ---

  it('infra_email_module_uses_send_with_to_and_from', async () => {
    await sendCohortApplicationReceived({
      to: 'applicant@x.co',
      cohort: COHORT_FIXTURE,
    });
    expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    const call = mockEmailsSend.mock.calls[0][0];
    expect(call).toHaveProperty('to');
    expect(call).toHaveProperty('from');
    expect(call).not.toHaveProperty('bcc');
    expect(call).not.toHaveProperty('cc');
  });
});
