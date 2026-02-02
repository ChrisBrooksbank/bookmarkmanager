# BookmarkVault - MVP Specification

## Product Overview

**BookmarkVault** - A local-first PWA bookmark manager for power users and researchers, hosted on Netlify.

---

## Target User

**Power users and researchers** who:

- Save many bookmarks and need robust organization
- Value keyboard efficiency and bulk operations
- Want data ownership (local-first, no cloud dependency)
- Need annotations for research context

---

## Technical Decisions

| Aspect                | Decision                      |
| --------------------- | ----------------------------- |
| **Framework**         | SvelteKit + TypeScript        |
| **Styling**           | Tailwind CSS                  |
| **Data Storage**      | IndexedDB (local-first)       |
| **Hosting**           | Netlify (static PWA)          |
| **Metadata Fetching** | Netlify Function (serverless) |
| **Theme**             | Light + Dark mode             |

---

## Core Features (MVP)

### Organization

- **Folders**: Hierarchical collections for broad categories
- **Tags**: Multiple tags per bookmark for cross-cutting topics
- **Notes**: Quick annotations per bookmark for context

### Adding Bookmarks

- **Manual entry**: Paste URL, auto-fetch title/description via metadata
- **Bookmarklet**: One-click save from any page
- **Browser import**: Upload Netscape HTML format (Chrome/Firefox/Edge/Safari)

### Search & Display

- **Basic search**: Title, URL, description, tags
- **Card grid view**: Visual thumbnails/favicons
- **Compact list view**: Dense list for scanning
- **View toggle**: Switch between layouts

### Data Portability

- **Import**: Netscape HTML format
- **Export**: HTML + JSON formats

### Power User Features

- **Keyboard shortcuts**: Quick navigation and actions
- **Bulk operations**: Multi-select to tag/move/delete
- **Annotations**: Notes per bookmark

---

## Technical Considerations

### Screenshot Capture Challenge

For a pure client-side PWA, capturing screenshots of external URLs is restricted by browser security (CORS). Options:

1. **Defer to v2**: Use favicon + Open Graph images for MVP
2. **Third-party API**: Use a screenshot service (adds external dependency)
3. **Browser extension**: Extension can capture screenshots (future enhancement)

**Recommendation**: MVP uses favicon + OG image extraction. Screenshot capture via browser extension in v2.

### IndexedDB Schema

```typescript
interface Bookmark {
	id: string;
	url: string;
	title: string;
	description: string;
	favicon: string;
	ogImage?: string;
	folderId: string | null;
	tags: string[];
	notes: string;
	createdAt: Date;
	updatedAt: Date;
}

interface Folder {
	id: string;
	name: string;
	parentId: string | null;
	createdAt: Date;
}

interface Tag {
	id: string;
	name: string;
	color?: string;
}
```

---

## Project Structure

```
bookmarkvault/
├── src/
│   ├── lib/
│   │   ├── components/      # Svelte components
│   │   │   ├── BookmarkCard.svelte
│   │   │   ├── BookmarkList.svelte
│   │   │   ├── FolderTree.svelte
│   │   │   ├── TagCloud.svelte
│   │   │   ├── SearchBar.svelte
│   │   │   └── ...
│   │   ├── stores/          # Svelte stores
│   │   │   ├── bookmarks.ts
│   │   │   ├── folders.ts
│   │   │   ├── tags.ts
│   │   │   └── ui.ts
│   │   ├── db/              # IndexedDB layer
│   │   │   └── index.ts
│   │   ├── utils/           # Utilities
│   │   │   ├── import.ts    # HTML/JSON import
│   │   │   ├── export.ts    # HTML/JSON export
│   │   │   ├── metadata.ts  # URL metadata fetching
│   │   │   └── keyboard.ts  # Keyboard shortcuts
│   │   └── types/           # TypeScript types
│   │       └── index.ts
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte     # Main app
│   │   └── ...
│   └── app.html
├── netlify/
│   └── functions/
│       └── fetch-metadata.ts  # Serverless function for URL metadata
├── static/
│   └── manifest.json          # PWA manifest
├── docs/
│   ├── research/
│   │   └── bookmark-manager-research.md
│   └── specs/
│       ├── mvp-spec.md
│       └── interview-notes.md
└── netlify.toml
```

---

## MVP Scope Summary

### In Scope

- Folder + tag organization
- Manual add, bookmarklet, browser import
- Basic search (title/URL/description/tags)
- Card grid + list views
- HTML + JSON import/export
- Keyboard shortcuts
- Bulk operations
- Annotations/notes
- PWA (offline capable, installable)
- Favicon + OG image display
- Dark mode (system preference + manual toggle)
- Netlify Function for URL metadata fetching

### Out of Scope (v2+)

- Screenshot capture (requires extension or service)
- Full-text search (search within page content)
- AI features (auto-tagging, semantic search)
- Browser extension
- Cloud sync
- Collaboration/sharing

---

## Implementation Plan

### Phase 1: Project Setup

1. Initialize SvelteKit project with TypeScript
2. Configure Tailwind CSS
3. Set up Netlify configuration
4. Set up PWA manifest and service worker

### Phase 2: Core Data Layer

1. Implement IndexedDB schema and CRUD operations
2. Create Svelte stores for bookmarks, folders, tags
3. Build import/export utilities (HTML + JSON)

### Phase 3: UI Components

1. Build layout with sidebar (folders/tags) and main content area
2. Implement BookmarkCard and BookmarkList components
3. Add view toggle (grid/list)
4. Implement SearchBar with filtering
5. Add FolderTree and TagCloud components
6. Implement dark mode with system preference detection

### Phase 4: Features

1. Manual bookmark entry with metadata fetching
2. Netlify Function for URL metadata
3. Bookmarklet generator
4. Keyboard shortcuts system
5. Bulk selection and operations
6. Notes/annotations per bookmark

### Phase 5: Polish & Deploy

1. PWA configuration (manifest, service worker, icons)
2. Cross-browser testing
3. Netlify deployment
4. Documentation

---

## Verification Plan

1. **Local development**: `npm run dev` and test all features
2. **PWA testing**: Test install prompt, offline functionality
3. **Import testing**: Import bookmarks from Chrome/Firefox exports
4. **Export testing**: Export and re-import to verify data integrity
5. **Cross-browser**: Test in Chrome, Firefox, Edge
6. **Netlify deploy**: Deploy to Netlify and verify production build
