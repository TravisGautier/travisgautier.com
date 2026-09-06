# Phase 4: Logo + Site Chrome

**Total Size: M + M + S + M**
**Prerequisites: Phase 1 (tokens), Phase 2 (typography), Phase 3 (surface primitives) complete**
**New Types: None**
**New Files: `src/components/brand/Logo.tsx`, `Section.tsx`, `SectionDivider.tsx`**

Phase 4 establishes the persistent site frame: the logo lockup that carries
the {10x} curly-brace mark, the restyled Header and Footer that anchor every
page, and the Section / SectionDivider primitives that enforce the editorial
vertical rhythm across page surfaces in Phase 7.

---

## Feature 4.1: Logo lockup + SVG

**Complexity: M** — `<Logo size>` component renders the brand wordmark:
Cinzel Black "FABLED" + curly-brace-wrapped `{10x}` in JetBrains Mono. The
curly braces are the dual-meaning code-literacy signal that distinguishes the
brand from any other channel teaching software. Ships a `public/logo.svg`
copy for use in `og:image` rendering and external embeds.

### Problem

There is no logo today — the current site uses literal text in the Header
component. A typed-set logo lockup that uses the brand fonts is one canonical
artifact; ad-hoc typography across Header / Footer / og:images would drift.
The `{10x}` curly-brace mark is the brand's hidden code-literacy signal
(decorative to a non-developer, meaningful to a developer audience) — getting
that one detail right matters.

### Implementation

**NEW** `src/components/brand/Logo.tsx`:

```tsx
import type { CSSProperties } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Render in monochrome (used when the surface forces a single color, e.g. og:image). */
  mono?: boolean;
  className?: string;
}

const sizeScale: Record<NonNullable<LogoProps['size']>, { wordmark: string; mark: string; gap: string }> = {
  sm: { wordmark: '1rem',      mark: '0.875rem', gap: '0.25rem' },
  md: { wordmark: '1.5rem',    mark: '1.25rem',  gap: '0.375rem' },
  lg: { wordmark: '2.5rem',    mark: '2rem',     gap: '0.5rem' },
};

export function Logo({ size = 'md', mono = false, className = '' }: LogoProps) {
  const s = sizeScale[size];
  const wordmarkColor = mono ? 'currentColor' : 'var(--color-ink)';
  const markColor = mono ? 'currentColor' : 'var(--color-oxblood)';

  const wordmarkStyle: CSSProperties = {
    fontFamily: 'var(--font-display), serif',
    fontWeight: 900,
    fontSize: s.wordmark,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: wordmarkColor,
    lineHeight: 1,
  };

  const markStyle: CSSProperties = {
    fontFamily: 'var(--font-mono), ui-monospace, monospace',
    fontWeight: 500,
    fontSize: s.mark,
    color: markColor,
    lineHeight: 1,
  };

  return (
    <span
      className={`inline-flex items-baseline ${className}`}
      style={{ gap: s.gap }}
      aria-label="Travis Gautier"
    >
      <span style={wordmarkStyle} aria-hidden="true">FABLED</span>
      <span style={markStyle} aria-hidden="true">{'{10x}'}</span>
    </span>
  );
}
```

**NEW** `public/logo.svg` — static SVG version for og:image and external embed:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 80" width="480" height="80">
  <text x="0" y="64" font-family="Cinzel, serif" font-weight="900" font-size="64" letter-spacing="3.84" fill="#1C1814">FABLED</text>
  <text x="320" y="64" font-family="JetBrains Mono, monospace" font-weight="500" font-size="52" fill="#6B2020">{10x}</text>
</svg>
```

The SVG is fallback for surfaces where Cinzel / JetBrains aren't available
(e.g. inline in a third-party newsletter). For og:image rendering, Phase 8.2
re-renders the lockup via `ImageResponse` using the local font files in
`public/fonts/` — the SVG isn't the og asset.

### Design Decisions

- **Type-set, not custom-illustrated.** A hand-illustrated wordmark is
  beautiful but binds the brand to one designer's interpretation. Type-set
  with Cinzel + JetBrains is reproducible across every surface (web, print,
  og:image, thumb-preview) using the same fonts the body of the site uses.
  If the user later commissions a custom mark, swap inside this primitive
  — the consumer API doesn't change.
- **Curly braces in JetBrains Mono.** The dual-meaning signal: developers
  see `{10x}` and read it as code (object literal, JSX expression, JS
  template literal). Non-developers see it as decorative brackets. JetBrains
  Mono is the canonical code font this brand teaches with, so it's the
  right mono for the braces.
- **0.06em letter-spacing on the wordmark.** Cinzel inscriptional letters
  read best slightly tracked. Default tracking looks cramped; double the
  brand's display tracking (`0.04em`) is too loose for the logo. 0.06em
  is the visual midpoint.
- **`mono` prop for monochrome surfaces.** Some surfaces force a single
  color (a dark-section logo lock-up, or a single-color og:image
  composition). One prop covers it; without it, every consumer would
  swap in a re-styled version.
- **`aria-label` on the wrapper, `aria-hidden` on parts.** Screen readers
  announce "Travis Gautier" once, not "FABLED open brace 10x close brace."
- **Three sizes only.** `sm` for Footer, `md` for Header (default), `lg`
  for the homepage hero. If a fourth size shows up in implementation,
  question whether the surface really needs a fourth.

### Files

| Action | File |
|--------|------|
| NEW    | `src/components/brand/Logo.tsx` |
| NEW    | `public/logo.svg` |

### Amendment (added by Phase 9.7): Header surface uses a composite lockup

After Phase 4.2 shipped, a navbar UI/UX audit found that the Header surface
in particular benefits from a **composite mark** — the channel pfp on the
left plus the small `<Logo>` on the right — even though every other surface
keeps the typed Logo alone.

**Why the composite only in the Header:**

- **YouTube channel-recognition.** A visitor arriving from a YouTube
  end-screen recognizes the circular avatar instantly; the typed wordmark
  alone delays recognition by a beat. The Header is the only surface where
  that beat matters — it's the first thing every cross-platform visitor
  sees on the brand site.
- **The phase-4.1 reproducibility argument still holds everywhere else.**
  og:images, email, third-party newsletter, Footer, favicon — every
  non-Header surface is exactly where the typed Logo earns its design
  budget. The composite would re-raster poorly in those rendering paths
  (`ImageResponse`, email clients, print). Those surfaces stay typed-only.
- **No new primitive.** The composite is a thin Header-local wrapper
  (`src/components/site/HeaderLogo.tsx`) that consumes the existing
  `<Logo>` at `size="sm"`. The Logo primitive doesn't change.

**Accessibility:** The wrapper carries a single
`aria-label="Travis Gautier"`. The pfp uses `alt=""` (decorative). The Logo's
internal spans remain `aria-hidden="true"`. Screen readers announce the
name once.

**Decision boundary** (so a future contributor doesn't reopen this):

| Surface | Mark |
|---------|------|
| `Header` (chrome on every public page) | **Composite** — pfp + `<Logo size="sm">` |
| `Footer` | `<Logo size="sm">` alone |
| og:images (root + per-episode + per-case) | typed lockup via `ImageResponse` |
| Favicon | typed `{10x}` mark |
| Email / third-party newsletter | `public/logo.svg` |
| Print / PDF | `public/logo.svg` |

The composite primitive ships in Phase 9.7 alongside the responsive
Header (9.5) and a11y polish (9.6); see `phase-9-a11y-polish.md`.

---

## Feature 4.2: Header restyle

**Complexity: M** — Restyle `src/components/site/Header.tsx` against the
new brand: Marble surface, 1px Ink rule below, all-caps Inter nav items
with Oxblood active state via the existing `NavLink` component, no hover
transforms (color shift only).

### Problem

The current Header uses the placeholder palette and ad-hoc Tailwind
classes. After Phases 1–3 the site has a coherent token system; the
Header is the most-seen surface on every page and must be brand-correct
first.

### Implementation

**MODIFY** `src/components/site/Header.tsx`:

```tsx
import Link from 'next/link';
import { Marble } from '@/components/brand/Marble';
import { Logo } from '@/components/brand/Logo';
import { NavLink } from './NavLink';
import { Container } from './Container';

const NAV_ITEMS = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases',    label: 'Cases' },
  { href: '/build-log', label: 'Build Log' },
  { href: '/products', label: 'Products' },
  { href: '/about',    label: 'About' },
];

export function Header() {
  return (
    <Marble as="header" edge="none" className="border-b border-(--edge-color)">
      <Container className="flex items-center justify-between py-(--space-4)">
        <Link href="/" className="inline-flex">
          <Logo size="md" />
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-(--space-5)">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} className="label">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </Marble>
  );
}
```

**MODIFY** `src/components/site/NavLink.tsx` — update active state and hover:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export function NavLink({ href, className = '', children }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`
        ${className}
        transition-colors duration-150
        ${active ? 'text-(--color-oxblood)' : 'text-(--pair-text-on-marble) hover:text-(--color-oxblood)'}
      `}
    >
      {children}
    </Link>
  );
}
```

### Design Decisions

- **`<Marble as="header">`.** Header surfaces are explicit; the surface
  primitive enforces the Marble + text-on-marble pair. The 1px Ink rule
  below is the brand's depth signal; no shadow.
- **Nav uses the `label` utility from Phase 2.2.** All-caps, tracked,
  small. Series tags use the same utility — visual rhyme.
- **`aria-current="page"` on active.** Semantic, not just visual. Screen
  readers announce the active route.
- **No hover transforms / no underline.** Color shift only (Oxblood on
  hover). The brand discipline forbids motion-for-decoration; underlines
  fight Inter's letterforms in small caps.
- **`Build Log` displayed as two words.** The route is `/build-log` but
  the label reads as "Build Log" — both words. Internal slug
  uses the kebab-case convention; user-facing label uses sentence-case
  brand voice.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/components/site/Header.tsx` |
| MODIFY | `src/components/site/NavLink.tsx` |

---

## Feature 4.3: Footer restyle

**Complexity: S** — Restyle `src/components/site/Footer.tsx` against the
brand: Parchment surface, small Logo lockup, and the Verdigris-on-Bone
treatment for the Large Language Library sister-project link (one of the
few places Verdigris reads outside completion states — there because the
sister project is a positive, completed pointer to elsewhere).

### Problem

The current Footer carries the placeholder palette and an ad-hoc LLL
sister-project link. Verdigris is reserved in the brand spec for completion
and success — and an "if you liked this, our sister project is over there"
link is exactly that: it sends visitors elsewhere with a positive completion
sense. Encoding the treatment in the Footer locks it.

### Implementation

**MODIFY** `src/components/site/Footer.tsx`:

```tsx
import Link from 'next/link';
import { Parchment } from '@/components/brand/Parchment';
import { Logo } from '@/components/brand/Logo';
import { Container } from './Container';

export function Footer() {
  return (
    <Parchment as="footer" className="border-t border-(--edge-color)">
      <Container className="py-(--space-6) flex flex-col gap-(--space-4) md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-(--space-2)">
          <Link href="/" className="inline-flex">
            <Logo size="sm" />
          </Link>
          <p className="body-3">
            One person. An agent team. Full SaaS delivery.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-(--space-1)">
          <span className="label">Sister Project</span>
          <a
            href="https://largelanguagelibrary.ai"
            target="_blank"
            rel="noreferrer"
            className="
              inline-flex items-center gap-(--space-2)
              bg-(--color-bone) text-(--color-verdigris)
              border border-(--edge-color-subtle)
              px-(--space-3) py-(--space-1)
              transition-colors duration-150
              hover:bg-(--color-verdigris) hover:text-(--color-bone)
            "
          >
            largelanguagelibrary.ai
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </Container>
    </Parchment>
  );
}
```

### Design Decisions

- **`<Parchment as="footer">`.** Footer is the second warm surface; it
  signals "the page ends here." Marble header + parchment footer mirror
  the editorial layout of a printed page.
- **Verdigris-on-Bone for the LLL link.** The brand spec reserves
  Verdigris for completion / success. A sister-project link is a
  "completed step" — you've finished reading, here's where to go next.
  The hover state inverts (Verdigris background, Bone text) to make the
  click target unmistakable without using an Oxblood that would compete
  with the rest of the footer.
- **Right-arrow glyph instead of `<svg>` icon.** Per spec, no icon clutter.
  A typeface arrow (`→`) sits inline with the type and respects the brand
  discipline.
- **Small logo (`size="sm"`).** Footer logo is a quiet signature, not
  re-presentation. Recognizability over presence.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/components/site/Footer.tsx` |

---

## Feature 4.4: Layout primitives

**Complexity: M** — Tighten `Container` widths (max-w-prose for text-heavy
pages, max-w-5xl for layout-heavy), add `<Section>` for consistent vertical
rhythm, and add `<SectionDivider>` wrapping `<BrushstrokeSeam>` for the
homepage's section-to-section transitions.

### Problem

The current `Container` is a single max-width fits-all (`max-w-5xl`).
Editorial layouts need narrower text columns for body-rich pages (about,
episodes detail, cases detail). And without a `<Section>` primitive, every
page picks its own `py-16` / `py-20` / `py-24` and the vertical rhythm
fragments. Divider visual treatment between major page sections needs to
be in one place too.

### Implementation

**MODIFY** `src/components/site/Container.tsx`:

```tsx
import type { ComponentPropsWithoutRef, ElementType } from 'react';

type ContainerWidth = 'prose' | 'layout' | 'wide';

type ContainerProps<E extends ElementType> = {
  as?: E;
  width?: ContainerWidth;
  className?: string;
} & Omit<ComponentPropsWithoutRef<E>, 'className'>;

const widthClass: Record<ContainerWidth, string> = {
  prose: 'max-w-prose',         /* ~65ch — body text, manuscript pages */
  layout: 'max-w-5xl',          /* the default — index pages, hero */
  wide: 'max-w-7xl',            /* full-bleed-ish — build log tables */
};

export function Container<E extends ElementType = 'div'>({
  as,
  width = 'layout',
  className = '',
  ...rest
}: ContainerProps<E>) {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag
      className={`${widthClass[width]} mx-auto px-(--space-5) md:px-(--space-7) ${className}`}
      {...rest}
    />
  );
}
```

**NEW** `src/components/brand/Section.tsx`:

```tsx
import type { ComponentPropsWithoutRef, ElementType } from 'react';

type Rhythm = 'sm' | 'md' | 'lg';

type SectionProps<E extends ElementType> = {
  as?: E;
  rhythm?: Rhythm;
  className?: string;
} & Omit<ComponentPropsWithoutRef<E>, 'className'>;

const rhythmClass: Record<Rhythm, string> = {
  sm: 'py-(--section-y-sm)',
  md: 'py-(--section-y-md)',
  lg: 'py-(--section-y-lg)',
};

export function Section<E extends ElementType = 'section'>({
  as,
  rhythm = 'md',
  className = '',
  ...rest
}: SectionProps<E>) {
  const Tag = (as ?? 'section') as ElementType;
  return <Tag className={`${rhythmClass[rhythm]} ${className}`} {...rest} />;
}
```

**NEW** `src/components/brand/SectionDivider.tsx`:

```tsx
import { BrushstrokeSeam } from './BrushstrokeSeam';

interface SectionDividerProps {
  /** Foreground (top) surface color — typically Marble. */
  top?: string;
  /** Background (bottom) surface color — typically Parchment or Bone. */
  bottom?: string;
}

export function SectionDivider({
  top = 'var(--color-marble)',
  bottom = 'var(--color-parchment)',
}: SectionDividerProps) {
  return (
    <div className="h-(--space-7)" aria-hidden="true">
      <BrushstrokeSeam
        direction="bottom"
        feather="3rem"
        foreground={top}
        background={bottom}
      />
    </div>
  );
}
```

### Design Decisions

- **Three Container widths.** `prose` for reading, `layout` (default) for
  index pages, `wide` for the build-log status table where horizontal
  data needs room. Skipping intermediate widths means every page makes
  one of three intentional choices.
- **Section as `<section>` by default.** Semantic out of the box; consumers
  can override with `as="article"` for page-level wrappers.
- **Three rhythm levels.** `sm` between tight subsections, `md` is the
  default page-section rhythm, `lg` between the hero and the rest of the
  homepage. Encoded as vertical-rhythm tokens from Phase 1.2 so the same
  numbers reach every consumer.
- **`SectionDivider` is brushstroke-only.** Per the locked decision, the
  brushstroke composition appears on the homepage and as a divider.
  Other pages stay calm. Encoding it as a divider primitive means a future
  page that genuinely needs one isn't tempted to inline `<BrushstrokeSeam>`.
- **Divider is `aria-hidden`.** Decorative, not structural. Headings carry
  the document structure.
- **No `<Container>` inside `<Section>`.** Composability matters: a Section
  with full-bleed background and a Container inside it is a different
  composition than a Container with multiple Sections. Keeping the two
  primitives independent allows both.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/components/site/Container.tsx` |
| NEW    | `src/components/brand/Section.tsx` |
| NEW    | `src/components/brand/SectionDivider.tsx` |

---

## Phase 4 Exit Criteria

- `<Logo>` renders at three sizes; `public/logo.svg` reachable at
  `https://localhost:3000/logo.svg`.
- Header shows Marble surface, Ink rule below, Cinzel+JetBrains logo,
  all-caps Inter nav with Oxblood active state, no hover transforms.
- Footer shows Parchment surface, small Logo, Verdigris-on-Bone LLL link
  with inverted hover.
- `<Container width>` ships three width variants used downstream.
- `<Section rhythm>` wraps page sections with consistent rhythm.
- `<SectionDivider>` renders a brushstroke seam between two surfaces.
- `npm run lint` clean. `npm run build` clean. `npm test` green
  (forbidden-pattern sentinel must pass).
- Dev-server walk: every page in the route inventory loads with the new
  Header + Footer. No visual brand violations in the chrome.
