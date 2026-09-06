# Phase 2: Calculators

**Total Size: 2 × L**
**Prerequisites:** Phase 1 complete — `Tool` schema, empty registry, `<ToolShell>`, `/tools` index, `/tools/[slug]` dynamic route all live.
**New Types:** Per-calculator input types (each calculation module exports its own `XInput` + Zod schema).
**New Files:** 4 calculator React components + 4 pure calculation modules + 1 shared formatters module + co-located tests.

Phase 2 adds the four calculators that make `/tools` useful. Each calculator
is a pure calculation module + a client component + a registry append. The
four calculators are grouped into two merged sections of two each — pairs
share the same five-part shape and no cross-dependencies, so paired TDD
cycles cut pipeline overhead without losing rigor.

---

## Calculator Shape (reused by every calculator in this phase)

Each of the four calculators follows the same five-part shape. Stated once
here so the merged feature sections don't repeat it:

1. **Pure calculation module** at `src/lib/tools/calculations/{slug}.ts`
   - Exports an input type (e.g. `ProjectScopingInput`)
   - Exports a Zod input schema (e.g. `ProjectScopingInputSchema`)
   - Exports a pure function (e.g. `estimateScope(input: ProjectScopingInput): ProjectScopingResult`)
   - Zero React imports. Fully unit-testable against a table of fixtures.
2. **Client component** at `src/components/tools/calculators/{Name}Calculator.tsx`
   - First line: `'use client';`
   - Holds form state via `useState` (one piece of state per input, or a single object)
   - Computes a result either on every input change (cheap) or on submit (more controlled)
   - Renders `<ToolShell tool={tool}>` with input form as children and the formatted result as the `result` prop
   - Imports its own registry entry: `const tool = getToolBySlug('project-scoping')!` — safe because registry is build-time-validated
3. **Registry entry** appended to `src/content/tools/registry.ts`
4. **rtl component test** at `__tests__/{Name}Calculator.test.tsx` that drives inputs and asserts the result render
5. **Unit test** at `src/lib/tools/calculations/__tests__/{slug}.test.ts` against a fixture table of known inputs/outputs

Also shipped in Phase 2 (one-time, inside Feature 2.1 — the first merged
calculator section):

**NEW** `src/lib/tools/formatters.ts` — shared helpers used by multiple calculators:

```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatCurrency(value: number, currency: 'USD' = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${rounded === 1 ? 'hour' : 'hours'}`;
}

export function formatWeeks(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${rounded === 1 ? 'week' : 'weeks'}`;
}
```

Co-located test: `src/lib/tools/__tests__/formatters.test.ts`.

**Design note on formatters:** Feature 2.1 (Scoping + Pricing) ships
`formatters.ts`. Feature 2.2 (ROI + Discovery Timeline) imports from it. If
`/refactor` finds unused helpers at the end of Phase 2, drop them — no dead
code.

---

## Feature 2.1: Scoping + Pricing Calculators

**Complexity: L** — Two calculators packaged together: Project Scoping Estimator + Pricing Calculator. Both follow the identical five-part shape above and this is the first Phase 2 section, so `formatters.ts` ships here.

### Problem

**Project scoping:** Consultants and developers constantly need a rough scope
estimate for a new project — "this sounds like a 4-week thing, but how do I
justify that number?" A deterministic calculator that takes project type,
feature count, integration count, and timeline pressure and returns a week
range is exactly the SEO-friendly utility the plan calls for.

**Pricing:** Freelancers and small agencies routinely undercharge because
they can't quickly translate "hourly rate × hours" into a real quote. A
deterministic calculator that folds in complexity and agency margin and
returns low/recommended/high tiers gives them a defensible number in
seconds.

Both calculators share the identical implementation shape, the formatters
module, and the registry append pattern, so they ship as one TDD cycle.

### Implementation

#### Project Scoping Estimator

**NEW** `src/lib/tools/calculations/project-scoping.ts`:

```ts
import { z } from 'zod';

export type ProjectType =
  | 'marketing-site'
  | 'web-app'
  | 'mobile-app'
  | 'ai-agent-system';

export type TimelinePressure = 'relaxed' | 'normal' | 'rushed';

export interface ProjectScopingInput {
  projectType: ProjectType;
  featureCount: number;
  integrationCount: number;
  timelinePressure: TimelinePressure;
}

export interface ProjectScopingResult {
  lowWeeks: number;
  highWeeks: number;
  breakdown: {
    discovery: number;
    build: number;
    polish: number;
  };
}

export const ProjectScopingInputSchema = z.object({
  projectType: z.enum([
    'marketing-site',
    'web-app',
    'mobile-app',
    'ai-agent-system',
  ]),
  featureCount: z.number().int().min(0).max(50),
  integrationCount: z.number().int().min(0).max(20),
  timelinePressure: z.enum(['relaxed', 'normal', 'rushed']),
});

const BASE_WEEKS: Record<ProjectType, number> = {
  'marketing-site': 2,
  'web-app': 6,
  'mobile-app': 10,
  'ai-agent-system': 8,
};

const PRESSURE_MULTIPLIER: Record<TimelinePressure, number> = {
  relaxed: 1.5,
  normal: 1.3,
  rushed: 1.15,
};

export function estimateScope(input: ProjectScopingInput): ProjectScopingResult {
  const base = BASE_WEEKS[input.projectType];
  const lowWeeks = Math.round(
    (base + input.featureCount * 0.4 + input.integrationCount * 0.5) * 10,
  ) / 10;
  const highWeeks = Math.round(
    lowWeeks * PRESSURE_MULTIPLIER[input.timelinePressure] * 10,
  ) / 10;
  const midpoint = (lowWeeks + highWeeks) / 2;
  return {
    lowWeeks,
    highWeeks,
    breakdown: {
      discovery: Math.round(midpoint * 0.2 * 10) / 10,
      build: Math.round(midpoint * 0.6 * 10) / 10,
      polish: Math.round(midpoint * 0.2 * 10) / 10,
    },
  };
}
```

**NEW** `src/components/tools/calculators/ProjectScopingCalculator.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ToolShell } from '@/components/tools/ToolShell';
import { getToolBySlug } from '@/content/tools/registry';
import {
  estimateScope,
  type ProjectScopingInput,
  type ProjectScopingResult,
  type ProjectType,
  type TimelinePressure,
} from '@/lib/tools/calculations/project-scoping';
import { formatWeeks } from '@/lib/tools/formatters';

const DEFAULT_INPUT: ProjectScopingInput = {
  projectType: 'web-app',
  featureCount: 8,
  integrationCount: 2,
  timelinePressure: 'normal',
};

export function ProjectScopingCalculator() {
  // Registry entry exists at module-load time because it's added in this
  // same feature's registry.ts append. Non-null assertion is safe.
  const tool = getToolBySlug('project-scoping')!;

  const [input, setInput] = useState<ProjectScopingInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<ProjectScopingResult | null>(null);

  function update<K extends keyof ProjectScopingInput>(
    key: K,
    value: ProjectScopingInput[K],
  ) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setResult(null); // recompute-required hint: result clears on edit
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(estimateScope(input));
  }

  return (
    <ToolShell
      tool={tool}
      result={result ? <ProjectScopingResultView result={result} /> : null}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Project type">
          <select
            value={input.projectType}
            onChange={(e) => update('projectType', e.target.value as ProjectType)}
            className="w-full rounded-md border border-mist bg-background px-3 py-2 text-sm"
          >
            <option value="marketing-site">Marketing site</option>
            <option value="web-app">Web app</option>
            <option value="mobile-app">Mobile app</option>
            <option value="ai-agent-system">AI agent system</option>
          </select>
        </Field>

        <Field label="Feature count" hint="0–50">
          <input
            type="number"
            min={0}
            max={50}
            value={input.featureCount}
            onChange={(e) => update('featureCount', Number(e.target.value))}
            className="w-full rounded-md border border-mist bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Integration count" hint="0–20">
          <input
            type="number"
            min={0}
            max={20}
            value={input.integrationCount}
            onChange={(e) => update('integrationCount', Number(e.target.value))}
            className="w-full rounded-md border border-mist bg-background px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Timeline pressure">
          <select
            value={input.timelinePressure}
            onChange={(e) =>
              update('timelinePressure', e.target.value as TimelinePressure)
            }
            className="w-full rounded-md border border-mist bg-background px-3 py-2 text-sm"
          >
            <option value="relaxed">Relaxed</option>
            <option value="normal">Normal</option>
            <option value="rushed">Rushed</option>
          </select>
        </Field>

        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-parchment hover:opacity-90"
        >
          Estimate scope
        </button>
      </form>
    </ToolShell>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {hint && <span className="ml-2 text-xs text-muted">({hint})</span>}
      </span>
      {children}
    </label>
  );
}

function ProjectScopingResultView({ result }: { result: ProjectScopingResult }) {
  return (
    <div className="rounded-md border border-mist p-6">
      <p className="text-xs uppercase tracking-wide text-muted">Estimated scope</p>
      <p className="mt-2 font-display text-2xl text-foreground">
        {formatWeeks(result.lowWeeks)} – {formatWeeks(result.highWeeks)}
      </p>
      <dl className="mt-6 space-y-2 text-sm">
        <Row label="Discovery" value={formatWeeks(result.breakdown.discovery)} />
        <Row label="Build" value={formatWeeks(result.breakdown.build)} />
        <Row label="Polish" value={formatWeeks(result.breakdown.polish)} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-mist/60 pb-1 last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
```

**MODIFY** `src/content/tools/registry.ts` — append entry:

```ts
import { ProjectScopingCalculator } from '@/components/tools/calculators/ProjectScopingCalculator';

const registry: Tool[] = [
  {
    slug: 'project-scoping',
    title: 'Project scoping estimator',
    summary:
      'Get a rough person-week range for a new project from four simple inputs. Useful for first-pass quoting and internal feasibility reviews.',
    category: 'scoping',
    tagline: 'Person-week range + discovery/build/polish split',
    Component: ProjectScopingCalculator,
  },
];
```

#### Pricing Calculator

**NEW** `src/lib/tools/calculations/pricing.ts`:

```ts
import { z } from 'zod';

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'enterprise';

export interface PricingInput {
  hourlyRate: number;
  estimatedHours: number;
  complexity: ComplexityLevel;
  agencyMargin: number; // percentage, 0–100
}

export interface PricingResult {
  low: number;
  recommended: number;
  high: number;
}

export const PricingInputSchema = z.object({
  hourlyRate: z.number().min(10).max(1000),
  estimatedHours: z.number().min(1).max(10000),
  complexity: z.enum(['simple', 'moderate', 'complex', 'enterprise']),
  agencyMargin: z.number().min(0).max(100),
});

const COMPLEXITY_MULTIPLIER: Record<ComplexityLevel, number> = {
  simple: 1.0,
  moderate: 1.25,
  complex: 1.55,
  enterprise: 2.0,
};

export function computeQuoteRange(input: PricingInput): PricingResult {
  const base = input.hourlyRate * input.estimatedHours;
  const withComplexity = base * COMPLEXITY_MULTIPLIER[input.complexity];
  const recommended = withComplexity * (1 + input.agencyMargin / 100);
  return {
    low: Math.round(recommended * 0.85),
    recommended: Math.round(recommended),
    high: Math.round(recommended * 1.2),
  };
}
```

**NEW** `src/components/tools/calculators/PricingCalculator.tsx`:

Same shape as `ProjectScopingCalculator`:
- `'use client'` directive
- `useState<PricingInput>` with realistic defaults (e.g. `{ hourlyRate: 150, estimatedHours: 80, complexity: 'moderate', agencyMargin: 20 }`)
- Form with four inputs (number, number, select, number)
- Submit button: "Calculate quote range"
- Result view: three tiers — Low, Recommended (visually emphasized), High — each formatted via `formatCurrency()`
- Result clears on input edit
- `<ToolShell tool={getToolBySlug('pricing')!} ...>`

**MODIFY** `src/content/tools/registry.ts` — append `{ slug: 'pricing', title: 'Pricing calculator', summary: 'Convert hourly rate and estimated hours into a defensible quote range...', category: 'pricing', tagline: 'Defensible quote range in seconds', Component: PricingCalculator }`

### Tests (red phase of section `free-tools-2.1`)

**Project scoping unit tests** — `src/lib/tools/calculations/__tests__/project-scoping.test.ts`:
- Fixture table: 5+ `{ input, expectedResult }` pairs covering all four project types, edge cases (0 features, max features, max integrations), and each pressure level
- `ProjectScopingInputSchema` rejects negative featureCount, negative integrationCount, unknown projectType, featureCount over 50, integrationCount over 20
- `estimateScope` output is deterministic: same input → same output across runs
- `lowWeeks <= highWeeks` holds for every fixture

**Project scoping component tests** — `src/components/tools/calculators/__tests__/ProjectScopingCalculator.test.tsx`:
- Initial render: all inputs show default values, result slot shows the `<ToolShell>` placeholder
- Changing an input before submit leaves result slot in placeholder state
- Clicking "Estimate scope" renders the result view with the week range and breakdown
- Editing an input after submit clears the result back to placeholder
- Capture section (from `<ToolShell>`) is not in the DOM pre-submit; appears post-submit

**Pricing unit tests** — `src/lib/tools/calculations/__tests__/pricing.test.ts`:
- Unit fixture table covering: min/max hourly rate, all four complexity levels, zero margin, max margin, typical values
- `low < recommended < high` invariant
- Zod schema rejects out-of-range values

**Pricing component tests** — `src/components/tools/calculators/__tests__/PricingCalculator.test.tsx`:
- Component renders default inputs, computes on submit, displays three tiers formatted as currency, clears result on edit, shows capture CTA post-result

**Formatters unit tests** — `src/lib/tools/__tests__/formatters.test.ts`:
- `clamp`, `formatCurrency`, `formatHours`, `formatWeeks` each covered with edge cases (negative, zero, one, plural)

### Design Decisions

**Project scoping:**
- **Result clears on edit** — the "submit → result" → "edit input" transition clears the result back to null. This avoids showing a stale result after the user has changed an input but not yet recomputed. Matches the mental model of "I clicked 'estimate' for these specific inputs".
- **Submit-to-compute, not compute-on-change** — explicit user action maps to a result. Works better with the capture CTA: the capture section shows up after the user commits to a calculation, not while they're still noodling with sliders.
- **Default values are realistic, not zeros** — a new visitor to the tool sees a plausible example state (web app, 8 features, 2 integrations, normal pressure) rather than a blank form. They can click "Estimate scope" immediately and see something.
- **`getToolBySlug('project-scoping')!` with non-null assertion** — the registry entry is appended in this same feature, so by the time this component's module loads, the entry exists. A runtime miss would be a programmer bug, not a recoverable state.
- **Breakdown rounding to 1 decimal** — weeks at whole-number precision lose too much signal; at 2 decimals they look false-precise. 1 decimal is the honest middle.
- **`<Field>` and `<Row>` as private helpers in the same file** — these are pure presentational helpers tied to this calculator's form. Extracting them to `src/components/tools/` would be premature. If a second calculator needs the same `<Field>` pattern, the refactor phase extracts it then.

**Pricing:**
- **`0.85` / `1.2` tier multipliers** — symmetric-ish around the recommended value. A ~15% discount tier and a ~20% premium tier cover the typical "client wants a discount / project is scope-creepy" negotiation range.
- **`Math.round` on dollar values** — no cent precision on quote ranges. Cents in a quote look amateurish.
- **Complexity as an enum, not a numeric input** — a slider from 1.0 to 2.0 would let users fine-tune but would also let them kid themselves into a false-precision multiplier. Four named levels force an honest categorization.
- **Defaults tuned to a typical independent contractor** — $150/hr, 80 hours, moderate complexity, 20% margin. Lands around $22,500. Any consultant visiting the tool recognizes these as plausible.

### Files

| Action | File                                                                           |
|--------|--------------------------------------------------------------------------------|
| NEW    | `src/lib/tools/calculations/project-scoping.ts`                                |
| NEW    | `src/lib/tools/calculations/__tests__/project-scoping.test.ts`                 |
| NEW    | `src/lib/tools/calculations/pricing.ts`                                        |
| NEW    | `src/lib/tools/calculations/__tests__/pricing.test.ts`                         |
| NEW    | `src/lib/tools/formatters.ts`                                                  |
| NEW    | `src/lib/tools/__tests__/formatters.test.ts`                                   |
| NEW    | `src/components/tools/calculators/ProjectScopingCalculator.tsx`                |
| NEW    | `src/components/tools/calculators/__tests__/ProjectScopingCalculator.test.tsx` |
| NEW    | `src/components/tools/calculators/PricingCalculator.tsx`                       |
| NEW    | `src/components/tools/calculators/__tests__/PricingCalculator.test.tsx`        |
| MODIFY | `src/content/tools/registry.ts`                                                |

---

## Feature 2.2: ROI + Discovery Timeline Calculators

**Complexity: L** — Two calculators packaged together: ROI Calculator (AI agent workflows) + Discovery Phase Timeline Generator. Both follow the identical five-part shape and consume `formatters.ts` from Feature 2.1.

### Problem

**ROI:** The whole Travis Gautier pitch is "one person with an agent team does
what a five-person team used to". Prospects want to see that proposition as
a number. A calculator that takes current human hours per week + hourly cost
+ agent automation percentage + (optional) one-time setup cost and returns
weekly savings, annual savings, and payback period makes that pitch concrete.

**Discovery timeline:** Selling a discovery engagement is harder than
selling a build engagement because the client can't picture what they'd be
paying for. A tool that takes client size, product complexity, and
stakeholder count and renders a week-by-week schedule with concrete
activities (kickoff, interviews, synthesis, recommendations, handoff) makes
discovery look like a defined, scoped thing rather than a billable fog.

Both calculators share the identical implementation shape and have no
cross-dependencies, so they ship as one TDD cycle.

### Implementation

#### ROI Calculator

**NEW** `src/lib/tools/calculations/roi.ts`:

```ts
import { z } from 'zod';

export interface RoiInput {
  currentHoursPerWeek: number;
  hourlyCost: number;
  automationPercent: number;
  implementationCost: number; // one-time, default 0
}

export interface RoiResult {
  weeklyHoursSaved: number;
  weeklySavings: number;
  annualSavings: number;
  paybackWeeks: number | null;
}

export const RoiInputSchema = z.object({
  currentHoursPerWeek: z.number().min(0).max(80),
  hourlyCost: z.number().min(10).max(500),
  automationPercent: z.number().min(0).max(100),
  implementationCost: z.number().min(0).default(0),
});

export function computeAnnualSavings(input: RoiInput): RoiResult {
  const weeklyHoursSaved =
    input.currentHoursPerWeek * (input.automationPercent / 100);
  const weeklySavings = weeklyHoursSaved * input.hourlyCost;
  const annualSavings = weeklySavings * 52;
  const paybackWeeks =
    input.implementationCost > 0 && weeklySavings > 0
      ? Math.ceil(input.implementationCost / weeklySavings)
      : null;
  return {
    weeklyHoursSaved: Math.round(weeklyHoursSaved * 10) / 10,
    weeklySavings: Math.round(weeklySavings),
    annualSavings: Math.round(annualSavings),
    paybackWeeks,
  };
}
```

**NEW** `src/components/tools/calculators/RoiCalculator.tsx`:

Same calculator shape as Feature 2.1:
- `'use client'`
- `useState<RoiInput>` with defaults e.g. `{ currentHoursPerWeek: 10, hourlyCost: 75, automationPercent: 60, implementationCost: 5000 }`
- Inputs: number, number, number (with `max={100}`), number
- Submit: "Calculate savings"
- Result view: headline annual savings (big, formatted currency), then three sub-stats — weekly hours saved (formatHours), weekly savings (formatCurrency), payback period (e.g. "~10 weeks" or "N/A" when no implementation cost)
- `<ToolShell tool={getToolBySlug('roi')!} ...>`

**MODIFY** `src/content/tools/registry.ts` — append `{ slug: 'roi', title: 'AI agent ROI calculator', summary: 'Project the annual savings and payback period of replacing a recurring task with an AI agent workflow.', category: 'roi', tagline: 'Annual savings + payback period', Component: RoiCalculator }`

#### Discovery Timeline Generator

**NEW** `src/lib/tools/calculations/discovery-timeline.ts`:

```ts
import { z } from 'zod';

export type ClientSize = 'solo' | 'small-team' | 'mid-market' | 'enterprise';
export type ProductComplexity = 'simple' | 'moderate' | 'complex';

export interface DiscoveryInput {
  clientSize: ClientSize;
  productComplexity: ProductComplexity;
  stakeholderCount: number;
}

export interface DiscoveryWeek {
  week: number;
  focus: string;
  deliverable: string;
}

export interface DiscoveryResult {
  totalWeeks: number;
  schedule: DiscoveryWeek[];
}

export const DiscoveryInputSchema = z.object({
  clientSize: z.enum(['solo', 'small-team', 'mid-market', 'enterprise']),
  productComplexity: z.enum(['simple', 'moderate', 'complex']),
  stakeholderCount: z.number().int().min(1).max(20),
});

const BASE_WEEKS_BY_SIZE: Record<ClientSize, number> = {
  solo: 1,
  'small-team': 2,
  'mid-market': 3,
  enterprise: 4,
};

const COMPLEXITY_ADDER: Record<ProductComplexity, number> = {
  simple: 0,
  moderate: 1,
  complex: 2,
};

const ACTIVITIES: Array<{ focus: string; deliverable: string }> = [
  { focus: 'Kickoff + alignment',       deliverable: 'Engagement charter, stakeholder map' },
  { focus: 'Research + interviews',     deliverable: 'Interview notes, research questions' },
  { focus: 'Deeper dives',              deliverable: 'Technical review, competitor scan' },
  { focus: 'Synthesis',                 deliverable: 'Findings memo, themes + gaps' },
  { focus: 'Recommendations draft',     deliverable: 'Draft roadmap, option tradeoffs' },
  { focus: 'Review + revision',         deliverable: 'Revised roadmap, decisions log' },
  { focus: 'Stakeholder walkthrough',   deliverable: 'Final presentation, FAQ doc' },
  { focus: 'Handoff + next steps',      deliverable: 'Delivery packet, transition plan' },
];

export function buildDiscoverySchedule(input: DiscoveryInput): DiscoveryResult {
  const base = BASE_WEEKS_BY_SIZE[input.clientSize];
  const complexity = COMPLEXITY_ADDER[input.productComplexity];
  const stakeholderAdder = Math.ceil(input.stakeholderCount / 5);
  const totalWeeks = Math.min(base + complexity + stakeholderAdder, 8);
  const schedule = ACTIVITIES.slice(0, totalWeeks).map((activity, i) => ({
    week: i + 1,
    focus: activity.focus,
    deliverable: activity.deliverable,
  }));
  return { totalWeeks, schedule };
}
```

**NEW** `src/components/tools/calculators/DiscoveryTimelineCalculator.tsx`:

Same shape as the other calculators:
- `'use client'`
- `useState<DiscoveryInput>` with defaults e.g. `{ clientSize: 'small-team', productComplexity: 'moderate', stakeholderCount: 5 }`
- Inputs: select, select, number
- Submit: "Generate timeline"
- Result view: horizontal timeline on `md:` breakpoint, stacked ordered list on mobile. Each week shows: `Week N`, focus (bold), deliverable (muted)
- `<ToolShell tool={getToolBySlug('discovery-timeline')!} ...>`

**MODIFY** `src/content/tools/registry.ts` — append `{ slug: 'discovery-timeline', title: 'Discovery timeline generator', summary: 'Turn client size, product complexity, and stakeholder count into a week-by-week discovery schedule with concrete deliverables.', category: 'timeline', tagline: 'Week-by-week discovery schedule', Component: DiscoveryTimelineCalculator }`

### Tests (red phase of section `free-tools-2.2`)

**ROI unit tests** — `src/lib/tools/calculations/__tests__/roi.test.ts`:
- Unit fixtures: zero-cost implementation (paybackWeeks === null), nonzero implementation (paybackWeeks === integer), zero automation (zero savings), full automation (100% savings)
- Zod schema enforces `currentHoursPerWeek ≤ 80` (nobody bills more than that honestly)
- `weeklyHoursSaved` and `weeklySavings` non-negative for all valid inputs

**ROI component tests** — `src/components/tools/calculators/__tests__/RoiCalculator.test.tsx`:
- Component renders headline savings formatted as currency, displays payback row only when implementation cost > 0

**Discovery timeline unit tests** — `src/lib/tools/calculations/__tests__/discovery-timeline.test.ts`:
- Unit fixtures: solo/simple/1 stakeholder → 1 week total; enterprise/complex/20 stakeholders → 8 weeks (capped); mid-market/moderate/5 stakeholders → 5 weeks
- `totalWeeks` never exceeds 8 for any valid input
- `schedule.length === totalWeeks` always
- Each schedule entry has `week: i + 1` (1-indexed)

**Discovery timeline component tests** — `src/components/tools/calculators/__tests__/DiscoveryTimelineCalculator.test.tsx`:
- Component renders the activities in order, displays the correct number of week cards, and capture CTA appears post-submit

### Design Decisions

**ROI:**
- **`implementationCost` optional with default 0** — not everyone incurs an upfront cost (agent might be 100% free tier for their use case). When 0, payback is not shown.
- **`paybackWeeks` is `number | null`, not `0` or `Infinity`** — null cleanly represents "not applicable" and the component can branch on it. Numeric sentinels are ugly.
- **`Math.ceil` on paybackWeeks** — you've paid off the implementation at the END of week N, not partway through. Rounding up matches intuition.
- **`currentHoursPerWeek` capped at 80** — if someone claims they're spending 90 hours/week on one task, the calculator should refuse rather than return a flattering savings number. Honest friction.
- **Headline on annual savings, not monthly** — annual is the number a prospect puts in a business case. Monthly is a vanity metric for this audience.

**Discovery timeline:**
- **8-week hard cap** — longer than 8 weeks isn't "discovery" anymore, it's "consulting engagement". The cap forces the tool to refuse to dignify 12-week discovery fantasies.
- **`stakeholderCount / 5` adder** — every additional group of five stakeholders adds a week of scheduling and interview overhead. Empirically reasonable; easily tunable in `/green`.
- **Fixed `ACTIVITIES` list** — the first N activities from a canonical 8-step schedule always apply. A solo/simple/1 discovery gets just the first ("Kickoff + alignment"); a full enterprise discovery gets all 8. Deterministic and honest.
- **Returning the schedule as a flat array** — not a tree or a week-keyed object. The component iterates it directly. Simpler.
- **Responsive layout: timeline vs. stacked list** — `md:grid-flow-col` on desktop shows it as a horizontal sequence; mobile falls back to `<ol>` with natural stacking. No JS gymnastics.

### Files

| Action | File                                                                              |
|--------|-----------------------------------------------------------------------------------|
| NEW    | `src/lib/tools/calculations/roi.ts`                                               |
| NEW    | `src/lib/tools/calculations/__tests__/roi.test.ts`                                |
| NEW    | `src/lib/tools/calculations/discovery-timeline.ts`                                |
| NEW    | `src/lib/tools/calculations/__tests__/discovery-timeline.test.ts`                 |
| NEW    | `src/components/tools/calculators/RoiCalculator.tsx`                              |
| NEW    | `src/components/tools/calculators/__tests__/RoiCalculator.test.tsx`               |
| NEW    | `src/components/tools/calculators/DiscoveryTimelineCalculator.tsx`                |
| NEW    | `src/components/tools/calculators/__tests__/DiscoveryTimelineCalculator.test.tsx` |
| MODIFY | `src/content/tools/registry.ts`                                                   |

---

## Phase 2 Exit Criteria

- All four calculation modules pass their unit fixture tables
- All four calculator components render, submit, and display results (rtl tests green)
- Registry contains all four entries; `ToolSchema` validation loop passes at module load
- `/tools` index lists all four tools as cards linking to the correct routes
- Each `/tools/{slug}` URL renders the correct calculator under `npm run dev`
- `<EmailCapture>` appears below every result post-submit and carries `source="tool-{slug}"`
- `npm run lint` clean, `npm test` green + coverage still ≥ thresholds, `npm run build` clean
- `/sitemap.xml` still only contains episodes/cases/static routes (Phase 3.1 adds tools to it)
- No new npm packages installed
