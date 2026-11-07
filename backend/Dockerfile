# syntax=docker/dockerfile:1
FROM node:24.22.2-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl libfontconfig1 fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global npm@11.6.2

FROM base AS dependencies
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM dependencies AS build
COPY tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
RUN npm run prisma:generate && npm run build

FROM build AS development
USER node
EXPOSE 3333
ENV PORT=3333
CMD ["npm", "run", "dev"]

FROM build AS migrations
USER node
ENTRYPOINT ["npm", "run", "migrate:deploy"]
CMD []

FROM dependencies AS production-dependencies
# Prisma Client declares optional peers that are only needed for development.
RUN npm pkg delete devDependencies \
    && npm uninstall --no-save --ignore-scripts --omit=dev --no-audit --no-fund prisma typescript

FROM base AS runtime
ENV NODE_ENV=production PORT=3333
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./package.json
USER node
EXPOSE 3333
CMD ["node", "dist/main/Server.js"]
