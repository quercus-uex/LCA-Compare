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

RUN apt update \
    && apt install -y tzdata \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone \
    && rm -rf /var/lib/apt/lists/* \

RUN npx playwright install chromium --with-deps
RUN npm ci --omit=dev && npx prisma generate --config prisma.config.ts

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/src/main"]