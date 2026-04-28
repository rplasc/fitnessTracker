FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

ARG API_URL=http://backend:9111
ENV API_URL=$API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . ./
RUN npm run build

FROM node:22-alpine AS prod-deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app

ARG API_URL=http://backend:9111

ENV NODE_ENV=production
ENV PORT=3200
ENV HOSTNAME=0.0.0.0
ENV API_URL=$API_URL

COPY package.json package-lock.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3200

CMD ["npm", "run", "start"]
