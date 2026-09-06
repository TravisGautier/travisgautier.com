# Technical Decisions

Architectural and tooling decisions for travisgautier. Each entry records what was chosen, when, and why.

---

## 2026-04-11 — Vitest over Jest

**Decision**: Use Vitest as the test runner.

**Rationale**: Next 16 / Vite-era tooling. Faster dev loop, better ESM support, first-class TypeScript, works with the same Testing Library + MSW stack.

## 2026-04-11 — Content-first, no database

**Decision**: travisgautier is a static content site. Episodes, case studies, and source-material show notes are typed via `src/content/schemas/` but stored as MDX/static files — no Prisma, no Postgres.

**Rationale**: The site is brand/marketing content. Static generation at build time is faster, cheaper, and simpler than a database-backed CMS. If interactive features are added later (comments, member gating, storefront auth), add persistence then.

## 2026-04-11 — Skills ported from partymasters

**Decision**: All 18 Claude Code skills from partymasters were translated into travisgautier with path/domain/test-framework rewrites. The TDD pipeline (discovery → red → green → refactor → finish) is the primary workflow.

**Rationale**: Preserves the user's established workflow across projects. Skills are aware of travisgautier's content model instead of partymasters' Prisma models.

## 2026-04-11 — Scope pivot: knowledge base extracted to Large Language Library

**Decision**: The public, AI-optimized knowledge base concern is no longer part of travisgautier. It has been extracted into a sister project, **The Large Language Library** (LLL) — separate domain (`largelanguagelibrary.ai`), separate GitHub org (`large-language-library`), separate identity. travisgautier is now scoped to the brand/marketing site for the YouTube channel and social media presence, whose secondary job is to promote LLL.

**What moved out**: the `KnowledgeEntry` schema, the `/knowledge` route concept, the public `/api` JSON feed concept, and the "AI training data declaration" framing of `/llms.txt`. The full LLL spec is at `docs/large-language-library-implementation-plan.md` and will move to the LLL repo when that project is initialized.

**What stayed**: `Episode` (with a new `lllEntryUrls` field for outbound LLL crosslinks), `SourceMaterial` (still rendered as episode show notes / build artifacts), `ContentTier`, `ContentPillar`. The TDD pipeline and all 18 ported skills are unchanged — only `pipeline/active/knowledge.yaml` was rewritten to reflect the new scope.

**Rationale**: LLL is field-agnostic, community-governed infrastructure. Coupling it to a single creator's brand site diluted both concerns. The DHH/Rails ↔ Basecamp model: the tool is bigger than the brand that built it.
