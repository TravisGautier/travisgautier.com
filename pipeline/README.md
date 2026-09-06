# travisgautier — Current Work

Master status document for all active and completed sections in the travisgautier brand/marketing site build.

## Active Jobs

See `currentwork/` for feature-area plans and `pipeline/active/` for live TDD state.

## Completed Milestones

_None yet — project just initialized._

## Structure

- `currentwork/{feature-area}/` — Implementation plans (README.md + phase-N-*.md per area)
- `pipeline/active/session.yaml` — Current session state and completed sections log
- `pipeline/active/knowledge.yaml` — Cross-section knowledge store
- `pipeline/active/{section-id}/` — Live TDD pipeline state per section

## Workflow Commands

1. `/jobbuild {feature description}` — Produce a new implementation plan in `currentwork/{slug}/`
2. `/cwtable` — Render status of all jobs
3. `/pipeline {phase} {section}` — Orchestrate the full TDD pipeline for a section
4. `/discovery {section}` — Generate YAML contract files
5. `/red {section}` — Write failing tests
6. `/green {section}` — Implement to pass
7. `/refactor {section}` — Quality pass
8. `/finish {section}` — Cleanup + docs + git
