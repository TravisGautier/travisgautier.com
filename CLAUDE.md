@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code when working with the travisgautier.com codebase.

## Project Overview

travisgautier.com is the brand and marketing site for the Travis Gautier YouTube channel and social media presence (formerly published as Fabled10X; that name is retired — never reintroduce it). It's a Next.js 16 App Router site that backs the channel with episode pages, project case studies, free interactive tools, and a storefront. Built and maintained by AI agents.

Its secondary job is to promote **The Large Language Library** (LLL) — a sister project at `largelanguagelibrary.ai` (separate repo, separate GitHub org). LLL is the public, AI-optimized knowledge base; travisgautier.com is the channel brand. The two are linked, but not the same project. See `docs/large-language-library-implementation-plan.md` for the LLL spec.

Primary outputs:
- **YouTube channel** — flagship series, playbooks, shorts, livestreams
- **Brand site** — episode index, case studies, free tools, storefront
- **LLL promotion** — every episode and case study can link out to related LLL entries

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server

# Production
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint

# Testing (Vitest)
npm test                 # Run Vitest once
npm run test:watch       # Vitest watch mode
npm run test:ui          # Vitest UI
npm run test:coverage    # Generate coverage report
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js 16 App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # React components (Tailwind 4)
├── content/
│   └── schemas/            # Typed content model
│       ├── content-tier.ts
│       ├── content-pillar.ts
│       ├── episode.ts
│       ├── source-material.ts
│       └── index.ts        # Barrel export
├── lib/                    # Utilities
├── styles/                 # Global styles
└── __tests__/
    ├── setup.ts            # Vitest setup
    └── mocks/              # Test mocks / MSW handlers
```

### Content Model

The domain is defined in `src/content/schemas/index.ts`. Skills read this file the way partymasters reads `prisma/schema.prisma`.

- **ContentTier** — `flagship | playbook | shorts | livestream | community`
- **ContentPillar** — `delivery | workflow | business | future` (the four questions)
- **Episode** — a video (series, act, episode number, tier, pillar, source materials, `lllEntryUrls` for outbound LLL crosslinks)
- **SourceMaterial** — artifact referenced in videos (markdown, email, transcript, etc.) — rendered as episode show notes

The structured AI knowledge-base schema (`KnowledgeEntry` etc.) lives in the LLL project, not here. Episodes and case studies can link out to LLL entries by URL via `Episode.lllEntryUrls`.

### Path Alias

`@/` maps to `src/` — e.g., `import { Episode } from '@/content/schemas'`.

## Workflow Skills

All skills were ported from the partymasters project (see `pipeline/TECH-DECISIONS.md`). Primary slash commands:

### Planning
- `/jobbuild <feature>` — Transform a feature request into `currentwork/{slug}/` plan tree
- `/cwtable` — Status table of all jobs under `currentwork/`
- `/docs` — Update progress tracking docs

### TDD Pipeline
- `/pipeline <phase> <section>` — Orchestrate the full TDD pipeline (preflight → discovery → red → green → refactor → finish → postflight)
- `/discovery <section>` — Produce YAML contracts (discovery, dependencies, interfaces, patterns, test-cases)
- `/red <section>` — Write comprehensive failing tests across all 10 categories
- `/green <section>` — Implement to pass
- `/refactor <section>` — Quality pass while keeping tests green
- `/finish <section>` — Cleanup + docs + commit

### Maintenance
- `/git [commit|push|status]` — Clean atomic commits with security checks
- `/lint` — ESLint health report + auto-fix
- `/poweron` — Start dev services
- `/audit` — Validate completed sections
- `/cleanup` — Remove dead code from `pipeline/active/`
- `/full-refactor` — Cross-section refactoring
- `/testhealth` — Test suite diagnosis
- `/typesafety` — Fix TS errors systematically
- `/deploy` — Deploy pipeline (stages are dormant until target is chosen)

### State Directories
- `currentwork/` — Feature-area implementation plans (one dir per job, README.md + phase-N-*.md)
- `pipeline/active/session.yaml` — Session state + completed sections log
- `pipeline/active/knowledge.yaml` — Cross-section knowledge store
- `pipeline/active/{section-id}/` — Live TDD pipeline YAMLs per section

### Job Slug Aliases

Some jobs have short aliases the user can invoke instead of the full slug. When a pipeline/discovery/red/etc. command is called with an alias, resolve it to the canonical directory before reading `currentwork/{slug}/`. Section IDs in YAML + commits use the canonical slug, not the alias.

| Alias | Canonical slug       | Plan directory                |
|-------|----------------------|-------------------------------|
| `wf`  | `website-foundation` | `currentwork/website-foundation/` |

Future jobs (not yet started) and their planned aliases are tracked in `docs/future-jobs.md`.

## Testing Conventions

- Test files: `src/**/__tests__/**/*.test.{ts,tsx}`
- Test runner: Vitest (jsdom environment)
- Setup file: `src/__tests__/setup.ts` (loads `@testing-library/jest-dom/vitest`)
- Mocks: `src/__tests__/mocks/` (MSW handlers live here when needed)
- Coverage thresholds: 70% branches, 80% functions/lines/statements
- Test categories used by the pipeline: unit, integration, e2e, edge_case, security, performance, accessibility, visual, smoke, error

## Code Style

**Minimal comments** — only add comments when logic is non-obvious. Optimize comments for AI context (terse, keyword-rich). Let code be self-documenting through clear naming.

**Git commits** — Commit after every feature implementation. Keep messages concise (1-2 lines). No footer, no co-author section.

**Persistence** — content is static (typed MDX under `src/content/`); the storefront, auth sessions and cohort enrollment use Postgres via Drizzle (`src/db/`, migrations in `src/db/migrations/`). Schema changes go through `npm run db:generate` + a migration, never ad-hoc SQL.

**Brand strings** — never hardcode the site name, domain, or handles; import `site` from `src/lib/site.ts`. `src/__tests__/brand/legacy-brand.test.ts` fails on any reintroduction of the retired name, and `secrets-sentinel.test.ts` fails on credential-shaped strings anywhere in docs or source.
