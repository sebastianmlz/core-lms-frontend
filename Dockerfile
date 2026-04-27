# syntax=docker/dockerfile:1.7

FROM node:22.12.0-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG DJANGO_API_URL
ARG AXIOM_API_URL
ENV DJANGO_API_URL=${DJANGO_API_URL}
ENV AXIOM_API_URL=${AXIOM_API_URL}

RUN npm run build

RUN set -eux; \
    mkdir -p /opt/static; \
    if [ -d dist/core-lms-frontend/browser ]; then \
      cp -R dist/core-lms-frontend/browser/. /opt/static/; \
    elif [ -d dist/core-lms-frontend ]; then \
      cp -R dist/core-lms-frontend/. /opt/static/; \
    else \
      echo "Angular build output not found under dist/core-lms-frontend" >&2; \
      exit 1; \
    fi

FROM caddy:2.8.4-alpine AS runtime
WORKDIR /srv

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /opt/static /srv

EXPOSE 8080
