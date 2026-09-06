import { Resend } from 'resend';
import type { LoadedEntry } from '@/lib/content/loader';
import type { Cohort } from '@/content/schemas';
import type { ApplicationListRow, AdminDecision } from '@/lib/cohorts/admin';
import { signCheckoutToken } from '@/lib/cohorts/checkout-token';
import { site } from '@/lib/site';

export interface SendCohortDecisionOptions {
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

function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00Z`) : value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
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
    'This link is single-use and expires at the date above.',
    '',
    site.emailSignature,
  ].join('\n');

  const html = `<!doctype html>
<html lang="en"><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#faf8f3;color:#0a0a0a;margin:0;padding:32px">
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
      single-use and expires at the date above.
    </p>
    <p style="font-size:12px;color:#475569;margin:24px 0 0">${site.emailSignature}</p>
  </div>
</body></html>`;

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
    site.emailSignature,
  ].join('\n');

  const html = `<!doctype html>
<html lang="en"><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#faf8f3;color:#0a0a0a;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px">
    <h1 style="font-size:22px;margin:0 0 16px">Waitlisted</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      Thanks for applying to <strong>${escapeHtml(meta.title)}</strong>. We
      received more strong applications than we have seats for this run.
      You're on the waitlist and we will reach out if a seat opens up.
    </p>
    <p style="font-size:12px;color:#475569;margin:24px 0 0">${site.emailSignature}</p>
  </div>
</body></html>`;

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
    "cohort run's capacity and mix — not a judgment on your project.",
    '',
    site.emailSignature,
  ].join('\n');

  const html = `<!doctype html>
<html lang="en"><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#faf8f3;color:#0a0a0a;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px">
    <h1 style="font-size:22px;margin:0 0 16px">Thanks for applying</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      Thanks for putting the work into a real application for
      <strong>${escapeHtml(meta.title)}</strong>. We aren't able to offer you a
      seat in this cohort.
    </p>
    <p style="font-size:12px;color:#475569;margin:24px 0 0">${site.emailSignature}</p>
  </div>
</body></html>`;

  return { text, html };
}

export async function sendCohortDecision({
  to,
  decision,
  application,
  cohort,
  acceptedUntil,
}: SendCohortDecisionOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_COHORTS;
  const appUrl = process.env.AUTH_URL ?? site.url;

  // Validate accepted-decision invariant BEFORE the env short-circuit so
  // the caller always learns about a programming bug, even in dev.
  if (decision === 'accepted' && !acceptedUntil) {
    throw new Error('acceptedUntil is required for accepted decisions');
  }

  if (!apiKey || !from) return;

  let subject: string;
  let body: { text: string; html: string };

  if (decision === 'accepted') {
    const token = signCheckoutToken({
      applicationId: application.id,
      cohortSlug: cohort.meta.slug,
      expiresAt: acceptedUntil!.getTime(),
    });
    const checkoutUrl = `${appUrl}/cohorts/${cohort.meta.slug}/checkout?token=${encodeURIComponent(token)}`;
    subject = `You're in — ${cohort.meta.title}`;
    body = acceptBody({ meta: cohort.meta, checkoutUrl, acceptedUntil: acceptedUntil! });
  } else if (decision === 'waitlisted') {
    subject = `Waitlisted — ${cohort.meta.title}`;
    body = waitlistBody(cohort.meta);
  } else {
    subject = `Update on your application — ${cohort.meta.title}`;
    body = declineBody(cohort.meta);
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to, subject, ...body });
  if (result.error) {
    console.error(`sendCohortDecision: Resend error for ${to}:`, result.error);
  }
}
