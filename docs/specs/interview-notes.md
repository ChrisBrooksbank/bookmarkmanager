# BookmarkVault - Product Interview Notes

Date: 2026-02-02

## Overview

This document captures the decisions made during the product discovery interview for BookmarkVault, a local-first PWA bookmark manager.

---

## Interview Summary

| Question              | Decision                                         | Rationale                                                  |
| --------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| **Target user**       | Power users/researchers                          | Need robust organization and efficiency features           |
| **Platform**          | Web app (PWA)                                    | Works everywhere, easier to build, can add extension later |
| **Hosting**           | Netlify                                          | Familiar platform, good PWA support, serverless functions  |
| **Data storage**      | Local-first (IndexedDB)                          | No backend costs, full privacy, works offline              |
| **Organization**      | Folders + tags                                   | Best of both worlds - hierarchy and cross-cutting topics   |
| **Search**            | Basic (title, URL, description, tags)            | Keep MVP simple, full-text search in v2                    |
| **Archiving**         | Favicon + OG images for MVP                      | Screenshot capture deferred to v2 (needs extension)        |
| **Adding bookmarks**  | Manual + bookmarklet + browser import            | Multiple methods for power user flexibility                |
| **Display style**     | Card grid + compact list (toggle)                | Visual when browsing, dense when searching                 |
| **Import/export**     | HTML (Netscape) + JSON                           | Browser compatibility + developer-friendly backup          |
| **Tech stack**        | SvelteKit + TypeScript + Tailwind CSS            | Fast, small bundles, good DX                               |
| **Key features**      | Keyboard shortcuts, bulk operations, annotations | Power user essentials                                      |
| **App name**          | BookmarkVault                                    | Emphasizes secure local storage                            |
| **Dark mode**         | Yes, in MVP                                      | Important for researchers who read a lot                   |
| **Metadata fetching** | Netlify Function (serverless)                    | Avoids CORS issues, stays on Netlify platform              |

---

## Detailed Decisions

### Target Audience: Power Users & Researchers

Selected over:

- Myself (personal tool)
- Casual users
- Teams/enterprise

**Implications**: Need robust organization, search, keyboard efficiency, and annotation features.

### Platform: Web App (PWA)

Selected over:

- Browser extension only
- Desktop app
- Web app + extension combo

**Implications**: Focus on web-first experience. Browser extension can be added in v2 for quick capture.

### Data Storage: Local-First (IndexedDB)

Selected over:

- Cloud database (Supabase/Firebase)
- Local-first + optional sync

**Implications**:

- No backend infrastructure needed
- Full data ownership and privacy
- Works offline by default
- Netlify static hosting is sufficient
- Cross-device sync deferred to v2

### Organization: Folders + Tags

Selected over:

- Tags only
- Folders only
- Smart collections

**Implications**: Implement hierarchical folder structure AND multi-tag system per bookmark.

### Search: Basic Search

Selected over:

- Full-text search (within page content)
- Semantic/AI search

**Implications**: Search across title, URL, description, and tags. Full-text and AI search deferred to v2.

### Archiving: Favicon + OG Images

Originally wanted screenshot capture, but deferred due to CORS limitations in pure web apps.

**MVP approach**: Extract favicon and Open Graph images from URL metadata.
**v2 approach**: Browser extension can capture full screenshots.

### Display: Dual View (Card Grid + List)

Selected over:

- Card grid only
- Compact list only

**Implications**: Implement view toggle. Card view shows thumbnails, list view for dense scanning.

### Import/Export: HTML + JSON

Selected over:

- Browser HTML only
- Multiple third-party formats

**Implications**:

- Support Netscape HTML format (universal browser compatibility)
- JSON format for full backup/restore and developer use

### Tech Stack: SvelteKit + TypeScript + Tailwind

Selected over:

- React + TypeScript
- Vue + TypeScript
- Vanilla JS/Web Components

**Implications**:

- SvelteKit for routing and SSG
- TypeScript for type safety
- Tailwind for rapid styling
- Good PWA support out of the box

### Must-Have Features (MVP)

Selected features:

- Keyboard shortcuts
- Bulk operations (multi-select)
- Quick notes/annotations

Not selected for MVP:

- Dark mode (later added back in)

### Dark Mode: Included in MVP

Changed from "defer to v2" based on importance for researchers who read extensively.

**Implementation**: System preference detection + manual toggle.

### Metadata Fetching: Netlify Function

Selected over:

- CORS proxy service (external dependency)
- Manual entry only (poor UX)

**Implications**: Create serverless function at `netlify/functions/fetch-metadata.ts` to fetch URL title, description, and OG images.

---

## Market Context

Based on research in `docs/research/bookmark-manager-research.md`:

- **Market opportunity**: Pocket shutdown (July 2025) displaced millions of users
- **Key pain point**: Sync failures (#1 reason users abandon bookmark managers)
- **Trend**: 47% of users favor AI-enhanced clustering (future opportunity)
- **Trend**: 60% access via mobile-first interfaces (PWA is good fit)

### Competitive Positioning

BookmarkVault targets the intersection of:

- **Pinboard**: Minimalist, privacy-focused, developer-friendly
- **Raindrop.io**: Visual organization, power features
- **Self-hosted solutions**: Data ownership, no subscription

Differentiator: Local-first with polished UX (addressing the "privacy + usability" gap).

---

## Next Steps

1. Initialize SvelteKit project
2. Set up Tailwind CSS and dark mode
3. Implement IndexedDB data layer
4. Build core UI components
5. Add power user features (keyboard shortcuts, bulk ops)
6. Configure PWA and deploy to Netlify
