FROM node:24-slim

RUN corepack enable

WORKDIR /srv

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

ENV PATH="/srv/node_modules/.bin:$PATH"

WORKDIR /srv/app

COPY . .
