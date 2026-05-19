# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder

COPY . .
ARG SENTRY_BACKEND_PROJECT=
ARG SENTRY_ORG=
ARG SENTRY_RELEASE=
ENV SENTRY_BACKEND_PROJECT=$SENTRY_BACKEND_PROJECT
ENV SENTRY_ORG=$SENTRY_ORG
ENV SENTRY_RELEASE=$SENTRY_RELEASE
RUN pnpm build
RUN --mount=type=secret,id=sentry_auth_token,required=false \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)"; \
    if [ -n "$SENTRY_AUTH_TOKEN" ] && [ -n "$SENTRY_ORG" ] && [ -n "$SENTRY_BACKEND_PROJECT" ] && [ -n "$SENTRY_RELEASE" ]; then \
      pnpm exec sentry-cli sourcemaps inject dist && \
      SENTRY_AUTH_TOKEN="$SENTRY_AUTH_TOKEN" pnpm exec sentry-cli sourcemaps upload --org "$SENTRY_ORG" --project "$SENTRY_BACKEND_PROJECT" --release "$SENTRY_RELEASE" dist; \
    else \
      echo "Skipping backend Sentry sourcemap upload."; \
    fi
RUN pnpm prune --prod

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/package.json ./
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/supabase ./supabase

USER app

EXPOSE 3000

CMD ["node", "dist/main.js"]
