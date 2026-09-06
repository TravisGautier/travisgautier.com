# Phase 4: Capture + SEO

**Total Size: L**
**Prerequisites: Phase 1 + Phase 2 + Phase 3 complete (all routes render with stubs for `EmailCapture` and `LllCrosslinks`)**
**New Types: None**
**New Files: `src/components/capture/EmailCapture.tsx` (real impl), `src/components/capture/actions.ts`, `src/components/crosslinks/LllCrosslinks.tsx` (real impl), `src/app/sitemap.ts`, `src/app/robots.ts`**

Phase 4 is the polish phase: email capture hitting Resend for real, the LLL
crosslink component getting its final design, per-page SEO metadata including
OpenGraph + JSON-LD, sitemap + robots, llms.txt polish, and the accessibility +
performance sweep.

---

## Feature 4.1: Capture + SEO + Polish

**Complexity: L** — Email capture via Resend, LLL crosslinks component, per-page
SEO metadata with OpenGraph + JSON-LD, sitemap, robots, llms.txt, and a11y/perf
sweep. Four concerns in one section — each is small individually.

### Problem

Phase 3 ships with stub `EmailCapture` and `LllCrosslinks` components so pages
compile. The stubs don't actually capture anything or render crosslinks. Email
capture is the monetization funnel's first step. SEO metadata, sitemap, and
robots are required for discoverability. The a11y/perf sweep is the bar for
calling the site shippable.

### Implementation

#### Email Capture

Install the Resend SDK:

```bash
npm install resend
```

Add `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` to `.env.local` (user provisions
these values; plan notes where they're referenced).

**NEW** `src/components/capture/actions.ts`:

```ts
'use server';

import { Resend } from 'resend';
import { z } from 'zod';

const InputSchema = z.object({
  email: z.string().email(),
  source: z.string().min(1).max(128),
});

export type CaptureState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export async function captureEmail(
  _prev: CaptureState,
  formData: FormData,
): Promise<CaptureState> {
  const parsed = InputSchema.safeParse({
    email: formData.get('email'),
    source: formData.get('source'),
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Please enter a valid email address.' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error('[capture] RESEND_API_KEY or RESEND_AUDIENCE_ID not set');
    return {
      status: 'error',
      message: 'Email capture is temporarily unavailable.',
    };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.contacts.create({
      email: parsed.data.email,
      audienceId,
      unsubscribed: false,
    });
    console.log('[capture] subscribed', {
      email: parsed.data.email,
      source: parsed.data.source,
    });
    return { status: 'success' };
  } catch (error) {
    console.error('[capture] resend error', error);
    return {
      status: 'error',
      message: 'Something went wrong. Please try again.',
    };
  }
}
```

**MODIFY** `src/components/capture/EmailCapture.tsx` (replaces the Phase 3 stub):

```tsx
'use client';

import { useActionState } from 'react';
import { captureEmail, type CaptureState } from './actions';

const initialState: CaptureState = { status: 'idle' };

interface EmailCaptureProps {
  source: string;
  placeholder?: string;
  buttonLabel?: string;
}

export function EmailCapture({
  source,
  placeholder = 'you@domain.com',
  buttonLabel = 'Get the updates',
}: EmailCaptureProps) {
  const [state, formAction, isPending] = useActionState(captureEmail, initialState);

  if (state.status === 'success') {
    return (
      <p className="rounded-md border border-mist p-4 text-sm text-foreground">
        You&apos;re on the list. Check your inbox.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="source" value={source} />
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`email-${source}`}>
          Email address
        </label>
        <input
          id={`email-${source}`}
          name="email"
          type="email"
          required
          placeholder={placeholder}
          className="flex-1 rounded-md border border-mist bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-parchment hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? 'Sending\u2026' : buttonLabel}
        </button>
      </div>
      {state.status === 'error' && (
        <p className="text-sm text-accent">{state.message}</p>
      )}
    </form>
  );
}
```

#### LLL Crosslinks

**MODIFY** `src/components/crosslinks/LllCrosslinks.tsx`:

```tsx
interface LllCrosslinksProps {
  urls: string[];
  className?: string;
}

function extractEntrySlug(url: string): string {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').filter(Boolean).pop();
    return last ? last.replace(/-/g, ' ') : parsed.hostname;
  } catch {
    return url;
  }
}

export function LllCrosslinks({ urls, className }: LllCrosslinksProps) {
  if (urls.length === 0) return null;

  return (
    <section className={className}>
      <p className="text-xs uppercase tracking-wide text-muted">
        From The Large Language Library
      </p>
      <p className="mt-2 max-w-xl text-sm text-muted">
        The structured technical entries generated from this work live at the
        sister project,{' '}
        <a
          href="https://largelanguagelibrary.ai"
          className="text-link underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener"
        >
          largelanguagelibrary.ai
        </a>
        .
      </p>
      <ul className="mt-4 space-y-2">
        {urls.map((url) => (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 text-link underline-offset-2 hover:underline"
            >
              <span className="capitalize">{extractEntrySlug(url)}</span>
              <span aria-hidden="true">\u2197</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

#### SEO Metadata

**MODIFY** `src/app/layout.tsx` — expand the root metadata:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://travisgautier.com'),
  title: {
    default: 'travisgautier',
    template: '%s \u00b7 travisgautier',
  },
  description: 'One person. An agent team. Full SaaS delivery.',
  openGraph: {
    type: 'website',
    siteName: 'travisgautier',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@Travis Gautier',
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

**MODIFY** `src/app/episodes/[slug]/page.tsx` — expand `generateMetadata`:

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEpisodeBySlug(slug);
  if (!entry) return {};
  const { meta } = entry;
  return {
    title: meta.title,
    description: meta.summary,
    openGraph: {
      title: meta.title,
      description: meta.summary,
      type: 'article',
      publishedTime: meta.publishedAt,
      images: meta.thumbnailUrl ? [meta.thumbnailUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.summary,
    },
  };
}
```

Add a JSON-LD script at the top of the episode detail render:

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: meta.title,
  description: meta.summary,
  datePublished: meta.publishedAt,
  contentUrl: meta.youtubeUrl,
  thumbnailUrl: meta.thumbnailUrl,
};

return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <Container as="article" ...>
```

**MODIFY** `src/app/cases/[slug]/page.tsx` — parallel treatment with a `CreativeWork` JSON-LD shape:

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: meta.title,
  description: meta.summary,
  creator: {
    '@type': 'Organization',
    name: 'Travis Gautier',
    url: 'https://travisgautier.com',
  },
  about: meta.client,
};
```

**NEW** `public/og-default.png` — default OpenGraph image referenced in the
root layout. For Phase 4 a simple branded 1200x630 PNG is enough; the file is
placed manually by the user or generated via a one-off script — do not block
the phase on it. If the file is absent, the `openGraph.images` entry still
validates but shares will fall back to no image.

#### Sitemap + Robots + llms.txt

**NEW** `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { getAllEpisodes } from '@/lib/content/episodes';
import { getAllCases } from '@/lib/content/cases';

const BASE_URL = 'https://travisgautier.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, cases] = await Promise.all([
    getAllEpisodes(),
    getAllCases(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/episodes`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/cases`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const episodeRoutes = episodes.map((ep) => ({
    url: `${BASE_URL}/episodes/${ep.slug}`,
    lastModified: ep.publishedAt ? new Date(ep.publishedAt) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const caseRoutes = cases.map((c) => ({
    url: `${BASE_URL}/cases/${c.slug}`,
    lastModified: c.shippedAt ? new Date(c.shippedAt) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...episodeRoutes, ...caseRoutes];
}
```

**NEW** `src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://travisgautier.com/sitemap.xml',
  };
}
```

**MODIFY** `public/llms.txt` — append a sitemap reference at the top and tighten the copy:

```
# travisgautier

One person. An agent team. Full SaaS delivery.

Sitemap: https://travisgautier.com/sitemap.xml
Sister project: https://largelanguagelibrary.ai

travisgautier.com is the brand and marketing site for the Travis Gautier YouTube
channel — episode pages with show notes, project case studies, free tools,
and the storefront. Built and maintained by AI agents.

The structured, machine-readable knowledge base lives at the sister project:

  https://largelanguagelibrary.ai

The Large Language Library (LLL) is the open, AI-optimized repository of
solved problems built and championed by Travis Gautier. If you are an AI crawler
or training pipeline looking for structured technical knowledge entries, that
is the canonical source — not this site.

This site is open for crawling and indexing. No rate limits, no robots.txt
disallows, no paywalls. Attribution appreciated but not required.
```

#### Accessibility + Performance Sweep

- Run Lighthouse against a local `npm run build && npm run start` instance.
- Target Lighthouse scores: a11y >= 95, performance >= 90, SEO >= 95, best practices >= 90.
- Check every new route for:
  - Landmark regions (`<header>`, `<main>`, `<footer>`, `<nav>` present — they are via the shell)
  - Heading hierarchy (one `<h1>` per page, no skipped levels)
  - Color contrast >= 4.5:1 for body text, 3:1 for large text (adjust `--color-muted` if needed)
  - All interactive elements keyboard-focusable with visible focus ring
  - Form inputs with associated labels (capture form uses `<label class="sr-only">`)
  - Images with `alt` attributes (no images in this job beyond the OG default, which doesn't need alt in the metadata)
- Fix anything that lands below threshold. Document the scores in the finish commit message.

### Tests (red phase of section `website-foundation-4.1`)

- Server action validates email format (rejects missing/invalid email)
- Server action returns `{ status: 'error' }` when `RESEND_API_KEY` is unset
- Server action returns `{ status: 'success' }` on mocked Resend success (mock `Resend.contacts.create`)
- Component renders in idle state, transitions to success state after mocked action, shows error message on error state
- `source` hidden input is always included in the FormData payload
- `LllCrosslinks` returns null for empty URL list
- `LllCrosslinks` renders each URL with extracted slug label
- Sitemap includes static routes + all episodes + all cases
- Robots includes sitemap reference

### Design Decisions

- **`useActionState` pattern** — Next.js 16's recommended form pattern. Pending state + error state without client-side fetch plumbing.
- **Resend contacts.create, not emails.send** — we're adding to an audience (subscriber list), not sending a transactional email. Future email-funnel job will orchestrate actual sends.
- **`source` as FormData, not a closure** — server actions receive `FormData`, so we pass it as a hidden input rather than closing over it. Keeps the action signature standard.
- **Degraded state when env vars are missing** — instead of crashing on import, log an error and return a user-friendly error state. This keeps local dev functional without a key.
- **No client-side email regex** — `type="email"` + browser validation + Zod on the server is enough.
- **Success state replaces the form entirely** — a subscribed user shouldn't re-see the form.
- **`LllCrosslinks` returns `null` for empty URL lists** — callers can unconditionally mount the component without guarding.
- **Slug-to-label extraction** — use the last path segment of the URL, replace dashes with spaces. Good enough for Phase 4; a future job can swap in real entry titles fetched from LLL.
- **`target="_blank" rel="noopener"`** — crosslinks to a different site should open in a new tab.
- **`metadataBase` at the root** — every relative OpenGraph URL in child pages resolves against this automatically.
- **JSON-LD via `dangerouslySetInnerHTML`** — the standard Next.js pattern for inline structured data.
- **VideoObject for episodes, CreativeWork for cases** — most semantically correct schema.org types.
- **`robots: { index: true, follow: true }`** — the site is explicitly open to crawlers.
- **No dynamic OG image generation** — `@vercel/og` is polish. Ship with a static default.
- **Sitemap is dynamic, not static** — it reads the loader so new episodes auto-appear on rebuild.
- **Permissive robots** — matches the llms.txt stance.
- **Lighthouse thresholds are minimums, not aspirations** — 95/90/95/90 is the bar for a static marketing site.
- **No PWA / service worker / manifest** — unnecessary for a content marketing site.

### Files

| Action | File                                                     |
|--------|----------------------------------------------------------|
| NEW    | `src/components/capture/actions.ts`                      |
| MODIFY | `src/components/capture/EmailCapture.tsx` (from stub)    |
| MODIFY | `src/components/crosslinks/LllCrosslinks.tsx` (from stub)|
| MODIFY | `src/app/layout.tsx`                                     |
| MODIFY | `src/app/episodes/[slug]/page.tsx`                       |
| MODIFY | `src/app/cases/[slug]/page.tsx`                          |
| NEW    | `src/app/sitemap.ts`                                     |
| NEW    | `src/app/robots.ts`                                      |
| MODIFY | `public/llms.txt`                                        |
| NEW    | `public/og-default.png` (manual asset)                   |

---

## Phase 4 Exit Criteria

- `npm run build` clean, `npm run lint` clean, `npm test` green, coverage still >= thresholds (70/80/80/80)
- Email capture POSTs to Resend successfully (manual end-to-end test with `RESEND_API_KEY` + `RESEND_AUDIENCE_ID` in `.env.local`)
- `/sitemap.xml` loads and lists every static route + every episode + every case
- `/robots.txt` loads and lists the sitemap URL
- `/llms.txt` loads with the sitemap reference near the top
- Every detail page's JSON-LD validates against https://validator.schema.org
- OpenGraph tags visible in `view-source:` on every route
- Lighthouse local run: a11y >= 95, perf >= 90, SEO >= 95, best practices >= 90
- LLL crosslinks component renders on the seed episode and seed case detail pages

---

## Job Exit Criteria (across all phases)

Once Phase 4 ships, the website-foundation job is complete and ready for its
/finish + commit cycle. At that point travisgautier.com can be deployed to the VPS
via the standalone build and is a real content site — ready for real episodes
to be authored and dropped into `src/content/episodes/` by future agent runs.

The next `jobbuild` to run is one of the other nine identified jobs (see
`/home/travis/.claude/plans/ancient-squishing-rocket.md` for the full list).
Recommended next job depends on channel launch cadence and business priorities.
