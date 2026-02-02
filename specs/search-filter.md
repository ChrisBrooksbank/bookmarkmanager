# Search & Filter

## Overview

Find bookmarks quickly using search and various filter options.

## User Stories

- As a user, I want to search bookmarks by text so that I can find specific items
- As a user, I want to filter by date range so that I can find recent or old bookmarks
- As a user, I want to sort bookmarks so that I can view them in different orders

## Requirements

- [ ] Full-text search across title, URL, and description
- [ ] Search-as-you-type with debouncing (300ms)
- [ ] Highlight matching text in results
- [ ] Filter by date range (created/updated)
- [ ] Sort options: newest, oldest, alphabetical, recently updated
- [ ] Combine search with folder/tag filters
- [ ] Show result count
- [ ] Clear search/filters button
- [ ] Keyboard shortcut to focus search (Ctrl/Cmd + K)

## Acceptance Criteria

- [ ] Search finds matches in title, URL, and description
- [ ] Results update as user types (with debounce)
- [ ] Matching text is highlighted
- [ ] Can filter to bookmarks from last 7/30/90 days
- [ ] Sort persists across sessions
- [ ] Search works with folder/tag filters applied
- [ ] Ctrl+K focuses the search input

## Out of Scope

- Fuzzy matching
- Search history
- Saved searches
