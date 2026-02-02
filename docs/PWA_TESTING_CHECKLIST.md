# PWA Testing Checklist

This document provides a comprehensive checklist for testing the Progressive Web App (PWA) functionality of BookmarkVault.

## Prerequisites

- Production build deployed to Netlify (HTTPS required for PWA)
- Modern browser (Chrome, Firefox, Edge, or Safari)
- Mobile device for mobile testing (optional but recommended)

## 1. PWA Installability Tests

### Desktop (Chrome/Edge)

- [ ] Navigate to the deployed app URL
- [ ] Check for install icon in address bar (desktop icon or plus sign)
- [ ] Click the install button
- [ ] Verify install prompt appears with app name "BookmarkVault"
- [ ] Click "Install" in the prompt
- [ ] Verify app opens in standalone window (no browser UI)
- [ ] Verify app icon appears in Start Menu/Applications
- [ ] Verify app can be launched from Start Menu/Applications

### Desktop (Firefox)

- [ ] Navigate to the deployed app URL
- [ ] Look for install icon in address bar
- [ ] Click install and verify installation
- [ ] Verify standalone window opens

### Desktop (Safari)

Note: Safari on macOS has limited PWA support. Test what's available:

- [ ] Navigate to the deployed app URL
- [ ] File > Add to Dock (if available)
- [ ] Verify app can launch

### Mobile (Android - Chrome)

- [ ] Navigate to the app URL on mobile Chrome
- [ ] Wait for "Add to Home Screen" banner (may appear automatically)
- [ ] Alternatively, tap menu (three dots) > "Add to Home Screen"
- [ ] Verify "Add to Home Screen" dialog shows app name and icon
- [ ] Tap "Add"
- [ ] Verify app icon appears on home screen
- [ ] Tap icon to launch app
- [ ] Verify app opens in standalone mode (no browser UI)
- [ ] Verify status bar shows theme color (#3b82f6)

### Mobile (iOS - Safari)

- [ ] Navigate to the app URL in Safari
- [ ] Tap Share button (square with arrow)
- [ ] Scroll and tap "Add to Home Screen"
- [ ] Verify app icon and name appear in dialog
- [ ] Tap "Add"
- [ ] Verify app icon appears on home screen
- [ ] Tap icon to launch app
- [ ] Verify app opens in standalone mode

## 2. Offline Functionality Tests

### Initial Cache

- [ ] Open the app (ensure it's fully loaded)
- [ ] Open browser DevTools > Application/Storage > Service Workers
- [ ] Verify service worker is "activated and running"
- [ ] Check Cache Storage - verify caches exist with app assets
- [ ] Verify static assets are cached (HTML, CSS, JS, icons)

### Offline Mode - Basic

- [ ] With app loaded, open DevTools
- [ ] Go to Network tab
- [ ] Check "Offline" checkbox (or set to "Offline" throttling)
- [ ] Refresh the page
- [ ] Verify app still loads and displays correctly
- [ ] Verify existing bookmarks are visible
- [ ] Verify navigation works (if multi-page)

### Offline Mode - Data Operations

With offline mode enabled:

- [ ] Try to add a new bookmark
  - Enter URL and details
  - Verify bookmark is saved locally
  - Check IndexedDB to confirm data persistence
- [ ] Edit an existing bookmark
  - Change title, tags, or notes
  - Verify changes are saved
- [ ] Delete a bookmark
  - Verify deletion works
- [ ] Filter/search bookmarks
  - Verify search works with cached data
- [ ] Create/edit folders
  - Verify folder operations work
- [ ] Add/remove tags
  - Verify tag operations work
- [ ] Import bookmarks
  - Verify import from HTML file works offline
- [ ] Export bookmarks
  - Verify export to HTML/JSON works offline

### Offline Mode - Metadata Fetching

- [ ] Enable offline mode
- [ ] Try to add a bookmark with URL that requires metadata fetch
- [ ] Verify graceful degradation (allow manual title/description entry)
- [ ] Verify appropriate error message or fallback behavior

### Going Back Online

- [ ] Disable offline mode (re-enable network)
- [ ] Verify app continues to work normally
- [ ] Add a new bookmark with URL
- [ ] Verify metadata fetching works again
- [ ] Check that offline changes persisted correctly

## 3. Service Worker Update Tests

### Update Scenario

- [ ] Make a small visible change to the app (e.g., change a color)
- [ ] Build and deploy the update
- [ ] In a browser with the old version cached, refresh
- [ ] Verify service worker detects update
- [ ] Close all app tabs/windows
- [ ] Reopen the app
- [ ] Verify new version loads with changes visible

### Skip Waiting

- [ ] With DevTools open (Application > Service Workers)
- [ ] When update is detected, verify "waiting to activate" state
- [ ] Click "skipWaiting" if testing manual activation
- [ ] Verify new service worker activates

## 4. App Shortcuts Tests

### Desktop

- [ ] Install the app
- [ ] Right-click app icon in taskbar/dock
- [ ] Verify shortcuts appear:
  - "Add Bookmark"
  - "Search"
- [ ] Click "Add Bookmark" shortcut
- [ ] Verify app opens with add form focused/visible
- [ ] Click "Search" shortcut
- [ ] Verify app opens with search focused

### Mobile

- [ ] Long-press app icon on home screen
- [ ] Verify quick actions/shortcuts appear
- [ ] Test each shortcut opens correct view

## 5. Theme and Display Tests

### Theme Color

- [ ] Install app on mobile
- [ ] Open app
- [ ] Verify status bar/system UI uses theme color (#3b82f6)
- [ ] Toggle dark mode (if implemented)
- [ ] Verify theme color adjusts appropriately

### Display Mode

- [ ] Launch installed app
- [ ] Verify no browser UI (address bar, tabs, etc.)
- [ ] Verify standalone window mode
- [ ] Test that external links open in browser (not in app)

### Orientation

- [ ] On mobile, rotate device
- [ ] Verify app layout responds correctly
- [ ] Verify content remains accessible in both orientations

## 6. Icon Tests

### All Platforms

- [ ] Verify app icon displays correctly in:
  - Browser install prompt
  - Home screen/desktop
  - Task switcher/app drawer
  - Installed apps list
- [ ] Check icon clarity at different sizes
- [ ] Verify maskable icons look correct (Android)

### iOS Safe Area

- [ ] On iOS, verify icon doesn't get clipped
- [ ] Check that icon looks good with rounded corners

## 7. Data Persistence Tests

### IndexedDB

- [ ] Add several bookmarks
- [ ] Close browser completely
- [ ] Reopen browser and navigate to app
- [ ] Verify all bookmarks are still present
- [ ] Verify folders and tags persist

### Clear Site Data

- [ ] Open DevTools > Application
- [ ] Click "Clear site data"
- [ ] Confirm clearing
- [ ] Refresh app
- [ ] Verify app starts fresh (data cleared)
- [ ] Verify app still functions correctly

### Incognito/Private Mode

- [ ] Open app in incognito/private browsing
- [ ] Add bookmarks
- [ ] Verify functionality works
- [ ] Close incognito window
- [ ] Reopen incognito and navigate to app
- [ ] Verify data is cleared (expected behavior)

## 8. Performance Tests

### Load Time

- [ ] Clear cache
- [ ] Load app for first time
- [ ] Measure time to interactive (should be < 3 seconds on 3G)
- [ ] Reload page
- [ ] Verify subsequent loads are faster (cached assets)

### Lighthouse Audit

- [ ] Open DevTools > Lighthouse
- [ ] Select "Progressive Web App" category
- [ ] Run audit
- [ ] Verify score is > 90
- [ ] Check for any PWA-specific warnings
- [ ] Review and address any issues

### App Size

- [ ] Check Network tab in DevTools
- [ ] Measure total size of app assets
- [ ] Verify initial bundle is reasonable (< 1MB ideally)
- [ ] Check that icons don't bloat bundle excessively

## 9. Update and Sync Tests

### Background Sync (if implemented)

- [ ] Go offline
- [ ] Perform actions that would require network
- [ ] Go back online
- [ ] Verify background sync triggers
- [ ] Verify queued actions complete

### Notifications (if implemented)

- [ ] Grant notification permission
- [ ] Test notification delivery
- [ ] Verify notification actions work

## 10. Cross-Browser Tests

Run key scenarios in each browser:

### Chrome/Edge (Chromium)

- [ ] Install flow
- [ ] Offline functionality
- [ ] Service worker caching
- [ ] App shortcuts

### Firefox

- [ ] Install flow (if supported)
- [ ] Offline functionality
- [ ] Service worker caching

### Safari (Desktop & iOS)

- [ ] Add to Home Screen/Dock
- [ ] Offline basic functionality
- [ ] Service worker (limited support)

### Samsung Internet (Android)

- [ ] Install flow
- [ ] Offline functionality
- [ ] Theme color

## 11. Edge Cases

### Storage Quota

- [ ] Add a large number of bookmarks (1000+)
- [ ] Verify app handles large datasets
- [ ] Check for storage quota warnings
- [ ] Verify graceful handling if quota exceeded

### Service Worker Errors

- [ ] Simulate service worker failure
- [ ] Verify app degrades gracefully
- [ ] Verify user sees appropriate error messages

### Network Interruption

- [ ] Start adding a bookmark
- [ ] Disable network mid-operation
- [ ] Verify graceful handling
- [ ] Re-enable network
- [ ] Verify operation can complete/retry

## 12. Uninstall Tests

### Desktop

- [ ] Right-click app in taskbar/Start Menu
- [ ] Select "Uninstall" or "Remove from Chrome"
- [ ] Verify app is removed from installed apps list
- [ ] Verify app icon removed from desktop/Start Menu

### Mobile

- [ ] Long-press app icon
- [ ] Select "Uninstall" or "Remove App"
- [ ] Verify app is removed from home screen
- [ ] Verify app data can be optionally cleared

## Expected Results Summary

### Must Pass

- ✅ App is installable on major platforms
- ✅ App works offline for core functionality
- ✅ Service worker caches assets correctly
- ✅ Data persists in IndexedDB
- ✅ Manifest is valid and complete
- ✅ Icons display correctly at all sizes
- ✅ Standalone display mode works

### Should Pass

- ✅ Lighthouse PWA score > 90
- ✅ App shortcuts work
- ✅ Theme color displays correctly
- ✅ Service worker updates properly
- ✅ Graceful offline degradation

### Nice to Have

- ✅ Background sync (if implemented)
- ✅ Push notifications (if implemented)
- ✅ Fast load times (< 3s on 3G)

## Testing Notes

- Test on real devices when possible (not just emulators)
- Test on both WiFi and cellular connections
- Test in different network conditions (slow 3G, 4G, etc.)
- Document any issues found with browser version and device details
- Take screenshots of any visual issues
- Record video of install flow for documentation

## Automated Test Coverage

The following automated tests are in place:

- `src/tests/pwa.test.ts` - PWA configuration and setup validation
- `src/service-worker.test.ts` - Service worker unit tests

Manual testing complements automated tests for real-world PWA behavior.
