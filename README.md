# Grindstone

Grindstone is a self-hosted four-week interview sprint engine for a private cohort. It turns a diagnostic and interview target into a daily deliberate-practice plan with weekly gates, PRIMM lessons, a sandboxed coding gym, timed simulations, mastery scheduling, calibration, and group accountability.

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
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). A new account begins with zero XP, zero readiness, no cohort activity, and a draft sprint. Run onboarding and the diagnostic to create the first plan. The seed installs 1,200 audited launch questions, the verified PRIMM lesson, five planted-bug repositories, company policy records, and the judge-backed Two Sum problem. Judge, SQL, question, and rubric failures are shown as failures; the app never invents a passing result.

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

- `/` — Today, burndown, standup, daily plan, readiness, and friend activity
- `/learn` — full PRIMM lesson with prediction and execution visualization
- `/diagnostic` — route-setting day-one diagnostic and mastery priors
- `/practice` — calibrated MCQ, recognition drills, debugging, and SQL
- `/solve` — CodeMirror coding room with judge feedback and follow-ups
- `/mock` — a timed product-company coding screen with rubric debrief
- `/drive` — TCS NQT, Infosys, Wipro, Accenture, and big-tech simulations
- `/curriculum` — route-aware fundamentals, DSA tiers, and recognition patterns
- `/lab` — read-only SQL, planted codebase bugs, and AI-fluency rounds
- `/design` — staged system-design canvas and LLD rehearsal
- `/hr` — STAR evidence, answer, resume, and group-discussion practice
- `/sprint-review` — evening check-in, Friday gate, and Saturday retro
- `/progress` — readiness, topic mastery, and calibration evidence
- `/league` — weekly XP league and accountability feed
- `/onboarding` — route selection, commitment contract, and diagnostic setup

Import an editable LeetCode export with `pnpm content:import -- /absolute/path/to/leetcode-export.json`. Imported metadata stays `verified`, and therefore hidden from learners, until an executable harness exists; currently Two Sum is the published three-language gym problem. Queue a verified AI batch with `pnpm content:generate -- "Percentages" quantitative 20` after Postgres, Redis, the worker, judge, and Anthropic credentials are configured.

## Architecture

The App Router UI is under `app/` and `components/`. The adaptive engine lives in `lib/engine`, judge adapters in `lib/judge`, content verification in `lib/content`, the Drizzle schema in `db/schema.ts`, and overnight jobs in `worker/`.

The hosted Docker profile forces authentication on, refuses to boot without Google OAuth, an email allowlist, Anthropic credentials, and a public URL, and runs Next.js, Postgres 17, an isolated Postgres SQL sandbox, Redis/BullMQ, Piston with an automatic three-language bootstrap, the worker, rotating backups, and Cloudflare Tunnel. See [Windows hosting](docs/WINDOWS_HOSTING.md) and [pedagogy](docs/PEDAGOGY.md).
