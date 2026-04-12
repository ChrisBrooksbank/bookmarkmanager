# CLAUDE.md

## Project Overview

BookmarkVault — a local-first PWA bookmark manager for power users and researchers. Hierarchical folders, color-coded tags, full-text search, bulk operations, import/export (HTML/JSON/CSV), offline support, and dark mode.

## Tech Stack

- SvelteKit 5 + Svelte 5
- TypeScript
- Tailwind CSS
- IndexedDB (local-first storage via Dexie or native API)
- PWA — installable, offline-first
- Netlify deployment

## Development Commands

```bash
npm install
npm run dev        # Start dev server at localhost:5173
npm run build      # Production build
npm run preview    # Preview production build
```

## Architecture

- `src/lib/db/` — IndexedDB schema and CRUD operations
- `src/lib/components/` — Shared Svelte components
- `src/routes/` — SvelteKit pages
- `static/` — PWA manifest and icons

## Data Storage

All bookmark data is stored locally in IndexedDB. No server required. Import/export supports HTML (browser bookmark format), JSON, and CSV.

## Deployment

Deployed on Netlify via `netlify.toml`. Auto-deploys from main branch.
