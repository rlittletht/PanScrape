// popup.ts

const monitorToggle = document.getElementById(
    "monitorToggle"
  ) as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

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
          const isMonitoring = response?.isMonitoring === true;
          monitorToggle.checked = isMonitoring;
          statusEl.textContent = isMonitoring
                                 ? "Monitoring is ON for this page."
                                 : "Monitoring is off for this page.";
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
          });

        statusEl.textContent = enable
                               ? "Monitoring is ON for this page."
                               : "Monitoring is off for this page.";
      });
  });