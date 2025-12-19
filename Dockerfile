FROM node:24.12-trixie-slim AS builder
WORKDIR /app

RUN apt-get update \
 && apt-get install -y gettext-base ca-certificates \
 && npm install -g pnpm \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24.12-trixie-slim AS runner
WORKDIR /app

RUN apt-get update \
 && apt-get install -y tini ca-certificates \
 && npm install -g pnpm \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
 COPY --from=builder /app/next.config.mjs ./next.config.mjs

ENTRYPOINT ["tini", "--"]

EXPOSE 3000/tcp

CMD ["sh", "-c", "pnpm exec next start -p ${PORT:-3000} -H ${HOST:-0.0.0.0}"]