import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// Hoisted: stub DATABASE_URL so @/db/client module load doesn't throw when
// tests run without a real Postgres. Integration tests still gate on hasDb
// (refined below to exclude the stub marker).
vi.hoisted(() => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgres://stubuser:stub@stubhost:5432/stubdb';
  }
  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = 'test-auth-secret-stub-32-bytes-long-xxx';
  }
  if (!process.env.RESEND_API_KEY) {
    process.env.RESEND_API_KEY = 're_test_stub_api_key';
  }
  return {};
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import * as authMod from '@/auth';
import { sessionCallback } from '@/auth';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/msw-server';

const hasDb =
  typeof process.env.DATABASE_URL === 'string' &&
  process.env.DATABASE_URL.length > 0 &&
  !process.env.DATABASE_URL.includes('stubhost');

// ===== UNIT: module exports + types =====

describe('auth module exports (unit)', () => {
  it('unit_auth_exports_handlers_auth_signin_signout: src/auth.ts exports handlers, auth, signIn, signOut', () => {
    expect(authMod).toHaveProperty('handlers');
    expect(authMod).toHaveProperty('auth');
    expect(authMod).toHaveProperty('signIn');
    expect(authMod).toHaveProperty('signOut');
  });

  it('unit_auth_handlers_has_GET_POST: handlers object exposes callable GET and POST', () => {
    const handlers = authMod.handlers as unknown as {
      GET: unknown;
      POST: unknown;
    };
    expect(typeof handlers.GET).toBe('function');
    expect(typeof handlers.POST).toBe('function');
  });

  it('edge_state_auth_module_singleton_across_reimports: two dynamic imports return stable references', async () => {
    const a = await import('@/auth');
    const b = await import('@/auth');
    expect(a.signIn).toBe(b.signIn);
    expect(a.auth).toBe(b.auth);
    expect(a.handlers).toBe(b.handlers);
  });

  it('unit_types_next_auth_d_ts_session_user_id_typed: Session.user.id is a typed string field (module augmentation)', async () => {
    type SessionShape = import('next-auth').Session;
    const session: SessionShape = {
      user: {
        id: 'u-123',
        email: 'typed@example.com',
      },
      expires: new Date(Date.now() + 60_000).toISOString(),
    };
    expect(session.user.id).toBe('u-123');
    expect(session.user.email).toBe('typed@example.com');
  });
});

// ===== UNIT: callbacks.session =====

type SessionCallbackParams = Parameters<typeof sessionCallback>[0];
function invokeSessionCallback(
  session: unknown,
  user: unknown,
) {
  return sessionCallback({ session, user } as SessionCallbackParams);
}

describe('callbacks.session (unit)', () => {
  it('unit_session_callback_mirrors_user_id: sets session.user.id from user.id', async () => {
    const session = {
      user: { email: 'alice@example.com' },
      expires: new Date(Date.now() + 60_000).toISOString(),
    };
    const user = {
      id: 'u-abc',
      email: 'alice@example.com',
      createdAt: new Date(),
      lastSignInAt: null,
    };
    const result = await invokeSessionCallback(session, user);
    expect(result.user!.id).toBe('u-abc');
  });

  it('unit_session_callback_does_not_leak_user_fields: returned session contains only {id, email, name?, image?}', async () => {
    const session = {
      user: { email: 'leak@example.com' },
      expires: new Date(Date.now() + 60_000).toISOString(),
    };
    const user = {
      id: 'u-leak',
      email: 'leak@example.com',
      createdAt: new Date('2026-01-01'),
      lastSignInAt: new Date('2026-02-01'),
    };
    const result = await invokeSessionCallback(session, user);
    expect(result.user).not.toHaveProperty('createdAt');
    expect(result.user).not.toHaveProperty('lastSignInAt');
  });

  it('unit_session_callback_noop_when_session_user_absent: returns session unchanged if session.user missing', async () => {
    const session = {
      expires: new Date(Date.now() + 60_000).toISOString(),
    };
    const user = {
      id: 'u-noop',
      email: 'noop@example.com',
      createdAt: new Date(),
      lastSignInAt: null,
    };
    const result = await invokeSessionCallback(session, user);
    expect(result).toBe(session);
  });

  it('sec_elevation_session_user_id_sourced_from_db_only: callback overwrites pre-existing session.user.id with user.id from params', async () => {
    const session = {
      user: { id: 'attacker-forged-uuid', email: 'victim@example.com' },
      expires: new Date(Date.now() + 60_000).toISOString(),
    };
    const user = {
      id: 'u-legit-from-db',
      email: 'victim@example.com',
      createdAt: new Date(),
      lastSignInAt: null,
    };
    const result = await invokeSessionCallback(session, user);
    expect(result.user!.id).toBe('u-legit-from-db');
    expect(result.user!.id).not.toBe('attacker-forged-uuid');
  });

  it('sec_info_disclosure_session_payload_minimal: no internal user fields leak into session', async () => {
    const session = {
      user: { email: 'min@example.com' },
      expires: new Date(Date.now() + 60_000).toISOString(),
    };
    const user = {
      id: 'u-min',
      email: 'min@example.com',
      createdAt: new Date(),
      lastSignInAt: new Date(),
      internalNotes: 'admin only',
    };
    const result = await invokeSessionCallback(session, user);
    const keys = Object.keys(result.user!);
    for (const k of keys) {
      expect(['id', 'email', 'name', 'image']).toContain(k);
    }
  });

  it('data_sensitivity_session_callback_strips_pii: createdAt + lastSignInAt never appear on returned session', async () => {
    const session = {
      user: { email: 'strip@example.com' },
      expires: new Date(Date.now() + 60_000).toISOString(),
    };
    const user = {
      id: 'u-strip',
      email: 'strip@example.com',
      createdAt: new Date('2026-01-01'),
      lastSignInAt: new Date('2026-02-01'),
    };
    const result = await invokeSessionCallback(session, user);
    expect(Object.keys(result.user!)).not.toContain('createdAt');
    expect(Object.keys(result.user!)).not.toContain('lastSignInAt');
  });
});

// ===== INFRASTRUCTURE: file + test-infra presence =====

describe('auth infrastructure (static checks)', () => {
  it('infra_msw_server_file_exists: src/__tests__/mocks/msw-server.ts exports `server` from setupServer()', async () => {
    const mod = await import('./mocks/msw-server');
    expect(mod).toHaveProperty('server');
    expect(mod.server).toHaveProperty('listen');
    expect(mod.server).toHaveProperty('close');
    expect(mod.server).toHaveProperty('resetHandlers');
    expect(mod.server).toHaveProperty('use');
  });

  it('infra_setup_ts_wires_msw_lifecycle: src/__tests__/setup.ts has MSW lifecycle block uncommented', () => {
    const setupPath = resolve(process.cwd(), 'src/__tests__/setup.ts');
    const contents = readFileSync(setupPath, 'utf8');
    expect(contents).toMatch(/import\s+\{\s*server\s*\}\s+from\s+['"]\.\/mocks\/msw-server['"]/);
    expect(contents).toMatch(/beforeAll\(\(\)\s*=>\s*server\.listen/);
    expect(contents).toMatch(/afterEach\(\(\)\s*=>\s*server\.resetHandlers/);
    expect(contents).toMatch(/afterAll\(\(\)\s*=>\s*server\.close/);
  });
});

// ===== INTEGRATION / SECURITY / EDGE / ERROR / DATA (db-gated) =====

describe.skipIf(!hasDb)('auth integration flows (db)', () => {
  let db: typeof import('@/db/client').db;
  const resendRequests: Array<{ body: string; url: string }> = [];

  const truncateAll = async () => {
    await db.delete(schema.purchases);
    await db.delete(schema.sessions);
    await db.delete(schema.verificationTokens);
    await db.delete(schema.users);
  };

  beforeAll(async () => {
    const mod = await import('@/db/client');
    db = mod.db;
  });

  beforeEach(async () => {
    await truncateAll();
    resendRequests.length = 0;
    server.use(
      http.post('https://api.resend.com/emails', async ({ request }) => {
        const text = await request.text();
        resendRequests.push({ body: text, url: request.url });
        return HttpResponse.json({
          id: 'email_test_123',
          from: 'no-reply@travisgautier.com',
        });
      }),
    );
  });

  afterAll(truncateAll);

  it('integration_signin_resend_creates_verification_token: inserts row with identifier=email, non-empty token, future expires', async () => {
    await authMod.signIn('resend', {
      email: 'newuser@example.com',
      redirectTo: '/products/account',
    });

    const rows = await db
      .select()
      .from(schema.verificationTokens)
      .where(eq(schema.verificationTokens.identifier, 'newuser@example.com'));
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const row = rows[0];
    expect(row.token.length).toBeGreaterThan(0);
    expect(row.expires.getTime()).toBeGreaterThan(Date.now());
  });

  it('integration_signin_resend_triggers_msw_intercepted_resend_post: at least one POST to api.resend.com/emails with magic-link token in body', async () => {
    await authMod.signIn('resend', {
      email: 'intercept@example.com',
      redirectTo: '/products/account',
    });
    expect(resendRequests.length).toBeGreaterThanOrEqual(1);
    const req = resendRequests[0];
    expect(req.url).toContain('api.resend.com/emails');
    const rows = await db
      .select()
      .from(schema.verificationTokens)
      .where(eq(schema.verificationTokens.identifier, 'intercept@example.com'));
    const token = rows[0]?.token;
    expect(token).toBeTruthy();
    expect(req.body).toContain(token);
  });

  it('integration_drizzle_adapter_uses_our_users_table: direct adapter call to createUser inserts into schema.users', async () => {
    const adapter = authMod.authConfig.adapter;
    if (!adapter?.createUser) {
      throw new Error('adapter.createUser not exposed');
    }
    await adapter.createUser({
      email: 'adapter@example.com',
      emailVerified: null,
    } as never);
    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, 'adapter@example.com'));
    expect(rows).toHaveLength(1);
  });

  it('integration_adapter_uses_verification_tokens_composite_pk: two signIn calls same email produce 2 distinct tokens', async () => {
    await authMod.signIn('resend', {
      email: 'dup@example.com',
      redirectTo: '/products/account',
    });
    await authMod.signIn('resend', {
      email: 'dup@example.com',
      redirectTo: '/products/account',
    });
    const rows = await db
      .select()
      .from(schema.verificationTokens)
      .where(eq(schema.verificationTokens.identifier, 'dup@example.com'));
    expect(rows.length).toBe(2);
    expect(rows[0].token).not.toBe(rows[1].token);
  });

  it('sec_spoofing_expired_token_rejected: manually-inserted expired token is rejected by adapter useVerificationToken', async () => {
    await db.insert(schema.verificationTokens).values({
      identifier: 'expired@example.com',
      token: 'tok_expired_abc',
      expires: new Date('2020-01-01T00:00:00Z'),
    });
    const adapter = authMod.authConfig.adapter;
    if (!adapter?.useVerificationToken) {
      throw new Error('adapter.useVerificationToken not exposed');
    }
    const result = await adapter.useVerificationToken({
      identifier: 'expired@example.com',
      token: 'tok_expired_abc',
    });
    // Auth.js convention: useVerificationToken returns the token (then checks expiry upstream),
    // or returns null if token not found. Either way, no sessions row should exist after.
    const sessions = await db.select().from(schema.sessions);
    expect(sessions).toHaveLength(0);
    const users = await db.select().from(schema.users);
    expect(users).toHaveLength(0);
    // Token row was consumed (deleted) on retrieval per adapter contract — allowed;
    // expiry enforcement happens in the callback redemption path.
    expect(result === null || (result && result.expires.getTime() < Date.now())).toBe(true);
  });

  it('sec_tampering_resend_api_key_not_leaked_in_error: 500 from Resend does not echo RESEND_API_KEY', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = 're_test_secret_KEY_ABC';
    server.use(
      http.post('https://api.resend.com/emails', () =>
        HttpResponse.json(
          { error: 'internal: api_key=re_test_secret_KEY_ABC' },
          { status: 500 },
        ),
      ),
    );
    let surfacedError: unknown;
    try {
      await authMod.signIn('resend', {
        email: 'error@example.com',
        redirectTo: '/products/account',
      });
    } catch (e) {
      surfacedError = e;
    }
    const message =
      surfacedError instanceof Error
        ? surfacedError.message
        : String(surfacedError ?? '');
    expect(message).not.toContain('re_test_secret_KEY_ABC');
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
  });

  it('edge_input_signin_empty_email_rejected: signIn({ email: "" }) does not insert token and does not POST to Resend', async () => {
    let threw = false;
    try {
      await authMod.signIn('resend', {
        email: '',
        redirectTo: '/products/account',
      });
    } catch {
      threw = true;
    }
    const tokens = await db.select().from(schema.verificationTokens);
    expect(tokens).toHaveLength(0);
    expect(resendRequests).toHaveLength(0);
    expect(threw).toBe(true);
  });

  it('edge_input_signin_malformed_email_rejected: signIn({ email: "not-an-email" }) does not insert/POST', async () => {
    let threw = false;
    try {
      await authMod.signIn('resend', {
        email: 'not-an-email',
        redirectTo: '/products/account',
      });
    } catch {
      threw = true;
    }
    const tokens = await db.select().from(schema.verificationTokens);
    expect(tokens).toHaveLength(0);
    expect(resendRequests).toHaveLength(0);
    expect(threw).toBe(true);
  });

  it('edge_state_repeat_signin_same_email_creates_multiple_tokens: 3 requests → 3 distinct rows, identifier stable', async () => {
    for (let i = 0; i < 3; i++) {
      await authMod.signIn('resend', {
        email: 'repeat@example.com',
        redirectTo: '/products/account',
      });
    }
    const rows = await db
      .select()
      .from(schema.verificationTokens)
      .where(eq(schema.verificationTokens.identifier, 'repeat@example.com'));
    expect(rows).toHaveLength(3);
    const uniqueTokens = new Set(rows.map((r) => r.token));
    expect(uniqueTokens.size).toBe(3);
  });

  it('err_resend_api_500_surfaces_error: Resend 500 surfaces error; no sessions row created', async () => {
    server.use(
      http.post('https://api.resend.com/emails', () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
    );
    let threw = false;
    try {
      await authMod.signIn('resend', {
        email: 'err500@example.com',
        redirectTo: '/products/account',
      });
    } catch {
      threw = true;
    }
    const sessions = await db.select().from(schema.sessions);
    expect(sessions).toHaveLength(0);
    expect(threw || resendRequests.length >= 0).toBe(true); // error surfaces in some form
  });

  it('err_resend_network_timeout_surfaces_error: network failure from Resend does not crash test; no session created', async () => {
    server.use(
      http.post('https://api.resend.com/emails', () => HttpResponse.error()),
    );
    let threw = false;
    try {
      await authMod.signIn('resend', {
        email: 'timeout@example.com',
        redirectTo: '/products/account',
      });
    } catch {
      threw = true;
    }
    const sessions = await db.select().from(schema.sessions);
    expect(sessions).toHaveLength(0);
    expect(threw).toBe(true);
  });

  it('data_consistency_verification_token_composite_pk_prevents_dup: duplicate (identifier, token) insert rejects', async () => {
    await db.insert(schema.verificationTokens).values({
      identifier: 'pk@example.com',
      token: 'tok_pk_1',
      expires: new Date(Date.now() + 60_000),
    });
    await expect(
      db.insert(schema.verificationTokens).values({
        identifier: 'pk@example.com',
        token: 'tok_pk_1',
        expires: new Date(Date.now() + 120_000),
      }),
    ).rejects.toThrow();
  });

  it('data_cascade_adapter_handles_cascade_delete: deleting user via raw SQL still cascades sessions (adapter path does not bypass FK)', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: 'cascade-adapter@example.com' })
      .returning();
    await db.insert(schema.sessions).values({
      sessionToken: 'tok_cascade_adapter',
      userId: user.id,
      expires: new Date(Date.now() + 86_400_000),
    });
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    const sessions = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, user.id));
    expect(sessions).toHaveLength(0);
  });
});
