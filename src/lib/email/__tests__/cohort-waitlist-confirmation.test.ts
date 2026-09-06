import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockEmailsSend, ResendSpy } = vi.hoisted(() => {
  const mockEmailsSend = vi.fn();
  const ResendSpy = vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailsSend },
  }));
  return { mockEmailsSend, ResendSpy };
});

vi.mock('resend', () => ({ Resend: ResendSpy }));

import { sendCohortWaitlistConfirmation } from '../cohort-waitlist-confirmation';

const COHORT_FIXTURE = {
  meta: {
    id: 'cohort-ai-delivery-2026-q3',
    slug: 'ai-delivery-2026-q3',
    title: 'AI Delivery Intensive',
    summary: 'Ship real AI projects in 6 weeks.',
    series: 'AI Delivery',
    tagline: 'tagline',
    status: 'announced' as const,
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

describe('sendCohortWaitlistConfirmation', () => {
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

  it('unit_email_missing_api_key_silent', async () => {
    delete process.env.RESEND_API_KEY;
    await expect(
      sendCohortWaitlistConfirmation({
        to: 'u@x.co',
        cohort: COHORT_FIXTURE,
      }),
    ).resolves.toBeUndefined();
    expect(ResendSpy).not.toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it('unit_email_missing_from_silent', async () => {
    delete process.env.RESEND_FROM_COHORTS;
    await expect(
      sendCohortWaitlistConfirmation({
        to: 'u@x.co',
        cohort: COHORT_FIXTURE,
      }),
    ).resolves.toBeUndefined();
    expect(ResendSpy).not.toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  // --- Unit: subject + body content ---

  it('unit_email_subject_includes_title', async () => {
    await sendCohortWaitlistConfirmation({
      to: 'u@x.co',
      cohort: COHORT_FIXTURE,
    });
    expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.subject).toContain('AI Delivery Intensive');
    expect(call.subject).toMatch(/waitlist/i);
  });

  it('unit_email_text_contains_duration_and_date', async () => {
    await sendCohortWaitlistConfirmation({
      to: 'u@x.co',
      cohort: COHORT_FIXTURE,
    });
    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.text).toContain('September 14, 2026');
    expect(call.text).toContain('6 weeks');
    expect(call.text).toContain('10');
  });

  it('unit_email_text_contains_auth_url_detail_link', async () => {
    await sendCohortWaitlistConfirmation({
      to: 'u@x.co',
      cohort: COHORT_FIXTURE,
    });
    const call = mockEmailsSend.mock.calls[0][0];
    expect(call.text).toContain(
      'https://travisgautier.test/cohorts/ai-delivery-2026-q3',
    );
  });

  // --- Integration ---

  it('integration_email_calls_resend_send', async () => {
    await sendCohortWaitlistConfirmation({
      to: 'recipient@example.com',
      cohort: COHORT_FIXTURE,
    });
    expect(ResendSpy).toHaveBeenCalledWith('rk_test_abc');
    expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    const call = mockEmailsSend.mock.calls[0][0];
    expect(call).toMatchObject({
      from: 'cohorts@travisgautier.test',
      to: 'recipient@example.com',
    });
    expect(typeof call.subject).toBe('string');
    expect(typeof call.text).toBe('string');
    expect(typeof call.html).toBe('string');
  });

  // --- Security ---

  it('sec_info_disclosure_html_escape_in_subject_and_body', async () => {
    const malicious = {
      ...COHORT_FIXTURE,
      meta: {
        ...COHORT_FIXTURE.meta,
        title: '<script>alert("xss")</script>',
      },
    };
    await sendCohortWaitlistConfirmation({
      to: 'u@x.co',
      cohort: malicious,
    });
    const call = mockEmailsSend.mock.calls[0][0];
    // HTML body must escape the script tag
    expect(call.html).not.toContain('<script>alert(');
    expect(call.html).toMatch(/&lt;script&gt;/);
  });

  // --- Edge ---

  it('edge_temporal_format_date_utc_anchor', async () => {
    // formatDate must use UTC anchor so test-runner TZ does not shift the date.
    // We verify the literal string regardless of process.env.TZ.
    const originalTZ = process.env.TZ;
    try {
      process.env.TZ = 'Asia/Tokyo';
      await sendCohortWaitlistConfirmation({
        to: 'u@x.co',
        cohort: COHORT_FIXTURE,
      });
      const call1 = mockEmailsSend.mock.calls[0][0];
      expect(call1.text).toContain('September 14, 2026');

      mockEmailsSend.mockClear();
      process.env.TZ = 'America/New_York';
      await sendCohortWaitlistConfirmation({
        to: 'u@x.co',
        cohort: COHORT_FIXTURE,
      });
      const call2 = mockEmailsSend.mock.calls[0][0];
      expect(call2.text).toContain('September 14, 2026');
    } finally {
      if (originalTZ === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTZ;
      }
    }
  });
});
