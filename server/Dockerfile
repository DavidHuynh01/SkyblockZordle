# syntax=docker/dockerfile:1
#
# SkyblockZordle API in a container. Build from the repo root, because the API
# shares its game logic and item data with the frontend in src/:
#
#   docker build -f server/Dockerfile --target test .            runs the test suite
#   docker build -f server/Dockerfile -t skyblockzordle-api .    builds the API image
#   docker run -p 3001:3001 skyblockzordle-api                   serves on :3001
#
# Production runs this same API on Lambda. The image gives the tests a clean,
# pinned environment in CI and lets the API run anywhere Docker does. Without a
# TABLE_NAME it uses the local JSON store; Discord login stays off unless its
# secrets are passed in as environment variables.

# Node 22 to match the Lambda runtime (nodejs22.x).
FROM node:22-alpine AS deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
# Optional build secret "extra_ca": extra certificates to trust while npm
# downloads packages, for machines whose antivirus or proxy re-signs HTTPS
# (Avast's HTTPS scanning, corporate proxies). Without it npm can't reach the
# registry there. Secrets are mounted for this one step only and are never
# written into the image. CI passes none.
#   docker build ... --secret id=extra_ca,src=path/to/ca-bundle.pem .
RUN --mount=type=secret,id=extra_ca \
    if [ -s /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi; \
    npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS base
WORKDIR /app
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY src/utils ./src/utils
COPY src/data ./src/data
COPY server ./server

# Running the tests is part of building this stage, so the build fails if any
# test does. The tests use Node's built-in runner and need no extra packages.
FROM base AS test
WORKDIR /app/server
RUN npm test

FROM base AS runtime
ENV NODE_ENV=production PORT=3001
WORKDIR /app/server
# Run as the unprivileged "node" user. The local JSON store writes to
# server/data, so that one directory is all it's given.
RUN mkdir -p data && chown node:node data
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1
CMD ["node", "index.js"]
