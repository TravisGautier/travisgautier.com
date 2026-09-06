# Deployment Runbook — Timewave2 + travisgautier.com (Hetzner CPX41)

**Audience:** Claude Code, executing on the server as the `travis` user.

> **Secrets policy.** This file must never contain a credential. Values marked
> `<from password manager>` live in the password manager and in the server-side
> `.env` files only. An earlier revision of this document committed both
> Postgres role passwords to a public repo (June–September 2026); both roles
> were rotated during the September 2026 rebrand cutover (see CUTOVER §e) and
> `src/__tests__/brand/secrets-sentinel.test.ts` now fails the build on any
> credential-shaped string in docs or source.
**Goal:** Provision a single Hetzner CPX41 box and bring up two production apps
co-hosted behind Nginx with one shared PostgreSQL 18 instance.

---

## CREDENTIALS / VALUES VAULT

Filled in as of this revision. **`SERVER_IP` is the only placeholder remaining**
and must be set once the Hetzner box is provisioned.

| Variable | Value |
|---|---|
| Server public IP (v4) | `5.78.65.127` |
| Server public IP (v6) | `2a01:4ff:1f0:ead4::/64` |
| Server name / Hetzner ID | `fabledtimewave` / `#137275840` |
| Server location | Hillsboro, OR (us-west) |
| Timewave2 repo | `git@github.com:TravisGautier/timewave2.git` (also present at `/home/travis/Projects/Timewave2` locally) |
| travisgautier.com repo | `git@github.com:TravisGautier/travisgautier.com.git` (also present at `/home/travis/Projects/travisgautier.com` locally; the old `fabled10x/fabled10x.com` URL redirects) |
| Timewave2 domain | `timewave2.com` |
| travisgautier.com domain | `travisgautier.com` (primary). `fabled10x.com` is retained only to 301 → travisgautier.com |
| Postgres `timewave2_app` role password | `<from password manager>` — rotated Sept 2026 |
| Postgres `travisgautier_app` role password | `<from password manager>` — rotated Sept 2026 |
| Stripe + Resend secrets (travisgautier.com) | provided via `.env`, never hardcoded |
| Admin user | `travis` |

**Locked assumptions for this revision:**
- Node 22 LTS · Python 3.12 · Uvicorn on `127.0.0.1:8000` · Nuxt SSR on
  `127.0.0.1:3001` · Next.js on `127.0.0.1:3000`
- **travisgautier.com = npm** (single Next.js app, no workspace — matches local repo)
- **Timewave2 web = pnpm** (it's a pnpm workspace monorepo at `program/web/`
  with `frontend-nuxt` + sibling `packages/*`; pnpm workspaces was the migration
  driver — see commit `e29fc3c`)
- Timewave2 backend lives at `program/web/backend/`; FastAPI app object is
  `main:app` (file `program/web/backend/main.py`).
- `libtimewave2_core.so` is built into `program/build/core/` (CMake build dir).

---

## TARGET ARCHITECTURE (read first — this is the "why")

One CPX41: **8 vCPU AMD / 16 GB / 240 GB / Ubuntu 26.04**, Hillsboro OR.

**Project 1 — Timewave2** (`/home/travis/Projects/Timewave2`)
- Uvicorn / FastAPI (Python), calls `libtimewave2_core.so` via ctypes
- Nuxt 3 SSR frontend (port 3001) — pnpm workspace member `frontend-nuxt`
- Redis (rate limiting, token blacklist, cache)
- ARQ background worker (systemd, **MemoryMax=1G**)

**Project 2 — travisgautier.com** (`/home/travis/Projects/travisgautier.com`)
- Next.js 16 App Router (`next start`) — marketing/brand site
- Drizzle ORM → **shared** Postgres (migrating off its own docker-compose Postgres)
- Stripe + Resend (external, no local footprint)

**Shared:** one PostgreSQL 18 with two databases (`timewave2`, `travisgautier`),
one Redis, Nginx as the single reverse proxy.

**RAM budget (medium/high traffic):**

| Service | Steady RSS |
|---|---|
| PostgreSQL (shared, tuned for 2 apps) | 2.0–3.0 GB |
| Redis | 300–800 MB |
| Uvicorn × 4 workers | 0.8–1.2 GB |
| ARQ worker (MemoryMax=1G) | up to 1 GB |
| Nuxt SSR | 400–700 MB |
| Next.js SSR | 350–600 MB |
| Nginx + OS + cache + headroom | 1.5 GB |
| **Total** | **~7–10 GB steady, 11–13 GB burst** |

**Hard tuning constraints — do not deviate:**
1. **Uvicorn: 4 workers.** NOT the `(2 × cores) + 1` formula (that gives 17 on
   8 cores — far too aggressive for a co-hosted box with CPU-bound math).
   Start at 4, monitor, scale to 6 only if needed.
2. **Postgres `shared_buffers` ≈ 2 GB** — ~25% of Postgres's *slice*, NOT 25%
   of total RAM. The "25% of RAM" rule is wrong on a co-hosted box.
3. **Redis: set `maxmemory` with LRU eviction.** Without it, Redis grows until OOM.
4. **ARQ worker capped at 1 GB** via `MemoryMax=1G` in the systemd unit.
5. `libtimewave2_core.so` is mmap'd — code pages are copy-on-write shared
   across uvicorn workers. Only per-request NumPy/heap allocs are per-worker.

**Upgrade path if it gets tight:** swap pressure or slow calculator → resize to
CPX51 (32 GB) for RAM, or migrate to **CCX33 (8 dedicated vCPU / 32 GB)** if the
bottleneck is CPU contention rather than RAM.

---

## OPERATING RULES FOR CLAUDE CODE

- You run as `travis`, which has **passwordless sudo**. Prefix any
  root-requiring command with `sudo`. **Never run `claude` itself with sudo.**
- Execute phases **in order**. **Stop on the first failing step** — report the
  failure, do not continue or "work around" it.
- After each phase, run its **validation** block and confirm green before moving on.
- Treat this as production. When a step is destructive (dropping the old
  travisgautier Postgres, restarting a live service), state what you're about to do
  and confirm the backup/snapshot exists first.

---

## PHASE 0 — Server bootstrap (HUMAN runs this once, as root)

This is the only part Claude Code does **not** do — it's the chicken-and-egg
step that creates the user Claude Code then runs as. Travis runs this over SSH
as `root` immediately after the box is created:

```bash
adduser travis
usermod -aG sudo travis

echo 'travis ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/travis-nopasswd
chmod 440 /etc/sudoers.d/travis-nopasswd
visudo -c -f /etc/sudoers.d/travis-nopasswd      # must print "parsed OK"

mkdir -p /home/travis/.ssh
cp /root/.ssh/authorized_keys /home/travis/.ssh/authorized_keys
chown -R travis:travis /home/travis/.ssh
chmod 700 /home/travis/.ssh && chmod 600 /home/travis/.ssh/authorized_keys
```

Then log out, log back in as `travis`, install Claude Code, and hand it this file:

```bash
ssh travis@5.78.65.127
curl -fsSL https://claude.ai/install.sh | bash
export PATH="$HOME/.local/bin:$PATH"      # installer prints the exact line for ~/.bashrc
claude --version
claude --dangerously-skip-permissions     # required: this flag is BLOCKED as root
```

---

## PHASE 1 — System packages (Claude Code, as travis)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential cmake ufw fail2ban \
    python3 python3-venv python3-dev \
    postgresql postgresql-client \
    redis-server nginx certbot python3-certbot-nginx
```

Node 22 LTS via nvm (Next.js 16 + Nuxt 3 need Node 20+; 22 is the safe LTS).
**Both `npm` (built into Node) and `pnpm` are installed — travisgautier.com uses npm,
Timewave2 web uses pnpm.**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22 && nvm use 22 && nvm alias default 22
npm install -g pnpm
```

**Validate:** `node -v` (v22.x), `npm -v`, `pnpm -v`, `python3 --version`,
`psql --version` (18.x — Ubuntu 26.04 default), `redis-server --version`,
`nginx -v`, `cmake --version`.

---

## PHASE 2 — Shared PostgreSQL 18

Create two databases with separate roles (least-privilege per app):

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE timewave2_app LOGIN PASSWORD '<from password manager>';
CREATE ROLE travisgautier_app LOGIN PASSWORD '<from password manager>';
CREATE DATABASE timewave2 OWNER timewave2_app;
CREATE DATABASE travisgautier OWNER travisgautier_app;
SQL
```

Tune for a co-hosted box — edit `/etc/postgresql/18/main/postgresql.conf`:

```
shared_buffers = 2GB
effective_cache_size = 4GB
work_mem = 32MB
maintenance_work_mem = 256MB
max_connections = 100
```

```bash
sudo systemctl restart postgresql
```

**Validate:** `sudo -u postgres psql -c "\l"` shows both DBs;
`psql "postgresql://travisgautier_app:<from password manager>@127.0.0.1/travisgautier" -c "select 1;"`
connects.

---

## PHASE 3 — Redis (bounded memory)

Edit `/etc/redis/redis.conf`:

```
maxmemory 768mb
maxmemory-policy allkeys-lru
```

```bash
sudo systemctl restart redis-server && sudo systemctl enable redis-server
```

**Validate:** `redis-cli ping` → `PONG`; `redis-cli config get maxmemory-policy`
→ `allkeys-lru`.

---

## PHASE 4 — Deploy Timewave2

```bash
cd /home/travis/Projects
git clone git@github.com:TravisGautier/timewave2.git Timewave2
cd Timewave2
```

1. **Build the C library** (CMake out-of-tree build):
   ```bash
   cd program
   cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
   cmake --build build -j$(nproc)
   # produces program/build/core/libtimewave2_core.so
   cd ..
   ```
2. **Python env + backend deps:**
   ```bash
   python3 -m venv .venv && source .venv/bin/activate
   pip install --upgrade pip
   pip install -r program/web/backend/requirements.txt
   ```
3. **Env:** create `/home/travis/Projects/Timewave2/.env` with
   `DATABASE_URL=postgresql://timewave2_app:<from password manager>@127.0.0.1:5432/timewave2`
   and `REDIS_URL=redis://127.0.0.1:6379` (plus whatever other vars
   `program/web/backend/config.py` reads). Run DB migrations:
   `cd program/web/backend && alembic upgrade head`.
4. **Nuxt SSR build (pnpm workspace at `program/web/`):**
   ```bash
   cd /home/travis/Projects/Timewave2/program/web
   pnpm install
   pnpm --filter frontend-nuxt build
   # produces program/web/frontend-nuxt/.output/server/index.mjs
   ```

Create systemd units (Claude Code writes these):

`/etc/systemd/system/timewave2-api.service` — Uvicorn, **4 workers**, port 8000:
```ini
[Unit]
Description=Timewave2 FastAPI (uvicorn)
After=network.target postgresql.service redis-server.service

[Service]
User=travis
WorkingDirectory=/home/travis/Projects/Timewave2/program/web/backend
ExecStart=/home/travis/Projects/Timewave2/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
EnvironmentFile=/home/travis/Projects/Timewave2/.env

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/timewave2-nuxt.service` — Nuxt SSR, port 3001:
```ini
[Unit]
Description=Timewave2 Nuxt SSR
After=network.target

[Service]
User=travis
WorkingDirectory=/home/travis/Projects/Timewave2/program/web/frontend-nuxt
Environment=HOST=127.0.0.1
Environment=PORT=3001
Environment=NODE_ENV=production
ExecStart=/home/travis/.nvm/versions/node/v22/bin/node .output/server/index.mjs
Restart=always
EnvironmentFile=/home/travis/Projects/Timewave2/.env

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/timewave2-arq.service` — ARQ worker, **with the cap**:
```ini
[Unit]
Description=Timewave2 ARQ worker
After=network.target redis-server.service

[Service]
User=travis
WorkingDirectory=/home/travis/Projects/Timewave2/program/web/backend
ExecStart=/home/travis/Projects/Timewave2/.venv/bin/arq app.worker.WorkerSettings
Restart=always
MemoryMax=1G
EnvironmentFile=/home/travis/Projects/Timewave2/.env

[Install]
WantedBy=multi-user.target
```

> **TBD at run-time:** confirm the ARQ `WorkerSettings` import path before
> enabling. If `app.worker.WorkerSettings` doesn't resolve under
> `program/web/backend/`, find the actual module path with
> `grep -r "class WorkerSettings" program/web/backend/`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now timewave2-api timewave2-nuxt timewave2-arq
```

**Validate:** all three `systemctl status` are `active (running)`;
`curl -s 127.0.0.1:8000/health` and `curl -s 127.0.0.1:3001` respond.

---

## PHASE 5 — Deploy travisgautier.com (incl. Postgres migration)

```bash
cd /home/travis/Projects
git clone git@github.com:TravisGautier/travisgautier.com.git travisgautier.com
cd travisgautier.com
npm ci
```

**Migrate off the docker-compose Postgres → shared instance:**
1. Set `DATABASE_URL` in `/home/travis/Projects/travisgautier.com/.env`:
   `DATABASE_URL=postgresql://travisgautier_app:<from password manager>@127.0.0.1:5432/travisgautier`
   plus `AUTH_URL=https://travisgautier.com`, `AUTH_RESEND_FROM=no-reply@travisgautier.com`,
   and all `AUTH_*`, `RESEND_*`, `STRIPE_*`, `NEXT_PUBLIC_*` from your secret
   store — see `/home/travis/Projects/travisgautier.com/.env.example` for the full list.
2. If the old docker-compose Postgres has data worth keeping, `pg_dump` it and
   restore into the shared DB **before** running migrations. Otherwise skip.
3. `npm run db:migrate` (or whatever the Drizzle migrate script is — check
   `package.json` scripts).
4. Once verified, **stop and remove** the docker-compose Postgres so it isn't
   eating RAM: `docker compose down` (confirm the dump exists first).

```bash
npm run build
```

`/etc/systemd/system/travisgautier.service` — `next start`, port 3000:
```ini
[Unit]
Description=travisgautier.com Next.js
After=network.target postgresql.service

[Service]
User=travis
WorkingDirectory=/home/travis/Projects/travisgautier.com
Environment=PORT=3000
Environment=NODE_ENV=production
ExecStart=/home/travis/.nvm/versions/node/v22/bin/npm start
Restart=always
EnvironmentFile=/home/travis/Projects/travisgautier.com/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now travisgautier
```

**Validate:** `systemctl status travisgautier` is running; `curl -s 127.0.0.1:3000`
returns the homepage. Confirm only **one** Postgres is running (`sudo ss -ltnp | grep 5432`).

---

## PHASE 6 — Nginx reverse proxy + TLS

Create one server block per domain in `/etc/nginx/sites-available/`, symlink to
`sites-enabled/`, proxying to the right local port:

- `timewave2.com` → Nuxt SSR `127.0.0.1:3001`, with `/api/` → `127.0.0.1:8000`
- `travisgautier.com` (+ `www`) → `127.0.0.1:3000`
- `fabled10x.com` (+ `www`) → **301 only** → `https://travisgautier.com$request_uri`

`/etc/nginx/sites-available/travisgautier.com` (port 80 only — certbot adds the
443 block and the 80→443 redirect):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name travisgautier.com www.travisgautier.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/travisgautier.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Issue certs (only after DNS resolves — see Phase 7). Certbot rewrites the block
above into 80 (redirect) + 443 (proxy):

```bash
sudo certbot --nginx -d travisgautier.com -d www.travisgautier.com --redirect
sudo certbot renew --dry-run
```

Then add the `www` → apex redirect inside the 443 block certbot wrote:

```nginx
    if ($host = www.travisgautier.com) { return 301 https://travisgautier.com$request_uri; }
```

`/etc/nginx/sites-available/fabled10x.com` — legacy domain, redirect only. Keep
the `ssl_certificate*` / `include` lines certbot originally wrote so the old
cert keeps renewing and HTTPS links redirect cleanly:

```nginx
server {
    listen 80; listen [::]:80;
    server_name fabled10x.com www.fabled10x.com;
    return 301 https://travisgautier.com$request_uri;
}
server {
    listen 443 ssl; listen [::]:443 ssl;
    server_name fabled10x.com www.fabled10x.com;
    # keep the ssl_certificate, ssl_certificate_key, include options-ssl-nginx.conf
    # and ssl_dhparam lines certbot already wrote for this lineage
    return 301 https://travisgautier.com$request_uri;
}
```

Check `sudo certbot certificates` before touching lineage paths — the original
cert was issued jointly for `timewave2.com` + `fabled10x.com`.

**Validate:** `sudo nginx -t` passes; `curl -I https://travisgautier.com` returns
200; `curl -I https://fabled10x.com/about` returns 301 with
`location: https://travisgautier.com/about`.

---

## PHASE 7 — DNS (HUMAN, in the Cloudflare dashboard)

Both zones use Cloudflare nameservers (`gene.ns.cloudflare.com`,
`ryan.ns.cloudflare.com`). Records are **DNS-only (grey cloud)** — certbot's
HTTP-01 challenge must reach nginx directly, and there is no benefit to a second
TLS layer for this workload.

- `travisgautier.com` → `A @ 5.78.65.127` (grey); `CNAME www travisgautier.com` (grey).
  Delete any proxied (orange) records or Cloudflare Pages custom-domain bindings
  left over from the former Three.js landing page; disable "Always Use HTTPS"
  for the zone if it was on.
- `fabled10x.com` → `A @ 5.78.65.127` (grey); `CNAME www fabled10x.com` (grey).
  **Keep** — it must resolve to serve the 301s.
- `timewave2.com` → `A @ 5.78.65.127`; `CNAME www timewave2.com`.
- Resend: add the DKIM TXT (`resend._domainkey`), SPF TXT and MX records Resend
  shows for `travisgautier.com` when the domain is added in the Resend console.

Wait for `dig +short travisgautier.com @1.1.1.1` → `5.78.65.127`, then run the
certbot step in Phase 6.

---

## PHASE 8 — Backups & safety net

1. **Hetzner image Backups** — enable in the Cloud console (≈20% of server price).
   Disk-level, good for full-box rollback.
2. **Postgres logical backups** — disk snapshots are NOT a DB backup. Add a cron:
   ```bash
   # /etc/cron.d/pg-backup  (daily, both DBs)
   0 3 * * * travis pg_dump travisgautier | gzip > /home/travis/backups/travisgautier-$(date +\%F).sql.gz
   15 3 * * * travis pg_dump timewave2 | gzip > /home/travis/backups/timewave2-$(date +\%F).sql.gz
   ```
3. Before any risky change, take a Hetzner snapshot first.

---

## FINAL VALIDATION

Run all of these and report results:

```bash
free -h                                   # confirm steady use well under 16 GB, no swap
systemctl status timewave2-api timewave2-nuxt timewave2-arq travisgautier nginx postgresql redis-server
sudo ss -ltnp | grep -E ':(80|443|3000|3001|8000|5432|6379)'
curl -I https://travisgautier.com
curl -I https://fabled10x.com    # 301 → travisgautier.com
curl -I https://timewave2.com
```

Expected: every service `active (running)`, RAM comfortably under budget, both
sites returning 200 over HTTPS, exactly one Postgres on 5432.

---

## CUTOVER — fabled10x → travisgautier.com (September 2026, one-time)

Run in this order on the server as `travis`. Downtime ≈ build time (2–5 min).

**Pre-flight**
```bash
# Hetzner snapshot first (Cloud console). Then:
mkdir -p ~/backups
pg_dump fabled10x | gzip > ~/backups/fabled10x-pre-rename-$(date +%F).sql.gz
cp ~/Projects/fabled10x/.env ~/backups/fabled10x.env.bak
sudo cp /etc/nginx/sites-available/fabled10x.com ~/backups/nginx-fabled10x.com.bak
sudo cp /etc/systemd/system/fabled10x.service ~/backups/
```

**a. DNS** — Phase 7 above (Cloudflare, grey cloud). Confirm `dig +short travisgautier.com @1.1.1.1`.

**b. nginx + c. certbot** — Phase 6 above for `travisgautier.com` (the old unit is
still serving on :3000, so the new hostname works immediately).

**d. Checkout move + systemd**
```bash
sudo systemctl stop fabled10x
cd /home/travis/Projects && mv fabled10x travisgautier.com && cd travisgautier.com
git remote set-url origin git@github.com:TravisGautier/travisgautier.com.git
git pull --ff-only origin main
$EDITOR .env   # DATABASE_URL (after step e), AUTH_URL=https://travisgautier.com,
               # AUTH_RESEND_FROM=no-reply@travisgautier.com,
               # RESEND_FROM_COHORTS="Travis Gautier <no-reply@travisgautier.com>",
               # NEXT_PUBLIC_SUBSTACK_EMBED_URL=<new embed URL, or leave until it exists>
```

**e. Postgres rename + password rotation** (service stopped; connect to the `postgres` DB)
```bash
NEWPW=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32); echo "$NEWPW"   # → password manager
sudo -u postgres psql -v pw="$NEWPW" <<'SQL'
SELECT rolname, left(rolpassword,14) AS hash FROM pg_authid WHERE rolname='fabled10x_app';  -- expect SCRAM-SHA-256$
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='fabled10x' AND pid<>pg_backend_pid();
ALTER DATABASE fabled10x RENAME TO travisgautier;
ALTER ROLE fabled10x_app RENAME TO travisgautier_app;
ALTER ROLE travisgautier_app PASSWORD :'pw';
\l travisgautier
SQL
# Rotate the Timewave2 role too (its old password was also in this file):
TWPW=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32); echo "$TWPW"
sudo -u postgres psql -v pw="$TWPW" -c "ALTER ROLE timewave2_app PASSWORD :'pw';"
$EDITOR /home/travis/Projects/Timewave2/.env      # DATABASE_URL password
sudo systemctl restart timewave2-api timewave2-arq
```
SCRAM preserves the hash across a role rename (only MD5 hashes are cleared), but
both passwords are rotated regardless because the old values were committed to
a public repo. Set `DATABASE_URL=postgresql://travisgautier_app:<NEWPW>@127.0.0.1:5432/travisgautier`
in `.env`, then:
```bash
psql "$(grep ^DATABASE_URL .env | cut -d= -f2-)" -c 'select 1'
sudo sed -i 's|pg_dump fabled10x |pg_dump travisgautier |; s|backups/fabled10x-|backups/travisgautier-|' /etc/cron.d/pg-backup
```

**f. Build + new unit**
```bash
npm ci && npm run db:migrate && npm run build   # rebuild: .next embeds the old absolute appDir
sudo tee /etc/systemd/system/travisgautier.service >/dev/null <<'EOF'
[Unit]
Description=travisgautier.com Next.js
After=network.target postgresql.service

[Service]
User=travis
WorkingDirectory=/home/travis/Projects/travisgautier.com
Environment=PORT=3000
Environment=NODE_ENV=production
ExecStart=/home/travis/.nvm/versions/node/v22/bin/npm start
Restart=always
EnvironmentFile=/home/travis/Projects/travisgautier.com/.env

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl disable fabled10x; sudo rm /etc/systemd/system/fabled10x.service
sudo systemctl daemon-reload && sudo systemctl enable --now travisgautier
systemctl status travisgautier --no-pager; curl -s -o /dev/null -w '%{http_code}\n' 127.0.0.1:3000/
```

**g. Legacy 301** — now switch `/etc/nginx/sites-available/fabled10x.com` to the
redirect-only blocks in Phase 6; `sudo nginx -t && sudo systemctl reload nginx`.

**h. External consoles (human)** — Resend: add + verify `travisgautier.com`
(keep `AUTH_RESEND_FROM` on the old verified domain until verified, or magic-link
login breaks). Stripe: **edit** the existing webhook endpoint URL to
`https://travisgautier.com/api/stripe/webhook` (editing keeps `STRIPE_WEBHOOK_SECRET`).
Substack: create the new publication, set `NEXT_PUBLIC_SUBSTACK_EMBED_URL`.
Google Search Console: add property + Change of Address from fabled10x.com.

**i. Verify**
```bash
curl -sI https://travisgautier.com/ | head -1                                   # 200
curl -sI http://travisgautier.com/ | grep -i location                           # https://travisgautier.com/
curl -sI https://www.travisgautier.com/about | grep -i location                 # https://travisgautier.com/about
curl -sI https://fabled10x.com/cases/party-masters | grep -iE 'HTTP|location'   # 301 → travisgautier.com/...
curl -s https://travisgautier.com/sitemap.xml | grep -c fabled10x               # 0
curl -s https://travisgautier.com/robots.txt | grep Sitemap
curl -s https://travisgautier.com/ | grep -o '<title>[^<]*'
echo | openssl s_client -connect travisgautier.com:443 -servername travisgautier.com 2>/dev/null | openssl x509 -noout -ext subjectAltName
```
Then a magic-link login and a Stripe test-mode purchase.

**Rollback**
```bash
sudo systemctl stop travisgautier
mv ~/Projects/travisgautier.com ~/Projects/fabled10x
sudo cp ~/backups/fabled10x.service /etc/systemd/system/
sudo cp ~/backups/nginx-fabled10x.com.bak /etc/nginx/sites-available/fabled10x.com
sudo -u postgres psql -c "ALTER DATABASE travisgautier RENAME TO fabled10x" -c "ALTER ROLE travisgautier_app RENAME TO fabled10x_app"
# put the NEW (rotated) password into the restored .env — never the leaked one
sudo systemctl daemon-reload && sudo nginx -t && sudo systemctl reload nginx && sudo systemctl start fabled10x
```
`fabled10x.com` DNS is never changed, so the old site is reachable as soon as the
301 block is reverted.

---

## REDEPLOY (routine)

```bash
cd /home/travis/Projects/travisgautier.com
git pull --ff-only origin main
npm ci
ls src/db/migrations/*.sql | wc -l          # if new migrations landed → npm run db:migrate
npm run build
sudo systemctl restart travisgautier
curl -sf -o /dev/null -w '%{http_code}\n' https://travisgautier.com/     # 200
journalctl -u travisgautier -n 50 --no-pager
```

---

## NOTES

- This runbook assumes Claude Code runs **on the server** as `travis` (the
  pattern used for the Party Masters box). If you instead drive it from your
  local codebase sandbox, it should execute these steps over SSH to `5.78.65.127`.
- TLS uses Nginx + certbot to match the Timewave2 stack. If you'd rather not
  hand-manage certs, Caddy with on-demand TLS is a drop-in alternative for the
  reverse-proxy layer.
- Ports, package manager, and service entrypoints are pinned in the
  **Credentials / Values Vault** at the top. Update there if anything changes.
