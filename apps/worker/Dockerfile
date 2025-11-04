FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/package.json

RUN pnpm install

COPY . .

RUN pnpm --filter @moru/worker build

CMD ["pnpm", "--filter", "@moru/worker", "start"]
