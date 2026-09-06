import { Resend } from 'resend';
import { getProductBySlug } from '@/lib/content/products';
import { site } from '@/lib/site';

let _resend: Resend | undefined;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface SendPurchaseConfirmationArgs {
  to: string;
  productSlug: string;
  purchaseId: string;
}

export async function sendPurchaseConfirmation({
  to,
  productSlug,
  purchaseId,
}: SendPurchaseConfirmationArgs): Promise<void> {
  const entry = await getProductBySlug(productSlug);
  const productTitle = entry?.meta.title ?? productSlug;
  const baseUrl = process.env.AUTH_URL ?? site.url;
  const accountUrl = `${baseUrl}/products/account/purchases/${purchaseId}`;

  const subject = `Your ${site.name} purchase: ${productTitle}`;
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 560px;">
      <h1 style="font-size: 20px;">Thanks for your purchase</h1>
      <p>You bought <strong>${productTitle}</strong>.</p>
      <p>Your download is available in your account. Sign in with this same
        email to access it:</p>
      <p style="margin: 24px 0;">
        <a href="${accountUrl}"
           style="display:inline-block;padding:12px 20px;background:#c2410c;color:#faf8f3;text-decoration:none;border-radius:6px;">
          View your purchase
        </a>
      </p>
      <p style="color: #475569; font-size: 14px;">
        If the link expires, request a fresh sign-in link at
        <a href="${baseUrl}/login">${baseUrl.replace(/^https?:\/\//, '')}/login</a>.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">
        ${site.name} &middot; ${site.tagline}
      </p>
    </div>
  `;

  const { error } = await getResend().emails.send({
    from: process.env.AUTH_RESEND_FROM ?? site.emailFromAddress,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send purchase confirmation: ${error.message}`);
  }
}
