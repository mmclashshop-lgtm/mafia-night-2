FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

RUN npm ci

COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/

RUN npm run build:shared
RUN npm run build:server

RUN mkdir -p packages/server/data

EXPOSE 3001

CMD ["node", "packages/server/dist/index.js"]
