/// <reference types="chrome"/>

// popup.ts

const monitorToggle = document.getElementById(
    "monitorToggle"
  ) as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const songCountEl = document.getElementById("songCount") as HTMLDivElement;
const exportButton = document.getElementById("exportButton") as HTMLButtonElement;
const clearButton = document.getElementById("clearButton") as HTMLButtonElement;
const successMessage = document.getElementById("successMessage") as HTMLDivElement;

let currentSongCount = 0;

function updateUI(isMonitoring: boolean, songCount: number) {
  monitorToggle.checked = isMonitoring;
  statusEl.textContent = isMonitoring
                         ? "Monitoring is ON for this page."
                         : "Monitoring is off for this page.";
  
  currentSongCount = songCount;
  songCountEl.textContent = `Songs collected: ${songCount}`;
  
  // Enable/disable buttons based on song count
  exportButton.disabled = songCount === 0;
  clearButton.disabled = songCount === 0;
}

// Query current active tab and ask it for its monitoring state
chrome.tabs.query(
  { active: true, currentWindow: true },
  (tabs) =>
  {
    const tab = tabs[0];
    if (!tab?.id)
      return;

    chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_MONITORING_STATE" },
        (response) =>
        {
          // If there is no content script (e.g., restricted page), response may be undefined
          if (chrome.runtime.lastError) {
            console.log('Error getting monitoring state:', chrome.runtime.lastError);
            updateUI(false, 0);
            return;
          }
          
          const isMonitoring = response?.isMonitoring === true;
          const songCount = response?.songCount || 0;
          updateUI(isMonitoring, songCount);
        }
      );
  });

monitorToggle.addEventListener(
  "change",
  () =>
  {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      (tabs) =>
      {
        const tab = tabs[0];
        if (!tab?.id)
          return;

        const enable = monitorToggle.checked;

        chrome.tabs.sendMessage(
          tab.id,
          {
            type: enable ? "START_MONITORING" : "STOP_MONITORING",
          },
          () => {
            if (chrome.runtime.lastError) {
              console.log('Error toggling monitoring:', chrome.runtime.lastError);
            }
          });

        statusEl.textContent = enable
                               ? "Monitoring is ON for this page."
                               : "Monitoring is off for this page.";
      });
  });

exportButton.addEventListener("click", () => {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;

      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_COLLECTED_SONGS" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.log('Error getting songs:', chrome.runtime.lastError);
            return;
          }

          const songs = response?.songs || [];
          if (songs.length === 0) {
            return;
          }

          // Format songs as text
          let textOutput = "Pandora Playlist Export\n";
          textOutput += "======================\n\n";
          
          songs.forEach((song: any, index: number) => {
            textOutput += `${index + 1}. ${song.songName}\n`;
            textOutput += `   Artist: ${song.artistName}\n`;
            textOutput += `   Album: ${song.albumName}\n`;
            textOutput += `   Captured: ${new Date(song.timestamp).toLocaleString()}\n\n`;
          });

          // Copy to clipboard
          navigator.clipboard.writeText(textOutput).then(() => {
            // Show success message
            successMessage.style.display = 'block';
            setTimeout(() => {
              successMessage.style.display = 'none';
            }, 2000);
          }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy to clipboard');
          });
        }
      );
    }
  );
});

clearButton.addEventListener("click", () => {
  if (!confirm('Are you sure you want to clear all collected songs?')) {
    return;
  }

  chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;

      chrome.tabs.sendMessage(
        tab.id,
        { type: "CLEAR_COLLECTED_SONGS" },
        () => {
          if (chrome.runtime.lastError) {
            console.log('Error clearing songs:', chrome.runtime.lastError);
            return;
          }

          // Update UI
          updateUI(monitorToggle.checked, 0);
        }
      );
    }
  );
});