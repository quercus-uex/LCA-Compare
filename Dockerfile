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

FROM node:22-alpine AS prod

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm i --omit=dev

COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate --config prisma.config.ts

COPY --from=builder /app/dist ./dist

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]