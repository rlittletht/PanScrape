/// <reference types="chrome"/>

// content.ts - handles page monitoring for Pandora pages

let isMonitoring = false;
let observer: MutationObserver | null = null;
let collectedSongs: Array<{
  songName: string;
  artistName: string;
  albumName: string;
  timestamp: string;
}> = [];

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_MONITORING_STATE") {
    sendResponse({ isMonitoring, songCount: collectedSongs.length });
    return true;
  }

  if (message.type === "START_MONITORING") {
    isMonitoring = true;
    console.log("[PanScrape] Monitoring started for this page");
    startMonitoring();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "STOP_MONITORING") {
    isMonitoring = false;
    console.log("[PanScrape] Monitoring stopped for this page");
    stopMonitoring();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "GET_COLLECTED_SONGS") {
    sendResponse({ songs: collectedSongs });
    return true;
  }

  if (message.type === "CLEAR_COLLECTED_SONGS") {
    collectedSongs = [];
    console.log("[PanScrape] Cleared collected songs");
    sendResponse({ success: true });
    return true;
  }
});

function captureSongInfo() {
  try {
    // Find the song name
    const songElement = document.querySelector('.Marquee__wrapper__content');
    const songName = songElement?.textContent?.trim() || '';

    // Find the artist and album info container
    const infoContainer = document.querySelector('.nowPlayingTopInfo__current__sourceInfo');
    
    // Find artist name
    const artistElement = infoContainer?.querySelector('.NowPlayingTopInfo__current__artistName');
    const artistName = artistElement?.textContent?.trim() || '';

    // Find album name
    const albumElement = infoContainer?.querySelector('.nowPlayingTopInfo__current__albumName');
    const albumName = albumElement?.textContent?.trim() || '';

    // Only save if we have at least a song name
    if (songName) {
      const newSong = {
        songName,
        artistName,
        albumName,
        timestamp: new Date().toISOString()
      };

      // Check if this is a duplicate of the last song (avoid duplicates from rapid DOM changes)
      const lastSong = collectedSongs[collectedSongs.length - 1];
      if (!lastSong || 
          lastSong.songName !== newSong.songName || 
          lastSong.artistName !== newSong.artistName) {
        collectedSongs.push(newSong);
        console.log('[PanScrape] Captured song:', newSong);
        console.log(`[PanScrape] Total songs collected: ${collectedSongs.length}`);
      }
    }
  } catch (error) {
    console.error('[PanScrape] Error capturing song info:', error);
  }
}

function startMonitoring() {
  console.log("[PanScrape] Monitoring is now active. Ready to scrape Pandora playlist data.");
  
  // Capture current song immediately
  captureSongInfo();

  // Find the song name div to observe
  const songElement = document.querySelector('.Marquee__wrapper__content');
  
  if (!songElement) {
    console.warn('[PanScrape] Could not find song element. Is this a Pandora page?');
    return;
  }

  // Create observer to watch for changes
  observer = new MutationObserver((mutations) => {
    if (!isMonitoring) return;
    
    // Check if the song name changed
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        captureSongInfo();
        break; // Only capture once per batch of mutations
      }
    }
  });

  // Observe the song element and its parent container for changes
  observer.observe(songElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Also observe the parent container in case the entire element is replaced
  const parentContainer = songElement.parentElement;
  if (parentContainer) {
    observer.observe(parentContainer, {
      childList: true,
      subtree: true
    });
  }

  console.log('[PanScrape] Now watching for song changes...');
}

function stopMonitoring() {
  console.log("[PanScrape] Monitoring stopped. No longer tracking playlist data.");
  
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// Initialize - monitoring is OFF by default
console.log("[PanScrape] Content script loaded. Monitoring is off by default.");
