# Phase 3: Material Language

**Total Size: M + L + M**
**Prerequisites: Phase 1 (tokens) and Phase 2 (typography) complete**
**New Types: None**
**New Files: `src/components/brand/Marble.tsx`, `Parchment.tsx`, `Bone.tsx`, `Shadow.tsx`, `BrushstrokeSeam.tsx`, `src/__tests__/brand/forbidden-patterns.test.ts`**

Phase 3 builds the material-language layer between tokens and components.
Surface primitives keep every page in the brand's allowed material vocabulary,
the brushstroke-seam component delivers the brand's signature composition, and
a forbidden-pattern sentinel guards against drift toward the very aesthetic the
brand exists to refuse (gradients, UI shadows, pure primaries).

---

## Feature 3.1: Surface primitives

**Complexity: M** — Four named surface components (`<Marble>`, `<Parchment>`,
`<Bone>`, `<Shadow>`) that wrap children in a brand-correct background, the
right text-on-surface color, and a configurable 1px edge.

### Problem

Without semantic surface primitives, every component picks
`bg-(--color-marble)` or `bg-(--color-parchment)` directly, then ad-hoc-picks
the text color, then maybe-forgets the edge. Multiply that across 30+ pages
and the four surfaces drift apart. A primitive enforces the (surface → text
color → edge) triple as one decision.

### Implementation

**NEW** `src/components/brand/Marble.tsx`:

```tsx
import type { ComponentPropsWithoutRef, ElementType } from 'react';

type SurfaceProps<E extends ElementType> = {
  as?: E;
  edge?: 'none' | 'subtle' | 'strong';
  className?: string;
} & Omit<ComponentPropsWithoutRef<E>, 'className'>;

const edgeClass = {
  none: '',
  subtle: 'border border-(--edge-color-subtle)',
  strong: 'border border-(--edge-color)',
};

export function Marble<E extends ElementType = 'div'>({
  as,
  edge = 'none',
  className = '',
  ...rest
}: SurfaceProps<E>) {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag
      className={`bg-(--color-marble) text-(--pair-text-on-marble) ${edgeClass[edge]} ${className}`}
      {...rest}
    />
  );
}
```

`Parchment.tsx`, `Bone.tsx`, `Shadow.tsx` mirror the same shape with their
respective tokens:

- `Parchment` — `bg-(--color-parchment) text-(--pair-text-on-parchment)`
- `Bone` — `bg-(--color-bone) text-(--pair-text-on-bone)`
- `Shadow` — `bg-(--color-shadow) text-(--pair-text-on-shadow)`

### Design Decisions

- **`as` prop with polymorphic typing.** A surface might be a `<section>`,
  `<article>`, `<aside>`, or `<div>`. Forcing `<div>` would force consumers
  to wrap the primitive in their own semantic element. Polymorphism is one
  pattern across all four primitives.
- **Three edge variants, no shadow option.** The brand depth signal is a 1px
  Ink edge (`strong`), a softer 20%-Ink edge (`subtle`), or nothing. No
  drop-shadow option, ever. The forbidden-pattern sentinel (3.3) reinforces
  this — `shadow-md` / `shadow-lg` etc. fail the build.
- **No `padding` prop.** Padding is layout, not surface. Surface
  primitives only own background + text-color + edge. `<Section>` (Phase
  4.4) owns vertical rhythm; consumers compose `<Section><Bone>...</Bone></Section>`.
- **Class composition via template literals, not `clsx`.** No dependency,
  no precedence surprises. The few cases where order matters (Tailwind
  `class*` collisions) are vanishingly rare in this primitive set.
- **Tailwind 4 arbitrary-token syntax.** `bg-(--color-marble)` reads as
  "background = this token" — clear at the call site, and respects
  Tailwind 4's arbitrary-property feature without `[]` escaping.

### Files

| Action | File |
|--------|------|
| NEW    | `src/components/brand/Marble.tsx` |
| NEW    | `src/components/brand/Parchment.tsx` |
| NEW    | `src/components/brand/Bone.tsx` |
| NEW    | `src/components/brand/Shadow.tsx` |

---

## Feature 3.2: BrushstrokeSeam

**Complexity: L** — Reusable SVG mask + texture overlay component implementing
the brand's signature composition: a marble overlay painted across one edge of
a darker zone, with the seam feathered organically (not geometric). Used by
the homepage hero and a single section-divider variant.

### Problem

The brushstroke seam is the visual signature of the channel — the move that
distinguishes a Travis Gautier surface from any other AI-channel surface in 2026.
If it's implemented inline in the homepage hero, the same composition can't
be reused in og:images, thumb-preview, or section dividers. The composition
needs to be a primitive: one SVG mask, one set of props, one place to tune
the feather.

The brushstroke is *organic* — drawn by hand or simulated with SVG turbulence
filter — not a CSS `clip-path: polygon(...)` geometric seam. Geometry would
read as a slideshow with a sidebar; organic reads as one object.

### Implementation

**NEW** `src/components/brand/BrushstrokeSeam.tsx`:

```tsx
import type { ReactNode } from 'react';

interface BrushstrokeSeamProps {
  direction: 'left' | 'right' | 'top' | 'bottom';
  /** Width / height of the brushstroke feather zone, in CSS length. */
  feather?: string;
  /** Foreground surface color (the "marble overlay"). Defaults to Marble. */
  foreground?: string;
  /** Background visible through the brushstroke gaps. Defaults to Shadow. */
  background?: string;
  /** Optional texture / photo node that renders behind the brushstroke seam. */
  backgroundContent?: ReactNode;
  /** Content that renders ON the foreground (marble) side. */
  children?: ReactNode;
  className?: string;
}

const turbulenceSeed = 7;  // stable seed; brushstroke shouldn't shimmer on rerender

export function BrushstrokeSeam({
  direction,
  feather = '8rem',
  foreground = 'var(--color-marble)',
  background = 'var(--color-shadow)',
  backgroundContent,
  children,
  className = '',
}: BrushstrokeSeamProps) {
  const maskId = `brushstroke-mask-${direction}`;
  const filterId = `brushstroke-feather-${direction}`;
  // Mask gradient direction
  const maskGradient = direction === 'left'
    ? 'to right'
    : direction === 'right'
    ? 'to left'
    : direction === 'top'
    ? 'to bottom'
    : 'to top';

  return (
    <div
      className={`relative isolate ${className}`}
      style={{ background }}
    >
      {/* Background photo / texture layer */}
      {backgroundContent && (
        <div className="absolute inset-0 motion-safe:opacity-100 motion-reduce:opacity-80">
          {backgroundContent}
        </div>
      )}

      {/* Brushstroke-masked foreground */}
      <div
        className="relative z-10"
        style={{
          background: foreground,
          maskImage: `url('#${maskId}'), linear-gradient(${maskGradient}, black ${feather}, transparent)`,
          WebkitMaskImage: `url('#${maskId}'), linear-gradient(${maskGradient}, black ${feather}, transparent)`,
          maskComposite: 'source-over',
        }}
      >
        {/* Inline SVG turbulence filter for the organic edge */}
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <defs>
            <filter id={filterId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015 0.04"
                numOctaves="2"
                seed={turbulenceSeed}
              />
              <feDisplacementMap in="SourceGraphic" scale="20" />
            </filter>
            <mask id={maskId}>
              <rect
                x="0" y="0" width="100%" height="100%"
                fill="white"
                style={{ filter: `url(#${filterId})` }}
              />
            </mask>
          </defs>
        </svg>

        {/* Real content on the marble side */}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
```

The component pairs a CSS linear-gradient mask (the structural seam direction)
with an SVG turbulence-displaced rectangle mask (the organic feather). The
result is a brushstroke edge that varies per direction without per-direction
authoring.

### Design Decisions

- **SVG turbulence + linear gradient combined.** A pure linear gradient
  reads as a soft fade — too smooth, too "tech." Pure SVG turbulence reads
  as noise — too rough, no direction. Composed via `mask-composite` you
  get the brushstroke's directional intent with organic feathering.
- **`turbulenceSeed` constant, not random.** Per the AGENTS rule + plan-mode
  constraint (no `Math.random` / `Date.now`), and because a stable seed
  means the brushstroke renders identically on SSR and client — no
  hydration mismatch. The seed value is aesthetic; pick the number that
  produces the best feather for the homepage hero.
- **`backgroundContent` prop.** The homepage hero needs a photo/texture
  behind the brushstroke; a section divider doesn't. One prop covers both.
- **`motion-reduce:opacity-80` on the background.** Per Phase 9.3, under
  `prefers-reduced-motion` the brushstroke effect is dampened (background
  fades back). Inline because the brushstroke composition is the one
  place this rule applies — keeping it co-located is clearer than
  reaching into a global stylesheet.
- **`isolate`.** Creates a new stacking context so brushstroke z-index
  doesn't leak into the parent — important when the seam is used inside
  a header / navigated section.
- **No animation API.** A future feature might want a scroll-driven seam
  reveal; that's a per-page concern (and probably a bad brand choice).
  The primitive is static.
- **Used by**: `src/app/page.tsx` (homepage hero), `src/components/brand/SectionDivider.tsx`
  (Phase 4.4), `src/app/opengraph-image.tsx` family (Phase 8.2),
  `src/app/(internal)/thumb-preview/page.tsx` (Phase 8.3). No other
  consumers; the seam is the brand's signature, not its texture.

### Files

| Action | File |
|--------|------|
| NEW    | `src/components/brand/BrushstrokeSeam.tsx` |

---

## Feature 3.3: Forbidden-pattern sentinel

**Complexity: M** — Vitest test that greps the source tree for patterns the
brand spec forbids: gradients (`linear-gradient`, `radial-gradient`, `bg-gradient-*`),
UI drop shadows (`shadow-md|lg|xl|2xl|inner`), pure black / white / red / blue
hex literals, and rounded corners larger than the brand allows. Fails the build
on hit. The sentinel is the regression guard that lets every downstream phase
move fast without re-litigating the brand discipline.

### Problem

The brand exists *because* of what it refuses (gradients, neon, UI shadows,
saturated primaries, blue). Without a sentinel, downstream contributors
(human or agent) will reach for a `bg-gradient-to-br from-purple-500
to-cyan-400` hero, a `shadow-xl` card lift, a `text-red-600` error, a
`bg-blue-500` link — and the brand silently erodes. The sentinel catches
those edits at test time so the build fails before they merge.

### Implementation

**NEW** `src/__tests__/brand/forbidden-patterns.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { glob } from 'node:fs/promises';

const ROOT = join(__dirname, '..', '..', '..');
const SCAN_GLOBS = [
  'src/**/*.{ts,tsx,css}',
];
const SKIP_PATHS = [
  'src/__tests__/brand/forbidden-patterns.test.ts',  // self-exclude (test contains the patterns)
];

interface ForbiddenPattern {
  name: string;
  regex: RegExp;
  reason: string;
}

const FORBIDDEN: ForbiddenPattern[] = [
  {
    name: 'CSS linear-gradient',
    regex: /\blinear-gradient\s*\(/i,
    reason: 'Brand spec forbids gradients. Use solid colors or material textures.',
  },
  {
    name: 'CSS radial-gradient',
    regex: /\bradial-gradient\s*\(/i,
    reason: 'Brand spec forbids gradients.',
  },
  {
    name: 'Tailwind bg-gradient-*',
    regex: /\bbg-gradient-(to-[a-z]+|conic|radial)\b/,
    reason: 'Brand spec forbids gradients.',
  },
  {
    name: 'Tailwind UI shadow utilities',
    regex: /\bshadow-(md|lg|xl|2xl|inner)\b/,
    reason: 'Brand uses 1px Ink edges, not UI drop shadows. Use border-(--edge-color).',
  },
  {
    name: 'Pure black hex',
    regex: /#0{3,6}\b/,
    reason: 'Brand uses Ink (#1C1814), never pure black.',
  },
  {
    name: 'Pure white hex',
    regex: /#f{3,6}\b/i,
    reason: 'Brand uses Marble (#F7F4EC), never pure white.',
  },
  {
    name: 'Pure red hex',
    regex: /#f{2}0{2}0{2}\b/i,
    reason: 'Brand uses Oxblood (#6B2020) for accent; pure red is hype.',
  },
  {
    name: 'Tailwind red/orange/yellow/blue/indigo/purple/pink palette',
    regex: /\b(?:bg|text|border|ring|from|to|via)-(red|orange|yellow|blue|indigo|purple|pink|fuchsia|rose|sky|cyan|teal|green|emerald|lime)-\d{2,3}\b/,
    reason: 'Brand uses only Marble/Parchment/Ink/Oxblood/Verdigris/Bone/Shadow via tokens.',
  },
];

async function findFiles(pattern: string): Promise<string[]> {
  const matches: string[] = [];
  for await (const file of glob(pattern, { cwd: ROOT })) {
    matches.push(file);
  }
  return matches.filter(f => !SKIP_PATHS.some(skip => f.endsWith(skip)));
}

describe('brand forbidden-pattern sentinel', () => {
  it('source tree contains no forbidden visual patterns', async () => {
    const files = (await Promise.all(SCAN_GLOBS.map(findFiles))).flat();
    const hits: { file: string; pattern: string; reason: string; snippet: string }[] = [];

    for (const file of files) {
      const abs = join(ROOT, file);
      if (statSync(abs).isDirectory()) continue;
      const content = readFileSync(abs, 'utf8');
      for (const { name, regex, reason } of FORBIDDEN) {
        const match = content.match(regex);
        if (match) {
          const idx = content.indexOf(match[0]);
          const lineStart = content.lastIndexOf('\n', idx) + 1;
          const lineEnd = content.indexOf('\n', idx);
          hits.push({
            file: relative(ROOT, abs),
            pattern: name,
            reason,
            snippet: content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim(),
          });
        }
      }
    }

    if (hits.length > 0) {
      const report = hits
        .map(h => `  ${h.file}\n    pattern: ${h.pattern}\n    reason: ${h.reason}\n    line: ${h.snippet}`)
        .join('\n\n');
      throw new Error(`Found ${hits.length} forbidden brand pattern(s):\n\n${report}`);
    }

    expect(hits).toHaveLength(0);
  });
});
```

### Design Decisions

- **Vitest test, not ESLint plugin.** Tests run on every CI / pre-commit
  cycle the project already has. ESLint can detect some of these (custom
  rule with `no-restricted-syntax`) but CSS gradients in `globals.css`
  are out of scope for ESLint. One sentinel covers `.ts`, `.tsx`, and
  `.css` uniformly.
- **Self-exclude.** The test file itself contains every forbidden pattern
  as regex literals. Without `SKIP_PATHS`, the test fails on itself.
- **Tailwind color-palette ban as one rule.** Catching `bg-red-500`,
  `text-blue-600`, etc. with a single regex covers the long tail. The
  brand uses only the seven named tokens; anything else is drift. If a
  future surface genuinely needs (e.g.) a Verdigris-and-Bone gradient
  for one specific moment, that's a brand-spec amendment, not an
  exemption in this test.
- **Hex literal rules are loose by design.** `#000` and `#000000` both
  match `#0{3,6}\b`. Same for white and red. False positives (a
  `#000` in a comment as part of a discussion) are rare and the test
  failure message points at the line so they're trivially fixed.
- **`reason` field per pattern.** When the test fails, the contributor
  should see *why*, not just *what*. The pattern name + reason +
  source snippet + file path are enough to triage without searching docs.
- **Glob via `node:fs/promises`.** Node 22+ ships the async glob in
  stable; no external dependency. travisgautier is on Node 22 per the project
  baseline.

### Files

| Action | File |
|--------|------|
| NEW    | `src/__tests__/brand/forbidden-patterns.test.ts` |

---

## Phase 3 Exit Criteria

- `<Marble>` / `<Parchment>` / `<Bone>` / `<Shadow>` exist and render with the
  correct background + text-on-surface color + configurable edge.
- `<BrushstrokeSeam>` renders a feathered organic edge in any of the four
  directions with the correct foreground / background / texture layering.
- `npm test` — forbidden-pattern sentinel green. The placeholder palette /
  gradient classes that existed before Phases 1–2 must already be gone by
  the time Phase 3 lands; if they're not, fix them before this phase
  finishes (this is the phase that proves Phases 1–2 actually cleared
  the deck).
- `npm run lint` clean. `npm run build` clean.
- A sandbox route (or Vitest visual snapshot) confirms `<BrushstrokeSeam>`
  feathers correctly in all four directions.
