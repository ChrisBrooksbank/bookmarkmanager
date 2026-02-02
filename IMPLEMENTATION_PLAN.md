# Implementation Plan

## Status

- Planning iterations: 1
- Build iterations: 0
- Last updated: 2026-02-02

## Gap Analysis

**What's Implemented:**

- SvelteKit project scaffolding with TypeScript
- Development tooling (ESLint, Prettier, Husky, Knip, Vitest)
- CI/CD pipeline (GitHub Actions)
- Basic route structure (+layout.svelte, +page.svelte)
- Comprehensive specifications in specs/ and docs/

**What's Missing:**

- All core features (CRUD, organization, search, import/export)
- Data layer (IndexedDB, Svelte stores, TypeScript types)
- UI components (BookmarkCard, FolderTree, SearchBar, etc.)
- Styling framework (Tailwind CSS not configured)
- PWA configuration (manifest, service worker)
- Netlify Functions for metadata fetching
- Bookmarklet functionality

## Tasks

### Phase 1: Foundation (Data Layer)

- [x] Create TypeScript type definitions for Bookmark, Folder, Tag (spec: bookmark-crud.md, organization.md)
- [x] Implement IndexedDB wrapper with schema and CRUD operations (spec: bookmark-crud.md)
- [x] Create bookmarks Svelte store with localStorage fallback (spec: bookmark-crud.md)
- [ ] Create folders Svelte store with nested hierarchy support (spec: organization.md)
- [ ] Create tags Svelte store with color support (spec: organization.md)
- [ ] Create UI state store for view mode, filters, sort preferences (spec: search-filter.md)

### Phase 2: Core Styling Setup

- [ ] Configure Tailwind CSS with dark mode support (spec: mvp-spec.md)
- [ ] Create base layout with sidebar and main content area (spec: mvp-spec.md)
- [ ] Implement dark mode toggle with system preference detection (spec: mvp-spec.md)

### Phase 3: Basic Bookmark CRUD

- [ ] Create add bookmark form with URL validation (spec: bookmark-crud.md)
- [ ] Implement URL validation utility (spec: bookmark-crud.md)
- [ ] Create metadata fetching utility (title, description, favicon) (spec: bookmark-crud.md)
- [ ] Build BookmarkCard component with edit/delete actions (spec: bookmark-crud.md)
- [ ] Build BookmarkList component (compact view) (spec: bookmark-crud.md)
- [ ] Add delete confirmation modal (spec: bookmark-crud.md)
- [ ] Implement inline editing for bookmarks (spec: bookmark-crud.md)

### Phase 4: Organization Features

- [ ] Build FolderTree component with nested folder display (spec: organization.md)
- [ ] Implement create/rename/delete folder operations (spec: organization.md)
- [ ] Add folder assignment to bookmark form (spec: organization.md)
- [ ] Build TagCloud/TagList component (spec: organization.md)
- [ ] Implement tag creation and assignment in bookmark form (spec: organization.md)
- [ ] Add tag filtering UI (spec: organization.md)
- [ ] Implement folder filtering (show bookmarks by folder) (spec: organization.md)
- [ ] Handle folder deletion (move bookmarks to root) (spec: organization.md)

### Phase 5: Search & Filter

- [ ] Build SearchBar component with debounced input (spec: search-filter.md)
- [ ] Implement full-text search across title, URL, description (spec: search-filter.md)
- [ ] Add search result highlighting (spec: search-filter.md)
- [ ] Implement date range filtering (spec: search-filter.md)
- [ ] Add sort options (newest, oldest, alphabetical, recently updated) (spec: search-filter.md)
- [ ] Implement combined search with folder/tag filters (spec: search-filter.md)
- [ ] Add result count display (spec: search-filter.md)
- [ ] Implement clear filters button (spec: search-filter.md)
- [ ] Add keyboard shortcut Ctrl/Cmd+K for search focus (spec: search-filter.md)

### Phase 6: Import/Export

- [ ] Create HTML parser for Netscape bookmark format (spec: import-export.md)
- [ ] Implement import with folder structure preservation (spec: import-export.md)
- [ ] Add import progress indicator (spec: import-export.md)
- [ ] Implement duplicate URL handling (skip/replace/keep) (spec: import-export.md)
- [ ] Create HTML export in Netscape format (spec: import-export.md)
- [ ] Create JSON export with full data (spec: import-export.md)
- [ ] Create CSV export utility (spec: import-export.md)
- [ ] Add export selection (all or selected bookmarks) (spec: import-export.md)

### Phase 7: Power User Features

- [ ] Implement keyboard shortcuts system (spec: mvp-spec.md)
- [ ] Add bulk selection UI (checkboxes on bookmarks) (spec: mvp-spec.md)
- [ ] Implement bulk tag operations (spec: mvp-spec.md)
- [ ] Implement bulk move to folder (spec: mvp-spec.md)
- [ ] Implement bulk delete with confirmation (spec: mvp-spec.md)
- [ ] Add notes/annotations field to bookmarks (spec: mvp-spec.md)

### Phase 8: PWA & Deployment

- [ ] Create PWA manifest.json with icons (spec: mvp-spec.md)
- [ ] Implement service worker for offline support (spec: mvp-spec.md)
- [ ] Create Netlify Function for metadata fetching (spec: mvp-spec.md)
- [ ] Configure netlify.toml for deployment (spec: mvp-spec.md)
- [ ] Generate bookmarklet code (spec: mvp-spec.md)
- [ ] Add Open Graph image extraction (spec: mvp-spec.md)
- [ ] Test PWA install and offline functionality (spec: mvp-spec.md)

## Completed

<!-- Completed tasks move here -->

## Notes

### Architectural Decisions

**Data Storage Strategy:**

- Primary: IndexedDB for structured data with good query support
- Fallback: localStorage for stores (simple key-value persistence)
- No backend dependency maintains local-first principle

**Component Architecture:**

- Use Svelte 5 runes ($props, $state, $derived, $effect)
- Store pattern for global state (bookmarks, folders, tags, UI)
- Component composition for reusability (BookmarkCard used in grid/list views)

**Testing Strategy:**

- Vitest for unit tests
- Testing Library for component tests
- Focus on testing data operations and user interactions
- Test import/export with sample bookmark files

**Performance Considerations:**

- Debounce search input (300ms) to avoid excessive filtering
- Virtual scrolling may be needed for large bookmark lists (defer to v2)
- IndexedDB queries with indexes on commonly filtered fields

**Browser Compatibility:**

- Target modern browsers (Chrome, Firefox, Edge, Safari)
- IndexedDB supported in all modern browsers
- PWA features require HTTPS (Netlify provides this)

**Dark Mode Implementation:**

- Tailwind's dark mode with 'class' strategy
- Detect system preference on initial load
- Persist user's manual toggle choice in localStorage

**Security:**

- URL validation before saving to prevent XSS
- Sanitize user input in notes/descriptions
- CSP headers for XSS protection (configure in netlify.toml)
