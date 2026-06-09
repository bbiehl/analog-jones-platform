# Cloud Run image for public-app SSR.
#
# Builds from the root workspace (single package.json, @aj/core consumed as
# source via the tsconfig path alias) and runs the Angular SSR Express server
# directly. This deliberately bypasses the Firebase App Hosting Angular adapter
# (v17.2.17), which cannot serve Angular 21 `outputMode: "server"` SSR and
# degrades every route to the client shell. server.mjs is proven to SSR.
#
# Single stage on purpose: keeps node_modules present at runtime so any deps the
# server bundle externalizes (e.g. firebase/firestore's grpc, which is CommonJS)
# resolve. Multi-stage `--prod` slimming is a follow-up once a deploy is green.
FROM node:20-slim

WORKDIR /app

# Pin pnpm to the workspace's packageManager version.
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# Install deps first (cached unless the lockfile changes). NODE_ENV is unset
# here so devDependencies (the Angular build toolchain) are installed.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build core lib + public-app -> dist/public-app/{browser,server}.
COPY . .
RUN pnpm build:public

ENV NODE_ENV=production
# Cloud Run injects PORT (default 8080); server.ts reads process.env.PORT.
EXPOSE 8080

CMD ["node", "dist/public-app/server/server.mjs"]
