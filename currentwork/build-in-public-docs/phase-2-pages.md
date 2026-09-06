# Phase 2: Pages

**Total Size: S + L + M (consolidated from S + S + M + M)**
**Prerequisites:** Phase 1 complete (loaders return validated `Job`/`JobPhase`/`SessionStatus`/`KnowledgeFile`/`JobsRollup`).
**New Types:** None
**New Files:** `src/components/build-log/{MarkdownDocument,JobCard,StatusBadge,JobsRollupTable,PhaseNav}.tsx`, `src/app/build-log/page.tsx`, `src/app/build-log/jobs/[slug]/page.tsx`, `src/app/build-log/jobs/[slug]/[phase]/page.tsx`, `src/app/build-log/status/page.tsx` + co-located tests.
**New Packages:** `react-markdown`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, `rehype-highlight`, `highlight.js`

Phase 2 is where the build-log surfaces become visible. Feature 2.1 ships the
markdown rendering pipeline that every other feature in this phase consumes.
Feature 2.2 (post-condense) ships the full jobs surface — `/build-log` index
plus `/build-log/jobs/[slug]` plus `/build-log/jobs/[slug]/[phase]` — as a
same-entity merger of the original 2.2 (index) + 2.3 (detail pages). Feature
2.3 (formerly 2.4) ships `/build-log/status` independently because it
consumes a different loader (pipeline state, not jobs) and ships a distinct
component (`<JobsRollupTable>`). After 2.1, 2.2 and 2.3 are parallelizable —
they touch different route files and import `<MarkdownDocument>` without
otherwise overlapping.

---

## Feature 2.1: `<MarkdownDocument>` Component

**Complexity: S** — One React Server Component that mounts `react-markdown`
with the standard plugin stack and brand-styled defaults. The complexity is
in choosing the plugin set and themeing, not in the code itself.

### Problem

The Phase 2 routes need to render markdown bodies (job READMEs and phase
files) into styled HTML at build time. The existing MDX pipeline from `wf` 2.1
applies only to `.mdx` files imported as modules — it doesn't help here
because the build-log content is plain `.md` files read as strings via
`fs.readFile`. A runtime markdown renderer is needed.

`currentwork/*/README.md` and `phase-N-*.md` files contain:
- GFM tables (Feature Overview, Critical Files, Verification Plan, etc.)
- Fenced code blocks with TypeScript, MDX, and shell content
- ASCII dependency-graph diagrams (also fenced)
- Heading-anchored sections (`## Context`, `## Feature 1.1: ...`)
- Inline `code spans`, links, bold/italic
- Sometimes JSX-like fragments like `<ShowcaseCard variant="hero">` inside
  fenced code blocks (which would break MDX but are fine in markdown)

`react-markdown` + `remark-gfm` + `rehype-slug` + `rehype-autolink-headings`
+ `rehype-highlight` + `highlight.js` covers all of this.

### Implementation

Install the packages:

```bash
npm install react-markdown remark-gfm rehype-slug rehype-autolink-headings rehype-highlight highlight.js
```

**NEW** `src/components/build-log/MarkdownDocument.tsx`:

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';

// Brand-themed highlight.js stylesheet — picked in /green to match wf 1.3 tokens.
import 'highlight.js/styles/github-dark.css';

interface MarkdownDocumentProps {
  /** Raw markdown source string. */
  body: string;
  /** Optional className applied to the wrapper article element. */
  className?: string;
}

export function MarkdownDocument({ body, className }: MarkdownDocumentProps) {
  return (
    <article
      className={[
        'build-log-prose',
        'max-w-none',
        'prose-headings:font-display',
        'prose-headings:text-foreground',
        'prose-a:text-link',
        'prose-code:text-accent',
        className ?? '',
      ].join(' ')}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: {
                className: ['build-log-anchor'],
                'aria-label': 'Permalink',
              },
            },
          ],
          rehypeHighlight,
        ]}
        components={{
          // Cap heading levels at h2 in the rendered output to keep page
          // outline correct (the page's own h1 is the job/phase title).
          h1: ({ children, ...rest }) => <h2 {...rest}>{children}</h2>,
          // Tables get an overflow wrapper so wide GFM tables scroll
          // horizontally on mobile instead of breaking layout.
          table: ({ children, ...rest }) => (
            <div className="build-log-table-wrapper overflow-x-auto">
              <table {...rest}>{children}</table>
            </div>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
}
```

**MODIFY** `src/app/globals.css` — add a `.build-log-prose` style block. The
brand tokens from `wf` 1.3 are already defined; this block layers on type
scale, table borders, code-block backgrounds, and anchor-link styling. Tailwind
4 supports `@layer` in `globals.css`:

```css
@layer components {
  .build-log-prose {
    color: var(--color-foreground);
    line-height: 1.7;
    font-size: 1rem;
  }
  .build-log-prose h2 {
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    line-height: 1.3;
    font-weight: 600;
    border-bottom: 1px solid var(--color-mist);
    padding-bottom: 0.25rem;
  }
  .build-log-prose h3 {
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
  }
  .build-log-prose p {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  .build-log-prose code:not(pre code) {
    background: var(--color-mist);
    border-radius: 4px;
    padding: 0.125rem 0.375rem;
    font-size: 0.875em;
  }
  .build-log-prose pre {
    background: var(--color-ink);
    color: var(--color-parchment);
    border-radius: 6px;
    padding: 1rem 1.25rem;
    overflow-x: auto;
    margin: 1.25rem 0;
    font-size: 0.875rem;
  }
  .build-log-prose .build-log-table-wrapper {
    margin: 1.25rem 0;
  }
  .build-log-prose table {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.9rem;
  }
  .build-log-prose th,
  .build-log-prose td {
    border: 1px solid var(--color-mist);
    padding: 0.5rem 0.75rem;
    text-align: left;
    vertical-align: top;
  }
  .build-log-prose th {
    background: var(--color-mist);
    font-weight: 600;
  }
  .build-log-prose blockquote {
    border-left: 4px solid var(--color-accent);
    padding: 0.5rem 1rem;
    background: color-mix(in oklab, var(--color-mist) 50%, transparent);
    margin: 1.25rem 0;
    font-style: italic;
  }
  .build-log-prose .build-log-anchor {
    margin-left: 0.5rem;
    color: var(--color-muted);
    text-decoration: none;
    opacity: 0;
    transition: opacity 150ms ease;
  }
  .build-log-prose h2:hover .build-log-anchor,
  .build-log-prose h3:hover .build-log-anchor {
    opacity: 1;
  }
  .build-log-prose .build-log-anchor::before {
    content: '#';
  }
}
```

### Tests (red phase of section `build-in-public-docs-2.1`)

`src/components/build-log/__tests__/MarkdownDocument.test.tsx` — RTL render
tests against fixture markdown strings:

- Renders a basic paragraph: input `'Hello **world**.'` → output contains a `<p>` with bold "world"
- Renders a GFM table: input with a `| col1 | col2 |\n|---|---|\n| a | b |` block → output contains a `<table>` with rows `a` / `b` wrapped in a `.build-log-table-wrapper` div
- Renders a fenced code block with a language hint: input `'```ts\nconst x = 1;\n```'` → output contains a `<pre>` with `<code class="hljs language-ts">` (syntax highlighting span hooks present)
- Renders an inline code span: input `'use \`foo\` here'` → output contains a `<code>` with text `foo` and the brand `code:not(pre code)` styling class
- Renders a heading with an autolink: input `'## Context'` → output contains an `<h2 id="context">` followed by an `<a class="build-log-anchor" href="#context">`
- Demotes input H1 to H2: input `'# Title'` → output contains `<h2>Title</h2>` (NOT `<h1>`)
- Renders a markdown link: input `'[example](https://example.com)'` → output contains an `<a href="https://example.com">example</a>`
- Does NOT render JSX: input `'```tsx\n<Foo bar="baz" />\n```'` → the `<Foo>` tag is rendered as text inside the code block, not as a React component
- Renders a strikethrough: input `'~~deleted~~'` → output contains a `<del>` (GFM extension)
- Renders a task list: input `'- [x] done\n- [ ] todo'` → output contains two `<input type="checkbox" disabled>` elements
- Wrapper article element has the `build-log-prose` class plus any caller-supplied `className`

### Design Decisions

- **`react-markdown` over `markdown-it`/`marked`** — react-markdown returns React elements directly so the `components` override prop lets us swap individual element types (h1 → h2, table → wrapped table) without escaping back into HTML strings. Better SSR story for App Router.
- **Server Component, no `'use client'`** — markdown rendering is pure data → JSX with no hooks or state. Keeping it server-side avoids shipping ~150KB of react-markdown + plugins to the browser, and the rendered HTML hydrates trivially.
- **Demote H1 → H2** — every page already mounts its own H1 (the page title from `<Container>`). Allowing a markdown body to inject another H1 would break the page outline and screen-reader navigation. The `components: { h1: ... }` override does the demotion in one line.
- **GFM tables wrapped in an overflow div** — the existing READMEs have wide tables (Critical Files Reference is 8+ rows wide). Without `overflow-x-auto`, these break the page layout on mobile. The wrapper is a div, not a `figure`, because the table is content, not an aside.
- **`rehype-highlight` runs at build time, server-side** — produces highlighted spans in the HTML, no client-side JS for code blocks. The `highlight.js/styles/*.css` import is the only client-side asset, and it's a CSS file under 5KB.
- **`github-dark.css` as the default theme** — high-contrast, neutral, well-known. Final pick during `/green` after the brand tokens land. The theme is a one-line import change.
- **`rehype-autolink-headings` with `behavior: 'append'`** — appends the anchor link AFTER the heading text, not before, so the heading text is the first focusable element. `aria-label: 'Permalink'` makes the anchor screen-reader-friendly.
- **Heading anchors only show on hover** — the `opacity: 0 → 1 on hover` interaction matches the GitHub README convention. Always-visible anchors clutter the page; hidden anchors are still keyboard-accessible via tab.
- **No `rehype-raw` (raw HTML pass-through)** — accepting raw HTML inside markdown is an XSS vector. The build-log content is trusted (it's checked into the repo) but the loader could in principle pick up untrusted future content; safer to disallow.
- **`prose-*` Tailwind classes are NOT used** — `@tailwindcss/typography` would require an extra plugin install. The custom `.build-log-prose` block in `globals.css` is small enough to maintain by hand and uses the brand tokens directly.
- **No syntax-highlighted line numbers** — `rehype-highlight` doesn't ship them and the existing READMEs don't reference specific line numbers from inside their own code blocks. If needed later, switch to `shiki` (heavier but more featureful).

### Files

| Action | File                                                              |
|--------|-------------------------------------------------------------------|
| NEW    | `src/components/build-log/MarkdownDocument.tsx`                   |
| NEW    | `src/components/build-log/__tests__/MarkdownDocument.test.tsx`    |
| MODIFY | `src/app/globals.css` — add `.build-log-prose` `@layer components` block |
| MODIFY | `package.json` + `package-lock.json` — add 6 new packages         |

---

## Feature 2.2: `/build-log` Index + Job + Phase Pages

**Complexity: L (consolidated from old 2.2 index S + old 2.3 detail M)** — Three routes and four new components rendering one content type (Job) from one loader (`getAllJobs`/`getJobBySlug`/`getJobPhase`). Merged because they're same-entity views — the index page's `<JobCard>` links directly to the job page's detail view; the job page's `<PhaseNav>` links directly to the phase page's detail view. All three share the same data-fetch path, so one TDD cycle can test the chain end-to-end. Feature 2.3 (formerly 2.4) remains separate — it renders pipeline state via `<JobsRollupTable>`, not jobs via these components.

### Part 1 — `/build-log` Index Page

**Part complexity: S** — One server-rendered page that lists every job with a
status badge, the alias, a one-line context excerpt, and a "View" link to the
job page.

#### Problem

Visitors landing at `/build-log` need a single scannable surface listing all
known jobs and their status. The page's job is to be the directory — a
shallow, fast index that links into the job pages. It is NOT the status board
(that's `/build-log/status` in 2.3).

#### Implementation

**NEW** `src/components/build-log/StatusBadge.tsx`:

```tsx
import type { JobRollupEntry } from '@/content/schemas';

const LABELS: Record<JobRollupEntry['status'], string> = {
  planned: 'Planned',
  'in-progress': 'In progress',
  complete: 'Complete',
  unknown: 'No data',
};

const CLASSES: Record<JobRollupEntry['status'], string> = {
  planned: 'bg-mist text-foreground',
  'in-progress': 'bg-accent text-parchment',
  complete: 'bg-signal text-ink',
  unknown: 'bg-mist text-muted',
};

interface StatusBadgeProps {
  status: JobRollupEntry['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CLASSES[status]}`}
      data-testid={`status-badge-${status}`}
    >
      {LABELS[status]}
    </span>
  );
}
```

**NEW** `src/components/build-log/JobCard.tsx`:

```tsx
import Link from 'next/link';
import type { JobRollupEntry } from '@/content/schemas';
import { StatusBadge } from './StatusBadge';

interface JobCardProps {
  rollup: JobRollupEntry;
  /** First-paragraph excerpt from the job's Context section */
  excerpt: string;
}

export function JobCard({ rollup, excerpt }: JobCardProps) {
  const href = `/build-log/jobs/${rollup.slug}`;
  return (
    <article className="border border-mist rounded-lg p-6 hover:border-accent transition-colors">
      <header className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-xl font-display">
            <Link href={href} className="text-foreground hover:text-accent">
              {rollup.title}
            </Link>
          </h3>
          {rollup.alias && (
            <p className="text-sm text-muted mt-1">
              Alias: <code className="text-accent">{rollup.alias}</code>
            </p>
          )}
        </div>
        <StatusBadge status={rollup.status} />
      </header>
      <p className="text-sm text-muted line-clamp-3">{excerpt}</p>
      <footer className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>
          {rollup.completedFeatures} / {rollup.totalFeatures} features
          {rollup.percentComplete !== null && ` · ${rollup.percentComplete}%`}
        </span>
        <Link href={href} className="text-link hover:text-accent">
          View →
        </Link>
      </footer>
    </article>
  );
}
```

**NEW** `src/app/build-log/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { JobCard } from '@/components/build-log/JobCard';
import { getAllJobs } from '@/lib/build-log/jobs';
import { getJobsRollup } from '@/lib/build-log/pipeline-state';

export const metadata: Metadata = {
  title: 'Build log',
  description:
    'A live view of the agent-driven build process behind travisgautier.com — every job plan, every phase, every section the TDD pipeline has shipped or is about to ship.',
};

function firstParagraph(context: string): string {
  const para = context.split(/\n\s*\n/)[0] ?? '';
  return para.replace(/\s+/g, ' ').trim();
}

export default async function BuildLogIndexPage() {
  const [jobs, rollup] = await Promise.all([getAllJobs(), getJobsRollup()]);

  // Join jobs with rollup by slug — same order as `getAllJobs` (alpha by slug)
  const rollupBySlug = new Map(rollup.map((r) => [r.slug, r]));

  return (
    <Container as="main" className="py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-display mb-3">Build log</h1>
        <p className="text-lg text-muted max-w-2xl">
          The agent-driven build process behind travisgautier.com, rendered as
          published content. Every job has a plan, every plan has phases,
          every phase has features the TDD pipeline ships through.
        </p>
        <p className="mt-4">
          <a href="/build-log/status" className="text-link hover:text-accent">
            See live pipeline status →
          </a>
        </p>
      </header>

      {jobs.length === 0 ? (
        <p className="text-muted italic">
          No jobs have been planned yet. Initializing…
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job) => {
            const r = rollupBySlug.get(job.slug);
            if (!r) return null;
            return (
              <JobCard
                key={job.slug}
                rollup={r}
                excerpt={firstParagraph(job.context)}
              />
            );
          })}
        </div>
      )}
    </Container>
  );
}
```

#### Tests (merged into red phase of section `build-in-public-docs-2.2`)

`src/components/build-log/__tests__/StatusBadge.test.tsx`:
- Renders the correct label for each of the four status values
- Applies the correct background class for each status

`src/components/build-log/__tests__/JobCard.test.tsx`:
- Renders the title as a link to `/build-log/jobs/{slug}`
- Renders the alias when present, omits the alias section when undefined
- Renders the status badge
- Renders the excerpt with `line-clamp-3`
- Renders `{completed} / {total} features` and the percentage when not null
- Omits the `· {percent}%` suffix when `percentComplete` is null

`src/app/build-log/__tests__/page.test.tsx`:
- Mock `getAllJobs` and `getJobsRollup` to return a fixture of 3 jobs
- Renders the page title `Build log`
- Renders 3 `<JobCard>` instances (assert via test IDs on the badge)
- Renders the "See live pipeline status →" link
- When jobs is empty: renders the `Initializing…` message instead of the grid
- The `firstParagraph` helper handles a context with multiple paragraphs (returns only the first)
- The `firstParagraph` helper collapses multi-line whitespace into single spaces

#### Design Decisions

- **Two-column grid on `md+`, single column on mobile** — same convention as the wf episodes index. Avoids ultra-long lists on desktop while staying readable on phones.
- **Excerpt is the first paragraph of `## Context`, not the whole context** — context paragraphs are 2-3 sentences each. The first one is the elevator pitch. Truncating with `line-clamp-3` clips overflow to 3 visual lines without breaking the paragraph at a word boundary.
- **`firstParagraph` is a private helper inside `page.tsx`** — only this page needs it. If a second consumer appears, lift it to `src/lib/build-log/excerpts.ts`.
- **Cards link via the title AND a "View →" footer link** — accessibility-friendly (the entire card isn't a single nested link, which screen readers handle awkwardly). Two visible click targets, both pointing at the same href.
- **`getJobsRollup` is awaited in parallel with `getAllJobs`** — `getAllJobs` is what `getJobsRollup` reads internally. The cache means the second call is free, and `Promise.all` preserves the parallelism intent for code clarity.
- **Empty-state copy ("Initializing…") instead of throwing** — matches the loader's empty-array tolerance from 1.2. The page renders an honest empty state.
- **Static `metadata` export, no `generateMetadata`** — the index page doesn't take params, so `metadata: Metadata` is enough. Phase 3.1 widens this to add OpenGraph + Twitter card tags.
- **No filtering / sorting controls in v1** — the job count is small (≈10) and stable. A simple list is the right default. Filter/sort is an upgrade if the count grows past 30.
- **Status badge color mapping is a const, not Tailwind class composition** — the four states are stable and the mapping is the source of truth. Adding a new state is a one-line edit.
- **`bg-signal` for "Complete"** — the signal color in the wf brand tokens is the high-attention color. Reserving it for completion celebrates finished work.

#### Files (Part 1)

| Action | File                                                          |
|--------|---------------------------------------------------------------|
| NEW    | `src/components/build-log/StatusBadge.tsx`                    |
| NEW    | `src/components/build-log/JobCard.tsx`                        |
| NEW    | `src/components/build-log/__tests__/StatusBadge.test.tsx`     |
| NEW    | `src/components/build-log/__tests__/JobCard.test.tsx`         |
| NEW    | `src/app/build-log/page.tsx`                                  |
| NEW    | `src/app/build-log/__tests__/page.test.tsx`                   |

---

### Part 2 — Job + Phase Detail Pages

**Part complexity: M** — Two dynamic route files (`/jobs/[slug]` and
`/jobs/[slug]/[phase]`) that read the loader, render the markdown body via
`<MarkdownDocument>`, and surface a `<PhaseNav>` strip listing the job's
phases. Both pages use `generateStaticParams` + `dynamicParams = false`.

#### Problem

The job page is the destination viewers land on when they click into a job
from the index. It must:
1. Render the README's full markdown body via `<MarkdownDocument>`
2. Surface a phase navigation strip listing every phase in the job
3. Link back to `/build-log`
4. 404 cleanly on unknown slugs

The phase page is the destination for clicking a phase in the nav. It must:
1. Render the phase file's full markdown body
2. Show the parsed `header.totalSize` / `header.prerequisites` strip above the body when present
3. Link back to the parent job page
4. 404 cleanly on unknown phases

#### Implementation

**NEW** `src/components/build-log/PhaseNav.tsx`:

```tsx
import Link from 'next/link';
import type { JobPhase } from '@/content/schemas';

interface PhaseNavProps {
  jobSlug: string;
  phases: readonly JobPhase[];
  /** Currently-active phase slug, or undefined when on the README page */
  activePhaseSlug?: string;
}

export function PhaseNav({ jobSlug, phases, activePhaseSlug }: PhaseNavProps) {
  if (phases.length === 0) return null;
  return (
    <nav aria-label="Phases" className="border border-mist rounded-lg p-4 mb-8">
      <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
        Phases
      </h2>
      <ol className="flex flex-wrap gap-2">
        {phases.map((phase) => {
          const href = `/build-log/jobs/${jobSlug}/${phase.slug}`;
          const isActive = phase.slug === activePhaseSlug;
          return (
            <li key={phase.slug}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'inline-block px-3 py-1.5 rounded text-sm border',
                  isActive
                    ? 'bg-accent text-parchment border-accent'
                    : 'border-mist text-foreground hover:border-accent',
                ].join(' ')}
              >
                {phase.header.title
                  ? `Phase ${phase.header.phaseNumber}: ${phase.header.title}`
                  : phase.slug}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

**NEW** `src/app/build-log/jobs/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { MarkdownDocument } from '@/components/build-log/MarkdownDocument';
import { PhaseNav } from '@/components/build-log/PhaseNav';
import { getAllJobs, getJobBySlug } from '@/lib/build-log/jobs';

export const dynamicParams = false;

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  return jobs.map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return {};
  return {
    title: `${job.title} · Build log`,
    description: job.context.split('\n')[0]?.slice(0, 160) ?? job.title,
  };
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  return (
    <Container as="main" className="py-12">
      <nav className="mb-6 text-sm">
        <Link href="/build-log" className="text-link hover:text-accent">
          ← Back to build log
        </Link>
      </nav>
      <header className="mb-6">
        <h1 className="text-3xl font-display">{job.title}</h1>
        {job.alias && (
          <p className="text-sm text-muted mt-2">
            Alias: <code className="text-accent">{job.alias}</code>
          </p>
        )}
      </header>
      <PhaseNav jobSlug={job.slug} phases={job.phases} />
      <MarkdownDocument body={job.readmeBody} />
    </Container>
  );
}
```

**NEW** `src/app/build-log/jobs/[slug]/[phase]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { MarkdownDocument } from '@/components/build-log/MarkdownDocument';
import { PhaseNav } from '@/components/build-log/PhaseNav';
import { getAllJobs, getJobBySlug, getJobPhase } from '@/lib/build-log/jobs';

export const dynamicParams = false;

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  const tuples: { slug: string; phase: string }[] = [];
  for (const job of jobs) {
    for (const phase of job.phases) {
      tuples.push({ slug: job.slug, phase: phase.slug });
    }
  }
  return tuples;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; phase: string }>;
}): Promise<Metadata> {
  const { slug, phase } = await params;
  const job = await getJobBySlug(slug);
  const ph = job?.phases.find((p) => p.slug === phase);
  if (!ph) return {};
  const title = ph.header.title
    ? `Phase ${ph.header.phaseNumber}: ${ph.header.title} · ${job!.title}`
    : `${ph.slug} · ${job!.title}`;
  return {
    title,
    description:
      ph.header.totalSize ?? `Phase document for ${job!.title}.`,
  };
}

export default async function PhasePage({
  params,
}: {
  params: Promise<{ slug: string; phase: string }>;
}) {
  const { slug, phase } = await params;
  const [job, ph] = await Promise.all([
    getJobBySlug(slug),
    getJobPhase(slug, phase),
  ]);
  if (!job || !ph) notFound();

  return (
    <Container as="main" className="py-12">
      <nav className="mb-6 text-sm">
        <Link href="/build-log" className="text-link hover:text-accent">
          ← Build log
        </Link>
        {' · '}
        <Link
          href={`/build-log/jobs/${job.slug}`}
          className="text-link hover:text-accent"
        >
          {job.title}
        </Link>
      </nav>
      <header className="mb-6">
        <h1 className="text-3xl font-display">
          {ph.header.title
            ? `Phase ${ph.header.phaseNumber}: ${ph.header.title}`
            : ph.slug}
        </h1>
        {(ph.header.totalSize || ph.header.prerequisites) && (
          <dl className="mt-3 text-sm text-muted space-y-1">
            {ph.header.totalSize && (
              <div>
                <dt className="inline font-medium">Total size: </dt>
                <dd className="inline">{ph.header.totalSize}</dd>
              </div>
            )}
            {ph.header.prerequisites && (
              <div>
                <dt className="inline font-medium">Prerequisites: </dt>
                <dd className="inline">{ph.header.prerequisites}</dd>
              </div>
            )}
          </dl>
        )}
      </header>
      <PhaseNav
        jobSlug={job.slug}
        phases={job.phases}
        activePhaseSlug={ph.slug}
      />
      <MarkdownDocument body={ph.body} />
    </Container>
  );
}
```

#### Tests (merged into red phase of section `build-in-public-docs-2.2`)

`src/components/build-log/__tests__/PhaseNav.test.tsx`:
- Renders one link per phase
- Renders nothing when phases is empty
- Highlights the active phase via `aria-current="page"`
- Falls back to `phase.slug` as the link label when `header.title` is missing
- Uses the format `Phase 1: Foundation` when both `phaseNumber` and `title` are present

`src/app/build-log/jobs/[slug]/__tests__/page.test.tsx`:
- Mock `getAllJobs` + `getJobBySlug`. `generateStaticParams` returns one entry per job slug
- Mock `getJobBySlug('community-showcase')` to return a fixture job. The page renders the job title H1, the back link to `/build-log`, the `<PhaseNav>`, and a `<MarkdownDocument>` whose body matches the fixture's `readmeBody`
- Mock `getJobBySlug('bogus')` to return `undefined`. The page calls `notFound()`
- `generateMetadata({ params: { slug: 'community-showcase' } })` returns a title containing the job title + " · Build log"

`src/app/build-log/jobs/[slug]/[phase]/__tests__/page.test.tsx`:
- `generateStaticParams` returns one tuple per `(slug, phase)` pair across the fixture jobs (e.g. 7 jobs × 3 phases = 21 tuples)
- The page renders the phase title H1 with the format `Phase 1: Foundation` (when header is parsed)
- Renders the back-link strip showing `← Build log · {Job title}`
- Renders a `<PhaseNav>` with `activePhaseSlug` matching the current phase
- When `header.totalSize` is present, the metadata strip renders the total-size line
- When the header is empty, the metadata strip is omitted entirely
- Returns `notFound()` when the slug or phase is unknown

#### Design Decisions

- **Separate route files for `[slug]` and `[slug]/[phase]`** — chosen over a catch-all `[[...path]]` because the two pages have different shapes (the job page has the README; the phase page has the phase body and a different breadcrumb). `generateStaticParams` is also clearer when each route has its own implementation.
- **`dynamicParams = false`** — unknown slugs/phases 404 at build time, not at runtime. This is the same convention as wf episodes/cases. It also prevents users typing arbitrary URLs from triggering filesystem reads on a deployed instance.
- **`PhaseNav` is rendered on both the job page and the phase page** — same component, different `activePhaseSlug` prop. Promotes consistency and lets users jump between phases without going back to the job page.
- **`activePhaseSlug` controls highlighting via `aria-current="page"`** — matches the WAI-ARIA convention; screen readers announce the current page in nav lists.
- **Phase title falls back to the slug** — if `parsePhase` couldn't extract the H1 (mid-write phase file), the page still renders something useful instead of `undefined`.
- **Header metadata strip is conditionally rendered** — empty headers don't get an empty `<dl>`. The page degrades gracefully.
- **Back-link is a `<nav>` not a breadcrumb component** — a single back-link doesn't justify a breadcrumb abstraction. The phase page's two-segment breadcrumb is also short enough to render inline.
- **`Promise.all([getJobBySlug, getJobPhase])`** — the two calls hit the same module-level cache so the second is a free lookup. Awaiting in parallel is a code-clarity choice; the actual savings are nil.
- **`generateMetadata` description falls back gracefully** — if `context.split('\n')[0]` is empty, the title is used as the description. Empty descriptions hurt SEO; the fallback prevents that.
- **Description sliced to 160 chars** — the OpenGraph + meta-description sweet spot. Longer descriptions get truncated by search engines.
- **Phase 3.1 will REPLACE the simple `metadata` export with a richer one** — this feature ships the minimum viable per-page metadata so the routes work and have unique titles. Phase 3.1 layers on OG/Twitter/JSON-LD.

#### Files (Part 2)

| Action | File                                                                  |
|--------|-----------------------------------------------------------------------|
| NEW    | `src/components/build-log/PhaseNav.tsx`                               |
| NEW    | `src/components/build-log/__tests__/PhaseNav.test.tsx`                |
| NEW    | `src/app/build-log/jobs/[slug]/page.tsx`                              |
| NEW    | `src/app/build-log/jobs/[slug]/__tests__/page.test.tsx`               |
| NEW    | `src/app/build-log/jobs/[slug]/[phase]/page.tsx`                      |
| NEW    | `src/app/build-log/jobs/[slug]/[phase]/__tests__/page.test.tsx`       |

---

## Feature 2.3: `/build-log/status` Status Board

**Complexity: M** — One server-rendered page that surfaces parsed
`session.yaml`, the completed-sections list, a knowledge.yaml summary, and
the at-a-glance jobs rollup table joining the job index against
`session.completedSections`.

### Problem

Visitors who want to see the *current* state of the agent pipeline (rather
than browsing planned jobs) land here. The page surfaces:
1. **Session header**: ID, current section, current agent, current stage, and
   when the session started — the "what's happening right now" line
2. **Completed sections list**: every section the pipeline has finished, in
   order, so visitors can scan the work history
3. **Jobs rollup table**: every job in the index with its percent-complete bar
   so visitors get an at-a-glance overview of progress
4. **Knowledge summary**: the `knowledge.yaml` `project_context.purpose` and
   `notes` fields rendered as markdown via `<MarkdownDocument>`

### Implementation

**NEW** `src/components/build-log/JobsRollupTable.tsx`:

```tsx
import Link from 'next/link';
import type { JobRollupEntry } from '@/content/schemas';
import { StatusBadge } from './StatusBadge';

interface JobsRollupTableProps {
  rows: readonly JobRollupEntry[];
}

export function JobsRollupTable({ rows }: JobsRollupTableProps) {
  return (
    <table className="w-full text-sm border border-mist rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-mist">
          <th className="text-left px-4 py-2 font-medium">Job</th>
          <th className="text-left px-4 py-2 font-medium">Status</th>
          <th className="text-left px-4 py-2 font-medium">Progress</th>
          <th className="text-right px-4 py-2 font-medium">Features</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.slug} className="border-t border-mist">
            <td className="px-4 py-3">
              <Link
                href={`/build-log/jobs/${row.slug}`}
                className="text-link hover:text-accent"
              >
                {row.title}
              </Link>
              {row.alias && (
                <span className="ml-2 text-xs text-muted">({row.alias})</span>
              )}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={row.status} />
            </td>
            <td className="px-4 py-3">
              {row.percentComplete === null ? (
                <span className="text-muted">—</span>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 bg-mist rounded overflow-hidden"
                    style={{ width: '120px' }}
                    role="progressbar"
                    aria-valuenow={row.percentComplete}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${row.title} ${row.percentComplete}% complete`}
                  >
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${row.percentComplete}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums">
                    {row.percentComplete}%
                  </span>
                </div>
              )}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
              {row.completedFeatures} / {row.totalFeatures}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**NEW** `src/app/build-log/status/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { JobsRollupTable } from '@/components/build-log/JobsRollupTable';
import { MarkdownDocument } from '@/components/build-log/MarkdownDocument';
import {
  getSessionStatus,
  getKnowledgeFile,
  getJobsRollup,
} from '@/lib/build-log/pipeline-state';

export const metadata: Metadata = {
  title: 'Pipeline status · Build log',
  description:
    'Live view of the travisgautier TDD pipeline — current section, completed sections, and per-job progress, read directly from session.yaml at build time.',
};

function extractSectionId(
  entry:
    | string
    | { section: string; completedAt?: string },
): string {
  return typeof entry === 'string' ? entry : entry.section;
}

export default async function StatusPage() {
  const [session, knowledge, rollup] = await Promise.all([
    getSessionStatus(),
    getKnowledgeFile(),
    getJobsRollup(),
  ]);

  return (
    <Container as="main" className="py-12">
      <nav className="mb-6 text-sm">
        <Link href="/build-log" className="text-link hover:text-accent">
          ← Back to build log
        </Link>
      </nav>
      <header className="mb-10">
        <h1 className="text-4xl font-display mb-3">Pipeline status</h1>
        <p className="text-lg text-muted max-w-2xl">
          Read directly from <code className="text-accent">pipeline/active/</code>
          {' '}at build time. Refreshes whenever the site rebuilds.
        </p>
      </header>

      <section className="mb-10" aria-labelledby="current-state">
        <h2 id="current-state" className="text-2xl font-display mb-4">
          Current state
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Session</dt>
            <dd className="font-mono">{session.id}</dd>
          </div>
          {session.startedAt && (
            <div>
              <dt className="text-muted">Started</dt>
              <dd>{session.startedAt}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted">Current section</dt>
            <dd className="font-mono">
              {session.currentSection || <span className="text-muted">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Current agent</dt>
            <dd>
              {session.currentAgent || <span className="text-muted">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Current stage</dt>
            <dd>
              {session.currentStage || <span className="text-muted">—</span>}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mb-10" aria-labelledby="rollup">
        <h2 id="rollup" className="text-2xl font-display mb-4">
          Jobs at a glance
        </h2>
        <JobsRollupTable rows={rollup} />
      </section>

      <section className="mb-10" aria-labelledby="completed">
        <h2 id="completed" className="text-2xl font-display mb-4">
          Completed sections
        </h2>
        {session.completedSections.length === 0 ? (
          <p className="text-muted italic">
            No sections shipped yet — pipeline is still warming up.
          </p>
        ) : (
          <ul className="space-y-1 text-sm font-mono">
            {session.completedSections.map((entry, i) => (
              <li key={i}>{extractSectionId(entry)}</li>
            ))}
          </ul>
        )}
      </section>

      {(knowledge.projectContext?.purpose || session.notes) && (
        <section aria-labelledby="notes">
          <h2 id="notes" className="text-2xl font-display mb-4">
            Notes
          </h2>
          {session.notes && <MarkdownDocument body={session.notes} />}
        </section>
      )}
    </Container>
  );
}
```

### Tests (red phase of section `build-in-public-docs-2.3`)

`src/components/build-log/__tests__/JobsRollupTable.test.tsx`:
- Renders one row per entry
- Renders the title as a link to `/build-log/jobs/{slug}`
- Renders the alias in parentheses when present
- Renders the percent bar with the correct `aria-valuenow`
- Renders `—` instead of a progress bar when `percentComplete` is null
- Tabular-nums alignment on the features column
- The progressbar has the correct ARIA attributes (role, valuemin, valuemax, valuenow, label)

`src/app/build-log/status/__tests__/page.test.tsx`:
- Mock `getSessionStatus`, `getKnowledgeFile`, `getJobsRollup`
- Renders the page title `Pipeline status`
- Renders the session ID in the current-state section
- Renders the back link to `/build-log`
- Renders the `<JobsRollupTable>` with the mocked rollup
- When `completedSections` is empty: renders the empty-state message
- When `completedSections` has entries: renders one `<li>` per entry, using `extractSectionId` for both string and object forms
- When `session.notes` is present: renders a `<MarkdownDocument>` with the notes body
- When `session.notes` is empty: omits the notes section

### Design Decisions

- **Three sections + optional notes section** — current state, jobs rollup, completed sections, notes (if any). The order matches the priority: "what's happening now" first, "where are we overall" second, "what got done" third, "context" last.
- **Current state as a `<dl>`** — semantically correct for key/value pairs. Better screen-reader experience than a table.
- **Empty-string current_section / current_agent / current_stage render as `—`** — newly-initialized sessions have these as empty strings (the live `session.yaml` has them empty as of 2026-04-11). Showing the dash instead of a blank cell is honest and prevents misalignment.
- **Progress bars are accessible** — `role="progressbar"` + `aria-valuenow/min/max/label` so screen readers announce them.
- **`—` for `percentComplete: null`** — the unknown state from a zero-features job. Distinct from the 0% bar that a planned job shows.
- **Notes section uses `<MarkdownDocument>`** — `session.yaml.notes` is a YAML literal block scalar containing markdown text. Rendering it via the same component as the job READMEs makes formatting consistent.
- **`extractSectionId` is a private helper inside `page.tsx`** — same string-or-object-shape logic as in `pipeline-state.ts`'s rollup function. Two-line helper, not worth a shared module.
- **`tabular-nums` on the features column** — vertical alignment of numbers. Without it, the column looks ragged when going from `1 / 3` to `12 / 17`.
- **No "live updates" indicator** — the status is build-time-frozen. No need for a "last updated" timestamp because the page doesn't refresh between builds. The `session.startedAt` field is the closest analog and is rendered in the current-state section.
- **`getJobsRollup` reads `getAllJobs` + `getSessionStatus` internally** — `Promise.all` here parallelizes the three loader calls but most of the work is shared cache hits. Code-clarity choice.

### Files

| Action | File                                                              |
|--------|-------------------------------------------------------------------|
| NEW    | `src/components/build-log/JobsRollupTable.tsx`                    |
| NEW    | `src/components/build-log/__tests__/JobsRollupTable.test.tsx`     |
| NEW    | `src/app/build-log/status/page.tsx`                               |
| NEW    | `src/app/build-log/status/__tests__/page.test.tsx`                |

---

## Phase 2 Exit Criteria

- `npm run lint` clean, `npm test` green + coverage still ≥ thresholds, `npm run build` clean
- `<MarkdownDocument>` renders fixture markdown with GFM tables, fenced code blocks, autolinked headings, demoted h1→h2, and overflow-wrapped tables
- `/build-log` index page lists every `currentwork/*/` directory as a `<JobCard>` with status badge, alias, excerpt, and "View →" link
- `/build-log/jobs/community-showcase` renders the README via `<MarkdownDocument>` plus a `<PhaseNav>` listing all phases, plus a back-link
- `/build-log/jobs/community-showcase/phase-1-foundation` renders the phase body, the parsed header strip, an active-state `<PhaseNav>`, and a two-segment breadcrumb back to the job + build-log
- `/build-log/jobs/bogus` and `/build-log/jobs/community-showcase/phase-99-bogus` return 404 (`dynamicParams = false`)
- `/build-log/status` shows current session state (or `—` for empty fields), the `<JobsRollupTable>` with progress bars, the completed-sections list (or empty-state copy), and the notes section if present
- `generateStaticParams` enumerates every `(slug, phase)` tuple at build time — `npm run build` succeeds without runtime requests
- All 7 new packages (`react-markdown`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, `rehype-highlight`, `highlight.js`) are committed and the lockfile reflects them
- Phase 3 can start: every route exists with stub metadata waiting for richer SEO + JSON-LD treatment
