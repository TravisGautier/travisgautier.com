# Phase 1: Foundation

**Total Size: L + M (consolidated from M + M + M)**
**Prerequisites:** `website-foundation` shipped — brand tokens (wf 1.3), site shell (wf 1.4), validators module at `src/content/schemas/validators.ts` (wf 1.2), generic content loader pattern (wf 2.2), `zod` installed.
**New Types:** `Job`, `JobFeature`, `JobPhase`, `SessionStatus`, `KnowledgeFile`, `JobRollupEntry`
**New Files:** `src/content/schemas/build-log.ts`, `src/lib/build-log/{jobs.ts,parse-readme.ts,parse-phase.ts,pipeline-state.ts}` + co-located tests
**New Packages:** `yaml`

Phase 1 is pure plumbing. After it ships, there's no visible UI yet — but the
type system, the runtime validators, both loaders, and the `getJobsRollup`
join all exist and round-trip cleanly against the real `currentwork/` and
`pipeline/active/` trees. Phase 2 builds pages against a known-good data
layer. Every loader follows the cache-and-freeze pattern from
`website-foundation` 2.2 (`src/lib/content/episodes.ts`,
`src/lib/content/cases.ts`); the only architectural novelty is that this
loader's source-of-truth lives outside `src/content/`.

Post-condense, this phase ships in two sections instead of three. Feature 1.1
consolidates the schemas + Zod validators + the job-tree loader (filesystem
walker + README/phase parsers) into one L-sized pipeline run. Feature 1.2
(formerly 1.3) handles the pipeline-state loader + rollup join independently.

---

## Feature 1.1: Schemas + Job-Tree Loader

**Complexity: L (consolidated from old 1.1 schemas M + old 1.2 loader M)** — Six interfaces, five Zod schemas, two markdown parsers (`parse-readme.ts`, `parse-phase.ts`), and the filesystem walker `jobs.ts` that joins them. Merged because the loader cannot be meaningfully tested without the schemas it validates against; the schemas cannot be exercised without a consumer. After this feature ships, the full validated data layer for the `currentwork/` tree is in place and Feature 1.2 (pipeline state) can consume the same `getAllJobs()` entry point.

### Part 1 — Schemas + Zod Validators

**Part complexity: M** — Six interfaces and five Zod schemas. Wider than the
typical content schema because the build log surfaces several distinct
artifact shapes (job tree, phase file, session state, knowledge file, rollup).

#### Problem

The job-tree loader (1.2) and the pipeline-state loader (1.3) both need typed
return shapes that can be Zod-validated at the edge. Without explicit types
the loaders pass `any` into the page components, the markdown renderer can't
know whether a `Job` actually has the fields it expects, and the rollup join
in 1.3 has no schema to assert against.

The shapes follow the existing `Episode`/`Case` interface pattern from `wf`
1.1: TS interface in `src/content/schemas/build-log.ts`, matching Zod schema
in `src/content/schemas/validators.ts`, re-export from the barrel.

#### Implementation

**NEW** `src/content/schemas/build-log.ts`:

```ts
export interface JobFeature {
  /** Feature ID like "1.1", "2.3", etc. — parsed from the table row */
  id: string;
  /** Feature name from the table row */
  name: string;
  /** Phase label like "1 - Foundation" */
  phase: string;
  /** Size estimate: "S" | "M" | "L" | "XL" */
  size: string;
  /** Status from the table — typically "Planned", may be "In progress" / "Complete" */
  status: string;
}

export interface JobPhaseHeader {
  /** Phase number from "# Phase N: ..." */
  phaseNumber?: number;
  /** Title text from the H1 */
  title?: string;
  /** "**Total Size:** ..." line, raw */
  totalSize?: string;
  /** "**Prerequisites:** ..." line, raw */
  prerequisites?: string;
  /** "**New Types:** ..." line, raw */
  newTypes?: string;
  /** "**New Files:** ..." line, raw */
  newFiles?: string;
}

export interface JobPhase {
  /** Filename slug, e.g. "phase-1-foundation" (sans .md extension) */
  slug: string;
  /** Original filename relative to the job dir, e.g. "phase-1-foundation.md" */
  filename: string;
  /** Parsed header block (best-effort — may be undefined fields if file is mid-write) */
  header: JobPhaseHeader;
  /** Raw markdown body of the entire file (including the header) */
  body: string;
}

export interface Job {
  /** Canonical slug — matches the directory name under currentwork/ */
  slug: string;
  /** Optional alias parsed from the README's "**Alias:** ..." line */
  alias?: string;
  /** Title from the H1, e.g. "community-showcase — Implementation Plan" */
  title: string;
  /** Prose between "## Context" and the next "##" — raw markdown */
  context: string;
  /** Parsed Feature Overview table rows (empty array if missing or unparseable) */
  features: readonly JobFeature[];
  /** Phase files discovered in the job directory, ordered by filename */
  phases: readonly JobPhase[];
  /** Raw README markdown body (the full file) — passed through to the renderer */
  readmeBody: string;
}

export interface SessionStatus {
  /** Session ID from the YAML */
  id: string;
  startedAt?: string;
  currentPhase?: string;
  currentSection?: string;
  currentAgent?: string;
  currentStage?: string;
  contextWindow?: {
    iteration?: number;
    totalItems?: number;
    completedItems?: number;
  };
  /** Each entry is either a string section ID or an object with at minimum a `section` field */
  completedSections: readonly (string | { section: string; completedAt?: string })[];
  notes?: string;
}

export interface KnowledgeFile {
  version?: number;
  project?: string;
  description?: string;
  projectContext?: {
    purpose?: string;
    stack?: Record<string, unknown>;
    contentModel?: Record<string, unknown>;
  };
  conventions?: Record<string, unknown>;
  patterns?: readonly unknown[];
  openQuestions?: readonly unknown[];
}

export interface JobRollupEntry {
  /** Job slug */
  slug: string;
  /** Display title (from the README H1) */
  title: string;
  /** Optional alias */
  alias?: string;
  /** Total feature count from the parsed Feature Overview table */
  totalFeatures: number;
  /** Number of features whose section ID appears in session.completedSections */
  completedFeatures: number;
  /** 0–100 integer; null when totalFeatures === 0 (unknown) */
  percentComplete: number | null;
  /** Computed status: "planned" | "in-progress" | "complete" | "unknown" */
  status: 'planned' | 'in-progress' | 'complete' | 'unknown';
}
```

**MODIFY** `src/content/schemas/index.ts` — add the re-export:

```ts
export * from './content-tier';
export * from './content-pillar';
export * from './episode';
export * from './source-material';
export * from './case';            // from wf 1.1
export * from './build-log';       // ← new
export * from './validators';      // from wf 1.2
```

**MODIFY** `src/content/schemas/validators.ts` — add the new schemas alongside
the existing `EpisodeSchema` / `CaseSchema`. Loaders import these directly.

```ts
import { z } from 'zod';

// ... existing EpisodeSchema, SourceMaterialSchema, CaseSchema ...

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PHASE_SLUG = /^phase-\d+-[a-z0-9]+(-[a-z0-9]+)*$/;
const SECTION_ID = /^[a-z0-9-]+-\d+\.\d+$/;

export const JobFeatureSchema = z.object({
  id: z.string().regex(/^\d+\.\d+$/),
  name: z.string().min(1).max(200),
  phase: z.string().min(1).max(80),
  size: z.string().min(1).max(8),
  status: z.string().min(1).max(40),
});

export const JobPhaseHeaderSchema = z.object({
  phaseNumber: z.number().int().positive().optional(),
  title: z.string().optional(),
  totalSize: z.string().optional(),
  prerequisites: z.string().optional(),
  newTypes: z.string().optional(),
  newFiles: z.string().optional(),
});

export const JobPhaseSchema = z.object({
  slug: z.string().regex(PHASE_SLUG),
  filename: z.string().regex(/^phase-\d+-[a-z0-9-]+\.md$/),
  header: JobPhaseHeaderSchema,
  body: z.string().min(1),
});

export const JobSchema = z.object({
  slug: z.string().regex(SLUG),
  alias: z.string().regex(/^[a-z]{1,8}$/).optional(),
  title: z.string().min(1).max(200),
  context: z.string(),
  features: z.array(JobFeatureSchema),
  phases: z.array(JobPhaseSchema),
  readmeBody: z.string().min(1),
});

const CompletedSectionEntrySchema = z.union([
  z.string().regex(SECTION_ID),
  z.object({
    section: z.string().regex(SECTION_ID),
    completedAt: z.string().optional(),
  }).passthrough(),
]);

export const SessionStatusSchema = z.object({
  id: z.string().min(1),
  startedAt: z.string().optional(),
  currentPhase: z.string().optional(),
  currentSection: z.string().optional(),
  currentAgent: z.string().optional(),
  currentStage: z.string().optional(),
  contextWindow: z.object({
    iteration: z.number().int().nonnegative().optional(),
    totalItems: z.number().int().nonnegative().optional(),
    completedItems: z.number().int().nonnegative().optional(),
  }).optional(),
  completedSections: z.array(CompletedSectionEntrySchema),
  notes: z.string().optional(),
});

export const KnowledgeFileSchema = z.object({
  version: z.number().int().positive().optional(),
  project: z.string().optional(),
  description: z.string().optional(),
  projectContext: z.object({
    purpose: z.string().optional(),
    stack: z.record(z.string(), z.unknown()).optional(),
    contentModel: z.record(z.string(), z.unknown()).optional(),
  }).passthrough().optional(),
  conventions: z.record(z.string(), z.unknown()).passthrough().optional(),
  patterns: z.array(z.unknown()).optional(),
  openQuestions: z.array(z.unknown()).optional(),
}).passthrough();
```

#### Tests

`src/content/schemas/__tests__/validators.test.ts` — add `describe` blocks for
each new schema:

- `JobFeatureSchema`:
  - Accepts `{ id: "1.1", name: "Foo", phase: "1 - Foundation", size: "M", status: "Planned" }`
  - Rejects `id: "1"` (no `.N`), `id: "1.1.2"`, `id: "abc"`
  - Rejects empty `name`, `name` over 200 chars
  - Rejects `size: ""`
- `JobSchema`:
  - Accepts a hand-built fixture with all fields
  - Rejects `slug: 'Bad_Slug'` (not kebab-case), `slug: 'UPPER'`
  - Accepts `alias: 'cs'`, `alias: 'wf'`, `alias` undefined
  - Rejects `alias: 'Cs'` (uppercase), `alias: 'cs-1'` (hyphen)
  - Accepts `features: []` (an unparseable table is valid; we tolerate)
  - Accepts `phases: []` (a job with no phase files is valid; degenerate but tolerated)
- `JobPhaseSchema`:
  - Accepts `slug: 'phase-1-foundation'`, `filename: 'phase-1-foundation.md'`
  - Rejects `slug: 'phase-1'` (no descriptive suffix)
  - Rejects `filename: 'phase-1-foundation.txt'`
  - Accepts an empty `header` object (all optional)
- `SessionStatusSchema`:
  - Accepts the live `pipeline/active/session.yaml` parsed into JS (load via the YAML parser in 1.3 — the test stub can `import yaml from 'yaml'` directly without needing `pipeline-state.ts`)
  - Accepts `completedSections: []`
  - Accepts `completedSections: ['website-foundation-1.1']` (string-form)
  - Accepts `completedSections: [{ section: 'website-foundation-1.1', completedAt: '2026-04-12' }]` (object-form)
  - Rejects `completedSections: [{ section: 'invalid-format' }]`
  - Accepts `id: '2026-04-11-001'` and rejects empty `id`
  - All fields except `id` and `completedSections` are optional (`startedAt` is, `currentSection` is, etc.)
- `KnowledgeFileSchema`:
  - Accepts the live `pipeline/active/knowledge.yaml` parsed into JS
  - Accepts an empty object (`{}`) — every field is optional (graceful degradation)
  - Uses `.passthrough()` so unknown top-level fields don't fail the parse

Add a `validJobFixture()` helper export from the test file so 1.2 and 1.3
tests can reuse it.

#### Design Decisions

- **Interfaces in `build-log.ts`, schemas in `validators.ts`** — matches the `Episode` / `EpisodeSchema` split from `wf` 1.1 and 1.2. Types are the public API; validators are infrastructure that imports `zod`. The barrel stays light.
- **Schemas tolerate missing optional fields, not strict** — the build log surfaces in-progress and freshly-initialized state. Strict mode would break `npm run build` whenever a session was newly initialized. Pages render gracefully when fields are absent.
- **`features: []` and `phases: []` are valid** — a freshly-created job dir might have a README with no Feature Overview table yet, or no `phase-N-*.md` files yet. The build log should render that state, not fail. Phase 2.2 handles the empty-features case in the page UI.
- **`completedSections` accepts both string and object form** — the existing `pipeline/active/session.yaml` has the field as an empty list. The forward-compatible shape (per the partymasters port that the skills come from) is one entry per `/finish` run, optionally with metadata. Accepting both forms keeps the schema stable through that evolution.
- **`KnowledgeFile` uses `.passthrough()` extensively** — `knowledge.yaml` is meant to be an open-ended notes store; the schema validates the known shape but doesn't reject extra fields. The page renders only the known fields and ignores the rest.
- **`alias` regex restricts to 1-8 lowercase letters, no digits/hyphens** — matches the existing aliases (`wf`, `cs`, `tr`, `bpd`) and the alias-table convention from `CLAUDE.md`. If the convention evolves to allow digits, the regex widens.
- **`SECTION_ID` regex matches `{slug}-{N.M}`** — this is the cross-reference key joining `Job.features[i].id` (e.g. `"1.1"`) with `SessionStatus.completedSections[i]` (e.g. `"community-showcase-1.1"`). The rollup logic in 1.3 reconstructs the full section ID by concatenating `${job.slug}-${feature.id}`.
- **`title: string.min(1)` instead of stricter validation** — the README H1 is human-authored prose; pinning a length minimum higher than 1 risks breaking on freshly-created job dirs.
- **`JobPhaseHeader` is best-effort** — the header parser in 1.2 returns `undefined` fields when it can't find them. The page renders the body without the header strip when fields are missing. Strict mode would block in-progress phase files from appearing on the build log entirely, defeating the purpose.
- **Per-field length caps stay conservative** — string-length caps prevent a runaway 100KB notes block from blowing up `getStaticProps` memory. Caps are generous enough for normal authoring.
- **No `validatedAt` or build-time-stamp fields** — the build log is regenerated on every `npm run build`; freshness isn't a per-record concern. The status board surfaces the build's freshness directly via `session.yaml.startedAt`.

#### Files (Part 1)

| Action | File                                                 |
|--------|------------------------------------------------------|
| NEW    | `src/content/schemas/build-log.ts`                   |
| MODIFY | `src/content/schemas/index.ts`                       |
| MODIFY | `src/content/schemas/validators.ts`                  |
| MODIFY | `src/content/schemas/__tests__/validators.test.ts`   |

---

### Part 2 — Job-Tree Loader

**Part complexity: M** — Filesystem walker + two markdown sub-parsers + a typed
public API. The interesting work is in `parse-readme.ts` (extracts the alias,
the Context section, and the Feature Overview table from a README markdown
string via regex) and `parse-phase.ts` (extracts the header block from a phase
file).

#### Problem

Phase 2 needs `getAllJobs()`, `getJobBySlug(slug)`, and
`getJobPhase(slug, phaseSlug)` functions that return typed, validated `Job`
and `JobPhase` records reflecting the current state of `currentwork/`. The
loader must work at build time (server components only — no fetch, no
runtime), match the `wf` 2.2 cache-and-freeze convention, and handle three
edge cases:

1. **Empty `currentwork/`** (only `TEMPLATE.md`) → return `[]`, do NOT throw.
2. **Job dir without a README** → skip the dir, log a warning, do not crash.
3. **Job README without a parseable feature table** → return `features: []`,
   render the body without a structured feature index.

#### Implementation

**NEW** `src/lib/build-log/parse-readme.ts`:

```ts
import type { JobFeature } from '@/content/schemas';

const ALIAS_RE = /^\*\*Alias:\*\*\s*`([a-z]{1,8})`/m;
const CONTEXT_RE = /^## Context\s*\n+([\s\S]*?)(?=\n## |\n$)/m;
const TABLE_HEADER_RE = /^\|\s*#\s*\|\s*Feature\s*\|\s*Phase\s*\|\s*Size\s*\|\s*Status\s*\|/m;
const TABLE_ROW_RE = /^\|\s*([0-9]+\.[0-9]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;

export interface ParsedReadme {
  title: string;
  alias?: string;
  context: string;
  features: JobFeature[];
}

export function parseReadme(markdown: string): ParsedReadme {
  // Title: first H1
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() ?? '';

  // Alias (optional)
  const aliasMatch = markdown.match(ALIAS_RE);
  const alias = aliasMatch?.[1];

  // Context: prose between "## Context" and the next "##"
  const contextMatch = markdown.match(CONTEXT_RE);
  const context = contextMatch?.[1]?.trim() ?? '';

  // Feature Overview table — only parse rows after the header line
  const features: JobFeature[] = [];
  if (TABLE_HEADER_RE.test(markdown)) {
    // Reset regex state on the global RE
    TABLE_ROW_RE.lastIndex = 0;
    let row: RegExpExecArray | null;
    while ((row = TABLE_ROW_RE.exec(markdown)) !== null) {
      // Skip the header row's separator (|---|---|...) which won't match the row regex anyway
      const [, id, name, phase, size, status] = row;
      // Stripping backticks/markdown from the cells
      const cleaned = (s: string) => s.replace(/`/g, '').trim();
      features.push({
        id: cleaned(id),
        name: cleaned(name),
        phase: cleaned(phase),
        size: cleaned(size),
        status: cleaned(status),
      });
    }
  }

  return { title, alias, context, features };
}
```

**NEW** `src/lib/build-log/parse-phase.ts`:

```ts
import type { JobPhaseHeader } from '@/content/schemas';

export function parsePhaseHeader(markdown: string): JobPhaseHeader {
  // Phase number + title from "# Phase N: Title"
  const titleMatch = markdown.match(/^#\s+Phase\s+(\d+):\s*(.+)$/m);
  const phaseNumber = titleMatch ? Number(titleMatch[1]) : undefined;
  const title = titleMatch?.[2]?.trim();

  // The bold-key lines in the header block — best-effort, allowed to be absent
  const grab = (key: string): string | undefined => {
    const re = new RegExp(`^\\*\\*${key}:\\*\\*\\s*(.+)$`, 'm');
    const m = markdown.match(re);
    return m ? m[1].trim() : undefined;
  };

  return {
    phaseNumber,
    title,
    totalSize: grab('Total Size'),
    prerequisites: grab('Prerequisites'),
    newTypes: grab('New Types'),
    newFiles: grab('New Files'),
  };
}
```

**NEW** `src/lib/build-log/jobs.ts`:

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Job, JobPhase } from '@/content/schemas';
import { JobSchema } from '@/content/schemas/validators';
import { parseReadme } from './parse-readme';
import { parsePhaseHeader } from './parse-phase';

const CURRENTWORK_DIR = path.join(process.cwd(), 'currentwork');

let cache: readonly Job[] | null = null;

async function loadJob(slug: string): Promise<Job | null> {
  const jobDir = path.join(CURRENTWORK_DIR, slug);
  const readmePath = path.join(jobDir, 'README.md');

  let readmeBody: string;
  try {
    readmeBody = await fs.readFile(readmePath, 'utf8');
  } catch {
    // No README → skip the dir entirely
    return null;
  }

  const parsed = parseReadme(readmeBody);

  // Discover phase files via filesystem (filename order is monotonic because
  // they're prefixed with phase-N-). Sort by leading number to be safe.
  const entries = await fs.readdir(jobDir);
  const phaseFiles = entries
    .filter((f) => /^phase-\d+-[a-z0-9-]+\.md$/.test(f))
    .sort((a, b) => {
      const numA = Number(a.match(/^phase-(\d+)/)![1]);
      const numB = Number(b.match(/^phase-(\d+)/)![1]);
      return numA - numB;
    });

  const phases: JobPhase[] = await Promise.all(
    phaseFiles.map(async (filename) => {
      const body = await fs.readFile(path.join(jobDir, filename), 'utf8');
      return {
        slug: filename.replace(/\.md$/, ''),
        filename,
        header: parsePhaseHeader(body),
        body,
      };
    }),
  );

  const job: Job = {
    slug,
    alias: parsed.alias,
    title: parsed.title || slug,
    context: parsed.context,
    features: parsed.features,
    phases,
    readmeBody,
  };

  return JobSchema.parse(job);
}

async function loadAll(): Promise<readonly Job[]> {
  if (cache) return cache;

  let entries: string[];
  try {
    entries = await fs.readdir(CURRENTWORK_DIR);
  } catch {
    cache = Object.freeze([]);
    return cache;
  }

  const dirCandidates: string[] = [];
  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    if (entry === 'TEMPLATE.md') continue;
    const stat = await fs.stat(path.join(CURRENTWORK_DIR, entry));
    if (stat.isDirectory()) dirCandidates.push(entry);
  }

  const jobs = (await Promise.all(dirCandidates.map(loadJob))).filter(
    (j): j is Job => j !== null,
  );

  // Stable sort by slug
  jobs.sort((a, b) => a.slug.localeCompare(b.slug));

  cache = Object.freeze(jobs);
  return cache;
}

export async function getAllJobs(): Promise<readonly Job[]> {
  return loadAll();
}

export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  const all = await loadAll();
  return all.find((j) => j.slug === slug);
}

export async function getJobPhase(
  slug: string,
  phaseSlug: string,
): Promise<JobPhase | undefined> {
  const job = await getJobBySlug(slug);
  return job?.phases.find((p) => p.slug === phaseSlug);
}
```

#### Tests (merged into red phase of section `build-in-public-docs-1.1`)

**`src/lib/build-log/__tests__/parse-readme.test.ts`** — pure-function tests
against fixture markdown strings:

- Parses the alias line `**Alias:** \`cs\` — invoke as ...` → `alias: 'cs'`
- Returns `alias: undefined` when the line is absent
- Extracts the title from the first H1
- Extracts the Context section between `## Context` and the next `##`
- Returns `context: ''` when no Context section exists
- Parses a Feature Overview table with 8 rows → returns 8 `JobFeature` entries with the correct IDs (`"1.1"`, `"1.2"`, ..., `"3.2"`)
- Strips backticks from cell contents (the existing READMEs sometimes wrap feature names in backticks)
- Returns `features: []` when no table is present
- Handles a table with extra leading/trailing whitespace in cells
- Does NOT include the table separator row (`|---|---|`) as a feature

**`src/lib/build-log/__tests__/parse-phase.test.ts`** — pure-function tests:

- Parses `# Phase 1: Foundation\n\n**Total Size: M + M + S**\n**Prerequisites:** ...` → returns `{ phaseNumber: 1, title: 'Foundation', totalSize: 'M + M + S', prerequisites: '...' }`
- Returns `{ phaseNumber: undefined, title: undefined, ... }` for a phase file with no header block (just body markdown)
- Tolerates missing individual bold-key lines (returns the present ones, undefined for the absent ones)
- Does NOT throw on empty input

**`src/lib/build-log/__tests__/jobs.test.ts`** — integration test against the
real `currentwork/` tree (no mocks, no fixtures):

- `getAllJobs()` returns at least 7 entries (the planned-jobs count as of 2026-04-11; the test should assert `>= 1` to remain stable as jobs ship)
- Every returned `Job` has a non-empty `slug`, `title`, and `readmeBody`
- The list is sorted by slug ascending
- `getJobBySlug('community-showcase')` returns a job with `alias: 'cs'` and a non-empty `context` and at least 8 features
- `getJobBySlug('website-foundation')` returns a job with `alias: 'wf'`
- `getJobBySlug('bogus')` returns `undefined`
- `getJobPhase('community-showcase', 'phase-1-foundation')` returns a `JobPhase` with `slug: 'phase-1-foundation'`, `filename: 'phase-1-foundation.md'`, a parsed `header.phaseNumber === 1`, and a non-empty `body`
- `getJobPhase('community-showcase', 'phase-99-bogus')` returns `undefined`
- All returned arrays are `Object.isFrozen === true`
- Calling `getAllJobs()` twice returns the same reference (cache hit)

**Mocked unit-test variant** also lives in `jobs.test.ts` (`describe('with empty currentwork', …)`):
- Mock the `node:fs` module via `vi.mock` to return an empty `readdir` result
- `getAllJobs()` returns `[]` (does NOT throw)
- Mock to throw `ENOENT` on `readdir` (currentwork dir absent)
- `getAllJobs()` returns `[]` (does NOT throw)

#### Design Decisions

- **Cache after parsing AND validating** — the cache holds the final Zod-validated, frozen array. Validation only happens once per build process.
- **Empty `currentwork/` returns `[]`, NOT throws** — explicitly contradicts the `community-showcase` 1.2 pattern and the `testimonials-results` 1.2 pattern. Justified in the README's Open Items: the absence of jobs IS information worth showing on the build log; throwing would block `npm run build` whenever the project was newly initialized or after a `git stash`.
- **Skip job dirs with no README** — the loader returns `null` and filters it out, rather than throwing. A directory with no README is in-progress state, not an error. Tests assert it's skipped silently.
- **Filesystem-discover phase files, don't trust the README's "Phase Documentation" links** — the README is human-edited and can lag the actual filesystem. The filesystem is authoritative. The Feature Overview table parsing IS sensitive to the README format because the table is the only place feature IDs are listed.
- **Sort phases by leading number** — `phase-1-foundation`, `phase-2-pages`, `phase-10-...` would otherwise sort lexicographically wrong. Numeric-prefix sort is correct.
- **Sort jobs alphabetically by slug** — stable, predictable, doesn't depend on filesystem order. The status board can re-sort by percent-complete if it wants (Phase 2.4 decides).
- **Pure functions in `parse-readme.ts` / `parse-phase.ts`** — the regexes don't touch the filesystem so they're trivially unit-testable against fixture strings. Keeps the filesystem logic in `jobs.ts` thin and the parser logic isolated.
- **Regex-based, not a markdown AST** — pulling in `unified` + `remark-parse` server-side just to extract a title and a table is overkill. The README format is stable enough across the existing 7 plans that regex extraction is reliable. If the README format diverges significantly, swap the parser implementation without changing its return shape.
- **`JobSchema.parse` (throwing) instead of `safeParse`** — a malformed Job at this stage IS a build break and should fail loudly with the Zod error. The README's tolerance is in the *individual field schemas* (allowing optional empties), not in skipping invalid records.
- **Module-scoped cache, not Next.js `cache()`** — module scope is the simplest correct approach for build-time data. Next.js's `cache()` wrapper is for the React Server Component request lifecycle, which doesn't matter for static-build content loaders.

#### Files (Part 2)

| Action | File                                                          |
|--------|---------------------------------------------------------------|
| NEW    | `src/lib/build-log/parse-readme.ts`                           |
| NEW    | `src/lib/build-log/parse-phase.ts`                            |
| NEW    | `src/lib/build-log/jobs.ts`                                   |
| NEW    | `src/lib/build-log/__tests__/parse-readme.test.ts`            |
| NEW    | `src/lib/build-log/__tests__/parse-phase.test.ts`             |
| NEW    | `src/lib/build-log/__tests__/jobs.test.ts`                    |

---

## Feature 1.2: Pipeline State Loader + Rollup

**Complexity: M** — YAML parsing of two small files + a join function that
joins the job index from 1.2 against `session.completedSections` to compute
percent-complete per job. The `yaml` package is installed in this feature.

### Problem

The status board (Phase 2.4) needs typed access to the live state of the TDD
pipeline:

1. **Current state** — what section is the pipeline working on right now,
   what agent, what stage, how many items in the context window
2. **Completed sections** — the historical list of finished `/refactor` cycles
3. **Knowledge file** — the cross-section knowledge store (project context,
   conventions, patterns, open questions) — surfaced for "what does the
   pipeline currently know" framing
4. **Jobs rollup** — for each job in the index, how many of its features have
   been completed, what's the percent-complete bar look like

The pipeline writes YAML, not JSON. We need a YAML parser. We picked `yaml`
(eemeli/yaml) over `js-yaml` for ESM friendliness and TS-native types.

### Implementation

Install the YAML package:

```bash
npm install yaml
```

**NEW** `src/lib/build-log/pipeline-state.ts`:

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type {
  SessionStatus,
  KnowledgeFile,
  JobRollupEntry,
  Job,
} from '@/content/schemas';
import {
  SessionStatusSchema,
  KnowledgeFileSchema,
} from '@/content/schemas/validators';
import { getAllJobs } from './jobs';

const PIPELINE_DIR = path.join(process.cwd(), 'pipeline', 'active');
const SESSION_PATH = path.join(PIPELINE_DIR, 'session.yaml');
const KNOWLEDGE_PATH = path.join(PIPELINE_DIR, 'knowledge.yaml');

let sessionCache: SessionStatus | null = null;
let knowledgeCache: KnowledgeFile | null = null;

/** Map snake_case YAML keys to camelCase TS field names for the session shape. */
function mapSession(raw: Record<string, unknown>): unknown {
  // session.yaml structure: top-level keys `session`, `context_window`,
  // `completed_sections`, `notes`. Flatten + camelCase.
  const session = (raw.session ?? {}) as Record<string, unknown>;
  const ctx = (raw.context_window ?? {}) as Record<string, unknown>;
  return {
    id: session.id,
    startedAt: session.started_at,
    currentPhase: session.current_phase,
    currentSection: session.current_section,
    currentAgent: session.current_agent,
    currentStage: session.current_stage,
    contextWindow: {
      iteration: ctx.iteration,
      totalItems: ctx.total_items,
      completedItems: ctx.completed_items,
    },
    completedSections: raw.completed_sections ?? [],
    notes: raw.notes,
  };
}

function mapKnowledge(raw: Record<string, unknown>): unknown {
  return {
    version: (raw.knowledge as Record<string, unknown> | undefined)?.version,
    project: (raw.knowledge as Record<string, unknown> | undefined)?.project,
    description: (raw.knowledge as Record<string, unknown> | undefined)?.description,
    projectContext: raw.project_context,
    conventions: raw.conventions,
    patterns: raw.patterns,
    openQuestions: raw.open_questions,
  };
}

export async function getSessionStatus(): Promise<SessionStatus> {
  if (sessionCache) return sessionCache;
  const text = await fs.readFile(SESSION_PATH, 'utf8');
  const parsed = parseYaml(text) as Record<string, unknown>;
  sessionCache = SessionStatusSchema.parse(mapSession(parsed));
  return sessionCache;
}

export async function getKnowledgeFile(): Promise<KnowledgeFile> {
  if (knowledgeCache) return knowledgeCache;
  const text = await fs.readFile(KNOWLEDGE_PATH, 'utf8');
  const parsed = parseYaml(text) as Record<string, unknown>;
  knowledgeCache = KnowledgeFileSchema.parse(mapKnowledge(parsed));
  return knowledgeCache;
}

function extractSectionId(
  entry: SessionStatus['completedSections'][number],
): string {
  return typeof entry === 'string' ? entry : entry.section;
}

function rollupForJob(
  job: Job,
  completedSectionIds: ReadonlySet<string>,
): JobRollupEntry {
  const total = job.features.length;
  const completed = job.features.filter((f) =>
    completedSectionIds.has(`${job.slug}-${f.id}`),
  ).length;

  let status: JobRollupEntry['status'];
  let percent: number | null;
  if (total === 0) {
    status = 'unknown';
    percent = null;
  } else if (completed === 0) {
    status = 'planned';
    percent = 0;
  } else if (completed === total) {
    status = 'complete';
    percent = 100;
  } else {
    status = 'in-progress';
    percent = Math.round((completed / total) * 100);
  }

  return {
    slug: job.slug,
    title: job.title,
    alias: job.alias,
    totalFeatures: total,
    completedFeatures: completed,
    percentComplete: percent,
    status,
  };
}

export async function getJobsRollup(): Promise<readonly JobRollupEntry[]> {
  const [jobs, session] = await Promise.all([getAllJobs(), getSessionStatus()]);
  const completedSet = new Set(
    session.completedSections.map(extractSectionId),
  );
  return Object.freeze(jobs.map((j) => rollupForJob(j, completedSet)));
}
```

### Tests (red phase of section `build-in-public-docs-1.2`)

`src/lib/build-log/__tests__/pipeline-state.test.ts`:

- **`getSessionStatus()` integration** — runs against the real `pipeline/active/session.yaml`. Returns an object with `id: '2026-04-11-001'`, `completedSections: []` (currently empty), `notes` containing the seed notes string. Schema parse succeeds.
- **`getKnowledgeFile()` integration** — runs against the real `pipeline/active/knowledge.yaml`. Returns an object with `projectContext.purpose` containing 'travisgautier' and `conventions.path_alias` set to `'@/ → src/'`. Schema parse succeeds.
- **`mapSession()` field mapping** — pure-function unit test. Given a raw object `{ session: { id: 'x', current_section: 'foo' }, context_window: { iteration: 3 }, completed_sections: ['x-1.1'] }`, returns `{ id: 'x', currentSection: 'foo', contextWindow: { iteration: 3 }, completedSections: ['x-1.1'], ... }` with snake-case → camelCase conversion correct.
- **`getJobsRollup()` against fixtures** — mock `getAllJobs` and `getSessionStatus` to return controlled fixture data:
  - Two jobs: `job-a` with 4 features and `job-b` with 2 features
  - `completedSections: ['job-a-1.1', 'job-a-1.2', 'job-b-2.1']`
  - Expect the rollup to contain `{ slug: 'job-a', totalFeatures: 4, completedFeatures: 2, percentComplete: 50, status: 'in-progress' }` and `{ slug: 'job-b', totalFeatures: 2, completedFeatures: 1, percentComplete: 50, status: 'in-progress' }`
- **`getJobsRollup()` empty session** — mock to return empty `completedSections`. Every rollup entry has `completedFeatures: 0`, `percentComplete: 0`, `status: 'planned'`.
- **`getJobsRollup()` zero-features job** — a job whose `features: []` (table couldn't be parsed). The rollup entry has `percentComplete: null`, `status: 'unknown'`. The page component renders this as a `—` instead of `0%`.
- **`getJobsRollup()` fully-complete job** — every feature ID present in `completedSections`. Returns `percentComplete: 100`, `status: 'complete'`.
- **Object-form completed entries** — `completedSections: [{ section: 'job-a-1.1', completedAt: '2026-04-12' }]`. The rollup logic correctly uses the `section` field via `extractSectionId`.
- **Cache hit** — calling `getSessionStatus()` twice returns the same reference and reads the file only once (assert via spy on `fs.readFile`).
- **Frozen result** — `getJobsRollup()` returns a frozen array.

### Design Decisions

- **Snake-case → camelCase mapping in the loader** — `session.yaml` uses snake_case (Python/Ruby idiom). The TS interfaces use camelCase (JS/TS idiom). The mapping happens in `pipeline-state.ts` so the rest of the codebase never sees snake_case. Schemas validate the camelCase shape.
- **`mapSession` and `mapKnowledge` are best-effort, not strict** — they read fields by key name and return undefined for missing ones. The Zod schema's optional fields then accept the result. Strict mapping would crash on partially-initialized state.
- **`yaml` package over `js-yaml`** — eemeli/yaml is the modern YAML 1.2 parser, ESM-friendly, with TypeScript types. js-yaml is fine but older. Either works. The `yaml` package is actively maintained and slightly smaller.
- **`getJobsRollup` joins inside the loader, not in the page component** — keeps the join logic testable in isolation, and the page consumes a flat typed list.
- **`Set` lookup for completed sections, not array `.includes()`** — O(1) per feature lookup vs O(N). Cheap, correct, future-proof for when `completedSections` grows long.
- **`percentComplete: null` for zero-features jobs** — distinguishes "no data" from "0% done". The UI renders `—` for null and a 0-bar for 0. Surfacing the difference matters; conflating them hides incomplete plans.
- **Status enum derives from counts, not stored separately** — there's no source of truth for "in-progress" outside the count comparison. Computing it in the rollup function keeps it consistent.
- **`Math.round` for percent display** — humans don't want `33.3333%` on a status board. `Math.round(2/4*100) === 50` exactly; `Math.round(1/3*100) === 33`. No floating-point UI confusion.
- **Caches are independent** — `sessionCache` and `knowledgeCache` are separate. Reading one doesn't read the other. The rollup composes them via `Promise.all`.
- **No try/catch around `fs.readFile`** — if `pipeline/active/session.yaml` is missing, the build SHOULD fail. The file is checked into the repo and the pipeline maintains it. A missing file is a real bug, not an in-progress state to tolerate.
- **No try/catch around `parseYaml`** — same reasoning. A YAML parse error is a real bug; the YAML files are agent-written and should always parse.
- **`zod`'s `.passthrough()` on `KnowledgeFile`** — the knowledge.yaml format is open-ended notes. New top-level keys appear over time as the pipeline evolves. Strict mode would block all of them. Passthrough keeps the schema honest about the parts the page renders while ignoring the rest.

### Files

| Action | File                                                          |
|--------|---------------------------------------------------------------|
| NEW    | `src/lib/build-log/pipeline-state.ts`                         |
| NEW    | `src/lib/build-log/__tests__/pipeline-state.test.ts`          |
| MODIFY | `package.json` + `package-lock.json` — add `yaml` dep         |

---

## Phase 1 Exit Criteria

- `npm run lint` clean, `npm test` green (new tests + all wf tests still pass), coverage still ≥ thresholds (70/80/80/80), `npm run build` clean
- `JobSchema.parse(validJobFixture())` succeeds and rejects every malformed fixture in the test suite
- `SessionStatusSchema.parse(<live session.yaml>)` succeeds; `KnowledgeFileSchema.parse(<live knowledge.yaml>)` succeeds
- `getAllJobs()` returns ≥ 1 entry from the real `currentwork/` tree (currently 7+)
- `getJobBySlug('community-showcase')` returns a typed Job with `alias: 'cs'`, parsed Context, ≥ 8 features, and 3 phase files
- `getJobPhase('community-showcase', 'phase-1-foundation')` returns a `JobPhase` with `header.phaseNumber === 1` and a non-empty body
- `getSessionStatus()` returns the parsed YAML; `getKnowledgeFile()` returns the parsed YAML
- `getJobsRollup()` returns one entry per job with correct `totalFeatures`, `completedFeatures`, `percentComplete`, `status`
- Empty-`currentwork` guard returns `[]` (does NOT throw); zero-features rollup returns `percentComplete: null`, `status: 'unknown'`
- All returned arrays from all loaders are `Object.isFrozen === true`
- `yaml` package is installed and committed; no other dependencies added in this phase
- Phase 2 can start: each route in Phase 2 has typed, validated data waiting for it via the loader API
