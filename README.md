# CoreLmsFrontend

Angular frontend for Core LMS, generated with Angular CLI 21.

## Local development

Required Node.js version for Angular CLI 21 in this project:

- `>= 20.19.0` or `>= 22.12.0`

Install dependencies:

```bash
npm ci
```

Run the development server:

```bash
npm run start
```

The app is served at `http://localhost:4200/` by default.

## Build and test

Production build:

```bash
npm run build
```

Unit tests:

```bash
npm run test
```

## Railway deployment (Docker + Caddy)

This repository deploys to Railway through an explicit Dockerfile pipeline (no Railpack). Static files are served by Caddy with SPA fallback routing.

### Why this setup

- deterministic build pipeline in source control
- transparent build logs tied to Dockerfile stages
- Angular deep-link support (`/student/...`) via server-side SPA fallback

### Build-time environment model

Angular environment values are compile-time constants for a static SPA. This project injects API URLs at image build time using Docker build args:

- `DJANGO_API_URL`
- `AXIOM_API_URL`

How it works:

- `scripts/ensure-environments.mjs` still only creates `src/environments/environment.ts` and `src/environments/environment.development.ts` when missing.
- `.dockerignore` excludes those generated files from the Docker context.
- During Docker build, prebuild generation runs inside the container, so the files are generated from `src/environments/environment.example.ts` and can consume `DJANGO_API_URL` and `AXIOM_API_URL` when provided.
- If build args are not provided, template defaults are used.

### Local Docker validation

Build image:

```bash
docker build \
	--build-arg DJANGO_API_URL=https://django.example.com \
	--build-arg AXIOM_API_URL=https://axiom.example.com \
	-t core-lms-frontend:local .
```

Run container:

```bash
docker run --rm -p 8080:8080 -e PORT=8080 core-lms-frontend:local
```

Check root route:

```bash
curl -i http://localhost:8080/
```

Check SPA fallback route:

```bash
curl -i http://localhost:8080/student/course/123
```

Check bundled API origins:

```bash
docker run --rm core-lms-frontend:local sh -lc "grep -R \"https://django.example.com\" -n /srv || true"
docker run --rm core-lms-frontend:local sh -lc "grep -R \"https://axiom.example.com\" -n /srv || true"
```

## Railway configuration

Railway is configured through `railway.toml`:

- `builder = "DOCKERFILE"`
- `dockerfilePath = "Dockerfile"`
- deploy healthcheck on `/`

In Railway service variables, define:

- `DJANGO_API_URL`
- `AXIOM_API_URL`

Post-deploy checks in Railway:

- build log shows Dockerfile build stages (not Railpack)
- deploy healthcheck is healthy
- deep links return the app (no static 404)

## Reference

Angular CLI docs: https://angular.dev/tools/cli
