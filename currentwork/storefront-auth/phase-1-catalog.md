# Phase 1: Catalog

**Total Size: M + M**
**Prerequisites: `website-foundation` has shipped through all four phases. `zod` installed (wf 1.2). MDX pipeline wired (wf 2.1). Content loader core exists (wf 2.2). Design tokens + Container + Header/Footer in place (wf 1.3/1.4). `Case` schema + validator landed (wf 1.1/1.2) as the shape reference.**
**New Types: `Product` (plus `PRODUCT_CATEGORIES`, `PRODUCT_LICENSE_TYPES` tuples, `ProductSchema` Zod validator)**
**New Files: `src/content/schemas/product.ts`, `src/content/products/{workflow-templates,discovery-toolkit}.mdx`, `src/lib/content/products.ts`, `src/app/products/page.tsx`, `src/app/products/[slug]/page.tsx`, `src/components/products/{ProductCard,BuyButton}.tsx`, plus tests**

Phase 1 delivers the **public** half of the storefront: the `Product`
content type, the loader, two seed MDX files, and the catalog routes. No
auth, no payments, no persistence — the Buy button renders but is disabled
until Phase 3. This phase is shippable on its own: even if Phase 2+3 slip,
travisgautier.com has a browsable product catalog that indexes well in Google
and links out to coming-soon state.

---

## Feature 1.1: Product Content Pipeline (Schema + Validator + Loader + Seed MDX) ✓ Shipped

**Complexity: M** — One coherent data contract: the `Product` type, the
Zod validator that gates content at load time, the loader wrappers, and
two seed MDX files so 1.2 has data to render. These three concerns are
inseparable: the validator imports the schema's enums, the loader invokes
the validator, and the seed MDX exercises both. Merging them avoids three
near-identical pipeline runs over the same handful of files.

### Problem

The implementation doc specifies `/products` as the monetization layer with
categories: workflow templates, discovery toolkit, proposal kit, complete
playbook, and course/cohort enrollment (deferred to `cohort-enrollment`).
There is no `Product` type, no runtime validator, and no loader. Every
downstream feature that touches `/products` — routes, BuyButton, webhook
idempotency check, download handler, account list — needs all three.

Seed products will come from MDX files authored by humans (or agents) who
will typo fields, forget required ones, or paste the wrong Stripe price ID.
Without runtime validation, the first sign of trouble is a cryptic render
error deep in a server component or — worse — a live Buy button that creates
a Stripe Checkout Session against the wrong price. The loader needs a
validator at the content boundary so bad content fails loudly and
immediately with an actionable error message.

Without seed data, `/products` (Feature 1.2) renders an empty state and
verification can't confirm the layout.

### Implementation

#### Schema

Follow the existing schema file pattern from `src/content/schemas/case.ts`
(wf 1.1): `as const` tuples for enumerated values, derived union types,
label maps, and the record interface.

**NEW** `src/content/schemas/product.ts`:

```ts
export const PRODUCT_CATEGORIES = [
  'workflow-templates',
  'discovery-toolkit',
  'proposal-kit',
  'complete-playbook',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  'workflow-templates': 'Workflow Templates',
  'discovery-toolkit': 'Discovery Toolkit',
  'proposal-kit': 'Proposal Kit',
  'complete-playbook': 'Complete Playbook',
};

export const PRODUCT_LICENSE_TYPES = [
  'single-user',
  'team',
  'agency',
] as const;

export type ProductLicenseType = (typeof PRODUCT_LICENSE_TYPES)[number];

export const PRODUCT_LICENSE_LABELS: Record<ProductLicenseType, string> = {
  'single-user': 'Single user',
  team: 'Team (up to 10)',
  agency: 'Agency (unlimited seats)',
};

export interface Product {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  category: ProductCategory;
  licenseType: ProductLicenseType;
  /** Price in the smallest currency unit (cents for USD). */
  priceCents: number;
  /** ISO 4217 currency code, lowercase per Stripe convention. */
  currency: string;
  /** Stripe `price_xxx` ID — user provisions in Stripe dashboard and pastes here. */
  stripePriceId: string;
  /** Filename under `private/products/`, resolved by the download handler. */
  assetFilename: string;
  /** Optional hero image for OG + detail page. */
  heroImageUrl?: string;
  /** Outbound links to related LLL entries (same convention as Episode/Case). */
  lllEntryUrls: string[];
  /** IDs of cases this product is tied to, for reverse crosslinks. */
  relatedCaseIds: string[];
  publishedAt: string;
}
```

**MODIFY** `src/content/schemas/index.ts` — add the barrel export:

```ts
export * from './content-tier';
export * from './content-pillar';
export * from './episode';
export * from './source-material';
export * from './case';
export * from './product';
export * from './validators';
```

#### Validator

Append `ProductSchema` to the existing `validators.ts` file from wf 1.2,
following the same pattern as `CaseSchema`.

**MODIFY** `src/content/schemas/validators.ts` — append the new schema:

```ts
import { PRODUCT_CATEGORIES, PRODUCT_LICENSE_TYPES } from './product';

// ...existing EpisodeSchema, SourceMaterialSchema, CaseSchema...

export const ProductSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  tagline: z.string().min(1),
  summary: z.string().min(1),
  category: z.enum(PRODUCT_CATEGORIES),
  licenseType: z.enum(PRODUCT_LICENSE_TYPES),
  priceCents: z.number().int().positive(),
  currency: z.string().length(3).toLowerCase(),
  stripePriceId: z.string().regex(/^price_[A-Za-z0-9]+$/),
  assetFilename: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9._-]+$/, 'filename must not contain path separators'),
  heroImageUrl: z.string().url().optional(),
  lllEntryUrls: z.array(z.string().url()),
  relatedCaseIds: z.array(z.string()),
  publishedAt: z.string().datetime(),
});

export type ProductInput = z.input<typeof ProductSchema>;
```

#### Loader + Seed MDX

Mirror the `episodes.ts`/`cases.ts` loader pattern from wf 2.2 for products,
plus two seed MDX files with stub copy.

**NEW** `src/lib/content/products.ts` — mirror the `cases.ts` structure:

```ts
import { ProductSchema, type Product } from '@/content/schemas';
import { loadContent, type LoadedEntry } from './loader';

const PRODUCTS_DIRECTORY = 'src/content/products';

export async function getAllProducts(): Promise<Product[]> {
  const entries = await loadContent<Product>({
    directory: PRODUCTS_DIRECTORY,
    schema: ProductSchema,
  });
  return entries
    .map((e) => e.meta)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getProductBySlug(
  slug: string,
): Promise<LoadedEntry<Product> | null> {
  const entries = await loadContent<Product>({
    directory: PRODUCTS_DIRECTORY,
    schema: ProductSchema,
  });
  return entries.find((e) => e.meta.slug === slug) ?? null;
}
```

**NEW** `src/content/products/workflow-templates.mdx`:

```mdx
export const meta = {
  id: 'prod-workflow-templates',
  slug: 'workflow-templates',
  title: 'Agent Workflow Templates',
  tagline: 'The exact TDD pipeline templates behind every Travis Gautier build.',
  summary: 'A downloadable set of agent skill manifests, discovery YAML templates, and TDD phase prompts — the same files the Travis Gautier channel and storefront are built with.',
  category: 'workflow-templates',
  licenseType: 'single-user',
  priceCents: 4900,
  currency: 'usd',
  stripePriceId: 'price_REPLACE_ME_BEFORE_SHIPPING',
  assetFilename: 'workflow-templates.zip',
  lllEntryUrls: [],
  relatedCaseIds: ['party-masters'],
  publishedAt: '2026-04-11T00:00:00.000Z',
};

## What's inside

A zipped bundle of the `.claude/skills/` tree, plus the `pipeline/TEMPLATE.md`
and `currentwork/TEMPLATE.md` files, lightly sanitized for a solo consultancy
setup.

## Who this is for

Consultants who want to run the Travis Gautier TDD pipeline against their own
client projects without piecing it together from the channel.

_Placeholder stub copy. Real product content is a separate concern._
```

**NEW** `src/content/products/discovery-toolkit.mdx`:

```mdx
export const meta = {
  id: 'prod-discovery-toolkit',
  slug: 'discovery-toolkit',
  title: 'Discovery Toolkit',
  tagline: 'Ten ready-to-run discovery templates for new client engagements.',
  summary: 'Market research prompts, stakeholder interview scripts, MoSCoW templates, and the exact discovery YAML contracts the Travis Gautier pipeline consumes.',
  category: 'discovery-toolkit',
  licenseType: 'single-user',
  priceCents: 2900,
  currency: 'usd',
  stripePriceId: 'price_REPLACE_ME_BEFORE_SHIPPING',
  assetFilename: 'discovery-toolkit.zip',
  lllEntryUrls: [],
  relatedCaseIds: ['party-masters'],
  publishedAt: '2026-04-11T00:00:00.000Z',
};

## What's inside

Discovery-phase templates, interview scripts, and the YAML contracts the
`/discovery` skill produces and `/red` consumes.

_Placeholder stub copy. Real product content is a separate concern._
```

### Tests (red phase of section `storefront-auth-1.1`)

**MODIFY** `src/content/schemas/__tests__/validators.test.ts` (extend the
existing file from wf 1.2):

- `ProductSchema` accepts a minimal valid record (every required field present, no optionals).
- `ProductSchema` accepts a fully-populated record (hero image included).
- `ProductSchema` rejects an invalid `category` enum value with a readable error.
- `ProductSchema` rejects a `stripePriceId` that doesn't match `price_*` prefix.
- `ProductSchema` rejects `assetFilename` containing `../` or `/`.
- `ProductSchema` rejects `priceCents: 0` and `priceCents: -100`.
- `ProductSchema` rejects `currency` of wrong length (`'USD'` is fine after `.toLowerCase()`, `'US'` is not).
- `ProductSchema` rejects slug with uppercase or underscores.
- `ProductSchema` rejects missing required fields one at a time and reports the failing path.

**NEW** `src/lib/content/__tests__/products.test.ts`:

- `getAllProducts()` returns two records matching the seed files.
- Returned records are sorted by `publishedAt` descending (same publishedAt → stable order).
- Every returned record passes `ProductSchema.safeParse`.
- `getProductBySlug('workflow-templates')` returns `{ meta, Component }`.
- `getProductBySlug('bogus')` returns `null`.
- Loader fails loudly if a seed file's `meta` export fails Zod validation (test adds a malformed temp file in an isolated temp directory).

### Design Decisions

**Schema:**
- **`priceCents: number` + `currency: string`** — matches Stripe's line-item convention (`unit_amount` in minor units, `currency` lowercase ISO 4217). Avoids floating-point price arithmetic. Frontend formats via `Intl.NumberFormat`.
- **`stripePriceId` lives on the product record, not a mapping file** — the MDX frontmatter is the source of truth for which Stripe Price drives this product. Phase 3.1's `resolveStripePriceId()` is a thin lookup over the loaded `Product` record, not a separate registry.
- **`assetFilename` as a filename only, not an absolute path** — prevents MDX authors from pointing outside `private/products/`. Phase 3.3's download handler resolves the final path via `path.join('private/products', assetFilename)` and uses `path.resolve` to reject traversal attempts.
- **`licenseType` on the product, not the purchase** — v1 ships with every seed product as `'single-user'`. The enum leaves room for team/agency without requiring a data migration when those licenses become real.
- **`publishedAt` required** — enables `generateStaticParams` filtering and stable sort order on the index page.
- **No `status: 'draft' | 'active'`** — if a product isn't ready, don't commit the MDX file. Every file in `src/content/products/` is implicitly live.
- **No `relatedEpisodeIds`** — episodes don't currently link to products, and products are a different audience surface. Cross-linking only happens from case studies (`relatedCaseIds`).

**Validator:**
- **`assetFilename` regex excludes path separators** — defense-in-depth against directory traversal at the download handler. The download handler ALSO validates with `path.resolve`, but the validator catches the typo at content-load time rather than at purchase-delivery time.
- **`stripePriceId` regex** — Stripe price IDs are always `price_` + alphanumerics. A loose check at this layer is enough; Stripe itself is the final validator at Checkout Session creation time.
- **`currency` lowercased via `.toLowerCase()` Zod transform** — Stripe API requires lowercase (`'usd'`, not `'USD'`). Accept any case in MDX, normalize at validation.
- **`priceCents` positive integer** — zero and negative prices are never legitimate in a storefront; free products wouldn't need Stripe Checkout at all.
- **Slug regex `/^[a-z0-9-]+$/`** — matches the existing `CaseSchema`/`EpisodeSchema` convention for URL safety.

**Loader + Seed MDX:**
- **Seed files intentionally ship with `price_REPLACE_ME_BEFORE_SHIPPING`** — the Zod validator accepts them (they match `/^price_[A-Za-z0-9_]+$/`) but Stripe will 400 on any checkout attempt. This is intentional friction: the user provisions real Stripe prices before Phase 3 is live.
- **`relatedCaseIds: ['party-masters']`** — ties both seed products back to the case study wf 2.3 ships. When Phase 4 adds the case detail "related products" surface (not in this job, but future), the link already exists.
- **Two seed products, not four** — the `docs/future-jobs.md` entry names five categories but notes "Course / cohort enrollment — deferred to `cohort-enrollment`". "Proposal kit" and "complete playbook" are deferred to real product launches because they'd need substantial stub copy. Two products exercises the loader + routes + Stripe flow just as well as four.
- **Loader re-reads from disk each call, no module-level cache** — matches the `wf` episodes/cases pattern. Next.js's `unstable_cache` / route-segment cache handles request-level memoization, and in production the content is baked into the bundle at build time anyway.

### Files

| Action | File                                                 |
|--------|------------------------------------------------------|
| NEW    | `src/content/schemas/product.ts`                     |
| MODIFY | `src/content/schemas/index.ts`                       |
| MODIFY | `src/content/schemas/validators.ts`                  |
| MODIFY | `src/content/schemas/__tests__/validators.test.ts`   |
| NEW    | `src/lib/content/products.ts`                        |
| NEW    | `src/lib/content/__tests__/products.test.ts`         |
| NEW    | `src/content/products/workflow-templates.mdx`        |
| NEW    | `src/content/products/discovery-toolkit.mdx`         |

---

## Feature 1.2: Products Catalog Routes (Index + Detail)

**Complexity: M** — Public SEO entry point listing every product as a card,
plus the dynamic detail route with `generateStaticParams`, MDX body
rendering, disabled Buy button, and `generateMetadata`. Same-entity views:
both pages call the same loader, share the `ProductCard` and `BuyButton`
components, and follow the same `params: Promise<...>` Next.js 16 contract
— testing them together is the natural unit.

### Problem

The storefront's browse surface (`/products`) is the page Google indexes,
so every bit of it must be static-renderable. Each product also needs a
full detail page (`/products/[slug]`): tagline, summary, category label,
price, license info, MDX body, and a Buy CTA. The CTA renders disabled in
Phase 1 because Stripe isn't wired yet — Phase 3.1 flips it to live without
touching the page shell. Unknown slugs must 404 at build time via
`dynamicParams = false`, following the wf 3.3/3.5 precedent for
`/episodes/[slug]` and `/cases/[slug]`.

### Implementation

#### Index Page

**NEW** `src/app/products/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { getAllProducts } from '@/lib/content/products';
import { ProductCard } from '@/components/products/ProductCard';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Workflow templates, discovery toolkits, and the full Travis Gautier playbook — the exact assets behind the channel.',
};

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <Container as="section" className="py-16">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-wide text-muted">Storefront</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Products
        </h1>
        <p className="mt-4 text-lg text-muted">
          Every asset the Travis Gautier channel and case studies are built with —
          bundled, documented, and licensed for solo consultants and agencies.
        </p>
      </header>
      <ul className="mt-12 grid gap-6 md:grid-cols-2">
        {products.map((product) => (
          <li key={product.id}>
            <Link href={`/products/${product.slug}`} className="block">
              <ProductCard product={product} />
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
```

**NEW** `src/components/products/ProductCard.tsx`:

```tsx
import type { Product } from '@/content/schemas';
import { PRODUCT_CATEGORY_LABELS } from '@/content/schemas';

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group h-full rounded-lg border border-mist p-6 transition hover:border-accent">
      <p className="text-xs uppercase tracking-wide text-muted">
        {PRODUCT_CATEGORY_LABELS[product.category]}
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold group-hover:text-accent">
        {product.title}
      </h2>
      <p className="mt-3 text-sm text-muted">{product.tagline}</p>
      <p className="mt-6 font-display text-2xl font-semibold">
        {formatPrice(product.priceCents, product.currency)}
      </p>
    </article>
  );
}
```

#### Detail Page

**NEW** `src/app/products/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/site/Container';
import { BuyButton } from '@/components/products/BuyButton';
import {
  getAllProducts,
  getProductBySlug,
} from '@/lib/content/products';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_LICENSE_LABELS,
} from '@/content/schemas';

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getProductBySlug(slug);
  if (!entry) return {};
  const { meta } = entry;
  return {
    title: meta.title,
    description: meta.summary,
    openGraph: {
      title: meta.title,
      description: meta.summary,
      type: 'website',
      images: meta.heroImageUrl ? [meta.heroImageUrl] : undefined,
    },
  };
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getProductBySlug(slug);
  if (!entry) notFound();

  const { meta, Component } = entry;

  return (
    <Container as="article" className="py-16">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-wide text-muted">
          {PRODUCT_CATEGORY_LABELS[meta.category]}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          {meta.title}
        </h1>
        <p className="mt-4 text-lg text-muted">{meta.tagline}</p>
      </header>

      <div className="mt-12 flex items-center gap-6">
        <p className="font-display text-3xl font-semibold">
          {formatPrice(meta.priceCents, meta.currency)}
        </p>
        <p className="text-sm text-muted">
          {PRODUCT_LICENSE_LABELS[meta.licenseType]}
        </p>
      </div>

      <div className="mt-6">
        <BuyButton productSlug={meta.slug} />
      </div>

      <section className="mt-16 prose prose-neutral max-w-2xl">
        <Component />
      </section>
    </Container>
  );
}
```

**NEW** `src/components/products/BuyButton.tsx`:

```tsx
'use client';

import { useState, useTransition } from 'react';

interface BuyButtonProps {
  productSlug: string;
}

/**
 * Phase 1: renders disabled with a "Coming soon" label.
 * Phase 3.1 replaces the body with a real `createCheckoutSession()` call
 * without changing the component's public API.
 */
export function BuyButton({ productSlug }: BuyButtonProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isLive = false; // Phase 3.1 flips this to true.

  if (!isLive) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="rounded-md border border-mist bg-mist/30 px-6 py-3 text-sm font-semibold text-muted"
      >
        Coming soon
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-parchment hover:bg-accent/90"
        onClick={() => {
          startTransition(async () => {
            setError(null);
            // Phase 3.1 replaces with createCheckoutSession(productSlug).
            void productSlug;
          });
        }}
      >
        Buy now
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
```

### Tests (red phase of section `storefront-auth-1.2`)

**NEW** `src/app/products/__tests__/page.test.tsx`:

- Renders a heading "Products".
- Renders one `<ProductCard>` per product returned from the mocked loader.
- Each card links to `/products/{slug}`.
- With an empty product list, renders an empty-state message (not a zero-length `<ul>`).
- Page export has a static `metadata` object (no dynamic segments at this level).

**NEW** `src/app/products/[slug]/__tests__/page.test.tsx`:

- `generateStaticParams` returns entries for all seed products.
- Page rendered with a known slug shows the product title, tagline, price, category label, license label, and MDX body.
- Page rendered with an unknown slug calls `notFound()`.
- `generateMetadata` returns title + description from the product `meta`.
- Renders `<BuyButton>` passing the product slug.
- `<BuyButton>` renders disabled with `aria-disabled="true"` and "Coming soon" text when `isLive === false` (current state).

### Design Decisions

**Index page:**
- **No `cookies()` call** — page is fully static. Next.js prerenders it at build time.
- **`Intl.NumberFormat` inline in the component** — no shared formatter utility yet. If Phase 4.1's account page also needs this, extract then. Three similar call sites are the threshold for an extraction per the "no premature abstraction" rule in CLAUDE.md.
- **Grid layout `md:grid-cols-2`** — readable on desktop, stacks on mobile. Matches the visual weight of the `/episodes` and `/cases` indices from wf 3.2/3.4.
- **Card is wrapped in `<Link>` at the list level, not inside the card** — keeps the `ProductCard` component router-agnostic and testable in isolation.

**Detail page:**
- **`params: Promise<{ slug: string }>` — await before use** — Next.js 16 breaking change. Every page signature in this job must follow this shape.
- **`dynamicParams = false`** — unknown slugs 404 at build time, which keeps the storefront sealed and matches wf 3.3/3.5.
- **`BuyButton` is a client component even in Phase 1** — it reads no server state in Phase 1, but declaring it `'use client'` now means Phase 3.1 can add `useTransition` + a server action call without an import graph change. The `isLive` const is the single flip point.
- **`notFound()` call + `if (!entry) notFound()` pattern** — matches wf 3.3/3.5 exactly for consistency and correct 404 handling under `dynamicParams = false`.
- **JSON-LD is NOT added in Phase 1** — Feature 4.2 owns structured data across the board (episodes, cases, products) to keep all SEO work in one phase. Phase 1 is catalog-shape only.
- **Price formatter duplicated in `page.tsx` and `ProductCard.tsx`** — two call sites don't justify an extraction. Three would; Phase 4.1's account page is the likely third, and that's when `src/lib/format-price.ts` lands.

### Files

| Action | File                                                  |
|--------|-------------------------------------------------------|
| NEW    | `src/app/products/page.tsx`                           |
| NEW    | `src/app/products/[slug]/page.tsx`                    |
| NEW    | `src/components/products/ProductCard.tsx`             |
| NEW    | `src/components/products/BuyButton.tsx`               |
| NEW    | `src/app/products/__tests__/page.test.tsx`            |
| NEW    | `src/app/products/[slug]/__tests__/page.test.tsx`     |

---

## Phase 1 Exit Criteria

- `npm run lint` — clean
- `npm test` — `ProductSchema` validator tests + product loader tests + page snapshot tests green
- `npm run build` — clean, static generation succeeds for `/products/workflow-templates` and `/products/discovery-toolkit`
- Manual `npm run dev`:
  - `/products` renders two product cards with correct titles, categories, prices
  - `/products/workflow-templates` renders detail page + MDX body + disabled "Coming soon" button
  - `/products/discovery-toolkit` same
  - `/products/bogus` returns 404
- `import { Product, ProductSchema, PRODUCT_CATEGORIES } from '@/content/schemas'` resolves under strict TS
