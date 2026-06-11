# AGENTS.md

## Cursor Cloud specific instructions

Excalidraw is a Yarn (classic, v1) workspaces monorepo. Node 22 is required (`.nvmrc`). Dependencies are installed automatically on startup via the update script (`yarn install`).

### Services

The product is a fully client-side React + Vite PWA. Only one service is needed to run/test the core product end-to-end:

| Service | Dir | Run (from repo root) | URL |
| --- | --- | --- | --- |
| Excalidraw web app (frontend) | `excalidraw-app/` | `yarn start` | http://localhost:3000 |

The core canvas, drawing tools, local persistence (IndexedDB), and export all work standalone with no local backend. Collaboration (`excalidraw-room`, WebSocket on `:3002`), AI, and shareable-link export rely on external/hosted backends configured via `VITE_APP_*` in `.env.development`; they are optional and not required for core development.

### Lint / test / build / run

Commands are defined in the root `package.json`; use those as the source of truth. Key ones:

- Run (dev): `yarn start` — note this re-runs `yarn install` before launching Vite.
- Typecheck: `yarn test:typecheck`
- Lint: `yarn test:code` (ESLint, `--max-warnings=0`)
- Format check: `yarn test:other` (Prettier)
- Tests: `yarn test:app --watch=false` (Vitest). Scope to a path, e.g. `yarn test:app --watch=false packages/math`.

### Non-obvious notes

- The Vite dev server prints lines beginning with `ERROR` from `vite-plugin-checker` even when there are 0 errors (e.g. `[TypeScript] Found 0 errors`); this is normal formatting, not a failure.
- Some paths are blocked from agent edits by a Cursor policy hook (`.cursor/hooks/block-protected-paths.sh`): `packages/excalidraw/locales/`, `firebase-project/`, and `.github/`.
