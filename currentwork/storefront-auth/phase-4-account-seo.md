# Phase 4: Account + SEO

**Total Size: M + M**
**Prerequisites: Phase 3 complete — real purchases can be made, written to the DB, and downloaded via the route handler. Middleware is already gating `/products/account/*` from Phase 2.3.**
**New Files: `src/app/products/account/page.tsx`, `src/app/products/account/purchases/[id]/page.tsx`, `src/components/account/{PurchaseList,SignOutButton}.tsx`, plus SEO/robots/sitemap modifications, error boundaries, and tests**

Phase 4 ships the visible customer-facing account UI, wires up sign-out,
and handles all the cross-cutting SEO / sitemap / robots / a11y polish
that was intentionally deferred from earlier phases so one pass could cover
the whole storefront at once. By the end of Phase 4, the job is fully
shippable: a logged-in customer can see their purchases, download them,
sign out, and every public product page is indexable with rich snippets.

---

## Feature 4.1: Account UI (Overview + Purchase Detail + Sign-Out)

**Complexity: M** — The full authenticated UI surface for `/products/account`:
the overview list, the per-purchase detail page, and the sign-out button
embedded in the overview header. All three render inside the same gated
segment, share the same `auth()` + Drizzle access pattern, and the
SignOutButton is literally a child of the overview page header — testing
them together is the natural unit.

### Problem

After a successful purchase, Stripe redirects to
`/products/account?purchased=workflow-templates`. Right now that URL 404s
because the page doesn't exist. Users need a stable landing point to see
what they've bought and re-download it any time. They also need a per-
purchase detail page (the URL the confirmation email links to) and a way
to sign out.

The purchase confirmation email links to
`/products/account/purchases/{id}`. That URL needs to show a receipt-style
view: product title, price, date, order ID, download button. It's the
equivalent of Stripe's hosted receipt — same content, on our domain, with
our branding.

Users need to be able to sign out (end the current session, clear the
cookie, and redirect home). Auth.js v5 ships `signOut` as a server action;
we just need a button that calls it.

### Implementation

#### Account Overview

**NEW** `src/app/products/account/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getAllProducts } from '@/lib/content/products';
import { Container } from '@/components/site/Container';
import { PurchaseList } from '@/components/account/PurchaseList';
import { SignOutButton } from '@/components/account/SignOutButton';

export const metadata: Metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ purchased?: string; canceled?: string }>;
};

export default async function AccountPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Fproducts%2Faccount');
  }

  const { purchased, canceled } = await searchParams;

  const [purchases, products] = await Promise.all([
    db
      .select()
      .from(schema.purchases)
      .where(eq(schema.purchases.userId, session.user.id))
      .orderBy(desc(schema.purchases.purchasedAt)),
    getAllProducts(),
  ]);

  const productsBySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <Container as="section" className="py-16">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted">Storefront</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            Your account
          </h1>
          <p className="mt-2 text-sm text-muted">
            Signed in as {session.user.email}
          </p>
        </div>
        <SignOutButton />
      </header>

      {purchased ? (
        <div
          role="status"
          className="mt-8 rounded-md border border-accent/40 bg-accent/5 px-4 py-3 text-sm"
        >
          Thanks! Your purchase of{' '}
          <strong>{productsBySlug.get(purchased)?.title ?? purchased}</strong>{' '}
          is confirmed. It will appear below in a moment.
        </div>
      ) : null}

      {canceled ? (
        <div
          role="status"
          className="mt-8 rounded-md border border-mist bg-mist/30 px-4 py-3 text-sm text-muted"
        >
          Checkout canceled. Nothing was charged.
        </div>
      ) : null}

      <div className="mt-12">
        <h2 className="font-display text-xl font-semibold">Purchases</h2>
        <div className="mt-6">
          <PurchaseList purchases={purchases} productsBySlug={productsBySlug} />
        </div>
      </div>
    </Container>
  );
}
```

**NEW** `src/components/account/PurchaseList.tsx`:

```tsx
import Link from 'next/link';
import type { Product } from '@/content/schemas';
import type { Purchase } from '@/db/schema';

interface PurchaseListProps {
  purchases: Purchase[];
  productsBySlug: Map<string, Product>;
}

function formatDate(iso: Date | string): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function PurchaseList({
  purchases,
  productsBySlug,
}: PurchaseListProps) {
  if (purchases.length === 0) {
    return (
      <div className="rounded-md border border-mist p-6 text-sm text-muted">
        <p>You don&rsquo;t have any purchases yet.</p>
        <p className="mt-2">
          Browse the{' '}
          <Link href="/products" className="text-link underline-offset-2 hover:underline">
            storefront
          </Link>{' '}
          to find workflow templates, toolkits, and more.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-mist">
      {purchases.map((purchase) => {
        const product = productsBySlug.get(purchase.productSlug);
        return (
          <li key={purchase.id} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-semibold">
                {product?.title ?? purchase.productSlug}
              </p>
              <p className="mt-1 text-sm text-muted">
                Purchased {formatDate(purchase.purchasedAt)} ·{' '}
                {formatPrice(purchase.amountCents, purchase.currency)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/products/account/purchases/${purchase.id}`}
                className="text-sm text-link underline-offset-2 hover:underline"
              >
                Details
              </Link>
              <a
                href={`/api/products/downloads/${purchase.id}`}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-parchment hover:bg-accent/90"
              >
                Download
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

#### Purchase Detail

**NEW** `src/app/products/account/purchases/[id]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getProductBySlug } from '@/lib/content/products';
import { Container } from '@/components/site/Container';

export const metadata: Metadata = {
  title: 'Purchase details',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(iso: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(iso);
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function PurchaseDetailPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/products/account/purchases/${id}`)}`,
    );
  }

  const [purchase] = await db
    .select()
    .from(schema.purchases)
    .where(eq(schema.purchases.id, id))
    .limit(1);

  if (!purchase || purchase.userId !== session.user.id) {
    notFound();
  }

  const entry = await getProductBySlug(purchase.productSlug);
  const title = entry?.meta.title ?? purchase.productSlug;

  return (
    <Container as="article" className="py-16">
      <p className="text-sm uppercase tracking-wide text-muted">Receipt</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{title}</h1>

      <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Amount</dt>
          <dd className="mt-1 font-display text-xl">
            {formatPrice(purchase.amountCents, purchase.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Purchased</dt>
          <dd className="mt-1">{formatDate(purchase.purchasedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Order ID</dt>
          <dd className="mt-1 font-mono text-xs">{purchase.id}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Stripe session</dt>
          <dd className="mt-1 font-mono text-xs">{purchase.stripeSessionId}</dd>
        </div>
      </dl>

      <div className="mt-12 flex items-center gap-4">
        <a
          href={`/api/products/downloads/${purchase.id}`}
          className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-parchment hover:bg-accent/90"
        >
          Download
        </a>
        <Link
          href="/products/account"
          className="text-sm text-link underline-offset-2 hover:underline"
        >
          Back to account
        </Link>
      </div>
    </Container>
  );
}
```

#### Sign-Out Button

**NEW** `src/components/account/SignOutButton.tsx`:

```tsx
'use client';

import { useTransition } from 'react';
import { signOut } from '@/auth';

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await signOut({ redirectTo: '/' });
        });
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-mist px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {isPending ? 'Signing out…' : 'Sign out'}
      </button>
    </form>
  );
}
```

### Tests (red phase of section `storefront-auth-4.1`)

**NEW** `src/app/products/account/__tests__/page.test.tsx`:

- Anonymous request → redirects to `/login?callbackUrl=%2Fproducts%2Faccount` (defense-in-depth; middleware already catches this).
- Authenticated user with zero purchases → empty state message rendered.
- Authenticated user with two purchases → `<PurchaseList>` renders two list items in `purchasedAt desc` order.
- `searchParams.purchased=workflow-templates` → success banner rendered, pulling the product title from the loader.
- `searchParams.canceled=1` → canceled banner rendered.
- Page metadata excludes the page from indexing.

**NEW** `src/components/account/__tests__/PurchaseList.test.tsx`:

- Empty list → empty state copy.
- Non-empty list → one `<li>` per purchase, download link points at `/api/products/downloads/{id}`, details link points at `/products/account/purchases/{id}`, price formatted in the stored currency, date formatted as `Month Day, Year`.
- Unknown product slug (row exists but product file was deleted) → row still renders with the raw slug as the title.

**NEW** `src/app/products/account/purchases/[id]/__tests__/page.test.tsx`:

- Anonymous → redirect to `/login` with the current URL as `callbackUrl`.
- Authenticated, unknown `id` → `notFound()`.
- Authenticated, `id` exists but `userId` mismatch → `notFound()`.
- Authenticated, owning user → renders title, amount, formatted date, order ID, Stripe session ID, a working Download link to `/api/products/downloads/{id}`, and a "Back to account" link.
- `params` is awaited (type-level test that the page signature accepts `Promise<{ id: string }>`).

**NEW** `src/components/account/__tests__/SignOutButton.test.tsx`:

- Renders a button with "Sign out" label.
- Submitting the form calls `signOut({ redirectTo: '/' })` (mock `@/auth`).
- While pending, button is disabled and shows "Signing out…".

**Manual smoke (no unit test — Auth.js session lifecycle):**

- After sign-out, the `authjs.session-token` cookie is cleared.
- Visiting `/products/account` returns 307 → `/login` (middleware catches the now-missing cookie).
- The previous session's row in `sessions` is deleted by Auth.js.
- A manually-expired session row (set `expires` to a past timestamp via `npm run db:studio`) causes subsequent `auth()` calls to return `null`, which redirects anonymous users to `/login`. No stuck-logged-in state.

### Design Decisions

**Account overview:**
- **Server component, not client** — all the data is server-side (session + DB query). Rendering on the server means the page is always up-to-date and doesn't flash an empty state before React Query resolves (no React Query needed here at all).
- **`Promise.all` for session + DB query + product loader** — three independent reads, no reason to serialize them.
- **`Map<slug, Product>` for product lookup** — one traversal of the product list, O(1) per purchase. Cleaner than a `.find()` per row.
- **`robots: { index: false, follow: false }`** — gated pages must never appear in search results.
- **Download as `<a href>`, not `<button>`** — browsers handle the content-disposition → download flow natively on `<a>` clicks. A button would need JavaScript + programmatic click simulation.
- **Eventual-consistency banner** — the Stripe webhook may race the `success_url` redirect. If the user lands on `/products/account?purchased=...` before the webhook has written the row, the banner says "appearing in a moment" and the list will be empty. Accepted UX tradeoff in v1; a future polish could poll or use Server-Sent Events.
- **No pagination yet** — two seed products per user means this is a non-issue. Add cursor pagination if any user accumulates 20+ purchases.

**Purchase detail:**
- **`notFound()` for mismatch, not 403** — hiding the existence of a purchase from anyone who isn't the owner is better UX than "you don't own this". No information leak.
- **Order ID + Stripe session ID both displayed** — Order ID (our UUID) is what customer support references; Stripe session ID is what customers can look up in their bank/Stripe receipt. Both help.
- **Fixed grid layout for the `dl`** — a receipt is the one place where a tidy two-column layout is obviously right. `grid-cols-1 sm:grid-cols-2` is the same layout used on `/cases/[slug]` for deliverables from wf 3.5.
- **No PDF export in v1** — a "download receipt as PDF" feature would need a PDF library and is minor UX polish. The page prints fine with the browser's "Save as PDF" option.

**Sign-out:**
- **`<form action={...}>` pattern, not `<button onClick>`** — Auth.js v5 expects `signOut` to be called from inside a form context for CSRF protection. The `action` prop on a form accepts a closure that calls `signOut` directly.
- **`useTransition` even though there's no return value** — keeps the button disabled during the redirect-in-flight window so a user can't double-submit.
- **Redirects to `/` (home), not `/login`** — the whole point of signing out is usually "I'm done with the site", not "log me into a different account". `/login` as the redirect target would be weird.
- **No confirmation dialog** — signing out is a low-cost action (the user can always sign back in). A confirmation would be friction without value.

### Files

| Action | File                                                                |
|--------|---------------------------------------------------------------------|
| NEW    | `src/app/products/account/page.tsx`                                 |
| NEW    | `src/app/products/account/purchases/[id]/page.tsx`                  |
| NEW    | `src/components/account/PurchaseList.tsx`                           |
| NEW    | `src/components/account/SignOutButton.tsx`                          |
| NEW    | `src/app/products/account/__tests__/page.test.tsx`                  |
| NEW    | `src/components/account/__tests__/PurchaseList.test.tsx`            |
| NEW    | `src/app/products/account/purchases/[id]/__tests__/page.test.tsx`   |
| NEW    | `src/components/account/__tests__/SignOutButton.test.tsx`           |

---

## Feature 4.2: SEO + Error Boundaries + Lighthouse Sweep

**Complexity: M** — Cross-cutting pre-ship polish: `Product` + `Offer`
JSON-LD on the detail page, the dynamic sitemap appended with product
URLs, `/products` added to the header nav, robots disallow rules for gated
routes, segment-scoped error boundaries for `/products/*` and
`/products/account/*`, an account-scoped not-found, and a manual Lighthouse
sweep against every public storefront URL. All of these are final-pass
work in the same phase that gates "is this job actually shippable".

### Problem

Product detail pages need rich snippets so Google shows price + currency in
search results. The sitemap needs the new public URLs so Google crawls them
promptly. The header needs a `/products` nav link. The robots file must
NEVER include `/products/account*`, `/products/downloads*`, or `/login*` —
accidentally leaking those into a sitemap or forgetting to disallow them
would waste crawl budget at best and leak account URLs at worst.

Individual features handled their own happy path, but cross-cutting
polish always slips if not explicitly owned. New error boundaries where
they're missing, empty states where they aren't obvious, and a systematic
Lighthouse run to catch a11y/perf regressions before the job is called
done.

### Implementation

#### SEO — Metadata + JSON-LD + Sitemap + Nav + Robots

**MODIFY** `src/app/products/[slug]/page.tsx` — append JSON-LD block
inside the returned JSX:

```tsx
// ...existing imports + generateStaticParams + generateMetadata...

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getProductBySlug(slug);
  if (!entry) notFound();

  const { meta, Component } = entry;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: meta.title,
    description: meta.summary,
    category: PRODUCT_CATEGORY_LABELS[meta.category],
    image: meta.heroImageUrl,
    brand: { '@type': 'Brand', name: 'Travis Gautier' },
    offers: {
      '@type': 'Offer',
      price: (meta.priceCents / 100).toFixed(2),
      priceCurrency: meta.currency.toUpperCase(),
      availability: 'https://schema.org/InStock',
      url: `https://travisgautier.com/products/${meta.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container as="article" className="py-16">
        {/* ...existing body unchanged... */}
      </Container>
    </>
  );
}
```

**MODIFY** `src/app/sitemap.ts` — append product URLs:

```ts
import type { MetadataRoute } from 'next';
import { getAllEpisodes } from '@/lib/content/episodes';
import { getAllCases } from '@/lib/content/cases';
import { getAllProducts } from '@/lib/content/products';

const BASE_URL = 'https://travisgautier.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, cases, products] = await Promise.all([
    getAllEpisodes(),
    getAllCases(),
    getAllProducts(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/episodes`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/cases`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/tools`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/products`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const episodeRoutes: MetadataRoute.Sitemap = episodes.map((ep) => ({
    url: `${BASE_URL}/episodes/${ep.slug}`,
    lastModified: ep.publishedAt ? new Date(ep.publishedAt) : undefined,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const caseRoutes: MetadataRoute.Sitemap = cases.map((c) => ({
    url: `${BASE_URL}/cases/${c.slug}`,
    lastModified: c.shippedAt ? new Date(c.shippedAt) : undefined,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...episodeRoutes, ...caseRoutes, ...productRoutes];
}
```

**MODIFY** `src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/products/account',
          '/products/account/',
          '/api/products/downloads',
          '/login',
          '/login/',
          '/api/auth',
        ],
      },
    ],
    sitemap: 'https://travisgautier.com/sitemap.xml',
  };
}
```

**MODIFY** `src/components/site/Header.tsx` — extend `NAV_ITEMS`:

```tsx
const NAV_ITEMS = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases', label: 'Cases' },
  { href: '/tools', label: 'Tools' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
];
```

(If `/tools` wasn't added by the free-tools job yet, omit that row; adjust
at implementation time based on what wf + earlier jobs have shipped.)

**MODIFY** `public/llms.txt` — add a line describing `/products` as the
public storefront catalog and explicitly noting that account/download
routes are intentionally excluded from crawling.

#### Error Boundaries + Not-Found + Lighthouse Sweep

**NEW** `src/app/products/account/error.tsx` — error boundary for the
account segment:

```tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/site/Container';

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[account error]', error);
  }, [error]);

  return (
    <Container as="section" className="py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted">Account</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">
        We couldn&rsquo;t load your account.
      </h1>
      <p className="mt-4 text-muted">
        This is on us. Try again, or head back to the{' '}
        <Link href="/products" className="text-link underline-offset-2 hover:underline">
          storefront
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md border border-mist px-4 py-2 text-sm hover:border-accent hover:text-accent"
      >
        Try again
      </button>
    </Container>
  );
}
```

**NEW** `src/app/products/account/not-found.tsx`:

```tsx
import Link from 'next/link';
import { Container } from '@/components/site/Container';

export default function AccountNotFound() {
  return (
    <Container as="section" className="py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted">Account</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">
        That purchase isn&rsquo;t in your account.
      </h1>
      <p className="mt-4 text-muted">
        It may belong to a different email address.
      </p>
      <Link
        href="/products/account"
        className="mt-8 inline-block rounded-md border border-mist px-4 py-2 text-sm hover:border-accent hover:text-accent"
      >
        Back to purchases
      </Link>
    </Container>
  );
}
```

**NEW** `src/app/products/error.tsx` — error boundary for the public
product segment (different message from the root error boundary from wf
1.4):

```tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/site/Container';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[products error]', error);
  }, [error]);

  return (
    <Container as="section" className="py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted">Storefront</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">
        We couldn&rsquo;t load the storefront.
      </h1>
      <p className="mt-4 text-muted">
        Try again in a moment, or head{' '}
        <Link href="/" className="text-link underline-offset-2 hover:underline">
          home
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md border border-mist px-4 py-2 text-sm hover:border-accent hover:text-accent"
      >
        Try again
      </button>
    </Container>
  );
}
```

**Lighthouse Sweep (manual, recorded in job exit report)**

Run against `npm run start` (not dev mode) for each of these URLs:

- `/products`
- `/products/workflow-templates`
- `/products/discovery-toolkit`
- `/login`
- `/login/verify`

Target scores (match wf 4.4 thresholds):
- Accessibility ≥ 95
- Performance ≥ 90
- SEO ≥ 95
- Best practices ≥ 90

Expected common issues + fixes:
- **Color contrast on muted text** — if Lighthouse flags `text-muted` on `bg-parchment`, tighten the steel token in `globals.css` slightly. Coordinate with the brand token decision from wf 1.3.
- **Missing form labels** — `<SignInForm>` uses a `<label>` wrapping an `<input>`. Verify.
- **Unique landmark names** — one `<main>`, one `<header>`, one `<footer>`. Verify no duplicate landmarks across nested layouts.
- **`aria-label` on the sign-out button** — if "Sign out" alone isn't enough context, add `aria-label="Sign out of your account"`.

### Tests (red phase of section `storefront-auth-4.2`)

**NEW** `src/app/__tests__/sitemap.test.ts`:

- Sitemap output includes `/products` and per-product URLs.
- Sitemap output does NOT include `/products/account`, `/products/downloads`, `/login`, or any subpath thereof.
- Sitemap output still includes episodes and cases (regression guard against the modify).

**NEW** `src/app/__tests__/robots.test.ts`:

- `disallow` list includes `/products/account` AND `/api/products/downloads` AND `/login`.
- `allow: '/'` is still present.
- `sitemap` URL points to the production domain.

**MODIFY** `src/app/products/[slug]/__tests__/page.test.tsx` (extend Phase 1 tests):

- Rendered HTML contains a `<script type="application/ld+json">` tag.
- The JSON-LD parses to an object with `@type: 'Product'`, correct `name`, `offers.price`, `offers.priceCurrency`, and a `https://travisgautier.com/products/{slug}` URL.

**NEW** `src/components/site/__tests__/Header.test.tsx`:

- `NAV_ITEMS` contains an entry with `href: '/products'` and `label: 'Products'`.

**NEW** `src/app/products/account/__tests__/error.test.tsx`:

- Renders the heading and a Try Again button.
- Clicking Try Again calls `reset()`.

**NEW** `src/app/products/__tests__/error.test.tsx`:

- Same structure for the public products error boundary.

No unit test for the Lighthouse sweep — that's a manual + CI-optional
check. Recorded in the job's finish artifacts.

### Design Decisions

**SEO:**
- **`Product` + nested `Offer` JSON-LD, not just `Product`** — Google's rich snippet for products requires the nested `offers` block. Omitting it loses the price display in search results.
- **`price` as a decimal string, not a number** — schema.org expects a string; numeric representation can lose trailing zeros (`49.00` becomes `49`).
- **Static `priority` values, not derived** — keeping them fixed and obvious is easier to reason about than calculating them from anything.
- **Sitemap assembles from three loaders in parallel** — matches the existing wf 4.4 pattern, just with a third loader added.
- **Robots disallow list is explicit and verbose** — trailing slashes, API paths, and login pages all listed. Prefix matching means `/products/account` would cover subpaths, but listing the trailing-slash variant makes the intent obvious in the generated `robots.txt`.
- **Header nav update is a one-line change to `NAV_ITEMS`** — no active-state styling added in this job; if active-state highlighting doesn't exist yet (wf 1.4 didn't include it), that's a scope boundary and stays deferred. A brief note in the README's Open Items.

**Error boundaries + Lighthouse:**
- **Segment-scoped error boundaries, not per-page** — one boundary for `/products/account/*`, one for `/products/*`. Fine-grained enough to recover independently without duplicating boilerplate at every page.
- **`not-found.tsx` on `/products/account` specifically** — the default root-level `not-found.tsx` from wf 1.4 would render the generic "This page is not part of the story" copy. An account-scoped not-found is more contextual ("that purchase isn't in your account").
- **No per-product `not-found.tsx`** — the public `/products/[slug]` page uses `dynamicParams = false`, so unknown slugs 404 at build time and route through the root `not-found.tsx` from wf 1.4. That's fine.
- **Lighthouse as manual check, not an automated gate** — running Lighthouse in CI is flaky (headless Chrome timing) and adds meaningful minutes to the build. Manual check during the finish phase of each section is the pragmatic choice; automate later if regressions become a pattern.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| MODIFY | `src/app/products/[slug]/page.tsx`                         |
| MODIFY | `src/app/products/[slug]/__tests__/page.test.tsx`          |
| MODIFY | `src/app/sitemap.ts`                                       |
| MODIFY | `src/app/robots.ts`                                        |
| MODIFY | `src/components/site/Header.tsx`                           |
| MODIFY | `public/llms.txt`                                          |
| NEW    | `src/app/__tests__/sitemap.test.ts`                        |
| NEW    | `src/app/__tests__/robots.test.ts`                         |
| NEW    | `src/components/site/__tests__/Header.test.tsx`            |
| NEW    | `src/app/products/account/error.tsx`                       |
| NEW    | `src/app/products/account/not-found.tsx`                   |
| NEW    | `src/app/products/error.tsx`                               |
| NEW    | `src/app/products/account/__tests__/error.test.tsx`        |
| NEW    | `src/app/products/__tests__/error.test.tsx`                |

---

## Phase 4 Exit Criteria

- `npm run lint` — clean
- `npm test` — all Phase 4 tests green; coverage still ≥ thresholds (70/80/80/80)
- `npm run build` — clean
- Manual smoke (against `npm run start`):
  - Signed-in user lands on `/products/account` and sees their purchases list sorted correctly.
  - `/products/account/purchases/[id]` shows a receipt for one purchase.
  - `/api/products/downloads/[id]` works from either the account overview or the detail page.
  - Sign-out button clears the session and redirects home.
  - `/sitemap.xml` contains exactly the public routes, NO gated routes.
  - `/robots.txt` disallows gated routes and references the sitemap.
  - `view-source:` on `/products/workflow-templates` shows a `Product`+`Offer` JSON-LD block that validates at https://validator.schema.org.
  - Header has a `/products` link between `/cases` and `/about` (or wherever the nav order ends up).
  - Lighthouse on `/products` and `/products/workflow-templates` meets the a11y / perf / SEO / best-practices thresholds.
  - Hitting `/products/account/purchases/{bogus-uuid}` shows the account-scoped not-found page.
  - Triggering a forced error in the account page (e.g., temporarily throw from the loader) shows the account error boundary with a working Try Again button.

## Job Exit Criteria (All Phases)

- Everything in Phase 1–4 exit criteria green.
- End-to-end purchase flow executed with a Stripe test card at least once per seed product.
- `pipeline/active/session.yaml` has 10 entries in `completed_sections` tagged `storefront-auth-1.1` through `storefront-auth-4.2`.
- Git log has 10 clean commits (one per section) with messages following the "commit after every feature" rule from CLAUDE.md.
- `docs/future-jobs.md` has been updated: `storefront-auth` row moved to the `## Completed` section at the bottom with a `**Shipped:** {date} — see commit {hash}` line, and the original section's "Suggested jobbuild prompt" block removed.
