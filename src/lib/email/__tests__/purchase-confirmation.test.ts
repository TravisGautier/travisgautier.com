import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__tests__/mocks/msw-server';

vi.hoisted(() => {
  if (!process.env.RESEND_API_KEY) {
    process.env.RESEND_API_KEY = 're_test_stub_api_key';
  }
  if (!process.env.AUTH_URL) {
    process.env.AUTH_URL = 'https://travisgautier.com';
  }
  return {};
});

vi.mock('@/lib/content/products', () => ({
  getProductBySlug: vi.fn(),
}));

import { getProductBySlug } from '@/lib/content/products';
import { site } from '@/lib/site';

const mockGetProduct = vi.mocked(getProductBySlug);

describe('sendPurchaseConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProduct.mockResolvedValue({
      slug: 'workflow-templates',
      meta: {
        id: 'prod-1',
        slug: 'workflow-templates',
        title: 'Workflow Templates',
        tagline: 'Streamline your workflow',
        summary: 'A collection of workflow templates',
        category: 'workflow-templates' as never,
        licenseType: 'single-user' as never,
        priceCents: 4900,
        currency: 'usd',
        stripePriceId: 'price_abc123',
        assetFilename: 'workflow-templates.zip',
        lllEntryUrls: [],
        relatedCaseIds: [],
        publishedAt: '2026-01-01',
      },
      content: '',
    } as never);
  });

  // --- Batch 1: Functional ---

  it('unit_email_correct_payload: calls Resend with correct from/to/subject/html', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('https://api.resend.com/emails', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 'email_test_1' });
      }),
    );

    const { sendPurchaseConfirmation } = await import('../purchase-confirmation');
    await sendPurchaseConfirmation({
      to: 'buyer@example.com',
      productSlug: 'workflow-templates',
      purchaseId: 'purchase-1',
    });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.to).toBe('buyer@example.com');
    expect(capturedBody!.from).toBe(site.emailFromAddress);
    expect(capturedBody!.subject).toContain('Workflow Templates');
    expect(capturedBody!.html).toContain('Workflow Templates');
    expect(capturedBody!.html).toContain('/products/account/purchases/purchase-1');
  });

  it('unit_email_product_deleted_fallback: uses slug as title when product not found', async () => {
    mockGetProduct.mockResolvedValue(null);

    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('https://api.resend.com/emails', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 'email_test_2' });
      }),
    );

    const { sendPurchaseConfirmation } = await import('../purchase-confirmation');
    await sendPurchaseConfirmation({
      to: 'buyer@example.com',
      productSlug: 'deleted-product',
      purchaseId: 'purchase-2',
    });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.subject).toContain('deleted-product');
    expect(capturedBody!.html).toContain('deleted-product');
  });

  // --- Batch 5: Error Recovery ---

  it('err_email_resend_500: Resend 500 causes sendPurchaseConfirmation to throw', async () => {
    server.use(
      http.post('https://api.resend.com/emails', () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    const { sendPurchaseConfirmation } = await import('../purchase-confirmation');

    await expect(
      sendPurchaseConfirmation({
        to: 'buyer@example.com',
        productSlug: 'workflow-templates',
        purchaseId: 'purchase-3',
      }),
    ).rejects.toThrow();
  });
});
