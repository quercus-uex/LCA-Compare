FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate --config prisma.config.ts

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

RUN npm ci --omit=dev

FROM node:22-alpine AS prod

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

CMD ["sh", "-c", "node dist/src/main db migrate deploy && node dist/src/main"]