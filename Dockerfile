FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["sh", "-ec", "test -n \"$AUTH_SECRET\" && test -n \"$AUTH_URL\" && test -n \"$AUTH_GOOGLE_ID\" && test -n \"$AUTH_GOOGLE_SECRET\" && test -n \"$ALLOWED_EMAILS\" && test -n \"$ADMIN_EMAILS\" && test -n \"$ANTHROPIC_API_KEY\" || { echo 'Hosted Grindstone requires auth, member/admin allowlists, and Anthropic values in .env' >&2; exit 1; }; exec node server.js"]

FROM base AS worker
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
CMD ["sh", "-ec", "test -n \"$ANTHROPIC_API_KEY\" || { echo 'Content worker requires ANTHROPIC_API_KEY' >&2; exit 1; }; exec pnpm worker"]
