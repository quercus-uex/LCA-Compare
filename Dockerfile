FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npx prisma generate --config prisma.config.ts
RUN npm run build


FROM node:22-bullseye AS prod

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN apt update
RUN npx playwright install-deps
RUN npx playwright install chrome
RUN npm ci --omit=dev && npx prisma generate --config prisma.config.ts

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/src/main"]