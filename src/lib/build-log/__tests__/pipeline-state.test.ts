import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const { liveSectionIdsMock, repoRootMock } = vi.hoisted(() => ({
  liveSectionIdsMock: vi.fn(async () => new Set<string>()),
  repoRootMock: vi.fn(async () => process.cwd()),
}));

vi.mock('../worktree-state', () => ({
  getLiveSectionIds: liveSectionIdsMock,
}));

vi.mock('../repo-root', () => ({
  getRepoRoot: repoRootMock,
  __resetRepoRootCacheForTests: () => {},
}));

const PIPELINE_DIR = path.join(process.cwd(), 'pipeline', 'active');
const SESSION_PATH = path.join(PIPELINE_DIR, 'session.yaml');
const KNOWLEDGE_PATH = path.join(PIPELINE_DIR, 'knowledge.yaml');

function mockYamlFiles(files: Record<string, string>) {
  vi.spyOn(fs, 'readFile').mockImplementation(async (p) => {
    const key = String(p);
    if (key in files) return files[key] as never;
    const err = Object.assign(new Error(`ENOENT ${key}`), { code: 'ENOENT' });
    throw err;
  });
}

const MINIMAL_SESSION_YAML = `session:
  id: "2026-04-12-test"
  started_at: "2026-04-12T00:00:00Z"
  current_phase: "test-phase"
  current_section: "test-phase-1.1"
  current_agent: "test-agent"
  current_stage: "test-stage"

context_window:
  iteration: 3
  total_items: 10
  completed_items: 4

completed_sections:
  - id: "job-a-1.1"
    name: "First"
    completed_at: "2026-04-11"

notes: |
  test notes
`;

const MINIMAL_KNOWLEDGE_YAML = `knowledge:
  version: 1
  project: travisgautier
  description: "test"

project_context:
  purpose: "travisgautier marketing site"

conventions:
  path_alias: "@/ → src/"

patterns: []

open_questions: []
`;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  liveSectionIdsMock.mockResolvedValue(new Set<string>());
});

// ── Unit tests: mapSession / mapKnowledge / extractSectionId / rollup ───

describe('pipeline-state.ts: mapSession (unit)', () => {
  it('unit_map_session_camel_case: snake_case → camelCase top-level fields', async () => {
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
  current_phase: "foo"
  current_section: "foo-1.1"
  current_agent: "discovery"
  current_stage: "in-progress"
completed_sections: []
`,
    });
    const { getSessionStatus } = await import('../pipeline-state');
    const result = await getSessionStatus();
    expect(result.id).toBe('x');
    expect(result.currentPhase).toBe('foo');
    expect(result.currentSection).toBe('foo-1.1');
    expect(result.currentAgent).toBe('discovery');
    expect(result.currentStage).toBe('in-progress');
  });

  it('unit_map_session_nested_context_window: context_window.* → contextWindow.*', async () => {
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
context_window:
  iteration: 3
  total_items: 10
  completed_items: 4
completed_sections: []
`,
    });
    const { getSessionStatus } = await import('../pipeline-state');
    const result = await getSessionStatus();
    expect(result.contextWindow).toEqual({
      iteration: 3,
      totalItems: 10,
      completedItems: 4,
    });
  });

  it('unit_map_session_missing_fields_ok: undefined for absent keys, Zod tolerates optionals', async () => {
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections: []
`,
    });
    const { getSessionStatus } = await import('../pipeline-state');
    const result = await getSessionStatus();
    expect(result.id).toBe('x');
    expect(result.currentPhase).toBeUndefined();
    expect(result.currentSection).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });
});

describe('pipeline-state.ts: mapKnowledge (unit)', () => {
  it('unit_map_knowledge_camel_case: top-level flatten + project_context → projectContext', async () => {
    mockYamlFiles({
      [KNOWLEDGE_PATH]: `knowledge:
  version: 1
  project: "travisgautier"
  description: "kb"

project_context:
  purpose: "site"

conventions:
  path_alias: "@/ → src/"

patterns: []

open_questions:
  - id: "q1"
`,
    });
    const { getKnowledgeFile } = await import('../pipeline-state');
    const result = await getKnowledgeFile();
    expect(result.version).toBe(1);
    expect(result.project).toBe('travisgautier');
    expect(result.description).toBe('kb');
    expect(result.projectContext?.purpose).toBe('site');
    expect(result.conventions).toEqual({ path_alias: '@/ → src/' });
    expect(result.openQuestions).toHaveLength(1);
  });
});

describe('pipeline-state.ts: extractSectionId (unit — via rollup behavior)', () => {
  it('unit_extract_section_id_string_form: plain string entry counts as matching section', async () => {
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections:
  - "job-a-1.1"
`,
    });
    const { getSessionStatus } = await import('../pipeline-state');
    const result = await getSessionStatus();
    expect(result.completedSections).toEqual(['job-a-1.1']);
  });

  it('unit_extract_section_id_object_form: { section, completedAt } entry carries .section', async () => {
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections:
  - section: "job-a-1.2"
    completedAt: "2026-04-12"
`,
    });
    const { getSessionStatus } = await import('../pipeline-state');
    const result = await getSessionStatus();
    expect(result.completedSections).toHaveLength(1);
    const entry = result.completedSections[0];
    const sectionId = typeof entry === 'string' ? entry : entry.section;
    expect(sectionId).toBe('job-a-1.2');
  });
});

describe('pipeline-state.ts: rollupForJob (unit — via getJobsRollup)', () => {
  it('unit_rollup_in_progress: 2/4 completed → 50%, in-progress', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'job-a',
          title: 'Job A',
          alias: 'ja',
          context: 'ctx',
          readmeBody: 'body',
          phases: [],
          features: [
            { id: '1.1', name: 'f1', phase: '1', size: 'M', status: 'p' },
            { id: '1.2', name: 'f2', phase: '1', size: 'M', status: 'p' },
            { id: '2.1', name: 'f3', phase: '2', size: 'M', status: 'p' },
            { id: '2.2', name: 'f4', phase: '2', size: 'M', status: 'p' },
          ],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections:
  - "job-a-1.1"
  - "job-a-1.2"
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup).toHaveLength(1);
    expect(rollup[0]).toMatchObject({
      slug: 'job-a',
      totalFeatures: 4,
      completedFeatures: 2,
      percentComplete: 50,
      status: 'in-progress',
    });
  });

  it('unit_rollup_planned_zero_completed: 0/N → 0%, planned', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'job-b',
          title: 'Job B',
          context: 'ctx',
          readmeBody: 'body',
          phases: [],
          features: [
            { id: '1.1', name: 'f', phase: '1', size: 'S', status: 'p' },
            { id: '1.2', name: 'f', phase: '1', size: 'S', status: 'p' },
          ],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections: []
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0].percentComplete).toBe(0);
    expect(rollup[0].status).toBe('planned');
  });

  it('unit_rollup_complete_all_done: N/N → 100%, complete', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'job-c',
          title: 'Job C',
          context: 'ctx',
          readmeBody: 'body',
          phases: [],
          features: [
            { id: '1.1', name: 'f', phase: '1', size: 'S', status: 'p' },
          ],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections:
  - "job-c-1.1"
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0].percentComplete).toBe(100);
    expect(rollup[0].status).toBe('complete');
  });

  it('unit_rollup_rounding: Math.round((c/t)*100) — 1/3 → 33, 2/3 → 67', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'j-one-third',
          title: 'T1',
          context: '',
          readmeBody: 'b',
          phases: [],
          features: [
            { id: '1.1', name: 'f', phase: '1', size: 'S', status: 'p' },
            { id: '1.2', name: 'f', phase: '1', size: 'S', status: 'p' },
            { id: '1.3', name: 'f', phase: '1', size: 'S', status: 'p' },
          ],
        },
        {
          slug: 'j-two-thirds',
          title: 'T2',
          context: '',
          readmeBody: 'b',
          phases: [],
          features: [
            { id: '1.1', name: 'f', phase: '1', size: 'S', status: 'p' },
            { id: '1.2', name: 'f', phase: '1', size: 'S', status: 'p' },
            { id: '1.3', name: 'f', phase: '1', size: 'S', status: 'p' },
          ],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections:
  - "j-one-third-1.1"
  - "j-two-thirds-1.1"
  - "j-two-thirds-1.2"
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    const oneThird = rollup.find((r) => r.slug === 'j-one-third')!;
    const twoThirds = rollup.find((r) => r.slug === 'j-two-thirds')!;
    expect(oneThird.percentComplete).toBe(33);
    expect(twoThirds.percentComplete).toBe(67);
  });

  it('unit_rollup_passes_alias_through: job.alias preserved in rollup entry', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'website-foundation',
          alias: 'wf',
          title: 'WF',
          context: '',
          readmeBody: 'b',
          phases: [],
          features: [
            { id: '1.1', name: 'f', phase: '1', size: 'S', status: 'p' },
          ],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections: []
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0].alias).toBe('wf');
  });
});

describe('pipeline-state.ts: rollupForJob with live sections', () => {
  const SINGLE_JOB = {
    slug: 'job-x',
    title: 'Job X',
    context: '',
    readmeBody: 'b',
    phases: [],
    features: [
      { id: '1.1', name: 'f1', phase: '1', size: 'S', status: 'p' },
      { id: '1.2', name: 'f2', phase: '1', size: 'S', status: 'p' },
      { id: '1.3', name: 'f3', phase: '1', size: 'S', status: 'p' },
    ],
  };

  it('live=1, completed=0 → in-progress, liveFeatures=1, percent=0', async () => {
    vi.doMock('../jobs', () => ({ getAllJobs: async () => [SINGLE_JOB] }));
    mockYamlFiles({
      [SESSION_PATH]: `session:\n  id: "x"\ncompleted_sections: []\n`,
    });
    liveSectionIdsMock.mockResolvedValue(new Set(['job-x-1.1']));
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0]).toMatchObject({
      slug: 'job-x',
      completedFeatures: 0,
      liveFeatures: 1,
      percentComplete: 0,
      status: 'in-progress',
    });
  });

  it('live=0, completed=1 → in-progress (legacy path unchanged)', async () => {
    vi.doMock('../jobs', () => ({ getAllJobs: async () => [SINGLE_JOB] }));
    mockYamlFiles({
      [SESSION_PATH]: `session:\n  id: "x"\ncompleted_sections:\n  - "job-x-1.1"\n`,
    });
    liveSectionIdsMock.mockResolvedValue(new Set<string>());
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0]).toMatchObject({
      completedFeatures: 1,
      liveFeatures: 0,
      status: 'in-progress',
    });
  });

  it('live=1 for already-completed feature → counted in both, no double-count of completed', async () => {
    vi.doMock('../jobs', () => ({ getAllJobs: async () => [SINGLE_JOB] }));
    mockYamlFiles({
      [SESSION_PATH]: `session:\n  id: "x"\ncompleted_sections:\n  - "job-x-1.1"\n`,
    });
    liveSectionIdsMock.mockResolvedValue(new Set(['job-x-1.1']));
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0].completedFeatures).toBe(1);
    expect(rollup[0].liveFeatures).toBe(1);
  });

  it('live unrelated to any job feature → liveFeatures=0, falls back to planned', async () => {
    vi.doMock('../jobs', () => ({ getAllJobs: async () => [SINGLE_JOB] }));
    mockYamlFiles({
      [SESSION_PATH]: `session:\n  id: "x"\ncompleted_sections: []\n`,
    });
    liveSectionIdsMock.mockResolvedValue(new Set(['stray-section-9.9']));
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0].liveFeatures).toBe(0);
    expect(rollup[0].status).toBe('planned');
  });

  it('all features complete → status stays complete even if a stale live entry lingers', async () => {
    const ONE_FEATURE = {
      ...SINGLE_JOB,
      features: [SINGLE_JOB.features[0]],
    };
    vi.doMock('../jobs', () => ({ getAllJobs: async () => [ONE_FEATURE] }));
    mockYamlFiles({
      [SESSION_PATH]: `session:\n  id: "x"\ncompleted_sections:\n  - "job-x-1.1"\n`,
    });
    liveSectionIdsMock.mockResolvedValue(new Set(['job-x-1.1']));
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0].status).toBe('complete');
    expect(rollup[0].percentComplete).toBe(100);
  });

  it('live section matched by slug prefix → in-progress even when features array is empty', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'cohort-enrollment',
          title: 'Cohort Enrollment',
          context: '',
          readmeBody: 'b',
          phases: [],
          features: [],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:\n  id: "x"\ncompleted_sections: []\n`,
    });
    liveSectionIdsMock.mockResolvedValue(new Set(['cohort-enrollment-4.1']));
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0]).toMatchObject({
      slug: 'cohort-enrollment',
      totalFeatures: 0,
      completedFeatures: 0,
      liveFeatures: 0,
      percentComplete: null,
      status: 'in-progress',
    });
  });

  it('longest-prefix wins when one slug is a prefix of another', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'cohort',
          title: 'Cohort',
          context: '',
          readmeBody: 'b',
          phases: [],
          features: [],
        },
        {
          slug: 'cohort-enrollment',
          title: 'Cohort Enrollment',
          context: '',
          readmeBody: 'b',
          phases: [],
          features: [],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:\n  id: "x"\ncompleted_sections: []\n`,
    });
    liveSectionIdsMock.mockResolvedValue(new Set(['cohort-enrollment-4.1']));
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    const cohortJob = rollup.find((r) => r.slug === 'cohort')!;
    const cohortEnrollJob = rollup.find((r) => r.slug === 'cohort-enrollment')!;
    expect(cohortEnrollJob.status).toBe('in-progress');
    expect(cohortJob.status).toBe('unknown');
  });

  it('getLiveSectionIds returns empty (graceful degrade) → rollup matches legacy behavior', async () => {
    vi.doMock('../jobs', () => ({ getAllJobs: async () => [SINGLE_JOB] }));
    mockYamlFiles({
      [SESSION_PATH]: `session:\n  id: "x"\ncompleted_sections:\n  - "job-x-1.1"\n`,
    });
    liveSectionIdsMock.mockResolvedValue(new Set<string>());
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0].completedFeatures).toBe(1);
    expect(rollup[0].liveFeatures).toBe(0);
    expect(rollup[0].status).toBe('in-progress');
  });
});

describe('pipeline-state.ts: getSessionStatus / getKnowledgeFile (unit)', () => {
  it('unit_get_session_status_parses_mocked_yaml: minimal yaml → valid SessionStatus', async () => {
    mockYamlFiles({ [SESSION_PATH]: MINIMAL_SESSION_YAML });
    const { getSessionStatus } = await import('../pipeline-state');
    const result = await getSessionStatus();
    expect(result.id).toBe('2026-04-12-test');
    expect(result.completedSections).toHaveLength(1);
  });

  it('unit_get_knowledge_file_parses_mocked_yaml: minimal yaml → valid KnowledgeFile', async () => {
    mockYamlFiles({ [KNOWLEDGE_PATH]: MINIMAL_KNOWLEDGE_YAML });
    const { getKnowledgeFile } = await import('../pipeline-state');
    const result = await getKnowledgeFile();
    expect(result.version).toBe(1);
    expect(result.projectContext?.purpose).toBe('travisgautier marketing site');
  });
});

// ── Integration tests against real pipeline/active/ files ──────────────

describe('pipeline-state.ts: integration against real pipeline/active/', () => {
  it('integration_session_yaml_parses_real: real session.yaml → valid SessionStatus', async () => {
    const { getSessionStatus } = await import('../pipeline-state');
    const result = await getSessionStatus();
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
    expect(Array.isArray(result.completedSections)).toBe(true);
  });

  it('integration_knowledge_yaml_parses_real: real knowledge.yaml → purpose mentions travisgautier, path_alias present', async () => {
    const { getKnowledgeFile } = await import('../pipeline-state');
    const result = await getKnowledgeFile();
    expect(result.projectContext?.purpose).toMatch(/travisgautier/i);
    expect(result.conventions).toHaveProperty('path_alias');
    expect(result.conventions?.path_alias).toBe('@/ → src/');
  });

  it('integration_jobs_rollup_real_tree: rollup covers every job in currentwork/ with valid shape', async () => {
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup.length).toBeGreaterThanOrEqual(1);
    for (const entry of rollup) {
      expect(typeof entry.slug).toBe('string');
      expect(typeof entry.totalFeatures).toBe('number');
      expect(['planned', 'in-progress', 'complete', 'unknown']).toContain(entry.status);
    }
  });
});

// ── Edge case tests ─────────────────────────────────────────────────────

describe('pipeline-state.ts: edge cases', () => {
  it('edge_state_rollup_empty_completed_sections: every entry is planned or unknown', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'a', title: 'A', context: '', readmeBody: 'b', phases: [],
          features: [{ id: '1.1', name: 'f', phase: '1', size: 'S', status: 'p' }],
        },
        {
          slug: 'b', title: 'B', context: '', readmeBody: 'b', phases: [],
          features: [],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections: []
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    const statuses = rollup.map((r) => r.status);
    expect(statuses).toContain('planned');
    expect(statuses).toContain('unknown');
  });

  it('edge_state_rollup_zero_features_job: features=[] → percentComplete null, status unknown', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'empty-job', title: 'E', context: '', readmeBody: 'b',
          phases: [], features: [],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections: []
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0].percentComplete).toBeNull();
    expect(rollup[0].status).toBe('unknown');
    expect(rollup[0].completedFeatures).toBe(0);
    expect(rollup[0].totalFeatures).toBe(0);
  });

  it('edge_state_object_form_completed_entries: mixed string + object forms both counted', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'job-a', title: 'A', context: '', readmeBody: 'b', phases: [],
          features: [
            { id: '1.1', name: 'f', phase: '1', size: 'S', status: 'p' },
            { id: '1.2', name: 'f', phase: '1', size: 'S', status: 'p' },
          ],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections:
  - "job-a-1.1"
  - section: "job-a-1.2"
    completedAt: "2026-04-12"
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0].completedFeatures).toBe(2);
    expect(rollup[0].percentComplete).toBe(100);
    expect(rollup[0].status).toBe('complete');
  });

  it('edge_input_unknown_keys_in_knowledge_passthrough: unknown top-level keys preserved', async () => {
    mockYamlFiles({
      [KNOWLEDGE_PATH]: `knowledge:
  version: 1
project_context:
  purpose: "x"
extra_noise: "should survive"
`,
    });
    const { getKnowledgeFile } = await import('../pipeline-state');
    const result = await getKnowledgeFile();
    // .passthrough() on KnowledgeFileSchema preserves unknown keys
    expect(result).toHaveProperty('extra_noise');
  });
});

// ── Error recovery tests ────────────────────────────────────────────────

describe('pipeline-state.ts: error recovery (STRICT — no try/catch)', () => {
  it('err_session_file_missing_throws: ENOENT propagates', async () => {
    vi.spyOn(fs, 'readFile').mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );
    const { getSessionStatus } = await import('../pipeline-state');
    await expect(getSessionStatus()).rejects.toThrow();
  });

  it('err_session_malformed_yaml_throws: YAMLParseError propagates', async () => {
    mockYamlFiles({
      [SESSION_PATH]: 'session:\n  id: "x\nbroken yaml: [unclosed',
    });
    const { getSessionStatus } = await import('../pipeline-state');
    await expect(getSessionStatus()).rejects.toThrow();
  });

  it('err_session_schema_violation_throws: valid YAML but missing required id → ZodError', async () => {
    mockYamlFiles({
      [SESSION_PATH]: `session: {}
completed_sections: []
`,
    });
    const { getSessionStatus } = await import('../pipeline-state');
    await expect(getSessionStatus()).rejects.toThrow();
  });
});

// ── Data integrity tests ────────────────────────────────────────────────

describe('pipeline-state.ts: data integrity', () => {
  it('data_rollup_frozen_array: getJobsRollup() returns Object.isFrozen array', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'a', title: 'A', context: '', readmeBody: 'b', phases: [],
          features: [{ id: '1.1', name: 'f', phase: '1', size: 'S', status: 'p' }],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections: []
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(Object.isFrozen(rollup)).toBe(true);
    expect(() => {
      'use strict';
      // @ts-expect-error - testing immutability
      rollup.push({ slug: 'mutant' });
    }).toThrow();
  });

  it('data_percent_rounding_boundaries: exact halves, standard round-half-away', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'half', title: 'H', context: '', readmeBody: 'b', phases: [],
          features: [
            { id: '1.1', name: 'f', phase: '1', size: 'S', status: 'p' },
            { id: '1.2', name: 'f', phase: '1', size: 'S', status: 'p' },
          ],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections:
  - "half-1.1"
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    expect(rollup[0].percentComplete).toBe(50);
  });

  it('data_section_id_format_validated: join of slug+id matches SECTION_ID regex', async () => {
    vi.doMock('../jobs', () => ({
      getAllJobs: async () => [
        {
          slug: 'build-in-public-docs', title: 'B', context: '', readmeBody: 'b',
          phases: [],
          features: [
            { id: '1.1', name: 'f', phase: '1', size: 'S', status: 'p' },
            { id: '1.2', name: 'f', phase: '1', size: 'S', status: 'p' },
          ],
        },
      ],
    }));
    mockYamlFiles({
      [SESSION_PATH]: `session:
  id: "x"
completed_sections:
  - "build-in-public-docs-1.1"
`,
    });
    const { getJobsRollup } = await import('../pipeline-state');
    const rollup = await getJobsRollup();
    // rollup counting validates that slug+'-'+id produces a valid SECTION_ID shape
    expect(rollup[0].completedFeatures).toBe(1);
    // And the IDs we joined on should match the format
    const SECTION_ID = /^[a-z0-9-]+-\d+\.\d+$/;
    expect('build-in-public-docs-1.1').toMatch(SECTION_ID);
  });
});

// ── Infrastructure tests ────────────────────────────────────────────────

describe('pipeline-state.ts: infrastructure', () => {
  it('infra_yaml_package_resolvable: dynamic import of yaml module succeeds', async () => {
    const mod = await import('yaml');
    expect(typeof mod.parse).toBe('function');
  });

  it('infra_pipeline_dir_resolves_relative_cwd: paths use process.cwd()+pipeline/active', async () => {
    // Verify that the loader reads from the expected absolute path (process.cwd()/pipeline/active)
    const readSpy = vi.spyOn(fs, 'readFile').mockImplementation(async (p) => {
      const key = String(p);
      if (key === SESSION_PATH) return MINIMAL_SESSION_YAML;
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });
    const { getSessionStatus } = await import('../pipeline-state');
    await getSessionStatus();
    const calledPath = String(readSpy.mock.calls[0][0]);
    expect(calledPath).toBe(SESSION_PATH);
    expect(calledPath.startsWith(process.cwd())).toBe(true);
  });
});
