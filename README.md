# SNA Angle Analyzer

This project is a full-stack web app (Vite + Express + tRPC) that can be hosted as a standalone website.

> **Note:** I can’t host a live site from this environment, but the repo now includes deployment
> configs so you can publish a public URL on Render or Railway in a few minutes.

## Quick start (local)

```bash
pnpm install
pnpm dev
```

The app starts on the first available port at or above `3000`.

## Production build (local)

```bash
pnpm install
pnpm build
pnpm start
```

## Host with Docker

1. Build the image:

```bash
docker build -t sna-angle-analyzer .
```

2. Run the container:

```bash
docker run --rm -p 3000:3000 -e NODE_ENV=production -e PORT=3000 sna-angle-analyzer
```

Then open `http://localhost:3000` in a browser.

## Deploy on Render

1. Create a new **Web Service** from this repo.
2. Render will automatically detect the included `render.yaml`, which uses the root-level `Dockerfile`.
3. Click **Deploy** and wait for the build to finish.

Render will provide a public URL so the app can be used online without installation.

## Deploy on Railway

1. Create a new **Service** from this repo.
2. Railway will automatically detect the included `railway.json`.
3. Click **Deploy** and wait for the build to finish.

Railway will provide a public URL so the app can be used online without installation.
