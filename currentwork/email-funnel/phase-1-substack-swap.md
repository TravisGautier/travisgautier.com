# Phase 1: Substack swap

**Total Size: M**
**Prerequisites: `website-foundation` Phase 4.1 shipped (live Resend-backed capture in `src/components/capture/`)**
**New env vars: `NEXT_PUBLIC_SUBSTACK_EMBED_URL`**
**New files: `src/components/capture/sourceToPillar.ts`, `src/components/capture/__tests__/sourceToPillar.test.ts`**

Phase 1 supersedes the live Resend capture with a Substack embed iframe. Six small features, all in `src/components/capture/` plus `.env.example` and `docs/future-jobs.md`. No DB, no orchestrator, no cron, no webhooks.

---

## Feature 1.1: Delete server-action capture path

**Complexity: S** — Remove `actions.ts` and its tests. Pure deletion.

### Problem
`src/components/capture/actions.ts` posts to Resend on submit. With Substack as the funnel, the action is dead code; its tests pin behavior that no longer exists.

### Files

| Action | File |
|---|---|
| DELETE | `src/components/capture/actions.ts` |
| DELETE | `src/components/capture/__tests__/actions.test.ts` |

### Tests (red phase of section `email-funnel-1.1`)
- Section ships purely as deletion. Verified by absence: `git status` shows both files removed; `rg "captureEmail" src/` returns zero matches.

### Phase 1.1 done when
- Files removed
- `rg "from ['\"]\\./actions['\"]" src/components/capture/` returns nothing
- `npm test` does not error on a missing module from `EmailCapture.tsx`

---

## Feature 1.2: Replace `EmailCapture.tsx` body with Substack iframe

**Complexity: M** — Keep export name + module path so all three callers compile unchanged. Drop `buttonLabel` and `placeholder` props (no caller passes them).

### Problem
The current component renders a native form bound to a server action. New behavior: brand-wrapped Substack iframe with UTM params encoding the pillar; gracefully degrades to a profile link when the embed URL env var is unset.

### Implementation

`EmailCapture.tsx` shape:
- No `'use client'` directive (no client state)
- Imports `Bone` from `@/components/brand/Bone`, `sourceToPillar` from `./sourceToPillar`
- `EmailCaptureProps = { source: string }` only
- Reads `process.env.NEXT_PUBLIC_SUBSTACK_EMBED_URL`
- Fallback (env unset): Bone-wrapped `<a>` to `https://substack.com/@travisgautier` with `target="_blank"`, `rel="noopener noreferrer"`, `data-source`, `data-pillar`
- Happy path: Bone-wrapped iframe; `src` constructed from `new URL(baseUrl)` with `utm_source=travisgautier.com`, `utm_medium=embed`, `utm_campaign=pillar:{pillar}`, `utm_content={source}`; `title="Subscribe to travisgautier on Substack"`; `loading="lazy"`; `className="block w-full min-h-[150px] bg-(--color-bone) border-0"`; `data-source`, `data-pillar`

### Files

| Action | File |
|---|---|
| REPLACE | `src/components/capture/EmailCapture.tsx` |

### Design decisions
- **Keep `EmailCapture` export name + module path** — three call sites compile unchanged
- **Drop `buttonLabel`/`placeholder` props** — no caller passes them today; back-compat shims would be dead weight
- **Single env var, public-prefixed** — inlines at build time, no server reach-around needed
- **`min-h` not fixed `height`** — Substack changes embed internals over time; absorb layout shift without breaking when they restyle
- **`Bone edge="subtle"` wrapper** — preserves the styling-overhaul brand-surface tests' invariants (`bg-(--color-bone)`, `border-(--edge-color-subtle)`)
- **iframe `title` attribute** — accessible name, satisfies WCAG 4.1.2
- **No analytics ping on mount** — Plausible/GA is not wired in the repo today; defer to a future analytics job

### Tests (red phase of section `email-funnel-1.2`)
Covered by 1.4 (the test-file rewrite). 1.2 is the component-only change.

### Phase 1.2 done when
- `npm test src/components/capture/__tests__/EmailCapture.test.tsx` green (after 1.4 lands)
- `npm run build` clean
- Manual: load `/` with `NEXT_PUBLIC_SUBSTACK_EMBED_URL` set; iframe renders
- Manual: unset env, reload; fallback link renders

---

## Feature 1.3: `sourceToPillar` helper + tests

**Complexity: S** — Pure function mapping the `source` prop shape to a `ContentPillar`.

### Implementation

v1 mapping (synchronous, source-shape-driven; no frontmatter lookup):
- `episode-*` → `'delivery'`
- `case-*` → `'business'`
- `'homepage-hero'` → `'delivery'`
- default → `'delivery'`

A richer version would read each episode's/case's frontmatter `pillar`. Defer; safe default is the broadest pillar.

### Files

| Action | File |
|---|---|
| NEW | `src/components/capture/sourceToPillar.ts` |
| NEW | `src/components/capture/__tests__/sourceToPillar.test.ts` |

### Tests (red phase of section `email-funnel-1.3`)
- `episode-*` returns `'delivery'` (multiple samples + bare prefix)
- `case-*` returns `'business'` (multiple samples + bare prefix)
- `'homepage-hero'` returns `'delivery'`
- Unknown sources (`'about-cta'`, `''`, `'tool-z'`, `'random'`) return `'delivery'`
- Output is always a member of `CONTENT_PILLARS`

### Phase 1.3 done when
- `npm test src/components/capture/__tests__/sourceToPillar.test.ts` green
- `import type { ContentPillar }` from `@/content/schemas/content-pillar` — no inline redefinition

---

## Feature 1.4: Rewrite `EmailCapture.test.tsx`

**Complexity: M** — Delete ~80% of the existing file (form/action/state assertions). Keep brand-surface infra guards. Add iframe tests.

### Tests to keep
- `infra_no_placeholder_palette_names`
- `infra_no_rounded_class`
- `infra_no_box_shadow`
- `infra_no_gradient`
- `infra_forbidden_pattern_sentinel_clean`
- `infra_tokens_resolve_in_globals_css` (slim down token list to those still referenced: `--color-bone`, `--edge-color-subtle`, `--space-5`, `--pair-text-on-bone`)

### Tests to delete
- All `useActionState` / form-submit / mockAction integration tests
- All `Button` import / palette tests tied to the deleted submit button
- `data_button_label_default_constants_match_planning_doc` (strings gone)
- `infra_use_client_directive_present` (component is no longer client-only)
- `infra_brand_primitives_imported_from_brand_barrel` Button half — keep Bone half, drop Button

### New tests
- `unit_renders_iframe_with_substack_origin`
- `unit_iframe_has_accessible_title`
- `unit_iframe_loading_lazy`
- `unit_iframe_source_dataset_propagated` (data-source + data-pillar on iframe)
- `unit_utm_campaign_pillar_delivery_for_episode_source`
- `unit_utm_campaign_pillar_business_for_case_source`
- `unit_utm_campaign_pillar_delivery_for_homepage_hero`
- `unit_iframe_wrapped_in_bone_surface`
- `unit_fallback_link_when_env_unset`
- `unit_fallback_wrapped_in_bone_surface`
- `edge_long_source_string_propagated_to_utm_content`
- `edge_unknown_source_defaults_to_delivery_pillar`
- `infra_no_resend_import`
- `infra_no_server_action_imports`

### Files

| Action | File |
|---|---|
| REWRITE | `src/components/capture/__tests__/EmailCapture.test.tsx` |

### Phase 1.4 done when
- `npm test src/components/capture/__tests__/EmailCapture.test.tsx` green
- All new tests above present
- No surviving references to `mockAction`, `useActionState`, `Button`, `'use client'`

---

## Feature 1.5: Add `NEXT_PUBLIC_SUBSTACK_EMBED_URL` to `.env.example`

**Complexity: S** — One line + section header comment.

### Implementation

Append after the existing cohort-enrollment block:

```
# Substack embed (email-funnel — supersedes self-hosted Resend funnel)
NEXT_PUBLIC_SUBSTACK_EMBED_URL=https://travisgautier.substack.com/embed
```

Do NOT remove `RESEND_API_KEY`, `AUTH_RESEND_FROM`, or any cohort vars — they back `sa` and `cohort-enrollment`.

### Files

| Action | File |
|---|---|
| MODIFY | `.env.example` |

### Phase 1.5 done when
- `.env.example` contains `NEXT_PUBLIC_SUBSTACK_EMBED_URL=...`
- All other env vars preserved

---

## Feature 1.6: Rewrite `docs/future-jobs.md` §4

**Complexity: S** — Replace the §4 prose; update the sizing table.

### Implementation

- §4 heading stays `## 4. \`email-funnel\` — ...`; subtitle updated to "Substack embed swap"
- Body shrinks from ~47 lines to ~25
- Sizing table line 39: `M/L` → `S`, "after #3" → "any time after `wf`"
- Aliases note: add `ef` to the row

### Files

| Action | File |
|---|---|
| MODIFY | `docs/future-jobs.md` |

### Phase 1.6 done when
- §4 section reflects Substack-embed scope
- Sizing table updated
- `rg "self-hosted.*Resend.*funnel" docs/future-jobs.md` returns nothing for §4

---

## Phase 1 Exit Criteria

- `npm test` — full suite green
- `npm run lint` — clean
- `npm run build` — clean (no orphan `./actions` import in `EmailCapture.tsx`)
- Manual e2e: iframe renders on homepage / episode / case detail with correct UTM params
- Manual fallback: env unset → link renders
- `currentwork/email-funnel/` contains only `README.md` + `phase-1-substack-swap.md`
- `docs/future-jobs.md` §4 reflects new scope
- Commit message notes that operators should remove `RESEND_AUDIENCE_ID` from `.env.local` and migrate the existing Resend audience to Substack (CSV export → Substack import)
