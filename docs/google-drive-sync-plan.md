# Google Drive Sync Implementation Plan

## Goal

Add Google Drive cloud sync to protect bookmark data against IndexedDB data loss from browser clearing.

## Overview

Store bookmarks, folders, and tags as a JSON file in Google Drive's hidden app data folder. Uses Google Identity Services (GIS) for OAuth and the Drive REST API directly (no gapi library).

---

## New Files to Create

```
src/lib/
├── google/
│   ├── auth.ts           # GIS OAuth sign-in/out, token management
│   ├── drive.ts          # Drive API: find/create/read/write sync file
│   └── types.ts          # TypeScript types for Google APIs
├── sync/
│   ├── syncService.ts    # Core sync logic (pull, push, merge)
│   ├── syncStore.svelte.ts  # Reactive sync state ($state-based)
│   └── types.ts          # SyncData, SyncState types
├── components/
│   ├── GoogleSignIn.svelte  # Sign-in button (signed out state)
│   └── SyncStatus.svelte    # Sync indicator (signed in state)
```

---

## Files to Modify

| File                                 | Changes                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `src/app.html`                       | Add GIS script: `<script src="https://accounts.google.com/gsi/client" async defer></script>` |
| `src/app.d.ts`                       | Add `PUBLIC_GOOGLE_CLIENT_ID` env type                                                       |
| `src/routes/+layout.svelte`          | Add GoogleSignIn/SyncStatus to sidebar footer (line ~451)                                    |
| `src/lib/stores/bookmarks.svelte.ts` | Add debounced sync trigger after add/update/remove                                           |
| `src/lib/stores/folders.svelte.ts`   | Add debounced sync trigger after mutations                                                   |
| `src/lib/stores/tags.svelte.ts`      | Add debounced sync trigger after mutations                                                   |
| `.env`                               | Add `PUBLIC_GOOGLE_CLIENT_ID=your-client-id`                                                 |
| `.gitignore`                         | Add `.env` if not present                                                                    |

---

## Sync Data Format

```typescript
interface SyncData {
	version: string; // "1.0" for migrations
	lastModified: number; // Timestamp
	deviceId: string; // Unique per browser
	data: {
		bookmarks: Bookmark[];
		folders: Folder[];
		tags: Tag[];
	};
	tombstones: {
		// Track deletions for 30 days
		bookmarks: Array<{ id: string; deletedAt: number }>;
		folders: Array<{ id: string; deletedAt: number }>;
		tags: Array<{ id: string; deletedAt: number }>;
	};
}
```

---

## Sync Strategy

**When to sync:**

- On app load (if signed in)
- After local mutations (debounced 500ms)
- When tab becomes visible
- Manual "Sync Now" button

**Conflict resolution (last-write-wins with merge):**

- Items only in local: keep
- Items only in remote: import
- Items in both: compare `updatedAt`, keep newer
- Deleted items tracked via tombstones

---

## Implementation Steps

### Phase 1: Google Auth Setup

1. Create `.env` with `PUBLIC_GOOGLE_CLIENT_ID`
2. Add GIS script to `app.html`
3. Create `src/lib/google/types.ts` - Google API TypeScript types
4. Create `src/lib/google/auth.ts` - Sign-in/out with GIS popup flow
5. Create `src/lib/components/GoogleSignIn.svelte` - Sign-in button

### Phase 2: Drive API

6. Create `src/lib/google/drive.ts`:
   - `findSyncFile()` - Find existing file in appDataFolder
   - `createSyncFile()` - Create new JSON file
   - `readSyncFile()` - Download and parse
   - `writeSyncFile()` - Upload JSON

### Phase 3: Sync Logic

7. Create `src/lib/sync/types.ts` - SyncData, SyncState types
8. Create `src/lib/sync/syncService.ts`:
   - `pullFromDrive()` - Fetch and merge remote data
   - `pushToDrive()` - Upload local data
   - `mergeData()` - Conflict resolution
9. Create `src/lib/sync/syncStore.svelte.ts` - Reactive state

### Phase 4: UI Integration

10. Create `src/lib/components/SyncStatus.svelte` - Status indicator
11. Update `+layout.svelte` - Add components to sidebar footer
12. Add sync triggers to existing stores (bookmarks, folders, tags)

### Phase 5: Polish

13. Add visibility change listener for sync
14. Add offline detection and queuing
15. Handle token expiry gracefully

---

## Google Cloud Console Setup (Manual)

1. Create project at https://console.cloud.google.com/
2. Enable Google Drive API
3. Configure OAuth consent screen (External)
4. Add scope: `https://www.googleapis.com/auth/drive.appdata`
5. Create OAuth 2.0 Client ID (Web application)
6. Add origins: `http://localhost:5173`, production URL
7. Copy Client ID to `.env`

---

## Verification Plan

1. **Auth flow**: Sign in with Google, verify token stored
2. **Initial sync**: First sign-in creates file in Drive appDataFolder
3. **Push sync**: Add bookmark, verify file updated in Drive
4. **Pull sync**: Modify file in another browser, verify changes appear
5. **Conflict**: Edit same bookmark on two devices, verify latest wins
6. **Offline**: Disable network, make changes, verify queued and synced when online
7. **Sign out**: Verify local data persists, sync stops
