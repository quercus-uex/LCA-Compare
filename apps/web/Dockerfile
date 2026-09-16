# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder

WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY apps/docs/package.json ./apps/docs/package.json
COPY packages/common/package.json ./packages/common/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
    && pnpm install --filter web... --frozen-lockfile

COPY apps/web ./apps/web
COPY packages/common ./packages/common
RUN pnpm --filter common build
RUN pnpm --filter web build

FROM nginx:alpine AS prod

COPY --from=builder /workspace/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template

CMD ["nginx", "-g", "daemon off;"]
