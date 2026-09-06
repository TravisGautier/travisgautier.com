import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('db client', () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalEnv;
    }
    vi.restoreAllMocks();
  });

  it('unit_client_exports_db_and_schema: importing @/db/client exposes `db` and `schema` bindings', async () => {
    process.env.DATABASE_URL = 'postgres://travisgautier:dev@localhost:5432/travisgautier';
    const mod = await import('@/db/client');
    expect(mod).toHaveProperty('db');
    expect(mod).toHaveProperty('schema');
    expect(mod.schema).toHaveProperty('users');
    expect(mod.schema).toHaveProperty('sessions');
    expect(mod.schema).toHaveProperty('verificationTokens');
    expect(mod.schema).toHaveProperty('purchases');
  });

  it('err_missing_database_url_uses_placeholder: importing @/db/client with DATABASE_URL unset still loads (build safety)', async () => {
    delete process.env.DATABASE_URL;
    const mod = await import('@/db/client');
    expect(mod).toHaveProperty('db');
    expect(mod).toHaveProperty('schema');
  });

  it('sec_info_disclosure_database_url_not_logged: client module load does not console.log the DATABASE_URL value', async () => {
    const secret = 'postgres://leakuser:leakpass@leakhost:5432/leakdb';
    process.env.DATABASE_URL = secret;

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await import('@/db/client');

    const allCalls = [
      ...logSpy.mock.calls,
      ...errorSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...infoSpy.mock.calls,
    ];
    for (const args of allCalls) {
      const serialized = args.map((a) => String(a)).join(' ');
      expect(serialized).not.toContain('leakuser');
      expect(serialized).not.toContain('leakpass');
      expect(serialized).not.toContain(secret);
    }
  });
});
