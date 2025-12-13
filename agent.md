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