import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn<() => Promise<unknown>>(),
}));
vi.mock('@/auth', () => ({ auth: mockAuth }));

const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn<(...args: unknown[]) => never>(),
}));
vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import AdminLayout from '../layout';

async function renderLayout(child: React.ReactNode = <p data-testid="child">child</p>) {
  const jsx = await AdminLayout({ children: child });
  if (jsx === undefined || jsx === null) return null;
  return render(jsx);
}

const originalAdminEmails = process.env.ADMIN_EMAILS;

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAILS;
  });

  afterEach(() => {
    if (originalAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = originalAdminEmails;
  });

  // --- Unit / functional ---

  it('unit_layout_parse_allowlist_basic: splits comma-separated emails and lowercases', async () => {
    process.env.ADMIN_EMAILS = 'Admin@foo.com,test@bar.com';
    mockAuth.mockResolvedValueOnce({ user: { email: 'admin@foo.com' } });
    await renderLayout();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('unit_layout_no_session_redirects_to_login: no session triggers redirect with callbackUrl', async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockRedirect.mockImplementationOnce(() => {
      throw new Error('REDIRECT');
    });
    await renderLayout().catch(() => undefined);
    expect(mockRedirect).toHaveBeenCalled();
    const arg = mockRedirect.mock.calls[0]?.[0] as string;
    expect(arg).toContain('/login');
    expect(arg).toContain('callbackUrl');
    expect(arg).toContain('%2Fadmin%2Fcohorts%2Fapplications');
  });

  it('unit_layout_non_admin_renders_forbidden: session email not in allowlist renders Forbidden', async () => {
    process.env.ADMIN_EMAILS = 'root@travisgautier.com';
    mockAuth.mockResolvedValueOnce({ user: { email: 'intruder@example.com' } });
    await renderLayout();
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('unit_layout_admin_renders_children: allowlisted email renders {children}', async () => {
    process.env.ADMIN_EMAILS = 'admin@foo.com';
    mockAuth.mockResolvedValueOnce({ user: { email: 'admin@foo.com' } });
    await renderLayout();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('unit_layout_empty_allowlist_denies_all: ADMIN_EMAILS unset denies every session', async () => {
    mockAuth.mockResolvedValueOnce({ user: { email: 'admin@foo.com' } });
    await renderLayout();
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  // --- Integration ---

  it('integration_layout_case_insensitive_match: case-mismatched env value matches session', async () => {
    process.env.ADMIN_EMAILS = 'Admin@Foo.COM';
    mockAuth.mockResolvedValueOnce({ user: { email: 'admin@foo.com' } });
    await renderLayout();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('integration_layout_whitespace_in_env: whitespace + trailing commas parse cleanly', async () => {
    process.env.ADMIN_EMAILS = '  Admin@Foo.com ,  test@bar.com,  ';
    mockAuth.mockResolvedValueOnce({ user: { email: 'test@bar.com' } });
    await renderLayout();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  // --- Security ---

  it('sec_elevation_allowlist_bypass_with_random_email: random signed-in email denied', async () => {
    process.env.ADMIN_EMAILS = 'root@travisgautier.com';
    mockAuth.mockResolvedValueOnce({ user: { email: 'intruder@example.com' } });
    await renderLayout();
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('sec_elevation_empty_env_deny_by_default: empty allowlist denies valid session', async () => {
    process.env.ADMIN_EMAILS = '';
    mockAuth.mockResolvedValueOnce({ user: { email: 'admin@foo.com' } });
    await renderLayout();
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
  });

  // --- Permission ---

  it('perm_anonymous_layout_redirected: anonymous → redirect (deny)', async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockRedirect.mockImplementationOnce(() => {
      throw new Error('REDIRECT');
    });
    await renderLayout().catch(() => undefined);
    expect(mockRedirect).toHaveBeenCalled();
  });

  it('perm_authenticated_non_admin_forbidden: authenticated non-admin sees Forbidden (deny)', async () => {
    process.env.ADMIN_EMAILS = 'admin@foo.com';
    mockAuth.mockResolvedValueOnce({ user: { email: 'random@example.com' } });
    await renderLayout();
    expect(screen.getByText(/forbidden/i)).toBeInTheDocument();
  });

  it('perm_admin_allowed_layout_renders_children: admin sees children (allow)', async () => {
    process.env.ADMIN_EMAILS = 'admin@foo.com';
    mockAuth.mockResolvedValueOnce({ user: { email: 'admin@foo.com' } });
    await renderLayout();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('perm_anonymous_detail_redirected: anonymous → redirect (covers detail route via shared layout)', async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockRedirect.mockImplementationOnce(() => {
      throw new Error('REDIRECT');
    });
    await renderLayout().catch(() => undefined);
    expect(mockRedirect).toHaveBeenCalled();
  });

  // --- Edge case ---

  it('edge_input_allowlist_with_uppercase_env_value: ADMIN_EMAILS=Admin@FOO.COM matches lowercase session', async () => {
    process.env.ADMIN_EMAILS = 'Admin@FOO.COM';
    mockAuth.mockResolvedValueOnce({ user: { email: 'admin@foo.com' } });
    await renderLayout();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  // --- A11y ---

  it('a11y_perceivable_admin_header_landmarks: admin chrome includes <header> + <nav> landmarks', async () => {
    process.env.ADMIN_EMAILS = 'admin@foo.com';
    mockAuth.mockResolvedValueOnce({ user: { email: 'admin@foo.com' } });
    const result = await renderLayout();
    expect(result?.container.querySelector('header')).toBeTruthy();
    expect(result?.container.querySelector('nav')).toBeTruthy();
  });

  // --- Infra ---

  it('infra_layout_rsc_no_use_client: layout.tsx source has no "use client" directive', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.join(process.cwd(), 'src/app/admin/layout.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });
});
