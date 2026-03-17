FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .
RUN npm run build

FROM nginx:alpine AS prod

COPY --from=builder /app/dist /usr/share/nginx/html

COPY /web/nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]