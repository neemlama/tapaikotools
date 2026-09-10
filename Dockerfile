# Frontend — Next.js 16 production image (standalone)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy values so `next build` passes in Docker/CI (real values come from env at runtime)
ARG UPSTASH_REDIS_REST_URL=https://example.upstash.io
ARG UPSTASH_REDIS_REST_TOKEN=dummy_token_for_docker_build
ARG NEXT_PUBLIC_SITE_URL=https://example.com
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID=
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
