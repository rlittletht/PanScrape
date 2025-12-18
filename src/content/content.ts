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
let lastCapturedSong = '';

// Storage key for persisting songs
const STORAGE_KEY = 'panscrape_collected_songs';

// Load collected songs from storage on initialization
async function loadCollectedSongs()
{
  try
  {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (result[STORAGE_KEY] && Array.isArray(result[STORAGE_KEY]))
    {
      collectedSongs = result[STORAGE_KEY];
      if (collectedSongs.length > 0)
      {
        lastCapturedSong = collectedSongs[collectedSongs.length - 1].songName;
        console.log(`[PanScrape] Loaded ${collectedSongs.length} songs from storage`);
      }
    }
  }
  catch (error)
  {
    console.error('[PanScrape] Error loading songs from storage:', error);
  }
}

// Save collected songs to storage
async function saveCollectedSongs()
{
  try
  {
    await chrome.storage.local.set({ [STORAGE_KEY]: collectedSongs });
    console.log(`[PanScrape] Saved ${collectedSongs.length} songs to storage`);
  }
  catch (error)
  {
    console.error('[PanScrape] Error saving songs to storage:', error);
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) =>
  {
    if (message.type === "GET_MONITORING_STATE")
    {
      sendResponse({ isMonitoring, songCount: collectedSongs.length });
      return true;
    }

    if (message.type === "START_MONITORING")
    {
      isMonitoring = true;
      console.log("[PanScrape] Monitoring started for this page");
      startMonitoring();
      sendResponse({ success: true });
      return true;
    }

    if (message.type === "STOP_MONITORING")
    {
      isMonitoring = false;
      console.log("[PanScrape] Monitoring stopped for this page");
      stopMonitoring();
      sendResponse({ success: true });
      return true;
    }

    if (message.type === "GET_COLLECTED_SONGS")
    {
      sendResponse({ songs: collectedSongs });
      return true;
    }

    if (message.type === "CLEAR_COLLECTED_SONGS")
    {
      collectedSongs = [];
      lastCapturedSong = '';
      console.log("[PanScrape] Cleared collected songs");
      // Save empty array to storage
      saveCollectedSongs();
      sendResponse({ success: true });
      return true;
    }
  });

function captureSongInfo()
{
  try
  {
    // Find the song name - try Marquee__wrapper__content first, then look for child elements
    let songName = '';

    // Try the main content div
    const songElement = document.querySelector('.Marquee__wrapper__content');
    if (songElement)
    {
      songName = songElement.textContent?.trim() || '';
      console.log('[PanScrape] Found song in Marquee__wrapper__content:', songName);
    }

    // If no song name, try the child elements (take the first one)
    if (!songName)
    {
      const childElement = document.querySelector('.Marquee__wrapper__content__child');
      if (childElement)
      {
        songName = childElement.textContent?.trim() || '';
        console.log('[PanScrape] Found song in Marquee__wrapper__content__child:', songName);
      }
    }

    // Find the artist and album info container
    const infoContainer = document.querySelector('.nowPlayingTopInfo__current__sourceInfo');

    // Find artist name
    const artistElement = infoContainer?.querySelector('.NowPlayingTopInfo__current__artistName');
    const artistName = artistElement?.textContent?.trim() || '';

    // Find album name
    const albumElement = infoContainer?.querySelector('.nowPlayingTopInfo__current__albumName');
    const albumName = albumElement?.textContent?.trim() || '';

    console.log('[PanScrape] Current song data:', { songName, artistName, albumName });

    // Only save if we have at least a song name and it's different from the last one
    if (songName && songName !== lastCapturedSong)
    {
      const newSong = {
          songName,
          artistName,
          albumName,
          timestamp: new Date().toISOString()
        };

      // Check if this is a duplicate of the last song (avoid duplicates from rapid DOM changes)
      const lastSong = collectedSongs[collectedSongs.length - 1];
      if (!lastSong || lastSong.songName !== newSong.songName || lastSong.artistName !== newSong.artistName)
      {
        collectedSongs.push(newSong);
        lastCapturedSong = songName;
        console.log('[PanScrape] ✓ Captured NEW song:', newSong);
        console.log(`[PanScrape] Total songs collected: ${collectedSongs.length}`);
        
        // Save to persistent storage
        saveCollectedSongs();
      }
      else
        console.log('[PanScrape] Song already captured, skipping duplicate');
    }
    else if (songName === lastCapturedSong)
      console.log('[PanScrape] Same song as last capture, skipping');
    else
      console.log('[PanScrape] No song name found');
  }
  catch (error)
  {
    console.error('[PanScrape] Error capturing song info:', error);
  }
}

function startMonitoring()
{
  console.log("[PanScrape] Monitoring is now active. Ready to scrape Pandora playlist data.");

  // Capture current song immediately
  captureSongInfo();

  // Find the top-level NowPlaying__content container
  const nowPlayingContent = document.querySelector('.NowPlaying__content');

  if (!nowPlayingContent)
  {
    console.warn('[PanScrape] Could not find NowPlaying__content element. Is this a Pandora page?');
    // Try to find any NowPlaying-related elements for debugging
    const allNowPlayingElements = document.querySelectorAll('[class*="NowPlaying"]');
    console.log('[PanScrape] Found NowPlaying-related elements:', allNowPlayingElements.length);
    allNowPlayingElements.forEach(
      (el, idx) =>
      {
        console.log(`[PanScrape]   ${idx}: ${el.className}`);
      });

    // Also check for Marquee elements as fallback
    const allMarqueeElements = document.querySelectorAll('[class*="Marquee"]');
    console.log('[PanScrape] Found Marquee-related elements:', allMarqueeElements.length);
    allMarqueeElements.forEach(
      (el, idx) =>
      {
        console.log(`[PanScrape]   ${idx}: ${el.className}`);
      });
    return;
  }

  console.log('[PanScrape] Found NowPlaying__content element:', nowPlayingContent);

  // Create observer to watch for changes
  observer = new MutationObserver(
    (mutations) =>
    {
      if (!isMonitoring)
        return;

      console.log(`[PanScrape] MutationObserver triggered with ${mutations.length} mutations`);

      // Check if the song name changed
      let shouldCapture = false;
      for (const mutation of mutations)
      {
        console.log(`[PanScrape] Mutation type: ${mutation.type}, target: ${mutation.target.nodeName}, class: ${(mutation.target as Element).className}`);
        if (mutation.type === 'childList' || mutation.type === 'characterData')
          shouldCapture = true;
      }

      if (shouldCapture)
      {
        console.log('[PanScrape] Capturing song info due to DOM change...');
        captureSongInfo();
      }
    });

  // Observe the NowPlaying__content top-level element
  observer.observe(
    nowPlayingContent,
    {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true
    });

  console.log('[PanScrape] ✓ Now watching NowPlaying__content for song changes...');
  console.log('[PanScrape] Observer config: { childList: true, subtree: true, characterData: true }');
}

function stopMonitoring()
{
  console.log("[PanScrape] Monitoring stopped. No longer tracking playlist data.");

  if (observer)
  {
    observer.disconnect();
    observer = null;
  }
}

// Initialize - monitoring is OFF by default
console.log("[PanScrape] Content script loaded. Monitoring is off by default.");

// Load saved songs from storage
loadCollectedSongs();