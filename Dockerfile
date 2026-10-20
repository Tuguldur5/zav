# syntax=docker/dockerfile:1

# --- build ---------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined at build time, so they must be present here.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_HOST
ARG NEXT_PUBLIC_STAFF_HOST
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_HOST=$NEXT_PUBLIC_SITE_HOST \
    NEXT_PUBLIC_STAFF_HOST=$NEXT_PUBLIC_STAFF_HOST \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runtime -------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=127.0.0.1

RUN addgroup -S zav && adduser -S zav -G zav

COPY --from=build --chown=zav:zav /app/.next/standalone ./
COPY --from=build --chown=zav:zav /app/.next/static ./.next/static
COPY --from=build --chown=zav:zav /app/public ./public

USER zav
EXPOSE 3000
# The app listens on loopback only: the reverse proxy owns the public port.
CMD ["node", "server.js"]
