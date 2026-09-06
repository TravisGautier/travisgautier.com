# Phase 3: Payments + Fulfillment

**Total Size: L + L + M**
**Prerequisites: Phase 2 complete (auth working, `users` + `purchases` tables exist, middleware gates `/products/account` + `/api/products/downloads`). Stripe account with at least one `Product` + `Price` created in the dashboard and the `price_xxx` ID pasted into `src/content/products/{slug}.mdx` frontmatter. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`. Stripe CLI installed locally for webhook forwarding during development.**
**New Files: `src/lib/stripe/{client,price-map,checkout}.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/api/products/downloads/[purchaseId]/route.ts`, `src/lib/email/purchase-confirmation.ts`, `private/products/{workflow-templates,discovery-toolkit}.zip`, plus tests**

Phase 3 takes the static catalog + auth layer from Phases 1+2 and makes it
actually transactional. By the end of this phase, a logged-in user can click
Buy on a product, land on Stripe Checkout, pay with a test card, return to
`/products/account`, receive a confirmation email from Resend, and download
the purchased file from a verified URL. The account UI itself is still a
placeholder until Phase 4 — this phase only needs the `purchases` row
written correctly and the download route working.

---

## Feature 3.1: Stripe Client + Checkout Action + BuyButton Live

**Complexity: L** — Install the Stripe SDK, wire a singleton client, build
`resolveStripePriceId(productSlug)` over the product loader, wire the
`createCheckoutSession()` server action, and flip Phase 1's `BuyButton`
from disabled-placeholder to live. These steps form one contiguous
flow — the action imports the client, the action wires the button, and
none of them are independently verifiable end-to-end.

### Problem

Every Stripe-facing surface (checkout action, webhook handler) needs a
shared, API-version-pinned client. Without a singleton, hot-reload in dev
would create new clients (leaking connections) and the Stripe SDK's default
API version pinning logic is too loose for production — pinning at the
client level is the documented best practice.

The price resolver is a separate helper because (a) the checkout action
shouldn't know about the product loader internals and (b) Stripe price IDs
are the critical linkage the entire purchase flow depends on — if a product
MDX file has a stale `price_xxx`, Checkout fails loudly at session creation
time, not silently at the download.

Phase 1 shipped `BuyButton` as a client component with a feature flag
(`isLive = false`) rendering as disabled. We flip the flag and wire the
click handler to a server action that (a) verifies the user is
authenticated, (b) creates a Stripe Checkout Session with the right price,
(c) redirects to Stripe's hosted checkout page. On successful payment,
Stripe redirects back to `/products/account?purchased={slug}`.

### Implementation

#### Stripe Client + Price Map

Install Stripe SDK:

```bash
npm install stripe
```

**NEW** `src/lib/stripe/client.ts`:

```ts
import Stripe from 'stripe';

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe =
  globalForStripe.stripe ??
  new Stripe(secretKey, {
    // Pin to the latest stable at time of writing; update deliberately.
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });

if (process.env.NODE_ENV !== 'production') globalForStripe.stripe = stripe;
```

**NEW** `src/lib/stripe/price-map.ts`:

```ts
import { getProductBySlug } from '@/lib/content/products';

/**
 * Resolve a product slug to its Stripe `price_xxx` ID.
 * Throws if the product doesn't exist or its `stripePriceId` isn't
 * a real Stripe price (e.g., still the placeholder value from seed data).
 */
export async function resolveStripePriceId(
  productSlug: string,
): Promise<{ priceId: string; amountCents: number; currency: string }> {
  const entry = await getProductBySlug(productSlug);
  if (!entry) {
    throw new Error(`No product found for slug: ${productSlug}`);
  }
  const { stripePriceId, priceCents, currency } = entry.meta;
  if (stripePriceId.includes('REPLACE_ME')) {
    throw new Error(
      `Product "${productSlug}" has a placeholder Stripe price ID. ` +
        `Set a real price_xxx in src/content/products/${productSlug}.mdx before shipping.`,
    );
  }
  return { priceId: stripePriceId, amountCents: priceCents, currency };
}
```

#### Checkout Action + BuyButton Live

**NEW** `src/lib/stripe/checkout.ts` — server action:

```ts
'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { stripe } from './client';
import { resolveStripePriceId } from './price-map';

export async function createCheckoutSession(productSlug: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/products/${productSlug}`)}`,
    );
  }

  const { priceId } = await resolveStripePriceId(productSlug);

  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: session.user.email,
    client_reference_id: session.user.id,
    metadata: {
      userId: session.user.id,
      productSlug,
    },
    success_url: `${baseUrl}/products/account?purchased=${encodeURIComponent(productSlug)}`,
    cancel_url: `${baseUrl}/products/${productSlug}?canceled=1`,
    allow_promotion_codes: false,
  });

  if (!checkout.url) {
    throw new Error('Stripe did not return a checkout URL.');
  }

  redirect(checkout.url);
}
```

**MODIFY** `src/components/products/BuyButton.tsx` — wire the action:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { createCheckoutSession } from '@/lib/stripe/checkout';

interface BuyButtonProps {
  productSlug: string;
}

export function BuyButton({ productSlug }: BuyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-parchment hover:bg-accent/90 disabled:opacity-60"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await createCheckoutSession(productSlug);
            } catch (err) {
              setError(
                'Could not start checkout. Try again in a moment.',
              );
            }
          });
        }}
      >
        {isPending ? 'Preparing checkout…' : 'Buy now'}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

### Tests (red phase of section `storefront-auth-3.1`)

**NEW** `src/lib/stripe/__tests__/price-map.test.ts`:

- `resolveStripePriceId('workflow-templates')` with a valid seed file (test fixture rewrites the MDX `meta.stripePriceId` to `price_abc123` via test setup) returns `{ priceId: 'price_abc123', amountCents: 4900, currency: 'usd' }`.
- `resolveStripePriceId('bogus')` throws a "No product found" error.
- `resolveStripePriceId('workflow-templates')` with the placeholder `price_REPLACE_ME_...` throws the "placeholder Stripe price ID" error.

**NEW** `src/lib/stripe/__tests__/checkout.test.ts` — unit tests with Stripe SDK mocked:

- `createCheckoutSession('workflow-templates')` with no session → redirects to `/login?callbackUrl=%2Fproducts%2Fworkflow-templates`.
- With a mocked authed session and a valid product → calls `stripe.checkout.sessions.create` with correct `price`, `customer_email`, `client_reference_id`, `metadata.userId`, `metadata.productSlug`, `success_url`, `cancel_url`.
- Redirects to the returned `checkout.url`.
- If Stripe SDK returns a session without a URL → throws.
- If `resolveStripePriceId` throws (product not found or placeholder ID) → bubbles the error up.

**MODIFY** `src/components/products/__tests__/BuyButton.test.tsx` (extend Phase 1 tests):

- Click calls `createCheckoutSession` (mocked) with the product slug.
- While pending, button disabled + shows "Preparing checkout…".
- On thrown error, error message is announced via `role="alert"`.

### Design Decisions

**Stripe client + price map:**
- **`apiVersion` pinned at client construction** — Stripe warns about using the account default. Pinning makes upgrades explicit and testable.
- **Singleton across hot-reload** — same `globalThis` trick as the DB client.
- **Throw on placeholder IDs** — rather than silently 500 at Stripe's HTTP layer, the resolver catches the common content-authoring error early and gives an actionable fix message.
- **Resolver imports from `@/lib/content/products`** — the product loader is the single source of truth. No separate registry.

**Checkout action + BuyButton:**
- **Server action, not API route** — the Buy button is already a client component in a server-rendered form. Server actions eliminate the fetch boilerplate and are the Next.js 16 idiom for this pattern.
- **`redirect` inside a server action** — Next.js 16 throws a special `NEXT_REDIRECT` error that the framework catches and turns into a 303 redirect. The `try/catch` in `BuyButton` lets real errors show a UI message but lets the redirect escape (since `NEXT_REDIRECT` is thrown after the `await`).
- **`client_reference_id = session.user.id`** — Stripe echoes this back in the webhook, letting us link the Checkout Session to our user without relying on `customer_email` (which can be edited on the Stripe checkout page).
- **`metadata.userId` + `metadata.productSlug`** — belt-and-braces with `client_reference_id`. If either is missing in the webhook, something is wrong and we fail the write deliberately.
- **No `customer: 'cus_xxx'`** — we don't create Stripe Customer objects ahead of time because we don't need saved cards or recurring billing. `customer_email` is enough for one-time Checkout and shows up in Stripe's dashboard.
- **`allow_promotion_codes: false`** — no promo codes in v1. Add later if the storefront needs it.
- **Redirect on unauthenticated** — middleware already catches this for most paths, but the Buy button is on a PUBLIC product page where middleware doesn't run. Defensive redirect here preserves the same UX.

### Files

| Action | File                                                   |
|--------|--------------------------------------------------------|
| NEW    | `src/lib/stripe/client.ts`                             |
| NEW    | `src/lib/stripe/price-map.ts`                          |
| NEW    | `src/lib/stripe/checkout.ts`                           |
| NEW    | `src/lib/stripe/__tests__/price-map.test.ts`           |
| NEW    | `src/lib/stripe/__tests__/checkout.test.ts`            |
| MODIFY | `src/components/products/BuyButton.tsx`                |
| MODIFY | `src/components/products/__tests__/BuyButton.test.tsx` |
| MODIFY | `package.json` (deps)                                  |

---

## Feature 3.2: Stripe Webhook Handler + Purchase Confirmation Email

**Complexity: L** — POST route handler at `/api/stripe/webhook` that
verifies Stripe's signature, parses the `checkout.session.completed`
event, atomically upserts a `purchases` row, and on first insert sends a
Resend confirmation email. Inseparable: the email is invoked from inside
the webhook handler and gated by the idempotent insert's return value, so
the webhook tests already exercise both surfaces.

### Problem

Stripe Checkout handles payment, but we still need to record "this user
bought this product" in our DB so the account page can list purchases and
the download handler can verify ownership. The webhook is the only reliable
way to learn about a completed purchase — the `success_url` redirect happens
client-side and can be spoofed or dropped. The webhook runs server-to-server
with a signed payload.

Webhooks must be **idempotent**: Stripe replays events on retry, network
flakiness, or manual resend from the dashboard. Writing the same purchase
twice would corrupt the user's account view and double-count revenue. The
`UNIQUE` constraint on `purchases.stripeSessionId` from Feature 2.1 is the
backstop; the handler should also catch and ignore the conflict gracefully.

When the webhook writes a new `purchases` row, the customer should receive
a receipt email confirming the purchase and pointing them at their account
page (where they'll find the download link). The email is a receipt + a
sign-in reminder CTA — NOT a raw download link, because the download route
requires an active session.

### Implementation

#### Webhook Handler

**NEW** `src/app/api/stripe/webhook/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { db, schema } from '@/db/client';
import { sendPurchaseConfirmation } from '@/lib/email/purchase-confirmation';

// Stripe webhooks must receive the raw request body to verify the signature.
// Next.js App Router passes the raw body through `request.text()`.
export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 },
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 },
    );
  }

  if (event.type !== 'checkout.session.completed') {
    // Ignore unrelated events but acknowledge them so Stripe doesn't retry.
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const userId = session.metadata?.userId;
  const productSlug = session.metadata?.productSlug;
  const stripeSessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
  const amountCents = session.amount_total ?? 0;
  const currency = session.currency ?? 'usd';

  if (!userId || !productSlug || !paymentIntentId) {
    return NextResponse.json(
      { error: 'Checkout session missing required metadata' },
      { status: 400 },
    );
  }

  // Idempotent insert — returning nothing on conflict means "already handled".
  const inserted = await db
    .insert(schema.purchases)
    .values({
      userId,
      productSlug,
      stripeSessionId,
      stripePaymentIntentId: paymentIntentId,
      amountCents,
      currency,
    })
    .onConflictDoNothing({ target: schema.purchases.stripeSessionId })
    .returning();

  if (inserted.length > 0) {
    // First time seeing this session — send confirmation email.
    const customerEmail = session.customer_details?.email ?? session.customer_email;
    if (customerEmail) {
      await sendPurchaseConfirmation({
        to: customerEmail,
        productSlug,
        purchaseId: inserted[0].id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
```

#### Purchase Confirmation Email

**NEW** `src/lib/email/purchase-confirmation.ts`:

```ts
import { Resend } from 'resend';
import { getProductBySlug } from '@/lib/content/products';

const resend = new Resend(process.env.RESEND_API_KEY);

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
  const baseUrl = process.env.AUTH_URL ?? 'https://travisgautier.com';
  const accountUrl = `${baseUrl}/products/account/purchases/${purchaseId}`;

  const subject = `Your Travis Gautier purchase: ${productTitle}`;
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
        Travis Gautier · One person. An agent team. Full SaaS delivery.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: process.env.AUTH_RESEND_FROM ?? 'no-reply@travisgautier.com',
    to,
    subject,
    html,
  });
}
```

### Tests (red phase of section `storefront-auth-3.2`)

**NEW** `src/app/api/stripe/webhook/__tests__/route.test.ts` — POST handler
tests using a fabricated `NextRequest`, a mocked Stripe SDK
(`stripe.webhooks.constructEvent` returns the test event directly), and a
real Drizzle-over-Postgres test database.

- Valid `checkout.session.completed` event → inserts exactly one `purchases` row with the correct fields.
- Replayed event with same `stripeSessionId` → no duplicate row inserted, response is 200.
- Missing `metadata.userId` → 400, no row inserted.
- Missing `metadata.productSlug` → 400, no row inserted.
- Missing `stripe-signature` header → 400.
- Invalid signature (mock `constructEvent` throws) → 400.
- Unrelated event type (e.g., `payment_intent.succeeded`) → 200 `{ received: true }`, no row inserted.
- Successful insert triggers `sendPurchaseConfirmation` (mocked) exactly once; replay does NOT re-send.

**NEW** `src/lib/email/__tests__/purchase-confirmation.test.ts` (MSW-intercepted):

- Calls Resend's `/emails` endpoint with the correct `from`, `to`, `subject`, and an `html` body containing the product title and a link to `${AUTH_URL}/products/account/purchases/{purchaseId}`.
- If `getProductBySlug` returns null (product deleted after purchase), uses the slug as the title fallback and still sends.
- If Resend errors (simulated 500), the helper throws — the webhook handler's logic decides whether to crash or log and continue.

### Design Decisions

**Webhook handler:**
- **`runtime = 'nodejs'`** — the Stripe SDK is not Edge-compatible (uses `crypto` in a way the Edge runtime doesn't support). Explicit opt-in to Node runtime for this handler only. Middleware stays Edge.
- **`request.text()` for the raw body** — `constructEvent` needs the exact bytes, not the JSON-parsed object. Don't `request.json()`.
- **`onConflictDoNothing` + `returning()`** — Drizzle's idempotent insert. If `returning()` is empty, we know the row was already there and skip the email send. This is the cleanest way to express "exactly once" semantics without a transaction + SELECT.
- **Email only fires on first insert** — the most common cause of accidental double-email is the webhook being replayed. Gating the email behind the `inserted.length > 0` check eliminates that risk entirely.
- **200 OK on unrelated events** — ALWAYS acknowledge events Stripe sends, even ones we don't care about. Returning a non-2xx tells Stripe to retry forever.
- **No transaction wrapping the insert + email** — Postgres transaction + HTTP call to Resend is a recipe for slow locks. The insert is transactional on its own; the email is best-effort. If the email fails, log it but don't fail the webhook — the customer can still access their account.
- **Fail loudly on missing metadata** — 400 here makes Stripe retry, and if the metadata is structurally missing the retry will fail identically and surface in the Stripe dashboard for manual triage.
- **`session.customer_details?.email ?? session.customer_email`** — Stripe sometimes sets one, sometimes the other depending on whether the customer edited their email at checkout time. Check both.

**Purchase confirmation email:**
- **Inline HTML string template** — no MJML, no React Email. One email in the whole job; a template library is premature. Add one when the second email shows up (likely `email-funnel` job later).
- **Email links to `/products/account/purchases/{purchaseId}`, not a raw download URL** — gated-download-with-receipt is the delivery choice. The receipt email is a CTA to sign in.
- **Styles inline** — email clients don't support external stylesheets or `@import` reliably. Inline is the only portable option.
- **`from` defaults to the same `AUTH_RESEND_FROM` used by Auth.js** — a single "no-reply@" address is enough for v1.
- **No unsubscribe link** — this is a transactional email (purchase receipt), not marketing. Transactional emails are exempt from unsubscribe requirements under CAN-SPAM / GDPR. The `email-funnel` job adds marketing emails + unsubscribe flow later.

### Files

| Action | File                                                    |
|--------|---------------------------------------------------------|
| NEW    | `src/app/api/stripe/webhook/route.ts`                   |
| NEW    | `src/app/api/stripe/webhook/__tests__/route.test.ts`    |
| NEW    | `src/lib/email/purchase-confirmation.ts`                |
| NEW    | `src/lib/email/__tests__/purchase-confirmation.test.ts` |

---

## Feature 3.3: Download Route Handler

**Complexity: M** — GET handler at `/api/products/downloads/[purchaseId]`
that verifies the logged-in user owns the purchase, then streams the file
from `private/products/`.

### Problem

Customers need a way to download their purchased files. Two constraints:
1. Only the purchaser can access their file — nobody else, including other
   logged-in users.
2. Files live outside `public/` so they can't be accessed directly by URL.
   The route handler is the only way in.

The handler reads the `purchaseId` param, loads the corresponding
`purchases` row, verifies the `userId` matches the current session, looks up
the `assetFilename` from the product MDX, and streams the bytes from the
VPS filesystem.

### Implementation

**NEW** `src/app/api/products/downloads/[purchaseId]/route.ts`:

```ts
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getProductBySlug } from '@/lib/content/products';

export const runtime = 'nodejs';

const PRODUCTS_DIR = path.resolve(process.cwd(), 'private', 'products');

type RouteContext = {
  params: Promise<{ purchaseId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { purchaseId } = await context.params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const [purchase] = await db
    .select()
    .from(schema.purchases)
    .where(eq(schema.purchases.id, purchaseId))
    .limit(1);

  if (!purchase) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (purchase.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const entry = await getProductBySlug(purchase.productSlug);
  if (!entry) {
    return NextResponse.json(
      { error: 'Product no longer available' },
      { status: 410 },
    );
  }

  const filePath = path.resolve(PRODUCTS_DIR, entry.meta.assetFilename);
  // Defense-in-depth: make sure resolution stayed inside PRODUCTS_DIR.
  if (!filePath.startsWith(PRODUCTS_DIR + path.sep)) {
    return NextResponse.json({ error: 'Invalid asset path' }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch (err) {
    return NextResponse.json(
      { error: 'Asset missing on disk' },
      { status: 500 },
    );
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${entry.meta.assetFilename}"`,
      'Content-Length': String(buffer.byteLength),
      'Cache-Control': 'private, no-store',
    },
  });
}
```

**NEW** `private/products/workflow-templates.zip` — commit a stub zip
(any small valid zip — `echo "stub" > stub.txt && zip workflow-templates.zip
stub.txt`). Document in a `private/products/README.md` that these files are
placeholders until real product content ships.

**NEW** `private/products/discovery-toolkit.zip` — same idea.

**NEW** `private/products/README.md`:

```markdown
# private/products/

Binary product assets served by `/api/products/downloads/[purchaseId]`.
These files live OUTSIDE `public/` and can only be accessed through the
download route handler, which verifies the requesting user owns a matching
`purchases` row.

Filenames are referenced from `src/content/products/*.mdx` via the
`assetFilename` field and resolved under this directory by
`src/app/api/products/downloads/[purchaseId]/route.ts`.

## Shipping real product content

1. Build the real product zip (or tar.gz) somewhere outside the repo.
2. Copy it into this directory with the canonical filename.
3. Update the matching `src/content/products/{slug}.mdx` `meta.assetFilename`
   if the filename changed.
4. Commit the new file. The placeholder stubs currently committed are ~100
   bytes — real product files may be large; check `git lfs` or revisit the
   strategy if a single asset exceeds a few MB.

Real product content decisions (license terms, pricing) are out of scope
for the `storefront-auth` job.
```

**MODIFY** `.gitignore` — intentionally leave `private/products/*.zip`
tracked in the repo for Phase 1 verification. Add a comment that this is a
deliberate choice for the v1 placeholder seeds; real (larger) product files
will be revisited before shipping.

### Tests (red phase of section `storefront-auth-3.3`)

**NEW** `src/app/api/products/downloads/[purchaseId]/__tests__/route.test.ts`:

- Anonymous GET → 401.
- GET with a session but the `purchaseId` doesn't exist → 404.
- GET with a session, valid `purchaseId`, but `purchase.userId` != `session.user.id` → 403.
- GET with a session that owns the purchase → 200, body is the file bytes, headers include `Content-Disposition: attachment; filename="..."`, `Content-Type: application/zip`, `Cache-Control: private, no-store`.
- GET with a purchase for a product whose `assetFilename` resolves outside `private/products/` (e.g., `../../etc/passwd` — inject via a fake product fixture) → 400.
- GET with a purchase for a product whose file is missing on disk → 500.
- GET with a purchase whose `productSlug` no longer resolves to a product → 410.

### Design Decisions

- **Route lives under `/api/products/downloads/[purchaseId]`**, NOT `/products/downloads/[purchaseId]` — App Router doesn't allow a Route Handler and a page to coexist at the same path, and `/products/account/purchases/[id]` (Phase 4.1) is a page under `/products/...`. Keeping downloads under `/api` cleanly separates them. Middleware matcher in Feature 2.3 covers both the `/api/...` and `/products/account/...` paths.
- **`path.resolve` + `startsWith(PRODUCTS_DIR + path.sep)` traversal check** — even though Feature 1.1's Zod validator rejects filenames with `../`, defense-in-depth at the point of use is cheap and catches any future regression.
- **`readFile` in-memory, not `createReadStream`** — simpler, and v1 product files are tiny (stub zips). For files larger than a few MB, switch to streaming via a `ReadableStream`. Documented as an "Open Item" in the README.
- **`Cache-Control: private, no-store`** — downloads are per-user and should never be cached by intermediaries (CDN, proxy, browser BFCache). `no-store` is the strictest directive.
- **`runtime = 'nodejs'`** — `fs/promises` is Node-only. Same opt-in as the webhook.
- **Ownership check goes through the DB, not just the session** — the `purchaseId` in the URL is user-controlled. Loading the row and comparing `userId` is the only safe check.
- **No signed-URL variant for v1** — gated download pages are the chosen delivery mechanism. Signed-URL-in-email is a later upgrade.
- **Content-Disposition always `attachment`** — forces download instead of inline display. Zips would inline-display as blank in browsers anyway; be explicit.

### Files

| Action | File                                                                  |
|--------|-----------------------------------------------------------------------|
| NEW    | `src/app/api/products/downloads/[purchaseId]/route.ts`                |
| NEW    | `src/app/api/products/downloads/[purchaseId]/__tests__/route.test.ts` |
| NEW    | `private/products/workflow-templates.zip`                             |
| NEW    | `private/products/discovery-toolkit.zip`                              |
| NEW    | `private/products/README.md`                                          |
| MODIFY | `.gitignore`                                                          |

---

## Phase 3 Exit Criteria

- `npm run lint` — clean
- `npm test` — all Phase 3 unit + integration tests green
- `npm run build` — clean, webhook and download routes compile with `runtime = 'nodejs'` opt-in
- Stripe CLI running: `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints a `whsec_...` that matches `STRIPE_WEBHOOK_SECRET`
- Manual smoke (against `npm run dev`):
  1. Sign in as test user at `/login`
  2. Go to `/products/workflow-templates`, click Buy now → redirected to Stripe Checkout
  3. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC → submit
  4. Returned to `/products/account?purchased=workflow-templates` (account page is still a placeholder)
  5. Stripe CLI logs show the `checkout.session.completed` event was forwarded and the handler returned 200
  6. Drizzle studio shows one new `purchases` row with correct `userId`, `productSlug`, `amountCents`
  7. Replay event via `stripe events resend {id}` → handler returns 200 but NO duplicate row
  8. Resend dashboard shows the confirmation email was delivered
  9. Hit `/api/products/downloads/{purchaseId}` in the browser → file downloads
  10. Sign in as a different test user → same URL returns 403
  11. Sign out → same URL returns 401
