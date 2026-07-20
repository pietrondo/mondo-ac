# Mondo 3D

A procedurally generated 3D world explorer built with Three.js and TypeScript.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm start` | Alias for `npm run dev -- --host 0.0.0.0` |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |

## Deploying with Pit Panel

This project is fully compatible with https://pannello.pietrocapriata.me

**Pit Panel detects it as Node.js (95%)** and deploys automatically.

Key compatibility features:
- `allowedHosts: true` in vite.config.ts — required for reverse-proxy deployments
- Port 3000 — matches Pit Panel's Node.js template
- `npm start` script — used by the deploy template

## Tech Stack

- **Three.js** — 3D rendering engine
- **TypeScript** — type safety
- **Vite** — dev server and bundler
- **Vitest** — unit tests
- **Playwright** — E2E tests
- **lil-gui** — debug UI

## Project Structure

```
src/          Application source
docs/         Design docs and specs
data/         World data
tests/        Test suites
```

## Quality & Code Simplification Guidelines

This repository follows [Ponytail](https://ponytail.dev/) principles:
At the end of every task or change, run `ponytail-review` / `ponytail-audit` to inspect code for over-engineering, remove unused/speculative code, and keep implementations lean.

