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