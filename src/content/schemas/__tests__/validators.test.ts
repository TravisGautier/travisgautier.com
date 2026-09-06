import { describe, it, expect } from 'vitest';

import {
  EpisodeSchema,
  SourceMaterialSchema,
  CaseSchema,
  JobFeatureSchema,
  JobPhaseHeaderSchema,
  JobPhaseSchema,
  JobSchema,
  SessionStatusSchema,
  KnowledgeFileSchema,
  ProductSchema,
  CohortSchema,
} from '@/content/schemas/validators';

import {
  EpisodeSchema as EpisodeSchemaBarrel,
  SourceMaterialSchema as SourceMaterialSchemaBarrel,
  CaseSchema as CaseSchemaBarrel,
  JobSchema as JobSchemaBarrel,
  JobFeatureSchema as JobFeatureSchemaBarrel,
  JobPhaseSchema as JobPhaseSchemaBarrel,
  SessionStatusSchema as SessionStatusSchemaBarrel,
  KnowledgeFileSchema as KnowledgeFileSchemaBarrel,
  ProductSchema as ProductSchemaBarrel,
  PRODUCT_CATEGORIES as PRODUCT_CATEGORIES_BARREL,
  PRODUCT_LICENSE_TYPES as PRODUCT_LICENSE_TYPES_BARREL,
  PRODUCT_CATEGORY_LABELS as PRODUCT_CATEGORY_LABELS_BARREL,
  PRODUCT_LICENSE_LABELS as PRODUCT_LICENSE_LABELS_BARREL,
  CohortSchema as CohortSchemaBarrel,
  COHORT_STATUSES as COHORT_STATUSES_BARREL,
  COHORT_STATUS_LABELS as COHORT_STATUS_LABELS_BARREL,
  COHORT_STATUS_DESCRIPTIONS as COHORT_STATUS_DESCRIPTIONS_BARREL,
} from '@/content/schemas';

import type {
  Job,
  ProductInput,
  ProductCategory,
  ProductLicenseType,
  CohortInput,
  CohortStatus,
  CompletedSectionEntry,
  DetailedCompletedSection,
  MinimalCompletedSection,
} from '@/content/schemas';

import {
  COHORT_STATUSES,
  COHORT_STATUS_LABELS,
  COHORT_STATUS_DESCRIPTIONS,
} from '@/content/schemas/cohort';

import {
  PRODUCT_CATEGORIES,
  PRODUCT_LICENSE_TYPES,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_LICENSE_LABELS,
} from '@/content/schemas/product';

// ── Build-log fixtures (exported for 1.2 reuse) ─────────────────────

export function validJobFixture(overrides: Partial<Job> = {}): Job {
  return {
    slug: 'community-showcase',
    alias: 'cs',
    title: 'community-showcase — Implementation Plan',
    context: 'Some context here.',
    features: [
      {
        id: '1.1',
        name: 'First feature',
        phase: '1 - Foundation',
        size: 'M',
        status: 'Planned',
      },
    ],
    phases: [
      {
        slug: 'phase-1-foundation',
        filename: 'phase-1-foundation.md',
        header: { phaseNumber: 1, title: 'Foundation' },
        body: '# Phase 1: Foundation\n\nbody',
      },
    ],
    readmeBody: '# community-showcase — Implementation Plan\n\n## Context\n\nx',
    ...overrides,
  };
}

// ── Fixtures ────────────────────────────────────────────────────────

const VALID_EPISODE_MINIMAL = {
  id: 'ep-001',
  slug: 'pilot-party-masters-discovery',
  title: 'Pilot: Party Masters Discovery',
  series: 'Flagship',
  episodeNumber: 0,
  tier: 'flagship' as const,
  pillar: 'delivery' as const,
  summary: 'Building Party Masters from scratch with an AI agent team',
  sourceMaterialIds: [],
  lllEntryUrls: [],
};

const VALID_EPISODE_FULL = {
  ...VALID_EPISODE_MINIMAL,
  season: 1,
  act: 1,
  durationMinutes: 45,
  publishedAt: '2026-04-11T00:00:00Z',
  youtubeUrl: 'https://youtube.com/watch?v=abc123',
  thumbnailUrl: 'https://img.youtube.com/vi/abc123/maxresdefault.jpg',
  transcriptPath: 'src/content/episodes/transcripts/ep-001.md',
};

const VALID_SOURCE_MATERIAL_MINIMAL = {
  id: 'sm-001',
  filename: 'party-masters-spec.md',
  kind: 'markdown' as const,
  description: 'Initial product specification for Party Masters',
  episodeIds: ['ep-001'],
};

const VALID_SOURCE_MATERIAL_FULL = {
  ...VALID_SOURCE_MATERIAL_MINIMAL,
  path: 'src/content/source-materials/party-masters-spec.md',
};

const VALID_CASE_MINIMAL = {
  id: 'case-001',
  slug: 'party-masters',
  title: 'Party Masters',
  client: 'Party Masters LLC',
  status: 'shipped' as const,
  summary: 'AI-built SaaS for party coordination',
  problem: 'Coordinating parties is painful at scale',
  marketResearch: 'Strong demand for event coordination tools',
  discoveryProcess: 'Two-week discovery sprint',
  technicalDecisions: 'Next.js + Prisma + Vercel',
  deliverables: ['backend API', 'frontend app', 'documentation'],
  outcome: 'Shipped to production',
  relatedEpisodeIds: [],
  lllEntryUrls: [],
};

const VALID_CASE_FULL = {
  ...VALID_CASE_MINIMAL,
  startedAt: '2026-01-15T00:00:00Z',
  shippedAt: '2026-03-30T00:00:00Z',
  contractValue: 15000,
  heroImageUrl: 'https://travisgautier.com/images/party-masters-hero.jpg',
};

// ── Unit Tests ──────────────────────────────────────────────────────

describe('EpisodeSchema', () => {
  it('unit_episode_minimal: accepts a record with only required fields', () => {
    const result = EpisodeSchema.parse(VALID_EPISODE_MINIMAL);
    expect(result.id).toBe('ep-001');
    expect(result.slug).toBe('pilot-party-masters-discovery');
    expect(result.episodeNumber).toBe(0);
    expect(result.tier).toBe('flagship');
    expect(result.pillar).toBe('delivery');
  });

  it('unit_episode_full: accepts a fully-populated record with all optionals', () => {
    const result = EpisodeSchema.parse(VALID_EPISODE_FULL);
    expect(result.season).toBe(1);
    expect(result.act).toBe(1);
    expect(result.durationMinutes).toBe(45);
    expect(result.publishedAt).toBe('2026-04-11T00:00:00Z');
    expect(result.youtubeUrl).toBe('https://youtube.com/watch?v=abc123');
    expect(result.thumbnailUrl).toBe('https://img.youtube.com/vi/abc123/maxresdefault.jpg');
    expect(result.transcriptPath).toBe('src/content/episodes/transcripts/ep-001.md');
  });

  it('unit_episode_input_type: EpisodeInput type is usable for building valid records', () => {
    // If this compiles + runs, the type is correctly derived from the schema
    const input = { ...VALID_EPISODE_MINIMAL };
    const result = EpisodeSchema.parse(input);
    expect(result).toBeDefined();
  });
});

describe('SourceMaterialSchema', () => {
  it('unit_source_material_minimal: accepts a minimal valid record', () => {
    const result = SourceMaterialSchema.parse(VALID_SOURCE_MATERIAL_MINIMAL);
    expect(result.id).toBe('sm-001');
    expect(result.kind).toBe('markdown');
    expect(result.episodeIds).toEqual(['ep-001']);
  });

  it('unit_source_material_full: accepts a record with optional path set', () => {
    const result = SourceMaterialSchema.parse(VALID_SOURCE_MATERIAL_FULL);
    expect(result.path).toBe('src/content/source-materials/party-masters-spec.md');
  });
});

describe('CaseSchema', () => {
  it('unit_case_minimal: accepts a minimal valid record with no optional fields', () => {
    const result = CaseSchema.parse(VALID_CASE_MINIMAL);
    expect(result.id).toBe('case-001');
    expect(result.client).toBe('Party Masters LLC');
    expect(result.status).toBe('shipped');
    expect(result.contractValue).toBeUndefined();
    expect(result.heroImageUrl).toBeUndefined();
  });

  it('unit_case_full: accepts a fully-populated record with all optionals', () => {
    const result = CaseSchema.parse(VALID_CASE_FULL);
    expect(result.startedAt).toBe('2026-01-15T00:00:00Z');
    expect(result.shippedAt).toBe('2026-03-30T00:00:00Z');
    expect(result.contractValue).toBe(15000);
    expect(result.heroImageUrl).toBe('https://travisgautier.com/images/party-masters-hero.jpg');
  });
});

describe('@/content/schemas barrel integration', () => {
  it('unit_barrel_exports: EpisodeSchema, SourceMaterialSchema, CaseSchema importable via barrel', () => {
    expect(EpisodeSchemaBarrel).toBeDefined();
    expect(SourceMaterialSchemaBarrel).toBeDefined();
    expect(CaseSchemaBarrel).toBeDefined();
  });
});

// ── Security Tests (STRIDE: Tampering) ──────────────────────────────

describe('Security: Enum tampering', () => {
  it('sec_tampering_episode_tier: rejects invalid tier enum value', () => {
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, tier: 'not-a-tier' }),
    ).toThrow();

    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, tier: 'FLAGSHIP' }),
    ).toThrow();

    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, tier: '' }),
    ).toThrow();
  });

  it('sec_tampering_source_material_kind: rejects unknown kind enum', () => {
    expect(() =>
      SourceMaterialSchema.parse({ ...VALID_SOURCE_MATERIAL_MINIMAL, kind: 'pdf' }),
    ).toThrow();

    expect(() =>
      SourceMaterialSchema.parse({ ...VALID_SOURCE_MATERIAL_MINIMAL, kind: 'MARKDOWN' }),
    ).toThrow();

    expect(() =>
      SourceMaterialSchema.parse({ ...VALID_SOURCE_MATERIAL_MINIMAL, kind: '' }),
    ).toThrow();
  });

  it('sec_tampering_case_status: rejects invalid status enum value', () => {
    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, status: 'live' }),
    ).toThrow();
  });

  it('sec_tampering_episode_slug: rejects slugs with uppercase, underscores, or spaces', () => {
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, slug: 'My-Episode' }),
    ).toThrow();

    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, slug: 'my_episode' }),
    ).toThrow();

    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, slug: 'my episode' }),
    ).toThrow();

    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, slug: '' }),
    ).toThrow();
  });

  it('sec_tampering_episode_urls: rejects non-URL lllEntryUrls entries', () => {
    // Strings with spaces fail WHATWG URL parse
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, lllEntryUrls: ['not a url'] }),
    ).toThrow();

    // Empty strings fail
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, lllEntryUrls: [''] }),
    ).toThrow();
  });
});

describe('Security: Required field enforcement (Info Disclosure)', () => {
  it('sec_info_disclosure_case_required: rejects records missing client or problem', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { client: _c, ...missingClient } = VALID_CASE_MINIMAL;
    expect(() => CaseSchema.parse(missingClient)).toThrow();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { problem: _p, ...missingProblem } = VALID_CASE_MINIMAL;
    expect(() => CaseSchema.parse(missingProblem)).toThrow();

    // Empty strings rejected by min(1) on required narrative fields
    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, client: '' }),
    ).toThrow();

    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, problem: '' }),
    ).toThrow();
  });
});

// ── Edge Case Tests ─────────────────────────────────────────────────

describe('Edge cases: Input boundaries', () => {
  it('edge_input_episode_optional_omission: accepts records with all optionals omitted', () => {
    // VALID_EPISODE_MINIMAL has no optionals — this IS the test
    const result = EpisodeSchema.parse(VALID_EPISODE_MINIMAL);
    expect(result.season).toBeUndefined();
    expect(result.act).toBeUndefined();
    expect(result.durationMinutes).toBeUndefined();
    expect(result.publishedAt).toBeUndefined();
    expect(result.youtubeUrl).toBeUndefined();
    expect(result.thumbnailUrl).toBeUndefined();
    expect(result.transcriptPath).toBeUndefined();
  });

  it('edge_input_episode_negative_number: rejects negative episodeNumber, non-integer season; accepts zero', () => {
    // episodeNumber: -1 rejected (nonnegative)
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, episodeNumber: -1 }),
    ).toThrow();

    // season: 1.5 rejected (int)
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_FULL, season: 1.5 }),
    ).toThrow();

    // episodeNumber: 0 accepted (nonnegative includes zero)
    const result = EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, episodeNumber: 0 });
    expect(result.episodeNumber).toBe(0);
  });

  it('edge_input_case_contract_negative: rejects negative contractValue; accepts 0 and omission', () => {
    // Negative rejected
    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, contractValue: -1 }),
    ).toThrow();

    // Zero accepted (nonnegative)
    const withZero = CaseSchema.parse({ ...VALID_CASE_MINIMAL, contractValue: 0 });
    expect(withZero.contractValue).toBe(0);

    // Omission accepted (optional)
    const withoutValue = CaseSchema.parse(VALID_CASE_MINIMAL);
    expect(withoutValue.contractValue).toBeUndefined();
  });

  it('edge_input_extra_fields: unknown fields are stripped from parsed result', () => {
    const withExtra = { ...VALID_CASE_MINIMAL, secretAdminFlag: true };
    const result = CaseSchema.parse(withExtra);
    expect(result).not.toHaveProperty('secretAdminFlag');
    expect(result.id).toBe('case-001');
  });
});

describe('Edge cases: Temporal', () => {
  it('edge_temporal_datetime_format: publishedAt accepts UTC Z-suffix; rejects offset and local', () => {
    // UTC Z-suffix accepted
    const valid = EpisodeSchema.parse({
      ...VALID_EPISODE_MINIMAL,
      publishedAt: '2026-04-11T00:00:00Z',
    });
    expect(valid.publishedAt).toBe('2026-04-11T00:00:00Z');

    // Offset rejected by default
    expect(() =>
      EpisodeSchema.parse({
        ...VALID_EPISODE_MINIMAL,
        publishedAt: '2026-04-11T00:00:00+02:00',
      }),
    ).toThrow();

    // Date-only rejected (not datetime)
    expect(() =>
      EpisodeSchema.parse({
        ...VALID_EPISODE_MINIMAL,
        publishedAt: '2026-04-11',
      }),
    ).toThrow();
  });
});

// ── Error Recovery Tests ────────────────────────────────────────────

describe('Error recovery: safeParse', () => {
  it('err_safeparse_actionable_messages: safeParse returns structured error with issues array', () => {
    const invalid = { ...VALID_CASE_MINIMAL, status: 'invalid-status', client: '' };
    const result = CaseSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      // Each issue should have path and message for loader to format
      for (const issue of result.error.issues) {
        expect(issue).toHaveProperty('path');
        expect(issue).toHaveProperty('message');
      }
    }
  });
});

// ── Data Integrity Tests ────────────────────────────────────────────

describe('Data integrity', () => {
  it('data_sensitivity_contract_value: contractValue is optional and nonnegative', () => {
    // Omission accepted
    const without = CaseSchema.parse(VALID_CASE_MINIMAL);
    expect(without.contractValue).toBeUndefined();

    // Positive accepted
    const withPositive = CaseSchema.parse({ ...VALID_CASE_MINIMAL, contractValue: 9999.99 });
    expect(withPositive.contractValue).toBe(9999.99);

    // Negative rejected
    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, contractValue: -0.01 }),
    ).toThrow();
  });

  it('data_consistency_enum_source: validators reject values outside canonical CONST tuples', () => {
    // Wrong tier (not in CONTENT_TIERS)
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, tier: 'premium' }),
    ).toThrow();

    // Wrong pillar (not in CONTENT_PILLARS)
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, pillar: 'marketing' }),
    ).toThrow();

    // Wrong kind (not in SOURCE_MATERIAL_KINDS)
    expect(() =>
      SourceMaterialSchema.parse({ ...VALID_SOURCE_MATERIAL_MINIMAL, kind: 'video' }),
    ).toThrow();

    // Wrong status (not in CASE_STATUSES)
    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, status: 'deleted' }),
    ).toThrow();
  });
});

// ════════════════════════════════════════════════════════════════════
// build-in-public-docs-1.1: Build-log schemas
// ════════════════════════════════════════════════════════════════════

const VALID_FEATURE = {
  id: '1.1',
  name: 'First feature',
  phase: '1 - Foundation',
  size: 'M',
  status: 'Planned',
};

const VALID_PHASE = {
  slug: 'phase-1-foundation',
  filename: 'phase-1-foundation.md',
  header: { phaseNumber: 1, title: 'Foundation' },
  body: '# Phase 1: Foundation\n\nbody',
};

// Hand-built fixture matching the live pipeline/active/session.yaml structure.
// Kept in sync with the live file by visual inspection. The 1.2 section will
// add live-file integration tests once the `yaml` package is installed.
const LIVE_SESSION_FIXTURE = {
  id: '2026-04-11-001',
  startedAt: '2026-04-11T00:00:00Z',
  currentPhase: 'build-in-public-docs',
  currentSection: 'build-in-public-docs-1.1',
  currentAgent: 'discovery',
  currentStage: 'build-in-public-docs-1.1-discovery-complete',
  contextWindow: { iteration: 1, totalItems: 11, completedItems: 0 },
  completedSections: [
    { section: 'website-foundation-1.1', completedAt: '2026-04-11' },
    { section: 'website-foundation-4.1', completedAt: '2026-04-12' },
  ],
  notes: 'travisgautier project initialized on 2026-04-11.',
};

// Hand-built fixture matching the live pipeline/active/knowledge.yaml structure.
const LIVE_KNOWLEDGE_FIXTURE = {
  version: 1,
  project: 'travisgautier',
  description: 'Cross-section knowledge store.',
  projectContext: {
    purpose: 'travisgautier is the brand/marketing site for Travis Gautier.',
    stack: { framework: 'Next.js 16.2.3 (App Router)', runtime: 'React 19.2.4' },
    contentModel: { location: 'src/content/schemas/' },
  },
  conventions: {
    test_files: 'src/**/__tests__/**/*.test.{ts,tsx}',
    path_alias: '@/ → src/',
  },
  patterns: [{ id: 'content_type_module', established_in: 'website-foundation-1.1' }],
  openQuestions: [{ id: 'loader_build_incompat', priority: 'P1' }],
};

// ── Unit Tests: JobFeatureSchema ────────────────────────────────────

describe('JobFeatureSchema', () => {
  it('unit_job_feature_minimal: accepts a row with all required fields', () => {
    const result = JobFeatureSchema.parse(VALID_FEATURE);
    expect(result.id).toBe('1.1');
    expect(result.name).toBe('First feature');
    expect(result.size).toBe('M');
  });

  it('sec_tampering_feature_id_format: rejects ids that aren\'t N.M format', () => {
    for (const bad of ['1', '1.1.2', 'abc', '1.', '.1']) {
      expect(() =>
        JobFeatureSchema.parse({ ...VALID_FEATURE, id: bad }),
      ).toThrow();
    }
  });

  it('sec_tampering_length_caps: rejects strings exceeding per-field caps', () => {
    expect(() =>
      JobFeatureSchema.parse({ ...VALID_FEATURE, name: 'x'.repeat(501) }),
    ).toThrow();
    expect(() =>
      JobFeatureSchema.parse({ ...VALID_FEATURE, size: 'XXXXXXXXX' }),
    ).toThrow();
    expect(() =>
      JobFeatureSchema.parse({ ...VALID_FEATURE, status: 'x'.repeat(41) }),
    ).toThrow();
  });
});

// ── Unit Tests: JobPhaseHeaderSchema ────────────────────────────────

describe('JobPhaseHeaderSchema', () => {
  it('unit_job_phase_header_minimal: accepts an empty object (all fields optional)', () => {
    const result = JobPhaseHeaderSchema.parse({});
    expect(result.phaseNumber).toBeUndefined();
    expect(result.title).toBeUndefined();
  });

  it('unit_job_phase_header_full: accepts all 6 optional fields populated', () => {
    const result = JobPhaseHeaderSchema.parse({
      phaseNumber: 1,
      title: 'Foundation',
      totalSize: 'M + M + S',
      prerequisites: 'wf shipped',
      newTypes: 'Job, JobPhase',
      newFiles: 'src/lib/build-log/jobs.ts',
    });
    expect(result.phaseNumber).toBe(1);
    expect(result.title).toBe('Foundation');
    expect(result.totalSize).toBe('M + M + S');
    expect(result.prerequisites).toBe('wf shipped');
    expect(result.newTypes).toBe('Job, JobPhase');
    expect(result.newFiles).toBe('src/lib/build-log/jobs.ts');
  });
});

// ── Unit Tests: JobPhaseSchema ──────────────────────────────────────

describe('JobPhaseSchema', () => {
  it('unit_job_phase_minimal: accepts a valid phase record', () => {
    const result = JobPhaseSchema.parse(VALID_PHASE);
    expect(result.slug).toBe('phase-1-foundation');
    expect(result.filename).toBe('phase-1-foundation.md');
  });

  it('sec_tampering_phase_slug: rejects malformed phase slugs', () => {
    for (const bad of ['phase-1', 'phase-foundation', 'phase-1-Foundation', '1-foundation']) {
      expect(() =>
        JobPhaseSchema.parse({ ...VALID_PHASE, slug: bad }),
      ).toThrow();
    }
  });

  it('sec_tampering_phase_filename: rejects filenames not matching /^phase-\\d+-[a-z0-9-]+\\.md$/', () => {
    for (const bad of [
      'phase-1-foundation.txt',
      'phase-1.md',
      'PHASE-1-FOUNDATION.MD',
      '../etc/passwd.md',
    ]) {
      expect(() =>
        JobPhaseSchema.parse({ ...VALID_PHASE, filename: bad }),
      ).toThrow();
    }
  });
});

// ── Unit Tests: JobSchema ───────────────────────────────────────────

describe('JobSchema', () => {
  it('unit_job_minimal: accepts validJobFixture() with all required fields', () => {
    const result = JobSchema.parse(validJobFixture());
    expect(result.slug).toBe('community-showcase');
    expect(result.alias).toBe('cs');
  });

  it('unit_job_full: accepts validJobFixture({ alias: cs }) with optional alias populated', () => {
    const result = JobSchema.parse(validJobFixture({ alias: 'cs' }));
    expect(result.alias).toBe('cs');
  });

  it('unit_job_alias_undefined: accepts a Job without alias field (omitted)', () => {
    const fixture = validJobFixture();
    delete (fixture as { alias?: string }).alias;
    const result = JobSchema.parse(fixture);
    expect(result.alias).toBeUndefined();
  });

  it('sec_tampering_job_slug: rejects bad slugs (uppercase, underscore, traversal, etc.)', () => {
    for (const bad of ['UPPER', 'with_underscore', 'with space', '../../../etc/passwd', 'trailing-', '-leading']) {
      expect(() =>
        JobSchema.parse(validJobFixture({ slug: bad })),
      ).toThrow();
    }
  });

  it('sec_tampering_job_alias: rejects malformed alias values', () => {
    for (const bad of ['Cs', 'cs1', 'cs-1', 'wayTooLongAlias']) {
      expect(() =>
        JobSchema.parse(validJobFixture({ alias: bad })),
      ).toThrow();
    }
  });

  it('sec_tampering_path_traversal_via_slug: SLUG regex blocks ../ and / and .', () => {
    for (const bad of ['../etc', 'foo/bar', 'foo.bar']) {
      expect(() =>
        JobSchema.parse(validJobFixture({ slug: bad })),
      ).toThrow();
    }
  });

  it('edge_input_job_features_empty: accepts features: [] (degenerate but tolerated)', () => {
    const result = JobSchema.parse(validJobFixture({ features: [] }));
    expect(result.features).toEqual([]);
  });

  it('edge_input_job_phases_empty: accepts phases: [] (no phase files yet)', () => {
    const result = JobSchema.parse(validJobFixture({ phases: [] }));
    expect(result.phases).toEqual([]);
  });

  it('edge_input_unknown_fields_stripped: strict (default) Zod schemas drop unknown fields', () => {
    const fixture = { ...validJobFixture(), secretAdminFlag: true };
    const result = JobSchema.parse(fixture);
    expect(result).not.toHaveProperty('secretAdminFlag');
    expect(result.slug).toBe('community-showcase');
  });
});

// ── Unit Tests: SessionStatusSchema ─────────────────────────────────

describe('SessionStatusSchema', () => {
  it('unit_session_status_minimal: accepts { id, completedSections: [] }', () => {
    const result = SessionStatusSchema.parse({
      id: '2026-04-12-001',
      completedSections: [],
    });
    expect(result.id).toBe('2026-04-12-001');
    expect(result.completedSections).toEqual([]);
  });

  it('unit_session_status_completed_string_form: accepts string-form entries', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: ['website-foundation-1.1'],
    });
    expect(result.completedSections).toEqual(['website-foundation-1.1']);
  });

  it('unit_session_status_completed_object_form: accepts object-form entries', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [
        { section: 'website-foundation-1.1', completedAt: '2026-04-12' },
      ],
    });
    expect(result.completedSections).toHaveLength(1);
  });

  it('unit_session_status_full: accepts a fully-populated SessionStatus', () => {
    const result = SessionStatusSchema.parse(LIVE_SESSION_FIXTURE);
    expect(result.id).toBe('2026-04-11-001');
    expect(result.currentPhase).toBe('build-in-public-docs');
    expect(result.contextWindow?.iteration).toBe(1);
  });

  it('edge_input_session_complete_at_optional: object form without completedAt', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [{ section: 'wf-1.1' }],
    });
    expect(result.completedSections).toHaveLength(1);
  });

  it('sec_tampering_section_id_format: rejects malformed completedSections entries', () => {
    for (const bad of ['invalid-format', 'wf1.1', 'wf-1', 'wf-1.1.2']) {
      expect(() =>
        SessionStatusSchema.parse({
          id: 'x',
          completedSections: [bad],
        }),
      ).toThrow();
    }
  });

  it('sec_info_disclosure_required_id: rejects records missing id or with empty id', () => {
    expect(() =>
      SessionStatusSchema.parse({ completedSections: [] }),
    ).toThrow();
    expect(() =>
      SessionStatusSchema.parse({ id: '', completedSections: [] }),
    ).toThrow();
  });

  it('integration_session_yaml_parses: SessionStatusSchema accepts the live-file shape (hand-built fixture)', () => {
    // Fixture matches the structure of pipeline/active/session.yaml as of
    // 2026-04-12. Live-file integration moves to 1.2 with `yaml` install.
    const result = SessionStatusSchema.parse(LIVE_SESSION_FIXTURE);
    expect(result.id).toBe('2026-04-11-001');
    expect(Array.isArray(result.completedSections)).toBe(true);
  });
});

// ── 1.4 additions: concurrentJobs + detailed completedSections + new types ──

// Hand-built fixture exercising the 1.4 schema additions: a populated
// concurrentJobs list and a detailed completedSections entry carrying the
// snake_case fields /finish writes.
const SESSION_FIXTURE_14 = {
  id: '2026-06-09-001',
  startedAt: '2026-06-09T00:00:00Z',
  currentPhase: 'build-log-overhaul',
  currentSection: 'build-log-overhaul-1.4',
  currentAgent: 'red',
  currentStage: 'build-log-overhaul-1.4-red-complete',
  concurrentJobs: ['build-log-overhaul-3.2', 'styling-overhaul-7.5'],
  completedSections: [
    'website-foundation-1.1',
    {
      section: 'build-log-overhaul-1.3',
      completedAt: '2026-06-09',
      commit_hash: '312098c',
      commit_message: 'Add derive-live-status helper with 40 tests',
      tests: 40,
      files_new: 2,
      files_modified: 1,
      pushed: true,
      notes: 'shipped clean',
      name: 'derive-live-status helper',
    },
  ],
  notes: 'travisgautier build-log-overhaul in flight.',
};

describe('SessionStatusSchema — 1.4 concurrentJobs', () => {
  it('unit_session_concurrent_jobs_accepted: accepts and preserves a concurrentJobs array', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [],
      concurrentJobs: ['build-log-overhaul-3.2'],
    });
    expect(result.concurrentJobs).toEqual(['build-log-overhaul-3.2']);
  });

  it('unit_session_concurrent_jobs_omitted: parses with concurrentJobs omitted (optional → undefined)', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [],
    });
    expect(result.concurrentJobs).toBeUndefined();
  });

  it('edge_input_concurrent_jobs_empty_array: accepts and preserves concurrentJobs: [] (production default)', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [],
      concurrentJobs: [],
    });
    expect(result.concurrentJobs).toEqual([]);
  });

  it('sec_tampering_concurrent_jobs_must_be_string_array: rejects non-string members and non-arrays', () => {
    for (const bad of [[123], [{}], 'not-an-array', [null]]) {
      expect(() =>
        SessionStatusSchema.parse({
          id: 'x',
          completedSections: [],
          concurrentJobs: bad,
        }),
      ).toThrow();
    }
  });
});

describe('SessionStatusSchema — 1.4 detailed completedSections', () => {
  it('unit_session_detailed_snake_case_fields: accepts a detailed entry with all snake_case fields', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [
        {
          section: 'build-log-overhaul-1.3',
          completedAt: '2026-06-09',
          commit_hash: '312098c',
          commit_message: 'Add derive-live-status helper',
          tests: 40,
          files_new: 2,
          files_modified: 1,
          pushed: true,
          notes: 'shipped clean',
          name: 'derive-live-status helper',
        },
      ],
    });
    const entry = result.completedSections[0] as Record<string, unknown>;
    expect(entry.commit_hash).toBe('312098c');
    expect(entry.tests).toBe(40);
    expect(entry.pushed).toBe(true);
  });

  it('edge_input_mixed_string_and_detailed_entries: accepts an array mixing string and detailed forms', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [
        'website-foundation-1.1',
        { section: 'website-foundation-1.2', tests: 10, pushed: true },
      ],
    });
    expect(result.completedSections).toHaveLength(2);
    expect(result.completedSections[0]).toBe('website-foundation-1.1');
  });

  it('edge_input_detailed_entry_partial_fields: accepts a detailed entry with only some optional fields', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [{ section: 'website-foundation-1.1', tests: 3 }],
    });
    const entry = result.completedSections[0] as Record<string, unknown>;
    expect(entry.tests).toBe(3);
    expect(entry.commit_hash).toBeUndefined();
  });

  it('sec_tampering_section_id_still_rejected_in_detailed: SECTION_ID regex enforced even with detail fields', () => {
    for (const bad of ['not-a-section', '../etc', 'wf-1', 'wf-1.1.2']) {
      expect(() =>
        SessionStatusSchema.parse({
          id: 'x',
          completedSections: [{ section: bad, tests: 5, commit_hash: 'x' }],
        }),
      ).toThrow();
    }
  });

  it('sec_tampering_numeric_fields_reject_strings: numeric/boolean detail fields reject wrong types', () => {
    const baseSection = 'website-foundation-1.1';
    expect(() =>
      SessionStatusSchema.parse({
        id: 'x',
        completedSections: [{ section: baseSection, tests: '99' }],
      }),
    ).toThrow();
    expect(() =>
      SessionStatusSchema.parse({
        id: 'x',
        completedSections: [{ section: baseSection, files_new: '<script>' }],
      }),
    ).toThrow();
    expect(() =>
      SessionStatusSchema.parse({
        id: 'x',
        completedSections: [{ section: baseSection, files_modified: 'NaN' }],
      }),
    ).toThrow();
    expect(() =>
      SessionStatusSchema.parse({
        id: 'x',
        completedSections: [{ section: baseSection, pushed: 'yes' }],
      }),
    ).toThrow();
  });

  it('edge_input_numeric_commit_hash_accepted: accepts a YAML-coerced numeric commit_hash (e.g. 68914.0)', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [{ section: 'website-foundation-1.1', commit_hash: 68914 }],
    });
    const entry = result.completedSections[0] as Record<string, unknown>;
    expect(entry.commit_hash).toBe(68914);
  });

  it('err_safeparse_malformed_detailed_entry: safeParse returns success:false without throwing', () => {
    const result = SessionStatusSchema.safeParse({
      id: 'x',
      completedSections: [{ section: 'website-foundation-1.1', tests: 'not-a-number' }],
    });
    expect(result.success).toBe(false);
  });

  it('data_passthrough_preserves_unknown_keys: .passthrough() retains future/unknown detail fields', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [
        { section: 'website-foundation-1.1', coverage_delta: '+2.3%' },
      ],
    });
    const entry = result.completedSections[0] as Record<string, unknown>;
    expect(entry.coverage_delta).toBe('+2.3%');
  });

  it('data_numeric_fields_preserve_value: numeric detail fields round-trip as numbers with exact value', () => {
    const result = SessionStatusSchema.parse({
      id: 'x',
      completedSections: [
        { section: 'website-foundation-1.1', tests: 42, files_new: 3, files_modified: 5 },
      ],
    });
    const entry = result.completedSections[0] as Record<string, unknown>;
    expect(entry.tests).toBe(42);
    expect(typeof entry.tests).toBe('number');
    expect(entry.files_new).toBe(3);
    expect(entry.files_modified).toBe(5);
  });

  it('integration_live_session_fixture_with_concurrent_and_detailed: extended live fixture round-trips', () => {
    const result = SessionStatusSchema.parse(SESSION_FIXTURE_14);
    expect(result.concurrentJobs).toEqual([
      'build-log-overhaul-3.2',
      'styling-overhaul-7.5',
    ]);
    const detailed = result.completedSections[1] as Record<string, unknown>;
    expect(detailed.commit_hash).toBe('312098c');
    expect(detailed.tests).toBe(40);
  });
});

describe('build-log 1.4 types — CompletedSectionEntry', () => {
  it('unit_completed_section_entry_discriminated_kinds: narrows by kind tag', () => {
    const detailed: DetailedCompletedSection = {
      kind: 'detailed',
      id: 'build-log-overhaul-1.3',
      tests: 40,
      pushed: true,
    };
    const minimal: MinimalCompletedSection = {
      kind: 'minimal',
      id: 'website-foundation-1.1',
    };
    const entries: CompletedSectionEntry[] = [detailed, minimal];

    for (const entry of entries) {
      if (entry.kind === 'detailed') {
        expect(entry.id).toBeTruthy();
      } else {
        expect(entry.kind).toBe('minimal');
        expect(entry.id).toBeTruthy();
      }
    }
    expect(entries).toHaveLength(2);
  });

  it('integration_barrel_reexports_new_types: new types are usable via the @/content/schemas barrel', () => {
    const entry: CompletedSectionEntry = { kind: 'minimal', id: 'wf-1.1' };
    const detailed: DetailedCompletedSection = { kind: 'detailed', id: 'wf-1.2', tests: 5 };
    expect(entry.kind).toBe('minimal');
    expect(detailed.kind).toBe('detailed');
  });
});

// ── Unit Tests: KnowledgeFileSchema ─────────────────────────────────

describe('KnowledgeFileSchema', () => {
  it('unit_knowledge_file_minimal: accepts {} (every field optional)', () => {
    const result = KnowledgeFileSchema.parse({});
    expect(result).toBeDefined();
  });

  it('unit_knowledge_file_passthrough: accepts unknown top-level keys, preserves them', () => {
    const result = KnowledgeFileSchema.parse({
      project: 'travisgautier',
      futureKey: 'whatever',
    } as Record<string, unknown>);
    expect((result as Record<string, unknown>).futureKey).toBe('whatever');
  });

  it('edge_input_knowledge_passthrough_preserves: preserves unknown nested keys via passthrough', () => {
    const result = KnowledgeFileSchema.parse({
      version: 1,
      futureBlock: { foo: 'bar' },
    } as Record<string, unknown>);
    expect((result as Record<string, unknown>).futureBlock).toEqual({ foo: 'bar' });
  });

  it('integration_knowledge_yaml_parses: KnowledgeFileSchema accepts live-file shape (hand-built fixture)', () => {
    const result = KnowledgeFileSchema.parse(LIVE_KNOWLEDGE_FIXTURE);
    expect(result.version).toBe(1);
    expect(result.project).toBe('travisgautier');
    expect(result.projectContext?.purpose).toContain('travisgautier');
  });
});

// ── Integration: Barrel re-export ───────────────────────────────────

describe('@/content/schemas barrel: build-log re-exports', () => {
  it('integration_barrel_reexport: build-log schemas are importable via the barrel', () => {
    expect(JobSchemaBarrel).toBe(JobSchema);
    expect(JobFeatureSchemaBarrel).toBe(JobFeatureSchema);
    expect(JobPhaseSchemaBarrel).toBe(JobPhaseSchema);
    expect(SessionStatusSchemaBarrel).toBe(SessionStatusSchema);
    expect(KnowledgeFileSchemaBarrel).toBe(KnowledgeFileSchema);
  });
});

// ── Error recovery: safeParse on malformed Job ──────────────────────

describe('Build-log error recovery', () => {
  it('err_safeparse_actionable_messages: JobSchema.safeParse returns structured error', () => {
    const result = JobSchema.safeParse({ slug: 'BadSlug', features: 'not-array' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      for (const issue of result.error.issues) {
        expect(issue).toHaveProperty('path');
        expect(issue).toHaveProperty('message');
      }
    }
  });
});

// ── Data integrity ──────────────────────────────────────────────────

describe('Build-log data integrity', () => {
  it('data_sensitivity_schema_field_classification: build-log schemas only accept public-classified fields', () => {
    // All fields in build-log schemas are sourced from publicly-committed
    // currentwork/*.md and pipeline/active/*.yaml files. None carry
    // confidential/secret data. This test asserts that interfaces.yaml's
    // sensitivity classification (`public` for every field) holds at runtime
    // by verifying parse succeeds with only public fixture data.
    expect(() => JobSchema.parse(validJobFixture())).not.toThrow();
    expect(() => SessionStatusSchema.parse(LIVE_SESSION_FIXTURE)).not.toThrow();
    expect(() => KnowledgeFileSchema.parse(LIVE_KNOWLEDGE_FIXTURE)).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════════════
// storefront-auth-1.1: Product schema + validator
// ════════════════════════════════════════════════════════════════════

const VALID_PRODUCT_MINIMAL: ProductInput = {
  id: 'prod-workflow-templates',
  slug: 'workflow-templates',
  title: 'Agent Workflow Templates',
  tagline: 'The exact TDD pipeline templates behind every Travis Gautier build.',
  summary: 'A downloadable set of agent skill manifests, discovery YAML templates, and TDD phase prompts.',
  category: 'workflow-templates',
  licenseType: 'single-user',
  priceCents: 4900,
  currency: 'usd',
  stripePriceId: 'price_1ABCxyz0123456789',
  assetFilename: 'workflow-templates.zip',
  lllEntryUrls: [],
  relatedCaseIds: ['party-masters'],
  publishedAt: '2026-04-12T00:00:00Z',
};

const VALID_PRODUCT_FULL: ProductInput = {
  ...VALID_PRODUCT_MINIMAL,
  heroImageUrl: 'https://travisgautier.com/images/workflow-templates-hero.jpg',
};

// ── Unit Tests ──────────────────────────────────────────────────────

describe('ProductSchema', () => {
  it('unit_product_minimal: accepts a minimal valid record (no optional heroImageUrl)', () => {
    const result = ProductSchema.parse(VALID_PRODUCT_MINIMAL);
    expect(result.id).toBe('prod-workflow-templates');
    expect(result.slug).toBe('workflow-templates');
    expect(result.category).toBe('workflow-templates');
    expect(result.licenseType).toBe('single-user');
    expect(result.priceCents).toBe(4900);
    expect(result.currency).toBe('usd');
    expect(result.heroImageUrl).toBeUndefined();
  });

  it('unit_product_full: accepts a fully-populated record with heroImageUrl', () => {
    const result = ProductSchema.parse(VALID_PRODUCT_FULL);
    expect(result.heroImageUrl).toBe('https://travisgautier.com/images/workflow-templates-hero.jpg');
  });

  it('unit_product_input_type: ProductInput type is usable for building valid records', () => {
    const input: ProductInput = { ...VALID_PRODUCT_MINIMAL };
    const result = ProductSchema.parse(input);
    expect(result).toBeDefined();
  });

  it('unit_product_currency_lowercased: .toLowerCase() transform normalizes USD → usd', () => {
    const result = ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, currency: 'USD' });
    expect(result.currency).toBe('usd');

    const eur = ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, currency: 'Eur' });
    expect(eur.currency).toBe('eur');
  });

  it('unit_product_category_labels: PRODUCT_CATEGORY_LABELS has an entry for every PRODUCT_CATEGORIES value (exhaustive)', () => {
    for (const cat of PRODUCT_CATEGORIES) {
      expect(PRODUCT_CATEGORY_LABELS[cat as ProductCategory]).toBeDefined();
      expect(typeof PRODUCT_CATEGORY_LABELS[cat as ProductCategory]).toBe('string');
      expect(PRODUCT_CATEGORY_LABELS[cat as ProductCategory].length).toBeGreaterThan(0);
    }
    expect(Object.keys(PRODUCT_CATEGORY_LABELS).length).toBe(PRODUCT_CATEGORIES.length);
  });

  it('unit_product_license_labels: PRODUCT_LICENSE_LABELS has an entry for every PRODUCT_LICENSE_TYPES value (exhaustive)', () => {
    for (const lic of PRODUCT_LICENSE_TYPES) {
      expect(PRODUCT_LICENSE_LABELS[lic as ProductLicenseType]).toBeDefined();
      expect(typeof PRODUCT_LICENSE_LABELS[lic as ProductLicenseType]).toBe('string');
      expect(PRODUCT_LICENSE_LABELS[lic as ProductLicenseType].length).toBeGreaterThan(0);
    }
    expect(Object.keys(PRODUCT_LICENSE_LABELS).length).toBe(PRODUCT_LICENSE_TYPES.length);
  });
});

// ── Barrel re-exports ───────────────────────────────────────────────

describe('@/content/schemas barrel: Product re-exports', () => {
  it('unit_product_barrel_exports: ProductSchema, PRODUCT_CATEGORIES, PRODUCT_LICENSE_TYPES, label maps importable via barrel', () => {
    expect(ProductSchemaBarrel).toBe(ProductSchema);
    expect(PRODUCT_CATEGORIES_BARREL).toBe(PRODUCT_CATEGORIES);
    expect(PRODUCT_LICENSE_TYPES_BARREL).toBe(PRODUCT_LICENSE_TYPES);
    expect(PRODUCT_CATEGORY_LABELS_BARREL).toBe(PRODUCT_CATEGORY_LABELS);
    expect(PRODUCT_LICENSE_LABELS_BARREL).toBe(PRODUCT_LICENSE_LABELS);
  });
});

// ── Security Tests (STRIDE: Tampering, Info Disclosure) ─────────────

describe('Security: Product enum tampering', () => {
  it('sec_tampering_product_category: rejects invalid category enum value (case sensitivity, unknown, empty)', () => {
    for (const bad of ['WORKFLOW-TEMPLATES', 'unknown-cat', '', 'workflow_templates']) {
      expect(() =>
        ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, category: bad }),
      ).toThrow();
    }
  });

  it('sec_tampering_product_license: rejects invalid licenseType enum value', () => {
    for (const bad of ['enterprise', 'SINGLE-USER', '', 'free']) {
      expect(() =>
        ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, licenseType: bad }),
      ).toThrow();
    }
  });
});

describe('Security: Product slug tampering', () => {
  it('sec_tampering_product_slug: rejects slug with uppercase, underscores, spaces, or path separators', () => {
    for (const bad of ['My-Product', 'my_product', 'my product', '../etc', '', 'foo/bar']) {
      expect(() =>
        ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, slug: bad }),
      ).toThrow();
    }
  });
});

describe('Security: Product Stripe price ID tampering', () => {
  it('sec_tampering_product_stripe_price_id: rejects stripePriceId not matching ^price_[A-Za-z0-9]+$', () => {
    for (const bad of ['prod_abc123', 'PRICE_ABC', 'price_', '../price_abc', 'price_abc!@#', 'price_with spaces', 'price_under_score']) {
      expect(() =>
        ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, stripePriceId: bad }),
      ).toThrow();
    }
    // Valid: price_ + alphanumeric (no underscore in suffix per regex)
    expect(() =>
      ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, stripePriceId: 'price_1ABCxyz0123' }),
    ).not.toThrow();
  });
});

describe('Security: Product asset filename traversal', () => {
  it('sec_tampering_product_asset_filename_traversal: rejects assetFilename containing path separators or traversal attempts', () => {
    for (const bad of [
      '../etc/passwd',
      '../../secret.zip',
      'private/products/secret.zip',
      'workflow-templates/../secret',
      '\\windows\\path',
      'sub/file.zip',
      '/abs/path.zip',
      '',
    ]) {
      expect(() =>
        ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, assetFilename: bad }),
      ).toThrow();
    }
    // Valid: alphanumerics + dot/underscore/hyphen
    expect(() =>
      ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, assetFilename: 'workflow-templates.zip' }),
    ).not.toThrow();
    expect(() =>
      ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, assetFilename: 'file_v1.0.zip' }),
    ).not.toThrow();
  });
});

describe('Security: Product currency length', () => {
  it('sec_tampering_product_currency_length: rejects currency strings of wrong length', () => {
    for (const bad of ['US', 'usdd', '', 'usddd']) {
      expect(() =>
        ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, currency: bad }),
      ).toThrow();
    }
    // Valid: 3 chars (any case, normalized)
    expect(() =>
      ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, currency: 'eur' }),
    ).not.toThrow();
    expect(() =>
      ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, currency: 'GBP' }),
    ).not.toThrow();
  });
});

describe('Security: Product required field enforcement (Info Disclosure)', () => {
  it('sec_info_disclosure_product_required: rejects records missing each required field; safeParse reports failing path', () => {
    const required: (keyof ProductInput)[] = [
      'id',
      'slug',
      'title',
      'tagline',
      'summary',
      'category',
      'licenseType',
      'priceCents',
      'currency',
      'stripePriceId',
      'assetFilename',
      'lllEntryUrls',
      'relatedCaseIds',
      'publishedAt',
    ];
    for (const field of required) {
      const partial = { ...VALID_PRODUCT_MINIMAL };
      delete (partial as Record<string, unknown>)[field];
      const result = ProductSchema.safeParse(partial);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain(field);
      }
    }

    // Empty strings rejected by min(1) on required string fields
    expect(() =>
      ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, title: '' }),
    ).toThrow();
    expect(() =>
      ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, tagline: '' }),
    ).toThrow();
    expect(() =>
      ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, summary: '' }),
    ).toThrow();
  });
});

// ── Edge Case Tests ─────────────────────────────────────────────────

describe('Product edge cases: Input boundaries', () => {
  it('edge_input_product_optional_omission: accepts record with heroImageUrl omitted; result.heroImageUrl undefined', () => {
    const result = ProductSchema.parse(VALID_PRODUCT_MINIMAL);
    expect(result.heroImageUrl).toBeUndefined();
  });

  it('edge_input_product_price_boundaries: rejects 0/-1/-100/1.5; accepts 1', () => {
    for (const bad of [0, -1, -100, 1.5, 1.99]) {
      expect(() =>
        ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, priceCents: bad }),
      ).toThrow();
    }
    const minPositive = ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, priceCents: 1 });
    expect(minPositive.priceCents).toBe(1);
    const realistic = ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, priceCents: 4900 });
    expect(realistic.priceCents).toBe(4900);
  });

  it('edge_input_product_currency_mixed_case: accepts mixed-case input, normalizes to lowercase', () => {
    for (const input of ['USD', 'Eur', 'GBP', 'jpY']) {
      const result = ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, currency: input });
      expect(result.currency).toBe(input.toLowerCase());
    }
  });

  it('edge_input_product_extra_fields_stripped: unknown fields stripped from parsed result', () => {
    const withExtra = { ...VALID_PRODUCT_MINIMAL, secretAdminFlag: true, internalId: 'xxx' };
    const result = ProductSchema.parse(withExtra);
    expect(result).not.toHaveProperty('secretAdminFlag');
    expect(result).not.toHaveProperty('internalId');
    expect(result.id).toBe('prod-workflow-templates');
  });
});

describe('Product edge cases: Temporal', () => {
  it('edge_temporal_product_publishedat_format: accepts UTC Z-suffix; rejects offset and date-only', () => {
    const valid = ProductSchema.parse({
      ...VALID_PRODUCT_MINIMAL,
      publishedAt: '2026-04-12T00:00:00Z',
    });
    expect(valid.publishedAt).toBe('2026-04-12T00:00:00Z');

    expect(() =>
      ProductSchema.parse({
        ...VALID_PRODUCT_MINIMAL,
        publishedAt: '2026-04-12T00:00:00+02:00',
      }),
    ).toThrow();

    expect(() =>
      ProductSchema.parse({
        ...VALID_PRODUCT_MINIMAL,
        publishedAt: '2026-04-12',
      }),
    ).toThrow();
  });
});

// ── Error Recovery Tests ────────────────────────────────────────────

describe('Product error recovery', () => {
  it('err_safeparse_product_actionable: safeParse returns structured error with issues array containing path + message', () => {
    const invalid = {
      ...VALID_PRODUCT_MINIMAL,
      category: 'invalid-cat',
      priceCents: -1,
      stripePriceId: 'bad_price_id',
      assetFilename: '../etc/passwd',
    };
    const result = ProductSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      for (const issue of result.error.issues) {
        expect(issue).toHaveProperty('path');
        expect(issue).toHaveProperty('message');
      }
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('category');
      expect(paths).toContain('priceCents');
      expect(paths).toContain('stripePriceId');
      expect(paths).toContain('assetFilename');
    }
  });
});

// ── Data Integrity Tests ────────────────────────────────────────────

describe('Product data integrity', () => {
  it('data_consistency_product_enum_source: ProductSchema rejects category/licenseType outside canonical tuples (single source of truth)', () => {
    expect(() =>
      ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, category: 'premium' }),
    ).toThrow();
    expect(() =>
      ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, licenseType: 'enterprise' }),
    ).toThrow();
    // Every value in the tuple should be accepted
    for (const cat of PRODUCT_CATEGORIES) {
      expect(() =>
        ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, category: cat }),
      ).not.toThrow();
    }
    for (const lic of PRODUCT_LICENSE_TYPES) {
      expect(() =>
        ProductSchema.parse({ ...VALID_PRODUCT_MINIMAL, licenseType: lic }),
      ).not.toThrow();
    }
  });

  it('data_sensitivity_product_field_classification: every Product field is publicly bundlable; no field requires runtime redaction', () => {
    // Product MDX is statically rendered into the bundle. All fields,
    // including 'internal'-classification stripePriceId and assetFilename,
    // are public-readable post-build. The validator IS the content boundary;
    // no serializer/redaction layer is required for the in-process loader.
    const result = ProductSchema.parse(VALID_PRODUCT_FULL);
    expect(result).toHaveProperty('stripePriceId');
    expect(result).toHaveProperty('assetFilename');
    // No fields are stripped (default Zod object behavior preserves all schema fields)
    const expectedFields = [
      'id', 'slug', 'title', 'tagline', 'summary', 'category', 'licenseType',
      'priceCents', 'currency', 'stripePriceId', 'assetFilename', 'heroImageUrl',
      'lllEntryUrls', 'relatedCaseIds', 'publishedAt',
    ];
    for (const f of expectedFields) {
      expect(result).toHaveProperty(f);
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// cohort-enrollment-1.1: Cohort schema + validator
// ════════════════════════════════════════════════════════════════════

const VALID_COHORT_MINIMAL: CohortInput = {
  id: 'cohort-ai-delivery-2026-q3',
  slug: 'ai-delivery-2026-q3',
  title: 'AI Delivery Cohort — Fall 2026',
  series: 'AI Delivery Cohort',
  tagline: 'Ship a real client project with an agent team in six weeks.',
  summary:
    'A six-week cohort where a small group of operators each ship a real paid client project with an AI agent team. Weekly live sessions plus Slack.',
  status: 'announced',
  pillar: 'delivery',
  startDate: '2026-09-15',
  endDate: '2026-10-27',
  durationWeeks: 6,
  capacity: 15,
  priceCents: 249900,
  currency: 'usd',
  stripePriceId: 'price_1ABCxyz0123456789',
  commitmentHoursPerWeek: 8,
  publishedAt: '2026-04-12T00:00:00Z',
};

// ── Unit Tests ──────────────────────────────────────────────────────

describe('CohortSchema', () => {
  it('unit_cohort_valid_minimal: parses a minimal valid Cohort with defaults applied', () => {
    const result = CohortSchema.parse(VALID_COHORT_MINIMAL);
    expect(result.id).toBe('cohort-ai-delivery-2026-q3');
    expect(result.slug).toBe('ai-delivery-2026-q3');
    expect(result.status).toBe('announced');
    expect(result.pillar).toBe('delivery');
    expect(result.durationWeeks).toBe(6);
    expect(result.capacity).toBe(15);
    // Defaults applied for omitted array fields
    expect(result.lllEntryUrls).toEqual([]);
    expect(result.relatedEpisodeIds).toEqual([]);
    expect(result.relatedCaseIds).toEqual([]);
  });

  it('unit_cohort_missing_stripePriceId: rejects missing stripePriceId; safeParse reports stripePriceId path', () => {
    const partial = { ...VALID_COHORT_MINIMAL };
    delete (partial as Record<string, unknown>).stripePriceId;
    const result = CohortSchema.safeParse(partial);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('stripePriceId');
    }
  });

  it('unit_cohort_startDate_wrong_format: rejects non-YYYY-MM-DD startDate; error path mentions startDate', () => {
    for (const bad of ['2026/09/15', '09-15-2026', '2026-9-15', '2026-09-15T00:00:00Z', 'Sept 15 2026', '']) {
      const result = CohortSchema.safeParse({ ...VALID_COHORT_MINIMAL, startDate: bad });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain('startDate');
      }
    }
    // Valid YYYY-MM-DD passes
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, startDate: '2026-09-15' }),
    ).not.toThrow();
  });

  it('unit_cohort_currency_uppercase_rejected: rejects uppercase currency (no silent lowercase coercion)', () => {
    for (const bad of ['USD', 'Usd', 'UsD', 'EUR']) {
      expect(() =>
        CohortSchema.parse({ ...VALID_COHORT_MINIMAL, currency: bad }),
      ).toThrow();
    }
    // Lowercase passes
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, currency: 'eur' }),
    ).not.toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, currency: 'gbp' }),
    ).not.toThrow();
  });

  it('unit_cohort_durationWeeks_min_boundary: durationWeeks=0 errors (min 1); durationWeeks=1 passes', () => {
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, durationWeeks: 0 }),
    ).toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, durationWeeks: -1 }),
    ).toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, durationWeeks: 1 }),
    ).not.toThrow();
  });

  it('unit_cohort_durationWeeks_max_boundary: durationWeeks=60 errors (max 52); durationWeeks=52 passes', () => {
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, durationWeeks: 60 }),
    ).toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, durationWeeks: 53 }),
    ).toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, durationWeeks: 52 }),
    ).not.toThrow();
  });

  it('unit_cohort_capacity_min_boundary: capacity=0 errors (min 1); capacity=1 passes', () => {
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, capacity: 0 }),
    ).toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, capacity: -5 }),
    ).toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, capacity: 1 }),
    ).not.toThrow();
  });

  it('unit_cohort_pillar_invalid_enum: rejects pillar values outside CONTENT_PILLARS', () => {
    for (const bad of ['marketing', 'engineering', 'Delivery', '', 'DELIVERY']) {
      expect(() =>
        CohortSchema.parse({ ...VALID_COHORT_MINIMAL, pillar: bad }),
      ).toThrow();
    }
    // Every valid pillar value passes
    for (const valid of ['delivery', 'workflow', 'business', 'future']) {
      expect(() =>
        CohortSchema.parse({ ...VALID_COHORT_MINIMAL, pillar: valid }),
      ).not.toThrow();
    }
  });

  it('unit_cohort_status_full_rejected: status="full" errors (dropped in favor of "enrolled"); every COHORT_STATUSES value passes', () => {
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, status: 'full' }),
    ).toThrow();
    // Every valid status in the canonical tuple passes
    for (const valid of COHORT_STATUSES) {
      expect(() =>
        CohortSchema.parse({ ...VALID_COHORT_MINIMAL, status: valid }),
      ).not.toThrow();
    }
  });

  it('unit_cohort_stripePriceId_placeholder_allowed: placeholder price_REPLACE_ME_* format passes validator', () => {
    // Placeholder pattern accepted at validator boundary; checkout-time helper rejects it.
    expect(() =>
      CohortSchema.parse({
        ...VALID_COHORT_MINIMAL,
        stripePriceId: 'price_REPLACE_ME_ai-delivery-2026-q3',
      }),
    ).not.toThrow();
    expect(() =>
      CohortSchema.parse({
        ...VALID_COHORT_MINIMAL,
        stripePriceId: 'price_REPLACE_ME_workflow-mastery-2026-q4',
      }),
    ).not.toThrow();
    // Real price ID also passes
    expect(() =>
      CohortSchema.parse({
        ...VALID_COHORT_MINIMAL,
        stripePriceId: 'price_1ABCxyz0123',
      }),
    ).not.toThrow();
    // Bad formats still rejected
    for (const bad of ['prod_abc', 'PRICE_abc', 'price_', 'price abc', 'price_!@#']) {
      expect(() =>
        CohortSchema.parse({ ...VALID_COHORT_MINIMAL, stripePriceId: bad }),
      ).toThrow();
    }
  });

  it('unit_cohort_summary_min_length: summary <20 chars errors; exactly 20 chars passes; 800 chars passes; 801 errors', () => {
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, summary: 'short' }),
    ).toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, summary: 'x'.repeat(19) }),
    ).toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, summary: 'x'.repeat(20) }),
    ).not.toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, summary: 'x'.repeat(800) }),
    ).not.toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, summary: 'x'.repeat(801) }),
    ).toThrow();
  });

  it('unit_cohort_label_maps_round_trip: every COHORT_STATUSES value has a COHORT_STATUS_LABELS + COHORT_STATUS_DESCRIPTIONS entry', () => {
    for (const status of COHORT_STATUSES) {
      expect(COHORT_STATUS_LABELS[status as CohortStatus]).toBeDefined();
      expect(typeof COHORT_STATUS_LABELS[status as CohortStatus]).toBe('string');
      expect(COHORT_STATUS_LABELS[status as CohortStatus].length).toBeGreaterThan(0);

      expect(COHORT_STATUS_DESCRIPTIONS[status as CohortStatus]).toBeDefined();
      expect(typeof COHORT_STATUS_DESCRIPTIONS[status as CohortStatus]).toBe('string');
      expect(COHORT_STATUS_DESCRIPTIONS[status as CohortStatus].length).toBeGreaterThan(0);
    }
    expect(Object.keys(COHORT_STATUS_LABELS).length).toBe(COHORT_STATUSES.length);
    expect(Object.keys(COHORT_STATUS_DESCRIPTIONS).length).toBe(COHORT_STATUSES.length);
  });
});

// ── Barrel re-exports ───────────────────────────────────────────────

describe('@/content/schemas barrel: Cohort re-exports', () => {
  it('unit_cohort_barrel_exports: CohortSchema, COHORT_STATUSES, COHORT_STATUS_LABELS, COHORT_STATUS_DESCRIPTIONS importable via barrel', () => {
    expect(CohortSchemaBarrel).toBe(CohortSchema);
    expect(COHORT_STATUSES_BARREL).toBe(COHORT_STATUSES);
    expect(COHORT_STATUS_LABELS_BARREL).toBe(COHORT_STATUS_LABELS);
    expect(COHORT_STATUS_DESCRIPTIONS_BARREL).toBe(COHORT_STATUS_DESCRIPTIONS);
  });
});

// ── Edge Case Tests ─────────────────────────────────────────────────

describe('Cohort edge cases: Input boundaries', () => {
  it('edge_cohort_empty_arrays_default: lllEntryUrls/relatedEpisodeIds/relatedCaseIds default to [] when omitted', () => {
    const result = CohortSchema.parse(VALID_COHORT_MINIMAL);
    expect(result.lllEntryUrls).toEqual([]);
    expect(result.relatedEpisodeIds).toEqual([]);
    expect(result.relatedCaseIds).toEqual([]);
  });

  it('edge_cohort_durationWeeks_boundary_52: durationWeeks at min=1 and max=52 both pass', () => {
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, durationWeeks: 1 }),
    ).not.toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, durationWeeks: 52 }),
    ).not.toThrow();
  });

  it('edge_cohort_capacity_upper_boundary: capacity=500 passes; capacity=501 errors', () => {
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, capacity: 500 }),
    ).not.toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, capacity: 501 }),
    ).toThrow();
    expect(() =>
      CohortSchema.parse({ ...VALID_COHORT_MINIMAL, capacity: 1000 }),
    ).toThrow();
  });
});

// ── Error Recovery Tests ────────────────────────────────────────────

describe('Cohort error recovery', () => {
  it('err_cohort_invalid_data_safeparse: safeParse on malformed object returns { success: false } with multiple issues', () => {
    // Object missing several required fields AND with invalid values for several others
    const malformed = {
      id: '',
      slug: 'INVALID SLUG',
      title: '',
      summary: 'too short',
      status: 'full',
      pillar: 'marketing',
      startDate: '09/15/2026',
      currency: 'USD',
      durationWeeks: 0,
      capacity: 0,
      stripePriceId: 'prod_abc',
      // missing: series, tagline, endDate, priceCents, commitmentHoursPerWeek, publishedAt
    };
    const result = CohortSchema.safeParse(malformed);
    expect(result.success).toBe(false);
    if (!result.success) {
      // At least 5 distinct issues accumulated — caller can render field-level errors
      expect(result.error.issues.length).toBeGreaterThanOrEqual(5);
    }
  });
});

// ── Data Integrity Tests ────────────────────────────────────────────

describe('Cohort data integrity', () => {
  it('data_cohort_round_trip: parse→re-parse is idempotent; defaults stabilize after first pass', () => {
    const first = CohortSchema.parse(VALID_COHORT_MINIMAL);
    const second = CohortSchema.parse(first);
    expect(second).toEqual(first);
    // Defaults are present and stable
    expect(first.lllEntryUrls).toEqual([]);
    expect(second.lllEntryUrls).toEqual([]);
  });

  it('data_cohort_satisfies_interface: CohortSchema output is assignable to Cohort type (compile-time + runtime smoke)', () => {
    // Compile-time: this block type-checks only if CohortSchema.parse returns
    // a structure assignable to Cohort (via `satisfies z.ZodType<Cohort>`).
    // Runtime: verifies every required Cohort field is present in parsed output.
    const parsed = CohortSchema.parse(VALID_COHORT_MINIMAL);
    const expectedFields = [
      'id', 'slug', 'title', 'series', 'tagline', 'summary', 'status', 'pillar',
      'startDate', 'endDate', 'durationWeeks', 'capacity', 'priceCents', 'currency',
      'stripePriceId', 'commitmentHoursPerWeek', 'lllEntryUrls',
      'relatedEpisodeIds', 'relatedCaseIds', 'publishedAt',
    ];
    for (const f of expectedFields) {
      expect(parsed).toHaveProperty(f);
    }
  });
});

// ════════════════════════════════════════════════════════════════════
// cohort-enrollment-3.1: CohortApplicationInputSchema
// ════════════════════════════════════════════════════════════════════

// Imports for ce-3.1 (placed at bottom to avoid disturbing earlier ordering).
import {
  CohortApplicationInputSchema,
} from '@/content/schemas/validators';
import {
  CohortApplicationInputSchema as CohortApplicationInputSchemaBarrel,
} from '@/content/schemas';
import {
  APPLICATION_COMMITMENT_LEVELS,
  type CohortApplicationInput,
} from '@/content/schemas/cohort-application';
import { CONTENT_PILLARS } from '@/content/schemas/content-pillar';

const VALID_APPLICATION_MINIMAL: CohortApplicationInput = {
  cohortSlug: 'workflow-mastery-2026-q4',
  background:
    "I'm a senior engineer at a fintech startup with five years of full-stack " +
    'experience. I have shipped multiple production systems including an internal ' +
    'CRM and a data pipeline that processes a million records a day. I want to ' +
    'understand how AI agent teams change the shape of that work in practice.',
  goals:
    'Ship one production-grade feature using an AI agent team during the cohort, ' +
    'and measure delivery throughput against my baseline.',
  commitmentLevel: 'standard',
  commitmentHours: 8,
  timezone: 'America/New_York',
  pillarInterest: 'workflow',
};

const STR = (n: number) => 'x'.repeat(n);

// ── Unit Tests ──────────────────────────────────────────────────────

describe('CohortApplicationInputSchema (ce-3.1)', () => {
  it('unit_schema_minimal_valid_input_passes: accepts a minimal valid input (all required fields, no referralSource)', () => {
    const result = CohortApplicationInputSchema.parse(VALID_APPLICATION_MINIMAL);
    expect(result.cohortSlug).toBe('workflow-mastery-2026-q4');
    expect(result.commitmentLevel).toBe('standard');
    expect(result.commitmentHours).toBe(8);
    expect(result.pillarInterest).toBe('workflow');
    expect(result.referralSource).toBeUndefined();
  });

  it('unit_schema_referral_source_optional_passes: accepts a valid 200-char referralSource', () => {
    const result = CohortApplicationInputSchema.parse({
      ...VALID_APPLICATION_MINIMAL,
      referralSource: STR(200),
    });
    expect(result.referralSource).toBe(STR(200));
  });

  it("unit_schema_referral_source_empty_string_transforms_to_undefined: referralSource: '' parses and resolves to undefined", () => {
    const result = CohortApplicationInputSchema.parse({
      ...VALID_APPLICATION_MINIMAL,
      referralSource: '',
    });
    expect(result.referralSource).toBeUndefined();
  });

  it("unit_schema_commitment_level_enum_accepts_light_standard_intense: each of 'light' / 'standard' / 'intense' is accepted as commitmentLevel", () => {
    for (const level of APPLICATION_COMMITMENT_LEVELS) {
      const result = CohortApplicationInputSchema.parse({
        ...VALID_APPLICATION_MINIMAL,
        commitmentLevel: level,
      });
      expect(result.commitmentLevel).toBe(level);
    }
  });

  it('unit_schema_pillar_interest_enum_accepts_all_pillars: each of delivery / workflow / business / future is accepted as pillarInterest', () => {
    for (const pillar of CONTENT_PILLARS) {
      const result = CohortApplicationInputSchema.parse({
        ...VALID_APPLICATION_MINIMAL,
        pillarInterest: pillar,
      });
      expect(result.pillarInterest).toBe(pillar);
    }
  });

  it("unit_schema_timezone_valid_iana_passes: accepts 'America/New_York' as timezone", () => {
    const result = CohortApplicationInputSchema.parse({
      ...VALID_APPLICATION_MINIMAL,
      timezone: 'America/New_York',
    });
    expect(result.timezone).toBe('America/New_York');
  });

  it("unit_schema_timezone_gmt_offset_passes: accepts 'GMT+5' and 'UTC-08' as timezone", () => {
    for (const tz of ['GMT+5', 'UTC-08']) {
      const result = CohortApplicationInputSchema.parse({
        ...VALID_APPLICATION_MINIMAL,
        timezone: tz,
      });
      expect(result.timezone).toBe(tz);
    }
  });

  it('unit_schema_input_type_inference: parsed output is assignable to CohortApplicationInput interface', () => {
    // The schema's z.input is permissive (commitmentHours: unknown via coerce,
    // referralSource: unknown via preprocess) and intentionally does not match
    // the interface. The right invariant is that the PARSED output type matches
    // the hand-written interface — already enforced by `satisfies
    // z.ZodType<CohortApplicationInput>` on the schema declaration. This test
    // exercises that round-trip at runtime.
    const interfaceShaped: CohortApplicationInput = { ...VALID_APPLICATION_MINIMAL };
    const result = CohortApplicationInputSchema.parse(interfaceShaped);
    const back: CohortApplicationInput = result;
    expect(back.cohortSlug).toBe(VALID_APPLICATION_MINIMAL.cohortSlug);
  });
});

describe('CohortApplicationInputSchema barrel integration', () => {
  it('infra_validators_module_barrel_wired: CohortApplicationInputSchema importable via @/content/schemas barrel', () => {
    expect(CohortApplicationInputSchemaBarrel).toBeDefined();
    const result = CohortApplicationInputSchemaBarrel.parse(VALID_APPLICATION_MINIMAL);
    expect(result.cohortSlug).toBe(VALID_APPLICATION_MINIMAL.cohortSlug);
  });
});

// ── Security Tests (STRIDE: Tampering + DoS) ────────────────────────

describe('CohortApplicationInputSchema security (ce-3.1)', () => {
  it("sec_tampering_invalid_commitment_level_rejected: commitmentLevel = 'maybe' is rejected at the validator boundary", () => {
    const result = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      commitmentLevel: 'maybe',
    });
    expect(result.success).toBe(false);
  });

  it("sec_tampering_invalid_pillar_interest_rejected: pillarInterest = 'marketing' is rejected (not in CONTENT_PILLARS)", () => {
    const result = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      pillarInterest: 'marketing',
    });
    expect(result.success).toBe(false);
  });

  it('sec_tampering_cohort_slug_must_be_kebab_lowercase: uppercase, whitespace, and SQL-injection-shaped slugs rejected', () => {
    const vectors = ['UPPER', 'has spaces', "sql'; DROP TABLE--", 'with_underscore', 'has.dot'];
    for (const v of vectors) {
      const result = CohortApplicationInputSchema.safeParse({
        ...VALID_APPLICATION_MINIMAL,
        cohortSlug: v,
      });
      expect(result.success, `Expected slug "${v}" to be rejected`).toBe(false);
    }
  });

  it('sec_dos_background_max_length_enforced: background of 5000 characters is rejected with "under 2000 characters" message', () => {
    const result = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      background: STR(5000),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' | ');
      expect(messages.toLowerCase()).toMatch(/under 2000/);
    }
  });

  it('sec_dos_referral_source_max_length_enforced: referralSource of 500 characters is rejected with "max 200" message', () => {
    const result = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      referralSource: STR(500),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' | ');
      expect(messages.toLowerCase()).toMatch(/max 200/);
    }
  });

  it("sec_tampering_timezone_regex_rejects_special_chars: 'bad!zone' and '<script>' rejected by timezone regex", () => {
    const vectors = ['bad!zone', '<script>alert(1)</script>', 'has spaces', 'America$NewYork'];
    for (const v of vectors) {
      const result = CohortApplicationInputSchema.safeParse({
        ...VALID_APPLICATION_MINIMAL,
        timezone: v,
      });
      expect(result.success, `Expected timezone "${v}" to be rejected`).toBe(false);
    }
  });
});

// ── Edge Case Tests (input boundaries + FormData coercion) ──────────

describe('CohortApplicationInputSchema edge cases (ce-3.1)', () => {
  it('edge_input_background_at_min_boundary: background of exactly 80 chars passes; 79 chars fails', () => {
    const ok = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      background: STR(80),
    });
    expect(ok.success).toBe(true);

    const tooShort = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      background: STR(79),
    });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      const messages = tooShort.error.issues.map((i) => i.message).join(' | ');
      expect(messages.toLowerCase()).toMatch(/at least a couple of sentences/);
    }
  });

  it('edge_input_background_at_max_boundary: background of exactly 2000 chars passes; 2001 fails', () => {
    const ok = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      background: STR(2000),
    });
    expect(ok.success).toBe(true);

    const tooLong = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      background: STR(2001),
    });
    expect(tooLong.success).toBe(false);
  });

  it('edge_input_goals_at_min_boundary: goals of exactly 40 chars passes; 20 chars fails', () => {
    const ok = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      goals: STR(40),
    });
    expect(ok.success).toBe(true);

    const tooShort = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      goals: STR(20),
    });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      const messages = tooShort.error.issues.map((i) => i.message).join(' | ');
      expect(messages.toLowerCase()).toMatch(/at least one concrete outcome/);
    }
  });

  it("edge_input_commitment_hours_formdata_string_coerces: commitmentHours = '8' (string) is coerced to number 8 and passes", () => {
    const result = CohortApplicationInputSchema.parse({
      ...VALID_APPLICATION_MINIMAL,
      // FormData delivers everything as strings — schema must coerce
      commitmentHours: '8' as unknown as number,
    });
    expect(result.commitmentHours).toBe(8);
    expect(typeof result.commitmentHours).toBe('number');
  });

  it('edge_input_commitment_hours_zero_rejected: commitmentHours = 0 fails with "at least 1 hour" message', () => {
    const result = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      commitmentHours: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' | ');
      expect(messages.toLowerCase()).toMatch(/at least 1 hour/);
    }
  });

  it('edge_input_commitment_hours_over_max_rejected: commitmentHours = 100 fails with "max 80 hours" message', () => {
    const result = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      commitmentHours: 100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(' | ');
      expect(messages.toLowerCase()).toMatch(/max 80 hours/);
    }
  });

  it('edge_input_commitment_hours_fractional_rejected: commitmentHours = 8.5 fails (int constraint)', () => {
    const result = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      commitmentHours: 8.5,
    });
    expect(result.success).toBe(false);
  });

  it('edge_input_referral_source_at_max_boundary: referralSource of exactly 200 chars passes; 201 fails', () => {
    const ok = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      referralSource: STR(200),
    });
    expect(ok.success).toBe(true);

    const tooLong = CohortApplicationInputSchema.safeParse({
      ...VALID_APPLICATION_MINIMAL,
      referralSource: STR(201),
    });
    expect(tooLong.success).toBe(false);
  });
});

// ── Error Recovery Tests ────────────────────────────────────────────

describe('CohortApplicationInputSchema error recovery (ce-3.1)', () => {
  it('err_safe_parse_returns_aggregated_errors: safeParse on multi-bad-field input returns >= 3 issues with .path identifying each', () => {
    const result = CohortApplicationInputSchema.safeParse({
      cohortSlug: 'UPPER',
      background: STR(10),
      goals: STR(5),
      commitmentLevel: 'maybe',
      commitmentHours: 0,
      timezone: 'bad!zone',
      pillarInterest: 'marketing',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
      const paths = result.error.issues.map((i) => i.path.join('.'));
      // At least three distinct field paths should appear
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBeGreaterThanOrEqual(3);
    }
  });
});

// ── Data Integrity Tests ────────────────────────────────────────────

describe('CohortApplicationInputSchema data integrity (ce-3.1)', () => {
  it('data_consistency_schema_satisfies_typescript_interface: parsed output satisfies CohortApplicationInput (compile + runtime)', () => {
    // Compile-time: the `satisfies z.ZodType<CohortApplicationInput>` clause in
    // validators.ts means parse() output is assignable to CohortApplicationInput.
    const parsed: CohortApplicationInput = CohortApplicationInputSchema.parse(
      VALID_APPLICATION_MINIMAL,
    );
    // Runtime: every required field exists.
    const requiredFields: ReadonlyArray<keyof CohortApplicationInput> = [
      'cohortSlug',
      'background',
      'goals',
      'commitmentLevel',
      'commitmentHours',
      'timezone',
      'pillarInterest',
    ];
    for (const f of requiredFields) {
      expect(parsed).toHaveProperty(f);
    }
  });

  it('data_consistency_zod_enum_aligned_with_db_check: Zod commitmentLevel enum sourced from APPLICATION_COMMITMENT_LEVELS (same tuple Drizzle schema.ts feeds the CHECK clause)', () => {
    // Cross-section invariant: the same `as const` tuple used to build the
    // Drizzle CHECK constraint is what the Zod validator enforces, so the two
    // can't drift. We verify here by asserting (a) every value in the tuple
    // round-trips through the schema, and (b) any other plausible string fails.
    for (const level of APPLICATION_COMMITMENT_LEVELS) {
      const ok = CohortApplicationInputSchema.safeParse({
        ...VALID_APPLICATION_MINIMAL,
        commitmentLevel: level,
      });
      expect(ok.success, `Tuple value "${level}" must pass`).toBe(true);
    }
    // Strings the planning doc proposed but the DB does not allow
    for (const phantom of ['exploring', 'serious', 'all-in']) {
      const result = CohortApplicationInputSchema.safeParse({
        ...VALID_APPLICATION_MINIMAL,
        commitmentLevel: phantom,
      });
      expect(result.success, `Non-tuple value "${phantom}" must fail`).toBe(false);
    }
  });
});
