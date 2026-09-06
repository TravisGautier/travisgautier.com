# Phase 1: Foundation

**Total Size: S + M + M + M**
**Prerequisites: None**
**New Types: `Case` (plus Zod schema objects for Episode, SourceMaterial, Case)**
**New Files: `src/content/schemas/case.ts`, `src/content/schemas/validators.ts`, `src/components/site/Header.tsx`, `src/components/site/Footer.tsx`, `src/components/site/Container.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`**

Phase 1 lays down the typed content model, runtime validators, branded visual
system, and site shell that every later phase builds on. No content is loaded,
no routes are added — this phase makes the *frame*, not the pictures.

---

## Feature 1.1: `Case` Content Schema

**Complexity: S** — Add a new content type module that follows the existing
schema file pattern and wire it into the barrel export.

### Problem

The implementation doc specifies that `/cases` is a launch-critical route with
a documented structure (overview, research, discovery, decisions, deliverables,
outcome, LLL crosslinks). There is no `Case` type yet — only `Episode`,
`SourceMaterial`, and the two enums. Every downstream feature that touches
`/cases` (loader, routes, sitemap, crosslinks) needs this type first.

### Implementation

Add `src/content/schemas/case.ts` in the same shape as the existing
`content-tier.ts` + `episode.ts` modules: a small `as const` tuple for
enumerated values, a derived union type, a label map, and the record interface.

**NEW** `src/content/schemas/case.ts`:

```ts
export const CASE_STATUSES = [
  'active',
  'shipped',
  'paused',
  'archived',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  active: 'Active Engagement',
  shipped: 'Shipped & In Production',
  paused: 'Paused',
  archived: 'Archived',
};

export interface Case {
  id: string;
  slug: string;
  title: string;
  client: string;
  status: CaseStatus;
  summary: string;
  problem: string;
  marketResearch: string;
  discoveryProcess: string;
  technicalDecisions: string;
  deliverables: string[];
  outcome: string;
  startedAt?: string;
  shippedAt?: string;
  contractValue?: number;
  relatedEpisodeIds: string[];
  lllEntryUrls: string[];
  heroImageUrl?: string;
}
```

**MODIFY** `src/content/schemas/index.ts` — add the new barrel export:

```ts
export * from './content-tier';
export * from './content-pillar';
export * from './episode';
export * from './source-material';
export * from './case';
```

### Design Decisions

- **String fields for narrative sections (`marketResearch`, `discoveryProcess`, `technicalDecisions`, `outcome`)** — these end up as MDX bodies on the case detail page, so the `meta` export on each MDX file declares the summary fields as strings (headings or short descriptions) and the MDX body carries the full prose. This keeps the type narrow and forces longer content into the MDX body where it belongs.
- **`contractValue?` optional** — case studies in early seasons may deliberately withhold dollar figures; do not force a value.
- **`relatedEpisodeIds: string[]`** — mirrors `Episode.sourceMaterialIds` and enables bidirectional "this case was documented in these episodes" crosslinks when the episode loader is wired up.
- **`CASE_STATUSES` as a closed tuple** — new statuses must be added deliberately, and TypeScript narrows correctly in switch/case rendering logic.
- **No optional `id`** — the ID is the stable machine handle; slug is the URL handle. Keep both mandatory to avoid ambiguity.

### Files

| Action | File                             |
|--------|----------------------------------|
| NEW    | `src/content/schemas/case.ts`    |
| MODIFY | `src/content/schemas/index.ts`   |

---

## Feature 1.2: Zod Runtime Validators

**Complexity: M** — Zod schemas that mirror `Episode`, `SourceMaterial`, and
`Case` at runtime, with focused unit tests covering happy path + failure modes.

### Problem

Content is going to flow in from MDX files. MDX file authors (including
agents) will typo fields, forget required ones, and get enum values slightly
wrong. Without runtime validation, the first sign of trouble is a cryptic
React render error deep in a server component. The loader in Phase 2 depends
on a validator at the content boundary so bad content fails loudly and
immediately with an actionable error message.

### Implementation

Install `zod` at the start of this phase:

```bash
npm install zod
```

**NEW** `src/content/schemas/validators.ts` — Zod schemas that mirror the
existing TS interfaces and enums:

```ts
import { z } from 'zod';
import { CONTENT_TIERS } from './content-tier';
import { CONTENT_PILLARS } from './content-pillar';
import { SOURCE_MATERIAL_KINDS } from './source-material';
import { CASE_STATUSES } from './case';

export const EpisodeSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  series: z.string().min(1),
  season: z.number().int().positive().optional(),
  act: z.number().int().positive().optional(),
  episodeNumber: z.number().int().nonnegative(),
  tier: z.enum(CONTENT_TIERS),
  pillar: z.enum(CONTENT_PILLARS),
  summary: z.string().min(1),
  sourceMaterialIds: z.array(z.string()),
  lllEntryUrls: z.array(z.string().url()),
  durationMinutes: z.number().int().positive().optional(),
  publishedAt: z.string().datetime().optional(),
  youtubeUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  transcriptPath: z.string().optional(),
});

export const SourceMaterialSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  kind: z.enum(SOURCE_MATERIAL_KINDS),
  description: z.string().min(1),
  episodeIds: z.array(z.string()),
  path: z.string().optional(),
});

export const CaseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  client: z.string().min(1),
  status: z.enum(CASE_STATUSES),
  summary: z.string().min(1),
  problem: z.string().min(1),
  marketResearch: z.string(),
  discoveryProcess: z.string(),
  technicalDecisions: z.string(),
  deliverables: z.array(z.string()),
  outcome: z.string(),
  startedAt: z.string().datetime().optional(),
  shippedAt: z.string().datetime().optional(),
  contractValue: z.number().nonnegative().optional(),
  relatedEpisodeIds: z.array(z.string()),
  lllEntryUrls: z.array(z.string().url()),
  heroImageUrl: z.string().url().optional(),
});

export type EpisodeInput = z.input<typeof EpisodeSchema>;
export type CaseInput = z.input<typeof CaseSchema>;
export type SourceMaterialInput = z.input<typeof SourceMaterialSchema>;
```

**MODIFY** `src/content/schemas/index.ts` — add validator export:

```ts
export * from './validators';
```

### Tests (red phase of section `website-foundation-1.2` will write these)

Colocate under `src/content/schemas/__tests__/validators.test.ts`:

- EpisodeSchema accepts a minimal valid record (only required fields).
- EpisodeSchema accepts a fully-populated record.
- EpisodeSchema rejects invalid `tier` enum value with a readable error.
- EpisodeSchema rejects non-URL `lllEntryUrls[]` entries.
- EpisodeSchema rejects slug with uppercase/underscores.
- SourceMaterialSchema rejects unknown `kind`.
- CaseSchema rejects missing required fields (`client`, `problem`).
- CaseSchema rejects negative `contractValue`.
- CaseSchema accepts minimal + full records.

### Design Decisions

- **Slug regex `/^[a-z0-9-]+$/`** — URL-safe, lowercase, filename-friendly, matches the convention of existing projects that use slugs as filesystem handles.
- **Zod schema file separate from interface files** — keeps the TS interfaces free of runtime imports. Server components and pure type consumers don't need to pull `zod`.
- **`z.enum(CONST_TUPLE)`** — reuses the `as const` tuples already defined in the schema modules. Single source of truth for enum values.
- **`z.string().datetime()`** for timestamps — ISO 8601 only, no bespoke date formats.
- **Exporting `EpisodeInput`/`CaseInput` input types** — callers that build records programmatically get type assistance against the pre-parse shape (handles Zod transforms gracefully if any are added later).

### Files

| Action | File                                              |
|--------|---------------------------------------------------|
| NEW    | `src/content/schemas/validators.ts`               |
| NEW    | `src/content/schemas/__tests__/validators.test.ts` |
| MODIFY | `src/content/schemas/index.ts`                    |

---

## Feature 1.3: Brand Design System

**Complexity: M** — Replace the scaffold's placeholder design tokens with a
real brand palette, typography, and dark-mode handling that every page will
inherit.

### Problem

`src/app/globals.css` is currently the Next.js scaffold default: white/black
tokens, `Arial, Helvetica, sans-serif` as the body font, Geist fonts loaded but
not actually applied. The brand identity doc specifies "boutique consultancy,
not YouTuber" — muted confident colors, strong typography, narrative quality.
None of that is realized in CSS yet. Every page built in Phase 3 will re-guess
tokens unless we lock them in first.

### Implementation

**MODIFY** `src/app/globals.css` — define the brand token layer:

```css
@import "tailwindcss";

@theme inline {
  /* Brand palette — muted confident colors per brand-identity doc */
  --color-ink: #0a0a0a;          /* near-black text on light */
  --color-parchment: #faf8f3;    /* warm off-white background */
  --color-ember: #c2410c;        /* accent — rusted orange (the "fabled" side) */
  --color-steel: #475569;        /* secondary text, borders */
  --color-mist: #e2e8f0;         /* subtle dividers, hover states */
  --color-signal: #0891b2;       /* link color — teal ("10X" tech side) */

  --color-background: var(--color-parchment);
  --color-foreground: var(--color-ink);
  --color-muted: var(--color-steel);
  --color-accent: var(--color-ember);
  --color-link: var(--color-signal);

  --font-display: var(--font-geist-sans);
  --font-body: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  @theme inline {
    --color-background: #0d0d0f;
    --color-foreground: #e8e8e3;
    --color-muted: #94a3b8;
    --color-mist: #1e293b;
  }
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-body), system-ui, sans-serif;
  font-feature-settings: "ss01", "cv11";
}
```

**MODIFY** `src/app/layout.tsx` — ensure the Geist font variables are applied
to `<html>` (already partially done in the scaffold) and add the `metadataBase`:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://travisgautier.com'),
  title: {
    default: 'travisgautier',
    template: '%s · travisgautier',
  },
  description: 'One person. An agent team. Full SaaS delivery.',
};
```

### Design Decisions

- **Warm parchment background, not pure white** — aligns with the "narrative/storybook" half of the brand tension. Keeps the site visually distinct from standard SaaS blue-gradient sites.
- **Ember + signal as the two accent colors** — ember (rust-orange) for primary CTAs and brand flourishes, signal (teal) for inline links. The two-accent system keeps the brand from feeling monotone without descending into "color salad".
- **Geist sans for display AND body** — the brand doc says "strong typography" but doesn't mandate a pairing. Using one superfamily for both simplifies font loading and keeps Phase 1 shippable. Can be revisited in a future refresh.
- **Values are suggestions, not sacred** — the jobbuild plan notes that specific hex values are a Phase 1.3 decision. Adjust during implementation if the visual preview doesn't match the brand doc's direction. Commit when the result feels "boutique consultancy" rather than "generic SaaS".
- **Dark mode via `prefers-color-scheme`** — no manual toggle in this phase; system preference is enough for Phase 1. A manual theme toggle is a polish task for a future job.

### Files

| Action | File                       |
|--------|----------------------------|
| MODIFY | `src/app/globals.css`      |
| MODIFY | `src/app/layout.tsx`       |

---

## Feature 1.4: Site Shell

**Complexity: M** — Header, footer, container primitive, error boundary, and
not-found boundary — the wrapper every page lives inside.

### Problem

The scaffold's `src/app/layout.tsx` renders children directly into `<body>`
with no navigation, no brand mark, no footer, and no error/not-found handling.
Phase 3 will produce six routes and each needs to render inside a consistent
shell. Building the shell once, now, prevents six different implementations
later.

### Implementation

**NEW** `src/components/site/Container.tsx` — width constraint + horizontal padding primitive used by every page body:

```tsx
import { type ReactNode } from 'react';
import { clsx } from 'clsx'; // or inline if clsx isn't added

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'main' | 'article';
}

export function Container({
  children,
  className,
  as: Tag = 'div',
}: ContainerProps) {
  return (
    <Tag className={clsx('mx-auto w-full max-w-5xl px-6 md:px-10', className)}>
      {children}
    </Tag>
  );
}
```

(If `clsx` isn't already a dependency, inline the class concatenation — don't
add a dep for this one use.)

**NEW** `src/components/site/Header.tsx`:

```tsx
import Link from 'next/link';
import { Container } from './Container';

const NAV_ITEMS = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases', label: 'Cases' },
  { href: '/about', label: 'About' },
];

export function Header() {
  return (
    <header className="border-b border-mist">
      <Container as="div" className="flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          fabled<span className="text-accent">10x</span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
```

**NEW** `src/components/site/Footer.tsx`:

```tsx
import Link from 'next/link';
import { Container } from './Container';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-mist py-12">
      <Container as="div" className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-lg font-semibold">
            fabled<span className="text-accent">10x</span>
          </p>
          <p className="mt-2 text-sm text-muted max-w-sm">
            One person. An agent team. Full SaaS delivery.
          </p>
        </div>
        <div className="text-sm text-muted max-w-sm">
          <p className="font-semibold text-foreground">Sister project</p>
          <p className="mt-1">
            The structured AI knowledge base built and championed by
            Travis Gautier lives at{' '}
            <Link
              href="https://largelanguagelibrary.ai"
              className="text-link underline-offset-2 hover:underline"
            >
              largelanguagelibrary.ai
            </Link>
            .
          </p>
        </div>
      </Container>
    </footer>
  );
}
```

**MODIFY** `src/app/layout.tsx` — wrap children with the shell:

```tsx
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

**NEW** `src/app/not-found.tsx`:

```tsx
import Link from 'next/link';
import { Container } from '@/components/site/Container';

export default function NotFound() {
  return (
    <Container as="section" className="py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold">This page is not part of the story.</h1>
      <p className="mt-4 text-muted">
        The page you were looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md border border-mist px-4 py-2 text-sm hover:border-accent hover:text-accent"
      >
        Back to the homepage
      </Link>
    </Container>
  );
}
```

**NEW** `src/app/error.tsx` — client error boundary for the root segment:

```tsx
'use client';

import { useEffect } from 'react';
import { Container } from '@/components/site/Container';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[root error boundary]', error);
  }, [error]);

  return (
    <Container as="section" className="py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted">Something broke</p>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        We hit an unexpected error.
      </h1>
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

### Design Decisions

- **Dedicated `Container` primitive** — every page needs the same max-width + padding. Centralizing it avoids six copies of `mx-auto max-w-5xl px-6` and makes a future container-width change a one-file edit.
- **`NAV_ITEMS` as a local constant inside `Header.tsx`** — not worth hoisting to a config file until there are more than three items.
- **`next/link` everywhere, no `<a href>`** — App Router prefetching hinges on `Link`.
- **Footer includes LLL callout by default** — the implementation-plan doc says the sister-project relationship should be "acknowledged but not loud". Global footer placement matches the brand direction exactly.
- **`not-found.tsx` at root, not per-segment** — Phase 3 routes that need custom 404s (e.g., "episode not found") can add per-segment not-found files later. Root catches everything else.
- **No `clsx` dependency added** — if the Container component is the only place that needs conditional classes, template-string concatenation is fine. Add `clsx` when a second component actually benefits from it.

### Files

| Action | File                                    |
|--------|-----------------------------------------|
| NEW    | `src/components/site/Container.tsx`     |
| NEW    | `src/components/site/Header.tsx`        |
| NEW    | `src/components/site/Footer.tsx`        |
| NEW    | `src/app/not-found.tsx`                 |
| NEW    | `src/app/error.tsx`                     |
| MODIFY | `src/app/layout.tsx`                    |

---

## Phase 1 Exit Criteria

- `npm run lint` — clean
- `npm test` — Zod validator unit tests green, smoke test still green
- `npm run build` — clean, produces standalone output
- Visual: the existing placeholder `/` page renders inside the new Header + Footer shell with brand tokens applied
- `import { Case, CaseStatus, EpisodeSchema, CaseSchema } from '@/content/schemas'` all resolve under strict TS
