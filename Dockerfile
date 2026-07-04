FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY turbo.json tsconfig.base.json .eslintrc.cjs ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN npm ci

COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/
COPY packages/client/ packages/client/

RUN npm run build:shared
RUN npm run build:server
RUN npm run build:client

RUN mkdir -p packages/server/data

EXPOSE 3001

CMD ["node", "packages/server/dist/index.js"]
