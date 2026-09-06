# Phase 1: Foundation

**Total Size: L + M**
**Prerequisites:** `website-foundation` shipped (brand tokens, `<Container>`, site shell, `<EmailCapture>`, `src/app/sitemap.ts`, `src/app/globals.css`, `zod` installed).
**New Types:** `Tool`, `ToolCategory`
**New Files:** `src/content/schemas/tool.ts`, `src/content/tools/registry.ts`, `src/components/tools/ToolShell.tsx`, `src/components/tools/ToolCard.tsx`, `src/app/tools/page.tsx`, `src/app/tools/[slug]/page.tsx` + co-located tests.

Phase 1 is the scaffolding phase. After it ships, `/tools` renders an empty
grid ("More tools landing soon."), `/tools/bogus` 404s, and every Phase 2
calculator has a well-typed slot waiting for it: import the calculation
module, mount a `<ToolShell>`, add one entry to the registry, done. No
calculator logic lives in this phase — only the chrome.

---

## Feature 1.1: Tool Schema + Empty Registry + `<ToolShell>` Layout

**Complexity: L** — Typed `Tool` interface, runtime-validating `ToolSchema`, empty registry module exposing `getAllTools()` / `getToolBySlug()`, and the shared `<ToolShell>` layout scaffolding that every calculator mounts inside. Schema and shell ship together because `<ToolShell>` imports the `Tool` type and `TOOL_CATEGORIES` directly — they can't be meaningfully tested apart.

### Problem

`/tools` needs a typed index of calculators. An MDX-backed content type would
be overkill — tools are code, not prose — and the calculators need to be real
React components that render interactive UI. The right shape is a TypeScript
registry: one module exports an array of typed `Tool` records, each carrying
a reference to a calculator component. A Zod schema validates every entry at
module-load time so a bad entry fails the build instead of the request.

Every calculator also needs the same visual scaffolding — title, category
label, description, a two-column layout (inputs on the left, result on the
right), and a capture CTA below the grid. Duplicating that across four
calculators is a recipe for drift. The right move is a shared `<ToolShell>`
component that takes the `Tool` metadata + children (inputs) + a `result`
prop and owns the conditional capture logic.

### Implementation

#### Schema + Registry

**NEW** `src/content/schemas/tool.ts`:

```ts
import { z } from 'zod';
import type { ComponentType } from 'react';

export type ToolCategory = 'scoping' | 'pricing' | 'roi' | 'timeline';

export const TOOL_CATEGORIES: Record<ToolCategory, string> = {
  scoping: 'Scoping',
  pricing: 'Pricing',
  roi: 'ROI',
  timeline: 'Timeline',
};

export interface Tool {
  slug: string;              // kebab-case, matches /tools/[slug]
  title: string;             // display title
  summary: string;           // one-sentence description (card + og)
  category: ToolCategory;
  tagline: string;           // short in-tool subtitle (~6 words)
  Component: ComponentType;  // the calculator component reference
}

export const ToolSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(4).max(80),
  summary: z.string().min(20).max(200),
  category: z.enum(['scoping', 'pricing', 'roi', 'timeline']),
  tagline: z.string().min(4).max(80),
  Component: z.custom<ComponentType>((v) => typeof v === 'function'),
});
```

**MODIFY** `src/content/schemas/index.ts` — add the re-export:

```ts
export * from './content-tier';
export * from './content-pillar';
export * from './episode';
export * from './source-material';
export * from './tool';        // ← new
```

**NEW** `src/content/tools/registry.ts`:

```ts
import type { Tool } from '@/content/schemas';
import { ToolSchema } from '@/content/schemas/tool';

// Phase 1.1 ships with an empty registry. Phase 2 features append entries
// one at a time. Keep the array assignment in one place so the runtime
// validation loop below covers every entry uniformly.
const registry: Tool[] = [
  // 2.1: { slug: 'project-scoping', ..., Component: ProjectScopingCalculator }
  // 2.1: { slug: 'pricing',         ..., Component: PricingCalculator }
  // 2.2: { slug: 'roi',             ..., Component: RoiCalculator }
  // 2.2: { slug: 'discovery-timeline', ..., Component: DiscoveryTimelineCalculator }
];

// Runtime guard — malformed entries fail at module load.
for (const tool of registry) {
  ToolSchema.parse(tool);
}

export function getAllTools(): readonly Tool[] {
  return registry;
}

export function getToolBySlug(slug: string): Tool | undefined {
  return registry.find((t) => t.slug === slug);
}
```

#### `<ToolShell>` Layout Component

**NEW** `src/components/tools/ToolShell.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import type { Tool } from '@/content/schemas';
import { TOOL_CATEGORIES } from '@/content/schemas/tool';

interface ToolShellProps {
  tool: Tool;
  children: ReactNode;         // inputs — typically form fields
  result: ReactNode | null;    // right pane; null = no result computed yet
  captureCopy?: string;        // override the default CTA copy
}

const DEFAULT_CAPTURE_COPY = 'Want the full breakdown sent to your inbox?';

export function ToolShell({
  tool,
  children,
  result,
  captureCopy = DEFAULT_CAPTURE_COPY,
}: ToolShellProps) {
  const hasResult = result !== null;

  return (
    <Container as="main" className="py-12 md:py-16">
      <header className="mb-8 border-b border-mist pb-6">
        <p className="text-xs uppercase tracking-wide text-muted">
          Free Tool · {TOOL_CATEGORIES[tool.category]}
        </p>
        <h1 className="mt-2 font-display text-3xl text-foreground md:text-4xl">
          {tool.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted">{tool.summary}</p>
      </header>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
        <section aria-labelledby="tool-inputs-heading">
          <h2
            id="tool-inputs-heading"
            className="mb-4 text-sm font-medium uppercase tracking-wide text-muted"
          >
            Inputs
          </h2>
          {children}
        </section>

        <section aria-labelledby="tool-result-heading" aria-live="polite">
          <h2
            id="tool-result-heading"
            className="mb-4 text-sm font-medium uppercase tracking-wide text-muted"
          >
            Result
          </h2>
          {result ?? (
            <p className="rounded-md border border-dashed border-mist p-6 text-sm text-muted">
              Fill in the inputs to see a result.
            </p>
          )}
        </section>
      </div>

      {hasResult && (
        <section
          aria-labelledby="tool-capture-heading"
          className="mt-12 rounded-md border border-mist bg-parchment p-6"
        >
          <p id="tool-capture-heading" className="mb-3 text-sm text-foreground">
            {captureCopy}
          </p>
          <EmailCapture source={`tool-${tool.slug}`} />
        </section>
      )}
    </Container>
  );
}
```

### Tests (red phase of section `free-tools-1.1`)

**Schema + registry** — `src/content/tools/__tests__/registry.test.ts`:
- `ToolSchema.safeParse(...)` rejects: empty slug, non-kebab slug (`'Project_Scoping'`, `'foo bar'`), title under 4 chars, summary over 200 chars, unknown category, non-function `Component`
- `ToolSchema.safeParse(...)` accepts a well-formed entry
- `getAllTools()` returns an array (empty after this feature, non-empty in later features — test uses `toEqual([])` with an injected-module fixture OR simply asserts `Array.isArray` and length ≥ 0 against the real registry)
- `getToolBySlug('nope')` returns `undefined`
- `getToolBySlug` against a known slug returns the matching tool once Phase 2 entries land (deferred assertion — Phase 1.1 tests may skip or use a test-only fixture registry)
- Module-load validation: create a malformed fixture entry in a test-local module, import it, expect `ToolSchema.parse` to throw

**`<ToolShell>`** — `src/components/tools/__tests__/ToolShell.test.tsx`:
- Renders the tool title, summary, and category label ("Free Tool · {CategoryLabel}") in the header
- `children` render inside the inputs `<section>`
- `result === null` → result slot shows the placeholder copy "Fill in the inputs to see a result."
- `result` is a non-null ReactNode → result slot shows the passed node; placeholder is absent
- Capture section is absent when `result === null`
- Capture section is present when `result` is non-null; it embeds `<EmailCapture>` with `source="tool-{slug}"` (assert on the rendered hidden input or pass a spy component if `EmailCapture` is mocked)
- `aria-live="polite"` is set on the result region
- Default capture copy is used when `captureCopy` prop is omitted; custom copy is used when passed

### Design Decisions

**Schema + registry:**
- **`Component: ComponentType` in the type** — the registry holds component references directly, not dynamic import paths. Every tool is a local module; tree-shaking and typed imports work normally. No `React.lazy` gymnastics.
- **Runtime validation loop at module load** — catches typos in tool entries at build time rather than at request time. `zod` is already present from `wf` 1.2, so there's no new dependency cost.
- **Kebab-case slug regex** — matches the `wf` pattern for episode and case slugs. Regex is intentionally strict (no leading/trailing dashes, no double dashes).
- **`ToolCategory` as a closed union, not a free string** — forces a typed grouping on `/tools`. If a future tool doesn't fit an existing category, the type complains and the author has to decide: widen the enum or force-fit. Good friction.
- **`readonly Tool[]` return type from `getAllTools()`** — prevents callers from mutating the registry. The internal `registry` array stays mutable so Phase 2 features can append to it literally, but the public API is read-only.
- **`getAllTools` + `getToolBySlug` naming** — mirrors `getAllEpisodes` / `getEpisodeBySlug` from `wf` 2.2, so future readers recognize the pattern without context.

**`<ToolShell>`:**
- **Capture section gated on `result !== null`** — matches the "optional CTA after result" scope decision. Users who land on a tool page and poke around without running the calc don't see the email form at all. Non-blocking.
- **Capture as a separate visual block below the grid** — not crammed into the result column. Keeps the result breathable and makes the CTA feel optional instead of pushy.
- **`children` for inputs, `result` as a separate prop** — this is the pattern that lets the shell own the conditional capture logic without inspecting its children. Each calculator component decides its own input form and result rendering and passes them in.
- **`aria-live="polite"` on the result region** — screen reader users hear the result announced when it updates, without interrupting. Required for Lighthouse a11y ≥ 95.
- **`TOOL_CATEGORIES[tool.category]` for the label** — the raw category value (`'roi'`) is a machine identifier; the label (`'ROI'`) is what the user sees. One source of truth in the schema module.
- **`<Container as="main">`** — every tool route is its own page, so the container renders as `<main>`. Screen readers land on the main content directly from skip links.
- **Default capture copy as a module constant, with per-tool override** — one sensible default, but a tool that needs punchier copy can override.
- **No result-cleared side effect** — if a user edits an input after computing, it's up to the calculator component to decide whether to clear or recompute the result. `<ToolShell>` just renders what it's told.

### Files

| Action | File                                                |
|--------|-----------------------------------------------------|
| NEW    | `src/content/schemas/tool.ts`                       |
| MODIFY | `src/content/schemas/index.ts`                      |
| NEW    | `src/content/tools/registry.ts`                     |
| NEW    | `src/content/tools/__tests__/registry.test.ts`      |
| NEW    | `src/components/tools/ToolShell.tsx`                |
| NEW    | `src/components/tools/__tests__/ToolShell.test.tsx` |

---

## Feature 1.2: `/tools` Index + `/tools/[slug]` Dynamic Route

**Complexity: M** — Server-rendered `/tools` index listing every registry entry as a card, plus a single dynamic `/tools/[slug]` route that looks up the tool by slug, renders the registered component, and 404s at build time for unknown slugs. Index and detail ship together because they're two views of the same `Tool` data (same pattern as shipped `wf 3.2` Episodes and `wf 3.3` Cases).

### Problem

Visitors need an entry point that shows every tool with a one-line summary
and a click target. Without a hub, the four tool routes are unlisted,
uncrawlable from within the site, and invisible in the header nav.

Each registered tool also needs its own URL. Writing four hand-coded
`page.tsx` files would duplicate scaffolding and make adding a fifth tool
annoying. The registry + one dynamic route gives us static-generated routes
for every entry with zero duplication.

### Implementation

#### Index Page

**NEW** `src/components/tools/ToolCard.tsx`:

```tsx
import type { Tool } from '@/content/schemas';
import { TOOL_CATEGORIES } from '@/content/schemas/tool';

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <article className="group h-full rounded-md border border-mist p-6 transition-colors hover:border-accent">
      <p className="text-xs uppercase tracking-wide text-muted">
        {TOOL_CATEGORIES[tool.category]}
      </p>
      <h2 className="mt-2 font-display text-xl text-foreground group-hover:text-accent">
        {tool.title}
      </h2>
      <p className="mt-3 text-sm text-muted">{tool.tagline}</p>
      <p className="mt-4 text-xs text-link">Open tool →</p>
    </article>
  );
}
```

**NEW** `src/app/tools/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { ToolCard } from '@/components/tools/ToolCard';
import { getAllTools } from '@/content/tools/registry';

export const metadata: Metadata = {
  title: 'Free Tools',
  description:
    'Free calculators for project scoping, pricing, ROI analysis, and discovery timelines. Built by Travis Gautier.',
};

export default function ToolsIndexPage() {
  const tools = getAllTools();

  return (
    <Container as="main" className="py-12 md:py-16">
      <header className="mb-10 border-b border-mist pb-6">
        <p className="text-xs uppercase tracking-wide text-muted">Free Tools</p>
        <h1 className="mt-2 font-display text-3xl text-foreground md:text-4xl">
          Calculators &amp; estimators
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Free, no-login utilities for project work. Results are deterministic,
          inputs stay on your device, and nothing calls home unless you opt in.
        </p>
      </header>

      {tools.length === 0 ? (
        <p className="text-sm text-muted">More tools landing soon.</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {tools.map((tool) => (
            <li key={tool.slug}>
              <Link href={`/tools/${tool.slug}`} className="block h-full">
                <ToolCard tool={tool} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
```

#### Dynamic Route

**NEW** `src/app/tools/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getAllTools, getToolBySlug } from '@/content/tools/registry';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTools().map((tool) => ({ slug: tool.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const { Component } = tool;
  return <Component />;
}
```

The calculator component itself (shipped in Phase 2) mounts `<ToolShell tool={tool} ...>` internally. Phase 1.2 intentionally keeps the dynamic route dumb — it just selects a component from the registry.

### Tests (red phase of section `free-tools-1.2`)

**Index** — `src/components/tools/__tests__/ToolCard.test.tsx` + co-located page test:
- Empty registry → page renders "More tools landing soon." and no `<ul>` grid
- Non-empty registry (via a test-only fixture array) → renders one `<li>` per tool; each `<li>` contains a `<Link>` with `href="/tools/{slug}"` wrapping a `<ToolCard>`
- Each card exposes the tool title as an `<h2>` heading
- Each card shows the tool category label (from `TOOL_CATEGORIES[...]`), not the raw enum value
- `metadata.title === 'Free Tools'` and description matches expected copy

**Dynamic route** — `src/app/tools/[slug]/__tests__/page.test.tsx`:
- `generateStaticParams()` returns `[]` when the registry is empty (Phase 1 shipping state)
- `generateStaticParams()` returns one `{ slug }` object per registry entry when the registry has tools (deferred assertion for Phase 2)
- Rendering the page with an unknown slug calls `notFound()` (mock `next/navigation`'s `notFound` and assert it was invoked)
- Rendering with a known slug returns the associated `Component` (use a test-only fixture registry injected via module mocking)
- `dynamicParams === false` exported

### Design Decisions

**Index:**
- **Server component** — the index page is a pure read of the registry, no client JS required. Cards are static link elements. `<ToolCard>` is also a server component.
- **`<Link>` wraps the card, not the heading** — the entire card is the affordance. Clearer click target, better mobile hit area.
- **Empty-state copy** — Phase 1 ships before Phase 2, so the index page will be empty on intermediate commits. The empty state is a feature, not a bug; it keeps the site shippable between Phase 1 completion and Phase 2 completion.
- **`<ul>` semantics** — the grid of tools is a list, so it's marked up as one. Lighthouse a11y cares.
- **`grid gap-6 md:grid-cols-2`** — matches the grid pattern from `wf` 3.2 (episodes index) and `wf` 3.3 (cases index), so visitors moving between sections see consistent rhythm.
- **`className="block h-full"` on `<Link>`** — otherwise the link collapses to text-height and the card border only half-highlights on hover.
- **`metadata` as a const, not `generateMetadata`** — the `/tools` index is static; no per-request computation needed. Phase 3.1 may widen this into `openGraph` / `twitter` but the shape stays a const.

**Dynamic route:**
- **`dynamicParams = false`** — unknown slugs 404 at build time. Matches `wf` 3.3 + 3.5 pattern for `/episodes/[slug]` and `/cases/[slug]`.
- **Each calculator owns its `<ToolShell>` usage, not the dynamic route** — because the shell's `result` prop is driven by client state (`useState`) inside the calculator. If the dynamic route wrapped `<ToolShell>`, the dynamic route would have to be a client component, and we'd lose route-level server-rendered metadata (Phase 3.1's `generateMetadata` + JSON-LD).
- **Dynamic route is a server component** — no `'use client'`. Only the calculator component inside is marked client.
- **`params: Promise<{ slug: string }>`** — Next.js 16 App Router passes dynamic route params as a promise; `await` is required. Matches the pattern in `AGENTS.md` (local Next.js 16 docs).
- **No try/catch around `getToolBySlug`** — it returns `undefined` for misses, not a throw. `notFound()` handles the miss; any actual thrown error is a programmer bug and should propagate.

### Files

| Action | File                                               |
|--------|----------------------------------------------------|
| NEW    | `src/components/tools/ToolCard.tsx`                |
| NEW    | `src/components/tools/__tests__/ToolCard.test.tsx` |
| NEW    | `src/app/tools/page.tsx`                           |
| NEW    | `src/app/tools/[slug]/page.tsx`                    |
| NEW    | `src/app/tools/[slug]/__tests__/page.test.tsx`     |

---

## Phase 1 Exit Criteria

- `npm run lint` clean, `npm test` green, coverage still ≥ thresholds, `npm run build` clean
- `/tools` renders empty-state copy ("More tools landing soon.") under `npm run dev`
- `/tools/bogus` returns a 404 page
- `ToolSchema.parse()` rejects every malformed fixture in the test suite
- `<ToolShell>` renders both slots correctly in RTL tests, with conditional capture working
- Phase 2 can start: each calculator feature has a clear slot to plug into (`src/components/tools/calculators/{Name}Calculator.tsx` + a registry entry in `src/content/tools/registry.ts`)
