# Bookmark CRUD

## Overview

Core bookmark management: create, read, update, and delete bookmarks.

## User Stories

- As a user, I want to add a new bookmark so that I can save a URL for later
- As a user, I want to view my bookmarks so that I can access saved URLs
- As a user, I want to edit a bookmark so that I can update its title or URL
- As a user, I want to delete a bookmark so that I can remove URLs I no longer need

## Requirements

- [ ] Bookmark data model with id, url, title, description, createdAt, updatedAt
- [ ] Add bookmark form with URL and optional title/description
- [ ] Auto-fetch page title when URL is entered (if title not provided)
- [ ] Display bookmarks in a list view
- [ ] Edit bookmark inline or via modal
- [ ] Delete bookmark with confirmation
- [ ] Persist bookmarks to localStorage (initial implementation)
- [ ] Validate URL format before saving

## Acceptance Criteria

- [ ] Can add a bookmark with just a URL
- [ ] Can add a bookmark with URL, title, and description
- [ ] Bookmarks persist across page refreshes
- [ ] Can edit any field of an existing bookmark
- [ ] Delete requires confirmation
- [ ] Invalid URLs show validation error

## Out of Scope

- Server-side persistence (future enhancement)
- Bookmark favicons (separate spec)
- Bulk operations (separate spec)
