# Cloud Run image for the Angular SSR apps (public-app, admin-app).
#
# Builds from the root workspace (single package.json, @aj/core consumed as
# source via the tsconfig path alias) and runs the Angular SSR Express server
# directly. This deliberately bypasses the Firebase App Hosting Angular adapter
# (v17.2.17), which cannot serve Angular 21 `outputMode: "server"` SSR and
# degrades every route to the client shell.
#
# One image serves both Cloud Run services. Both apps are built; the runtime
# `APP` env var selects which server.mjs runs, so `gcloud run deploy --source`
# (which can't pass build args) deploys either service from this one Dockerfile.
# public-app server-renders; admin-app is RenderMode.Client by design and serves
# its SPA shell. Building both keeps one Dockerfile and one deploy path; the
# extra build time is a few seconds and the monorepo already shares one install.
FROM node:22-slim

WORKDIR /app

# Pin pnpm to the workspace's packageManager version.
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# Install deps first (cached unless the lockfile changes). NODE_ENV is unset
# here so devDependencies (the Angular build toolchain) are installed.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build both apps -> dist/<app>/{browser,server}. @aj/core resolves from source.
COPY . .
RUN pnpm build:core \
  && pnpm exec ng build public-app \
  && pnpm exec ng build admin-app

ENV NODE_ENV=production
# Overridden per service at deploy time: `--set-env-vars APP=admin-app`.
ENV APP=public-app
# Cloud Run injects PORT (default 8080); server.ts reads process.env.PORT.
EXPOSE 8080

# `exec` so node becomes PID 1 and receives Cloud Run's SIGTERM for graceful
# shutdown; shell form lets $APP expand to pick the service's server bundle.
CMD ["sh", "-c", "exec node dist/$APP/server/server.mjs"]
