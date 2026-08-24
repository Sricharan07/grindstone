# Windows Host Runbook

## First boot

1. Install Docker Desktop with the WSL2 backend and enable start on login.
2. Disable Windows Fast Startup and configure the host not to sleep while plugged in.
3. Copy `.env.example` to `.env`. Set a long random `POSTGRES_PASSWORD`, a matching URL-encoded `DATABASE_URL`, `AUTH_SECRET`, the public HTTPS `AUTH_URL`, Google OAuth credentials, `ALLOWED_EMAILS`, an `ADMIN_EMAILS` subset, and `TUNNEL_TOKEN`.
4. Run `docker compose config` and confirm it contains no unexpected public database, Redis, judge, or SQL-sandbox binding.
5. Run `docker compose up -d db redis sqlsandbox judge piston-init`. The one-shot `piston-init` service downloads Python, Java, and C++ into the persistent judge volume. Confirm it exits with status 0.
6. Run `pnpm db:migrate && pnpm db:seed`.
7. Run `pnpm judge:smoke`. Do not open the instance to friends until all four containment cases fail correctly.
8. Build the hosted image, then connect the owner ChatGPT account to the dedicated Codex volume. Friends never perform this login and the credential never reaches the browser:

```bash
docker compose --profile host build web worker
docker compose --profile host run --rm -e CODEX_HOME=/codex-home --entrypoint codex web login --device-auth
```

9. Start the hosted profile with `docker compose --profile host up -d`.
10. Wait for `curl --fail http://127.0.0.1:3000/api/health` to return an all-green core-service report. Open Settings and confirm the AI tutor reports `gpt-5.6-luna`, extra-high reasoning, and an owner ChatGPT connection. Then sign in with every allowlisted account once.

## AI tutor boundary

Grindstone starts one local Codex app-server process inside the web container. It reads only the dedicated `/codex-home` volume, uses the owner ChatGPT login, forces `gpt-5.6-luna` with `xhigh` reasoning, and explicitly disables provider model fallback. Tutor turns are isolated by learner and lesson, run in an empty read-only workspace with network access disabled, and cannot approve commands. Per-user daily quotas and a global concurrency limit protect the owner account.

If the owner login expires or Luna is unavailable, lessons, saved drafts, practice, and the judge keep working. AI buttons report the exact outage; Grindstone does not silently switch models or invent a hint. Reconnect with the device-login command above.

## Judge selection

Piston is preferred. It needs `privileged: true` because isolate manages cgroups. The official image starts without runtimes, so `piston-init` installs the required packages through Piston's package API before the hosted web and worker services start.

The included `docker-run` adapter is a diagnostic fallback for running the web and worker processes directly inside WSL2, where the Docker CLI can reach Docker Desktop. Do not select it inside the hosted Compose web container: that container deliberately has neither the Docker socket nor host-level Docker privileges. The fallback starts one networkless, memory-limited, PID-limited, read-only container per execution.

The databases and Redis are attached only to Docker's internal network. Piston also joins the outbound edge network so its package manager can fetch signed runtime archives; learner executions still have outbound networking disabled by Piston's isolate sandbox. The web and worker use edge for API calls. Cloudflared attaches only to edge and reaches the web container by service name; no router port is required.

## Cloudflare Tunnel

Create a named tunnel in Cloudflare Zero Trust, map the public hostname to `http://web:3000`, and put its token in `TUNNEL_TOKEN`. The `cloudflared` container dials out. Keep the host's inbound firewall closed.

## Backups

The host profile keeps seven daily dumps in `./backups/daily` and four Sunday snapshots in `./backups/weekly`. Copy the weekly snapshot to another machine or encrypted cloud storage. A backup that remains on the same PC is not disaster recovery.

Restore into a fresh database with:

```bash
pg_restore --clean --if-exists --no-owner \
  --dbname "$DATABASE_URL" backups/weekly/grindstone-YYYY-MM-DDTHH-MM-SSZ.dump
```

## Updates

```bash
git pull
docker compose --profile host up -d --build
docker compose --profile host wait piston-init
pnpm db:migrate
pnpm judge:smoke
```

Inspect `docker compose ps` and `docker compose logs --tail=200 web worker judge` after every update.

## Release gate

Do not share the tunnel until all of these pass on the Windows host:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm content:audit
pnpm test:e2e
pnpm judge:smoke
curl --fail http://127.0.0.1:3000/api/health
```
