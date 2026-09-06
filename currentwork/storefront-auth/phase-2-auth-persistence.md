# Phase 2: Auth + Persistence

**Total Size: L + L + L**
**Prerequisites: Phase 1 complete (catalog is live but Buy button is disabled). `RESEND_API_KEY` in `.env.local` (from wf 4.1).**
**New Tables: `users`, `sessions`, `verificationTokens`, `purchases`**
**New Files: `src/db/{client,schema}.ts`, `src/db/migrations/*`, `drizzle.config.ts`, `docker-compose.yml`, `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `middleware.ts` (project root), `src/app/login/{page.tsx,verify/page.tsx}`, `src/components/auth/SignInForm.tsx`, plus tests**

Phase 2 builds the identity + persistence layer that every payment feature
in Phase 3 depends on. No products are purchased in this phase — by the end
of Phase 2, a user can sign in with a magic link, see an empty
`/products/account` placeholder, and sign out. All public routes remain
anonymous-accessible. Auth lives on `/products/account/*` and the
to-be-built `/products/downloads/*` matcher.

---

## Feature 2.1: Postgres + Drizzle Setup ✅ COMPLETE (2026-04-13)

**Complexity: L** — Install Drizzle, define the four tables, generate the
init migration, wire a Postgres client, ship `docker-compose.yml` for local
dev, and add npm scripts for the common DB operations.

**Shipped checklist:**
- [x] `npm install postgres drizzle-orm` + `drizzle-kit --save-dev`
- [x] `docker-compose.yml` — postgres:16-alpine, healthcheck, named volume, env-driven creds
- [x] `drizzle.config.ts` — dialect postgresql, schema/out paths, DATABASE_URL
- [x] `src/db/schema.ts` — 4 tables (users, sessions, verification_tokens, purchases) with UNIQUE + FK cascade + composite PK + index + 8 inferred types
- [x] `src/db/client.ts` — postgres.js + Drizzle wrapper + globalThis singleton for HMR + DATABASE_URL guard
- [x] `src/db/migrations/0000_init.sql` — drizzle-kit generated, `CREATE EXTENSION IF NOT EXISTS "pgcrypto"` prepended
- [x] npm scripts: db:generate, db:migrate, db:studio, db:up, db:down
- [x] `.env.example` — DB + Auth.js + Stripe placeholders (gitignore whitelisted via `!.env.example`)
- [x] `src/db/__tests__/schema.test.ts` — 24 tests (7 unit + 6 integration + 11 edge/data/security), skipIf(!DATABASE_URL) gate
- [x] `.gitignore` — docker volume data rule documented (`data/`, `postgres-data/`)
- [x] Root `README.md` — "Local database setup" section (env, db:up, db:migrate, dev)

**Tests shipped:** 42 new (8 unit + 6 integration + 3 security + 14 infra + 5 edge + 1 err + 5 data)
**Full suite:** 712/712 passing with `DATABASE_URL` set; integration tests skip cleanly when unset.

### Problem

The app has zero persistence. Auth.js v5 (Feature 2.2) needs a
`@auth/drizzle-adapter`-compatible schema (`users`, `sessions`,
`verificationTokens`) and Phase 3 needs a `purchases` table to record Stripe
settlements. Without a database, the only options are (a) ship SQLite
file-based (user chose Postgres), (b) hit Stripe on every account-page load
(slow, rate-limited), or (c) defer auth entirely (blocks the whole job).
Postgres via Drizzle gives production-grade durability from day one and
leaves the same query surface if we later swap local SQLite dev for managed
Postgres in prod.

### Implementation

Install dependencies at the start of this feature:

```bash
npm install postgres drizzle-orm
npm install --save-dev drizzle-kit
```

**NEW** `docker-compose.yml` at the project root — local dev Postgres:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: travisgautier-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-travisgautier}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-dev}
      POSTGRES_DB: ${POSTGRES_DB:-travisgautier}
    ports:
      - '5432:5432'
    volumes:
      - travisgautier-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-travisgautier}']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  travisgautier-postgres-data:
```

**NEW** `drizzle.config.ts`:

```ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;
```

**NEW** `src/db/schema.ts` — Drizzle Postgres tables:

```ts
import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSignInAt: timestamp('last_sign_in_at', { withTimezone: true }),
});

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

export const purchases = pgTable(
  'purchases',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productSlug: text('product_slug').notNull(),
    stripeSessionId: text('stripe_session_id').notNull().unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    purchasedAt: timestamp('purchased_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index('purchases_user_id_idx').on(table.userId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
```

**NEW** `src/db/client.ts` — Postgres.js + Drizzle wrapper, singleton across dev HMR:

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  pg: ReturnType<typeof postgres> | undefined;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client =
  globalForDb.pg ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
```

**MODIFY** `package.json` — add DB scripts:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:up": "docker compose up -d postgres",
    "db:down": "docker compose down"
  }
}
```

**Generate the init migration** (run at the end of this feature):

```bash
npm run db:up              # boot dev Postgres
npm run db:generate        # creates src/db/migrations/0000_init.sql
npm run db:migrate         # applies it to the dev DB
```

**NEW** `src/db/migrations/0000_init.sql` — committed, generated by drizzle-kit. Prepend an `ENABLE EXTENSION` clause if drizzle-kit doesn't emit it automatically:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- ... generated CREATE TABLE statements follow
```

**MODIFY** `.gitignore`:

```
# Local Postgres dev data is managed by docker volume, but just in case:
data/
```

**MODIFY** `README.md` at the project root — add a "Local database" section that documents:
1. `cp .env.example .env.local` and fill in `DATABASE_URL`
2. `npm run db:up`
3. `npm run db:migrate`
4. `npm run dev`

**NEW** `.env.example` (or modify if wf shipped one):

```
# Database
DATABASE_URL=postgres://travisgautier:dev@localhost:5432/travisgautier
POSTGRES_USER=travisgautier
POSTGRES_PASSWORD=dev
POSTGRES_DB=travisgautier

# Auth.js (Feature 2.2)
AUTH_SECRET=
AUTH_URL=http://localhost:3000
AUTH_RESEND_FROM=no-reply@travisgautier.com
RESEND_API_KEY=

# Stripe (Phase 3)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Tests (red phase of section `storefront-auth-2.1`)

**NEW** `src/db/__tests__/schema.test.ts` — integration tests against a real Postgres (NOT mocked). Setup hits `DATABASE_URL` and truncates all four tables before each test.

- Insert a user with email → select by id returns the same email.
- Insert two users with the same email → second insert throws UNIQUE violation.
- Insert a purchase referencing a known user → select by `userId` returns it.
- Insert two purchases with the same `stripeSessionId` → second insert throws UNIQUE violation.
- Delete a user → cascade deletes their sessions and purchases.
- `gen_random_uuid()` default produces distinct UUIDs on consecutive inserts (smoke test that the extension is enabled).

### Design Decisions

- **Postgres.js + Drizzle (not pg-node)** — Postgres.js is the driver Drizzle recommends for Postgres and is significantly faster than node-postgres for the query patterns we hit. No transaction pooler needed at this scale; a direct connection with `max: 10` is enough.
- **`gen_random_uuid()` server-side defaults** — keeps UUID generation authoritative in the DB and removes a source of drift (app-layer UUID generation would need a uuid library import). `pgcrypto` extension is enabled in migration 0000.
- **`cascade` on `users → sessions` and `users → purchases`** — deleting a user is rare but needs to be clean. Stripe retains the payment record independently; we're just purging our cache.
- **Index on `purchases(user_id)` but not `purchases(product_slug)`** — account-page queries are always "my purchases", never "all purchases of this product". Add the second index only if a product analytics page becomes real.
- **Global singleton pattern for the `postgres` client** — Next.js dev mode hot-reloads server modules and would otherwise create a new connection pool per reload, exhausting Postgres connections within a few saves. The `globalThis` singleton is the standard workaround documented in the Drizzle + Next.js guide.
- **No seeder script** — seeds are integration test fixtures, not deployable code. Don't pollute `src/db/` with dev-only data.
- **`.env.example` committed, `.env.local` ignored** — `.env.example` is the handoff document for any contributor (human or agent) setting up the repo fresh.

### Files

| Action | File                                            |
|--------|-------------------------------------------------|
| NEW    | `docker-compose.yml`                            |
| NEW    | `drizzle.config.ts`                             |
| NEW    | `src/db/schema.ts`                              |
| NEW    | `src/db/client.ts`                              |
| NEW    | `src/db/migrations/0000_init.sql`               |
| NEW    | `src/db/migrations/meta/*` (generated)          |
| NEW    | `src/db/__tests__/schema.test.ts`               |
| NEW    | `.env.example`                                  |
| MODIFY | `package.json`                                  |
| MODIFY | `.gitignore`                                    |
| MODIFY | `README.md` (root) — local DB setup section     |

---

## Feature 2.2: Auth.js v5 + Resend Magic-Link ✅ COMPLETE (2026-04-13)

**Complexity: L** — Wire Auth.js v5, the Drizzle adapter, the Resend email
provider, and the session config. By the end of this feature, a user can
submit an email at (eventually) `/login`, receive a magic-link email from
Resend, click it, and land in a signed-in session.

**Shipped checklist:**
- [x] `npm install next-auth@beta @auth/drizzle-adapter` (pinned: next-auth ^5.0.0-beta.30, @auth/drizzle-adapter ^1.11.1)
- [x] `src/auth.ts` — NextAuth v5 central config with DrizzleAdapter + Resend + session strategy=database + pages + trustHost + sessionCallback
- [x] Exports: handlers, auth, signIn, signOut, sessionCallback (extracted for unit testability), authConfig (exposed for adapter-level integration tests)
- [x] `src/app/api/auth/[...nextauth]/route.ts` — 2-line re-export of handlers.GET/POST
- [x] `src/types/next-auth.d.ts` — module augmentation adding id: string to Session.user
- [x] `src/__tests__/auth.test.ts` — 25 tests (12 unit/infra/edge-state passing + 13 DB-gated integration/sec/edge-input/err/data via skipIf(!hasDb))
- [x] `src/__tests__/mocks/msw-server.ts` — setupServer() with default Resend /emails handler
- [x] `src/__tests__/setup.ts` — MSW lifecycle block uncommented (beforeAll/afterEach/afterAll)
- [x] `vitest.config.mts` — test.server.deps.inline = ['next-auth', '@auth/core', '@auth/drizzle-adapter'] (required for vitest to resolve next-auth's bare `next/server` import)

**Drive-by schema extension (required by @auth/drizzle-adapter type contract):**
- [x] `src/db/schema.ts` — added 3 nullable columns to users (emailVerified, name, image) + new `accounts` table (composite PK on provider+providerAccountId, userId FK cascade)
- [x] `src/db/migrations/0001_add_auth_user_columns_and_accounts.sql` — generated via drizzle-kit
- [x] `src/db/__tests__/schema.test.ts` — extended User literal to include new nullable fields (sa-2.1 test intent preserved)

**Tests shipped:** 27 new test entries (14 passing + 13 DB-gated skipped) + 2 route re-export tests + 2 dependency presence tests = **29 new, 17 passing, 13 skipped**
**Full suite:** 769 (739 passed | 30 skipped); zero regressions vs pre-green baseline of 712.

### Problem

There's no way to identify users, no way to create sessions, and no way to
gate anything. Every payment feature in Phase 3 needs a `userId` to attach
to a `purchases` row, and the account pages in Phase 4 need a session cookie
to know whose purchases to list.

### Implementation

Install Auth.js v5 and the adapters:

```bash
npm install next-auth@beta @auth/drizzle-adapter
```

(Auth.js v5 is still `@beta` as of this job's writing. Pin the exact version
committed to `package.json`.)

**NEW** `src/auth.ts` — Auth.js v5 central config:

```ts
import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db, schema } from '@/db/client';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: undefined, // magic-link only, no OAuth accounts table
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_RESEND_FROM ?? 'no-reply@travisgautier.com',
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login/verify',
  },
  trustHost: true,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
```

**NEW** `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

**NEW** `src/types/next-auth.d.ts` — extend the Session type so
`session.user.id` is typed:

```ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}
```

### Tests (red phase of section `storefront-auth-2.2`)

**NEW** `src/__tests__/auth.test.ts` — integration tests that stop short of
actually sending email (mock the Resend HTTP call via MSW, which wf 4.1
already wires into the test setup):

- Calling `signIn('resend', { email: 'test@example.com', redirectTo: '/products/account' })` creates a `verificationTokens` row and triggers an MSW-intercepted POST to Resend's `/emails` endpoint with a magic-link URL.
- Clicking a valid magic link (simulated by calling the verification endpoint with the captured token) creates a `users` row (first time) or reuses an existing one (repeat sign-in), creates a `sessions` row, and sets an `authjs.session-token` cookie.
- Clicking an expired token returns an error response, does NOT create a session.
- `auth()` helper resolves to the logged-in session inside a server component context.

### Design Decisions

- **`session.strategy: 'database'`** — uses the `sessions` table, matches `@auth/drizzle-adapter` expectations, and is simpler than JWT. With a DB session strategy, signing out invalidates server-side (versus JWT where the token remains valid until expiry). Better for a storefront.
- **Magic-link only, no password** — passwords are an attack surface, a support cost, and Auth.js doesn't ship a password provider anyway. Resend is already installed from wf 4.1.
- **`trustHost: true`** — standalone Next.js deploys behind nginx often can't infer the canonical host. Setting `AUTH_URL` + `trustHost` is the documented fix.
- **`pages.signIn: '/login'`** — overrides Auth.js's default `/api/auth/signin` UI with our own branded page. Feature 2.3 builds the page.
- **`session.user.id` typed via module augmentation** — Next-auth's default Session type omits `id`. Downstream code (checkout action, account page, middleware) depends on it; declaring it once in `next-auth.d.ts` is cleaner than casting at every call site.
- **No `accountsTable`** — magic-link doesn't use it. Declaring it as `undefined` avoids accidentally creating a dead table.
- **30-day session** — matches Stripe's typical session length and the usage pattern (come back, grab a download, leave). Can tighten later.

### Files

| Action | File                                        |
|--------|---------------------------------------------|
| NEW    | `src/auth.ts`                               |
| NEW    | `src/app/api/auth/[...nextauth]/route.ts`   |
| NEW    | `src/types/next-auth.d.ts`                  |
| NEW    | `src/__tests__/auth.test.ts`                |
| MODIFY | `package.json` (deps)                       |

---

## Feature 2.3: Middleware + Login Pages + SignInForm

**Status: ✓ Shipped 2026-04-13** — 39 tests (17 unit, 3 integration, 3 security, 4 a11y, 2 infra, 6 edge, 2 error-recovery, 2 data-integrity). Implementation used `proxy.ts` instead of `middleware.ts` — Next.js 16 deprecated and renamed the middleware file convention to proxy (function name `proxy`, same matcher config). See `pipeline/active/knowledge.yaml` `storefront-auth-2.3.decisions` for rationale.

**Complexity: L** — Edge-runtime `middleware.ts` that gates
`/products/account/*` and `/api/products/downloads/*`, plus the branded
`/login` and `/login/verify` pages and the `<SignInForm>` client component.
These belong together: the middleware redirect target IS `/login`, and
`/login`'s `callbackUrl` round-trip only makes sense once the middleware is
intercepting gated paths. Both ship in the same pipeline run so the redirect
loop can be tested end-to-end.

### Problem

Auth.js provides the session, but it doesn't automatically gate any routes —
every request still hits the page handler regardless. Without middleware,
an anonymous user hitting `/products/account` would get either a crash
(server component trying to read `session.user.id` on `null`) or a blank
page. We want a clean 307 → `/login?callbackUrl=...` redirect.

Auth.js v5's default sign-in UI is functional but unbranded. We have a
design system, a Container primitive, and a one-input form is trivial to
build. A branded page is better UX and matches the rest of the site, and
gives the middleware redirect a meaningful destination.

### Implementation

#### Middleware

**NEW** `middleware.ts` at the project root (NOT inside `src/`):

```ts
import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'authjs.session-token';
const SESSION_COOKIE_SECURE = '__Secure-authjs.session-token';

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get(SESSION_COOKIE)?.value ||
      request.cookies.get(SESSION_COOKIE_SECURE)?.value,
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isGated =
    pathname.startsWith('/products/account') ||
    pathname.startsWith('/api/products/downloads');

  if (!isGated) return NextResponse.next();

  if (hasSessionCookie(request)) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/products/account/:path*', '/api/products/downloads/:path*'],
};
```

#### Login Pages + SignInForm

**NEW** `src/app/login/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { SignInForm } from '@/components/auth/SignInForm';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <Container as="section" className="py-24">
      <div className="mx-auto max-w-md">
        <header>
          <p className="text-sm uppercase tracking-wide text-muted">Storefront</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">Sign in</h1>
          <p className="mt-4 text-muted">
            Enter your email and we&rsquo;ll send you a one-time sign-in link.
            No password, no account setup.
          </p>
        </header>
        <div className="mt-10">
          <SignInForm callbackUrl={callbackUrl ?? '/products/account'} />
        </div>
      </div>
    </Container>
  );
}
```

**NEW** `src/app/login/verify/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';

export const metadata: Metadata = {
  title: 'Check your email',
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <Container as="section" className="py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm uppercase tracking-wide text-muted">Check your email</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">
          Sign-in link sent.
        </h1>
        <p className="mt-6 text-muted">
          We just sent you a one-time sign-in link. Click it from the same
          browser to continue to your account.
        </p>
        <p className="mt-4 text-sm text-muted">
          The link expires in 24 hours. If you don&rsquo;t see it, check spam.
        </p>
      </div>
    </Container>
  );
}
```

**NEW** `src/components/auth/SignInForm.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { signIn } from '@/auth';

interface SignInFormProps {
  callbackUrl: string;
}

type SignInState =
  | { status: 'idle' }
  | { status: 'error'; message: string };

async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get('email');
  const callbackUrl = formData.get('callbackUrl');
  if (typeof email !== 'string' || !email.includes('@')) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }
  try {
    await signIn('resend', {
      email,
      redirectTo:
        typeof callbackUrl === 'string' ? callbackUrl : '/products/account',
    });
    return { status: 'idle' };
  } catch (error) {
    return {
      status: 'error',
      message: 'Something went wrong sending the link. Try again in a moment.',
    };
  }
}

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(
    signInAction,
    { status: 'idle' },
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-md border border-mist bg-background px-4 py-3 text-foreground"
        />
      </label>
      {state.status === 'error' ? (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-parchment hover:bg-accent/90 disabled:opacity-60"
      >
        {isPending ? 'Sending link…' : 'Send me a sign-in link'}
      </button>
    </form>
  );
}
```

### Tests (red phase of section `storefront-auth-2.3`)

**NEW** `src/__tests__/middleware.test.ts` — pure function tests with
fabricated `NextRequest` objects:

- Request to `/products` (public) → passes through.
- Request to `/products/workflow-templates` (public) → passes through.
- Request to `/products/account` without a session cookie → redirects to `/login?callbackUrl=%2Fproducts%2Faccount`.
- Request to `/products/account/purchases/abc` without a session cookie → redirects with the full path preserved in `callbackUrl`.
- Request to `/api/products/downloads/xyz` without a session cookie → redirects to `/login?callbackUrl=%2Fapi%2Fproducts%2Fdownloads%2Fxyz`.
- Request to `/products/account` WITH the `authjs.session-token` cookie → passes through.
- Request to `/products/account` WITH the `__Secure-authjs.session-token` cookie (production prefix) → passes through.

**NEW** `src/app/login/__tests__/page.test.tsx`:

- Renders the sign-in heading.
- Renders `<SignInForm>` with a `callbackUrl` matching the `searchParams.callbackUrl`, defaulting to `/products/account` when absent.
- `metadata.robots` excludes the page from indexing.

**NEW** `src/components/auth/__tests__/SignInForm.test.tsx`:

- Submitting with an invalid email ("nope") renders an error message and does NOT call `signIn`.
- Submitting with a valid email calls `signIn('resend', { email, redirectTo: callbackUrl })` (mock at `@/auth`).
- While the action is pending, the submit button is disabled and shows "Sending link…".
- Rendered `<input type="email" required autoComplete="email">`.
- `callbackUrl` is sent as a hidden field so the server action can read it.

### Design Decisions

**Middleware:**
- **Cookie presence check is a lightweight filter, NOT real authentication** — the page handler (or the download route handler) re-validates via `auth()` from Auth.js. Middleware's job is "filter obvious anonymous traffic at the edge"; server components have the final word on whether the session is valid. This two-layer approach keeps the Edge middleware fast and Node-safe (no Auth.js imports in the Edge runtime).
- **Middleware file at project root, not `src/middleware.ts`** — Next.js 16 supports both, but the project-root convention is still the more common idiom and matches the Next.js docs' examples. Either works; pick one and stick with it.
- **Matcher uses two patterns** — `/products/account/:path*` AND `/api/products/downloads/:path*`. The download handler's route lives under `/api/*` not `/products/downloads/*` because Route Handlers and pages with the same path would collide. Documented here and in Feature 3.3.
- **`callbackUrl` preserves the full path + query** — after sign-in, Auth.js redirects back. Preserving the original destination is the minimum expected UX.
- **Both cookie names checked** — dev uses `authjs.session-token`, production (HTTPS) uses `__Secure-authjs.session-token`. Checking both means the same middleware runs in dev and prod.
- **No JWT decode in middleware** — tempting (to validate signature, check expiry) but Auth.js's `jwt.decode` pulls in crypto that isn't always Edge-compatible, and the page handler does it anyway. Minimize the Edge surface.

**Login pages + SignInForm:**
- **`searchParams: Promise<...>`** — Next.js 16 breaking change; same rule as `params`.
- **`SignInForm` imports `signIn` from `@/auth`** — Auth.js v5 exports `signIn` as a server action directly from the central config. The client component can import it thanks to Next.js's "use server" directive in the Auth.js file. Confirmed in Auth.js v5 docs.
- **`useActionState` for pending/error state** — matches the wf 4.1 `<EmailCapture>` pattern (also `useActionState` around a server action). Keeps the auth sign-in and email capture UIs consistent.
- **`robots: { index: false, follow: false }` on both login pages** — no SEO value, and Google indexing a login page is a minor negative signal.
- **No CSRF token** — Auth.js v5 handles CSRF internally via its own form endpoint. The server action path doesn't need an explicit token.
- **Verify page is a static component** — no dynamic data, no `cookies()` call, fully static render.
- **"Check your email" copy** — Auth.js calls it "verifyRequest" in config, but the URL and UX say "verify". Both OK; the user never sees the config name.

### Files

| Action   | File                                                |
|----------|-----------------------------------------------------|
| ✓ NEW    | `proxy.ts` (project root — Next.js 16 rename of `middleware.ts`) |
| ✓ NEW    | `src/__tests__/proxy.test.ts`                       |
| ✓ NEW    | `src/__tests__/proxy-login-integration.test.tsx`    |
| ✓ NEW    | `src/app/login/page.tsx`                            |
| ✓ NEW    | `src/app/login/verify/page.tsx`                     |
| ✓ NEW    | `src/components/auth/SignInForm.tsx`                |
| ✓ NEW    | `src/app/login/__tests__/page.test.tsx`             |
| ✓ NEW    | `src/app/login/verify/__tests__/page.test.tsx`      |
| ✓ NEW    | `src/components/auth/__tests__/SignInForm.test.tsx` |

---

## Phase 2 Exit Criteria

- `npm run lint` — clean
- `docker compose up -d postgres` — dev DB available
- `npm run db:generate && npm run db:migrate` — clean init migration
- `npm test` — schema, auth, middleware, SignInForm tests green
- `npm run build` — clean (Auth.js and Drizzle both compile in the standalone output)
- Manual smoke:
  - Anonymous GET `/products/account` → 307 to `/login?callbackUrl=%2Fproducts%2Faccount`
  - POST to the sign-in form with a real email → Resend delivers a magic-link email
  - Clicking the magic link → lands back at `/products/account` (which is still a 404/placeholder until Phase 4.1)
  - `authjs.session-token` cookie present
  - Anonymous GET `/`, `/episodes`, `/cases`, `/about`, `/tools`, `/products`, `/products/[slug]` all still return 200
- Drizzle studio (`npm run db:studio`) shows one `users` row and one `sessions` row after sign-in
