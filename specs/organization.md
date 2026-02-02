# Organization

## Overview

Organize bookmarks using folders and tags for better management.

## User Stories

- As a user, I want to create folders so that I can group related bookmarks
- As a user, I want to add tags to bookmarks so that I can categorize them flexibly
- As a user, I want to move bookmarks between folders so that I can reorganize them
- As a user, I want to view bookmarks by folder or tag so that I can find related items

## Requirements

- [ ] Folder data model with id, name, parentId (for nesting), createdAt
- [ ] Tag data model with id, name, color (optional)
- [ ] Create, rename, and delete folders
- [ ] Nested folders (at least 2 levels deep)
- [ ] Assign bookmark to a folder (one folder per bookmark)
- [ ] Add multiple tags to a bookmark
- [ ] Create tags on-the-fly when tagging bookmarks
- [ ] Folder tree view in sidebar
- [ ] Tag cloud or list view
- [ ] Filter bookmarks by selected folder
- [ ] Filter bookmarks by selected tag(s)

## Acceptance Criteria

- [ ] Can create a folder and add bookmarks to it
- [ ] Can create nested folders
- [ ] Can add multiple tags to a single bookmark
- [ ] Clicking a folder shows only its bookmarks
- [ ] Clicking a tag filters to bookmarks with that tag
- [ ] Can combine folder and tag filters
- [ ] Deleting a folder moves bookmarks to root (not deleted)

## Out of Scope

- Drag-and-drop reordering (future enhancement)
- Folder/tag icons or emojis
- Shared folders
