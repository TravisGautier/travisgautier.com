# travisgautier.com
Brand and marketing site for the Travis Gautier YouTube channel and social presence. Built and maintained by AI agents. Sister project: [The Large Language Library](https://largelanguagelibrary.ai).

## Local database setup

The `/products` storefront (storefront-auth job) requires a local Postgres 18 instance for Auth.js sessions, verification tokens, and purchase records. Public pages render fine without it, but `npm test` integration tests for `src/db/__tests__/schema.test.ts` are gated behind `DATABASE_URL` — they skip when unset.

1. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (the default `postgres://travisgautier:dev@localhost:5432/travisgautier` matches the docker-compose defaults).
2. Boot local Postgres (runs `docker compose up -d postgres`):
   ```bash
   npm run db:up
   ```
3. Apply migrations:
   ```bash
   npm run db:migrate
   ```
4. Start the Next.js dev server:
   ```bash
   npm run dev
   ```

Related scripts: `npm run db:generate` (emits a new migration after schema edits), `npm run db:studio` (browser GUI), `npm run db:down` (stop the stack; volume persists).
