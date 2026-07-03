FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare npm@10.8.0 --activate
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
RUN npm install

COPY . .
RUN npm run build:shared && npm run build:server

FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare npm@10.8.0 --activate
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
RUN npm install --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY packages/server/data ./packages/server/data

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "packages/server/dist/index.js"]
