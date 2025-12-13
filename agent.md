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

**Next Steps**:
- Implement actual Pandora playlist scraping logic in the `startMonitoring()` function
- Add DOM observation and data collection logic
- Implement data storage/export functionality