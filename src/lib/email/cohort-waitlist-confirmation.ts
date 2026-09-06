import { Resend } from 'resend';
import type { LoadedEntry } from '@/lib/content/loader';
import type { Cohort } from '@/content/schemas';
import { site } from '@/lib/site';

interface SendOptions {
  to: string;
  cohort: LoadedEntry<Cohort>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function renderBody(
  meta: Cohort,
  appUrl: string,
): { text: string; html: string } {
  const detailUrl = `${appUrl}/cohorts/${meta.slug}`;
  const startsLine = `Starts: ${formatDate(meta.startDate)}`;
  const durationLine = `Duration: ${meta.durationWeeks} weeks (${meta.commitmentHoursPerWeek}h/week)`;

  const text = [
    `You're on the waitlist for ${meta.title}.`,
    '',
    startsLine,
    durationLine,
    '',
    "We'll email you the moment applications open. No spam, one update per cohort milestone.",
    '',
    `Cohort page: ${detailUrl}`,
    '',
    site.emailSignature,
  ].join('\n');

  const safeTitle = escapeHtml(meta.title);
  const html = `<!doctype html>
<html lang="en">
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#faf8f3;color:#0a0a0a;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px">
    <h1 style="font-size:22px;margin:0 0 16px">You're on the waitlist</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      Thanks for joining the waitlist for <strong>${safeTitle}</strong>.
    </p>
    <p style="font-size:14px;line-height:1.5;margin:0 0 16px;color:#475569">
      ${escapeHtml(startsLine)} &middot; ${meta.durationWeeks} weeks &middot; ${meta.commitmentHoursPerWeek} hours per week
    </p>
    <p style="font-size:15px;line-height:1.5;margin:0 0 24px">
      We'll email you the moment applications open. No spam, one update per cohort milestone.
    </p>
    <p style="margin:0 0 16px">
      <a href="${detailUrl}" style="display:inline-block;background:#c2410c;color:#faf8f3;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">
        View cohort page
      </a>
    </p>
    <p style="font-size:12px;color:#475569;margin:24px 0 0">${site.emailSignature}</p>
  </div>
</body>
</html>`;

  return { text, html };
}

export async function sendCohortWaitlistConfirmation({
  to,
  cohort,
}: SendOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_COHORTS;
  const appUrl = process.env.AUTH_URL ?? site.url;

  if (!apiKey || !from) {
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
