# Project Background
This is a browser extension primarily for edge or chrome.

It will be privately sideloaded from an unpacked directory. 

The extension should be compiled into the /dist folder

# Project Structure

## /dist
This is where the extension will be loaded from

## /src

all source files live under this folder or its subfolders

### /src/content

All compiled content will be in this folder its subfolders

### /src/content/popup

sources for the popup window that will allow the user to turn on or off the page monitoring

### /src/static

all static content that should be just copied as-is into the /dist folder will be this folder

# Agent instructions

This extension is written in typescript and then compiled into javascript using webpack.

The output should be placed in the /dist folder.

Any time an agent adds functionality to this extension, it should add information to this file describing the changes made and the purpose of those changes. 

Always include the original prompt instructions

---

## Change Log

### 2025-01-XX - Fixed webpack deprecation warning
**Original Prompt**: "when I do npm run-script build, I get this error: DeprecationWarning: Compilation.assets will be frozen in future..."

**Changes Made**:
- Created `build-plugins/ManifestTransformPlugin.js` - A webpack 5 compatible plugin that uses `compilation.hooks.processAssets` instead of directly modifying `Compilation.assets`
- Updated `webpack.config.js` to use the new `ManifestTransformPlugin` instead of the deprecated `transform-json-webpack-plugin`
- The plugin emits the manifest during the `PROCESS_ASSETS_STAGE_ADDITIONS` stage using the recommended webpack 5 APIs

**Purpose**: Eliminated the webpack deprecation warning by using modern webpack 5 hooks for asset manipulation

---

### 2025-01-XX - Implemented popup monitoring controls
**Original Prompt**: "this extension loads into edge but currently does nothing. i want the monitoring to be off by default, but I want to have a button or an option somewhere to display the popup in order to turn on the monitoring."

**Changes Made**:
1. **Content Script (`src/content/content.ts`)**:
   - Implemented message listener to handle monitoring state messages from popup
   - Added `isMonitoring` state variable (defaults to `false`)
   - Implemented `startMonitoring()` and `stopMonitoring()` placeholder functions
   - Handles three message types: `GET_MONITORING_STATE`, `START_MONITORING`, `STOP_MONITORING`
   - Logs monitoring state changes to console for debugging

2. **Popup Interface** (already existed in `src/popup/popup.html` and `src/popup/popup.ts`):
   - Popup HTML provides a checkbox to toggle monitoring on/off
   - Popup script queries current tab's monitoring state and updates UI accordingly
   - Sends messages to content script to start/stop monitoring

3. **Build Configuration**:
   - Updated `webpack.config.js` to compile both `content.ts` and `popup.ts` as separate entry points
   - Added copy pattern to copy `popup.html` to the dist folder
   - Changed `.resolve.extensions` to include `.js` files

4. **TypeScript Configuration**:
   - Created `tsconfig.json` with Chrome extension types support
   - Added `@types/chrome` package as dev dependency
   - Added `/// <reference types="chrome"/>` directives to both TypeScript files

5. **ESLint Configuration**:
   - Created `.eslintignore` to exclude build-plugins and config files from linting

**Purpose**: 
- Monitoring is OFF by default when the extension loads
- Users can click the extension icon to open a popup
- The popup shows current monitoring state and allows users to toggle monitoring on/off for the current tab
- The content script receives these commands and can implement actual Pandora page monitoring logic
- All communication happens via Chrome's messaging API between popup and content script

---

### 2025-01-XX - Implemented Pandora song monitoring and data export
**Original Prompt**: "i want the monitor when the contents of the div with class="Marquee__wrapper__content" changes. When it changes, I want to capture the text contents of that div... Once collected, I want to save that information somewhere so I can save it to a local file (or copy it to the clipboard)."

**Changes Made**:

1. **Content Script (`src/content/content.ts`)** - Song Monitoring:
   - Added `collectedSongs` array to store captured song data (song name, artist, album, timestamp)
   - Implemented `captureSongInfo()` function that:
     - Queries `.Marquee__wrapper__content` for song name
     - Queries `.NowPlayingTopInfo__current__artistName` for artist name
     - Queries `.nowPlayingTopInfo__current__albumName` for album name
     - Stores data with ISO timestamp
     - Prevents duplicate captures of the same song
   - Enhanced `startMonitoring()` to:
     - Capture current song immediately when monitoring starts
     - Create MutationObserver to watch for DOM changes in song element
     - Observe both the song element and its parent for changes
     - Trigger `captureSongInfo()` when changes detected
   - Added new message handlers:
     - `GET_COLLECTED_SONGS` - returns the array of collected songs
     - `CLEAR_COLLECTED_SONGS` - clears the collected songs array
   - Updated `GET_MONITORING_STATE` to also return song count

2. **Popup Interface (`src/popup/popup.html`)**:
   - Added song count display showing "Songs collected: X"
   - Added "Copy Songs to Clipboard" button (disabled when no songs)
   - Added "Clear Collected Songs" button (disabled when no songs)
   - Added success message that appears after copying to clipboard
   - Enhanced styling for buttons (primary/secondary colors, disabled states)

3. **Popup Script (`src/popup/popup.ts`)**:
   - Added `updateUI()` function to centrally manage UI state updates
   - Enhanced state query to include song count
   - Implemented export button handler that:
     - Requests collected songs from content script
     - Formats songs as readable text with numbering
     - Includes song name, artist, album, and capture timestamp
     - Copies formatted text to clipboard using Clipboard API
     - Shows success message for 2 seconds
   - Implemented clear button handler that:
     - Shows confirmation dialog before clearing
     - Sends clear message to content script
     - Updates UI to reflect empty collection
   - Added error handling for Chrome runtime errors

**Purpose**:
- Automatically monitors Pandora pages for song changes when monitoring is enabled
- Captures song name, artist, album for each track played
- Stores all captured songs in memory (per-tab)
- Displays real-time count of collected songs in popup
- Allows user to export all collected songs to clipboard with one click
- Allows user to clear collection and start fresh
- Prevents duplicate captures when DOM changes rapidly
- Works seamlessly with the existing on/off monitoring toggle

**How It Works**:
1. User navigates to Pandora and plays music
2. User clicks extension icon and enables monitoring
3. Extension immediately captures current song and watches for changes
4. As songs change, extension automatically captures new song information
5. User can see song count in popup at any time
6. When ready, user clicks "Copy Songs to Clipboard" to export all collected songs
7. User can paste the formatted playlist anywhere (text file, document, etc.)
8. User can clear the collection to start fresh with "Clear Collected Songs"

**Data Format Example**:
```
Pandora Playlist Export
======================

1. Song Title
   Artist: Artist Name
   Album: Album Name
   Captured: 1/13/2025, 2:30:45 PM

2. Next Song
   ...
```

---

### 2025-01-XX - Updated song title monitoring logic
**Original Prompt**: "instead of monitoring only Marquee_wrapper_content, instead monitor its parent class Marquee_wrapper. Then extract the song title either from Marquee__warpper__content or Marquee__wrapper__content__child. If there are more than 1 of the child elements, choose the first one"

**Changes Made**:

1. **Content Script (`src/content/content.ts`)** - Updated Monitoring:
   - Changed `startMonitoring()` to observe `.Marquee__wrapper` parent element instead of `.Marquee__wrapper__content`
   - Updated `captureSongInfo()` to:
     - First try to get song name from `.Marquee__wrapper__content`
     - If not found, try `.Marquee__wrapper__content__child` (takes first match)
     - Fallback ensures song title is captured regardless of Pandora's DOM structure

**Purpose**:
- More robust monitoring that watches the parent container instead of specific child
- Handles different Pandora DOM structures where song title may be in different elements
- Ensures song title is always captured whether it's in `__content` or `__content__child`
- Prevents missing song changes due to DOM structure variations

---

### 2025-01-XX - Added debugging and fixed source maps
**Original Prompt**: "this seems to only collect 1 song (the first song) and not see the changes when the page's dom updates" and "when i try to debug the sources in dev tools, I get an error 'source map failed to load'... 'ERR_BLOCKED_BY_CLIENT'"

**Changes Made**:

1. **Content Script (`src/content/content.ts`)** - Enhanced Debugging:
   - Added `lastCapturedSong` variable to track what was last captured
   - Added extensive console logging throughout:
     - Logs which element the song was found in
     - Shows current song data being processed
     - Logs when MutationObserver is triggered with mutation count
     - Shows mutation details (type, target, class)
     - Clear indicators when songs are captured vs skipped
   - Enhanced duplicate detection with separate tracking
   - Added fallback to find all Marquee-related elements if `.Marquee__wrapper` not found
   - Added `characterDataOldValue: true` to observer config for better change tracking

2. **Webpack Configuration (`webpack.config.js`)** - Fixed Source Maps:
   - Changed `devtool` from `'source-map'` to `'inline-source-map'`
   - Inline source maps embed the source map directly in the generated JavaScript file
   - Prevents `ERR_BLOCKED_BY_CLIENT` error that occurs when Chrome extensions try to load external .map files

**Purpose**:
- **Debugging Support**: Extensive logging helps diagnose why song changes aren't being detected
- **Source Map Fix**: Allows TypeScript source debugging in Chrome DevTools
  - Can now set breakpoints in original .ts files
  - Can see TypeScript variable names and code structure
  - No more "source map failed to load" errors
- **Better Troubleshooting**: Console output shows exactly what the observer sees and when it triggers

**Technical Notes**:
- `inline-source-map` increases file size but is necessary for Chrome extension debugging
- The source map is embedded as a base64 data URL at the end of each .js file
- This avoids the CSP (Content Security Policy) restrictions that block external .map file loading in extensions

---

### 2025-01-XX - Changed monitoring target and export format
**Original Prompt**: "this is still not catching changes. perhaps monitoring the top level NowPlaying_content class will catch it?" and "change the export to copy to the clipboard as a tabbed list of songs suitable for pasting into excel"

**Changes Made**:

1. **Content Script (`src/content/content.ts`)** - Changed Monitoring Target:
   - Changed `startMonitoring()` to observe `.NowPlaying_content` top-level container instead of `.Marquee__wrapper`
   - This broader scope should catch more DOM changes in the Now Playing section
   - Enhanced debugging to show both NowPlaying and Marquee elements if target not found
   - Helps identify the exact class names Pandora uses in different scenarios

2. **Popup Script (`src/popup/popup.ts`)** - Excel-Compatible Export:
   - Changed export format from human-readable text to tab-separated values (TSV)
   - Format now includes header row: `Song Title\tArtist\tAlbum\tCaptured\n`
   - Each song is a row with fields separated by tabs (`\t`)
   - Date/time formatted with `toLocaleString()` for readability

**Purpose**:
- **Broader Monitoring**: `.NowPlaying_content` is the top-level container for the entire Now Playing section, making it more likely to catch DOM updates when songs change
- **Excel Integration**: Tab-separated format can be pasted directly into Excel, Google Sheets, or any spreadsheet application
  - Automatically creates columns for each field
  - Header row labels each column appropriately
  - Easy to sort, filter, and analyze in spreadsheet software

**Excel Export Format**:
```
Song Title	Artist	Album	Captured
Song Name 1	Artist 1	Album 1	1/13/2025, 2:30:45 PM
Song Name 2	Artist 2	Album 2	1/13/2025, 2:34:22 PM
```

**How to Use Excel Export**:
1. Click "Copy Songs to Clipboard"
2. Open Excel or Google Sheets
3. Click on cell A1
4. Paste (Ctrl+V)
5. Data automatically populates into columns

---

### 2025-01-XX - Added persistent storage for collected songs
**Original Prompt**: "change the extension to retain the list of songs between browser sessions"

**Changes Made**:

1. **Manifest (`src/manifestEdge.json`)**:
   - Added `"storage"` permission to the permissions array
   - Required for using chrome.storage.local API

2. **Content Script (`src/content/content.ts`)** - Persistent Storage:
   - Added `STORAGE_KEY` constant: `'panscrape_collected_songs'`
   - Implemented `loadCollectedSongs()` async function:
     - Calls `chrome.storage.local.get()` to retrieve saved songs
     - Loads songs into `collectedSongs` array on initialization
     - Restores `lastCapturedSong` from loaded data
     - Logs how many songs were loaded
   - Implemented `saveCollectedSongs()` async function:
     - Calls `chrome.storage.local.set()` to persist songs
     - Called automatically after each new song is captured
     - Called when clearing songs (saves empty array)
     - Logs save operations for debugging
   - Added `loadCollectedSongs()` call at script initialization
   - Modified `CLEAR_COLLECTED_SONGS` handler to save empty state to storage

**Purpose**:
- **Persistent Storage**: Songs are now saved to Chrome's local storage and survive browser restarts
- **Automatic Saving**: Every time a new song is captured, the entire collection is saved
- **Seamless Experience**: Users can close the browser and reopen it without losing their collected playlist
- **No Data Loss**: Even if the tab is closed or browser crashes, all captured songs up to that point are preserved

**How It Works**:
1. When content script loads, it automatically retrieves previously saved songs
2. Each time a new song is captured, the updated list is saved to storage
3. Storage is local to the browser (not synced across devices)
4. When user clears songs, empty array is saved to storage
5. Song data persists indefinitely until explicitly cleared by user

**Technical Details**:
- Uses `chrome.storage.local` API (async/await pattern)
- Storage limit: Typically 5-10MB for local storage
- Data stored as JSON in browser's extension storage
- Each browser profile has its own storage (data not shared between profiles)
- Storage survives extension updates and browser restarts

**Storage Data Structure**:
```typescript
{
  "panscrape_collected_songs": [
    {
      "songName": "Song Title",
      "artistName": "Artist Name",
      "albumName": "Album Name",
      "timestamp": "2025-01-13T14:30:45.123Z"
    },
    ...
  ]
}