# Bookmark Manager Improvement Plan

## Current Assessment

This app has a useful MVP foundation: SvelteKit with Svelte 5, IndexedDB persistence, localStorage fallback, folders, tags, search, bulk actions, export, PWA support, a metadata Netlify Function, and a meaningful Vitest suite.

The main weakness is that it still behaves like a small demo app. The core data layer is array-driven, search is simple substring filtering, import is implemented but not surfaced, metadata fetching is not wired into the add flow, and the UI is generic rather than optimized for fast bookmark capture, review, cleanup, and retrieval.

## Validation Baseline

- `npm run test` passes: 25 test files, 438 tests.
- `npm run check` passes with Svelte warnings in prop-derived form state and one accessibility warning.
- `npm run lint` passes.

## Phase 1: Solid, Performant Core

- Refactor IndexedDB access into a repository layer with one cached connection, explicit schema migrations, and multi-store transactions.
- Add bulk persistence operations for imports, folder deletion, tag edits, and bookmark moves instead of many individual writes.
- Add normalized fields such as `normalizedUrl`, `domain`, `lastVisitedAt`, `visitCount`, `archived`, `favorite`, and `status`.
- Enforce duplicate handling through normalized URLs, with clear merge/replace/keep behavior.
- Add in-memory indexes in stores for bookmarks by id, folder, tag, domain, and normalized URL.
- Replace repeated render-path scans with `Map` and `Set` lookups.
- Add virtualized rendering for large bookmark collections.
- Fix Svelte warnings in `BookmarkCard`, `BookmarkList`, `AddBookmarkForm`, and `FolderForm`.
- Fix the bulk delete dialog accessibility warning.
- Split the large root layout into focused shell, sidebar, toolbar, modal, and filtering modules.

## Phase 2: Effortless Capture

- Wire metadata fetching into the add bookmark form.
- Auto-fill title, description, favicon, and Open Graph image when a URL is entered.
- Show metadata loading, failure, and retry states.
- Detect duplicates before save and offer merge, replace, or keep both.
- Normalize common tracking parameters before storing URLs.
- Add a visible import workflow for browser HTML bookmark files.
- Include duplicate handling, progress, and completion/error reporting in the import UI.

## Phase 3: Search And Organization

- Build a ranked local search index over title, URL, domain, description, notes, tags, and folder path.
- Add fuzzy matching and query syntax such as `tag:`, `folder:`, `domain:`, `after:`, `before:`, quoted terms, and negative terms.
- Improve highlighting so it reflects ranked search matches.
- Add smart views: Inbox, Uncategorized, Recently Added, Recently Updated, Broken Links, Duplicates, No Tags, By Domain, Favorites, and Reading Queue.
- Add tag management: rename, merge, delete, recolor, and usage counts.
- Add folder management improvements: drag/drop movement, counts, and empty-folder cleanup.

## Phase 4: World-Beating Functionality

- Add link health checks with status, redirect detection, and dead-link cleanup.
- Add bookmark enrichment refresh for favicon, preview image, and page metadata.
- Add command palette workflows for add, jump, tag, move, import, export, and cleanup.
- Improve the bookmarklet and prepare for a browser extension capture path.
- Add backup and sync support, starting with the existing Google Drive sync plan.
- Add conflict resolution for sync.
- Add personal knowledge features: excerpts, annotations, related bookmark suggestions, and saved-search collections.

## Phase 5: Kick Ass UI

- Redesign the app around a power-user cockpit:
  - Left rail for smart views, folders, and tags.
  - Dense center list with favicon, title, domain, notes, tags, folder, and status.
  - Right inspector for metadata, notes, tags, folder assignment, history, and related links.
- Make list view the serious default, with grid view reserved for visual browsing.
- Replace hand-written inline SVGs with a consistent icon library.
- Move away from default gray/blue styling toward a distinctive but restrained product palette.
- Improve empty states, loading states, toasts, focus states, and keyboard affordances.
- Add undo for destructive actions.
- Ensure mobile views remain usable without compromising desktop density.

## Recommended Build Order

1. Persistence, indexes, bulk operations, warning cleanup, and layout decomposition.
2. Metadata-driven capture, duplicate detection, URL normalization, and import UI.
3. Ranked search, smart views, and organization tools.
4. Command palette, link health, enrichment refresh, sync, and knowledge features.
5. Full UI redesign once the data and workflow foundations are strong.
