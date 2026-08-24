# Grindstone

Grindstone is a self-hosted 28-day interview preparation product for a small private cohort. It combines coding patterns, full-stack engineering, applied AI, SQL and aptitude, and interview communication in one fixed 150-minute daily path.

The learner chooses Python or Java. Every learning day moves through the same loop: understand with plain-language explanations, generated concept art, a deterministic visualization, and one selected video; predict; code in the built-in editor; explain; then solve again without help. Luna is available inside the lesson and problem editor through the owner's dedicated Codex login.

## Run locally

Requires Node 22 and pnpm through Corepack. The interface can run with browser or in-memory persistence; PostgreSQL, Redis, Docker, and the judge are required for the full shared-cohort deployment.

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). With `AUTH_REQUIRED` unset, Grindstone uses the local development member and works without Google login.

For the full stack:

```bash
docker compose up -d db redis sqlsandbox
pnpm db:migrate
pnpm db:seed
pnpm judge:smoke
mkdir -p "$HOME/.grindstone/codex-home"
CODEX_HOME="$HOME/.grindstone/codex-home" codex login --device-auth
```

Set `GRINDSTONE_CODEX_HOME=$HOME/.grindstone/codex-home` in `.env`. This must be a dedicated owner-controlled Codex home, not a browser token or a copied ChatGPT cookie. The hosted profile limits concurrent and daily Luna turns and keeps all credentials on the server.

To invite friends, configure Google OAuth, set `AUTH_REQUIRED=true`, and add comma-separated addresses to `ALLOWED_EMAILS`. Each approved account receives a separate profile, sprint state, attempt history, and optional scoreboard identity.

## Product routes

- `/` - one next action, today's 150-minute session, streak, and sprint position
- `/curriculum` - all 28 days, weekly outcomes, gates, consolidation days, and project evidence
- `/learn/[slug]` - concept, art, visualization, selected video, Luna, editor, explanation, and independent transfer
- `/session/[day]/[activity]` - timed aptitude, daily Evidence Desk labs, and no-help weekly gates
- `/problems` - 150 runnable packages, including the scheduled Core 40
- `/progress` - evidence-backed readiness, attempt history, streaks, calibration, and opt-in friend scoreboard
- `/settings` - name, Python or Java, session time, timezone, persistence, and Luna status
- `/onboarding` - resumable name, language, and schedule setup
- `/login` - allowlisted Google sign-in when hosted authentication is enabled

Older shared links such as `/practice`, `/solve`, `/mock`, and `/league` redirect into the simpler route structure.

## Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm content:audit
pnpm judge:smoke
```

`test:e2e` starts an isolated development server unless `PLAYWRIGHT_BASE_URL` is supplied. `judge:smoke` needs Docker. The readiness probe is `GET /api/health`; it returns 200 only when the configured production dependencies are reachable.

## Architecture

The Next.js App Router UI is in `app/` and `components/`. The canonical 28-day plan is in `lib/curriculum`, the 20 complete learning packages in `lib/learning`, the 150-problem library in `lib/problems`, adaptive evidence logic in `lib/engine` and `lib/product`, isolated execution in `lib/judge`, and persistence in `lib/server` plus `db/`.

The product specification is [docs/PRD.md](docs/PRD.md). Hosted setup details are in [docs/WINDOWS_HOSTING.md](docs/WINDOWS_HOSTING.md).
