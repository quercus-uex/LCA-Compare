# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/docs/package.json ./apps/docs/package.json
COPY packages/common/package.json ./packages/common/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
    && pnpm install --filter server... --frozen-lockfile

COPY apps/server ./apps/server
COPY packages/common ./packages/common

RUN pnpm --filter common build
RUN pnpm --filter server prisma:generate
RUN pnpm --filter server build

FROM node:22-bookworm AS prod

WORKDIR /workspace

ENV NODE_ENV=production
ENV TZ=Europe/Madrid

RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/server/prisma ./apps/server/prisma
COPY apps/server/prisma.config.ts ./apps/server/prisma.config.ts
COPY packages/common/package.json ./packages/common/package.json

RUN apt update \
    && apt install -y tzdata \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
    && pnpm install --filter server --prod --frozen-lockfile
RUN pnpm --filter server exec playwright install chromium --with-deps

COPY --from=builder /workspace/apps/server/dist ./apps/server/dist
COPY --from=builder /workspace/packages/common/dist ./packages/common/dist

CMD ["node", "apps/server/dist/src/main"]
