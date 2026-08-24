FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
RUN npm install --global @openai/codex@0.145.0
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs && mkdir -p /codex-home && chown nextjs:nodejs /codex-home
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["sh", "-ec", "test -n \"$AUTH_SECRET\" && test -n \"$AUTH_URL\" && { test -n \"$AUTH_INVITES\" || { test -n \"$AUTH_GOOGLE_ID\" && test -n \"$AUTH_GOOGLE_SECRET\" && test -n \"$ALLOWED_EMAILS\"; }; } && test -n \"$ADMIN_EMAILS\" && test -f \"$GRINDSTONE_CODEX_HOME/auth.json\" || { echo 'Hosted Grindstone requires private auth, an admin, and an owner ChatGPT login in GRINDSTONE_CODEX_HOME' >&2; exit 1; }; exec node server.js"]

FROM base AS worker
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
CMD ["sh", "-ec", "test -f \"$GRINDSTONE_CODEX_HOME/auth.json\" || { echo 'Content worker requires an owner ChatGPT login in GRINDSTONE_CODEX_HOME' >&2; exit 1; }; exec pnpm worker"]
