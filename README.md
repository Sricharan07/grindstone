# Grindstone

Grindstone is a self-hosted four-week interview sprint engine for a private cohort. It turns a starting check and interview target into one clear next task, a guided curriculum, integrated coding lessons, scheduled recall, mock interviews, and measured progress.

## Run locally

Requires Node 22, pnpm through Corepack, and Docker Desktop. Create `.env` and set `POSTGRES_PASSWORD` plus a matching local `DATABASE_URL`, for example `postgres://grindstone:<url-encoded-password>@localhost:5433/grindstone`.

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d db redis sqlsandbox
pnpm db:migrate
pnpm db:seed
pnpm judge:smoke
mkdir -p "$HOME/.grindstone/codex-home"
CODEX_HOME="$HOME/.grindstone/codex-home" codex login --device-auth
pnpm dev
```

Set `GRINDSTONE_CODEX_HOME=$HOME/.grindstone/codex-home` in `.env`, then open [http://localhost:3000](http://localhost:3000). A new account begins with setup, resumes every answer, and unlocks training only after the starting check. The curated path contains 24 sessions and 12 integrated coding lessons in Python, Java, and C++. Judge, SQL, question, AI, and rubric failures are shown as failures; the app never invents a passing result.

## Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm content:audit
pnpm test:e2e
pnpm judge:smoke
```

`judge:smoke` requires Docker. Local development uses the ARM-friendly `docker-run` adapter; the hosted Compose profile explicitly uses Piston and must also pass this test on the real Windows host before untrusted code execution is enabled for the cohort.

The hosted readiness probe is `GET /api/health`. It returns HTTP 200 only when Postgres, Redis, the judge, and the isolated SQL sandbox are all reachable.

## Product routes

- `/` — one resume/start action first, then the daily plan and sprint context
- `/curriculum` — the plain-language four-week path and its interview purpose
- `/learn` — concept, worked example, prediction, editor, tests, explanation, and fresh transfer
- `/diagnostic` — a resumable starting check that sets the first difficulty
- `/practice` — calibrated MCQ, recognition drills, debugging, and SQL
- `/solve` — CodeMirror coding room with judge feedback and follow-ups
- `/mock` — a timed product-company coding screen with rubric debrief
- `/drive` — TCS NQT, Infosys, Wipro, Accenture, and big-tech simulations
- `/lab` — read-only SQL, planted codebase bugs, and AI-fluency rounds
- `/design` — staged system-design canvas and LLD rehearsal
- `/hr` — STAR evidence, answer, resume, and group-discussion practice
- `/sprint-review` — evening check-in, Friday gate, and Saturday retro
- `/progress` — readiness, topic mastery, and calibration evidence
- `/league` — weekly XP league and accountability feed
- `/onboarding` — route selection, commitment contract, and diagnostic setup

Import an editable LeetCode export with `pnpm content:import -- /absolute/path/to/leetcode-export.json`. Imported metadata stays `verified`, and therefore hidden from learners, until an executable harness exists. Queue a verified content batch with `pnpm content:generate -- "Percentages" quantitative 20` after Postgres, Redis, the worker, judge, and the dedicated owner Codex login are configured.

## Architecture

The App Router UI is under `app/` and `components/`. The adaptive engine lives in `lib/engine`, judge adapters in `lib/judge`, content verification in `lib/content`, the Drizzle schema in `db/schema.ts`, and overnight jobs in `worker/`.

The hosted Docker profile forces authentication on, refuses to boot without Google OAuth, an email allowlist, a dedicated owner ChatGPT login, and a public URL. AI runs through the local Codex app-server with Luna at extra-high reasoning and no model fallback. The stack also includes Postgres 17, an isolated SQL sandbox, Redis/BullMQ, Piston with a three-language bootstrap, the worker, rotating backups, and Cloudflare Tunnel. See the [product plan](docs/PRODUCT_PLAN.md), [Windows hosting](docs/WINDOWS_HOSTING.md), and [pedagogy](docs/PEDAGOGY.md).
