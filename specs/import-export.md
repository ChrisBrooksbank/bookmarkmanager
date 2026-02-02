# Import/Export

## Overview

Import bookmarks from browsers and export to various formats.

## User Stories

- As a user, I want to import bookmarks from my browser so that I can migrate existing bookmarks
- As a user, I want to export my bookmarks so that I can back them up or use them elsewhere

## Requirements

- [ ] Import from browser HTML bookmark file (Netscape format)
- [ ] Parse folder structure from import
- [ ] Import progress indicator for large files
- [ ] Handle duplicate URLs on import (skip, replace, or keep both)
- [ ] Export to HTML (browser-compatible Netscape format)
- [ ] Export to JSON (full data including tags)
- [ ] Export to CSV (simplified: URL, title, folder, tags)
- [ ] Export selected bookmarks or all
- [ ] Preserve folder hierarchy in exports

## Acceptance Criteria

- [ ] Can import Chrome/Firefox/Edge bookmark export files
- [ ] Imported folders appear in folder structure
- [ ] Import shows progress and completion count
- [ ] Duplicate handling works as configured
- [ ] HTML export can be imported back into browsers
- [ ] JSON export includes all bookmark data
- [ ] CSV export opens correctly in spreadsheet apps

## Out of Scope

- Direct browser extension integration
- Cloud sync
- Import from other bookmark services (Pocket, Pinboard, etc.)
